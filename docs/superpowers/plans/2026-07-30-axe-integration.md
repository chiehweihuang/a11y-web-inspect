# axe-core Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make axe-core a first-class Beacon audit input so every violation and affected node is preserved, unique failures affect scoring once, corroborating Tier 2 evidence is not double-penalized, and client/audit reports remain readable for their intended audiences.

**Architecture:** Add one dependency-free shared axe result module under `core/scripts/`. `static-audit.mjs` becomes the single scoring/reconciliation entry point through a new `--axe-results` option. `generate-report.mjs` consumes the normalized artifact and retains backward compatibility for older artifacts that only embed raw axe data.

**Tech Stack:** Node.js ESM, built-in `node:test`, existing Beacon build generator, HTML report generator, Playwright-based report validation.

## Global Constraints

- Preserve every axe violation and every affected DOM node; possible false positives remain visible for human judgment.
- A unique axe criterion failure contributes one Beacon failure. A confirmed Tier 2 finding with the same category and WCAG criterion prevents a second penalty but keeps both evidence sources.
- A review-only Tier 2 finding never suppresses a confirmed axe failure.
- Lighthouse accessibility remains excluded; Lighthouse performance data remains unchanged.
- Do not add a dependency or bundle an axe runner. Beacon accepts the standard axe JSON produced by the caller's runner.
- Do not edit WordPress or production.
- Do not hand-edit generated adapters; change `core/`, then build.
- Do not commit or push.
- Use TDD: observe each new test fail for the intended reason before implementation.

---

### Task 1: Extract the shared axe result contract

**Files:**
- Create: `core/scripts/axe-results.mjs`
- Create: `test/axe-results.test.mjs`
- Modify: `tools/manifest.mjs`
- Modify: `test/build-manifest.test.mjs`

- [ ] **Step 1: Write the failing normalizer tests**

Cover a standard axe result with two violations and multiple nodes, including:

```js
const normalized = normalizeAxeResults(raw);
assert.equal(normalized.engine, 'axe-core');
assert.equal(normalized.version, '4.11.4');
assert.deepEqual(normalized.counts, {
  violations: 2,
  violation_nodes: 13,
  passes: 24,
  incomplete: 1,
  inapplicable: 38,
});
assert.equal(normalized.violations[0].nodes.length, 10);
```

Also assert that missing/non-array result groups fail with an actionable message, and that `axeViolationToFinding()` preserves all node targets as `instances`.

- [ ] **Step 2: Run the focused test and confirm RED**

Run:

```powershell
node --test test/axe-results.test.mjs
```

Expected: failure because `core/scripts/axe-results.mjs` does not exist.

- [ ] **Step 3: Move the existing axe mapping into the shared module**

Move, without broadening behavior, the existing report helpers for:

```js
normalizeAxeResults(raw)
axeViolationToFinding(rule, options)
criteriaFromFinding(finding)
getAxeResults(audit)
```

The normalized shape must preserve full `violations`, `passes`, `incomplete`, and `inapplicable` arrays plus source metadata and computed counts. No new package is needed.

- [ ] **Step 4: Register the generated script**

Add `axe-results` to `SCRIPTS` in `tools/manifest.mjs`, then update only the existing hard-coded build-count expectations.

- [ ] **Step 5: Run focused tests and confirm GREEN**

Run:

```powershell
node --test test/axe-results.test.mjs test/build-manifest.test.mjs
```

Expected: all pass.

---

### Task 2: Make static audit the single scoring and reconciliation entry point

**Files:**
- Create: `test/static-audit-axe.test.mjs`
- Modify: `core/scripts/static-audit.mjs`

- [ ] **Step 1: Write the failing CLI/scoring tests**

Use the real static audit CLI against a minimal HTML fixture and raw axe fixture. Cover:

```js
// Unique axe violation
assert.equal(audit.axe.counts.violations, 1);
assert.equal(audit.findings.filter(f => f.axe_rule_id === 'color-contrast').length, 1);
assert.equal(axeFinding.instances.length, 2);

// Confirmed Tier 2 overlap
assert.equal(overlappingAxeFinding.score_effect, 'corroborating');
assert.equal(withOverlap.summary.score, tier2Only.summary.score);
assert.match(tier2Finding.evidence_sources.join(' '), /axe-core@4\.11\.4/);

// Review-only Tier 2 does not suppress axe
assert.notEqual(reviewOnlyAxeFinding.score_effect, 'corroborating');
```

Also assert invalid axe JSON fails with an actionable error.

- [ ] **Step 2: Run the focused test and confirm RED**

Run:

```powershell
node --test test/static-audit-axe.test.mjs
```

Expected: failure because `--axe-results` is not recognized/ingested.

- [ ] **Step 3: Add the CLI boundary**

Extend argument parsing with:

```js
case '--axe-results':
  opts.axeResults = args[++i];
  break;
```

Load and validate the JSON through `normalizeAxeResults()`. Validation errors must identify the input path and invalid field.

- [ ] **Step 4: Reconcile before scoring is finalized**

For each normalized axe violation:

1. Convert it to one finding with all nodes in `instances`.
2. Compare against confirmed Tier 2 failures by `category + WCAG criterion`.
3. If every axe criterion is already confirmed, keep `check: "fail"` and set `score_effect: "corroborating"`; add the axe source to the Tier 2 finding.
4. Otherwise add the axe finding as one score-bearing failure.

Extend the existing `addFinding()` path only enough to skip check/severity counters when:

```js
finding.score_effect === 'corroborating'
```

