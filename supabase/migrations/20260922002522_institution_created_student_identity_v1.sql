-- ============================================================
-- CountMeInTT
-- Migration 3: Institution-Created Student Identity V1
--
-- Purpose:
--   Evolve student_profiles into a durable learner identity
--   independent of institutional membership and login access.
--
-- Core rules:
--   personal      -> account_id IS NOT NULL
--   organisation  -> account_id IS NULL
--
--   origin_type is immutable.
--   archive is reversible.
--   hard DELETE is Site-Admin-only.
--   organisation-created learners are created through a
--   protected atomic institutional onboarding operation.
-- ============================================================


-- ============================================================
-- 0. PRECONDITION GUARDS
-- ============================================================

do $$
declare
  v_student_count bigint;
  v_null_account_count bigint;
  v_invalid_status_count bigint;
begin
  if to_regclass('public.student_profiles') is null then
    raise exception
      'Migration 3 precondition failed: public.student_profiles does not exist.';
  end if;

  if to_regclass('public.organisations') is null
     or to_regclass('public.organisation_enrolments') is null
     or to_regclass('public.organisation_groups') is null
     or to_regclass('public.organisation_group_students') is null
     or to_regclass('public.organisation_licences') is null then
    raise exception
      'Migration 3 precondition failed: Organisation Foundation tables are incomplete.';
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'student_profiles'
      and column_name = 'account_id'
      and is_nullable = 'NO'
  ) then
    raise exception
      'Migration 3 precondition failed: student_profiles.account_id is not in the expected pre-M3 state.';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'student_profiles'
      and column_name = 'origin_type'
  ) then
    raise exception
      'Migration 3 precondition failed: student_profiles.origin_type already exists.';
  end if;

  select count(*)
  into v_student_count
  from public.student_profiles;

  select count(*)
  into v_null_account_count
  from public.student_profiles
  where account_id is null;

  if v_null_account_count <> 0 then
    raise exception
      'Migration 3 precondition failed: % existing student profiles have NULL account_id.',
      v_null_account_count;
  end if;

  select count(*)
  into v_invalid_status_count
  from public.student_profiles
  where profile_status not in ('active', 'deactivated', 'deleted');

  if v_invalid_status_count <> 0 then
    raise exception
      'Migration 3 precondition failed: unexpected profile_status values exist.';
  end if;

  raise notice
    'Migration 3 preconditions passed for % existing student profiles.',
    v_student_count;
end;
$$;


-- ============================================================
-- 1. ADD IMMUTABLE CREATION PROVENANCE
-- ============================================================

alter table public.student_profiles
  add column origin_type text;

-- Every learner that existed before M3 came through the
-- existing account-based identity model.
update public.student_profiles
set origin_type = 'personal'
where origin_type is null;

alter table public.student_profiles
  alter column origin_type set default 'personal',
  alter column origin_type set not null;

alter table public.student_profiles
  add constraint student_profiles_origin_type_check
  check (
    origin_type in ('personal', 'organisation')
  );


-- ============================================================
-- 2. ACCOUNT OWNERSHIP BECOMES CONDITIONAL
-- ============================================================

alter table public.student_profiles
  alter column account_id drop not null;

alter table public.student_profiles
  add constraint student_profiles_origin_account_shape_check
  check (
    (
      origin_type = 'personal'
      and account_id is not null
    )
    or
    (
      origin_type = 'organisation'
      and account_id is null
    )
  );


comment on column public.student_profiles.origin_type is
'Immutable creation provenance for the durable learner identity. personal = created through the personal/account model; organisation = created through protected institutional onboarding.';

comment on column public.student_profiles.account_id is
'Creation-account anchor for personal-origin learner identities. Must be NULL for organisation-origin identities. Personal relationships after creation are represented by account_student_links.';


-- ============================================================
-- 3. EXPAND STUDENT LIFECYCLE WITH ARCHIVE
-- ============================================================

alter table public.student_profiles
  drop constraint student_profiles_profile_status_check;

alter table public.student_profiles
  add constraint student_profiles_profile_status_check
  check (
    profile_status in (
      'active',
      'archived',
      'deactivated',
      'deleted'
    )
  );

comment on column public.student_profiles.profile_status is
'Learner lifecycle state. active = operational; archived = reversible retention-first removal; deactivated = deliberately disabled; deleted = legacy soft state retained for compatibility.';


