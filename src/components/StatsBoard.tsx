'use client';

import { useEffect, useState } from 'react';
import { loadAttempts, clearAttempts, type Attempt } from '../lib/history';
import {
    overallAccuracy,
    accuracyByPieceCount,
    accuracyByFacet,
    accuracyByPieceType,
    accuracyByTimeLimit,
    accuracyBySquare,
} from '../lib/stats';
import { createPortal } from 'react-dom';
import Modal from './Modal';

const SIDE_ORDER = [
    { key: 'queenside', label: 'Queenside' },
    { key: 'kingside', label: 'Kingside' },
];
const HALF_ORDER = [
    { key: 'white', label: 'White half' },
    { key: 'black', label: 'Black half' },
];
const PIECE_ORDER = [
    { key: 'P', label: 'Pawn' }, { key: 'N', label: 'Knight' }, { key: 'B', label: 'Bishop' },
    { key: 'R', label: 'Rook' }, { key: 'Q', label: 'Queen' }, { key: 'K', label: 'King' },
];
const BUCKET_ORDER = [
    { key: '2 to 8', label: '2–8' }, { key: '9 to 16', label: '9–16' },
    { key: '17 to 24', label: '17–24' }, { key: '25 to 32', label: '25–32' },
];
const TIME_ORDER = [
    { key: '3000', label: '3s' }, { key: '5000', label: '5s' }, { key: '10000', label: '10s' },
    { key: '15000', label: '15s' }, { key: '30000', label: '30s' }, { key: '45000', label: '45s' },
    { key: '60000', label: '60s' }, { key: 'unlimited', label: 'Unlimited' },
];
const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const MIN_ATTEMPTS = 3;

function pct(x: number): string {
    return `${Math.round(x * 100)}%`;
}

