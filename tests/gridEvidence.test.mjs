import test from 'node:test';
import assert from 'node:assert/strict';
import { createGridEvidence, describeGridPersonalBest } from '../src/components/multiplication/gridEvidence.js';

const makeGrid = (rows = 5, cols = 5) => Array.from({ length: rows }, (_, r) =>
  Array.from({ length: cols }, (_, c) => ({ value: '', answer: (r + 1) * (c + 1) }))
);

test('typing a partial digit does not submit an answer or count an error', () => {
  const grid = makeGrid();
  const tracker = createGridEvidence(5, 5);
  tracker.edit(2, 3, '1');
  grid[2][3].value = '1';
  assert.equal(tracker.snapshot(grid).submittedCells, 0);
  assert.equal(tracker.snapshot(grid).incorrectAttempts, 0);
  tracker.edit(2, 3, '12');
  tracker.submit(2, 3, '12');
  assert.equal(tracker.snapshot(grid).firstCorrect, 1);
});

test('Enter followed by blur never double-counts an unchanged wrong answer', () => {
  const grid = makeGrid();
  const tracker = createGridEvidence(5, 5);
  tracker.submit(1, 2, '5');
  tracker.submit(1, 2, '5');
  assert.equal(tracker.snapshot(grid).incorrectAttempts, 1);
  tracker.submit(1, 2, '7');
  assert.equal(tracker.snapshot(grid).incorrectAttempts, 2);
  tracker.submit(1, 2, '6');
  assert.equal(tracker.snapshot(grid).corrections, 1);
  assert.equal(tracker.snapshot(grid).firstIncorrect, 1);
});

test('a newly edited wrong answer is a fresh attempt even if its digits match an earlier attempt', () => {
  const tracker = createGridEvidence(5, 5);
  tracker.submit(0, 0, '9');
  tracker.edit(0, 0, '');
  tracker.submit(0, 0, '');
  tracker.edit(0, 0, '9');
  tracker.submit(0, 0, '9');
  assert.equal(tracker.snapshot(makeGrid()).incorrectAttempts, 2);
});

test('empty cells have no accuracy measurement and do not count as errors', () => {
  const tracker = createGridEvidence(5, 5);
  tracker.submit(0, 0, '');
  const snapshot = tracker.snapshot(makeGrid());
  assert.equal(snapshot.firstEntryAccuracy, null);
  assert.equal(snapshot.incorrectAttempts, 0);
});

test('two missed cells, three errors and two corrections produce 92% first-entry accuracy', () => {
  const grid = makeGrid();
  const tracker = createGridEvidence(5, 5);
  tracker.submit(0, 0, '2');
  tracker.submit(0, 0, '3');
  tracker.submit(0, 0, '1');
  tracker.submit(1, 2, '5');
  tracker.submit(1, 2, '6');
  grid.forEach((row, r) => row.forEach((cell, c) => {
    cell.value = String(cell.answer);
    tracker.submit(r, c, cell.value);
  }));
  const snapshot = tracker.snapshot(grid);
  assert.equal(snapshot.firstEntryAccuracy, 92);
  assert.equal(snapshot.incorrectAttempts, 3);
  assert.equal(snapshot.corrections, 2);
  assert.equal(snapshot.correctCells, 25);
  assert.equal(snapshot.correctSubmissions, 25);
  assert.equal(snapshot.submissionAccuracy, 89.29);
});

test('later edits preserve the first response but still count later errors and corrections', () => {
  const tracker = createGridEvidence(5, 5);
  tracker.submit(0, 0, '1');
  tracker.submit(0, 0, '2');
  tracker.submit(0, 0, '1');
  const snapshot = tracker.snapshot(makeGrid());
  assert.equal(snapshot.firstEntryAccuracy, 100);
  assert.equal(snapshot.incorrectAttempts, 1);
  assert.equal(snapshot.correctSubmissions, 2);
  assert.equal(snapshot.corrections, 1);
});

test('each new round and every grid size has independent counters', () => {
  for (const [rows, cols] of [[5,5], [5,12], [12,12], [15,15]]) {
    const tracker = createGridEvidence(rows, cols);
    assert.equal(tracker.snapshot(makeGrid(rows, cols)).totalCells, rows * cols);
    assert.equal(tracker.snapshot(makeGrid(rows, cols)).incorrectAttempts, 0);
  }
});

test('personal bests distinguish improvement, first result, tie and slower result', () => {
  assert.match(describeGridPersonalBest({ previousBest: {duration_ms: 60500}, isPersonalBest: true }, 57080), /3.42 seconds/);
  assert.match(describeGridPersonalBest({ previousBest: {duration_ms: 10001}, isPersonalBest: true }, 10000), /0.001 seconds/);
  assert.match(describeGridPersonalBest({ previousBest: null, isPersonalBest: true }, 57080), /starting personal best/);
  assert.match(describeGridPersonalBest({ previousBest: {duration_ms: 57080}, isPersonalBest: false }, 57080), /matched/);
  assert.match(describeGridPersonalBest({ previousBest: {duration_ms: 57080}, isPersonalBest: false }, 60000), /57.08 seconds/);
});
