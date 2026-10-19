import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
const db=new PGlite();
const account='11111111-1111-4111-8111-111111111111',student='22222222-2222-4222-8222-222222222222';
const other='33333333-3333-4333-8333-333333333333';
const newId=()=>crypto.randomUUID();
await db.exec(`
create role anon; create role authenticated; create schema auth; create schema private;
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
grant usage on schema auth to authenticated,anon;grant execute on function auth.uid() to authenticated,anon;
create table public.profiles(id uuid primary key,account_status text);
create table public.student_profiles(id uuid primary key,profile_status text,public_display_name text,first_name text);
create table public.account_student_links(account_id uuid,student_id uuid,can_play boolean);
create table public.membership_plans(id uuid primary key,is_active boolean,entitlements jsonb);
create table public.student_memberships(student_id uuid,plan_id uuid,status text,is_current boolean,starts_at timestamptz,expires_at timestamptz);
insert into profiles values('${account}','active'),('${other}','active');
insert into student_profiles values('${student}','active','Test','Test');
insert into account_student_links values('${account}','${student}',true);
`);
await db.exec(await fs.readFile(new URL('../../tests/practiceResultTable.fixture.sql',import.meta.url),'utf8'));
await db.exec(`alter table game_results enable row level security;
grant select,insert on game_results to authenticated;
create policy own_read on game_results for select to authenticated using (account_id=auth.uid());
create policy protected_insert on game_results for insert to authenticated with check (game_type<>'multiplication_practice');`);
await db.exec(await fs.readFile(new URL('./practiceContext.fixture.sql',import.meta.url),'utf8'));
const file=(await fs.readdir(new URL('../../supabase/migrations/',import.meta.url))).find(x=>x.endsWith('_multiplication_practice_evidence_v2.sql'));
await db.exec(await fs.readFile(new URL('../../supabase/migrations/'+file,import.meta.url),'utf8'));
await db.exec(`revoke all on function private.current_multiplication_practice_context() from public;
revoke all on function public.save_multiplication_practice_round(integer,text,integer,integer,integer,integer) from public,anon;
grant execute on function public.save_multiplication_practice_round(integer,text,integer,integer,integer,integer) to authenticated;
select set_config('request.jwt.claim.sub','${account}',false);set role authenticated;`);
const facts=(range=12,mix=false)=>Array.from({length:range},(_,i)=>({factor:mix?range-i:i+1,position:i+1,firstTryCorrect:i!==0,incorrectSubmissions:i===0?2:0,eventuallyCorrect:true}));
const args=(over={})=>({table:2,mode:'build',range:12,duration:60000,attempt:newId(),account,student,facts:facts(),...over});
async function save(a=args()) {return (await db.query('select public.save_multiplication_practice_round_v2($1,$2,$3,$4,$5,$6,$7,$8::jsonb) as receipt',[a.table,a.mode,a.range,a.duration,a.attempt,a.account,a.student,JSON.stringify(a.facts)])).rows[0].receipt;}
const count=async()=>Number((await db.query('select count(*) as n from game_results')).rows[0].n);
async function bad(a,pattern){const before=await count();await assert.rejects(save(a),pattern);assert.equal(await count(),before);}

