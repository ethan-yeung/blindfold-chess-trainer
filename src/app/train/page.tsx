'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import type { CSSProperties } from 'react';
import { Chess } from 'chess.js';
import { Chessboard, ChessboardProvider, SparePiece } from 'react-chessboard';
import type { SquareHandlerArgs, PositionDataType } from 'react-chessboard';
import { getRealPosition, scoreAttempt } from '@/lib/scoring';
import type { AttemptScore } from '@/lib/scoring';
import { buildAttempt, saveAttempt } from '@/lib/history';
import InfoModal from '@/components/InfoModal';
import Link from 'next/link';
import positions from '@/lib/positions.json';
import { sendGAEvent } from '@next/third-parties/google';


type Phase = 'reveal' | 'vanish' | 'rebuild';

const DEFAULT_REVEAL_MS = 5000;
const VANISH_MS = 350;
const WHITE_PIECES = ['wK', 'wQ', 'wR', 'wB', 'wN', 'wP'];
const BLACK_PIECES = ['bK', 'bQ', 'bR', 'bB', 'bN', 'bP'];
const BOARD_SIZE = 'min(88vw, 68vh, 620px)';
const STATUS_LABEL: Record<string, string> = {
    wrongPiece: 'Wrong piece',
    missing: 'Missing',
    extra: 'Extra',
};


function parseRange(raw: string | null): [number, number] | null {
    if (!raw) return null;
    const [min, max] = raw.split('-').map(Number);
    if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
    return [Math.min(min, max), Math.max(min, max)];
}

function pickPosition(range: [number, number] | null): string {
    let pool: string[];
    if (range) {
        pool = [];
        for (let n = range[0]; n <= range[1]; n++) {
            const bucket = positions[String(n) as keyof typeof positions];
            if (bucket) pool = pool.concat(bucket);
        }
    } else {
        pool = Object.values(positions).flat();
    }
    return pool[Math.floor(Math.random() * pool.length)];
}

