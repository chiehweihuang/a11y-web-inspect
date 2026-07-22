# Workstream A validation notes — engine @9 thin-evidence category state

Full validation-cycle detail for the change implemented per
`plans/2026-07-22-evidence-states-and-report-ia.md` (Workstream A). Summary lives in
CHANGELOG.md `[3.2.0]` and VALIDATION.md (measured-state table + L2 note + open-item #6).

## What changed

`core/scripts/static-audit.mjs`:
- `DETECTOR_VERSION` → `beacon-static-audit@9`.
- New constant `THIN_EVIDENCE_MIN = 3`.
- `scoreCategory(cat)`: a category with `0 < pass + fail < THIN_EVIDENCE_MIN` now returns
  `{ state: 'insufficient-evidence', score: null }` instead of computing a score. The
  `auditable === 0` branch (not-machine-checkable / not-applicable) is unchanged. Nothing
  else in the file changed — `scanFile`, `addFinding`, `addCheck`, and the life-safety gate
  (`stats._lifeSafety`, set independently on confirmed 2.3.1 findings) are untouched, so
  finding emission and the gate are structurally guaranteed unaffected by this change (not
  just empirically — the code path never touches the findings array).
- `rulesetHash()`: payload now includes `thinEvidenceMin` and the updated states list, so
  `engine_fingerprint` changes as required by the reproducibility contract.

`core/scripts/generate-report.mjs`:
- `STATE_BADGE_KEYS` / `STATE_DETAIL_KEYS` lookup maps added (generalizing the old
  2-way ternary to N states); `insufficient-evidence` gets its own bilingual badge text
  and detail-row explanation. Score rings already filter to `cat.score !== null`, so an
  unscored category simply never renders a ring — no ring-layer change was needed.

`core/content/inspect.md`: states list + formula prose updated to document
`insufficient-evidence` and the N=3 floor; one illustrative `@8` → `@9` string fixed.

All three are canonical `core/` sources; `node build.mjs` synced the 9 generated copies
(`scripts/`, `commands/inspect.md`, `adapters/codex/...`).

## Test changes (why each fixture moved)

Engine @9 makes several EXISTING fixtures cross the new N=3 floor differently than before,
since many hand-written test pages only ever had 1 native check per category (a single
button, a single labelled input, a single viewport tag). These are fixture/assertion
updates, not behavior compromises — each one is annotated in-file with why.

`test/static-audit-scoring.test.mjs`:
- `PAGE`'s `responsive` (1 native check) now reports `insufficient-evidence`, not `scored`
  — the "category states" test, `coverage_percent` test (35% → 23%), and the "attribute
  order" test's `responsive.score > 0` assertion (rewritten to the state-agnostic
  "must not be scored-and-zeroed" invariant) all updated accordingly.
- `RICH_PAGE` gained 2 extra buttons + 2 extra labelled inputs (3 of each total) so
  `keyboard`/`forms` clear N=3 NATIVELY. `responsive`/`motion` detectors fire at most once
  PER FILE (not per occurrence), so they can never clear N=3 within one fixture file;
  a new `fullCoveragePasses()` helper merges 3 external passes for the 4 always-review-only
  categories (contrast/touch/cognitive/media) and 2 external passes on top of each
  category's native 1 for responsive/motion. Verified by hand against the real CLI before
  editing tests (100 overall / 100% coverage / every category `scored`).
- New tests: boundary sweep (0/1/2/3 checks → not-applicable/insufficient-evidence/
  insufficient-evidence/scored), renormalization + coverage exclusion, life-safety-gate
  independence (motion ends up `insufficient-evidence` in that test's fixture; gate still
  fires — proves the gate reads confirmed findings, not category state), and the
  plan's step-6 edge case ("only failing category is thin" → finding still emitted,
  overall reads 100, coverage drops).

