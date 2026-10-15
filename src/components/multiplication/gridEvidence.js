// Measurement version 1: count only explicit submissions or cell exits.
export function createGridEvidence(rows, cols) {
  const cells = new Map();
  let focused = null;
  const keyFor = (row, col) => row + '-' + col;
  const getCell = (row, col) => {
    const key = keyFor(row, col);
    if (!cells.has(key)) cells.set(key, {
      row: row + 1, column: col + 1, value: '', revision: 0,
      submittedRevision: -1, submissions: 0, incorrectAttempts: 0,
      corrections: 0, firstCorrect: null, lastCorrect: null, focusedMs: 0,
    });
    return cells.get(key);
  };

  const focusedTime = (cell, row, col, at) => cell.focusedMs + (
    focused?.key === keyFor(row, col) ? Math.max(0, at - focused.since) : 0
  );

  return {
    focus(row, col, at = Date.now()) {
      if (focused?.key === keyFor(row, col)) return;
      this.pause(at);
      getCell(row, col);
      focused = { key: keyFor(row, col), row, col, since: at };
    },
    pause(at = Date.now()) {
      if (!focused) return;
      getCell(focused.row, focused.col).focusedMs += Math.max(0, at - focused.since);
      focused = null;
    },
    blur(row, col, at = Date.now()) {
      if (focused?.key === keyFor(row, col)) this.pause(at);
    },
    edit(row, col, value) {
      const cell = getCell(row, col);
      if (cell.value !== value) {
        cell.value = value;
        cell.revision += 1;
      }
    },
    submit(row, col, value, at = Date.now()) {
      this.edit(row, col, value);
      const cell = getCell(row, col);
      const correct = value !== '' && Number(value) === (row + 1) * (col + 1);
      if (correct) this.blur(row, col, at);
      if (!value || cell.submittedRevision === cell.revision) return false;
      if (cell.firstCorrect === null) cell.firstCorrect = correct;
      if (!correct) cell.incorrectAttempts += 1;
      if (correct && cell.lastCorrect === false) cell.corrections += 1;
      cell.lastCorrect = correct;
      cell.submissions += 1;
      cell.submittedRevision = cell.revision;
      return true;
    },
    snapshot(grid, at = Date.now()) {
      const submitted = [...cells.values()].filter(cell => cell.submissions > 0);
      const firstCorrect = submitted.filter(cell => cell.firstCorrect).length;
      const firstIncorrect = submitted.length - firstCorrect;
      const submissions = submitted.reduce((sum, cell) => sum + cell.submissions, 0);
      const incorrectAttempts = submitted.reduce((sum, cell) => sum + cell.incorrectAttempts, 0);
      const correctSubmissions = submissions - incorrectAttempts;
      const correctCells = grid.flat().filter(cell =>
        cell.value !== '' && Number(cell.value) === cell.answer
      ).length;
      const tables = Array.from({length: rows}, (_, rowIndex) => {
        const rowCells = [...cells.values()].filter(cell => cell.row === rowIndex + 1);
        const answered = rowCells.filter(cell => cell.submissions > 0);
        const correctFirst = answered.filter(cell => cell.firstCorrect).length;
        const timeMs = rowCells.reduce((sum, cell) => sum + focusedTime(cell, rowIndex, cell.column - 1, at), 0);
        const timedFacts = answered.filter(cell => focusedTime(cell, rowIndex, cell.column - 1, at) > 0).length;
        return {
          tableNumber: rowIndex + 1, factorMax: cols,
          submittedCells: answered.length,
          firstCorrect: correctFirst, firstIncorrect: answered.length - correctFirst,
          firstEntryAccuracy: answered.length ? Number(((correctFirst / answered.length) * 100).toFixed(2)) : null,
          incorrectAttempts: answered.reduce((sum, cell) => sum + cell.incorrectAttempts, 0),
          corrections: answered.reduce((sum, cell) => sum + cell.corrections, 0),
          correctCells: grid[rowIndex].filter(cell => cell.value !== '' && Number(cell.value) === cell.answer).length,
          focusedTimeMs: Math.round(timeMs), timedFacts,
          averageFactMs: timedFacts ? Math.round(timeMs / timedFacts) : null,
        };
      });
      return {
        measurementVersion: 1,
        timingVersion: 1,
        timingMeaning: 'focused_cell_time_after_first_digit_including_thinking',
        tables,
        answerBoundary: 'enter_or_blur',
        support: 'ordered_grid_visible_fact_prompts',
        rows, cols, totalCells: rows * cols,
        submittedCells: submitted.length,
        firstCorrect, firstIncorrect,
        firstEntryAccuracy: submitted.length
          ? Number(((firstCorrect / submitted.length) * 100).toFixed(2)) : null,
        submissions,
        correctSubmissions,
        submissionAccuracy: submissions
          ? Number(((correctSubmissions / submissions) * 100).toFixed(2)) : null,
        incorrectAttempts,
        corrections: submitted.reduce((sum, cell) => sum + cell.corrections, 0),
        correctedCells: submitted.filter(cell => cell.corrections > 0).length,
        correctCells,
        filledCells: grid.flat().filter(cell => cell.value !== '').length,
        cells: submitted.map(cell => ({
          row: cell.row, column: cell.column,
          firstCorrect: cell.firstCorrect,
          submissions: cell.submissions,
          incorrectAttempts: cell.incorrectAttempts,
          corrections: cell.corrections,
          focusedTimeMs: Math.round(focusedTime(cell, cell.row - 1, cell.column - 1, at)),
        })),
      };
    },
  };
}

