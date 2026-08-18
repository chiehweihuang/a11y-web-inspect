import assert from 'node:assert/strict';
import test from 'node:test';

import { DESIGN_QA_VIEWPORTS, classifySnapshot, summarizeRuns } from '../core/scripts/design-qa.mjs';

const clean = {
  document_scroll_width: 320,
  document_client_width: 320,
  element_overflows: [],
  text_columns: [{ selector: 'main p', width: 304 }],
  forbidden_fonts: [],
  page_errors: [],
  console_errors: [],
};

test('uses the full width matrix including a non-breakpoint width', () => {
  assert.deepEqual(DESIGN_QA_VIEWPORTS.map(item => item.width), [320, 768, 1024, 1280, 1440, 1742, 1920]);
});

test('clean machine checks pass while manual checks remain explicit', () => {
  const checks = classifySnapshot(clean, DESIGN_QA_VIEWPORTS[0]);
  const summary = summarizeRuns([{ checks }]);
  assert.equal(summary.machine_verdict, 'pass');
  assert.equal(summary.blocking_checks, 0);
  assert.match(summary.required_manual_checks[0], /browser zoom at 200%/i);
});

test('overflow, crushed text, forbidden fonts, and page errors block', () => {
  const checks = classifySnapshot({
    ...clean,
    document_scroll_width: 400,
    element_overflows: [{ selector: '.chips', scroll_width: 400, client_width: 300 }],
    text_columns: [{ selector: 'main p', width: 120 }],
    forbidden_fonts: [{ selector: 'body', font_family: 'PMingLiU' }],
    page_errors: ['boom'],
  }, DESIGN_QA_VIEWPORTS[0]);
  const summary = summarizeRuns([{ checks }]);
  assert.equal(summary.machine_verdict, 'blocked');
  assert.equal(summary.blocking_checks, 5);
});

test('capture failure makes the gate incomplete', () => {
  const summary = summarizeRuns([{ error: 'navigation failed', checks: [] }]);
  assert.equal(summary.machine_verdict, 'incomplete');
  assert.equal(summary.capture_failures, 1);
});
