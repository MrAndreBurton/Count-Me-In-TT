-- CountMeInTT
-- Migration 1 — Organisation Foundation V3 Release Candidate
-- STATUS: RELEASE CANDIDATE ONLY — NOT YET APPLIED

-- ============================================================
-- 1. ORGANISATION FOUNDATION TABLES
-- ============================================================

create table public.organisations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  organisation_type text not null
    check (organisation_type in ('school', 'tutoring_service')),
  school_catalogue_id text,
  status text not null default 'active'
    check (status in ('active', 'inactive', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organisations_school_catalogue_context_check check (
    (organisation_type = 'school' and school_catalogue_id is not null)
    or
    (organisation_type <> 'school' and school_catalogue_id is null)
  )
);

create unique index organisations_school_catalogue_id_unique
  on public.organisations (school_catalogue_id)
  where school_catalogue_id is not null;

create index organisations_type_idx
  on public.organisations (organisation_type);

create index organisations_status_idx
  on public.organisations (status);


create table public.organisation_staff (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null
    references public.organisations(id) on delete cascade,
  profile_id uuid not null
    references public.profiles(id) on delete cascade,
  status text not null default 'active'
    check (status in ('active', 'inactive', 'ended')),
  joined_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint organisation_staff_lifecycle_check check (
    (status = 'ended' and ended_at is not null and ended_at >= joined_at)
    or
    (status in ('active', 'inactive') and ended_at is null)
  ),

  constraint organisation_staff_org_profile_unique
    unique (organisation_id, profile_id),

  constraint organisation_staff_id_org_unique
    unique (id, organisation_id)
);

create index organisation_staff_profile_org_status_idx
  on public.organisation_staff (profile_id, organisation_id, status);


create table public.organisation_staff_roles (
  staff_id uuid not null
    references public.organisation_staff(id) on delete cascade,
  role text not null
    check (role in ('organisation_admin', 'teacher', 'tutor')),
  created_at timestamptz not null default now(),
  primary key (staff_id, role)
);


create table public.organisation_enrolments (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null
    references public.organisations(id) on delete cascade,
  student_id uuid not null
    references public.student_profiles(id) on delete cascade,
  status text not null default 'active'
    check (status in ('active', 'inactive', 'ended')),
  joined_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint organisation_enrolments_lifecycle_check check (
    (status = 'ended' and ended_at is not null and ended_at >= joined_at)
    or
    (status in ('active', 'inactive') and ended_at is null)
  ),

  constraint organisation_enrolments_org_student_unique
    unique (organisation_id, student_id),

  constraint organisation_enrolments_id_org_unique
    unique (id, organisation_id)
);

create index organisation_enrolments_student_idx
  on public.organisation_enrolments (student_id);


create table public.organisation_groups (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null
    references public.organisations(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  level_key text,
  academic_year text,
  status text not null default 'active'
    check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint organisation_groups_id_org_unique
    unique (id, organisation_id)
);

create index organisation_groups_organisation_idx
  on public.organisation_groups (organisation_id);

create index organisation_groups_level_idx
  on public.organisation_groups (level_key);


create table public.organisation_group_staff (
  group_id uuid not null,
  organisation_id uuid not null,
  staff_id uuid not null,
  assigned_at timestamptz not null default now(),
  ended_at timestamptz,

  primary key (group_id, staff_id),

  constraint organisation_group_staff_group_fkey
    foreign key (group_id, organisation_id)
    references public.organisation_groups(id, organisation_id)
    on delete cascade,

  constraint organisation_group_staff_staff_fkey
    foreign key (staff_id, organisation_id)
    references public.organisation_staff(id, organisation_id)
    on delete cascade,

  constraint organisation_group_staff_dates_check
    check (ended_at is null or ended_at >= assigned_at)
);

create index organisation_group_staff_staff_active_idx
  on public.organisation_group_staff (staff_id, group_id)
  where ended_at is null;


create table public.organisation_group_students (
  group_id uuid not null,
  organisation_id uuid not null,
  enrolment_id uuid not null,
  joined_at timestamptz not null default now(),
  ended_at timestamptz,

  primary key (group_id, enrolment_id),

  constraint organisation_group_students_group_fkey
    foreign key (group_id, organisation_id)
    references public.organisation_groups(id, organisation_id)
    on delete cascade,

  constraint organisation_group_students_enrolment_fkey
    foreign key (enrolment_id, organisation_id)
    references public.organisation_enrolments(id, organisation_id)
    on delete cascade,

  constraint organisation_group_students_dates_check
    check (ended_at is null or ended_at >= joined_at)
);

create index organisation_group_students_enrolment_active_idx
  on public.organisation_group_students (enrolment_id, group_id)
  where ended_at is null;


create table public.organisation_licences (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null
    references public.organisations(id) on delete cascade,
  licence_type text not null check (length(trim(licence_type)) > 0),
  status text not null default 'active'
    check (status in ('active', 'expired', 'suspended', 'cancelled')),
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  student_limit integer,
  staff_limit integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint organisation_licences_dates_check
    check (expires_at is null or expires_at >= starts_at),

  constraint organisation_licences_student_limit_check
    check (student_limit is null or student_limit >= 0),

  constraint organisation_licences_staff_limit_check
    check (staff_limit is null or staff_limit >= 0),

  constraint organisation_licences_metadata_object_check
    check (jsonb_typeof(metadata) = 'object')
);

create index organisation_licences_organisation_idx
  on public.organisation_licences (organisation_id);

create index organisation_licences_status_idx
  on public.organisation_licences (status);


-- ============================================================
-- 2. UPDATED_AT TRIGGERS
-- Uses existing public.set_updated_at().
-- ============================================================

create trigger organisations_set_updated_at
before update on public.organisations
for each row execute function public.set_updated_at();

create trigger organisation_staff_set_updated_at
before update on public.organisation_staff
for each row execute function public.set_updated_at();

create trigger organisation_enrolments_set_updated_at
before update on public.organisation_enrolments
for each row execute function public.set_updated_at();

create trigger organisation_groups_set_updated_at
before update on public.organisation_groups
for each row execute function public.set_updated_at();

create trigger organisation_licences_set_updated_at
before update on public.organisation_licences
for each row execute function public.set_updated_at();


-- ============================================================
-- 3. RLS ENABLEMENT
-- ============================================================

alter table public.organisations enable row level security;
alter table public.organisation_staff enable row level security;
alter table public.organisation_staff_roles enable row level security;
alter table public.organisation_enrolments enable row level security;
alter table public.organisation_groups enable row level security;
alter table public.organisation_group_staff enable row level security;
alter table public.organisation_group_students enable row level security;
alter table public.organisation_licences enable row level security;


-- ============================================================
-- 4. PRIVATE AUTHORIZATION HELPERS
-- SECURITY DEFINER; boolean only; auth.uid()-bound.
-- private schema is not an exposed API schema.
-- ============================================================

create or replace function private.is_organisation_staff(
  target_organisation_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organisation_staff os
    where os.organisation_id = target_organisation_id
      and os.profile_id = (select auth.uid())
      and os.status = 'active'
      and os.ended_at is null
  );
$$;

create or replace function private.is_organisation_admin(
  target_organisation_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organisation_staff os
    join public.organisation_staff_roles osr
      on osr.staff_id = os.id
    where os.organisation_id = target_organisation_id
      and os.profile_id = (select auth.uid())
      and os.status = 'active'
      and os.ended_at is null
      and osr.role = 'organisation_admin'
  );
$$;

create or replace function private.is_assigned_group_staff(
  target_group_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organisation_group_staff ogs
    join public.organisation_staff os
      on os.id = ogs.staff_id
     and os.organisation_id = ogs.organisation_id
    join public.organisation_groups og
      on og.id = ogs.group_id
     and og.organisation_id = ogs.organisation_id
    where ogs.group_id = target_group_id
      and os.profile_id = (select auth.uid())
      and os.status = 'active'
      and os.ended_at is null
      and ogs.ended_at is null
      and og.status = 'active'
  );
$$;

-- Function execution is deliberately narrow.
revoke all on function private.is_organisation_staff(uuid)
  from public, anon, authenticated;
revoke all on function private.is_organisation_admin(uuid)
  from public, anon, authenticated;
revoke all on function private.is_assigned_group_staff(uuid)
  from public, anon, authenticated;

-- authenticated requires schema USAGE + function EXECUTE for RLS invocation.
-- Existing private functions retain their own EXECUTE restrictions.
grant usage on schema private to authenticated;

grant execute on function private.is_organisation_staff(uuid)
  to authenticated;
grant execute on function private.is_organisation_admin(uuid)
  to authenticated;
grant execute on function private.is_assigned_group_staff(uuid)
  to authenticated;


-- ============================================================
-- 5. EXPLICIT TABLE PRIVILEGE BASELINE
-- No anonymous access. No broad authenticated UPDATE.
-- ============================================================

revoke all on table
  public.organisations,
  public.organisation_staff,
  public.organisation_staff_roles,
  public.organisation_enrolments,
  public.organisation_groups,
  public.organisation_group_staff,
  public.organisation_group_students,
  public.organisation_licences
from anon, authenticated;

-- Base read/create permissions; RLS determines row authorization.
grant select, insert on table
  public.organisations,
  public.organisation_staff,
  public.organisation_enrolments,
  public.organisation_groups,
  public.organisation_group_staff,
  public.organisation_group_students,
  public.organisation_licences
  to authenticated;

grant select, insert, delete on table
  public.organisation_staff_roles
  to authenticated;

-- Column-scoped mutation. Identity-bearing relationship columns are immutable
-- through the ordinary authenticated application path.
grant update (name, organisation_type, school_catalogue_id, status)
  on public.organisations to authenticated;

grant update (status, ended_at)
  on public.organisation_staff to authenticated;

grant update (status, ended_at)
  on public.organisation_enrolments to authenticated;

grant update (name, level_key, academic_year, status)
  on public.organisation_groups to authenticated;

grant update (ended_at)
  on public.organisation_group_staff to authenticated;

grant update (ended_at)
  on public.organisation_group_students to authenticated;

grant update (
  licence_type,
  status,
  expires_at,
  student_limit,
  staff_limit,
  metadata
)
  on public.organisation_licences to authenticated;


-- ============================================================
-- 6. RLS POLICIES
-- Site Admin = existing public.is_active_admin().
-- ============================================================

-- organisations ------------------------------------------------
create policy organisations_select
on public.organisations
for select
to authenticated
using (
  (select public.is_active_admin())
  or (select private.is_organisation_staff(id))
);

create policy organisations_insert
on public.organisations
for insert
to authenticated
with check (
  (select public.is_active_admin())
);

create policy organisations_update
on public.organisations
for update
to authenticated
using (
  (select public.is_active_admin())
)
with check (
  (select public.is_active_admin())
);


-- organisation_staff ------------------------------------------
create policy organisation_staff_select
on public.organisation_staff
for select
to authenticated
using (
  (select public.is_active_admin())
  or (select private.is_organisation_admin(organisation_id))
  or profile_id = (select auth.uid())
);

create policy organisation_staff_insert
on public.organisation_staff
for insert
to authenticated
with check (
  (select public.is_active_admin())
  or (select private.is_organisation_admin(organisation_id))
);

create policy organisation_staff_update
on public.organisation_staff
for update
to authenticated
using (
  (select public.is_active_admin())
  or (select private.is_organisation_admin(organisation_id))
)
with check (
  (select public.is_active_admin())
  or (select private.is_organisation_admin(organisation_id))
);


-- organisation_staff_roles ------------------------------------
create policy organisation_staff_roles_select
on public.organisation_staff_roles
for select
to authenticated
using (
  (select public.is_active_admin())
  or exists (
    select 1
    from public.organisation_staff os
    where os.id = staff_id
      and (
        os.profile_id = (select auth.uid())
        or (select private.is_organisation_admin(os.organisation_id))
      )
  )
);

create policy organisation_staff_roles_insert
on public.organisation_staff_roles
for insert
to authenticated
with check (
  (select public.is_active_admin())
  or (
    role in ('teacher', 'tutor')
    and exists (
      select 1
      from public.organisation_staff os
      where os.id = staff_id
        and (select private.is_organisation_admin(os.organisation_id))
    )
  )
);

create policy organisation_staff_roles_delete
on public.organisation_staff_roles
for delete
to authenticated
using (
  (select public.is_active_admin())
  or (
    role in ('teacher', 'tutor')
    and exists (
      select 1
      from public.organisation_staff os
      where os.id = staff_id
        and (select private.is_organisation_admin(os.organisation_id))
    )
  )
);


-- organisation_enrolments -------------------------------------
create policy organisation_enrolments_select
on public.organisation_enrolments
for select
to authenticated
using (
  (select public.is_active_admin())
  or (select private.is_organisation_admin(organisation_id))
  or exists (
    select 1
    from public.organisation_group_students ogs
    where ogs.enrolment_id = id
      and ogs.organisation_id = organisation_id
      and ogs.ended_at is null
      and (select private.is_assigned_group_staff(ogs.group_id))
  )
);

create policy organisation_enrolments_insert
on public.organisation_enrolments
for insert
to authenticated
with check (
  (select public.is_active_admin())
  or (select private.is_organisation_admin(organisation_id))
);

create policy organisation_enrolments_update
on public.organisation_enrolments
for update
to authenticated
using (
  (select public.is_active_admin())
  or (select private.is_organisation_admin(organisation_id))
)
with check (
  (select public.is_active_admin())
  or (select private.is_organisation_admin(organisation_id))
);


-- organisation_groups -----------------------------------------
create policy organisation_groups_select
on public.organisation_groups
for select
to authenticated
using (
  (select public.is_active_admin())
  or (select private.is_organisation_admin(organisation_id))
  or (select private.is_assigned_group_staff(id))
);

create policy organisation_groups_insert
on public.organisation_groups
for insert
to authenticated
with check (
  (select public.is_active_admin())
  or (select private.is_organisation_admin(organisation_id))
);

create policy organisation_groups_update
on public.organisation_groups
for update
to authenticated
using (
  (select public.is_active_admin())
  or (select private.is_organisation_admin(organisation_id))
)
with check (
  (select public.is_active_admin())
  or (select private.is_organisation_admin(organisation_id))
);


-- organisation_group_staff ------------------------------------
create policy organisation_group_staff_select
on public.organisation_group_staff
for select
to authenticated
using (
  (select public.is_active_admin())
  or (select private.is_organisation_admin(organisation_id))
  or exists (
    select 1
    from public.organisation_staff os
    where os.id = staff_id
      and os.profile_id = (select auth.uid())
  )
);

create policy organisation_group_staff_insert
on public.organisation_group_staff
for insert
to authenticated
with check (
  (select public.is_active_admin())
  or (select private.is_organisation_admin(organisation_id))
);

create policy organisation_group_staff_update
on public.organisation_group_staff
for update
to authenticated
using (
  (select public.is_active_admin())
  or (select private.is_organisation_admin(organisation_id))
)
with check (
  (select public.is_active_admin())
  or (select private.is_organisation_admin(organisation_id))
);


-- organisation_group_students ---------------------------------
create policy organisation_group_students_select
on public.organisation_group_students
for select
to authenticated
using (
  (select public.is_active_admin())
  or (select private.is_organisation_admin(organisation_id))
  or (select private.is_assigned_group_staff(group_id))
);

create policy organisation_group_students_insert
on public.organisation_group_students
for insert
to authenticated
with check (
  (select public.is_active_admin())
  or (select private.is_organisation_admin(organisation_id))
);

create policy organisation_group_students_update
on public.organisation_group_students
for update
to authenticated
using (
  (select public.is_active_admin())
  or (select private.is_organisation_admin(organisation_id))
)
with check (
  (select public.is_active_admin())
  or (select private.is_organisation_admin(organisation_id))
);


-- organisation_licences ---------------------------------------
create policy organisation_licences_select
on public.organisation_licences
for select
to authenticated
using (
  (select public.is_active_admin())
  or (select private.is_organisation_admin(organisation_id))
);

create policy organisation_licences_insert
on public.organisation_licences
for insert
to authenticated
with check (
  (select public.is_active_admin())
);

create policy organisation_licences_update
on public.organisation_licences
for update
to authenticated
using (
  (select public.is_active_admin())
)
with check (
  (select public.is_active_admin())
);

-- No DELETE policy/grant exists for organisation foundation rows except
-- organisation_staff_roles. Lifecycle rows are ended/inactivated/archived.