export function formatGridDuration(milliseconds) {
  const totalMs = Math.max(0, Math.round(milliseconds));

  const minutes = Math.floor(totalMs / 60000);
  const remainingMs = totalMs % 60000;

  const wholeSeconds = Math.floor(remainingMs / 1000);
  const fractionalMs = remainingMs % 1000;

  let seconds = String(wholeSeconds);

  if (fractionalMs > 0) {
    const fraction = String(fractionalMs)
      .padStart(3, "0")
      .replace(/0+$/, "");

    seconds = seconds + "." + fraction;
  }

  const secondLabel =
    remainingMs === 1000 ? "second" : "seconds";

  if (minutes === 0) {
    return seconds + " " + secondLabel;
  }

  const minuteLabel =
    minutes === 1 ? "minute" : "minutes";

  if (remainingMs === 0) {
    return minutes + " " + minuteLabel;
  }

  return (
    minutes +
    " " +
    minuteLabel +
    " " +
    seconds +
    " " +
    secondLabel
  );
}

export function describeGridPersonalBest(outcome, durationMs) {
  const previous = outcome.previousBest?.duration_ms;

  if (previous === null || previous === undefined) {
    return (
      "First completed result saved. Your starting personal best is " +
      formatGridDuration(durationMs) +
      "."
    );
  }

  const previousMs = Number(previous);

  if (outcome.isPersonalBest && previousMs > durationMs) {
    const improvementMs = previousMs - durationMs;

    return (
      "New personal best! You improved by " +
      formatGridDuration(improvementMs) +
      " (" +
      formatGridDuration(previousMs) +
      " to " +
      formatGridDuration(durationMs) +
      ")."
    );
  }

  if (previousMs === durationMs) {
    return (
      "You matched your personal best of " +
      formatGridDuration(previousMs) +
      "."
    );
  }

  return (
    "Result saved. Your personal best for this grid is " +
    formatGridDuration(previousMs) +
    "."
  );
}

// These are practice suggestions, not classifications of independent recall.
export function buildGridTableGuidance(current, previous = []) {
  const seen = new Set(current.attemptId ? [current.attemptId] : []);
  const comparable = previous.filter(item => {
    if (!item || item.rows !== current.rows || item.cols !== current.cols ||
        item.support !== current.support || item.timingVersion !== current.timingVersion ||
        item.correctCells !== item.totalCells || !Array.isArray(item.tables)) return false;
    if (item.attemptId && seen.has(item.attemptId)) return false;
    if (item.attemptId) seen.add(item.attemptId);
    return true;
  }).slice(0, 2);
  const rounds = [current, ...comparable];
  const tables = current.tables.map(table => {
    const records = rounds.map(round => round.tables.find(row => row.tableNumber === table.tableNumber)).filter(Boolean);
    const sum = key => records.reduce((total, row) => total + (Number(row[key]) || 0), 0);
    const submittedCells = sum('submittedCells');
    const firstCorrect = sum('firstCorrect');
    const timedFacts = sum('timedFacts');
    const focusedTimeMs = sum('focusedTimeMs');
    const expected = current.cols * records.length;
    const timingAvailable = timedFacts >= Math.ceil(expected * 0.8) && focusedTimeMs > 0;
    return {
      tableNumber: table.tableNumber, factorMax: current.cols,
      rounds: records.length, submittedCells, firstCorrect,
      firstIncorrect: sum('firstIncorrect'),
      firstEntryAccuracy: submittedCells ? Number(((firstCorrect / submittedCells) * 100).toFixed(2)) : null,
      incorrectAttempts: sum('incorrectAttempts'), corrections: sum('corrections'),
      focusedTimeMs, timedFacts, timingAvailable,
      averageFactMs: timingAvailable ? Math.round(focusedTimeMs / timedFacts) : null,
    };
  });
  const eligible = tables.filter(table => table.submittedCells === current.cols * rounds.length);
  const timed = eligible.filter(table => table.timingAvailable).sort((a, b) => a.averageFactMs - b.averageFactMs);
  const accurateTimed = timed.filter(table => table.incorrectAttempts === 0);
  const fastest = accurateTimed.length && (accurateTimed.length === 1 || accurateTimed[0].averageFactMs < accurateTimed[1].averageFactMs)
    ? accurateTimed[0] : null;
  const needsCorrection = eligible.filter(table => table.incorrectAttempts > 0).sort((a, b) =>
    (b.firstIncorrect / b.submittedCells) - (a.firstIncorrect / a.submittedCells) ||
    (b.incorrectAttempts / b.submittedCells) - (a.incorrectAttempts / a.submittedCells) ||
    a.tableNumber - b.tableNumber
  );
  let recommended = needsCorrection[0] || null;
  let reason = recommended ? 'errors' : null;
  if (!recommended && timed.length >= 2) {
    const slowest = timed[timed.length - 1];
    // A product heuristic to avoid flagging tiny timing differences as weakness.
    if (slowest.averageFactMs > timed[0].averageFactMs * 1.2) {
      recommended = slowest;
      reason = 'pace';
    }
  }
  return {
    rounds: rounds.length,
    provisional: rounds.length < 3,
    tables, fastest, recommended, reason,
    practiceMode: reason === 'errors' ? 'build' : 'mix',
  };
}
