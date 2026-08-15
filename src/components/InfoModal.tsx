'use client';

import Modal from './Modal';

type InfoModalProps = { open: boolean; onClose: () => void };

export default function InfoModal({ open, onClose }: InfoModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="How it works">
      <div className="space-y-5 text-sm text-muted">
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
              gold — a piece you added that shouldn&apos;t be there
            </li>
          </ul>
        </section>
      </div>
    </Modal>
  );
}