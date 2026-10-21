CREATE OR REPLACE FUNCTION public.save_multiplication_practice_round_v2(p_table_number integer, p_practice_mode text, p_range_max integer, p_duration_ms integer, p_attempt_id uuid, p_expected_account_id uuid, p_expected_student_id uuid, p_facts jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
$function$

