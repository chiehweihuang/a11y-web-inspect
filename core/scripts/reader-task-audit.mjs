#!/usr/bin/env node
// Reader-oriented browser evidence for Beacon.
//
// This captures the surface available to a non-visual agent (accessibility tree
// plus keyboard focus) and keeps task judgement outside the machine score. It
// is deliberately not named NVDA/VoiceOver testing: those require the actual
// assistive-technology runtime and remain separate evidence.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadPlaywright } from './tier2-audit.mjs';

export const READER_ENGINE = 'beacon-reader-task@1';
export const TASK_OUTCOMES = new Set(['completed', 'failed', 'ambiguous', 'blocked', 'not-assessed']);
export const AT_STATUSES = new Set(['pass', 'fail', 'blocked', 'not-tested']);
const INTENT_SOURCES = new Set(['owner', 'page', 'schema', 'llms', 'review', 'inferred']);
const MAX_TEXT = 4000;
const MAX_SNAPSHOT = 20000;
const DEFAULT_MAX_TABS = 24;
const SETTLE_QUIET_MS = 500;
const HTTP_PROTOCOLS = new Set(['http:', 'https:']);

function requireObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
  return value;
}

function textValue(value, label, { required = false, max = MAX_TEXT } = {}) {
  if (value === undefined || value === null || value === '') {
    if (required) throw new TypeError(`${label} is required`);
    return null;
  }
  if (typeof value !== 'string') throw new TypeError(`${label} must be a string`);
  const result = value.trim();
  if (!result && required) throw new TypeError(`${label} is required`);
  return result ? result.slice(0, max) : null;
}

function httpUrl(value, label) {
  const result = textValue(value, label, { max: 2000 });
  if (!result) return null;
  try {
    if (!HTTP_PROTOCOLS.has(new URL(result).protocol)) throw new Error('only http(s) URLs are allowed');
  } catch (error) {
    throw new TypeError(`${label} must be a valid http(s) URL: ${error.message}`);
  }
  return result;
}

function localizedValue(value, label, { required = false } = {}) {
  if (typeof value === 'string') return textValue(value, label, { required });
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const zh = textValue(value.zh, `${label}.zh`);
    const en = textValue(value.en, `${label}.en`);
    if (!zh && !en && required) throw new TypeError(`${label} is required`);
    return zh || en ? { zh: zh || en, en: en || zh } : null;
  }
  if (required) throw new TypeError(`${label} is required`);
  return null;
}

function choice(value, allowed, label, fallback) {
  const result = value || fallback;
  if (!allowed.has(result)) throw new TypeError(`${label} must be one of: ${[...allowed].join(', ')}`);
  return result;
}

function normalizeSources(value) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) throw new TypeError('intent.sources must be an array');
  return value.slice(0, 20).map((source, index) => {
    const item = requireObject(source, `intent.sources[${index}]`);
    return {
      type: choice(item.type || item.source, INTENT_SOURCES, `intent.sources[${index}].type`, 'inferred'),
      label: localizedValue(item.label || item.note, `intent.sources[${index}].label`) || '',
      url: httpUrl(item.url, `intent.sources[${index}].url`),
      note: localizedValue(item.note, `intent.sources[${index}].note`),
    };
  });
}

function normalizeIntent(raw) {
  const intent = requireObject(raw || {}, 'intent');
  return {
    purpose: localizedValue(intent.purpose, 'intent.purpose', { required: true }),
    audience: localizedValue(intent.audience, 'intent.audience'),
    source: choice(intent.source, INTENT_SOURCES, 'intent.source', 'inferred'),
    confidence: choice(intent.confidence, new Set(['high', 'medium', 'low']), 'intent.confidence', 'medium'),
    sources: normalizeSources(intent.sources),
  };
}

function maxTabs(value, label) {
  if (value === undefined || value === null) return DEFAULT_MAX_TABS;
  if (!Number.isInteger(value) || value < 1 || value > 80) throw new TypeError(`${label} must be an integer from 1 to 80`);
  return value;
}

function normalizeTask(task, index) {
  const item = requireObject(task, `tasks[${index}]`);
  const goal = localizedValue(item.goal, `tasks[${index}].goal`, { required: true });
  const criteria = item.success_criteria === undefined
    ? [goal]
    : (Array.isArray(item.success_criteria) ? item.success_criteria : null);
  if (!criteria || !criteria.length) throw new TypeError(`tasks[${index}].success_criteria must be a non-empty array`);
  return {
    id: textValue(item.id, `tasks[${index}].id`, { required: true, max: 120 }),
    goal,
    success_criteria: criteria.slice(0, 20).map((criterion, criterionIndex) =>
      localizedValue(criterion, `tasks[${index}].success_criteria[${criterionIndex}]`, { required: true })),
    max_tabs: maxTabs(item.max_tabs, `tasks[${index}].max_tabs`),
  };
}

