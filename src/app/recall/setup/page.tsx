'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const TIERS = [
    { name: 'Super quick', label: 'Super Quick', desc: '4–9' },
    { name: 'Quick', label: 'Quick', desc: '10–15' },
    { name: 'Short', label: 'Short', desc: '16–22' },
    { name: 'Medium', label: 'Medium', desc: '23–30' },
    { name: 'Long', label: 'Long', desc: '31–40' },
    { name: 'Extra long', label: 'Extra Long', desc: '41–55' },
];

const STUDY_OPTIONS = [15, 30, 45, 60, 90, 'unlimited'] as const;

export default function RecallSetupPage() {
    const router = useRouter();
    const [tier, setTier] = useState('Medium');
    const [mode, setMode] = useState<'casual' | 'hard'>('casual');
    const [study, setStudy] = useState<number | 'unlimited'>(45);

    function handleStart() {
        const tierParam = encodeURIComponent(tier);
        router.push(`/recall?tier=${tierParam}&mode=${mode}&study=${study}`);
    }

    return (
        <main className="flex min-h-screen flex-col items-center justify-center px-6 py-10 text-center">
            <h1
                className="animate-rise font-display text-4xl font-semibold tracking-tight text-parchment sm:text-5xl"
                style={{ animationDelay: '0ms' }}
            >
                Move Recall
            </h1>

            <p
                className="animate-rise mt-4 max-w-xl font-body text-base text-muted sm:text-lg"
                style={{ animationDelay: '90ms' }}
            >
                Study a real game, then replay it from memory.
            </p>

            <div className="animate-rise mt-10 w-full max-w-md" style={{ animationDelay: '150ms' }}>
                <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-parchment">
                    Number of Moves
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {TIERS.map((t) => {
                        const selected = tier === t.name;
                        return (
                            <button
                                key={t.name}
                                onClick={() => setTier(t.name)}
                                className={`flex items-center justify-between rounded-md px-4 py-3 font-mono text-sm transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-parchment ${selected
                                    ? 'bg-brass text-navy ring-2 ring-parchment/70 ring-offset-2 ring-offset-navy'
                                    : 'bg-surface text-parchment/80 hover:text-parchment hover:ring-2 hover:ring-brass/50'
                                    }`}
                            >
                                <span className="font-semibold">{t.label}</span>
                                <span className={selected ? 'text-navy/70' : 'text-muted'}>{t.desc}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="animate-rise mt-8 w-full max-w-md" style={{ animationDelay: '190ms' }}>
                <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-parchment">
                    Mode
                </p>
                <div className="flex gap-2">
                    <button
                        onClick={() => setMode('casual')}
                        className={`flex-1 rounded-md px-3 py-2 font-mono text-xs transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-parchment ${mode === 'casual'
                            ? 'bg-brass text-navy ring-2 ring-parchment/70 ring-offset-2 ring-offset-navy'
                            : 'bg-surface text-parchment/80 hover:text-parchment hover:ring-2 hover:ring-brass/50'
                            }`}
                    >
                        Casual
                    </button>
                    <button
                        onClick={() => setMode('hard')}
                        className={`flex-1 rounded-md px-3 py-2 font-mono text-xs transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-parchment ${mode === 'hard'
                            ? 'bg-brass text-navy ring-2 ring-parchment/70 ring-offset-2 ring-offset-navy'
                            : 'bg-surface text-parchment/80 hover:text-parchment hover:ring-2 hover:ring-brass/50'
                            }`}
                    >
                        Hard
                    </button>
                </div>
                <p className="mt-2 font-mono text-xs text-muted">
                    {mode === 'casual'
                        ? 'Bounce back to study any time. Low pressure.'
                        : 'No going back. Recall the whole game in one go.'}
                </p>
            </div>
            <div className="animate-rise mt-8 w-full max-w-md" style={{ animationDelay: '210ms' }}>
                <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-parchment">
                    Study time
                </p>
                <div className="grid grid-cols-3 gap-2">
                    {STUDY_OPTIONS.map((s) => {
                        const selected = study === s;
                        const label = s === 'unlimited' ? 'Endless' : `${s}s`;
                        return (
                            <button
                                key={s}
                                onClick={() => setStudy(s)}
                                className={`rounded-md px-3 py-2 font-mono text-xs transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-parchment ${selected
                                    ? 'bg-brass text-navy ring-2 ring-parchment/70 ring-offset-2 ring-offset-navy'
                                    : 'bg-surface text-parchment/80 hover:text-parchment hover:ring-2 hover:ring-brass/50'
                                    }`}
                            >
                                {label}
                            </button>
                        );
                    })}
                </div>
            </div>
            <button
                onClick={handleStart}
                className="animate-rise mt-10 flex h-12 w-full max-w-xs items-center justify-center rounded-md bg-brass px-8 font-mono font-semibold text-navy transition duration-200 hover:shadow-lg hover:shadow-brass/20 hover:ring-2 hover:ring-brass/60 hover:ring-offset-2 hover:ring-offset-navy focus:outline-none focus-visible:ring-2 focus-visible:ring-parchment"
                style={{ animationDelay: '250ms' }}
            >
                Start recall
            </button>

            <Link
                href="/"
                className="animate-rise mt-4 inline-flex h-12 w-full max-w-xs items-center justify-center rounded-md border border-slate bg-surface px-6 font-mono text-sm text-parchment transition hover:border-brass hover:text-brass focus:outline-none focus-visible:ring-2 focus-visible:ring-brass"
                style={{ animationDelay: '290ms' }}
            >
                ← Home
            </Link>
        </main>
    );
}