function TrainSession() {
    const searchParams = useSearchParams();
    const parsed = Number(searchParams.get('limit'));
    const timeLimitMs = Number.isFinite(parsed) && parsed > 0 ? parsed * 1000 : null;
    const revealMs = timeLimitMs ?? DEFAULT_REVEAL_MS;
    const rangeParam = searchParams.get('range');
    const pieceRange = parseRange(rangeParam);

    const [fen, setFen] = useState('4k3/8/8/8/8/8/8/4K3 w - - 0 1');
    const game = useMemo(() => new Chess(fen), [fen]);

    const [phase, setPhase] = useState<Phase>('reveal');
    const [selectedPiece, setSelectedPiece] = useState<string | null>(null);
    const [placedPieces, setPlacedPieces] = useState<Record<string, string>>({});
    const [score, setScore] = useState<AttemptScore | null>(null);
    const [hiddenAt, setHiddenAt] = useState<number | null>(null);
    const [reviewView, setReviewView] = useState<'correct' | 'yours'>('correct');
    const [showDetails, setShowDetails] = useState(false);
    const [infoOpen, setInfoOpen] = useState(false);

    const orientationParam = searchParams.get('orientation') === 'black' ? 'black' : 'white';
    const [orientation, setOrientation] = useState<'white' | 'black'>(orientationParam);

    const [turns, setTurns] = useState(0);
    const [flipping, setFlipping] = useState(false);

    useEffect(() => {
        setFen(pickPosition(pieceRange));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (phase === 'reveal' && timeLimitMs !== null) {
            const t = setTimeout(() => setPhase('vanish'), revealMs);
            return () => clearTimeout(t);
        }
        if (phase === 'vanish') {
            const t = setTimeout(() => {
                setPhase('rebuild');
                setHiddenAt(Date.now());
            }, VANISH_MS);
            return () => clearTimeout(t);
        }
    }, [phase, revealMs, timeLimitMs]);

    function handleSquareClick({ square }: SquareHandlerArgs) {
        if (phase !== 'rebuild' || score) return;
        if (selectedPiece === null) {
            setPlacedPieces((previous) => {
                const next = { ...previous };
                delete next[square];
                return next;
            });
            return;
        }
        setPlacedPieces((previous) => ({ ...previous, [square]: selectedPiece }));
    }

    function handleCheck() {
        const real = getRealPosition(game);
        const result = scoreAttempt(real, placedPieces);
        setScore(result);
        setReviewView('correct');
        setShowDetails(false);
        sendGAEvent('event', 'position_checked', {
            correct: result.correct,
            total: result.totalPieces,
        });
        const timeTakenMs = hiddenAt !== null ? Date.now() - hiddenAt : 0;
        saveAttempt(buildAttempt(result, fen, 'reconstruction', timeTakenMs, timeLimitMs));
    }

    function handleNext() {
        setFen(pickPosition(pieceRange));
        setPlacedPieces({});
        setSelectedPiece(null);
        setScore(null);
        setHiddenAt(null);
        setShowDetails(false);
        setPhase('reveal');
    }

    const boardPosition: PositionDataType = Object.fromEntries(
        Object.entries(placedPieces).map(([square, piece]) => [
            square,
            { pieceType: piece },
        ]),
    );

    const displayPosition =
        phase === 'rebuild'
            ? score && reviewView === 'correct'
                ? game.fen()
                : boardPosition
            : game.fen();

    const squareStyles: Record<string, CSSProperties> = {};
    if (score) {
        for (const r of score.results) {
            if (r.status === 'missing' || r.status === 'wrongPiece') {
                squareStyles[r.square] = { backgroundColor: 'rgba(181, 83, 60, 0.55)' };
            } else if (r.status === 'extra') {
                squareStyles[r.square] = { backgroundColor: 'rgba(201, 161, 90, 0.5)' };
            }
        }
    }

    const statusText =
        phase === 'reveal' || phase === 'vanish'
            ? 'Memorize the position'
            : !score
                ? 'Rebuild it from memory'
                : '';

    const hasErrors = score ? score.results.some((r) => r.status !== 'correct') : false;

    const renderTray = (pieces: string[]) => (
        <div
            className="flex w-full justify-center gap-2"
            style={{ maxWidth: BOARD_SIZE, minHeight: phase === 'rebuild' && !score ? '40px' : '0' }}
        >
            {phase === 'rebuild' && !score &&
                pieces.map((p) => (
                    <div
                        key={p}
                        onPointerUp={() => setSelectedPiece(p)}
                        aria-label={p}
                        className={`flex aspect-square w-[15%] max-w-[64px] cursor-pointer items-center justify-center rounded-md bg-parchment p-0.5 ring-2 transition ${selectedPiece === p ? 'ring-brass' : 'ring-transparent hover:ring-brass/50'
                            }`}
                    >
                        <SparePiece pieceType={p} />
                    </div>
                ))}
        </div>
    );

    return (
        <main className="flex min-h-screen flex-col px-4 py-2">
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
                        onClick={() => {
                            setFlipping(true);
                            setTurns((t) => t + 1);
                            setTimeout(() => {
                                setOrientation((o) => (o === 'white' ? 'black' : 'white'));
                                setFlipping(false);
                            }, 200);
                        }}
                        aria-label="Flip board"

                        className="flex h-11 w-11 items-center justify-center rounded-md border border-slate bg-surface font-mono text-lg text-parchment transition hover:border-brass hover:text-brass focus:outline-none focus-visible:ring-2 focus-visible:ring-brass"
                    >
                        <span className="inline-block transition-transform duration-500" style={{ transform: `rotate(${turns * 180}deg)` }}>⟳</span>
                    </button>
                    <button
                        onClick={() => setInfoOpen(true)}
                        aria-label="How it works"
                        className="flex h-11 w-11 items-center justify-center rounded-md border border-slate bg-surface font-mono text-lg text-parchment transition hover:border-brass hover:text-brass focus:outline-none focus-visible:ring-2 focus-visible:ring-brass"
                    >
                        ?
                    </button>
                </div>
            </header>

            <div
                className={`flex flex-1 flex-col items-center justify-start gap-1 pt-1 lg:justify-center lg:gap-8 lg:pt-0 ${score ? 'lg:flex-row lg:items-center' : ''
                    }`}
            >
                <div className="animate-rise flex flex-col items-center gap-2">
                    <p className="min-h-[20px] font-mono text-sm text-muted">{statusText}</p>

                    <ChessboardProvider
                        options={{
                            id: 'train-board',
                            position: displayPosition,
                            boardOrientation: orientation,
                            onSquareClick: handleSquareClick,
                            onPieceDrop: ({ sourceSquare, targetSquare, piece }) => {
                                if (phase !== 'rebuild' || score) return false;
                                if (!targetSquare) return false;
                                setPlacedPieces((previous) => {
                                    const next = { ...previous };
                                    if (sourceSquare) delete next[sourceSquare];
                                    next[targetSquare] = piece.pieceType;
                                    return next;
                                });
                                return true;
                            },
                            showAnimations: false,
                            squareStyles,
                            lightSquareStyle: { backgroundColor: 'var(--color-parchment)' },
                            darkSquareStyle: { backgroundColor: 'var(--color-slate)' },
                            lightSquareNotationStyle: { color: 'var(--color-slate)' },
                            darkSquareNotationStyle: { color: 'var(--color-parchment)' },
                            boardStyle: { borderRadius: '4px', boxShadow: '0 10px 30px rgba(0,0,0,0.35)' },
                        }}
                    >
                        {renderTray(orientation === 'white' ? BLACK_PIECES : WHITE_PIECES)}

                        <div
                            className={`relative my-2 transition-opacity duration-200 ${flipping ? 'opacity-0' : 'opacity-100'}`}
                            style={{ width: BOARD_SIZE }}
                        >
                            <Chessboard />
                            <div
                                aria-hidden
                                className={`pointer-events-none absolute inset-0 rounded transition-opacity duration-300 motion-reduce:transition-none ${phase === 'vanish' ? 'opacity-100' : 'opacity-0'
                                    }`}
                                style={{ backgroundColor: 'rgba(13,27,42,0.98)', backdropFilter: 'blur(6px)' }}
                            />
                            {phase === 'reveal' && timeLimitMs === null && (
                                <button
                                    onClick={() => setPhase('vanish')}
                                    className="absolute -bottom-12 left-1/2 -translate-x-1/2 cursor-pointer rounded-md bg-brass px-6 py-2 font-mono font-semibold text-navy transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-parchment"
                                >
                                    Hide board
                                </button>
                            )}
                        </div>

                        {renderTray(orientation === 'white' ? WHITE_PIECES : BLACK_PIECES)}
                    </ChessboardProvider>

                    <div className="flex min-h-[40px] w-full justify-center gap-2" style={{ maxWidth: BOARD_SIZE }}>
                        {phase === 'rebuild' && !score && (
                            <>
                                <button
                                    onClick={() => setSelectedPiece(null)}
                                    className={`h-10 w-32 cursor-pointer rounded-md font-mono text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brass ${selectedPiece === null
                                        ? 'bg-brass text-navy'
                                        : 'bg-surface text-parchment/80 hover:text-parchment'
                                        }`}
                                >
                                    Erase
                                </button>
                                <button
                                    onClick={handleCheck}
                                    className="h-10 w-32 cursor-pointer rounded-md bg-brass font-mono font-semibold text-navy transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-parchment"
                                >
                                    Check
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {score && (
                    <div className="mt-0 flex w-full max-w-md flex-col rounded-lg bg-surface p-5 lg:mt-0 lg:w-80">
                        <p className="font-display text-xl text-parchment">
                            <span className="text-brass">{score.correct}</span> of {score.totalPieces} correct
                        </p>

                        {hasErrors && (
                            <>
                                <button
                                    onClick={() => setShowDetails((v) => !v)}
                                    className="mt-3 flex cursor-pointer items-center gap-1 self-start font-mono text-sm text-muted transition hover:text-parchment focus:outline-none"
                                >
                                    {showDetails ? 'Hide details' : 'Show details'}
                                    <span className={`transition-transform ${showDetails ? 'rotate-180' : ''}`}>▾</span>
                                </button>

                                {showDetails && (
                                    <ul className="mt-2 max-h-52 space-y-1 overflow-y-auto font-mono text-sm text-muted">
                                        {score.results
                                            .filter((r) => r.status !== 'correct')
                                            .map((r) => (
                                                <li key={r.square}>
                                                    <span className="text-parchment">{r.square}</span> · {STATUS_LABEL[r.status]}
                                                    {r.status === 'wrongPiece' && ` (want ${r.expected}, got ${r.actual})`}
                                                    {r.status === 'missing' && ` (want ${r.expected})`}
                                                    {r.status === 'extra' && ` (got ${r.actual})`}
                                                </li>
                                            ))}
                                    </ul>
                                )}
                            </>
                        )}

                        <div className="mt-4 flex flex-wrap gap-2">
                            <button
                                onClick={() => setReviewView((v) => (v === 'correct' ? 'yours' : 'correct'))}
                                className="flex-1 cursor-pointer rounded-md border border-slate px-4 py-2 font-mono text-sm text-parchment transition hover:border-brass focus:outline-none focus-visible:ring-2 focus-visible:ring-brass"
                            >
                                {reviewView === 'correct' ? 'Show your answer' : 'Show correct board'}
                            </button>
                            <button
                                onClick={handleNext}
                                className="flex-1 cursor-pointer rounded-md border border-brass px-4 py-2 font-mono text-sm text-brass transition hover:bg-brass hover:text-navy focus:outline-none focus-visible:ring-2 focus-visible:ring-brass"
                            >
                                Next position
                            </button>
                        </div>

                        <Link
                            href="/stats"
                            className="mt-2 flex h-11 items-center justify-center gap-2 rounded-md border border-slate bg-surface px-4 font-mono text-sm text-parchment transition hover:border-brass hover:text-brass focus:outline-none focus-visible:ring-2 focus-visible:ring-brass"
                        >
                            View stats
                        </Link>

                    </div>
                )}
            </div>
            <InfoModal open={infoOpen} onClose={() => setInfoOpen(false)} />
        </main>
    );
}

export default function TrainPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-navy" />}>
            <TrainSession />
        </Suspense>
    );
}