'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Chess } from 'chess.js';
import { Chessboard, ChessboardProvider } from 'react-chessboard';
import Link from 'next/link';

const DEMO_POSITIONS = [
    '8/3nkp2/3p2p1/1r1P4/1P3P1p/Q6P/6PK/8 w - - 2 36',
    '8/1R1R2pk/7p/p4N2/4p1r1/4P3/5PPK/2q5 b - - 5 50',
    '2kR4/pp3R2/8/2p3pp/2P2p2/2P4b/P4K2/8 b - - 0 33',
    '5k2/p4p2/2p1r3/4P1Q1/2P2P2/8/PP1r2P1/5K2 b - - 2 32',
    '7r/p1p5/2k5/1p3p2/P2R1B2/2P5/1PK2nP1/8 b - - 0 33',
    '6k1/8/r3p3/P2b4/5npB/2P2P2/6P1/R2R2K1 b - - 0 41',
    'B7/3n4/4pk1p/R4p1P/PK4p1/1P4P1/5r2/8 w - - 0 41',
    '8/8/2n1k3/p2R1p2/2p2P1p/P2p4/1P3K1P/3B4 b - - 0 47',
    '8/1p3Qbk/p2K3p/5q2/5P2/2P3P1/PPb5/8 w - - 0 41',
    '8/1p3kpR/pq3r1p/3Pp3/6Q1/7P/6PK/8 b - - 12 48',
];

