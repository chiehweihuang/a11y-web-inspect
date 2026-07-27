# Codex distribution modernization — audit (hakuso)

Artifact: uncommitted working tree at `C:/Code/personal/beacon`, branch `master`,
HEAD `acf7f1e`. Producer notes: `plans/2026-07-27-codex-plugin-modernization.md`.
Environment: `codex-cli 0.145.0`, Windows 11, node via nvm4w.

## Verdict

**FIX-BEFORE-RELEASE** — one HIGH finding on the release path. The distribution
mechanism itself (manifests, install, paths, guard, docs, tests) is sound and
was verified end to end by executing it, not by reading it.

---

## Findings

### HIGH-1 — the codex plugin manifest will ship one release behind

**Where:** `.release.json:9-19` (readmeSync list) against
`~/.claude/scripts/release.mjs:210-229`.

**What's wrong.** This change introduces a *second* committed file carrying the
version (`adapters/codex/.codex-plugin/plugin.json`) and removes the
release-time sync for it (producer notes lines 12-14: the provisional
`readmeSync` entry was deleted in favour of Route A's `build --check` guard).
Route A's guard is real, but it fires at the wrong point in the release
sequence.

The release engine runs, in this order:

```
release.mjs:211   test    -> node --test          (hard gate)
release.mjs:212   verify  -> node build.mjs --check (hard gate)
release.mjs:222   setVersion(cfg, next)   <-- .claude-plugin/plugin.json bumped HERE
release.mjs:224   syncReadme(...)         <-- patches ONLY the .release.json readmeSync files
release.mjs:227   git add -A
release.mjs:228   git commit -m "chore(release): vX.Y.Z"
release.mjs:229   git tag -a vX.Y.Z
```

`node build.mjs` is never invoked. The `--check` gate passes at line 212 because
at that moment both files still agree; the bump lands eight lines later and is
committed unregenerated. `syncReadme` only touches the nine README files listed
in `.release.json:10-18`.

**Why it matters.** Codex keys its install cache by the manifest version:
`~/.codex/plugins/cache/beacon/beacon/<version>/`, and `codex plugin list`
reports that value. A release tagged v3.4.0 would install into
`.../beacon/3.3.0/` and report `"version": "3.3.0"` to every Codex user. The
`build --check` guard then fails at the *next* release's verify gate, i.e.
after the bad release has already shipped, with an error that points at a file
nobody edited.

**Evidence this is the live release path, not a hypothetical:**

```
git log --grep='chore(release)'
  0ff551f chore(release): v3.2.0      <- exactly release.mjs:228's message
  30953dd chore(release): v3.1.0
  e3d3827 chore(release): v3.0.0   f71eb2c v2.3.0   1fa9ddd v2.2.0
git show v3.2.0:.claude-plugin/plugin.json   -> "version": "3.2.0"
git show v3.2.0~1:.claude-plugin/plugin.json -> "version": "3.1.0"
```

The bump happens inside the release commit, produced by the engine. Every
release in this repo's history took this path.

**It bites on the very next cut.** `.claude-plugin/plugin.json` at HEAD is
already `3.3.0` while the last tag is `v3.2.0`, so `release.mjs apply --version
3.3.0` aborts at `release.mjs:208` (`must be greater than current`). Any route
out of that state still ends with `setVersion` writing a version the codex
manifest does not have.

### MEDIUM-1 — `.agents/plugins/marketplace.json` has no existence guard

**Where:** `test/build-manifest.test.mjs:56-64` (hand-kept set).

The file is listed in the hand-kept collision set, which only asserts that no
GENERATED output collides with it. Nothing asserts it exists. The sibling
hand-kept file `adapters/codex/skills/beacon/SKILL.md` *is* covered, because the
new reference-mention test `readFileSync`s it and would throw. If the
marketplace manifest were deleted or renamed, the suite stays green and
`codex plugin marketplace add` silently falls back to the `.claude-plugin`
compat path, resolving the plugin root to the repo root instead of
`adapters/codex` — a degraded install with no failing signal anywhere in CI.

One `existsSync` assertion closes it.

### LOW-1 — `ADAPTERS.md:78` still states the old deploy target

> "the Codex adapter must be self-contained because it deploys to
> `~/.codex/skills/beacon/`"

Present tense, now false. It sits inside the dated `### 2026-05-28` decision-log
entry, so it reads as history rather than instruction, which is why this is LOW
and not a docs-truthfulness blocker. It does not instruct `deploy-codex`.

### LOW-2 — producer-note counts are off

- Line 147: "references/*.md (14)" — actual is 13
  (`ls adapters/codex/references/*.md | wc -l` = 13; 8 REFERENCES + 3
  CONTENT-derived + 2 hand-kept).
- Line 48: "387/387 pass (385 + 2 new)" — three tests were added, actual is
  388/388.
- Lines 164-166 report the pre-addendum run (50 outputs, 385 tests) and are
  superseded by the addendum without being marked as such.

None of these change any behaviour; they only mislead a future reader
reconciling numbers.

### LOW-3 — `interface` block omits three fields every comparator sets

All seven installed comparators (`browser`, `sites`, `computer-use`,
`visualize`, `github`, `ponytail`, `superpowers`) set
`interface.longDescription`, `interface.developerName`, and
`interface.capabilities`. Beacon sets none of the three
(`tools/manifest.mjs:27`). Not required — install, list, and load all work
without them — but if the plugin ever surfaces in a picker UI it will present
thinner than its neighbours. Three lines in `CODEX_PLUGIN_TEMPLATE`.

### Uncertain — `.agents/` at the repo root is inert to Claude Code *today*

The installed Claude Code binary contains zero occurrences of
`.agents/plugins/marketplace.json` and eight of `.claude-plugin/marketplace.json`
(`grep -a -c` on `~/.local/bin/claude.exe`, 253 MB). So the new root directory
cannot affect the Claude Code surface in this version.

The forward risk: `.agents/plugins/marketplace.json` is an emerging cross-vendor
convention, and Codex resolves it *in preference to* `.claude-plugin/` (proved
below). If Claude Code adopts the same precedence, Beacon's CC plugin would
resolve to `./adapters/codex` and lose `commands/` and `hooks/`. Beacon is more
exposed here than `ponytail` or `superpowers`, which also ship both manifests
but point both at `./`; Beacon's two manifests point at different roots
(`./` vs `./adapters/codex`). Flagging as a revisit trigger, not a finding —
confidence that this matters soon is well under 80%.

---

## Required fixes

Only HIGH-1 gates the release.

**HIGH-1.** Restore the release-time sync alongside the build guard; they are
complementary, not alternatives (the guard catches hand-edits, readmeSync
catches the engine's own bump). Add one entry to `.release.json`'s `readmeSync`
array:

```json
{ "file": "adapters/codex/.codex-plugin/plugin.json", "pattern": "\"version\": \"{VERSION}\"" }
```

Verified mechanically sound: `syncReadme` (`release.mjs:186-196`) does
`pattern.replace('{VERSION}', current)` then `text.split(oldStr).join(newStr)`.
The generated manifest contains the literal `"version": "3.3.0"` exactly once
(`JSON.stringify(..., null, 2)` output), so the replacement is unambiguous, and
it runs at `release.mjs:224`, before `git add -A` at :227. `node build.mjs
--check` still passes afterwards because the resulting bytes are identical to
what `build.mjs` would have generated.

Then confirm before tagging: `.claude-plugin/plugin.json` and
`adapters/codex/.codex-plugin/plugin.json` report the same version.

---

## What was verified, and how

Everything below was executed on this machine, not read.

### 1. Clean-state install

Found state recorded first (`beacon@beacon` installed, marketplace `beacon` =
local `\\?\C:\Code\personal\beacon`, 30 files at cache version `3.3.0`), and
`~/.codex/config.toml` backed up.

```
codex plugin remove beacon@beacon        -> Removed plugin `beacon`
codex plugin marketplace remove beacon   -> Removed marketplace `beacon`
find ~/.codex/plugins/cache/beacon -type f | wc -l   -> 0   (truly clean)
```

**Remote form, as published — partially verifiable.** The exact published
command runs and resolves correctly:

```
codex plugin marketplace add chiehweihuang/beacon
  -> Added marketplace `beacon` from https://github.com/chiehweihuang/beacon.git
  -> Installed marketplace root: C:\Users\tacit\.codex\.tmp\marketplaces\beacon
```

The clone's HEAD is `acf7f1e`, the same commit as local HEAD — the remote has
the v3.3.0 content but **not** this uncommitted change, so it has no
`.agents/plugins/marketplace.json`. Against that tree Codex falls back to the
`.claude-plugin` compat path and resolves the plugin to the repo *root*:

```
codex plugin list --marketplace beacon --available --json
  -> source.path: C:\Users\tacit\.codex\.tmp\marketplaces\beacon        (repo root)
```

So: the published command's **syntax and remote resolution are verified**; its
**post-push result cannot be verified against the real remote until the change
is pushed.**

**Post-push simulated faithfully.** The git-materialized marketplace root was
brought up to the artifact's exact state — full `git diff HEAD` applied (28
hunks, including the `SKILL.md` move and the `deploy-codex.mjs` deletion) plus
the three untracked additions copied in. Resolution flipped:

```
codex plugin list --marketplace beacon --available --json
  -> source.path: C:\Users\tacit\.codex\.tmp\marketplaces\beacon\adapters\codex
codex plugin add beacon@beacon
  -> Installed plugin root: C:\Users\tacit\.codex\plugins\cache\beacon\beacon\3.3.0
```

This establishes the precedence rule the change depends on: on a **git-sourced**
marketplace whose root carries both manifests, `.agents/plugins/marketplace.json`
wins over `.claude-plugin/marketplace.json`. (The local-path form was already
known to behave this way; this confirms it holds for the git path too, which is
the one the docs publish.)

Installed tree, 30 files: `.codex-plugin/plugin.json`, `references/*.md` (13),
`scripts/*.mjs` (12), `scripts/patterns/*.json` (3), `skills/beacon/SKILL.md`.
No `commands/`, no `hooks/`, no `core/`, no `test/` — the plugin root is
correctly `adapters/codex`, not the repo root.

**Dev form.** `ADAPTERS.md:86` publishes `codex plugin marketplace add .`; run
from the repo root it resolves to `\\?\C:\Code\personal\beacon`, identical to
the absolute-path form the producer used.

### 2. Format cross-check (seven comparators)

Read `.codex-plugin/plugin.json` from five OpenAI plugins (`browser`, `sites`,
`computer-use`, `visualize`, `github`) and two third-party ones (`ponytail`
4.8.4, `superpowers` 6.2.0 — both, like Beacon, ship `.agents/` and
`.claude-plugin/` side by side).

- **Fields Beacon sets that no comparator sets: none.** Every field in
  `CODEX_PLUGIN_TEMPLATE` appears in at least two comparators, including
  `repository` (browser, computer-use, github, ponytail, superpowers) and
  `author.url` (sites, computer-use, github, ponytail, superpowers).
- **Required fields omitted: none observable.** `skills` is a string
  (`"./skills/"`) in all seven, matching Beacon — the producer's read of this
  as a string rather than an array is correct.
- **Fields others set that Beacon omits:** `interface.longDescription`,
  `developerName`, `capabilities` (all seven set all three — see LOW-3);
  plus display assets (`logo`, `composerIcon`, `brandColor`, `defaultPrompt`,
  `screenshots`) which are ChatGPT-app-surface metadata.
- **`hooks` correctly omitted.** `ponytail` sets `"hooks": "./hooks/..."` and
  `superpowers` sets `"hooks": {}`; Beacon's Codex plugin root has no hooks, so
  omitting the key is right, not an oversight.
- **Marketplace root manifest** matches `openai-bundled`'s shape field for
  field: `name`, `interface.displayName`, `plugins[].{name, source{source,
  path}, policy{installation, authentication}, category}`. `"Engineering"` is
  an observed-valid category (`browser` uses it).
- **SKILL.md frontmatter** is `name` + `description` only, matching
  `latex-compile` and `browser`'s skills.
- **Plugin-root-relative script paths** match OpenAI's own convention: the
  bundled `latex` skills say "Run from the plugin root:" then
  `python3 scripts/compile_latex.py`. No `PLUGIN_ROOT`-style env var exists in
  any bundled plugin, so the relative form is the convention, not a workaround.

### 3. Version guard — bump simulation and bypass attempts

Reproduced independently (canonical bumped to `9.9.9`):

```
node build.mjs --check
  -> --check: adapters/codex/.codex-plugin/plugin.json differs from core regeneration
  -> --check: 1 stale output(s).                                   exit 1
node build.mjs            -> build: wrote 51 generated files from core/.
  codex plugin.json now "version": "9.9.9"                          (bump followed)
node build.mjs --check    -> --check: all 51 outputs match core.    exit 0
restore + rebuild + recheck                                          exit 0
```

**The guard cannot be bypassed from the adapter side.** Two attempts, canonical
left untouched:

```
edit only adapter version 3.3.0 -> 4.0.0   -> --check exit 1 (1 stale output)
edit only adapter license MIT -> GPL-3.0   -> --check exit 1 (1 stale output)
```

`--check` compares full regenerated content, not just the version field, so any
hand-edit to the adapter manifest is caught. The guard is genuine within the
repo. Its limitation is *when* it runs during a release — HIGH-1.

### 4. Path correctness from the installed location

Resolved every `references/*` and `scripts/*` path mentioned in the installed
copy against `~/.codex/plugins/cache/beacon/beacon/3.3.0/`, not the repo.

- `skills/beacon/SKILL.md`: 16 distinct paths, **all resolve** (13 references,
  3 scripts). Confirms the plan's claim that paths resolve against the plugin
  root, not the skill folder — `SKILL.md` sits two levels down at
  `skills/beacon/` and its `references/...` paths still resolve.
- Installed `references/*.md`: all resolve except
  `references/accessibility-statement-template.md`, cited at
  `references/beacon-inspect.md:731` and explicitly guarded with "(if it
  exists)". Pre-existing — the file is absent from `core/references/` and the
  repo too, so this change neither introduced nor worsened it.
