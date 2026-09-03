import { readFileSync, writeFileSync } from 'node:fs';
import { decompress } from 'fzstd';

const input = 'scripts/lichess_db_standard_rated_2013-04.pgn.zst';
const output = 'scripts/mixed-games.pgn';

const compressed = readFileSync(input);
const decompressed = decompress(compressed);
writeFileSync(output, Buffer.from(decompressed));
console.log('done:', output);