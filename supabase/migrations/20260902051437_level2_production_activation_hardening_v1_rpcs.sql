create or replace function public.get_math_language_level2_release(
  p_release_id text,
  p_question_count integer default 10,
  p_mode_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_account_id uuid := auth.uid();
  v_release public.math_language_content_releases;
  v_count integer := greatest(1, least(coalesce(p_question_count, 10), 40));
  v_questions jsonb;
begin
  if v_account_id is null then
    raise exception 'Auth session missing';
  end if;

  select * into v_release
  from public.math_language_content_releases
  where release_id = p_release_id
    and level = 2
    and release_status = 'active';

  if not found then
    raise exception 'Requested Level 2 release is not active';
  end if;

  if p_mode_id is not null and p_mode_id not in (
    'L2-M1 Which Word Fits?',
    'L2-M2 Spot the Example',
    'L2-M3 Which Does Not Belong?',
    'L2-M4 Make the Connection'
  ) then
    raise exception 'Invalid Level 2 game mode';
  end if;

  select coalesce(jsonb_agg(q_payload order by question_id), '[]'::jsonb)
  into v_questions
  from (
    select q.question_id,
      jsonb_build_object(
        'question_id', q.question_id,
        'release_id', q.release_id,
        'term_id', q.term_id,
        'mode_id', q.mode_id,
        'difficulty_id', q.difficulty_id,
        'prompt', q.prompt,
        'misconception_target', q.misconception_target,
        'representation_required', q.representation_required,
        'representation_family', q.representation_family,
        'representation_data', q.representation_data,
        'canonical_correct_option_id', q.canonical_correct_option_id,
        'shuffle_policy', q.shuffle_policy,
        'options', (
          select jsonb_agg(jsonb_build_object(
            'option_id', o.option_id,
            'question_id', o.question_id,
            'option_text', o.option_text,
            'feedback_text', o.feedback_text,
            'is_correct', o.is_correct,
            'authoring_slot', o.authoring_slot,
            'authoring_sequence', o.authoring_sequence,
            'option_role', o.option_role
          ) order by o.authoring_sequence)
          from public.math_language_options o
          where o.question_id = q.question_id and o.status='active'
        )
      ) as q_payload
    from public.math_language_questions q
    where q.release_id = p_release_id
      and q.status='active'
      and (p_mode_id is null or q.mode_id = p_mode_id)
    order by random()
    limit v_count
  ) picked;

  if jsonb_array_length(v_questions)=0 then
    raise exception 'No Level 2 questions are available for the requested mode';
  end if;

  return jsonb_build_object(
    'release', jsonb_build_object(
      'release_id',v_release.release_id,
      'level',v_release.level,
      'content_sha256',v_release.content_sha256,
      'release_status',v_release.release_status
    ),
    'mode_id',p_mode_id,
    'questions',v_questions
  );
end;
$$;

revoke all on function public.get_math_language_level2_release(text,integer,text) from public;
revoke all on function public.get_math_language_level2_release(text,integer,text) from anon;
grant execute on function public.get_math_language_level2_release(text,integer,text) to authenticated;

create or replace function public.save_math_language_level2_round(
  p_release_id text,
  p_game_mode text,
  p_duration_ms integer,
  p_attempt_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
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
  if v_account_id is null then raise exception 'Auth session missing'; end if;

  if not exists (
    select 1 from public.math_language_content_releases
    where release_id=p_release_id and level=2 and release_status='active'
  ) then raise exception 'Invalid or inactive Level 2 release'; end if;

  if p_game_mode not in (
    'L2-M1 Which Word Fits?',
    'L2-M2 Spot the Example',
    'L2-M3 Which Does Not Belong?',
    'L2-M4 Make the Connection'
  ) then raise exception 'Invalid Level 2 game mode'; end if;

  if not exists (
    select 1 from public.math_language_questions q
    where q.release_id=p_release_id and q.status='active' and q.mode_id=p_game_mode
  ) then raise exception 'Requested Level 2 mode has no active questions'; end if;

  v_mode_label := 'Level 2 — ' || regexp_replace(p_game_mode, '^L2-M[1-4][[:space:]]+', '');

  select l.student_id into v_student_id
  from public.account_student_links l
  join public.student_profiles s on s.id=l.student_id
  where l.account_id=v_account_id and l.can_play=true and s.profile_status='active'
  order by case when l.relationship_role='self' then 1 when l.relationship_role='student' then 2 else 3 end,
           l.created_at asc
  limit 1;

  if v_student_id is null then raise exception 'No playable learning profile is connected to this account'; end if;

  if jsonb_typeof(p_attempt_items) <> 'array' or jsonb_array_length(p_attempt_items)=0 then
    raise exception 'Attempt items are required';
  end if;

  v_max_score := jsonb_array_length(p_attempt_items);
  if v_max_score > 40 then raise exception 'Attempt item count exceeds Level 2 runtime limit'; end if;

  if exists (
    select 1 from jsonb_array_elements(p_attempt_items) item
    group by item->>'question_id' having count(*)>1
  ) then raise exception 'Duplicate question_id in attempt items'; end if;

  if exists (
    select 1 from jsonb_array_elements(p_attempt_items) item
    group by nullif(item->>'answer_sequence','')::integer having count(*)>1
  ) then raise exception 'Duplicate answer_sequence in attempt items'; end if;

  select count(*) into v_score
  from jsonb_array_elements(p_attempt_items) item
  where coalesce((item->>'is_correct')::boolean,false)=true;
  v_accuracy := round((v_score::numeric/v_max_score::numeric)*100,2);

  insert into public.game_results(
    student_id,account_id,game_type,game_mode,mode_label,duration_ms,
    score,max_score,correct_answers,incorrect_answers,accuracy_percent,
    submission_type,public_eligible,verification_status,anti_cheat_data,
    is_personal_best,played_at,content_release_id
  ) values (
    v_student_id,v_account_id,'math_language',p_game_mode,v_mode_label,p_duration_ms,
    v_score,v_max_score,v_score,v_max_score-v_score,v_accuracy,
    'practice',false,'verified',jsonb_build_object('runtime','level2-production-v1'),
    false,now(),p_release_id
  ) returning * into v_result;

  for v_item in select * from jsonb_array_elements(p_attempt_items)
  loop
    if coalesce(v_item->>'release_id','') <> p_release_id then raise exception 'Attempt item release mismatch'; end if;
    if nullif(v_item->>'displayed_position','') is null
       or nullif(v_item->>'shuffle_seed','') is null
       or nullif(v_item->>'answer_sequence','') is null then
      raise exception 'Attempt item shuffle/evidence fields are required';
    end if;
    if (v_item->>'answer_sequence')::integer < 1 or (v_item->>'answer_sequence')::integer > v_max_score then
      raise exception 'Invalid answer_sequence';
    end if;
    if not exists (
      select 1
      from public.math_language_questions q
      join public.math_language_options o on o.question_id=q.question_id
      where q.release_id=p_release_id
        and q.status='active'
        and q.mode_id=p_game_mode
        and q.question_id=v_item->>'question_id'
        and q.term_id=v_item->>'term_id'
        and o.status='active'
        and o.option_id=v_item->>'selected_option_id'
        and (o.option_id=q.canonical_correct_option_id)=coalesce((v_item->>'is_correct')::boolean,false)
    ) then raise exception 'Attempt item failed canonical validation'; end if;

    insert into public.math_language_attempt_items(
      game_result_id,release_id,question_id,term_id,selected_option_id,
      displayed_position,shuffle_seed,is_correct,response_ms,answer_sequence,attempt_metadata
    ) values (
      v_result.id,p_release_id,v_item->>'question_id',v_item->>'term_id',
      v_item->>'selected_option_id',v_item->>'displayed_position',v_item->>'shuffle_seed',
      (v_item->>'is_correct')::boolean,nullif(v_item->>'response_ms','')::integer,
      (v_item->>'answer_sequence')::integer,
      coalesce(v_item->'attempt_metadata','{}'::jsonb) || jsonb_build_object('runtime','level2-production-v1')
    );
  end loop;

  return jsonb_build_object(
    'game_result_id',v_result.id,
    'release_id',p_release_id,
    'game_mode',p_game_mode,
    'mode_label',v_mode_label,
    'score',v_score,
    'max_score',v_max_score,
    'accuracy_percent',v_accuracy,
    'runtime_status','active'
  );
end;
$$;

revoke all on function public.save_math_language_level2_round(text,text,integer,jsonb) from public;
revoke all on function public.save_math_language_level2_round(text,text,integer,jsonb) from anon;
grant execute on function public.save_math_language_level2_round(text,text,integer,jsonb) to authenticated;

drop function if exists public.get_math_language_level2_staged_release(text,integer,text);
drop function if exists public.save_math_language_level2_staged_round(text,text,integer,jsonb);;