-- ============================================================
-- 4. PROTECT IMMUTABLE CREATION PROVENANCE
-- ============================================================

create or replace function private.enforce_student_identity_provenance()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.origin_type is distinct from old.origin_type then
    raise exception
      'Student creation provenance cannot be changed.';
  end if;

  -- Personal identities remain account-anchored in V1.
  -- Organisation identities remain ownerless in account_id.
  if new.account_id is distinct from old.account_id then
    raise exception
      'Student identity creation ownership cannot be changed.';
  end if;

  return new;
end;
$$;

revoke all on function private.enforce_student_identity_provenance()
from public;

drop trigger if exists
  student_profiles_provenance_immutable
on public.student_profiles;

create trigger student_profiles_provenance_immutable
before update of origin_type, account_id
on public.student_profiles
for each row
execute function private.enforce_student_identity_provenance();


-- ============================================================
-- 5. MAKE PARENT CHILD LIMIT ORIGIN-AWARE
-- ============================================================

create or replace function public.enforce_parent_child_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner_account_type text;
  existing_child_count integer;
begin

  -- Organisation-created learners are not parent-owned child
  -- profiles. Parent relationships may be established later
  -- through account_student_links.
  if new.origin_type = 'organisation' then
    return new;
  end if;

  if new.profile_type <> 'child'
     or new.profile_status <> 'active' then
    return new;
  end if;

  select p.account_type
  into owner_account_type
  from public.profiles p
  where p.id = new.account_id;

  if owner_account_type is distinct from 'parent' then
    raise exception
      'Only parent or guardian accounts can add child profiles.';
  end if;

  select count(*)
  into existing_child_count
  from public.student_profiles sp
  where sp.account_id = new.account_id
    and sp.origin_type = 'personal'
    and sp.profile_type = 'child'
    and sp.profile_status = 'active'
    and (
      tg_op = 'INSERT'
      or sp.id <> new.id
    );

  if existing_child_count >= 5 then
    raise exception
      'This parent account has reached the limit of five child profiles.';
  end if;

  return new;
end;
$$;


-- ============================================================
-- 6. MAKE AUTOMATIC ACCOUNT LINKING ORIGIN-AWARE
-- ============================================================

create or replace function public.link_new_learning_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin

  -- Institutional creation establishes no personal account
  -- relationship. Parent/student relationships may be linked
  -- later through a separately verified workflow.
  if new.origin_type = 'organisation' then
    return new;
  end if;

  if new.profile_type = 'child' then

    insert into public.account_student_links (
      account_id,
      student_id,
      relationship_role,
      can_view,
      can_edit,
      can_manage_membership,
      can_play
    )
    values (
      new.account_id,
      new.id,
      'parent',
      true,
      true,
      true,
      false
    )
    on conflict (account_id, student_id) do nothing;

  elsif new.profile_type = 'account_holder' then

    insert into public.account_student_links (
      account_id,
      student_id,
      relationship_role,
      can_view,
      can_edit,
      can_manage_membership,
      can_play
    )
    values (
      new.account_id,
      new.id,
      'self',
      true,
      true,
      false,
      true
    )
    on conflict (account_id, student_id) do nothing;

  elsif new.profile_type = 'independent_student' then

    insert into public.account_student_links (
      account_id,
      student_id,
      relationship_role,
      can_view,
      can_edit,
      can_manage_membership,
      can_play
    )
    values (
      new.account_id,
      new.id,
      'student',
      true,
      false,
      false,
      true
    )
    on conflict (account_id, student_id) do nothing;

  end if;

  return new;
end;
$$;


-- ============================================================
-- 7. FREE MEMBERSHIP CREATION
-- ============================================================
--
-- created_by_account_id is already nullable.
--
-- Personal learner:
--   created_by_account_id = account_id
--
-- Organisation learner:
--   created_by_account_id = NULL
--
-- No fabricated account ownership is introduced.
-- ============================================================

