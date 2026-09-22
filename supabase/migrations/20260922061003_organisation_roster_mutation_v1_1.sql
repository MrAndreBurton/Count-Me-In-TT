create or replace function private.enrol_existing_organisation_student(
  p_organisation_id uuid,
  p_student_id uuid,
  p_group_id uuid default null::uuid
)
returns table(student_id uuid,enrolment_id uuid,organisation_id uuid,group_id uuid,enrolment_action text,group_action text)
language plpgsql security definer set search_path to ''
as $function$
declare
  v_locked_organisation_id uuid;
  v_enrolment_id uuid;
  v_existing_status text;
  v_student_limit integer;
  v_active_student_count bigint;
  v_enrolment_action text;
  v_group_action text := 'not_requested';
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  if not (public.is_active_admin() or private.is_organisation_admin(p_organisation_id)) then raise exception 'ROSTER_ADMIN_REQUIRED'; end if;

  select o.id into v_locked_organisation_id
  from public.organisations o
  where o.id = p_organisation_id and o.status = 'active'
  for update;
  if not found then raise exception 'ORGANISATION_NOT_ACTIVE'; end if;

  if not exists (
    select 1 from public.student_profiles sp
    where sp.id = p_student_id and sp.profile_status = 'active'
  ) then raise exception 'STUDENT_NOT_FOUND_OR_INACTIVE'; end if;

  select oe.id, oe.status into v_enrolment_id, v_existing_status
  from public.organisation_enrolments oe
  where oe.organisation_id = p_organisation_id
    and oe.student_id = p_student_id
  for update;

  if v_enrolment_id is null or v_existing_status <> 'active' then
    select ol.student_limit into v_student_limit
    from public.organisation_licences ol
    where ol.organisation_id = p_organisation_id
      and ol.status = 'active'
      and ol.starts_at <= now()
      and (ol.expires_at is null or ol.expires_at >= now())
    order by ol.starts_at desc limit 1;
    if not found then raise exception 'ORGANISATION_LICENCE_REQUIRED'; end if;

    if v_student_limit is not null then
      select count(*) into v_active_student_count
      from public.organisation_enrolments oe
      where oe.organisation_id = p_organisation_id and oe.status = 'active';
      if v_active_student_count >= v_student_limit then raise exception 'ORGANISATION_STUDENT_LIMIT_REACHED'; end if;
    end if;
  end if;

  if v_enrolment_id is null then
    insert into public.organisation_enrolments (organisation_id, student_id, status, joined_at)
    values (p_organisation_id, p_student_id, 'active', now())
    returning id into v_enrolment_id;
    v_enrolment_action := 'created';
  elsif v_existing_status = 'active' then
    v_enrolment_action := 'already_active';
  else
    update public.organisation_enrolments oe
       set status = 'active', ended_at = null
     where oe.id = v_enrolment_id and oe.organisation_id = p_organisation_id;
    v_enrolment_action := 'reactivated';
  end if;

  if p_group_id is not null then
    select x.action into v_group_action
    from private.set_organisation_group_membership(p_organisation_id, v_enrolment_id, p_group_id, true) x;
  end if;

  return query
  select p_student_id, v_enrolment_id, p_organisation_id, p_group_id, v_enrolment_action, v_group_action;
end;
$function$;

