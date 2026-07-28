# VALIDATION.md — the Beacon scoring validation charter

**Audience**: any maintainer, human or LLM (written to be executable by GPT-5.5 /
DeepSeek 4 Pro / Claude Opus 4.8 / Sonnet 5-class models with no prior session
context). Everything here is runnable from a repo checkout; nothing depends on
anyone's memory. When you change scoring or detectors, this file tells you what to run
and what "still valid" means.

**Why it exists**: until 2026-07-05 every test in this repo was *verification* (does
the code do what the code says) — all green while the score itself was broken (an
unreachable 90+ band, "Coverage" column rendering the score, constant placeholder
scores). The missing discipline was *validation* (does the number mean anything about
pages nobody hand-picked). This charter makes both kinds permanent.

---

## Layer map

| Layer | Protects | Executable artifact | Run | Pass criterion |
|---|---|---|---|---|
| L0 Reliability | same input → same output, any machine, any day | `test/golden-vectors.test.mjs` + `test/golden/`; byte-identical test in `test/static-audit-scoring.test.mjs`; CI matrix `.github/workflows/validation.yml` (3 OS × 2 Node); `tools/drift-compare.mjs` | `node --test` locally; matrix in CI | zero diffs; drift only from layer-2 capture, never from the engine |
| L1 Detector validity | each detector's P/R is measured, not assumed | regression corpora in `test/*.test.mjs`; `tools/measure-detectors.mjs` (report-only characterization); `tools/measure-semantic.mjs` (hard gate) | see `.github/workflows/ci.yml` | semantic gate: precision 1.0, recall ≥ 0.4; new detectors ship with a wild-sample FP measurement (see protocol below) |
| L2 Score semantics | the formula's promises | `test/scoring-properties.test.mjs` (monotonicity, injection dose-response, cross-stack fairness); state/renormalisation/gate/cap/ceiling tests in `test/static-audit-scoring.test.mjs` | `node --test` | all properties hold |
| L3 External validity | the number tracks the world | `benchmark/2026-07-05/` (87-site paired benchmark + harness); `benchmark/2026-07-06-ground-truth/` (20-site P/R inventory + harness) | see those READMEs | Spearman not regressing; GT re-verify on detector changes: FP classes eliminated stay eliminated, TPs retained |
| L4 Fairness | same defect → same penalty, however the site is built | cross-stack test in `test/scoring-properties.test.mjs`; life-safety gate test; four-state (never score absence) tests | `node --test` | identical finding sets + scores across dialects; gate uncircumventable |
| L5 Interpretation | the report cannot overclaim | coverage shown beside every score; `summary.score_bands` as single source; context banner | code review on report changes | see "forbidden claims" |

---

## L0 — reliability details

**Golden vectors.** `test/golden/clean.html` (must score 100 — pins the reachable top)
and `test/golden/dirty.html` (must land in the fail band with criticals). Expected
JSONs are committed. After an INTENTIONAL scoring change:

```
node tools/regen-golden.mjs
git diff test/golden/     # every changed line must be explained by your change
```

**Cross-machine determinism.** The engine sorts its file list and normalises path
separators, so identical input bytes yield identical artifacts on Windows/Linux/macOS —
the CI matrix enforces it. If the matrix ever splits by OS, that is a P0 engine bug.

**Capture drift (the irreducible part).** Rendered-DOM capture varies by geo-IP, CDN
variant, consent walls, A/B bucketing, lazy-load timing. Policy:

1. Pin what is pinnable — the capture recipe: chromium build (playwright-pinned),
   viewport 1280×900, locale en-US, `domcontentloaded` + networkidle grace + 2s settle
   (see `benchmark/2026-07-05/harness/capture-audit.mjs`).
2. Measure the rest: recapture the benchmark subset on another day and/or another
   machine, then `node tools/drift-compare.mjs baseline.json candidate.json`.
3. Publish the error bar: the p95 |score delta| is the score's stated uncertainty.
   Scores within the error bar of a band boundary (90, 50) are "at the boundary", not
   in either band. A 0–100 score without an error bar is false precision.

Measured 2026-07-07 — temporal baseline, 2-day window (2026-07-05 → 2026-07-07), same
machine, 13-site subset stratified across all 7 bands (scores 40–100, 3 CJK sites),
capture recipe pinned as above (`drift-capture.mjs` in the local benchmark workspace):
median |Δscore| 0, **p95 |Δscore| 1, max 1** (rakuten −1), 0 band flips, 0 coverage
shifts, 13/13 captures ok. Stated uncertainty for same-machine scores days apart:
±1 point; scores within 1 point of a band boundary (90, 50) are "at the boundary".

Open: a longer-window (7-day+) recapture and the two-machine same-hour experiment
(yatagarasu-aw) have not been run yet; cross-machine scores still carry no published
error bar.

## L1 — new-detector shipping protocol

A detector may not feed the score until it has BOTH:
1. A regression corpus (positive + near-miss negative cases) in `test/`.
2. A wild-sample FP measurement: run it over an *unselected* real-page sample (e.g.
   the committed benchmark snapshots), adjudicate every flag (see L3 judgement rules),
   record precision. "0 FP on the corpus I wrote for it" is not evidence — that
   mistake was made repeatedly before 2026-07.

When an FP is found, name its CLASS (hidden-state, attribute-order, masked-context,
name-computation…) and ask across the whole engine: **which other detectors share this
cause?** Fix the class, not the instance.

## L2 — properties the formula must keep

- Top and bottom reachable (goldens pin both).
- Monotonicity: adding a confirmed violation never raises any score; fixing one never
  lowers any; adding compliant elements never costs points.
- Injection dose-response: known violations injected into the clean fixture degrade
  the score monotonically with dose (ground truth is the injection itself).
- Coverage and score move independently; absence (or thinness) of evidence is a state
  (`not-machine-checkable` / `not-applicable` / `insufficient-evidence`, score null),
  never a number.
- Life-safety gate (confirmed 2.3.1 critical → overall ≤ 49) beats all weights.
- Severity repeat-cap (3 per finding key) is a CALIBRATION DECISION, revisit with
  data; the pass/fail base ratio always counts every instance.
