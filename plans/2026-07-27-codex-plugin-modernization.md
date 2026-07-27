# Codex plugin modernization

## Addendum — version sync + drift guard (same day, follow-up scope)

Route chosen: **build.mjs generation (Route A)**, not `.release.json`
readmeSync. Reason: the format does not forbid it — `.codex-plugin/plugin.json`
is a committed file at a fixed path exactly like every other GENERATED output
(`commands/*.md` etc.), so there's no format obstacle. Route A gets a REAL
in-repo guard (`node build.mjs --check` + the existing test suite); Route B
(readmeSync) has no consumer/guard inside this repo at all (verified earlier:
no release script lives in this repo, `.release.json` is read by an external
personal tool) — a version could drift there with nothing catching it. Kept
the readmeSync entry I'd provisionally added for the 9 READMEs; removed the
one I'd added for the codex plugin.json (superseded by Route A).

Implementation: `tools/manifest.mjs` gained `CODEX_PLUGIN_TEMPLATE` (the
static, non-version fields) and one new GENERATED entry — `out:
adapters/codex/.codex-plugin/plugin.json`, `src: .claude-plugin/plugin.json`,
`kind: 'codex-plugin-manifest'`. `build.mjs`'s `render()` handles that kind by
reading the canonical file's `version` field and merging it onto the
template. One canonical version (`.claude-plugin/plugin.json`), one place it
gets bumped, the codex manifest is now 100% derived, never hand-edited.

Guard: **build --check failure**, exercised by two tests in
`test/build-manifest.test.mjs` — the pre-existing generic "build --check
passes on a clean tree" test (now covers this file same as every other
GENERATED output) plus a new dedicated test, `'build --check fails when the
CC version bumps without regenerating the codex plugin manifest, then passes
after rebuild'`, mirroring the existing hand-edit/restore pattern.

Bump simulation (real, on this machine):
```
before: adapters/codex/.codex-plugin/plugin.json -> "version": "3.3.0"
bumped .claude-plugin/plugin.json -> "version": "9.9.9-dummy"
node build.mjs --check
  -> "--check: adapters/codex/.codex-plugin/plugin.json differs from core regeneration"
  -> "--check: 1 stale output(s)."  (exit 1 — guard fires)
node build.mjs
  -> codex plugin.json version now "9.9.9-dummy" (followed the bump)
node build.mjs --check
  -> "--check: all 51 outputs match core." (exit 0 — guard clears once rebuilt)
restored .claude-plugin/plugin.json -> "3.3.0"; node build.mjs; node build.mjs --check -> exit 0, clean.
```
Re-ran `codex plugin add beacon@beacon` afterward to re-sync the installed
cache; confirmed `.codex-plugin/plugin.json` there reads `"version": "3.3.0"`.

Full suite after this addendum: `node build.mjs --check` clean (51 outputs).
Final test count across all rounds (this addendum plus the later drift-risk
round below): `node --test` 388/388 pass (385 original + 3 new: the
manifest-mapping assertion, the version-drift guard test, and the SKILL.md
reference-coverage test).

Operational note: cutting a release must run `node build.mjs` after bumping
`.claude-plugin/plugin.json`'s version and before tagging — same discipline
the repo already requires for the CC/codex content-variant outputs; nothing
new conceptually, just one more file under the same existing guard.


Moved Beacon's Codex distribution from a hand-copy script
(`tools/deploy-codex.mjs` -> `~/.codex/skills/beacon/`) to Codex's native
plugin-marketplace mechanism (`codex plugin marketplace add` / `codex plugin
add`).

## Format spec (reverse-engineered, no committed JSON schema found)

Evidence: `codex plugin marketplace --help`, `codex plugin add --help`, and
the on-disk shape of already-installed OpenAI-bundled plugins under
`~/.codex/.tmp/bundled-marketplaces/openai-bundled/` (repo:
`~/.codex/.tmp/marketplaces/*` for git-sourced ones).

- Marketplace root manifest: `.agents/plugins/marketplace.json`
  ```json
  { "name": "...", "interface": {"displayName": "..."},
    "plugins": [{ "name": "...", "source": {"source":"local","path":"./plugins/x"},
      "policy": {"installation":"AVAILABLE","authentication":"ON_INSTALL"}, "category":"..." }] }
  ```
- Per-plugin manifest at the plugin root: `.codex-plugin/plugin.json` — fields
  observed across `browser`, `sites`, `latex`, `computer-use`: name, version,
  description, author, homepage, repository, license, keywords, `skills`
  (a STRING path, e.g. `"./skills/"`, not an array), optional `interface`
  block (displayName/category/capabilities/logos — app-store display, not
  required for a local dev-tool plugin).
- Skills live at `skills/<skill-name>/SKILL.md` (Agent Skills convention,
  same shape as Claude Code) — never loose at the plugin root.
- `scripts/` and `references/` live at the **plugin root** (sibling to
  `skills/`), not nested per-skill. SKILL.md examples (`plugins/latex/skills/
  latex-compile/SKILL.md`) reference them with plain relative paths
  ("run from the plugin root: `python3 scripts/compile_latex.py`") — paths
  resolve against plugin root, not the skill's own folder.
