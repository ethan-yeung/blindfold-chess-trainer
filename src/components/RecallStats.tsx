'use client';

import { useEffect, useState } from 'react';
import { loadRecallAttempts, clearRecallAttempts, type RecallAttempt } from '../lib/recall-history';
import {
    recallOverall,
    recallByMode,
    recallByTier,
    recallAssistedRate,
} from '../lib/recall-stats';
import Modal from './Modal';

const MODE_ORDER = [
    { key: 'casual', label: 'Casual' },
    { key: 'hard', label: 'Hard' },
];

const TIER_ORDER = [
    { key: 'Super quick', label: 'Super Quick' },
    { key: 'Quick', label: 'Quick' },
    { key: 'Short', label: 'Short' },
    { key: 'Medium', label: 'Medium' },
    { key: 'Long', label: 'Long' },
    { key: 'Extra long', label: 'Extra Long' },
];

const MIN_RUNS = 3;

function tierLabel(key: string): string {
  return key.replace(/\b\w/g, (c) => c.toUpperCase());
}

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


function RecallInfo({ open, onClose }: { open: boolean; onClose: () => void }) {
    return (
        <Modal open={open} onClose={onClose} title="How to read your recall stats">
            <div className="space-y-4 text-sm text-muted">
                <p><span className="text-parchment">First-try accuracy.</span> A move counts only if you play it correctly on the first attempt, with no wrong tries and no hint. It&apos;s the honest measure of what you recalled from memory.</p>
                <p><span className="text-parchment">Casual vs hard.</span> Both are tracked separately so you can compare. Hard has no going back to study, so lower accuracy there is expected — it&apos;s the truer test.</p>
                <p><span className="text-parchment">By difficulty.</span> Grouped by game length. If accuracy drops on longer games, that&apos;s your edge to push.</p>
                <p><span className="text-parchment">Hint reliance.</span> How often you leaned on a hint. Lower is stronger recall.</p>
                <p className="text-xs">Buckets with fewer than {MIN_RUNS} runs stay hidden until you&apos;ve played enough. Every figure is from your own logged runs.</p>
            </div>
        </Modal>
    );
}


export default function RecallStats() {
    const [attempts, setAttempts] = useState<RecallAttempt[] | null>(null);
    const [confirming, setConfirming] = useState(false);
    const [infoOpen, setInfoOpen] = useState(false);

    useEffect(() => { setAttempts(loadRecallAttempts()); }, []);

    function handleReset() {
        clearRecallAttempts();
        setAttempts([]);
        setConfirming(false);
    }

    if (attempts === null) return null;

    if (attempts.length === 0) {
        return (
            <div className="rounded-xl border border-slate/40 bg-surface p-5">
                <p className="text-sm text-muted">No recall runs yet — play a game in move recall to start tracking.</p>
            </div>
        );
    }

    const overall = recallOverall(attempts);
    const byMode = recallByMode(attempts);
    const byTier = recallByTier(attempts);
    const assisted = recallAssistedRate(attempts);
    const modeRows = MODE_ORDER.filter(({ key }) => (byMode.get(key)?.runs ?? 0) >= MIN_RUNS);
    const tierRows = TIER_ORDER.filter(({ key }) => (byTier.get(key)?.runs ?? 0) >= MIN_RUNS);

    return (
        <div className="space-y-3.5">
            <div className="flex items-baseline justify-between gap-4 rounded-xl border border-slate/40 bg-surface px-6 py-5">
                <div className="flex items-baseline gap-4">
                    <div>
                        <p className="font-mono text-[11px] uppercase tracking-wider text-muted">First-try accuracy</p>
                        <p className="font-display text-5xl font-semibold text-parchment">{pct(overall)}</p>
                    </div>
                    <p className="text-xs text-muted">across {attempts.length} runs</p>
                </div>
                <button
                    onClick={() => setInfoOpen(true)}
                    aria-label="How to read your recall stats"
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md border border-slate bg-surface font-mono text-lg text-parchment transition hover:border-brass hover:text-brass"
                >
                    ?
                </button>
            </div>

            <div className="grid gap-3.5 md:grid-cols-2">
                <Box title="Mode · casual vs hard">
                    {modeRows.length === 0
                        ? <p className="font-mono text-xs italic text-muted">Play {MIN_RUNS}+ runs in a mode to compare.</p>
                        : <div className="space-y-2">{modeRows.map(({ key, label }) => <Bar key={key} label={label} value={byMode.get(key)!.accuracy} />)}</div>}
                </Box>

                <Box title="Reliance · hints">
                    <div className="space-y-2">
                        <Bar label="Assisted" value={assisted} />
                        <p className="font-mono text-[10px] text-muted">Share of moves where you used a hint. Lower is stronger.</p>
                    </div>
                </Box>

                <div className="md:col-span-2">
                    <Box title="Difficulty · game length">
                        {tierRows.length === 0
                            ? <p className="font-mono text-xs italic text-muted">Play {MIN_RUNS}+ runs at a difficulty to unlock.</p>
                            : <div className="space-y-2">{tierRows.map(({ key, label }) => <Bar key={key} label={label} value={byTier.get(key)!.accuracy} />)}</div>}
                    </Box>
                </div>
            </div>

            <div className="rounded-xl border border-slate/40 bg-surface px-4 py-3">
                {confirming ? (
                    <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-muted">Clear all recall runs?</span>
                        <button onClick={handleReset} className="inline-flex h-11 items-center rounded-md border border-rust bg-surface px-4 font-mono text-sm text-rust transition hover:bg-rust hover:text-navy">Yes, reset</button>
                        <button onClick={() => setConfirming(false)} className="inline-flex h-11 items-center rounded-md border border-slate bg-surface px-4 font-mono text-sm text-muted transition hover:border-brass hover:text-parchment">Cancel</button>
                    </div>
                ) : (
                    <button onClick={() => setConfirming(true)} className="inline-flex h-11 items-center gap-2 rounded-md border border-slate bg-surface px-4 font-mono text-sm text-muted transition hover:border-rust hover:text-rust">Reset recall stats</button>
                )}
            </div>

            <RecallInfo open={infoOpen} onClose={() => setInfoOpen(false)} />
        </div>
    );
}