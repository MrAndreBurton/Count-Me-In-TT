CREATE OR REPLACE FUNCTION private.current_multiplication_practice_context()
 RETURNS TABLE(student_id uuid, display_name text, has_member_access boolean)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  playable_profile_count integer;
begin
  if (select auth.uid()) is null then
    raise exception using
      errcode = '28000',
      message = 'SIGN_IN_REQUIRED';
  end if;

  select count(*)::integer
  into playable_profile_count
  from public.account_student_links asl
  join public.student_profiles sp
    on sp.id = asl.student_id
  join public.profiles account_profile
    on account_profile.id = asl.account_id
  where asl.account_id = (select auth.uid())
    and asl.can_play = true
    and sp.profile_status = 'active'
    and account_profile.account_status = 'active';

  if playable_profile_count = 0 then
    raise exception using
      errcode = 'P0001',
      message = 'PLAYABLE_PROFILE_REQUIRED';
  end if;

  if playable_profile_count > 1 then
    raise exception using
      errcode = 'P0001',
      message = 'MULTIPLE_PLAYABLE_PROFILES';
  end if;

  return query
  select
    sp.id,
    coalesce(
      nullif(btrim(sp.public_display_name), ''),
      nullif(btrim(sp.first_name), ''),
      'Player'
    ) as display_name,
    exists (
      select 1
      from public.student_memberships sm
      join public.membership_plans mp
        on mp.id = sm.plan_id
      where sm.student_id = sp.id
        and sm.status = 'active'
        and sm.is_current = true
        and sm.starts_at <= now()
        and (sm.expires_at is null or sm.expires_at > now())
        and mp.is_active = true
        and mp.entitlements @> '{"multiplication_practice_all_tables": true}'::jsonb
    ) as has_member_access
  from public.account_student_links asl
  join public.student_profiles sp
    on sp.id = asl.student_id
  where asl.account_id = (select auth.uid())
    and asl.can_play = true
    and sp.profile_status = 'active';
end;
$function$

