'use client';

import { useEffect } from 'react';

type InfoModalProps = { open: boolean; onClose: () => void };

export default function InfoModal({ open, onClose }: InfoModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <div
      aria-hidden={!open}
      className={`fixed inset-0 z-50 flex items-end justify-center p-0 transition-opacity duration-200 sm:items-center sm:p-4 ${
        open ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
    >
      <div className="absolute inset-0 bg-navy/70 backdrop-blur-sm" onClick={onClose} />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="info-title"
        className={`relative z-10 max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-slate bg-surface p-6 shadow-xl transition-all duration-200 sm:rounded-xl ${
          open
            ? 'translate-y-0 scale-100 opacity-100'
            : 'translate-y-4 scale-95 opacity-0 sm:translate-y-3'
        }`}
      >
        <div className="flex items-start justify-between">
          <h2 id="info-title" className="font-display text-xl font-semibold text-parchment">
            How it works
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-md px-2 font-mono text-muted transition hover:text-parchment focus:outline-none focus-visible:ring-2 focus-visible:ring-brass"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 space-y-5 text-sm text-muted">
          <section>
            <p className="mt-1 text-parchment/90">
              A position shows for a few seconds, then vanishes. Rebuild it from memory on the empty board, then check.
            </p>
          </section>

          <section>
            <h3 className="font-mono text-xs uppercase tracking-wide text-brass">Reading the pieces</h3>
            <p className="mt-1">
              Each piece is a colour plus a type. Colour:{' '}
              <span className="font-mono text-parchment">w</span> = white,{' '}
              <span className="font-mono text-parchment">b</span> = black. Type:
            </p>
            <ul className="mt-2 space-y-1 font-mono text-parchment/90">
              <li>K — king</li>
              <li>Q — queen</li>
              <li>R — rook</li>
              <li>B — bishop</li>
              <li>N — knight</li>
              <li>P — pawn</li>
            </ul>
            <p className="mt-2">
              So <span className="font-mono text-parchment">wN</span> is a white knight. Squares are named by file{' '}
              <span className="font-mono text-parchment">a–h</span> and rank{' '}
              <span className="font-mono text-parchment">1–8</span>, e.g.{' '}
              <span className="font-mono text-parchment">e4</span>.
            </p>
          </section>

          <section>
            <h3 className="font-mono text-xs uppercase tracking-wide text-brass">Scoring</h3>
            <p className="mt-1">
              One point per piece placed on the right square with the right type. After Check, the correct board shows with your mistakes marked:
            </p>
            <ul className="mt-2 space-y-2">
              <li className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: 'rgba(181,83,60,0.7)' }} />
                red — missed or wrong piece on that square
              </li>
              <li className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: 'rgba(201,161,90,0.7)' }} />
                gold — a piece you added that shouldn't be there
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}