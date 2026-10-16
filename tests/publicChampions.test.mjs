import test from 'node:test';
import assert from 'node:assert/strict';
import { featuredChampionMonth, loadChampionCatalogue, loadPublicChampionMonth, legacyHallDestination } from '../src/lib/publicChampions.js';
const board={id:'released',scope:'public',game_key:'multiplication',status:'active'};
const historical=['2026-09-01','2026-08-01','2025-12-01'];
function services(finalised=true){
 const calls=[];
 return {calls,publicService:{listBoards:async()=>[board],listSeasons:async()=>[{month:'2026-10-01',finalised_at:finalised?'2026-11-01T05:00:00Z':null}],getHallOfFame:async(id,p)=>{calls.push(['modern',id,p]);return [{display_name:'Champion',metric:42000}]}},archiveService:{listMonths:async()=>historical,getAwards:async p=>{calls.push(['legacy',p]);return [{display_name:'Reviewed champion',metric:43000}]}}};
}
test('featured month follows Trinidad midnight including January year change',()=>{
 assert.equal(featuredChampionMonth(new Date('2026-11-01T03:59:59Z')),'2026-09-01');
 assert.equal(featuredChampionMonth(new Date('2026-11-01T04:00:00Z')),'2026-10-01');
 assert.equal(featuredChampionMonth(new Date('2027-01-16T12:00:00Z')),'2026-12-01');
});
test('October features approved September legacy winners and excludes September from the archive',async()=>{
 const s=services();const cat=await loadChampionCatalogue(s.publicService,s.archiveService,new Date('2026-10-16T12:00:00Z'));
 assert.equal(cat.featured,'2026-09-01');assert.deepEqual(cat.archiveMonths,['2026-08-01','2025-12-01']);
 const result=await loadPublicChampionMonth(s.publicService,s.archiveService,cat,cat.featured);
 assert.equal(result.rows.length,12);assert.equal(result.legacy,true);assert.ok(s.calls.every(c=>c[0]==='legacy'));
});
test('November features confirmed October winners and moves September into the archive; December preserves October',async()=>{
 const s=services();let cat=await loadChampionCatalogue(s.publicService,s.archiveService,new Date('2026-11-16T12:00:00Z'));
 assert.equal(cat.featured,'2026-10-01');assert.equal(cat.archiveMonths[0],'2026-09-01');
 const result=await loadPublicChampionMonth(s.publicService,s.archiveService,cat,cat.featured);
 assert.equal(result.rows.length,12);assert.equal(result.legacy,false);assert.ok(s.calls.every(c=>c[0]==='modern'&&c[1]===board.id));
 cat=await loadChampionCatalogue(s.publicService,s.archiveService,new Date('2026-12-16T12:00:00Z'));
 assert.equal(cat.archiveMonths[0],'2026-10-01');
});
test('unfinalised seasons are never labelled champions or silently replaced by an older collection',async()=>{
 const s=services(false);const cat=await loadChampionCatalogue(s.publicService,s.archiveService,new Date('2026-11-01T04:00:00Z'));
 assert.deepEqual(await loadPublicChampionMonth(s.publicService,s.archiveService,cat,cat.featured),{rows:[],legacy:false,pending:true});assert.equal(s.calls.length,0);
});
test('legacy Hall of Fame links redirect without exposing private board identifiers on the public route',()=>{
 assert.equal(legacyHallDestination(new URLSearchParams('view=hall-of-fame&audience=public&board=old&month=2026-10-01')),'/hall-of-fame');
 const p=new URL('https://example.test'+legacyHallDestination(new URLSearchParams('view=hall-of-fame&board=private&grid=5x5')));
 assert.equal(p.pathname,'/hall-of-fame');assert.equal(p.searchParams.get('audience'),'organisation');assert.equal(p.searchParams.get('board'),'private');assert.equal(p.searchParams.has('view'),false);
});
test('archive and competition request failures propagate instead of mixing partial winners',async()=>{
 const s=services();s.archiveService.listMonths=async()=>{throw new Error('offline')};
 await assert.rejects(loadChampionCatalogue(s.publicService,s.archiveService),/offline/);
});
