-- Phase 2: protected competition storage and administration.
-- No legacy imports, game-save changes, public publication, or cron activation.
begin;
create schema if not exists private;

create table private.lb_games (
  game_key text primary key,
  name text not null,
  variant_label text not null,
  variants text[] not null check (cardinality(variants) > 0),
  ranking_direction text not null check (ranking_direction in ('asc','desc')),
  status text not null check (status in ('active','inactive'))
);
insert into private.lb_games values
  ('multiplication','Multiplication Challenge','Grid',
   array['5x5','5x12','12x12','15x15'],'asc','active');

-- Separate feature entitlement: existing broad licence-write policies do not
-- allow ordinary platform admins to self-grant this superadmin-controlled add-on.
create table private.lb_class_entitlements (
  organisation_id uuid not null references public.organisations(id),
  game_key text not null references private.lb_games(game_key),
  status text not null check (status in ('active','suspended','cancelled')),
  starts_at timestamptz not null,
  expires_at timestamptz,
  access_basis text not null check (access_basis in ('paid','complimentary')),
  reason text not null check (length(trim(reason)) between 1 and 500),
  updated_by uuid not null references public.profiles(id),
  updated_at timestamptz not null default now(),
  primary key (organisation_id,game_key),
  check (expires_at is null or expires_at > starts_at)
);

create table private.lb_boards (
  id uuid primary key default gen_random_uuid(),
  game_key text not null references private.lb_games(game_key),
  scope text not null check (scope in ('public','organisation','class')),
  organisation_id uuid references public.organisations(id),
  group_id uuid references public.organisation_groups(id),
  name text not null check (length(trim(name)) between 1 and 120),
  variants text[] not null check (cardinality(variants) between 1 and 32),
  status text not null default 'draft' check (status in ('draft','active','paused')),
  active_from timestamptz not null default now(),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (scope='public' and organisation_id is null and group_id is null) or
    (scope='organisation' and organisation_id is not null and group_id is null) or
    (scope='class' and organisation_id is not null and group_id is not null)
  ),
  unique nulls not distinct (game_key,scope,organisation_id,group_id)
);
create index lb_boards_org_idx on private.lb_boards(organisation_id);
create index lb_boards_group_idx on private.lb_boards(group_id);

create table private.lb_seasons (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references private.lb_boards(id),
  month date not null check (extract(day from month)=1),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  finalise_after timestamptz not null,
  finalised_at timestamptz,
  finalised_by uuid references public.profiles(id),
  unique (board_id,month),
  unique (id,board_id),
  check (ends_at > starts_at and finalise_after >= ends_at)
);

-- Eligibility/score ingestion is intentionally not granted to browser roles.
-- Only the later trusted game-completion pipeline may create these records.
create table private.lb_entries (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references private.lb_boards(id),
  season_id uuid not null,
  result_id uuid not null references public.game_results(id),
  student_id uuid not null references public.student_profiles(id),
  variant text not null,
  category text not null check (category in ('all','Primary','Secondary','NoSchool')),
  metric numeric not null check (metric > 0 and metric < 'Infinity'::numeric),
  display_name text not null check (length(trim(display_name)) between 1 and 80),
  membership_snapshot jsonb not null default '{}'::jsonb
    check (jsonb_typeof(membership_snapshot)='object'),
  completed_at timestamptz not null,
  accepted_at timestamptz not null default now(),
  excluded boolean not null default false,
  exclusion_reason text,
  foreign key (season_id,board_id) references private.lb_seasons(id,board_id),
  unique (board_id,result_id),
  check (not excluded or coalesce(length(trim(exclusion_reason)),0) > 0)
);
create index lb_entries_rank_idx on private.lb_entries
  (season_id,variant,category,student_id,metric) where not excluded;
create index lb_entries_student_idx on private.lb_entries(student_id);
create index lb_entries_result_idx on private.lb_entries(result_id);

