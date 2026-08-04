// Beacon validation charter L3 — frozen WILD regression corpus.
//
// The golden vectors pin hand-written fixtures; this pins REAL captured pages. Its job
// is catching page-wide regressions that hand-written fixtures structurally cannot show:
// a phantom mask range swallowing every later finding, a detector running away on one
// framework's markup, a scoring change that silently moves whole bands. Every snapshot
// is a gzipped rendered DOM from the survey tier; expected values were produced by the
// engine named in expected.json.
//
// A diff here is NOT automatically a failure — it is an unexplained change. Intentional
// detector work regenerates the corpus deliberately
// (`node build-wild-corpus.mjs` in the benchmark workspace) and the commit explains every
// moved number, exactly like the goldens.
//
// Corpus is skipped (not failed) when absent, so a checkout without it still runs green.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SCANNER = resolve(ROOT, 'core/scripts/static-audit.mjs');
const CORPUS = resolve(ROOT, 'test/wild-corpus');
const EXPECTED = resolve(CORPUS, 'expected.json');

test('wild corpus: real captured pages reproduce their committed findings', { skip: existsSync(EXPECTED) ? false : 'no wild corpus in this checkout' }, () => {
  const { sites } = JSON.parse(readFileSync(EXPECTED, 'utf8'));
  const dir = mkdtempSync(join(tmpdir(), 'beacon-wild-'));
  const drift = [];
  try {
    for (const site of sites) {
      const html = gunzipSync(readFileSync(resolve(CORPUS, `${site.id}.html.gz`)));
      const page = join(dir, `${site.id}.html`);
      writeFileSync(page, html);
      const out = join(dir, `${site.id}.json`);
      execFileSync('node', [SCANNER, '--scope', site.url, '--url', site.url, '--date', '2020-01-01', '--output', out, page], { stdio: 'pipe', maxBuffer: 64 * 1024 * 1024 });
      const audit = JSON.parse(readFileSync(out, 'utf8'));

      if (audit.summary.overall_score !== site.score) {
        drift.push(`${site.id} ${site.url}: score ${site.score} -> ${audit.summary.overall_score}`);
      }
      const keys = {};
      for (const f of audit.findings || []) keys[f.key] = (keys[f.key] || 0) + 1;
      for (const k of new Set([...Object.keys(site.keys), ...Object.keys(keys)])) {
        const was = site.keys[k] ?? 0;
        const now = keys[k] ?? 0;
        if (was !== now) drift.push(`${site.id} ${site.url}: ${k} ${was} -> ${now}`);
      }
    }
  } finally { rmSync(dir, { recursive: true, force: true }); }

  assert.deepEqual(drift, [], `wild corpus drifted (${drift.length} changes). Every line must be explained by an intentional engine change; regenerate the corpus deliberately if so:\n  ${drift.slice(0, 40).join('\n  ')}`);
});