- **No leaked absolute or Claude-side paths in the installed payload**: grep
  for `CLAUDE_PLUGIN_ROOT`, `.claude/plugins`, `~/.codex/skills`, and
  `claude-plugin` across all installed `.md` and `.mjs` returns nothing.

**Scripts actually run from the installed copy**, and are cwd-independent:

```
cd <installed root> && node scripts/static-audit.mjs --scope "audit fixture" \
    --output <scratch>/a.json <repo>/test/tier2-fixtures/contrast.html
  -> Static baseline score: 26 at 23% weight coverage (7 findings, 1 critical, 2 warning, 4 tip)   exit 0
cd <installed root> && node scripts/advisor.mjs <fixture>                    exit 0
cd <a different project> && node <installed root>/scripts/static-audit.mjs   exit 0  (same score)
cd <a different project> && node <installed root>/scripts/generate-report.mjs -> 101 KB report, exit 0
```

Score 26 at 23% matches the producer's reported figure.

### 5. Docs truthfulness

- All nine READMEs carry the identical two-line block
  (`README.md:182-183`, and `:104-105` / `:106-107` in the eight translations):
  `codex plugin marketplace add chiehweihuang/beacon` /
  `codex plugin add beacon@beacon`. Both `docs/index.html:190-191` and
  `docs/zh-Hant.html:190-191` carry the same pair — **en and zh agree**.
