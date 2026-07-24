# Hakuso audit — Beacon v3.2.0 Workstream B (report IA port into the generator)

Audited: uncommitted tree at `C:/Code/personal/beacon` (`core/scripts/generate-report.mjs`
+ two generated copies + `test/generate-report-category-disclosure.test.mjs`).
All probes run first-hand. Tmp artifacts in `C:/Users/tacit/.claude/jobs/f448fc13/tmp/hakuso/`.

## Verdict

**PASS** (upgraded from PASS WITH FIXES after re-verifying the current tree — see
"Re-verification" at the bottom, which is the authoritative result). The producer's late
fixes resolved the one HIGH (unstable target / transient SyntaxError / stale copies): the
current tree parses, copies are synced 48/48, the backtick-comment trap is reworded, and I
re-ran every probe green — including a real-browser computed-style check on `<pre>`. No
CRITICAL/HIGH outstanding. Residual items are LOW advisories plus one MEDIUM recommendation
(not a merge gate).

The body below is the original first-snapshot audit; the HIGH it raised is now closed.

## What I verified first-hand (all green)

- **Data-driven, no mockup-stale hardcoding.** Regenerated the rakuten specimen from
  `beacon-benchmark-100/run-2026-07-05/audits/97.json`. Report renders overall **54**,
  coverage **49%**, confidence **low** — the artifact's real @9 numbers, NOT the mockup's
  40 / 66% / medium. Evidence-meter widths (100 / 28 / 20 / 10%) match
  `evidenceWidth(n)=round(10·log2(n+1))` for all six categories' check counts
  (992/6/3/1). `fix-these-next` is severity→count sorted, top-3 stable (×88, ×44, ×1;
  "完成前 3 項…可涵蓋 133 個發現項（占全站發現的 97%）"). Tension card fires correctly on the
  crushed screenreader score ("87% 通過率，分數卻是 3"). `confidenceLine()` derives from
  `metadata.confidence_level` + `summary.coverage_percent` with documented threshold 60.
- **Self-scan clean.** Ran the engine (`static-audit.mjs`) ON the generated report:
  **0 critical, 0 warning**, 3 tips only (`meta-description-missing`, `canonical-missing`,
  `jsonld-missing` — expected for a local, non-crawlable artifact). Heading outline
  h1→h2→h3→h4 with no skip (engine's `heading-level-skipped` critical did not fire).
- **Font / layout gates.** PMingLiU appears only in a CSS comment (zero font-family
  refs). No bare `minmax(Npx,1fr)`; grids use `minmax(min(240px/280px,100%),1fr)` or rem
  floors; the two grids the notes claim to have fixed (`.manual-check-grid`,
  `.risk-grid`) are confirmed fixed. No `vh/dvh/svh` content-height units. No bare
  `monospace`/`serif`. `pre,code,kbd,samp` carry `var(--mono)`.
- **A11y of the output.** Light default + dark via `prefers-color-scheme` + explicit
  toolbar override; body 16px; `:focus-visible` 3px; `prefers-reduced-motion` block;
  print styles; toolbar = native `<button>` with `aria-pressed` + 44px targets +
  group `aria-label`; filter buttons carry bilingual accessible names; `lang` attrs on
  every zh (`zh-Hant`) / en span; skip link present. Primary accent `--beacon:#b4530a`
  ≈5:1 on white — passes AA.
- **`--previous` (producer flagged unverified).** Generated with a synthetic previous
  (overall 40, screenreader 10, agent 80). Renders correctly and arithmetic checks out:
  hero 54 vs 40 = **+14**; per-card screenreader **−7**, agent **+20**, keyboard/forms
  **--**. Self-scan of the `--previous` report also clean. Concern resolved.
- **Test rewrite legitimate.** Preserves original intent — state-badge-never-number
  (strengthened: `doesNotMatch data-category="responsive"…score-badge`), URL escaping
  (`&amp;`), bilingual testing recs, real finding location/fix visible. Removed
  assertions were bound to deleted markup only. No weakening. Passes (exit 0).
- **Build sync + sections 05/06/07.** `node build.mjs --check` → all 48 outputs match
  core. Methodology (05) + Legal (06) render and are wired into jump-nav; Performance
  (07) correctly ABSENT for a no-lighthouse artifact. Integration reuses the pre-v3.2
  render functions verbatim inside the new scrolling/eyebrow layout — clean append.
  Dispatcher's KEEP ruling upheld.

## Findings (original snapshot)

### HIGH — NOW RESOLVED
1. **Audit target was not frozen — concurrent edit transiently broke the build.**
   Mid-audit, `node core/scripts/generate-report.mjs` threw
   `SyntaxError: Unexpected identifier 'monospace'` at `generate-report.mjs:1962` — a CSS
   comment copied from the mockup contained literal backticks that terminated the JS
   template literal. Simultaneously the disclosure test failed and `build.mjs --check`
   reported 2 stale copies. **Resolved by the producer's late fixes** (comment reworded
   backtick-free; copies rebuilt). Confirmed in Re-verification below.

