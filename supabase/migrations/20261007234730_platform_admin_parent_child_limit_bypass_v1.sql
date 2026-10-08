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
set search_path to ''
as $function$
declare
  current_user_id uuid;
  current_account_type text;
  current_account_status text;
  current_admin_role text;
  current_child_count integer;
  can_bypass_child_limit boolean;
  new_student public.student_profiles;
begin
  current_user_id := auth.uid();

  if current_user_id is null then
    raise exception
      'You must be logged in to create a child profile.';
  end if;

  select
    p.account_type,
    p.account_status,
    p.admin_role
  into
    current_account_type,
    current_account_status,
    current_admin_role
  from public.profiles p
  where p.id = current_user_id;

  if current_account_type is distinct from 'parent' then
    raise exception
      'Only parent or guardian accounts can add child profiles.';
  end if;

  can_bypass_child_limit :=
    current_account_status = 'active'
    and current_admin_role in ('super_admin', 'admin');

  select count(*)
  into current_child_count
  from public.account_student_links asl
  where asl.account_id = current_user_id
    and asl.relationship_role = 'parent';

  if not can_bypass_child_limit
     and current_child_count >= 5 then
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
$function$;