- Thin-evidence floor (engine @9): a category with `pass + fail < 3` reports
  `insufficient-evidence` (score null) instead of a number, and exits the weighted-average
  denominator the same way `not-machine-checkable`/`not-applicable` already do. N=3 is a
  CALIBRATION DECISION (same status as the severity repeat-cap above), not a physical
  constant — revisit with data. Findings are unaffected; only the category-level score is
  suppressed. Measured effect (2026-07-22 benchmark rerun, n=71 paired):
  Spearman 0.477 → 0.468 (small decrease — rank correlation, uneven across the cohort);
  score-delta distribution across 85 comparable sites: median |Δ| 7, p95 19, max 23, 18
  band flips (both directions — a thin category exiting the denominator can raise OR
  lower the overall depending on whether it was scoring below or above the remaining
  average). Motivating case: rakuten.co.jp 40 → 54 (`responsive`/`motion` each had a
  single fail with no counterbalancing pass).

### L2 — Tier-2 (browser-measured) thresholds, engine `beacon-tier2-audit@2`

Native Playwright measurement (contrast + touch targets), added 2026-07-25 (v3.3
Workstream A). Findings render as evidence + findings by default because merge is an
explicit, agent-initiated step (`--merge-findings`, `core/content/inspect.md` Step 6) —
NOT because the scoring mechanism is undecided. `mergeExternalFindings()`
(`core/scripts/static-audit.mjs` ~1440-1486) has been the sole channel for Tier-2/manual
findings to enter the scored artifact since commit `a1d8cab` (2026-06-21), and
`tier2-audit.mjs` findings use that exact same channel as axe or any manual finding. Once
a category's merged evidence (pass + fail) reaches `THIN_EVIDENCE_MIN` (3), the category
leaves `not-machine-checkable`/`insufficient-evidence` and becomes `scored`. Measured on
the committed fixture `test/golden/clean.html` (pinned by `test/golden/clean.expected.json`,
reproducible with `node scripts/static-audit.mjs --scope golden-clean --date 2026-07-26
[--merge-findings <N tier2-contrast-fail findings>.json] test/golden/clean.html`): baseline
contrast (0 pass/0 fail) → `not-machine-checkable`, overall 100, coverage 23%; +1 merged
fail → `insufficient-evidence` (still overall 100, coverage 23%); +3 → contrast `scored` at
0, overall 100 → 64, coverage 23% → 36%. `confidence_level` stays `low` throughout (the
band boundary is 60% coverage) — it moves only when a coverage change crosses that
boundary. What is genuinely undecided (USER DECISIONS, see
`plans/2026-07-25-v3.3-browser-measurements.md` Workstream A step 4): (a) whether the
default inspect flow should run tier-2 + auto-merge, so scores move by default rather than
only on an explicit agent action; (b) whether `THIN_EVIDENCE_MIN=3` is the right threshold
for a tier-2 source that can produce hundreds of checks per page, where one merge call
instantly clears it; (c) how the report distinguishes a static-only score from a
tier-2-inclusive one so the two numbers are never confusable. Every threshold below is a
CALIBRATION DECISION, not a physical constant — revisit with data the same way the
static-tier N=3 floor and severity repeat-cap are tracked above.

- **Dependency policy (ruling 2026-07-25)**: this repo stays zero-dependency (no
  `package.json`). Playwright is detected at runtime, never installed as a dependency —
  `loadPlaywright()` tries, in order, `PLAYWRIGHT_MODULE_PATH` (explicit override,
  authoritative — a bad value throws immediately rather than silently falling through),
  `require.resolve('playwright')` from the caller's cwd (covers a user's own project that
  already depends on it), then known global npm install locations, then throws a clear
  install-command error. Browser-backed tests skip LOUDLY (node:test skip reason
  `tier2: playwright unavailable on this machine`) when none resolve — see
  `.github/workflows/ci.yml`'s `tier2-browser` job, the only CI job that installs
  Playwright ad hoc (into a scratch dir, not the repo) so these tests actually run
  somewhere; every other CI job is expected to show the loud skip.
- **Contrast ratio minimums**: 4.5:1 normal text, 3:1 large text (WCAG 2.2 SC 1.4.3
  verbatim). Not a choice made here — the SC itself fixes these two numbers.
- **Large-text definition**: `fontSizePx >= 24` (18pt) OR (`fontSizePx >= 18.6667` (14pt)
  AND bold, where bold = computed `font-weight === 'bold'` or numeric weight ≥ 700). The
  18.6667px conversion (14pt × 4/3) and the ≥700 bold cutoff are calibration choices, not
  restated from the SC text; a font family with a lighter visual "bold" at 600 would be
  missed by the ≥700 cutoff.
- **Background resolution**: ancestor-walk + alpha compositing (element's own
  background-color first, walking outward, stopping at the first fully-opaque layer or
  the document root); a `background-image` (raster OR gradient) anywhere in that walk
  before reaching opacity makes the WHOLE sample `unresolvable` (a `review` finding, never
  a guessed ratio) — this is honest-by-construction, not a tuned threshold, but the
  boundary (any image/gradient blocks resolution, however small or however composited
  underneath) is worth revisiting if it proves too conservative on real pages (measured
  2026-07-25 on the rakuten.co.jp benchmark snapshot, engine @1: 1584/1917 samples
  unresolvable across both viewports — an image-heavy e-commerce page is close to a
  worst case for this detector, not necessarily representative). **Engine @2 (2026-07-26
  calibration) broadened `unresolvable` to three more signals found on real, CSS-intact
  renders, not corpus artifacts**: a background painted by a `::before`/`::after`
  pseudo-element or an inset `box-shadow` (`hasPseudoBg`/`hasInsetBoxShadow`, confirmed on
  Wix "Get Started"/"Thriving with Wix"); a non-ancestor sibling/cousin element stacked
  behind via `position` + `z-index`, found with a geometric rect-overlap scan rather than
  `document.elementsFromPoint` because that API silently excludes
  `pointer-events: none` elements from hit-testing — exactly how the confirmed Wix
  `bgLayers` div and Atlassian `aria-hidden` tab-indicator div are built
  (`hasNonAncestorOverlay`); and a page that opts into `color-scheme: dark` with no opaque
  ancestor background anywhere (`defaultsToCanvas` + `pageDefaultsToDarkCanvas`, confirmed
  on linear.app, whose html/body both report a fully transparent `backgroundColor` yet the
  page renders on a solid near-black canvas — the old compositor hardcoded a white default,
  exactly backwards for that page). All three: block and report unresolvable, never guess,
  the same honesty boundary as the original image/gradient case. Cost: the overlap scan is
  O(elements-needing-the-check × total-elements-on-page); the full two-viewport audit on
  the largest of the three confirming snapshots (wix.com, 2.2MB) still completed in ~4s.
