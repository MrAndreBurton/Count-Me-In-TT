import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { createGridEvidence, describeGridPersonalBest } from '../src/components/multiplication/gridEvidence.js';

const source = readFileSync(new URL('../src/components/multiplication/CoreGame.jsx', import.meta.url), 'utf8');
const completion = source.slice(source.indexOf('  const checkCompletion ='), source.indexOf('  const markCorrectCell ='));
const change = source.slice(source.indexOf('  const handleCellChange ='), source.indexOf('  const handleKeyDown ='));

for (const [rows, cols] of [[5, 5], [5, 12], [12, 12], [15, 15]]) {
  test(rows + 'x' + cols + ': last correct digit stops and saves once, without Enter or blur', async () => {
    let now = 5000;
    let stopped = false;
    let elapsed = null;
    const saves = [];
    const checkpoints = [];
    const rowIndex = 2;
    const columnIndex = 3; // The last answer is in the middle, not the final cell.
    const grid = Array.from({length: rows}, (_, r) => Array.from({length: cols}, (_, c) => ({
      answer: (r + 1) * (c + 1),
      value: r === rowIndex && c === columnIndex ? '' : String((r + 1) * (c + 1)),
      correct: r === rowIndex && c === columnIndex ? null : true,
    })));
    const tracker = createGridEvidence(rows, cols);
    grid.forEach((row, r) => row.forEach((cell, c) => tracker.submit(r, c, cell.value)));
    const context = {
      Date: { now: () => now }, console,
      completedRef: {current: false},
      roundRef: {current: {id: 'test-round', startedMs: 1000, identity: {userId: 'account', profileId: 'student'}}},
      gridRef: {current: grid}, evidenceRef: {current: tracker},
      antiRef: {current: {finish() { now += 7; return {}; }}},
      isSuspiciousRun: () => false,
      resetCurrentRun() { throw Error('Unexpected reset'); },
      alert() { throw Error('Unexpected alert'); },
      checkpointRound(status, at) { checkpoints.push({status, at}); },
      clearCheckpointTimer() {},
      setCompleted(value) { stopped = value; },
      timerRef: {current: 123},
      clearInterval(id) { assert.equal(id, 123); },
      setElapsed(value) { elapsed = value; },
      setRoundSummary() {}, setFocusedCell() {}, setProfileSaveStatus() {}, setProfileSaveMessage() {},
      setGrid() {}, beginRound() {}, setShowForm() {},
      async saveMultiplicationResult(payload) { saves.push(payload); return {guest: true}; },
      gridPresetId: rows + 'x' + cols, rows, cols, describeGridPersonalBest,
      window: {setTimeout() {}},
    };
    vm.createContext(context);
    vm.runInContext(completion + change + '\nglobalThis.typeAnswer = handleCellChange;', context);
    context.typeAnswer({target: {value: '1'}}, rowIndex, columnIndex);
    assert.equal(stopped, false);
    assert.equal(saves.length, 0);
    assert.equal(tracker.snapshot(context.gridRef.current).incorrectAttempts, 0);
    now = 6000;
    context.typeAnswer({target: {value: '12'}}, rowIndex, columnIndex);
    assert.equal(stopped, true);
    assert.equal(elapsed, 5000); // Input time, not later processing or network time.
    assert.equal(saves.length, 1);
    assert.equal(saves[0].durationMs, 5000);
    assert.equal(saves[0].gridEvidence.submittedCells, rows * cols);
    assert.equal(saves[0].gridEvidence.firstEntryAccuracy, 100);
    assert.equal(saves[0].gridEvidence.completionBoundary, 'last_correct_input');
    assert.deepEqual(checkpoints, [{status: 'completed', at: 6000}]);
    // Extra input after completion cannot create a duplicate result.
    context.typeAnswer({target: {value: '12'}}, rowIndex, columnIndex);
    assert.equal(saves.length, 1);
    await Promise.resolve();
  });
}
