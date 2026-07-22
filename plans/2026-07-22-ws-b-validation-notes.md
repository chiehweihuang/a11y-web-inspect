# Workstream B validation notes — v3.2.0 report IA port

Session: 2026-07-23 (genen). Source of truth: `plans/mockups/2026-07-22-report-ia-mockup.html`
+ `plans/2026-07-22-evidence-states-and-report-ia.md` (Workstream B section).

## Files changed

- `core/scripts/generate-report.mjs` — rewritten from the score-bands section onward
  (~line 758 to EOF in the old file). Lines 1-756 (I18N table, FINDING_I18N, WCAG/
  jurisdiction/axe-normalization helpers, `reportFindings`/`reportCounts`) are
  byte-identical to the pre-v3.2.0 file — no reason to touch them.
- `scripts/generate-report.mjs`, `adapters/codex/scripts/generate-report.mjs` —
  regenerated copies via `node build.mjs` (this file is a `copy`-kind GENERATED
  entry per `tools/manifest.mjs`; no marker-variant machinery applies to it, so no
  new build mechanism was introduced, and no split into `core/scripts/report-assets/`
  was attempted — extending the manifest for sub-files would itself be "inventing a
  new build mechanism").
- `test/generate-report-category-disclosure.test.mjs` — rewritten. The old
  assertions checked the removed table/tabs markup (`data-expand-categories`,
  expandable `id="detail-contrast"` rows) and a `remediation`-array-only code path
  (a separate P0/P1/P2 tab) that the new findings-by-fix-action section supersedes.
  New assertions keep the same intent: unscored categories render as text badges
  (never a painted score), the masthead URL is HTML-escaped, a real finding's
  location/fix text is visible, and testing recommendations stay bilingual.

## IA implemented (matches the mockup's 4 layers, plus 3 appended layers)

01 Decision hero (ring + band + coverage/confidence-derivation line + honesty box +
life-safety-or-safe-flag + "fix these next" top-3 by severity×count, effort held
constant since no per-finding effort field exists) · 02 Evidence-density category
cards (log2-scaled meter, tension vs. dominant-cause vs. state-detail copy) · 03
Findings grouped by fix action with category filter chips · 04 print-ready client
executive summary (always visible, no JS toggle).

**Decision not in the mockup**: the old Legal/Methodology/Performance tab content
(WCAG jurisdiction detail, the long capability/limitation/workflow/traps-table
methodology panel, Lighthouse performance signals) is real, philosophically
load-bearing content the mockup's 4-section spec didn't address either way.
Rather than silently delete it, it's appended as sections 05/06/07 in the same
scrolling layout (own jump-nav entries), reusing the pre-v3.2 render functions
unchanged. Flagging this for hakuso/team-lead: prune if the 4-section scope was
meant to be the *entire* report, not a primary flow with a deep-dive tail.

**One legitimate simplification vs. the mockup's rakuten-specific prose**: fixcard/
finding-group titles render as `{existing FINDING_I18N title} (×N)` rather than
hand-authored action sentences ("Add alt text to 88 images") — the mockup's exact
sentences don't generalize to arbitrary detector keys without a second bespoke
copy table per key. The additive number and the underlying title are both real
data; only the sentence template differs from the mockup's illustration.

## Confidence-derivation addition (user-requested, beyond the mockup)

`confidenceLine()` in generate-report.mjs, sourced from `audit.metadata.confidence_level`
and `audit.summary.coverage_percent`, with `CONFIDENCE_COVERAGE_THRESHOLD = 60`
documented as mirroring static-audit.mjs's `coverage >= 60 ? 'medium' : 'low'` rule.
Renders in the masthead tier line and the hero coverage line, e.g. on the real
rakuten re-run: `信心 low（評分覆蓋 49%，門檻 60%）· confidence low (coverage 49%,
threshold 60%)`.

## Calibration constants introduced (ponytail-flagged, revisit with more data)

- `EVIDENCE_HIGH_MIN = 30` — checks-count threshold for the evidence meter's
  "high" vs "moderate" tier. The log2 width formula itself (`round(10*log2(n+1))`)
  reproduces the mockup's rakuten-derived widths exactly (992→100%, 6→28%, 3→20%,
  1→10%) — verified by hand before writing the code, not just after.
- Tension-vs-dominant-cause split: `passRate >= 0.5 && bandOf(score).id === worst
  band` — matches the mockup's screenreader example (87% pass, score 3) and its
  keyboard counter-example (67% pass, score 62, not in the worst band → cause line
  instead of tension).

## Verification run (this session)