export function normalizeTaskSpec(raw) {
  const input = requireObject(raw, 'task spec');
  const intent = normalizeIntent(input.intent);
  const tasks = Array.isArray(input.tasks) ? input.tasks : (input.task ? [input.task] : null);
  if (!tasks || !tasks.length) throw new TypeError('task spec must contain a non-empty tasks array');
  return { intent, tasks: tasks.slice(0, 20).map(normalizeTask) };
}

function normalizeEvidenceList(value, label) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) throw new TypeError(`${label} must be an array`);
  return value.slice(0, 40).map((item, index) => {
    if (typeof item === 'string') return { label: item.slice(0, MAX_TEXT), url: null };
    const entry = requireObject(item, `${label}[${index}]`);
    return {
      label: textValue(entry.label || entry.note, `${label}[${index}].label`, { required: true }),
      url: httpUrl(entry.url, `${label}[${index}].url`),
    };
  });
}

function normalizeTaskResults(tasks, rawTasks) {
  if (rawTasks !== undefined && rawTasks !== null && !Array.isArray(rawTasks)) {
    throw new TypeError('task results must be an array');
  }
  const taskIds = new Set(tasks.map((task) => task.id));
  const results = new Map();
  for (const [index, item] of (rawTasks || []).entries()) {
    const entry = requireObject(item, `tasks[${index}]`);
    const id = textValue(entry.id, `tasks[${index}].id`, { required: true, max: 120 });
    if (!taskIds.has(id)) throw new TypeError(`tasks[${index}].id does not match a defined task: ${id}`);
    if (results.has(id)) throw new TypeError(`tasks[${index}].id is duplicated: ${id}`);
    results.set(id, entry);
  }
  return tasks.map((task) => {
    const result = results.get(task.id) || {};
    return {
      ...task,
      outcome: choice(result.outcome, TASK_OUTCOMES, `tasks[${task.id}].outcome`, 'not-assessed'),
      interpretation: localizedValue(result.interpretation, `tasks[${task.id}].interpretation`),
      observations: Array.isArray(result.observations)
        ? result.observations.slice(0, 40).map((item, index) => localizedValue(item, `tasks[${task.id}].observations[${index}]`, { required: true }))
        : [],
      evidence: normalizeEvidenceList(result.evidence, `tasks[${task.id}].evidence`),
    };
  });
}

function normalizeSnapshot(snapshot) {
  if (snapshot === undefined || snapshot === null) return null;
  const item = requireObject(snapshot, 'reader_surface.snapshot');
  const format = textValue(item.format, 'reader_surface.snapshot.format', { required: true, max: 120 });
  const content = item.content ?? item.value ?? '';
  const serialized = typeof content === 'string' ? content : JSON.stringify(content);
  const clipped = serialized.slice(0, MAX_SNAPSHOT);
  return {
    format,
    content: clipped,
    truncated: clipped.length < serialized.length || item.truncated === true,
  };
}

function normalizeKeyboard(keyboard) {
  if (keyboard === undefined || keyboard === null) return null;
  const item = requireObject(keyboard, 'reader_surface.keyboard');
  const stops = Array.isArray(item.stops) ? item.stops.slice(0, 80).map((stop, index) => {
    const entry = requireObject(stop, `reader_surface.keyboard.stops[${index}]`);
    return {
      index: Number.isInteger(entry.index) ? entry.index : index + 1,
      tag: textValue(entry.tag, `reader_surface.keyboard.stops[${index}].tag`, { max: 40 }),
      role: textValue(entry.role, `reader_surface.keyboard.stops[${index}].role`, { max: 120 }),
      name_hint: textValue(entry.name_hint, `reader_surface.keyboard.stops[${index}].name_hint`, { max: 300 }),
      id: textValue(entry.id, `reader_surface.keyboard.stops[${index}].id`, { max: 200 }),
      type: textValue(entry.type, `reader_surface.keyboard.stops[${index}].type`, { max: 80 }),
    };
  }) : [];
  return {
    max_tabs: maxTabs(item.max_tabs, 'reader_surface.keyboard.max_tabs'),
    stop_count: Number.isInteger(item.stop_count) ? item.stop_count : stops.length,
    stopped_reason: textValue(item.stopped_reason, 'reader_surface.keyboard.stopped_reason', { max: 120 }),
    stops,
  };
}