test('free learner persists canonical facts and server-derived aggregates',async()=>{
 const r=await save();const row=(await db.query('select * from game_results where id=$1',[r.resultId])).rows[0];
 assert.equal(row.correct_answers,11);assert.equal(row.incorrect_answers,1);assert.equal(Number(row.accuracy_percent),91.67);
 assert.equal(row.anti_cheat_data.incorrectAttempts,2);assert.equal(row.game_metadata.practiceEvidence.facts[0].expectedAnswer,2);
 assert.equal(row.game_metadata.practiceEvidence.facts[0].submissions,3);assert.equal(row.context_type,'personal');assert.equal(row.public_eligible,false);
});
test('same attempt retry returns identical receipt without another result',async()=>{const a=args(),r=await save(a),n=await count();assert.deepEqual(await save(a),r);assert.equal(await count(),n);await bad({...a,duration:59000},/PRACTICE_ATTEMPT_CONFLICT/);});
test('same ID with changed fact evidence is a conflict',async()=>{const a=args();await save(a);a.facts[0].incorrectSubmissions=3;await bad(a,/PRACTICE_ATTEMPT_CONFLICT/);});
test('personal best replacement, ties and slower results remain correct',async()=>{
 const r=await save(args({duration:50000}));assert.equal(r.isPersonalBest,true);assert.equal(r.previousBestDurationMs,60000);
 assert.equal((await save(args({duration:50000}))).isPersonalBest,false);assert.equal((await save(args({duration:70000}))).bestDurationMs,50000);
 assert.equal(Number((await db.query("select count(*) n from game_results where is_personal_best and game_mode='table_2_build_12'")).rows[0].n),1);
});
test('bad fact data cannot replace the personal best',async()=>{const a=args({duration:100});a.facts[0].eventuallyCorrect=false;await bad(a,/INVALID_FACT_EVIDENCE/);assert.equal((await db.query("select min(duration_ms) n from game_results where game_mode='table_2_build_12'")).rows[0].n,50000);});
test('free learner cannot save a member table',async()=>{await bad(args({table:7}),/MEMBERSHIP_REQUIRED/);});
test('active member can save a shuffled range-15 round',async()=>{
 await db.exec(`reset role;insert into membership_plans values('${other}',true,'{"multiplication_practice_all_tables":true}');insert into student_memberships values('${student}','${other}','active',true,now()-interval '1 day',now()+interval '1 day');set role authenticated;`);
 const r=await save(args({table:7,mode:'mix',range:15,facts:facts(15,true)}));const row=(await db.query('select game_metadata from game_results where id=$1',[r.resultId])).rows[0];assert.equal(row.game_metadata.practiceEvidence.facts[0].factor,15);assert.equal(row.game_metadata.practiceEvidence.facts[0].expectedAnswer,105);
});
for(const [key,pattern] of [['table',/INVALID_TABLE_NUMBER/],['mode',/INVALID_PRACTICE_MODE/],['range',/INVALID_RANGE_MAX/],['duration',/INVALID_DURATION/],['attempt',/INVALID_ATTEMPT_ID/]])test('null '+key+' rejected',()=>bad(args({[key]:null}),pattern));
for(const [name,change,pattern] of [
 ['missing fact',a=>a.facts.pop(),/INVALID_PRACTICE_EVIDENCE/],
 ['duplicate factor',a=>a.facts[1].factor=1,/INVALID_FACT_EVIDENCE/],
 ['duplicate position',a=>a.facts[1].position=1,/INVALID_FACT_EVIDENCE/],
 ['out of range',a=>a.facts[1].factor=16,/INVALID_FACT_EVIDENCE/],
 ['null field',a=>a.facts[0].incorrectSubmissions=null,/INVALID_FACT_EVIDENCE/],
 ['fractional field',a=>a.facts[0].incorrectSubmissions=1.5,/INVALID_FACT_EVIDENCE/],
 ['string field',a=>a.facts[0].factor='1',/INVALID_FACT_EVIDENCE/],
 ['missing boolean',a=>delete a.facts[0].firstTryCorrect,/INVALID_FACT_EVIDENCE/],
 ['unknown field',a=>a.facts[0].expectedAnswer=99,/INVALID_FACT_EVIDENCE/],
 ['wrong first-try flag',a=>a.facts[0].firstTryCorrect=true,/INVALID_FACT_EVIDENCE/],
 ['unfinished fact',a=>a.facts[1].eventuallyCorrect=false,/INVALID_FACT_EVIDENCE/],
 ['unordered Build',a=>{a.facts[0].factor=2;a.facts[1].factor=1},/INVALID_FACT_EVIDENCE/],
 ['too many errors',a=>a.facts[0].incorrectSubmissions=1001,/INVALID_FACT_EVIDENCE/],
 ['total errors overflow',a=>{a.facts[0].incorrectSubmissions=1000;a.facts[1].incorrectSubmissions=1;a.facts[1].firstTryCorrect=false},/INVALID_INCORRECT_ATTEMPTS/],
 ['SQL null facts',a=>a.facts=null,/INVALID_PRACTICE_EVIDENCE/],
 ['object facts',a=>a.facts={},/INVALID_PRACTICE_EVIDENCE/],
 ['huge payload',a=>a.facts[0].extra='x'.repeat(17000),/INVALID_PRACTICE_EVIDENCE/],
])test(name+' rejected atomically',async()=>{const a=args();change(a);await bad(a,pattern)});
test('SQL NULL fact payload is rejected',async()=>{await assert.rejects(db.query(`select public.save_multiplication_practice_round_v2(2,'build',12,60000,$1,$2,$3,null)`,[newId(),account,student]),/INVALID_PRACTICE_EVIDENCE/);});
test('account and learner mismatches rejected',async()=>{await bad(args({account:other}),/PRACTICE_IDENTITY_CHANGED/);await bad(args({student:other}),/PRACTICE_IDENTITY_CHANGED/);});
test('inactive account or absent playable profile cannot save',async()=>{
 await db.exec(`reset role;update profiles set account_status='inactive' where id='${account}';set role authenticated;`);await bad(args(),/PLAYABLE_PROFILE_REQUIRED/);
 await db.exec(`reset role;update profiles set account_status='active';set role authenticated;`);
});
test('metadata write failure rolls back the parent result and PB replacement',async()=>{
 await db.exec(`reset role;create function public.reject_test_evidence() returns trigger language plpgsql as $$ begin if new.game_metadata ? 'practiceEvidence' then raise exception 'TEST_METADATA_FAILURE'; end if; return new; end $$;create trigger reject_test_evidence before update on public.game_results for each row execute function public.reject_test_evidence();set role authenticated;`);
 await bad(args({duration:100}),/TEST_METADATA_FAILURE/);
 assert.equal(Number((await db.query("select count(*) n from game_results where is_personal_best and game_mode='table_2_build_12' and duration_ms=50000")).rows[0].n),1);
 await db.exec('reset role;drop trigger reject_test_evidence on public.game_results;drop function public.reject_test_evidence();set role authenticated;');
});
test('old aggregate endpoint remains usable and rejects null options',async()=>{
 const r=await db.query("select save_multiplication_practice_round(2,'build',12,90000,4,3) as r");assert.equal(r.rows[0].r.saved,true);
 await assert.rejects(db.query("select save_multiplication_practice_round(null,'build',12,90000,4,3)"),/INVALID_TABLE_NUMBER/);
 await assert.rejects(db.query("select get_multiplication_practice_best(2,null,12)"),/INVALID_PRACTICE_MODE/);
});
test('direct practice insert and update denied; another account cannot read evidence',async()=>{
 await assert.rejects(db.query("insert into game_results(student_id,account_id,game_type,game_mode,mode_label,duration_ms) values($1,$2,'multiplication_practice','x','x',10)",[student,account]),/row-level security/);
 await assert.rejects(db.query("update game_results set game_metadata='{}'"),/permission denied/);
 await db.query("select set_config('request.jwt.claim.sub',$1,false)",[other]);assert.equal(await count(),0);await db.query("select set_config('request.jwt.claim.sub',$1,false)",[account]);
});
test('anonymous role cannot execute V2; authenticated without uid is rejected',async()=>{
 await db.exec('reset role;set role anon;');await assert.rejects(save(),/permission denied/);
 await db.exec("reset role;set role authenticated;select set_config('request.jwt.claim.sub','',false);");await assert.rejects(save(),/SIGN_IN_REQUIRED/);
});
test.after(()=>db.close());
