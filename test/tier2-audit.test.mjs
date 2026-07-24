// Beacon Tier-2 native measurement harness (contrast + touch targets).
// Two layers, tested separately per the capture/analyze split (mirrors focus-flow.test.mjs):
//   1. Pure color/geometry + analyze functions — synthetic data, no browser, fast.
//   2. Full harness (capture -> analyze) against hand-built fixtures in a real headless
//      Chromium, at both required viewports — proves the DOM/computed-style walk itself.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  parseColor, relLuminance, contrastRatio, compositeLayers, isLargeText,
  analyzeContrastSamples, analyzeTouchTargets,
  captureContrastSamples, captureTouchTargets, loadPlaywright, TIER2_VIEWPORTS,
} from '../core/scripts/tier2-audit.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURES = join(HERE, 'tier2-fixtures');

// --- pure color helpers -----------------------------------------------------------------

test('parseColor reads rgb() and rgba(), rejects garbage', () => {
  assert.deepEqual(parseColor('rgb(0, 0, 0)'), { r: 0, g: 0, b: 0, a: 1 });
  assert.deepEqual(parseColor('rgba(10, 20, 30, 0.5)'), { r: 10, g: 20, b: 30, a: 0.5 });
  assert.equal(parseColor('transparent'), null);
  assert.equal(parseColor(''), null);
  assert.equal(parseColor(undefined), null);
});

test('relLuminance/contrastRatio match WCAG worked examples', () => {
  assert.equal(contrastRatio({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 }), 21);
  assert.ok(Math.abs(contrastRatio({ r: 119, g: 119, b: 119 }, { r: 255, g: 255, b: 255 }) - 4.478) < 0.01);
  assert.ok(Math.abs(contrastRatio({ r: 153, g: 153, b: 153 }, { r: 255, g: 255, b: 255 }) - 2.849) < 0.01);
});

test('compositeLayers: single opaque layer wins outright', () => {
  assert.deepEqual(compositeLayers([{ r: 10, g: 20, b: 30, a: 1 }]), { r: 10, g: 20, b: 30 });
});

test('compositeLayers: semi-transparent black over opaque white composites to mid-gray', () => {
  const result = compositeLayers([{ r: 0, g: 0, b: 0, a: 0.5 }, { r: 255, g: 255, b: 255, a: 1 }]);
  assert.deepEqual(result, { r: 128, g: 128, b: 128 });
});

test('compositeLayers: no opaque layer anywhere defaults to white canvas', () => {
  assert.deepEqual(compositeLayers([{ r: 0, g: 0, b: 0, a: 0 }]), { r: 255, g: 255, b: 255 });
});

test('isLargeText: 24px normal weight is large; 18px bold is not (below 18.6667)', () => {
  assert.equal(isLargeText(24, false), true);
  assert.equal(isLargeText(23.9, false), false);
  assert.equal(isLargeText(18.7, true), true);
  assert.equal(isLargeText(18, true), false);
  assert.equal(isLargeText(18.7, false), false); // large size but not bold and under 24 -> not large
});

// --- analyzeContrastSamples (synthetic) -------------------------------------------------

const sample = (over = {}) => ({
  selector: '#x', fgStr: 'rgb(0, 0, 0)', bgLayerStrs: ['rgb(255, 255, 255)'],
  bgUnresolved: false, fontSizePx: 16, bold: false, ...over,
});

test('contrast: passing pair produces no finding', () => {
  assert.deepEqual(analyzeContrastSamples([sample()], '1280x900'), []);
});

test('contrast: failing normal-text pair produces a fail finding with the computed pair', () => {
  const findings = analyzeContrastSamples([sample({ fgStr: 'rgb(153, 153, 153)' })], '1280x900');
  assert.equal(findings.length, 1);
  const f = findings[0];
  assert.equal(f.key, 'tier2-contrast-fail');
  assert.equal(f.check, 'fail');
  assert.equal(f.category, 'contrast');
  assert.equal(f.viewport, '1280x900');
  assert.equal(f.selector, '#x');
  assert.equal(f.computed.required, 4.5);
  assert.ok(f.computed.ratio < 4.5);
});

test('contrast: same borderline color passes as large text (24px) but fails as normal (16px)', () => {
  const failing = analyzeContrastSamples([sample({ fgStr: 'rgb(119, 119, 119)', fontSizePx: 16 })], 'v');
  const passing = analyzeContrastSamples([sample({ fgStr: 'rgb(119, 119, 119)', fontSizePx: 24 })], 'v');
  assert.equal(failing.length, 1);
  assert.equal(passing.length, 0);
});