- Both published commands are the ones actually verified above.
- Nothing instructs `deploy-codex` any more. Remaining mentions are
  `CHANGELOG.md:528` (history) and `docs/superpowers/plans|specs/2026-05-30-*`
  (historical planning documents). `ADAPTERS.md:78` is LOW-1.

### 6. `deploy-codex` retirement claim, independently confirmed

The claim that `plugin add` re-syncs from live source (rather than
snapshot-and-forget) was checked without editing any repo file, using an
existing byte-level discriminator: `adapters/codex/references/repeat-testing.md`
has CRLF endings in the working tree, while the git-materialized clone of the
same file has LF. After reinstalling from the local path:

```
md5sum <repo>/adapters/codex/references/repeat-testing.md            46c2f861e7cf75857ab317384524b624
md5sum <cache>/3.3.0/references/repeat-testing.md                    46c2f861e7cf75857ab317384524b624
```

The cache mirrors the live working tree byte for byte, including line endings.
Re-running `plugin add` after an edit does pick the edit up. Retiring the script
is justified.

### 7. Regression

```
node --test           -> tests 388 | pass 388 | fail 0
node build.mjs --check -> --check: all 51 outputs match core.       exit 0
```

Both match the expected figures. Claude Code surface: `.claude-plugin/` is
absent from `git status` (unmodified in substance), as are `commands/`,
`hooks/`, `scripts/`, and root `references/`; `.claude-plugin/plugin.json` still
declares `"skills": ["./commands/"]`. The only root-level addition is
`.agents/`, which the installed Claude Code binary does not read (see
Uncertain, above).

