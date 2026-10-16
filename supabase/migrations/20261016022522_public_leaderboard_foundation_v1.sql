-- Public competition foundation. Provisioned as draft, never automatically published.
-- Requires leaderboard_foundation_v1; does not enable new score submissions.
create table private.lb_public_releases (
 board_id uuid primary key references private.lb_boards(id),
 is_published boolean not null default false,
 updated_at timestamptz not null default now(),
 updated_by uuid references public.profiles(id),
 reason text not null default 'Awaiting public interface and submission rollout'
);
create table private.lb_public_import_batches (
 batch_key text primary key,
 board_id uuid not null references private.lb_boards(id),
 payload_digest text not null,
 source_manifest jsonb not null check(jsonb_typeof(source_manifest)='object'),
 summary jsonb not null default '{}'::jsonb,
 imported_by uuid not null references public.profiles(id),
 imported_at timestamptz not null default now()
);
create table private.lb_public_import_rows (
 batch_key text not null references private.lb_public_import_batches(batch_key),
 source_key text not null,
 source_row integer not null check(source_row>=2),
 variant text not null check(variant in ('5x5','5x12','12x12','15x15')),
 source_category text not null check(source_category in ('Primary','Secondary','NoSchool')),
 display_name text not null check(length(trim(display_name)) between 1 and 80),
 metric integer not null check(metric>0),
 submitted_at timestamptz not null,
 result_id uuid references public.game_results(id),
 entry_id uuid references private.lb_entries(id),
 status text not null check(status in ('imported','held')),
 review_reason text,
 primary key(batch_key,source_key,source_row),
 check((status='imported' and result_id is not null and entry_id is not null and review_reason is null)
    or (status='held' and entry_id is null and coalesce(length(trim(review_reason)),0)>0))
);
create index lb_public_import_batches_board_idx on private.lb_public_import_batches(board_id);
create index lb_public_import_batches_actor_idx on private.lb_public_import_batches(imported_by);
create index lb_public_import_rows_result_idx on private.lb_public_import_rows(result_id);
create index lb_public_import_rows_entry_idx on private.lb_public_import_rows(entry_id);
create index lb_public_releases_actor_idx on private.lb_public_releases(updated_by);
alter table private.lb_public_releases enable row level security;
alter table private.lb_public_import_batches enable row level security;
alter table private.lb_public_import_rows enable row level security;
revoke all on private.lb_public_releases,private.lb_public_import_batches,private.lb_public_import_rows from public,anon,authenticated;

-- A single public board contains the 4 grids x 3 category ranking partitions.
insert into private.lb_boards(game_key,scope,name,variants,status,active_from)
values('multiplication','public','CountMeInTT Multiplication Leaderboard',
 array['5x5','5x12','12x12','15x15'],'draft','2026-10-01 00:00:00 America/Port_of_Spain'::timestamptz)
on conflict(game_key,scope,organisation_id,group_id) do nothing;
insert into private.lb_public_releases(board_id)
select id from private.lb_boards where game_key='multiplication' and scope='public'
on conflict(board_id) do nothing;
do $$ declare b uuid; begin
 select id into strict b from private.lb_boards where game_key='multiplication' and scope='public';
 perform private.lb_ensure_season(b,'2026-10-01');
end $$;

