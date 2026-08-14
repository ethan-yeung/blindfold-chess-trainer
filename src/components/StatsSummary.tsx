'use client';

import { useEffect, useState } from 'react';
import { loadAttempts, clearAttempts, type Attempt } from '../lib/history';
import { overallAccuracy, accuracyByPieceCount, accuracyByFacet, accuracyByPieceType, accuracyByTimeLimit } from '../lib/stats';

const BUCKET_ORDER = ['2 to 8', '9 to 16', '17 to 24', '25 to 32'];

const SIDE_ORDER = [
    { key: 'queenside', label: 'Queenside' },
    { key: 'kingside', label: 'Kingside' },
];

const HALF_ORDER = [
    { key: 'white', label: 'White half' },
    { key: 'black', label: 'Black half' },
];

const QUADRANT_ORDER = [
    { key: 'queenside-white', label: 'Queenside / White' },
    { key: 'kingside-white', label: 'Kingside / White' },
    { key: 'queenside-black', label: 'Queenside / Black' },
    { key: 'kingside-black', label: 'Kingside / Black' },
];

const PIECE_ORDER = [
    { key: 'P', label: 'Pawn' },
    { key: 'N', label: 'Knight' },
    { key: 'B', label: 'Bishop' },
    { key: 'R', label: 'Rook' },
    { key: 'Q', label: 'Queen' },
    { key: 'K', label: 'King' },
];

const TIME_ORDER = [
  { key: '3000', label: '3s' },
  { key: '5000', label: '5s' },
  { key: '10000', label: '10s' },
  { key: '15000', label: '15s' },
  { key: '30000', label: '30s' },
  { key: '45000', label: '45s' },
  { key: '60000', label: '60s' },
  { key: 'unlimited', label: 'Unlimited' },
];


const MIN_ATTEMPTS = 3;

function pct(x: number): string {
    return `${Math.round(x * 100)}%`;
}

function StatBlock({
    title,
    order,
    data,
}: {
    title: string;
    order: { key: string; label: string }[];
    data: Map<string, number>;
}) {
    return (
        <div className="mt-5">
            <p className="font-mono text-xs uppercase tracking-wide text-muted">{title}</p>
            <ul className="mt-2 space-y-1.5">
                {order
                    .filter(({ key }) => data.has(key))
                    .map(({ key, label }) => (
                        <li key={key} className="flex items-center justify-between">
                            <span className="font-mono text-sm text-parchment">{label}</span>
                            <span className="font-mono text-sm text-brass">{pct(data.get(key)!)}</span>
                        </li>
                    ))}
            </ul>
        </div>
    );
}

export default function StatsSummary() {
    const [attempts, setAttempts] = useState<Attempt[] | null>(null);
    const [confirming, setConfirming] = useState(false);

    useEffect(() => {
        setAttempts(loadAttempts());
    }, []);

    function handleReset() {
        clearAttempts();
        setAttempts([]);
        setConfirming(false);
    }

    if (attempts === null) return null;

    if (attempts.length === 0) {
        return (
            <div className="rounded-xl border border-slate/40 bg-surface p-5">
                <p className="text-sm text-muted">
                    No attempts yet — train a position to start tracking your accuracy.
                </p>
            </div>
        );
    }

    const overall = overallAccuracy(attempts);
    const byCount = accuracyByPieceCount(attempts);
    const bySide = accuracyByFacet(attempts, 'side');
    const byHalf = accuracyByFacet(attempts, 'half');
    const byQuadrant = accuracyByFacet(attempts, 'quadrant');
    const byPiece = accuracyByPieceType(attempts);
    const byTime = accuracyByTimeLimit(attempts);

    return (
        <div className="rounded-xl border border-slate/40 bg-surface p-5">
            <div className="mt-1">
                <p className="font-mono text-xs uppercase tracking-wide text-muted">Overall accuracy</p>
                <p className="font-display text-4xl text-parchment">{pct(overall)}</p>
                <p className="mt-1 text-xs text-muted">across {attempts.length} attempts</p>
            </div>

            <StatBlock title="By piece count" order={BUCKET_ORDER.map((l) => ({ key: l, label: `${l} pieces` }))} data={byCount} />
            <StatBlock title="By side" order={SIDE_ORDER} data={bySide} />
            <StatBlock title="By half" order={HALF_ORDER} data={byHalf} />
            <StatBlock title="By quadrant" order={QUADRANT_ORDER} data={byQuadrant} />
            <StatBlock title="By piece type" order={PIECE_ORDER} data={byPiece} />

            <div className="mt-5">
                <p className="font-mono text-xs uppercase tracking-wide text-muted">By time limit</p>
                <ul className="mt-2 space-y-1.5">
                    {TIME_ORDER
                        .filter(({ key }) => (byTime.get(key)?.attempts ?? 0) >= MIN_ATTEMPTS)
                        .map(({ key, label }) => (
                            <li key={key} className="flex items-center justify-between">
                                <span className="font-mono text-sm text-parchment">{label}</span>
                                <span className="font-mono text-sm text-brass">{pct(byTime.get(key)!.accuracy)}</span>
                            </li>
                        ))}
                </ul>
            </div>

            <div className="mt-6 border-t border-slate/30 pt-4">
                {confirming ? (
                    <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-muted">Clear all attempts?</span>
                        <button onClick={handleReset} className="inline-flex h-11 items-center rounded-md border border-rust bg-surface px-4 font-mono text-sm text-rust transition hover:bg-rust hover:text-navy focus:outline-none focus-visible:ring-2 focus-visible:ring-rust">Yes, reset</button>
                        <button onClick={() => setConfirming(false)} className="inline-flex h-11 items-center rounded-md border border-slate bg-surface px-4 font-mono text-sm text-muted transition hover:border-brass hover:text-parchment focus:outline-none focus-visible:ring-2 focus-visible:ring-brass">Cancel</button>
                    </div>
                ) : (
                    <button onClick={() => setConfirming(true)} className="inline-flex h-11 items-center gap-2 rounded-md border border-slate bg-surface px-4 font-mono text-sm text-muted transition hover:border-rust hover:text-rust focus:outline-none focus-visible:ring-2 focus-visible:ring-rust">Reset stats</button>
                )}
            </div>
        </div>
    );
}