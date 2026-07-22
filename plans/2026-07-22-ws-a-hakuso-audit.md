# Hakuso audit — Beacon v3.2.0 Workstream A (engine @9, thin-evidence category state)

Artifact: uncommitted working tree on `master`, repo `C:/Code/personal/beacon`.
Spec: `plans/2026-07-22-evidence-states-and-report-ia.md` (Workstream A).
Producer notes: `plans/2026-07-22-ws-a-validation-notes.md`.
Gate run: 2026-07-22. All probes run first-hand; claims not taken on trust.

## Verdict

**PASS** — spec-conformant, all 329 tests green, every producer claim independently reproduced. Two MEDIUM items flagged for arbitration/follow-up (neither blocks this merge; one is pre-existing, one is deliberate documented design). No CRITICAL/HIGH.

## What I verified (first-hand)

- **Diff vs spec**: `scoreCategory` (`core/scripts/static-audit.mjs:1087-1095`) adds exactly one branch — `if (auditable < THIN_EVIDENCE_MIN) return { state: 'insufficient-evidence', score: null }` — between the existing `auditable === 0` branch and the scoring path. `THIN_EVIDENCE_MIN = 3` (L84-86). Overall/coverage denominator already filters on `state === 'scored'` (L1236-1241), so an `insufficient-evidence` category exits both the weighted average and coverage with zero extra plumbing. Exactly the spec's design.
- **Boundary probe (team-lead #1)**: crafted 2-button and 3-button fixtures (keyboard is 1 pass per named button, review-only categories don't count toward `auditable`). Result: 2 checks → `insufficient-evidence`/`score:null`, keyboard out of denominator, coverage 23%. 3 checks → `scored`/`score:100`, coverage 36% (exactly +13 = keyboard's weight). Boundary is inclusive at N=3, precisely per spec.
- **Edge probe (team-lead #2)**: built a page whose only failing category is thin. `viewport user-scalable=no` → responsive 1 pass + 1 fail = 2 checks → `insufficient-evidence`, real WCAG 1.4.4 warning still emitted, overall 90 (pass band). Sharper variant: a lone `<div onclick>` with no keyboard handler → keyboard 0/1 = `insufficient-evidence`, a confirmed WCAG 2.1.1 **critical** excluded from the score, overall 85. Rendered report (`generate-report.mjs`) shows: verdict label + **critical count in the hero verdict line** ("1 higher priority"), `coverage 23%`, `confidence: low`, and the finding listed in full with the new `insufficient-evidence` badge (no ring). Producer's own test encodes the overall=100 variant as intended behavior (`test/static-audit-scoring.test.mjs`, "only failing category is thin"). Caveats ARE visible → does not meet the team-lead's HIGH bar ("inflated high overall with NO visible caveat"). See MEDIUM-2 for the residual tension.
- **Claims (team-lead #3)**: `node --test` → tests 329 / pass 329 / fail 0 (matches). `node build.mjs --check` → all 48 outputs match core. CHANGELOG numbers cross-check the validation notes exactly (Spearman 0.477→0.468; score-delta median|Δ|7 / p95 19 / max 23 over 85 sites; 18 flips; rakuten 40→54; wayfair −23, squarespace +21; GT P/R 1.000/0.727; clean 100 @ 23% cov, medium→low; dirty 9→0). Golden files reproduce these byte-for-byte. Life-safety gate: `_lifeSafety`/`LIFE_SAFETY` appear nowhere in the static-audit diff — gate code structurally untouched; the gate reads confirmed-2.3.1 findings, orthogonal to category state.
- **Quirk (team-lead #4) — CONFIRMED YES**: bare `node --test` DOES execute `test/golden/regen.mjs` and rewrite the golden vectors. Proof: golden mtimes changed (1784724007/008 → 1784724177) across a bare `node --test` run while SHA256 stayed identical (engine deterministic). Root cause: Node's no-path test discovery glob includes `**/test/**/*.?(c|m)js`, matching `test/golden/regen.mjs`, whose top-level code writes the golden files. See MEDIUM-1.
- **Test integrity**: fixture bumps (CLEAN/RICH_PAGE 1→3 buttons/inputs, `fullCoveragePasses()`) are legitimate — they keep property tests exercising *scored* categories, each annotated with why; not expectation-gaming. New boundary/edge/renormalization tests assert real state transitions and finding retention. Disclosure test asserts the badge renders AND no ring for the unscored category.

## Findings

- **MEDIUM-1 — golden-vector drift trap is disarmed under bare `node --test`** (`test/golden/regen.mjs:13-20` + `test/golden-vectors.test.mjs`). Bare `node --test` runs `regen.mjs` as a side effect (confirmed by mtime change above), so `golden-vectors.test.mjs`'s byte-identical assertion compares the engine against freshly-regenerated output — a tautology, not a drift trap, whenever regen runs first (and file execution order/concurrency makes it a race). Pre-existing, NOT introduced by this diff, and this change's @9 golden vectors are independently valid (explicit regen produced no further diff; the separate "two runs byte-identical" reproducibility test passed). Impact is on catching FUTURE cross-machine nondeterminism (VALIDATION.md L0 intent), not this change's correctness. Producer disclosed it. Does not block WS-A.
- **MEDIUM-2 — thin-FAIL exclusion can inflate the overall past a confirmed critical, mitigated only outside the headline number** (`core/scripts/static-audit.mjs:1090`, `1236-1244`). A single confirmed **critical** in a 1-2-check category (e.g. keyboard 2.1.1 lockout) now exits the denominator, so the overall rises rather than falling — my crit probe: overall would be ~54 if keyboard scored, reads 85 excluded. The life-safety gate covers only 2.3.1 (seizures), so other confirmed criticals get no floor. This is the plan's *deliberate, documented* direction (rakuten 40→54 is the motivating case; VALIDATION.md L2 explicitly discloses "can raise OR lower the overall"), and visible caveats exist (critical count in verdict line, coverage %, confidence, full finding list). Not a bug and not the team-lead's HIGH condition. Flagged for arbitration because a client anchored on the big number could miss an excluded critical — the exact tension WS-B's hero redesign is scoped to surface.
- **LOW-1 — version skew**: CHANGELOG carries a `[3.2.0]` header but `.claude-plugin/plugin.json` is still `3.1.0`. Consistent with the plan (release bump is a post-WS-B step) and the producer's note #4, so momentary and expected — just don't ship the CHANGELOG header without the manifest bump at release time.
- **LOW-2 — coverage-line wording**: `t('coverage_note')` = "the rest needs human or live review" now also covers `insufficient-evidence` categories, which WERE machine-checked (and may be failing), not merely "needs review". Minor interpretability mismatch; squarely WS-B hero territory.

## Required fixes

None for CRITICAL/HIGH (none found). This change is mergeable as-is.

Recommended (arbiter's call, not merge gates):
1. **MEDIUM-1**: file a follow-up to make the golden drift trap real — rename `regen.mjs` out of `test/**` (e.g. `tools/regen-golden.mjs`) or set a Node test-runner glob that excludes it, so `golden-vectors.test.mjs` compares against the *committed* vectors. Out of WS-A scope; do not gate this merge on it.
2. **MEDIUM-2**: decide, at arbitration, whether a confirmed **critical** finding should resist thin-exclusion the way the life-safety gate resists dilution (or ensure WS-B's hero states "excluded categories contain N confirmed failures"). Log the decision against the N=3 calibration knob already open in VALIDATION.md L2.

---

## Second pass (final gate) — 2026-07-22

Producer applied the MEDIUM-1 fix order: `git mv test/golden/regen.mjs tools/regen-golden.mjs`. Re-verified the whole final diff first-hand (plans/mockups/ ignored).

**Verdict: PASS.** MEDIUM-1 closed; nothing new broken; MEDIUM-2 correctly left deferred.

- **MEDIUM-1 CLOSED (re-verified)**: bare `node --test` no longer mutates the golden vectors — mtime probe shows `clean/dirty.expected.json` mtimes AND SHA256 unchanged across a bare run (was: mtimes advanced in pass 1). Test count 329→328 (the phantom `regen.mjs` "test" is gone), 328/328 green, `build --check` 48/48. Standalone `node tools/regen-golden.mjs` still regenerates byte-identical golden (hashes match), so the moved script's `ROOT`/`GOLDEN` path fixups (`tools/regen-golden.mjs:14-15`) are correct. No other side-effectful script remains discoverable under `test/**` — every file there is now a `*.test.mjs`. The drift trap is now real: `golden-vectors.test.mjs` compares against the committed vectors.
- **CHANGELOG [3.2.0]**: no stale regen path in the entry; all numbers still match `plans/2026-07-22-ws-a-validation-notes.md` (Spearman 0.477→0.468, median|Δ|7 / p95 19 / max 23, 18 flips, wayfair −23, squarespace +21, rakuten 40→54, GT 1.000/0.727, clean 100@23% medium→low, dirty 0). Live refs repointed in `test/golden-vectors.test.mjs:4` and `VALIDATION.md:37,172`. The one remaining `test/golden/regen.mjs` mention (`CHANGELOG.md:145`) is under `## [3.0.0]` — a historical release entry (its "dirty=9" is pre-@9); correctly left, since rewriting a past release note would falsify the record.
- **MEDIUM-2 unchanged, not silently altered**: `scoreCategory` (`core/scripts/static-audit.mjs:1090`) is byte-identical to pass 1 — no critical-gate quietly added. Remains a documented deferral (VALIDATION.md L2 / CHANGELOG N=3 calibration note), as intended.
- **Nothing broke**: `git mv` registered as a rename (history preserved); no LIVE stale refs to the old path in `.mjs`/`.md` (excluding the deliberately-left historical CHANGELOG/plans). No new smells.

**Required fixes: none.** Change is mergeable. MEDIUM-2 stays an arbitration/WS-B item, not a merge gate.
