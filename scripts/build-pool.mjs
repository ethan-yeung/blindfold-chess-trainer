
import { readFileSync, writeFileSync } from 'node:fs';
import { Chess } from 'chess.js';

const SOURCE = 'scripts/games.pgn';
const OUTPUT = 'public/recall-pool.json';
const MIN_ELO = 1000;
const PER_ECO_CAP = 30;
const PER_BUCKET_CAP = 1000;

const TIERS = [
  { name: 'Super quick', min: 4,  max: 9 },
  { name: 'Quick',       min: 10, max: 15 },
  { name: 'Short',       min: 16, max: 22 },
  { name: 'Medium',      min: 23, max: 30 },
  { name: 'Long',        min: 31, max: 40 },
  { name: 'Extra long',  min: 41, max: 55 },
];

function tierForPly(plyCount) {
    const moves = Math.ceil(plyCount / 2);
    return TIERS.find((t) => moves >= t.min && moves <= t.max) ?? null;
}
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

const buckets = Object.fromEntries(TIERS.map((t) => [t.name, []]));
const stats = { read: 0, drawn: 0, lowElo: 0, noPly: 0, outOfRange: 0, parseFail: 0, kept: 0 };

for (const block of games) {
    stats.read++;
    if (stats.read % 20000 === 0) console.log(`  ...scanned ${stats.read}`);


    const result = tag(block, 'Result');
    if (result === '1/2-1/2' || !result) { stats.drawn++; continue; }

    const whiteElo = Number(tag(block, 'WhiteElo'));
    const blackElo = Number(tag(block, 'BlackElo'));
    if (!(whiteElo >= MIN_ELO && blackElo >= MIN_ELO)) { stats.lowElo++; continue; }

    const plyCount = Number(tag(block, 'PlyCount'));
    if (!Number.isFinite(plyCount) || plyCount === 0) { stats.noPly++; continue; }

    const tier = tierForPly(plyCount);
    if (!tier) { stats.outOfRange++; continue; }


    let realPly;
    try {
        const g = new Chess();
        g.loadPgn(block);
        realPly = g.history().length;
    } catch {
        stats.parseFail++;
        continue;
    }

    const realTier = tierForPly(realPly);
    if (!realTier) { stats.outOfRange++; continue; }

    buckets[realTier.name].push({
        white: tag(block, 'White'),
        black: tag(block, 'Black'),
        whiteElo,
        blackElo,
        result,
        eco: tag(block, 'ECO') ?? '???',
        moves: Math.ceil(realPly / 2),
        pgn: block,
    });
}

const pool = {};
for (const t of TIERS) {
    const list = shuffle(buckets[t.name]);
    const ecoCount = {};
    const picked = [];
    for (const game of list) {
        if (picked.length >= PER_BUCKET_CAP) break;
        ecoCount[game.eco] = (ecoCount[game.eco] ?? 0) + 1;
        if (ecoCount[game.eco] > PER_ECO_CAP) continue;
        picked.push(game);
    }
    pool[t.name] = picked;
    stats.kept += picked.length;
}

writeFileSync(OUTPUT, JSON.stringify(pool));

console.log('\n=== pool build complete ===');
console.log(`read:            ${stats.read}`);
console.log(`dropped drawn:   ${stats.drawn}`);
console.log(`dropped low elo: ${stats.lowElo}`);
console.log(`dropped no ply:  ${stats.noPly}`);
console.log(`dropped range:   ${stats.outOfRange}`);
console.log(`dropped parse:   ${stats.parseFail}`);
console.log(`kept:            ${stats.kept}`);
console.log('--- per tier ---');
for (const t of TIERS) console.log(`${t.name.padEnd(12)} (${t.min}-${t.max}): ${pool[t.name].length}`);
console.log(`\nwrote ${OUTPUT}`);