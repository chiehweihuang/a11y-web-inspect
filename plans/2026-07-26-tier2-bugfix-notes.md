# Tier-2 detector bugfixes (2026-07-26)

Fixes for the four real detector defects confirmed in `plans/2026-07-26-tier2-calibration.md`'s
"6 blockers" section (items 2-5; item 1 is a corpus/capture-methodology gap, not a detector
bug, and item 6 is sampling methodology for a future calibration run -- neither is a code fix).
Engine provenance bumped `beacon-tier2-audit@1` -> `beacon-tier2-audit@2` (emitted findings
change: fewer false contrast-fails, one new artifact shape for crashed viewports).

## 1. Non-ancestor backgrounds (Finding B) -- `core/scripts/tier2-audit.mjs`

The calibration report hypothesized three mechanisms (pseudo-element background, inset
box-shadow, non-ancestor sibling/cousin). All three are now detected and marked
`tier2-contrast-unresolvable` instead of a guessed pass/fail:

- **Pseudo-element bg**: `getComputedStyle(node, '::before'/'::after')` checked for a
  generated box (`content !== 'none'`) with a resolved background, on the element and every
  ancestor visited during the bg walk.
- **Inset box-shadow**: `/inset/.test(boxShadow)` on the same walk (non-inset/drop shadows are
  NOT flagged -- confirmed harmless on an ordinary decorative card shadow in the fixture).
- **Non-ancestor overlay**: a geometric rect-overlap scan over every element in the document,
  checking for a non-ancestor whose rect overlaps the sample's rect and which has a resolved
  background/box-shadow. Chose a manual scan over `document.elementsFromPoint` because
  `elementsFromPoint` silently EXCLUDES `pointer-events: none` elements from hit-testing, and
  that is exactly how the two real confirmed cases are built (a Wix `bgLayers` sibling div and
  an Atlassian `aria-hidden` sliding-tab-indicator div, both `pointer-events: none`).

**A fourth mechanism, not in the original hypothesis, was found and fixed during
verification**: linear.app's hero text resolves to a fully transparent ancestor chain (html,
body, and every wrapper all report `backgroundColor: rgba(0,0,0,0)`), yet the page renders on
a solid near-black canvas because `html { color-scheme: dark }` is set. The compositor
hardcoded `{r:255,g:255,b:255}` as the default canvas, which is exactly backwards for a
dark-color-scheme page. Fix: when the ancestor walk finds no opaque background at all
("defaults to canvas"), check `getComputedStyle(document.documentElement).colorScheme` (computed
once, page-wide); if it includes `dark`, mark unresolvable instead of asserting white.

Verified against the real snapshots named in the calibration report
(`beacon-benchmark-100/run-2026-07-05/snapshots/{81,77,91}.html`): all 4 originally-confirmed
elements (Wix "Get Started" + "Thriving with Wix", linear.app's two hero-text spans, Atlassian's
`#tab-teamwork` pill) now report `tier2-contrast-unresolvable` instead of a false
`tier2-contrast-fail` at ratio ~1.

Cost: the overlap scan is O(elements-needing-the-check × total-elements-on-page); on wix.com
(2.2MB snapshot, largest of the three) the full two-viewport audit still completed in ~4s.
`# ponytail: full-document rect scan, not spatially indexed -- narrow to a bounded ancestor
subtree first if a future page is measured too slow.`

## 2. Disabled controls (Finding C) -- one-line fix

`browserCollectContrastSamples`'s `isHidden()` now also excludes `[disabled]` and
`[aria-disabled="true"]` (via `el.closest(...)`, mirroring the existing `[aria-hidden]`/`[hidden]`
pattern), per WCAG 1.4.3's exemption for "incidental text ... that is part of an inactive user
interface component." Mirrors the `el.disabled` check `browserCollectTouchTargets` already had.

## 3. Determinism (Finding D) -- settle delay

`runTier2Audit` now waits for the `load` event (best-effort, 5s timeout + swallow, since
aborted subresources may prevent it from firing on some sites) and then a fixed
`SETTLE_QUIET_MS = 500` quiet window, after `domcontentloaded` and before any capture.

**Trade-off note (VALIDATION.md-style, written here per this task's file-ownership
boundary):** the calibration report measured stability on the wayfair.com PerimeterX snapshot
at 0ms (1 finding, unstable) vs 300ms/1000ms/3000ms (5 findings, stable from 300ms on).
`SETTLE_QUIET_MS = 500` gives a ~200ms safety margin above the measured stabilization point,
at a cost of +500ms x 2 viewports = ~1s per site (plus whatever `waitForLoadState('load')`
adds, best-effort and usually near-zero once subresources have already settled). Verified via
an automated test (`settle.html` fixture, a 150ms-deferred DOM mutation) that 3 full repeated
`runTier2Audit` runs on the same page produce byte-identical `findings` arrays.
`# ponytail: fixed delay, not adaptive (e.g. mutation-observer-based quiescence) -- revisit if
a real site needs longer than 500ms to settle its deferred UI.`

## 4. Crash guard (Finding E) -- try/catch per viewport

`runTier2Audit`'s per-viewport loop now wraps goto/settle/capture/analyze in a try/catch;
on error, it records `{ viewport, error: <message> }` in `summary.by_viewport` for that
viewport and continues to the next one, instead of throwing and killing the whole process.

Verified two ways: (1) a deterministic unit test injecting a fake `playwrightModule` whose
`page.evaluate` always throws the exact zoom.us error message; (2) the real zoom.us snapshot
(`beacon-benchmark-100/run-2026-07-05/snapshots/87.html`), re-run 3 times -- the navigation
race reproduced in all 3 runs (on a different viewport each time, consistent with it being a
genuine race), each time caught cleanly with a per-viewport `error` entry and the CLI exiting 0
with the other viewport's findings intact.
