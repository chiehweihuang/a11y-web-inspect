# 2026-07-27 — v3.3 merge-audit required fixes, executed

Executor: genen. Source: `plans/2026-07-26-v33-merge-audit.md` steps 1-9 (5 HIGH + 4
MEDIUM), plus the `plans/2026-07-26-contrast-calibration-broad.md` static-side false
positive, applied after step 9 per the work order. Tree frozen at `master`@`7453725` +
five agents' uncommitted work; not committed, not pushed (explicit instruction).

## Step-by-step

1. **HIGH-1 (wire tier-2 rendering)**: `mergeExternalFindings` now forwards
   `computed`/`selector`/`viewport`, with a new `sanitizeComputed()` validator (untrusted
   input — coerces every numeric field with `Number`/`Number.isFinite`, drops `computed`
   entirely on failure) since `tier2MeasuredHTML` interpolates those fields into HTML with
   no escaping of its own. `main()` now captures `mergeExternalFindings`'s parsed raw
   payload and attaches `{metadata, summary}` as `audit.tier2` when it looks like a tier-2
   artifact (`engine_fingerprint` starts with `beacon-tier2-audit`, `summary.by_viewport`
   is an array). Extended `test/tier2-report-visibility.test.mjs` with a case that runs the
   real `tier2-audit.mjs` → `static-audit.mjs --merge-findings` → `generate-report.mjs`
   pipeline (Playwright-gated, skips loudly if unavailable) instead of a hand-written
   audit JSON. Verified with the audit's exact three-command sequence: both
   `tier2-provenance` and `tier2-measured` print `true`.

2. **HIGH-2 (unresolvable copy)**: took the **preferred, still-small variant** for the
   engine's own finding data — `browserCollectContrastSamples` now records
   `bgUnresolvedReason` (`image-or-gradient` / `pseudo-or-inset-shadow` /
   `non-ancestor-overlay` / `dark-canvas`), and `analyzeContrastSamples` picks a
   reason-specific title/description naming the actual cause, falling back to the generic
   four-cause text for older/synthetic samples with no reason. For
   `generate-report.mjs`'s `FINDING_I18N` table (which always shows fixed text per key,
   never per-instance — `findingText()` overrides the finding's own text regardless), used
   the **literal four-cause text the audit specified**, since making `findingText()`
   interpolate per-instance would touch a shared rendering funnel used by every finding
   key — bigger than "still small". `tier2-audit.mjs:590`'s `audit_methods[0]` updated to
   the literal required text too. Note: the audit's own required replacement text (and my
   per-reason `image-or-gradient` case) still contain the substring "image or gradient" as
   one of four listed causes — the acceptance grep as literally stated would still match;
   flagging this since I used the audit's own verbatim text rather than reword around its
   own example.

3. **HIGH-3 (remove "never scores" premise)**: all 5 edits applied
   (`generate-report.mjs` zh+en standard lines, `tier2-audit.mjs`'s `metadata.note`,
   `VALIDATION.md:110-112`, `CHANGELOG.md`'s two spots). Left the two truly-accurate
   "never scored" claims alone (`tier2-contrast-unresolvable`, `tier2-touch-target-advisory`
   — both permanently `check:'review'`), per the audit's own instruction not to "fix"
   those two.

4. **HIGH-4 (version skew)**: all 5 table edits + the `VALIDATION.md:170` @1 label +
   `node build.mjs` after the `inspect.md` edit. `grep -rn "beacon-tier2-audit@1"
   --include="*.md" --include="*.json"` now returns only `plans/` dated history files
   (left alone per the audit's own ruling). Test-count string updated to the true final
   count (see "deviation" below).

5. **HIGH-5 (stage fixtures)**: staged the 4 fixtures + `tier2-report-visibility.test.mjs`
   by exact path. Confirmed `.gitignore` has no rule touching `test/tier2-fixtures/*` or
   this test file — nothing was silently excluding them. `git status --porcelain test/`
   now shows no `??` entries.

6. **MEDIUM-1 (crashed viewport)**: `computeTier2EvidenceByCategory` filters
   `byViewport` to `!v.error` before building the label list, and separately counts
   `erroredCount`; `tier2ProvenanceHTML` appends a bilingual "(N viewport(s) failed to
   capture)" note when `erroredCount > 0`. Folded in **MEDIUM-4** here (it named step 1,
   but the code was still open in this same area): `tier2MeasuredHTML` appends "(1 of N)"
   /"（N 項中的第 1 項）" when `g.count > 1`, so a group's first-instance measurement is
   never presented as if it applied to the whole group. Verified both with a synthetic
   `{viewport, error}` specimen: renders `10 measured (1280x900)`, not both labels.

