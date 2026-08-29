import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  buildArtifact,
  normalizeReaderEvidence,
  normalizeTaskSpec,
  runReaderTaskAudit,
} from '../core/scripts/reader-task-audit.mjs';
import { loadPlaywright } from '../core/scripts/tier2-audit.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const FIXTURE = pathToFileURL(join(ROOT, 'test/golden/clean.html')).href;

const SPEC = {
  intent: {
    purpose: { zh: '展示可存取內容', en: 'Present accessible content' },
    audience: { zh: '網站訪客', en: 'Site visitors' },
    source: 'owner',
    confidence: 'high',
    sources: [{ type: 'owner', label: { zh: '產品說明', en: 'Product brief' }, url: 'https://example.com/brief' }],
  },
  tasks: [{
    id: 'find-home',
    goal: { zh: '找到首頁連結', en: 'Find the home link' },
    success_criteria: [{ zh: '能辨識 Home 連結', en: 'Can identify the Home link' }],
    max_tabs: 8,
  }],
};

test('task spec and artifact keep intent, outcomes, and AT evidence separate from score', () => {
  const artifact = buildArtifact({
    url: 'https://example.com/',
    date: '2020-01-01',
    spec: SPEC,
    taskResults: [{
      id: 'find-home',
      outcome: 'completed',
      interpretation: { zh: '連結可辨識', en: 'The link is identifiable' },
      observations: [{ zh: '焦點可到達', en: 'Focus reaches it' }],
      evidence: [{ label: 'task trace', url: 'https://example.com/trace' }],
    }],
    readerSurface: {
      status: 'captured',
      channel: ['accessibility-tree', 'keyboard'],
      snapshot: { format: 'test-tree', content: 'link "Home"' },
      keyboard: { max_tabs: 8, stop_count: 1, stopped_reason: 'test', stops: [{ index: 1, tag: 'a', role: 'link', name_hint: 'Home' }] },
    },
  });

  assert.equal(artifact.metadata.scored, false);
  assert.equal(artifact.tasks[0].outcome, 'completed');
  assert.equal(artifact.reader_surface.status, 'captured');
  assert.equal(artifact.assistive_technology.nvda.status, 'not-tested');
  assert.equal(Object.hasOwn(artifact, 'overall_score'), false);
  assert.equal(Object.hasOwn(artifact, 'summary'), false);
});

test('reader evidence rejects malformed task results and unsafe source URLs', () => {
  assert.throws(() => normalizeTaskSpec({ ...SPEC, tasks: [{ id: 'missing-goal' }] }), /goal/);
  assert.throws(() => normalizeReaderEvidence({
    metadata: { date: '2020-01-01' },
    intent: SPEC.intent,
    tasks: [{ ...SPEC.tasks[0], evidence: [{ label: 'bad', url: 'javascript:alert(1)' }] }],
  }), /http\(s\) URL/);
  assert.throws(() => normalizeReaderEvidence({
    metadata: { date: '2020-01-01' },
    intent: SPEC.intent,
    tasks: [SPEC.tasks[0], SPEC.tasks[0]],
    reader_surface: { status: 'captured' },
  }), /duplicated/);
});

let playwright;
try { playwright = await loadPlaywright(); } catch { /* skip below when Chromium is unavailable */ }

test('reader audit captures the accessibility tree and keyboard path from a real page', {
  skip: !playwright && 'reader-task-audit: Playwright unavailable on this machine',
}, async () => {
  const artifact = await runReaderTaskAudit({ url: FIXTURE, date: '2020-01-01', spec: SPEC, playwrightModule: playwright });
  assert.equal(artifact.reader_surface.status, 'captured');
  assert.match(artifact.reader_surface.snapshot.content, /Home|Golden clean/);
  assert.ok(artifact.reader_surface.keyboard.stop_count > 0);
  assert.equal(artifact.tasks[0].outcome, 'not-assessed');
  assert.equal(artifact.metadata.scored, false);
});