create or replace function private.set_organisation_group_membership(
  p_organisation_id uuid,p_enrolment_id uuid,p_group_id uuid,p_active boolean
)
returns table(organisation_id uuid,enrolment_id uuid,student_id uuid,group_id uuid,active boolean,action text)
language plpgsql security definer set search_path to ''
as $function$
declare
  v_student_id uuid;
  v_enrolment_status text;
  v_membership_exists boolean := false;
  v_membership_active boolean := false;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_active is null then raise exception 'ACTIVE_STATE_REQUIRED'; end if;
  if not (public.is_active_admin() or private.is_organisation_admin(p_organisation_id)) then raise exception 'ROSTER_ADMIN_REQUIRED'; end if;

  select oe.student_id, oe.status into v_student_id, v_enrolment_status
  from public.organisation_enrolments oe
  where oe.id = p_enrolment_id and oe.organisation_id = p_organisation_id
  for update;
  if not found then raise exception 'ENROLMENT_NOT_FOUND'; end if;

  if p_active then
    if not exists (
      select 1 from public.organisation_groups og
      where og.id = p_group_id and og.organisation_id = p_organisation_id and og.status = 'active'
    ) then raise exception 'GROUP_NOT_FOUND_OR_INACTIVE'; end if;
    if v_enrolment_status <> 'active' then raise exception 'ENROLMENT_NOT_ACTIVE'; end if;
  else
    if not exists (
      select 1 from public.organisation_groups og
      where og.id = p_group_id and og.organisation_id = p_organisation_id
    ) then raise exception 'GROUP_NOT_FOUND'; end if;
  end if;

  select true, (ogs.ended_at is null) into v_membership_exists, v_membership_active
  from public.organisation_group_students ogs
  where ogs.group_id = p_group_id and ogs.enrolment_id = p_enrolment_id and ogs.organisation_id = p_organisation_id;

  if p_active then
    if not v_membership_exists then
      insert into public.organisation_group_students (group_id, organisation_id, enrolment_id, joined_at, ended_at)
      values (p_group_id, p_organisation_id, p_enrolment_id, now(), null);
      return query select p_organisation_id,p_enrolment_id,v_student_id,p_group_id,true,'added'::text;
    elsif v_membership_active then
      return query select p_organisation_id,p_enrolment_id,v_student_id,p_group_id,true,'already_active'::text;
    else
      update public.organisation_group_students ogs set ended_at = null
      where ogs.group_id = p_group_id and ogs.enrolment_id = p_enrolment_id and ogs.organisation_id = p_organisation_id;
      return query select p_organisation_id,p_enrolment_id,v_student_id,p_group_id,true,'reactivated'::text;
    end if;
  else
    if not v_membership_exists or not v_membership_active then
      return query select p_organisation_id,p_enrolment_id,v_student_id,p_group_id,false,'already_inactive'::text;
    else
      update public.organisation_group_students ogs set ended_at = now()
      where ogs.group_id = p_group_id and ogs.enrolment_id = p_enrolment_id
        and ogs.organisation_id = p_organisation_id and ogs.ended_at is null;
      return query select p_organisation_id,p_enrolment_id,v_student_id,p_group_id,false,'ended'::text;
    end if;
  end if;
end;
$function$;

create or replace function private.end_organisation_enrolment(
  p_organisation_id uuid,p_enrolment_id uuid
)
returns table(organisation_id uuid,enrolment_id uuid,student_id uuid,status text,ended_at timestamptz,memberships_ended integer,action text)
language plpgsql security definer set search_path to ''
as $function$
declare
  v_locked_organisation_id uuid;
  v_student_id uuid;
  v_status text;
  v_existing_ended_at timestamptz;
  v_ended_at timestamptz;
  v_memberships_ended integer := 0;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  if not (public.is_active_admin() or private.is_organisation_admin(p_organisation_id)) then raise exception 'ROSTER_ADMIN_REQUIRED'; end if;

  select o.id into v_locked_organisation_id
  from public.organisations o
  where o.id = p_organisation_id
  for update;
  if not found then raise exception 'ORGANISATION_NOT_FOUND'; end if;

  select oe.student_id, oe.status, oe.ended_at into v_student_id, v_status, v_existing_ended_at
  from public.organisation_enrolments oe
  where oe.id = p_enrolment_id and oe.organisation_id = p_organisation_id
  for update;
  if not found then raise exception 'ENROLMENT_NOT_FOUND'; end if;

  if v_status = 'ended' then
    return query select p_organisation_id,p_enrolment_id,v_student_id,'ended'::text,v_existing_ended_at,0,'already_ended'::text;
    return;
  end if;

  v_ended_at := now();
  update public.organisation_group_students ogs set ended_at = v_ended_at
  where ogs.organisation_id = p_organisation_id and ogs.enrolment_id = p_enrolment_id and ogs.ended_at is null;
  get diagnostics v_memberships_ended = row_count;

  update public.organisation_enrolments oe set status = 'ended', ended_at = v_ended_at
  where oe.id = p_enrolment_id and oe.organisation_id = p_organisation_id;

  return query select p_organisation_id,p_enrolment_id,v_student_id,'ended'::text,v_ended_at,v_memberships_ended,'ended'::text;
end;
$function$;

revoke all on function private.enrol_existing_organisation_student(uuid, uuid, uuid) from public, anon, authenticated;
revoke all on function private.set_organisation_group_membership(uuid, uuid, uuid, boolean) from public, anon, authenticated;
revoke all on function private.end_organisation_enrolment(uuid, uuid) from public, anon, authenticated;