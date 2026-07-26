# Tier-2 evidence rendering — notes (2026-07-26)

Scope: `core/scripts/generate-report.mjs` only (rendering). No scoring code touched.

## What renders where

1. **Category cards** (`#layer-evidence`, `buildCategoryCardHTML`): a new `tier2ProvenanceHTML()`
   line — chip `瀏覽器層量測（tier 2）· Browser-measured (tier 2)` + measured denominator
   (`N measured (viewport list)`) — appended after the evidence meter, before the cause line.
   Reads `audit.tier2.summary.by_viewport[].contrast_samples/touch_targets` (the actual
   population looked at, pass or fail — not just findings, so "measured 1834, 0 findings"
   is renderable too). `cat.state`/`cat.score` themselves are untouched.
2. **Finding groups** (`buildFindingGroupHTML`): new `tier2MeasuredHTML()` renders a
   `量測值 / Measured` line (same `.standard-line` styling) between the standard line and the
   fix line — computed ratio + fg/bg rgb pair for `tier2-contrast-fail`; measured width/height
   + the spacing-exception note for `tier2-touch-target-fail`/`-advisory`. Four new
   `FINDING_I18N` entries (zh+en title/description/fix/standard) for `tier2-contrast-fail`,
   `tier2-contrast-unresolvable`, `tier2-touch-target-fail`, `tier2-touch-target-advisory`.
3. **Unresolvable-contrast summarization**: no new code needed — `buildFindingGroups()`
   already collapses same-key findings into one group with a `×N` count. Verified on the
   real rakuten.co.jp specimen: 1584 `tier2-contrast-unresolvable` instances → exactly ONE
   `<article id="fg-tier2-contrast-unresolvable">` with `×1584`.

## Score-neutrality — how, and a finding worth flagging

`static-audit.mjs --merge-findings` was NOT used to build the merged specimen. Traced the
code: `mergeExternalFindings` calls `addCheck`/`addFinding`, which write into
`stats[category].pass/fail/review` — the same counters `scoreCategory()` reads. Tier-2
findings carry `check:'fail'` (contrast/touch fails) or `check:'review'` (unresolvable/
advisory); merging them as-is would flip `touch`/`contrast` from `not-applicable`/
`not-machine-checkable` to `scored` or add review counts — i.e. it silently enacts the A4
scoring decision that is explicitly not yet made. So `--merge-findings` is **not** score-neutral
for tier-2 data; using it here would have violated "no denominator effect."

Instead I built the merged specimen with a plain JSON splice (verification-only script, not
committed): `merged.findings = [...static.findings, ...tier2.findings]`,
`merged.tier2 = {metadata, summary}` (evidence-count source), and **`merged.summary` copied
verbatim, never recomputed**. This is what generate-report.mjs now expects on input: tier-2
findings already present in `audit.findings` (tagged `source: 'beacon-tier2-audit@1'`) plus
optional `audit.tier2.summary.by_viewport` for the measured counts.

Whoever wires the real merge step (A4, whenever scoring is decided) should know: reusing
`--merge-findings` verbatim for the "evidence only" default is NOT safe. A production
merge helper (not built here — out of this task's scope) needs the same discipline: splice
findings for display, never run them through `addCheck`/`addFinding`, unless/until A4 says
tier-2 should score.

## Score-neutrality proof (real specimen: rakuten.co.jp / 97.html, engine beacon-static-audit@11)

Both generated from the same `audit.summary` object (one copied verbatim into the other):

```
UNMERGED: overall_score:54 coverage_percent:49 contrast:{pass:0,fail:0,review:2,state:"not-machine-checkable",score:null} touch:{pass:0,fail:0,review:1,state:"not-machine-checkable",score:null}
MERGED:   overall_score:54 coverage_percent:49 contrast:{pass:0,fail:0,review:2,state:"not-machine-checkable",score:null} touch:{pass:0,fail:0,review:1,state:"not-machine-checkable",score:null}
JSON.stringify(unmerged.summary) === JSON.stringify(merged.summary) -> true
```

Tier-2 side of that specimen: 2914 findings (1584 unresolvable, 190 contrast-fail, 1125
touch-advisory, 15 touch-fail) across viewports 320x720/1280x900, 917 contrast samples +
761 touch targets measured per viewport.

## Tests

- Extended `test/generate-report-standard-coverage.test.mjs` to also scan
  `core/scripts/tier2-audit.mjs`'s `key:` literals (previously only scanned
  `static-audit.mjs`), so the "every key has a bilingual standard" gate now covers tier-2 keys.
- New `test/tier2-report-visibility.test.mjs`: builds an unmerged + a merged fixture sharing
  one `summary` block, asserts (a) contrast/touch state-badge text is byte-identical in both
  reports and never grows a `score-badge`, (b) provenance label + measured counts render only
  when `audit.tier2` is present, (c) the measured-value line renders the exact ratio/rgb pair
  and width/height/spacing note, (d) 3 synthetic unresolvable findings (different locations)
  collapse into one `fg-tier2-contrast-unresolvable` group with `×3`.
- `node --test`: 376/376 pass. `node build.mjs` run (3 generated copies updated); `node
  build.mjs --check`: clean.

## Verification against the guide.md gates (real specimen report)

- Self-scan (`static-audit.mjs` against the generated report.html): 0 critical / 0 warning /
  4 tip, identical before and after (matches the WS-B precedent in
  `plans/2026-07-25-ws-b-hakuso-audit.md`).
- Horizontal scroll: `document.documentElement.scrollWidth === clientWidth` at both 320 and
  1280 (Playwright, real Chromium) — no overflow.
- Fonts: no new CSS added; existing `--sans`/`--mono` stacks untouched; grep for
  PMingLiU/MingLiU: 0 matches.
- Screenshots: `plans/2026-07-26-tier2-report-screens/01-evidence-cards-provenance.png`
  (category grid with contrast/touch provenance chips), `02-contrast-fail-measured.png`,
  `03-touch-fail-measured.png`, `04-unresolvable-summarized.png` (×1584, one card).

## Left out / not this task's call

- No permanent merge script added to `core/scripts/` (would need a `tools/manifest.mjs`
  registration and is closer to the A4 "scoring wiring" decision than to report rendering) —
  the JSON-splice recipe above is documented instead.
- Did not modify `tier2-audit.mjs` to add a numeric "neighbor distance" to
  `tier2-touch-target-fail.computed` (only `spacingExceptionMet: false` exists there today);
  rendered a qualitative note instead ("a neighboring element falls inside the 24px
  spacing-exception circle"). Left tier2-audit.mjs untouched given it's shared, actively-owned
  ground (calib-broaden/tier2-calib) and outside this task's rendering scope.
