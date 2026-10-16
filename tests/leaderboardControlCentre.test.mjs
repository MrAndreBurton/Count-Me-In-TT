import test from 'node:test';
import assert from 'node:assert/strict';
import { loadLeaderboardContext } from '../src/lib/leaderboardContext.js';
import {
  currentLeaderboardMonth, formatLeaderboardTime, trinidadInputToISO, trinidadDateTime,
  filterLeaderboardBoards, canManageLeaderboard,
} from '../src/lib/leaderboardPresentation.js';

function client({ user = { id: 'actor' }, userError = null, profile, staff, roles = [], organisation, tableError } = {}) {
  const calls = [];
  return {
    calls, auth: { async getUser() { return { data: { user }, error: userError }; } },
    from(table) {
      calls.push([table]);
      const result = { data: table === 'profiles' ? profile : table === 'organisation_staff' ? staff
        : table === 'organisation_staff_roles' ? roles.map(role => ({ role })) : organisation, error: tableError };
      const chain = {
        select() { return chain; },
        eq(field, value) { calls.push([table, field, value]); return chain; },
        is(field, value) { calls.push([table, field, value]); return chain; },
        maybeSingle() { return Promise.resolve(result); },
        then(resolve, reject) { return Promise.resolve(result).then(resolve, reject); },
      };
      return chain;
    },
  };
}
const active = { id: 'actor', account_status: 'active', admin_role: 'none' };
test('central control centre requires exact active superadmin', async () => {
  for (const role of ['admin', 'moderator', 'none']) {
    assert.equal((await loadLeaderboardContext(client({ profile: { ...active, admin_role: role } }))).status, 'forbidden');
  }
  assert.equal((await loadLeaderboardContext(client({ profile: { ...active, admin_role: 'super_admin' } }))).status, 'ready');
  assert.equal((await loadLeaderboardContext(client({ profile: { ...active, admin_role: 'super_admin', account_status: 'suspended' } }))).status, 'forbidden');
});
test('signed-out access stops before private profile queries; network errors propagate', async () => {
  const signedOut = client({ user: null });
  assert.equal((await loadLeaderboardContext(signedOut)).status, 'signed_out');
  assert.equal(signedOut.calls.length, 0);
  await assert.rejects(loadLeaderboardContext(client({ user: null, userError: { message: 'Network unavailable' } })));
});
test('organisation access requires its own active staff link and staff roles', async () => {
  assert.equal((await loadLeaderboardContext(client({ profile: active }), 'school-a')).status, 'forbidden');
  const fake = client({ profile: active, staff: { id: 'staff-a' }, roles: ['organisation_admin'],
    organisation: { id: 'school-a', name: 'School A' } });
  const context = await loadLeaderboardContext(fake, 'school-a');
  assert.equal(context.status, 'ready');
  assert.equal(context.isSuperadmin, false);
  assert.ok(fake.calls.some(c => c[0] === 'organisation_staff' && c[1] === 'organisation_id' && c[2] === 'school-a'));
  assert.ok(fake.calls.some(c => c[0] === 'organisation_staff' && c[1] === 'profile_id' && c[2] === 'actor'));
  assert.ok(fake.calls.some(c => c[0] === 'organisation_staff' && c[1] === 'ended_at' && c[2] === null));
});
test('teacher context is read-only; no-role staff and hidden organisations are refused', async () => {
  const data = { profile: active, staff: { id: 'teacher' }, roles: ['teacher'], organisation: { id: 'school-a' } };
  const context = await loadLeaderboardContext(client(data), 'school-a');
  assert.equal(context.status, 'ready');
  assert.equal(canManageLeaderboard(context, { can_manage: true, organisation_id: 'school-a', scope: 'organisation' }), false);
  assert.equal((await loadLeaderboardContext(client({ ...data, roles: [] }), 'school-a')).status, 'forbidden');
  assert.equal((await loadLeaderboardContext(client({ ...data, organisation: null }), 'school-a')).status, 'forbidden');
});
test('month rollover follows Trinidad time across a UTC boundary', () => {
  assert.equal(currentLeaderboardMonth(new Date('2026-11-01T03:59:59Z')), '2026-10-01');
  assert.equal(currentLeaderboardMonth(new Date('2026-11-01T04:00:00Z')), '2026-11-01');
});
test('time values and fixed Trinidad inputs format without dropping minutes', () => {
  assert.equal(formatLeaderboardTime(125670), '2:05.67');
  assert.equal(formatLeaderboardTime(5000), '0:05.00');
  assert.equal(formatLeaderboardTime(null), '—');
  assert.equal(trinidadInputToISO('2026-10-15T19:30'), '2026-10-15T23:30:00.000Z');
  assert.equal(trinidadDateTime('2026-10-15T23:30:00Z'), '2026-10-15T19:30');
  assert.throws(() => trinidadInputToISO('2026-02-30T19:30'));
});
test('organisation and board-type filters never broaden an organisation context', () => {
  const boards = [
    { id: 'a', game_key: 'multiplication', scope: 'organisation', organisation_id: 'school-a' },
    { id: 'ac', game_key: 'multiplication', scope: 'class', organisation_id: 'school-a' },
    { id: 'b', game_key: 'multiplication', scope: 'organisation', organisation_id: 'school-b' },
    { id: 'p', game_key: 'multiplication', scope: 'public' },
  ];
  const filters = { gameKey: 'multiplication', audience: 'organisation', organisationId: '', boardType: 'all' };
  assert.deepEqual(filterLeaderboardBoards(boards, filters, 'school-a').map(b => b.id), ['a', 'ac']);
  assert.deepEqual(filterLeaderboardBoards(boards, { ...filters, boardType: 'class' }, 'school-a').map(b => b.id), ['ac']);
  assert.deepEqual(filterLeaderboardBoards(boards, { ...filters, organisationId: 'school-b' }, 'school-a'), []);
});
test('organisation management requires matching authority and active class entitlement', () => {
  const context = { isSuperadmin: false, roles: ['organisation_admin'], organisation: { id: 'school-a' } };
  const board = { can_manage: true, scope: 'class', organisation_id: 'school-a', status: 'active' };
  assert.equal(canManageLeaderboard(context, board, { effective_status: 'expired' }), false);
  assert.equal(canManageLeaderboard(context, board, { effective_status: 'active' }), true);
  assert.equal(canManageLeaderboard(context, { ...board, organisation_id: 'school-b' }, { effective_status: 'active' }), false);
  assert.equal(canManageLeaderboard({ isSuperadmin: true }, board, null), true);
});
