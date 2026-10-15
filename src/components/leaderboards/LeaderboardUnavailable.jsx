import { useEffect } from "react";
import { Link } from "react-router-dom";
import GameHeader from "../layout/GameHeader";

export default function LeaderboardUnavailable({ title = "Leaderboards are being updated" }) {
  useEffect(() => {
    document.title = title + " | CountMeInTT";
  }, [title]);

  return (
    <div className="min-h-screen text-gray-950" style={{
      backgroundColor: "#fce500",
      backgroundImage: 'url("/math-bg.svg")',
      backgroundSize: "300px",
    }}>
      <GameHeader />
      <main className="mx-auto max-w-3xl px-5 py-12">
        <section className="rounded-2xl border border-yellow-300 bg-white p-6 shadow-lg sm:p-10">
          <p className="text-sm font-black uppercase tracking-wider text-blue-700">CountMeInTT Rankings</p>
          <h1 className="mt-3 text-3xl font-black sm:text-4xl">{title}</h1>
          <p className="mt-4 leading-7 text-gray-700">
            Leaderboards and Hall of Fame are temporarily unavailable while we update privacy and access.
            You can keep playing. Signed-in results continue to save to your learning profile.
          </p>
          <Link to="/games/multiplication" className="mt-6 inline-block rounded-xl bg-blue-700 px-5 py-3 font-black text-white hover:bg-blue-800">
            Play Multiplication Challenge
          </Link>
        </section>
      </main>
    </div>
  );
}
