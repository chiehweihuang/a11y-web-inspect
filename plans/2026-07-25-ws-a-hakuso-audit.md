# Hakuso audit — v3.3 Workstream A: Tier-2 native measurement harness

Target: frozen uncommitted tree on `e35f51b` (new `core/scripts/tier2-audit.mjs` + 2 generated
copies, `test/tier2-audit.test.mjs`, `test/tier2-fixtures/`, manifest registration, VALIDATION.md
L2, ci.yml `tier2-browser` job). All probes first-hand; artifacts in
`C:/Users/tacit/.claude/jobs/f448fc13/tmp/hakuso2/`. Tree left exactly as found (4 modified +
6 untracked WS-A files; no probe leakage; static engine untouched).

## Verdict

**PASS WITH FIXES.** One HIGH (touch-target spacing exception deviates from WCAG 2.5.8), one
MEDIUM (transparent-foreground false contrast fail). Neither corrupts scoring — tier-2 is
findings/evidence only, pre-calibration (step-4 wiring deferred) — so this is not a BLOCK, but
both should be fixed before the wild-FP measurement and before step-4.

## Verified green (first-hand)

- **Contrast math correct.** Hand-recomputed 4 fixture cases + 1 independent control:
  gray119/white=4.478, gray153/white=2.849, gray140-bold@18px=3.363 (correctly NOT large →
  requires 4.5 → fail), rgba(0,0,0,0.5)/white→rgb(128,128,128)→black=5.317. WCAG relative-
  luminance (0.03928 knee, 0.2126/0.7152/0.0722, (L+0.05) ratio), large-text 24px / 18.6667px-bold
  all per SC 1.4.3.
- **Honesty boundary correct.** Adversarial probe (text over CSS gradient + nested rgba layers +
  fixed overlay) → `tier2-contrast-unresolvable`, NO guessed ratio. A control with the SAME nested
  semi-transparent layers but a SOLID white base correctly resolves and computes 2.207:1 (hand-
  verified ~2.21) — proving gradients force unresolvable while alpha layers alone composite. Any
  `background-image`/gradient in the ancestor walk before opacity → unresolvable; opaque layer
  correctly occludes an image behind it.