-- This records intent, not server verification or competition eligibility.
-- The public submission workflow is connected in the next phase.
create table private.lb_public_submissions (
  result_id uuid primary key references public.game_results(id),
  student_id uuid not null references public.student_profiles(id),
  account_id uuid not null references public.profiles(id),
  display_name text not null check (length(trim(display_name)) between 1 and 80),
  requested_at timestamptz not null default now(),
  withdrawn_at timestamptz,
  policy_version text not null
);
create index lb_public_submissions_student_idx on private.lb_public_submissions(student_id);
create index lb_public_submissions_account_idx on private.lb_public_submissions(account_id);

create table private.lb_hall_of_fame (
  season_id uuid not null,
  board_id uuid not null,
  entry_id uuid not null references private.lb_entries(id),
  variant text not null,
  category text not null,
  display_name text not null,
  metric numeric not null,
  awarded_at timestamptz not null default now(),
  primary key (season_id,entry_id),
  foreign key (season_id,board_id) references private.lb_seasons(id,board_id)
);
create index lb_hof_board_idx on private.lb_hall_of_fame(board_id);
create index lb_hof_entry_idx on private.lb_hall_of_fame(entry_id);

create table private.lb_audit (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id),
  action text not null,
  board_id uuid references private.lb_boards(id),
  organisation_id uuid references public.organisations(id),
  details jsonb not null default '{}'::jsonb,
  recorded_at timestamptz not null default now()
);
create index lb_audit_actor_idx on private.lb_audit(actor_id);
create index lb_audit_board_idx on private.lb_audit(board_id);
create index lb_audit_org_idx on private.lb_audit(organisation_id);

-- No authenticated/anonymous table access, even if private is exposed by mistake.
do $$
declare t text;
begin
  foreach t in array array['lb_games','lb_class_entitlements','lb_boards',
    'lb_seasons','lb_entries','lb_public_submissions','lb_hall_of_fame','lb_audit']
  loop
    execute format('alter table private.%I enable row level security',t);
    execute format('revoke all on table private.%I from public, anon, authenticated',t);
  end loop;
end $$;
revoke all on sequence private.lb_audit_id_seq from public,anon,authenticated;

create function private.lb_is_superadmin()
returns boolean language sql stable security definer set search_path=''
as $$
  select auth.uid() is not null and exists (
    select 1 from public.profiles p where p.id=auth.uid()
      and p.account_status='active' and p.admin_role='super_admin'
  );
$$;

create function private.lb_has_class_access(p_org uuid,p_game text)
returns boolean language sql stable security definer set search_path=''
as $$
  select exists (select 1 from private.lb_class_entitlements e
    where e.organisation_id=p_org and e.game_key=p_game and e.status='active'
      and e.starts_at<=now() and (e.expires_at is null or e.expires_at>now()));
$$;

create function private.lb_is_org_admin(p_org uuid)
returns boolean language sql stable security definer set search_path=''
as $$
  select auth.uid() is not null and exists (
    select 1 from public.organisation_staff s
    join public.organisation_staff_roles r on r.staff_id=s.id
    where s.organisation_id=p_org and s.profile_id=auth.uid()
      and s.status='active' and s.ended_at is null
      and r.role='organisation_admin'
  );
$$;

