-- Organisation Staff Provisioning V1
--
-- Server-only transactional boundary for attaching an already-resolved
-- CountMeInTT profile to an organisation and reconciling its organisation roles.
--
-- Auth identity resolution and invitation remain the responsibility of the
-- server-side Edge Function. This function does not create Auth users,
-- alter account_type/admin_role, enrol learners, or assign groups.


create or replace function public.provision_organisation_staff_v1(
  p_organisation_id uuid,
  p_profile_id uuid,
  p_position text,
  p_roles text[]
)
returns table (
  staff_id uuid,
  organisation_id uuid,
  profile_id uuid,
  staff_position text,
  staff_status text,
  roles text[],
  staff_action text
)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_staff_id uuid;
  v_existing_status text;
  v_position text;
  v_roles text[];
  v_existing_roles text[];
  v_staff_action text;
  v_roles_changed boolean := false;
begin
  -- -------------------------------------------------------------------------
  -- 1. Validate and lock organisation
  -- -------------------------------------------------------------------------

  perform 1
  from public.organisations o
  where o.id = p_organisation_id
    and o.status = 'active'
  for update;

  if not found then
    raise exception 'ORGANISATION_NOT_ACTIVE';
  end if;


  -- -------------------------------------------------------------------------
  -- 2. Validate target profile
  -- -------------------------------------------------------------------------

  if not exists (
    select 1
    from public.profiles p
    where p.id = p_profile_id
      and p.account_status = 'active'
  ) then
    raise exception 'PROFILE_NOT_FOUND_OR_INACTIVE';
  end if;


  -- -------------------------------------------------------------------------
  -- 3. Validate and normalize requested roles
  --
  -- p_roles is the complete desired role set.
  -- Duplicates are collapsed and the normalized array is sorted.
  -- -------------------------------------------------------------------------

  if p_roles is null
     or coalesce(array_length(p_roles, 1), 0) = 0 then
    raise exception 'ROLE_REQUIRED';
  end if;

  if exists (
    select 1
    from unnest(p_roles) as requested_role(role)
    where role is null
       or role not in ('organisation_admin', 'teacher', 'tutor')
  ) then
    raise exception 'INVALID_ROLE';
  end if;

  select array_agg(
           distinct requested_role.role
           order by requested_role.role
         )
    into v_roles
  from unnest(p_roles) as requested_role(role);

  if v_roles is null
     or coalesce(array_length(v_roles, 1), 0) = 0 then
    raise exception 'ROLE_REQUIRED';
  end if;


  -- -------------------------------------------------------------------------
  -- 4. Normalize descriptive position
  --
  -- NULL or blank means the authoritative position value should be NULL.
  -- -------------------------------------------------------------------------

  v_position := nullif(trim(p_position), '');


  -- -------------------------------------------------------------------------
  -- 5. Lock and inspect any existing organisation staff relationship
  -- -------------------------------------------------------------------------

  select
    os.id,
    os.status
  into
    v_staff_id,
    v_existing_status
  from public.organisation_staff os
  where os.organisation_id = p_organisation_id
    and os.profile_id = p_profile_id
  for update;


  -- -------------------------------------------------------------------------
  -- 6. Create / reconcile relationship lifecycle
  -- -------------------------------------------------------------------------

  if v_staff_id is null then

    insert into public.organisation_staff (
      organisation_id,
      profile_id,
      position,
      status,
      ended_at
    )
    values (
      p_organisation_id,
      p_profile_id,
      v_position,
      'active',
      null
    )
    returning id
    into v_staff_id;

    v_staff_action := 'created';

  elsif v_existing_status = 'ended' then

    raise exception 'STAFF_RELATIONSHIP_ENDED';

  elsif v_existing_status = 'inactive' then

    update public.organisation_staff os
    set
      status = 'active',
      ended_at = null,
      position = v_position,
      updated_at = now()
    where os.id = v_staff_id
      and os.organisation_id = p_organisation_id;

    v_staff_action := 'reactivated';

  elsif v_existing_status = 'active' then

    if exists (
      select 1
      from public.organisation_staff os
      where os.id = v_staff_id
        and os.organisation_id = p_organisation_id
        and os.position is distinct from v_position
    ) then

      update public.organisation_staff os
      set
        position = v_position,
        updated_at = now()
      where os.id = v_staff_id
        and os.organisation_id = p_organisation_id;

      v_staff_action := 'updated';

    else

      v_staff_action := 'unchanged';

    end if;

  else

    raise exception 'STAFF_PROVISIONING_FAILED';

  end if;


  -- -------------------------------------------------------------------------
  -- 7. Capture existing role set before mutation
  -- -------------------------------------------------------------------------

  select coalesce(
           array_agg(osr.role order by osr.role),
           array[]::text[]
         )
    into v_existing_roles
  from public.organisation_staff_roles osr
  where osr.staff_id = v_staff_id;

  v_roles_changed := v_existing_roles is distinct from v_roles;


  -- -------------------------------------------------------------------------
  -- 8. Reconcile roles to the exact requested set
  -- -------------------------------------------------------------------------

  delete from public.organisation_staff_roles osr
  where osr.staff_id = v_staff_id
    and not (osr.role = any(v_roles));

  insert into public.organisation_staff_roles (
    staff_id,
    role
  )
  select
    v_staff_id,
    requested_role.role
  from unnest(v_roles) as requested_role(role)
  on conflict (staff_id, role) do nothing;


  -- A role-set change means an otherwise unchanged active relationship
  -- was updated.
  if v_staff_action = 'unchanged'
     and v_roles_changed then
    v_staff_action := 'updated';
  end if;


  -- -------------------------------------------------------------------------
  -- 9. Return authoritative final state
  -- -------------------------------------------------------------------------

  return query
  select
    os.id as staff_id,
    os.organisation_id,
    os.profile_id,
    os.position as staff_position,
    os.status as staff_status,
    coalesce(
      (
        select array_agg(osr.role order by osr.role)
        from public.organisation_staff_roles osr
        where osr.staff_id = os.id
      ),
      array[]::text[]
    ) as roles,
    v_staff_action as staff_action
  from public.organisation_staff os
  where os.id = v_staff_id
    and os.organisation_id = p_organisation_id;

end;
$function$;


-- ---------------------------------------------------------------------------
-- 10. Server-only execution boundary
-- ---------------------------------------------------------------------------

revoke all on function public.provision_organisation_staff_v1(
  uuid,
  uuid,
  text,
  text[]
) from public;

revoke all on function public.provision_organisation_staff_v1(
  uuid,
  uuid,
  text,
  text[]
) from anon;

revoke all on function public.provision_organisation_staff_v1(
  uuid,
  uuid,
  text,
  text[]
) from authenticated;

grant execute on function public.provision_organisation_staff_v1(
  uuid,
  uuid,
  text,
  text[]
) to service_role;
