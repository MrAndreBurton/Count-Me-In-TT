create table if not exists public.symbol_bank_transport_auth (
  credential_id text primary key,
  secret_sha256 text not null check (secret_sha256 ~ '^[0-9a-f]{64}$'),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  retired_at timestamptz
);
alter table public.symbol_bank_transport_auth enable row level security;
revoke all on table public.symbol_bank_transport_auth from anon, authenticated;
insert into public.symbol_bank_transport_auth (credential_id, secret_sha256, active)
values ('MSB-1.0-PUB-1-TRANSPORT', 'b6bbeeaf4d967d2973096f461d6a00a66b6e831a12ea85f4598e24668fd9fa71', true)
on conflict (credential_id) do update set secret_sha256 = excluded.secret_sha256, active = true, retired_at = null;;
