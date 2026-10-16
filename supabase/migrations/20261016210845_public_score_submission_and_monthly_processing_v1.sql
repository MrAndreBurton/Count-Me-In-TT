-- Only rounds started after this migration capture public competition context.
alter table private.lb_grid_rounds add column public_board_id uuid references private.lb_boards(id),
 add column public_category text check(public_category in ('Primary','Secondary','NoSchool'));
create index lb_grid_rounds_public_board_idx on private.lb_grid_rounds(public_board_id) where public_board_id is not null;
create function private.lb_capture_public_round_context()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.start_valid then
  select case when sp.profile_type='account_holder' then 'NoSchool' else
   case sp.school_type when 'primary' then 'Primary' when 'secondary' then 'Secondary' when 'no_school' then 'NoSchool' end end
   into new.public_category from public.student_profiles sp where sp.id=new.student_id;
  select b.id into new.public_board_id from private.lb_boards b
   join private.lb_public_releases pr on pr.board_id=b.id and pr.is_published
   join private.lb_games g on g.game_key=b.game_key and g.status='active'
   where b.game_key='multiplication' and b.scope='public' and b.status='active'
    and b.active_from<=new.received_at and new.game_mode=any(b.variants);
 end if;
 return new;
end $$;
revoke all on function private.lb_capture_public_round_context() from public,anon,authenticated;
create trigger lb_capture_public_round_context before insert on private.lb_grid_rounds
 for each row execute function private.lb_capture_public_round_context();

