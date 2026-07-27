# Audit — Codex-authored Beacon changes (heterogeneous review)

Artifact: uncommitted working tree at `C:/Code/personal/beacon`, branch `master`,
HEAD `16613b5`, 8 modified files (+107/-49).
Producer: Codex (separate model, separate session). Its report was treated as
claims to be verified, not as evidence.
Environment: `codex-cli 0.145.0`, node v24.13.0, Python 3.12.10, Windows 11.

## Verdict

**PASS** — all four producer claims (A, B, C, D) verified by execution. No
CRITICAL, and no HIGH *introduced by this diff*. The one HIGH below is a
pre-existing crash in a file this diff does not modify; it is a follow-up, not
a merge gate.

Every acceptance number the producer stated was reproduced independently:
`build --check` 51/51, `node --test` 398/398 exit 0, Codex plugin validator
exit 0, skill validator exit 0, `.claude-plugin/` zero changes, nothing
committed.

---

## Claim verification

### B — shared canonical content, Claude-side byte-identity (HIGHEST RISK) — TRUE

The marker syntax is **real, not invented**. `tools/markers.mjs:10` defines
`MARKER_RE = /^<!--\/?@(cc|codex)-->$/`, and `buildVariant()` at
`tools/markers.mjs:38-53` drops the non-kept block and strips all marker lines
from both variants. `build.mjs:28-31` selects `keep` per `entry.kind`.

Byte-identity is **proven, not argued**:

```
node build.mjs --check   ->  "--check: all 51 outputs match core."  EXIT=0
git status --porcelain   ->  commands/, scripts/, references/, .claude-plugin/
                             all absent from the modified list
```

`build.mjs --check` (`build.mjs:62-72`) is read-only — it stages into `tmpdir()`
and `rmSync`s it. Because `--check` compares regeneration against the working
tree, and the working tree for every CC-side output is unmodified vs HEAD, the
regenerated CC output **is** HEAD byte-for-byte. That is the full proof.

Confirmed the diff is purely additive (+39/-0 across the two content files) and
that markers placed *inside* YAML frontmatter render correctly on both sides:

- `core/content/advisor.md:1-8` — `---`, `<!--@cc-->…<!--/@cc-->`,
  `<!--@codex-->…<!--/@codex-->`, `---`
- renders to valid single-`description` frontmatter in both `commands/advisor.md`
  and `adapters/codex/references/beacon-advisor.md`

CC-side Claude content survives intact: `commands/guide.md` still carries 5
`/beacon:` references, `commands/advisor.md` 2 `/beacon:` and 2 `PostToolUse`.
No `note: … duplicated (reordered) line(s)` advisory fired
(`build.mjs:46-49`), so no cross-variant duplicate lines were introduced.

### A — Claude-isms removed from the Codex skill — TRUE

Grep over the Codex-rendered outputs (`adapters/codex/`, not the CC ones):

| Token | Hits |
|---|---|
| `/goal` | 0 |
| `CLAUDE.md` | 0 |
| `/beacon:` | 0 |
| `bright-raven` / `akegarasu` / `Claude Code` / `slash command` | 0 |
| `PostToolUse` | 2, both legitimate |

The two `PostToolUse` hits are `adapters/codex/scripts/pattern-runtime.mjs:3`
(a source comment naming the shared-logic contract) and
`adapters/codex/skills/beacon/SKILL.md:18`, the deliberate statement that the
Codex package does *not* install one. Neither is a leaked assumption.

**Relative paths resolved from a real install, not from the repo.** `beacon@beacon`
was already installed on this machine, so the plugin root layout is known real:
`<root>/{.codex-plugin,references,scripts,skills}`. All 13 `../../references/*.md`
targets in `SKILL.md:49-59,85,109` resolve from
`skills/beacon/` in both the marketplace snapshot and, after a live install, the
plugin cache root. The "two levels above this `SKILL.md`" instruction
(`SKILL.md:47`) is correct for that layout.

**Live end-to-end install performed** (in a scratch marketplace named
`beacon-audit-tmp` so the user's real `beacon` registration was never touched):

```
codex plugin marketplace add <scratch>   -> Added marketplace `beacon-audit-tmp`
codex plugin add beacon@beacon-audit-tmp -> Installed plugin root:
                                            ~/.codex/plugins/cache/beacon-audit-tmp/beacon/3.3.0
```

The local adapter's file set is identical to the installed snapshot (30 files,
`diff` clean).

