'use client';

import { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import type { CSSProperties } from 'react';
import { Chessboard, ChessboardProvider, SparePiece } from 'react-chessboard';
import Link from 'next/link';
import { Chess, type Square } from 'chess.js';
import { useSearchParams } from 'next/navigation';
import { buildRecallAttempt, saveRecallAttempt } from '@/lib/recall-history';
import type { RecallMoveRecord, RecallAttempt } from '@/lib/recall-history';
import Modal from '@/components/Modal';
import CircularTimer from '@/components/CircularTimer';

const BOARD_SIZE = 'min(88vw, 68vh, 620px)';
const TIER_NAMES = ['Super quick', 'Quick', 'Short', 'Medium', 'Long', 'Extra long'];
const TICK_MS = 100;

type PoolGame = {
    white: string;
    black: string;
    whiteElo: number;
    blackElo: number;
    result: string;
    eco: string;
    moves: number;
    pgn: string;
};

type BuiltGame = {
    fens: string[];
    sans: string[];
    headers: Record<string, string>;
};

function tierLabel(key: string): string {
    return key.replace(/\b\w/g, (c) => c.toUpperCase());
}

function buildGame(pgn: string): BuiltGame {
    const game = new Chess();
    game.loadPgn(pgn);

    const moves = game.history({ verbose: true });
    const headers = game.getHeaders();

    const replay = new Chess();
    const fens: string[] = [replay.fen()];
    const sans: string[] = [];
    for (const m of moves) {
        replay.move(m.san);
        fens.push(replay.fen());
        sans.push(m.san);
    }

    return { fens, sans, headers };
}

function pickBuilt(games: PoolGame[]): BuiltGame {
    const pick = games[Math.floor(Math.random() * games.length)];
    return buildGame(pick.pgn);
}

function congratsMessage(accuracy: number): string {
    const pct = accuracy * 100;
    if (pct >= 100) return 'Perfect recall.';
    if (pct >= 90) return 'Almost flawless.';
    if (pct >= 70) return 'Well done.';
    if (pct >= 50) return 'Good work. Keep practicing.';
    return 'Nice effort. Try that one again.';
}

function RecallSession() {
    const searchParams = useSearchParams();
    const mode = searchParams.get('mode') === 'hard' ? 'hard' : 'casual';
    const tierParam = searchParams.get('tier');
    const tier = TIER_NAMES.includes(tierParam ?? '') ? (tierParam as string) : 'Medium';
    const studyParam = searchParams.get('study');
    const studyUnlimited = studyParam === 'unlimited';
    const studySeconds = studyUnlimited ? 0 : Number(studyParam) || 15;
    const poolRef = useRef<PoolGame[] | null>(null);
    const [game, setGame] = useState<BuiltGame | null>(null);
    const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');


    const [phase, setPhase] = useState<'study' | 'recall'>('study');
    const [ply, setPly] = useState(0);
    const [recallPly, setRecallPly] = useState(0);
    const [selected, setSelected] = useState<string | null>(null);
    const [flash, setFlash] = useState<Record<string, CSSProperties>>({});
    const [pendingPromotion, setPendingPromotion] = useState<{ from: string; to: string } | null>(null);
    const [result, setResult] = useState<RecallAttempt | null>(null);
    const [infoOpen, setInfoOpen] = useState(false);
    const [hintStage, setHintStage] = useState<0 | 1 | 2>(0);
    const [studyRemaining, setStudyRemaining] = useState(studySeconds);
    const studyStarted = useRef(false);
    const [timerSize, setTimerSize] = useState(44);


    useEffect(() => {
        const update = () => setTimerSize(window.innerWidth < 640 ? 36 : 52);
        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, []);

    const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const moveLog = useRef<RecallMoveRecord[]>([]);
    const wrongOnCurrent = useRef(0);
    const logged = useRef(false);
    const assistedCurrent = useRef(false);

    const fens = game?.fens ?? [];
    const sans = game?.sans ?? [];
    const headers = game?.headers ?? {};

    const atStart = ply === 0;
    const atEnd = ply === fens.length - 1;
    const recallDone = phase === 'recall' && fens.length > 0 && recallPly === fens.length - 1;

    const goPrev = () => setPly((p) => Math.max(0, p - 1));
    const goNext = () => setPly((p) => Math.min(fens.length - 1, p + 1));

    useEffect(() => {
        let cancelled = false;
        setStatus('loading');
        fetch('/recall-pool.json')
            .then((r) => {
                if (!r.ok) throw new Error('fetch failed');
                return r.json();
            })
            .then((data: Record<string, PoolGame[]>) => {
                if (cancelled) return;
                const games = data[tier] ?? [];
                if (games.length === 0) {
                    setStatus('error');
                    return;
                }
                poolRef.current = games;
                setGame(pickBuilt(games));
                setStatus('ready');
            })
            .catch(() => {
                if (!cancelled) setStatus('error');
            });
        return () => {
            cancelled = true;
        };
    }, [tier]);

    const currentMove = useMemo(() => {
        if (phase !== 'recall' || recallDone || fens.length === 0) return null;
        const scratch = new Chess(fens[recallPly]);
        try {
            const m = scratch.move(sans[recallPly]);
            return { from: m.from, to: m.to };
        } catch {
            return null;
        }
    }, [phase, recallDone, fens, sans, recallPly]);

    useEffect(() => {
        if (phase !== 'study') return;
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
    }, [fens.length, phase]);

    useEffect(() => {
        if (recallDone && !logged.current) {
            logged.current = true;
            const attempt = buildRecallAttempt(mode, headers.White, headers.Black, moveLog.current);
            saveRecallAttempt(attempt);
            setResult(attempt);
        }
    }, [recallDone, mode, headers.White, headers.Black]);

    useEffect(() => {
        if (studyUnlimited || status !== 'ready' || phase !== 'study' || studyStarted.current) return;
        const id = setInterval(() => {
            setStudyRemaining((r) => Math.max(0, r - TICK_MS / 1000));
        }, TICK_MS);
        return () => clearInterval(id);
    }, [status, phase, studyUnlimited]);

    function flashSquare(square: string, kind: 'right' | 'wrong') {
        if (flashTimer.current) clearTimeout(flashTimer.current);
        const color = kind === 'right' ? 'rgba(110, 139, 91, 0.6)' : 'rgba(181, 83, 60, 0.6)';
        setFlash({ [square]: { backgroundColor: color } });
        flashTimer.current = setTimeout(() => setFlash({}), 400);
    }

    function tryMove(from: string, to: string, promotion: 'q' | 'r' | 'b' | 'n' = 'q'): boolean {
        const scratch = new Chess(fens[recallPly]);
        let move;
        try {
            move = scratch.move({ from, to, promotion });
        } catch {
            return false;
        }
        if (move.san !== sans[recallPly]) {
            wrongOnCurrent.current += 1;
            flashSquare(to, 'wrong');
            return false;
        }
        moveLog.current.push({
            ply: recallPly,
            san: sans[recallPly],
            firstTry: wrongOnCurrent.current === 0,
            wrongAttempts: wrongOnCurrent.current,
            assisted: assistedCurrent.current,
        });
        wrongOnCurrent.current = 0;
        assistedCurrent.current = false;
        setHintStage(0);
        flashSquare(to, 'right');
        setRecallPly((p) => p + 1);
        return true;
    }

    function isPromotion(from: string, to: string): boolean {
        const pos = new Chess(fens[recallPly]);
        const piece = pos.get(from as Square);
        if (!piece || piece.type !== 'p') return false;
        const rank = to[1];
        return (piece.color === 'w' && rank === '8') || (piece.color === 'b' && rank === '1');
    }

    function attempt(from: string, to: string): boolean {
        if (isPromotion(from, to)) {
            setPendingPromotion({ from, to });
            return false;
        }
        return tryMove(from, to);
    }

    function resolvePromotion(piece: 'q' | 'r' | 'b' | 'n') {
        if (!pendingPromotion) return;
        tryMove(pendingPromotion.from, pendingPromotion.to, piece);
        setPendingPromotion(null);
        setSelected(null);
    }

    function resetRecallState() {
        setRecallPly(0);
        setSelected(null);
        setFlash({});
        setPendingPromotion(null);
        setResult(null);
        setHintStage(0);
        moveLog.current = [];
        wrongOnCurrent.current = 0;
        logged.current = false;
        assistedCurrent.current = false;
    }

    const startRecall = () => {
        studyStarted.current = true;
        setPhase('recall');
        resetRecallState();
    };

    const backToStudy = () => {
        setPhase('study');
        setPly(recallPly);
        setSelected(null);
        setFlash({});
        setPendingPromotion(null);
        assistedCurrent.current = false;
    };

    const playAgain = () => {
        const games = poolRef.current;
        if (!games) return;
        setGame(pickBuilt(games));
        setPhase('study');
        setPly(0);
        resetRecallState();
        setStudyRemaining(studySeconds);
        studyStarted.current = false;
    };

    function revealHint() {
        if (!currentMove) return;
        assistedCurrent.current = true;
        wrongOnCurrent.current = Math.max(wrongOnCurrent.current, 1);
        setHintStage((s) => (s < 2 ? ((s + 1) as 0 | 1 | 2) : 2));
    }

    useEffect(() => {
        if (status !== 'ready' || phase !== 'study' || studyStarted.current) return;
        const id = setInterval(() => {
            setStudyRemaining((r) => Math.max(0, r - TICK_MS / 1000));
        }, TICK_MS);
        return () => clearInterval(id);
    }, [status, phase]);

    useEffect(() => {
        if (status === 'ready' && phase === 'study' && !studyStarted.current && studyRemaining <= 0) {
            startRecall();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [studyRemaining, status, phase]);

    const moveNumber = Math.ceil(ply / 2);
    const lastMove = ply > 0 ? sans[ply - 1] : null;
    const sideToMove = recallPly % 2 === 0 ? 'White' : 'Black';
    const promoColor = recallPly % 2 === 0 ? 'w' : 'b';
    const boardPosition = phase === 'study' ? fens[ply] : fens[recallPly];
    const showStudyTimer = !studyUnlimited && phase === 'study' && !studyStarted.current;

    const squareStyles: Record<string, CSSProperties> = { ...flash };
    if (selected) {
        squareStyles[selected] = {
            ...(squareStyles[selected] ?? {}),
            boxShadow: 'inset 0 0 0 3px var(--color-brass)',
        };
    }

    const hintArrows =
        hintStage === 2 && currentMove
            ? [{ startSquare: currentMove.from, endSquare: currentMove.to, color: 'var(--color-brass)' }]
            : [];

    if (hintStage >= 1 && currentMove) {
        squareStyles[currentMove.from] = {
            ...(squareStyles[currentMove.from] ?? {}),
            boxShadow: 'inset 0 0 0 3px var(--color-brass)',
        };
    }

    const pageHeader = (
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
                    aria-label="Casual vs hard"
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
                {pageHeader}
                <div className="flex flex-1 items-center justify-center">
                    <p className="animate-rise font-mono text-sm text-muted">Loading games…</p>
                </div>
            </main>
        );
    }

    if (status === 'error') {
        return (
            <main className="flex min-h-screen flex-col px-4 py-2">
                {pageHeader}
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

    return (
        <main className="flex min-h-screen flex-col px-4 py-2">
            {pageHeader}

            <div
                className={`flex flex-1 flex-col items-center justify-start gap-2 pt-2 lg:pt-0 ${recallDone ? 'lg:flex-row lg:items-center lg:justify-center lg:gap-8' : 'lg:justify-center'
                    }`}
            >
                <div className="animate-rise flex flex-col items-center gap-2">

                    <div
                        className="grid w-full grid-cols-[1fr_auto_1fr] items-center"
                        style={{ maxWidth: BOARD_SIZE, minHeight: timerSize + 8 }}
                    >
                        <div className="flex justify-start">
                            {showStudyTimer && (
                                <div className="rounded-full p-1" style={{ backgroundColor: 'rgba(13,27,42,0.55)' }}>
                                    <CircularTimer remaining={studyRemaining} total={studySeconds} size={timerSize} />
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col items-center gap-0.5">
                            <p className="font-mono text-xs uppercase tracking-wide text-brass">
                                Move recall · {mode} · {tierLabel(tier)}
                            </p>
                            <p className="font-mono text-sm text-muted">
                                {headers.White} ({headers.WhiteElo}) vs {headers.Black} ({headers.BlackElo})
                            </p>
                        </div>
                        <div />
                    </div>

                    <ChessboardProvider
                        options={{
                            id: 'recall-board',
                            position: boardPosition,
                            boardOrientation: 'white',
                            allowDragging: phase === 'recall' && !recallDone,
                            showAnimations: true,
                            animationDurationInMs: 200,
                            squareStyles,
                            arrows: hintArrows,
                            clearArrowsOnClick: false,
                            onSquareClick: ({ square }) => {
                                if (phase !== 'recall' || recallDone) return;
                                if (selected === null) {
                                    const pos = new Chess(fens[recallPly]);
                                    const piece = pos.get(square as Square);
                                    if (piece && piece.color === pos.turn()) setSelected(square);
                                    return;
                                }
                                if (square === selected) {
                                    setSelected(null);
                                    return;
                                }
                                attempt(selected, square);
                                setSelected(null);
                            },
                            onPieceDrop: ({ sourceSquare, targetSquare }) => {
                                if (phase !== 'recall' || recallDone) return false;
                                if (!targetSquare) return false;
                                return attempt(sourceSquare, targetSquare);
                            },
                            lightSquareStyle: { backgroundColor: 'var(--color-parchment)' },
                            darkSquareStyle: { backgroundColor: 'var(--color-slate)' },
                            lightSquareNotationStyle: { color: 'var(--color-slate)' },
                            darkSquareNotationStyle: { color: 'var(--color-parchment)' },
                            boardStyle: { borderRadius: '4px', boxShadow: '0 10px 30px rgba(0,0,0,0.35)' },
                        }}
                    >
                        <div className="relative my-2" style={{ width: BOARD_SIZE }}>
                            <Chessboard />
                            {pendingPromotion && (
                                <div
                                    className="absolute inset-0 z-10 flex items-center justify-center rounded"
                                    style={{ backgroundColor: 'rgba(13,27,42,0.8)', backdropFilter: 'blur(4px)' }}
                                    onClick={() => {
                                        setPendingPromotion(null);
                                        setSelected(null);
                                    }}
                                >
                                    <div
                                        className="flex gap-2 rounded-lg border border-slate bg-surface p-3"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {(['q', 'r', 'b', 'n'] as const).map((t) => (
                                            <button
                                                key={t}
                                                onClick={() => resolvePromotion(t)}
                                                aria-label={`Promote to ${t}`}
                                                className="flex h-16 w-16 items-center justify-center rounded-md bg-parchment p-1 ring-2 ring-transparent transition hover:ring-brass focus:outline-none focus-visible:ring-2 focus-visible:ring-brass"
                                            >
                                                <SparePiece pieceType={`${promoColor}${t.toUpperCase()}`} />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </ChessboardProvider>

                    {!recallDone && phase === 'study' && (
                        <>
                            <div
                                className="flex w-full items-center justify-between font-mono text-sm text-muted"
                                style={{ maxWidth: BOARD_SIZE }}
                            >
                                <span>{atStart ? 'start' : `move ${moveNumber} · ${lastMove}`}</span>
                                <span>{ply} / {fens.length - 1}</span>
                            </div>

                            <div className="flex w-full gap-3" style={{ maxWidth: BOARD_SIZE }}>
                                <button
                                    onClick={goPrev}
                                    disabled={atStart}
                                    className="flex h-12 flex-1 items-center justify-center rounded-md border border-slate bg-surface font-mono text-sm text-parchment transition hover:border-brass hover:text-brass disabled:opacity-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-brass"
                                >
                                    ← Prev
                                </button>
                                <button
                                    onClick={goNext}
                                    disabled={atEnd}
                                    className="flex h-12 flex-1 items-center justify-center rounded-md border border-slate bg-surface font-mono text-sm text-parchment transition hover:border-brass hover:text-brass disabled:opacity-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-brass"
                                >
                                    Next →
                                </button>
                            </div>

                            {recallPly > 0 ? (
                                <button
                                    onClick={() => setPhase('recall')}
                                    className="mt-1 flex h-12 w-full items-center justify-center rounded-md bg-brass font-mono text-sm font-semibold text-navy transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-parchment"
                                    style={{ maxWidth: BOARD_SIZE }}
                                >
                                    Resume recall
                                </button>
                            ) : (
                                <button
                                    onClick={startRecall}
                                    className="mt-1 flex h-12 w-full items-center justify-center rounded-md bg-brass font-mono text-sm font-semibold text-navy transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-parchment"
                                    style={{ maxWidth: BOARD_SIZE }}
                                >
                                    Recall from memory
                                </button>
                            )}
                        </>
                    )}

                    {!recallDone && phase === 'recall' && (
                        <>
                            <div
                                className="flex w-full items-center justify-between font-mono text-sm"
                                style={{ maxWidth: BOARD_SIZE }}
                            >
                                <span className="text-muted">{sideToMove} to move</span>
                                <span className="text-muted">{recallPly} / {fens.length - 1}</span>
                            </div>

                            <div className="mt-1 flex w-full gap-3" style={{ maxWidth: BOARD_SIZE }}>
                                <button
                                    onClick={revealHint}
                                    className="flex h-12 flex-1 items-center justify-center rounded-md border border-slate bg-surface font-mono text-sm text-parchment transition hover:border-brass hover:text-brass focus:outline-none focus-visible:ring-2 focus-visible:ring-brass"
                                >
                                    {hintStage === 0 ? 'Hint' : hintStage === 1 ? 'Show move' : 'Hint shown'}
                                </button>
                                {mode === 'casual' && (
                                    <button
                                        onClick={backToStudy}
                                        className="flex h-12 flex-1 items-center justify-center rounded-md border border-slate bg-surface font-mono text-sm text-parchment transition hover:border-brass hover:text-brass focus:outline-none focus-visible:ring-2 focus-visible:ring-brass"
                                    >
                                        Back to study
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {recallDone && result && (
                    <div className="mt-2 flex w-full max-w-md flex-col rounded-lg bg-surface p-5 lg:mt-0 lg:w-80">
                        <p className="font-display text-2xl text-parchment">{congratsMessage(result.accuracy)}</p>
                        <p className="mt-2 font-mono text-sm text-muted">
                            <span className="text-brass">{result.movesFirstTry}</span> of {result.movesTotal} moves first try ({Math.round(result.accuracy * 100)}%)
                        </p>
                        <p className="mt-1 font-mono text-xs uppercase tracking-wide text-muted">
                            {mode} · {tierLabel(tier)}
                        </p>

                        <button
                            onClick={playAgain}
                            className="mt-4 flex h-11 items-center justify-center rounded-md border border-brass px-4 font-mono text-sm text-brass transition hover:bg-brass hover:text-navy focus:outline-none focus-visible:ring-2 focus-visible:ring-brass"
                        >
                            Play again
                        </button>
                        <Link
                            href="/stats"
                            className="mt-2 flex h-11 items-center justify-center gap-2 rounded-md border border-slate bg-surface px-4 font-mono text-sm text-parchment transition hover:border-brass hover:text-brass focus:outline-none focus-visible:ring-2 focus-visible:ring-brass"
                        >
                            View stats
                        </Link>
                    </div>
                )}
            </div>

            <Modal open={infoOpen} onClose={() => setInfoOpen(false)} title="Casual vs hard">
                <div className="space-y-4 text-sm text-muted">
                    <p>
                        <span className="text-parchment">Casual.</span> Return to board study whenever you want, and pick up right where you left off. Good for learning a game without pressure.
                    </p>
                    <p>
                        <span className="text-parchment">Hard.</span> No returning to study once you start. You recall the whole game in one go from memory.
                    </p>
                    <p>
                        Both track your first-try accuracy and save it to your stats, tagged by mode, so you can see how the two compare. A move counts as first-try if you play it correctly with no wrong attempts or hints.
                    </p>
                    <p className="font-mono text-xs">
                        Switch modes with <span className="text-parchment">?mode=hard</span> in the URL for now. A proper menu is coming.
                    </p>
                </div>
            </Modal>
        </main>
    );
}

export default function RecallPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-navy" />}>
            <RecallSession />
        </Suspense>
    );
}