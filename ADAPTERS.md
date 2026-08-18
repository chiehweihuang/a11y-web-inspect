# Beacon Adapters

Beacon's accessibility + AEO knowledge runs in more than one agent runtime.
Each runtime has different extension mechanics (Claude Code uses commands +
hooks; Codex uses a single `SKILL.md` + references; Copilot is future). This
file tracks how those surfaces relate, what is shared, what is deliberately
divergent, and what still needs reconciliation.

> **Phase status:** A implemented (`core/` + `build.mjs` assemble every adapter;
> see "Phase A — implemented" below). This file remains the drift inventory and
> the source of the core-vs-adapter boundary the build encodes. (Phase B —
> subdirectory adapters with manual sync — was the predecessor; the manual sync
> it described is now done by `build.mjs`.)

## Surfaces

| Surface | Lives in repo at | Installs via | Extension mechanic |
|---|---|---|---|
| Claude Code (canonical) | repo root (`commands/`, `hooks/`, `scripts/`, `references/`, `.claude-plugin/`) | `/plugin install beacon@beacon` (marketplace `.claude-plugin/`) | `plugin.json` skills + PostToolUse / SessionStart / UserPromptSubmit hooks |
| Codex | `adapters/codex/` (plugin root) | `codex plugin marketplace add chiehweihuang/beacon && codex plugin add beacon@beacon` (marketplace `.agents/plugins/marketplace.json` at repo root; plugin manifest `adapters/codex/.codex-plugin/plugin.json`) | Codex Agent Skills — `skills/beacon/SKILL.md` + on-demand `references/` loading; CLI helper scripts at plugin-root-relative `scripts/` |
| Copilot | (not yet) | — | — |

Codex's plugin manifest schema (`.codex-plugin/plugin.json` + a marketplace root's
`.agents/plugins/marketplace.json`) was reverse-engineered from OpenAI's own
bundled plugins under `~/.codex/plugins/` (no committed JSON schema found) —
see `plans/2026-07-27-codex-plugin-modernization.md` for the evidence. Codex
also has an undocumented compat path that reads Claude Code's
`.claude-plugin/` manifests directly; the native manifests above are the
supported path this repo now ships, not a reliance on that compat path.

`core/` is the canonical source for shared knowledge, references, patterns, and
scripts. `build.mjs` generates both runtime surfaces from it. The Codex adapter
remains canonical only for Codex-specific framing (skill invocation and CLI helpers).

## What is shared (generated from core)

These appear in both installed surfaces but are generated from one source under
`core/`; generated copies must not be edited by hand.

| Content | CC location | Codex location | Status |
|---|---|---|---|
| WCAG criteria reference | `references/wcag-quick.md` | `adapters/codex/references/wcag-quick.md` | generated from `core/references/` |
| Component patterns | `references/patterns.md` | `adapters/codex/references/patterns.md` | shared |
| Legal brief (6 jurisdictions) | `references/legal-brief.md` | `adapters/codex/references/legal-brief.md` | shared |
| Disability categories | `references/disabilities.md` | `adapters/codex/references/disabilities.md` | shared |
| Case studies | `references/cases.md` | `adapters/codex/references/cases.md` | shared |
| Document a11y | `references/documents.md` | `adapters/codex/references/documents.md` | shared |
| Report generator | `scripts/generate-report.mjs` | `adapters/codex/scripts/generate-report.mjs` | **identical after CRLF normalization** — pure line-ending diff, not content drift |
| Design QA gate | `scripts/design-qa.mjs` | `adapters/codex/scripts/design-qa.mjs` | generated from `core/scripts/design-qa.mjs`; same JSON ledger and exit-code contract |
| Inspect process prose | `commands/inspect.md` | `adapters/codex/references/beacon-inspect.md` | near-identical (codex port restructured commands → references) |
| Guide process prose | `commands/guide.md` | `adapters/codex/references/beacon-guide.md` | near-identical |
| Advisor process prose | `commands/advisor.md` | `adapters/codex/references/beacon-advisor.md` | near-identical |

## What is deliberately divergent (stays adapter-specific)

These are NOT drift to fix — they are runtime-specific by design. Phase A keeps
them in their respective `adapters/<surface>/`, not in `core/`.

| Item | Surface | Why it stays separate |
|---|---|---|
| `hooks/hooks.json` | CC only | Beacon's Codex package does not install its Claude-specific PostToolUse / SessionStart hooks |
| `scripts/a11y-advisor-hook.mjs` | CC only | PostToolUse hook: reads stdin hook payload, writes JSON `additionalContext`. Hook-shaped. |
| `scripts/beacon-prompt-gate.mjs` | CC only | UserPromptSubmit gate — proactive invocation, Claude-specific |
| `scripts/beacon-session-start.mjs` | CC only | SessionStart governance injection — Claude-specific |
| `adapters/codex/scripts/advisor.mjs` | Codex only | Same detection logic as the CC hook, but shaped as an explicit standalone CLI (`node advisor.mjs <file>`, exit 2 on issues) |
| `adapters/codex/references/goal-workflows.md` | Codex only | Codex's user interface is goals/skills, not slash commands — these are goal-phrasing patterns with no CC equivalent |
| `adapters/codex/references/repeat-testing.md` | Codex only | Codex repeat-testing flow (CLI helpers). The heavyweight externalized version of this concept is the separate `a11y-skill-workspace` improve pipeline. |

