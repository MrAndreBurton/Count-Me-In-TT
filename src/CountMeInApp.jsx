import React, { useState, useEffect, useRef } from 'react';

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
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
};

export default function CountMeInApp() {
  const [darkMode, setDarkMode] = useState(true);
  const [grid, setGrid] = useState(generateGrid());
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [completed, setCompleted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [formData, setFormData] = useState({ name: '', school: '', email: '', category: 'Primary' });
  const [topPlayers, setTopPlayers] = useState({ Primary: null, Secondary: null, NoSchool: null });

  const timerRef = useRef(null);
  const timerStartedRef = useRef(false);
  const inputRefs = useRef([...Array(12)].map(() => Array(12).fill(null)));

  useEffect(() => {
    const sheetURLs = {
      Primary: 'https://docs.google.com/spreadsheets/d/1-vWT6uF71RCzqEWWrM0EGmVoeOMNnAcxkMZ3y0fdwos/gviz/tq?tqx=out:csv&gid=0',
      Secondary: 'https://docs.google.com/spreadsheets/d/1-vWT6uF71RCzqEWWrM0EGmVoeOMNnAcxkMZ3y0fdwos/gviz/tq?tqx=out:csv&gid=860089786',
      NoSchool: 'https://docs.google.com/spreadsheets/d/1-vWT6uF71RCzqEWWrM0EGmVoeOMNnAcxkMZ3y0fdwos/gviz/tq?tqx=out:csv&gid=87155907'
    };

    const parseCSV = (text) => {
      const [headers, ...rows] = text.trim().split('\n').map(r => r.split(','));
      return rows.map(row => Object.fromEntries(row.map((val, i) => [headers[i], val])));
    };

    const loadTopPlayers = async () => {
      const results = await Promise.all(Object.entries(sheetURLs).map(async ([category, url]) => {
        try {
          const res = await fetch(url);
          const text = await res.text();
          const entries = parseCSV(text);
          const sorted = entries.sort((a, b) => a.time.localeCompare(b.time));
          return [category, sorted[0]];
        } catch {
          return [category, null];
        }
      }));
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
      setTimeout(() => setShowForm(true), 300);
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
      setGrid(newGrid);
      checkCompletion(newGrid);
    } else if (/^[0-9]$/.test(e.key)) {
      e.preventDefault();
      const newGrid = [...grid];
      const currentValue = newGrid[rowIdx][colIdx].value;
      const newValue = currentValue + e.key;
      newGrid[rowIdx][colIdx].value = newValue;
      newGrid[rowIdx][colIdx].correct = parseInt(newValue) === newGrid[rowIdx][colIdx].answer;
      setGrid(newGrid);
      if (!timerStartedRef.current && currentValue === '') {
        const now = Date.now();
        setStartTime(now);
        timerRef.current = setInterval(() => {
          setElapsed(Date.now() - now);
        }, 10);
        timerStartedRef.current = true;
      }
      checkCompletion(newGrid);
    }
  };

  const displayTime = formatTime(elapsed);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = () => {
    alert(`Submitted: ${formData.name} - ${formData.category} - ${displayTime}`);
    window.location.reload();
  };

  return (
    <div className={`p-4 min-h-screen transition-colors duration-300 ${darkMode ? 'bg-yellow-100 text-yellow-900' : 'bg-white text-black'}`}>
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
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <img src="/as-online-logo.svg" alt="A's Online" className="h-12 w-auto" />
              <div>
                <h1 className="text-3xl font-bold">Count Me In TT!</h1>
                <p className="text-sm text-gray-600">Powered by A's Online</p>
              </div>
            </div>
            <div className="flex flex-col items-end space-y-2">
              <button onClick={() => setDarkMode(!darkMode)}>{darkMode ? '🌙' : '☀️'}</button>
              <div className="text-xl font-mono bg-yellow-300 text-black px-3 py-1 rounded shadow">{displayTime}</div>
              <button onClick={() => window.location.href = '/leaderboard'} className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 shadow">View Leaderboard</button>
              <button onClick={() => window.location.reload()} className="text-sm bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 shadow">Reset Game</button>
            </div>
          </div>

          <div className="max-w-screen-md mx-auto mb-6 p-4 bg-blue-100 text-blue-900 rounded shadow text-center">
            <h2 className="font-bold text-lg mb-2">Top Players</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {['Primary', 'Secondary', 'NoSchool'].map((cat) => (
                <div key={cat} className="bg-white border border-blue-300 px-4 py-2 rounded">
                  <strong>{cat}</strong><br />
                  {topPlayers[cat]?.name || '---'} – <span className="font-mono">{topPlayers[cat]?.time || '--:--.--'}</span>
                </div>
              ))}
            </div>
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
                      <input key={`cell-${rowIdx}-${colIdx}`} type="text" value={cell.value} onChange={() => {}} onKeyDown={(e) => handleKeyDown(e, rowIdx, colIdx)} ref={(el) => (inputRefs.current[rowIdx][colIdx] = el)} className={`h-10 w-full text-center border ${cell.correct === null ? 'border-gray-400' : cell.correct ? 'bg-green-200' : 'bg-red-200'}`} />
                    ))}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>

          {showForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white text-black p-6 rounded shadow max-w-sm w-full space-y-4">
                <h3 className="text-lg font-bold">🎉 Game Complete!</h3>
                <p className="font-mono text-center text-2xl">⏱ {displayTime}</p>
                <input type="text" name="name" placeholder="Student Name" value={formData.name} onChange={handleFormChange} className="w-full border p-2 rounded" />
                <input type="text" name="school" placeholder="School (optional)" value={formData.school} onChange={handleFormChange} className="w-full border p-2 rounded" />
                <input type="email" name="email" placeholder="Email (optional)" value={formData.email} onChange={handleFormChange} className="w-full border p-2 rounded" />
                <select name="category" value={formData.category} onChange={handleFormChange} className="w-full border p-2 rounded">
                  <option value="Primary">Primary School</option>
                  <option value="Secondary">Secondary School</option>
                  <option value="NoSchool">No School</option>
                </select>
                <div className="flex justify-between pt-2">
                  <button onClick={handleFormSubmit} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">✅ Submit Time</button>
                  <button onClick={() => window.location.reload()} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">🔁 Reset Game</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}


