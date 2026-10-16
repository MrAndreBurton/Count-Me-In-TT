import test from 'node:test';
import assert from 'node:assert/strict';
import { loadChampionAccess, championCollectionSelection, championCollectionPath, loadCollectionCatalogue, loadCollectionMonth } from '../src/lib/hallOfFameCollections.js';
const org={id:'org-board',scope:'organisation',game_key:'multiplication',status:'active',name:'Spectrum Masters',organisation_id:'spectrum',organisation_name:'Spectrum Academy',variants:['5x5']};
const cls={...org,id:'class-board',scope:'class',group_name:'Class A',class_access_active:false};
const pub={...org,id:'public',scope:'public'};
const now=new Date('2026-12-16T12:00:00Z');
const publicService={listBoards:async()=>[pub]};
function client(session=true){return {auth:{getSession:async()=>({data:{session:session?{user:{id:'learner'}}:null}}),getUser:async()=>({data:{user:{id:'learner'}}})}}}
test('guests load public collections without private profile, board or authentication lookups',async()=>{
 const c=client(false);c.auth.getUser=()=>{throw new Error('must not run')};
 const a=await loadChampionAccess(c,publicService,{listBoards:()=>{throw new Error('must not run')}});
 assert.equal(a.privateStatus,'signed_out');assert.deepEqual(a.privateBoards,[]);assert.deepEqual(a.publicBoards,[pub]);
});
test('registered users receive only supported protected organisation and class boards',async()=>{
 const calls=[];const a=await loadChampionAccess(client(),publicService,{listBoards:async f=>{calls.push(f);return [org,cls,pub,{...org,id:'draft',status:'draft'},{...org,id:'other-game',game_key:'other'}]}});
 assert.equal(a.userId,'learner');assert.deepEqual(a.privateBoards.map(b=>b.id),['org-board','class-board']);assert.deepEqual(calls,[{game_key:'multiplication'}]);
});
test('auth and protected-board failures clear private collections while leaving public reads separate',async()=>{
 const c=client();c.auth.getUser=async()=>({data:{user:null},error:new Error('expired')});
 let a=await loadChampionAccess(c,publicService,{listBoards:()=>{throw new Error('must not run')}});
 assert.equal(a.privateStatus,'error');assert.deepEqual(a.privateBoards,[]);
 a=await loadChampionAccess(client(),publicService,{listBoards:async()=>{throw new Error('denied')}});
 assert.equal(a.privateStatus,'error');assert.deepEqual(a.publicBoards,[pub]);
});
test('forged board URLs never choose another private organisation or public collection',()=>{
 const a={privateStatus:'ready',privateBoards:[org,cls],publicError:false};
 const bad=championCollectionSelection(a,new URLSearchParams('audience=organisation&board=forged'));
 assert.equal(bad.audience,'organisation');assert.equal(bad.permitted,false);assert.equal(bad.board,null);
 const selected=championCollectionSelection(a,new URLSearchParams('audience=organisation&board=class-board'));
 assert.equal(selected.board,cls);assert.equal(selected.permitted,true);
 assert.equal(championCollectionSelection({...a,privateStatus:'signed_out',privateBoards:[]},new URLSearchParams('audience=organisation&board=org-board')).permitted,false);
});
test('featured/archive links preserve the exact private board and keep public paths free of private claims',()=>{
 const s={audience:'organisation',board:cls};
 assert.equal(championCollectionPath(true,s),'/hall-of-fame/archive?audience=organisation&board=class-board');
 assert.equal(championCollectionPath(false,s),'/hall-of-fame?audience=organisation&board=class-board');
 assert.equal(championCollectionPath(true,{audience:'public'}),'/hall-of-fame/archive');
});
test('private archives use only their own confirmed seasons; inactive paid classes retain confirmed history',async()=>{
 const calls=[];const services={publicService:{listBoards:()=>{throw new Error('wrong service')}},archiveService:{listMonths:()=>{throw new Error('legacy data must stay public')}},privateService:{listSeasons:async id=>{calls.push(id);return [{month:'2026-11-01',finalised_at:'yes'},{month:'2026-10-01',finalised_at:'yes'},{month:'2026-09-01',finalised_at:null}]},getHallOfFame:async(id,p)=>{calls.push([id,p]);return [{display_name:'Private champion',metric:42000}]}}};
 const s={audience:'organisation',board:cls,permitted:true};
 const cat=await loadCollectionCatalogue(services,{},s,now);assert.deepEqual(cat.archiveMonths,['2026-10-01']);assert.deepEqual(cat.historical,[]);
 const result=await loadCollectionMonth(services,s,cat,'2026-10-01');assert.equal(result.rows.length,4);assert.equal(result.legacy,false);
 assert.ok(calls.slice(1).every(([id,p])=>id==='class-board'&&p.category==='all'&&p.month==='2026-10-01'));
});
test('private collections never award provisional or missing seasons',async()=>{
 const services={privateService:{listSeasons:async()=>[{month:'2026-11-01',finalised_at:null}],getHallOfFame:()=>{throw new Error('must not load provisional awards')}}};
 const s={audience:'organisation',board:org,permitted:true};const cat=await loadCollectionCatalogue(services,{},s,now);
 assert.deepEqual(await loadCollectionMonth(services,s,cat,cat.featured),{rows:[],legacy:false,pending:true});assert.deepEqual(cat.archiveMonths,[]);
 await assert.rejects(loadCollectionCatalogue(services,{}, {...s,permitted:false},now),/unavailable/);
});
test('private champion failures propagate without falling back to public winners',async()=>{
 const services={privateService:{getHallOfFame:async()=>{throw new Error('permission changed')}},publicService:{getHallOfFame:()=>{throw new Error('wrong service')}}};
 await assert.rejects(loadCollectionMonth(services,{audience:'organisation',board:org,permitted:true},{confirmed:['2026-11-01']},'2026-11-01'),/permission changed/);
});
