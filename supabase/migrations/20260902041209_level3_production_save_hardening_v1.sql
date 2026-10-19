create or replace function public.save_math_language_level3_round(
  p_release_id text,
  p_game_mode text,
  p_duration_ms integer,
  p_attempt_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_account_id uuid := auth.uid();
  v_student_id uuid;
  v_result public.game_results;
  v_score integer;
  v_max_score integer;
  v_accuracy numeric;
  v_item jsonb;
  v_mode_label text;
begin
  if v_account_id is null then
    raise exception 'Auth session missing';
  end if;

  if not exists (
    select 1 from public.math_language_content_releases
    where release_id = p_release_id
      and level = 3
      and release_status = 'active'
  ) then
    raise exception 'Invalid or inactive Level 3 release';
  end if;

  if not exists (
    select 1 from public.math_language_questions q
    where q.release_id = p_release_id
      and q.status = 'active'
      and q.mode_id = p_game_mode
  ) then
    raise exception 'Invalid Level 3 game mode';
  end if;

  v_mode_label := 'Level 3 — ' || regexp_replace(p_game_mode, '^L3-M[1-6][[:space:]]+', '');

  select l.student_id into v_student_id
  from public.account_student_links l
  join public.student_profiles s on s.id = l.student_id
  where l.account_id = v_account_id
    and l.can_play = true
    and s.profile_status = 'active'
  order by case when l.relationship_role = 'self' then 1 when l.relationship_role = 'student' then 2 else 3 end,
           l.created_at asc
  limit 1;

  if v_student_id is null then
    raise exception 'No playable learning profile is connected to this account';
  end if;

  if jsonb_typeof(p_attempt_items) <> 'array' or jsonb_array_length(p_attempt_items) = 0 then
    raise exception 'Attempt items are required';
  end if;

  v_max_score := jsonb_array_length(p_attempt_items);
  select count(*) into v_score
  from jsonb_array_elements(p_attempt_items) item
  where coalesce((item->>'is_correct')::boolean, false) = true;
  v_accuracy := round((v_score::numeric / v_max_score::numeric) * 100, 2);

  insert into public.game_results (
    student_id, account_id, game_type, game_mode, mode_label,
    duration_ms, score, max_score, correct_answers, incorrect_answers,
    accuracy_percent, submission_type, public_eligible, verification_status,
    anti_cheat_data, is_personal_best, played_at, content_release_id
  ) values (
    v_student_id, v_account_id, 'math_language', p_game_mode,
    v_mode_label, p_duration_ms, v_score, v_max_score,
    v_score, v_max_score - v_score, v_accuracy,
    'practice', false, 'verified', '{}'::jsonb, false, now(), p_release_id
  ) returning * into v_result;

  for v_item in select * from jsonb_array_elements(p_attempt_items)
  loop
    if coalesce(v_item->>'release_id','') <> p_release_id then
      raise exception 'Attempt item release mismatch';
    end if;

    if not exists (
      select 1
      from public.math_language_questions q
      join public.math_language_options o on o.question_id = q.question_id
      where q.release_id = p_release_id
        and q.status = 'active'
        and q.mode_id = p_game_mode
        and q.question_id = v_item->>'question_id'
        and q.term_id = v_item->>'term_id'
        and o.status = 'active'
        and o.option_id = v_item->>'selected_option_id'
        and o.question_id = q.question_id
        and (o.option_id = q.canonical_correct_option_id) = coalesce((v_item->>'is_correct')::boolean, false)
    ) then
      raise exception 'Attempt item failed canonical validation';
    end if;

    insert into public.math_language_attempt_items (
      game_result_id, release_id, question_id, term_id,
      selected_option_id, displayed_position, shuffle_seed, is_correct,
      response_ms, answer_sequence, attempt_metadata
    ) values (
      v_result.id,
      p_release_id,
      v_item->>'question_id',
      v_item->>'term_id',
      v_item->>'selected_option_id',
      v_item->>'displayed_position',
      v_item->>'shuffle_seed',
      (v_item->>'is_correct')::boolean,
      nullif(v_item->>'response_ms','')::integer,
      (v_item->>'answer_sequence')::integer,
      coalesce(v_item->'attempt_metadata','{}'::jsonb)
    );
  end loop;

  return jsonb_build_object(
    'game_result_id', v_result.id,
    'release_id', p_release_id,
    'game_mode', p_game_mode,
    'mode_label', v_mode_label,
    'score', v_score,
    'max_score', v_max_score,
    'accuracy_percent', v_accuracy
  );
end;
$function$;

revoke all on function public.save_math_language_level3_round(text, text, integer, jsonb) from public;
revoke all on function public.save_math_language_level3_round(text, text, integer, jsonb) from anon;
grant execute on function public.save_math_language_level3_round(text, text, integer, jsonb) to authenticated;;
