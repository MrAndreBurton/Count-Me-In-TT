create table if not exists public.symbol_bank_content_releases (
 release_id text primary key,
 symbol_bank_version text not null,
 game_contract_version text not null,
 question_generation_spec_version text not null,
 free_catalogue_version text not null,
 source_system text not null check(source_system='AEOS'),
 canonical_content_sha256 text not null check(canonical_content_sha256 ~ '^[0-9a-f]{64}$'),
 publication_version text not null unique,
 publication_payload_sha256 text not null check(publication_payload_sha256 ~ '^[0-9a-f]{64}$'),
 record_count integer not null check(record_count>0),
 publication_payload jsonb not null check(jsonb_typeof(publication_payload)='object'),
 status text not null default 'imported' check(status in('imported','active','superseded')),
 imported_at timestamptz not null default now(),
 activated_at timestamptz
);

create table if not exists public.symbol_bank_records (
 release_id text not null references public.symbol_bank_content_releases(release_id) on delete restrict,
 symbol_id text not null,
 level integer not null check(level between 1 and 3),
 display text not null,
 canonical_name text not null,
 read_as jsonb not null check(jsonb_typeof(read_as)='array'),
 short_meaning text not null,
 symbol_class text not null,
 variants jsonb not null check(jsonb_typeof(variants)='array'),
 render_mode text not null check(render_mode in('TEXT','MATH','GRAPHIC')),
 context_constraints jsonb not null check(jsonb_typeof(context_constraints)='array'),
 accessibility_name text not null,
 accepted_answers jsonb not null check(jsonb_typeof(accepted_answers)='array'),
 behaviour_flags jsonb not null check(jsonb_typeof(behaviour_flags)='array'),
 distractor_exclusions jsonb not null check(jsonb_typeof(distractor_exclusions)='array'),
 example_contexts jsonb not null check(jsonb_typeof(example_contexts)='array'),
 is_game_active boolean not null,
 game_capabilities jsonb not null check(jsonb_typeof(game_capabilities)='object'),
 confusion_group_ids jsonb not null check(jsonb_typeof(confusion_group_ids)='array'),
 access_tier text not null check(access_tier in('free','member')),
 locked_preview boolean not null,
 challenge_free_eligible boolean not null,
 primary key(release_id,symbol_id)
);

create table if not exists public.symbol_bank_confusion_groups (
 release_id text not null references public.symbol_bank_content_releases(release_id) on delete restrict,
 confusion_group_id text not null,
 group_name text not null,
 description text,
 symbol_ids jsonb not null check(jsonb_typeof(symbol_ids)='array'),
 primary key(release_id,confusion_group_id)
);

alter table public.game_results add column if not exists symbol_bank_release_id text references public.symbol_bank_content_releases(release_id) on delete restrict;
alter table public.game_results drop constraint if exists game_results_game_type_check;
alter table public.game_results add constraint game_results_game_type_check check(game_type=any(array['multiplication','math_language','symbol_challenge','fractions','decimals','algebra','word_problems','other']::text[]));

create index if not exists idx_game_results_symbol_bank_release_id on public.game_results(symbol_bank_release_id);
create index if not exists idx_symbol_bank_records_access on public.symbol_bank_records(release_id,access_tier,level);

create or replace function public.validate_symbol_bank_import_payload(p_payload jsonb)
returns jsonb language plpgsql stable set search_path='' as $$
declare v_symbols int;v_l1 int;v_l2 int;v_l3 int;v_free int;v_member int;v_groups int;v_missing_contract int;begin
 if p_payload is null or jsonb_typeof(p_payload)<>'object' then return jsonb_build_object('pass',false,'reason','payload_not_object');end if;
 v_symbols:=jsonb_array_length(coalesce(p_payload->'symbols','[]'::jsonb));
 select count(*) filter(where (x->>'level')::int=1),count(*) filter(where (x->>'level')::int=2),count(*) filter(where (x->>'level')::int=3),count(*) filter(where x->>'access_tier'='free'),count(*) filter(where x->>'access_tier'='member'),count(*) filter(where not (x ? 'accepted_answers' and x ? 'behaviour_flags' and x ? 'distractor_exclusions' and x ? 'example_contexts' and x ? 'is_game_active'))
 into v_l1,v_l2,v_l3,v_free,v_member,v_missing_contract from jsonb_array_elements(coalesce(p_payload->'symbols','[]'::jsonb)) x;
 v_groups:=jsonb_array_length(coalesce(p_payload->'confusion_groups','[]'::jsonb));
 return jsonb_build_object('pass',v_symbols=92 and v_l1=29 and v_l2=25 and v_l3=38 and v_free=30 and v_member=62 and v_groups=23 and v_missing_contract=0 and p_payload->'release'->>'symbol_bank_version'='MSB-1.0' and p_payload->'release'->>'game_contract_version'='MSG-1.0' and p_payload->'release'->>'question_generation_spec_version'='MSG-QG-1.0' and p_payload->'release'->>'free_catalogue_version'='FCS-1.0','symbols',v_symbols,'l1',v_l1,'l2',v_l2,'l3',v_l3,'free',v_free,'member',v_member,'confusion_groups',v_groups,'missing_contract_fields',v_missing_contract);
end;$$;;