create or replace function public.assign_free_membership_to_new_student()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  free_plan_id uuid;
begin
  select id
  into free_plan_id
  from public.membership_plans
  where plan_key = 'free'
    and is_active = true
  limit 1;

  if free_plan_id is null then
    raise exception
      'The free membership plan does not exist.';
  end if;

  if not exists (
    select 1
    from public.student_memberships sm
    where sm.student_id = new.id
      and sm.is_current = true
  ) then
    insert into public.student_memberships (
      student_id,
      plan_id,
      status,
      starts_at,
      expires_at,
      is_current,
      auto_renew,
      source,
      created_by_account_id,
      metadata
    )
    values (
      new.id,
      free_plan_id,
      'active',
      now(),
      null,
      true,
      false,
      'system',
      case
        when new.origin_type = 'personal'
          then new.account_id
        else null
      end,
      jsonb_build_object(
        'assigned_automatically',
        true
      )
    );
  end if;

  return new;
end;
$$;


-- ============================================================
-- 8. MAKE EXISTING PERSONAL CREATION EXPLICIT
-- ============================================================

create or replace function public.create_child_profile(
  child_first_name text,
  child_last_name text,
  child_public_display_name text,
  child_avatar_key text,
  child_school_type text,
  child_school_name text,
  child_school_level text,
  child_academic_year text,
  child_school_visible boolean
)
returns public.student_profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid;
  current_account_type text;
  current_child_count integer;
  new_student public.student_profiles;
begin
  current_user_id := auth.uid();

  if current_user_id is null then
    raise exception
      'You must be logged in to create a child profile.';
  end if;

  select p.account_type
  into current_account_type
  from public.profiles p
  where p.id = current_user_id;

  if current_account_type is distinct from 'parent' then
    raise exception
      'Only parent or guardian accounts can add child profiles.';
  end if;

  select count(*)
  into current_child_count
  from public.account_student_links asl
  where asl.account_id = current_user_id
    and asl.relationship_role = 'parent';

  if current_child_count >= 5 then
    raise exception
      'This parent account has reached the limit of five child profiles.';
  end if;

  insert into public.student_profiles (
    account_id,
    origin_type,
    first_name,
    last_name,
    public_display_name,
    avatar_key,
    school_type,
    current_school,
    current_level,
    academic_year,
    school_visible,
    profile_status,
    profile_type
  )
  values (
    current_user_id,
    'personal',
    trim(child_first_name),
    trim(child_last_name),
    trim(child_public_display_name),
    coalesce(nullif(trim(child_avatar_key), ''), 'initials'),
    child_school_type,
    trim(child_school_name),
    child_school_level,
    child_academic_year,
    coalesce(child_school_visible, false),
    'active',
    'child'
  )
  returning *
  into new_student;

  insert into public.student_school_history (
    student_id,
    account_id,
    academic_year,
    school_type,
    school_name,
    school_level,
    is_current
  )
  values (
    new_student.id,
    current_user_id,
    child_academic_year,
    child_school_type,
    trim(child_school_name),
    child_school_level,
    true
  );

  return new_student;
end;
$$;


create or replace function public.create_account_learning_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  clean_name text;
  first_part text;
  last_part text;
  generated_display_name text;
  generated_profile_type text;
begin
  clean_name := trim(new.full_name);

  if clean_name = '' then
    clean_name := 'CountMeInTT User';
  end if;

  first_part := split_part(clean_name, ' ', 1);

  if clean_name like '% %' then
    last_part := regexp_replace(
      clean_name,
      '^.*\s+',
      ''
    );
  else
    last_part := '';
  end if;

  generated_display_name :=
    case
      when last_part <> ''
        then first_part || ' ' ||
             upper(left(last_part, 1)) || '.'
      else first_part
    end;

  generated_profile_type :=
    case
      when new.account_type = 'student'
        then 'independent_student'
      else 'account_holder'
    end;

  insert into public.student_profiles (
    account_id,
    origin_type,
    first_name,
    last_name,
    public_display_name,
    avatar_key,
    school_type,
    current_school,
    current_level,
    academic_year,
    school_visible,
    profile_status,
    profile_type
  )
  values (
    new.id,
    'personal',
    first_part,
    last_part,
    generated_display_name,
    'initials',
    null,
    null,
    null,
    null,
    false,
    'active',
    generated_profile_type
  )
  on conflict do nothing;

  return new;
end;
$$;


