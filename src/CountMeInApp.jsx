import React, { useState, useEffect, useRef } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link
} from 'react-router-dom';
import Leaderboard from './Leaderboard';

const generateGrid = () => {
  const grid = [];
  for (let row = 1; row <= 12; row++) {
    const currentRow = [];
    for (let col = 1; col <= 12; col++) {
      currentRow.push({ value: '', correct: null, answer: row * col });
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

export default function CountMeInApp() {
  const [grid, setGrid] = useState(generateGrid());
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
    category: 'Primary'
  });
  const [topPlayers, setTopPlayers] = useState({
    Primary: null,
    Secondary: null,
    NoSchool: null
  });
  const [focusedCell, setFocusedCell] = useState(null);
  const timerRef = useRef(null);
  const timerStartedRef = useRef(false);
  const inputRefs = useRef([...Array(12)].map(() => Array(12).fill(null)));
const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const sheetURLs = {
      Primary: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQIm6uIsWGD3h7D9T27ReAL9IrFhNcaYmNsez4xLp5N7InbXL9OjbTCHD93e4VKsF0uOPx20c3WJC-b/pub?gid=0&single=true&output=csv',
      Secondary: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQIm6uIsWGD3h7D9T27ReAL9IrFhNcaYmNsez4xLp5N7InbXL9OjbTCHD93e4VKsF0uOPx20c3WJC-b/pub?gid=1127334724&single=true&output=csv',
      NoSchool: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQIm6uIsWGD3h7D9T27ReAL9IrFhNcaYmNsez4xLp5N7InbXL9OjbTCHD93e4VKsF0uOPx20c3WJC-b/pub?gid=1462166071&single=true&output=csv'
    };

    const parseCSV = (text) => {
  let [headers, ...rows] = text.trim().split('\n').map(r => r.split(','));
  headers = headers.map(h => h.trim().replace(/['"]+/g, ''));
  return rows.map(row =>
    Object.fromEntries(row.map((val, i) => [headers[i], val.trim().replace(/['"]+/g, '')]))
  );
};
    const loadTopPlayers = async () => {
  const results = await Promise.all(
    Object.entries(sheetURLs).map(async ([category, url]) => {
      try {
        const res = await fetch(url);
        const text = await res.text();
        console.log(`Raw CSV for ${category}:\n`, text);
        const entries = parseCSV(text);
        console.log(`Parsed entries for ${category}:`, entries);
        const sorted = entries
          .filter(e => e.Time && e.Time.trim() !== '')
          .sort((a, b) => a.Time.localeCompare(b.Time));
        console.log(`Top player for ${category}:`, sorted[0]);
        return [category, sorted[0]];
      } catch (err) {
        console.error(`Error fetching or parsing ${category} data`, err);
        return [category, null];
      }
    })
  );

  setTopPlayers(Object.fromEntries(results));
};

    loadTopPlayers();
  }, []);

  const checkCompletion = (newGrid) => {
    const allCorrect = newGrid.every(row => row.every(cell => cell.correct === true));
    if (allCorrect && !completed) {
      const stopTime = Date.now();
      setEndTime(stopTime);
      setCompleted(true);
      clearInterval(timerRef.current);
      setElapsed(stopTime - startTime);
      setTimeout(() => setShowForm(true), 500);
    }
  };

  const handleKeyDown = (e, rowIdx, colIdx) => {
    if (e.key === 'Enter') {
      if (colIdx < 11) {
        inputRefs.current[rowIdx][colIdx + 1]?.focus();
      } else if (rowIdx < 11) {
        inputRefs.current[rowIdx + 1][0]?.focus();
      }
    } else if (e.key === 'ArrowRight' && colIdx < 11) {
      inputRefs.current[rowIdx][colIdx + 1]?.focus();
    } else if (e.key === 'ArrowLeft' && colIdx > 0) {
      inputRefs.current[rowIdx][colIdx - 1]?.focus();
    } else if (e.key === 'ArrowDown' && rowIdx < 11) {
      inputRefs.current[rowIdx + 1][colIdx]?.focus();
    } else if (e.key === 'ArrowUp' && rowIdx > 0) {
      inputRefs.current[rowIdx - 1][colIdx]?.focus();
    } else if (e.key === 'Backspace') {
      const newGrid = [...grid];
      newGrid[rowIdx][colIdx].value = '';
      newGrid[rowIdx][colIdx].correct = null;
      checkCompletion(newGrid);
      setGrid(newGrid);
    } else if (/^[0-9]$/.test(e.key)) {
      e.preventDefault();
      const newGrid = [...grid];
      const currentValue = newGrid[rowIdx][colIdx].value;
      const newValue = currentValue + e.key;
      newGrid[rowIdx][colIdx].value = newValue;
      newGrid[rowIdx][colIdx].correct = parseInt(newValue) === newGrid[rowIdx][colIdx].answer;
      if (!timerStartedRef.current && currentValue === '') {
        const now = Date.now();
        setStartTime(now);
        timerRef.current = setInterval(() => {
          setElapsed(Date.now() - now);
        }, 10);
        timerStartedRef.current = true;
      }
      checkCompletion(newGrid);
      setGrid(newGrid);
    }
  };

 const displayTime = formatTime(elapsed);
const handleSubmit = async (e) => {
  e.preventDefault();

if (isSubmitting) return;
  setIsSubmitting(true);

  const webhookURL = "https://script.google.com/macros/s/AKfycbyLBvT9IGpdm81NK9lR1D0LDfsaeWkHsiGIUhDMStZV8NpFPjG55q0GVgRfbX6qPo9K/exec";

  const formDataEncoded = new URLSearchParams();
  formDataEncoded.append("name", formData.name);
  formDataEncoded.append("email", formData.email.trim() || "N/A");
  formDataEncoded.append("school", formData.school.trim() || "N/A");
  formDataEncoded.append("category", formData.category);
  formDataEncoded.append("time", displayTime); // ⏱️

  try {
    await fetch(webhookURL, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formDataEncoded.toString(),
    });

    alert("✅ Time submitted successfully!");
    setShowForm(false);
  } catch (error) {
    console.error("❌ Submission failed:", error);
    alert("There was an error submitting your time.");
} finally {
    setIsSubmitting(false);
  }
};

  return (
<Router>
    <Routes>
      <Route
        path="/"
        element={
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
      {showIntro ? (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white text-black p-6 rounded shadow max-w-md text-center space-y-4">
            <h2 className="text-xl font-bold">👋 Welcome to Count Me In TT!</h2>
            <p>Fill in the times tables from 1 to 12 as fast as you can!</p>
            <div className="bg-blue-50 border border-blue-200 rounded p-4 text-left text-sm">
              <h3 className="font-semibold text-blue-700 mb-2">🔑 Keyboard Tips</h3>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Enter</strong> – Move to next cell</li>
                <li><strong>← ↑ → ↓</strong> – Move around the grid</li>
                <li><strong>Backspace</strong> – Clear current cell</li>
                <li>Timer starts with your first input!</li>
              </ul>
            </div>
            <button onClick={() => setShowIntro(false)} className="bg-blue-600 text-white px-4 py-2 rounded">Start Game</button>
<div className="mt-3 text-xs text-gray-600 text-center">
            By clicking <strong>Start Game</strong>, you agree to our{' '}
            <a
              href="https://countmeintt.com/privacy-policy.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              Privacy Policy
            </a>{' '}
            and{' '}
            <a
              href="https://countmeintt.com/terms-of-use.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              Terms of Use
            </a>.
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
  <button className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 shadow">
    View Leaderboard
  </button>
</Link>
              <button onClick={() => window.location.reload()} className="text-sm bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 shadow">Reset Game</button>
            </div>
          </div>

          <div className="max-w-screen-md mx-auto">
  <div className="bg-white rounded-lg shadow p-4 border border-yellow-300">
    <h2 className="text-center font-bold text-xl mb-2 text-blue-600">🏆 Top Players</h2>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-center">
      {['Primary', 'Secondary', 'NoSchool'].map((cat) => (
        <div key={cat} className="bg-blue-100 px-4 py-2 rounded shadow">
          <strong className="text-black">{cat}:</strong>{' '}
          <span className="text-black">{topPlayers[cat]?.Name || '---'}</span>{' '}
          – <span className="font-mono text-black">{topPlayers[cat]?.Time || '--:--.--'}</span>
        </div>
      ))}
    </div>
<div className="text-center mt-4">
  <p className="text-black text-sm drop-shadow-[2px_2px_3px_rgba(0,0,0,0.75)] animate-shimmer bg-clip-text">
  ⭐ These top players are in line to win September month-end prizes! ⭐
</p>
</div>
  </div>
</div>
<div className="text-center mt-4 space-y-2">
  <p className="text-sm text-black font-bold">Your Timer</p>
  <p className="text-2xl font-mono bg-yellow-300 text-black inline-block px-6 py-2 rounded shadow">
    ⏱️ {displayTime}
  </p>
</div>
          <div className="overflow-x-auto w-full max-w-screen-xl mx-auto px-2">
            <div className="inline-block w-full">
              <div className="grid grid-cols-[repeat(13,minmax(0,1fr))] gap-1 w-full">
                <div className="h-10"></div>
                {[...Array(12)].map((_, i) => (
                  <div key={`col-header-${i}`} className="h-10 w-full text-center font-bold bg-yellow-300 text-black flex items-center justify-center text-xs sm:text-sm">{i + 1}</div>
                ))}
                {grid.map((row, rowIdx) => (
                  <React.Fragment key={`row-${rowIdx}`}>
                    <div className="h-10 w-full text-center font-bold bg-yellow-300 text-black flex items-center justify-center text-xs sm:text-sm">{rowIdx + 1}</div>
                    {row.map((cell, colIdx) => (
  <input key={`cell-${rowIdx}-${colIdx}`} type="text" inputMode="numeric" pattern="[0-9]*" value={cell.value} onFocus={() => setFocusedCell({ row: rowIdx, col: colIdx })} onChange={(e) => {const newGrid = [...grid]; const newValue = e.target.value;  newGrid[rowIdx][colIdx].value = newValue; newGrid[rowIdx][colIdx].correct = parseInt(newValue) === newGrid[rowIdx][colIdx].answer; setGrid(newGrid); checkCompletion(newGrid); if (!timerStartedRef.current && newValue !== '') {const now = Date.now(); setStartTime(now); timerRef.current = setInterval(() => {setElapsed(Date.now() - now);}, 10); timerStartedRef.current = true;}}} onKeyDown={(e) => handleKeyDown(e, rowIdx, colIdx)} ref={(el) => (inputRefs.current[rowIdx][colIdx] = el)} className={`h-10 w-full text-center border ${cell.correct === null ? 'border-gray-400' : cell.correct ? 'bg-green-200' : 'bg-red-200'}`} />
))}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
<div style={{ textAlign: "center", marginTop: "40px", marginBottom: "20px" }}>
  <a
    href="/about-us-contact.pdf"
    target="_blank"
    rel="noopener noreferrer"
    style={{
      color: "#000",
      fontWeight: "bold",
      textDecoration: "underline",
      fontSize: "16px",
    }}
  >
    About Us/Contact
  </a>
</div>
<div className="w-full mt-8 flex justify-center">
  <p className="text-[11px] text-black text-center italic">
    © 2025 <span className="font-semibold">Count Me In TT</span>. Developed by <span className="font-semibold">Andre Burton</span>. Powered by <span className="font-semibold">A’s Online</span>. All rights reserved.
  </p>
</div>
      {showForm && (
  <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
    <form onSubmit={handleSubmit} className="bg-white text-black p-6 rounded shadow max-w-md w-full space-y-4">
      <h2 className="text-xl font-bold text-center">🎉 Game Complete!</h2>
      <p className="text-center">
        Well done! Your time: <span className="font-mono font-semibold">{displayTime}</span>
      </p>
<p className="text-center text-sm text-gray-600">
  Enter info & submit time, to appear on the Leaderboard.
</p>
      <input
        type="text"
        placeholder="Student Name"
        className="w-full border px-3 py-2 rounded"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        required
      />
      <select
        className="w-full border px-3 py-2 rounded"
        value={formData.category}
        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
        required
      >
        <option value="Primary">Primary School</option>
        <option value="Secondary">Secondary School</option>
        <option value="NoSchool">No School</option>
      </select>
      <input
        type="text"
        placeholder="School (Optional)"
        className="w-full border px-3 py-2 rounded"
        value={formData.school}
        onChange={(e) => setFormData({ ...formData, school: e.target.value })}
      />
      <input
        type="email"
        placeholder="Email (Optional)"
        className="w-full border px-3 py-2 rounded"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
      />
<p className="text-sm text-center text-gray-600 font-medium pt-2">
  Fill in ALL fields above to be eligible for prizes 🎁.
</p>
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
) }
 </div>
      }
    />
    <Route path="/leaderboard" element={<Leaderboard />} />
  </Routes>
</Router>
);
}



