
-- Connect new multiplication rounds to private organisation and class boards.
-- Existing game_results and pre-installation rounds are never backfilled.
create table private.lb_grid_rounds (
 attempt_id uuid primary key references public.multiplication_grid_attempts(id) on delete cascade,
 account_id uuid not null references public.profiles(id),
 student_id uuid not null references public.student_profiles(id),
 game_mode text not null,
 received_at timestamptz not null,
 start_valid boolean not null,
 display_name text not null,
 targets jsonb not null default '[]'::jsonb,
 completed_at timestamptz,
 result_id uuid unique references public.game_results(id),
 check (jsonb_typeof(targets)='array')
);
alter table private.lb_grid_rounds enable row level security;
revoke all on private.lb_grid_rounds from public,anon,authenticated;
create index lb_grid_result_attempt_idx on public.game_results
 ((game_metadata #>> '{gridEvidence,attemptId}'))
 where game_type='multiplication';

create function private.lb_route_grid_result(p_result uuid)
returns integer language plpgsql security definer set search_path='' as $$
declare
 r public.game_results; a public.multiplication_grid_attempts;
 q private.lb_grid_rounds; b private.lb_boards; s private.lb_seasons;
 v_attempt uuid; v_e jsonb; v_target jsonb; v_rows integer; v_cols integer;
 v_season uuid; v_count integer; v_added integer=0; v_one integer; v_elapsed numeric;
begin
 select * into r from public.game_results where id=p_result;
 if not found or r.game_type<>'multiplication' then return 0; end if;
 -- Identity and round ID are checked against persisted, server-stamped records.
 if auth.uid() is distinct from r.account_id or not exists(
   select 1 from public.profiles p where p.id=r.account_id and p.account_status='active'
 ) or not exists(
   select 1 from public.account_student_links l
   join public.student_profiles sp on sp.id=l.student_id
   where l.account_id=r.account_id and l.student_id=r.student_id
     and l.can_play and sp.profile_status='active'
 ) then return 0; end if;
 begin v_attempt=(r.game_metadata #>> '{gridEvidence,attemptId}')::uuid;
 exception when invalid_text_representation then return 0; end;
 if v_attempt is null then return 0; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('lb-grid:'||v_attempt::text,0));
 select * into q from private.lb_grid_rounds where attempt_id=v_attempt for update;
 if not found or not q.start_valid or q.result_id is not null or q.completed_at is null
   or q.account_id<>r.account_id or q.student_id<>r.student_id or q.game_mode<>r.game_mode
 then return 0; end if;
 select * into a from public.multiplication_grid_attempts where id=v_attempt;
 if not found or a.status<>'completed' or a.account_id<>q.account_id
   or a.student_id<>q.student_id or a.game_mode<>q.game_mode
 then return 0; end if;
 v_rows=case r.game_mode when '5x5' then 5 when '5x12' then 5 when '12x12' then 12 when '15x15' then 15 end;
 v_cols=case r.game_mode when '5x5' then 5 when '5x12' then 12 when '12x12' then 12 when '15x15' then 15 end;
 if v_rows is null then return 0; end if;
 v_count=v_rows*v_cols;
 v_e=r.game_metadata->'gridEvidence';
 v_elapsed=extract(epoch from (q.completed_at-q.received_at))*1000;
 -- Preserve learning saves even when a round is ineligible for competition.
 if (r.verification_status='verified'
   and r.duration_ms>=greatest(v_count*8,2500)
   and r.duration_ms<=86400000 and r.duration_ms=a.duration_ms
   and v_elapsed>=0 and abs(r.duration_ms-v_elapsed)<=30000
   and r.created_at>=q.received_at and r.created_at<=q.completed_at+interval '1 hour'
   and r.correct_answers=v_count
   and r.incorrect_answers>=0
   and (r.anti_cheat_data->>'untrusted')::numeric=0
   and (r.anti_cheat_data->>'moves')::numeric>=greatest(5,floor(v_count*0.4))
   and coalesce((r.anti_cheat_data->>'paste')::boolean,false)=false
   and v_e @> jsonb_build_object('measurementVersion',1,'rows',v_rows,'cols',v_cols,
     'totalCells',v_count,'correctCells',v_count,'submittedCells',v_count,
     'completionBoundary','last_correct_input')
   and (v_e - array['attemptId','completionBoundary'])=a.evidence
   and (v_e->>'incorrectAttempts')::integer=r.incorrect_answers
 ) is not true then return 0; end if;
 -- The checkpoint contains cell evidence, not independently verified answer logs.
 -- Check every coordinate and count for consistency; do not claim bot-proof play.
 if jsonb_typeof(v_e->'cells')<>'array' then return 0; end if;
 if (select count(*)=v_count and count(distinct (c->>'row',c->>'column'))=v_count
       and bool_and(((c->>'row')::integer between 1 and v_rows)
         and ((c->>'column')::integer between 1 and v_cols)
         and (c->>'submissions')::integer>=1
         and jsonb_typeof(c->'firstCorrect')='boolean'
         and (c->>'incorrectAttempts')::integer>=0
         and (c->>'corrections')::integer>=0)
     from jsonb_array_elements(v_e->'cells') c) is not true then return 0; end if;
 -- One source result can claim a round. A second insert cannot replay it.
 update private.lb_grid_rounds set result_id=r.id where attempt_id=q.attempt_id;
 for v_target in select value from jsonb_array_elements(q.targets) order by value->>'board_id'
 loop
   select * into b from private.lb_boards where id=(v_target->>'board_id')::uuid for update;
   if not found or b.status<>'active' or b.scope not in ('organisation','class')
     or b.active_from>q.received_at or not (r.game_mode=any(b.variants))
     or not exists(select 1 from private.lb_games g where g.game_key=b.game_key and g.status='active')
     or not exists(select 1 from public.organisations o where o.id=b.organisation_id and o.status='active')
     or not exists(select 1 from public.organisation_enrolments en
       where en.id=(v_target->>'enrolment_id')::uuid and en.student_id=r.student_id
         and en.organisation_id=b.organisation_id and en.status='active' and en.ended_at is null
         and en.joined_at<=q.received_at)
   then continue; end if;
   if b.scope='class' and (not private.lb_has_class_access(b.organisation_id,b.game_key)
     or not exists(select 1 from public.organisation_group_students gs
       join public.organisation_groups g on g.id=gs.group_id and g.organisation_id=gs.organisation_id
       where gs.enrolment_id=(v_target->>'enrolment_id')::uuid
         and gs.organisation_id=b.organisation_id and gs.group_id=b.group_id
         and gs.ended_at is null and gs.joined_at<=q.received_at and g.status='active')
   ) then continue; end if;
   v_season=private.lb_ensure_season(
     b.id,date_trunc('month',q.completed_at at time zone 'America/Port_of_Spain')::date
   );
   select * into strict s from private.lb_seasons where id=v_season for update;
   if s.finalised_at is not null or statement_timestamp()>=s.finalise_after then continue; end if;
   insert into private.lb_entries(board_id,season_id,result_id,student_id,variant,category,
     metric,display_name,membership_snapshot,completed_at)
   values(b.id,s.id,r.id,r.student_id,r.game_mode,'all',r.duration_ms,q.display_name,
     v_target||jsonb_build_object('attempt_id',q.attempt_id,'captured_at',q.received_at,
       'rules_version',1,'timing_source','server_checkpoint_receipt'),q.completed_at)
   on conflict(board_id,result_id) do nothing;
   get diagnostics v_one=row_count; v_added=v_added+v_one;
 end loop;
 return v_added;
exception when invalid_text_representation or numeric_value_out_of_range
  or division_by_zero then return 0;
end $$;
revoke all on function private.lb_route_grid_result(uuid) from public,anon,authenticated;

create function private.lb_capture_grid_checkpoint()
returns trigger language plpgsql security definer set search_path='' as $$
declare v_targets jsonb; v_name text; v_valid boolean; v_result uuid;
begin
 if auth.uid() is distinct from new.account_id or not exists(
   select 1 from public.profiles p where p.id=new.account_id and p.account_status='active'
 ) or not exists(select 1 from public.account_student_links l
   join public.student_profiles sp on sp.id=l.student_id
   where l.account_id=new.account_id and l.student_id=new.student_id and l.can_play
     and sp.profile_status='active') then return new; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('lb-grid:'||new.id::text,0));
 if TG_OP='INSERT' then
   v_valid=new.status='in_progress' and new.duration_ms<=30000
     and abs(extract(epoch from (statement_timestamp()-new.started_at)))<=30;
   select left(coalesce(nullif(trim(sp.public_display_name),''),nullif(trim(sp.first_name),''),'Player'),80)
     into v_name from public.student_profiles sp where sp.id=new.student_id;
   select coalesce(jsonb_agg(jsonb_build_object('board_id',b.id,'organisation_id',b.organisation_id,
     'group_id',b.group_id,'enrolment_id',en.id)),'[]'::jsonb)
   into v_targets from private.lb_boards b
   join public.organisations o on o.id=b.organisation_id and o.status='active'
   join public.organisation_enrolments en on en.organisation_id=o.id
     and en.student_id=new.student_id and en.status='active' and en.ended_at is null
     and en.joined_at<=new.started_at and en.joined_at<=statement_timestamp()
   join private.lb_games gm on gm.game_key=b.game_key and gm.status='active'
   where b.game_key='multiplication' and b.scope in ('organisation','class') and b.status='active'
     and b.active_from<=new.started_at and b.active_from<=statement_timestamp()
     and new.game_mode=any(b.variants) and (b.scope='organisation' or (
       private.lb_has_class_access(b.organisation_id,b.game_key)
       and exists(select 1 from public.organisation_group_students gs
         join public.organisation_groups g on g.id=gs.group_id and g.organisation_id=gs.organisation_id
         where gs.enrolment_id=en.id and gs.group_id=b.group_id and gs.organisation_id=b.organisation_id
           and gs.joined_at<=new.started_at and gs.ended_at is null and g.status='active')));
   insert into private.lb_grid_rounds(attempt_id,account_id,student_id,game_mode,received_at,
     start_valid,display_name,targets)
   values(new.id,new.account_id,new.student_id,new.game_mode,statement_timestamp(),
     coalesce(v_valid,false),v_name,v_targets);
 end if;
 if new.status='completed' then
   update private.lb_grid_rounds set completed_at=statement_timestamp()
     where attempt_id=new.id and completed_at is null;
   -- Either HTTP request may arrive first. Both paths try the same idempotent route.
   for v_result in select r.id from public.game_results r
     where r.game_type='multiplication' and r.account_id=new.account_id and r.student_id=new.student_id
       and r.game_metadata #>> '{gridEvidence,attemptId}'=new.id::text
     order by r.created_at,r.id
   loop perform private.lb_route_grid_result(v_result); end loop;
 end if;
 return new;
end $$;
revoke all on function private.lb_capture_grid_checkpoint() from public,anon,authenticated;

create function private.lb_capture_grid_result()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.game_type='multiplication' then perform private.lb_route_grid_result(new.id); end if;
 return new;
end $$;
revoke all on function private.lb_capture_grid_result() from public,anon,authenticated;
create trigger lb_capture_grid_checkpoint after insert or update on public.multiplication_grid_attempts
 for each row execute function private.lb_capture_grid_checkpoint();
create trigger lb_capture_grid_result after insert on public.game_results
 for each row execute function private.lb_capture_grid_result();


do $test$
declare
 v_account uuid; v_student uuid; v_org uuid; v_enrol uuid; v_board uuid; v_group uuid; v_class uuid;
 v_attempt uuid; v_result uuid; v_second uuid; v_empty jsonb; v_full jsonb;
 v_initial integer; v_checks integer=0; v_error text; v_old_claim text;
begin
 v_old_claim=current_setting('request.jwt.claim.sub',true);
 select a.account_id,e.student_id,e.organisation_id,e.id,b.id into strict v_account,v_student,v_org,v_enrol,v_board
 from public.organisation_enrolments e
 join public.organisations o on o.id=e.organisation_id and lower(o.name) like '%spectrum%'
 join public.account_student_links a on a.student_id=e.student_id and a.can_play
 join public.profiles p on p.id=a.account_id and p.account_status='active'
 join public.student_profiles sp on sp.id=e.student_id and sp.profile_status='active'
 join private.lb_boards b on b.organisation_id=e.organisation_id and b.scope='organisation'
   and b.game_key='multiplication' and b.status='active' and '5x5'=any(b.variants)
 where e.status='active' and e.ended_at is null
 order by e.id limit 1;
 if has_table_privilege('authenticated','private.lb_grid_rounds','SELECT')
    or has_table_privilege('anon','private.lb_grid_rounds','SELECT')
    or has_function_privilege('authenticated','private.lb_route_grid_result(uuid)','EXECUTE')
    or has_function_privilege('anon','private.lb_route_grid_result(uuid)','EXECUTE')
 then raise exception 'Private connection privileges failed'; end if;
 v_checks=v_checks+1;
 select count(*) into v_initial from private.lb_entries;
 begin
 perform set_config('request.jwt.claim.sub',v_account::text,true);
 v_empty=jsonb_build_object('measurementVersion',1,'answerBoundary','enter_or_blur',
   'rows',5,'cols',5,'totalCells',25,'submittedCells',0,'firstCorrect',0,'firstIncorrect',0,
   'incorrectAttempts',0,'corrections',0,'correctCells',0,'cells','[]'::jsonb);
 select jsonb_build_object('measurementVersion',1,'answerBoundary','enter_or_blur',
   'rows',5,'cols',5,'totalCells',25,'submittedCells',25,'firstCorrect',25,'firstIncorrect',0,
   'incorrectAttempts',0,'corrections',0,'correctCells',25,'correctSubmissions',25,
   'cells',jsonb_agg(jsonb_build_object('row',rr,'column',cc,'submissions',1,
      'firstCorrect',true,'incorrectAttempts',0,'corrections',0))) into v_full
 from generate_series(1,5) rr cross join generate_series(1,5) cc;

 -- Completed checkpoint first, result second.
 v_attempt=gen_random_uuid(); v_result=gen_random_uuid();
 insert into public.multiplication_grid_attempts(id,account_id,student_id,game_mode,status,started_at,duration_ms,evidence)
 values(v_attempt,v_account,v_student,'5x5','in_progress',statement_timestamp(),0,v_empty);
 if not exists(select 1 from private.lb_grid_rounds q where attempt_id=v_attempt and start_valid
   and exists(select 1 from jsonb_array_elements(q.targets) t where t->>'board_id'=v_board::text))
 then raise exception 'Start snapshot missing'; end if; v_checks=v_checks+1;
 if (select count(*) from private.lb_entries)<>v_initial then raise exception 'Checkpoint became score'; end if;
 v_checks=v_checks+1;
 update public.multiplication_grid_attempts set status='completed',duration_ms=3000,evidence=v_full where id=v_attempt;
 if (select count(*) from private.lb_entries)<>v_initial then raise exception 'Completion without result became score'; end if;
 v_checks=v_checks+1;
 insert into public.game_results(id,student_id,account_id,game_type,game_mode,mode_label,duration_ms,
   correct_answers,incorrect_answers,submission_type,public_eligible,verification_status,anti_cheat_data,game_metadata)
 values(v_result,v_student,v_account,'multiplication','5x5','Connection smoke test',3000,25,0,'practice',false,'verified',
   '{"moves":25,"trusted":25,"untrusted":0,"paste":false}'::jsonb,
   jsonb_build_object('gridEvidence',v_full||jsonb_build_object('attemptId',v_attempt,'completionBoundary','last_correct_input')));
 if not exists(select 1 from private.lb_entries where result_id=v_result and board_id=v_board and category='all' and metric=3000)
 then raise exception 'Organisation result not routed'; end if; v_checks=v_checks+1;
 if private.lb_route_grid_result(v_result)<>0 then raise exception 'Retry not idempotent'; end if;
 v_checks=v_checks+1;
 v_second=gen_random_uuid();
 insert into public.game_results(id,student_id,account_id,game_type,game_mode,mode_label,duration_ms,
   correct_answers,incorrect_answers,submission_type,public_eligible,verification_status,anti_cheat_data,game_metadata)
 select v_second,student_id,account_id,game_type,game_mode,mode_label,duration_ms,
   correct_answers,incorrect_answers,submission_type,public_eligible,verification_status,anti_cheat_data,game_metadata
 from public.game_results where id=v_result;
 if exists(select 1 from private.lb_entries where result_id=v_second) then raise exception 'Round replay accepted'; end if;
 v_checks=v_checks+1;

 -- Result first, completed checkpoint second.
 v_attempt=gen_random_uuid(); v_second=gen_random_uuid();
 insert into public.multiplication_grid_attempts(id,account_id,student_id,game_mode,status,started_at,duration_ms,evidence)
 values(v_attempt,v_account,v_student,'5x5','in_progress',statement_timestamp(),0,v_empty);
 insert into public.game_results(id,student_id,account_id,game_type,game_mode,mode_label,duration_ms,
   correct_answers,incorrect_answers,submission_type,public_eligible,verification_status,anti_cheat_data,game_metadata)
 values(v_second,v_student,v_account,'multiplication','5x5','Connection smoke test',3000,25,0,'practice',false,'verified',
   '{"moves":25,"trusted":25,"untrusted":0,"paste":false}'::jsonb,
   jsonb_build_object('gridEvidence',v_full||jsonb_build_object('attemptId',v_attempt,'completionBoundary','last_correct_input')));
 if exists(select 1 from private.lb_entries where result_id=v_second) then raise exception 'Unfinished round accepted'; end if;
 v_checks=v_checks+1;
 update public.multiplication_grid_attempts set status='completed',duration_ms=3000,evidence=v_full where id=v_attempt;
 if not exists(select 1 from private.lb_entries where result_id=v_second and board_id=v_board)
 then raise exception 'Out-of-order completion not routed'; end if; v_checks=v_checks+1;

 -- A paused board cannot gain results by being resumed halfway through.
 update private.lb_boards set status='paused' where id=v_board;
 v_attempt=gen_random_uuid(); v_second=gen_random_uuid();
 insert into public.multiplication_grid_attempts(id,account_id,student_id,game_mode,status,started_at,duration_ms,evidence)
 values(v_attempt,v_account,v_student,'5x5','in_progress',statement_timestamp(),0,v_empty);
 update private.lb_boards set status='active' where id=v_board;
 update public.multiplication_grid_attempts set status='completed',duration_ms=3000,evidence=v_full where id=v_attempt;
 insert into public.game_results(id,student_id,account_id,game_type,game_mode,mode_label,duration_ms,
   correct_answers,incorrect_answers,submission_type,public_eligible,verification_status,anti_cheat_data,game_metadata)
 values(v_second,v_student,v_account,'multiplication','5x5','Connection smoke test',3000,25,0,'practice',false,'verified',
   '{"moves":25,"trusted":25,"untrusted":0,"paste":false}'::jsonb,
   jsonb_build_object('gridEvidence',v_full||jsonb_build_object('attemptId',v_attempt,'completionBoundary','last_correct_input')));
 if exists(select 1 from private.lb_entries where result_id=v_second and board_id=v_board)
 then raise exception 'Paused start was backfilled'; end if; v_checks=v_checks+1;

 -- Match the exact active class, enabled at both start and completion.
 select gs.group_id into strict v_group from public.organisation_group_students gs
 join public.organisation_groups g on g.id=gs.group_id and g.status='active'
 where gs.enrolment_id=v_enrol and gs.organisation_id=v_org and gs.ended_at is null limit 1;
 insert into private.lb_class_entitlements(organisation_id,game_key,status,starts_at,access_basis,reason,updated_by)
 values(v_org,'multiplication','active',statement_timestamp()-interval '1 day','complimentary','Rollback smoke test',v_account)
 on conflict(organisation_id,game_key) do update set status='active',starts_at=excluded.starts_at,expires_at=null;
 insert into private.lb_boards(game_key,scope,organisation_id,group_id,name,variants,status,active_from)
 values('multiplication','class',v_org,v_group,'Rollback test class',array['5x5'],'active',statement_timestamp()-interval '1 minute')
 returning id into v_class;
 v_attempt=gen_random_uuid(); v_second=gen_random_uuid();
 insert into public.multiplication_grid_attempts(id,account_id,student_id,game_mode,status,started_at,duration_ms,evidence)
 values(v_attempt,v_account,v_student,'5x5','in_progress',statement_timestamp(),0,v_empty);
 update public.multiplication_grid_attempts set status='completed',duration_ms=3000,evidence=v_full where id=v_attempt;
 insert into public.game_results(id,student_id,account_id,game_type,game_mode,mode_label,duration_ms,
   correct_answers,incorrect_answers,submission_type,public_eligible,verification_status,anti_cheat_data,game_metadata)
 values(v_second,v_student,v_account,'multiplication','5x5','Connection smoke test',3000,25,0,'practice',false,'verified',
   '{"moves":25,"trusted":25,"untrusted":0,"paste":false}'::jsonb,
   jsonb_build_object('gridEvidence',v_full||jsonb_build_object('attemptId',v_attempt,'completionBoundary','last_correct_input')));
 if (select count(*) from private.lb_entries where result_id=v_second and board_id in(v_board,v_class))<>2
 then raise exception 'Organisation plus class fanout failed'; end if; v_checks=v_checks+1;
 v_attempt=gen_random_uuid(); v_second=gen_random_uuid();
 insert into public.multiplication_grid_attempts(id,account_id,student_id,game_mode,status,started_at,duration_ms,evidence)
 values(v_attempt,v_account,v_student,'5x5','in_progress',statement_timestamp(),0,v_empty);
 update private.lb_class_entitlements set status='suspended' where organisation_id=v_org and game_key='multiplication';
 update public.multiplication_grid_attempts set status='completed',duration_ms=3000,evidence=v_full where id=v_attempt;
 insert into public.game_results(id,student_id,account_id,game_type,game_mode,mode_label,duration_ms,
   correct_answers,incorrect_answers,submission_type,public_eligible,verification_status,anti_cheat_data,game_metadata)
 values(v_second,v_student,v_account,'multiplication','5x5','Connection smoke test',3000,25,0,'practice',false,'verified',
   '{"moves":25,"trusted":25,"untrusted":0,"paste":false}'::jsonb,
   jsonb_build_object('gridEvidence',v_full||jsonb_build_object('attemptId',v_attempt,'completionBoundary','last_correct_input')));
 if exists(select 1 from private.lb_entries where result_id=v_second and board_id=v_class)
   or not exists(select 1 from private.lb_entries where result_id=v_second and board_id=v_board)
 then raise exception 'Class entitlement revocation failed'; end if; v_checks=v_checks+1;
 if exists(select 1 from private.lb_entries e join private.lb_boards b on b.id=e.board_id where b.scope='public' and e.student_id=v_student)
 then raise exception 'Automatic public publication'; end if; v_checks=v_checks+1;

 -- Force all fixtures and earned test badges to roll back.
 raise exception using errcode='Z0011',message='ROLLBACK_CONNECTION_FIXTURES';
 exception when sqlstate 'Z0011' then null;
 end;
 perform set_config('request.jwt.claim.sub',coalesce(v_old_claim,''),true);
 if (select count(*) from private.lb_entries)<>v_initial then raise exception 'Test scores survived rollback'; end if;
 v_checks=v_checks+1;
 if v_checks<>14 then raise exception 'Expected 14 connection checks, got %',v_checks; end if;
end $test$;