---

## State left behind

The Codex install was restored to exactly the state it was found in:
`beacon@beacon` installed and enabled, marketplace `beacon` = local
`\\?\C:\Code\personal\beacon`, plugin source `...\beacon\adapters\codex`, 30
files at cache version `3.3.0`. A real `diff -u` against the pre-audit
`~/.codex/config.toml` backup shows one changed line — `[marketplaces.beacon]
last_updated`, `09:46:05Z` -> `10:15:35Z`. Nothing else.

The temporary git-marketplace snapshot used for the post-push simulation
(`~/.codex/.tmp/marketplaces/beacon`) was deleted by
`codex plugin marketplace remove` and is gone; it never touched the repo.

Repo tree: md5 manifest of all 297 non-`.git` files taken before the guard
simulation and again after; `diff` reports them identical. The working tree is
byte-for-byte as found.

Pre-existing, unrelated: `~/.codex/config.toml:331-338` holds three orphaned
`hooks.state."beacon@beacon:hooks/hooks.json:*"` trusted-hash entries, residue
from the earlier compat-path install when the plugin root was the repo root.
`codex plugin remove` does not clean them. They were present before this audit,
are inert under the new plugin root (which has no `hooks/`), and were left
untouched.

---

# Appendix — final integration gate (hakuso, second pass)