`test/scoring-properties.test.mjs`: `CLEAN`'s keyboard/forms baseline bumped from 1 to 3
buttons/inputs each. Without this, the L3 dose-response test's dose=1 injection (1 more
fail) would land in a category still below N=3 (now `insufficient-evidence`, EXCLUDED from
the weighted average), so the score would not move at dose=1 and the monotonic
`score < 100` assertion would fail — not because dose-response broke, but because the
category never entered scoring in the first place. L2 monotonicity tests were checked by
hand and did NOT need changes (the thin category's exclusion is identical between the two
compared variants in both cases, so it cancels out of the `>=` comparisons).

`test/generate-report-category-disclosure.test.mjs`: added a third category
(`insufficient-evidence`) to the hand-built audit fixture; asserts the new badge text
renders and that no score ring is emitted for it.

## Full validation cycle (run 2026-07-22)

```
node --test                 -> tests 329, pass 329, fail 0
node build.mjs --check      -> all 48 outputs match core
node tools/measure-semantic.mjs --min-precision 1.0 --min-recall 0.4
                             -> P 1.00 / R 0.76 overall, "all detectors meet P>=1 / R>=0.4"
node tools/measure-detectors.mjs   -> report-only, unaffected (detector logic untouched)
```

Note on `node --test` and golden regen: bare `node --test` (no directory argument, as
mandated) recursively discovers every `.mjs` file under `test/`, INCLUDING
`test/golden/regen.mjs` — which has no `test()` blocks, so Node just executes its
top-level code as a side effect of loading it, silently regenerating both golden expected
JSONs on every bare test run. This is a pre-existing harness quirk (not introduced by this
change) that made the golden vectors self-heal before I ran the explicit
`node test/golden/regen.mjs` step — I ran it anyway for the record and it produced no
further diff. Flagging this for Hakuso: it means `test/golden-vectors.test.mjs`'s
byte-identical check is currently NOT a true drift trap under bare `node --test` (it always
compares against whatever the engine just produced), and may warrant a follow-up fix to
Node's test-file discovery config or a rename of `regen.mjs` outside `test/` — out of
Workstream A's scope, left as-is.

### Golden vector diff (regenerated, `git diff test/golden/`)

`clean.expected.json`: `engine_fingerprint` @8→@9; `confidence_level` medium→low;
`coverage_percent` 66→23; categories `keyboard`/`forms`/`responsive`/`motion` (each had
exactly 1 native check) move `scored`→`insufficient-evidence`, score 100→null.
`overall_score` UNCHANGED at 100 (screenreader + agent, the only categories with >=3
checks, are both still 100 — top band stays reachable). `total_findings` unchanged at 0.

`dirty.expected.json`: same engine/confidence/coverage-field deltas (coverage 61%→23%);
`keyboard` (2 checks), `forms` (1 check), `responsive` (2 checks) move
`scored`→`insufficient-evidence`. `overall_score` 9→0: the fixture's only above-floor
category besides screenreader/agent was `responsive` at 45 (carried by exactly 2 checks),
and its exit from the denominator removes the one thing pulling this synthetic
worst-case fixture's average up. `total_findings` unchanged at 13 critical / 1 warning /
3 tip / 17 total. Every changed line traces to the N=3 threshold; nothing else moved.

### Benchmark rerun (`beacon-benchmark-100/run-2026-07-05`)

1. `cp results.json results-engine8.json` (archived the true @8 baseline, 87 rows,
   verified by row count before overwriting).
2. `node capture-audit.mjs --audit-only` — re-ran the @9 engine over the same cached
   snapshots. `results.json` now has 113 rows (the site pool grew to 113 sites from
   unrelated site-list additions between 2026-07-05 and now; snapshots exist for 86 of
   them). `n_paired` for the Lighthouse-paired analysis is unaffected: still **71**.
