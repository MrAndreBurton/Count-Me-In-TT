import test from 'node:test';
import assert from 'node:assert/strict';
import { championMonths, championYears, championMonthInYear, loadMonthlyChampions, loadArchivedMonthlyChampions } from '../src/lib/monthlyChampions.js';

test('year/month choices use only known seasons and preserve the month when available', () => {
 const months=['2025-09-01','2025-10-01','2026-09-01','2026-10-01','bad','2026-13-01','2026-10-01'];
 assert.deepEqual(championMonths(months),['2026-10-01','2026-09-01','2025-10-01','2025-09-01']);
 assert.deepEqual(championYears(months),['2026','2025']);
 assert.equal(championMonthInYear(months,'2026-09-01','2025'),'2025-09-01');
 assert.equal(championMonthInYear(['2025-08-01','2025-09-01'],'2026-10-01','2025'),'2025-09-01');
 assert.equal(championMonthInYear(months,'2026-10-01','2024'),'');
});
test('public monthly champions include all twelve partitions, keeping tied winners and repeat champions', async () => {
 const calls=[];
 const service={getHallOfFame:async(id,selection)=>{calls.push([id,selection]);return selection.variant==='5x5'&&selection.category==='Primary'
  ? [{display_name:'Joint A',metric:30000},{display_name:'Joint B',metric:30000}]
  : [{display_name:'Repeat champion',metric:45000}];}};
 const rows=await loadMonthlyChampions(service,{id:'public',scope:'public',variants:['5x5']},'2026-10-01');
 assert.equal(calls.length,12);assert.equal(rows.length,13);
 assert.equal(new Set(calls.map(([,s])=>s.variant+':'+s.category)).size,12);
 assert.ok(calls.every(([id,s])=>id==='public'&&s.month==='2026-10-01'));
 assert.equal(rows[0].display_name,'Joint A');assert.equal(rows[1].display_name,'Joint B');
 assert.equal(rows.filter(r=>r.display_name==='Repeat champion').length,11);
});
test('organisation/class monthly loads remain in their own board and all-learners category', async () => {
 for(const scope of ['organisation','class']){
  const calls=[];const rows=await loadMonthlyChampions({getHallOfFame:async(id,s)=>{calls.push([id,s]);return [{display_name:'Private champion',metric:40000}];}},{id:'private-board',scope},'2026-10-01');
  assert.equal(calls.length,4);assert.equal(rows.length,4);
  assert.ok(calls.every(([id,s])=>id==='private-board'&&s.category==='all'));
 }
});
test('archive monthly loads use only approved public award selections and preserve every returned winner', async () => {
 const calls=[];const rows=await loadArchivedMonthlyChampions({getAwards:async s=>{calls.push(s);return [{display_name:'Reviewed name',metric:60000,record_type:'legacy_reconstruction'}];}},'2025-09-01');
 assert.equal(calls.length,12);assert.equal(rows.length,12);assert.ok(rows.every(r=>r.record_type==='legacy_reconstruction'));
 assert.ok(calls.every(s=>Object.keys(s).sort().join(',')==='category,month,variant'&&s.month==='2025-09-01'));
});
test('one failed partition fails the complete month instead of silently omitting champions', async () => {
 await assert.rejects(loadMonthlyChampions({getHallOfFame:async(_id,s)=>{if(s.category==='Secondary')throw new Error('Access changed');return [];}},{id:'public',scope:'public'},'2026-10-01'),/Access changed/);
 await assert.rejects(loadArchivedMonthlyChampions({getAwards:async s=>{if(s.variant==='15x15')throw new Error('Offline');return [];}},'2025-09-01'),/Offline/);
});
