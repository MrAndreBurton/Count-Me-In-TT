-- CountMeInTT — Migration 2 V1 RC
-- Organisation Evidence Context
-- RELEASE CANDIDATE ONLY. Do not db push until the rollback gate passes.

-- 1. Provenance columns. Existing rows become personal by construction.
alter table public.game_results
  add column context_type text not null default 'personal',
  add column organisation_id uuid,
  add column group_id uuid;

-- 2. Closed vocabulary + valid state machine.
alter table public.game_results
  add constraint game_results_context_type_check
    check (context_type in ('personal', 'organisation')),
  add constraint game_results_context_shape_check
    check (
      (context_type = 'personal' and organisation_id is null and group_id is null)
      or
      (context_type = 'organisation' and organisation_id is not null)
    ),
  add constraint game_results_organisation_id_fkey
    foreign key (organisation_id)
    references public.organisations(id)
    on delete restrict,
  add constraint game_results_group_organisation_fkey
    foreign key (group_id, organisation_id)
    references public.organisation_groups(id, organisation_id)
    on delete restrict;

-- 3. Access-path / FK indexes.
create index game_results_organisation_played_at_idx
  on public.game_results (organisation_id, played_at desc)
  where context_type = 'organisation';

create index game_results_group_organisation_played_at_idx
  on public.game_results (group_id, organisation_id, played_at desc)
  where context_type = 'organisation' and group_id is not null;

-- 4. Institutional evidence authorization.
-- This function answers only whether the current authenticated account may
-- establish the requested organisation provenance for the target learner.
-- It does not validate game score, verification, timing, or game-specific evidence.
create or replace function private.can_create_organisation_evidence(
  target_student_id uuid,
  target_organisation_id uuid,
  target_group_id uuid default null
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select
    (select public.can_play_student(target_student_id))
    and exists (
      select 1
      from public.organisations o
      join public.organisation_enrolments oe
        on oe.organisation_id = o.id
      where o.id = target_organisation_id
        and o.status = 'active'
        and oe.student_id = target_student_id
        and oe.status = 'active'
        and oe.ended_at is null
        and (
          target_group_id is null
          or exists (
            select 1
            from public.organisation_group_students ogs
            join public.organisation_groups og
              on og.id = ogs.group_id
             and og.organisation_id = ogs.organisation_id
            where ogs.enrolment_id = oe.id
              and ogs.organisation_id = target_organisation_id
              and ogs.group_id = target_group_id
              and ogs.ended_at is null
              and og.status = 'active'
          )
        )
    );
$function$;

revoke all on function private.can_create_organisation_evidence(uuid, uuid, uuid) from public;
revoke all on function private.can_create_organisation_evidence(uuid, uuid, uuid) from anon;
revoke all on function private.can_create_organisation_evidence(uuid, uuid, uuid) from authenticated;
-- No direct client EXECUTE grant. Existing/future protected SECURITY DEFINER writers
-- owned by the database role may call this private authorization primitive.

-- 5. Direct browser writes remain personal-only.
-- Replace the existing permissive INSERT policy with the frozen M2 contract.
drop policy if exists "Playable accounts can create their own results" on public.game_results;
create policy "Playable accounts can create personal results"
on public.game_results
as permissive
for insert
to authenticated
with check (
  account_id = (select auth.uid())
  and public.can_play_student(student_id)
  and context_type = 'personal'
  and organisation_id is null
  and group_id is null
);

-- Keep the existing restrictive multiplication-practice INSERT policy unchanged.
-- Institutional provenance therefore cannot be established through direct REST INSERT.

-- 6. Read authorities are independent and additive.
-- Existing learner/linked-account SELECT policy remains unchanged.
create policy "Site admins can view all game results"
on public.game_results
as permissive
for select
to authenticated
using ((select public.is_active_admin()));

create policy "Organisation admins can view organisation game results"
on public.game_results
as permissive
for select
to authenticated
using (
  context_type = 'organisation'
  and organisation_id is not null
  and private.is_organisation_admin(organisation_id)
);

create policy "Assigned group staff can view group game results"
on public.game_results
as permissive
for select
to authenticated
using (
  context_type = 'organisation'
  and group_id is not null
  and private.is_assigned_group_staff(group_id)
);

-- 7. game_results are evidence, not ordinary client-editable records.
-- Current source audit found no production direct UPDATE/DELETE caller.
drop policy if exists "Playable accounts can update their pending results" on public.game_results;
drop policy if exists "Multiplication practice results cannot be changed directly" on public.game_results;
drop policy if exists "Playable accounts can delete their pending results" on public.game_results;

revoke update, delete on table public.game_results from anon;
revoke update, delete on table public.game_results from authenticated;

-- No licence FK, assignment FK, staff FK, or teacher ownership is introduced.
-- Existing protected SECURITY DEFINER result writers remain intact. To create
-- organisation-context evidence, a protected writer must explicitly call
-- private.can_create_organisation_evidence(...) before inserting provenance.