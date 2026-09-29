-- ============================================================================
-- Organisation Staff Management V2.3
--
-- Purpose:
--   Transactional management of an EXISTING organisation staff relationship.
--
-- Supports:
--   - edit descriptive position
--   - reconcile organisation roles
--   - deactivate
--   - reactivate
--   - formally end/remove staff relationship
--
-- Does NOT:
--   - create staff
--   - delete staff rows
--   - delete or modify Auth identities
--   - modify profile/account identity
--   - restore an ended staff relationship
--
-- Authority:
--   - active platform admin: full supported organisation-role management
--   - active organisation admin: own organisation only
--       * may manage teacher/tutor
--       * may not grant/remove organisation_admin
--       * may not deactivate/end an organisation_admin
-- ============================================================================


create or replace function public.manage_organisation_staff_v1(
  p_organisation_id uuid,
  p_staff_id uuid,
  p_action text,
  p_position text default null,
  p_roles text[] default null
)
returns table (
  staff_id uuid,
  organisation_id uuid,
  profile_id uuid,
  staff_position text,
  staff_status text,
  joined_at timestamptz,
  ended_at timestamptz,
  roles text[],
  staff_action text
)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_caller_id uuid;

  v_is_platform_admin boolean := false;
  v_is_organisation_admin boolean := false;

  v_profile_id uuid;
  v_existing_status text;

  v_position text;

  v_existing_roles text[];
  v_requested_roles text[];
  v_final_roles text[];

  v_target_is_organisation_admin boolean := false;
  v_caller_is_target boolean := false;
