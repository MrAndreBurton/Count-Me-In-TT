create or replace function public.sync_student_last_login()
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  auth_last_sign_in timestamptz;
  synced_last_login timestamptz;
begin
  if caller_id is null then
    raise exception 'Authentication required';
  end if;

  select u.last_sign_in_at
    into auth_last_sign_in
  from auth.users as u
  where u.id = caller_id;

  if auth_last_sign_in is null then
    return null;
  end if;

  update public.student_login_accounts as sla
  set last_login_at = greatest(
        coalesce(
          sla.last_login_at,
          '-infinity'::timestamptz
        ),
        auth_last_sign_in
      )
  where sla.student_account_id = caller_id
    and sla.login_status = 'active'
  returning sla.last_login_at
    into synced_last_login;

  return synced_last_login;
end;
$$;

revoke all
on function public.sync_student_last_login()
from public;

revoke all
on function public.sync_student_last_login()
from anon;

grant execute
on function public.sync_student_last_login()
to authenticated;

update public.student_login_accounts as sla
set last_login_at = u.last_sign_in_at
from auth.users as u
where u.id = sla.student_account_id
  and u.last_sign_in_at is not null
  and (
    sla.last_login_at is null
    or sla.last_login_at < u.last_sign_in_at
  );
