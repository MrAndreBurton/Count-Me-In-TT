import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';import {PGlite} from '@electric-sql/pglite';
const db=new PGlite();const account='11111111-1111-4111-8111-111111111111',student='22222222-2222-4222-8222-222222222222',plan='33333333-3333-4333-8333-333333333333';const extras=[13,14,15,20,25,50];
await db.exec(`create role authenticated;create role anon;create schema auth;create schema private;
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
create table profiles(id uuid,account_status text);create table student_profiles(id uuid,profile_status text,public_display_name text,first_name text);create table account_student_links(account_id uuid,student_id uuid,can_play boolean);create table membership_plans(id uuid,is_active boolean,entitlements jsonb);create table student_memberships(student_id uuid,plan_id uuid,status text,is_current boolean,starts_at timestamptz,expires_at timestamptz);
insert into profiles values('${account}','active');insert into student_profiles values('${student}','active','Test','Test');insert into account_student_links values('${account}','${student}',true);
select set_config('request.jwt.claim.sub','${account}',false);`);
for(const f of ['resultTable','context','legacySave','v2Save','best'])await db.exec(await fs.readFile(new URL(f+'.fixture.sql',import.meta.url),'utf8'));
const signatures=["save_multiplication_practice_round(integer,text,integer,integer,integer,integer)","save_multiplication_practice_round_v2(integer,text,integer,integer,uuid,uuid,uuid,jsonb)","get_multiplication_practice_best(integer,text,integer)"];
for(const fn of signatures)await db.exec('revoke all on function public.'+fn+' from public,anon;grant execute on function public.'+fn+' to authenticated;');
const before=(await db.query("select proname,proacl::text,prosecdef,proconfig from pg_proc where oid=any($1::regprocedure[])",[signatures])).rows;
const migrationName=(await fs.readdir(new URL('../../supabase/migrations/',import.meta.url))).find(n=>n.endsWith('_multiplication_practice_extra_tables.sql'));
const migration=await fs.readFile(new URL('../../supabase/migrations/'+migrationName,import.meta.url),'utf8');await db.exec(migration);
const facts=(table,range,mode)=>Array.from({length:range},(_,i)=>({factor:mode==='mix'?range-i:i+1,position:i+1,firstTryCorrect:i!==0,incorrectSubmissions:i===0?1:0,eventuallyCorrect:true}));
async function save(table,range=12,mode='build',duration=60000,attempt=crypto.randomUUID()) {return (await db.query('select public.save_multiplication_practice_round_v2($1,$2,$3,$4,$5,$6,$7,$8::jsonb) r',[table,mode,range,duration,attempt,account,student,JSON.stringify(facts(table,range,mode))])).rows[0].r;}
async function best(table,range=12,mode='build') {return (await db.query('select public.get_multiplication_practice_best($1,$2,$3) r',[table,mode,range])).rows[0].r;}
test('migration preserves existing privileges, definer and search_path',async()=>{const after=(await db.query("select proname,proacl::text,prosecdef,proconfig from pg_proc where oid=any($1::regprocedure[])",[signatures])).rows;assert.deepEqual(after,before);});
test('new tables require membership for save and best lookup',async()=>{for(const n of extras){await assert.rejects(save(n),/MEMBERSHIP_REQUIRED/);await assert.rejects(best(n),/MEMBERSHIP_REQUIRED/);}});
test('original free tables still save',async()=>{for(const n of [1,2,5,10])assert.equal((await save(n)).saved,true);});
test('members can save every new table in both modes and lengths, including 750',async()=>{
 await db.exec(`insert into membership_plans values('${plan}',true,'{"multiplication_practice_all_tables":true}');insert into student_memberships values('${student}','${plan}','active',true,now()-interval '1 day',null);`);
 for(const n of extras)for(const range of [12,15])for(const mode of ['build','mix']){
  const receipt=await save(n,range,mode);assert.equal(receipt.saved,true);assert.equal(receipt.gameMode,`table_${n}_${mode}_${range}`);
  const row=(await db.query('select game_metadata from game_results where id=$1',[receipt.resultId])).rows[0];assert.equal(row.game_metadata.practiceEvidence.version,2);assert.equal(row.game_metadata.practiceEvidence.facts.length,range);assert.ok(row.game_metadata.practiceEvidence.facts.some(f=>f.expectedAnswer===n*range));
  assert.equal((await best(n,range,mode)).bestDurationMs,60000);
 }
});
test('new-table PB improvement and retries remain isolated',async()=>{const id=crypto.randomUUID();const r=await save(50,15,'mix',50000,id);assert.equal(r.previousBestDurationMs,60000);assert.equal(r.isPersonalBest,true);assert.deepEqual(await save(50,15,'mix',50000,id),r);assert.equal((await best(50,12,'mix')).bestDurationMs,60000);});
test('legacy save endpoint also accepts expanded tables for members',async()=>{const r=await db.query("select public.save_multiplication_practice_round(25,'build',12,70000,1,1) r");assert.equal(r.rows[0].r.saved,true);});
test('unsupported and null tables remain rejected in all endpoints',async()=>{for(const n of [null,0,16,17,18,19,21,24,26,49,51]){await assert.rejects(save(n),/INVALID_TABLE_NUMBER/);await assert.rejects(best(n),/INVALID_TABLE_NUMBER/);await assert.rejects(db.query("select public.save_multiplication_practice_round($1,'build',12,60000,0,0)",[n]),/INVALID_TABLE_NUMBER/);}});
test('reapplying the targeted migration is safe',async()=>{await db.exec(migration);assert.equal((await best(50,15,'mix')).bestDurationMs,50000);});
test.after(()=>db.close());
