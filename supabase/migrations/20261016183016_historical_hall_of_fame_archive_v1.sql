-- Historical sources are preserved independently of current scores and awards.
create table private.lb_hof_archive_batches (
 batch_key text primary key,
 packet_digest text not null,
 summary jsonb not null,
 captured_at timestamptz not null default now(),
 captured_by uuid not null references public.profiles(id)
);
create index lb_hof_archive_batches_actor_idx on private.lb_hof_archive_batches(captured_by);
create table private.lb_hof_archive_sources (
 batch_key text not null references private.lb_hof_archive_batches(batch_key),
 source_key text not null,
 sha256 text not null check(sha256 ~ '^[a-f0-9]{64}$'),
 row_count integer not null check(row_count>=0),
 byte_count integer not null check(byte_count>0),
 retrieved_at timestamptz not null,
 csv_gzip_base64 text not null,
 primary key(batch_key,source_key)
);
create table private.lb_hof_archive_candidates (
 id uuid primary key default gen_random_uuid(),
 batch_key text not null,
 source_key text not null,
 source_row integer not null check(source_row>=2),
 month date not null check(extract(day from month)=1 and month<'2026-10-01'),
 variant text not null check(variant in ('5x5','5x12','12x12','15x15')),
 category text not null check(category in ('Primary','Secondary','NoSchool')),
 display_name text not null check(length(trim(display_name)) between 1 and 80 and display_name !~ '[[:cntrl:]]'),
 metric integer not null check(metric>0 and metric<86400000),
 evidence jsonb not null,
 review_status text not null default 'pending' check(review_status in ('pending','approved','rejected')),
 public_display_name text,
 reviewed_by uuid references public.profiles(id),
 reviewed_at timestamptz,
 review_reason text,
 foreign key(batch_key,source_key) references private.lb_hof_archive_sources(batch_key,source_key),
 unique(batch_key,month,variant,category),
 check(review_status<>'approved' or (
   public_display_name is not null and length(trim(public_display_name)) between 1 and 80
   and public_display_name !~ '[[:cntrl:]]' and public_display_name !~ '[^[:space:]@]+@[^[:space:]@]+'
   and reviewed_by is not null and reviewed_at is not null and length(trim(review_reason)) between 1 and 500))
);
create index lb_hof_archive_candidates_review_idx on private.lb_hof_archive_candidates(review_status,month,variant,category);
create index lb_hof_archive_candidates_source_idx on private.lb_hof_archive_candidates(batch_key,source_key);
create index lb_hof_archive_candidates_reviewer_idx on private.lb_hof_archive_candidates(reviewed_by);
alter table private.lb_hof_archive_batches enable row level security;
alter table private.lb_hof_archive_sources enable row level security;
alter table private.lb_hof_archive_candidates enable row level security;
revoke all on private.lb_hof_archive_batches,private.lb_hof_archive_sources,private.lb_hof_archive_candidates from public,anon,authenticated;

