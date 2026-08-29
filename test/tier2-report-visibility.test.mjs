// Tier-2 evidence rendering (v3.3 WS-A presentation half): tier-2 findings, once spliced
// into audit.findings by whoever produces the artifact, must render honestly as EVIDENCE —
// provenance + measured values — without ever moving a category's state/score. This suite
// builds a small audit fixture with contrast/touch already 'not-machine-checkable' (as the
// static engine leaves them) and proves the tier-2 addition never touches that.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { loadPlaywright } from '../core/scripts/tier2-audit.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const REPORT = resolve(ROOT, 'core/scripts/generate-report.mjs');
const TIER2_AUDIT = resolve(ROOT, 'core/scripts/tier2-audit.mjs');
const STATIC_AUDIT = resolve(ROOT, 'core/scripts/static-audit.mjs');
const CONTRAST_FIXTURE = resolve(ROOT, 'test/tier2-fixtures/contrast.html');

function baseSummaryCategories() {
  return [
    { id: 'contrast', name: 'Color & Contrast', pass: 0, fail: 0, review: 2, state: 'not-machine-checkable', score: null },
    { id: 'touch', name: 'Touch & Targets', pass: 0, fail: 0, review: 1, state: 'not-machine-checkable', score: null },
    { id: 'screenreader', name: 'Screen Reader', pass: 5, fail: 1, review: 0, state: 'scored', score: 90 },
  ];
}

function staticFindings() {
  return [
    { key: 'contrast-not-verified', category: 'contrast', severity: 'tip', check: 'review', wcag: 'WCAG 2.2: 1.4.3 Contrast (Minimum)', title: 'Contrast not verified, run Tier 2', location: 'site-wide', fix: 'Run tier2-audit.mjs.' },
    { key: 'image-alt-missing', category: 'screenreader', severity: 'critical', wcag: 'WCAG 2.2: 1.1.1', title: 'Image is missing alt text', location: 'index.html:1', fix: 'Add alt text.', check: 'fail' },
  ];
}

// Synthetic tier-2 findings: 3 unresolvable-contrast instances (different locations, same
// key -- must collapse to ONE group), one contrast-fail with a computed ratio+pair, one
// touch-target-fail with computed width/height + the spacing-exception note.
function tier2Findings() {
  const unresolvable = ['#a', '#b', '#c'].map((sel) => ({
    key: 'tier2-contrast-unresolvable', category: 'contrast', severity: 'tip', check: 'review',
    wcag: 'WCAG 2.2: 1.4.3 Contrast (Minimum)', source: 'beacon-tier2-audit@1',
    title: 'Text contrast could not be verified (image or gradient background)',
    affected_users: 'Low-vision users', location: `${sel} (viewport 320x720)`, selector: sel, viewport: '320x720',
    fix: 'Verify manually.',
  }));
  const contrastFail = {
    key: 'tier2-contrast-fail', category: 'contrast', severity: 'warning', check: 'fail',
    wcag: 'WCAG 2.2: 1.4.3 Contrast (Minimum)', source: 'beacon-tier2-audit@1',
    title: 'Text contrast 1.93:1 is below the 4.5:1 minimum',
    affected_users: 'Low-vision users', location: '#link (viewport 320x720)', selector: '#link', viewport: '320x720',
    fix: 'Increase contrast.',
    computed: { fg: { r: 0, g: 0, b: 238 }, bg: { r: 113, g: 113, b: 113 }, ratio: 1.925, required: 4.5, fontSizePx: 16, bold: false, large: false },
  };
  const touchFail = {
    key: 'tier2-touch-target-fail', category: 'touch', severity: 'warning', check: 'fail',
    wcag: 'WCAG 2.2: 2.5.8 Target Size (Minimum)', source: 'beacon-tier2-audit@1',
    title: 'Touch target 16x24px is below the 24x24px minimum',
    affected_users: 'Touch-screen users', location: '#btn (viewport 320x720)', selector: '#btn', viewport: '320x720',
    fix: 'Enlarge the target.',
    computed: { width: 16, height: 24, spacingExceptionMet: false },
  };
  return [...unresolvable, contrastFail, touchFail];
}

