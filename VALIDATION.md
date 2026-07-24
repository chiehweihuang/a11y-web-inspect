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

### L2 — Tier-2 (browser-measured) thresholds, engine `beacon-tier2-audit@1`

Native Playwright measurement (contrast + touch targets), added 2026-07-25 (v3.3
Workstream A). Findings + evidence only so far — these categories do NOT yet enter the
weighted score; that wiring is a separate, undecided step (see
`plans/2026-07-25-v3.3-browser-measurements.md` Workstream A step 4). Every threshold
below is a CALIBRATION DECISION, not a physical constant — revisit with data the same way
the static-tier N=3 floor and severity repeat-cap are tracked above.

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
  worst case for this detector, not necessarily representative).
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
- Fixture ground truth: `test/tier2-fixtures/contrast.html` and
  `test/tier2-fixtures/touch-targets.html`, hand-computed pass/fail/review pairs
  (`test/tier2-audit.test.mjs`), including the composited semi-transparent-background case
  (proves the alpha-blend math, not just presence/absence) and a viewport-dependent touch
  target (proves the harness produces different findings at 320 vs 1280 when the same
  element's CSS size changes under a media query).
- Real-page smoke run (2026-07-25, rakuten.co.jp benchmark snapshot #97, both viewports):
  2914 findings — 190 `tier2-contrast-fail`, 1584 `tier2-contrast-unresolvable`, 15
  `tier2-touch-target-fail`, 1125 `tier2-touch-target-advisory`, 0 crashes. Not yet a wild
  FP measurement (no human adjudication of these flags) — that is required before any of
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

**FP calibration, two rounds** (`plans/2026-07-25-ws-b-contrast-calibration.md`, full
detail — current numbers at the top of that file, initial-pass numbers kept below for the
audit trail):

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
node --test                                   # 310+ tests, all green
node build.mjs --check                        # generated copies match core
node tools/measure-detectors.mjs              # report-only characterization
node tools/measure-semantic.mjs --min-precision 1.0 --min-recall 0.4
# benchmark re-run (needs local snapshots; see benchmark/2026-07-05/README.md):
#   node capture-audit.mjs --audit-only && node analyze.mjs
# GT re-verify on detector changes: FP-elimination kept, TPs retained
# if scoring changed intentionally: node tools/regen-golden.mjs + explain the diff
```

Record in CHANGELOG: engine version, Spearman, and (when GT re-ran) P/R.

## Measured state (2026-07-22, engine `beacon-static-audit@9`)

| Metric | Value |
|---|---|
| Spearman vs Lighthouse a11y (n=71) | 0.354 (@3) → 0.474 (@4) → 0.488 (@5/@6) → 0.480 (@7) → 0.477 (@8) → 0.468 (@9) |
| Ground-truth P/R, pattern-level | @4: 0.600 / 0.591 → @6: 0.979 / 0.712 → @8/@9: **1.000 / 0.727** (48/48 TPs incl. the recovered aria-heading case; FP 0; @9 is category-level-neutral, findings unchanged) · Lighthouse 0.811 / 0.462 |
| Ground-truth recall, instance-level | @4: 0.743 → @6: 0.826 → @8/@9: **0.829** · Lighthouse 0.225 |
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