begin
  -- -------------------------------------------------------------------------
  -- 1. Require an authenticated caller
  -- -------------------------------------------------------------------------

  v_caller_id := auth.uid();

  if v_caller_id is null then
    raise exception 'AUTHENTICATION_REQUIRED';
  end if;


  -- -------------------------------------------------------------------------
  -- 2. Validate action
  -- -------------------------------------------------------------------------

  if p_action is null
     or p_action not in (
       'update',
       'deactivate',
       'reactivate',
       'end'
     ) then
    raise exception 'INVALID_STAFF_ACTION';
  end if;


  -- -------------------------------------------------------------------------
  -- 3. Validate active organisation
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
  -- 4. Establish caller authority
  --
  -- Platform authority and organisation authority remain separate.
  -- -------------------------------------------------------------------------

  v_is_platform_admin :=
    public.is_active_admin();

  if not v_is_platform_admin then
    v_is_organisation_admin :=
      private.is_organisation_admin(
        p_organisation_id
      );

    if not v_is_organisation_admin then
      raise exception 'ORGANISATION_STAFF_MANAGEMENT_FORBIDDEN';
    end if;
  end if;


  -- -------------------------------------------------------------------------
  -- 5. Lock and load the target staff relationship
  --
  -- V2.3 manages existing relationships only.
  -- -------------------------------------------------------------------------

  select
    os.profile_id,
    os.status
  into
    v_profile_id,
    v_existing_status
  from public.organisation_staff os
  where os.id = p_staff_id
    and os.organisation_id = p_organisation_id
  for update;

  if not found then
    raise exception 'STAFF_RELATIONSHIP_NOT_FOUND';
  end if;


  -- -------------------------------------------------------------------------
  -- 6. Load authoritative existing roles
  -- -------------------------------------------------------------------------

  select coalesce(
           array_agg(
             osr.role
             order by osr.role
           ),
           array[]::text[]
         )
    into v_existing_roles
  from public.organisation_staff_roles osr
  where osr.staff_id = p_staff_id;

  v_target_is_organisation_admin :=
    'organisation_admin' = any(v_existing_roles);

  v_caller_is_target :=
    v_profile_id = v_caller_id;


  -- -------------------------------------------------------------------------
  -- 7. Ended relationships are immutable in Staff V2.3
  -- -------------------------------------------------------------------------

  if v_existing_status = 'ended' then
    raise exception 'STAFF_RELATIONSHIP_ENDED';
  end if;


  -- -------------------------------------------------------------------------
  -- 8. UPDATE
  --
  -- Position + exact requested organisation role set.
  --
  -- Platform admins may manage all supported roles.
  --
  -- Organisation admins may manage teacher/tutor only. The existing
  -- organisation_admin membership must remain exactly unchanged.
  -- -------------------------------------------------------------------------

  if p_action = 'update' then

    v_position :=
      nullif(trim(p_position), '');

    if p_roles is null
       or coalesce(
         array_length(p_roles, 1),
         0
       ) = 0 then
      raise exception 'ROLE_REQUIRED';
    end if;

    if exists (
      select 1
      from unnest(p_roles)
        as requested_role(role)
      where requested_role.role is null
         or requested_role.role not in (
           'organisation_admin',
           'teacher',
           'tutor'
         )
    ) then
      raise exception 'INVALID_ROLE';
    end if;

    select array_agg(
             distinct requested_role.role
             order by requested_role.role
           )
      into v_requested_roles
    from unnest(p_roles)
      as requested_role(role);

    if v_requested_roles is null
       or coalesce(
         array_length(v_requested_roles, 1),
         0
       ) = 0 then
      raise exception 'ROLE_REQUIRED';
    end if;


    -- Organisation administrators cannot grant or remove
    -- organisation_admin.
    if not v_is_platform_admin then

      if (
        'organisation_admin' = any(v_existing_roles)
      ) is distinct from (
        'organisation_admin' = any(v_requested_roles)
      ) then
        raise exception 'ORGANISATION_ADMIN_ROLE_PROTECTED';
      end if;

    end if;


    v_final_roles := v_requested_roles;

    if coalesce(
         array_length(v_final_roles, 1),
         0
       ) = 0 then
      raise exception 'ROLE_REQUIRED';
    end if;


    update public.organisation_staff os
    set position = v_position
    where os.id = p_staff_id
      and os.organisation_id =
        p_organisation_id;


    delete from public.organisation_staff_roles osr
    where osr.staff_id = p_staff_id
      and not (
        osr.role = any(v_final_roles)
      );


    insert into public.organisation_staff_roles (
      staff_id,
      role
    )
    select
      p_staff_id,
      requested_role.role
    from unnest(v_final_roles)
      as requested_role(role)
    on conflict on constraint
      organisation_staff_roles_pkey
    do nothing;


  -- -------------------------------------------------------------------------
  -- 9. DEACTIVATE
  -- -------------------------------------------------------------------------

  elsif p_action = 'deactivate' then

    if v_existing_status <> 'active' then
      raise exception 'STAFF_NOT_ACTIVE';
    end if;

    if not v_is_platform_admin
       and v_target_is_organisation_admin then
      raise exception 'ORGANISATION_ADMIN_LIFECYCLE_PROTECTED';
    end if;

    if not v_is_platform_admin
       and v_caller_is_target then
      raise exception 'SELF_ADMIN_LIFECYCLE_PROTECTED';
    end if;

    update public.organisation_staff os
    set
      status = 'inactive',
      ended_at = null
    where os.id = p_staff_id
      and os.organisation_id =
        p_organisation_id;


  -- -------------------------------------------------------------------------
  -- 10. REACTIVATE
  -- -------------------------------------------------------------------------

  elsif p_action = 'reactivate' then

    if v_existing_status <> 'inactive' then
      raise exception 'STAFF_NOT_INACTIVE';
    end if;

    if coalesce(
         array_length(v_existing_roles, 1),
         0
       ) = 0 then
      raise exception 'ROLE_REQUIRED_FOR_REACTIVATION';
    end if;

    update public.organisation_staff os
    set
      status = 'active',
      ended_at = null
    where os.id = p_staff_id
      and os.organisation_id =
        p_organisation_id;


  -- -------------------------------------------------------------------------
  -- 11. END / REMOVE
  --
  -- This formally concludes the organisation relationship.
  -- The staff row and role history are preserved.
  -- -------------------------------------------------------------------------

  elsif p_action = 'end' then

    if v_existing_status not in (
      'active',
      'inactive'
    ) then
      raise exception 'STAFF_CANNOT_BE_ENDED';
    end if;

    if not v_is_platform_admin
       and v_target_is_organisation_admin then
      raise exception 'ORGANISATION_ADMIN_LIFECYCLE_PROTECTED';
    end if;

    if not v_is_platform_admin
       and v_caller_is_target then
      raise exception 'SELF_ADMIN_LIFECYCLE_PROTECTED';
    end if;

    update public.organisation_staff os
    set
      status = 'ended',
      ended_at = now()
    where os.id = p_staff_id
      and os.organisation_id =
        p_organisation_id;

  end if;


  -- -------------------------------------------------------------------------
  -- 12. Return authoritative final state
  -- -------------------------------------------------------------------------

  return query
  select
    os.id,
    os.organisation_id,
    os.profile_id,
    os.position,
    os.status,
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
    ),
    p_action
  from public.organisation_staff os
  where os.id = p_staff_id
    and os.organisation_id =
      p_organisation_id;

end;
$function$;


-- ============================================================================
-- RPC access
--
-- SECURITY DEFINER performs its own authorization above.
-- Do not expose this mutation to anonymous callers.
-- ============================================================================

revoke all on function
  public.manage_organisation_staff_v1(
    uuid,
    uuid,
    text,
    text,
    text[]
  )
from public;

revoke all on function
  public.manage_organisation_staff_v1(
    uuid,
    uuid,
    text,
    text,
    text[]
  )
from anon;

grant execute on function
  public.manage_organisation_staff_v1(
    uuid,
    uuid,
    text,
    text,
    text[]
  )
to authenticated;
