import test from 'node:test';
import assert from 'node:assert/strict';

import {
  axeViolationToFinding,
  criteriaFromFinding,
  getAxeResults,
  normalizeAxeResults,
} from '../core/scripts/axe-results.mjs';

function fixture() {
  return {
    testEngine: { name: 'axe-core', version: '4.11.4' },
    testRunner: { name: 'axe' },
    testEnvironment: { windowWidth: 1280, windowHeight: 900 },
    url: 'https://example.com/',
    timestamp: '2026-07-30T05:52:30.116Z',
    violations: [
      {
        id: 'color-contrast',
        impact: 'serious',
        tags: ['cat.color', 'wcag2aa', 'wcag143'],
        description: 'Ensure sufficient contrast',
        help: 'Elements must meet contrast thresholds',
        helpUrl: 'https://dequeuniversity.com/rules/axe/4.11/color-contrast',
        nodes: [
          { target: ['#first'], html: '<a id="first">First</a>', failureSummary: 'Contrast is 3:1' },
          { target: ['#second'], html: '<a id="second">Second</a>', failureSummary: 'Contrast is 4:1' },
        ],
      },
      {
        id: 'target-size',
        impact: 'moderate',
        tags: ['cat.sensory-and-visual-cues', 'wcag22aa', 'wcag258'],
        description: 'Ensure targets are large enough',
        help: 'Targets must meet minimum size',
        nodes: [{ target: ['button'], html: '<button>Go</button>', failureSummary: 'Target is too small' }],
      },
    ],
    passes: Array.from({ length: 24 }, (_, index) => ({ id: `pass-${index}`, nodes: [] })),
    incomplete: [{ id: 'aria-prohibited-attr', nodes: [{ target: ['main'] }] }],
    inapplicable: Array.from({ length: 38 }, (_, index) => ({ id: `na-${index}`, nodes: [] })),
  };
}

test('normalizeAxeResults preserves complete result groups and counts affected nodes', () => {
  const normalized = normalizeAxeResults(fixture());

  assert.equal(normalized.engine, 'axe-core');
  assert.equal(normalized.version, '4.11.4');
  assert.equal(normalized.url, 'https://example.com/');
  assert.equal(normalized.timestamp, '2026-07-30T05:52:30.116Z');
  assert.deepEqual(normalized.counts, {
    violations: 2,
    violation_nodes: 3,
    passes: 24,
    incomplete: 1,
    inapplicable: 38,
  });
  assert.equal(normalized.violations[0].nodes.length, 2);
  assert.equal(normalized.passes.length, 24);
  assert.equal(normalized.incomplete.length, 1);
  assert.equal(normalized.inapplicable.length, 38);
});

test('normalizeAxeResults rejects a malformed standard result group', () => {
  const raw = fixture();
  delete raw.incomplete;

  assert.throws(
    () => normalizeAxeResults(raw),
    /axe results field "incomplete" must be an array/i,
  );
});

test('axeViolationToFinding creates one finding with every affected DOM node', () => {
  const raw = fixture();
  const finding = axeViolationToFinding(raw.violations[0], {
    index: 0,
    version: raw.testEngine.version,
  });

  assert.equal(finding.id, 'axe-color-contrast');
  assert.equal(finding.source, 'axe-core@4.11.4');
  assert.equal(finding.category, 'contrast');
  assert.equal(finding.severity, 'warning');
  assert.equal(finding.check, 'fail');
  assert.equal(finding.axe_node_count, 2);
  assert.deepEqual(finding.instances.map(instance => instance.selector), ['#first', '#second']);
  assert.deepEqual(criteriaFromFinding(finding), ['1.4.3']);
});

// Bug 4 (HIGH): a pre-refactor artifact may carry only `axe.violations`, no
// passes/incomplete/inapplicable arrays. getAxeResults must not treat that as "axe never
// ran" — it must restore the legacy shape (missing groups default to empty) so findings
// still surface downstream.
test('getAxeResults accepts a legacy artifact carrying only axe.violations', () => {
  const audit = {
    axe: {
      violations: [{
        id: 'color-contrast', tags: ['wcag2aa', 'wcag143'],
        help: 'Elements must meet contrast thresholds',
        nodes: [{ target: ['p'] }, { target: ['a'] }],
      }],
    },
  };
  const axe = getAxeResults(audit);

  assert.ok(axe, 'getAxeResults must not return null for a legacy violations-only shape');
  assert.equal(axe.violations.length, 1);
  assert.equal(axe.counts.violations, 1);
  assert.equal(axe.counts.violation_nodes, 2);
  assert.deepEqual(axe.passes, []);
  assert.deepEqual(axe.incomplete, []);
  assert.deepEqual(axe.inapplicable, []);
});
