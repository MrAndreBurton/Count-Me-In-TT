create table if not exists public.symbol_bank_transport_staging (
  transport_id text not null,
  chunk_no integer not null check (chunk_no > 0),
  chunk_text text not null,
  created_at timestamptz not null default now(),
  primary key (transport_id, chunk_no)
);
revoke all on table public.symbol_bank_transport_staging from anon, authenticated;;