Artifact: uncommitted working tree at `C:/Code/personal/beacon`, HEAD still
`acf7f1e`, 298 non-`.git` files. Two workstreams landed since the audit above:
**A** = the HIGH-1/MEDIUM-1/LOW-2 fixes from that audit; **B** = two detector
bugs from the WCAG coverage measurement (engine `@11` → `@12`).

## Verdict

**FIX-BEFORE-RELEASE** — one HIGH, in workstream B. Workstream A is fully
closed and verified by executing the real release engine. Everything else on
the gate list passes.

The HIGH is not "B broke something that worked". It is that B's 2.4.2 fix
over-corrected: the one new finding it produces across the whole 86-site
benchmark is a false positive, and two shipped documents record that false
positive as evidence the fix works.

---

## HIGH-2 — `extractDocumentTitle`'s head-scope is a false positive, and it is documented as a success

**Where:** `core/scripts/static-audit.mjs:549-560` (`extractDocumentTitle`),
plus the claims at `VALIDATION.md` (`@12` section, the "same scope a real
browser's `document.title` and axe's `document-title` rule use" parenthetical)
and `CHANGELOG.md` ("one genuine new catch (linear.app snapshot …)").

### The semantics claim is false

Probed four fixtures in real Chromium (`playwright-core`, chromium-1228), JS
enabled, reading `document.title` directly:

| fixture | `document.title` | axe `doc-has-title` | Beacon `@12` |
|---|---|---|---|
| `<title>` only in `<div hidden>` in body | `"Body Title"` | pass | **FINDING** |
| `<svg><title>icon label</title></svg>` in head, no real title | `""` | fail | FINDING ✓ |
| `<title>   </title>` in head | `""` | fail | FINDING ✓ |
| real `<title>` in head | `"Real Title"` | pass | no finding ✓ |

A `<title>` in the body **does** set `document.title` — the parser routes an
in-body `title` start tag through the in-head rules, and it remains the first
HTML `title` element in tree order. An `<svg><title>` does **not**, because it
is an `SVGTitleElement`, not an `HTMLTitleElement`. So the browser's real rule
is "first **HTML** `title` element, trimmed, non-empty" — which is *not* head
scope. B gets the SVG and whitespace cases right and the body case wrong.

### The one "new catch" is that wrong case

The producer's snapshot population is at
`C:/Code/personal/beacon-benchmark-100/run-2026-07-05/snapshots/` (86 files;
not in this repo). Their description of idx 77 is accurate — in
`snapshots/77.html` the only `<title>` sits at offset 621019, inside
`<div hidden="">` in the body, with `</head>` at 62491. But loading that exact
snapshot in Chromium with **JavaScript disabled** (so the measurement is the
parsed document a static scanner and an AT both see):

```
documentTitle        : "Linear – The system for product development"
titleCount           : 1
firstTitleInHead     : false
firstTitleParentChain: ["DIV[hidden]", "BODY", "HTML"]
axe doc-has-title    : true      <- axe PASSES this page
```

Beacon `@12` reports `document-title-missing` on a page whose title the browser
and axe both resolve correctly. That is a false positive, not a catch.

### Reproduced the benchmark numbers, and the alternative

Re-ran the 86-site comparison independently — three engines on the same
snapshots (`@11`, shipped `@12`, and a variant that keeps B's svg-strip and
non-empty-trim but drops the head scope):

```
snapshots: 86
@11 -> @12 (shipped):           ADDED 1 ["77.html"]   REMOVED 0 []
@11 -> variant (no head scope): ADDED 0 []            REMOVED 0 []
shipped-@12 vs variant disagreements: 1
   {"f":"77.html","shipped12":"FINDING","variant":"title"}
```

So the producer's count ("0 removed, 1 new catch") is arithmetically correct
and independently reproduced. The characterisation is what fails: 1 of 1 new
findings is a false positive, and the variant fixes both original fixture bugs
with zero benchmark churn.

### Why this gates the release

Not because a rare shape misfires. Because `VALIDATION.md` is Beacon's evidence
ledger and v3.3.0's stated theme is claim reconciliation, and the change writes
into it (a) a false statement about browser and axe semantics and (b) a false
positive presented as validation that the fix has value. Shipping that is worse
than shipping the detector bug.

### Required fix

In `core/scripts/static-audit.mjs`, drop the head-scope from
`extractDocumentTitle` — strip `<svg>…</svg>` from the whole document, take the
first remaining `<title>`, require non-empty trimmed text. That is a strictly
smaller function than what shipped and it matches `document.title` on all four
probed shapes. Then `node build.mjs` to re-mirror, and regenerate the goldens
if the fingerprint moves.

All three of B's new tests still pass under this variant (checked against the
fixtures in `test/static-audit-detectors.test.mjs:349-372`): the svg-title
fixture puts its `<svg>` in the body, so svg-stripping alone still flags it; the
whitespace fixture is caught by the trim; the positive control has a real head
title that survives svg-stripping.

