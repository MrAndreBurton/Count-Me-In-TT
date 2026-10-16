import test from 'node:test';
import assert from 'node:assert/strict';
import { createPublicScoreSubmissionService, publicResultDestination } from '../src/services/publicScoreSubmission.js';
test('new submissions send only a saved result reference and chosen display name',async()=>{
 const calls=[];const service=createPublicScoreSubmissionService({rpc:async(...args)=>{calls.push(args);return {data:{status:'submitted'},error:null};}});
 await service.status('saved-result');await service.submit('saved-result','Chosen alias');
 assert.deepEqual(calls,[['public_score_submission',{p_action:'status',p_payload:{result_id:'saved-result'}}],['public_score_submission',{p_action:'submit',p_payload:{result_id:'saved-result',display_name:'Chosen alias'}}]]);
 assert.ok(!JSON.stringify(calls).includes('student_id'));assert.ok(!JSON.stringify(calls).includes('duration_ms'));
});
test('submission failures propagate so the UI never claims an unconfirmed success',async()=>{
 const service=createPublicScoreSubmissionService({rpc:async()=>({data:null,error:new Error('Access changed')})});
 await assert.rejects(service.status('result'),/Access changed/);await assert.rejects(service.submit('result','Name'),/Access changed/);
});
test('success opens the signed-in public chooser with the submitted grid, category and month',()=>{
 const url=publicResultDestination({month:'2026-10-01',variant:'12x12',category:'Secondary'});
 const [path,search]=url.split('?');assert.equal(path,'/my-leaderboards');
 assert.deepEqual(Object.fromEntries(new URLSearchParams(search)),{audience:'public',game:'multiplication',grid:'12x12',category:'Secondary',month:'2026-10-01'});
});