## Reconciliation log

Decisions about content that drifted and was pulled back across surfaces.

### 2026-05-28 · `static-audit.mjs` backported Codex → CC

- **Origin:** Codex adapter had `scripts/static-audit.mjs` (456-line deterministic Tier 1 static scanner producing `generate-report.mjs`-compatible JSON). CC had no equivalent — CC's inspect was purely agent-prose-driven (agent reads files, applies judgment, hand-writes `audit-results.json`).
- **Decision:** backport to CC as a shared core capability. A deterministic Tier 1 baseline benefits CC too — it gives the inspect skill a reproducible starting point the agent can run, then enrich with judgment. It also serves as a reference implementation of the `audit-results.json` schema (which ROADMAP notes is otherwise undocumented).
- **Landed:** `scripts/static-audit.mjs` (this branch). Verified: `static-audit.mjs → generate-report.mjs` chain produces a valid 134 KB report on a known-bad fixture (score 36, 19 findings).
- **Known duplication:** `static-audit.mjs` now exists in BOTH `scripts/` (CC) and `adapters/codex/scripts/` (Codex self-contained copy). This duplication is inherent to Phase B — the Codex adapter must be self-contained because it deploys to `~/.codex/skills/beacon/` where it cannot reach the repo's `scripts/`. **Historical deployment note:** that path was replaced in v3.3.0 by native marketplace installation (`codex plugin marketplace add chiehweihuang/beacon`, then `codex plugin add beacon@beacon`). Phase A's `build.mjs` resolves the duplication: `static-audit.mjs` lives once in `core/scripts/` and is copied into each built adapter.
- **Resolved:** the inspect flow now uses `static-audit.mjs` as its repeatable baseline; Claude and Codex receive generated copies from the same `core/scripts/` source.
- **Calibration note (non-blocking):** the deterministic script and agent-judgment Tier 1 can disagree on the same fixture (script found 19 findings / score 36 vs an agent's hand-audit of 13 findings / score 18 on bad-ecommerce). This agent-vs-script divergence is itself useful signal and is exactly what the `a11y-skill-workspace` pipeline is built to surface. Not reconciled here.

## Phase A — implemented (structure A2)

> Build it with `node build.mjs`; verify with `node build.mjs --check`;
> re-derive core from committed variants with `node extract.mjs`; install the
> codex adapter locally for dev with `codex plugin marketplace add . && codex
> plugin add beacon@beacon` (re-run `plugin add` after edits to refresh the
> cache — no separate deploy script; see the Codex row above). Tests:
> `node --test test/*.test.mjs`.

> Full design: `docs/superpowers/specs/2026-05-30-phase-a-core-extraction-design.md`
> (spike-validated 14/0). An earlier sketch here proposed an A3-style layout with
> CC moved under `adapters/claude-code/`. That was **rejected** in the design
> because changing `marketplace.json source` from `./` would move the install path
> and risk breaking the live v2.0.9 plugin. The chosen structure is **A2**: CC
> build outputs stay at the repo root, every load path unchanged.

Target structure (A2):

```
beacon/
  core/
    content/      guide.md, inspect.md, advisor.md (neutral prose, @cc/@codex markers)
    references/   wcag-quick, patterns, legal-brief, disabilities, cases, documents
    scripts/      static-audit.mjs, tier2-audit.mjs, design-qa.mjs, generate-report.mjs
  build.mjs       core -> every adapter, via an explicit GENERATED manifest
  extract.mjs     one-time bootstrap: committed variants -> marked core (LCS)

  commands/ references/ scripts/   BUILD OUTPUT at repo root (load paths UNCHANGED)
  scripts/{hook scripts} hooks/ .claude-plugin/   CC-only, hand-kept, build never touches
  adapters/codex/   beacon-*.md + shared refs/scripts BUILT; .codex-plugin/plugin.json +
                    skills/beacon/SKILL.md + goal-workflows + repeat-testing + advisor.mjs
                    hand-kept (adapters/codex/ is the Codex plugin root)
```

`build.mjs` operates on an explicit `GENERATED` manifest (not whole directories)
because the output dirs mix generated and hand-kept files; it validates parity
with `--check` (build to temp, diff only the GENERATED set). See the design spec
for the manifest and the migration-safety invariant (build reproduces committed
outputs byte-identically; `git diff` empty after build).