create function private.lb_public_score_submission(p_action text,p_payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.game_results; q private.lb_grid_rounds; b private.lb_boards; s private.lb_seasons;
 v_result uuid; v_name text; v_month date; v_season uuid;
begin
 if auth.uid() is null or not exists(select 1 from auth.users u join public.profiles p on p.id=u.id
   where u.id=auth.uid() and not coalesce(u.is_anonymous,false) and p.account_status='active') then
  raise exception 'Sign in with an active account' using errcode='42501'; end if;
 if p_action not in ('status','submit') or p_action is null or p_payload is null or jsonb_typeof(p_payload)<>'object'
  or p_payload-array['result_id','display_name']<>'{}'::jsonb then raise exception 'Invalid submission request' using errcode='22023'; end if;
 v_result=(p_payload->>'result_id')::uuid;
 select * into r from public.game_results where id=v_result and account_id=auth.uid() and game_type='multiplication';
 if not found or not exists(select 1 from public.account_student_links l join public.student_profiles sp on sp.id=l.student_id
   where l.account_id=auth.uid() and l.student_id=r.student_id and l.can_play and sp.profile_status='active') then
  raise exception 'This result is unavailable for your account' using errcode='42501'; end if;
 -- Replays return the original publication and never duplicate an entry.
 if exists(select 1 from private.lb_public_submissions ps join private.lb_entries e on e.result_id=ps.result_id and e.student_id=ps.student_id
   join private.lb_boards pb on pb.id=e.board_id and pb.scope='public'
   where ps.result_id=r.id and ps.withdrawn_at is null and not e.excluded) then
  return (select jsonb_build_object('status','submitted','month',ss.month,'variant',e.variant,'category',e.category)
   from private.lb_entries e join private.lb_seasons ss on ss.id=e.season_id join private.lb_boards pb on pb.id=e.board_id and pb.scope='public'
   where e.result_id=r.id and not e.excluded limit 1); end if;
 select * into q from private.lb_grid_rounds where result_id=r.id;
 if not found then
  if p_action='submit' then raise exception 'This round has not passed competition checks. Please start a fresh round while signed in.' using errcode='22023'; end if;
  return jsonb_build_object('status','processing','message','Checking this round. If it remains unavailable, play a fresh round while signed in.');
 end if;
 if not q.start_valid or q.completed_at is null or q.account_id<>auth.uid() or q.student_id<>r.student_id
  or q.public_board_id is null then
  return jsonb_build_object('status','unavailable','message','This round did not start in an open public competition. Please play a fresh round while signed in.'); end if;
 if q.public_category is null then return jsonb_build_object('status','unavailable','message','Update your profile education category before starting a new round.'); end if;
 select * into b from private.lb_boards where id=q.public_board_id for update;
 if b.scope<>'public' or b.status<>'active' or b.active_from>q.received_at or not(r.game_mode=any(b.variants))
  or not exists(select 1 from private.lb_public_releases pr where pr.board_id=b.id and pr.is_published)
  or not exists(select 1 from private.lb_games g where g.game_key=b.game_key and g.status='active') then
  return jsonb_build_object('status','unavailable','message','Public submissions are currently closed for this grid.'); end if;
 v_month=date_trunc('month',q.completed_at at time zone 'America/Port_of_Spain')::date;
 v_season=private.lb_ensure_season(b.id,v_month);
 select * into strict s from private.lb_seasons where id=v_season for update;
 if s.finalised_at is not null or statement_timestamp()>=s.finalise_after then
  return jsonb_build_object('status','unavailable','message','This competition month is closed. Start a new round for the current month.'); end if;
 if exists(select 1 from private.lb_public_submissions ps where ps.result_id=r.id and ps.withdrawn_at is null) then
  return jsonb_build_object('status','submitted','month',v_month,'variant',r.game_mode,'category',q.public_category); end if;
 if exists(select 1 from private.lb_entries e where e.board_id=b.id and e.result_id=r.id and e.excluded)
  or exists(select 1 from private.lb_public_submissions ps where ps.result_id=r.id and ps.withdrawn_at is not null) then
  return jsonb_build_object('status','unavailable','message','This result is not available for public submission.'); end if;
 if p_action='status' then return jsonb_build_object('status','eligible','display_name',q.display_name,'category',q.public_category,'month',v_month,'variant',r.game_mode); end if;
 v_name=trim(p_payload->>'display_name');
 if coalesce(length(v_name),0) not between 1 and 80 or v_name ~ '[[:cntrl:]]' or v_name ~ '[^[:space:]@]+@[^[:space:]@]+' then
  raise exception 'Choose a public display name of 1 to 80 characters without contact details' using errcode='22023'; end if;
 insert into private.lb_public_submissions(result_id,student_id,account_id,display_name,policy_version)
  values(r.id,r.student_id,auth.uid(),v_name,'explicit-supabase-grid-v1') on conflict(result_id) do nothing;
 insert into private.lb_entries(board_id,season_id,result_id,student_id,variant,category,metric,display_name,membership_snapshot,completed_at)
  values(b.id,s.id,r.id,r.student_id,r.game_mode,q.public_category,r.duration_ms,v_name,
   jsonb_build_object('attempt_id',q.attempt_id,'rules_version',1,'public_opt_in',true,'category_source','round_start_profile','timing_source','server_checkpoint_receipt'),q.completed_at)
  on conflict(board_id,result_id) do nothing;
 insert into private.lb_audit(actor_id,action,board_id,details) values(auth.uid(),'public_score_submitted',b.id,jsonb_build_object('result_id',r.id,'month',v_month,'variant',r.game_mode,'category',q.public_category));
 return jsonb_build_object('status','submitted','month',v_month,'variant',r.game_mode,'category',q.public_category);
end $$;
create function public.public_score_submission(p_action text,p_payload jsonb default '{}'::jsonb)
returns jsonb language sql security invoker set search_path='' as $$ select private.lb_public_score_submission(p_action,p_payload); $$;
revoke all on function private.lb_public_score_submission(text,jsonb),public.public_score_submission(text,jsonb) from public,anon,authenticated;
grant execute on function private.lb_public_score_submission(text,jsonb),public.public_score_submission(text,jsonb) to authenticated;

-- Shared by manual finalisation and the owner-only scheduled worker.
create function private.lb_finalise_due_season(p_season uuid,p_now timestamptz default statement_timestamp())
returns jsonb language plpgsql security definer set search_path='' as $$
declare b private.lb_boards; s private.lb_seasons;
begin
 select x.* into b from private.lb_boards x join private.lb_seasons y on y.board_id=x.id where y.id=p_season for update of x;
 if not found then raise exception 'Season unavailable' using errcode='22023'; end if;
 select * into strict s from private.lb_seasons where id=p_season for update;
 if s.finalised_at is not null then return jsonb_build_object('finalised',true,'already_finalised',true); end if;
 if p_now<s.finalise_after then raise exception 'Season is still accepting eligible completions' using errcode='22023'; end if;
 with best as (
  select e.*,row_number() over(partition by e.variant,e.category,e.student_id order by
   case when g.ranking_direction='asc' then e.metric else -e.metric end,e.completed_at,e.id) attempt
  from private.lb_entries e join private.lb_games g on g.game_key=b.game_key
  where e.season_id=s.id and not e.excluded and (b.scope<>'public' or exists(
   select 1 from private.lb_public_submissions ps where ps.result_id=e.result_id and ps.student_id=e.student_id and ps.withdrawn_at is null))
 ), ranked as (
  select e.*,rank() over(partition by e.variant,e.category order by case when g.ranking_direction='asc' then e.metric else -e.metric end) position
   from best e join private.lb_games g on g.game_key=b.game_key where e.attempt=1
 ) insert into private.lb_hall_of_fame(season_id,board_id,entry_id,variant,category,display_name,metric)
  select s.id,b.id,id,variant,category,display_name,metric from ranked where position=1;
 update private.lb_seasons set finalised_at=p_now,finalised_by=auth.uid() where id=s.id;
 insert into private.lb_audit(actor_id,action,board_id,organisation_id,details)
  values(auth.uid(),'finalise_season',b.id,b.organisation_id,jsonb_build_object('season_id',s.id,'month',s.month,'automatic',auth.uid() is null));
 return jsonb_build_object('finalised',true,'already_finalised',false);
end $$;
revoke all on function private.lb_finalise_due_season(uuid,timestamptz) from public,anon,authenticated;

-- Keep the existing manual API's authority checks, using the same award rules.
do $replace_manual$
declare v_definition text; v_start integer; v_end integer;
begin
 select pg_get_functiondef('private.lb_api(text,jsonb)'::regprocedure) into v_definition;
 v_start=strpos(v_definition,'    with best as (');
 v_end=strpos(v_definition,'  if v_board.scope=''class'' and not v_access');
 if v_start=0 or v_end<=v_start then raise exception 'Manual finalisation definition differs from inspected version'; end if;
 v_definition=substr(v_definition,1,v_start-1)||'    return private.lb_finalise_due_season(v_season.id);'||chr(10)||'  end if;'||chr(10)||substr(v_definition,v_end);
 execute v_definition;
end $replace_manual$;

create function private.lb_process_leaderboard_months()
returns jsonb language plpgsql security definer set search_path='' as $$
declare b private.lb_boards; s private.lb_seasons; v_month date; v_created integer=0; v_finalised integer=0; v_errors integer=0;
begin
 if not pg_try_advisory_xact_lock(hashtextextended('countmeintt-leaderboard-monthly',0)) then return jsonb_build_object('busy',true); end if;
 v_month=date_trunc('month',statement_timestamp() at time zone 'America/Port_of_Spain')::date;
 for b in select x.* from private.lb_boards x join private.lb_games g on g.game_key=x.game_key and g.status='active'
  where x.status='active' and x.active_from<=statement_timestamp() and
   ((x.scope='public' and exists(select 1 from private.lb_public_releases pr where pr.board_id=x.id and pr.is_published)) or
    (x.scope in ('organisation','class') and exists(select 1 from public.organisations o where o.id=x.organisation_id and o.status='active')
     and (x.scope='organisation' or private.lb_has_class_access(x.organisation_id,x.game_key)))) order by x.id
 loop
  begin
   perform 1 from private.lb_boards where id=b.id for update;
   if not exists(select 1 from private.lb_seasons where board_id=b.id and month=v_month) then
    perform private.lb_ensure_season(b.id,v_month);v_created=v_created+1;
   end if;
  exception when others then
   v_errors=v_errors+1;insert into private.lb_audit(action,board_id,details) values('monthly_processing_error',b.id,jsonb_build_object('step','open_month','sqlstate',sqlstate));
  end;
 end loop;
 for s in select y.* from private.lb_seasons y join private.lb_boards x on x.id=y.board_id
   where y.finalised_at is null and y.finalise_after<=statement_timestamp() and x.status in ('active','paused') order by x.id,y.month
 loop
  begin perform private.lb_finalise_due_season(s.id);v_finalised=v_finalised+1;
  exception when others then
   v_errors=v_errors+1;insert into private.lb_audit(action,board_id,details) values('monthly_processing_error',s.board_id,jsonb_build_object('step','finalise_month','month',s.month,'sqlstate',sqlstate));
  end;
 end loop;
 if v_created>0 then insert into private.lb_audit(action,details) values('monthly_seasons_opened',jsonb_build_object('month',v_month,'count',v_created)); end if;
 return jsonb_build_object('opened',v_created,'finalised',v_finalised,'errors',v_errors);
end $$;
revoke all on function private.lb_process_leaderboard_months() from public,anon,authenticated;

-- CRON_SETUP: separated from isolated tests (PGlite does not implement pg_cron).
create extension if not exists pg_cron with schema pg_catalog;
select cron.schedule('countmeintt-leaderboard-monthly','*/5 * * * *',
 $$select private.lb_process_leaderboard_months(); delete from cron.job_run_details where jobid in (select jobid from cron.job where jobname='countmeintt-leaderboard-monthly') and end_time<now()-interval '30 days';$$);