-- ============================================================
-- 9. PROTECTED ATOMIC INSTITUTIONAL ONBOARDING
-- ============================================================
--
-- This is intentionally private in V1.
--
-- It is NOT a browser-facing RPC.
-- It establishes:
--
--   learner identity
--       +
--   organisation enrolment
--       +
--   optional real cohort membership
--
-- in one database transaction.
--
-- Site Admin authorization is checked independently.
-- Organisation and licence must currently be active.
-- If a group is supplied, it must be active and belong to the
-- same organisation.
--
-- No account_student_links row is created.
-- No student login is created.
-- No student_school_history row is fabricated.
-- ============================================================

create or replace function private.create_organisation_student(
  p_organisation_id uuid,
  p_first_name text,
  p_last_name text,
  p_public_display_name text,
  p_school_type text default null,
  p_current_school text default null,
  p_current_level text default null,
  p_academic_year text default null,
  p_school_visible boolean default false,
  p_group_id uuid default null,
  p_avatar_key text default 'initials'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_student_id uuid;
  v_enrolment_id uuid;
  v_student_limit integer;
  v_active_student_count bigint;
begin

  -- --------------------------------------------------------
  -- Actor authorization
  -- --------------------------------------------------------

  if auth.uid() is null then
    raise exception
      'Authentication is required.';
  end if;

  if not public.is_active_admin() then
    raise exception
      'Only an active Site Admin may create an organisation student.';
  end if;


  -- --------------------------------------------------------
  -- Basic learner validation
  -- --------------------------------------------------------

  if nullif(trim(p_first_name), '') is null then
    raise exception
      'Student first name is required.';
  end if;

  if nullif(trim(p_last_name), '') is null then
    raise exception
      'Student last name is required.';
  end if;

  if nullif(trim(p_public_display_name), '') is null then
    raise exception
      'Student public display name is required.';
  end if;


  -- --------------------------------------------------------
  -- Organisation validation
  -- --------------------------------------------------------

  if not exists (
    select 1
    from public.organisations o
    where o.id = p_organisation_id
      and o.status = 'active'
  ) then
    raise exception
      'The organisation does not exist or is not active.';
  end if;


  -- --------------------------------------------------------
  -- Current institutional entitlement
  -- --------------------------------------------------------

  select ol.student_limit
  into v_student_limit
  from public.organisation_licences ol
  where ol.organisation_id = p_organisation_id
    and ol.status = 'active'
    and ol.starts_at <= now()
    and (
      ol.expires_at is null
      or ol.expires_at >= now()
    )
  order by ol.starts_at desc
  limit 1;

  if not found then
    raise exception
      'The organisation does not have an active licence.';
  end if;

  if v_student_limit is not null then
    select count(*)
    into v_active_student_count
    from public.organisation_enrolments oe
    where oe.organisation_id = p_organisation_id
      and oe.status = 'active';

    if v_active_student_count >= v_student_limit then
      raise exception
        'The organisation has reached its student licence limit.';
    end if;
  end if;


  -- --------------------------------------------------------
  -- Optional cohort validation
  -- --------------------------------------------------------

  if p_group_id is not null
     and not exists (
       select 1
       from public.organisation_groups og
       where og.id = p_group_id
         and og.organisation_id = p_organisation_id
         and og.status = 'active'
     ) then
    raise exception
      'The requested group does not exist, is inactive, or belongs to another organisation.';
  end if;


  -- --------------------------------------------------------
  -- Create durable learner identity
  -- --------------------------------------------------------

  insert into public.student_profiles (
    account_id,
    origin_type,
    first_name,
    last_name,
    public_display_name,
    avatar_key,
    school_type,
    current_school,
    current_level,
    academic_year,
    school_visible,
    profile_status,
    profile_type,
    login_enabled
  )
  values (
    null,
    'organisation',
    trim(p_first_name),
    trim(p_last_name),
    trim(p_public_display_name),
    coalesce(
      nullif(trim(p_avatar_key), ''),
      'initials'
    ),
    p_school_type,
    nullif(trim(p_current_school), ''),
    p_current_level,
    p_academic_year,
    coalesce(p_school_visible, false),
    'active',

    -- V1 retains the existing learner profile vocabulary.
    -- The origin_type field distinguishes this learner from
    -- a parent-owned personal child profile.
    'child',

    false
  )
  returning id
  into v_student_id;


  -- --------------------------------------------------------
  -- Establish institutional relationship
  -- --------------------------------------------------------

  insert into public.organisation_enrolments (
    organisation_id,
    student_id,
    status,
    joined_at
  )
  values (
    p_organisation_id,
    v_student_id,
    'active',
    now()
  )
  returning id
  into v_enrolment_id;


  -- --------------------------------------------------------
  -- Establish real cohort participation when supplied
  -- --------------------------------------------------------

  if p_group_id is not null then
    insert into public.organisation_group_students (
      group_id,
      organisation_id,
      enrolment_id,
      joined_at,
      ended_at
    )
    values (
      p_group_id,
      p_organisation_id,
      v_enrolment_id,
      now(),
      null
    );
  end if;


  -- --------------------------------------------------------
  -- Function call is one PostgreSQL statement/transaction.
  -- Any exception above or below aborts the entire operation.
  -- --------------------------------------------------------

  return v_student_id;
end;
$$;


comment on function private.create_organisation_student(
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  boolean,
  uuid,
  text
) is
'Protected atomic institutional learner onboarding. Creates one organisation-origin durable learner identity, one active organisation enrolment, and optionally one active same-organisation group membership. V1 is Site-Admin-only and not exposed as a browser RPC.';


-- No public execution path in V1.
revoke all
on function private.create_organisation_student(
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  boolean,
  uuid,
  text
)
from public;

revoke all
on function private.create_organisation_student(
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  boolean,
  uuid,
  text
)
from anon;

revoke all
on function private.create_organisation_student(
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  boolean,
  uuid,
  text
)
from authenticated;


-- ============================================================
-- 10. HARD DELETE BECOMES SITE-ADMIN-ONLY
-- ============================================================

drop policy if exists
  "Linked managers can delete student profiles"
on public.student_profiles;

drop policy if exists
  "Site admins can permanently delete student profiles"
on public.student_profiles;

create policy
  "Site admins can permanently delete student profiles"
on public.student_profiles
for delete
to authenticated
using (
  (select public.is_active_admin())
);


-- ============================================================
-- 11. DEFENSIVE DIRECT-INSERT RULE
-- ============================================================
--
-- Existing browser policies may create PERSONAL identities.
-- They must never establish organisation provenance.
--
-- Site Admin direct INSERT also remains personal-only.
-- Organisation identities must pass through the protected
-- atomic creator above.
-- ============================================================

drop policy if exists
  "Parents can create child profiles"
on public.student_profiles;

create policy
  "Parents can create child profiles"
on public.student_profiles
for insert
to authenticated
with check (
  origin_type = 'personal'
  and account_id = (select auth.uid())
  and profile_type = 'child'
  and exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.account_type = 'parent'
  )
);