- **Disabled/`aria-disabled` contrast exemption** (engine @2, 2026-07-26 calibration):
  `browserCollectContrastSamples` excludes any element inside
  `[disabled], [aria-disabled="true"]` (via `el.closest(...)`, mirroring the existing
  `[aria-hidden]`/`[hidden]` exclusion) from contrast sampling entirely, per WCAG 1.4.3's
  own exemption for "incidental text ... that is part of an inactive user interface
  component." Confirmed on two real false positives: a Mailchimp survey-modal button
  (`disabled=""` confirmed via direct DOM check) and an en.wikipedia.org donation-banner
  "Continue" button (screenshot showed a clearly grayed-out disabled state). Mirrors the
  `el.disabled` check `browserCollectTouchTargets` already had for touch targets.
- **Settle window** `SETTLE_QUIET_MS = 500` (engine @2, 2026-07-26 calibration,
  `core/scripts/tier2-audit.mjs`): after `domcontentloaded`, the harness waits for the
  `load` event (best-effort, 5s cap, swallowed — aborted subresources may prevent it from
  firing on some sites) and then this fixed quiet window, before any capture. Measured on
  a wayfair.com PerimeterX snapshot: 1 finding (unstable) at 0ms vs 5 findings (stable)
  from 300ms on — 500ms gives a ~200ms safety margin above the measured stabilization
  point, at a cost of +500ms × 2 viewports ≈ 1s per site. Distinct from L0's capture
  recipe ("domcontentloaded + networkidle grace + 2s settle") — tier-2 uses `load` instead
  of `networkidle` and a shorter 500ms window because it is calibrated against a single
  measured PerimeterX case, not L0's broader corpus; the two recipes are not meant to be
  the same number, only the same shape (wait for stability, then capture). Verified via
  `test/tier2-fixtures/settle.html` (a 150ms-deferred DOM mutation): 3 full repeated
  `runTier2Audit` runs on the same page produce byte-identical `findings` arrays.
  `# ponytail: fixed delay, not adaptive (e.g. mutation-observer-based quiescence) —
  revisit if a real site needs longer than 500ms to settle its deferred UI.`