Then correct the two documents: `VALIDATION.md`'s browser/axe parenthetical, and
the `CHANGELOG.md` + `VALIDATION.md` linear.app sentences (with the fix applied,
the honest line is "zero removed, zero added across 86 sites" — the fix is
justified by the two fixture bugs, which is enough). `plans/2026-07-27-wcag-
coverage-measurement.md:107`'s 2.4.2 row note repeats the same head-scope
justification and needs the same correction; the **FULL** classification itself
survives, since presence/non-emptiness remains fully decidable.

---

## Gate items verified

### 1. Release simulation on the current tree — PASS, HIGH-1 genuinely closed

Ran the **unmodified** `~/.claude/scripts/release.mjs` in a full copy of the
current tree (history preserved, working tree committed, `origin` removed so the
run halts at `git push`). Only environment-mutating hooks were neutered in the
scratch copy's `.release.json` — `prePublish`/`postRelease` (both `gh auth
switch`) and `githubRelease`; `versionFile`, `test`, `verify`, and the entire
`readmeSync` array were left exactly as the artifact ships them.

```
> test:   node --test          (passed)
> verify: node build.mjs --check (passed)
... mutations, commit, tag ...
fatal: 'origin' does not appear to be a git repository     <- halted at line 233, as intended

git log -1                -> ec1ca45 chore(release): v3.4.0
git tag                   -> v3.4.0
git status --porcelain    -> (empty)
git show v3.4.0:.claude-plugin/plugin.json                -> 3.4.0
git show v3.4.0:adapters/codex/.codex-plugin/plugin.json  -> 3.4.0
git show --stat v3.4.0    -> .claude-plugin/plugin.json               | 2 +-
                             adapters/codex/.codex-plugin/plugin.json | 2 +-
node build.mjs --check on the tagged state -> all 51 outputs match core.   exit 0
```

Both manifests carry the new version **in the release commit itself**, and the
committed state is already regeneration-clean, so the next release's verify gate
starts green rather than inheriting drift.

**Cache-dir-by-version failure mode, closed by execution.** Installed the
simulated v3.4.0 tree through Codex:

```
codex plugin add beacon@beacon
  -> Installed plugin root: C:\Users\tacit\.codex\plugins\cache\beacon\beacon\3.4.0
