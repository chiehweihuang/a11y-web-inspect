import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Source-text analysis, not an import: generate-report.mjs runs CLI side effects
// (argv parsing, process.exit) at module load time, so every existing test in
// this repo spawns it as a subprocess rather than importing it. Extracting a
// key's FINDING_I18N zh/en sub-objects via [^}]* is safe here because none of
// the title/description/fix/standard strings contain a literal '}'.
test('every finding key the engine (static or tier-2) can emit carries a bilingual "standard" statement', () => {
  const engineSrc = readFileSync(resolve(ROOT, 'core/scripts/static-audit.mjs'), 'utf8');
  const tier2Src = readFileSync(resolve(ROOT, 'core/scripts/tier2-audit.mjs'), 'utf8');
  const reportSrc = readFileSync(resolve(ROOT, 'core/scripts/generate-report.mjs'), 'utf8');

  const engineKeys = [...new Set([...engineSrc.matchAll(/key:\s*'([a-z0-9-]+)'/g), ...tier2Src.matchAll(/key:\s*'([a-z0-9-]+)'/g)].map((m) => m[1]))];
  assert.ok(engineKeys.length >= 20, `expected the engine to emit >=20 finding keys, found ${engineKeys.length} — extraction regex may have broken`);
  assert.ok(engineKeys.includes('tier2-contrast-fail'), 'tier2-audit.mjs key extraction did not pick up tier2-contrast-fail — regex or file path broke');

  const missingEntry = [];
  const missingStandard = [];
  for (const key of engineKeys) {
    const re = new RegExp(`'${key}':\\s*\\{\\s*zh:\\s*\\{([^}]*)\\},\\s*en:\\s*\\{([^}]*)\\}`);
    const m = reportSrc.match(re);
    if (!m) { missingEntry.push(key); continue; }
    const [, zhBlock, enBlock] = m;
    if (!/standard:/.test(zhBlock) || !/standard:/.test(enBlock)) missingStandard.push(key);
  }

  assert.deepEqual(missingEntry, [], `FINDING_I18N has no entry at all for these engine keys: ${missingEntry.join(', ')}`);
  assert.deepEqual(missingStandard, [], `FINDING_I18N entries missing a bilingual 'standard' statement: ${missingStandard.join(', ')}`);
});

test('the standard statement renders in a generated report, before the fix line', () => {
  const dir = mkdtempSync(join(tmpdir(), 'beacon-standard-render-'));
  try {
    const audit = join(dir, 'audit.json');
    const report = join(dir, 'report.html');
    writeFileSync(audit, JSON.stringify({
      metadata: { date: '2026-01-01', scope: 'test', standard: 'WCAG 2.2 AA' },
      summary: {
        overall_score: 90, coverage_percent: 40, total_findings: 1,
        critical: 1, warnings: 0, tips: 0,
        categories: [{ id: 'screenreader', name: 'Screen Reader', pass: 5, fail: 1, review: 0, state: 'scored', score: 90 }],
      },
      findings: [{ key: 'image-alt-missing', category: 'screenreader', severity: 'critical', wcag: 'WCAG 2.2: 1.1.1 Non-text Content', title: 'Image is missing alt text', affected_users: 'Blind and low-vision users', location: 'index.html:1', fix: 'Add alt text.', check: 'fail' }],
      legal_risk: {},
    }));
    execFileSync('node', [resolve(ROOT, 'core/scripts/generate-report.mjs'), audit, '--output', report]);
    const html = readFileSync(report, 'utf8');
    assert.match(html, /decision rule|明確標記|purely decorative/, 'expected image-alt-missing standard wording did not render');
    const standardIdx = html.indexOf('standard-line');
    const fixIdx = html.indexOf('fix-line');
    assert.ok(standardIdx > -1 && fixIdx > -1 && standardIdx < fixIdx, 'standard-line must render before fix-line');

    // Score 90 at 40% evidence is still conditional, not an overall pass.
    assert.match(html, /class="band"[\s\S]{0,160}已檢查範圍未發現確認問題，不能判定整體達標/);
    assert.match(html, /class="band"[\s\S]{0,240}No confirmed issues in the checked scope; overall status not determined/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// hakuso CRITICAL (2026-08-29): FINDING_I18N['click-handler-keyboard-missing'] shadows the
// engine's own `description` field (findingText() prefers the table), so the mandatory
// verification caveat added to the raw finding rendered in NEITHER language until it was
// copied into the table too. This asserts it actually renders, both languages.
test('the click-handler-keyboard-missing verification caveat renders in both languages, not shadowed by FINDING_I18N', () => {
  const dir = mkdtempSync(join(tmpdir(), 'beacon-caveat-render-'));
  try {
    const audit = join(dir, 'audit.json');
    const report = join(dir, 'report.html');
    writeFileSync(audit, JSON.stringify({
      metadata: { date: '2026-01-01', scope: 'test', standard: 'WCAG 2.2 AA' },
      summary: {
        overall_score: 90, coverage_percent: 40, total_findings: 1,
        critical: 0, warnings: 1, tips: 0,
        categories: [{ id: 'keyboard', name: 'Keyboard Navigation', pass: 0, fail: 0, review: 1, state: 'not-machine-checkable', score: null }],
      },
      findings: [{ key: 'click-handler-keyboard-missing', category: 'keyboard', severity: 'warning', check: 'review', wcag: 'WCAG 2.2: 2.1.1 Keyboard', title: 'Click handler lacks nearby keyboard handling', location: 'site.js:1', fix: 'Prefer a native button.', description: 'A click listener was found without nearby keyboard support in the same snippet.' }],
      legal_risk: {},
    }));
    execFileSync('node', [resolve(ROOT, 'core/scripts/generate-report.mjs'), audit, '--output', report]);
    const html = readFileSync(report, 'utf8');
    assert.match(html, /verify the target is not a native interactive element/, 'the caveat must render in English');
    assert.match(html, /請先確認目標不是原生互動元素/, 'the caveat must render in Chinese');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