- Codex also has an undocumented compat path that reads Claude Code's
  `.claude-plugin/marketplace.json` + `.claude-plugin/plugin.json` directly
  (this is how `beacon@beacon` was already installed, sourced from
  `chiehweihuang/beacon.git`, before this change). The native manifests
  above are the supported/documented shape this repo now ships instead of
  relying on that compat path.

## Files added / changed

- NEW `adapters/codex/.codex-plugin/plugin.json` — plugin manifest, plugin
  root = `adapters/codex/` (unchanged location; scripts/references stay put,
  build.mjs/manifest.mjs untouched).
- NEW `.agents/plugins/marketplace.json` (repo root) — lists plugin `beacon`
  at `source.path: "./adapters/codex"`. Repo self-hosts both marketplace and
  plugin, same pattern as `.claude-plugin/`.
- MOVED `adapters/codex/SKILL.md` -> `adapters/codex/skills/beacon/SKILL.md`
  (hand-kept, not build-generated — pure relocation). Fixed 4 absolute-path
  command examples (`~/.codex/skills/beacon/scripts/...` -> `scripts/...`,
  relative to plugin root) since the marketplace-cache install path is no
  longer that fixed location.
- `adapters/codex/references/repeat-testing.md` — same absolute-path fix (4
  occurrences).
- `test/build-manifest.test.mjs` — updated the hand-kept-file fixture set to
  the new SKILL.md path + the two new manifest files.
- `ADAPTERS.md` — surfaces table + Phase A target-structure diagram updated
  for the new plugin-root layout and native install command.
- `README.md` + all 8 translations + `docs/index.html` + `docs/zh-Hant.html`
  — Codex install section now shows `codex plugin marketplace add
  chiehweihuang/beacon && codex plugin add beacon@beacon` as primary,
  replacing the deploy-script instructions.
- `.release.json` — removed `node tools/deploy-codex.mjs` from
  `postRelease` (dead script, see below); added a `readmeSync` entry so
  `adapters/codex/.codex-plugin/plugin.json`'s `"version"` field stays in
  sync with releases (it would otherwise silently drift, since
  `versionFile` only patches `.claude-plugin/plugin.json`).

## `tools/deploy-codex.mjs` — retired

Deleted. Verified empirically: `codex plugin marketplace add <local-path>`
does NOT snapshot-and-forget — re-running `codex plugin add beacon@beacon`
after editing local source files re-syncs the installed cache from the live
repo (tested: appended a marker line to `advisor.mjs`, re-ran `plugin add`,
the cache copy picked it up). Codex's own CLI now fully covers the
dev-loop deploy-codex.mjs used to serve; a second copy mechanism would only
be able to drift from it (rung 1: doesn't need to exist).

## Real install proof (this machine)

```
codex plugin remove beacon@beacon            # removed prior git-sourced compat install
codex plugin marketplace remove beacon
codex plugin marketplace add /c/Code/personal/beacon
  -> {"marketplaceName":"beacon","installedRoot":"C:\\Code\\personal\\beacon","alreadyAdded":false}
codex plugin list --marketplace beacon --available --json
  -> beacon@beacon, version 3.3.0, source local path ...\beacon\adapters\codex
codex plugin add beacon@beacon
  -> {"pluginId":"beacon@beacon", ..., "installedPath":"C:\\Users\\tacit\\.codex\\plugins\\cache\\beacon\\beacon\\3.3.0"}
```

Installed cache contents confirmed: `references/*.md` (13), `scripts/*.mjs`
(12) + `scripts/patterns/*.json` (3), `skills/beacon/SKILL.md`.

Ran a real command through the installed copy:
```
node ~/.codex/plugins/cache/beacon/beacon/3.3.0/scripts/static-audit.mjs \
  --scope "contrast fixture" --output <scratch>/audit-results.json \
  test/tier2-fixtures/contrast.html
-> Static baseline score: 26 at 23% weight coverage (7 finding(s), 1 critical, 2 warning, 4 tip)
```

Repeatability: `codex plugin remove beacon@beacon` then `codex plugin add
beacon@beacon` again — reinstalled cleanly, `codex plugin list --json`
confirms `beacon@beacon` present again.

## Build / test status

- `node build.mjs` — wrote 50 generated files from core/.
- `node build.mjs --check` — clean, all 50 outputs match core.
- `node --test` — 385/385 pass, 0 fail.

(Superseded by later rounds — see the addendum above and the drift-risk /
release-sequencing sections below for the final 51-output, 388-test state.)

## What the native format cannot express (vs. the old hand-copied adapter)

- No hook system (already true before this change — Codex has no
  PostToolUse/SessionStart equivalent; unaffected).
- The `.codex-plugin/plugin.json` `skills` field is a single string (one
  skills directory), not per-skill metadata beyond each `SKILL.md`'s own
  frontmatter — fine for Beacon's single `beacon` skill, but if Beacon ever
  wanted separate guide/advisor/inspect Codex skills (mirroring CC's three
  commands) they'd each need their own `skills/<name>/SKILL.md` folder;
  today it's one skill folder covering all three modes, matching the
  pre-existing single-SKILL.md design (not a regression, just noting the
  ceiling).
- Local marketplace installs snapshot into `~/.codex/plugins/cache/...` on
  `add`/re-`add`; there is no live-symlink option, so a stale session that
  never re-runs `plugin add` after an edit will keep running old cached
  content until the next `plugin add`.
