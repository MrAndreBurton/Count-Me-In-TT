-- ============================================================================
-- Organisation Staff Roster Read V2.1
--
-- Provides an authoritative, organisation-scoped staff roster read model
-- without broadening access to public.profiles.
--
-- Full roster access is limited to:
--   1. active platform administrators; or
--   2. active organisation administrators for the requested organisation.
--
-- No email, platform role, account type, authentication data, or other
-- profile information is exposed by this function.
-- ============================================================================

create or replace function public.get_organisation_staff_roster_v1(
  p_organisation_id uuid
)
returns table (
  staff_id uuid,
  organisation_id uuid,
  profile_id uuid,
  full_name text,
  account_status text,
  staff_position text,
  staff_status text,
  joined_at timestamptz,
  ended_at timestamptz,
  roles text[]
)
language plpgsql
stable
security definer
set search_path to ''
as $function$
begin
  -- -------------------------------------------------------------------------
  -- 1. Validate organisation
  -- -------------------------------------------------------------------------

  if not exists (
    select 1
    from public.organisations o
    where o.id = p_organisation_id
      and o.status = 'active'
  ) then
    raise exception 'ORGANISATION_NOT_ACTIVE';
  end if;


  -- -------------------------------------------------------------------------
  -- 2. Authorize organisation-wide staff roster access
  -- -------------------------------------------------------------------------

  if not (
    public.is_active_admin()
    or private.is_organisation_admin(
      p_organisation_id
    )
  ) then
    raise exception 'ORGANISATION_STAFF_ROSTER_FORBIDDEN';
  end if;


  -- -------------------------------------------------------------------------
  -- 3. Return authoritative organisation staff roster
  -- -------------------------------------------------------------------------

  return query
  select
    os.id as staff_id,
    os.organisation_id,
    os.profile_id,
    coalesce(
      p.full_name,
      'Unnamed staff member'
    ) as full_name,
    p.account_status,
    os.position as staff_position,
    os.status as staff_status,
    os.joined_at,
    os.ended_at,
    coalesce(
      (
        select array_agg(
          osr.role
          order by osr.role
        )
        from public.organisation_staff_roles osr
        where osr.staff_id = os.id
      ),
      array[]::text[]
    ) as roles
  from public.organisation_staff os
  join public.profiles p
    on p.id = os.profile_id
  where os.organisation_id =
    p_organisation_id
  order by
    p.full_name,
    os.joined_at,
    os.id;
end;
$function$;


-- ============================================================================
-- Execution boundary
-- ============================================================================

revoke all
on function public.get_organisation_staff_roster_v1(uuid)
from public;

revoke all
on function public.get_organisation_staff_roster_v1(uuid)
from anon;

grant execute
on function public.get_organisation_staff_roster_v1(uuid)
to authenticated;
