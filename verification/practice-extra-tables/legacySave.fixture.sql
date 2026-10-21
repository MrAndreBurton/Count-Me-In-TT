CREATE OR REPLACE FUNCTION public.save_multiplication_practice_round(p_table_number integer, p_practice_mode text, p_range_max integer, p_duration_ms integer, p_incorrect_attempts integer, p_facts_missed_first_try integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  practice_context record;
  exact_game_mode text;
  exact_mode_label text;
  previous_best_duration_ms integer;
  saved_result_id uuid;
  is_new_personal_best boolean;
  first_try_correct integer;
  first_try_accuracy numeric;
begin
  if p_table_number is null or p_table_number not between 1 and 12 then
    raise exception using errcode = '22023', message = 'INVALID_TABLE_NUMBER';
  end if;

  if p_practice_mode is null or p_practice_mode not in ('build', 'mix') then
    raise exception using errcode = '22023', message = 'INVALID_PRACTICE_MODE';
  end if;

  if p_range_max is null or p_range_max not in (12, 15) then
    raise exception using errcode = '22023', message = 'INVALID_RANGE_MAX';
  end if;

  if p_duration_ms is null or p_duration_ms <= 0 or p_duration_ms > 3600000 then
    raise exception using errcode = '22023', message = 'INVALID_DURATION';
  end if;

  if p_incorrect_attempts is null
     or p_incorrect_attempts < 0
     or p_incorrect_attempts > 1000 then
    raise exception using errcode = '22023', message = 'INVALID_INCORRECT_ATTEMPTS';
  end if;

  if p_facts_missed_first_try is null
     or p_facts_missed_first_try < 0
     or p_facts_missed_first_try > p_range_max
     or p_facts_missed_first_try > p_incorrect_attempts then
    raise exception using errcode = '22023', message = 'INVALID_MISSED_FACT_COUNT';
  end if;

  select *
  into practice_context
  from private.current_multiplication_practice_context();

  if p_table_number is null or p_table_number not in (1, 2, 5, 10)
     and not practice_context.has_member_access then
    raise exception using errcode = '42501', message = 'MEMBERSHIP_REQUIRED';
  end if;

  exact_game_mode := format(
    'table_%s_%s_%s',
    p_table_number,
    p_practice_mode,
    p_range_max
  );

  exact_mode_label := format(
    '×%s · %s · Up to %s',
    p_table_number,
    case
      when p_practice_mode = 'build' then 'Build the Table'
      else 'Mix It Up'
    end,
    p_range_max
  );

  -- Serialize best-time decisions for one profile and exact configuration.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      practice_context.student_id::text || ':' || exact_game_mode,
      0
    )
  );

  select min(gr.duration_ms)
  into previous_best_duration_ms
  from public.game_results gr
  where gr.student_id = practice_context.student_id
    and gr.game_type = 'multiplication_practice'
    and gr.game_mode = exact_game_mode
    and gr.verification_status = 'verified'
    and gr.duration_ms is not null;

  is_new_personal_best :=
    previous_best_duration_ms is null
    or p_duration_ms < previous_best_duration_ms;

  if is_new_personal_best then
    update public.game_results gr
    set is_personal_best = false,
        updated_at = now()
    where gr.student_id = practice_context.student_id
      and gr.game_type = 'multiplication_practice'
      and gr.game_mode = exact_game_mode
      and gr.is_personal_best = true;
  end if;

  first_try_correct := p_range_max - p_facts_missed_first_try;
  first_try_accuracy := round(
    (first_try_correct::numeric / p_range_max::numeric) * 100,
    2
  );

  insert into public.game_results (
    student_id,
    account_id,
    game_type,
    game_mode,
    mode_label,
    duration_ms,
    score,
    max_score,
    correct_answers,
    incorrect_answers,
    accuracy_percent,
    submission_type,
    challenge_key,
    event_name,
    public_eligible,
    verification_status,
    anti_cheat_data,
    rejection_reason,
    is_personal_best,
    played_at,
    game_metadata
  )
  values (
    practice_context.student_id,
    (select auth.uid()),
    'multiplication_practice',
    exact_game_mode,
    exact_mode_label,
    p_duration_ms,
    null,
    p_range_max,
    first_try_correct,
    p_facts_missed_first_try,
    first_try_accuracy,
    'practice',
    null,
    null,
    false,
    'verified',
    jsonb_build_object(
      'savedFrom', 'multiplication-practice-rpc',
      'incorrectAttempts', p_incorrect_attempts,
      'factsMissedFirstTry', p_facts_missed_first_try,
      'rulesVersion', 1
    ),
    null,
    is_new_personal_best,
    now(),
    jsonb_build_object(
      'tableNumber', p_table_number,
      'practiceMode', p_practice_mode,
      'rangeMax', p_range_max,
      'factCount', p_range_max,
      'firstTryAccuracy', first_try_accuracy
    )
  )
  returning id into saved_result_id;

  return jsonb_build_object(
    'saved', true,
    'resultId', saved_result_id,
    'profile', jsonb_build_object(
      'id', practice_context.student_id,
      'displayName', practice_context.display_name
    ),
    'gameMode', exact_game_mode,
    'durationMs', p_duration_ms,
    'previousBestDurationMs', previous_best_duration_ms,
    'bestDurationMs', least(
      p_duration_ms,
      coalesce(previous_best_duration_ms, p_duration_ms)
    ),
    'isPersonalBest', is_new_personal_best
  );
end;
$function$