const DEMO_GAMES = [
    '1. e4 c5 2. Nf3 g6 3. d4 cxd4 4. Qxd4 Nf6 5. Nc3 Nc6 6. Qa4 d6 7. e5 dxe5 8. Nxe5 Qd4 9. Nxc6 Qxa4 10. Nxa4 bxc6 11. Be2 Nd5 12. Bd2 e5 13. c4 Nb4 0-1',
    '1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O b5 6. Bb3 Bc5 7. c3 d6 8. d3 h6 9. Nbd2 O-O 10. a4 Rb8 11. Bc2 Nh5 12. axb5 axb5 13. Nxe5 Nxe5 14. Qxh5 Bg4 0-1',
    '1. c4 Nf6 2. Nc3 g6 3. g3 Bg7 4. Bg2 O-O 5. e4 d6 6. Nge2 c6 7. O-O a6 8. a4 a5 9. d3 Na6 10. h3 Nd7 11. Be3 Nb4 12. Qd2 Re8 13. Rad1 Nc5 14. d4 Nb3 0-1',
    '1. e4 e5 2. Nc3 Nc6 3. g3 f5 4. exf5 Nf6 5. d3 d5 6. Bh3 Bb4 7. Nge2 O-O 8. a3 Ba5 9. O-O g6 10. Bh6 Re8 11. Bg5 Kg7 12. Bg2 gxf5 13. Nxd5 1-0',
    '1. d4 g6 2. c4 Bg7 3. Nc3 c5 4. d5 Bxc3+ 5. bxc3 f5 6. e4 fxe4 7. Qc2 Qa5 8. Nh3 d6 9. Ng5 Nf6 10. Bd2 Bf5 11. g4 Nxg4 12. Nxe4 O-O 13. Rg1 Nxf2 0-1',
    '1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 g6 6. Be2 Bg7 7. O-O Nc6 8. Be3 O-O 9. f4 Qb6 10. Nf5 Qxb2 11. Na4 Qa3 12. Nxg7 Qxe3+ 0-1',
    '1. Nf3 e6 2. g3 d5 3. Bg2 c5 4. O-O Bd6 5. c4 Ne7 6. cxd5 exd5 7. d4 O-O 8. dxc5 Bxc5 9. Nc3 Nbc6 10. Na4 Bd6 11. Be3 Nf5 12. Bc5 Be6 13. Rc1 Rc8 14. Bxd6 Qxd6 15. Nc5 1-0',
    '1. e4 c5 2. d4 cxd4 3. c3 dxc3 4. Nxc3 Nc6 5. Nf3 d6 6. Bc4 Nf6 7. e5 dxe5 8. Qxd8+ Nxd8 9. Nb5 Be6 10. Nc7+ Kd7 11. Nxe6 Nxe6 12. Nxe5+ Ke8 13. Bb5+ 1-0',
    '1. e4 c6 2. d4 d5 3. e5 c5 4. dxc5 e6 5. Nf3 Bxc5 6. Bd3 Ne7 7. O-O Nbc6 8. c3 Ng6 9. Qe2 Qc7 10. Re1 O-O 11. h4 Nge7 12. b4 Bb6 13. Bxh7+ Kxh7 14. Ng5+ Kg6 15. h5+ 1-0',
    '1. e4 c5 2. Nc3 d6 3. f4 g6 4. Nf3 Bg7 5. Bc4 e6 6. O-O Ne7 7. d3 Nbc6 8. Qe1 O-O 9. f5 gxf5 10. Qh4 fxe4 11. Ng5 h6 12. Ncxe4 Nf5 13. Qh5 d5 14. g4 dxc4 15. gxf5 exf5 0-1',
    '1. Nc3 d5 2. d4 Nf6 3. Bf4 c5 4. e4 dxe4 5. dxc5 Qxd1+ 6. Rxd1 a6 7. Nge2 Nc6 8. Nd4 e5 9. Nxc6 exf4 10. Rd8# 1-0',
    '1. e4 g6 2. Nf3 Bg7 3. Bc4 c5 4. d3 Nc6 5. Nc3 d6 6. h4 Nf6 7. h5 Nxh5 8. Rxh5 gxh5 9. Ng5 e6 10. Qxh5 Qe7 11. Nb5 Ne5 12. Bxe6 a6 13. Bxf7+ Nxf7 14. Nxf7 Qxf7 15. Nxd6+ Ke7 1-0',
    '1. e4 e5 2. f4 exf4 3. Bc4 Nc6 4. d4 Nf6 5. Nc3 Bb4 6. e5 Ne4 7. Nge2 Qh4+ 8. g3 fxg3 9. Kf1 g2+ 10. Kxg2 Qf2+ 11. Kh3 d5+ 0-1',
    '1. d4 d5 2. Nc3 c6 3. Bf4 g6 4. Qd2 Bg7 5. h4 h5 6. Nf3 Nh6 7. Ne5 Ng4 8. Nxg4 Bxg4 9. f3 Be6 10. O-O-O Nd7 11. Kb1 Qa5 12. e4 dxe4 13. Nxe4 Qxa2+ 0-1',
    '1. e4 c5 2. Ne2 Nc6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 d6 6. Bg5 g6 7. Bxf6 exf6 8. Bc4 Bg7 9. Ndb5 O-O 10. Qxd6 Qa5 11. O-O f5 12. Nc7 Be5 13. Bxf7+ Rxf7 14. Qd8+ Nxd8 0-1',
    '1. d4 Nf6 2. c4 e6 3. Nf3 Bb4+ 4. Bd2 Qe7 5. g3 d5 6. cxd5 exd5 7. Bg2 O-O 8. O-O c6 9. Qc2 Ne4 10. Bxb4 Qxb4 11. Nbd2 Bf5 12. Qb3 1-0',
    '1. e4 d5 2. Nf3 dxe4 3. Ng5 Qd5 4. d3 exd3 5. Nc3 Qe5+ 6. Be3 dxc2 7. Qxc2 c6 8. O-O-O e6 9. Rd8+ Ke7 10. Rxc8 f6 11. Nf3 Qd6 12. Bc4 Qd7 13. Bc5+ 1-0',
    '1. d4 d5 2. Bf4 c6 3. e3 Bf5 4. c4 e6 5. Nc3 Nd7 6. Qb3 Qb6 7. c5 Qxb3 8. axb3 a6 9. b4 Rc8 10. Nf3 h6 11. h3 g5 12. Be2 gxf4 0-1',
    '1. d4 d5 2. c4 c5 3. cxd5 Nf6 4. Nf3 cxd4 5. Qxd4 Qxd5 6. Nc3 Qxd4 7. Nxd4 a6 8. Bg5 e5 9. Bxf6 gxf6 10. Nd5 1-0',
    '1. d4 Nf6 2. c4 e6 3. Nf3 Bb4+ 4. Bd2 Qe7 5. g3 O-O 6. Bg2 b6 7. O-O Bb7 8. Nc3 Bxc3 9. Bxc3 Ne4 10. Be1 d6 11. Nd2 Nxd2 12. Bxb7 Nxf1 13. Bxa8 Nxg3 14. hxg3 c6 15. d5 1-0',
];