7. **MEDIUM-2a (CHANGELOG @2)**: added the engine-bump bullet (4 defect fixes + evidence:
   Mailchimp disabled button, Wix/Atlassian/linear.app background resolution, wayfair
   settle, zoom.us context destruction) and the tier-2 report-rendering bullet.

8. **MEDIUM-2b (VALIDATION L2)**: extended the Background-resolution bullet with the 3
   new triggers + dark-canvas rule; added a new disabled/`aria-disabled` **contrast**
   exemption bullet (citing WCAG 1.4.3, Mailchimp + en.wikipedia.org evidence); added
   `SETTLE_QUIET_MS = 500` with the wayfair measurement and its relationship to L0's 2s
   settle recipe (LOW-2); added per-viewport error capture as a resilience bullet; updated
   the fixture bullet to list all six tier-2 fixtures.

9. **MEDIUM-3 (merge example)**: pulled forward (done during step 3, before its
   `VALIDATION.md` paste, per the audit's own explicit sequencing note in step 9's text).
   Derived and double-verified on `test/golden/clean.html`: baseline 100/23%, +1 fail
   still 100/23% (`insufficient-evidence`), +3 fail → 64/36% (`scored` at 0),
   `confidence_level` stays `low` throughout. Replaced `core/content/inspect.md:602-606`,
   ran `node build.mjs`, and corrected the same 56/44/23 → 100/64/23/36 numbers in
   `plans/2026-07-26-merge-scoring-note.md` before its text was pasted into
   `VALIDATION.md` step 3.

10. **Calibration broad-pass (100291.html:2790)**: added `sawImgChild` tracking (an
    `<img>` void tag marks its parent stack frame) and `blocksClimb` (a
    `position:absolute`/`fixed` element whose parent already has an `<img>` child) to
    `computeStaticContrastFindings`'s ancestor walk in `core/scripts/static-audit.mjs`.
    When the climb reaches a `blocksClimb` frame with no bg of its own, it stops as
    unresolved instead of continuing to a further, visually-unrelated ancestor. Added a
    regression test + a control test to `test/static-contrast.test.mjs`. **Caught my own
    first draft being wrong**: the first fixture used `<div class="carousel-item">` for
    flavor, which accidentally triggered the PRE-EXISTING "unresolved class blocks the
    walk" rule (2026-07-25 finding) regardless of this fix, making the test pass for the
    wrong reason. Verified empirically (temporarily forcing `blocksClimb = false` in the
    tracked file, confirming the bug reproduces, then restoring) that a classless fixture
    is required to isolate this fix's actual contribution; rewrote the test fixture
    classless and re-verified. No `.mjs` diff survives from the temporary check
    (`git diff --stat` shows only the real fix). Folded into the **existing**
    `beacon-static-audit@11` engine string, no `@12` bump — this pass landed in the same
    uncommitted batch as @11 (per the audit's HIGH-4 reconciliation instruction).
    Documented as "Round 3" of the existing FP-calibration narrative in `VALIDATION.md`'s
    L1/L2 Workstream B section and as an addition to CHANGELOG's static-contrast bullet.
    The real `100291.html` corpus file was not available on this machine (it lived only
    in a different agent's session scratchpad per its own methodology notes, already
    gone) — verification used a fixture reproducing the exact reported structure
    (`aria-label`, inline styles, `<img>` sibling, distant white-bg ancestor) instead of
    the literal corpus file.

## Deviations from the literal audit text

- Test count in `VALIDATION.md`'s release-gate comment: the audit said "381 tests" (its
  own measured baseline before any of these fixes). Adding the HIGH-1 pipeline test and
  the step-10 regression+control tests brought the real total to **384**. Used the
  actual final count from a bare `node --test` run rather than the audit's now-stale
  number.
- HIGH-2's "preferred, still small" variant taken for the engine side only (see step 2
  above) — the report side kept the audit's literal required text.

## Final verification (this tree, after all 10 steps)

- `node --test` → **384 pass / 0 fail**.
- `node build.mjs --check` → `all 50 outputs match core.`
- HIGH-1 three-command sequence → `tier2-provenance chip: true`, `tier2-measured line: true`.
- Fresh landing-report self-scan → score 86, **0 critical / 0 warning**, 4 tips (unchanged
  from the pre-fix baseline).
- Horizontal scroll, 320 and 1280 width, on the regenerated landing report →
  `scrollWidth - clientWidth = 0` at both.
- `git status --porcelain test/` → no `??` entries.