create function private.lb_can_view(p_board uuid)
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
          b.scope='public' or exists (
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

-- Guard structural invariants even for trusted ingestion/maintenance writes.
create function private.lb_guard_board()
returns trigger language plpgsql security definer set search_path=''
as $$
declare v_modes text[];
begin
  select variants into v_modes from private.lb_games where game_key=new.game_key;
  if not (new.variants <@ v_modes) or array_position(new.variants,null) is not null
     or cardinality(new.variants)<>(select count(distinct x) from unnest(new.variants) x)
  then raise exception 'Invalid or duplicate game variants' using errcode='22023'; end if;
  if new.scope='class' and not exists (
    select 1 from public.organisation_groups g where g.id=new.group_id
      and g.organisation_id=new.organisation_id
  ) then raise exception 'Class does not belong to organisation' using errcode='22023'; end if;
  if tg_op='UPDATE' and (new.game_key,new.scope,new.organisation_id,new.group_id,new.active_from)
    is distinct from (old.game_key,old.scope,old.organisation_id,old.group_id,old.active_from)
  then raise exception 'Leaderboard identity and activation date are immutable' using errcode='22023'; end if;
  new.updated_at=now();
  return new;
end $$;
create trigger lb_board_guard before insert or update on private.lb_boards
  for each row execute function private.lb_guard_board();

create function private.lb_ensure_season(p_board uuid,p_month date)
returns uuid language plpgsql security definer set search_path=''
as $$
declare v_id uuid; v_start timestamptz; v_end timestamptz;
begin
  if p_month is null or extract(day from p_month)<>1 then
    raise exception 'Month must be the first day' using errcode='22023';
  end if;
  v_start=p_month::timestamp at time zone 'America/Port_of_Spain';
  v_end=(p_month+interval '1 month')::timestamp at time zone 'America/Port_of_Spain';
  insert into private.lb_seasons(board_id,month,starts_at,ends_at,finalise_after)
    values(p_board,p_month,v_start,v_end,v_end+interval '1 hour')
    on conflict (board_id,month) do nothing;
  select id into strict v_id from private.lb_seasons where board_id=p_board and month=p_month;
  return v_id;
end $$;

-- One authorised gateway keeps privileged code in the unexposed private schema.
-- No entry creation, public publishing, raw result access, or arbitrary SQL action.
create function private.lb_api(p_action text,p_payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare
  v_actor uuid=auth.uid(); v_super boolean; v_board private.lb_boards;
  v_org uuid; v_group uuid; v_id uuid; v_game text; v_scope text;
  v_name text; v_status text; v_modes text[]; v_start timestamptz;
  v_month date; v_variant text; v_category text; v_season private.lb_seasons;
  v_out jsonb; v_admin boolean; v_reason text; v_access boolean;
begin
  if v_actor is null or not exists(select 1 from public.profiles p
    where p.id=v_actor and p.account_status='active') then
    raise exception 'Active account required' using errcode='42501';
  end if;
  if p_payload is null or jsonb_typeof(p_payload)<>'object' then
    raise exception 'Payload must be an object' using errcode='22023';
  end if;
  v_super=private.lb_is_superadmin();
  if p_action='list_games' then
    return (select coalesce(jsonb_agg(to_jsonb(g) order by name),'[]'::jsonb)
      from private.lb_games g where g.status='active' or v_super);
  end if;
  if p_action='list_organisations' then
    if not v_super then raise exception 'Superadmin required' using errcode='42501'; end if;
    return (select coalesce(jsonb_agg(jsonb_build_object('id',id,'name',name)
      order by name),'[]'::jsonb) from public.organisations where status='active');
  end if;
  if p_action in ('list_groups','get_class_entitlement','audit') then
    v_org=(p_payload->>'organisation_id')::uuid;
    if not v_super and not private.lb_is_org_admin(v_org) then
      raise exception 'Organisation management is not permitted' using errcode='42501';
    end if;
    if p_action='list_groups' then
      return (select coalesce(jsonb_agg(jsonb_build_object('id',id,'name',name,
        'academic_year',academic_year) order by name),'[]'::jsonb)
        from public.organisation_groups where organisation_id=v_org and status='active');
    end if;
    if p_action='audit' then
      return (select coalesce(jsonb_agg(to_jsonb(a) order by a.id desc),'[]'::jsonb)
        from (select id,action,board_id,recorded_at from private.lb_audit
          where organisation_id=v_org order by id desc limit 100) a);
    end if;
    return coalesce((select to_jsonb(e)||jsonb_build_object(
      'effective_status',case when e.status<>'active' then e.status
        when e.starts_at>now() then 'scheduled'
        when e.expires_at<=now() then 'expired' else 'active' end)
      from private.lb_class_entitlements e where e.organisation_id=v_org
        and e.game_key=p_payload->>'game_key'),'null'::jsonb);
  end if;
  if p_action='list_boards' then
    return (select coalesce(jsonb_agg(jsonb_build_object(
      'id',b.id,'game_key',b.game_key,'scope',b.scope,
      'organisation_id',b.organisation_id,'organisation_name',o.name,
      'group_id',b.group_id,'group_name',g.name,'name',b.name,
      'variants',b.variants,'status',b.status,'active_from',b.active_from,
      'class_access_active',private.lb_has_class_access(b.organisation_id,b.game_key),
      'can_manage',v_super or private.lb_is_org_admin(b.organisation_id)
    ) order by b.name),'[]'::jsonb)
    from private.lb_boards b
    left join public.organisations o on o.id=b.organisation_id
    left join public.organisation_groups g on g.id=b.group_id
    where private.lb_can_view(b.id)
      and (not (p_payload ? 'game_key') or b.game_key=p_payload->>'game_key')
      and (not (p_payload ? 'organisation_id') or b.organisation_id=(p_payload->>'organisation_id')::uuid)
      and (not (p_payload ? 'scope') or b.scope=p_payload->>'scope'));
  end if;
  if p_action='set_class_entitlement' then
    if not v_super then raise exception 'Superadmin required' using errcode='42501'; end if;
    v_org=(p_payload->>'organisation_id')::uuid;
    v_game=p_payload->>'game_key';
    v_reason=trim(p_payload->>'reason');
    if not exists(select 1 from public.organisations where id=v_org and status='active')
      or not exists(select 1 from private.lb_games where game_key=v_game and status='active')
      or coalesce(length(v_reason),0) not between 1 and 500 then
      raise exception 'Active organisation, game and reason required' using errcode='22023';
    end if;
    insert into private.lb_class_entitlements(organisation_id,game_key,status,starts_at,
      expires_at,access_basis,reason,updated_by)
    values(v_org,v_game,p_payload->>'status',(p_payload->>'starts_at')::timestamptz,
      (p_payload->>'expires_at')::timestamptz,p_payload->>'access_basis',v_reason,v_actor)
    on conflict (organisation_id,game_key) do update set
      status=excluded.status,starts_at=excluded.starts_at,expires_at=excluded.expires_at,
      access_basis=excluded.access_basis,reason=excluded.reason,updated_by=v_actor,updated_at=now();
    insert into private.lb_audit(actor_id,action,organisation_id,details)
      values(v_actor,p_action,v_org,p_payload);
    return jsonb_build_object('saved',true);
  end if;
  if p_action='create_board' then
    v_org=(p_payload->>'organisation_id')::uuid;
    v_group=(p_payload->>'group_id')::uuid;
    v_scope=p_payload->>'scope'; v_game=p_payload->>'game_key';
    v_name=trim(p_payload->>'name');
    v_status=coalesce(p_payload->>'status','draft');
    v_start=coalesce((p_payload->>'active_from')::timestamptz,now());
    select array_agg(value) into v_modes from jsonb_array_elements_text(p_payload->'variants');
    if not v_super and not (
      v_scope='class' and private.lb_is_org_admin(v_org)
      and private.lb_has_class_access(v_org,v_game)
      and exists(select 1 from private.lb_boards b where b.organisation_id=v_org
        and b.game_key=v_game and b.scope='organisation' and b.status<>'draft')
    ) then raise exception 'Leaderboard provisioning is not permitted' using errcode='42501'; end if;
    if not exists(select 1 from private.lb_games where game_key=v_game and status='active')
      or (v_scope<>'public' and not exists(
        select 1 from public.organisations where id=v_org and status='active'))
      or (v_scope='class' and (not private.lb_has_class_access(v_org,v_game)
        or not exists(select 1 from public.organisation_groups where id=v_group
          and organisation_id=v_org and status='active')))
      or v_start<statement_timestamp()-interval '5 minutes' then
      raise exception 'Invalid organisation, class, entitlement or activation date' using errcode='22023';
    end if;
    insert into private.lb_boards(game_key,scope,organisation_id,group_id,name,variants,status,active_from,created_by)
    values(v_game,v_scope,v_org,v_group,v_name,v_modes,v_status,v_start,v_actor) returning * into v_board;
    perform private.lb_ensure_season(v_board.id,
      date_trunc('month',v_start at time zone 'America/Port_of_Spain')::date);
    insert into private.lb_audit(actor_id,action,board_id,organisation_id,details)
      values(v_actor,p_action,v_board.id,v_org,to_jsonb(v_board));
    return to_jsonb(v_board);
  end if;
  v_id=(p_payload->>'board_id')::uuid;
  -- Serialise configuration, season creation and finalisation for each board.
  if p_action in ('update_board','ensure_season','finalise_season') then
    select * into v_board from private.lb_boards where id=v_id for update;
  else
    select * into v_board from private.lb_boards where id=v_id;
  end if;
  if not found or not private.lb_can_view(v_id) then
    raise exception 'Leaderboard unavailable' using errcode='42501';
  end if;
  v_admin=v_super or private.lb_is_org_admin(v_board.organisation_id);
  v_access=private.lb_has_class_access(v_board.organisation_id,v_board.game_key);
  if p_action='update_board' then
    if not v_admin or (not v_super and v_board.status='draft' and v_board.scope<>'class')
      or (not v_super and v_board.scope='class' and not v_access) then
      raise exception 'Leaderboard management is not permitted' using errcode='42501';
    end if;
    if p_payload - array['board_id','name','variants','status'] <> '{}'::jsonb then
      raise exception 'Only name, variants and status can be changed' using errcode='22023';
    end if;
    if not v_super and p_payload->>'status'='draft' then
      raise exception 'Provisioning is controlled by superadmin' using errcode='42501';
    end if;
    if v_board.scope='class' and p_payload->>'status'='active' and not v_access then
      raise exception 'Active class add-on required' using errcode='42501';
    end if;
    if p_payload ? 'variants' then
      select array_agg(value) into v_modes from jsonb_array_elements_text(p_payload->'variants');
    else v_modes=v_board.variants; end if;
    update private.lb_boards set name=coalesce(trim(p_payload->>'name'),name),
      status=coalesce(p_payload->>'status',status),variants=v_modes where id=v_id returning * into v_board;
    insert into private.lb_audit(actor_id,action,board_id,organisation_id,details)
      values(v_actor,p_action,v_id,v_board.organisation_id,p_payload);
    return to_jsonb(v_board);
  end if;
  if p_action='ensure_season' then
    if not v_super then raise exception 'Superadmin required' using errcode='42501'; end if;
    v_month=coalesce((p_payload->>'month')::date,
      date_trunc('month',now() at time zone 'America/Port_of_Spain')::date);
    if v_month<date_trunc('month',v_board.active_from at time zone 'America/Port_of_Spain')::date then
      raise exception 'Season predates board activation' using errcode='22023';
    end if;
    v_id=private.lb_ensure_season(v_board.id,v_month);
    return (select to_jsonb(s) from private.lb_seasons s where id=v_id);
  end if;
  if p_action='list_seasons' then
    return (select coalesce(jsonb_agg(jsonb_build_object('id',s.id,'month',s.month,
      'starts_at',s.starts_at,'ends_at',s.ends_at,'finalised_at',s.finalised_at)
      order by s.month desc),'[]'::jsonb) from private.lb_seasons s where board_id=v_board.id);
  end if;
  if p_action not in ('standings','hall_of_fame','finalise_season') then
    raise exception 'Unknown leaderboard action' using errcode='22023';
  end if;
  v_month=(p_payload->>'month')::date;
  if p_action='finalise_season' then
    select * into v_season from private.lb_seasons
      where board_id=v_board.id and month=v_month for update;
  else
    select * into v_season from private.lb_seasons
      where board_id=v_board.id and month=v_month;
  end if;
  if not found then return '[]'::jsonb; end if;
  if p_action='finalise_season' then
    if not v_super then raise exception 'Superadmin required' using errcode='42501'; end if;
    if now()<v_season.finalise_after then
      raise exception 'Season is still accepting eligible completions' using errcode='22023';
    end if;
    if v_season.finalised_at is not null then
      return jsonb_build_object('finalised',true,'already_finalised',true);
    end if;
    with best as (
      select e.*,row_number() over(partition by e.variant,e.category,e.student_id
        order by case when g.ranking_direction='asc' then e.metric else -e.metric end,e.completed_at,e.id) as attempt
      from private.lb_entries e join private.lb_games g on g.game_key=v_board.game_key
      where e.season_id=v_season.id and not e.excluded
    ), ranked as (
      select b.*,rank() over(partition by b.variant,b.category
        order by case when g.ranking_direction='asc' then b.metric else -b.metric end) as position
      from best b join private.lb_games g on g.game_key=v_board.game_key where b.attempt=1
    )
    insert into private.lb_hall_of_fame(season_id,board_id,entry_id,variant,category,display_name,metric)
      select v_season.id,v_board.id,id,variant,category,display_name,metric from ranked where position=1;
    update private.lb_seasons set finalised_at=now(),finalised_by=v_actor where id=v_season.id;
    insert into private.lb_audit(actor_id,action,board_id,organisation_id,details)
      values(v_actor,p_action,v_board.id,v_board.organisation_id,jsonb_build_object('season_id',v_season.id));
    return jsonb_build_object('finalised',true,'already_finalised',false);
  end if;
  if v_board.scope='class' and not v_access and not v_admin
    and v_season.finalised_at is null then
    raise exception 'Class add-on is inactive; historical recognition remains available' using errcode='42501';
  end if;
  v_variant=p_payload->>'variant';
  v_category=coalesce(p_payload->>'category',case when v_board.scope='public' then 'Primary' else 'all' end);
  -- Removed variants retain their previously accepted results.
  select variants into v_modes from private.lb_games where game_key=v_board.game_key;
  if not (v_variant=any(v_modes))
    or v_variant is null or v_category not in ('all','Primary','Secondary','NoSchool')
    or (v_board.scope='public' and v_category='all')
    or (v_board.scope<>'public' and v_category<>'all') then
    raise exception 'Invalid grid or category' using errcode='22023';
  end if;
  if p_action='hall_of_fame' then
    return (select coalesce(jsonb_agg(jsonb_build_object('display_name',h.display_name,
      'metric',h.metric,'variant',h.variant,'category',h.category,'awarded_at',h.awarded_at)
      order by h.display_name,h.entry_id),'[]'::jsonb)
      from private.lb_hall_of_fame h where h.season_id=v_season.id
        and h.variant=v_variant and h.category=v_category);
  end if;
  with best as (
    select e.*,row_number() over(partition by e.student_id order by
      case when g.ranking_direction='asc' then e.metric else -e.metric end,e.completed_at,e.id) as attempt
    from private.lb_entries e join private.lb_games g on g.game_key=v_board.game_key
    where e.season_id=v_season.id and e.variant=v_variant and e.category=v_category and not e.excluded
  ), ranked as (
    select b.*,rank() over(order by
      case when g.ranking_direction='asc' then b.metric else -b.metric end) as position,
      exists(select 1 from public.account_student_links a where a.student_id=b.student_id
        and a.account_id=v_actor and a.can_play) as is_me
    from best b join private.lb_games g on g.game_key=v_board.game_key where b.attempt=1
  )
  select coalesce(jsonb_agg(jsonb_build_object('display_name',display_name,'metric',metric,
    'rank',position,'is_me',is_me) order by position,display_name,id),'[]'::jsonb)
    into v_out from ranked where position<=10 or is_me;
  return v_out;
end $$;

-- Public API is invoker-only. The gateway alone is callable in private, and
-- checks the active account, exact role and resource relationship on every action.
create function public.leaderboard_api(p_action text,p_payload jsonb default '{}'::jsonb)
returns jsonb language sql security invoker set search_path=''
as $$ select private.lb_api(p_action,p_payload); $$;

revoke all on function private.lb_is_superadmin() from public,anon,authenticated;
revoke all on function private.lb_has_class_access(uuid,text) from public,anon,authenticated;
revoke all on function private.lb_is_org_admin(uuid) from public,anon,authenticated;
revoke all on function private.lb_can_view(uuid) from public,anon,authenticated;
revoke all on function private.lb_guard_board() from public,anon,authenticated;
revoke all on function private.lb_ensure_season(uuid,date) from public,anon,authenticated;
revoke all on function private.lb_api(text,jsonb) from public,anon,authenticated;
revoke all on function public.leaderboard_api(text,jsonb) from public,anon,authenticated;
grant usage on schema private to authenticated;
grant execute on function private.lb_api(text,jsonb) to authenticated;
grant execute on function public.leaderboard_api(text,jsonb) to authenticated;

-- No board is made active automatically. Superadmin provisions the first
-- public and organisation boards through the same audited API.
commit;
