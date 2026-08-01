import { Chess } from 'chess.js';

export type PositionMap = Record<string, string>;

export type SquareStatus = 'correct' | 'wrongPiece' | 'missing' | 'extra';

export type SquareResult = {
  square: string;
  status: SquareStatus;
  expected: string | null;
  actual: string | null;
};

export type AttemptScore = {
  correct: number;
  totalPieces: number;
  results: SquareResult[];
};


export function getRealPosition(game: Chess): PositionMap {
  const map: PositionMap = {};
  for (const rank of game.board()) {
    for (const cell of rank) {
      if (cell) {
        map[cell.square] = cell.color + cell.type.toUpperCase();
      }
    }
  }
  return map;
}

export function scoreAttempt(real: PositionMap, placed: PositionMap): AttemptScore {
  const squares = new Set([...Object.keys(real), ...Object.keys(placed)]);
  const results: SquareResult[] = [];
  let correct = 0;

  for (const square of squares) {
    const expected = real[square] ?? null;
    const actual = placed[square] ?? null;

    let status: SquareStatus;
    if (expected && actual) {
      status = expected === actual ? 'correct' : 'wrongPiece';
      if (status === 'correct') correct++;
    } else if (expected) {
      status = 'missing';
    } else {
      status = 'extra';
    }

    results.push({ square, status, expected, actual });
  }

  return { correct, totalPieces: Object.keys(real).length, results };
}