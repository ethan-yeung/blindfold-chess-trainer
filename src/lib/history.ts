import type { SquareStatus, AttemptScore } from './scoring';
import { describeSquare, describePiece } from './board';
import type { SquareFacets, PieceFacets } from './board';

const STORAGE_KEY = 'blindfold-trainer:attempts';

export type LoggedError = {
  square: string;
  status: SquareStatus;
  expected: string | null;
  actual: string | null;
  region: SquareFacets;
  expectedPiece: PieceFacets | null;
};

export type Attempt = {
  id: string;
  timestamp: number;
  mode: string;
  pieceCount: number;
  timeLimitMs: number | null;
  timeTakenMs: number;
  fen: string;
  correct: number;
  totalPieces: number;
  errors: LoggedError[];
};

export function buildAttempt(
  score: AttemptScore,
  fen: string,
  mode: string,
  timeTakenMs: number,
  timeLimitMs: number | null,
): Attempt {
  const errors = score.results
    .filter((r) => r.status !== 'correct')
    .map((r) => ({
      ...r,
      region: describeSquare(r.square),
      expectedPiece: r.expected !== null ? describePiece(r.expected) : null,
    }));

  return {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    mode,
    pieceCount: score.totalPieces,
    timeLimitMs,
    timeTakenMs,
    fen,
    correct: score.correct,
    totalPieces: score.totalPieces,
    errors,
  };
}

export function loadAttempts(): Attempt[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Attempt[]) : [];
  } catch {
    return [];
  }
}

export function saveAttempt(attempt: Attempt): void {
  if (typeof window === 'undefined') return;
  const all = loadAttempts();
  all.push(attempt);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function clearAttempts(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
}