3. `node analyze.mjs`:
   - `spearman_all`: **0.468** (was 0.477 at @8, n=71) — a small decrease. This is a rank
     correlation over the WHOLE cohort; individual sites move by uneven amounts and
     directions (see drift below), so the correlation can move against the average
     direction of individual improvements.
   - `beacon_band_counts`: pass 27 / needs-work 41 / fail 3 (n=71 paired subset within the
     113-row file — not directly comparable to an @8 band count since analyze.mjs doesn't
     retain the prior run's per-site bands; see drift-compare for the paired delta instead).
4. `node tools/drift-compare.mjs results-engine8.json results.json`:
   - `n_compared`: 85 (sites present in both archives with a valid capture)
   - score-delta distribution: median |Δ| = 7, p95 = 19, max = 23
   - 18 band flips (mixed direction — 12 downward, 6 upward, by inspection of the `flips`
     list)
   - worst movers: wayfair.com −23, kyoto.travel −19 (categories previously inflated by
     thin high-scoring evidence now excluded, removing an artificial ceiling); squarespace.com
     +21, twitch.tv +20, wordpress.com +20 (thin categories that were previously dragging
     the average down with a naked 0 now excluded)
   - motivating case confirmed: **rakuten.co.jp 40 → 54** — `responsive` (0 pass / 1 fail)
     and `motion` (0 pass / 1 fail) each had a single unconfirmed-by-repetition failure
     with zero counterbalancing passes; both now report `insufficient-evidence` instead of
     a naked 0, and exit the weighted average instead of dragging it down. Hand-verified
     against `beacon-benchmark-100/run-2026-07-05/audits/97.json` before implementing, and
     matches the actual rerun exactly.

### GT retention check

The plan asked for a "retention checker pattern" confirmation that finding emission is
category-level-neutral. No standalone retention-checker script exists in this workspace
(the phrase refers to a methodology used in the 2026-07-22 GT session, not a persisted
tool), so the check was done directly: `total_findings` per site, comparing the archived
`results-engine8.json` against the fresh `results.json`, for every site present in both.

```
compared 85, mismatches 0
```

All 7 `gt-remap-6` ground-truth cohort sites (idx 27, 8, 96, 90, 24, 25, 97) individually
confirmed with identical `findings` counts, only `beacon_overall` moving:

| idx | url | findings (unchanged) | overall @8 → @9 |
|---|---|---|---|
| 27 | css-tricks.com | 9 | 74 → 63 |
| 8 | polaris.shopify.com | 6 | 69 → 69 |
| 96 | kyoto.travel | 22 | 61 → 42 |
| 90 | ibm.com | 11 | 80 → 72 |
| 24 | web.dev | 13 | 84 → 74 |
| 25 | developer.chrome.com | 7 | 88 → 80 |
| 97 | rakuten.co.jp | 137 | 40 → 54 |

This is stronger than the plan's minimum ask (all 85 comparable sites checked, not just
the 20-site GT cohort) and is also structurally guaranteed by the code diff itself:
`scoreCategory` is the only function touched, and it does not receive or mutate the
findings array. Ground-truth P/R (1.000 / 0.727 pattern-level, `pr-analysis-v8.json`)
therefore stands unchanged at @9.

## Risks / open items for Hakuso

1. **Bare `node --test` silently regenerates golden vectors** (see note above) — a
   pre-existing test-harness discovery quirk, not introduced here, but it means the L0
   golden-vector pinning test is currently weaker than VALIDATION.md's stated intent
   ("same input -> same output... any diff is either cross-machine nondeterminism or an
   intentional change, regenerate and explain"). Worth a follow-up ticket.
2. **Spearman decreased slightly (0.477 → 0.468)** despite the change being a net
   improvement in interpretability (removes false-precision zeros/hundreds). This is
   expected and disclosed in CHANGELOG/VALIDATION, not hidden, but flagging for explicit
   arbitration: is a small Spearman regression an acceptable trade for honest coverage
   reporting? (The plan's own framing — "overall scores WILL move... rakuten 40 → expect
   up" — anticipated the direction would vary per site; it did not commit to Spearman
   moving up.)
3. **N=3 threshold is unvalidated beyond this one benchmark run** — same status as the
   pre-existing severity repeat-cap (3/key), explicitly logged as revisit-with-data in
   VALIDATION.md L2.
4. I did NOT bump `.claude-plugin/plugin.json`'s version (still 3.1.0) or touch the
   "Release" section of the plan (plugin cache update, landing page badge re-verify,
   README GT-number refresh) — those read as post-both-workstreams release steps, and
   Workstream B (report IA) has a mockup in `plans/mockups/` but no generator-side
   implementation yet as of this session.