### MEDIUM
2. **Backtick-in-CSS-comment footgun in a template-literal generator.** The whole
   HTML/CSS is a backtick template literal, and the mockup's font-stack comments use
   backticks. The live instance is fixed, but nothing prevents recurrence when copying
   mockup CSS. Cheap guard: keep this file's CSS comments backtick-free and make
   `node --check core/scripts/generate-report.mjs` a pre-commit/build step. Recommendation,
   not a merge gate.

### LOW
3. **Double `<h2>` in the client section** — layer heading (`:1180`) + exec-card heading
   (`:1185`). Not a heading-order violation (self-scan clean), matches the mockup. Cosmetic.
4. **Filter chips `min-height:38px`** (`:2113`) vs. 44px toolbar. Passes WCAG 2.5.8 AA
   (24px floor); below the 44px AAA target. Matches the approved mockup.
5. **Theme-toggle buttons named via `title` only** (☀/☾/A glyphs). Title supplies an
   accessible name; `aria-label` would be more robust. Matches the mockup.
6. **Dead I18N keys retained** (`tab_*`, `rem_p0/p1/p2`, `th_*`, …). Inert, zero impact.
7. **`.axe-outcome-list li` uses `minmax(12rem,1fr)`** — below the ~20rem CJK floor.
   Ported pre-v3.2 CSS, Latin axe titles, doesn't render for Tier-1 artifacts.
   Pre-existing.

## Re-verification (current tree — AUTHORITATIVE)

Re-pulled `git diff` after the producer's late fixes and re-ran every probe against the
CURRENT tree. The five named deltas confirmed: `--sans` carries "Hiragino Sans";
`pre,code,kbd,samp{font-family:var(--mono)}` added; the backtick comment reworded (core
parses); fix-these-next `covered` count bolded; print forces `.lang-zh,.lang-en{color:#333}`.

- `node --check core/scripts/generate-report.mjs` → **OK**; `node build.mjs --check` →
  **all 48 outputs match core** (no stale copies).
- Fresh specimen regen + engine self-scan → **0 critical, 0 warning**, 3 expected tips.
- Disclosure test → **exit 0**.
- Font grep: PMingLiU only in a comment; `pre,code,kbd,samp{font-family:var(--mono)}`
  emitted (line 152 of the output); 0 bare `minmax(Npx,…1fr)`, 0 `vh/dvh/svh`, 0 bare
  `monospace`/`serif`.
- Delta renders: `可涵蓋 <b>133</b> 個發現項（占全站發現的 97%）`; `.lang-zh,.lang-en{color:#333}`
  in `@media print`.
- **Real-browser computed style** (chromium headless, ms-playwright build 1228, loading
  the generated report via `file://`):
  - `--mono` custom property resolves non-empty; `--sans` includes "Hiragino Sans".
  - `body`: `Arial, "Segoe UI", system-ui, …` at `16px`.
  - `<pre>` computed `font-family` =
    `ui-monospace, "Cascadia Code", Consolas, SFMono-Regular, "Noto Sans Mono", "Noto Sans TC", "Yu Gothic UI", Meiryo, "Microsoft JhengHei", monospace`
    → CJK sans faces before the terminal `monospace`; `preIsBareMonospace = false`. The UA
    `pre{monospace}` override trap is **closed at the computed level** — CJK in code can
    never fall back to a Ming/Mincho face. (`preResolvesToMono`/`codeResolvesToMono` read
    `false` only because chromium re-serializes the font list with spaces/unquoting; the
    resolved stack is correct.)

Conclusion: current tree is settled, self-consistent (copies synced), and passes every
blocking gate. **PASS.** Standard caveat: the commit should include the synced generated
copies (currently synced); if the tree is edited again, re-run `build.mjs --check` + the
disclosure test before merge.

---

# Hakuso audit — v3.2.0 USER REVIEW ROUND (uncommitted diff on da1d5b4)