- **Multi-layer alpha compositing** verified through the nested control (bg rgb(204,204,204) from
  transparent→rgba(0,0,0,0.2)→rgba(255,255,255,0.3)→#fff).
- **Determinism.** Two CLI runs, fixed `--date`, byte-identical. `SOURCE_DATE_EPOCH`/`--date`
  honored. Artifact carries NO `overall_score` (good); finding shape matches static tier
  (level/key/category/severity/check/wcag/title/affected_users/location/description/fix) + `source:
  beacon-tier2-audit@1` + selector/viewport/computed.
- **Loader precedence + loud-skip.** `PLAYWRIGHT_MODULE_PATH` is authoritative — a bad value throws
  and does NOT fall through (proved: `PLAYWRIGHT_MODULE_PATH=/nowhere node --test` → 346 pass, **2
  loud skips** `# tier2: playwright unavailable on this machine`, 0 fail; if it had fallen through
  to the global dev-browser playwright the fixtures would have RUN). Loader unit test asserts the
  exact throw.
- **Tests + build.** Bare `node --test` = **348/348, 0 fail** (fixture tests ran against real
  Chromium via the global dev-browser playwright). `node build.mjs --check` = **all 50 outputs
  match core**. tier2 copies byte-identical to core. Static `static-audit.mjs`/`generate-report.mjs`
  untouched (only manifest registration).
- **CI job.** `tier2-browser` (ubuntu-latest) installs Playwright into `/tmp/pw-install` (scratch,
  not the repo), sets `PLAYWRIGHT_MODULE_PATH`, runs `node --test` + `build.mjs --check`. Pure
  addition; existing `test` job and validation matrix untouched; no repo pollution.
- **VALIDATION.md L2** present and thorough for every threshold (contrast minima, large-text
  definition + the 700-bold calibration caveat, background-resolution boundary + the 83%-unresolvable
  rakuten measurement, touch floor, 44px advisory, unimplemented 2.5.8 exceptions, FP-not-yet-measured
  caveat).

## Findings

### HIGH
1. **Touch-target spacing exception uses circle-vs-rect where WCAG 2.5.8 requires circle-vs-circle
   for undersized neighbors — under-detects.** `core/scripts/tier2-audit.mjs:186` (helper
   `circleOverlapsRect` at `:102`). SC 2.5.8 spacing: a 24px-diameter circle centered on each
   undersized target must not intersect another target OR *the circle for another undersized target*.
   The code tests the undersized target's 24px circle against every neighbor's **bounding rect**; for
   an undersized neighbor the SC uses that neighbor's 24px **circle** (larger), so the code's region
   is too small. **Demonstrated:** two 10×10 targets, centers 20px apart (< 24) →
   `analyzeTouchTargets` emits `0 fail, 2 advisory`; SC intersects the circles (distance 20 < 24) →
   both are violations. The fixtures only exercise touching-edge pairs (`#crowded-a/b`, centers 16px),
   where circle-vs-rect and circle-vs-circle happen to agree, so the gap (centers ~12–24px apart) is
   untested. Direction is false-negative and tier-2 is unscored, but a standards-measurement product
   telling a user "passes 2.5.8 spacing" when it fails is wrong teaching of the cited SC.

### MEDIUM
2. **`color: transparent` text produces a false `tier2-contrast-fail` at 1.00:1.**
   `core/scripts/tier2-audit.mjs:148-151`. `parseColor('rgba(0,0,0,0)')` returns `{a:0}` (not null),
   so `if (!fg) continue` does not catch it; `compositeLayers([fg(a=0), ...bg])` drops the invisible
   ink → `effectiveFg === effectiveBg` → ratio 1.00 → fail. **Demonstrated:** fg `rgba(0,0,0,0)` /
   white bg → `tier2-contrast-fail`, computed fg=bg=rgb(255,255,255), ratio 1:1. `color:transparent`
   text (icon-font / image-replacement patterns) is a real FP source; contained by "findings-only,
   FP calibration pending," but deterministically wrong and cheap to guard now.

### LOW
3. **VALIDATION.md L2 mischaracterizes the spacing exception as "the SC's own technique."** It is a
   circle-vs-box simplification, not the SC's circle-vs-circle for undersized-undersized pairs. Update
   alongside fix #1 (or state the deviation explicitly if the simplification is kept intentionally).

## Required fixes

- **#1 (HIGH):** in `analyzeTouchTargets`, when the neighbor `other` is itself undersized
  (`width < 24 || height < 24`), test circle-vs-circle — intersect iff center distance `< TOUCH_FLOOR_PX`
  (24) — instead of `circleOverlapsRect`; keep `circleOverlapsRect` for full-size neighbors. Add a
  fixture pair at centers ~20px apart (both undersized) that must FAIL. Update VALIDATION.md L2 wording.
- **#2 (MEDIUM):** at `:148` guard invisible ink — `if (!fg || fg.a === 0) continue;` (no visible
  text → no contrast finding). Add a synthetic test asserting a transparent-fg sample emits nothing.

---

## Second pass (2026-07-25) — fixes verified

**Verdict: PASS.** Both prior findings resolved and regression-tested; tree frozen, probes in tmp only.

- **HIGH #1 fixed** (`core/scripts/tier2-audit.mjs:203-211`): undersized neighbor → circle-vs-circle
  (`center distance² < 24²`), full-size neighbor keeps `circleOverlapsRect`. First-hand:
  10×10 centers 20px → **both FAIL**; boundary 23.9px → both fail, 24.0px → clears (SC `< 24`
  intersect). Full-size case still rect geometry: 10×10 beside a 44×44 whose rect enters the circle
  → #small fails; move the 44×44 out of the circle → #small advisory only (no fail). New fixtures
  `#gap-fail-a/b` (fail) + `#gap-pass-a/b` (advisory) lock the band.
- **MEDIUM #2 fixed** (`:159`, `if (!fg || fg.a === 0) continue`): `rgba(0,0,0,0)` fg → **0 findings**
  (was a false 1.00:1). `#transparent-fg` fixture asserts zero.
- **LOW #3 fixed**: VALIDATION.md L2 now states circle-vs-circle for undersized neighbors and
  explicitly retracts the "SC's own technique" wording.
- **No regression:** `node --test` 351/351, `build.mjs --check` 50/50, determinism byte-identical,
  contrast math unchanged (fixture set unregressed). Static engine still untouched.