create function private.lb_hof_archive_read(p_action text,p_payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_month date; v_variant text; v_category text;
begin
 if p_payload is null or jsonb_typeof(p_payload)<>'object' or p_payload-array['month','variant','category']<>'{}'::jsonb then
  raise exception 'Invalid archive selection' using errcode='22023';
 end if;
 if p_action='list_months' then
  return (select coalesce(jsonb_agg(month order by month desc),'[]'::jsonb) from
    (select distinct month from private.lb_hof_archive_candidates where review_status='approved') x);
 end if;
 if p_action<>'awards' then raise exception 'Unknown archive action' using errcode='22023'; end if;
 v_month=(p_payload->>'month')::date;v_variant=p_payload->>'variant';v_category=p_payload->>'category';
 if v_month is null or extract(day from v_month)<>1 or v_month>='2026-10-01'
  or v_variant is null or v_variant not in ('5x5','5x12','12x12','15x15')
  or v_category is null or v_category not in ('Primary','Secondary','NoSchool') then
  raise exception 'Choose an archive month, grid and category' using errcode='22023';
 end if;
 return (select coalesce(jsonb_agg(jsonb_build_object('month',month,'variant',variant,'category',category,
  'display_name',public_display_name,'metric',metric,'record_type','legacy_reconstruction') order by public_display_name,id),'[]'::jsonb)
  from private.lb_hof_archive_candidates where review_status='approved' and month=v_month and variant=v_variant and category=v_category);
end $$;
create function public.hall_of_fame_archive_api(p_action text,p_payload jsonb default '{}'::jsonb)
returns jsonb language sql stable security invoker set search_path='' as $$ select private.lb_hof_archive_read(p_action,p_payload); $$;
revoke all on function private.lb_hof_archive_read(text,jsonb),public.hall_of_fame_archive_api(text,jsonb) from public,anon,authenticated;
grant execute on function private.lb_hof_archive_read(text,jsonb),public.hall_of_fame_archive_api(text,jsonb) to anon,authenticated;

create function private.lb_hof_archive_admin(p_action text,p_payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare c private.lb_hof_archive_candidates; v_name text; v_reason text; v_status text;
begin
 if not private.lb_is_superadmin() then raise exception 'Superadmin required' using errcode='42501'; end if;
 if p_payload is null or jsonb_typeof(p_payload)<>'object' then raise exception 'Invalid payload' using errcode='22023'; end if;
 if p_action='list_review' then
  if p_payload<>'{}'::jsonb then raise exception 'Invalid review request' using errcode='22023'; end if;
  return jsonb_build_object('batches',(select coalesce(jsonb_agg(jsonb_build_object('batch_key',batch_key,'summary',summary,'captured_at',captured_at)),'[]'::jsonb) from private.lb_hof_archive_batches),
   'candidates',(select coalesce(jsonb_agg(jsonb_build_object('id',id,'month',month,'variant',variant,'category',category,'display_name',display_name,'metric',metric,
    'source_key',source_key,'source_row',source_row,'evidence',evidence,'review_status',review_status,'public_display_name',public_display_name,'review_reason',review_reason)
    order by month desc,variant,category),'[]'::jsonb) from private.lb_hof_archive_candidates));
 end if;
 if p_action<>'review' or p_payload-array['candidate_id','status','display_name','reason']<>'{}'::jsonb then
  raise exception 'Unknown archive review action' using errcode='22023';
 end if;
 v_reason=trim(p_payload->>'reason');v_status=p_payload->>'status';v_name=trim(p_payload->>'display_name');
 if v_status is null or v_status not in ('approved','rejected','pending') or coalesce(length(v_reason),0) not between 1 and 500 then
  raise exception 'Review status and reason required' using errcode='22023'; end if;
 if v_status='approved' and (coalesce(length(v_name),0) not between 1 and 80 or v_name ~ '[[:cntrl:]]' or v_name ~ '[^[:space:]@]+@[^[:space:]@]+') then
  raise exception 'Choose a safe public display name' using errcode='22023'; end if;
 select * into c from private.lb_hof_archive_candidates where id=(p_payload->>'candidate_id')::uuid for update;
 if not found then raise exception 'Archive record unavailable' using errcode='22023'; end if;
 update private.lb_hof_archive_candidates set review_status=v_status,public_display_name=case when v_status='approved' then v_name else null end,
  reviewed_by=auth.uid(),reviewed_at=now(),review_reason=v_reason where id=c.id;
 insert into private.lb_audit(actor_id,action,details) values(auth.uid(),'historical_hof_review',jsonb_build_object('candidate_id',c.id,'previous_status',c.review_status,'status',v_status,'reason',v_reason));
 return jsonb_build_object('saved',true,'status',v_status);
end $$;
create function public.hall_of_fame_archive_admin(p_action text,p_payload jsonb default '{}'::jsonb)
returns jsonb language sql security invoker set search_path='' as $$ select private.lb_hof_archive_admin(p_action,p_payload); $$;
revoke all on function private.lb_hof_archive_admin(text,jsonb),public.hall_of_fame_archive_admin(text,jsonb) from public,anon,authenticated;
grant execute on function private.lb_hof_archive_admin(text,jsonb),public.hall_of_fame_archive_admin(text,jsonb) to authenticated;

-- Maintenance-only import: no API role has execute privilege.
create function private.lb_preserve_hof_archive(p_packet jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare s jsonb; c jsonb; v_digest text; v_previous text; v_batch text='monthly_hof_20261016_v1';
begin
 if not private.lb_is_superadmin() then raise exception 'Superadmin required' using errcode='42501'; end if;
 if p_packet is null or jsonb_typeof(p_packet)<>'object' or p_packet-array['sources','candidates','summary']<>'{}'::jsonb
  or jsonb_typeof(p_packet->'sources') is distinct from 'array' or jsonb_typeof(p_packet->'candidates') is distinct from 'array'
  or jsonb_typeof(p_packet->'summary') is distinct from 'object' then raise exception 'Invalid archive snapshot' using errcode='22023'; end if;
 if jsonb_array_length(p_packet->'sources') not between 1 and 20 or jsonb_array_length(p_packet->'candidates')>1000 then
  raise exception 'Archive snapshot exceeds limits' using errcode='22023'; end if;
 perform pg_advisory_xact_lock(hashtext(v_batch));v_digest=md5(p_packet::text);
 select packet_digest into v_previous from private.lb_hof_archive_batches where batch_key=v_batch;
 if found then
  if v_previous<>v_digest then raise exception 'Different snapshot already preserved' using errcode='22023'; end if;
  return jsonb_build_object('already_preserved',true);
 end if;
 insert into private.lb_hof_archive_batches(batch_key,packet_digest,summary,captured_by) values(v_batch,v_digest,p_packet->'summary',auth.uid());
 for s in select value from jsonb_array_elements(p_packet->'sources') loop
  if s-array['source_key','sha256','row_count','byte_count','retrieved_at','csv_gzip_base64']<>'{}'::jsonb
   or (s->>'source_key') !~ '^(5x5|5x12|12x12|15x15)-(Primary|Secondary|NoSchool)$' then raise exception 'Invalid source' using errcode='22023'; end if;
  insert into private.lb_hof_archive_sources values(v_batch,s->>'source_key',s->>'sha256',(s->>'row_count')::integer,(s->>'byte_count')::integer,(s->>'retrieved_at')::timestamptz,s->>'csv_gzip_base64');
 end loop;
 for c in select value from jsonb_array_elements(p_packet->'candidates') loop
  if c-array['source_key','source_row','month','variant','category','display_name','metric','evidence']<>'{}'::jsonb then
   raise exception 'Invalid candidate fields' using errcode='22023'; end if;
  insert into private.lb_hof_archive_candidates(batch_key,source_key,source_row,month,variant,category,display_name,metric,evidence)
   values(v_batch,c->>'source_key',(c->>'source_row')::integer,(c->>'month')::date,c->>'variant',c->>'category',c->>'display_name',(c->>'metric')::integer,c->'evidence');
 end loop;
 insert into private.lb_audit(actor_id,action,details) values(auth.uid(),'historical_hof_preservation',jsonb_build_object('batch_key',v_batch,'sources',jsonb_array_length(p_packet->'sources'),'pending_candidates',jsonb_array_length(p_packet->'candidates')));
 return jsonb_build_object('preserved',true,'sources',jsonb_array_length(p_packet->'sources'),'pending_candidates',jsonb_array_length(p_packet->'candidates'));
end $$;
revoke all on function private.lb_preserve_hof_archive(jsonb) from public,anon,authenticated;