**PowerShell claim verified by executing both forms.** The old backslash
continuation is a PowerShell *parse* error — it kills the whole script before
any line runs:

```
+   --scope "Project UI" \
+     ~
Missing expression after unary operator '--'.
Unexpected token 'scope' in expression or statement.
```

The new single-line form (`SKILL.md:98,104`) run in real PowerShell:

```
Wrote reports/a11y/audit-results.json
static-audit exit=0
Report written to: …\a11y-report.html
generate-report exit=0
```

The cwd-at-project / scripts-via-plugin-root design also works as documented:
`node "<plugin-root>/scripts/advisor.mjs" src/Bad.tsx` from a project dir
returned the expected finding and exit 2.

### C — `defaultPrompt` required by the validator — TRUE, and understated

The validator is `~/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py`.
Read at source, then run four ways.

`validate_plugin.py:172-175` makes it required:

```python
if "defaultPrompt" not in interface and "default_prompt" not in interface:
    errors.append(
        "plugin.json field `interface.defaultPrompt` or `interface.default_prompt` is required"
    )
```

`validate_plugin.py:176-180` makes `capabilities` required too (no `is None`
early return).

| Run | Result |
|---|---|
| current adapter | `Plugin validation passed` EXIT=0 |
| minus `defaultPrompt` | EXIT=1 — `defaultPrompt … is required` |
| minus `defaultPrompt` + `capabilities` | EXIT=1 — both errors |
| **manifest at HEAD (pre-change)** | **EXIT=1 — four errors** |

The pre-change manifest failed on `longDescription`, `developerName`,
`defaultPrompt`, **and** `capabilities`. The producer described fixing two
fields; it actually repaired four required-field violations. **v3.3.0 as
published does not pass the current Codex plugin validator.**

Ecosystem comparison, broader than the producer's cited sample of 7 — all 396
`.codex-plugin/plugin.json` manifests on this machine:

```
parsed=396 unreadable=0
with defaultPrompt: 393/396
with capabilities : 393/396
missing defaultPrompt: ['beacon', 'beacon', 'wt-agent-hooks']
```

The only manifests lacking it are Beacon's own two published copies and one
third-party outlier. All 6 `openai-bundled` first-party plugins carry both.

**Starter prompt copy — judged acceptable.** Spec
(`references/plugin-json-spec.md:102-105`) caps the list at 3 entries and each
string at 128 chars, preferring ~50. The three supplied are 46 / 46 / 60 chars
and map cleanly onto the skill's three declared modes (guide / advisor /
inspect). No change required.

### D — ADAPTERS.md historical annotation — TRUE

`ADAPTERS.md:78` keeps the 2026-05-28 entry and annotates the superseding path.
`CHANGELOG.md:3-9` corroborates: the 3.3.0 entry states "Codex distribution
moving to a native plugin marketplace." Accurate.

---

## Findings

### HIGH-1 — documented `static-audit` command crashes on first run (PRE-EXISTING, not a regression)

**Where:** `core/scripts/static-audit.mjs:1707` (and the identical copies at
`scripts/` and `adapters/codex/scripts/`); surfaced by
`adapters/codex/skills/beacon/SKILL.md:98`.

**What's wrong.** `writeFileSync(opts.output, …)` is called with no parent-directory
creation. `grep -n 'mkdirSync\|mkdir' core/scripts/static-audit.mjs` returns
nothing. The SKILL.md instructs `--output reports/a11y/audit-results.json`, and
`SKILL.md:129` further tells the operator to keep artifacts under a project-local
`reports/a11y/`. On a project that does not already have that directory — i.e.
every first run — the documented command dies with an unhandled ENOENT stack
trace after doing all the analysis work:

```
Error: ENOENT: no such file or directory, open '…\proj\reports\a11y\audit-results.json'
    at main (…/scripts/static-audit.mjs:1707:3)
EXIT=1
```

Cause isolated: `mkdir -p reports/a11y` then re-running the identical command
gives `Wrote reports/a11y/audit-results.json` / exit 0.
`core/scripts/generate-report.mjs:2487` has the same shape.