Second gate, distinct from the WS-B port audit above. Target: the frozen uncommitted
diff (9 review-round changes) over commit `da1d5b4`. All probes first-hand; artifacts in
`C:/Users/tacit/.claude/jobs/f448fc13/tmp/hakuso/`. Tree left exactly as found (10 modified
tracked files unchanged, no probe leakage, golden vectors untouched).

## Verdict

**PASS.** No CRITICAL, no HIGH. Two LOW advisories (below). Every blocking proof is green.

## Proofs run first-hand (all green)

- **Test suite** `node --test` → **330 pass / 0 fail** (328 base + 2 from the new
  `generate-report-standard-coverage.test.mjs`; reconciles the 330 target).
- **Build sync** `node build.mjs --check` → **all 48 outputs match core**. Copies are
  byte-identical to core (`diff -q` on both scripts, both root + codex adapter).
- **No scoring drift.** `DETECTOR_VERSION = 'beacon-static-audit@9'` unchanged. static-audit
  diff touches ONLY `snippetAt` (display `code_before`) + its call sites passing
  `m[0].length` — evidence strings never enter scoring (`addCheck`/`addFinding` counts and
  severity are untouched). `confidenceLine`/`CONFIDENCE_COVERAGE_THRESHOLD` removed with
  **0 dangling refs** across core/scripts/adapters.
- **Rakuten regen + self-scan** from `beacon-benchmark-100/run-2026-07-05/audits/97.json`:
  overall 86, coverage 36%, **0 critical / 0 warning / 3 tips** (meta-description /
  canonical / jsonld — expected for a local artifact). `standard-line` renders 9× bilingual
  (標準/Standard). Artifact JSON keeps `confidence_level`; display drops it from hero+masthead
  only (Methodology §05 `信心水準：low` + footer retain it by design — pre-existing, NOT in
  this diff).
- **Evidence clamp** (static-audit `SNIPPET_MAX_CHARS=300`): minified single-line pages →
  max `code_before` = **192** (match near line end), **302** (centered, 300 window + 2 “…”),
  **301** (oversized 500-char match branch). Bounded ≤~302 in every branch.
- **Horizontal-scroll ban** (chromium headless 1228, `file://`, `documentElement.scrollWidth`
  vs `clientWidth`): rakuten + life-safety + both shipped `docs/reports/*.html` →
  **overflow 0px at 320 and 1280** (broken-fixture, full of violations, still 0). PASS.
- **Life-safety two-state** (fixture `plans/2026-07-23-life-safety-fixture/audit.json`,
  `life_safety_flag=true`): `<section class="life-safety-banner">` @28864 renders AFTER
  `</style>` @25744 and BEFORE `<div class="ring">` @29645 → **banner above score**; the
  green “未觸發” row is **absent** when the flag is on. Self-scan of that report still
  0 crit / 0 warn.
- **「標準」 accuracy spot-check** vs `core/references/wcag-quick.md` — all correct:
  image-alt-missing→1.1.1, meta-description-missing→explicitly “NOT WCAG, AEO convention”
  (honest), document-title-missing→2.4.2, viewport-zoom-disabled→1.4.4 (200%),
  viewport-meta-missing→1.4.10 (320px reflow), clickable-non-button→2.1.1,
  input-label-missing→3.3.2, button/link-name→4.1.2, main-landmark/list-non-li→1.3.1.
- **Two new tests meaningful.** Test 1: structural — every engine-emittable key has a
  bilingual `standard` (`>=20` floor guard + `deepEqual([])`). Test 2: generates a real
  report, asserts standard-line wording renders AND `standardIdx < fixIdx`. No trivial
  assertions. Render guard checks `zh?.standard`; safe because test 1 enforces en too.

## Findings

### LOW
1. **`headings-missing` → WCAG 2.4.6 citation is slightly imprecise (uncertain).** 2.4.6
   governs headings *where present*; a page with zero headings has no SC that strictly
   *mandates* headings (1.3.1 is the cleaner cite). The statement hedges honestly (“where
   present / 已存在的標題”) and `wcag-quick.md:14` itself pairs heading structure with 2.4.6,
   so it is defensible for a teaching product — flagging only for transparency, not a gate.
2. **`capSnippet` slices at 500 UTF-16 code units before escaping** (`generate-report.mjs`
   `RENDER_SNIPPET_MAX_CHARS`). A surrogate pair split exactly at 500 yields one broken glyph
   at the boundary. Cosmetic; capture-side 300 clamp means render rarely reaches 500.

## Required fixes

None (no CRITICAL/HIGH). LOW items are optional.
