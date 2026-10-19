-- CountMeInTT multiplication practice: access, saving, and personal bests.
-- Target: CountMeInTT Development first.

-- Give the membership plans an explicit entitlement for all practice tables.
update public.membership_plans
set entitlements = jsonb_set(
  coalesce(entitlements, '{}'::jsonb),
  '{multiplication_practice_all_tables}',
  case
    when is_paid then 'true'::jsonb
    else 'false'::jsonb
  end,
  true
)
where entitlements -> 'multiplication_practice_all_tables' is null;

-- Practice results remain in the shared results history.
alter table public.game_results
  drop constraint game_results_game_type_check;

alter table public.game_results
  add constraint game_results_game_type_check
  check (
    game_type = any (
      array[
        'multiplication'::text,
        'multiplication_practice'::text,
        'math_language'::text,
        'symbol_challenge'::text,
        'fractions'::text,
        'decimals'::text,
        'algebra'::text,
        'word_problems'::text,
        'other'::text
      ]
    )
  );

create schema if not exists private;
revoke all on schema private from public;

create or replace function private.current_multiplication_practice_context()
returns table (
  student_id uuid,
  display_name text,
  has_member_access boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  playable_profile_count integer;
begin
  if (select auth.uid()) is null then
    raise exception using
      errcode = '28000',
      message = 'SIGN_IN_REQUIRED';
  end if;

  select count(*)::integer
  into playable_profile_count
  from public.account_student_links asl
  join public.student_profiles sp
    on sp.id = asl.student_id
  join public.profiles account_profile
    on account_profile.id = asl.account_id
  where asl.account_id = (select auth.uid())
    and asl.can_play = true
    and sp.profile_status = 'active'
    and account_profile.account_status = 'active';

  if playable_profile_count = 0 then
    raise exception using
      errcode = 'P0001',
      message = 'PLAYABLE_PROFILE_REQUIRED';
  end if;

  if playable_profile_count > 1 then
    raise exception using
      errcode = 'P0001',
      message = 'MULTIPLE_PLAYABLE_PROFILES';
  end if;

  return query
  select
    sp.id,
    coalesce(
      nullif(btrim(sp.public_display_name), ''),
      nullif(btrim(sp.first_name), ''),
      'Player'
    ) as display_name,
    exists (
      select 1
      from public.student_memberships sm
      join public.membership_plans mp
        on mp.id = sm.plan_id
      where sm.student_id = sp.id
        and sm.status = 'active'
        and sm.is_current = true
        and sm.starts_at <= now()
        and (sm.expires_at is null or sm.expires_at > now())
        and mp.is_active = true
        and mp.entitlements @> '{"multiplication_practice_all_tables": true}'::jsonb
    ) as has_member_access
  from public.account_student_links asl
  join public.student_profiles sp
    on sp.id = asl.student_id
  where asl.account_id = (select auth.uid())
    and asl.can_play = true
    and sp.profile_status = 'active';
end;
$$;

revoke all on function private.current_multiplication_practice_context()
  from public;

create or replace function public.get_multiplication_practice_access()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  practice_context record;
begin
  select *
  into practice_context
  from private.current_multiplication_practice_context();

  return jsonb_build_object(
    'authenticated', true,
    'profile', jsonb_build_object(
      'id', practice_context.student_id,
      'displayName', practice_context.display_name
    ),
    'hasMemberAccess', practice_context.has_member_access,
    'freeTables', jsonb_build_array(1, 2, 5, 10)
  );
end;
$$;

revoke all on function public.get_multiplication_practice_access()
  from public, anon;
grant execute on function public.get_multiplication_practice_access()
  to authenticated;

create or replace function public.get_multiplication_practice_best(
  p_table_number integer,
  p_practice_mode text,
  p_range_max integer
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  practice_context record;
  exact_game_mode text;
  best_duration_ms integer;
  best_played_at timestamptz;
begin
  if p_table_number not between 1 and 12 then
    raise exception using errcode = '22023', message = 'INVALID_TABLE_NUMBER';
  end if;

  if p_practice_mode not in ('build', 'mix') then
    raise exception using errcode = '22023', message = 'INVALID_PRACTICE_MODE';
  end if;

  if p_range_max not in (12, 15) then
    raise exception using errcode = '22023', message = 'INVALID_RANGE_MAX';
  end if;

  select *
  into practice_context
  from private.current_multiplication_practice_context();

  if p_table_number not in (1, 2, 5, 10)
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
$$;

revoke all on function public.get_multiplication_practice_best(integer, text, integer)
  from public, anon;
grant execute on function public.get_multiplication_practice_best(integer, text, integer)
  to authenticated;

create or replace function public.save_multiplication_practice_round(
  p_table_number integer,
  p_practice_mode text,
  p_range_max integer,
  p_duration_ms integer,
  p_incorrect_attempts integer,
  p_facts_missed_first_try integer
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
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
  if p_table_number not between 1 and 12 then
    raise exception using errcode = '22023', message = 'INVALID_TABLE_NUMBER';
  end if;

  if p_practice_mode not in ('build', 'mix') then
    raise exception using errcode = '22023', message = 'INVALID_PRACTICE_MODE';
  end if;

  if p_range_max not in (12, 15) then
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
     or p_facts_missed_first_try > p_range_max then
    raise exception using errcode = '22023', message = 'INVALID_MISSED_FACT_COUNT';
  end if;

  select *
  into practice_context
  from private.current_multiplication_practice_context();

  if p_table_number not in (1, 2, 5, 10)
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
$$;

revoke all on function public.save_multiplication_practice_round(integer, text, integer, integer, integer, integer)
  from public, anon;
grant execute on function public.save_multiplication_practice_round(integer, text, integer, integer, integer, integer)
  to authenticated;

-- Browser inserts may continue for existing games, but practice results must
-- pass through the validated save function above.
drop policy if exists "Multiplication practice results require protected save"
  on public.game_results;

create policy "Multiplication practice results require protected save"
on public.game_results
as restrictive
for insert
to authenticated
with check (game_type <> 'multiplication_practice');

drop policy if exists "Multiplication practice results cannot be changed directly"
  on public.game_results;

create policy "Multiplication practice results cannot be changed directly"
on public.game_results
as restrictive
for update
to authenticated
using (game_type <> 'multiplication_practice')
with check (game_type <> 'multiplication_practice');
