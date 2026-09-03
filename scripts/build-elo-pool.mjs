import { readFileSync, writeFileSync } from 'node:fs';
import { Chess } from 'chess.js';

const SOURCE = 'scripts/mixed-games.pgn';
const OUTPUT = 'public/elo-pool.json';
const PER_BAND = 400;
const BAND_SIZE = 200;
const MIN_ELO = 1000;
const MAX_ELO = 2399;
const MIN_MOVES = 8;
const MAX_MOVES = 60;

function tag(block, name) {
  const m = block.match(new RegExp(`\\[${name} "([^"]*)"\\]`));
  return m ? m[1] : null;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const raw = readFileSync(SOURCE, 'utf8');
const blocks = raw.split(/\n\s*\n(?=\[)/).map((b) => b.trim()).filter(Boolean);
const games = [];
for (let i = 0; i < blocks.length; i++) {
  const b = blocks[i];
  if (b.startsWith('[') && !/\n\s*\n/.test(b) && !/^\s*1\./m.test(b)) {
    games.push(b + '\n\n' + (blocks[i + 1] ?? ''));
    i++;
  } else {
    games.push(b);
  }
}

const bands = {};
const stats = { read: 0, noElo: 0, outOfRange: 0, badLength: 0, parseFail: 0, kept: 0 };

for (const block of games) {
  stats.read++;

  const whiteElo = Number(tag(block, 'WhiteElo'));
  const blackElo = Number(tag(block, 'BlackElo'));
  if (!Number.isFinite(whiteElo) || !Number.isFinite(blackElo)) { stats.noElo++; continue; }

  const avg = Math.round((whiteElo + blackElo) / 2);
  if (avg < MIN_ELO || avg > MAX_ELO) { stats.outOfRange++; continue; }

  const plyCount = Number(tag(block, 'PlyCount'));
  if (Number.isFinite(plyCount) && plyCount > 0) {
    const moves = Math.ceil(plyCount / 2);
    if (moves < MIN_MOVES || moves > MAX_MOVES) { stats.badLength++; continue; }
  }

  const band = Math.floor(avg / BAND_SIZE) * BAND_SIZE;
  (bands[band] ??= []).push({ block, whiteElo, blackElo, avg });
}

const pool = [];
for (const band of Object.keys(bands).sort((a, b) => a - b)) {
  const list = shuffle(bands[band]);
  let taken = 0;
  for (const g of list) {
    if (taken >= PER_BAND) break;
    let moveCount;
    try {
      const c = new Chess();
      c.loadPgn(g.block);
      moveCount = Math.ceil(c.history().length / 2);
    } catch {
      stats.parseFail++;
      continue;
    }
    if (moveCount < MIN_MOVES || moveCount > MAX_MOVES) { stats.badLength++; continue; }

    pool.push({
      white: tag(g.block, 'White'),
      black: tag(g.block, 'Black'),
      whiteElo: g.whiteElo,
      blackElo: g.blackElo,
      avgElo: g.avg,
      moves: moveCount,
      pgn: g.block,
    });
    taken++;
    stats.kept++;
  }
  console.log(`band ${band}-${+band + 199}: kept ${taken} (of ${list.length} available)`);
}

writeFileSync(OUTPUT, JSON.stringify(shuffle(pool)));

console.log('\n=== elo pool build complete ===');
console.log(`read: ${stats.read}`);
console.log(`no elo: ${stats.noElo}`);
console.log(`out of elo range: ${stats.outOfRange}`);
console.log(`bad length: ${stats.badLength}`);
console.log(`parse fail: ${stats.parseFail}`);
console.log(`kept: ${stats.kept}`);
console.log(`wrote ${OUTPUT}`);