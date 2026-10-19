alter table public.student_login_accounts
  add column if not exists password_changed_at timestamptz;

update public.student_login_accounts
set password_changed_at = created_at
where password_changed_at is null;

alter table public.student_login_accounts
  alter column password_changed_at set not null;
