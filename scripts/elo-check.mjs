import { readFileSync } from 'node:fs';

const raw = readFileSync('scripts/mixed-games.pgn', 'utf8');
const matches = raw.match(/\[WhiteElo "(\d+)"\]/g) || [];
const buckets = {};

for (const x of matches) {
  const elo = Number(x.match(/(\d+)/)[1]);
  const key = Math.floor(elo / 200) * 200;
  buckets[key] = (buckets[key] || 0) + 1;
}

console.log('total games:', matches.length);
for (const k of Object.keys(buckets).sort((a, b) => a - b)) {
  console.log(`${k}-${+k + 199}: ${buckets[k]}`);
}