- `node --check core/scripts/generate-report.mjs` — OK.
- `node build.mjs` — wrote 48 generated files, no orphans/mapping errors.
- `node build.mjs --check` — all 48 outputs match core.
- `node --test` (bare, no path arg) — 328/328 pass. First two full-suite attempts
  showed 4-8 unrelated failures (`VirtualAlloc failed` / `spawnSync node UNKNOWN`
  in static-audit-detectors/pdf-detect/quality-detect/scoring-properties/
  detector-baseline) — these spawn `core/scripts/static-audit.mjs` as a subprocess
  and never touch generate-report.mjs; re-running the same files alone (89/89) and
  the full suite a third time (328/328) both passed clean, confirming Windows
  process/memory contention from parallel `node --test` subprocess spawns, not a
  regression from this change.
- Golden vectors (`test/golden-vectors.test.mjs`) untouched and passing — they
  pin `static-audit.mjs`'s JSON output only; there is no committed HTML golden,
  so no golden regen was needed for a report-generator-only change
  (`tools/regen-golden.mjs` regenerates `test/golden/*.expected.json`, not report
  HTML).
- Three specimens regenerated to a scratch dir (not committed):
  `test/golden/clean.expected.json`, `test/golden/dirty.expected.json`, and the
  real rakuten artifact at `beacon-benchmark-100/run-2026-07-05/audits/97.json`
  (overall 54/100, coverage 49%, confidence low — these are the CURRENT engine
  @9 numbers on that fixture, not the mockup's stale 40/66%/medium; every number
  in the generated report is read from the artifact at render time).
- Self-scan (`static-audit.mjs` run ON each generated report page): first pass
  found 1 critical (`heading-level-skipped`: hero's `<h1>` was followed by an
  `<h3>` for "Fix these next", which was itself followed by `<h4>` fixcard
  titles) and 1 warning (`fixed-minmax-overflow`: `.manual-check-grid` and
  `.risk-grid`, both ported unchanged from the pre-v3.2 file, used bare
  `minmax(240px/280px, 1fr)` instead of the Layout Integrity Gate's required
  `minmax(min(Npx,100%), 1fr)`). Both fixed (heading demoted h1→h2→h3, matching
  every other section's h2/h3 nesting; both grids wrapped in `min(Npx,100%)`).
  Re-scanned clean: 0 critical, 0 warning on all three specimens — only 3 `tip`
  findings remain (`meta-description-missing`, `canonical-missing`,
  `jsonld-missing`), expected for a local report artifact that isn't a deployed,
  crawlable page.
  - Incidental: grep for `pmingliu` in the generated HTML finds exactly one hit —
    the CSS comment documenting that PMingLiU is unreachable, not a font-family
    reference. Zero actual PMingLiU/bare-monospace/bare-serif declarations.
- Playwright sweep (via the a11y-skill-workspace's local Playwright install,
  since this machine has no `package.json`/`node_modules` at the beacon repo
  root): full-page screenshots at 320/768/1024/1280/1440/1742/1920 plus
  1280-dark and 1280-en, written to `plans/2026-07-22-ws-b-screens/` (untracked,
  fine per the team-lead's instruction). Visual review (fold + full-page) at
  every width: no horizontal overflow, no viewport-scale dead whitespace, category
  grid reflows 1→2→3 columns correctly, jump-nav and toolbar wrap sanely at 320,
  dark mode re-tokenizes correctly (ring/band/chips all recolor, toolbar button
  shows pressed state), English toggle renders every section's English copy
  correctly including the confidence-derivation line and the real 88/44/1/133/97%
  numbers.

## Risks / follow-ups (not fixed silently, listed for hakuso/team-lead)

1. Sections 05 (Methodology)/06 (Legal)/07 (Performance) are a scope decision I
   made (append, don't delete) — see "Decision not in the mockup" above. Needs a
   yes/no from whoever approved the 4-section mockup.
2. `docs/make-demos.mjs` regen and the landing page's coverage-badge re-check
   (mentioned in the process plan's step 4) were NOT run — out of the explicit
   work order for this session, and `docs/reports/*.html` are now stale relative
   to the new generator. Flagging, not fixing.
3. The I18N table was left 100% untouched, including keys now unused by the new
   IA (`tab_*`, `h2_remediation_priority`, `rem_p0/p1/p2`, the old table's
   `th_*`/`category_expand_all` etc.). Deliberate: symmetric zh/en trimming across
   ~25 keys was assessed as busywork with real risk of a silent mismatch, for no
   functional gain (dead object keys are inert). Low-priority cleanup, not done.
4. `--previous` (score-over-time comparison) support was kept but slimmed to one
   hero delta line and one per-card delta badge, reusing the existing
   `deltaArrow()` unchanged — no test exercises `--previous` on the report
   generator either before or after this change, so this is unverified beyond
   manual reasoning about the code path.
