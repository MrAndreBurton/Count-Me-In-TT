import React, { useState, useEffect, useRef } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
} from 'react-router-dom';
import SchoolsPicker from "./SchoolsPicker";
import Leaderboard from './Leaderboard';
import HallOfFame from "./HallOfFame";

// -------------------- Anti-cheat module (inserted) --------------------
function createAntiCheat(gridId) {
  const perfNow = () => (typeof performance !== "undefined" ? performance.now() : Date.now());
  let startedAt = Date.now();
  let last = perfNow();
  const deltas = [];
  let trusted = 0;
  let untrusted = 0;
  let moves = 0;
  let paste = false;
  let vkPresses = 0;

  const bump = (isEvtTrusted) => {
    const now = perfNow();
    deltas.push(Math.max(0, now - last));
    last = now;
    moves++;
    if (isEvtTrusted) trusted++; else untrusted++;
  };

  const onKeyDown = (e) => {
    const k = e.key || "";
    if (/^\d$/.test(k) || k === "Backspace" || k === "Delete" || k === "Enter" || k === "Tab") {
      bump(!!e.isTrusted);
    }
  };

  const onInput = (nativeEvt) => {
    const isEvtTrusted =
      nativeEvt && typeof nativeEvt.isTrusted === "boolean" ? nativeEvt.isTrusted : false;
    bump(isEvtTrusted);
  };

  const onPaste = (e) => {
    paste = true;
    e.preventDefault();
  };

  const onVirtualKey = () => {
    bump(true);
    vkPresses++;
  };

  const finish = () => {
    const durationMs = Date.now() - startedAt;
    const n = deltas.length || 1;
    const avg = deltas.reduce((a, b) => a + b, 0) / n;
    const sd = Math.sqrt(deltas.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / n);
    return {
      gridId,
      durationMs: String(Math.round(durationMs)),
      moves: String(moves),
      trusted: String(trusted),
      untrusted: String(untrusted),
      avgDeltaMs: String(Math.round(avg || 0)),
      stdDeltaMs: String(Math.round(sd || 0)),
      paste: paste ? "1" : "0",
      vkPresses: String(vkPresses),
    };
  };

  return { onKeyDown, onInput, onPaste, onVirtualKey, finish };
}
// ---------------------------------------------------------------------

const ENABLE_TOP_PLAYERS = true;

const GRID_PRESETS = [
  { id: '5x5', rows: 5, cols: 5, label: '5 × 5 (Quick)' },
  { id: '5x12', rows: 5, cols: 12, label: '5 × 12 (Trainer)' },
  { id: '12x12', rows: 12, cols: 12, label: '12 × 12 (Classic)' },
  { id: '15x15', rows: 15, cols: 15, label: '15 × 15 (Pro)' },
];

const CATEGORY_OPTIONS = {
  small: ['Primary'],
  large: ['Primary', 'Secondary', 'NoSchool'],
};
const isSmallGrid = (gridId) => gridId === '5x5' || gridId === '5x12';
const categoriesFor = (gridId) => isSmallGrid(gridId) ? CATEGORY_OPTIONS.small : CATEGORY_OPTIONS.large;

const CLASS_OPTIONS_PRIMARY = [
  'Prep 1','Prep 2','Prep 3','Prep 4','Prep 5',
  'Std 1','Std 2','Std 3','Std 4','Std 5'
];

const CLASS_OPTIONS_SECONDARY = [
  'Form 1 (Grade 6)',
  'Form 2 (Grade 7)',
  'Form 3 (Grade 8)',
  'Form 4 (Grade 9)',
  'Form 5 (Grade 10)',
  'Lower Six (Grade 12)',
  'Upper Six (Grade 13)'
];

const classOptionsFor = (gridId, category) => {
  if (gridId === '5x5' || gridId === '5x12') return CLASS_OPTIONS_PRIMARY;
  return category === 'Secondary' ? CLASS_OPTIONS_SECONDARY : CLASS_OPTIONS_PRIMARY;
};

const WEBHOOKS = {
  '5x5':  'https://script.google.com/macros/s/AKfycbxqc76ZwIAnrmZ8bwt7W2Leu8NtvSmbkurgzNkRN3lHhs0SeIeEdCnU58h63l0lWDMaAQ/exec',
  '5x12': 'https://script.google.com/macros/s/AKfycbw5_-TS-qQcaAvzCl152XKngYKxVlrD5J7ZE7SeMjn12XY0vXhvqH75Kzp8eJvRfv0E/exec',
  '12x12':'https://script.google.com/macros/s/AKfycbyLBvT9IGpdm81NK9lR1D0LDfsaeWkHsiGIUhDMStZV8NpFPjG55q0GVgRfbX6qPo9K/exec',
  '15x15':'https://script.google.com/macros/s/AKfycbyGdG4O7BRgP9yGCuUFvD9dS1ZWEDvZnYhbNMhaEGcsSKH8QsyOgeOZzg7cdKnli0V9Sg/exec',
};

const smallGridCategoryFor = (gridId) =>
  gridId === '5x5' ? 'Times_5x5' :
  gridId === '5x12' ? 'Times_5x12' :
  'Times_5x5';

