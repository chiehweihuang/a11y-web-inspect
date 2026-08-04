import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const GENERATOR = join(ROOT, 'core/scripts/generate-report.mjs');

function fixture() {
  return {
    metadata: {
      date: '2026-07-30',
      scope: 'ADALS activity page',
      url: 'https://example.com/activity/',
      standard: 'WCAG 2.2 AA',
      audit_tier: 'Tier 2',
      tool_version: 'beacon-static-audit@test',
    },
    summary: {
      overall_score: 68,
      coverage_percent: 48,
      total_findings: 2,
      critical: 1,
      warnings: 1,
      tips: 0,
      categories: [
        { id: 'screenreader', name: 'Screen Reader', pass: 3, fail: 1, review: 0, state: 'scored', score: 63 },
        { id: 'agent', name: 'Agent', pass: 2, fail: 1, review: 1, state: 'scored', score: 62 },
      ],
    },
    findings: [
      {
        key: 'html-lang-missing',
        category: 'screenreader',
        severity: 'critical',
        wcag: 'WCAG 2.2: 3.1.1',
        title: 'Page language is missing',
        affected_users: 'Screen-reader users',
        location: 'index.html:1',
        fix: 'Add lang.',
        check: 'fail',
      },
      {
        key: 'meta-description-missing',
        category: 'agent',
        severity: 'warning',
        title: 'Meta description is missing',
        location: 'index.html:2',
        fix: 'Add a page-specific description.',
        check: 'fail',
      },
      {
        key: 'tier2-contrast-unresolvable',
        category: 'contrast',
        severity: 'warning',
        title: 'Computed contrast could not be resolved',
        location: 'browser capture',
        fix: 'Review the painted background manually.',
        check: 'review',
      },
    ],
    lighthouse: {
      categories: [{ id: 'performance', title: 'Performance', score: 74 }],
    },
    legal_risk: {},
    testing_recommendations: [],
  };
}

test('client audience shows three plain-language pillars and priority actions without audit internals', () => {
  const dir = mkdtempSync(join(tmpdir(), 'beacon-client-report-'));
  try {
    const audit = join(dir, 'audit.json');
    const report = join(dir, 'client.html');
    writeFileSync(audit, JSON.stringify(fixture()));
    execFileSync('node', [GENERATOR, audit, '--audience', 'client', '--output', report]);
    const html = readFileSync(report, 'utf8');

    assert.match(html, /data-audience="client"/);
    assert.match(html, /無障礙與 Agent 操作/);
    assert.match(html, /效能/);
    assert.match(html, /搜尋與 AI 可發現性/);
    assert.match(html, /優先處理/);
    assert.match(html, /Page language is missing/);
    assert.doesNotMatch(html, /Computed contrast could not be resolved/);
    assert.doesNotMatch(html, /id="layer-evidence"/);
    assert.doesNotMatch(html, /id="layer-findings"/);
    assert.doesNotMatch(html, /id="layer-methodology"/);
    assert.doesNotMatch(html, /class="engine-tag"/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('audit remains the default audience and keeps the complete evidence layers', () => {
  const dir = mkdtempSync(join(tmpdir(), 'beacon-audit-report-'));
  try {
    const audit = join(dir, 'audit.json');
    const report = join(dir, 'audit.html');
    writeFileSync(audit, JSON.stringify(fixture()));
    execFileSync('node', [GENERATOR, audit, '--output', report]);
    const html = readFileSync(report, 'utf8');

    assert.match(html, /data-audience="audit"/);
    assert.match(html, /id="layer-evidence"/);
    assert.match(html, /id="layer-findings"/);
    assert.match(html, /id="layer-methodology"/);
    assert.match(html, /class="engine-tag"/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('unknown audience fails with an actionable error', () => {
  const dir = mkdtempSync(join(tmpdir(), 'beacon-invalid-audience-'));
  try {
    const audit = join(dir, 'audit.json');
    writeFileSync(audit, JSON.stringify(fixture()));
    const result = spawnSync('node', [GENERATOR, audit, '--audience', 'sales'], { encoding: 'utf8' });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Expected "audit" or "client"/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