- **Per-viewport error capture** (engine @2, 2026-07-26 calibration, resilience behavior,
  not a calibration threshold): `runTier2Audit`'s per-viewport loop wraps
  goto/settle/capture/analyze in a try/catch; on error it records `{viewport, error:
  <message>}` in `summary.by_viewport` for that viewport and continues to the next one
  instead of throwing and killing the whole process. Verified two ways: a deterministic
  unit test injecting a fake `playwrightModule` whose `page.evaluate` always throws the
  exact zoom.us error message ("Execution context was destroyed, most likely because of a
  navigation"), and the real zoom.us snapshot re-run 3 times — the navigation race
  reproduced in all 3 runs (on a different viewport each time, consistent with a genuine
  race), each time caught cleanly with the other viewport's findings intact. The "0
  crashes" figure in the pre-@2 real-page smoke run below predates this guard and should
  not be read as "this guard was never needed."
- **Touch-target floor**: 24×24 CSS px (WCAG 2.2 SC 2.5.8 verbatim), with the spacing
  exception implemented per the SC's own technique: a 24px-diameter circle centered on an
  undersized target must not intersect ANOTHER target — where "another target" is that
  neighbor's real bounding box for a full-size neighbor, or that neighbor's OWN 24px
  circle when the neighbor is itself undersized (circle-vs-circle, i.e. center distance
  < 24px). Fixed 2026-07-25 (hakuso HIGH): an earlier version tested circle-vs-rect
  against every neighbor regardless of the neighbor's own size, which under-detected the
  gap band (~12-24px center distance between two undersized targets whose small rects
  don't touch but whose circles do) — VALIDATION.md previously mischaracterized that
  earlier version as "the SC's own technique" too (hakuso LOW, corrected here). The
  inline, equivalent-target-elsewhere, and essential-presentation exceptions are NOT
  implemented (out of scope for v3.3 Workstream A) — a target flagged
  `tier2-touch-target-fail` may still be a false positive under one of those three
  unimplemented exceptions. Interactive-element selector list and the disabled/hidden
  exclusions are a calibration surface too (`core/scripts/tier2-audit.mjs`,
  `browserCollectTouchTargets`).
- **44px best-practice line**: recorded as advisory evidence (`check:'review'`,
  `severity:'tip'`) whenever a target is below 44px in either dimension, REGARDLESS of
  whether it passed the 24px floor directly or via the spacing exception — this is
  explicitly not a WCAG requirement, so it must never contribute a `fail`.
- Fixture ground truth (`test/tier2-fixtures/`, hand-computed pass/fail/review pairs,
  `test/tier2-audit.test.mjs`): `contrast.html` and `touch-targets.html` (engine @1),
  including the composited semi-transparent-background case (proves the alpha-blend math,
  not just presence/absence) and a viewport-dependent touch target (proves the harness
  produces different findings at 320 vs 1280 when the same element's CSS size changes
  under a media query); plus four @2 calibration fixtures: `contrast-overlay.html`
  (pseudo-element, inset-box-shadow, and non-ancestor-sibling backgrounds, plus a
  regression control proving an ordinary decorative box-shadow is NOT swept into
  unresolvable), `contrast-dark-canvas.html` (`color-scheme: dark` with no opaque
  ancestor), `contrast-disabled.html` (disabled/`aria-disabled` contrast exemption), and
  `settle.html` (a 150ms-deferred DOM mutation, proving 3 repeated full runs produce
  byte-identical findings).
- Real-page smoke run (2026-07-25, rakuten.co.jp benchmark snapshot #97, both viewports,
  **engine @1**): 2914 findings — 190 `tier2-contrast-fail`, 1584
  `tier2-contrast-unresolvable`, 15 `tier2-touch-target-fail`, 1125
  `tier2-touch-target-advisory`, 0 crashes. @2's broadened unresolvable classification and
  disabled-control contrast exemption (below) move these counts — this is a snapshot of
  @1's behavior, not a re-measurement. Not yet a wild FP measurement (no human
  adjudication of these flags) — that is required before any of
  these categories could feed a score (L1 new-detector protocol applies once step 4 is
  decided).

### L1/L2 — Workstream B: static contrast reference value (engine `beacon-static-audit@10`)

Static (regex/tag-walk, no browser) evidence line + per-pair `check:'review'` findings —
never a score, contrast stays `not-machine-checkable` regardless (`review` never bumps
`fail`; verified by `test/static-contrast.test.mjs`). Resolvability is deliberately narrow:
certain literal fg/bg only (inline style, or a same-file `<style>` rule matched by a
SINGLE, unambiguous class/id — id beats class per fixed specificity, multiple classes
disagreeing is a tie and unresolved, a class redeclared anywhere in the file is unresolved,
alpha != 1 anywhere is unresolved, a `background-image`/gradient ancestor blocks resolution,
and reaching the document root with no background declared anywhere is unresolved — no
default-to-white guess, unlike tier-2's real-browser default, because static analysis
cannot know whether an external stylesheet sets it). No external CSS (`<link>`) is ever
consulted. Reuses `parseColor`/`relLuminance`/`contrastRatio` from `tier2-audit.mjs`
(imported, not duplicated); only hex-color parsing is new (getComputedStyle never returns
hex, authored CSS commonly does).

**FP calibration, three rounds** (`plans/2026-07-25-ws-b-contrast-calibration.md` for
rounds 1-2, `plans/2026-07-26-contrast-calibration-broad.md` for round 3 — current numbers
at the top of those files, prior-pass numbers kept below for the audit trail):

1. Round 1: caught a genuine false-certainty before any fix shipped — a class absent from
   the file's own `<style>` blocks (e.g. an external Tailwind `bg-white` utility class) was
   treated as "nothing declared here" and the walk fell through to an unrelated ancestor's
   inline background, producing a false 1.00:1 ratio. **Fix**: an element carrying ANY
   class that doesn't resolve to a certain background via a same-file rule now BLOCKS that
   level of the walk instead of being skipped past. Effect: resolved pairs 196 → 41 (26 →
   21 sites), sub-threshold 17 → 16.
2. Round 2 (hakuso HIGH): the rule-extraction regex matched only the trailing
   `[.#][\w-]+` token before `{`, so a compound (`.a.b`), descendant (`.parent .child`), or
   element-qualified (`div.c4`) selector was mis-recorded under its bare tail token —
   resolving on any element carrying just that one class. **Fix**: capture the full
   selector prelude, split on `,`, and only record entries matching the WHOLE string
   `^[.#][\w-]+$`; anything else is never recorded (same "unresolved by omission" as an
   external class). This retroactively invalidated most of round 1's "verified" OneTrust
   findings — the round-1 manual check (grep for a substring like
   `#onetrust-pc-btn-handler {`) only confirmed the token appeared before a `{`, not that
   it WAS the whole selector; the real rule was a descendant selector
   (`#onetrust-banner-sdk #onetrust-pc-btn-handler`). Effect: resolved pairs 41 → 22
   (21 → **9** sites — below the initial ≥10-site bar, flagged explicitly, not padded to
   hit a number), sub-threshold 16 → 4. One pair was also GAINED (a comma-separated
   selector list the old regex could only match the last entry of).
3. Round 3 (broader population pass, `plans/2026-07-26-contrast-calibration-broad.md`):
   broadened the population ~9x past round 2's 9-site sample — 774 files scanned (735
   `survey-snapshots` + 26 `intake-snapshots` + 13 `run-2026-07-22-weekly` snapshots), 0
   scan failures. 78 sites with ≥1 resolvable pair, 483 resolved pairs, 45 sub-threshold,
   re-adjudicated against the literal CSS/inline-style text directly (never a substring
   grep — the exact mistake round 2's methodology-correction section warns against
   repeating). 44/45 confirmed GENUINE. **1 confirmed FALSE POSITIVE** (100291.html:2790):
   a caption `<a>` inside an absolutely-positioned overlay whose real visual backdrop is a
   photographic `<img>` sibling, not a CSS background — none of the intervening `<div>`s
   declare any background at all, so the walk climbed straight past the photo and resolved
   white text against a distant, unrelated ancestor's white page background (a nonsensical
   1.00:1 white-on-white "finding" for text a real user sees on top of a photo). **Fix**
   (folded into `beacon-static-audit@11` — this pass landed in the same uncommitted batch,
   no separate version bump): a `position:absolute`/`fixed` element whose own parent
   already has an `<img>` as a direct child now blocks the climb at that point rather than
   reaching a further ancestor, the same honesty rule as the existing background-image
   block. Miss-rate observation (not a bounded claim): 1/45 ≈ 2.2% in this population;
   round 2's much smaller population found 0 misses and only surfaced this class because
   the population grew ~22x — read as "broadening the corpus keeps surfacing real bugs at
   a low but non-zero rate," not a rate to plan around. Regression test + control:
   `test/static-contrast.test.mjs` ("an absolutely-positioned overlay over a sibling
   `<img>` blocks the bg walk" + its position:absolute-without-`<img>` control).

Both fixes are strictly conservative (can only turn a resolved pair into an unresolved
one, except the one comma-list recovery in round 2, which is a correctness gain, not a
laxer rule). Golden vectors unaffected by either fix (fingerprint-only diff both times).
Regression tests for both bug classes: `test/static-contrast.test.mjs` ("an unresolved
class on the fg element itself blocks the walk", plus the three compound/descendant/
element-qualified leak-shape tests and their controls). Score-neutrality re-confirmed
post-round-2 on a real snapshot (contrast category stays `not-machine-checkable`/`fail:0`
regardless). Small single-benchmark sample both rounds, not a bounded FP-rate claim — and
round 2's own lesson (a substring-grep "verification" missed a real bug) is recorded so a
future calibration pass reads the full selector prelude, not a token match.

### Engine `beacon-static-audit@11` — the contrast verification gate is now code-backed

Workstream C's own audit (hakuso prose-check + a codex heterogeneous review against the
CODE) found `inspect.md`'s "Contrast verification gate" was doc-promised but not
code-backed: `requires_live_audit` was hardcoded `true` unconditionally, and the mandated
"Contrast not verified, run Tier 2" tip finding was never emitted (`static-audit.mjs` only
ever bumped a silent `stats.contrast.review` count). Fixed: after any `--merge-findings`
call, `stats.contrast.pass`/`.fail` are checked — those counters are set ONLY by merged
external findings (native tier-2 or axe; nothing else in this engine ever reports contrast
pass/fail) — so `stats.contrast.pass > 0 || stats.contrast.fail > 0` is a reliable
"was contrast exercised by a browser this run" signal. If false: emit the
`contrast-not-verified` tip finding (bilingual, `check:'review'`, never scored) and set
`requires_live_audit: true`; if true, both are correctly suppressed — **verified directly**:
merging one `check:'pass'` contrast finding flips `requires_live_audit` to `false` and
skips the tip. This is a clean supersede using the EXISTING `--merge-findings` mechanism;
no new merge machinery was added. Golden vectors: both gained exactly one new finding
(the tip) plus the version bump — `overall_score` unaffected on both (check:'review' never
enters the fail/severity accounting); `clean.expected.json`'s prior "0 findings" guarantee
is now "no confirmed (`check:'fail'`) findings" (`test/golden-vectors.test.mjs`, updated
alongside). GT confirmed-finding neutrality re-verified directly on a real benchmark
snapshot (`beacon-benchmark-100` #97): diffing engine output before/after this fix shows
exactly one finding ADDED (`contrast-not-verified`), zero REMOVED, and `overall_score`/
`critical`/`warnings` byte-identical.

### Engine `beacon-static-audit@12` — document-title and html-lang presence/validity bugs (hakuso audit, `plans/2026-07-27-wcag-coverage-measurement.md`)

The coverage-measurement audit ran fixtures against the code (not just the table) and found
two of the three cited FULL-coverage rows were actually PARTIAL, both one-regex bugs:

- **2.4.2 Page Titled** (`document-title-missing`): the check
  `/<title\b[^>]*>[^<]+<\/title>/` matched a `<title>` ANYWHERE in the raw text, so a page
  with an `<svg><title>icon label</title></svg>` and no real document title was reported
  clean, and `[^<]+` (one-or-more, not one-or-more-non-whitespace) let
  `<title>   </title>` pass as present. **Fix**: `extractDocumentTitle()` strips any inline
  `<svg>...</svg>` first (an `<svg><title>` is a different, SVG-namespaced element, not the
  document title), then requires the first remaining `<title>`'s trimmed text to be
  non-empty. It intentionally does NOT scope to before `</head>`/`<body>` — a first attempt
  did, and a hakuso auditor caught it in real Chromium: `document.title` is "the first HTML
  `<title>` element in the document," and a browser's parser (and axe's `doc-has-title`)
  honor one anywhere, body or hidden ancestor included; scoping to `<head>` over-flagged real
  titled pages as missing (below).
- **3.1.1 Language of Page** (`html-lang-missing` / new `html-lang-invalid`): the presence
  test `/<html[^>]+lang=/` was satisfied by the `xml:lang=` substring (a bare `\b` boundary
  still matches right after the `:` in `xml:lang`, so word-boundary alone doesn't exclude
  it) — a page with only `xml:lang` was reported as having a declared language. There was
  also no format-validity check at all: `<html lang="english">` passed silently, because
  `assessLang`'s `declaredFamily()` falls through to `UNMODELLED` (no finding) for anything
  it doesn't recognize as a real language or a known country-code substitution. **Fix**:
  the presence/value regex now requires the whitespace that separates every real HTML
  attribute (`/<html\b[^>]*\slang\s*=\s*["']?([^\s"'>]+)/`, excludes `xml:lang=`/
  `data-lang=`), and a new `isWellFormedLangTag()` in `lang-detect.mjs` gates a well-formed
  BCP-47 shape (2-3 ALPHA primary subtag, optional `-`-separated 1-8-alphanumeric subtags —
  a SHAPE check, not an ISO 639 registry lookup) before content-mismatch assessment runs.
  A malformed tag gets the new `html-lang-invalid` finding and skips `assessLang` entirely
  (content-matching a tag that isn't a real language is moot). A shape-valid-but-wrong code
  ("jp" for "ja") is a *different*, already-handled failure mode — `assessLang`'s existing
  `COUNTRY_AS_LANG` path still catches those via `html-lang-mismatch`, unchanged; the two
  checks are complementary, not duplicated.

**Golden vectors**: fingerprint-only diff (neither fixture exercises these edge cases —
`clean.html` has a real title and a valid `lang="en"`; `dirty.html` has no title and no
lang at all, both already caught pre-fix). **GT retention**: re-ran old-vs-new engine on
all 20 `benchmark/2026-07-06-ground-truth/` site snapshots — zero finding-set diff for
`html-lang-*`/`document-title-missing` on any site, and zero diff on the broader
`benchmark/2026-07-05/` 86-site population (ADDED 0 / REMOVED 0). A head/body-scoped first
attempt at the title fix DID add one finding on that 86-site population
(`document-title-missing` on the linear.app snapshot, idx 77) — that page's only `<title>`
sits inside a `<div hidden="">` in the body, no title anywhere in `<head>`. It was
initially logged here as "a genuine catch" on the reasoning that `hidden` content is
already excluded from every other finding/pass in this engine; a hakuso auditor verified
in real Chromium that this reasoning does not apply to `document.title` (the property
reads DOM structure, not the accessibility tree — `hidden` never blocks it) and axe's own
`doc-has-title` agrees, making it a **false positive**, not a catch. Dropping the head/body
scope (keeping the svg-strip and the trim) fixed it: 0/0 diff on both populations, plus a
new regression fixture asserting a hidden-body-div title does NOT flag
(`test/static-audit-detectors.test.mjs`).

## L3 — external validity protocol

**Paired benchmark** (`benchmark/2026-07-05/`): re-run on the stored snapshots after
any detector/scoring change (`capture-audit.mjs --audit-only`, then `analyze.mjs`);
the Spearman-vs-Lighthouse trend goes in the CHANGELOG. Lighthouse is a concurrent
reference, never ground truth (top-compressed: half the sites ≥95).

**Ground-truth P/R** (`benchmark/2026-07-06-ground-truth/`): the strongest claim.
Protocol: candidates from Beacon ∪ Lighthouse raw nodes ∪ independent sweep → every
candidate judged by the rules below → adversarial second pass re-judges every entry →
≥10% of entries human-spot-checked per round (priorities in that README) → corrections
are RECORDED, never silently edited.

**Judgement rules** (the constitution for adjudication):
- Elements inside `display:none` / `visibility:hidden` (inline), `aria-hidden="true"`,
  or `[hidden]` subtrees are outside the accessibility tree: nothing there is a
  violation OR a pass.
- `alt=""` on decorative images is CORRECT. A missing alt attribute is a violation.
- Placeholder text is not a label. Text inside aria-hidden descendants or `[hidden]`
  elements does not name a control. A wrapped `<img alt="text">` DOES name its link.
- `meta-viewport` violations mean zoom-blocking (`user-scalable=no` /
  `maximum-scale<5`), not tag presence.
- Heading order is judged on the AT-visible sequence (hidden headings excluded);
  `role="heading" aria-level` participates; native headings with `role="presentation|none"` do not (implemented in engine @8).

<a id="wcag-criterion-coverage"></a>
## WCAG 2.2 A+AA criterion coverage — measured, not inherited

This is the canonical, stable home for the claim every published report and README links
to; do not move or rename this section without repointing every surface that cites
`VALIDATION.md#wcag-criterion-coverage`. The working record — denominator derivation,
escape-hatch rule, and the hakuso audit trail that corrected five row verdicts and three
axis calls — stays at `plans/2026-07-27-wcag-coverage-measurement.md`; this section is the
result, kept in sync with it.

**Denominator**: WCAG 2.2's A+AA set is **55** criteria (31 A + 24 AA), not 2.1's 50 — 2.2
added six (2.4.11, 2.5.7, 2.5.8, 3.2.6, 3.3.7, 3.3.8) and removed one (4.1.1 Parsing,
deprecated). Source: the WCAG 2.2 Recommendation and quickref, filtered to A/AA.

**Axes**: *Machine-testable in principle* — could any tool decide at least one real failure
mode without judging meaning? (escape-hatch rule: YES if any one satisfying path has a
structural proxy, even if another path is judgement-only). *Beacon coverage* — FULL if a
detector decides the criterion for every realistic automatable failure mode; PARTIAL if it
catches some but not all; NONE if no detector exists. "Fully decided" below always means
**within automation's reach** — a criterion whose only remaining failure modes are
inherently semantic (e.g. 2.4.2's title *presence* is decided; title *descriptiveness* is
not, and no automated tool decides it either).

| # | Criterion | Level | Machine-testable in principle | Beacon coverage | Detector key(s) | What's missed |
|---|---|---|---|---|---|---|
| 1.1.1 | Non-text Content | A | YES | **PARTIAL** | `image-alt-missing`; `quality-alt-generic`/`quality-alt-filename`/`quality-alt-redundant` (review) | CSS background-only meaningful images, SVG/canvas/object/embed alternatives; alt-text *meaningfulness* is review-only, never a scored fail |
| 1.2.1 | Audio-only and Video-only (Prerecorded) | A | NO | NONE | — | no detector |
| 1.2.2 | Captions (Prerecorded) | A | YES | NONE | — | no `<track kind="captions">`/caption-file check exists in either script |
| 1.2.3 | Audio Description or Media Alternative (Prerecorded) | A | YES | NONE | — | `<track kind="descriptions">` is a checkable structural artifact (escape-hatch rule); no detector implemented |
| 1.2.4 | Captions (Live) | AA | NO | NONE | — | no detector |
| 1.2.5 | Audio Description (Prerecorded) | AA | YES | NONE | — | `<track kind="descriptions">` is the identical artifact to 1.2.2's caption-track check; no detector implemented |
| 1.3.1 | Info and Relationships | A | YES | **PARTIAL** | `main-landmark-missing`; `heading-level-skipped`; `list-non-li-child`; `pdf-untagged`; `pdf-marked-false`; `pdf-encrypt-blocks-at`; `pdf-encrypt-a11y-bit-cleared` | table header/scope association, fieldset/legend grouping, aria-owns/describedby validity, reading-order mismatches, definition lists |
| 1.3.2 | Meaningful Sequence | A | YES | NONE | — | no DOM-order-vs-visual-order comparison exists in either script |
| 1.3.3 | Sensory Characteristics | A | NO | NONE | — | no detector |
| 1.3.4 | Orientation | AA | YES | NONE | — | no detector |
| 1.3.5 | Identify Input Purpose | AA | YES | NONE | — | no `autocomplete` token check exists |
| 1.4.1 | Use of Color | A | YES | NONE | — | link-vs-body-text color-only distinction is a checkable structural proxy; no detector implemented |
| 1.4.2 | Audio Control | A | YES | NONE | — | no autoplay-audio detector |
| 1.4.3 | Contrast (Minimum) | AA | YES | **PARTIAL**† | `tier2-contrast-fail`; `tier2-contrast-unresolvable` (review); `static-contrast-sub-threshold` (review, static-audit only); `contrast-not-verified` (review); `static-contrast-evidence` (review) | †only when `tier2-audit.mjs` is run and merged. `browserCollectContrastSamples` reads only direct text child nodes, so `::before`/`::after`, `::placeholder`, `<input value>`, shadow DOM, and iframe content are never sampled |
| 1.4.4 | Resize Text | AA | YES | **PARTIAL** | `viewport-zoom-disabled` | does not verify actual 200%-zoom reflow/clipping |
| 1.4.5 | Images of Text | AA | YES | NONE | — | OCR-based detection is checkable (same class as 2.3.1's frame analysis); no detector implemented |
| 1.4.10 | Reflow | AA | YES | **PARTIAL** | `viewport-meta-missing`; `fixed-minmax-overflow`; `large-fixed-width` (review) | no rendered-320px horizontal-scroll/clipping check |
| 1.4.11 | Non-text Contrast | AA | YES | NONE | — | no UI-component/icon border-contrast check |
| 1.4.12 | Text Spacing | AA | YES | NONE | — | no detector |
| 1.4.13 | Content on Hover or Focus | AA | YES | NONE | — | no detector |
| 2.1.1 | Keyboard | A | YES | **PARTIAL** | `clickable-non-button`; `click-handler-keyboard-missing` | custom widgets/drag targets/canvas controls with no click-listener pattern; non-inline event-binding idioms |
| 2.1.2 | No Keyboard Trap | A | YES | NONE | — | `focus-flow.mjs` targets this but is not imported by either audit script |
| 2.1.4 | Character Key Shortcuts | A | YES | NONE | — | no detector |
| 2.2.1 | Timing Adjustable | A | YES | NONE | — | no detector |
| 2.2.2 | Pause, Stop, Hide | A | YES | NONE | — | `motion-reduced-motion-missing` exists but checks CSS support, not a pause/stop control |
| 2.3.1 | Three Flashes or Below Threshold | A | YES (specialized frame analysis, e.g. PEAT) | NONE | — | no flash-rate/frame analysis exists |
| 2.4.1 | Bypass Blocks | A | YES | NONE | — | no skip-link detector |
| 2.4.2 | Page Titled | A | YES | **FULL**‡ | `document-title-missing`; `pdf-title-not-shown` | ‡decides presence/non-emptiness only; title *descriptiveness* is semantic and outside any automated check's reach |
| 2.4.3 | Focus Order | A | YES | NONE | — | `focus-flow.mjs` targets this but is not wired into either script |
| 2.4.4 | Link Purpose (In Context) | A | YES | **PARTIAL** | `quality-link-generic` (review) | review-only, catches only the generic-phrase pattern |
| 2.4.5 | Multiple Ways | AA | YES | NONE | — | no detector |
| 2.4.6 | Headings and Labels | AA | YES | NONE | — | no detector decides descriptiveness (heading hierarchy and existence are 1.3.1 failure modes, not 2.4.6's) |
| 2.4.7 | Focus Visible | AA | YES | **PARTIAL** | `focus-outline-removed` | doesn't verify indicator contrast/thickness, JS-based removal, or externally-linked CSS |
| 2.4.11 | Focus Not Obscured (Minimum) | AA | YES | NONE | — | `focus-flow.mjs` targets this but is not wired into either script |
| 2.5.1 | Pointer Gestures | A | NO | NONE | — | no detector |
| 2.5.2 | Pointer Cancellation | A | YES | NONE | — | no down-event-vs-up-event detector |
| 2.5.3 | Label in Name | A | YES | NONE | — | no visible-label-vs-accessible-name comparison |
| 2.5.4 | Motion Actuation | A | NO | NONE | — | no detector |
| 2.5.7 | Dragging Movements | AA | YES | NONE | — | no drag-listener/alternative detector |
| 2.5.8 | Target Size (Minimum) | AA | YES | **PARTIAL**† | `tier2-touch-target-fail`; `tier2-touch-target-advisory` (review) | †only with `tier2-audit.mjs`. `VALIDATION.md` L2 states the inline/equivalent-target-elsewhere/essential-presentation exceptions are NOT implemented |
| 3.1.1 | Language of Page | A | YES | **FULL**‡ | `html-lang-missing`; `html-lang-mismatch`; `html-lang-mismatch-review`; `html-lang-invalid`; `pdf-lang-missing` | ‡content-mismatch layer falls back to no-finding on JS-heavy pages with too little static text |
| 3.1.2 | Language of Parts | AA | YES | NONE | — | `detectLangParts` exists but is deliberately gated off (calibration false-positives), never emitted |
| 3.2.1 | On Focus | A | YES | NONE | — | no detector |
| 3.2.2 | On Input | A | YES | NONE | — | no detector |
| 3.2.3 | Consistent Navigation | AA | YES | NONE | — | no cross-page structural comparison — both scripts operate per-file/per-page |
| 3.2.4 | Consistent Identification | AA | YES | NONE | — | no cross-page structural comparison |
| 3.2.6 | Consistent Help | A | YES | NONE | — | no cross-page structural comparison |
| 3.3.1 | Error Identification | A | YES | NONE | — | no form-submission/error-association check |
| 3.3.2 | Labels or Instructions | A | YES | **PARTIAL** | `input-label-missing` | only checks `<input>`, not `<select>`/`<textarea>`; exempts any input carrying an `id` without verifying a `<label for>` references it |
| 3.3.3 | Error Suggestion | AA | NO | NONE | — | no detector |
| 3.3.4 | Error Prevention (Legal, Financial, Data) | AA | NO | NONE | — | no detector |
| 3.3.7 | Redundant Entry | A | YES | NONE | — | no multi-step-form field comparison |
| 3.3.8 | Accessible Authentication (Minimum) | AA | YES | **PARTIAL** | `auth-recaptcha-invisible`; `auth-recaptcha-v2`; `auth-turnstile`; `auth-text-captcha`; `auth-password-paste-blocked`; `auth-password-autocomplete-off`; `auth-recaptcha-js-render`; `auth-hcaptcha-js-render`; `auth-captcha-injected-script`; `auth-password-clipboard-blocked-js` | custom/non-branded CAPTCHA and hand-rolled cognitive-function-test implementations |
| 4.1.2 | Name, Role, Value | A | YES | **PARTIAL** | `frame-title-missing`; `button-name-missing`; `link-name-missing`; `quality-label-role-echo` (review); `pdf-encrypt-blocks-at`; `pdf-encrypt-a11y-bit-cleared` | ARIA state/property correctness, invalid role values, custom-widget value exposure, form controls beyond buttons/links |
| 4.1.3 | Status Messages | AA | YES | NONE | — | no `aria-live`/`role="status"` detector |

**Arithmetic**: 2 FULL + 12 PARTIAL = 14 criteria with any coverage → **14/55 = 25.5%**.
FULL only (2.4.2, 3.1.1 — the only two rows that reach FULL, both within automation's
reach, not full conformance): **2/55 = 3.6%**. Against the 48 machine-testable-in-principle
criteria (7 are NO — 1.2.1, 1.2.4, 1.3.3, 2.5.1, 2.5.4, 3.3.3, 3.3.4): any coverage
**14/48 = 29.2%**, FULL only **2/48 = 4.2%**.

This measures *criteria* (how many of WCAG's 55 A+AA categories have any Beacon detector),
not *instances* (how many real violations Beacon catches on a benchmark corpus — that is
the 0.727 ground-truth recall figure above, a different denominator). Do not average,
blend, or substitute one for the other in any report.

Full derivation, the escape-hatch rule, and the hakuso audit trail (five row-verdict
corrections, three machine-testable axis flips, two detector-bug fixes at engine
`beacon-static-audit@12`):
[`plans/2026-07-27-wcag-coverage-measurement.md`](plans/2026-07-27-wcag-coverage-measurement.md).

## L4 — fairness invariants

- **Same defect, same penalty in every dialect**: the cross-stack test renders
  identical violations in plain HTML / React-style (`data-rh`, `data-reactid`,
  attribute reordering) / Vue-style (`data-v-*`) / web-component markup and requires
  identical finding sets and scores. This test caught a real bug on its first run
  (`data-reactid` contains `id=`, which suppressed unlabelled-input findings on React
  pages only).
- CSR/SSR: thin static evidence lowers *coverage and confidence*, never the score.
- CJK-page FP rate: measured 2026-07-07 (`benchmark/2026-07-07-cjk-fp/`) — jp-tw 0.214
  vs Latin 0.017 instance-level, but 43/45 of the jp-tw FP mass is one
  non-language-related detector class (wrapping-label blindness, also fires on Latin
  sites; engine @7 fix). Residual jp-tw FP ≈ 0.01 — no evidence of CJK-text-semantics
  bias. Re-measure after detector changes.
- Not yet measured: scale fairness (per-element counting dilutes single defects on
  huge pages).

## L5 — forbidden claims

The report and any prose about Beacon may never state:
- a score without its `coverage_percent`;
- "recall" without "relative to the machine-checkable candidate pool";
- that any score demonstrates accessibility (triage signal, not completion
  certificate — cognitive load, interaction flows, reading order, and
  name-*correctness* are permanently outside static scope);
- narrative site-archetype bands (retired 2026-07-05; require a committed benchmark
  against the current formula before any revival).

---

## Release gate (run in order)

```
node --test                                   # 385 tests, all green
node build.mjs --check                        # generated copies match core
node tools/measure-detectors.mjs              # report-only characterization
node tools/measure-semantic.mjs --min-precision 1.0 --min-recall 0.4
# benchmark re-run (needs local snapshots; see benchmark/2026-07-05/README.md):
#   node capture-audit.mjs --audit-only && node analyze.mjs
# GT re-verify on detector changes: FP-elimination kept, TPs retained
# if scoring changed intentionally: node tools/regen-golden.mjs + explain the diff
```

Record in CHANGELOG: engine version, Spearman, and (when GT re-ran) P/R.

## Measured state (2026-07-27, engines `beacon-static-audit@12` + `beacon-tier2-audit@2`)

| Metric | Value |
|---|---|
| Spearman vs Lighthouse a11y (n=71) | 0.354 (@3) → 0.474 (@4) → 0.488 (@5/@6) → 0.480 (@7) → 0.477 (@8) → 0.468 (@9); no @10-@12 rerun — @10/@11 add only `check:'review'` findings and @12 was confirmed byte-identical on all 20 GT + 86 benchmark-population sites (below), so all three are expected score-neutral on this cohort (not yet empirically re-run) |
| Ground-truth P/R, pattern-level | @4: 0.600 / 0.591 → @6: 0.979 / 0.712 → @8/@9/@10/@11/@12: **1.000 / 0.727** (48/48 TPs incl. the recovered aria-heading case; FP 0; @9-@12 are category-level-neutral, findings unchanged for GT purposes — contrast is not a GT criterion, `@10`/`@11` findings are all `check:'review'` (never touched by GT's FP adjudication), and @12's `html-lang-*`/`document-title-missing` fixes produced zero finding-set diff on all 20 GT site snapshots, re-verified directly) · Lighthouse 0.811 / 0.462 |
| Ground-truth recall, instance-level | @4: 0.743 → @6: 0.826 → @8/@9/@10/@11/@12: **0.829** · Lighthouse 0.225 |
| @12 title/lang bug fix retention | Old-vs-new engine diff on `html-lang-*`/`document-title-missing` findings, final (post-correction) version: 20/20 GT sites zero diff; 86-site `benchmark/2026-07-05/` population zero diff (ADDED 0 / REMOVED 0) — see the `@12` engine-section detail above for the head/body-scoped first attempt's one false positive (linear.app idx 77) and the fix that removed it |
| @5 re-verification | 14/15 FP classes eliminated, 39/39 TPs retained, 18 new catches |
| @7 wild input-label FP elimination | 46/57 findings were wrapped-input FPs → 0; only jnto (+20) and spotify (+8) moved |
| @9 thin-evidence state (`insufficient-evidence`, N=3) | Spearman 0.477 → 0.468 (n=71); score-delta median \|Δ\| 7, p95 19, max 23 across 85 comparable sites, 18 band flips; `total_findings` byte-identical @8→@9 on all 85 sites incl. all 7 `gt-remap-6` sites (finding emission unaffected) |
| CJK fairness | jp-tw FP 0.214 → ~0.01 residual after @7; no CJK-text-semantics bias found |
| Score error bar, temporal (same machine, 2-day, n=13) | median 0 / p95 1 / max 1; 0 band flips |
| Score error bar, cross-machine | NOT YET MEASURED — run the two-machine experiment before quoting scores across machines |

## Open items (highest leverage first)

1. ~~rakuten link-name adjudication~~ RESOLVED 2026-07-07: walker correct (GT README).
2. ~~Full @6 GT re-mapping~~ DONE 2026-07-07: P 0.979 / R 0.712 (GT README).
3. Two-machine experiment (temporal baseline measured 2026-07-07: p95 |Δ| = 1; the
   cross-machine bar is still open) → publish the full error bar.
4. ~~CJK FP-rate measurement~~ DONE 2026-07-07 (`benchmark/2026-07-07-cjk-fp/`); its
   product: fix the wrapping-label input-label FP class (engine @7, 46/57 wild FPs).
5. ~~Engine @8 aria-heading / presentational stripping~~ GT RERUN DONE 2026-07-22:
   P 1.000 / R 0.727, FP 0 (GT README, `pr-analysis-v8.json`); benchmark rerun Spearman
   0.477, only jnto moved (+3, its presentational-heading FP gone). New known ceiling
   recorded: the outline detector reports only the FIRST level-skip per document
   (site 90 vi=4 stays missed). Class-based hiding still needs Tier-2 capture
   annotations if future benchmark evidence justifies that larger change.
6. ~~Engine @9 thin-evidence category state~~ DONE 2026-07-22: `insufficient-evidence`
   (N=3 floor) ships; benchmark rerun Spearman 0.477 → 0.468 (n=71), score-delta median
   7 / p95 19 / max 23 across 85 sites, 18 band flips; GT retention confirmed
   (`total_findings` byte-identical @8→@9 on all 85 sites incl. `gt-remap-6`). N=3 stays
   an open calibration knob (CHANGELOG 3.2.0).
