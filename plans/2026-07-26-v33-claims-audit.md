# v3.3.0 pre-release claim-vs-code audit (hakuso)

Audited state: `master` @ `7453725` (engine `beacon-static-audit@11`, `beacon-tier2-audit@1`).
Two files were uncommitted in the working tree at audit time (`core/scripts/generate-report.mjs`,
`test/generate-report-standard-coverage.test.mjs`, another agent's in-flight work) — every
verification below ran against a clean export of the committed index
(`git checkout-index -a -f --prefix=<scratch>`), not the dirty worktree.

## Verdict

**FIX-BEFORE-RELEASE.** Nothing needs new code or new measurement. But five public
statements are outright false today, one public number contradicts the artifact it links
to, one is unverifiable from any committed artifact, and the release metadata (CHANGELOG
entry, version bump) does not exist yet.

## Verification runs (evidence base)

| What | Command | Result |
|---|---|---|
| Landing coverage under @11 | `node core/scripts/static-audit.mjs --scope https://chiehweihuang.github.io/beacon/ --url … docs/index.html` | `overall_score 100`, `coverage_percent 23`, 1 finding (the new `contrast-not-verified` tip), engine `beacon-static-audit@11+ruleset.25eeae0aa809` |
| Same with `docs/style.css` added | same + `docs/style.css` | identical: 100 / 23% |
| Broken-fixture demo under @11 | `node core/scripts/static-audit.mjs --scope beacon-golden-fixture … test/golden/dirty.html` | `overall_score 0`, 18 findings (13 critical, 1 warning, 4 tips) |
| Test suite at HEAD | `node --test` (clean export) | tests 375 / pass 375 / fail 0 / skipped 0 |
| Build parity at HEAD | `node build.mjs --check` (clean export) | `all 50 outputs match core` |
| GT artifacts | `benchmark/2026-07-06-ground-truth/pr-analysis-v{6,8}.json` | v6 (@6): P 0.979, R-pat 0.712, R-inst 289/350 = 0.826, FP 1 · v8 (@8): P 1.000, R-pat 0.727, R-inst 290/350 = 0.829, FP 0 · Lighthouse identical in both: 0.811 / 0.462 / 78÷346 = 0.225 |
| GT scope | `aggregate-gt.mjs:30` | 10 criteria (`image-alt … meta-viewport-zoom`), `n_sites 20` — contrast is NOT among them |
| Design-impact backing | `git log -S"885 findings"`, `git log --diff-filter=D`, grep of repo + `C:/Code/personal/beacon-*` | no artifact, ever committed or deleted. Nearest committed figure: `benchmark/2026-07-05/results-engine6.json` sums to **930** findings over 85 sites-with-results (of 87 captured) |
| Thresholds cited in VALIDATION L2 | code | `THIN_EVIDENCE_MIN = 3` (`static-audit.mjs:90`), `LIFE_SAFETY_CAP = 49` + `2.3.1` (`:69-70`), `CONTRAST_NORMAL_MIN 4.5` / `CONTRAST_LARGE_MIN 3` / `LARGE_TEXT_PX 24` / `LARGE_TEXT_BOLD_PX 18.6667` / `TOUCH_FLOOR_PX 24` / `TOUCH_BEST_PRACTICE_PX 44` (`tier2-audit.mjs:45-50`), bold `>= 700` (`:321`), contrast gate `stats.contrast.pass > 0 \|\| stats.contrast.fail > 0` (`static-audit.mjs:1472`, `requires_live_audit` at `:1541`) — **all present, all matched** |
| Report tabs | grep `role="tab"\|tablist` in `core/scripts/generate-report.mjs` | zero hits; Lighthouse block is a *section* (`:1748`), not a tab |

## Claim table

Verdict key: **true** (verified) · **stale** (was true for an older engine/version, misleads now) · **false** (contradicts the code/data today) · **unverifiable** (no backing artifact).

### docs/index.html (landing, English)

| Location | Claim | Verified value | Verdict | Replacement |
|---|---|---|---|---|
| `docs/index.html:19` | `"softwareVersion": "3.0.0"` | plugin is 3.2.0, release is 3.3.0 | **false** | `"softwareVersion": "3.3.0"` |
| `:57` | "scores pages 0–100 across ten categories" | `CATEGORY_NAMES` has exactly 10 | true | — |
| `:97` | caption "20-site … 10 structural WCAG classes (2026-07)" | `n_sites 20`, `CRITERIA.length 10` | true | — |
| `:102` | column header "Beacon 3.0" | numbers below are engine @6; ships as 3.3.0 | **stale** | `Beacon 3.3 (engine @8 GT mapping)` |
| `:108` | precision `0.979` | @6: 0.979 · @8: **1.000** (finding-neutral @9→@11, see note) | **stale** | `1.000` |
| `:113` | pattern recall `0.712` | @8: **0.727** | **stale** | `0.727` |
| `:118` | instance recall `0.826` | @8: **0.829** (290/350) | **stale** | `0.829` |
| `:109,114,119` | Lighthouse `0.811 / 0.462 / 0.225` | identical in v6 and v8 artifacts | true | — |
| `:126` | "±1 point … (p95, 13-site recapture)" | VALIDATION `:335` median 0 / p95 1 / max 1, n=13 | true | — |
| `:128` | "cap at 49 … WCAG 2.3.1" | `LIFE_SAFETY_CAP = 49`, `LIFE_SAFETY_CRITERIA {'2.3.1'}` | true | — |
| `:131` | footnote: Lighthouse not ground truth; recall relative to candidate pool | satisfies VALIDATION L5 | true | — |
| `:138` | "all 885 findings the engine raised across an 88-site benchmark" | no committed artifact; benchmark is 87 sites / 85 with results / **930** findings at @6; @10+@11 add more | **unverifiable** (and stale) | re-derive from `benchmark/2026-07-05/` under @11 and state engine + exact N, or delete the quantified sentence |
| `:140-142` | "79% / 11% / 10%" visual-impact split | same missing artifact | **unverifiable** | as above |
| `:145` | "This page scores 100/100 (static tier, 23% of scoring weight measured)" | re-audited @11: **100 / 23%** | **true** — badge stays | — |
| `:152` | "Scores here are static-tier results" | reports are Tier 1 | true | — |
| `:155` | self-audit "100 · passes" | 100 | true | — |
| `:161` | broken fixture "9 · fails" | **0** — and the linked report itself renders `aria-label="overall score 0 of 100"` (`docs/reports/broken-fixture.html:485`) | **false** | `0 · fails` |
| `:163` | "17 findings, a stack of criticals" | @11: **18** findings, 13 critical | **stale** | `18 findings, a stack of criticals` |
| `:169` | "An 87-site paired benchmark, a 20-site ground-truth study, and a CJK fairness measurement" | 87 / 20 / `2026-07-07-cjk-fp/` | true | — |
| `:211` | footer "MIT · v3.0.0" | 3.3.0 | **false** | `MIT · v3.3.0` |
| — | no mention anywhere of the new native Tier-2 harness | new headline capability of 3.3 | omission, not a falsehood | optional: one line in "One plugin, three moments" or Evidence |

### docs/zh-Hant.html (landing, Traditional Chinese — same public surface)

| Location | Claim | Verified value | Verdict | Replacement |
|---|---|---|---|---|
| `:19` | `"softwareVersion": "3.0.0"` | 3.3.0 | **false** | `"softwareVersion": "3.3.0"` |
| `:102,109,114,119` | `Beacon 3.0` / `0.979` / `0.712` / `0.826` | as English row above | **stale** | `Beacon 3.3（引擎 @8 GT 對映）` / `1.000` / `0.727` / `0.829` |
| `:139,141-143` | 「88 站基準上抓出的全部 885 條問題」+ 79% / 11% / 10% | unverifiable, as English | **unverifiable** | re-derive or delete |
| `:146` | 「本頁 100／100 分（靜態層，量測到 **35%** 評分權重）」 | re-audited @11: **23%** | **false** — never updated when the English page went to 23% at `da1d5b4` | 「量測到 23% 評分權重」 |
| `:162` | 「9 分 · 不通過」 | 0 | **false** | 「0 分 · 不通過」 |
| `:164` | 「17 條問題」 | 18 | **stale** | 「18 條問題」 |
| `:211` | `MIT · v3.0.0` | 3.3.0 | **false** | `MIT · v3.3.0` |

### docs/reports/ (the "see for yourself" proof artifacts)

| Location | Claim | Verified value | Verdict | Replacement |
|---|---|---|---|---|
| `docs/reports/landing-self-audit.html:468,949` | `engine beacon-static-audit@9+ruleset.25eeae0aa809` | HEAD engine is @11; report predates the `contrast-not-verified` tip | **stale** | regenerate: `node docs/make-demos.mjs` (score stays 100; gains the 1 tip) |
| `docs/reports/broken-fixture.html:468,1236` | same @9 engine tag, 17 findings | @11: 18 findings, still score 0 | **stale** | same regeneration; then the landing gallery text must match (18) |

### README.md (English)

| Location | Claim | Verified value | Verdict | Replacement |
|---|---|---|---|---|
| `README.md:7` | landing "audited by its own engine (100/100, static tier, coverage stated in the report)" | 100 / 23% | true | — |
| `:23` | "an interactive HTML report — plus an optional **Performance tab**" | report has no tabs since the 3.2.0 IA redesign; Lighthouse is a section | **stale** | "…plus an optional Performance Signals section (Lighthouse performance/best-practices/SEO) when a browser is available." |
| `:51` | Tier 2 = "Browser evidence through Playwright and axe-core when available" | default Tier 2 is `scripts/tier2-audit.mjs` (plain Playwright, axe-free); axe is an optional ARIA-validity cross-check (`core/content/inspect.md:63,99,140,152`) | **stale** | "Browser evidence through Beacon's own `scripts/tier2-audit.mjs` (plain Playwright — contrast 1.4.3 and touch-target size 2.5.8 at 320px/1280px); axe-core is an optional cross-check for ARIA-validity rules." |
| `:54` | "prefer the live browser and axe-backed evidence" | axe no longer required | **stale** | "prefer the live browser evidence (Beacon's Tier-2 harness, plus axe if you ran it)." |
| `:82` | Version `3.2.0` | 3.3.0 at release | **stale** | `3.3.0` (covered by `.release.json` `readmeSync` — English only) |
| `:105` | "Categories without machine evidence report a state (`not-machine-checkable` / `not-applicable`)" | a third state ships since 3.2.0: `insufficient-evidence` when `pass+fail < 3` (`static-audit.mjs:90,1328`) | **stale/incomplete** | "…report a state (`not-machine-checkable` / `not-applicable`), and a category with only 1-2 machine checks reports `insufficient-evidence`, instead of a number" |
| `:132` | "**axe-core remains the accessibility engine**" | Beacon scores with its own engine — `static-audit.mjs` + `tier2-audit.mjs`; axe optional. Directly contradicts `core/content/inspect.md:320` | **false** | "…and Beacon's own engine (`static-audit.mjs` + `tier2-audit.mjs`) remains the accessibility signal." Also drop "the categories axe-core does not cover" → "the categories Beacon's engine does not cover". |
| `:173` | "Performance Signals **tab**, when present" | section, not tab | **stale** | "Performance Signals section, when present, …" |
| `:191-194` | "Recent highlights" stop at 3.0.0 | 3.1.0, 3.2.0 shipped; 3.3.0 pending | **stale** | add 3.3.0 (native Tier-2 harness, static contrast reference, axe optionalization) and 3.2.0 (`insufficient-evidence` state + report IA) |
| `:219` | "Static scanning cannot compute true contrast **from runtime CSS**" | @10 resolves certain literal pairs from the file only, review-severity, never scored | true as scoped | optional: mention the @10 static reference value as a capability |
| `:105` note | "seizure-risk finding (WCAG 2.3.1) caps the overall score into the 0-49 band" | verified in code | true | — |
| `:128` | Agent/AEO category contents | matches `AGENT_FILE_NAMES` + agent checks | true | — |
| `:138-145` | six jurisdictions | `metadata.jurisdictions` = 6, same list | true | — |

### Translated READMEs (8 files)

| Location | Claim | Verified value | Verdict | Replacement |
|---|---|---|---|---|
| `README.ja.md:48`, `ko:48`, `zh-Hans:48`, `zh-Hant:48`, `id:50`, `vi:50`, `th:50`, `hi:50` | "Plugin facts: `beacon`, version `3.2.0`" | 3.3.0 at release; `.release.json:9-11` `readmeSync` covers **README.md only** | **stale → false after release** | bump all 8 by hand, or add them to `readmeSync` |
| `ja:26`, `ko:26`, `zh-Hans:26`, `zh-Hant:26`, `id:28`, `vi:28`, `th:28`, `hi:28` | Tier 2 = "Playwright + axe-core" | native harness is the default; axe optional | **stale** | mirror the README.md:51 replacement in each language |
| `ja:29`, `ko:29`, `zh-Hans:29`, `zh-Hant:29`, `id:31`, `vi:31`, `th:31`, `hi:31` | "prefer live browser and axe-backed evidence" | as above | **stale** | mirror README.md:54 |
| `ja:7`, `ko:7`, `zh-Hans:7`, `zh-Hant:7`, `id:9`, `vi:9`, `th:9`, `hi:9` | intro "…live audit with Playwright and axe-core" | axe optional | **stale** | "…Playwright-based live audit (axe-core optional)" |
| `ja:60`, `ko:60`, `zh-Hans:60`, `zh-Hant:60`, `id:62`, `vi:62`, `th:62`, `hi:62` | two category states only | third state `insufficient-evidence` ships | **stale/incomplete** | mirror README.md:105 |
| all 8, category/score tables | 10 categories, 0-100, 0-49 life-safety band, 320px reflow | verified | true | — |
| all 8 | no GT numbers, no coverage %, no "validated against N sites" claim | — | true (nothing to fix) | — |

### VALIDATION.md

| Location | Claim | Verified value | Verdict | Replacement |
|---|---|---|---|---|
| `VALIDATION.md:107-175` | L2 Tier-2 thresholds (@1) | every cited constant found in `tier2-audit.mjs:45-50,208,321`; circle-vs-circle spacing implemented as described; 24px floor / 44px advisory as described | true | — |
| `:127-128` | "4.5:1 normal, 3:1 large — the SC fixes these" | `CONTRAST_NORMAL_MIN 4.5`, `CONTRAST_LARGE_MIN 3` | true | — |
| `:129-133` | large text `>=24px` or `>=18.6667px` + bold `>=700` | `LARGE_TEXT_PX`, `LARGE_TEXT_BOLD_PX`, `:321` | true | — |
| `:170-175` | rakuten smoke run 2914 findings, "not yet a wild FP measurement" | honest, self-limiting | true | — |
| `:177-228` | L1/L2 static contrast (@10), incl. the round-2 methodology correction | narrow-resolution rules match the code; `check:'review'` only; regression tests present in `test/static-contrast.test.mjs` | true | — |
| `:214-216` | round-2 basis "21 → **9** sites — below the initial ≥10-site bar, flagged explicitly" | broader FP calibration is **in flight** (task #1, another agent) | true but **pending** | after the broader run lands, replace the 9-site numbers; do NOT publish the in-flight numbers before they are written and reviewed |
| `:230-252` | @11 contrast gate is code-backed | `static-audit.mjs:1472,1541`; tip id `contrast-not-verified` at `:1475`; golden vectors each +1 finding, score unchanged (clean 100, dirty 0) | true | — |
| `:312` | Release gate "310+ tests, all green" | **375** tests at HEAD | stale (not false) | "375 tests, all green" |
| `:309-320` | release gate omits the tier-2 browser job | `.github/workflows/ci.yml` `tier2-browser` is the only job that exercises the harness | gap | add a line: "tier-2 browser tests must run somewhere (locally with Playwright resolvable, or the `tier2-browser` CI job) — a loud skip is not a pass" |
| `:324` | header "Measured state (2026-07-22, engine `beacon-static-audit@9`)" | HEAD is @11 (+ `beacon-tier2-audit@1`) | **stale** | "Measured state (2026-07-25, engines `beacon-static-audit@11` + `beacon-tier2-audit@1`)" |
| `:329-330` | GT rows "@8/@9: 1.000 / 0.727" and "0.829" | still the defensible current numbers (see note) | true but under-labelled | extend to "@8/@9/@10/@11" with the one-line neutrality argument below |
| `:328` | Spearman chain through @9 (0.468) | no @10/@11 benchmark rerun row | gap | add: @10/@11 add only `check:'review'` findings → score-neutral, no Spearman change expected; state whether a rerun was done |
| `:331-336` | @5/@7/@9 rows, CJK fairness, error bars | match CHANGELOG and benchmark dirs | true | — |
| `:338-357` | open items | items 1-2, 4-6 correctly struck; item 3 (cross-machine) still open | true | add the v3.3 open item: tier-2 categories are findings-only, wild FP measurement required before they can score |

### core/content/*.md (and their generated copies)

| Location | Claim | Verified value | Verdict | Replacement |
|---|---|---|---|---|
| `core/content/inspect.md:63,99,101,140,148,152,320,324` | native Tier 2 is the default; axe optional; tier-2 output is a separate findings-only artifact; scoring wiring undecided | matches code exactly (no auto-merge path; `--merge-findings` is the only route) | **true** — this file is the correct source of truth the READMEs contradict | — |
| `core/content/inspect.md:103` | contrast gate: must set `requires_live_audit` and emit the tip | now code-backed at `static-audit.mjs:1472-1541` | true | — |
| `core/content/inspect.md:103` | "18 of 50 sites in the 2026-05-31 survey" | recorded in `docs/contrast-cli-design.md:8`; raw data not committed | weakly backed (internal skill prose, not a public number) | acceptable; optionally cite the design doc inline |
| `core/content/inspect.md:119,128,134` | Tier coverage "~50% / ~75% / ~95% of WCAG criteria" | no committed derivation; tier-2 measures 1.4.3 + 2.5.8 only unless axe runs | **unverifiable** | label as rough orientation, e.g. "Coverage: roughly half of WCAG criteria (order-of-magnitude guide, not measured)" — or drop the numbers |
| `core/content/inspect.md:486-487` | three category states incl. `insufficient-evidence` | matches `scoreCategory` | true (the READMEs are the ones out of date) | — |
| `core/content/inspect.md:634` (+ `commands/inspect.md:620`, `adapters/codex/references/beacon-inspect.md:620`) | example `"tool_version": "beacon-static-audit@8"` | @11 | stale example | `beacon-static-audit@11` |
| `core/content/inspect.md:784` (+ generated copies `:770`) | ledger example `engine":"beacon-static-audit@9+ruleset.…` | @11 | stale example | `beacon-static-audit@11+ruleset.…` |
| `core/content/guide.md` | axe mentions are only "`alt="image"` passes axe" (`:65`) and a Playwright PDF note (`:352`) | no capability claim | true | — |
| `core/content/advisor.md:129` | "Test with keyboard and axe DevTools" | manual-tool recommendation, not an engine claim | true | — |
| all three | no coverage-percentage claims | grep for `%` → none | true | — |

### Plugin / marketplace metadata

| Location | Claim | Verified value | Verdict | Replacement |
|---|---|---|---|---|
| `.claude-plugin/plugin.json:3` | `"version": "3.2.0"` | release is 3.3.0 | **must bump** | `3.3.0` (release tool writes it per `.release.json:4-5`) |
| `.claude-plugin/plugin.json:4` | description: "Lighthouse-style 0-100 scoring across 10 categories, interactive HTML reports, jurisdiction-aware WCAG context, framework-specific fixes, and a PostToolUse hook…" | all true; silent on the Tier-2 browser harness (3.3's headline) | true but under-sells | optional: "…plus a native Playwright Tier-2 harness that measures real contrast and touch-target size." |
| `.claude-plugin/marketplace.json` | description, no version field | accurate | true | — |
| `CHANGELOG.md:3` | latest entry is `[3.2.0] — 2026-07-24` | three engine commits (`c2846d3`, `6e03fa0`, `7453725`) have no changelog entry | **missing** | write `## [3.3.0]` covering: `beacon-tier2-audit@1` (findings-only, scoring deferred), `beacon-static-audit@10` static contrast reference (review-only, score-neutral), `beacon-static-audit@11` axe optionalization + code-backed contrast gate; per VALIDATION `:322` record engine versions and whether GT/Spearman re-ran |
| `.release.json:9-11` | `readmeSync` = README.md only | 8 translations + 2 landing pages carry hardcoded versions | gap | extend `readmeSync` (or add a release checklist step for `docs/index.html`, `docs/zh-Hant.html`: footer + JSON-LD `softwareVersion`) |

### Adjacent public doc (outside the named scope, same staleness class)

| Location | Claim | Verdict | Replacement |
|---|---|---|---|
| `ROADMAP.md:45` | "Tier 2 live browser (Playwright + axe-core)" | **stale** | mirror the README.md:51 wording |
| `ARCHITECTURE.md:200` | comment `// e.g. "Tier 2 (live browser + axe-core)"` | stale example string | `"Tier 2 (live browser, Beacon-native)"` |

## Note — why 1.000 / 0.727 / 0.829 is the defensible number today

GT is a hand-adjudicated inventory (`aggregate-gt.mjs` reads per-engine status fields; there
is no `beacon_v11` field and no live-engine rerun). The @8 mapping carries to @11 because
every engine change since is out of GT scope or provably finding-neutral:

- **@9**: `total_findings` byte-identical @8→@9 on all 85 comparable benchmark sites,
  including all 7 `gt-remap-6` sites (VALIDATION `:333`, CHANGELOG `:36-41`) — `scoreCategory`
  never touches the findings array.
- **@10**: adds only `check:'review'` contrast findings. Contrast is not one of the 10 GT
  criteria (`aggregate-gt.mjs:30`), and GT's FP count comes from hand-curated
  `beacon_fp_v8` lists, so neither TP/FN nor FP can move.
- **@11**: adds exactly one `check:'review'` tip (`contrast-not-verified`) per audit —
  same argument, and verified empirically on benchmark snapshot #97 (one finding added,
  zero removed, score/critical/warnings byte-identical).

So the landing table may publish `1.000 / 0.727 / 0.829` **if** the column is labelled with
the engine (`@8` GT mapping) and the existing caption/footnote scoping stays. Publishing the
@6 numbers under a "Beacon 3.3" heading would be false; publishing them under "Beacon 3.0"
is historically true but reads as current and understates the engine by two GT revisions.

## Required fixes (ordered)

1. `docs/zh-Hant.html:146` — 35% → 23% (**false number**, English page has said 23% since `da1d5b4`).
2. `docs/index.html:161` + `docs/zh-Hant.html:162` — "9 · fails" → "0 · fails" (**false**, contradicts the linked report).
3. `README.md:132` — delete "axe-core remains the accessibility engine" (**false**, contradicts `core/content/inspect.md:320`).
4. `docs/index.html:19,211` + `docs/zh-Hant.html:19,211` — 3.0.0 → 3.3.0 (JSON-LD + footer).
5. `README.md:51,54` + the same rows in all 8 translations — Tier-2 description: native harness default, axe optional.
6. `docs/index.html:138,140-142` + `docs/zh-Hant.html:139,141-143` — re-derive the 885/88/79-11-10 split from `benchmark/2026-07-05/` under @11 (nearest committed figure is 930 findings over 85 sites-with-results), or delete the quantified sentence. As written it is unverifiable from a checkout, which the same section's line 93 promises.
7. GT table refresh: `docs/index.html:102,108,113,118` + `docs/zh-Hant.html:102,109,114,119` → `1.000 / 0.727 / 0.829` with the column labelled to the @8 GT mapping.
8. `CHANGELOG.md` — add the `[3.3.0]` entry; `.claude-plugin/plugin.json` — bump to 3.3.0; bump the 8 translated README version lines (or extend `.release.json` `readmeSync`).
9. `node docs/make-demos.mjs` — regenerate both demo reports at @11, then set the landing gallery finding count to 18 (`docs/index.html:163`, `docs/zh-Hant.html:164`).
10. `README.md:23,173` — "Performance tab" → "Performance Signals section" (no tabs since 3.2.0); `README.md:191-194` — add 3.2.0 and 3.3.0 to the highlights.
11. `README.md:105` + the 8 translations — document the `insufficient-evidence` state.
12. `VALIDATION.md:312,324,328-330` — 375 tests; header to @11 + `beacon-tier2-audit@1`; extend the GT rows to "@8-@11" with the neutrality argument above; note the pending broader contrast FP calibration at `:214-216`.