function heatColor(acc: number): string {
    const g = [110, 139, 91], m = [201, 161, 90], r = [181, 83, 60];
    const lerp = (a: number[], b: number[], t: number) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
    const c = acc < 0.5 ? lerp(r, m, acc / 0.5) : lerp(m, g, (acc - 0.5) / 0.5);
    return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

function Bar({ label, value }: { label: string; value: number }) {
    return (
        <div className="flex items-center gap-2.5">
            <span className="w-20 flex-shrink-0 font-mono text-xs text-parchment">{label}</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate/35">
                <div className="h-full rounded-full" style={{ width: pct(value), backgroundColor: heatColor(value) }} />
            </div>
            <span className="w-9 text-right font-mono text-xs text-brass">{pct(value)}</span>
        </div>
    );
}

function Box({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="rounded-xl border border-slate/40 bg-surface p-4">
            <p className="mb-3 font-mono text-[11px] uppercase tracking-wider text-brass">{title}</p>
            {children}
        </div>
    );
}

function barsFrom(order: { key: string; label: string }[], data: Map<string, number>) {
    const rows = order.filter(({ key }) => data.has(key));
    if (rows.length === 0) return <p className="font-mono text-xs italic text-muted">Keep training to unlock.</p>;
    return (
        <div className="space-y-2">
            {rows.map(({ key, label }) => <Bar key={key} label={label} value={data.get(key)!} />)}
        </div>
    );
}

function HeatmapInfo({ open, onClose }: { open: boolean; onClose: () => void }) {
    return (
        <Modal open={open} onClose={onClose} title="How to read your stats">
            <div className="space-y-4 text-sm text-muted">
                <p><span className="text-parchment">The numbers represent your accuracy.</span> It records whether you obtained the right square with the right piece.</p>
                <p><span className="text-parchment">Per-square heatmap.</span> Each square is colored by how often you place its piece correctly: <span style={{ color: '#6e8b5b' }}>green</span> is strong, <span style={{ color: '#c9a15a' }}>gold</span> mid, <span style={{ color: '#b5533c' }}>red</span> weak. Squares with fewer than {MIN_ATTEMPTS} attempts stay grey. Empty squares are ones no piece has occupied yet in your positions.</p>
                <p><span className="text-parchment">Flip</span> rotates the board to Black&apos;s perspective. The data doesn&apos;t change — only the side you view it from.</p>
                <p><span className="text-parchment">The bars</span> display the same accuracy, separated by where on the board, which piece, how many pieces were showing, and your time limits, so you can spot exactly where your memory drops off.</p>
                <p className="text-xs">Every figure is computed from your own logged attempts. The reset button clears them all.</p>
            </div>
        </Modal>
    );
}

export default function StatsBoard() {
    const [attempts, setAttempts] = useState<Attempt[] | null>(null);
    const [confirming, setConfirming] = useState(false);
    const [flipped, setFlipped] = useState(false);
    const [infoOpen, setInfoOpen] = useState(false);

    useEffect(() => { setAttempts(loadAttempts()); }, []);

    function handleReset() {
        clearAttempts();
        setAttempts([]);
        setConfirming(false);
    }

    if (attempts === null) return null;

    if (attempts.length === 0) {
        return (
            <div className="rounded-xl border border-slate/40 bg-surface p-5">
                <p className="text-sm text-muted">No attempts yet — train a position to start tracking your accuracy.</p>
            </div>
        );
    }

    const overall = overallAccuracy(attempts);
    const bySide = accuracyByFacet(attempts, 'side');
    const byHalf = accuracyByFacet(attempts, 'half');
    const byPiece = accuracyByPieceType(attempts);
    const byCount = accuracyByPieceCount(attempts);
    const byTime = accuracyByTimeLimit(attempts);
    const bySquare = accuracyBySquare(attempts);

    const timeRows = TIME_ORDER.filter(({ key }) => (byTime.get(key)?.attempts ?? 0) >= MIN_ATTEMPTS);

    return (
        <div className="space-y-3.5">
            <div className="flex items-baseline justify-between gap-4 rounded-xl border border-slate/40 bg-surface px-6 py-5">
                <div className="flex items-baseline gap-4">
                    <div>
                        <p className="font-mono text-[11px] uppercase tracking-wider text-muted">Overall accuracy</p>
                        <p className="font-display text-5xl font-semibold text-parchment">{pct(overall)}</p>
                    </div>
                    <p className="text-xs text-muted">across {attempts.length} attempts</p>
                </div>
                <button
                    onClick={() => setInfoOpen(true)}
                    aria-label="How to read your stats"
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md border border-slate bg-surface font-mono text-lg text-parchment transition hover:border-brass hover:text-brass"
                >
                    ?
                </button>
            </div>

            <div className="grid gap-3.5 md:grid-cols-2">
                <div className="rounded-xl border border-slate/40 bg-surface p-4 md:row-span-2">
                    <div className="mb-3 flex items-center justify-between">
                        <p className="font-mono text-[11px] uppercase tracking-wider text-brass">Per-square accuracy</p>
                        <button
                            onClick={() => setFlipped((f) => !f)}
                            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate bg-surface px-2.5 font-mono text-xs text-muted transition hover:border-brass hover:text-brass"
                        >
                            ⟳ Flip
                        </button>
                    </div>

                    <div className="grid grid-cols-[auto_1fr] grid-rows-[1fr_auto] gap-x-1.5 gap-y-1">
                        <div className="flex flex-col justify-between py-[2px] font-mono text-[9px] text-muted">
                            <span>{flipped ? 1 : 8}</span>
                            <span>{flipped ? 8 : 1}</span>
                        </div>

                        <div
                            className="grid aspect-square grid-cols-8 gap-0.5 transition-transform duration-500"
                            style={{ transform: flipped ? 'rotate(180deg)' : 'rotate(0deg)' }}
                        >
                            {[8, 7, 6, 5, 4, 3, 2, 1].map((r) =>
                                FILES.map((f) => {
                                    const key = `${f}${r}`;
                                    const stat = bySquare.get(key);
                                    let bg = 'rgba(58,78,99,0.22)';
                                    let text = '';
                                    if (stat && stat.attempts >= MIN_ATTEMPTS) {
                                        bg = heatColor(Math.min(stat.accuracy, 1));
                                        text = String(Math.round(stat.accuracy * 100));
                                    } else if (stat) {
                                        bg = 'rgba(58,78,99,0.5)';
                                    }
                                    return (
                                        <div
                                            key={key}
                                            className="flex aspect-square items-center justify-center rounded-sm font-mono text-[8px] font-semibold"
                                            style={{
                                                backgroundColor: bg,
                                                color: 'rgba(13,27,42,0.8)',
                                                transform: flipped ? 'rotate(180deg)' : 'rotate(0deg)',
                                            }}
                                        >
                                            {text}
                                        </div>
                                    );
                                }),
                            )}
                        </div>

                        <div />
                        <div className="flex justify-between px-[2px] font-mono text-[9px] text-muted">
                            <span>{flipped ? 'h' : 'a'}</span>
                            <span>{flipped ? 'a' : 'h'}</span>
                        </div>
                    </div>

                    <div className="mt-3 flex items-center gap-2 font-mono text-[10px] text-muted">
                        <span>Weak</span>
                        <span className="h-1.5 flex-1 rounded-full" style={{ background: 'linear-gradient(90deg,#b5533c,#c9a15a,#6e8b5b)' }} />
                        <span>Strong</span>
                    </div>
                </div>

                <Box title="Where · side & half">
                    <div className="space-y-2">
                        {barsFrom(SIDE_ORDER, bySide)}
                        <div className="my-1 border-t border-slate/25" />
                        {barsFrom(HALF_ORDER, byHalf)}
                    </div>
                </Box>

                <Box title="What · piece type">{barsFrom(PIECE_ORDER, byPiece)}</Box>
                <Box title="Difficulty · piece count">{barsFrom(BUCKET_ORDER, byCount)}</Box>
                <Box title="Conditions · time limit">
                    {timeRows.length === 0
                        ? <p className="font-mono text-xs italic text-muted">Keep training to unlock.</p>
                        : <div className="space-y-2">{timeRows.map(({ key, label }) => <Bar key={key} label={label} value={byTime.get(key)!.accuracy} />)}</div>}
                </Box>
            </div>

            <div className="rounded-xl border border-slate/40 bg-surface px-4 py-3">
                {confirming ? (
                    <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-muted">Clear all attempts?</span>
                        <button onClick={handleReset} className="inline-flex h-11 items-center rounded-md border border-rust bg-surface px-4 font-mono text-sm text-rust transition hover:bg-rust hover:text-navy">Yes, reset</button>
                        <button onClick={() => setConfirming(false)} className="inline-flex h-11 items-center rounded-md border border-slate bg-surface px-4 font-mono text-sm text-muted transition hover:border-brass hover:text-parchment">Cancel</button>
                    </div>
                ) : (
                    <button onClick={() => setConfirming(true)} className="inline-flex h-11 items-center gap-2 rounded-md border border-slate bg-surface px-4 font-mono text-sm text-muted transition hover:border-rust hover:text-rust">Reset stats</button>
                )}
            </div>

            <HeatmapInfo open={infoOpen} onClose={() => setInfoOpen(false)} />
        </div>
    );
}