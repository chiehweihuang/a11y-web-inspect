import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SCANNER = resolve(ROOT, 'core/scripts/static-audit.mjs');
const PAGE = '<!doctype html><html lang="en"><head><title>Test</title><meta name="viewport" content="width=device-width"><meta name="description" content="Test page"><link rel="canonical" href="https://example.com"></head><body><main><h1>Test</h1><a href="/">Home</a></main></body></html>';

function axeResult() {
  return {
    testEngine: { name: 'axe-core', version: '4.11.4' },
    testRunner: { name: 'axe' },
    testEnvironment: { windowWidth: 1280, windowHeight: 900 },
    url: 'https://example.com/',
    timestamp: '2026-07-30T05:52:30.116Z',
    violations: [{
      id: 'color-contrast',
      impact: 'serious',
      tags: ['cat.color', 'wcag2aa', 'wcag143'],
      description: 'Ensure sufficient contrast',
      help: 'Elements must meet contrast thresholds',
      nodes: [
        { target: ['#first'], html: '<a id="first">First</a>', failureSummary: 'Contrast is 3:1' },
        { target: ['#second'], html: '<a id="second">Second</a>', failureSummary: 'Contrast is 4:1' },
      ],
    }],
    passes: [],
    incomplete: [],
    inapplicable: [],
  };
}

function tier2Artifact(check = 'fail') {
  return {
    metadata: { engine_fingerprint: 'beacon-tier2-audit@2' },
    summary: {
      by_viewport: [{ viewport: '1280x900', contrast_samples: 3, touch_targets: 0, findings: 1 }],
    },
    findings: [
      {
        key: 'tier2-contrast-fail',
        category: 'contrast',
        severity: 'warning',
        check,
        wcag: 'WCAG 2.2: 1.4.3 Contrast (Minimum)',
        title: check === 'review' ? 'Contrast needs review' : 'Contrast is below minimum',
        source: 'beacon-tier2-audit@2',
        selector: 'body > main:nth-child(1) > a:nth-child(2)',
      },
      { category: 'contrast', check: 'pass', title: 'Contrast pass 1', source: 'beacon-tier2-audit@2' },
      { category: 'contrast', check: 'pass', title: 'Contrast pass 2', source: 'beacon-tier2-audit@2' },
    ],
  };
}

