import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

test('category cards expose completed states as text (never a painted score), and findings render grouped by fix action', () => {
  const dir = mkdtempSync(join(tmpdir(), 'beacon-report-disclosure-'));
  try {
    const audit = join(dir, 'audit.json');
    const report = join(dir, 'report.html');
    writeFileSync(audit, JSON.stringify({
      metadata: { date: '2026-01-01', scope: 'test', url: 'https://example.com/test?page=1&mode=audit', standard: 'WCAG 2.2 AA' },
      summary: {
        overall_score: 100, coverage_percent: 10, total_findings: 1,
        critical: 1, warnings: 0, tips: 0,
        categories: [
          { id: 'contrast', name: 'Color & Contrast', pass: 0, fail: 0, review: 1, state: 'not-machine-checkable', score: null },
          { id: 'screenreader', name: 'Screen Reader', pass: 1, fail: 1, review: 0, state: 'scored', score: 100 },
          { id: 'responsive', name: 'Responsive & Reflow', pass: 1, fail: 0, review: 0, state: 'insufficient-evidence', score: null },
        ],
      },
      findings: [
        { key: 'html-lang-missing', category: 'screenreader', severity: 'critical', wcag: 'WCAG 2.2: 3.1.1', title: 'Page language is missing', location: 'index.html:1', fix: 'Add lang.', check: 'fail' },
      ],
      legal_risk: {},
      testing_recommendations: [{ zh: '中文測試建議', en: 'English testing recommendation' }],
    }));
    execFileSync('node', [join(ROOT, 'core/scripts/generate-report.mjs'), audit, '--output', report]);
    const html = readFileSync(report, 'utf8');

    // Unscored categories carry a text badge, never a score/ring — engine @9's
    // not-machine-checkable and insufficient-evidence states both render as text.
    assert.match(html, /data-category="contrast"[\s\S]*?已完成靜態掃描 · 需人工驗證/);
    assert.match(html, /data-category="responsive"[\s\S]*?已完成靜態掃描 · 證據不足以計分/);
    assert.doesNotMatch(
      html,
      /data-category="responsive"[\s\S]{0,400}score-badge/,
      'an insufficient-evidence category must not render a score badge'
    );

    // Masthead: page URL escaped, bilingual label present.
    assert.match(html, /受測網頁/);
    assert.match(html, /href="https:\/\/example\.com\/test\?page=1&amp;mode=audit" target="_blank" rel="noopener noreferrer"/);

    // Findings render grouped by fix action (the remediation tab this superseded
    // read the same content from a separate `remediation` array).
    assert.match(html, /index\.html:1/);
    assert.match(html, /加入正確的語言 attribute/);

    // Testing recommendations stay bilingual.
    assert.match(html, /中文測試建議/);
    assert.match(html, /English testing recommendation/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// A nested --output path with no existing parent directory must not crash after the HTML
// has already been built (hakuso HIGH-1, 2026-07-27 codex-adapter audit).
test('--output to a not-yet-existing nested directory: parent dirs are created, exit 0', () => {
  const dir = mkdtempSync(join(tmpdir(), 'beacon-report-nested-'));
  try {
    const audit = join(dir, 'audit.json');
    const report = join(dir, 'out', 'a11y', 'report.html');
    writeFileSync(audit, JSON.stringify({
      metadata: { date: '2026-01-01', scope: 'test', url: 'https://example.com/', standard: 'WCAG 2.2 AA' },
      summary: { overall_score: 100, coverage_percent: 10, total_findings: 0, critical: 0, warnings: 0, tips: 0, categories: [] },
      findings: [],
      legal_risk: {},
      testing_recommendations: [],
    }));
    execFileSync('node', [join(ROOT, 'core/scripts/generate-report.mjs'), audit, '--output', report]);
    assert.ok(existsSync(report), 'report.html should exist under the freshly created out/a11y/ dir');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
