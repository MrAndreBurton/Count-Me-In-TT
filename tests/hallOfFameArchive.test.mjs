import test from 'node:test';
import assert from 'node:assert/strict';
import { createHallOfFameArchiveService } from '../src/services/hallOfFameArchiveService.js';
test('public archive reads use only the archive endpoint and competition selections', async () => {
 const calls=[];const service=createHallOfFameArchiveService({rpc:async(...args)=>{calls.push(args);return {data:[],error:null};}});
 await service.listMonths();
 await service.getAwards({month:'2025-10-01',variant:'5x5',category:'Primary',student_id:'forged',organisation_id:'private'});
 assert.deepEqual(calls,[['hall_of_fame_archive_api',{p_action:'list_months',p_payload:{}}],['hall_of_fame_archive_api',{p_action:'awards',p_payload:{month:'2025-10-01',variant:'5x5',category:'Primary'}}]]);
});
test('archive review uses its guarded admin API with a specific record, display name and reason', async () => {
 const calls=[];const service=createHallOfFameArchiveService({rpc:async(...args)=>{calls.push(args);return {data:{saved:true},error:null};}});
 await service.listReview();await service.review({candidateId:'record',status:'approved',displayName:'Chosen alias',reason:'Reviewed',admin_role:'super_admin'});
 assert.deepEqual(calls,[['hall_of_fame_archive_admin',{p_action:'list_review',p_payload:{}}],['hall_of_fame_archive_admin',{p_action:'review',p_payload:{candidate_id:'record',status:'approved',display_name:'Chosen alias',reason:'Reviewed'}}]]);
});
test('archive failures propagate and cannot be presented as successful reviews or empty history', async () => {
 const service=createHallOfFameArchiveService({rpc:async()=>({data:null,error:new Error('Access changed')})});
 await assert.rejects(service.listMonths(),/Access changed/);await assert.rejects(service.listReview(),/Access changed/);
 await assert.rejects(service.review({}),/Access changed/);
});
