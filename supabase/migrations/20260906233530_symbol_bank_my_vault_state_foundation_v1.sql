create table if not exists public.symbol_bank_student_states (
  student_id uuid not null,
  release_id text not null,
  symbol_id text not null,
  state text not null default 'DISCOVERED',
  first_discovered_at timestamptz not null default now(),
  last_viewed_at timestamptz not null default now(),
  state_changed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint symbol_bank_student_states_pkey primary key (student_id, release_id, symbol_id),
  constraint symbol_bank_student_states_student_fkey foreign key (student_id)
    references public.student_profiles(id) on delete cascade,
  constraint symbol_bank_student_states_symbol_fkey foreign key (release_id, symbol_id)
    references public.symbol_bank_records(release_id, symbol_id) on delete restrict,
  constraint symbol_bank_student_states_state_check check (
    state = any (array['DISCOVERED'::text, 'LEARNING'::text, 'SECURE'::text, 'REVIEW'::text])
  )
);

create index if not exists symbol_bank_student_states_student_release_idx
  on public.symbol_bank_student_states (student_id, release_id);

create index if not exists symbol_bank_student_states_student_state_idx
  on public.symbol_bank_student_states (student_id, state);

create trigger symbol_bank_student_states_set_updated_at
before update on public.symbol_bank_student_states
for each row execute function public.set_updated_at();

alter table public.symbol_bank_student_states enable row level security;

revoke all on table public.symbol_bank_student_states from anon, authenticated;
grant select on table public.symbol_bank_student_states to authenticated;

drop policy if exists "Authorized accounts can view symbol vault states" on public.symbol_bank_student_states;
create policy "Authorized accounts can view symbol vault states"
on public.symbol_bank_student_states
for select
to authenticated
using (
  public.can_view_student(student_id)
  or public.is_active_admin()
);

create or replace function public.discover_symbol_bank_symbol(
  target_student_id uuid,
  target_symbol_id text
)
returns table (
  student_id uuid,
  release_id text,
  symbol_id text,
  state text,
  first_discovered_at timestamptz,
  last_viewed_at timestamptz,
  state_changed_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_release_id text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;

  if target_student_id is null then
    raise exception 'Student profile is required.' using errcode = '22023';
  end if;

  if nullif(btrim(target_symbol_id), '') is null then
    raise exception 'Symbol ID is required.' using errcode = '22023';
  end if;

  if not public.can_play_student(target_student_id) then
    raise exception 'You are not authorized to record activity for this student.' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.student_profiles sp
    where sp.id = target_student_id
      and sp.profile_status = 'active'
  ) then
    raise exception 'The student profile is not active.' using errcode = '22023';
  end if;

  select r.release_id
    into v_release_id
  from public.symbol_bank_content_releases r
  where r.status = 'active'
  order by r.activated_at desc nulls last, r.imported_at desc
  limit 1;

  if v_release_id is null then
    raise exception 'No active Symbol Bank release is available.' using errcode = '55000';
  end if;

  if not exists (
    select 1
    from public.symbol_bank_records s
    where s.release_id = v_release_id
      and s.symbol_id = btrim(target_symbol_id)
      and s.is_game_active = true
  ) then
    raise exception 'The symbol is not available in the active Symbol Bank release.' using errcode = '22023';
  end if;

  insert into public.symbol_bank_student_states as s (
    student_id,
    release_id,
    symbol_id,
    state,
    first_discovered_at,
    last_viewed_at,
    state_changed_at,
    created_at,
    updated_at
  ) values (
    target_student_id,
    v_release_id,
    btrim(target_symbol_id),
    'DISCOVERED',
    now(),
    now(),
    now(),
    now(),
    now()
  )
  on conflict (student_id, release_id, symbol_id)
  do update set
    last_viewed_at = now()
  returning
    s.student_id,
    s.release_id,
    s.symbol_id,
    s.state,
    s.first_discovered_at,
    s.last_viewed_at,
    s.state_changed_at,
    s.created_at,
    s.updated_at
  into
    student_id,
    release_id,
    symbol_id,
    state,
    first_discovered_at,
    last_viewed_at,
    state_changed_at,
    created_at,
    updated_at;

  return next;
end;
$function$;

revoke all on function public.discover_symbol_bank_symbol(uuid, text) from public;
revoke all on function public.discover_symbol_bank_symbol(uuid, text) from anon;
grant execute on function public.discover_symbol_bank_symbol(uuid, text) to authenticated;

comment on table public.symbol_bank_student_states is
  'Sparse learner relationship to a versioned Symbol Bank record. No row means UNSEEN. Browser discovery may create DISCOVERED only; higher states are reserved for evidence/mastery evaluation.';

comment on function public.discover_symbol_bank_symbol(uuid, text) is
  'Records a legitimate active-release symbol encounter for a playable student. Creates DISCOVERED only and never promotes LEARNING, SECURE, or REVIEW.';;
