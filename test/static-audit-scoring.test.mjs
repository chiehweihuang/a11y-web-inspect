// Beacon Phase A · static-audit scoring + verdict-ownership tests (P1).
// Exercises the script as the SOLE author of audit-results.json: category states
// (scored / not-machine-checkable / not-applicable), renormalised weighted overall,
// weight coverage, severity-penalty category formula, the severity matrix,
// --merge-findings ingestion (fail / review / pass), the life-safety gate,
// injectable date, and byte-identical reproducibility on an unchanged page.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { execFileSync, spawnSync } from 'node:child_process';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SCANNER = resolve(ROOT, 'core/scripts/static-audit.mjs');

// Mirrors CATEGORY_WEIGHTS in static-audit.mjs — the test fails loudly if the table drifts.
const WEIGHTS = { screenreader: 18, keyboard: 13, contrast: 13, forms: 13, responsive: 12, touch: 8, cognitive: 8, motion: 5, media: 5, agent: 5 };

const PAGE = `<!DOCTYPE html><html lang="en"><head><title>t</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="Readable page summary.">
<link rel="canonical" href="https://example.com/page">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"Article","headline":"x"}</script>
</head><body><main><h1>x</h1><a href="/x">Home</a></main></body></html>`;

// Everything Tier-1 can verify, verified: named buttons (keyboard pass), labelled
// inputs (forms pass), animation with reduced-motion handling (motion pass). Three of
// each so keyboard/forms clear the N=3 thin-evidence floor natively (engine @9).
const RICH_PAGE = `<!DOCTYPE html><html lang="en"><head><title>t</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="Readable page summary.">
<link rel="canonical" href="https://example.com/page">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"Article","headline":"x"}</script>
<style>.a{animation: spin 1s;} @media (prefers-reduced-motion: reduce){.a{animation: none;}}</style>
</head><body><main><h1>x</h1><a href="/x">Home</a>
<button>OK</button><button>Cancel</button><button>Close</button>
<label for="n">Name</label><input id="n" type="text">
<label for="e">Email</label><input id="e" type="text">
<label for="p">Phone</label><input id="p" type="text">
</main></body></html>`;

// static-audit.mjs's motion/responsive detectors run at most once PER FILE (not per
// occurrence), so a single fixture can never natively clear N=3 for them; these two
// categories are boosted the same way contrast/touch/cognitive/media always are: merged
// external passes. 3 per category crosses the floor (2 native + 1 native check already
// counts for keyboard/forms; these two get 2 external on top of RICH_PAGE's native 1).
function fullCoveragePasses() {
  const three = ['contrast', 'touch', 'cognitive', 'media'].flatMap((category) =>
    Array.from({ length: 3 }, (_, i) => ({ category, check: 'pass', title: `${category} verified externally #${i}` })));
  const two = ['responsive', 'motion'].flatMap((category) =>
    Array.from({ length: 2 }, (_, i) => ({ category, check: 'pass', title: `${category} verified externally #${i}` })));
  return writeFindings([...three, ...two]);
}

