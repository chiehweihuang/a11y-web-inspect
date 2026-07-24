# Hakuso audit — v3.3 Workstream C: axe optionalization (inspect.md rewrite)

Target: frozen uncommitted docs-only diff on `6e03fa0` — `core/content/inspect.md` + regenerated
mirrors (`commands/inspect.md`, `adapters/codex/references/beacon-inspect.md`). Audited as an
executable spec. Probes first-hand; artifact in `C:/Users/tacit/.claude/jobs/f448fc13/tmp/hakuso4/`.
Tree left as found.

## Verdict

**PASS.** The rewrite demotes axe to an optional cross-check coherently; every instruction is
performable with today's code; the contrast gate is intact and unskippable.

## Verified first-hand

- **Executable honesty.** Ran the documented command verbatim —
  `node scripts/tier2-audit.mjs --url test/tier2-fixtures/contrast.html --output tier2-results.json`
  → wrote a findings-only artifact (10 findings, NO `overall_score`, `engine=beacon-tier2-audit@1`,
  each finding `source: beacon-tier2-audit@1`), exactly as the doc's "SEPARATE, findings-only
  artifact" claim. Loader discovery order in the prose (env override → caller's project
  `require.resolve` → global installs → loud actionable error) matches `loadPlaywright()` in
  `tier2-audit.mjs`. No promise of merge machinery/auto-scoring anywhere: the Tier-2 section
  explicitly says score entry is "an intentionally undecided product question — this skill does not
  do that today," and routes any wanted scoring through the EXISTING `--merge-findings` path.
- **Gate integrity.** The "Contrast verification gate (do not skip)" is now a single shared
  paragraph (not split cc/codex), present in BOTH mirrors: "was contrast exercised… tier2-audit.mjs
  OR axe-core? If NEITHER ran… you MUST (a) set `requires_live_audit:true` and (b) emit the contrast
  category as an explicit unverified finding (severity tip)… Never report a passing contrast score
  from a static-only run." Native-OR-axe satisfaction is unambiguous; traced end-to-end, a reader
  following either surface cannot reach a passing static-only contrast score.
- **Coherence.** Old "axe REQUIRED baseline" comments are gone; every remaining "required" hit is the
  new "not a required baseline" demotion. Lighthouse Step 2d correction is accurate ("Beacon scores
  a11y with its own engine — static-audit + tier2-audit, optionally axe"; excludes `accessibility`
  from `--only-categories=performance,best-practices,seo`). The unified automated-scan bash block
  (static-audit → tier2 → optional axe/lighthouse/eslint) is plain `node`/`npx` with no codex-exec
  flags, runs identically on both surfaces.
- **Mirrors.** `node build.mjs --check` → all 50 outputs match core; both rendered mirrors carry the
  tier2 command + gate and contain ZERO leftover `@cc`/`@codex`/`@duplicate-ok` markers.
  `node --test` 375/375, 0 fail (docs-only, suite unaffected).

## LOW (optional, out of WS-C scope — not a gate)

- The CI/CD section (`inspect.md:830/837`) and one `testing_recommendations` line (`:695`) still
  present `axe-core-cli` as the CI a11y check with no mention of running Beacon's own engine in CI.
  Pre-existing, independent of the inspect-time flow (CI regression ≠ inspect baseline), and
  axe-core-cli is a valid standalone CI tool — so not a contradiction, but a spot to revisit if the
  "Beacon-native default" framing should extend to the CI guidance later.

---

## Re-gate (2026-07-25) — codex fixes + gate wired into engine (@11)

**Verdict: PASS.** The doc-promised contrast gate is now code-backed and correct; the 4 codex
fixes land. One MEDIUM doc residual (below), self-neutralizing, not a gate. Tree frozen, probes
in tmp.

- **Gate wiring, 3 states first-hand** (`static-audit.mjs:1465-1487` + `requires_live_audit`
  at :1541): (a) static-only → `contrast-not-verified` tip PRESENT + `requires_live_audit:true`;
  (b) `--merge-findings` a tier-2 contrast fail → tip suppressed + flag false; (c) axe-shaped
  contrast fail → same. Load-bearing claim verified: the ONLY in-file `addCheck(stats,'contrast',…)`
  is `'review'` (:1242), so `contrast.pass/fail` comes solely from merges — a sound "was contrast
  browser-exercised" signal. Bilingual tip renders zh+en.
- **[2] focus-flow** STEP now consistently do-NOT-merge (`inspect.md:213-216`: focus-flow.mjs
  "writes no JSON… nothing to pass to --merge-findings… do NOT merge") — the codex-found
  step-internal contradiction is fixed.
- **[3] AEO** hand-calc formula removed (`:255` "do NOT hand-calculate a separate 0-100 number";
  `:263` "Report the `agent` category's score from the script's own output").
- **[4] CI** offers Beacon-native tier2 (`:836`) + axe-core-cli alternative (`:841`); engine
  `testingRecommendations` string is native-or-axe (bilingual); inoperable `npx playwright test`
  line GONE (0 hits, all 3 mirrors).
- **[5] @11 discipline**: `@11` in all 3 mirrors, 0 lingering `@10`. Golden delta = version + the
  tip finding + its deterministic downstream (unverifiable 4→5, tips/total +1, 1.4.3 into
  legal `mapped_criteria`) — no unrelated change. GT neutrality: @10 vs @11 on snapshot 78 →
  overall 54 / coverage 36 identical, only new finding is `contrast-not-verified`. Golden-vectors
  reword (`total_findings===0` → `every(check==='review')`) is a LEGITIMATE adaptation: the gate
  legitimately fires a review tip on every static run, so literal-zero is impossible; the reword
  preserves the real guarantee (no confirmed `check:fail`). static-contrast test reword (pinned
  `@10` → version-agnostic `@\d+`) is a de-brittling.
- **[6]** `node --test` 375/375, `build.mjs --check` 50/50, static-audit mirrors byte-identical.

### MEDIUM (residual, not a gate)
- `inspect.md:581` (Step 6) still lists "focus-flow findings" among items "hand[ed] to the
  script… to be scored", and `:471` (Step 4) lists "focus-flow" as a findings source — both
  contradict the now-fixed focus-flow step's do-NOT-merge. Self-neutralizing (focus-flow.mjs
  emits no JSON, so nothing can actually be merged), so no wrong scoring — but item-2's "no stale
  merge instruction ANYWHERE" is not 100% met. One-line tighten: reword to "focus-flow-guided
  manual keyboard findings" or drop focus-flow from the two scored-source summaries.