ls ~/.codex/plugins/cache/beacon/beacon/   -> 3.4.0/
codex plugin list --json                   -> beacon@beacon 3.4.0
```

Under the pre-fix config this would have landed in `…/beacon/3.3.0/` and
reported `3.3.0`. The scratch clone (and its `v3.4.0` tag) never touched the
real repository, which is still at `acf7f1e` with `v3.2.0` as its latest tag.

**MEDIUM-1 closed.** `test/build-manifest.test.mjs:57-63` now parses
`.agents/plugins/marketplace.json` (throws if missing or renamed) and asserts
`plugin.source.path === './adapters/codex'`.

### 2. Golden diff — PASS, fingerprint-only, verified not assumed

`git diff` on `test/golden/{clean,dirty}.expected.json` is one changed line per
file: `beacon-static-audit@11+ruleset.25eeae0aa809` →
`@12+ruleset.25eeae0aa809`. Nothing else moved.

The unchanged ruleset segment is correct rather than suspicious:
`rulesetHash()` (`core/scripts/static-audit.mjs:92-101`) hashes only
`CATEGORY_WEIGHTS`, `SEVERITY_MATRIX`, `SCORE_BANDS`, `THIN_EVIDENCE_MIN`, and
the formula string — never detector code. Detector changes are meant to move
only the `@N` segment, which is exactly what happened.

GT-retention and the 86-site claim: see HIGH-2. The numbers reproduce; the
interpretation of the single new finding does not.

### 3. `html-lang-invalid` — PASS on every sub-item

**No duplicate-finding overlap.** Ran the two probes through
`core/scripts/static-audit.mjs`:

```
lang="jp"       -> html-lang-mismatch  (only)
lang="english"  -> html-lang-invalid   (only)
```

The gating is structurally sound, not just empirically: `html-lang-invalid` sits
in the `else if` of the presence check and `assessLang` runs only under
`if (langMatch && isWellFormedLangTag(...))`, so the three outcomes (missing /
invalid / assessed) are mutually exclusive by construction.

**Presence regex.** `/<html\b[^>]*\slang\s*=\s*["']?([^\s"'>]+)/i` — the
required `\s` is what excludes `xml:lang=` and `data-lang=` (the character
before `lang` is `:` or `-`, not whitespace). Quoted, unquoted, and
newline-separated attributes all still match.

**Bilingual copy.** Generated a report containing the finding and grepped the
rendered HTML: zh title, zh fix, zh `standard`, en title, en fix, en `standard`
all present; both the `標準` and `Standard` labels render.

**Version stamping.** `beacon-static-audit@12` in all three mirrors
(`core/scripts/`, `scripts/`, `adapters/codex/scripts/`, all at line 85) and in
both goldens. Zero occurrences of `static-audit@11` anywhere in shipped code or
goldens (remaining hits are CHANGELOG/VALIDATION history, plans, and benchmark
records, all correctly historical).

Observation, not a finding: the new finding declares `severity: 'warning'` but
emits as `critical`, because `mandatedSeverity()`
(`core/scripts/static-audit.mjs:114-117`) overrides from `SEVERITY_MATRIX` by
WCAG criterion. That is the pre-existing systemic rule and matches its
`html-lang-*` siblings; the literal `'warning'` is simply inert.

### 4. Whole tree — PASS

```
node --test              -> tests 397 | pass 397 | fail 0
node build.mjs --check   -> all 51 outputs match core.       exit 0
```

Report generated and self-scanned:

```
static-audit on test/tier2-fixtures  -> score 27, 45 findings (6 crit / 16 warn / 23 tip)
generate-report                      -> gate-report.html
static-audit on gate-report.html     -> score 86, 4 findings, 0 critical, 0 warning, 4 tip
```

Horizontal scroll, real Chromium, both generated reports:

```
gate-report.html    @320  scrollW=320  clientW=320  h-scroll=no
gate-report.html    @1280 scrollW=1280 clientW=1280 h-scroll=no
invalid-report.html @320  scrollW=320  clientW=320  h-scroll=no
invalid-report.html @1280 scrollW=1280 clientW=1280 h-scroll=no
```

Codex install end-to-end after B's changes — removed, re-added, reinstalled from
the real repo, then ran B's own new detector from the installed copy:

```
codex plugin marketplace add . && codex plugin add beacon@beacon
installed tree: 30 files
installed scripts/static-audit.mjs:85 -> 'beacon-static-audit@12'
cd <installed root> && node scripts/static-audit.mjs <english.html>
  -> fingerprint beacon-static-audit@12+ruleset.25eeae0aa809
  -> html-lang-invalid                                          exit 0
```

**The A↔B seam is clean.** B edited `core/scripts/` only; A's build guard is
what proves the two generated mirrors followed (`--check` 51/51), and the
installed Codex copy independently reads `@12`, so the generation path, the
version guard, and the new detectors compose correctly.

### 5. Coverage measurement doc — figures consistent; one justification stale

Parsed the table mechanically: 55 criterion rows, no duplicates. Coverage
column: 2 FULL (`2.4.2`, `3.1.1`), 10 `PARTIAL` + 2 `PARTIAL†` = 12 PARTIAL, 41
NONE. Machine-testable column: 47 `YES` + 1 `YES (specialized frame analysis)` =
48, and 7 `NO`.

Against the doc's stated figures (lines 144-154):

| figure | doc | recomputed |
|---|---|---|
| any coverage / 55 | 14/55 = 25.5% | 2+12 = 14; 14/55 = 25.45% → 25.5% ✓ |
| FULL / 55 | 2/55 = 3.6% | 2/55 = 3.64% ✓ |
| any coverage / 48 | 14/48 = 29.2% | 14/48 = 29.17% ✓ |
| FULL / 48 | 2/48 = 4.2% | 2/48 = 4.17% ✓ |

All four are internally consistent and consistent with the table, and the
48 = 55 − 7 denominator checks out.

Against the fixed code: **3.1.1's return to FULL holds** — both cited bugs are
genuinely fixed and I reproduced both fixes and the non-overlap first-hand.
**2.4.2's return to FULL holds as a classification** (presence and
non-emptiness remain fully machine-decidable), but the row's justification at
line 107 restates the head-scope rationale falsified in HIGH-2 and goes stale
with the fix. Nothing else in the document is made stale by B.