const boardOptions = (position: string) => ({
    position,
    allowDragging: false,
    showAnimations: true,
    animationDurationInMs: 250,
    showNotation: false,
    lightSquareStyle: { backgroundColor: 'var(--color-parchment)' },
    darkSquareStyle: { backgroundColor: 'var(--color-slate)' },
    boardStyle: { borderRadius: '4px', boxShadow: '0 10px 30px rgba(0,0,0,0.35)', width: '100%' },
});

function MemorizePreview({ active }: { active: boolean }) {
    const fen = useMemo(() => DEMO_POSITIONS[Math.floor(Math.random() * DEMO_POSITIONS.length)], []);

    const pieces = useMemo(() => {
        const board = new Chess(fen).board();
        const list: { square: string; pieceType: string }[] = [];
        for (const row of board) {
            for (const cell of row) {
                if (cell) list.push({ square: cell.square, pieceType: cell.color + cell.type.toUpperCase() });
            }
        }
        return list.sort(() => Math.random() - 0.5);
    }, [fen]);

    const [shown, setShown] = useState(0);

    useEffect(() => {
        if (!active) return;
        const id = setInterval(() => {
            setShown((n) => (n >= pieces.length ? 0 : n + 1));
        }, 320);
        return () => clearInterval(id);
    }, [active, pieces.length]);

    const position = Object.fromEntries(
        pieces.slice(0, shown).map((p) => [p.square, { pieceType: p.pieceType }]),
    );

    return (
        <div className="pointer-events-none w-[200px] sm:w-[260px] md:w-[340px] lg:w-[400px]">
            <ChessboardProvider options={{ ...boardOptions(position as never), id: 'preview-memorize' }}>
                <Chessboard />
            </ChessboardProvider>
        </div>
    );
}

function RecallPreview({ active }: { active: boolean }) {
    const fens = useMemo(() => {
        const pgn = DEMO_GAMES[Math.floor(Math.random() * DEMO_GAMES.length)];
        const g = new Chess();
        g.loadPgn(pgn);
        const replay = new Chess();
        const out = [replay.fen()];
        for (const m of g.history()) {
            replay.move(m);
            out.push(replay.fen());
        }
        return out;
    }, []);

    const [i, setI] = useState(0);

    useEffect(() => {
        if (!active) return;
        const id = setInterval(() => {
            setI((n) => (n >= fens.length - 1 ? 0 : n + 1));
        }, 500);
        return () => clearInterval(id);
    }, [active, fens.length]);

    return (
        <div className="pointer-events-none w-[200px] sm:w-[260px] md:w-[340px] lg:w-[400px]">
            <ChessboardProvider options={{ ...boardOptions(fens[i]), id: 'preview-recall' }}>
                <Chessboard />
            </ChessboardProvider>
        </div>
    );
}

const MODES = [
    {
        name: 'Memorize Position',
        blurb: 'Study a real position, then rebuild it from memory.',
        href: '/train/setup',
    },
    {
        name: 'Move Recall',
        blurb: 'Watch a real game, then replay it from memory.',
        href: '/recall/setup',
    },
];

