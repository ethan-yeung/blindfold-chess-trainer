import { readFileSync, writeFileSync } from 'fs';
import { Chess } from 'chess.js';

const TARGET_PER_BUCKET = 1000;   
const MIN_PIECES = 3;
const MAX_PIECES = 32;

const pgn = readFileSync('scripts/games.pgn', 'utf-8');
const games = pgn
    .split(/(?=\[Event )/)
    .filter((block) => block.includes('[Event '));

console.log(`Found ${games.length} games`);

const buckets = {};

for (const gameText of games) {
    if (isFull()) break;

    let picks;
    try {
        picks = pickFromGame(gameText);
    } catch {
        continue;
    }

    for (const count in picks) {
        const n = Number(count);
        if (n < MIN_PIECES || n > MAX_PIECES) continue;
        if (!buckets[n]) buckets[n] = [];
        if (buckets[n].length < TARGET_PER_BUCKET) {
            buckets[n].push(picks[count]);
        }
    }
}

writeFileSync('scripts/positions.json', JSON.stringify(buckets, null, 2));

console.log('Wrote positions.json');
for (let n = MIN_PIECES; n <= MAX_PIECES; n++) {
    console.log(`${n} pieces: ${buckets[n]?.length ?? 0}`);
}

function isFull() {
    for (let n = MIN_PIECES; n <= MAX_PIECES; n++) {
        if ((buckets[n]?.length ?? 0) < TARGET_PER_BUCKET) return false;
    }
    return true;
}

function pickFromGame(gameText) {
    const source = new Chess();
    source.loadPgn(gameText);
    const moves = source.history();

    const byCount = {};
    const board = new Chess();
    for (const move of moves) {
        board.move(move);
        const fen = board.fen();
        const count = countPieces(fen);
        if (!byCount[count]) byCount[count] = [];
        byCount[count].push(fen);
    }

    const result = {};
    for (const count in byCount) {
        const options = byCount[count];
        result[count] = options[Math.floor(Math.random() * options.length)];
    }
    return result;
}

function countPieces(fen) {
    const layout = fen.split(' ')[0];
    return layout.replace(/[^a-zA-Z]/g, '').length;
}