const STORAGE_KEY = 'blindfold-trainer:recall-attempts';


export type RecallMoveRecord = {
  ply: number;           
  san: string;          
  firstTry: boolean;     
  wrongAttempts: number; 
  assisted: boolean;
};


export type RecallAttempt = {
  id: string;
  timestamp: number;
  mode: 'casual' | 'hard';
  white: string;
  black: string;
  movesTotal: number;
  movesFirstTry: number;
  accuracy: number;
  moves: RecallMoveRecord[];
};

export function buildRecallAttempt(
  mode: 'casual' | 'hard',
  white: string,
  black: string,
  moves: RecallMoveRecord[],
): RecallAttempt {
  const movesTotal = moves.length;
  const movesFirstTry = moves.filter((m) => m.firstTry).length;
  const accuracy = movesTotal > 0 ? movesFirstTry / movesTotal : 0;

  return {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    mode,
    white,
    black,
    movesTotal,
    movesFirstTry,
    accuracy,
    moves,
  };
}

export function loadRecallAttempts(): RecallAttempt[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as RecallAttempt[]) : [];
  } catch {
    return [];
  }
}

export function saveRecallAttempt(attempt: RecallAttempt): void {
  if (typeof window === 'undefined') return;
  const all = loadRecallAttempts();
  all.push(attempt);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function clearRecallAttempts(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
}