function normalizeAssistiveTechnology(value) {
  const input = value === undefined || value === null ? {} : requireObject(value, 'assistive_technology');
  return Object.fromEntries(['nvda', 'voiceover', 'talkback'].map((name) => {
    const raw = input[name];
    const entry = typeof raw === 'string' ? { status: raw } : (raw || {});
    return [name, {
      status: choice(entry.status, AT_STATUSES, `assistive_technology.${name}.status`, 'not-tested'),
      evidence: normalizeEvidenceList(entry.evidence, `assistive_technology.${name}.evidence`),
      note: localizedValue(entry.note, `assistive_technology.${name}.note`),
    }];
  }));
}

export function normalizeReaderEvidence(raw) {
  const input = requireObject(raw, 'reader evidence');
  const rawTasks = input.tasks ?? (input.task ? [input.task] : undefined);
  const spec = normalizeTaskSpec({ intent: input.intent, tasks: rawTasks });
  const metadata = requireObject(input.metadata || {}, 'metadata');
  const surface = requireObject(input.reader_surface || {}, 'reader_surface');
  return {
    metadata: {
      date: textValue(metadata.date, 'metadata.date', { required: true, max: 40 }),
      url: textValue(metadata.url, 'metadata.url', { max: 2000 }),
      tool_version: textValue(metadata.tool_version, 'metadata.tool_version', { max: 200 }),
      engine_fingerprint: textValue(metadata.engine_fingerprint, 'metadata.engine_fingerprint', { max: 120 }),
      audit_tier: textValue(metadata.audit_tier, 'metadata.audit_tier', { max: 200 }),
      reproducible: metadata.reproducible !== false,
      scored: false,
    },
    intent: spec.intent,
    tasks: normalizeTaskResults(spec.tasks, input.tasks),
    reader_surface: {
      status: choice(surface.status, new Set(['captured', 'failed', 'not-captured']), 'reader_surface.status', 'not-captured'),
      channel: Array.isArray(surface.channel) ? surface.channel.slice(0, 10).map((value, index) => textValue(value, `reader_surface.channel[${index}]`, { required: true, max: 80 })) : [],
      snapshot: normalizeSnapshot(surface.snapshot),
      keyboard: normalizeKeyboard(surface.keyboard),
    },
    assistive_technology: normalizeAssistiveTechnology(input.assistive_technology),
    note: localizedValue(input.note, 'note'),
  };
}

export function buildArtifact({ url, date, spec, readerSurface, taskResults } = {}) {
  const normalized = normalizeTaskSpec(spec);
  return normalizeReaderEvidence({
    metadata: {
      date: resolveDate(date),
      url,
      tool_version: 'Beacon reader-oriented browser capture (Playwright)',
      engine_fingerprint: READER_ENGINE,
      audit_tier: 'Reader-oriented browser evidence (accessibility tree + keyboard)',
      reproducible: true,
    },
    intent: normalized.intent,
    tasks: normalized.tasks.map((task) => ({ ...task, ...(taskResults?.find((result) => result.id === task.id) || {}) })),
    reader_surface: readerSurface,
    assistive_technology: {
      nvda: { status: 'not-tested', note: { zh: '本次未啟動 NVDA。', en: 'NVDA was not started in this run.' } },
      voiceover: { status: 'not-tested', note: { zh: '本次未啟動 VoiceOver。', en: 'VoiceOver was not started in this run.' } },
      talkback: { status: 'not-tested', note: { zh: '本次未啟動 TalkBack。', en: 'TalkBack was not started in this run.' } },
    },
    note: {
      zh: '這是可重複的非視覺瀏覽器證據，不是 NVDA、VoiceOver、TalkBack 或真人測試；任務結果不計入機器分數。',
      en: 'This is reproducible non-visual browser evidence, not NVDA, VoiceOver, TalkBack, or human testing; task outcomes are excluded from the machine score.',
    },
  });
}

export function toLoadableUrl(input) {
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(input)) return input;
  return pathToFileURL(resolve(input)).href;
}

