import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
const source=await fs.readFile(new URL('../src/components/multiplication/practice/practiceConfig.js',import.meta.url),'utf8');
const {PRACTICE_TABLES,FREE_PRACTICE_TABLES,createPracticeFacts}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const extras=[13,14,15,20,25,50];
test('selector includes exactly 1–15,20,25,50 in ascending order',()=>assert.deepEqual(PRACTICE_TABLES,[...Array.from({length:15},(_,i)=>i+1),20,25,50]));
test('free tables remain 1,2,5,10; additions require membership',()=>{assert.deepEqual([...FREE_PRACTICE_TABLES],[1,2,5,10]);assert.ok(extras.every(n=>!FREE_PRACTICE_TABLES.has(n)));});
for(const tableNumber of extras)for(const rangeMax of [12,15])for(const mode of ['build','mix'])test('×'+tableNumber+' '+mode+' up to '+rangeMax,()=>{
 const facts=createPracticeFacts({tableNumber,rangeMax,mode});assert.equal(facts.length,rangeMax);
 assert.deepEqual(facts.map(f=>f.factor).sort((a,b)=>a-b),Array.from({length:rangeMax},(_,i)=>i+1));
 assert.ok(facts.every(f=>f.tableNumber===tableNumber&&f.answer===tableNumber*f.factor&&String(f.answer).length<=3));
 if(mode==='build')assert.equal(facts[0].factor,1);
});
test('unsupported tables stay rejected, including 16–19 and 21',()=>{
 for(const tableNumber of [null,0,-1,16,17,18,19,21,24,26,49,51,100,1.5])assert.throws(()=>createPracticeFacts({tableNumber,rangeMax:12,mode:'build'}));
});
test('practice query handoff accepts new tables and keeps range validation',async()=>{
 const page=await fs.readFile(new URL('../src/pages/MultiplicationPractice.jsx',import.meta.url),'utf8');
 const fn=page.slice(page.indexOf('function readPracticeSelection'),page.indexOf('export default function'));
 const ctx={URLSearchParams,PRACTICE_TABLES,PRACTICE_RANGES:[12,15],PRACTICE_MODES:{build:{},mix:{}}};vm.createContext(ctx);vm.runInContext(fn,ctx);
 for(const table of extras){const result=ctx.readPracticeSelection('?table='+table+'&mode=mix&range=15');assert.equal(result.table,table);assert.equal(result.range,15);assert.equal(result.mode,'mix');}
 assert.equal(ctx.readPracticeSelection('?table=16').table,2);
});
test('grid recommendation uses the shared supported-table list',async()=>{
 const core=await fs.readFile(new URL('../src/components/multiplication/CoreGame.jsx',import.meta.url),'utf8');
 assert.match(core,/PRACTICE_TABLES\.includes\(target\.tableNumber\)/);
 assert.doesNotMatch(core,/target\.tableNumber <= 12/);
});