// Run the scanner; returns { audit, raw } where raw is the exact bytes written.
function run({ html = PAGE, args = [], env = {} } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'beacon-score-'));
  try {
    const fixture = join(dir, 'page.html');
    const out = join(dir, 'audit-results.json');
    writeFileSync(fixture, html);
    execFileSync('node', [SCANNER, '--scope', 'score-test', '--output', out, ...args, fixture], {
      stdio: ['ignore', 'pipe', 'pipe'], cwd: dir, env: { ...process.env, ...env },
    });
    const raw = readFileSync(out, 'utf8');
    return { audit: JSON.parse(raw.replace(/\r\n?/g, '\n')), raw };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function writeFindings(findings) {
  const dir = mkdtempSync(join(tmpdir(), 'beacon-merge-'));
  const file = join(dir, 'findings.json');
  writeFileSync(file, JSON.stringify(findings));
  return { file, cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}

function cat(audit, id) {
  return audit.summary.categories.find((c) => c.id === id);
}

// ---- category states ----------------------------------------------------------

test('category states: scored (thin or not) / not-machine-checkable / not-applicable, score null only when unscored', () => {
  const { audit } = run({ args: ['--date', '2020-01-01'] });
  // Static evidence exists for these on PAGE, at or above the N=3 thin-evidence floor:
  for (const id of ['screenreader', 'agent']) {
    assert.equal(cat(audit, id).state, 'scored', `${id} has >=3 checks -> scored`);
    assert.equal(typeof cat(audit, id).score, 'number');
    assert.equal(cat(audit, id).thin, false, `${id} has enough evidence to not be thin`);
  }
  // PAGE gives responsive exactly ONE pass check: real evidence, thin (< N=3) but ANY
  // auditable evidence now scores (engine @17, user ruling 2026-08-08 A+).
  assert.equal(cat(audit, 'responsive').state, 'scored', 'responsive has 1 check -- any evidence scores');
  assert.equal(cat(audit, 'responsive').score, 100, 'the single check passed');
  assert.equal(cat(audit, 'responsive').thin, true, 'below N=3 is flagged thin, not hidden');
  assert.equal(cat(audit, 'responsive').pass, 1, 'the thin check is still reported as evidence');
  // Static scanning cannot verify these at all (forced review, no pass/fail):
  for (const id of ['contrast', 'touch', 'cognitive', 'media']) {
    assert.equal(cat(audit, id).state, 'not-machine-checkable', `${id} is review-only -> not-machine-checkable`);
    assert.equal(cat(audit, id).score, null, `${id} must NOT carry a numeric score`);
  }
  // No buttons/inputs/animation on PAGE -> nothing to check:
  for (const id of ['keyboard', 'forms', 'motion']) {
    assert.equal(cat(audit, id).state, 'not-applicable', `${id} has no evidence at all -> not-applicable`);
    assert.equal(cat(audit, id).score, null, `${id} must NOT carry a numeric score`);
  }
});

// ---- thin-evidence boundary (engine @17: thin flags, no longer excludes) ----------------

test('thin-evidence boundary: 0 checks is not-applicable; 1-2 checks score with thin:true; 3+ scores without thin', () => {
  // keyboard: 0 buttons -> not-applicable (no evidence at all, unaffected by the flag).
  assert.equal(cat(run({ args: ['--date', '2020-01-01'] }).audit, 'keyboard').state, 'not-applicable');

  // 1 named button -> real evidence, thin, but scores.
  const one = run({ html: PAGE.replace('</main>', '<button>A</button></main>'), args: ['--date', '2020-01-01'] }).audit;
  assert.equal(cat(one, 'keyboard').state, 'scored', '1 check is below N=3 but any evidence scores');
  assert.equal(cat(one, 'keyboard').score, 100);
  assert.equal(cat(one, 'keyboard').thin, true, '1 check is below N=3 -> thin');

  // 2 named buttons -> still thin, still scores.
  const two = run({ html: PAGE.replace('</main>', '<button>A</button><button>B</button></main>'), args: ['--date', '2020-01-01'] }).audit;
  assert.equal(cat(two, 'keyboard').state, 'scored');
  assert.equal(cat(two, 'keyboard').score, 100);
  assert.equal(cat(two, 'keyboard').thin, true, '2 checks is below N=3 -> thin');

  // 3 named buttons -> crosses N=3, no longer thin.
  const three = run({ html: PAGE.replace('</main>', '<button>A</button><button>B</button><button>C</button></main>'), args: ['--date', '2020-01-01'] }).audit;
  assert.equal(cat(three, 'keyboard').state, 'scored', '3 checks meets N=3, the boundary is inclusive');
  assert.equal(cat(three, 'keyboard').score, 100);
  assert.equal(cat(three, 'keyboard').thin, false, '3 checks meets N=3 -> no longer thin');
});

test('thin categories enter the weighted overall and coverage (engine @17), just flagged thin -- keep their findings', () => {
  const { audit } = run({ args: ['--date', '2020-01-01'] });
  const responsive = cat(audit, 'responsive');
  assert.equal(responsive.state, 'scored');
  assert.equal(responsive.thin, true);
  // IS in the scored set that feeds the overall/coverage denominator:
  assert.ok(audit.summary.categories.some((c) => c.id === 'responsive' && c.state === 'scored'));
  // coverage_percent is screenreader(18) + agent(5) + responsive(12) = 35% of total weight --
  // responsive now counts despite being thin (engine @17); the review-only categories are
  // still excluded either way.
  assert.equal(audit.summary.coverage_percent, 35);
  assert.equal(audit.summary.scope_weight, 100);
  assert.equal(audit.summary.scored_weight, 35);
  assert.equal(audit.summary.applicable_weight + audit.summary.not_applicable_weight, 100);
  assert.deepEqual(audit.summary.category_weights, WEIGHTS);
});

test('a page whose ONLY failing category is thin now correctly lowers the overall score (engine @17 fixes the old exclusion cliff)', () => {
  // screenreader (5 checks) and agent (3 checks) are already >=N=3 and all-pass on PAGE.
  // The ONLY failure on this page is a single unnamed button (keyboard: pass=0, fail=1,
  // auditable=1 -- below N=3, but any evidence now scores).
  const html = PAGE.replace('</main>', '<button></button></main>');
  const { audit } = run({ html, args: ['--date', '2020-01-01'] });
  const kb = cat(audit, 'keyboard');
  assert.equal(kb.pass, 0);
  assert.equal(kb.fail, 1);
  assert.equal(kb.state, 'scored', 'a single fail with no counterbalancing pass still scores (engine @17)');
  assert.equal(kb.thin, true, 'still below N=3 -- flagged thin, not hidden');
  assert.equal(kb.score, 0, '0 pass / 1 confirmed-critical fail -> base 0, floored at 0');
  assert.ok(audit.findings.some((f) => f.key === 'button-name-missing'), 'the button-name finding must still be emitted');
  // Old (@16) behaviour excluded keyboard and left overall at 100; the fix this test
  // guards against is exactly that exclusion cliff, so overall must now reflect the fail.
  assert.equal(audit.summary.overall_score, 73, 'overall now includes the thin, failing keyboard category');
  assert.ok(audit.summary.overall_score < 100, 'a confirmed fail must cost points even from a thin category');
});

test('absence of evidence is not a score: no category reports 100 (or 60) without pass/fail evidence', () => {
  const { audit } = run({ args: ['--date', '2020-01-01'] });
  for (const c of audit.summary.categories) {
    if (c.pass + c.fail === 0) assert.equal(c.score, null, `${c.id} has no auditable evidence, score must be null`);
  }
});

// ---- overall: renormalised weighted average + coverage --------------------------

test('overall is the weighted average of SCORED categories only, weights renormalised', () => {
  const { audit } = run({ args: ['--date', '2020-01-01'] });
  const scored = audit.summary.categories.filter((c) => c.state === 'scored');
  const wsum = scored.reduce((s, c) => s + WEIGHTS[c.id], 0);
  const expected = Math.round(scored.reduce((s, c) => s + c.score * WEIGHTS[c.id], 0) / wsum);
  assert.equal(audit.summary.overall_score, expected, 'overall_score must renormalise over scored categories');
});

test('coverage_percent reports the scoring-weight share actually measured', () => {
  const { audit } = run({ args: ['--date', '2020-01-01'] });
  // PAGE: screenreader(18) + agent(5) + responsive(12, thin but scored, engine @17) = 35%.
  assert.equal(audit.summary.coverage_percent, 35);
});

test('coverage and score are different numbers: unmeasured categories change coverage, not overall', () => {
  const base = run({ args: ['--date', '2020-01-01'] }).audit;
  // 3 merged passes: enough to cross contrast from not-machine-checkable into scored.
  const pass = writeFindings(Array.from({ length: 3 }, (_, i) => ({ category: 'contrast', check: 'pass', title: `contrast verified externally #${i}` })));
  try {
    const merged = run({ args: ['--date', '2020-01-01', '--merge-findings', pass.file] }).audit;
    assert.ok(merged.summary.coverage_percent > base.summary.coverage_percent, 'verifying a new category raises coverage');
    assert.equal(merged.summary.overall_score, base.summary.overall_score, 'a clean pass does not change a clean overall');
  } finally { pass.cleanup(); }
});

test('the band top is reachable: fully verified page scores 100 at 100% coverage', () => {
  const passes = fullCoveragePasses();
  try {
    const { audit } = run({ html: RICH_PAGE, args: ['--date', '2020-01-01', '--merge-findings', passes.file] });
    for (const c of audit.summary.categories) assert.equal(c.state, 'scored', `${c.id} must be scored on the fully verified page`);
    assert.equal(audit.summary.coverage_percent, 100);
    assert.equal(audit.summary.overall_score, 100, 'a fully verified clean page must reach 100');
    assert.ok(audit.summary.overall_score >= audit.summary.score_bands[0].min, 'top band must be reachable');
  } finally { passes.cleanup(); }
});

// ---- gradient restoration (no more binary categories) ---------------------------

test('forms has a gradient: mostly-labelled inputs score strictly between 0 and 100', () => {
  const inputs = Array.from({ length: 5 }, (_, i) => `<label for="f${i}">L${i}</label><input id="f${i}" type="text">`).join('\n');
  const html = PAGE.replace('</main>', `${inputs}\n<input type="text" name="unlabelled">\n</main>`);
  const { audit } = run({ html, args: ['--date', '2020-01-01'] });
  const forms = cat(audit, 'forms');
  assert.equal(forms.state, 'scored');
  assert.equal(forms.pass, 5, 'labelled inputs count as passes');
  assert.equal(forms.fail, 1);
  assert.ok(forms.score > 0 && forms.score < 100, `one bad input among five good must not zero the category (got ${forms.score})`);
});

test('forms: a wrapping <label> (no id/aria on the input) also counts as a pass', () => {
  const html = PAGE.replace('</main>', '<label>Name <input type="text" name="n"></label></main>');
  const { audit } = run({ html, args: ['--date', '2020-01-01'] });
  const forms = cat(audit, 'forms');
  assert.equal(forms.pass, 1, 'wrapping label is positive evidence, same as id/aria-*');
  assert.equal(forms.fail, 0, 'the wrapped input must not also be a fail');
});

test('keyboard has a gradient: named buttons count as passes', () => {
  const html = PAGE.replace('</main>', '<button>Save</button><button>Send</button><button></button></main>');
  const { audit } = run({ html, args: ['--date', '2020-01-01'] });
  const kb = cat(audit, 'keyboard');
  assert.equal(kb.state, 'scored');
  assert.equal(kb.pass, 2, 'named buttons count as passes');
  assert.equal(kb.fail, 1);
  assert.ok(kb.score > 0 && kb.score < 100, `one nameless button among three must not zero the category (got ${kb.score})`);
});

test('pass evidence is positive: suppression heuristics and empty labels do not count as passes', () => {
  const base = cat(run({ args: ['--date', '2020-01-01'] }).audit, 'screenreader').pass;
  const html = PAGE.replace('</main>', `
<a href="/img-link"><img src="x.png"></a>
<img data-alt="not-an-alt" src="y.png">
<button aria-label=""></button>
<input data-id="tracker" type="text">
</main>`);
  const { audit } = run({ html, args: ['--date', '2020-01-01'] });
  // Neither the img-wrapping link (fail deferral) nor the data-alt image may add a pass.
  // Only the wrapped img is flagged: data-alt= also suppresses the FAIL detector (`\balt=`
  // matches inside data-alt) — a pre-existing detector blind spot, out of scope here; the
  // invariant under test is that a suppressed fail never becomes a pass.
  assert.equal(cat(audit, 'screenreader').pass, base, 'img-wrap link and data-alt img must not add passes');
  assert.equal(audit.findings.filter((f) => f.key === 'image-alt-missing').length, 1);
  // Empty aria-label button escapes the nameless detector (suppression) but is NOT a pass.
  assert.equal(cat(audit, 'keyboard').state, 'not-applicable', 'empty aria-label is not name evidence');
  // data-id is not label evidence: since the \sid= anchoring fix it no longer even
  // suppresses the fail — the unlabelled input is caught outright.
  assert.equal(cat(audit, 'forms').pass, 0, 'data-id must not count as a labelled-input pass');
  assert.ok(cat(audit, 'forms').fail >= 1, 'the data-id input is a caught input-label violation');
});

// ---- detector FP classes found by the 2026-07-05 benchmark ------------------------

test('attribute order does not matter: viewport/description/canonical found with content-first markup', () => {
  const html = `<!DOCTYPE html><html lang="en"><head><title>t</title>
<meta content="width=device-width, initial-scale=1" name="viewport">
<meta content="Readable page summary." name="description">
<link href="https://example.com/page" rel="canonical">
</head><body><main><h1>x</h1><a href="/x">Home</a></main></body></html>`;
  const { audit } = run({ html, args: ['--date', '2020-01-01'] });
  for (const key of ['viewport-meta-missing', 'meta-description-missing', 'canonical-missing']) {
    assert.equal(audit.findings.filter((f) => f.key === key).length, 0, `${key} must not fire when the tag exists with reordered attributes`);
  }
  // responsive has only 1 native check here (below N=3, thin but scored, engine @17);
  // the invariant under test is that it is never zeroed by a phantom failure.
  const responsive = cat(audit, 'responsive');
  assert.ok(!(responsive.state === 'scored' && responsive.score === 0), 'responsive must not be zeroed by a phantom viewport failure');
});

test('images excluded from the accessibility tree are not alt-text failures', () => {
  const html = PAGE.replace('</main>', `
<img aria-hidden="true" src="deco.png">
<img role="presentation" src="deco2.png">
<img style="border:none; display: none;" width="1" height="1" src="pixel.gif">
</main>`);
  const { audit } = run({ html, args: ['--date', '2020-01-01'] });
  assert.equal(audit.findings.filter((f) => f.key === 'image-alt-missing').length, 0, 'aria-hidden / role=presentation / display:none images need no alt');
});

test('repeated instances of one finding key cap the severity penalty (template-stamped defects)', () => {
  const named = Array.from({ length: 20 }, (_, i) => `<button>B${i}</button>`).join('');
  const empty = Array.from({ length: 5 }, () => '<button></button>').join('');
  const html = PAGE.replace('</main>', `${named}${empty}</main>`);
  const { audit } = run({ html, args: ['--date', '2020-01-01'] });
  const kb = cat(audit, 'keyboard');
  assert.equal(kb.pass, 20);
  assert.equal(kb.fail, 5, 'every instance still counts as a fail (base ratio unaffected)');
  // base = 20/25*100 = 80; 4.1.2 matrix critical -12 each, capped at 3 repeats -> 80-36 = 44.
  // Uncapped stacking would give 80-60 = 20.
  assert.equal(kb.score, 44, 'severity penalty must cap at 3 per finding key');
});

test('iframes without titles are detected statically; titled iframes count as passes', () => {
  const html = PAGE.replace('</main>', '<iframe src="/a.html"></iframe><iframe title="Map" src="/b.html"></iframe></main>');
  const { audit } = run({ html, args: ['--date', '2020-01-01'] });
  assert.equal(audit.findings.filter((f) => f.key === 'frame-title-missing').length, 1, 'untitled iframe must be flagged');
  assert.ok(cat(audit, 'screenreader').fail >= 1, 'untitled iframe is a screenreader fail');
});

// ---- detector FP classes found by the 2026-07-06 ground-truth study ----------------

test('subtrees hidden from the accessibility tree produce no findings and no passes', () => {
  const hiddenBlock = (style) => `
<div ${style}>
  <img src="pic.png">
  <iframe src="/w.html"></iframe>
  <button></button>
  <a href="/dead"></a>
  <ul><div>not-li</div></ul>
  <img alt="hidden but labelled" src="ok.png">
</div>`;
  const html = PAGE.replace('</main>', `${hiddenBlock('style="display:none"')}${hiddenBlock('style="visibility: hidden;"')}${hiddenBlock('aria-hidden="true"')}${hiddenBlock('hidden')}</main>`);
  const base = run({ args: ['--date', '2020-01-01'] }).audit;
  const { audit } = run({ html, args: ['--date', '2020-01-01'] });
  for (const key of ['image-alt-missing', 'frame-title-missing', 'button-name-missing', 'link-name-missing', 'list-non-li-child']) {
    assert.equal(audit.findings.filter((f) => f.key === key).length, 0, `${key} must not fire inside hidden subtrees`);
  }
  assert.equal(cat(audit, 'screenreader').pass, cat(base, 'screenreader').pass, 'hidden elements are not pass evidence either');
  assert.equal(cat(audit, 'keyboard').state, 'not-applicable', 'hidden buttons add no keyboard evidence');
});

test('a <title> tag with attributes still counts as a document title', () => {
  const html = PAGE.replace('<title>t</title>', '<title data-next-head="">Shopify Polaris React</title>');
  const { audit } = run({ html, args: ['--date', '2020-01-01'] });
  assert.equal(audit.findings.filter((f) => f.key === 'document-title-missing').length, 0);
});

test('markup inside <script> bodies is not scanned for img/iframe findings', () => {
  const html = PAGE.replace('</main>', `<script>const t = '<img src="' + p + '" />'; const u = '<iframe src="x">';</script></main>`);
  const { audit } = run({ html, args: ['--date', '2020-01-01'] });
  assert.equal(audit.findings.filter((f) => f.key === 'image-alt-missing' || f.key === 'frame-title-missing').length, 0, 'template literals in scripts are not real elements');
});

test('a button named by a descendant aria-label is named', () => {
  const html = PAGE.replace('</main>', '<button class="icon"><svg focusable="false" aria-label="Submit search"></svg></button></main>');
  const { audit } = run({ html, args: ['--date', '2020-01-01'] });
  assert.equal(audit.findings.filter((f) => f.key === 'button-name-missing').length, 0);
  assert.equal(cat(audit, 'keyboard').pass, 1, 'descendant-labelled button is a verified pass');
});

test('link accessible-name from wrapped images follows alt semantics', () => {
  const html = PAGE.replace('</main>', `
<a href="/named"><img alt="Company logo" src="l.png"></a>
<a href="/decorative-only"><img alt="" src="d.png"></a>
<a href="/no-alt"><img src="n.png"></a>
</main>`);
  const { audit } = run({ html, args: ['--date', '2020-01-01'] });
  const linkFindings = audit.findings.filter((f) => f.key === 'link-name-missing');
  assert.equal(linkFindings.length, 1, 'only the all-empty-alt link is a link-name violation');
  assert.match(linkFindings[0].code_before || linkFindings[0].location, /decorative-only|snapshots|page/, 'the flagged link is the alt="" one');
  // named-by-alt link counts as a screenreader pass; the alt-less-img link stays deferred
  // to image-alt (one img finding), neither pass nor fail for link-name.
  assert.equal(audit.findings.filter((f) => f.key === 'image-alt-missing').length, 1);
});

// ---- merge ingestion: fail / review / pass / malformed ---------------------------

test('severity matrix is applied at the script (merged finding with no severity -> matrix)', () => {
  // 1.1.1 is mandated critical by the matrix; merged finding omits severity entirely.
  const { file, cleanup } = writeFindings([
    { category: 'screenreader', wcag: '1.1.1 Text Alternatives', title: 'merged alt finding', location: 'x.html:1' },
  ]);
  try {
    const { audit } = run({ args: ['--date', '2020-01-01', '--merge-findings', file] });
    const merged = audit.findings.filter((f) => f.title === 'merged alt finding');
    assert.equal(merged.length, 1, 'merged finding must appear in the artifact');
    assert.equal(merged[0].severity, 'critical', 'matrix mandates 1.1.1 = critical');
  } finally { cleanup(); }
});

test('severity penalty lowers the category score; more criticals lower it more', () => {
  const base = cat(run({ args: ['--date', '2020-01-01'] }).audit, 'screenreader').score;

  const one = writeFindings([{ category: 'screenreader', severity: 'critical', wcag: '4.1.2', title: 'f1', check: 'fail' }]);
  const two = writeFindings([
    { category: 'screenreader', severity: 'critical', wcag: '4.1.2', title: 'f1', check: 'fail' },
    { category: 'screenreader', severity: 'critical', wcag: '4.1.2', title: 'f2', check: 'fail' },
  ]);
  try {
    const s1 = cat(run({ args: ['--date', '2020-01-01', '--merge-findings', one.file] }).audit, 'screenreader').score;
    const s2 = cat(run({ args: ['--date', '2020-01-01', '--merge-findings', two.file] }).audit, 'screenreader').score;
    assert.ok(s1 < base, `one critical should lower screenreader score (${s1} < ${base})`);
    assert.ok(s2 < s1, `two criticals should lower it further (${s2} < ${s1})`);
  } finally { one.cleanup(); two.cleanup(); }
});

test('unverifiable (review) merged finding does NOT reduce the score', () => {
  const base = cat(run({ args: ['--date', '2020-01-01'] }).audit, 'screenreader').score;
  const rev = writeFindings([{ category: 'screenreader', severity: 'critical', wcag: '4.1.2', title: 'maybe', check: 'review' }]);
  try {
    const s = cat(run({ args: ['--date', '2020-01-01', '--merge-findings', rev.file] }).audit, 'screenreader').score;
    assert.equal(s, base, 'review-level finding must not penalise the score (three-state rule)');
  } finally { rev.cleanup(); }
});

test('review evidence is not presented as remediation work', () => {
  const review = writeFindings([{ category: 'touch', check: 'review', title: 'Target geometry verified' }]);
  try {
    const { audit } = run({ args: ['--date', '2020-01-01', '--merge-findings', review.file] });
    assert.ok(audit.findings.some(f => f.title === 'Target geometry verified'));
    assert.ok(!audit.remediation.some(r => r.title === 'Target geometry verified'));
  } finally { review.cleanup(); }
});

test('merged check:pass counts as a pass and does NOT create a finding', () => {
  // 3 merged passes: enough to cross the N=3 thin-evidence floor into scored.
  const { file, cleanup } = writeFindings(Array.from({ length: 3 }, (_, i) => ({ category: 'contrast', check: 'pass', title: `contrast verified externally #${i}` })));
  try {
    const { audit } = run({ args: ['--date', '2020-01-01', '--merge-findings', file] });
    const contrast = cat(audit, 'contrast');
    assert.equal(contrast.state, 'scored', 'an external pass makes the category scored');
    assert.equal(contrast.pass, 3);
    assert.equal(contrast.score, 100);
    assert.equal(audit.findings.filter((f) => f.title.startsWith('contrast verified externally')).length, 0, 'passes are evidence, not findings');
  } finally { cleanup(); }
});

test('a single merged pass is real evidence and scores, but stays thin below N=3', () => {
  const { file, cleanup } = writeFindings([{ category: 'contrast', check: 'pass', title: 'contrast verified externally' }]);
  try {
    const { audit } = run({ args: ['--date', '2020-01-01', '--merge-findings', file] });
    const contrast = cat(audit, 'contrast');
    assert.equal(contrast.state, 'scored', '1 merged pass is below N=3 but any evidence scores (engine @17)');
    assert.equal(contrast.thin, true, '1 check is below N=3 -> thin');
    assert.equal(contrast.pass, 1, 'the check itself is still recorded');
    assert.equal(contrast.score, 100);
  } finally { cleanup(); }
});

test('clean tier-2 contrast samples become positive pass evidence', () => {
  const dir = mkdtempSync(join(tmpdir(), 'beacon-tier2-clean-'));
  const file = join(dir, 'tier2.json');
  writeFileSync(file, JSON.stringify({
    metadata: { engine_fingerprint: 'beacon-tier2-audit@2' },
    summary: {
      by_viewport: [
        { viewport: '320x720', contrast_samples: 2, touch_targets: 0, findings: 0 },
        { viewport: '1280x900', contrast_samples: 2, touch_targets: 0, findings: 0 },
      ],
    },
    findings: [],
  }));
  try {
    const { audit } = run({ args: ['--date', '2020-01-01', '--merge-findings', file] });
    const contrast = cat(audit, 'contrast');
    assert.equal(contrast.pass, 4, 'every clean browser-measured sample is positive evidence');
    assert.equal(contrast.fail, 0);
    assert.equal(contrast.state, 'scored');
    assert.equal(contrast.score, 100);
    assert.equal(audit.findings.filter((f) => f.key === 'contrast-not-verified').length, 0,
      'a clean Tier-2 run must satisfy the browser-verification gate');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

// hakuso CRITICAL (2026-08-29): `contrast_samples` is the raw capture count and includes
// samples tier2-audit.mjs's analyzer skips as "nothing to measure" (invisible/transparent
// ink) -- using it inflated the implicit "clean pass" count with non-decided samples.
// `contrast_samples_decided`, when present, must be used instead.
test('contrast_samples_decided, when present, overrides the raw capture count for implicit-pass credit', () => {
  const dir = mkdtempSync(join(tmpdir(), 'beacon-tier2-decided-'));
  const file = join(dir, 'tier2.json');
  writeFileSync(file, JSON.stringify({
    metadata: { engine_fingerprint: 'beacon-tier2-audit@2' },
    summary: {
      by_viewport: [
        { viewport: '320x720', contrast_samples: 5, contrast_samples_decided: 2, touch_targets: 0, findings: 0 },
      ],
    },
    findings: [],
  }));
  try {
    const { audit } = run({ args: ['--date', '2020-01-01', '--merge-findings', file] });
    assert.equal(cat(audit, 'contrast').pass, 2, 'must credit the decided count (2), not the raw capture count (5)');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

// hakuso round-2 micro-fix-1 (2026-08-29): a tier2 artifact without contrast_samples_decided
// silently falls back to the raw capture count -- that must be observable, naming which
// artifact triggered it, not just a silent behavior difference.
test('legacy fallback (no contrast_samples_decided) logs the artifact path and row count', () => {
  const dir = mkdtempSync(join(tmpdir(), 'beacon-tier2-legacy-'));
  const file = join(dir, 'tier2-legacy.json');
  writeFileSync(file, JSON.stringify({
    metadata: { engine_fingerprint: 'beacon-tier2-audit@2' },
    summary: { by_viewport: [{ viewport: '320x720', contrast_samples: 2, touch_targets: 0, findings: 0 }] },
    findings: [],
  }));
  const fixture = join(dir, 'page.html');
  const out = join(dir, 'audit-results.json');
  writeFileSync(fixture, PAGE);
  try {
    const result = spawnSync('node', [SCANNER, '--scope', 'legacy-test', '--date', '2020-01-01', '--merge-findings', file, '--output', out, fixture], { encoding: 'utf8' });
    assert.equal(result.status, 0);
    assert.match(result.stderr, /has no contrast_samples_decided for 1 viewport row\(s\) — falling back to raw contrast_samples/);
    assert.ok(result.stderr.includes(file), 'the log must name the artifact path');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

// hakuso medium-a (2026-08-29): the merged touch finding's "(N viewport)" count/location
// must reflect rows with a VALID measurement, not the raw row count -- a row with a
// missing/invalid height still occupied a slot in the raw array.
test('touch dedup: a row with an invalid measurement does not inflate the merged viewport count', () => {
  const { file, cleanup } = writeFindings([
    { category: 'touch', key: 'tier2-touch-target-advisory', check: 'review', severity: 'tip',
      title: 'Touch target 30x30px meets the 24px floor but is below the 44px best practice',
      selector: '#x', viewport: '320x720', computed: { width: 30, height: 30 } },
    { category: 'touch', key: 'tier2-touch-target-advisory', check: 'review', severity: 'tip',
      title: 'Touch target 32x32px meets the 24px floor but is below the 44px best practice',
      selector: '#x', viewport: '1280x900', computed: { width: 32 } }, // height missing -- invalid row
  ]);
  try {
    const { audit } = run({ args: ['--date', '2020-01-01', '--merge-findings', file] });
    const f = audit.findings.find((x) => x.key === 'tier2-touch-target-advisory');
    assert.ok(f, 'the merged finding must exist');
    assert.match(f.title, /\(1 viewport\)/, 'title count must reflect the ONE row with a valid measurement');
    assert.match(f.location, /\(1 viewport: 320x720\)/, 'location must list only the valid viewport');
    assert.equal(f.computed.byViewport.length, 1, 'sanitizeComputed must drop the invalid row');
  } finally { cleanup(); }
});

// hakuso medium-a (2026-08-29): a touch finding with no `viewport` string can't be
// viewport-labeled once merged -- it must be left OUT of grouping entirely and render
// through the original single-instance computed shape, not silently lose its measurement.
test('touch dedup: a finding with no viewport string is not merged, keeps plain computed as before', () => {
  const { file, cleanup } = writeFindings([
    { category: 'touch', key: 'tier2-touch-target-advisory', check: 'review', severity: 'tip',
      title: 'Touch target 30x30px meets the 24px floor but is below the 44px best practice',
      selector: '#x', computed: { width: 30, height: 30 } }, // no viewport field at all
  ]);
  try {
    const { audit } = run({ args: ['--date', '2020-01-01', '--merge-findings', file] });
    const f = audit.findings.find((x) => x.key === 'tier2-touch-target-advisory');
    assert.ok(f, 'the finding must still exist, unmerged');
    assert.equal(typeof f.computed.width, 'number', 'computed.width stays a plain number, not wrapped in byViewport');
    assert.equal(f.computed.width, 30);
    assert.equal(f.computed.byViewport, undefined);
  } finally { cleanup(); }
});

test('merged finding with an unknown check value is skipped, never silently coerced to fail', () => {
  const { file, cleanup } = writeFindings([{ category: 'forms', check: 'bogus', title: 'malformed entry' }]);
  try {
    const { audit } = run({ args: ['--date', '2020-01-01', '--merge-findings', file] });
    assert.equal(audit.findings.filter((f) => f.title === 'malformed entry').length, 0, 'malformed check is dropped');
    assert.equal(cat(audit, 'forms').state, 'not-applicable', 'a dropped entry must not create evidence');
  } finally { cleanup(); }
});

test('--merge-findings validates input: invalid category is skipped, not crashed', () => {
  const { file, cleanup } = writeFindings([
    { category: 'not-a-real-category', wcag: '1.1.1', title: 'bogus' },
    { category: 'forms', severity: 'warning', wcag: '3.3.2', title: 'real one', check: 'fail' },
  ]);
  try {
    const { audit } = run({ args: ['--date', '2020-01-01', '--merge-findings', file] });
    assert.equal(audit.findings.filter((f) => f.title === 'bogus').length, 0, 'invalid-category finding is dropped');
    assert.equal(audit.findings.filter((f) => f.title === 'real one').length, 1, 'valid finding still merges');
  } finally { cleanup(); }
});

// ---- life-safety gate ------------------------------------------------------------

test('a confirmed life-safety violation (2.3.1) caps the overall score into the fail band', () => {
  const { file, cleanup } = writeFindings([
    { category: 'motion', severity: 'critical', wcag: 'WCAG 2.2: 2.3.1 Three Flashes or Below Threshold', title: 'flashing content', check: 'fail' },
  ]);
  try {
    const { audit } = run({ args: ['--date', '2020-01-01', '--merge-findings', file] });
    assert.equal(audit.summary.life_safety_flag, true);
    assert.ok(audit.summary.overall_score <= 49, `seizure risk must force the fail band, weights must not dilute it (got ${audit.summary.overall_score})`);
    // The gate is set on the CONFIRMED FINDING, independent of scoreCategory: motion has
    // only 1 auditable check here (below N=3, thin but scored, engine @17) -- the gate
    // holds regardless of whether the category happens to be thin.
    const motion = cat(audit, 'motion');
    assert.equal(motion.state, 'scored');
    assert.equal(motion.thin, true, 'the gate does not depend on motion being non-thin');
  } finally { cleanup(); }
});

test('an unverified (review) 2.3.1 finding does NOT trip the life-safety gate', () => {
  const { file, cleanup } = writeFindings([
    { category: 'motion', severity: 'critical', wcag: '2.3.1', title: 'maybe flashing', check: 'review' },
  ]);
  try {
    const { audit } = run({ args: ['--date', '2020-01-01', '--merge-findings', file] });
    assert.equal(audit.summary.life_safety_flag, false);
  } finally { cleanup(); }
});

// ---- bands + confidence -----------------------------------------------------------

test('score bands are exported with the artifact (single source for report + docs)', () => {
  const { audit } = run({ args: ['--date', '2020-01-01'] });
  assert.deepEqual(audit.summary.score_bands, [
    { min: 90, id: 'pass' },
    { min: 50, id: 'needs-work' },
    { min: 0, id: 'fail' },
  ]);
});

test('confidence_level is derived from coverage, not hardcoded', () => {
  const low = run({ args: ['--date', '2020-01-01'] }).audit;
  assert.equal(low.metadata.confidence_level, 'low', '23% weight coverage -> low');

  const passes = fullCoveragePasses();
  try {
    const full = run({ html: RICH_PAGE, args: ['--date', '2020-01-01', '--merge-findings', passes.file] }).audit;
    assert.equal(full.metadata.confidence_level, 'medium', 'full coverage in a static pipeline caps at medium');
  } finally { passes.cleanup(); }
});

// ---- provenance + reproducibility (unchanged contracts) ----------------------------

test('date is injectable: --date wins, SOURCE_DATE_EPOCH is honoured', () => {
  assert.equal(run({ args: ['--date', '2019-07-04'] }).audit.metadata.date, '2019-07-04');
  // 1577836800 = 2020-01-01T00:00:00Z
  assert.equal(run({ env: { SOURCE_DATE_EPOCH: '1577836800' } }).audit.metadata.date, '2020-01-01');
});

test('reproducible: two runs of the same page with a fixed date are byte-identical', () => {
  const a = run({ args: ['--date', '2020-01-01'] }).raw;
  const b = run({ args: ['--date', '2020-01-01'] }).raw;
  assert.equal(a, b, 'same page + fixed date must produce byte-identical audit-results.json');
});

test('P3: engine_fingerprint is stamped, well-formed, and deterministic', () => {
  const a = run({ args: ['--date', '2020-01-01'] }).audit.metadata.engine_fingerprint;
  const b = run({ args: ['--date', '2020-01-01'] }).audit.metadata.engine_fingerprint;
  assert.match(a, /^beacon-static-audit@\d+\+ruleset\.[0-9a-f]{12}$/, 'fingerprint = detector-version + ruleset hash');
  assert.equal(a, b, 'fingerprint must be deterministic across runs (it gates the reproducibility contract)');
});

test('P8: --llm-judgment is quarantined verbatim and never touches the score', () => {
  const baseOverall = run({ args: ['--date', '2020-01-01'] }).audit.summary.overall_score;
  const { file, cleanup } = (() => {
    const dir = mkdtempSync(join(tmpdir(), 'beacon-llm-'));
    const f = join(dir, 'j.json');
    writeFileSync(f, JSON.stringify([
      { observation: 'alt="logo" is technically present but says nothing useful', criterion: '1.1.1', category: 'screenreader' },
      { note: 'no observation -> must be dropped' },
    ]));
    return { file: f, cleanup: () => rmSync(dir, { recursive: true, force: true }) };
  })();
  try {
    const { audit } = run({ args: ['--date', '2020-01-01', '--llm-judgment', file] });
    assert.ok(audit.llm_judgment, 'llm_judgment block must be present');
    assert.equal(audit.llm_judgment.reproducible, false, 'must be labelled not reproducible');
    assert.equal(audit.llm_judgment.scored, false, 'must be labelled not scored');
    assert.equal(audit.llm_judgment.items.length, 1, 'invalid (no-observation) item is dropped');
    assert.equal(audit.summary.overall_score, baseOverall, 'llm_judgment must NOT change the machine score');
  } finally { cleanup(); }
});

test('reader evidence is attached after scoring and cannot change machine findings or score', () => {
  const dir = mkdtempSync(join(tmpdir(), 'beacon-reader-evidence-'));
  const file = join(dir, 'reader-results.json');
  writeFileSync(file, JSON.stringify({
    metadata: { date: '2020-01-01', url: 'https://example.com/page' },
    intent: {
      purpose: { zh: '展示內容', en: 'Present content' },
      source: 'owner',
      confidence: 'high',
    },
    tasks: [{
      id: 'read-page',
      goal: { zh: '讀取頁面標題', en: 'Read the page heading' },
      success_criteria: [{ zh: '找到 h1', en: 'Find the h1' }],
      outcome: 'completed',
    }],
    reader_surface: {
      status: 'captured',
      channel: ['accessibility-tree', 'keyboard'],
      snapshot: { format: 'test-tree', content: 'heading "x"' },
      keyboard: { max_tabs: 8, stop_count: 1, stopped_reason: 'test', stops: [] },
    },
  }));
  try {
    const base = run({ args: ['--date', '2020-01-01'] }).audit;
    const withReader = run({ args: ['--date', '2020-01-01', '--reader-evidence', file] }).audit;
    assert.deepEqual(withReader.summary, base.summary);
    assert.deepEqual(withReader.findings, base.findings);
    assert.equal(withReader.reader_evidence.metadata.scored, false);
    assert.equal(withReader.reader_evidence.tasks[0].outcome, 'completed');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
