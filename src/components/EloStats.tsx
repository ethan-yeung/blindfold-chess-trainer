'use client';

import { useEffect, useState } from 'react';
import { loadEloAttempts, clearEloAttempts, type EloAttempt } from '../lib/elo-history';

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

const BANDS = [
    { key: 1000, label: '1000s' },
    { key: 1200, label: '1200s' },
    { key: 1400, label: '1400s' },
    { key: 1600, label: '1600s' },
    { key: 1800, label: '1800s' },
    { key: 2000, label: '2000s' },
    { key: 2200, label: '2200s' },
];
const MIN_ATTEMPTS = 3;

export default function EloStats() {
    const [attempts, setAttempts] = useState<EloAttempt[] | null>(null);
    const [confirming, setConfirming] = useState(false);

    useEffect(() => { setAttempts(loadEloAttempts()); }, []);

    function handleReset() {
        clearEloAttempts();
        setAttempts([]);
        setConfirming(false);
    }

    if (attempts === null) return null;

    if (attempts.length === 0) {
        return (
            <div className="rounded-xl border border-slate/40 bg-surface p-5">
                <p className="text-sm text-muted">No guesses yet — play Guess the Elo to start tracking.</p>
            </div>
        );
    }

    const overall = attempts.reduce((s, a) => s + a.score, 0) / attempts.length;
    const avgOff = Math.round(
        attempts.reduce((s, a) => s + Math.abs(a.guess - a.actual), 0) / attempts.length,
    );
    const spotOn = attempts.filter((a) => a.score === 1).length;

    const byBand = new Map<number, { total: number; count: number }>();
    for (const a of attempts) {
        const band = Math.floor(a.actual / 200) * 200;
        const b = byBand.get(band) ?? { total: 0, count: 0 };
        b.total += a.score;
        b.count += 1;
        byBand.set(band, b);
    }
    const bandRows = BANDS.filter(({ key }) => (byBand.get(key)?.count ?? 0) >= MIN_ATTEMPTS);

    return (
        <div className="space-y-3.5">
            <div className="flex items-baseline gap-4 rounded-xl border border-slate/40 bg-surface px-6 py-5">
                <div>
                    <p className="font-mono text-[11px] uppercase tracking-wider text-muted">Average score</p>
                    <p className="font-display text-5xl font-semibold text-parchment">{pct(overall)}</p>
                </div>
                <p className="text-xs text-muted">across {attempts.length} guesses</p>
            </div>

            <div className="grid gap-3.5 md:grid-cols-2">
                <Box title="Accuracy">
                    <div className="space-y-2 font-mono text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted">Average miss</span>
                            <span className="text-brass">{avgOff} pts</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted">Spot on</span>
                            <span className="text-brass">{spotOn} / {attempts.length}</span>
                        </div>
                    </div>
                </Box>

                <Box title="By rating band">
                    {bandRows.length === 0
                        ? <p className="font-mono text-xs italic text-muted">Play {MIN_ATTEMPTS}+ games in a band to unlock.</p>
                        : <div className="space-y-2">
                            {bandRows.map(({ key, label }) => {
                                const b = byBand.get(key)!;
                                return <Bar key={key} label={label} value={b.total / b.count} />;
                            })}
                        </div>}
                </Box>
            </div>

            <div className="rounded-xl border border-slate/40 bg-surface px-4 py-3">
                {confirming ? (
                    <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-muted">Clear all guesses?</span>
                        <button onClick={handleReset} className="inline-flex h-11 items-center rounded-md border border-rust bg-surface px-4 font-mono text-sm text-rust transition hover:bg-rust hover:text-navy">Yes, reset</button>
                        <button onClick={() => setConfirming(false)} className="inline-flex h-11 items-center rounded-md border border-slate bg-surface px-4 font-mono text-sm text-muted transition hover:border-brass hover:text-parchment">Cancel</button>
                    </div>
                ) : (
                    <button onClick={() => setConfirming(true)} className="inline-flex h-11 items-center gap-2 rounded-md border border-slate bg-surface px-4 font-mono text-sm text-muted transition hover:border-rust hover:text-rust">Reset elo stats</button>
                )}
            </div>
        </div>
    );
}