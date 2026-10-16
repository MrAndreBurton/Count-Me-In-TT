import { useEffect, useRef } from "react";

export const fieldClass = "mt-1.5 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-500";
export const primaryButton = "rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50";
export const secondaryButton = "rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50";

export default function LeaderboardModal({ title, children, onClose, busy = false }) {
  const dialog = useRef(null);
  useEffect(() => {
    const element = dialog.current;
    const previous = document.activeElement;
    element.showModal();
    return () => { element.close(); previous?.focus(); };
  }, []);
  return (
    <dialog ref={dialog} aria-label={title}
      onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}
      className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-0 text-slate-950 shadow-2xl backdrop:bg-slate-950/50">
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-6 py-5">
        <h2 className="text-xl font-black">{title}</h2>
        <button type="button" aria-label="Close dialog" disabled={busy} onClick={onClose} className={secondaryButton}>Close</button>
      </div>
      {children}
    </dialog>
  );
}
