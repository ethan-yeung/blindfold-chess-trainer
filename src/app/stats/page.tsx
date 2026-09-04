'use client';

import { useState } from 'react';
import Link from 'next/link';
import StatsBoard from '../../components/StatsBoard';
import RecallStats from '../../components/RecallStats';
import EloStats from '../../components/EloStats';

export default function StatsPage() {
    const [view, setView] = useState<'reconstruction' | 'recall' | 'elo'>('reconstruction');

    return (
        <main className="mx-auto max-w-4xl px-6 py-12">
            <Link
                href="/"
                className="animate-rise inline-flex h-11 items-center gap-2 rounded-md border border-slate bg-surface px-4 font-mono text-sm text-parchment transition hover:border-brass hover:text-brass focus:outline-none focus-visible:ring-2 focus-visible:ring-brass"
                style={{ animationDelay: '0ms' }}
            >
                ← Back
            </Link>

            <h1
                className="animate-rise mt-6 font-display text-3xl text-parchment"
                style={{ animationDelay: '90ms' }}
            >
                Stats
            </h1>

            <div
                className="animate-rise mt-6 inline-flex rounded-lg border border-slate/40 bg-surface p-1"
                style={{ animationDelay: '120ms' }}
            >
                <button
                    onClick={() => setView('reconstruction')}
                    className={`rounded-md px-4 py-2 font-mono text-sm transition ${view === 'reconstruction'
                        ? 'bg-brass text-navy'
                        : 'text-muted hover:text-parchment'
                        }`}
                >
                    Reconstruction
                </button>
                <button
                    onClick={() => setView('recall')}
                    className={`rounded-md px-4 py-2 font-mono text-sm transition ${view === 'recall'
                        ? 'bg-brass text-navy'
                        : 'text-muted hover:text-parchment'
                        }`}
                >
                    Move Recall
                </button>
                <button
                    onClick={() => setView('elo')}
                    className={`rounded-md px-4 py-2 font-mono text-sm transition ${view === 'elo' ? 'bg-brass text-navy' : 'text-muted hover:text-parchment'
                        }`}
                >
                    Guess the Elo
                </button>
            </div>

            <div className="animate-rise mt-6" style={{ animationDelay: '150ms' }}>
                {view === 'reconstruction' ? <StatsBoard /> : view === 'recall' ? <RecallStats /> : <EloStats />}
            </div>
        </main>
    );
}