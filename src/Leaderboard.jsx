import React from 'react';
import { Link } from 'react-router-dom';

function Leaderboard() {
  return (
    <div className="relative min-h-screen bg-white flex items-center justify-center px-4">
      {/* Back Button in Top Right */}
      <Link to="/">
        <button className="absolute top-4 right-4 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-4 py-2 rounded shadow">
          ⬅️ Back to Game
        </button>
      </Link>

      {/* Centered Image */}
      <img
        src="/leaderboard-coming-soon.svg"
        alt="Leaderboard Coming Soon"
        className="w-[90vw] max-w-3xl h-auto"
      />
    </div>
  );
}

export default Leaderboard;