drop policy if exists
  "Active admins can create student profiles"
on public.student_profiles;

create policy
  "Active admins can create personal student profiles"
on public.student_profiles
for insert
to authenticated
with check (
  (select public.is_active_admin())
  and origin_type = 'personal'
  and account_id is not null
);


-- ============================================================
-- 12. POST-MIGRATION ASSERTIONS
-- ============================================================

do $$
declare
  v_invalid_origin_count bigint;
  v_invalid_shape_count bigint;
  v_existing_nonpersonal_count bigint;
begin

  select count(*)
  into v_invalid_origin_count
  from public.student_profiles
  where origin_type not in (
    'personal',
    'organisation'
  );

  if v_invalid_origin_count <> 0 then
    raise exception
      'Migration 3 assertion failed: invalid origin_type values exist.';
  end if;


  select count(*)
  into v_invalid_shape_count
  from public.student_profiles
  where not (
    (
      origin_type = 'personal'
      and account_id is not null
    )
    or
    (
      origin_type = 'organisation'
      and account_id is null
    )
  );

  if v_invalid_shape_count <> 0 then
    raise exception
      'Migration 3 assertion failed: invalid origin/account identity shapes exist.';
  end if;


  -- At deployment time no organisation-created learners
  -- should exist yet. Spectrum onboarding happens later.
  select count(*)
  into v_existing_nonpersonal_count
  from public.student_profiles
  where origin_type <> 'personal';

  if v_existing_nonpersonal_count <> 0 then
    raise exception
      'Migration 3 assertion failed: unexpected organisation-origin learners already exist.';
  end if;
end;
$$;


-- ============================================================
-- END MIGRATION 3
-- ============================================================
;
