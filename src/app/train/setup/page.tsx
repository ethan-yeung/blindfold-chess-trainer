'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import Link from 'next/link';

const TIME_LIMITS = [3, 5, 10, 15, 30, 45, 60, null];

export default function TrainSetupPage() {
    const router = useRouter();
    const [timeLimit, setTimeLimit] = useState<number | null>(10);
    const [rangeMode, setRangeMode] = useState(false);
    const [single, setSingle] = useState(14);
    const [range, setRange] = useState<[number, number]>([9, 18]);
    const [orientation, setOrientation] = useState<'white' | 'black'>('white');

    function handleStart() {
        const limitParam = timeLimit === null ? 'unlimited' : String(timeLimit);
        const rangeParam = rangeMode ? `${range[0]}-${range[1]}` : `${single}-${single}`;
        router.push(`/train?limit=${limitParam}&range=${rangeParam}&orientation=${orientation}`);
    }

    return (
        <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12 text-center sm:px-6">
            <h1
                className="animate-fade font-display text-3xl font-semibold tracking-tight text-parchment sm:text-5xl"
                style={{ animationDelay: '0ms' }}
            >
                Memorize Position
            </h1>

            <p
                className="animate-fade mt-3 max-w-xl font-body text-sm text-muted sm:mt-4 sm:text-lg"
                style={{ animationDelay: '90ms' }}
            >
                Memorize a real position, then rebuild it from memory.
            </p>

            <div className="animate-fade mt-10 w-full max-w-md" style={{ animationDelay: '150ms' }}>
                <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-parchment">
                    Time limit
                </p>
                <div className="grid grid-cols-4 gap-2">
                    {TIME_LIMITS.map((limit) => {
                        const selected = timeLimit === limit;
                        return (
                            <button
                                key={limit ?? 'unlimited'}
                                onClick={() => setTimeLimit(limit)}
                                className={`cursor-pointer rounded-md px-2 py-2 font-mono text-xs transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-parchment ${selected
                                    ? 'bg-brass text-navy ring-2 ring-parchment/70 ring-offset-2 ring-offset-navy'
                                    : 'bg-surface text-parchment/80 hover:text-parchment hover:ring-2 hover:ring-brass/50'
                                    }`}
                            >
                                {limit === null ? 'Endless' : `${limit}s`}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="animate-fade mt-8 w-full max-w-md" style={{ animationDelay: '180ms' }}>
                <div className="mb-3 flex items-center justify-between">
                    <p className="font-mono text-xs uppercase tracking-[0.2em] text-parchment">
                        Pieces
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setRangeMode(false)}
                            className={`flex-1 cursor-pointer rounded-md px-3 py-2 font-mono text-xs transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-parchment ${!rangeMode
                                ? 'bg-brass text-navy ring-2 ring-parchment/70 ring-offset-2 ring-offset-navy'
                                : 'bg-surface text-parchment/80 hover:text-parchment hover:ring-2 hover:ring-brass/50'
                                }`}
                        >
                            Single
                        </button>
                        <button
                            onClick={() => setRangeMode(true)}
                            className={`flex-1 cursor-pointer rounded-md px-3 py-2 font-mono text-xs transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-parchment ${rangeMode
                                ? 'bg-brass text-navy ring-2 ring-parchment/70 ring-offset-2 ring-offset-navy'
                                : 'bg-surface text-parchment/80 hover:text-parchment hover:ring-2 hover:ring-brass/50'
                                }`}
                        >
                            Range
                        </button>
                    </div>
                </div>

                <div className="px-1 pt-2">
                    <Slider
                        range={rangeMode}
                        min={3}
                        max={32}
                        allowCross={false}
                        value={rangeMode ? range : single}
                        onChange={(v) =>
                            rangeMode ? setRange(v as [number, number]) : setSingle(v as number)
                        }
                        railStyle={{ backgroundColor: 'var(--color-slate)', height: 6 }}
                        trackStyle={{ backgroundColor: 'var(--color-brass)', height: 6 }}
                        handleStyle={{
                            borderColor: 'var(--color-brass)',
                            backgroundColor: 'var(--color-parchment)',
                            opacity: 1,
                            width: 18,
                            height: 18,
                            marginTop: -6,
                        }}
                    />
                </div>

                <p className="mt-3 text-center font-mono text-sm text-parchment">
                    {rangeMode ? `${range[0]}–${range[1]} pieces` : `${single} pieces`}
                </p>
            </div>

            <div className="animate-fade mt-8 w-full max-w-md" style={{ animationDelay: '190ms' }}>
                <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-parchment">
                    Perspective
                </p>
                <div className="flex gap-2">
                    <button
                        onClick={() => setOrientation('white')}
                        className={`flex-1 cursor-pointer rounded-md px-3 py-2 font-mono text-xs transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-parchment ${orientation === 'white'
                            ? 'bg-brass text-navy ring-2 ring-parchment/70 ring-offset-2 ring-offset-navy'
                            : 'bg-surface text-parchment/80 hover:text-parchment hover:ring-2 hover:ring-brass/50'
                            }`}
                    >
                        White
                    </button>
                    <button
                        onClick={() => setOrientation('black')}
                        className={`flex-1 cursor-pointer rounded-md px-3 py-2 font-mono text-xs transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-parchment ${orientation === 'black'
                            ? 'bg-brass text-navy ring-2 ring-parchment/70 ring-offset-2 ring-offset-navy'
                            : 'bg-surface text-parchment/80 hover:text-parchment hover:ring-2 hover:ring-brass/50'
                            }`}
                    >
                        Black
                    </button>
                </div>
            </div>

            <button
                onClick={handleStart}
                className="animate-fade mt-10 flex h-12 w-full max-w-xs cursor-pointer items-center justify-center rounded-md bg-brass px-8 font-mono text-sm font-semibold text-navy transition duration-200 hover:shadow-lg hover:shadow-brass/20 hover:ring-2 hover:ring-brass/60 hover:ring-offset-2 hover:ring-offset-navy focus:outline-none focus-visible:ring-2 focus-visible:ring-parchment"
                style={{ animationDelay: '200ms' }}
            >
                Start training
            </button>

            <Link
                href="/"
                className="animate-fade mt-3 inline-flex h-12 w-full max-w-xs items-center justify-center rounded-md border border-slate bg-surface px-6 font-mono text-sm text-parchment transition hover:border-brass hover:text-brass focus:outline-none focus-visible:ring-2 focus-visible:ring-brass sm:mt-4"
                style={{ animationDelay: '240ms' }}
            >
                ← Home
            </Link>
        </main>
    );
}