async function settlePage(page, loadUrl) {
  if (loadUrl.startsWith('file:///')) {
    await page.route('**/*', (route) => {
      const requestUrl = route.request().url();
      if (requestUrl.startsWith('file:///')) route.continue();
      else route.abort();
    });
  }
  await page.goto(loadUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('load', { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(SETTLE_QUIET_MS);
}

export async function captureAccessibilitySnapshot(page) {
  const body = page.locator('body').first();
  if (typeof body.ariaSnapshot === 'function') {
    return { format: 'playwright-aria-snapshot', content: await body.ariaSnapshot() };
  }
  if (page.accessibility && typeof page.accessibility.snapshot === 'function') {
    return { format: 'playwright-accessibility-tree', content: await page.accessibility.snapshot({ interestingOnly: false }) };
  }
  throw new Error('reader-task-audit: this Playwright version exposes neither locator.ariaSnapshot() nor page.accessibility.snapshot().');
}

export async function captureKeyboardStops(page, maxTabStops = DEFAULT_MAX_TABS) {
  const stops = [];
  for (let i = 0; i < maxTabStops; i += 1) {
    await page.keyboard.press('Tab');
    const stop = await page.evaluate(() => {
      const element = document.activeElement;
      if (!element) return null;
      const isBody = element === document.body;
      const text = String(element.innerText || element.getAttribute('aria-label') || element.getAttribute('title') || '')
        .replace(/\s+/g, ' ').trim().slice(0, 300);
      return {
        isBody,
        tag: element.tagName.toLowerCase(),
        role: element.getAttribute('role') || element.tagName.toLowerCase(),
        name_hint: element.getAttribute('aria-label') || element.getAttribute('title') || text || null,
        id: element.id || null,
        type: element.getAttribute('type') || null,
      };
    });
    if (!stop) break;
    if (!stop.isBody) stops.push({ ...stop, index: stops.length + 1 });
    if (stop.isBody) return { max_tabs: maxTabStops, stop_count: stops.length, stopped_reason: 'body', stops };
  }
  return { max_tabs: maxTabStops, stop_count: stops.length, stopped_reason: 'max-tabs', stops };
}

function resolveDate(value) {
  if (value) return value;
  const epoch = process.env.SOURCE_DATE_EPOCH;
  if (epoch && /^\d+$/.test(epoch)) return new Date(Number(epoch) * 1000).toISOString().slice(0, 10);
  return new Date().toISOString().slice(0, 10);
}

export async function runReaderTaskAudit({ url, spec, date, taskResults, playwrightModule } = {}) {
  if (!url) throw new TypeError('reader-task-audit: url is required');
  const normalizedSpec = normalizeTaskSpec(spec);
  const pw = playwrightModule || await loadPlaywright();
  const loadUrl = toLoadableUrl(url);
  const browser = await pw.chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  try {
    await settlePage(page, loadUrl);
    const snapshot = await captureAccessibilitySnapshot(page);
    const maxTabStops = Math.max(...normalizedSpec.tasks.map((task) => task.max_tabs));
    const keyboard = await captureKeyboardStops(page, maxTabStops);
    return buildArtifact({
      url,
      date: resolveDate(date),
      spec: normalizedSpec,
      taskResults,
      readerSurface: {
        status: 'captured',
        channel: ['accessibility-tree', 'keyboard'],
        snapshot,
        keyboard,
      },
    });
  } finally {
    await page.close();
    await browser.close();
  }
}

function readJson(file, label) {
  try { return JSON.parse(readFileSync(file, 'utf8')); }
  catch (error) { throw new Error(`${label}: cannot read/parse ${file}: ${error.message}`); }
}

export function parseArgs(argv) {
  const opts = { url: null, task: null, assessment: null, output: 'reader-results.json', date: null };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--url') opts.url = argv[++i];
    else if (arg === '--task') opts.task = argv[++i];
    else if (arg === '--assessment') opts.assessment = argv[++i];
    else if (arg === '--output') opts.output = argv[++i];
    else if (arg === '--date') opts.date = argv[++i];
    else throw new Error(`Usage: node reader-task-audit.mjs --url <url-or-file-path> --task <intent-task.json> [--assessment assessment.json] [--output reader-results.json] [--date iso]`);
  }
  if (!opts.url || !opts.task) throw new Error('Usage: node reader-task-audit.mjs --url <url-or-file-path> --task <intent-task.json> [--assessment assessment.json] [--output reader-results.json] [--date iso]');
  return opts;
}

if (process.argv[1] && process.argv[1].endsWith('reader-task-audit.mjs')) {
  try {
    const opts = parseArgs(process.argv.slice(2));
    const spec = normalizeTaskSpec(readJson(opts.task, 'reader-task-audit'));
    const assessment = opts.assessment ? readJson(opts.assessment, 'reader-task-audit assessment') : null;
    const assessmentItems = assessment ? (assessment.tasks || assessment.items || assessment) : null;
    const taskResults = assessment ? normalizeTaskResults(spec.tasks, assessmentItems) : undefined;
    const artifact = await runReaderTaskAudit({ url: opts.url, spec, date: opts.date, taskResults });
    mkdirSync(dirname(resolve(opts.output)), { recursive: true });
    writeFileSync(opts.output, JSON.stringify(artifact, null, 2));
    console.log(`Wrote ${opts.output}`);
    console.log(`Reader surface captured: ${artifact.reader_surface.keyboard?.stop_count || 0} keyboard stop(s); task outcomes remain outside the machine score.`);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
