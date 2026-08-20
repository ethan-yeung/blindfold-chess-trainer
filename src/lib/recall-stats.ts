import type { RecallAttempt } from './recall-history';


const TIER_BANDS: { name: string; min: number; max: number }[] = [
  { name: 'Super quick', min: 4, max: 9 },
  { name: 'Quick', min: 10, max: 15 },
  { name: 'Short', min: 16, max: 22 },
  { name: 'Medium', min: 23, max: 30 },
  { name: 'Long', min: 31, max: 40 },
  { name: 'Extra long', min: 41, max: 55 },
];

export function tierForMoves(moves: number): string | null {
  return TIER_BANDS.find((t) => moves >= t.min && moves <= t.max)?.name ?? null;
}


export function recallOverall(attempts: RecallAttempt[]): number {
  let firstTry = 0;
  let total = 0;
  for (const a of attempts) {
    firstTry += a.movesFirstTry;
    total += a.movesTotal;
  }
  return total === 0 ? 0 : firstTry / total;
}

export type RecallModeStat = { accuracy: number; runs: number };


export function recallByMode(attempts: RecallAttempt[]): Map<string, RecallModeStat> {
  const totals = new Map<string, { firstTry: number; total: number; runs: number }>();
  for (const a of attempts) {
    const bucket = totals.get(a.mode) ?? { firstTry: 0, total: 0, runs: 0 };
    bucket.firstTry += a.movesFirstTry;
    bucket.total += a.movesTotal;
    bucket.runs += 1;
    totals.set(a.mode, bucket);
  }
  const result = new Map<string, RecallModeStat>();
  for (const [key, { firstTry, total, runs }] of totals) {
    result.set(key, { accuracy: total === 0 ? 0 : firstTry / total, runs });
  }
  return result;
}

export type RecallTierStat = { accuracy: number; runs: number };


export function recallByTier(attempts: RecallAttempt[]): Map<string, RecallTierStat> {
  const totals = new Map<string, { firstTry: number; total: number; runs: number }>();
  for (const a of attempts) {
    const key = tierForMoves(a.movesTotal);
    if (key === null) continue; 
    const bucket = totals.get(key) ?? { firstTry: 0, total: 0, runs: 0 };
    bucket.firstTry += a.movesFirstTry;
    bucket.total += a.movesTotal;
    bucket.runs += 1;
    totals.set(key, bucket);
  }
  const result = new Map<string, RecallTierStat>();
  for (const [key, { firstTry, total, runs }] of totals) {
    result.set(key, { accuracy: total === 0 ? 0 : firstTry / total, runs });
  }
  return result;
}


export function recallAssistedRate(attempts: RecallAttempt[]): number {
  let assisted = 0;
  let total = 0;
  for (const a of attempts) {
    for (const m of a.moves) {
      if (m.assisted) assisted += 1;
      total += 1;
    }
  }
  return total === 0 ? 0 : assisted / total;
}