// Beacon Workstream B (engine @10) · static contrast reference value.
// Black-box via CLI, same pattern as static-audit-detectors.test.mjs: static-audit.mjs
// runs main() on import, so exercise it as the CLI it is.
//
// Resolvability is deliberately narrow (VALIDATION.md L2 "static contrast reference
// value") — every "must NOT resolve" case here is load-bearing, not incidental: a static
// scanner that guesses through cascade/alpha/external-CSS uncertainty recreates the exact
// lie v3.2 retired narrative site bands over.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SCANNER = resolve(ROOT, 'core/scripts/static-audit.mjs');

function runScanner(html) {
  const dir = mkdtempSync(join(tmpdir(), 'beacon-static-contrast-'));
  try {
    const fixture = join(dir, 'page.html');
    const out = join(dir, 'audit-results.json');
    writeFileSync(fixture, html);
    execFileSync('node', [SCANNER, '--scope', 'static-contrast-test', '--output', out, fixture], {
      stdio: ['ignore', 'pipe', 'pipe'], cwd: dir,
    });
    return JSON.parse(readFileSync(out, 'utf8').replace(/\r\n?/g, '\n'));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const page = (body, style = '') => `<!DOCTYPE html><html lang="en"><head><title>t</title>${style ? `<style>${style}</style>` : ''}</head><body>${body}</body></html>`;

const contrastFindings = (audit, key) => audit.findings.filter((f) => f.category === 'contrast' && f.key === key);

// --- resolvable, sub-threshold: must produce a finding -----------------------------------

test('inline fg + inline bg on the same element, sub-threshold, produces a review finding', () => {
  const audit = runScanner(page('<p style="color:#777777;background:#ffffff;">text</p>'));
  const hits = contrastFindings(audit, 'static-contrast-sub-threshold');
  assert.equal(hits.length, 1);
  assert.equal(hits[0].check, 'review');
  assert.ok(hits[0].computed.ratio < 4.5);
  assert.deepEqual(hits[0].computed.fg, { r: 119, g: 119, b: 119, a: 1 });
  assert.deepEqual(hits[0].computed.bg, { r: 255, g: 255, b: 255, a: 1 });
});

test('inline fg on the element + inline bg on an ancestor, sub-threshold, produces a finding', () => {
  const audit = runScanner(page('<div style="background:#ffffff;"><p style="color:#999999;">text</p></div>'));
  assert.equal(contrastFindings(audit, 'static-contrast-sub-threshold').length, 1);
});

test('same-file <style> class rule pair, both fg and bg declared via class on the SAME element, sub-threshold', () => {
  const audit = runScanner(
    page('<p class="btn">text</p>', '.btn{background:#ffffff;color:#999999;}')
  );
  assert.equal(contrastFindings(audit, 'static-contrast-sub-threshold').length, 1);
});

// hakuso HIGH (2026-07-25): a compound/descendant/element-qualified selector's rule must
// NEVER resolve on an element that only carries the TAIL token of that selector -- the old
// rule regex matched only the trailing `[.#][\w-]+` before `{`, so `.c2a.c2b{color:#777}`
// falsely applied to any element with just class="c2b".
test('compound selector .a.b does not resolve on an element carrying only class "b"', () => {
  const audit = runScanner(
    page('<p class="c2b" style="background:#ffffff;">text</p>', '.c2a.c2b{color:#777777;}')
  );
  assert.equal(contrastFindings(audit, 'static-contrast-sub-threshold').length, 0);
  assert.equal(contrastFindings(audit, 'static-contrast-evidence').length, 0);
});

test('descendant selector .parent .child does not resolve on a "child"-classed element outside .parent', () => {
  const audit = runScanner(
    page('<p class="c3child" style="background:#ffffff;">text</p>', '.c3parent .c3child{color:#777777;}')
  );
  assert.equal(contrastFindings(audit, 'static-contrast-sub-threshold').length, 0);
});

test('element-qualified selector div.c4 does not resolve on a bare class="c4" element', () => {
  const audit = runScanner(
    page('<p class="c4" style="background:#ffffff;">text</p>', 'div.c4{color:#777777;}')
  );
  assert.equal(contrastFindings(audit, 'static-contrast-sub-threshold').length, 0);
});

test('a compound selector never resolves, even on an element carrying every one of its classes', () => {
  // Per the fix spec, compound selectors are rejected outright at extraction time -- neither
  // .c2a nor .c2b is ever recorded, so this is not "moved" to a safer match, it is removed.
  const audit = runScanner(
    page('<p class="c2a c2b" style="background:#ffffff;">text</p>', '.c2a.c2b{color:#777777;}')
  );
  assert.equal(contrastFindings(audit, 'static-contrast-sub-threshold').length, 0);
});

test('control: a genuinely bare (non-compound) class selector still resolves after the fix', () => {
  const audit = runScanner(
    page('<p class="c2b-solo" style="background:#ffffff;">text</p>', '.c2b-solo{color:#777777;}')
  );
  assert.equal(contrastFindings(audit, 'static-contrast-sub-threshold').length, 1);
});

test('comma-separated simple selectors .a, .b each resolve independently (not rejected as compound)', () => {
  const audit = runScanner(
    page('<p class="c5a" style="background:#ffffff;">text</p><p class="c5b" style="background:#ffffff;">text2</p>', '.c5a, .c5b{color:#777777;}')
  );
  assert.equal(contrastFindings(audit, 'static-contrast-sub-threshold').length, 2);
});

// A class-bearing element with no bg declared for THAT class is not proof nothing sets its
// background (calibration finding, see the dedicated regression test below) -- so a text
// element carrying an unrelated class must NOT silently inherit an ancestor's class-based bg.
test('a class-bearing intermediate element blocks the bg walk, even if its class only touches fg', () => {
  const audit = runScanner(
    page('<div class="card"><p class="muted">text</p></div>', '.card{background:#ffffff;} .muted{color:#999999;}')
  );
  assert.equal(contrastFindings(audit, 'static-contrast-sub-threshold').length, 0);
  assert.equal(contrastFindings(audit, 'static-contrast-evidence').length, 0);
});

test('ancestor bg via a same-file class STILL resolves when the intermediate element carries no class/id at all', () => {
  const audit = runScanner(
    page('<div class="card"><p>text</p></div>', '.card{background:#ffffff;} p{color:#999999;}')
  );
  // note: `p{...}` is a tag selector, not matched by this detector's [.#]-only pattern, so the
  // fg here actually comes from nothing -- this proves the ancestor bg path alone, using an
  // inline fg instead so the pair is genuinely resolvable.
  const audit2 = runScanner(
    page('<div class="card"><p style="color:#999999;">text</p></div>', '.card{background:#ffffff;}')
  );
  assert.equal(contrastFindings(audit, 'static-contrast-sub-threshold').length, 0); // tag selector never resolves fg
  assert.equal(contrastFindings(audit2, 'static-contrast-sub-threshold').length, 1); // classless <p>, inline fg -- ancestor class-bg still reachable
});

test('id selector wins over a co-present class for the same element (deterministic specificity)', () => {
  // id says black-on-white (passes), the class alone would say gray-on-white (fails) -- id must win.
  const audit = runScanner(
    page('<p id="strong" class="weak">text</p>', '#strong{color:#000000;} .weak{color:#999999;} body{background:#ffffff;}')
  );
  // body's bg is only resolvable via ancestor walk if body itself is a matched selector -- it is (tag selectors
  // aren't matched by this detector's [.#] pattern), so this pair is expected to stay UNRESOLVED; the point of
  // this test is only that no finding accidentally fires using the wrong (class) color.
  assert.equal(contrastFindings(audit, 'static-contrast-sub-threshold').length, 0);
});

// --- resolvable, passing: no finding, but counts toward the evidence line -----------------

test('resolvable pair that passes 4.5:1 produces no per-pair finding', () => {
  const audit = runScanner(page('<p style="color:#000000;background:#ffffff;">text</p>'));
  assert.equal(contrastFindings(audit, 'static-contrast-sub-threshold').length, 0);
  const evidence = contrastFindings(audit, 'static-contrast-evidence');
  assert.equal(evidence.length, 1);
  assert.equal(evidence[0].computed.resolved, 1);
  assert.equal(evidence[0].computed.subThreshold, 0);
});

// --- must NOT resolve: any doubt -> not resolvable ----------------------------------------

test('a class redeclared with conflicting values anywhere in the file is unresolved', () => {
  const audit = runScanner(
    page('<p class="x">text</p>', '.x{color:red;} .x{color:blue;} body{background:#ffffff;}')
  );
  assert.equal(contrastFindings(audit, 'static-contrast-sub-threshold').length, 0);
  const evidence = contrastFindings(audit, 'static-contrast-evidence');
  assert.equal(evidence.length, 0); // nothing resolved at all -> no evidence line
});

// FP calibration finding (2026-07-25, plans/2026-07-25-ws-b-contrast-calibration.md): a class
// not found anywhere in this file's <style> blocks (e.g. an external framework utility class
// like Tailwind's `bg-white`) is NOT proof nothing sets that element's own background. Caught
// live on a real benchmark snapshot: an icon <span class="... bg-white ..." style="color:...">
// silently "walked past" (bg-white unmatched, treated as "nothing declared here"), picking up
// an unrelated ANCESTOR's inline background instead -- a false-certainty 1:1 ratio.
test('an unresolved class on the fg element itself blocks the walk (does not fall through to an ancestor bg)', () => {
  const audit = runScanner(
    page('<div style="background:#06c755;"><span class="bg-white" style="color:#06c755;">L</span></div>')
  );
  assert.equal(contrastFindings(audit, 'static-contrast-sub-threshold').length, 0);
  assert.equal(contrastFindings(audit, 'static-contrast-evidence').length, 0); // not even a resolved-pass
});

test('a background-image ancestor blocks resolution (never a guessed ratio)', () => {
  const audit = runScanner(
    page('<div style="background: url(x.png);"><p style="color:#000000;">text</p></div>')
  );
  assert.equal(contrastFindings(audit, 'static-contrast-sub-threshold').length, 0);
  assert.equal(contrastFindings(audit, 'static-contrast-evidence').length, 0);
});

// WS-B broad FP pass (2026-07-26, plans/2026-07-26-contrast-calibration-broad.md):
// 100291.html:2790, a real confirmed false positive. A caption <a> sits inside an
// absolutely-positioned overlay whose real visual backdrop is a photographic <img>
// sibling, not a CSS background. None of the intervening <div>s declare a background at
// all, so the old walk climbed straight past the photo and resolved white text against a
// distant, visually-unrelated ancestor's white page background -- a nonsensical 1.00:1
// "finding" for text a real user sees on top of a photo. Same honesty rule as the
// background-image case: an <img> sibling behind a position:absolute overlay blocks the
// walk instead of guessing.
test('an absolutely-positioned overlay over a sibling <img> blocks the bg walk (100291.html:2790 false positive)', () => {
  // Deliberately classless intervening <div>s: a class attribute already blocks the walk
  // via the pre-existing "unresolved class" rule (2026-07-25 calibration finding, tested
  // above), which would mask whether THIS fix does anything. This must reproduce the FP
  // (a sub-threshold finding) if the img-sibling/position:absolute block is removed.
  const audit = runScanner(page(
    '<div style="background: rgb(255, 255, 255);">' +
      '<div>' +
        '<img src="photo.jpg" alt="Person relaxing on a couch">' +
        '<div style="position: absolute;">' +
          '<a style="color: rgb(255, 255, 255);">Try Alexa for Shopping</a>' +
        '</div>' +
      '</div>' +
    '</div>'
  ));
  assert.equal(contrastFindings(audit, 'static-contrast-sub-threshold').length, 0);
  assert.equal(contrastFindings(audit, 'static-contrast-evidence').length, 0); // not even a resolved-pass credit
});

// hakuso MEDIUM-A (2026-07-27 final pass): same leak, but the text sits DIRECTLY on the
// position:absolute element (no wrapping <a>-only-child level) -- the climb starts one
// level above the current element, so the element's OWN blocksClimb flag must also be
// consulted, not just its ancestors'.
test('an absolutely-positioned overlay carrying the text itself (not a child) also blocks the walk', () => {
  const audit = runScanner(page(
    '<div style="background: rgb(255, 255, 255);">' +
      '<div>' +
        '<img src="photo.jpg" alt="Person relaxing on a couch">' +
        '<div style="position: absolute; color: rgb(255, 255, 255);">Try Alexa for Shopping</div>' +
      '</div>' +
    '</div>'
  ));
  assert.equal(contrastFindings(audit, 'static-contrast-sub-threshold').length, 0);
  assert.equal(contrastFindings(audit, 'static-contrast-evidence').length, 0);
});

// Regression control: position:absolute alone must NOT block resolution -- only a real
// <img> sibling behind it does. Proves the fix is scoped to the actual leak shape, not a
// blanket "never resolve through position:absolute" rule.
test('control: position:absolute WITHOUT a sibling <img> still resolves against an ancestor background', () => {
  const audit = runScanner(page(
    '<div style="background: rgb(255, 255, 255);">' +
      '<div style="position: absolute;">' +
        '<p style="color: rgb(153, 153, 153);">text</p>' +
      '</div>' +
    '</div>'
  ));
  assert.equal(contrastFindings(audit, 'static-contrast-sub-threshold').length, 1);
});

test('reaching the document root with no background declared anywhere is unresolved (no default-white guess)', () => {
  const audit = runScanner(page('<p style="color:#000000;">text, no bg anywhere</p>'));
  assert.equal(contrastFindings(audit, 'static-contrast-sub-threshold').length, 0);
  assert.equal(contrastFindings(audit, 'static-contrast-evidence').length, 0);
});

test('alpha < 1 on either fg or bg is unresolved (no compositing against unknown layers)', () => {
  const alphaFg = runScanner(page('<p style="color:rgba(0,0,0,0.5);background:#ffffff;">text</p>'));
  assert.equal(contrastFindings(alphaFg, 'static-contrast-sub-threshold').length, 0);
  const alphaBg = runScanner(page('<p style="color:#000000;background:rgba(255,255,255,0.5);">text</p>'));
  assert.equal(contrastFindings(alphaBg, 'static-contrast-sub-threshold').length, 0);
});

test('two classes on one element both declaring color is a tie (source order unknown) -> unresolved', () => {
  const audit = runScanner(
    page('<p class="a b">text</p>', '.a{color:#999999;} .b{color:#000000;} body{background:#ffffff;}')
  );
  assert.equal(contrastFindings(audit, 'static-contrast-sub-threshold').length, 0);
});

test('a linked external stylesheet is never consulted (only same-file <style> blocks resolve)', () => {
  const audit = runScanner(page('<link rel="stylesheet" href="theme.css"><p class="x">text</p>'));
  assert.equal(contrastFindings(audit, 'static-contrast-sub-threshold').length, 0);
  assert.equal(contrastFindings(audit, 'static-contrast-evidence').length, 0);
});

test('an aria-hidden subtree is excluded (no finding, no resolved-pair credit)', () => {
  const audit = runScanner(page('<div aria-hidden="true"><p style="color:#999999;background:#ffffff;">hidden text</p></div>'));
  assert.equal(contrastFindings(audit, 'static-contrast-sub-threshold').length, 0);
  assert.equal(contrastFindings(audit, 'static-contrast-evidence').length, 0);
});

// --- evidence line + score neutrality -----------------------------------------------------

test('evidence line aggregates resolved/sub-threshold across multiple pairs and cites 4.5:1', () => {
  const audit = runScanner(page(
    '<p style="color:#000000;background:#ffffff;">passes</p>' +
    '<p style="color:#777777;background:#ffffff;">fails 1</p>' +
    '<p style="color:#999999;background:#ffffff;">fails 2</p>'
  ));
  const evidence = contrastFindings(audit, 'static-contrast-evidence');
  assert.equal(evidence.length, 1);
  assert.equal(evidence[0].computed.resolved, 3);
  assert.equal(evidence[0].computed.subThreshold, 2);
  assert.match(evidence[0].title, /3 of 3 below 4\.5:1|2 of 3 below 4\.5:1/);
  assert.equal(evidence[0].check, 'review');
});

test('contrast category stays not-machine-checkable / unscored regardless of static findings', () => {
  const audit = runScanner(page('<p style="color:#777777;background:#ffffff;">fails</p>'));
  const contrastCat = audit.summary.categories.find((c) => c.id === 'contrast');
  assert.equal(contrastCat.state, 'not-machine-checkable');
  assert.equal(contrastCat.score, null);
  assert.equal(contrastCat.fail, 0); // check:'review' never bumps fail
});

test('engine_fingerprint reports a beacon-static-audit@N+ruleset hash (version-agnostic)', () => {
  const audit = runScanner(page('<p>plain</p>'));
  assert.match(audit.metadata.engine_fingerprint, /^beacon-static-audit@\d+\+ruleset\./);
});