const getSheetURLs = (gridId) => {
  if (gridId === '5x5') {
    return {
      SmallTop: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSXvvpwFIx6TuA-dB26pjW6K0w8oRhg0IDgMO-69ag19hMATBAzC2Wf-I6m4Q5fUjLgCFNnzuT_cQUn/pub?gid=0&single=true&output=csv',
    };
  }
  if (gridId === '5x12') {
    return {
      SmallTop: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSXvvpwFIx6TuA-dB26pjW6K0w8oRhg0IDgMO-69ag19hMATBAzC2Wf-I6m4Q5fUjLgCFNnzuT_cQUn/pub?gid=1665132778&single=true&output=csv',
    };
  }
  if (gridId === '12x12') {
    return {
      Primary:  'https://docs.google.com/spreadsheets/d/e/2PACX-1vQIm6uIsWGD3h7D9T27ReAL9IrFhNcaYmNsez4xLp5N7InbXL9OjbTCHD93e4VKsF0uOPx20c3WJC-b/pub?gid=0&single=true&output=csv',
      Secondary:'https://docs.google.com/spreadsheets/d/e/2PACX-1vQIm6uIsWGD3h7D9T27ReAL9IrFhNcaYmNsez4xLp5N7InbXL9OjbTCHD93e4VKsF0uOPx20c3WJC-b/pub?gid=1127334724&single=true&output=csv',
      NoSchool: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQIm6uIsWGD3h7D9T27ReAL9IrFhNcaYmNsez4xLp5N7InbXL9OjbTCHD93e4VKsF0uOPx20c3WJC-b/pub?gid=1462166071&single=true&output=csv',
    };
  }
  if (gridId === '15x15') {
    return {
      Primary:  'https://docs.google.com/spreadsheets/d/e/2PACX-1vQMNl9g61jMzOv_K8SH8ITlvGCOL8WNm3ED3vp6UoMoJArERRqthGkQNzN4bIBMs7t_uuYedtEHzXc0/pub?gid=0&single=true&output=csv',
      Secondary:'https://docs.google.com/spreadsheets/d/e/2PACX-1vQMNl9g61jMzOv_K8SH8ITlvGCOL8WNm3ED3vp6UoMoJArERRqthGkQNzN4bIBMs7t_uuYedtEHzXc0/pub?gid=1175275328&single=true&output=csv',
      NoSchool: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQMNl9g61jMzOv_K8SH8ITlvGCOL8WNm3ED3vp6UoMoJArERRqthGkQNzN4bIBMs7t_uuYedtEHzXc0/pub?gid=800118807&single=true&output=csv',
    };
  }
  return {};
};

const generateGrid = (rows, cols) => {
  const grid = [];
  for (let r = 1; r <= rows; r++) {
    const currentRow = [];
    for (let c = 1; c <= cols; c++) {
      currentRow.push({ value: '', correct: null, answer: r * c, fired: false });
    }
    grid.push(currentRow);
  }
  return grid;
};

