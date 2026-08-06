/**
 * Ensures the bundled font files exist before building.
 *
 * The three woff2 subsets are committed in git, so this script is a no-op
 * for normal checkouts. It exists for build environments that receive the
 * source tree without binaries (e.g. direct-upload deploys): it downloads
 * the same latin subsets from the Google Fonts CDN at build time. The
 * deployed app itself always serves the fonts from /fonts — no runtime
 * requests to Google ever happen.
 */
import fs from 'node:fs';
import path from 'node:path';

const OUT = 'public/fonts';
const WANTED = [
  { family: 'Libre Caslon Text', style: 'italic', file: 'caslon-italic-latin.woff2' },
  { family: 'Libre Caslon Text', style: 'normal', file: 'caslon-400-latin.woff2' },
  { family: 'Manrope', style: 'normal', file: 'manrope-latin.woff2' },
];

if (WANTED.every((w) => fs.existsSync(path.join(OUT, w.file)))) {
  process.exit(0);
}

const CSS_URL =
  'https://fonts.googleapis.com/css2?family=Libre+Caslon+Text:ital@0;1&family=Manrope:wght@200..800&display=swap';
// A modern-browser UA makes the CDN return woff2 sources.
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

console.log('[fonts] font files missing — fetching latin subsets…');
const css = await (await fetch(CSS_URL, { headers: { 'User-Agent': UA } })).text();

const blocks = [...css.matchAll(/\/\* ([\w-]+) \*\/\s*@font-face\s*\{([^}]+)\}/g)];
fs.mkdirSync(OUT, { recursive: true });

for (const [, subset, body] of blocks) {
  if (subset !== 'latin') continue;
  const family = /font-family:\s*'([^']+)'/.exec(body)?.[1];
  const style = /font-style:\s*(\w+)/.exec(body)?.[1];
  const url = /src:\s*url\((https:[^)]+\.woff2)\)/.exec(body)?.[1];
  const want = WANTED.find((w) => w.family === family && w.style === style);
  if (!want || !url) continue;
  const target = path.join(OUT, want.file);
  if (fs.existsSync(target)) continue;
  const buf = Buffer.from(await (await fetch(url, { headers: { 'User-Agent': UA } })).arrayBuffer());
  if (buf.subarray(0, 4).toString('ascii') !== 'wOF2') {
    console.error(`[fonts] ${want.file}: response is not woff2`);
    process.exit(1);
  }
  fs.writeFileSync(target, buf);
  console.log(`[fonts] fetched ${want.file} (${buf.length} bytes)`);
}

const missing = WANTED.filter((w) => !fs.existsSync(path.join(OUT, w.file)));
if (missing.length) {
  console.error('[fonts] missing after fetch:', missing.map((w) => w.file).join(', '));
  process.exit(1);
}
