-- Multiplication Practice Evidence v2. Apply database migration before frontend.
begin;
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
$function$;


CREATE OR REPLACE FUNCTION public.get_multiplication_practice_best(p_table_number integer, p_practice_mode text, p_range_max integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  practice_context record;
  exact_game_mode text;
  best_duration_ms integer;
  best_played_at timestamptz;
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

  select gr.duration_ms, gr.played_at
  into best_duration_ms, best_played_at
  from public.game_results gr
  where gr.student_id = practice_context.student_id
    and gr.game_type = 'multiplication_practice'
    and gr.game_mode = exact_game_mode
    and gr.verification_status = 'verified'
    and gr.duration_ms is not null
  order by gr.duration_ms asc, gr.played_at asc, gr.id asc
  limit 1;

  return jsonb_build_object(
    'gameMode', exact_game_mode,
    'bestDurationMs', best_duration_ms,
    'playedAt', best_played_at
  );
end;
$function$;


-- Fact evidence is stored with its parent result, using the existing read policies.
-- No new learner-facing controls, reporting grants or organisation attribution.
create unique index practice_evidence_attempt_owner_uidx
on public.game_results (account_id, (game_metadata #>> '{practiceEvidence,attemptId}'))
where game_type = 'multiplication_practice'
  and game_metadata #>> '{practiceEvidence,attemptId}' is not null;

create or replace function public.save_multiplication_practice_round_v2(
  p_table_number integer,
  p_practice_mode text,
  p_range_max integer,
  p_duration_ms integer,
  p_attempt_id uuid,
  p_expected_account_id uuid,
  p_expected_student_id uuid,
  p_facts jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  ctx record;
  item jsonb;
  factor_number integer;
  item_position integer;
  wrong_count integer;
  total_wrong integer := 0;
  missed_count integer := 0;
  seen_factors integer[] := '{}';
  seen_positions integer[] := '{}';
  canonical_facts jsonb := '[]'::jsonb;
  evidence jsonb;
  existing public.game_results%rowtype;
  receipt jsonb;
  saved_id uuid;
begin
  if (select auth.uid()) is null then
    raise exception using errcode = '28000', message = 'SIGN_IN_REQUIRED';
  end if;
  if p_expected_account_id is null or p_expected_student_id is null
     or p_expected_account_id <> (select auth.uid()) then
    raise exception using errcode = '42501', message = 'PRACTICE_IDENTITY_CHANGED';
  end if;
  select * into ctx from private.current_multiplication_practice_context();
  if ctx.student_id is distinct from p_expected_student_id then
    raise exception using errcode = '42501', message = 'PRACTICE_IDENTITY_CHANGED';
  end if;

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
  if p_attempt_id is null then
    raise exception using errcode = '22023', message = 'INVALID_ATTEMPT_ID';
  end if;

  if jsonb_typeof(p_facts) is distinct from 'array' then
    raise exception using errcode = '22023', message = 'INVALID_PRACTICE_EVIDENCE';
  end if;
  if jsonb_array_length(p_facts) <> p_range_max or octet_length(p_facts::text) > 16000 then
    raise exception using errcode = '22023', message = 'INVALID_PRACTICE_EVIDENCE';
  end if;

  for item in select value from jsonb_array_elements(p_facts) loop
    if jsonb_typeof(item) is distinct from 'object' then
      raise exception using errcode = '22023', message = 'INVALID_FACT_EVIDENCE';
    end if;
    -- Require actual JSON integers/booleans. Never accept null, strings or fractions.
    if jsonb_typeof(item->'factor') is distinct from 'number'
       or jsonb_typeof(item->'position') is distinct from 'number'
       or jsonb_typeof(item->'incorrectSubmissions') is distinct from 'number'
       or (item->>'factor') !~ '^[0-9]{1,2}$'
       or (item->>'position') !~ '^[0-9]{1,2}$'
       or (item->>'incorrectSubmissions') !~ '^[0-9]{1,4}$'
       or jsonb_typeof(item->'firstTryCorrect') is distinct from 'boolean'
       or item->'eventuallyCorrect' is distinct from 'true'::jsonb
       or (item - array['factor','position','firstTryCorrect','incorrectSubmissions','eventuallyCorrect']) <> '{}'::jsonb then
      raise exception using errcode = '22023', message = 'INVALID_FACT_EVIDENCE';
    end if;
    factor_number := (item->>'factor')::integer;
    item_position := (item->>'position')::integer;
    wrong_count := (item->>'incorrectSubmissions')::integer;
    if factor_number not between 1 and p_range_max
       or item_position not between 1 and p_range_max
       or factor_number = any(seen_factors)
       or item_position = any(seen_positions)
       or wrong_count > 1000
       or (item->>'firstTryCorrect')::boolean <> (wrong_count = 0)
       or (p_practice_mode = 'build' and factor_number <> item_position) then
      raise exception using errcode = '22023', message = 'INVALID_FACT_EVIDENCE';
    end if;
    seen_factors := array_append(seen_factors, factor_number);
    seen_positions := array_append(seen_positions, item_position);
    total_wrong := total_wrong + wrong_count;
    if wrong_count > 0 then missed_count := missed_count + 1; end if;
    canonical_facts := canonical_facts || jsonb_build_array(jsonb_build_object(
      'tableNumber', p_table_number,
      'factor', factor_number,
      'expectedAnswer', p_table_number * factor_number,
      'position', item_position,
      'firstTryCorrect', wrong_count = 0,
      'incorrectSubmissions', wrong_count,
      'submissions', wrong_count + 1,
      'eventuallyCorrect', true
    ));
  end loop;
  if total_wrong > 1000 then
    raise exception using errcode = '22023', message = 'INVALID_INCORRECT_ATTEMPTS';
  end if;
  select jsonb_agg(value order by (value->>'position')::integer)
  into canonical_facts from jsonb_array_elements(canonical_facts);
  evidence := jsonb_build_object(
    'version', 2,
    'attemptId', p_attempt_id,
    'answerBoundary', 'explicit_check',
    'countingRule', 'one_submission_per_nonempty_edit_revision',
    'support', case when p_practice_mode = 'build' then 'visible_fact_prompt_ordered' else 'visible_fact_prompt_shuffled' end,
    'source', 'client_reported_server_validated',
    'facts', canonical_facts
  );

  -- Per-account attempt lock, then the existing per-profile/config PB lock.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(
    p_expected_account_id::text || ':practice-v2:' || p_attempt_id::text, 0
  ));
  select * into existing from public.game_results
  where account_id = p_expected_account_id
    and game_type = 'multiplication_practice'
    and game_metadata #>> '{practiceEvidence,attemptId}' = p_attempt_id::text;
  if found then
    if existing.student_id is distinct from p_expected_student_id
       or existing.duration_ms is distinct from p_duration_ms
       or existing.game_mode is distinct from format('table_%s_%s_%s', p_table_number, p_practice_mode, p_range_max)
       or existing.game_metadata->'practiceEvidence' is distinct from evidence then
      raise exception using errcode = '22023', message = 'PRACTICE_ATTEMPT_CONFLICT';
    end if;
    return existing.game_metadata->'practiceSaveReceipt';
  end if;

  -- Reuse the established membership, result and PB pipeline. Both writes form
  -- one transaction: any failure rolls back the result and PB replacement.
  receipt := public.save_multiplication_practice_round(
    p_table_number, p_practice_mode, p_range_max, p_duration_ms, total_wrong, missed_count
  );
  saved_id := (receipt->>'resultId')::uuid;
  update public.game_results
  set game_metadata = game_metadata || jsonb_build_object(
    'practiceEvidence', evidence,
    'practiceSaveReceipt', receipt,
    'accuracyMeaning', 'first_submitted_response_per_fact'
  )
  where id = saved_id and account_id = p_expected_account_id and student_id = p_expected_student_id;
  if not found then
    raise exception using errcode = '42501', message = 'PRACTICE_IDENTITY_CHANGED';
  end if;
  return receipt;
end;
$$;
revoke all on function public.save_multiplication_practice_round_v2(integer,text,integer,integer,uuid,uuid,uuid,jsonb) from public, anon;
grant execute on function public.save_multiplication_practice_round_v2(integer,text,integer,integer,uuid,uuid,uuid,jsonb) to authenticated;

commit;
