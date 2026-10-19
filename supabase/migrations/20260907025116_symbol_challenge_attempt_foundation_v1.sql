alter table public.game_results
  add column game_metadata jsonb not null default '{}'::jsonb;

alter table public.game_results
  add constraint game_results_game_metadata_object_check
  check (jsonb_typeof(game_metadata) = 'object');

create table public.symbol_challenge_attempt_items (
  attempt_item_id uuid primary key default gen_random_uuid(),
  game_result_id uuid not null,
  release_id text not null,
  symbol_id text not null,
  question_behaviour text not null,
  difficulty text not null,
  answer_sequence integer not null,
  prompt_payload jsonb not null,
  option_payload jsonb not null,
  selected_option_id text not null,
  correct_option_id text not null,
  is_correct boolean not null,
  response_ms integer null,
  shuffle_seed text not null,
  encounter_role text not null default 'INITIAL',
  source_attempt_item_id uuid null,
  generation_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),

  constraint symbol_challenge_attempt_items_game_result_fkey
    foreign key (game_result_id)
    references public.game_results(id)
    on delete cascade,

  constraint symbol_challenge_attempt_items_symbol_fkey
    foreign key (release_id, symbol_id)
    references public.symbol_bank_records(release_id, symbol_id)
    on delete restrict,

  constraint symbol_challenge_attempt_items_source_fkey
    foreign key (source_attempt_item_id)
    references public.symbol_challenge_attempt_items(attempt_item_id)
    on delete restrict,

  constraint symbol_challenge_attempt_items_result_sequence_key
    unique (game_result_id, answer_sequence),

  constraint symbol_challenge_attempt_items_answer_sequence_check
    check (answer_sequence >= 1),

  constraint symbol_challenge_attempt_items_response_ms_check
    check (response_ms is null or response_ms >= 0),

  constraint symbol_challenge_attempt_items_question_behaviour_check
    check (question_behaviour = any (array['QB-01','QB-02','QB-03','QB-04','QB-05','QB-06']::text[])),

  constraint symbol_challenge_attempt_items_difficulty_check
    check (difficulty = any (array['D1','D2','D3']::text[])),

  constraint symbol_challenge_attempt_items_encounter_role_check
    check (encounter_role = any (array['INITIAL','RETEST','REVIEW']::text[])),

  constraint symbol_challenge_attempt_items_prompt_payload_object_check
    check (jsonb_typeof(prompt_payload) = 'object'),

  constraint symbol_challenge_attempt_items_option_payload_array_check
    check (jsonb_typeof(option_payload) = 'array'),

  constraint symbol_challenge_attempt_items_generation_metadata_object_check
    check (jsonb_typeof(generation_metadata) = 'object'),

  constraint symbol_challenge_attempt_items_source_role_check
    check (
      (encounter_role = 'INITIAL' and source_attempt_item_id is null)
      or (encounter_role in ('RETEST','REVIEW'))
    )
);

create index symbol_challenge_attempt_items_result_idx
  on public.symbol_challenge_attempt_items (game_result_id, answer_sequence);

create index symbol_challenge_attempt_items_symbol_correct_idx
  on public.symbol_challenge_attempt_items (symbol_id, is_correct);

create index symbol_challenge_attempt_items_symbol_behaviour_correct_idx
  on public.symbol_challenge_attempt_items (symbol_id, question_behaviour, is_correct);

create or replace function public.validate_symbol_challenge_attempt_item_v1()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  parent_game_type text;
  parent_release_id text;
  source_game_result_id uuid;
  source_symbol_id text;
begin
  select g.game_type, g.symbol_bank_release_id
    into parent_game_type, parent_release_id
  from public.game_results g
  where g.id = new.game_result_id;

  if parent_game_type is null then
    raise exception using errcode = '23503', message = 'Symbol Challenge attempt requires an existing game result.';
  end if;

  if parent_game_type <> 'symbol_challenge' then
    raise exception using errcode = '23514', message = 'Symbol Challenge attempt must belong to a symbol_challenge game result.';
  end if;

  if parent_release_id is null or parent_release_id <> new.release_id then
    raise exception using errcode = '23514', message = 'Attempt release must match the parent game result Symbol Bank release.';
  end if;

  if new.encounter_role in ('RETEST','REVIEW') then
    if new.source_attempt_item_id is null then
      raise exception using errcode = '23514', message = 'Retest and review encounters require a source attempt item.';
    end if;

    select a.game_result_id, a.symbol_id
      into source_game_result_id, source_symbol_id
    from public.symbol_challenge_attempt_items a
    where a.attempt_item_id = new.source_attempt_item_id;

    if source_game_result_id is null then
      raise exception using errcode = '23503', message = 'Source attempt item does not exist.';
    end if;

    if source_game_result_id <> new.game_result_id or source_symbol_id <> new.symbol_id then
      raise exception using errcode = '23514', message = 'Retest or review source must belong to the same round and symbol.';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.validate_symbol_challenge_attempt_item_v1() from public, anon, authenticated;

create trigger symbol_challenge_attempt_items_validate_before_insert
before insert on public.symbol_challenge_attempt_items
for each row
execute function public.validate_symbol_challenge_attempt_item_v1();

alter table public.symbol_challenge_attempt_items enable row level security;

revoke all on table public.symbol_challenge_attempt_items from anon, authenticated;
grant select, insert on table public.symbol_challenge_attempt_items to authenticated;

create policy "Authorized accounts can view symbol challenge attempts"
on public.symbol_challenge_attempt_items
for select
to authenticated
using (
  exists (
    select 1
    from public.game_results g
    where g.id = symbol_challenge_attempt_items.game_result_id
      and public.can_view_student(g.student_id)
  )
);

create policy "Playable accounts can create symbol challenge attempts"
on public.symbol_challenge_attempt_items
for insert
to authenticated
with check (
  exists (
    select 1
    from public.game_results g
    where g.id = symbol_challenge_attempt_items.game_result_id
      and g.account_id = (select auth.uid())
      and g.game_type = 'symbol_challenge'
      and g.symbol_bank_release_id = symbol_challenge_attempt_items.release_id
      and public.can_play_student(g.student_id)
  )
);;
