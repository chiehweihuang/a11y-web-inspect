// Regenerate the golden expected JSONs after an INTENTIONAL scoring/detector change.
// Run from the repo root:  node tools/regen-golden.mjs
// Then inspect the diff (git diff test/golden/) before committing — every changed line
// must be explainable by the change you just made. See VALIDATION.md L0.
//
// Lives in tools/, NOT test/: bare `node --test` (no path argument) discovers every
// .?(c|m)js file under test/** and executes it, so a regen script placed inside test/
// gets run as a side effect on every plain test invocation — silently rewriting the
// golden vectors before golden-vectors.test.mjs compares against them, turning the
// byte-identical drift check into a tautology. Confirmed by hakuso audit 2026-07-22.

import { execFileSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const GOLDEN = resolve(ROOT, 'test/golden');

for (const name of ['clean', 'dirty']) {
  execFileSync('node', [
    resolve(ROOT, 'core/scripts/static-audit.mjs'),
    '--scope', 'golden', '--date', '2020-01-01',
    '--output', resolve(GOLDEN, `${name}.expected.json`),
    `test/golden/${name}.html`,
  ], { cwd: ROOT, stdio: 'inherit' });
}
console.log('golden vectors regenerated — inspect git diff test/golden/ before committing');
