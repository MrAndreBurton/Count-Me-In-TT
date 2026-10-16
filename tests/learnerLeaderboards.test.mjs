import test from 'node:test';
import assert from 'node:assert/strict';
import { loadLearnerLeaderboards, learnerBoardSelection, learnerMonths } from '../src/lib/learnerLeaderboards.js';

const board = { id: 'school', name: 'School board', game_key: 'multiplication', scope: 'organisation', status: 'active', variants: ['5x5', '12x12'] };
const classBoard = { ...board, id: 'class', name: 'Class board', scope: 'class' };
const publicBoard = { ...board, id: 'public', name: 'Public board', scope: 'public' };
test('signed-out users never request private boards', async () => {
  const client = { auth: { getUser: async () => ({ data: { user: null }, error: null }) }, rpc: () => assert.fail('Private request while signed out') };
  assert.deepEqual(await loadLearnerLeaderboards(client), { status: 'signed_out', boards: [] });
});
test('authentication errors stop the private request', async () => {
  await assert.rejects(loadLearnerLeaderboards({ auth: { getUser: async () => ({ data: {}, error: new Error('Offline') }) } }), /Offline/);
});
test('protected API is the only board source, with no client-supplied student or organisation', async () => {
  const calls = [];
  const result = await loadLearnerLeaderboards({ auth: { getUser: async () => ({ data: { user: { id: 'learner' } }, error: null }) },
    rpc: async (name, payload) => { calls.push([name, payload]); return { data: [classBoard, board, { ...board, id: 'draft', status: 'draft' }], error: null }; } });
  assert.deepEqual(calls, [['leaderboard_api', { p_action: 'list_boards', p_payload: { game_key: 'multiplication' } }]]);
  assert.deepEqual(result.boards.map(b => b.id), ['school', 'class']);
});
test('access failures propagate instead of showing stale boards', async () => {
  await assert.rejects(loadLearnerLeaderboards({ auth: { getUser: async () => ({ data: { user: { id: 'learner' } } }) },
    rpc: async () => ({ data: null, error: new Error('Access changed') }) }), /Access changed/);
});
test('a forged board, grid or month URL cannot introduce an inaccessible board', () => {
  const result = learnerBoardSelection([board, classBoard, publicBoard], new URLSearchParams('board=other-school&grid=15x15&month=1900-01-01'));
  assert.equal(result.board.id, 'school'); assert.equal(result.grid, '5x5');
  assert.deepEqual(result.available.map(b => b.id), ['school', 'class']);
});
test('public and organisation results are always separate selections', () => {
  const result = learnerBoardSelection([board, classBoard, publicBoard], new URLSearchParams('audience=public&board=school&category=all'));
  assert.equal(result.board.id, 'public'); assert.equal(result.category, 'Primary');
  assert.deepEqual(result.available.map(b => b.id), ['public']);
  assert.equal(learnerBoardSelection([board], new URLSearchParams('audience=public')).board, null);
});
test('Hall of Fame deep links preserve board and grid; internal boards have no public category', () => {
  const result = learnerBoardSelection([board, classBoard], new URLSearchParams('board=class&grid=12x12&view=hall-of-fame&category=Secondary'));
  assert.equal(result.hall, true); assert.equal(result.board.id, 'class'); assert.equal(result.grid, '12x12'); assert.equal(result.category, 'all');
});
test('month choices contain valid known history and current month without future seasons', () => {
  assert.deepEqual(learnerMonths([{ month: '2026-09-01' }, { month: '2026-10-01' }, { month: '2026-11-01' }, { month: '2026-13-01' }, { month: 'bad' }], '2026-10-01'), ['2026-10-01', '2026-09-01']);
});