create function private.lb_public_read(p_action text,p_payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare b private.lb_boards; s private.lb_seasons; v_month date; v_variant text; v_category text;
begin
 if p_payload is null or jsonb_typeof(p_payload)<>'object'
   or p_payload-array['board_id','month','variant','category','game_key']<>'{}'::jsonb then
  raise exception 'Invalid public leaderboard selection' using errcode='22023';
 end if;
 if p_action='list_boards' then
  return (select coalesce(jsonb_agg(jsonb_build_object('id',x.id,'game_key',x.game_key,
   'name',x.name,'scope','public','variants',x.variants,'status',x.status,'active_from',x.active_from) order by x.name),'[]'::jsonb)
   from private.lb_boards x join private.lb_public_releases r on r.board_id=x.id and r.is_published
   join private.lb_games g on g.game_key=x.game_key and g.status='active'
   where x.scope='public' and x.status in ('active','paused') and x.active_from<=now()
    and (not(p_payload?'game_key') or x.game_key=p_payload->>'game_key'));
 end if;
 if p_action='list_games' then
  return (select coalesce(jsonb_agg(jsonb_build_object('game_key',g.game_key,'name',g.name,
   'variant_label',g.variant_label,'variants',g.variants,'ranking_direction',g.ranking_direction) order by g.name),'[]'::jsonb)
   from private.lb_games g where g.status='active' and exists(
    select 1 from private.lb_boards x join private.lb_public_releases r on r.board_id=x.id and r.is_published
    where x.game_key=g.game_key and x.scope='public' and x.status in ('active','paused') and x.active_from<=now()));
 end if;
 if p_action not in ('list_seasons','standings','hall_of_fame') then
  raise exception 'Unknown public leaderboard action' using errcode='22023';
 end if;
 select x.* into b from private.lb_boards x
 join private.lb_public_releases r on r.board_id=x.id and r.is_published
 join private.lb_games g on g.game_key=x.game_key and g.status='active'
 where x.id=(p_payload->>'board_id')::uuid and x.scope='public'
  and x.status in ('active','paused') and x.active_from<=now();
 if not found then raise exception 'Public leaderboard unavailable' using errcode='42501'; end if;
 if p_action='list_seasons' then
  return (select coalesce(jsonb_agg(jsonb_build_object('month',x.month,'starts_at',x.starts_at,
   'ends_at',x.ends_at,'finalised_at',x.finalised_at) order by x.month desc),'[]'::jsonb)
   from private.lb_seasons x where x.board_id=b.id and x.starts_at<=now());
 end if;
 v_month=(p_payload->>'month')::date; v_variant=p_payload->>'variant';
 v_category=coalesce(p_payload->>'category','Primary');
 if v_month is null or extract(day from v_month)<>1 or v_variant is null
   or not exists(select 1 from private.lb_games g where g.game_key=b.game_key and v_variant=any(g.variants))
   or v_category not in ('Primary','Secondary','NoSchool') then
  raise exception 'Invalid month, grid or category' using errcode='22023';
 end if;
 select * into s from private.lb_seasons where board_id=b.id and month=v_month and starts_at<=now();
 if not found then return '[]'::jsonb; end if;
 if p_action='hall_of_fame' then
  return (select coalesce(jsonb_agg(jsonb_build_object('display_name',h.display_name,'metric',h.metric,
    'variant',h.variant,'category',h.category,'awarded_at',h.awarded_at) order by h.display_name,h.entry_id),'[]'::jsonb)
   from private.lb_hall_of_fame h
   join private.lb_entries e on e.id=h.entry_id and not e.excluded
   join private.lb_public_submissions ps on ps.result_id=e.result_id and ps.student_id=e.student_id and ps.withdrawn_at is null
   where h.board_id=b.id and h.season_id=s.id and h.variant=v_variant and h.category=v_category);
 end if;
 return (with best as (
  select e.*,row_number() over(partition by e.student_id order by
   case when g.ranking_direction='asc' then e.metric else -e.metric end,e.completed_at,e.id) as attempt
  from private.lb_entries e join private.lb_games g on g.game_key=b.game_key
  join private.lb_public_submissions ps on ps.result_id=e.result_id and ps.student_id=e.student_id and ps.withdrawn_at is null
  where e.board_id=b.id and e.season_id=s.id and e.variant=v_variant and e.category=v_category and not e.excluded
 ), ranked as (
  select e.*,rank() over(order by case when g.ranking_direction='asc' then e.metric else -e.metric end) as position,
   exists(select 1 from public.account_student_links a join public.profiles p on p.id=a.account_id
     where a.student_id=e.student_id and a.account_id=auth.uid() and a.can_play and p.account_status='active') as is_me
  from best e join private.lb_games g on g.game_key=b.game_key where e.attempt=1
 ) select coalesce(jsonb_agg(jsonb_build_object('display_name',display_name,'metric',metric,
   'rank',position,'is_me',is_me) order by position,display_name,id),'[]'::jsonb)
   from ranked where position<=10 or is_me);
end $$;
create function public.public_leaderboard_api(p_action text,p_payload jsonb default '{}'::jsonb)
returns jsonb language sql stable security invoker set search_path='' as $$
 select private.lb_public_read(p_action,p_payload);
$$;
revoke all on function private.lb_public_read(text,jsonb) from public,anon,authenticated;
revoke all on function public.public_leaderboard_api(text,jsonb) from public,anon,authenticated;
grant usage on schema private to anon,authenticated;
grant execute on function private.lb_public_read(text,jsonb) to anon,authenticated;
grant execute on function public.public_leaderboard_api(text,jsonb) to anon,authenticated;

create function private.lb_public_admin(p_action text,p_payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare b private.lb_boards; e private.lb_entries; v_reason text; v_publish boolean;
begin
 if not private.lb_is_superadmin() then raise exception 'Superadmin required' using errcode='42501'; end if;
 if p_payload is null or jsonb_typeof(p_payload)<>'object' then raise exception 'Invalid payload' using errcode='22023'; end if;
 if p_action='import_review' then
  return jsonb_build_object('batches',(select coalesce(jsonb_agg(jsonb_build_object('batch_key',batch_key,
   'summary',summary,'imported_at',imported_at)),'[]'::jsonb) from private.lb_public_import_batches),
   'held',(select coalesce(jsonb_agg(jsonb_build_object('batch_key',batch_key,'source_key',source_key,
   'source_row',source_row,'variant',variant,'source_category',source_category,'display_name',display_name,
   'metric',metric,'submitted_at',submitted_at,'review_reason',review_reason)),'[]'::jsonb)
   from private.lb_public_import_rows where status='held'));
 end if;
 v_reason=trim(p_payload->>'reason');
 if coalesce(length(v_reason),0) not between 1 and 500 then raise exception 'Reason required' using errcode='22023'; end if;
 if p_action='set_publication' then
  select * into b from private.lb_boards where id=(p_payload->>'board_id')::uuid and scope='public' for update;
  if not found then raise exception 'Public board required' using errcode='22023'; end if;
  if jsonb_typeof(p_payload->'is_published') is distinct from 'boolean' then raise exception 'Publication flag required' using errcode='22023'; end if;
  v_publish=(p_payload->>'is_published')::boolean;
  if v_publish and (b.status='draft' or b.active_from>now()) then raise exception 'Activate the public board first' using errcode='22023'; end if;
  insert into private.lb_public_releases(board_id,is_published,updated_by,reason)
   values(b.id,v_publish,auth.uid(),v_reason) on conflict(board_id) do update
   set is_published=excluded.is_published,updated_by=auth.uid(),updated_at=now(),reason=v_reason;
  insert into private.lb_audit(actor_id,action,board_id,details)
   values(auth.uid(),'public_publication',b.id,jsonb_build_object('is_published',v_publish,'reason',v_reason));
  return jsonb_build_object('saved',true,'is_published',v_publish);
 end if;
 if p_action='exclude_entry' then
  -- Match finalisation's board -> season -> entry lock order.
  select x.* into b from private.lb_boards x join private.lb_entries y on y.board_id=x.id
    where y.id=(p_payload->>'entry_id')::uuid and x.scope='public' for update of x;
  if not found then raise exception 'Public entry required' using errcode='22023'; end if;
  perform 1 from private.lb_seasons s join private.lb_entries y on y.season_id=s.id
    where y.id=(p_payload->>'entry_id')::uuid and s.finalised_at is null for update of s;
  if not found then raise exception 'Finalised awards require a separate correction review' using errcode='22023'; end if;
  update private.lb_entries set excluded=true,exclusion_reason=v_reason
    where id=(p_payload->>'entry_id')::uuid returning * into e;
  insert into private.lb_audit(actor_id,action,board_id,details)
   values(auth.uid(),'public_exclude_entry',b.id,jsonb_build_object('entry_id',e.id,'reason',v_reason));
  return jsonb_build_object('saved',true);
 end if;
 raise exception 'Unknown public administration action' using errcode='22023';
end $$;
create function public.public_leaderboard_admin(p_action text,p_payload jsonb default '{}'::jsonb)
returns jsonb language sql security invoker set search_path='' as $$
 select private.lb_public_admin(p_action,p_payload);
$$;
revoke all on function private.lb_public_admin(text,jsonb) from public,anon,authenticated;
revoke all on function public.public_leaderboard_admin(text,jsonb) from public,anon,authenticated;
grant execute on function private.lb_public_admin(text,jsonb) to authenticated;
grant execute on function public.public_leaderboard_admin(text,jsonb) to authenticated;

-- Sealed October migration routine: SQL maintenance only; never browser callable.
create function private.lb_import_public_october_v1(p_rows jsonb,p_sources jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_batch constant text='google_october_2026_v1'; b private.lb_boards; s uuid;
 v_existing private.lb_public_import_batches; item jsonb; v_result public.game_results;
 v_profile public.student_profiles; v_id uuid; v_student uuid; v_account uuid; v_matches integer;
 v_reason text; v_name text; v_category text; v_grid text; v_ms integer; v_at timestamptz;
 v_imported integer=0; v_held integer=0; v_summary jsonb; v_actor uuid=auth.uid();
begin
 if not private.lb_is_superadmin() then raise exception 'Superadmin required' using errcode='42501'; end if;
 if jsonb_typeof(p_rows) is distinct from 'array' or jsonb_array_length(p_rows) not between 1 and 1000
   or jsonb_typeof(p_sources) is distinct from 'object' then raise exception 'Invalid import snapshot' using errcode='22023'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_batch,0));
 select * into v_existing from private.lb_public_import_batches where batch_key=v_batch;
 if found then
  if v_existing.payload_digest<>md5(p_rows::text||p_sources::text) then raise exception 'Import snapshot changed; review a new migration' using errcode='22023'; end if;
  return v_existing.summary||jsonb_build_object('already_imported',true);
 end if;
 select * into strict b from private.lb_boards where game_key='multiplication' and scope='public' for update;
 if b.status<>'draft' or exists(select 1 from private.lb_public_releases where board_id=b.id and is_published)
   or b.active_from>'2026-10-01 04:00:00+00'::timestamptz then
  raise exception 'Prepare the unpublished October draft board first' using errcode='22023';
 end if;
 s=private.lb_ensure_season(b.id,'2026-10-01');
 perform 1 from private.lb_seasons where id=s and finalised_at is null for update;
 if not found then raise exception 'October season is finalised' using errcode='22023'; end if;
 insert into private.lb_public_import_batches(batch_key,board_id,payload_digest,source_manifest,imported_by)
 values(v_batch,b.id,md5(p_rows::text||p_sources::text),p_sources,v_actor);
 for item in select value from jsonb_array_elements(p_rows) loop
  if jsonb_typeof(item)<>'object' or item-array['source_key','source_row','grid','source_category','display_name',
    'duration_ms','source_played_at','student_id','account_id']<>'{}'::jsonb then
   raise exception 'Unexpected import fields' using errcode='22023'; end if;
  v_grid=item->>'grid';v_category=item->>'source_category';v_name=trim(item->>'display_name');
  v_ms=(item->>'duration_ms')::integer;v_at=(item->>'source_played_at')::timestamptz;
  v_student=nullif(item->>'student_id','')::uuid;v_account=nullif(item->>'account_id','')::uuid;
  v_reason=null;v_id=null;v_result=null;
  if v_grid is null or not(v_grid=any(b.variants)) or v_category is null or v_category not in ('Primary','Secondary','NoSchool')
   or coalesce(length(v_name),0) not between 1 and 80 or v_name ~ '[[:cntrl:]]'
   or v_ms is null or v_ms<=0 or v_ms>86400000 or v_at is null
   or v_at<'2026-10-01 04:00:00+00'::timestamptz or v_at>='2026-11-01 04:00:00+00'::timestamptz or v_at>now()
   or (item->>'source_key') is distinct from (v_grid||'_'||v_category)
   or (item->>'source_row')::integer is null or (item->>'source_row')::integer<2 then
   raise exception 'Invalid October import row' using errcode='22023'; end if;
  if v_student is null or v_account is null then v_reason='Guest submission: no account/profile identifiers';
  else
   select count(*) into v_matches from public.game_results g
    where g.student_id=v_student and g.account_id=v_account and g.game_type='multiplication'
      and g.game_mode=v_grid and g.duration_ms=v_ms
      and g.played_at>='2026-10-01 04:00:00+00'::timestamptz and g.played_at<'2026-11-01 04:00:00+00'::timestamptz;
   if v_matches<>1 then v_reason='Saved result missing or ambiguous';
   else
    select * into strict v_result from public.game_results g where g.student_id=v_student and g.account_id=v_account
     and g.game_type='multiplication' and g.game_mode=v_grid and g.duration_ms=v_ms
     and g.played_at>='2026-10-01 04:00:00+00'::timestamptz and g.played_at<'2026-11-01 04:00:00+00'::timestamptz;
    select * into strict v_profile from public.student_profiles where id=v_student;
    if not exists(select 1 from public.account_student_links a join public.profiles p on p.id=a.account_id
      where a.student_id=v_student and a.account_id=v_account and a.can_play and p.account_status='active')
      or v_profile.profile_status is distinct from 'active' then v_reason='Playable identity is inactive or no longer linked';
    elsif v_result.verification_status is distinct from 'verified' then v_reason='Saved result is not verified';
    elsif (v_result.anti_cheat_data @> '{"untrusted":0,"paste":false}'::jsonb) is not true
      or v_result.correct_answers is distinct from (case v_grid when '5x5' then 25 when '5x12' then 60 when '12x12' then 144 else 225 end)
      then v_reason='Legacy result checks require review';
    elsif (case lower(v_profile.school_type) when 'primary' then 'Primary' when 'secondary' then 'Secondary' when 'no_school' then 'NoSchool' end)
      is distinct from v_category then v_reason='Historical category differs from current profile; manual review required';
    elsif v_result.duration_ms<greatest((case v_grid when '5x5' then 25 when '5x12' then 60 when '12x12' then 144 else 225 end)*8,2500)
      then v_reason='Duration requires review';
    end if;
   end if;
  end if;
  if v_reason is null then
   insert into private.lb_public_submissions(result_id,student_id,account_id,display_name,requested_at,policy_version)
    values(v_result.id,v_student,v_account,v_name,v_at,'legacy-sheet-explicit-submission-2026-10-v1')
    on conflict(result_id) do nothing;
   if not exists(select 1 from private.lb_public_submissions ps where ps.result_id=v_result.id
     and ps.student_id=v_student and ps.account_id=v_account and ps.withdrawn_at is null)
     then raise exception 'Existing public intent conflicts with import' using errcode='22023'; end if;
   insert into private.lb_entries(board_id,season_id,result_id,student_id,variant,category,metric,display_name,membership_snapshot,completed_at)
    values(b.id,s,v_result.id,v_student,v_grid,v_category,v_ms,v_name,
     jsonb_build_object('source','google_sheets_october_import','batch_key',v_batch,'source_key',item->>'source_key',
       'source_row',(item->>'source_row')::integer,'evidence_level','legacy_client_checks','category_source','historical_sheet'),v_result.played_at)
    on conflict(board_id,result_id) do nothing;
   select id into strict v_id from private.lb_entries where board_id=b.id and result_id=v_result.id;
   v_imported=v_imported+1;
  else v_held=v_held+1;
  end if;
  insert into private.lb_public_import_rows(batch_key,source_key,source_row,variant,source_category,
   display_name,metric,submitted_at,result_id,entry_id,status,review_reason)
  values(v_batch,item->>'source_key',(item->>'source_row')::integer,v_grid,v_category,v_name,v_ms,v_at,
   v_result.id,v_id,case when v_reason is null then 'imported' else 'held' end,v_reason);
 end loop;
 v_summary=jsonb_build_object('batch_key',v_batch,'month','2026-10-01','source_rows',jsonb_array_length(p_rows),
   'imported',v_imported,'held',v_held,'published',false);
 update private.lb_public_import_batches set summary=v_summary where batch_key=v_batch;
 insert into private.lb_audit(actor_id,action,board_id,details)
  values(v_actor,'public_october_import',b.id,v_summary);
 return v_summary;
end $$;
revoke all on function private.lb_import_public_october_v1(jsonb,jsonb) from public,anon,authenticated;

-- Enforce publication gating through the existing authenticated gateway too.
create or replace function private.lb_can_view(p_board uuid)
returns boolean language sql stable security definer set search_path=''
as $$
  select exists (
    select 1 from private.lb_boards b where b.id=p_board and (
      private.lb_is_superadmin() or (
        private.lb_is_org_admin(b.organisation_id) and exists (
          select 1 from public.organisations o
          where o.id=b.organisation_id and o.status='active'
        )
      ) or (
        b.status<>'draft' and (
          (b.scope='public' and exists(select 1 from private.lb_public_releases pr where pr.board_id=b.id and pr.is_published)) or exists (
            select 1 from public.organisations o where o.id=b.organisation_id
              and o.status='active' and (
                private.lb_is_org_admin(o.id)
                or exists (
                  select 1 from public.organisation_staff s
                  join public.organisation_staff_roles r on r.staff_id=s.id
                  where s.organisation_id=o.id and s.profile_id=auth.uid()
                    and s.status='active' and s.ended_at is null
                    and r.role in ('teacher','tutor') and (
                      b.scope='organisation' or exists (
                        select 1 from public.organisation_group_staff gs
                        where gs.staff_id=s.id and gs.organisation_id=o.id
                          and gs.group_id=b.group_id and gs.ended_at is null
                      )
                    )
                )
                or exists (
                  select 1 from public.organisation_enrolments e
                  join public.account_student_links a on a.student_id=e.student_id
                  join public.student_profiles sp on sp.id=e.student_id
                  where e.organisation_id=o.id and e.status='active'
                    and e.joined_at<=now() and e.ended_at is null
                    and a.account_id=auth.uid() and a.can_play
                    and sp.profile_status='active' and (
                      b.scope='organisation' or exists (
                        select 1 from public.organisation_group_students gs
                        join public.organisation_groups g on g.id=gs.group_id
                          and g.organisation_id=gs.organisation_id
                        where gs.enrolment_id=e.id and gs.organisation_id=o.id
                          and gs.group_id=b.group_id and gs.ended_at is null
                          and gs.joined_at<=now() and g.status='active'
                      )
                    )
                )
              )
          )
        )
      )
    )
  );
$$;

