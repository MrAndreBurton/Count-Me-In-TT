import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const source = await fs.readFile(new URL('../src/components/multiplication/practice/practiceEvidence.js', import.meta.url), 'utf8');
const { createPracticeEvidence } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
const facts = (range=12, mix=false) => Array.from({length:range},(_,i)=>({factor:mix?range-i:i+1,answer:7*(mix?range-i:i+1)}));

test('typing and empty checks never create evidence submissions',()=>{
 const e=createPracticeEvidence(facts()); e.edit(0,'1'); e.edit(0,''); e.submit(0,'');
 assert.deepEqual(e.summary(),{incorrectAttempts:0,factsMissedFirstTry:0});
 assert.equal(e.snapshot()[0].firstTryCorrect,null);
});
test('unchanged checks count once; editing and resubmitting the same digits counts again',()=>{
 const e=createPracticeEvidence(facts());e.edit(0,'5');e.submit(0,'5');e.submit(0,'5');
 assert.equal(e.summary().incorrectAttempts,1);
 e.edit(0,'');e.edit(0,'5');e.submit(0,'5');
 assert.equal(e.summary().incorrectAttempts,2);
 e.edit(0,'7');e.submit(0,'7');e.submit(0,'7');
 assert.deepEqual(e.snapshot()[0],{factor:1,position:1,firstTryCorrect:false,incorrectSubmissions:2,eventuallyCorrect:true});
});
test('first response stays fixed; correct fact cannot advance or submit twice',()=>{
 const e=createPracticeEvidence(facts());assert.deepEqual(e.submit(0,'7'),{correct:true});
 e.edit(0,'5');assert.equal(e.submit(0,'5'),null);assert.equal(e.snapshot()[0].firstTryCorrect,true);
});
test('three missed facts and four errors aggregate from item evidence',()=>{
 const e=createPracticeEvidence(facts());
 for(const i of [5,7,11]){e.submit(i,'999');}
 e.submit(7,'998');
 for(let i=0;i<12;i++)e.submit(i,String(facts()[i].answer));
 assert.deepEqual(e.summary(),{incorrectAttempts:4,factsMissedFirstTry:3});
 assert.ok(e.snapshot().every(f=>f.eventuallyCorrect));
});
test('Build, Mix, range 15, replay and reset keep their own evidence and order',()=>{
 for(const range of [12,15])for(const mix of [false,true]){
  const f=facts(range,mix),e=createPracticeEvidence(f);e.submit(0,'999');
  assert.deepEqual(e.snapshot().map(x=>x.factor),f.map(x=>x.factor));
  assert.deepEqual(e.snapshot().map(x=>x.position),f.map((_,i)=>i+1));
  assert.equal(createPracticeEvidence(f).summary().incorrectAttempts,0);
 }
});
test('snapshots expose no wrong answer strings and are independent copies',()=>{
 const e=createPracticeEvidence(facts());e.submit(0,'999');const s=e.snapshot();s[0].incorrectSubmissions=100;
 assert.equal(e.snapshot()[0].incorrectSubmissions,1);assert.doesNotMatch(JSON.stringify(e.snapshot()),/999|revision|submittedRevision/);
});

const serviceSource=await fs.readFile(new URL('../src/services/multiplicationPracticeResults.js',import.meta.url),'utf8');
async function service(session, response={saved:true,durationMs:1000,bestDurationMs:1000,previousBestDurationMs:null}, rpcError=null) {
 const calls=[];globalThis.__practiceServiceMock={auth:{getSession:async()=>({data:{session},error:null})},rpc:async(name,args)=>{calls.push({name,args});return {data:response,error:rpcError};}};
 const url='data:text/javascript;base64,'+Buffer.from(serviceSource.replace('import { supabase } from "../lib/supabase";','const supabase=globalThis.__practiceServiceMock;')+'\n// '+Math.random()).toString('base64');
 return {api:await import(url),calls};
}
const result=()=>({tableNumber:7,mode:'mix',rangeMax:12,durationMs:1000,expectedIdentity:{accountId:'a',studentId:'s'},practiceEvidence:{attemptId:'attempt',facts:[]}});
test('guest makes no save RPC request',async()=>{const {api,calls}=await service(null);assert.equal((await api.saveMultiplicationPracticeRound(result())).saved,false);assert.equal(calls.length,0);});
test('changed account fails before RPC',async()=>{const {api,calls}=await service({user:{id:'other'}});await assert.rejects(api.saveMultiplicationPracticeRound(result()),/learner changed/);assert.equal(calls.length,0);});
test('registered save sends V2 evidence and captured identity without aggregate assertions',async()=>{const {api,calls}=await service({user:{id:'a'}});await api.saveMultiplicationPracticeRound(result());assert.equal(calls[0].name,'save_multiplication_practice_round_v2');assert.equal(calls[0].args.p_expected_student_id,'s');assert.ok(!('p_incorrect_attempts' in calls[0].args));assert.equal(calls.length,1);});

test('V2 RPC failure is surfaced without a legacy fallback',async()=>{const {api,calls}=await service({user:{id:'a'}},null,{code:'PGRST202',message:'V2 function is missing'});await assert.rejects(api.saveMultiplicationPracticeRound(result()),/V2 function is missing/);assert.equal(calls.length,1);assert.equal(calls[0].name,'save_multiplication_practice_round_v2');});
