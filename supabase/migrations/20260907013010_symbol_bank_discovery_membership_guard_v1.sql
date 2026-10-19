create or replace function public.discover_symbol_bank_symbol(
  target_student_id uuid,
  target_symbol_id text
)
returns table(
  student_id uuid,
  release_id text,
  symbol_id text,
  state text,
  first_discovered_at timestamptz,
  last_viewed_at timestamptz,
  state_changed_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_release_id text;
  v_access_tier text;
  v_has_paid_membership boolean := false;
begin
  if auth.uid() is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;

  if target_student_id is null then
    raise exception 'Student profile is required.' using errcode = '22023';
  end if;

  if nullif(btrim(target_symbol_id), '') is null then
    raise exception 'Symbol ID is required.' using errcode = '22023';
  end if;

  if not public.can_play_student(target_student_id) then
    raise exception 'You are not authorized to record activity for this student.' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.student_profiles sp
    where sp.id = target_student_id
      and sp.profile_status = 'active'
  ) then
    raise exception 'The student profile is not active.' using errcode = '22023';
  end if;

  select r.release_id
    into v_release_id
  from public.symbol_bank_content_releases r
  where r.status = 'active'
  order by r.activated_at desc nulls last, r.imported_at desc
  limit 1;

  if v_release_id is null then
    raise exception 'No active Symbol Bank release is available.' using errcode = '55000';
  end if;

  select s.access_tier
    into v_access_tier
  from public.symbol_bank_records s
  where s.release_id = v_release_id
    and s.symbol_id = btrim(target_symbol_id)
    and s.is_game_active = true
  limit 1;

  if v_access_tier is null then
    raise exception 'The symbol is not available in the active Symbol Bank release.' using errcode = '22023';
  end if;

  if v_access_tier = 'member' then
    select exists (
      select 1
      from public.student_memberships sm
      join public.membership_plans mp
        on mp.id = sm.plan_id
      where sm.student_id = target_student_id
        and sm.is_current = true
        and sm.status in ('active', 'grace')
        and sm.starts_at <= now()
        and (sm.expires_at is null or sm.expires_at > now())
        and mp.is_active = true
        and mp.is_paid = true
    )
    into v_has_paid_membership;

    if not v_has_paid_membership then
      raise exception 'Membership is required to discover this symbol.' using errcode = '42501';
    end if;
  end if;

  insert into public.symbol_bank_student_states as s (
    student_id,
    release_id,
    symbol_id,
    state,
    first_discovered_at,
    last_viewed_at,
    state_changed_at,
    created_at,
    updated_at
  ) values (
    target_student_id,
    v_release_id,
    btrim(target_symbol_id),
    'DISCOVERED',
    now(),
    now(),
    now(),
    now(),
    now()
  )
  on conflict (student_id, release_id, symbol_id)
  do update set
    last_viewed_at = now()
  returning
    s.student_id,
    s.release_id,
    s.symbol_id,
    s.state,
    s.first_discovered_at,
    s.last_viewed_at,
    s.state_changed_at,
    s.created_at,
    s.updated_at
  into
    student_id,
    release_id,
    symbol_id,
    state,
    first_discovered_at,
    last_viewed_at,
    state_changed_at,
    created_at,
    updated_at;

  return next;
end;
$$;

revoke all on function public.discover_symbol_bank_symbol(uuid, text) from public;
revoke all on function public.discover_symbol_bank_symbol(uuid, text) from anon;
grant execute on function public.discover_symbol_bank_symbol(uuid, text) to authenticated;;