export default function ModeCarousel() {
    const [index, setIndex] = useState(0);
    const [offset, setOffset] = useState(0);
    const [sliding, setSliding] = useState(false);
    const touchStart = useRef<number | null>(null);

    const go = (dir: 1 | -1) => {
        if (sliding) return;
        setSliding(true);
        setOffset(dir);
        setTimeout(() => {
            setIndex((i) => (i + dir + MODES.length) % MODES.length);
            setOffset(0);
            setSliding(false);
        }, 300);
    };

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') go(1);
            else if (e.key === 'ArrowLeft') go(-1);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [sliding]);

    const at = (n: number) => MODES[(index + n + MODES.length) % MODES.length];
    const isActive = (n: number) => n === 0 && !sliding;

    const renderCard = (n: number) => {
        const m = at(n);
        const modeIdx = (index + n + MODES.length) % MODES.length;
        return (
            <div className="flex w-full flex-shrink-0 justify-center px-2">
                <div className="flex flex-col items-center gap-5">
                    {modeIdx === 0
                        ? <MemorizePreview active={isActive(n)} />
                        : <RecallPreview active={isActive(n)} />}
                    <div className="text-center">
                        <p className="font-display text-2xl font-semibold text-parchment sm:text-3xl lg:text-4xl">{m.name}</p>
                        <p className="mt-1.5 font-body text-sm text-muted sm:text-base">{m.blurb}</p>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="w-full max-w-lg lg:max-w-2xl">
            <div className="flex items-center gap-2 sm:gap-6">
                <button
                    onClick={() => go(-1)}
                    aria-label="Previous mode"
                    className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-md border border-slate bg-surface font-mono text-lg text-parchment transition hover:border-brass hover:text-brass focus:outline-none focus-visible:ring-2 focus-visible:ring-brass sm:h-12 sm:w-12"
                >
                    ←
                </button>

                <div
                    className="min-w-0 flex-1 overflow-hidden"
                    onTouchStart={(e) => { touchStart.current = e.touches[0].clientX; }}
                    onTouchEnd={(e) => {
                        if (touchStart.current === null) return;
                        const dx = e.changedTouches[0].clientX - touchStart.current;
                        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
                        touchStart.current = null;
                    }}
                >
                    <div
                        className={`flex ${sliding ? 'transition-transform duration-300 ease-out' : ''}`}
                        style={{ transform: `translateX(calc(-100% - ${offset * 100}%))` }}
                    >
                        {renderCard(-1)}
                        {renderCard(0)}
                        {renderCard(1)}
                    </div>
                </div>

                <button
                    onClick={() => go(1)}
                    aria-label="Next mode"
                    className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-md border border-slate bg-surface font-mono text-lg text-parchment transition hover:border-brass hover:text-brass focus:outline-none focus-visible:ring-2 focus-visible:ring-brass sm:h-12 sm:w-12"
                >
                    →
                </button>
            </div>

            <div className="mt-6 flex justify-center gap-2">
                {MODES.map((m, n) => (
                    <button
                        key={m.name}
                        onClick={() => !sliding && setIndex(n)}
                        aria-label={`Show ${m.name}`}
                        className={`h-2 w-2 rounded-full transition-colors ${index === n ? 'bg-brass' : 'bg-slate hover:bg-muted'}`}
                    />
                ))}
            </div>

            <Link
                href={MODES[index].href}
                className="mt-7 flex h-12 w-full items-center justify-center rounded-md bg-brass px-8 font-mono text-sm font-bold text-navy transition duration-200 hover:shadow-lg hover:shadow-brass/20 hover:ring-2 hover:ring-brass/60 hover:ring-offset-2 hover:ring-offset-navy focus:outline-none focus-visible:ring-2 focus-visible:ring-parchment sm:h-14 sm:text-base"
            >
                Start
            </Link>
        </div>
    );
}