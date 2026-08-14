import type { Attempt } from './history';
import { Chess } from 'chess.js';
import { describeSquare } from './board';
import type { SquareFacets } from './board';

export function overallAccuracy(attempts: Attempt[]): number {
    let totalCorrect = 0;
    let totalPieces = 0;

    for (const a of attempts) {
        totalCorrect += a.correct;
        totalPieces += a.totalPieces;
    }

    return totalPieces === 0 ? 0 : totalCorrect / totalPieces;
}

function bucketForPieceCount(n: number): string {
    if (n <= 8) return "2 to 8";
    if (n <= 16) return "9 to 16";
    if (n <= 24) return "17 to 24";
    return "25 to 32";
}

export function accuracyByPieceCount(attempts: Attempt[]): Map<string, number> {
    const totals = new Map<string, { correct: number; total: number }>();

    for (const a of attempts) {
        const key = bucketForPieceCount(a.pieceCount);
        const bucket = totals.get(key) ?? { correct: 0, total: 0 };
        bucket.correct += a.correct;
        bucket.total += a.totalPieces;
        totals.set(key, bucket);
    }

    const result = new Map<string, number>();
    for (const [key, { correct, total }] of totals) {
        result.set(key, total === 0 ? 0 : correct / total);
    }
    return result;
}

type FacetKey = 'side' | 'half' | 'quadrant';

export function accuracyByFacet(attempts: Attempt[], facet: FacetKey): Map<string, number> {
    const totals = new Map<string, { pieces: number; misses: number }>();

    for (const a of attempts) {
        const board = new Chess(a.fen).board();
        for (const row of board) {
            for (const cell of row) {
                if (cell === null) continue;
                const key = String(describeSquare(cell.square)[facet]);
                const bucket = totals.get(key) ?? { pieces: 0, misses: 0 };
                bucket.pieces += 1;
                totals.set(key, bucket);
            }
        }
        for (const err of a.errors) {
            if (err.status === 'extra') continue;   
            const key = String(err.region[facet]);
            const bucket = totals.get(key) ?? { pieces: 0, misses: 0 };
            bucket.misses += 1;
            totals.set(key, bucket);
        }
    }

    const result = new Map<string, number>();
    for (const [key, { pieces, misses }] of totals) {
        result.set(key, pieces === 0 ? 0 : (pieces - misses) / pieces);
    }
    return result;
}

export function accuracyByPieceType(attempts: Attempt[]): Map<string, number> {
    const totals = new Map<string, { pieces: number; misses: number }>();

    for (const a of attempts) {
        const board = new Chess(a.fen).board();
        for (const row of board) {
            for (const cell of row) {
                if (cell === null) continue;
                const key = cell.type.toUpperCase();
                const bucket = totals.get(key) ?? { pieces: 0, misses: 0 };
                bucket.pieces += 1;
                totals.set(key, bucket);
            }
        }
        for (const err of a.errors) {
            if (err.expectedPiece === null) continue;
            const key = err.expectedPiece.type.toUpperCase();
            const bucket = totals.get(key) ?? { pieces: 0, misses: 0 };
            bucket.misses += 1;
            totals.set(key, bucket);
        }
    }

    const result = new Map<string, number>();
    for (const [key, { pieces, misses }] of totals) {
        result.set(key, pieces === 0 ? 0 : (pieces - misses) / pieces);
    }
    return result;
}

export type TimeLimitStat = { accuracy: number; attempts: number };

export function accuracyByTimeLimit(attempts: Attempt[]): Map<string, TimeLimitStat> {
    const totals = new Map<string, { correct: number; total: number; attempts: number }>();

    for (const a of attempts) {
        const key = a.timeLimitMs === null ? 'unlimited' : String(a.timeLimitMs);
        const bucket = totals.get(key) ?? { correct: 0, total: 0, attempts: 0 };
        bucket.correct += a.correct;
        bucket.total += a.totalPieces;
        bucket.attempts += 1;
        totals.set(key, bucket);
    }

    const result = new Map<string, TimeLimitStat>();
    for (const [key, { correct, total, attempts }] of totals) {
        result.set(key, {
            accuracy: total === 0 ? 0 : correct / total,
            attempts,
        });
    }
    return result;
}

export type SquareStat = { accuracy: number; attempts: number };

export function accuracyBySquare(attempts: Attempt[]): Map<string, SquareStat> {
    const totals = new Map<string, { pieces: number; misses: number }>();

    for (const a of attempts) {
        const board = new Chess(a.fen).board();
        for (const row of board) {
            for (const cell of row) {
                if (cell === null) continue;
                const bucket = totals.get(cell.square) ?? { pieces: 0, misses: 0 };
                bucket.pieces += 1;
                totals.set(cell.square, bucket);
            }
        }
        for (const err of a.errors) {
            if (err.status === 'extra') continue;
            const bucket = totals.get(err.square) ?? { pieces: 0, misses: 0 };
            bucket.misses += 1;
            totals.set(err.square, bucket);
        }
    }

    const result = new Map<string, SquareStat>();
    for (const [square, { pieces, misses }] of totals) {
        result.set(square, {
            accuracy: pieces === 0 ? 0 : (pieces - misses) / pieces,
            attempts: pieces,
        });
    }
    return result;
}