test('contrast: unresolved background produces a review finding, never a guessed ratio', () => {
  const findings = analyzeContrastSamples([sample({ bgUnresolved: true, bgLayerStrs: [] })], 'v');
  assert.equal(findings.length, 1);
  assert.equal(findings[0].key, 'tier2-contrast-unresolvable');
  assert.equal(findings[0].check, 'review');
  assert.equal(findings[0].computed, undefined);
});

test('contrast: semi-transparent fg composites over the resolved bg before the ratio', () => {
  // black at alpha 0.5 over white bg -> effective fg is mid-gray, same as bg-side compositing
  const findings = analyzeContrastSamples([sample({ fgStr: 'rgba(0, 0, 0, 0.5)' })], 'v');
  assert.equal(findings.length, 1); // gray-on-white ~3.95:1, below 4.5
  assert.deepEqual(findings[0].computed.fg, { r: 128, g: 128, b: 128 });
});

// hakuso MEDIUM (2026-07-25): fully-transparent ink (color:transparent / rgba(...,0)) has
// no visible text to measure -- must never produce a finding (was a false 1.00:1 fail).
test('contrast: fully-transparent foreground (invisible ink) produces no finding', () => {
  assert.deepEqual(analyzeContrastSamples([sample({ fgStr: 'rgba(0, 0, 0, 0)' })], 'v'), []);
});

// --- analyzeTouchTargets (synthetic) -----------------------------------------------------

test('touch: 48x48 alone produces no finding', () => {
  assert.deepEqual(analyzeTouchTargets([{ selector: '#a', rect: { x: 0, y: 0, width: 48, height: 48 } }], 'v'), []);
});

test('touch: 30x30 passes the floor but is flagged advisory (review, tip), not a violation', () => {
  const findings = analyzeTouchTargets([{ selector: '#a', rect: { x: 0, y: 0, width: 30, height: 30 } }], 'v');
  assert.equal(findings.length, 1);
  assert.equal(findings[0].key, 'tier2-touch-target-advisory');
  assert.equal(findings[0].check, 'review');
  assert.equal(findings[0].severity, 'tip');
});

test('touch: isolated undersized target passes the floor via the spacing exception, but still gets the 44px advisory (16 < 44)', () => {
  const targets = [
    { selector: '#small', rect: { x: 0, y: 0, width: 16, height: 16 } },
    { selector: '#far', rect: { x: 500, y: 500, width: 16, height: 16 } },
  ];
  const findings = analyzeTouchTargets(targets, 'v');
  assert.equal(findings.length, 2);
  assert.ok(findings.every((f) => f.key === 'tier2-touch-target-advisory' && f.check === 'review'));
});

test('touch: two undersized targets with touching edges both fail (spacing exception does not apply)', () => {
  const targets = [
    { selector: '#a', rect: { x: 0, y: 0, width: 16, height: 16 } },
    { selector: '#b', rect: { x: 16, y: 0, width: 16, height: 16 } },
  ];
  const findings = analyzeTouchTargets(targets, 'v');
  assert.equal(findings.length, 2);
  assert.ok(findings.every((f) => f.key === 'tier2-touch-target-fail' && f.check === 'fail'));
});

// hakuso HIGH (2026-07-25) gap band: two undersized targets whose RECTS don't touch but
// whose 24px CIRCLES do (center distance < 24) must both fail -- circle-vs-rect missed this.
test('touch: two 10x10 targets 20px apart (center-to-center) both fail via circle-vs-circle', () => {
  const targets = [
    { selector: '#a', rect: { x: 0, y: 0, width: 10, height: 10 } },
    { selector: '#b', rect: { x: 20, y: 0, width: 10, height: 10 } }, // centers (5,5) and (25,5) -> 20px apart
  ];
  const findings = analyzeTouchTargets(targets, 'v');
  assert.equal(findings.length, 2);
  assert.ok(findings.every((f) => f.key === 'tier2-touch-target-fail' && f.check === 'fail'));
});

test('touch: two 10x10 targets exactly 24px apart (center-to-center) both pass (advisory only)', () => {
  const targets = [
    { selector: '#a', rect: { x: 0, y: 0, width: 10, height: 10 } },
    { selector: '#b', rect: { x: 24, y: 0, width: 10, height: 10 } }, // centers (5,5) and (29,5) -> 24px apart
  ];
  const findings = analyzeTouchTargets(targets, 'v');
  assert.equal(findings.length, 2);
  assert.ok(findings.every((f) => f.key === 'tier2-touch-target-advisory' && f.check === 'review'));
});

// --- loadPlaywright discovery/error behavior --------------------------------------------

