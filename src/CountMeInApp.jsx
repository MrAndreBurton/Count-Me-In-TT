// CountMeInApp.jsx
import React, { useState, useEffect, useRef } from 'react';
import downloadImage from './assets/download.png';

const generateGrid = () => {
  const grid = [];
  for (let row = 1; row <= 12; row++) {
    const currentRow = [];
    for (let col = 1; col <= 12; col++) {
      currentRow.push({
        value: '',
        correct: null,
        answer: row * col,
      });
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
  const [formData, setFormData] = useState({ name: '', school: '', email: '', category: 'Junior - Primary School' });
  const [topPlayers, setTopPlayers] = useState({ Primary: null, Secondary: null, NoSchool: null });

  const timerRef = useRef(null);
  const timerStartedRef = useRef(false);
  const inputRefs = useRef([...Array(13)].map(() => Array(12).fill(null)));

  useEffect(() => {
    const sheetURLs = {
      Primary: 'https://docs.google.com/spreadsheets/d/1-vWT6uF71RCzqEWWrM0EGmVoeOMNnAcxkMZ3y0fdwos/gviz/tq?tqx=out:csv&gid=0',
      Secondary: 'https://docs.google.com/spreadsheets/d/1-vWT6uF71RCzqEWWrM0EGmVoeOMNnAcxkMZ3y0fdwos/gviz/tq?tqx=out:csv&gid=860089786',
      NoSchool: 'https://docs.google.com/spreadsheets/d/1-vWT6uF71RCzqEWWrM0EGmVoeOMNnAcxkMZ3y0fdwos/gviz/tq?tqx=out:csv&gid=87155907',
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
      } else if (rowIdx < 12) {
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

  return (
    <div className={`p-4 relative min-h-screen transition-colors duration-300 ${darkMode ? 'bg-yellow-100 text-yellow-900' : 'bg-white text-black'}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <img src={downloadImage} alt="A's Online Logo" className="w-12 h-12 rounded" />
          <div>
            <h1 className="text-3xl font-bold">Count Me In!</h1>
            <p className="text-sm text-gray-600">Powered by A's Online</p>
          </div>
        </div>
        <div className="flex flex-col items-end space-y-2">
          <button onClick={() => setDarkMode(!darkMode)} className="text-xl px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="Toggle Theme">
            {darkMode ? '🌙' : '☀️'}
          </button>
          <div className="text-xl font-mono bg-yellow-300 text-black px-3 py-1 rounded shadow">{displayTime}</div>
          <button onClick={() => window.location.href = '/leaderboard'} className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 shadow">View Leaderboard</button>
          <button onClick={() => window.location.reload()} className="text-sm bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 shadow">Reset Game</button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row items-start gap-6">
        <div className="overflow-x-auto">
          <div className="inline-block">
            <div className="grid grid-cols-[repeat(13,auto)] gap-1">
              <div className="w-12 h-10"></div>
              {[...Array(12)].map((_, i) => (
                <div key={`col-header-${i}`} className="w-12 h-10 text-center font-bold bg-yellow-300 text-black flex items-center justify-center">{i + 1}</div>
              ))}
              {grid.map((row, rowIdx) => (
                <React.Fragment key={`row-${rowIdx}`}>
                  <div className="w-12 h-10 text-center font-bold bg-yellow-300 text-black flex items-center justify-center">{rowIdx + 1}</div>
                  {row.map((cell, colIdx) => (
                    <input
                      key={`cell-${rowIdx}-${colIdx}`}
                      type="text"
                      value={cell.value}
                      onChange={() => {}}
                      onKeyDown={(e) => handleKeyDown(e, rowIdx, colIdx)}
                      ref={(el) => (inputRefs.current[rowIdx][colIdx] = el)}
                      className={`w-12 h-10 text-center border ${cell.correct === null ? 'border-gray-400' : cell.correct ? 'bg-green-200' : 'bg-red-200'}`}
                    />
                  ))}
                </React.Fragment>
              ))}
              <React.Fragment>
                <div className="w-12 h-10 text-center font-bold bg-yellow-300 text-black flex items-center justify-center">+</div>
                {[...Array(12)].map((_, colIdx) => (
                  <input
                    key={`extra-${colIdx}`}
                    type="text"
                    ref={(el) => (inputRefs.current[12][colIdx] = el)}
                    className="w-12 h-10 text-center border border-gray-400 bg-yellow-100 text-black"
                    readOnly
                    value={completed && colIdx === 0 ? formatTime(elapsed) : ''}
                  />
                ))}
              </React.Fragment>
            </div>
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded p-4 w-full max-w-xs text-sm">
          <h3 className="font-semibold text-blue-700 mb-2">🔑 Keyboard Tips</h3>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Enter</strong> – Move to next cell</li>
            <li><strong>← ↑ → ↓</strong> – Move around the grid</li>
            <li><strong>Backspace</strong> – Clear current cell</li>
            <li>Timer starts with your first input!</li>
          </ul>
          <div className="mt-4">
            <h4 className="font-semibold text-green-700 mb-2">🥇 Top Players</h4>
            <ul className="space-y-1">
              {['Primary', 'Secondary', 'NoSchool'].map((cat) => (
                <li key={cat}>
                  {cat}: <span className="font-semibold">{topPlayers[cat]?.name || '---'}</span> – <span className="font-mono text-green-800">{topPlayers[cat]?.time || '--:--.--'}</span> 🥇
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {showIntro && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white text-black p-6 rounded shadow max-w-md text-center">
            <h2 className="text-xl font-bold mb-4">👋 Welcome to Count Me In!</h2>
            <p className="mb-4">Fill in the times tables from 1 to 12 as fast as you can!</p>
            <button onClick={() => setShowIntro(false)} className="bg-blue-600 text-white px-4 py-2 rounded">Start Game</button>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <form onSubmit={() => {}} className="bg-white text-black p-6 rounded shadow-md space-y-4 w-96">
            <h2 className="text-xl font-semibold text-center">Submit Your Score</h2>
            <p className="text-center font-mono">Completed Time: {formatTime(elapsed)}</p>
            <select
              name="category"
              value={formData.category}
              onChange={() => {}}
              required
              className="w-full border p-2 rounded text-black"
            >
              <option>Junior - Primary School</option>
              <option>Senior - Secondary School</option>
              <option>No School</option>
            </select>
            <input
              type="text"
              name="name"
              placeholder="Your Name"
              onChange={() => {}}
              required
              className="w-full border p-2 rounded text-black"
            />
            <input
              type="text"
              name="school"
              placeholder="School Name"
              onChange={() => {}}
              required={formData.category !== 'No School'}
              value={formData.school}
              className={`w-full border p-2 rounded text-black ${formData.category === 'No School' ? 'bg-gray-200' : ''}`}
              disabled={formData.category === 'No School'}
            />
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              onChange={() => {}}
              required
              className="w-full border p-2 rounded text-black"
            />
            <div className="flex gap-2">
              <button type="submit" className="bg-green-500 text-white py-2 px-4 rounded w-full hover:bg-green-600">Submit</button>
              <button type="button" onClick={() => window.location.reload()} className="bg-gray-400 text-white py-2 px-4 rounded w-full hover:bg-gray-500">Play Again</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