const formatTime = (milliseconds) => {
  const minutes = Math.floor(milliseconds / 60000);
  const seconds = Math.floor((milliseconds % 60000) / 1000);
  const ms = Math.floor((milliseconds % 1000) / 10);
  return `${minutes.toString().padStart(2, '0')}:${seconds
    .toString()
    .padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
};

const toMillis = (t) => {
  const s = String(t || '').trim();
  const m = /^(\d{1,2}):(\d{1,2})(?:\.(\d{1,3}))?$/.exec(s);
  if (!m) return Number.POSITIVE_INFINITY;
  const mm = +m[1], ss = +m[2], frac = m[3] ? +m[3] : 0;
  const msPart = m[3]?.length === 3 ? frac : frac * (m[3] ? 10 : 0);
  return mm * 60000 + ss * 1000 + msPart;
};

// -------------------- Confetti helpers --------------------
const isPerfectSquare = (n) => Number.isInteger(Math.sqrt(n));

function ScreenConfetti({ x, y, onDone = () => {} }) {
  React.useEffect(() => {
    if (x == null || y == null) return;

    const host = document.createElement('div');
    host.style.position = 'fixed';
    host.style.inset = '0';
    host.style.pointerEvents = 'none';
    host.style.zIndex = '2147483647';
    document.body.appendChild(host);

    const colors = ['#0ea5e9','#22c55e','#f59e0b','#ef4444','#8b5cf6','#111827'];
    const N = 20;

    for (let i = 0; i < N; i++) {
      const dot = document.createElement('i');
      dot.style.position = 'absolute';
      dot.style.left = '0px';
      dot.style.top = '0px';
      dot.style.width = '8px';
      dot.style.height = '8px';
      dot.style.borderRadius = '50%';
      dot.style.background = colors[i % colors.length];
      dot.style.willChange = 'transform, opacity';
      host.appendChild(dot);

      const angle = (Math.PI * 2 * i) / N;
      const dist = 60 + Math.random() * 40;
      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist - 40;

      dot.animate(
        [
          { transform: `translate(${x}px,${y}px)`, opacity: 1 },
          { transform: `translate(${x + dx}px,${y + dy}px)`, opacity: 0 }
        ],
        { duration: 800, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' }
      );
    }

    const t = setTimeout(() => {
      host.remove();
      onDone();
    }, 820);

    return () => {
      clearTimeout(t);
      host.remove();
    };
  }, [x, y, onDone]);

  return null;
}
// ---------------------------------------------------------

function CoreGame({ initialPreset = '12x12', lockPreset = false }) {
  const [gridPresetId, setGridPresetId] = useState(initialPreset);
  const preset = GRID_PRESETS.find(p => p.id === gridPresetId) || GRID_PRESETS[2];
  const ROWS = preset.rows;
  const COLS = preset.cols;

  const [grid, setGrid] = useState(generateGrid(ROWS, COLS));
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [completed, setCompleted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    school: '',
    email: '',
    category: 'Primary',
    classLevel: ''
  });
  const [topPlayers, setTopPlayers] = useState({
    Primary: null,
    Secondary: null,
    NoSchool: null
  });
  const [focusedCell, setFocusedCell] = useState(null);
  const timerRef = useRef(null);
  const timerStartedRef = useRef(false);

  const inputRefs = useRef([]);
  if (
    inputRefs.current.length !== ROWS ||
    inputRefs.current.some(r => !Array.isArray(r) || r.length !== COLS)
  ) {
    inputRefs.current = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  }

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCustomSchool, setShowCustomSchool] = useState(false);
  const [schoolOptions, setSchoolOptions] = useState(['Select a School...', 'Other']);

  const CLASS_OPTIONS = [
    'Prep 1','Prep 2','Prep 3','Prep 4','Prep 5',
    'Std 1','Std 2','Std 3','Std 4','Std 5'
  ];

  // ---- Anti-cheat ref (inserted) ----
  const antiRef = useRef(null);
  useEffect(() => { antiRef.current = createAntiCheat(gridPresetId); }, [gridPresetId]);
  // -----------------------------------

  // Confetti memory & styling with queue to guarantee one burst per square
  const celebratedRef = useRef(new Set()); // cells that actually burst
  const [celebratedMap, setCelebratedMap] = useState({}); // styling for celebrated cells
  const [burst, setBurst] = useState(null); // {x, y, t}
  const isBurstingRef = useRef(false);
  const queuedRef = useRef(new Set()); // keys reserved to burst soon
  const queueRef = useRef([]); // FIFO of {r,c} to process

  const [rowSwept, setRowSwept] = useState(Array(ROWS).fill(false));
const [colSwept, setColSwept] = useState(Array(COLS).fill(false));

  const startBurst = (rIdx, cIdx) => {
    const key = `${rIdx}-${cIdx}`;
    // mark as celebrated at the moment we actually start the burst
    celebratedRef.current.add(key);
    setCelebratedMap(m => (m[key] ? m : { ...m, [key]: true }));
    isBurstingRef.current = true;
    triggerBurstAt(rIdx, cIdx);
  };

  // NEW: idempotent one-shot marker + trigger (per minimal patch)
  

  // Commit-moment celebration: only when cell is correct & square, and not yet celebrated
  

  useEffect(() => {
    let isMounted = true;
    const loadSchools = async () => {
      try {
        const res = await fetch('/primary-schools.json', { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        const base = Array.isArray(data?.schools) ? data.schools : [];
        const cleaned = [...new Set(base.map(s => (s || '').trim()).filter(Boolean))];
        const sorted = cleaned.sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }));

        if (isMounted) {
          setSchoolOptions(['Select a School...', ...sorted, 'Other']);
        }
      } catch {
        setSchoolOptions(['Select a School...', 'Other']);
      }
    };
    loadSchools();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    setGrid(generateGrid(ROWS, COLS));
    if (timerRef.current) clearInterval(timerRef.current);
    setStartTime(null);
    setEndTime(null);
    setCompleted(false);
    setElapsed(0);
    timerStartedRef.current = false;

    setCelebratedMap({});
    setRowSwept(Array(ROWS).fill(false));
    setColSwept(Array(COLS).fill(false));
    }, [ROWS, COLS]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!ENABLE_TOP_PLAYERS) return;

    const parseCSV = (text) => {
      try {
        if (!text || typeof text !== 'string') return [];
        let [headers, ...rows] = text.trim().split(/\r?\n/).map(r => r.split(','));
        if (!headers || headers.length === 0) return [];
        headers = headers.map(h => (h || '').trim().replace(/['"]+/g, ''));
        return rows.map(row =>
          Object.fromEntries(row.map((val, i) => [headers[i], (val || '').trim().replace(/['"]+/g, '')]))
        );
      } catch {
        return [];
      }
    };

    const urls = getSheetURLs(gridPresetId);

    const loadTopPlayers = async () => {
      try {
        if (gridPresetId === '5x5' || gridPresetId === '5x12') {
          const res = await fetch(urls.SmallTop);
          const text = await res.text();
          const parsed = parseCSV(text);

          const cleanKey = (k) => String(k || '').replace(/\uFEFF/g, '').trim().toLowerCase();
          const timeLike = (v) => /^\d{1,2}:\d{1,2}(?:\.\d{1,3})?$/.test(String(v || '').trim());

          const pickTimeDisplay = (row) => {
            const entries = Object.entries(row).map(([k, v]) => [cleanKey(k), v]);
            const byLower = Object.fromEntries(entries);
            const keys = entries.map(([k]) => k);

            const candidates = ['time', 'time (mm:ss)', 'best time', 'final time', 'your time', 'result'];
            for (const c of candidates) {
              if (keys.includes(c) && byLower[c]) {
                const val = String(byLower[c]).trim();
                if (timeLike(val)) return val;
              }
            }

            const startsTime = keys.find(k => k.startsWith('time'));
            if (startsTime) {
              const val = String(byLower[startsTime]).trim();
              if (timeLike(val)) return val;
            }

            const anyTimeCell = entries.find(([_, v]) => timeLike(v));
            return anyTimeCell ? String(anyTimeCell[1]).trim() : '';
          };

          const pickName = (row) => {
            const entries = Object.entries(row).map(([k, v]) => [cleanKey(k), v]);
            const byLower = Object.fromEntries(entries);
            const name =
              byLower['name'] ??
              byLower['student name'] ??
              byLower['player'] ??
              byLower['student'];
            if (name && String(name).trim()) return String(name).trim();
            for (const [, v] of entries) {
              const s = String(v || '').trim();
              if (!s) continue;
              if (timeLike(s)) continue;
              if (/\S+@\S+/.test(s)) continue;
              return s;
            }
            return '';
          };

          const normalized = parsed.map(r => {
            const name = pickName(r);
            const timeDisplay = pickTimeDisplay(r);
            const ms = toMillis(timeDisplay);
            return { Name: name, Time: timeDisplay, ms };
          });

          const best = normalized
            .filter(e => e.Name && isFinite(e.ms))
            .sort((a, b) => a.ms - b.ms)[0] || null;

          setTopPlayers({ Primary: best ? { Name: best.Name, Time: best.Time } : null, Secondary: null, NoSchool: null });
        } else {
          const pairs = await Promise.all(
  ['Primary','Secondary','NoSchool'].map(async (cat) => {
    try {
      const res = await fetch(urls[cat]);
      const text = await res.text();
      const parsed = parseCSV(text);

      const sorted = parsed
        .map(r => ({ ...r, _ms: toMillis(r.Time) }))
        .filter(r => isFinite(r._ms))
        .sort((a, b) => a._ms - b._ms);

      return [cat, sorted[0] ? { Name: sorted[0].Name, Time: sorted[0].Time } : null];
    } catch {
      return [cat, null];
    }
  })
);
setTopPlayers(Object.fromEntries(pairs));
      }
} catch (err) {
        setTopPlayers({ Primary: null, Secondary: null, NoSchool: null });
      }
    };

    if (typeof window !== 'undefined' && typeof fetch === 'function') {
      loadTopPlayers();
    }
  }, [gridPresetId]);

  useEffect(() => {
    const allowed = categoriesFor(gridPresetId);
    if (!allowed.includes(formData.category)) {
      setFormData((f) => ({ ...f, category: allowed[0] }));
    }
  }, [gridPresetId]);

  useEffect(() => {
    const tests = [];
    tests.push({ name: 'valid preset id', ok: ['5x5','5x12','12x12','15x15'].includes(gridPresetId) });
    tests.push({ name: 'refs rows sized', ok: Array.isArray(inputRefs.current) && inputRefs.current.length === ROWS });
    tests.push({ name: 'refs cols sized', ok: inputRefs.current.every(r => Array.isArray(r) && r.length === COLS) });
    const testGrid = generateGrid(3, 4);
    const cell_3x4 = testGrid[2][3].answer;
    tests.push({ name: 'generateGrid 3x4 answer', ok: cell_3x4 === 12 });
    tests.push({ name: 'formatTime(90123)', ok: formatTime(90123) === '01:30.12' });
    if (typeof window !== 'undefined') {
      window.__CMI_TESTS__ = tests;
    }
  }, [gridPresetId, ROWS, COLS]);

  const checkCompletion = (newGrid) => {
    const allCorrect = newGrid.every(row => row.every(cell => cell.correct === true));
    if (!allCorrect || completed) return;

    const ac = antiRef.current?.finish?.();
    const minCells = ROWS * COLS;

    const suspicious =
      Number(ac?.untrusted || 0) > 0 ||
      Number(ac?.moves || 0) < Math.max(5, Math.floor(minCells * 0.4)) ||
      Number(ac?.durationMs || 0) < Math.max(ROWS * COLS * 8, 2500);

    if (suspicious) {
      alert('This run looks irregular and cannot be submitted. Please play again normally (no scripts, no paste).');
      setGrid(generateGrid(ROWS, COLS));
      if (timerRef.current) clearInterval(timerRef.current);
      setStartTime(null);
      setEndTime(null);
      setElapsed(0);
      timerStartedRef.current = false;
      return;
    }

    const stopTime = Date.now();
    setEndTime(stopTime);
    setCompleted(true);
    clearInterval(timerRef.current);
    if (startTime) setElapsed(stopTime - startTime);
    setTimeout(() => setShowForm(true), 500);
  };

  const handleKeyDown = (e, rowIdx, colIdx) => {
  // keep your antiRef + repeat guard + lastRow/lastCol lines...
  antiRef.current?.onKeyDown(e);
  const lastRow = ROWS - 1;
  const lastCol = COLS - 1;
  if (e.repeat) return;

  if (e.key === 'Enter' || e.key === 'NumpadEnter') {
    e.preventDefault();

    // 1) Confirm current cell
    const next = grid.map(r => r.map(c => ({ ...c })));
    const cell = next[rowIdx][colIdx];

    // (optional) sanitize & cap length
    const raw = String(cell.value || '').replace(/\D+/g, '');
    cell.value = raw.slice(0, 3);

    const isCorrect = Number(cell.value) === cell.answer;
    cell.correct = isCorrect;

    // 2) Row/col sweep if this confirmation completes them
    if (isCorrect) {
      if (!rowSwept[rowIdx] && next[rowIdx].every(c => c.correct === true)) {
        setRowSwept(rs => rs.map((v, i) => (i === rowIdx ? true : v)));
      }
      if (!colSwept[colIdx] && next.every(r => r[colIdx].correct === true)) {
        setColSwept(cs => cs.map((v, i) => (i === colIdx ? true : v)));
      }
    }

    // 3) Commit & completion check
    setGrid(next);
    checkCompletion(next);

    // 4) Navigation: advance only on correct, else keep focus & select
    if (isCorrect) {
      if (colIdx < lastCol) inputRefs.current[rowIdx][colIdx + 1]?.focus();
      else if (rowIdx < lastRow) inputRefs.current[rowIdx + 1][0]?.focus();
    } else {
      // keep them here to fix the answer quickly
      inputRefs.current[rowIdx][colIdx]?.select();
    }
    return;
  }

  // ...leave your Arrow/Backspace handling as-is below
  if (e.key === 'ArrowRight' && colIdx < lastCol) { e.preventDefault(); inputRefs.current[rowIdx][colIdx + 1]?.focus(); }
  else if (e.key === 'ArrowLeft' && colIdx > 0)   { e.preventDefault(); inputRefs.current[rowIdx][colIdx - 1]?.focus(); }
  else if (e.key === 'ArrowDown' && rowIdx < lastRow) { e.preventDefault(); inputRefs.current[rowIdx + 1][colIdx]?.focus(); }
  else if (e.key === 'ArrowUp' && rowIdx > 0)     { e.preventDefault(); inputRefs.current[rowIdx - 1][colIdx]?.focus(); }
  else if (e.key === 'Backspace') {
    e.preventDefault();
    const next = grid.map(r => r.map(c => ({ ...c })));
    next[rowIdx][colIdx].value = '';
    next[rowIdx][colIdx].correct = null;
    setGrid(next);
    checkCompletion(next);
  }
};


  const displayTime = formatTime(elapsed);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    const url = WEBHOOKS[gridPresetId];
    if (!url) {
      console.error('[CMI] Missing webhook URL for grid:', gridPresetId, WEBHOOKS);
      alert('No webhook configured for this grid. Please try again.');
      setIsSubmitting(false);
      return;
    }

    const ac = antiRef.current?.finish?.();
    const minCells = ROWS * COLS;
    const suspicious =
      Number(ac?.untrusted || 0) > 0 ||
      Number(ac?.moves || 0) < Math.max(5, Math.floor(minCells * 0.4)) ||
      Number(ac?.durationMs || 0) < Math.max(ROWS * COLS * 8, 2500);

    if (suspicious) {
      alert('This run looks irregular and cannot be submitted. Please play again normally.');
      setIsSubmitting(false);
      return;
    }

    console.log('[CMI] Posting to', gridPresetId, '→', url);

    const categoryToSend = isSmallGrid(gridPresetId) ? 'Primary' : formData.category;

    const formDataEncoded = new URLSearchParams();
    formDataEncoded.append("name", formData.name);
    formDataEncoded.append("email", (formData.email || '').trim() || "N/A");
    formDataEncoded.append("school", (formData.school || '').trim() || "N/A");
    formDataEncoded.append("category", categoryToSend || 'Primary');
    formDataEncoded.append("time", displayTime);
    formDataEncoded.append("classLevel", (formData.classLevel || '').trim() || "N/A");
    formDataEncoded.append("ac_moves",        String(ac?.moves ?? ""));
    formDataEncoded.append("ac_trusted",      String(ac?.trusted ?? ""));
    formDataEncoded.append("ac_untrusted",    String(ac?.untrusted ?? ""));
    formDataEncoded.append("ac_avgDeltaMs",   String(ac?.avgDeltaMs ?? ""));
    formDataEncoded.append("ac_stdDeltaMs",   String(ac?.stdDeltaMs ?? ""));
    formDataEncoded.append("ac_paste",        String(ac?.paste ?? ""));
    formDataEncoded.append("ac_vkPresses",    String(ac?.vkPresses ?? ""));
    formDataEncoded.append("ac_durationMs",   String(ac?.durationMs ?? ""));

    try {
      await fetch(url, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formDataEncoded.toString(),
      });

      alert("✅ Time submitted successfully!");
      setShowForm(false);
    } catch (_) {
      alert("There was an error submitting your time.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="p-4 min-h-screen transition-colors duration-300 text-black"
      style={{
        backgroundColor: "#fff058",
        backgroundImage: `url("/my-bg.svg")`,
        backgroundRepeat: "repeat",
        backgroundSize: "800px",
        backgroundAttachment: "fixed",
        minHeight: "100vh",
        fontFamily: "sans-serif",
        padding: "30px 20px",
        textAlign: "center",
        color: "#000",
        overflow: "hidden",
        position: "relative",
        zIndex: 0,
      }}
    >
      <style>{`
        .cell-wrap { position: relative; }
        .cell-wrap input { position: relative; z-index: 1; }
        .screen-cf{position:fixed;inset:0;pointer-events:none;z-index:2147483647;}
        .screen-cf i{position:absolute;width:8px;height:8px;border-radius:50%;}
      `}</style>

      <style>{`
        /* Row/Column header sweep */
        .row-header, .col-header { position: relative; overflow: hidden; }
        @keyframes sweepX { 0% { transform: translateX(-110%); } 100% { transform: translateX(110%); } }
        @keyframes sweepY { 0% { transform: translateY(-110%); } 100% { transform: translateY(110%); } }
        .row-header.sweep-row::after { content: ''; position: absolute; inset: 0; pointer-events: none; background: linear-gradient(90deg, transparent, rgba(255,255,255,.75), transparent); transform: translateX(-110%); animation: sweepX 900ms ease-out 1; }
        .col-header.sweep-col::after { content: ''; position: absolute; inset: 0; pointer-events: none; background: linear-gradient(180deg, transparent, rgba(255,255,255,.75), transparent); transform: translateY(-110%); animation: sweepY 900ms ease-out 1; }
        /* Gentle pop animation for celebrated cells */
        @keyframes pop { 0% { transform: scale(.96); } 70% { transform: scale(1.08); } 100% { transform: scale(1); } }
        .pop-once { animation: pop 160ms cubic-bezier(.2,.8,.2,1) 1; will-change: transform; }
      `}</style>

      <style>{`
        /* Row/Column header sweep */
        .row-header, .col-header { position: relative; overflow: hidden; }
        @keyframes sweepX { 0% { transform: translateX(-110%); } 100% { transform: translateX(110%); } }
        @keyframes sweepY { 0% { transform: translateY(-110%); } 100% { transform: translateY(110%); } }
        .row-header.sweep-row::after { content: ''; position: absolute; inset: 0; pointer-events: none; background: linear-gradient(90deg, transparent, rgba(255,255,255,.75), transparent); transform: translateX(-110%); animation: sweepX 900ms ease-out 1; }
        .col-header.sweep-col::after { content: ''; position: absolute; inset: 0; pointer-events: none; background: linear-gradient(180deg, transparent, rgba(255,255,255,.75), transparent); transform: translateY(-110%); animation: sweepY 900ms ease-out 1; }
        /* Gentle pop animation for celebrated cells */
        @keyframes pop { 0% { transform: scale(.96); } 70% { transform: scale(1.08); } 100% { transform: scale(1); } }
        .pop-once { animation: pop 160ms cubic-bezier(.2,.8,.2,1) 1; will-change: transform; }
      `}</style>

      {showIntro ? (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white text-black p-6 rounded shadow max-w-md text-center space-y-4">
            <h2 className="text-xl font-bold">👋 Welcome to Count Me In TT!</h2>
            <p>Fill in the times tables as fast as you can!</p>
            {!lockPreset && (
              <div className="text-sm bg-yellow-50 border border-yellow-200 rounded p-3 text-center">
                <label className="block font-semibold mb-1 text-center">Pick a Grid Size</label>
                <select
                  className="w-full border px-3 py-2 rounded mx-auto"
                  value={gridPresetId}
                  onChange={(e) => setGridPresetId(e.target.value)}
                >
                  {GRID_PRESETS.map(p => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
                <button
                  onClick={() => setShowIntro(false)}
                  className="mt-2 bg-blue-600 text-white px-4 py-2 rounded block mx-auto"
                >
                  Start Game
                </button>
              </div>
            )}
            <div className="bg-blue-50 border border-blue-200 rounded p-4 text-left text-sm">
              <h3 className="font-semibold text-blue-700 mb-2">🔑 Keyboard Tips</h3>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Enter</strong> – Move to next cell</li>
                <li><strong>← ↑ → ↓</strong> – Move around the grid</li>
                <li><strong>Backspace</strong> – Clear current cell</li>
                <li>Timer starts with your first input!</li>
              </ul>
            </div>
            <div className="mt-3 text-xs text-gray-600 text-center">
              By clicking <strong>Start Game</strong>, you agree to our{' '}
              <a href="https://countmeintt.com/privacy-policy.pdf" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Privacy Policy</a>{' '}
              and{' '}
              <a href="https://countmeintt.com/terms-of-use.pdf" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Terms of Use</a>.
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-3">
              <img src="/as-online-logo.svg" alt="A's Online" className="h-12 w-auto drop-shadow-md ring-1 ring-black/20 rounded" />
              <div>
                <h1 className="text-3xl font-bold">Count Me In TT!</h1>
                <p className="text-sm text-black font-bold">Powered by A's Online</p>
              </div>
            </div>
            <div className="flex flex-col items-end space-y-2">
              <Link to="/leaderboard">
                <button className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 shadow">View Leaderboard</button>
              </Link>
              <button onClick={() => window.location.reload()} className="text-sm bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 shadow">Reset Game</button>
            </div>
          </div>

          <div className="max-w-screen-md mx-auto">
            <div className="bg-white rounded-lg shadow p-4 border border-yellow-300">
              <h2 className="text-center font-bold text-xl mb-2 text-blue-600">🏆 Top {isSmallGrid(gridPresetId) ? 'Player' : 'Players'}</h2>

              {isSmallGrid(gridPresetId) ? (
                <div className="grid grid-cols-1 gap-4 text-sm text-center">
                  <div className="bg-blue-100 px-4 py-2 rounded shadow">
                    <strong className="text-black">Top Player:</strong>{' '}
                    <span className="text-black">{topPlayers.Primary?.Name || '---'}</span>{' '}
                    – <span className="font-mono text-black">{topPlayers.Primary?.Time || '--:--.--'}</span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-center">
                  {['Primary', 'Secondary', 'NoSchool'].map((cat) => (
                    <div key={cat} className="bg-blue-100 px-4 py-2 rounded shadow">
                      <strong className="text-black">{cat}:</strong>{' '}
                      <span className="text-black">{topPlayers[cat]?.Name || '---'}</span>{' '}
                      – <span className="font-mono text-black">{topPlayers[cat]?.Time || '--:--.--'}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="text-center mt-4">
                <p className="text-black text-sm drop-shadow-[2px_2px_3px_rgba(0,0,0,0.75)] animate-shimmer bg-clip-text">⭐ Your best time is still ahead! ⭐</p>
              </div>
            </div>
          </div>

          <div className="text-center mt-4 space-y-2">
            <p className="text-sm text-black font-bold">Your Timer</p>
            <p className="text-2xl font-mono bg-yellow-300 text-black inline-block px-6 py-2 rounded shadow">⏱️ {displayTime}</p>
          </div>

          

  
          <div className="overflow-x-auto w-full max-w-screen-xl mx-auto px-2">
            <div className="inline-block w-full">
              <div className="grid gap-1 w-full" style={{ gridTemplateColumns: `repeat(${COLS + 1}, minmax(0, 1fr))` }}>
                <div className="h-10"></div>
                {Array.from({ length: COLS }, (_, i) => (
                  <div key={`col-header-${i}`} className={`h-10 w-full text-center font-bold bg-yellow-300 text-black flex items-center justify-center text-xs sm:text-sm col-header ${colSwept[i] ? 'sweep-col' : ''}`}>{i + 1}</div>
                ))}

                {grid.map((row, rowIdx) => (
                  <React.Fragment key={`row-${rowIdx}`}>
                    <div className={`h-10 w-full text-center font-bold bg-yellow-300 text-black flex items-center justify-center text-xs sm:text-sm row-header ${rowSwept[rowIdx] ? 'sweep-row' : ''}`}
>
  {rowIdx + 1}
</div>
                    {row.map((cell, colIdx) => {
                      const cellKey = `${rowIdx}-${colIdx}`;
                      const isSqPos = rowIdx === colIdx;
                      const fired = !!celebratedMap[cellKey];

                      return (
                        <div key={`wrap-${rowIdx}-${colIdx}`} className="cell-wrap">
                          <input
                            key={`cell-${rowIdx}-${colIdx}`}
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={cell.value}
                            onFocus={() => setFocusedCell({ row: rowIdx, col: colIdx })}
                          onChange={(e) => {
  // 1) clone grid
  const prevCorrect = !!grid[rowIdx][colIdx].correct;
  const newGrid = grid.map(r => r.map(c => ({ ...c })));
  const cellObj = newGrid[rowIdx][colIdx];

  // 2) sanitize: digits only, cap to 3
  const raw = e.target.value.replace(/\D+/g, '');
  const newValue = raw.slice(0, 3);
  cellObj.value = newValue;

  // 3) correctness
  const nowCorrect = newValue !== '' && Number(newValue) === cellObj.answer;
  cellObj.correct = nowCorrect;

  // 4) celebrate ONLY on main diagonal (row == col)
  const cellKey = `${rowIdx}-${colIdx}`;
  const isMainDiag = rowIdx === colIdx;
  if (!prevCorrect && nowCorrect && isMainDiag && !celebratedMap[cellKey]) {
    setCelebratedMap(m => ({ ...m, [cellKey]: true }));
  }

  // 5) header sweeps when full row/col correct
  if (nowCorrect) {
    if (!rowSwept[rowIdx]) {
      const rowAll = newGrid[rowIdx].every(c => c.correct === true);
      if (rowAll) setRowSwept(rs => rs.map((v,i) => (i === rowIdx ? true : v)));
    }
    if (!colSwept[colIdx]) {
      const colAll = newGrid.every(r => r[colIdx].correct === true);
      if (colAll) setColSwept(cs => cs.map((v,i) => (i === colIdx ? true : v)));
    }
  }

  // 6) commit + completion check
  setGrid(newGrid);
  checkCompletion(newGrid);

  // 7) start timer on first real input
  if (!timerStartedRef.current && newValue !== '') {
    const now = Date.now();
    setStartTime(now);
    timerRef.current = setInterval(() => setElapsed(Date.now() - now), 10);
    timerStartedRef.current = true;
  }
}}
                            onKeyDown={(e) => { antiRef.current?.onKeyDown(e); handleKeyDown(e, rowIdx, colIdx); }}
                            onInput={(e) => antiRef.current?.onInput(e.nativeEvent)}

                            onPaste={(e) => antiRef.current?.onPaste(e)}
                            onDrop={(e) => e.preventDefault()}
                            onDragOver={(e) => e.preventDefault()}

                            ref={(el) => {
                              if (!inputRefs.current[rowIdx]) inputRefs.current[rowIdx] = [];
                              inputRefs.current[rowIdx][colIdx] = el;
                            }}
                            className={`h-10 w-full text-center border ${
                              cell.correct === null
                                ? 'border-gray-400'
                                : cell.correct
                                ? 'bg-green-200'
                                : 'bg-red-200'
                            } ${fired ? 'pop-once font-bold text-yellow-700 ring-2 ring-yellow-400' : ''}`}
                          />
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Screen overlay confetti (fires when burst is set) */}
      

      <div style={{ textAlign: "center", marginTop: "40px", marginBottom: "20px" }}>
        <a href="/about-us-contact.pdf" target="_blank" rel="noopener noreferrer" style={{ color: "#000", fontWeight: "bold", textDecoration: "underline", fontSize: "16px" }}>About Us/Contact</a>
      </div>
      <div className="w-full mt-8 flex justify-center">
        <p className="text-[11px] text-black text-center italic">© 2025 - 2026 <span className="font-semibold">Count Me In TT</span>. Developed by <span className="font-semibold">Andre Burton</span>. Powered by <span className="font-semibold">A’s Online</span>. All rights reserved.</p>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <form onSubmit={handleSubmit} className="bg-white text-black p-6 rounded shadow max-w-md w-full space-y-4">
            <h2 className="text-xl font-bold text-center">🎉 Game Complete!</h2>
            <p className="text-center">Well done! Your time: <span className="font-mono font-semibold">{displayTime}</span></p>
            <p className="text-center text-sm text-gray-600">Enter info & submit time, to appear on the Leaderboard.</p>

            <input
              type="text"
              placeholder="Student Name"
              className="w-full border px-3 py-2 rounded"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />

            {isSmallGrid(gridPresetId) ? (
              <>
                <select
                  className="w-full border px-3 py-2 rounded"
                  value={showCustomSchool ? 'Other' : (formData.school || 'Select a School...')}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'Other') {
                      setShowCustomSchool(true);
                      setFormData({ ...formData, school: '' });
                    } else if (val === 'Select a School...') {
                      setShowCustomSchool(false);
                      setFormData({ ...formData, school: '' });
                    } else {
                      setShowCustomSchool(false);
                      setFormData({ ...formData, school: val });
                    }
                  }}
                  required
                >
                  {schoolOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>

                {showCustomSchool && (
                  <input
                    type="text"
                    placeholder="Enter School"
                    className="w-full border px-3 py-2 rounded"
                    value={formData.school}
                    onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                    required
                  />
                )}

                <select
                  className="w-full border px-3 py-2 rounded"
                  value={formData.classLevel || ''}
                  onChange={(e) => setFormData({ ...formData, classLevel: e.target.value })}
                  required
                >
                  <option value="">Select Class...</option>
                  {CLASS_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>

                <input
                  type="email"
                  placeholder="Email (Optional)"
                  className="w-full border px-3 py-2 rounded"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </>
            ) : (
              <>
                <select
                  className="w-full border px-3 py-2 rounded"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value, classLevel: '' })
                  }
                  required
                >
                  {categoriesFor(gridPresetId).map(opt => (
                    <option key={opt} value={opt}>
                      {opt === 'NoSchool' ? 'No School' : opt}
                    </option>
                  ))}
                </select>

                {formData.category === 'Primary' ? (
                  <>
                    <select
                      className="w-full border px-3 py-2 rounded"
                      value={showCustomSchool ? 'Other' : (formData.school || 'Select a School...')}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'Other') {
                          setShowCustomSchool(true);
                          setFormData({ ...formData, school: '' });
                        } else if (val === 'Select a School...') {
                          setShowCustomSchool(false);
                          setFormData({ ...formData, school: '' });
                        } else {
                          setShowCustomSchool(false);
                          setFormData({ ...formData, school: val });
                        }
                      }}
                      required
                    >
                      {schoolOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>

                    {showCustomSchool && (
                      <input
                        type="text"
                        placeholder="Enter School"
                        className="w-full border px-3 py-2 rounded"
                        value={formData.school}
                        onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                        required
                      />
                    )}
                  </>
                ) : (
                  <input
                    type="text"
                    placeholder="School (Optional)"
                    className="w-full border px-3 py-2 rounded"
                    value={formData.school}
                    onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                  />
                )}

                <select
                  className="w-full border px-3 py-2 rounded"
                  value={formData.classLevel || ''}
                  onChange={(e) => setFormData({ ...formData, classLevel: e.target.value })}
                  required={formData.category === 'Primary'}
                >
                  <option value="">Select Class...</option>
                  {classOptionsFor(gridPresetId, formData.category).map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>

                <input
                  type="email"
                  placeholder="Email (Optional)"
                  className="w-full border px-3 py-2 rounded"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </>
            )}
            <p className="text-sm text-center text-gray-600 font-medium pt-2">Fill in ALL fields above to be eligible for prizes 🎁.</p>
            <div className="flex justify-between gap-2 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`flex-1 px-4 py-2 rounded text-white ${isSubmitting ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
              >
                {isSubmitting ? "Submitting..." : "✅ Submit Time"}
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
              >
                🔁 Reset Game
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

const Game5x5 = () => <CoreGame initialPreset="5x5" lockPreset />;
const Game5x12 = () => <CoreGame initialPreset="5x12" lockPreset />;
const Game12x12 = () => <CoreGame initialPreset="12x12" lockPreset />;
const Game15x15 = () => <CoreGame initialPreset="15x15" lockPreset />;

export default function CountMeInApp() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<CoreGame initialPreset="12x12" />} />
        <Route path="/5x5grid" element={<CoreGame initialPreset="5x5" lockPreset />} />
        <Route path="/5x12grid" element={<CoreGame initialPreset="5x12" lockPreset />} />
        <Route path="/12x12grid" element={<CoreGame initialPreset="12x12" lockPreset />} />
        <Route path="/15x15grid" element={<CoreGame initialPreset="15x15" lockPreset />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/schools" element={<SchoolsPicker />} />
        <Route
          path="/stx/all"
          element={
            <Leaderboard
              schoolFilter="St Xavier's Private School"
              classFilter={null}
              titleOverride="🏫 St Xavier’s — Whole School"
              classLabel="Prep"
            />
          }
        />
        <Route
          path="/stx/prep2"
          element={
            <Leaderboard
              schoolFilter="St Xavier's Private School"
              classFilter="Prep 2"
              titleOverride="🏆 St Xavier’s — Prep 2"
            />
          }
        />
        <Route
          path="/stx/prep3"
          element={
            <Leaderboard
              schoolFilter="St Xavier's Private School"
              classFilter="Prep 3"
              titleOverride="🏆 St Xavier’s — Prep 3"
            />
          }
        />
        <Route
          path="/stx/prep4"
          element={
            <Leaderboard
              schoolFilter="St Xavier's Private School"
              classFilter="Prep 4"
              titleOverride="🏆 St Xavier’s — Prep 4"
            />
          }
        />
        <Route
          path="/stx/prep5"
          element={
            <Leaderboard
              schoolFilter="St Xavier's Private School"
              classFilter="Prep 5"
              titleOverride="🏆 St Xavier’s — Prep 5"
            />
          }
        />
<Route
  path="/sjg/std2"
  element={
    <Leaderboard
      schoolFilter="San Juan Girls' RC School"
      classFilter="Std 2"
      titleOverride="🏆 San Juan Girls’ RC — Std 2"
    />
  }
/>
<Route
  path="/sjg/std3"
  element={
    <Leaderboard
      schoolFilter="San Juan Girls' RC School"
      classFilter="Std 3"
      titleOverride="🏆 San Juan Girls’ RC — Std 3"
    />
  }
/>
<Route
  path="/sjg/std4"
  element={
    <Leaderboard
      schoolFilter="San Juan Girls' RC School"
      classFilter="Std 4"
      titleOverride="🏆 San Juan Girls’ RC — Std 4"
    />
  }
/>
<Route
  path="/sjg/std5"
  element={
    <Leaderboard
      schoolFilter="San Juan Girls' RC School"
      classFilter="Std 5"
      titleOverride="🏆 San Juan Girls’ RC — Std 5"
    />
  }
/>
<Route
  path="/sjg/all"
  element={
    <Leaderboard
      schoolFilter="San Juan Girls' RC School"
      titleOverride="🏆 San Juan Girls’ RC — Whole School"
      classLabel="Std"
    />
  }
/>
<Route path="/sjb/all"  element={<Leaderboard schoolFilter="San Juan Boys RC School" titleOverride="San Juan Boys’ RC — Leaderboard" />} />
<Route path="/sjb/std2" element={<Leaderboard schoolFilter="San Juan Boys RC School" classFilter="Std 2" titleOverride="SJBRC — Std 2 Leaderboard" />} />
<Route path="/sjb/std3" element={<Leaderboard schoolFilter="San Juan Boys RC School" classFilter="Std 3" titleOverride="SJBRC — Std 3 Leaderboard" />} />
<Route path="/sjb/std4" element={<Leaderboard schoolFilter="San Juan Boys RC School" classFilter="Std 4" titleOverride="SJBRC — Std 4 Leaderboard" />} />
<Route path="/sjb/std5" element={<Leaderboard schoolFilter="San Juan Boys RC School" classFilter="Std 5" titleOverride="SJBRC — Std 5 Leaderboard" />} />

<Route path="/hall-of-fame" element={<HallOfFame />} />

      </Routes>
    </Router>
  );
}