---

## State left behind

Repo working tree: md5 manifest of all 298 non-`.git` files taken before and
after this pass — `diff` reports them identical. Real repo still at `acf7f1e`,
latest tag `v3.2.0`, no new tags or commits.

Codex install restored to the found state: `beacon@beacon` enabled, marketplace
`beacon` = local `\\?\C:\Code\personal\beacon`, plugin source
`…\beacon\adapters\codex`, 30 files at cache version `3.3.0`. Only
`[marketplaces.beacon] last_updated` differs from the pre-pass value.

`gh` auth untouched — `devBrightRaven` still the active account (the release
simulation's `prePublish` hook was neutered precisely so it could not run
`gh auth switch`).

The simulation clone and all probe artifacts live in this session's scratchpad,
outside the repository; the `v3.4.0` tag exists only there.

---

# Appendix 2 — HIGH-2 fix confirmation (hakuso, third pass)

Scope: HIGH-2 only. Tree at HEAD `acf7f1e`, 298 non-`.git` files.

## Verdict

**PASS.** HIGH-2 is closed. No new findings. Nothing else outstanding from
either earlier pass — clear to cut v3.3.0.

## Checks

**1. Browser semantics — 4/4 agree, including the case that exposed the bug.**
Lifted `extractDocumentTitle` verbatim out of `core/scripts/static-audit.mjs`
(parsed from the file, not hand-copied) and ran it against real Chromium with
JS disabled:

```
hidden-body-div   document.title="Body Title"   axe=true   beacon=true   AGREE
svg-title-only    document.title=""             axe=false  beacon=false  AGREE
whitespace-title  document.title=""             axe=false  beacon=false  AGREE
real-title        document.title="Real Title"   axe=true   beacon=true   AGREE
```

The shipped function is the three-line version — svg-strip, first remaining
`<title>`, non-empty trim — and its comment now states the correct rule.

**2. 86-site diff — ADDED 0 / REMOVED 0**, recomputed with that same lifted
function over `beacon-benchmark-100/run-2026-07-05/snapshots/` (86 files).
Snapshot 77 now resolves `"Linear – The system for product development"`
instead of flagging.

**3. No false-evidence sentence survives.** Grepped `linear.app`, "same scope",
"genuine new catch", "new catch" across `VALIDATION.md`, `CHANGELOG.md`,
`plans/`, `docs/`, `README*`, and all three script mirrors. Every remaining
`linear.app` hit belongs to the unrelated tier-2 contrast calibration.
`VALIDATION.md:396-407` and the `CHANGELOG` `@12` entry now record the head/body
scope as a mid-pass false positive that was found and dropped;
`plans/2026-07-27-wcag-coverage-measurement.md:107` carries the corrected
rationale. The record is accurate and self-critical.

**4. Goldens** — one changed line per file, `@11` → `@12`, ruleset segment
unchanged. Fingerprint-only.

**5. 2.4.2 stays legitimately FULL.** Presence and non-emptiness remain fully
machine-decidable, and the check now matches `document.title`/axe on every
probed shape. New regression fixture present at
`test/static-audit-detectors.test.mjs:379-385` (hidden-body-div title must not
flag).

Accepted pre-existing ceiling, not a regression and not gating: a `<title>`
inside a `<template>` is inert in the DOM (`document.title=""`) but still
matches the raw-text scan, so it reads as present — verified identical under
`@11`, so this fix neither introduces nor worsens it, and the direction is a
miss rather than a false alarm.

**6. Whole tree.** `node build.mjs --check` → all 51 outputs match, exit 0.
`node --test` → 398 tests, 398 pass, 0 fail. Report generated from
`test/tier2-fixtures` (score 27, 45 findings) and self-scanned: score 86, 4
findings, **0 critical / 0 warning**, 4 tip.

## State left behind

Repo tree byte-identical (md5 manifest of all 298 files before and after —
`diff` clean). Still `acf7f1e`, latest tag `v3.2.0`. Codex install untouched:
`beacon@beacon` 3.3.0 from `C:\Code\personal\beacon\adapters\codex`. All probe
artifacts are in this session's scratchpad, outside the repository.
