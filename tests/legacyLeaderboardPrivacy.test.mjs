import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import {
  ENABLE_TOP_PLAYERS, ENABLE_PUBLIC_LEADERBOARD_SUBMISSIONS,
  WEBHOOKS, SHEET_URLS, getSheetUrls,
} from '../src/components/multiplication/gameConfig.js';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const game = read('src/components/multiplication/CoreGame.jsx');

test('legacy public data sources and top-player panels are disconnected', () => {
  assert.equal(ENABLE_TOP_PLAYERS, false);
  assert.equal(ENABLE_PUBLIC_LEADERBOARD_SUBMISSIONS, false);
  assert.deepEqual(WEBHOOKS, {});
  assert.deepEqual(SHEET_URLS, {});
  for (const mode of ['5x5', '5x12', '12x12', '15x15']) {
    assert.deepEqual(getSheetUrls(mode), {});
  }
});

test('completion form blocks default submission; public sharing uses its protected component', async () => {
  const start = game.indexOf('  const handleSubmit =');
  const end = game.indexOf('  const gridPresentation =', start);
  assert.ok(start >= 0 && end > start);
  let prevented = false;
  const context = vm.createContext({
    ENABLE_PUBLIC_LEADERBOARD_SUBMISSIONS,
    // No form, account, fetch or webhook globals: any access would fail.
  });
  vm.runInContext(game.slice(start, end) + '\nglobalThis.submit = handleSubmit;', context);
  await context.submit({ preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  assert.doesNotMatch(game.slice(start, end), /fetch\(|WEBHOOKS|formData/);
  assert.match(game, /<PublicScoreSubmission/);
});

test('all legacy school route families resolve to the data-free notice', () => {
  const routes = read('src/CountMeInApp.jsx');
  for (const prefix of ['stx', 'sjg', 'sjb']) {
    assert.ok(routes.includes('path="/' + prefix + '/*" element={<SchoolsPicker />}'));
  }
  assert.doesNotMatch(routes, /schoolFilter=|classFilter=/);
  assert.ok(routes.includes('path="/schools"'));
});

test('public leaderboard entry pages contain no legacy fetches or school records', () => {
  for (const path of ['src/Leaderboard.jsx', 'src/HallOfFame.jsx', 'src/SchoolsPicker.jsx']) {
    const source = read(path);
    assert.match(source, path === 'src/SchoolsPicker.jsx' ? /LeaderboardUnavailable/ : /PublicLeaderboards/);
    assert.doesNotMatch(source, /fetch\(|docs\.google\.com|script\.google\.com|schoolFilter/);
  }
  const notice = read('src/components/leaderboards/LeaderboardUnavailable.jsx');
  assert.doesNotMatch(notice, /fetch\(|docs\.google\.com|script\.google\.com/);
});
