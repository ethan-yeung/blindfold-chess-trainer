const STORAGE_KEY = 'blindfold-trainer:elo-attempts';

export type EloAttempt = {
  id: string;
  timestamp: number;
  guess: number;
  actual: number;
  score: number;
};

export function buildEloAttempt(guess: number, actual: number, score: number): EloAttempt {
  return {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    guess,
    actual,
    score,
  };
}

export function loadEloAttempts(): EloAttempt[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as EloAttempt[]) : [];
  } catch {
    return [];
  }
}

export function saveEloAttempt(attempt: EloAttempt): void {
  if (typeof window === 'undefined') return;
  const all = loadEloAttempts();
  all.push(attempt);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function clearEloAttempts(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
}