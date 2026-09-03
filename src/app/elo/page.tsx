'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Chess } from 'chess.js';
import { Chessboard, ChessboardProvider } from 'react-chessboard';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import Link from 'next/link';
import Modal from '@/components/Modal';

const BOARD_SIZE = 'min(88vw, 62vh, 500px)';
const MIN_GUESS = 1000;
const MAX_GUESS = 2500;
const STEP = 25;
const PERFECT_WINDOW = 50;
const ZERO_AT = 300;

type PoolGame = {
    white: string;
    black: string;
    whiteElo: number;
    blackElo: number;
    avgElo: number;
    moves: number;
    pgn: string;
};

type BuiltGame = {
    fens: string[];
    sans: string[];
    avgElo: number;
};

function buildGame(g: PoolGame): BuiltGame {
    const game = new Chess();
    game.loadPgn(g.pgn);
    const replay = new Chess();
    const fens = [replay.fen()];
    const sans: string[] = [];
    for (const m of game.history()) {
        replay.move(m);
        fens.push(replay.fen());
        sans.push(m);
    }
    return { fens, sans, avgElo: g.avgElo };
}

function scoreGuess(guess: number, actual: number): number {
    const diff = Math.abs(guess - actual);
    if (diff <= PERFECT_WINDOW) return 1;
    if (diff >= ZERO_AT) return 0;
    return 1 - (diff - PERFECT_WINDOW) / (ZERO_AT - PERFECT_WINDOW);
}

function verdict(score: number): string {
    if (score === 1) return 'Spot on.';
    if (score >= 0.7) return 'Very close.';
    if (score >= 0.4) return 'Not bad.';
    if (score > 0) return 'Some way off.';
    return 'Way off.';
}

function scoreColor(score: number): string {
    if (score >= 0.8) return 'var(--color-board-green)';
    if (score >= 0.4) return 'var(--color-brass)';
    return 'var(--color-rust)';
}

