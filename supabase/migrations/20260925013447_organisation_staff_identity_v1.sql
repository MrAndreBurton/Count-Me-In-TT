-- Organisation Staff Identity V1
--
-- Extends the existing account identity model to support adult organisation
-- staff while preserving the separation between:
--   - platform account identity
--   - organisation employment/authority
--   - personal learning/player identity
--
-- This migration deliberately does not change organisation role policies,
-- learning-profile creation, or personal player-linking behaviour.


-- ---------------------------------------------------------------------------
-- 1. Allow "staff" as a profiles.account_type
-- ---------------------------------------------------------------------------

alter table public.profiles
  drop constraint profiles_account_type_check;

alter table public.profiles
  add constraint profiles_account_type_check
  check (
    account_type = any (
      array[
        'parent'::text,
        'student'::text,
        'staff'::text,
        'admin'::text
      ]
    )
  );


-- ---------------------------------------------------------------------------
-- 2. Preserve staff identity when Auth creates the public profile
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  insert into public.profiles (
    id,
    full_name,
    account_type,
    phone,
    communication_preference,
    consent_accepted,
    consent_recorded_at
  )
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
      'CountMeInTT User'
    ),
    case
      when new.raw_user_meta_data ->> 'account_type' = 'student'
        then 'student'
      when new.raw_user_meta_data ->> 'account_type' = 'staff'
        then 'staff'
      else 'parent'
    end,
    nullif(trim(new.raw_user_meta_data ->> 'phone'), ''),
    case
      when new.raw_user_meta_data ->> 'communication_preference'
        in ('email', 'whatsapp', 'both')
      then new.raw_user_meta_data ->> 'communication_preference'
      else 'email'
    end,
    coalesce(
      (new.raw_user_meta_data ->> 'consent_accepted')::boolean,
      false
    ),
    case
      when new.raw_user_meta_data ->> 'consent_recorded_at' is not null
      then (
        new.raw_user_meta_data ->> 'consent_recorded_at'
      )::timestamptz
      else null
    end
  );

  return new;
end;
$function$;


-- ---------------------------------------------------------------------------
-- 3. Add descriptive organisation position
-- ---------------------------------------------------------------------------

alter table public.organisation_staff
  add column position text;
