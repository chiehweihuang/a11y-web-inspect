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
        overall_score: 100, coverage_percent: 10, total_findings: 2,
        critical: 1, warnings: 0, tips: 0,
        categories: [
          { id: 'contrast', name: 'Color & Contrast', pass: 0, fail: 0, review: 1, state: 'not-machine-checkable', score: null, thin: false },
          { id: 'screenreader', name: 'Screen Reader', pass: 1, fail: 1, review: 0, state: 'scored', score: 100, thin: false },
          { id: 'responsive', name: 'Responsive & Reflow', pass: 1, fail: 0, review: 0, state: 'scored', score: 100, thin: true },
        ],
      },
      findings: [
        { key: 'html-lang-missing', category: 'screenreader', severity: 'critical', wcag: 'WCAG 2.2: 3.1.1', title: 'Page language is missing', location: 'index.html:1', fix: 'Add lang.', check: 'fail' },
        { key: 'input-label-missing', category: 'forms', severity: 'critical', wcag: 'WCAG 2.2: 1.3.1', title: 'Input label is missing', location: 'form.html:2', fix: 'Add a label.', check: 'fail' },
      ],
      legal_risk: {},
      testing_recommendations: [{ zh: '中文測試建議', en: 'English testing recommendation' }],
    }));
    execFileSync('node', [join(ROOT, 'core/scripts/generate-report.mjs'), audit, '--output', report]);
    const html = readFileSync(report, 'utf8');

    // Unscored categories (not-machine-checkable / not-applicable) carry a text badge,
    // never a score/ring.
    assert.match(html, /data-category="contrast"[\s\S]*?已完成靜態掃描 · 需人工驗證/);

    // A+ (engine @17, user ruling 2026-08-08): a thin category (evidence < N=3) still
    // scores -- the "證據薄弱" qualifier sits on the SAME line as the score badge, not a
    // footnote, and it must appear before score-badge in card markup order.
    assert.match(
      html,
      /data-category="responsive"[\s\S]{0,400}class="score-qual">[\s\S]{0,120}證據薄弱[\s\S]{0,200}class="score-badge"/,
      'a thin category must render its score-qual chip immediately before the score badge, same card row'
    );
    assert.match(html, /data-category="responsive"[\s\S]{0,400}<b class="s-pass">100<\/b>/, 'the thin category still renders its actual score');

    // A low-coverage pass describes the checked scope, never the whole page.
    assert.match(html, /class="band"[\s\S]{0,160}已檢查範圍未發現確認問題，不能判定整體達標/);
    assert.match(html, /class="band"[\s\S]{0,240}No confirmed issues in the checked scope; overall status not determined/);
    assert.match(html, /機測分數/);
    assert.match(html, /Machine-checked score/);
    assert.match(html, /已取得機器證據/);
    assert.match(html, /Machine evidence obtained/);
    assert.match(html, /尚未執行 AI 非視覺任務測試/);
    assert.match(html, /AI non-visual task test not run/);
    assert.match(html, /固定機器檢查範圍/);
    assert.match(html, /本頁適用範圍/);
    assert.match(html, /適用但尚未驗證/);
    assert.match(html, /本頁不適用/);
    assert.match(html, /aria-valuenow="10"/, 'coverage must be exposed as its own semantic metric');
    assert.match(html, /not an overall accessibility score/);
    assert.doesNotMatch(html, /[ \t]+$/m, 'generated report must not contain trailing whitespace');

    // Masthead: page URL escaped, bilingual label present.
    assert.match(html, /受測網頁/);
    assert.match(html, /href="https:\/\/example\.com\/test\?page=1&amp;mode=audit" target="_blank" rel="noopener noreferrer"/);

    // Findings render grouped by fix action (the remediation tab this superseded
    // read the same content from a separate `remediation` array).
    assert.match(html, /index\.html:1/);
    assert.match(html, /加入正確的語言 attribute/);
    assert.match(html, /https:\/\/chiehweihuang\.github\.io\/a11y-design\/#empathy/);
    assert.match(html, /表單 label 體驗 · Form-label experience/);

    // Testing recommendations stay bilingual.
    assert.match(html, /中文測試建議/);
    assert.match(html, /English testing recommendation/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('reader evidence report shows site intent, task result, direct sources, and actual AT status', () => {
  const dir = mkdtempSync(join(tmpdir(), 'beacon-reader-report-'));
  try {
    const audit = join(dir, 'audit.json');
    const report = join(dir, 'report.html');
    writeFileSync(audit, JSON.stringify({
      metadata: { date: '2026-01-01', scope: 'reader test', url: 'https://example.com/', standard: 'WCAG 2.2 AA' },
      summary: { overall_score: 80, coverage_percent: 20, total_findings: 1, critical: 0, warnings: 1, tips: 0, categories: [] },
      findings: [],
      legal_risk: {},
      testing_recommendations: [],
      reader_evidence: {
        metadata: { date: '2026-01-01', scored: false },
        intent: {
          purpose: { zh: '申請服務', en: 'Apply for a service' },
          audience: { zh: '申請人', en: 'Applicants' },
          source: 'owner',
          confidence: 'high',
          sources: [{ type: 'page', label: { zh: '服務頁', en: 'Service page' }, url: 'https://example.com/service' }],
        },
        tasks: [{
          id: 'start-application',
          goal: { zh: '開始申請', en: 'Start an application' },
          success_criteria: [{ zh: '找到開始按鈕', en: 'Find the start button' }],
          outcome: 'ambiguous',
          interpretation: { zh: '按鈕目的不夠清楚', en: 'The button purpose is unclear' },
          evidence: [{ label: 'captured task page', url: 'https://example.com/service#start' }],
        }],
        reader_surface: {
          status: 'captured',
          channel: ['accessibility-tree', 'keyboard'],
          snapshot: { format: 'test-tree', content: 'button "Start application"' },
          keyboard: { stop_count: 2, max_tabs: 8 },
        },
        assistive_technology: {
          nvda: { status: 'not-tested', note: { zh: '未啟動', en: 'Not started' } },
          voiceover: { status: 'blocked' },
          talkback: { status: 'not-tested' },
        },
      },
    }));
    execFileSync('node', [join(ROOT, 'core/scripts/generate-report.mjs'), audit, '--output', report]);
    const html = readFileSync(report, 'utf8');
    assert.match(html, /申請服務/);
    assert.match(html, /Apply for a service/);
    assert.match(html, /開始申請/);
    assert.match(html, /Start an application/);
    assert.match(html, /意圖有歧義/);
    assert.match(html, /Intent was ambiguous/);
    assert.match(html, /href="https:\/\/example\.com\/service#start" target="_blank" rel="noopener noreferrer"/);
    assert.match(html, /button &quot;Start application&quot;/);
    assert.match(html, /NVDA/);
    assert.match(html, /尚未測試/);
    assert.match(html, /Not tested/);
    assert.match(html, /不計入機器分數/);
    assert.match(html, /excluded from the machine score/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// hakuso round-2 micro-fix-2 (2026-08-29): "mostly derived" is a false claim when the
// real fraction is 100% -- the wording must reflect derived_pass vs pass exactly, not a
// hardcoded "mostly".
function derivedPassAudit(derivedPass) {
  return {
    metadata: { date: '2026-01-01', scope: 't', standard: 'WCAG 2.2 AA' },
    summary: {
      overall_score: 90, coverage_percent: 40, total_findings: 0, critical: 0, warnings: 0, tips: 0,
      categories: [{ id: 'contrast', name: 'Color & Contrast', pass: 10, fail: 0, review: 0, state: 'scored', score: 100, thin: false, derived_pass: derivedPass }],
    },
    findings: [], legal_risk: {},
  };
}

test('derived-pass wording says "all" when derived_pass equals pass, "mostly" when it is only part', () => {
  const dir = mkdtempSync(join(tmpdir(), 'beacon-derived-pass-'));
  try {
    const allAudit = join(dir, 'all.json');
    const partialAudit = join(dir, 'partial.json');
    const allReport = join(dir, 'all.html');
    const partialReport = join(dir, 'partial.html');
    writeFileSync(allAudit, JSON.stringify(derivedPassAudit(10)));
    writeFileSync(partialAudit, JSON.stringify(derivedPassAudit(4)));
    execFileSync('node', [join(ROOT, 'core/scripts/generate-report.mjs'), allAudit, '--output', allReport]);
    execFileSync('node', [join(ROOT, 'core/scripts/generate-report.mjs'), partialAudit, '--output', partialReport]);
    const allHtml = readFileSync(allReport, 'utf8');
    const partialHtml = readFileSync(partialReport, 'utf8');
    assert.match(allHtml, /全數為瀏覽器量測後推算/, 'derived_pass === pass must say "all"');
    assert.match(allHtml, /all derived from decided browser-measured samples/);
    assert.doesNotMatch(allHtml, /多數為瀏覽器量測後推算/, 'must not say "mostly" when it is actually all');
    assert.match(partialHtml, /多數為瀏覽器量測後推算/, 'derived_pass < pass must say "mostly"');
    assert.match(partialHtml, /mostly derived from decided browser-measured samples/);
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
