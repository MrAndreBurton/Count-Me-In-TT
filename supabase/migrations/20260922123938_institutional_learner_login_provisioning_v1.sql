-- Institutional Learner Login Provisioning V1
begin;
do $migration_gate$
declare v_total bigint; v_non_personal bigint; v_null_parent bigint; v_null_student_account bigint; v_link_mismatch bigint;
begin
select count(*),count(*) filter(where sp.origin_type <> 'personal'),count(*) filter(where sla.parent_account_id is null),count(*) filter(where sla.student_account_id is null),count(*) filter(where sp.student_account_id is distinct from sla.student_account_id)
into v_total,v_non_personal,v_null_parent,v_null_student_account,v_link_mismatch
from public.student_login_accounts sla join public.student_profiles sp on sp.id=sla.student_id;
if v_non_personal<>0 or v_null_parent<>0 or v_null_student_account<>0 or v_link_mismatch<>0 then raise exception 'Institutional learner login V1 precondition failed: total=%, non_personal=%, null_parent=%, null_student_account=%, link_mismatch=%',v_total,v_non_personal,v_null_parent,v_null_student_account,v_link_mismatch; end if;
end $migration_gate$;
alter table public.student_login_accounts add column provisioned_by_account_id uuid, add column provisioning_type text, add column organisation_id uuid;
update public.student_login_accounts set provisioned_by_account_id=parent_account_id, provisioning_type='parent';
alter table public.student_login_accounts alter column provisioning_type set not null;
alter table public.student_login_accounts add constraint student_login_accounts_provisioning_type_check check (provisioning_type in ('parent','organisation'));
alter table public.student_login_accounts add constraint student_login_accounts_provisioned_by_account_id_fkey foreign key(provisioned_by_account_id) references public.profiles(id) on delete set null;
alter table public.student_login_accounts add constraint student_login_accounts_organisation_id_fkey foreign key(organisation_id) references public.organisations(id) on delete restrict;
alter table public.student_login_accounts add constraint student_login_accounts_provisioning_context_check check ((provisioning_type='parent' and organisation_id is null) or (provisioning_type='organisation' and organisation_id is not null));
create index student_login_accounts_provisioned_by_account_id_idx on public.student_login_accounts(provisioned_by_account_id);
create index student_login_accounts_organisation_id_idx on public.student_login_accounts(organisation_id);
alter table public.student_login_accounts alter column parent_account_id drop not null;
revoke all on table public.student_login_accounts from anon, authenticated;
grant select on table public.student_login_accounts to authenticated;
do $migration_verify$
declare v_bad_parent_rows bigint; v_bad_context_rows bigint;
begin
select count(*) into v_bad_parent_rows from public.student_login_accounts where provisioning_type<>'parent' or organisation_id is not null or provisioned_by_account_id is distinct from parent_account_id;
select count(*) into v_bad_context_rows from public.student_login_accounts where provisioning_type is null or (provisioning_type='parent' and organisation_id is not null) or (provisioning_type='organisation' and organisation_id is null);
if v_bad_parent_rows<>0 or v_bad_context_rows<>0 then raise exception 'Institutional learner login V1 postcondition failed: bad_parent_rows=%, bad_context_rows=%',v_bad_parent_rows,v_bad_context_rows; end if;
end $migration_verify$;
commit;;
