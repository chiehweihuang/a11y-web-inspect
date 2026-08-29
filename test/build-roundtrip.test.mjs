import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lcsMerge } from '../tools/lcs.mjs';
import { buildVariant, findDuplicatedLines } from '../tools/markers.mjs';
import { CONTENT } from '../tools/manifest.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(resolve(ROOT, p), 'utf8').replace(/\r\n?/g, '\n'); // normalize CRLF→LF (autocrlf working tree)

for (const n of CONTENT) {
  test(`${n}: marked core round-trips to both committed variants byte-identically`, () => {
    const cc = read(`commands/${n}.md`);
    const codex = read(`adapters/codex/references/beacon-${n}.md`);
    const core = lcsMerge(cc, codex);
    assert.equal(buildVariant(core, 'cc'), cc, `${n} CC mismatch`);
    assert.equal(buildVariant(core, 'codex'), codex, `${n} codex mismatch`);
  });
}

// hakuso BLOCK (2026-08-29, root cause of C1/H2): the old version of this test compared
// the two PROPAGATED copies against each other, never against core/ — if build.mjs isn't
// re-run after a core edit, both copies stay equally stale and this test still passed. Every
// comparison now anchors to core/, the actual source of truth, so a missed rebuild fails loud.
test('references + scripts on every propagated surface match CORE (the source of truth)', () => {
  const shared = [
    ['core/references/wcag-quick.md', 'references/wcag-quick.md', 'adapters/codex/references/wcag-quick.md'],
    ['core/references/patterns.md', 'references/patterns.md', 'adapters/codex/references/patterns.md'],
    ['core/references/legal-brief.md', 'references/legal-brief.md', 'adapters/codex/references/legal-brief.md'],
    ['core/references/disabilities.md', 'references/disabilities.md', 'adapters/codex/references/disabilities.md'],
    ['core/references/cases.md', 'references/cases.md', 'adapters/codex/references/cases.md'],
    ['core/references/documents.md', 'references/documents.md', 'adapters/codex/references/documents.md'],
    ['core/scripts/static-audit.mjs', 'scripts/static-audit.mjs', 'adapters/codex/scripts/static-audit.mjs'],
    ['core/scripts/generate-report.mjs', 'scripts/generate-report.mjs', 'adapters/codex/scripts/generate-report.mjs'],
    ['core/scripts/reader-task-audit.mjs', 'scripts/reader-task-audit.mjs', 'adapters/codex/scripts/reader-task-audit.mjs'],
    ['core/scripts/jurisdictions.mjs', 'scripts/jurisdictions.mjs', 'adapters/codex/scripts/jurisdictions.mjs'],
  ];
  for (const [core, a, b] of shared) {
    assert.equal(read(a), read(core), `${a} has drifted from ${core} -- run node build.mjs`);
    assert.equal(read(b), read(core), `${b} has drifted from ${core} -- run node build.mjs`);
  }
});

test('inspect has no unannotated duplicated reordered content', () => {
  assert.deepEqual(findDuplicatedLines(read('core/content/inspect.md')), []);
});
