-- Personal grid progress is separate from completed, leaderboard-eligible results.
create table public.multiplication_grid_attempts (
  id uuid primary key,
  account_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.student_profiles(id) on delete cascade,
  game_mode text not null check (game_mode in ('5x5', '5x12', '12x12', '15x15')),
  status text not null default 'in_progress'
    check (status in ('in_progress', 'completed', 'abandoned', 'interrupted')),
  started_at timestamptz not null,
  duration_ms bigint not null check (duration_ms >= 0),
  evidence jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint grid_attempt_evidence_object check (jsonb_typeof(evidence) = 'object'),
  constraint grid_attempt_evidence_shape check ((
    evidence @> '{"measurementVersion":1,"answerBoundary":"enter_or_blur"}'::jsonb
    and evidence ?& array['rows','cols','totalCells','submittedCells','firstCorrect',
      'firstIncorrect','incorrectAttempts','corrections','correctCells','cells']
    and (evidence->>'rows')::integer = case game_mode when '5x5' then 5 when '5x12' then 5 when '12x12' then 12 else 15 end
    and (evidence->>'cols')::integer = case game_mode when '5x5' then 5 when '5x12' then 12 when '12x12' then 12 else 15 end
    and (evidence->>'totalCells')::integer = (evidence->>'rows')::integer * (evidence->>'cols')::integer
    and (evidence->>'submittedCells')::integer between 0 and (evidence->>'totalCells')::integer
    and (evidence->>'correctCells')::integer between 0 and (evidence->>'totalCells')::integer
    and (evidence->>'firstCorrect')::integer >= 0
    and (evidence->>'firstIncorrect')::integer >= 0
    and (evidence->>'firstCorrect')::integer + (evidence->>'firstIncorrect')::integer = (evidence->>'submittedCells')::integer
    and (evidence->>'incorrectAttempts')::integer >= (evidence->>'firstIncorrect')::integer
    and (evidence->>'corrections')::integer between 0 and (evidence->>'incorrectAttempts')::integer
    and jsonb_typeof(evidence->'cells') = 'array'
    and jsonb_array_length(evidence->'cells') = (evidence->>'submittedCells')::integer
  ) is true),
  constraint grid_attempt_completed_shape check (
    status <> 'completed' or (
      (evidence->>'submittedCells')::integer = (evidence->>'totalCells')::integer
      and (evidence->>'correctCells')::integer = (evidence->>'totalCells')::integer
    )
  ),
  constraint grid_attempt_evidence_size check (octet_length(evidence::text) <= 100000)
);

create index multiplication_grid_attempts_student_started_idx
  on public.multiplication_grid_attempts (student_id, started_at desc);
create index multiplication_grid_attempts_account_idx
  on public.multiplication_grid_attempts (account_id);

alter table public.multiplication_grid_attempts enable row level security;
revoke all on public.multiplication_grid_attempts from public, anon, authenticated;
grant select, insert, update on public.multiplication_grid_attempts to authenticated;

create policy "Linked accounts can view personal grid attempts"
on public.multiplication_grid_attempts for select to authenticated
using (public.can_view_student(student_id));

create policy "Playable accounts can create their own grid attempts"
on public.multiplication_grid_attempts for insert to authenticated
with check (account_id = (select auth.uid()) and public.can_play_student(student_id));

create policy "Playable accounts can update their own grid attempts"
on public.multiplication_grid_attempts for update to authenticated
using (account_id = (select auth.uid()) and public.can_play_student(student_id))
with check (account_id = (select auth.uid()) and public.can_play_student(student_id));

create function public.stamp_multiplication_grid_attempt()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if TG_OP = 'UPDATE' then
    if new.id is distinct from old.id
       or new.account_id is distinct from old.account_id
       or new.student_id is distinct from old.student_id
       or new.game_mode is distinct from old.game_mode
       or new.started_at is distinct from old.started_at then
      raise exception 'Grid attempt identity cannot be changed' using errcode = '22023';
    end if;
    if old.status <> 'in_progress' then
      raise exception 'A finished grid attempt cannot be overwritten' using errcode = '22023';
    end if;
    new.created_at := old.created_at;
  else
    new.created_at := now();
  end if;
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function public.stamp_multiplication_grid_attempt() from public, anon, authenticated;
create trigger stamp_multiplication_grid_attempt
before insert or update on public.multiplication_grid_attempts
for each row execute function public.stamp_multiplication_grid_attempt();
