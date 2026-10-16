import test from 'node:test';
import assert from 'node:assert/strict';
import { ordinalRank } from '../src/lib/leaderboardRanks.js';

test('ranks use the complete ordinal sequence, including teen exceptions', () => {
  for (const [rank, expected] of [[1,'1st'],[2,'2nd'],[3,'3rd'],[4,'4th'],[10,'10th'],[11,'11th'],[12,'12th'],[13,'13th'],[21,'21st'],[22,'22nd'],[23,'23rd'],[24,'24th'],[101,'101st'],[111,'111th'],[112,'112th'],[113,'113th']]) {
    assert.equal(ordinalRank(rank), expected);
  }
});
test('invalid ranks have no misleading placing', () => {
  for (const value of [null, undefined, 0, -1, 1.5, NaN, Infinity, 'unknown']) assert.equal(ordinalRank(value), '—');
});
