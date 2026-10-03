drop function if exists public.update_organisation_student_profile(uuid, uuid, text, text, text);

create function public.update_organisation_student_profile(
  p_organisation_id uuid,
  p_student_id uuid,
  p_public_display_name text,
  p_school_type text,
  p_current_school text,
  p_current_level text,
  p_academic_year text
)
returns table(
  student_id uuid,
  public_display_name text,
  school_type text,
  current_school text,
  current_level text,
  academic_year text
)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_public_display_name text;
  v_school_type text;
  v_current_school text;
  v_current_level text;
  v_academic_year text;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if not (
    public.is_active_admin()
    or private.is_organisation_admin(p_organisation_id)
  ) then
    raise exception 'ROSTER_ADMIN_REQUIRED';
  end if;

  if not exists (
    select 1
    from public.organisations o
    where o.id = p_organisation_id
      and o.status = 'active'
  ) then
    raise exception 'ORGANISATION_NOT_ACTIVE';
  end if;

  if not exists (
    select 1
    from public.student_profiles sp
    where sp.id = p_student_id
      and sp.profile_status = 'active'
  ) then
    raise exception 'STUDENT_NOT_FOUND_OR_INACTIVE';
  end if;

  if not exists (
    select 1
    from public.organisation_enrolments oe
    where oe.organisation_id = p_organisation_id
      and oe.student_id = p_student_id
      and oe.status = 'active'
      and oe.ended_at is null
  ) then
    raise exception 'ACTIVE_ENROLMENT_REQUIRED';
  end if;

  v_public_display_name := nullif(trim(p_public_display_name), '');

  if v_public_display_name is null then
    raise exception 'DISPLAY_NAME_REQUIRED';
  end if;

  v_school_type := lower(nullif(trim(p_school_type), ''));

  if v_school_type is null
     or v_school_type not in ('primary', 'secondary', 'no_school') then
    raise exception 'INVALID_SCHOOL_TYPE';
  end if;

  if v_school_type = 'no_school' then
    v_current_school := null;
    v_current_level := null;
    v_academic_year := null;
  else
    v_current_school := nullif(trim(p_current_school), '');
    v_current_level := nullif(trim(p_current_level), '');
    v_academic_year := nullif(trim(p_academic_year), '');
  end if;

  update public.student_profiles sp
  set
    public_display_name = v_public_display_name,
    school_type = v_school_type,
    current_school = v_current_school,
    current_level = v_current_level,
    academic_year = v_academic_year
  where sp.id = p_student_id
  returning
    sp.id,
    sp.public_display_name,
    sp.school_type,
    sp.current_school,
    sp.current_level,
    sp.academic_year
  into
    student_id,
    public_display_name,
    school_type,
    current_school,
    current_level,
    academic_year;

  return next;
end;
$function$;

revoke execute on function public.update_organisation_student_profile(uuid, uuid, text, text, text, text, text) from public, anon;
grant execute on function public.update_organisation_student_profile(uuid, uuid, text, text, text, text, text) to authenticated;;
