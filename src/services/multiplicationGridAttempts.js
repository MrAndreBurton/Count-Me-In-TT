import { supabase } from '../lib/supabase';

// One serialized writer per round. Checkpoints never become leaderboard results.
export function createGridAttemptRecorder(identity, round, onError = () => {}) {
  if (!identity?.userId || !identity?.profileId) return null;
  let pending = null;
  let running = null;
  let timer = null;
  let terminal = false;

  const drain = () => {
    if (running) return running;
    running = (async () => {
      while (pending) {
        const payload = pending;
        pending = null;
        try {
          const { data, error: sessionError } = await supabase.auth.getSession();
          if (sessionError) throw sessionError;
          // A sign-out or account change cannot reassign a round.
          if (data.session?.user?.id !== identity.userId) continue;
          const { error } = await supabase
            .from('multiplication_grid_attempts')
            .upsert(payload, { onConflict: 'id' });
          if (error) throw error;
        } catch (error) {
          onError(error);
        }
      }
    })().finally(() => { running = null; });
    return running;
  };

  return {
    queue(evidence, durationMs, status = 'in_progress') {
      if (terminal) return;
      terminal = status !== 'in_progress';
      pending = {
        id: round.id,
        account_id: identity.userId,
        student_id: identity.profileId,
        game_mode: round.gameMode,
        status,
        started_at: round.startedAt,
        duration_ms: Math.max(0, Math.round(durationMs)),
        evidence,
      };
      if (timer !== null) window.clearTimeout(timer);
      timer = null;
      if (terminal) return drain();
      timer = window.setTimeout(() => {
        timer = null;
        void drain();
      }, 600);
    },
    flush() {
      if (timer !== null) window.clearTimeout(timer);
      timer = null;
      return drain();
    },
  };
}
