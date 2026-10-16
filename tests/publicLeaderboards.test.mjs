import test from 'node:test';
import assert from 'node:assert/strict';
import { createPublicLeaderboardService } from '../src/services/publicLeaderboardService.js';
import { loadPublicLeaderboards, publicLeaderboardParams } from '../src/lib/publicLeaderboards.js';
import { learnerBoardSelection, learnerMonths } from '../src/lib/learnerLeaderboards.js';

const board = { id: 'public', scope: 'public', game_key: 'multiplication', name: 'CountMeInTT', status: 'active', variants: ['5x5', '5x12', '12x12', '15x15'] };
test('guests load only released public boards without authentication or profile queries', async () => {
  const calls = [];
  const client = { rpc: async (...args) => { calls.push(args); return { data: [board], error: null }; } };
  assert.deepEqual(await loadPublicLeaderboards(createPublicLeaderboardService(client)), [board]);
  assert.deepEqual(calls, [['public_leaderboard_api', { p_action: 'list_boards', p_payload: { game_key: 'multiplication' } }]]);
});
test('draft, private and unsupported games never enter the public selector', async () => {
  const service = { listBoards: async () => [board, { ...board, status: 'paused', id: 'paused' },
    { ...board, status: 'draft' }, { ...board, scope: 'organisation' }, { ...board, game_key: 'other' }] };
  assert.deepEqual((await loadPublicLeaderboards(service)).map(b => b.id), ['public', 'paused']);
});
test('public requests include only board and competition selections, never identity or organisation claims', async () => {
  const calls = [];
  const service = createPublicLeaderboardService({ rpc: async (...args) => { calls.push(args); return { data: [], error: null }; } });
  await service.listSeasons('public');
  for (const variant of board.variants) for (const category of ['Primary', 'Secondary', 'NoSchool']) {
    await service.getStandings('public', { month: '2026-10-01', variant, category, student_id: 'forged', organisation_id: 'private' });
  }
  await service.getHallOfFame('public', { month: '2026-10-01', variant: '12x12', category: 'Secondary' });
  assert.equal(calls.length, 14);
  assert.ok(calls.every(([name]) => name === 'public_leaderboard_api'));
  assert.deepEqual(calls[0][1], { p_action: 'list_seasons', p_payload: { board_id: 'public' } });
  assert.deepEqual(calls[13][1], { p_action: 'hall_of_fame', p_payload: { board_id: 'public', month: '2026-10-01', variant: '12x12', category: 'Secondary' } });
  for (const [, args] of calls) assert.ok(Object.keys(args.p_payload).every(k => ['board_id', 'month', 'variant', 'category'].includes(k)));
  assert.equal(typeof service.createBoard, 'undefined');
  assert.equal(typeof service.submit, 'undefined');
});
test('public load and results failures propagate rather than retaining old results', async () => {
  const service = createPublicLeaderboardService({ rpc: async () => ({ data: null, error: new Error('Offline') }) });
  await assert.rejects(loadPublicLeaderboards(service), /Offline/);
  await assert.rejects(service.getStandings('public', {}), /Offline/);
});
test('public URLs cannot select an organisation or mix category and grid partitions', () => {
  const original = new URLSearchParams('audience=organisation&board=private&grid=unknown&category=all&view=hall-of-fame');
  const selection = learnerBoardSelection([board, { ...board, scope: 'organisation', id: 'private' }], publicLeaderboardParams(original));
  assert.equal(original.get('audience'), 'organisation');
  assert.equal(selection.board.id, 'public'); assert.equal(selection.category, 'Primary');
  assert.equal(selection.grid, '5x5'); assert.equal(selection.hall, true);
  for (const grid of board.variants) for (const category of ['Primary', 'Secondary', 'NoSchool']) {
    const selected = learnerBoardSelection([board], publicLeaderboardParams(new URLSearchParams({ grid, category, month: '2026-10-01' })));
    assert.equal(selected.grid, grid); assert.equal(selected.category, category);
  }
});
test('unreleased boards have a clear empty selection and no old history is invented', () => {
  assert.equal(learnerBoardSelection([], publicLeaderboardParams(new URLSearchParams())).board, null);
  assert.deepEqual(learnerMonths([{ month: '2026-10-01' }, { month: '2026-11-01' }], '2026-10-01'), ['2026-10-01']);
});
test('Hall of Fame entry defaults to champions while preserving selections and allowing the results toggle', () => {
  const params = new URLSearchParams('grid=15x15&category=NoSchool&month=2026-10-01');
  const hall = learnerBoardSelection([board], publicLeaderboardParams(params, true));
  assert.equal(hall.hall, true); assert.equal(hall.grid, '15x15'); assert.equal(hall.category, 'NoSchool');
  assert.equal(publicLeaderboardParams(params, true).get('month'), '2026-10-01');
  params.set('view', 'leaderboard');
  assert.equal(learnerBoardSelection([board], publicLeaderboardParams(params, true)).hall, false);
});
