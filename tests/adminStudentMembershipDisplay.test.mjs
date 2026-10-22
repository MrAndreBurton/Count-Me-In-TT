import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';

// Execute the real mapper, replacing only its accessControl import with a
// deterministic implementation of the application's is_current selection.
// No source files or database records are modified.
const mapperPath = resolve('src/utils/adminStudentMapper.js');
const source = readFileSync(mapperPath, 'utf8');
assert.match(source, /import\s*\{\s*getCurrentMembership\s*,?\s*\}\s*from\s*["']\.\/accessControl["'];?/);
const executable = source
  .replace(/import\s*\{\s*getCurrentMembership\s*,?\s*\}\s*from\s*["']\.\/accessControl["'];?/, '')
  .replace(/\bexport\s+(?=(?:async\s+)?function\b|const\b|let\b|class\b)/g, '');
const context = {
  getCurrentMembership: (memberships = []) =>
    (Array.isArray(memberships) ? memberships : []).find((item) => item.is_current === true) || null,
};
vm.runInNewContext(`${executable}\nthis.mapStudent = mapSupabaseStudentToAdminStudent;`, context, { filename: mapperPath });
const mapStudent = context.mapStudent;

function student(memberships, profileStatus = 'active') {
  return mapStudent({
    id: 'test-student', first_name: 'Test', last_name: 'Learner',
    profile_status: profileStatus, student_memberships: memberships,
    game_results: [],
  });
}
function membership(planKey, status = 'active', name = 'Test Plan', isCurrent = true) {
  return {
    id: `membership-${planKey ?? 'missing'}`, is_current: isCurrent,
    status, expires_at: '2026-12-31T00:00:00Z',
    membership_plans: planKey === null ? null : { plan_key: planKey, name },
  };
}

test('Free, Term and Annual current plans classify by plan key', () => {
  for (const [key, expected] of [['free', 'Free'], ['term', 'Term'], ['annual', 'Annual'], ['annual_12_months', 'Annual'], ['term_4_months', 'Term']]) {
    const result = student([membership(key)]);
    assert.equal(result.membershipCategory, expected, key);
    assert.equal(result.membershipStatus, 'Active');
  }
});

test('unknown plan remains Unknown rather than being shown as Free', () => {
  const result = student([membership('special_access')]);
  assert.equal(result.membershipCategory, 'Unknown');
  assert.equal(result.membership, 'Test Plan');
});

test('missing joined plan is Unknown Membership Plan', () => {
  const result = student([membership(null)]);
  assert.equal(result.membershipCategory, 'Unknown');
  assert.equal(result.membership, 'Unknown Membership Plan');
});

test('no current membership is None, not Free', () => {
  for (const memberships of [[], [membership('annual', 'expired', 'Annual', false)]]) {
    const result = student(memberships);
    assert.equal(result.membershipCategory, 'None');
    assert.equal(result.membershipId, null);
    assert.equal(result.membership, 'No Current Membership');
    assert.equal(result.membershipStatus, 'No Current Membership');
  }
});

test('membership status and student profile status remain independent', () => {
  const expired = student([membership('term', 'expired')], 'active');
  assert.equal(expired.membershipCategory, 'Term');
  assert.equal(expired.membershipStatus, 'Expired');
  assert.equal(expired.status, 'Active');

  const cancelled = student([membership('annual', 'cancelled')], 'inactive');
  assert.equal(cancelled.membershipCategory, 'Annual');
  assert.equal(cancelled.membershipStatus, 'Cancelled');
  assert.equal(cancelled.status, 'Inactive');
});

test('current record is selected instead of historical records', () => {
  const result = student([
    membership('annual', 'expired', 'Old Annual', false),
    membership('term', 'active', 'Current Term', true),
  ]);
  assert.equal(result.membershipCategory, 'Term');
  assert.equal(result.membership, 'Current Term');
});
