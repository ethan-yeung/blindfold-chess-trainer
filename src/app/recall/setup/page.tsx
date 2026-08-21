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

const STUDY_OPTIONS = [15, 30, 45, 60, 90, 'endless'] as const;
const PERMOVE_OPTIONS = [3, 5, 10, 15, 20, 'endless'] as const;

function Section({
    label,
    delay,
    grow = false,
    children,
}: {
    label: string;
    delay: number;
    grow?: boolean;
    children: React.ReactNode;
}) {
    return (
        <div
            className={`animate-fade flex w-full flex-col ${grow ? 'flex-1' : ''}`}
            style={{ animationDelay: `${delay}ms` }}
        >
            <p className="mb-3 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-parchment sm:text-xs">
                {label}
            </p>
            <div className={grow ? 'flex-1' : ''}>{children}</div>
        </div>
    );
}

export default function RecallSetupPage() {
    const router = useRouter();
    const [tier, setTier] = useState('Super quick');
    const [mode, setMode] = useState<'casual' | 'hard'>('casual');
    const [study, setStudy] = useState<number | 'endless'>(30);
    const [permove, setPermove] = useState<number | 'endless'>('endless');
    const [orientation, setOrientation] = useState<'white' | 'black'>('white');

    function handleStart() {
        const tierParam = encodeURIComponent(tier);
        router.push(
            `/recall?tier=${tierParam}&mode=${mode}&study=${study}&permove=${permove}&orientation=${orientation}`,
        );
    }

    const base = (selected: boolean) =>
        `rounded-md font-mono text-[11px] transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-parchment sm:text-xs ${selected
            ? 'bg-brass text-navy ring-2 ring-parchment/70 ring-offset-2 ring-offset-navy'
            : 'bg-surface text-parchment/80 hover:text-parchment hover:ring-2 hover:ring-brass/50'
        }`;
    const tile = (selected: boolean) =>
        `flex h-full min-h-[2.75rem] flex-col items-center justify-center px-2 py-2 sm:min-h-[3.5rem] sm:px-3 ${base(selected)}`;
    const toggle = (selected: boolean) =>
        `flex-1 px-3 py-2.5 sm:py-3 ${base(selected)}`;

    return (
        <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12 text-center sm:px-6">
            <h1
                className="animate-fade font-display text-3xl font-semibold tracking-tight text-parchment sm:text-5xl"
                style={{ animationDelay: '0ms' }}
            >
                Move Recall
            </h1>
            <p
                className="animate-fade mt-3 max-w-xl font-body text-sm text-muted sm:mt-4 sm:text-lg"
                style={{ animationDelay: '90ms' }}
            >
                Study a real game, then replay it from memory.
            </p>

            <div className="mt-10 grid w-full max-w-3xl grid-cols-1 gap-6 text-left sm:mt-12 md:grid-cols-2 md:gap-8">
            
                <div className="flex flex-col gap-6">
                    <Section label="Number of moves" delay={150}>
                        <div className="grid grid-cols-3 gap-2">
                            {TIERS.map((t) => {
                                const selected = tier === t.name;
                                return (
                                    <button key={t.name} onClick={() => setTier(t.name)} className={tile(selected)}>
                                        <span className="font-semibold">{t.label}</span>
                                        <span className={`text-[10px] sm:text-xs ${selected ? 'text-navy/70' : 'text-muted'}`}>
                                            {t.desc}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </Section>

                    <Section label="Mode" delay={230}>
                        <div className="flex gap-2">
                            <button onClick={() => setMode('casual')} className={toggle(mode === 'casual')}>Casual</button>
                            <button onClick={() => setMode('hard')} className={toggle(mode === 'hard')}>Hard</button>
                        </div>
                    </Section>

                    <Section label="Perspective" delay={270}>
                        <div className="flex gap-2">
                            <button onClick={() => setOrientation('white')} className={toggle(orientation === 'white')}>White</button>
                            <button onClick={() => setOrientation('black')} className={toggle(orientation === 'black')}>Black</button>
                        </div>
                    </Section>
                </div>

             
                <div className="flex flex-col gap-6">
                    <Section label="Study time" delay={190} grow>
                        <div className="grid h-full grid-cols-3 grid-rows-2 gap-2">
                            {STUDY_OPTIONS.map((s) => (
                                <button key={s} onClick={() => setStudy(s)} className={tile(study === s)}>
                                    {s === 'endless' ? 'Endless' : `${s}s`}
                                </button>
                            ))}
                        </div>
                    </Section>

                    <Section label="Time per move" delay={310} grow>
                        <div className="grid h-full grid-cols-3 grid-rows-2 gap-2">
                            {PERMOVE_OPTIONS.map((s) => (
                                <button key={s} onClick={() => setPermove(s)} className={tile(permove === s)}>
                                    {s === 'endless' ? 'Endless' : `${s}s`}
                                </button>
                            ))}
                        </div>
                    </Section>
                </div>
            </div>

            <button
                onClick={handleStart}
                className="animate-fade mt-10 flex h-12 w-full max-w-xs items-center justify-center rounded-md bg-brass px-8 font-mono text-sm font-semibold text-navy transition duration-200 hover:shadow-lg hover:shadow-brass/20 hover:ring-2 hover:ring-brass/60 hover:ring-offset-2 hover:ring-offset-navy focus:outline-none focus-visible:ring-2 focus-visible:ring-parchment sm:mt-12"
                style={{ animationDelay: '350ms' }}
            >
                Start recall
            </button>
            <Link
                href="/"
                className="animate-fade mt-3 inline-flex h-12 w-full max-w-xs items-center justify-center rounded-md border border-slate bg-surface px-6 font-mono text-sm text-parchment transition hover:border-brass hover:text-brass focus:outline-none focus-visible:ring-2 focus-visible:ring-brass sm:mt-4"
                style={{ animationDelay: '390ms' }}
            >
                ← Home
            </Link>
        </main>
    );
}