function run({ axe = axeResult(), tier2 = null, page = PAGE } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'beacon-axe-static-'));
  try {
    const pagePath = join(dir, 'page.html');
    const out = join(dir, 'audit.json');
    writeFileSync(pagePath, page);
    const args = [
      SCANNER,
      '--scope', 'axe-test',
      '--date', '2026-07-30',
      '--output', out,
    ];
    if (axe) {
      const axePath = join(dir, 'axe.json');
      writeFileSync(axePath, JSON.stringify(axe));
      args.push('--axe-results', axePath);
    }
    if (tier2) {
      const tier2Path = join(dir, 'tier2.json');
      writeFileSync(tier2Path, JSON.stringify(tier2));
      args.push('--merge-findings', tier2Path);
    }
    args.push(pagePath);
    execFileSync('node', args, { cwd: dir, stdio: ['ignore', 'pipe', 'pipe'] });
    return JSON.parse(readFileSync(out, 'utf8'));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function contrast(audit) {
  return audit.summary.categories.find(category => category.id === 'contrast');
}

test('standard axe input becomes one score-bearing finding with every affected node', () => {
  const audit = run();
  const findings = audit.findings.filter(finding => finding.axe_rule_id === 'color-contrast');

  assert.equal(audit.axe.counts.violations, 1);
  assert.equal(audit.axe.counts.violation_nodes, 2);
  assert.equal(findings.length, 1);
  assert.equal(findings[0].instances.length, 2);
  assert.equal(findings[0].score_effect, undefined);
  assert.equal(contrast(audit).fail, 1);
  assert.equal(audit.metadata.requires_live_audit, false);
});

test('confirmed Tier 2 overlap keeps axe evidence without a second score penalty', () => {
  const withAxe = run({ tier2: tier2Artifact('fail') });
  const tier2OnlyRaw = axeResult();
  tier2OnlyRaw.violations = [];
  const tier2Only = run({ axe: tier2OnlyRaw, tier2: tier2Artifact('fail') });
  const axeFinding = withAxe.findings.find(finding => finding.axe_rule_id === 'color-contrast');
  const tier2Finding = withAxe.findings.find(finding => finding.key === 'tier2-contrast-fail');

  assert.equal(axeFinding.score_effect, 'corroborating');
  assert.equal(contrast(withAxe).fail, contrast(tier2Only).fail);
  assert.equal(contrast(withAxe).score, contrast(tier2Only).score);
  assert.equal(withAxe.summary.overall_score, tier2Only.summary.overall_score);
  assert.ok(tier2Finding.evidence_sources.includes('axe-core@4.11.4'));
  assert.ok(tier2Finding.evidence_sources.includes('beacon-tier2-audit@2'));
});

test('review-only Tier 2 evidence does not suppress a confirmed axe failure', () => {
  const audit = run({ tier2: tier2Artifact('review') });
  const axeFinding = audit.findings.find(finding => finding.axe_rule_id === 'color-contrast');

  assert.equal(axeFinding.score_effect, undefined);
  assert.equal(contrast(audit).fail, 1);
  assert.ok(audit.findings.some(finding => finding.key === 'tier2-contrast-fail' && finding.check === 'review'));
});

test('malformed axe JSON fails at the CLI boundary with the file and field', () => {
  assert.throws(
    () => run({ axe: { ...axeResult(), incomplete: null } }),
    error => {
      const stderr = String(error.stderr || '');
      return /--axe-results: .*axe\.json/i.test(stderr)
        && /field "incomplete" must be an array/i.test(stderr);
    },
  );
});

// --- Bug 1 (CRITICAL): corroboration must match ANY confirmed check:'fail' finding
// (native Tier-1 included), not just findings sourced from beacon-tier2-audit. Reproduces
// the auditor's 41-image fixture: 40 images with alt + 1 without (one real Tier-1 defect),
// axe reports only that same image-alt defect. Score with axe must equal score without.
const IMAGE_41_PAGE = `<!doctype html><html lang="en"><head><title>T</title></head><body><main><h1>H</h1>
${Array.from({ length: 40 }, (_, i) => `<img src="${i + 1}.png" alt="a${i + 1}">`).join('\n')}
<img src="bad.png"></main></body></html>`;

function axeImageAltTwin() {
  return {
    testEngine: { name: 'axe-core', version: '4.11.4' },
    violations: [{
      id: 'image-alt', impact: 'critical', help: 'Images must have alternate text', description: 'd',
      tags: ['cat.text-alternatives', 'wcag2a', 'wcag111'],
      nodes: [{ target: ['img'], html: '<img src=bad.png>' }],
    }],
    passes: [], incomplete: [], inapplicable: [],
  };
}

test('axe corroboration widens to ANY confirmed Tier-1 finding, not just tier2-sourced (41-image fixture)', () => {
  const withoutAxe = run({ axe: null, page: IMAGE_41_PAGE });
  const withAxe = run({ axe: axeImageAltTwin(), page: IMAGE_41_PAGE });
  const axeFinding = withAxe.findings.find(finding => finding.axe_rule_id === 'image-alt');

  assert.equal(withAxe.summary.overall_score, withoutAxe.summary.overall_score);
  assert.equal(axeFinding.score_effect, 'corroborating');
});

// --- Bug 2 (HIGH): axe rules with no wcag* tag (best-practice or otherwise untagged) must
// inform (check:'review') without moving an AA score.
test('axe findings with no WCAG criterion inform without moving the score', () => {
  const withoutAxe = run({ axe: null });
  const withAxe = run({
    axe: {
      testEngine: { name: 'axe-core', version: '4.11.4' },
      violations: [
        { id: 'region', impact: 'moderate', help: 'All page content should be contained by landmarks', description: 'd', tags: ['cat.keyboard', 'best-practice'], nodes: [{ target: ['div'], html: '<div>' }] },
        { id: 'heading-order', impact: 'moderate', help: 'Heading levels should only increase by one', description: 'd', tags: ['cat.semantics', 'best-practice'], nodes: [{ target: ['h3'], html: '<h3>' }] },
      ],
      passes: [], incomplete: [], inapplicable: [],
    },
  });
  const region = withAxe.findings.find(finding => finding.axe_rule_id === 'region');
  const headingOrder = withAxe.findings.find(finding => finding.axe_rule_id === 'heading-order');

  assert.equal(region.check, 'review');
  assert.equal(headingOrder.check, 'review');
  assert.equal(withAxe.summary.overall_score, withoutAxe.summary.overall_score);
});

// --- Bug 3 (HIGH): axe running at all is browser evidence for contrast, even with zero
// contrast violations reported — otherwise the artifact claims "never exercised by a
// rendering engine" beside audit_tier "Tier 1 + axe-core".
test('axe presence marks contrast as browser-verified even with zero violations', () => {
  const audit = run({
    axe: {
      testEngine: { name: 'axe-core', version: '4.11.4' },
      violations: [],
      passes: [
        { id: 'color-contrast', help: 'h', tags: ['cat.color', 'wcag2aa', 'wcag143'], nodes: [{ target: ['p'] }, { target: ['a'] }, { target: ['h1'] }] },
        { id: 'target-size', help: 'h', tags: ['wcag22aa', 'wcag258'], nodes: [{ target: ['button'] }] },
        { id: 'image-alt', help: 'h', tags: ['wcag2a', 'wcag111'], nodes: [{ target: ['img'] }] },
      ],
      incomplete: [], inapplicable: [],
    },
  });

  assert.equal(audit.metadata.requires_live_audit, false);
  assert.ok(!audit.findings.some(finding => finding.key === 'contrast-not-verified'));
});

// --- Bug 5 (HIGH): malformed violation entries (not an object, or no string id) must be
// skipped with a stderr tally, never minted into scored findings.
test('malformed axe violation entries are skipped with a stderr tally, not scored', () => {
  const dir = mkdtempSync(join(tmpdir(), 'beacon-axe-static-'));
  try {
    const pagePath = join(dir, 'page.html');
    const axePath = join(dir, 'axe.json');
    const out = join(dir, 'audit.json');
    writeFileSync(pagePath, PAGE);
    writeFileSync(axePath, JSON.stringify({ violations: ['hello', null, 42], passes: [], incomplete: [], inapplicable: [] }));
    const result = spawnSync('node', [SCANNER, '--scope', 'axe-test', '--date', '2026-07-30', '--axe-results', axePath, '--output', out, pagePath], { cwd: dir, encoding: 'utf8' });

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stderr, /--axe-results: merged 0.*skipped 3/i);
    const audit = JSON.parse(readFileSync(out, 'utf8'));
    assert.ok(!audit.findings.some(finding => typeof finding.source === 'string' && finding.source.startsWith('axe-core')));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// --- Bug 6 (HIGH): the life-safety gate (2.3.1) must arm from the FULL criterion list, not
// just the first criterion in a composed wcag string ("2.4.1 Bypass Blocks; 2.3.1").
test('life-safety gate arms even when 2.3.1 is not the first criterion in a composed wcag string', () => {
  const audit = run({
    axe: {
      testEngine: { name: 'axe-core', version: '4.11.4' },
      violations: [{
        id: 'flashy', impact: 'moderate', help: 'Flashing content', description: 'd',
        tags: ['cat.time-and-media', 'wcag2a', 'wcag241', 'wcag231'],
        nodes: [{ target: ['div'], html: '<div>' }],
      }],
      passes: [], incomplete: [], inapplicable: [],
    },
  });
  const finding = audit.findings.find(f => f.axe_rule_id === 'flashy');

  assert.equal(finding.severity, 'critical');
  assert.equal(audit.summary.life_safety_flag, true);
});

// ==== Round 2 (adversarial gate): category+criterion alone is too coarse; a specific
// defect-identity mapping (or node/selector overlap) replaces it. ====

// --- Bug 1 (CRITICAL): a genuinely different Tier-1 defect must NOT corroborate an axe
// finding just because it shares category+criterion (both keyboard/4.1.2 here).
const NESTED_PAGE = '<!doctype html><html lang="en"><head><title>t</title><meta name="description" content="d"></head><body><main><h1>H</h1>\n<button class="x"><svg></svg></button>\n<a href="/x"><button>Go</button></a>\n</main></body></html>';

test('axe corroboration does not fire for a genuinely different Tier-1 defect sharing category+criterion', () => {
  const withoutAxe = run({ axe: null, page: NESTED_PAGE });
  const withAxe = run({
    axe: {
      testEngine: { name: 'axe-core', version: '4.10.2' },
      violations: [{
        id: 'nested-interactive', impact: 'serious', help: 'Interactive controls must not be nested', description: 'd',
        tags: ['cat.keyboard', 'wcag2a', 'wcag412'],
        nodes: [{ target: ['#outer'], html: '<a href="/x"><button>Go</button></a>' }],
      }],
      passes: [], incomplete: [], inapplicable: [],
    },
    page: NESTED_PAGE,
  });
  const nested = withAxe.findings.find(f => f.axe_rule_id === 'nested-interactive');

  assert.notEqual(nested.score_effect, 'corroborating');
  assert.notEqual(withAxe.summary.overall_score, withoutAxe.summary.overall_score);
});

// --- Bug 2a (HIGH): `data-title=` / `data-original-title=` must not be read as `title=`.
test('data-title and data-original-title attributes do not silently name a button', () => {
  const page = '<!doctype html><html lang="en"><head><title>t</title></head><body><main>\n<button type="button" data-title="tooltip only" class="a"></button>\n<button type="button" data-original-title="bs tooltip" class="c"></button>\n</main></body></html>';
  const audit = run({ axe: null, page });

  assert.equal(audit.findings.filter(f => f.key === 'button-name-missing').length, 2);
});

// --- Bug 2b (HIGH): an empty title="" (or aria-label="") must not silently drop the fail.
test('an empty title="" does not silently drop the button-name-missing fail', () => {
  const page = '<!doctype html><html lang="en"><head><title>t</title></head><body><main>\n<button type="button" title="" class="b"></button>\n</main></body></html>';
  const audit = run({ axe: null, page });
  const finding = audit.findings.find(f => f.key === 'button-name-missing');

  assert.ok(finding, 'empty title="" must still produce a button-name-missing finding');
  assert.equal(finding.check, 'fail');
});

// --- Bug 3 (HIGH): contrast-not-verified must survive an axe file that ran but never
// touched color-contrast (violations/passes/incomplete all lack it) — axe presence alone
// is not evidence contrast was checked.
test('contrast-not-verified survives an axe file with no contrast evidence', () => {
  const audit = run({
    axe: {
      testEngine: { name: 'axe-core', version: '4.10.2' },
      violations: [{
        id: 'bypass', impact: 'serious', help: 'Page must have means to bypass repeated blocks', description: 'd',
        tags: ['cat.keyboard', 'wcag2a', 'wcag241'],
        nodes: [{ target: ['html'], html: '<html>' }],
      }],
      passes: [], incomplete: [], inapplicable: [],
    },
  });

  assert.equal(audit.metadata.requires_live_audit, true);
  assert.ok(audit.findings.some(f => f.key === 'contrast-not-verified'));
});
