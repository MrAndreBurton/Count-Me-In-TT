import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Trophy } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { loadLearnerLeaderboards } from "../../lib/learnerLeaderboards";

export default function LearnerLeaderboardLink() {
  const [boards, setBoards] = useState([]);
  useEffect(() => {
    let active = true;
    let request = 0;
    const timers = new Set();
    const load = async () => {
      const current = ++request;
      try {
        const result = await loadLearnerLeaderboards(supabase);
        if (active && current === request) setBoards(result.boards.filter(b => b.scope !== "public"));
      } catch { if (active && current === request) setBoards([]); }
    };
    void load();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(event => {
      if (event === "INITIAL_SESSION" || !active) return;
      ++request; setBoards([]);
      if (event !== "SIGNED_OUT") {
        const timer = window.setTimeout(() => { timers.delete(timer); if (active) void load(); }, 0);
        timers.add(timer);
      }
    });
    return () => { active = false; ++request; subscription.unsubscribe(); timers.forEach(t => window.clearTimeout(t)); };
  }, []);
  if (!boards.length) return null;
  return <Link to="/my-leaderboards" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border-2 border-blue-600 bg-white px-5 py-3 text-center font-black text-blue-700 transition hover:bg-blue-50">
    <Trophy aria-hidden="true" className="h-5 w-5 shrink-0" /> View organisation leaderboard
  </Link>;
}
