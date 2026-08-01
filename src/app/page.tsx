'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';

const TIME_LIMITS = [3, 5, 10, 15, 30, 45, 60, null];

export default function HomePage() {
    const router = useRouter();
    const [leaving, setLeaving] = useState(false);
    const [timeLimit, setTimeLimit] = useState<number | null>(10);
    const [rangeMode, setRangeMode] = useState(false);
    const [single, setSingle] = useState(14);
    const [range, setRange] = useState<[number, number]>([9, 18]);

    function handleStart() {
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const limitParam = timeLimit === null ? 'unlimited' : String(timeLimit);
        const rangeParam = rangeMode ? `${range[0]}-${range[1]}` : `${single}-${single}`;
        setLeaving(true);
        setTimeout(
            () => router.push(`/train?limit=${limitParam}&range=${rangeParam}`),
            reduce ? 0 : 400,
        );
    }

    return (
        <main
            className={`flex min-h-screen flex-col items-center justify-center px-6 py-10 text-center ${leaving ? 'animate-leave' : ''
                }`}
        >
            <h1
                className="animate-rise font-display text-5xl font-semibold tracking-tight text-parchment sm:text-6xl lg:text-7xl"
                style={{ animationDelay: '0ms' }}
            >
                Blindfold Trainer
            </h1>

            <p
                className="animate-rise mt-6 max-w-2xl font-body text-base text-muted sm:text-lg"
                style={{ animationDelay: '90ms' }}
            >
                Memorize a real position, then rebuild it from memory.
            </p>

            <div className="animate-rise mt-10 w-full max-w-md" style={{ animationDelay: '150ms' }}>
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

            <div className="animate-rise mt-8 w-full max-w-md" style={{ animationDelay: '180ms' }}>
                <div className="mb-3 flex items-center justify-between">
                    <p className="font-mono text-xs uppercase tracking-[0.2em] text-parchment">
                        Pieces
                    </p>
                    <div className="flex gap-1">
                        <button
                            onClick={() => setRangeMode(false)}
                            className={`cursor-pointer rounded px-3 py-1 font-mono text-xs transition ${!rangeMode ? 'bg-brass text-navy' : 'bg-surface text-parchment/80 hover:text-parchment'
                                }`}
                        >
                            Single
                        </button>
                        <button
                            onClick={() => setRangeMode(true)}
                            className={`cursor-pointer rounded px-3 py-1 font-mono text-xs transition ${rangeMode ? 'bg-brass text-navy' : 'bg-surface text-parchment/80 hover:text-parchment'
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

            <button
                onClick={handleStart}
                className="animate-rise mt-10 cursor-pointer rounded-md bg-brass px-8 py-3 font-mono font-semibold text-navy transition duration-200 hover:shadow-lg hover:shadow-brass/20 hover:ring-2 hover:ring-brass/60 hover:ring-offset-2 hover:ring-offset-navy focus:outline-none focus-visible:ring-2 focus-visible:ring-parchment"
                style={{ animationDelay: '200ms' }}
            >
                Start training
            </button>
        </main>
    );
}