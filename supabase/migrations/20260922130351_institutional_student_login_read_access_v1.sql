begin;
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
        and sp.origin_type = 'organisation'
        and sp.profile_status = 'active'
        and oe.status = 'active'
        and oe.ended_at is null
    );
$function$;
revoke all on function private.can_manage_organisation_student_login(uuid, uuid)
from public, anon, authenticated, service_role;
grant execute on function private.can_manage_organisation_student_login(uuid, uuid)
to authenticated;
drop policy if exists "Organisation administrators can view managed student logins"
on public.student_login_accounts;
create policy "Organisation administrators can view managed student logins"
on public.student_login_accounts
for select
to authenticated
using (
  provisioning_type = 'organisation'
  and organisation_id is not null
  and private.can_manage_organisation_student_login(student_id, organisation_id)
);
commit;;
