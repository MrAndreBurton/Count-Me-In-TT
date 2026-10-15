import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { createGridEvidence, buildGridTableGuidance } from '../src/components/multiplication/gridEvidence.js';

const grid = () => Array.from({length: 5}, (_, r) => Array.from({length: 5}, (_, c) => ({value: '', answer: (r+1)*(c+1)})));
function finishRound(id, missed = null, durations = [1000,1000,1000,1000,1000]) {
  const board = grid();
  const tracker = createGridEvidence(5, 5);
  let now = 10000;
  board.forEach((row, r) => row.forEach((cell, c) => {
    tracker.focus(r, c, now);
    now += durations[r];
    if (missed === r + 1 && c === 0) tracker.submit(r, c, '999', now);
    cell.value = String(cell.answer);
    tracker.submit(r, c, cell.value, now);
    now += 10000; // Deliberately long time outside cells: must not count.
  }));
  return {...tracker.snapshot(board, now), attemptId: id};
}

test('focus moves charge each table only for the time its cells are focused', () => {
  const tracker = createGridEvidence(5, 5);
  const board = grid();
  tracker.focus(0,0,1000);
  tracker.focus(1,0,3000);
  tracker.blur(1,0,6000);
  const snapshot = tracker.snapshot(board,50000);
  assert.equal(snapshot.tables[0].focusedTimeMs,2000);
  assert.equal(snapshot.tables[1].focusedTimeMs,3000);
});

test('pausing excludes hidden-tab and unfocused-window time', () => {
  const tracker = createGridEvidence(5,5);
  tracker.focus(1,0,1000);
  tracker.pause(2000);
  tracker.focus(1,0,50000);
  tracker.pause(51000);
  assert.equal(tracker.snapshot(grid(),90000).tables[1].focusedTimeMs,2000);
});

test('checkpoints read the current focus interval without counting it twice', () => {
  const tracker=createGridEvidence(5,5);
  tracker.focus(0,0,1000);
  assert.equal(tracker.snapshot(grid(),2000).tables[0].focusedTimeMs,1000);
  assert.equal(tracker.snapshot(grid(),3000).tables[0].focusedTimeMs,2000);
  tracker.blur(0,0,4000);
  assert.equal(tracker.snapshot(grid(),10000).tables[0].focusedTimeMs,3000);
});

test('a correct submission ends timing, while a wrong submission includes correction thinking', () => {
  const tracker=createGridEvidence(5,5);
  tracker.focus(1,2,1000);
  tracker.submit(1,2,'5',2000);
  tracker.submit(1,2,'6',4000);
  assert.equal(tracker.snapshot(grid(),9000).tables[1].focusedTimeMs,3000);
});

test('table times exclude the gaps between rows and use the same number of facts', () => {
  const round=finishRound('round',null,[1000,2000,3000,4000,5000]);
  assert.equal(round.tables[0].focusedTimeMs,5000);
  assert.equal(round.tables[0].averageFactMs,1000);
  assert.equal(round.tables[4].averageFactMs,5000);
  assert.equal(round.tables[0].timedFacts,5);
});

test('errors take priority over pace, with an ordered practice suggestion', () => {
  const guidance=buildGridTableGuidance(finishRound('current',3,[1000,1000,500,1000,1000]));
  assert.equal(guidance.recommended.tableNumber,3);
  assert.equal(guidance.practiceMode,'build');
  assert.equal(guidance.provisional,true);
  assert.equal(guidance.reason,'errors');
  // A fast but inaccurate table is not described as the quickest accurate one.
  assert.notEqual(guidance.fastest?.tableNumber,3);
});

test('an accurate but slower table suggests shuffled practice; small timing differences do not', () => {
  const guidance=buildGridTableGuidance(finishRound('current',null,[1000,1000,1000,1000,2000]));
  assert.equal(guidance.recommended.tableNumber,5);
  assert.equal(guidance.practiceMode,'mix');
  assert.equal(guidance.reason,'pace');
  assert.equal(buildGridTableGuidance(finishRound('similar',null,[1000,1000,1000,1000,1100])).recommended,null);
});

test('three comparable rounds strengthen the suggestion; different grids and duplicate attempts are excluded', () => {
  const current=finishRound('c',3);
  const previous=finishRound('p',3);
  const second=finishRound('q',3);
  const wrongGrid={...finishRound('wrong',2),cols:12};
  const guidance=buildGridTableGuidance(current,[current,wrongGrid,previous,second]);
  assert.equal(guidance.rounds,3);
  assert.equal(guidance.provisional,false);
  assert.equal(guidance.recommended.incorrectAttempts,3);
});

test('insufficient timing coverage does not produce a pace recommendation', () => {
  const round=finishRound('untimed');
  round.tables=round.tables.map(table=>({...table,timedFacts:0,focusedTimeMs:0}));
  const guidance=buildGridTableGuidance(round);
  assert.equal(guidance.fastest,null);
  assert.equal(guidance.recommended,null);
});

test('practice query selection is validated against the existing choices', () => {
  const source=readFileSync(new URL('../src/pages/MultiplicationPractice.jsx',import.meta.url),'utf8');
  const fn=source.slice(source.indexOf('function readPracticeSelection('),source.indexOf('export default function MultiplicationPractice'));
  const context={URLSearchParams,PRACTICE_TABLES:Array.from({length:12},(_,i)=>i+1),PRACTICE_RANGES:[12,15],PRACTICE_MODES:{build:{},mix:{}}};
  vm.createContext(context);vm.runInContext(fn+'\nglobalThis.read=readPracticeSelection;',context);
  assert.equal(context.read('?table=7&mode=mix&range=15').table,7);
  assert.equal(context.read('?table=7&mode=mix&range=15').mode,'mix');
  assert.equal(context.read('?table=7&mode=mix&range=15').range,15);
  assert.equal(context.read('?table=99&mode=constructor&range=2').table,2);
  assert.equal(context.read('?table=99&mode=constructor&range=2').mode,'build');
  assert.equal(context.read('?table=99&mode=constructor&range=2').range,12);
});
