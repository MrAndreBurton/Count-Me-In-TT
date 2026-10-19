create table if not exists public.math_language_content_releases (
  release_id text primary key,
  level integer not null check (level between 1 and 9),
  source_system text not null default 'AEOS',
  source_artifact text not null,
  content_sha256 text not null,
  counts_json jsonb not null default '{}'::jsonb,
  release_status text not null default 'staged' check (release_status in ('staged','active','retired')),
  synced_at timestamptz,
  activated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.math_language_terms (
  term_id text primary key,
  release_id text not null references public.math_language_content_releases(release_id) on delete restrict,
  level integer not null check (level = 3),
  term text not null,
  category text not null,
  subcategory text,
  status text not null default 'active' check (status in ('active','inactive')),
  unique(release_id, term)
);

create table if not exists public.math_language_questions (
  question_id text primary key,
  release_id text not null references public.math_language_content_releases(release_id) on delete restrict,
  term_id text not null references public.math_language_terms(term_id) on delete restrict,
  mode_id text not null,
  difficulty_id text not null,
  prompt text not null,
  misconception_target text,
  representation_required boolean not null default false,
  representation_family text,
  representation_data jsonb not null default '{}'::jsonb,
  canonical_correct_option_id text not null,
  shuffle_policy text not null,
  status text not null default 'active' check (status in ('active','inactive'))
);

create table if not exists public.math_language_options (
  option_id text primary key,
  question_id text not null references public.math_language_questions(question_id) on delete restrict,
  authoring_slot text not null check (authoring_slot in ('A','B','C','D')),
  authoring_sequence integer not null check (authoring_sequence between 1 and 4),
  option_text text not null,
  is_correct boolean not null,
  feedback_text text,
  option_role text not null check (option_role in ('correct','distractor')),
  status text not null default 'active' check (status in ('active','inactive')),
  unique(question_id, authoring_slot),
  unique(question_id, authoring_sequence)
);

create table if not exists public.math_language_attempt_items (
  attempt_item_id uuid primary key default gen_random_uuid(),
  game_result_id uuid not null references public.game_results(id) on delete cascade,
  release_id text not null references public.math_language_content_releases(release_id) on delete restrict,
  question_id text not null references public.math_language_questions(question_id) on delete restrict,
  term_id text not null references public.math_language_terms(term_id) on delete restrict,
  selected_option_id text not null references public.math_language_options(option_id) on delete restrict,
  displayed_position text not null check (displayed_position in ('A','B','C','D')),
  shuffle_seed text not null,
  is_correct boolean not null,
  response_ms integer check (response_ms is null or response_ms >= 0),
  answer_sequence integer not null check (answer_sequence >= 1),
  attempt_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(game_result_id, answer_sequence)
);

alter table public.game_results
  add column if not exists content_release_id text references public.math_language_content_releases(release_id);

create index if not exists math_language_questions_term_mode_diff_idx
  on public.math_language_questions(term_id, mode_id, difficulty_id);
create index if not exists math_language_questions_release_idx
  on public.math_language_questions(release_id);
create index if not exists math_language_options_question_idx
  on public.math_language_options(question_id);
create index if not exists math_language_attempt_items_result_idx
  on public.math_language_attempt_items(game_result_id, answer_sequence);
create index if not exists math_language_attempt_items_term_correct_idx
  on public.math_language_attempt_items(term_id, is_correct);

alter table public.math_language_content_releases enable row level security;
alter table public.math_language_terms enable row level security;
alter table public.math_language_questions enable row level security;
alter table public.math_language_options enable row level security;
alter table public.math_language_attempt_items enable row level security;

drop policy if exists "active_math_language_releases_read" on public.math_language_content_releases;
create policy "active_math_language_releases_read" on public.math_language_content_releases
  for select to anon, authenticated using (release_status='active');
drop policy if exists "active_math_language_terms_read" on public.math_language_terms;
create policy "active_math_language_terms_read" on public.math_language_terms
  for select to anon, authenticated using (
    exists(select 1 from public.math_language_content_releases r where r.release_id=math_language_terms.release_id and r.release_status='active')
  );
drop policy if exists "active_math_language_questions_read" on public.math_language_questions;
create policy "active_math_language_questions_read" on public.math_language_questions
  for select to anon, authenticated using (
    exists(select 1 from public.math_language_content_releases r where r.release_id=math_language_questions.release_id and r.release_status='active')
  );
drop policy if exists "active_math_language_options_read" on public.math_language_options;
create policy "active_math_language_options_read" on public.math_language_options
  for select to anon, authenticated using (
    exists(select 1
      from public.math_language_questions q
      join public.math_language_content_releases r on r.release_id=q.release_id
      where q.question_id=math_language_options.question_id and r.release_status='active')
  );

drop policy if exists "students_read_own_math_language_attempts" on public.math_language_attempt_items;
create policy "students_read_own_math_language_attempts" on public.math_language_attempt_items
  for select to authenticated using (
    exists(select 1 from public.game_results g where g.id=math_language_attempt_items.game_result_id and g.account_id=auth.uid())
  );
drop policy if exists "students_insert_own_math_language_attempts" on public.math_language_attempt_items;
create policy "students_insert_own_math_language_attempts" on public.math_language_attempt_items
  for insert to authenticated with check (
    exists(select 1 from public.game_results g where g.id=math_language_attempt_items.game_result_id and g.account_id=auth.uid())
  );;