function tier2Meta() {
  return {
    summary: {
      total_findings: 5, critical: 0, warnings: 2, tips: 3,
      by_viewport: [{ viewport: '320x720', contrast_samples: 50, touch_targets: 20, findings: 5 }],
    },
  };
}

function writeAudit(dir, { withTier2 }) {
  const audit = {
    metadata: { date: '2026-01-01', scope: 'test', url: 'https://example.com', standard: 'WCAG 2.2 AA' },
    summary: {
      overall_score: 85, coverage_percent: 33, total_findings: 2, critical: 1, warnings: 0, tips: 1,
      categories: baseSummaryCategories(),
    },
    findings: withTier2 ? [...staticFindings(), ...tier2Findings()] : staticFindings(),
    legal_risk: {},
  };
  if (withTier2) audit.tier2 = tier2Meta();
  const path = join(dir, withTier2 ? 'audit-merged.json' : 'audit-unmerged.json');
  writeFileSync(path, JSON.stringify(audit));
  return path;
}

test('tier-2 evidence renders honestly: provenance + measured values + unresolvable summarized, score untouched', () => {
  const dir = mkdtempSync(join(tmpdir(), 'beacon-tier2-report-'));
  try {
    const unmergedAudit = writeAudit(dir, { withTier2: false });
    const mergedAudit = writeAudit(dir, { withTier2: true });
    const unmergedReport = join(dir, 'unmerged.html');
    const mergedReport = join(dir, 'merged.html');
    execFileSync('node', [REPORT, unmergedAudit, '--output', unmergedReport]);
    execFileSync('node', [REPORT, mergedAudit, '--output', mergedReport]);
    const unmergedHtml = readFileSync(unmergedReport, 'utf8');
    const mergedHtml = readFileSync(mergedReport, 'utf8');

    // --- Score/coverage/category-state identity: the whole point of item 1 ---
    // Both reports were built from audits sharing the exact same `summary` block; the
    // state badge text and "not-machine-checkable" wording must be byte-identical in both.
    for (const cat of ['contrast', 'touch']) {
      const stateBadgeRe = new RegExp(`data-category="${cat}"[\\s\\S]{0,400}?已完成靜態掃描 · 需人工驗證`);
      assert.match(unmergedHtml, stateBadgeRe, `${cat} must stay not-machine-checkable in the unmerged report`);
      assert.match(mergedHtml, stateBadgeRe, `${cat} must STILL read not-machine-checkable once tier-2 evidence is spliced in`);
    }
    assert.doesNotMatch(mergedHtml, /data-category="contrast"[\s\S]{0,400}score-badge/, 'tier-2 evidence must never turn contrast into a scored category');
    assert.doesNotMatch(mergedHtml, /data-category="touch"[\s\S]{0,400}score-badge/, 'tier-2 evidence must never turn touch into a scored category');

    // --- Item 1: provenance label + measured counts, only on the merged report ---
    assert.doesNotMatch(unmergedHtml, /Browser-measured \(tier 2\)/, 'no tier-2 data given -> no provenance label');
    assert.match(mergedHtml, /Browser-measured \(tier 2\)/);
    // Fixture has ONE viewport entry (320x720) with contrast_samples:50, touch_targets:20 —
    // so contrast shows "50 measured", touch shows "20 measured".
    assert.match(mergedHtml, /50 measured \(320x720\)/);
    assert.match(mergedHtml, /20 measured \(320x720\)/);

    // --- Item 2: standard line + measured values for tier-2 keys ---
    assert.match(mergedHtml, /class="standard-line tier2-measured"/);
    assert.match(mergedHtml, /1\.925:1.*foreground rgb\(0, 0, 238\) vs background rgb\(113, 113, 113\)/);
    assert.match(mergedHtml, /16×24px.*spacing-exception circle/);

    // --- Item 3: N unresolvable instances collapse into ONE finding group, not N ---
    const unresolvableIds = mergedHtml.match(/id="fg-tier2-contrast-unresolvable"/g) || [];
    assert.equal(unresolvableIds.length, 1, 'the 3 unresolvable-contrast findings must render as ONE group, not one per instance');
    assert.match(mergedHtml, /id="fg-tier2-contrast-unresolvable"[\s\S]{0,500}?&times;3/, 'the one group must show the aggregate count');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// hakuso CRITICAL (2026-08-29 judgment-precision review): a merged touch finding's
// per-viewport label comes straight from --merge-findings' untrusted JSON input and was
// interpolated into report.html raw (sanitizeComputed only checked it WAS a string, never
// that it was safe). Runs the REAL pipeline with a hostile viewport label and proves it
// never reaches the page unescaped.
test('a hostile viewport string in --merge-findings input never reaches report.html raw (XSS)', () => {
  const dir = mkdtempSync(join(tmpdir(), 'beacon-tier2-xss-'));
  try {
    const payload = '<img src=x onerror=alert(1)>';
    const external = join(dir, 'external.json');
    const merged = join(dir, 'merged.json');
    const report = join(dir, 'report.html');
    const page = join(dir, 'page.html');
    writeFileSync(page, '<html><head><title>t</title></head><body><main><a href="#">x</a></main></body></html>');
    // Two instances, same selector, two hostile-but-distinct viewport labels -> exercises
    // the multi-viewport merge path (groupTouchFindingsBySelector), not the single-instance one.
    writeFileSync(external, JSON.stringify([
      { category: 'touch', key: 'tier2-touch-target-advisory', severity: 'tip', check: 'review',
        title: 'Touch target 30x30px meets the 24px floor but is below the 44px best practice',
        selector: '#x', viewport: payload, computed: { width: 30, height: 30 }, source: 'beacon-tier2-audit@2' },
      { category: 'touch', key: 'tier2-touch-target-advisory', severity: 'tip', check: 'review',
        title: 'Touch target 32x32px meets the 24px floor but is below the 44px best practice',
        selector: '#x', viewport: `${payload}2`, computed: { width: 32, height: 32 }, source: 'beacon-tier2-audit@2' },
    ]));
    execFileSync('node', [STATIC_AUDIT, '--scope', 'xss-probe', '--date', '2026-01-01', '--merge-findings', external, '--output', merged, page]);
    execFileSync('node', [REPORT, merged, '--output', report]);
    const html = readFileSync(report, 'utf8');
    assert.doesNotMatch(html, /<img src=x onerror=alert\(1\)>/, 'raw hostile viewport string must never reach the page');
    assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/, 'the viewport label must render escaped');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// HIGH-1 (2026-07-26 merge audit): the test above hand-writes an audit JSON with `computed`
// and `audit.tier2` already attached -- a shape no producer in the repo actually emits. This
// is the missing assertion: run the REAL documented pipeline (tier2-audit.mjs ->
// static-audit.mjs --merge-findings -> generate-report.mjs) and prove both the provenance
// chip and the measured-value line survive it end to end.
let pwAvailable = true;
try { await loadPlaywright(); } catch { pwAvailable = false; }

test('tier-2 provenance chip + measured line render through the real --merge-findings pipeline',
  { skip: !pwAvailable && 'tier2: playwright unavailable on this machine' }, () => {
  const dir = mkdtempSync(join(tmpdir(), 'beacon-tier2-pipeline-'));
  try {
    const tier2Json = join(dir, 'tier2.json');
    const mergedJson = join(dir, 'merged.json');
    const mergedHtml = join(dir, 'merged.html');
    execFileSync('node', [TIER2_AUDIT, '--url', CONTRAST_FIXTURE, '--output', tier2Json, '--date', '2026-07-26']);
    execFileSync('node', [
      STATIC_AUDIT, '--scope', 'tier2-merge-probe', '--url', 'tier2-merge-probe', '--date', '2026-07-26',
      '--merge-findings', tier2Json, '--output', mergedJson, CONTRAST_FIXTURE,
    ]);
    execFileSync('node', [REPORT, mergedJson, '--output', mergedHtml]);
    const audit = JSON.parse(readFileSync(mergedJson, 'utf8'));
    assert.ok(audit.tier2, 'the merged artifact must carry a tier2 provenance block');
    const html = readFileSync(mergedHtml, 'utf8');
    assert.match(html, /Browser-measured \(tier 2\)/, 'tier2-provenance chip must render');
    assert.match(html, /class="standard-line tier2-measured"/, 'tier2-measured line must render');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