Do not create a second scoring system.

- [ ] **Step 5: Persist provenance**

Add the normalized `axe` object to the audit artifact and include axe in `audit_methods`. Use:

```js
audit_tier =
  tier2 && axe ? 'Tier 1 + Tier 2 + axe-core'
  : tier2 ? 'Tier 1 + Tier 2'
  : axe ? 'Tier 1 + axe-core'
  : 'Tier 1';
```

Increment the static detector version because scoring behavior changed.

- [ ] **Step 6: Run focused tests and confirm GREEN**

Run:

```powershell
node --test test/static-audit-axe.test.mjs test/static-audit*.test.mjs
```

Expected: all pass.

---

### Task 3: Make both reports consume the reconciled artifact

**Files:**
- Create: `test/generate-report-axe.test.mjs`
- Modify: `core/scripts/generate-report.mjs`
- Modify if needed: `test/generate-report-audience.test.mjs`

- [ ] **Step 1: Write failing report behavior tests**

Assert:

- Audit shows axe version, all four result-group counts, every violation, and every affected selector/node.
- Audit explicitly says axe-core was not included when `audit.axe` is absent, even if Tier 2 ran.
- Audit shows corroborating provenance without hiding the axe finding.
- Client report excludes raw axe evidence lists.
- Client headline counts and top-three priorities ignore findings with `score_effect: "corroborating"`.

- [ ] **Step 2: Run the focused report tests and confirm RED**

Run:

```powershell
node --test test/generate-report-axe.test.mjs test/generate-report-audience.test.mjs
```

Expected: at least the no-axe disclosure and corroborating count assertions fail.

- [ ] **Step 3: Replace embedded axe parsing with the shared module**

Import the shared helpers and remove the duplicated mapping functions from `generate-report.mjs`.

For backward compatibility only, if an older artifact has raw `axe.violations` but no existing `axe_rule_id` findings, convert violations at render time. Current artifacts must use findings already reconciled by static audit.

- [ ] **Step 4: Separate client presentation counts from audit evidence**

Use the existing report findings and one filter:

```js
const clientFindings = reportFindings.filter(
  finding => finding.score_effect !== 'corroborating',
);
```

Use `clientFindings` for the client confirmed count and top-three priorities. Keep all findings in Audit.

- [ ] **Step 5: Make axe inclusion state explicit**

Audit must render either the full axe evidence section or a short explicit “axe-core was not included in this audit” notice. Do not infer inclusion from Tier 2.

- [ ] **Step 6: Run focused report tests and confirm GREEN**

Run:

```powershell
node --test test/generate-report-axe.test.mjs test/generate-report-audience.test.mjs
```

Expected: all pass.

---

### Task 4: Update the canonical workflow and generated adapters

**Files:**
- Modify: `core/content/inspect.md`
- Modify only if command documentation exists there: `adapters/codex/skills/beacon/SKILL.md`
- Generate: `scripts/axe-results.mjs`
- Generate: `adapters/codex/scripts/axe-results.mjs`
- Regenerate other tracked generated outputs through the existing build

- [ ] **Step 1: Document the input flow**

Add the canonical command form:

```powershell
node scripts/static-audit.mjs <site-dir> --url <url> --axe-results axe-results.json --output audit-results.json
```

State that the file is standard axe JSON, all violations/nodes are retained, and overlap is reconciled by Beacon without hiding evidence.

- [ ] **Step 2: Check and generate**

Run:

```powershell
node build.mjs --check
node build.mjs
node build.mjs --check
```

Expected: first check may report the new generated targets are stale/missing; after build, check passes.

- [ ] **Step 3: Verify generated ownership**

Confirm generated copies match `core/` and no generated file contains hand-only logic.

---

### Task 5: Re-run the real ADALS audit and complete verification

**Files:**
- Modify generated audit artifacts under: `C:\Code\AIA\reports\a11y\adals-activity\`

- [ ] **Step 1: Generate the audit with real axe input**

Run the existing ADALS static audit command with:

```powershell
--axe-results C:\Code\AIA\reports\a11y\adals-activity\axe-results.json
```

Then merge the existing Lighthouse performance artifact through the established flow and generate both client and audit reports.

- [ ] **Step 2: Assert the real artifact contract**

Programmatically verify:

```text
axe-core version: 4.11.4
violations: 2
affected violation nodes: 13
passes: 24
incomplete: 1
inapplicable: 38
```

Verify both violation rules and all 13 nodes remain visible in Audit, with no duplicate score penalty for confirmed Tier 2 overlap.

- [ ] **Step 3: Run all automated verification**

Run:

```powershell
node --test
node build.mjs --check
```

Expected: full suite passes and generated outputs are current.

- [ ] **Step 4: Validate report layout at all required widths**

Run the existing report validator across:

```text
320, 768, 1024, 1280, 1440, 1742, 1920
```

Cover Traditional Chinese/light and English/dark. Programmatically assert `scrollWidth <= clientWidth`, no text column below its readable minimum, and no viewport-scale dead space.

- [ ] **Step 5: Inspect representative screenshots**

Open representative narrow, non-breakpoint, and wide screenshots for both report audiences. Confirm the Audit evidence is complete but navigable, while the client report remains concise.

- [ ] **Step 6: Final source and worktree review**

Check:

```powershell
rg -n "PMingLiU|MingLiU|font-family:\s*(monospace|serif)" core scripts adapters
git diff --check
git status --short
```

Expected: forbidden font scan has no matches, diff check passes, and only intended files plus pre-existing user changes are present.