**Why it is not a merge gate.** `git status --porcelain` on all three
`static-audit.mjs` copies is empty — this diff does not touch the script, and
the same `reports/a11y/…` output path existed in the SKILL.md at HEAD. The diff
rewrote the surrounding prose but did not introduce the crash. Blocking a
documentation-quality improvement on a pre-existing script bug would be
perfectionism. It is filed here because this audit is the first execution that
surfaced it, and because it is the very first thing a new Codex operator will
run.

### MEDIUM-1 — the Codex manifest schema contract has no regression guard

**Where:** `test/build-manifest.test.mjs` (no assertion on
`CODEX_PLUGIN_TEMPLATE.interface`), `.release.json:6-7`, `.github/workflows/`.

**What's wrong.** Nothing in the repo checks the manifest against the Codex
ingestion schema:

- `grep -rn 'capabilities\|defaultPrompt\|CODEX_PLUGIN_TEMPLATE' test/` → 0 hits
- `.release.json` gates are only `node --test` and `node build.mjs --check`
- neither `ci.yml` nor `validation.yml` invokes `validate_plugin.py`

`build --check` cannot catch this class of bug: it regenerates the output *from*
`CODEX_PLUGIN_TEMPLATE`, so deleting a required field from the template keeps
template and output in perfect agreement and `--check` stays green.

**Why it matters.** This is the root cause of the defect claim C just repaired.
v3.3.0 shipped a manifest failing four required validator fields, and all 398
tests plus `build --check` passed the whole way. Recurrence probability is
demonstrated, not hypothetical — the guard that would have caught it is exactly
the one still missing after this diff.

### LOW-1 — "goal" phrasing survives in the Codex skill

`SKILL.md:61` (`## Goal / Skill Workflow`), `:78` ("Run the Beacon goal on this
page"), `:85`. Verified this is **not** a Claude `/goal` leak: `grep '/goal'`
over `adapters/codex/` returns 0, and the repo's own Codex-only reference
`adapters/codex/references/goal-workflows.md:3` uses "goal" as plain-English
user-facing phrasing ("These are user-facing goal patterns"). Consistent with
the existing adapter vocabulary. "Run the Beacon goal on this page" reads
slightly awkwardly as English; optional copy polish only.

### LOW-2 — fenced blocks retagged `bash` → `text`

`SKILL.md:91,97,103,115`. Loses syntax highlighting, and the
`"<beacon-plugin-root>"` placeholder makes the blocks non-copy-pasteable. This
is a deliberate and defensible trade — the commands are genuinely
shell-agnostic now and the placeholder must be resolved by the agent, not the
user. Noted, not a defect.

### Uncertain / not verified

- The producer's "all 7 comparison plugins carry it" could not be reproduced as
  stated — this machine has 396 Codex manifests, of which 6 are first-party
  `openai-bundled`. The substance of the claim is verified far more strongly
  than the cited sample; the number itself appears to be a smaller ad-hoc set.
  No impact on the change.

---

## Required fixes

None blocking this merge.

Follow-ups, in priority order:

1. **HIGH-1** — in `core/scripts/static-audit.mjs` before line 1707, and
   `core/scripts/generate-report.mjs` before line 2487, create the output
   parent: `mkdirSync(dirname(opts.output), { recursive: true })`. One shared
   helper covers both callers. Then `node build.mjs` to propagate to the three
   copies. Regression check: run the exact `SKILL.md:98` command in a directory
   with no `reports/` and assert exit 0.
2. **MEDIUM-1** — add to `test/build-manifest.test.mjs` an assertion that
   `CODEX_PLUGIN_TEMPLATE.interface` contains non-empty `displayName`,
   `shortDescription`, `longDescription`, `developerName`, `category`, a
   non-empty string array `capabilities`, and a `defaultPrompt` array of ≤3
   strings each ≤128 chars. That mirrors `validate_plugin.py:164-180` and turns
   a silent ship-broken into a red test.

---

## Environment left as found

- Repo tree: the same 8 modified files, HEAD still `16613b5`, nothing committed,
  no generated output rewritten. This report is the only added file.
- `~/.codex/config.toml`: byte-identical to the pre-audit snapshot (`diff` clean)
  after `codex plugin remove` + `codex plugin marketplace remove`.
- The user's real `beacon@beacon` install is intact and enabled at 3.3.0.
- The empty `~/.codex/plugins/cache/beacon-audit-tmp` left behind by Codex's own
  remove was cleared with `rmdir`.
- Scratch fixtures live under the session scratchpad, outside the repo.