test('loadPlaywright: an explicit PLAYWRIGHT_MODULE_PATH pointing nowhere fails loudly, actionably, and does not silently fall through', async () => {
  const prev = process.env.PLAYWRIGHT_MODULE_PATH;
  process.env.PLAYWRIGHT_MODULE_PATH = 'C:/definitely/does/not/exist/playwright.mjs';
  try {
    await assert.rejects(() => loadPlaywright(), /PLAYWRIGHT_MODULE_PATH=.*did not resolve/);
  } finally {
    if (prev === undefined) delete process.env.PLAYWRIGHT_MODULE_PATH;
    else process.env.PLAYWRIGHT_MODULE_PATH = prev;
  }
});

// --- fixture integration tests: real Chromium, both viewports ---------------------------
// Gated on actual availability with a LOUD skip (visible in the node:test reporter output)
// so an unavailable Playwright never silently weakens the suite (pass-by-omission) or
// fails it red on a machine that legitimately has none installed.

let pwAvailable = true;
let pw;
try { pw = await loadPlaywright(); } catch { pwAvailable = false; }

test('fixture: contrast.html produces exactly the expected pass/fail/review set', { skip: !pwAvailable && 'tier2: playwright unavailable on this machine' }, async () => {
  const url = pathToFileURL(join(FIXTURES, 'contrast.html')).href;
  const browser = await pw.chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.goto(url, { waitUntil: 'load' });
    const samples = await captureContrastSamples(page);
    const findings = analyzeContrastSamples(samples, '1280x900');
    const byKeySelector = findings.map((f) => `${f.key}:${f.selector}`).sort();
    assert.deepEqual(byKeySelector, [
      'tier2-contrast-fail:#fail-both-16',
      'tier2-contrast-fail:#fail-bold-not-large-enough',
      'tier2-contrast-fail:#fail-normal-16',
      'tier2-contrast-unresolvable:#unresolvable-gradient',
      'tier2-contrast-unresolvable:#unresolvable-image',
    ].sort());
    // Compositing precision: the composited sample must resolve to rgb(128,128,128), not be flagged unresolved.
    const composited = samples.find((s) => s.selector === '#composited');
    assert.equal(composited.bgUnresolved, false);
    // hakuso MEDIUM: #transparent-fg must produce NO finding (not a false 1.00:1 fail) —
    // already implied by the exact byKeySelector match above, asserted explicitly too.
    assert.ok(!byKeySelector.some((k) => k.endsWith(':#transparent-fg')));
    await page.close();
  } finally {
    await browser.close();
  }
});

test('fixture: touch-targets.html differs by viewport as designed (18x18 shrink only fails at 320)', { skip: !pwAvailable && 'tier2: playwright unavailable on this machine' }, async () => {
  const url = pathToFileURL(join(FIXTURES, 'touch-targets.html')).href;
  const browser = await pw.chromium.launch({ headless: true });
  try {
    const results = {};
    for (const vp of TIER2_VIEWPORTS) {
      const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
      await page.goto(url, { waitUntil: 'load' });
      const targets = await captureTouchTargets(page);
      results[vp.label] = analyzeTouchTargets(targets, vp.label).map((f) => `${f.key}:${f.selector}`).sort();
      await page.close();
    }
    const gapBand = [
      'tier2-touch-target-fail:#gap-fail-a',      // 10x10, centers 20px apart (<24) -> circle-vs-circle intersects
      'tier2-touch-target-fail:#gap-fail-b',
      'tier2-touch-target-advisory:#gap-pass-a',  // 10x10, centers exactly 24px apart -> exception met, still <44
      'tier2-touch-target-advisory:#gap-pass-b',
    ];
    assert.deepEqual(results['1280x900'], [
      'tier2-touch-target-advisory:#advisory',
      'tier2-touch-target-advisory:#isolated', // 16x16, passes the floor via spacing but still below 44 best-practice
      'tier2-touch-target-fail:#crowded-a',
      'tier2-touch-target-fail:#crowded-b',
      'tier2-touch-target-fail:#tiny-neighbor',
      ...gapBand,
    ].sort());
    assert.deepEqual(results['320x720'], [
      'tier2-touch-target-advisory:#advisory',
      'tier2-touch-target-advisory:#isolated',
      'tier2-touch-target-fail:#crowded-a',
      'tier2-touch-target-fail:#crowded-b',
      'tier2-touch-target-fail:#responsive',
      'tier2-touch-target-fail:#tiny-neighbor',
      ...gapBand,
    ].sort());
    // disabled + ok must never appear, at either viewport
    for (const list of Object.values(results)) {
      assert.ok(!list.some((k) => k.includes('#disabled-tiny')));
      assert.ok(!list.some((k) => k.endsWith(':#ok')));
    }
  } finally {
    await browser.close();
  }
});