export default function EloPage() {
    const poolRef = useRef<PoolGame[] | null>(null);
    const [game, setGame] = useState<BuiltGame | null>(null);
    const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
    const [ply, setPly] = useState(0);
    const [guess, setGuess] = useState(1600);
    const [revealed, setRevealed] = useState(false);
    const [ticker, setTicker] = useState(0);
    const [infoOpen, setInfoOpen] = useState(false);

    const fens = game?.fens ?? [];
    const sans = game?.sans ?? [];
    const actual = game?.avgElo ?? 0;

    const atStart = ply === 0;
    const atEnd = ply === fens.length - 1;

    useEffect(() => {
        let cancelled = false;
        fetch('/elo-pool.json')
            .then((r) => {
                if (!r.ok) throw new Error('fetch failed');
                return r.json();
            })
            .then((data: PoolGame[]) => {
                if (cancelled) return;
                if (!data.length) {
                    setStatus('error');
                    return;
                }
                poolRef.current = data;
                setGame(buildGame(data[Math.floor(Math.random() * data.length)]));
                setStatus('ready');
            })
            .catch(() => {
                if (!cancelled) setStatus('error');
            });
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (revealed) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') {
                e.preventDefault();
                setPly((p) => Math.min(fens.length - 1, p + 1));
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                setPly((p) => Math.max(0, p - 1));
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [fens.length, revealed]);

    useEffect(() => {
        if (!revealed) return;
        const start = performance.now();
        const from = guess;
        const to = actual;
        let frame: number;
        const tick = (now: number) => {
            const t = Math.min(1, (now - start) / 450);
            const eased = 1 - Math.pow(1 - t, 3);
            setTicker(Math.round(from + (to - from) * eased));
            if (t < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [revealed, guess, actual]);

    const score = revealed ? scoreGuess(guess, actual) : 0;

    function nextGame() {
        const pool = poolRef.current;
        if (!pool) return;
        setGame(buildGame(pool[Math.floor(Math.random() * pool.length)]));
        setPly(0);
        setGuess(1600);
        setRevealed(false);
        setTicker(0);
    }

    const header = (
        <header className="mx-auto mb-1 flex w-full max-w-6xl items-center justify-between gap-2">
            <div className="flex flex-1 justify-start">
                <Link
                    href="/"
                    aria-label="Back to home"
                    className="flex h-11 items-center gap-2 rounded-md border border-slate bg-surface px-4 font-mono text-sm text-parchment transition hover:border-brass hover:text-brass focus:outline-none focus-visible:ring-2 focus-visible:ring-brass"
                >
                    ← Home
                </Link>
            </div>
            <h1 className="font-display text-xl font-semibold tracking-tight text-parchment sm:text-2xl">
                Blindfold Trainer
            </h1>
            <div className="flex flex-1 justify-end gap-2">
                <button
                    onClick={() => setInfoOpen(true)}
                    aria-label="How scoring works"
                    className="flex h-11 w-11 items-center justify-center rounded-md border border-slate bg-surface font-mono text-lg text-parchment transition hover:border-brass hover:text-brass focus:outline-none focus-visible:ring-2 focus-visible:ring-brass"
                >
                    ?
                </button>
            </div>

        </header>
    );

    if (status === 'loading') {
        return (
            <main className="flex min-h-screen flex-col px-4 py-2">
                {header}
                <div className="flex flex-1 items-center justify-center">
                    <p className="animate-fade font-mono text-sm text-muted">Loading games…</p>
                </div>
            </main>
        );
    }

    if (status === 'error') {
        return (
            <main className="flex min-h-screen flex-col px-4 py-2">
                {header}
                <div className="flex flex-1 flex-col items-center justify-center gap-3">
                    <p className="font-mono text-sm text-rust">Couldn&apos;t load the game pool.</p>
                    <Link
                        href="/"
                        className="flex h-11 items-center justify-center rounded-md border border-slate bg-surface px-6 font-mono text-sm text-parchment transition hover:border-brass hover:text-brass"
                    >
                        ← Home
                    </Link>
                </div>
            </main>
        );
    }

    const windowLeft = ((actual - PERFECT_WINDOW - MIN_GUESS) / (MAX_GUESS - MIN_GUESS)) * 100;
    const windowWidth = ((PERFECT_WINDOW * 2) / (MAX_GUESS - MIN_GUESS)) * 100;

    return (
        <main className="flex min-h-screen flex-col px-4 py-2">
            {header}

            <div className="flex flex-1 flex-col items-center justify-center gap-2">
                <div className="animate-fade flex flex-col items-center gap-2">
                    <p className="font-mono text-xs uppercase tracking-wide text-brass">Guess the Elo</p>

                    <div className="relative my-1" style={{ width: BOARD_SIZE }}>
                        <ChessboardProvider
                            options={{
                                id: 'elo-board',
                                position: fens[ply],
                                allowDragging: false,
                                showAnimations: true,
                                animationDurationInMs: 200,
                                lightSquareStyle: { backgroundColor: 'var(--color-parchment)' },
                                darkSquareStyle: { backgroundColor: 'var(--color-slate)' },
                                lightSquareNotationStyle: { color: 'var(--color-slate)' },
                                darkSquareNotationStyle: { color: 'var(--color-parchment)' },
                                boardStyle: { borderRadius: '4px', boxShadow: '0 10px 30px rgba(0,0,0,0.35)' },
                            }}
                        >
                            <Chessboard />
                        </ChessboardProvider>
                    </div>

                    <div
                        className="flex w-full items-center justify-between font-mono text-sm text-muted"
                        style={{ maxWidth: BOARD_SIZE }}
                    >
                        <span>{atStart ? 'start' : `move ${Math.ceil(ply / 2)} · ${sans[ply - 1]}`}</span>
                        <span>{ply} / {fens.length - 1}</span>
                    </div>

                    <div className="flex w-full gap-3" style={{ maxWidth: BOARD_SIZE }}>
                        <button
                            onClick={() => setPly((p) => Math.max(0, p - 1))}
                            disabled={atStart}
                            className="flex h-11 flex-1 items-center justify-center rounded-md border border-slate bg-surface font-mono text-sm text-parchment transition hover:border-brass hover:text-brass disabled:opacity-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-brass"
                        >
                            ← Prev
                        </button>
                        <button
                            onClick={() => setPly((p) => Math.min(fens.length - 1, p + 1))}
                            disabled={atEnd}
                            className="flex h-11 flex-1 items-center justify-center rounded-md border border-slate bg-surface font-mono text-sm text-parchment transition hover:border-brass hover:text-brass disabled:opacity-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-brass"
                        >
                            Next →
                        </button>
                    </div>

                    <div className="mt-2 w-full" style={{ maxWidth: BOARD_SIZE }}>
                        <div className="mb-2 flex items-baseline justify-between">
                            <span className="font-mono text-xs uppercase tracking-[0.2em] text-parchment">
                                {revealed ? 'Actual rating' : 'Your guess'}
                            </span>
                            <span
                                className="font-display text-3xl font-semibold transition-colors duration-300"
                                style={{ color: revealed ? scoreColor(score) : 'var(--color-parchment)' }}
                            >
                                {revealed ? ticker : guess}
                            </span>
                        </div>

                        <div className={`relative px-1 pt-1 ${revealed ? 'pointer-events-none' : ''}`}>
                            {revealed && (
                                <div
                                    className="pointer-events-none absolute top-[7px] h-[6px] rounded-full transition-opacity duration-300"
                                    style={{
                                        left: `${windowLeft}%`,
                                        width: `${windowWidth}%`,
                                        backgroundColor: 'var(--color-board-green)',
                                        opacity: 0.9,
                                    }}
                                />
                            )}
                            <Slider
                                min={MIN_GUESS}
                                max={MAX_GUESS}
                                step={STEP}
                                value={guess}
                                onChange={(v) => { if (!revealed) setGuess(v as number); }}
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

                        <div className="mt-1 flex justify-between font-mono text-[10px] text-muted">
                            <span>{MIN_GUESS}</span>
                            <span>{MAX_GUESS}</span>
                        </div>
                    </div>

                    <div className="mt-2 flex w-full flex-col items-center gap-2" style={{ maxWidth: BOARD_SIZE, minHeight: '5.5rem' }}>
                        {!revealed ? (
                            <button
                                onClick={() => setRevealed(true)}
                                className="flex h-12 w-full items-center justify-center rounded-md bg-brass font-mono text-sm font-bold text-navy transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-parchment"
                            >
                                Guess
                            </button>
                        ) : (
                            <>
                                <p className="animate-fade font-display text-xl text-parchment" style={{ animationDelay: '350ms' }}>
                                    {verdict(score)}{' '}
                                    <span style={{ color: scoreColor(score) }}>{Math.round(score * 100)}%</span>
                                </p>
                                <p className="animate-fade font-mono text-xs text-muted" style={{ animationDelay: '400ms' }}>
                                    you guessed {guess} · off by {Math.abs(guess - actual)}
                                </p>
                                <button
                                    onClick={nextGame}
                                    className="mt-1 flex h-11 w-full items-center justify-center rounded-md border border-brass font-mono text-sm text-brass transition hover:bg-brass hover:text-navy focus:outline-none focus-visible:ring-2 focus-visible:ring-brass"
                                >
                                    Next game
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
            <Modal open={infoOpen} onClose={() => setInfoOpen(false)} title="How scoring works">
                <div className="space-y-4 text-sm text-muted">
                    <p>
                        Go through the game with the arrow keys on screen or keyboard, then set the slider to the average rating you think these players are and press guess.
                    </p>

                    <p>
                        <span className="text-parchment">Within 50 points </span> either way scores 100%. Your score falls off, reaching 0% once you&apos;re 300 points away.
                    </p>
                    <p>
                        After your guess, the slider reveals the 50-point window you were aiming for.
                    </p>
                </div>
            </Modal>
        </main>
    );
}