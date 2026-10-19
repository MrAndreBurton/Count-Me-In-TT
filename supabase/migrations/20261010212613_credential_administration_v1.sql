-- ============================================================
-- Credential Administration V1
--
-- Governing rules:
--   * Enrolment establishes organisation–learner context.
--   * Credential provenance establishes credential ownership.
--   * Platform role establishes platform administrative authority.
--   * Learner origin does not determine credential eligibility.
-- ============================================================


-- ============================================================
-- 1. CORRECT ORGANISATION STUDENT LOGIN MANAGEMENT AUTHORITY
-- ============================================================

create or replace function private.can_manage_organisation_student_login(
  target_student_id uuid,
  target_organisation_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select
    target_student_id is not null
    and target_organisation_id is not null

    and exists (
      select 1
      from public.profiles caller
      where caller.id = (select auth.uid())
        and caller.account_status = 'active'
        and (
          caller.admin_role in ('super_admin', 'admin')
          or private.is_organisation_admin(target_organisation_id)
        )
    )

    and exists (
      select 1
      from public.organisations o
      where o.id = target_organisation_id
        and o.status = 'active'
    )

    and exists (
      select 1
      from public.student_profiles sp
      join public.organisation_enrolments oe
        on oe.student_id = sp.id
       and oe.organisation_id = target_organisation_id
      where sp.id = target_student_id
        and sp.profile_status = 'active'
        and oe.status = 'active'
        and oe.ended_at is null
    );
$function$;


-- ============================================================
-- 2. DISCOVER ORGANISATION STUDENT CREDENTIAL STATE
--
-- Returns exactly one of:
--
--   NONE
--   CURRENT_ORGANISATION_MANAGED
--   EXTERNAL
--
-- EXTERNAL deliberately collapses parent-managed and
-- other-organisation-managed credentials into one state.
-- ============================================================

create or replace function public.discover_organisation_student_credential_state(
  target_organisation_id uuid,
  target_student_id uuid
)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  caller_id uuid := auth.uid();
  credential_provisioning_type text;
  credential_organisation_id uuid;
begin

  if caller_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if not private.can_manage_organisation_student_login(
    target_student_id,
    target_organisation_id
  ) then
    raise exception 'CREDENTIAL_ADMIN_REQUIRED';
  end if;

  select
    sla.provisioning_type,
    sla.organisation_id
  into
    credential_provisioning_type,
    credential_organisation_id
  from public.student_login_accounts sla
  where sla.student_id = target_student_id;

  if not found then
    return 'NONE';
  end if;

  if credential_provisioning_type = 'organisation'
     and credential_organisation_id = target_organisation_id then
    return 'CURRENT_ORGANISATION_MANAGED';
  end if;

  return 'EXTERNAL';

end;
$function$;


-- ============================================================
-- 3. RPC EXECUTION PERMISSIONS
-- ============================================================

revoke all
on function public.discover_organisation_student_credential_state(uuid, uuid)
from public;

revoke all
on function public.discover_organisation_student_credential_state(uuid, uuid)
from anon;

grant execute
on function public.discover_organisation_student_credential_state(uuid, uuid)
to authenticated;


-- ============================================================
-- 4. EXISTING student_login_accounts RLS REMAINS UNCHANGED
--
-- This RPC provides state discovery only. It does not expose
-- externally managed credential records.
-- ============================================================
