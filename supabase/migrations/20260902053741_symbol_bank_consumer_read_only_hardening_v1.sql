alter table public.symbol_bank_content_releases enable row level security;
alter table public.symbol_bank_records enable row level security;
alter table public.symbol_bank_confusion_groups enable row level security;

revoke all on table public.symbol_bank_content_releases from anon, authenticated;
revoke all on table public.symbol_bank_records from anon, authenticated;
revoke all on table public.symbol_bank_confusion_groups from anon, authenticated;

grant select on table public.symbol_bank_content_releases to anon, authenticated;
grant select on table public.symbol_bank_records to anon, authenticated;
grant select on table public.symbol_bank_confusion_groups to anon, authenticated;

drop policy if exists symbol_bank_content_releases_public_read on public.symbol_bank_content_releases;
create policy symbol_bank_content_releases_public_read
on public.symbol_bank_content_releases
for select
to anon, authenticated
using (status = 'active');

drop policy if exists symbol_bank_records_public_read on public.symbol_bank_records;
create policy symbol_bank_records_public_read
on public.symbol_bank_records
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.symbol_bank_content_releases r
    where r.release_id = symbol_bank_records.release_id
      and r.status = 'active'
  )
);

drop policy if exists symbol_bank_confusion_groups_public_read on public.symbol_bank_confusion_groups;
create policy symbol_bank_confusion_groups_public_read
on public.symbol_bank_confusion_groups
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.symbol_bank_content_releases r
    where r.release_id = symbol_bank_confusion_groups.release_id
      and r.status = 'active'
  )
);;
