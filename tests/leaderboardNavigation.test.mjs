import test from 'node:test';
import assert from 'node:assert/strict';
import { leaderboardNavigationTarget } from '../src/lib/leaderboardNavigation.js';
import { LEARNER_LEADERBOARD_GAMES } from '../src/lib/learnerLeaderboards.js';

test('signed-in users open the board chooser and the separate Hall of Fame', () => {
  assert.equal(leaderboardNavigationTarget('/leaderboard', true), '/my-leaderboards');
  assert.equal(leaderboardNavigationTarget('/hall-of-fame', true), '/hall-of-fame');
  assert.equal(leaderboardNavigationTarget('/games', true), '/games');
});
test('signed-out visitors keep the public entry points', () => {
  assert.equal(leaderboardNavigationTarget('/leaderboard', false), '/leaderboard');
  assert.equal(leaderboardNavigationTarget('/hall-of-fame', false), '/hall-of-fame');
});
test('the game selector currently offers only the connected multiplication game', () => {
  assert.deepEqual(LEARNER_LEADERBOARD_GAMES.map(g => g.key), ['multiplication']);
  assert.equal(LEARNER_LEADERBOARD_GAMES[0].name, 'Multiplication Challenge');
});
