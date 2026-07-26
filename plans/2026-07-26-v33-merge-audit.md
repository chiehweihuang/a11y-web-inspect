# v3.3.0 merge audit — five agents' concurrent work, frozen tree (2026-07-26)

Auditor: hakuso. Scope: the INTERACTIONS between the five uncommitted workstreams on
`master` @ `7453725`, not each one in isolation. Every claim below was produced by running
something on the current tree; commands are quoted so any of them can be re-run.

## Verdict

**FIX-BEFORE-COMMIT** — 5 HIGH, 4 MEDIUM, 3 LOW. Whole-tree health is green (381/381,
build `--check` 50/50, demo reports byte-identical to a fresh render, self-scan 0
critical/0 warning, no horizontal scroll 320-1920 in both themes, font gate clean). The
blockers are all cross-agent: one feature that no longer connects to the pipeline that
feeds it, three copy/claim sets that the other agents' changes falsified, the version skew
the team lead already spotted, and a commit-hygiene trap that would break a clean checkout.

## Whole-tree health (all verified, this tree)

| Check | Command | Result |
|---|---|---|
| Test suite | `node --test` | **381 pass / 0 fail** (matches the expected 381) |
| Mirror sync | `node build.mjs --check` | `all 50 outputs match core.` exit 0 |
| Demo reports current | re-ran `static-audit` + `generate-report` on `docs/index.html` and `test/golden/dirty.html` (`--date 2026-07-26`), stripped the injected `<nav>`, byte-compared | **IDENTICAL** for both `docs/reports/landing-self-audit.html` and `docs/reports/broken-fixture.html` — the committed reports match the engine + renderer actually in the tree |
| Landing badge | re-audit `docs/index.html` | score **100**, coverage **23%**, 1 finding (0 crit / 0 warn / 1 tip) — badge claim holds |
| Demo gallery count | re-audit `test/golden/dirty.html` | **18 findings, 13 critical, score 0** — landing text (18, `0 · fails`) holds in both `docs/index.html` and `docs/zh-Hant.html:164` |
| Report self-scan | `static-audit` over the generated report HTML | score 86, **0 critical / 0 warning**, 4 tips (meta-description / canonical / jsonld / contrast-not-verified — expected for a local file) |
| Horizontal-scroll ban | Playwright, widths 320/768/1024/1280/1440/1920 × light+dark, `documentElement.scrollWidth <= clientWidth` | **PASS at every width and theme** (doc scrollWidth == clientWidth everywhere) on the tier-2-bearing report and the dirty report |
| Font gate | computed `font-family` sweep + `grep PMingLiU\|MingLiU` | PASS — `--sans` and `--mono` are explicit stacks, `--mono` puts CJK sans before the final `monospace`, no bare `monospace`/`serif`, no Ming face reachable (only a "never PMingLiU" comment matches) |
| GT numbers on the landing pages | cross-checked `docs/index.html:98-120` / `docs/zh-Hant.html:109-119` against `VALIDATION.md:331-333` | consistent (1.000 / 0.727 / 0.829, labelled "engine @8 GT mapping") |
| Version metadata | `plugin.json` 3.3.0 vs all 9 README version lines | consistent |

Not in the tree: `plans/2026-07-26-contrast-calibration-broad.md` does not exist, so there
is nothing to audit from that workstream. `VALIDATION.md:217-220` correctly says the
broader FP pass is in progress and cites **no** in-flight numbers — that is the right
state for a commit.

## Findings

### HIGH-1 — The tier-2 report rendering never fires through the only documented pipeline

`core/scripts/generate-report.mjs:641` reads `audit?.tier2?.summary?.by_viewport` for the
provenance chip, and `:1114-1116` reads `g.sample.computed` for the measured-value line.
Neither survives the documented production path.

`core/scripts/static-audit.mjs:1413-1423` (`mergeExternalFindings`) hand-builds the finding
it forwards to `addFinding` — `category, severity, wcag, key, title, location, fix, source,
check`. **`computed` is dropped**, as are `selector`, `viewport`, `description`,
`affected_users`. And nothing in the repo ever writes an `audit.tier2` key: `static-audit.mjs`
is the artifact's sole author (`core/content/inspect.md:580`) and never sets it.

Verified end to end (real @2 artifact, real merge, real render):

```
node core/scripts/tier2-audit.mjs --url test/tier2-fixtures/contrast.html --output tier2.json --date 2026-07-26
  -> 10 finding(s) across 320x720, 1280x900
node core/scripts/static-audit.mjs --scope tier2-merge-probe --url tier2-merge-probe --date 2026-07-26 \
  --merge-findings tier2.json --output merged.json test/tier2-fixtures/contrast.html
  -> --merge-findings: merged 10, skipped 0
node core/scripts/generate-report.mjs merged.json --output merged.html
```

Result on that artifact/report:

```
artifact has .tier2 key: false
tier2 findings in artifact: 10 | with computed: 0
  keys of first: level,legal_exposure,category,severity,wcag,key,title,location,fix,source,check
report contains tier2-provenance chip: false
report contains tier2-measured line: false
```

Both features of the tier-2 report workstream are inert in the shipped pipeline. The new
test passes because `test/tier2-report-visibility.test.mjs:74-88` hand-writes an audit JSON
with `computed` preserved and `audit.tier2` attached — a shape no producer in the repo
emits, and `inspect.md:610-612` tells the agent never to hand-edit the artifact. The
generator's own comment at `:634-640` ("audit.tier2 carries ONLY metadata+summary ...
spliced in alongside the static ones") documents a producer that does not exist.

### HIGH-2 — @2 broadened "unresolvable" to four causes; every copy still says "image or gradient"

`core/scripts/tier2-audit.mjs:374-376` now sets `bgUnresolved` for **four** distinct
signals: a background-image/gradient ancestor (@1's only cause), a pseudo-element or inset
box-shadow background (`hasPseudoBg`/`hasInsetBoxShadow`, `:302-311`), a non-ancestor
overlapping element that paints (`hasNonAncestorOverlay`, `:318-329`), and a page that opts
into `color-scheme: dark` with no opaque ancestor background (`:359`, `defaultsToCanvas`).

Three copy surfaces still describe only the @1 cause, so a Wix/Atlassian pseudo-element
case or a linear.app dark-canvas case is reported to the developer as an image/gradient
problem, with fix advice ("verify against the rendered image/gradient") that does not apply:

- `core/scripts/tier2-audit.mjs:144` title — "(image or gradient background)"
- `core/scripts/tier2-audit.mjs:149` description — "paints a background-image (photo or gradient)"
- `core/scripts/tier2-audit.mjs:590` `metadata.audit_methods[0]` — "image/gradient backgrounds reported unresolvable"
- `core/scripts/generate-report.mjs:428-429` `FINDING_I18N['tier2-contrast-unresolvable']` zh+en title/description/fix — and this one WINS: `findingText()` (`:598-604`) prefers the keyed i18n over the finding's own text, so fixing the engine alone changes nothing in the report.

Confirmed in a rendered report: the unresolvable group renders the i18n text
「文字對比無法解析（背景為圖片或漸層）」 for findings produced by the overlay/dark-canvas
paths.

### HIGH-3 — The report tells the reader tier-2 contrast "is not entered into the score" while the same artifact scores it

`core/scripts/generate-report.mjs:424` (zh) / `:425` (en), the `standard` line for
`tier2-contrast-fail`: 「但目前仍不計入分數（tier-2 是否計分尚未拍板）」 / "but not yet
entered into the score (tier-2 scoring wiring is undecided)".

The merge-semantics workstream landed the opposite statement in the same batch
(`core/content/inspect.md:598-606`: "merging moves the score, it is not a free 'add more
evidence' step"), and the tree agrees with inspect.md, not with the report:

```
merged.json (10 real tier-2 findings merged into a static run):
  contrast: {"pass":0,"fail":6,"review":5,"state":"scored","score":0}   overall 17, coverage 36%
```

`check:'fail'` tier-2 findings do enter the score the moment they are merged. Same false
premise, four more places:

- `CHANGELOG.md:14` — "the two new categories do not enter the weighted score yet"
- `CHANGELOG.md:44-46` — "the two new Tier-2 categories (contrast, touch) have **no scoring-weight denominator entry** until a future release wires them in" (directly contradicted: coverage moved 23% → 36% because contrast entered the denominator)
- `VALIDATION.md:110-112` — "Findings + evidence only so far — these categories do NOT yet enter the weighted score"; `plans/2026-07-26-merge-scoring-note.md` already holds the approved replacement text for exactly this sentence and was never applied (its author deferred to the claims-fix agent, who declared VALIDATION.md out of scope for that item — the correction fell through the gap between the two)
- `core/scripts/tier2-audit.mjs:593` `metadata.note` — same sentence, emitted into every tier-2 artifact

The two `check:'review'` keys (`tier2-contrast-unresolvable` `:429`,
`tier2-touch-target-advisory` `:436`) say "never scored" and that IS accurate — review
findings never reach `pass+fail`, so they cannot cross `THIN_EVIDENCE_MIN`. Do not
"fix" those two.

### HIGH-4 — Version/count skew, plus a trap in the naive fix

Engine in the tree is `beacon-tier2-audit@2` (`core/scripts/tier2-audit.mjs:35`, mirrors
in sync). Stale strings:

| Location | Current text | Required |
|---|---|---|
| `CHANGELOG.md:5` | `` `beacon-tier2-audit@1` `` | `` `beacon-tier2-audit@2` `` |
| `VALIDATION.md:107` | L2 header, engine `` `beacon-tier2-audit@1` `` | `@2` |
| `VALIDATION.md:327` | "engines `beacon-static-audit@11` + `beacon-tier2-audit@1`" | `@2` |
| `VALIDATION.md:315` | `node --test   # 376 tests, all green` | `# 381 tests, all green` |
| `core/content/inspect.md:148` | "(`source: beacon-tier2-audit@1`)" | `@2`, then `node build.mjs` to regenerate `commands/inspect.md:134` and `adapters/codex/references/beacon-inspect.md:134` — never hand-edit the mirrors |

**The trap**: bumping the `VALIDATION.md:107` header to `@2` retroactively re-labels
@1-era measurements as @2 measurements. Two bullets in that section were measured on @1
and would move under @2's broader unresolvable classification and the new
disabled-control exemption:

- `:140-145` — rakuten snapshot, "1584/1917 samples unresolvable" (already says "engine @1" inline — keep that)
- `:170-175` — "Real-page smoke run (2026-07-25, rakuten.co.jp snapshot #97): 2914 findings — 190 fail, 1584 unresolvable, 15 touch fail, 1125 advisory, 0 crashes" (no engine label — must gain one)

`test/tier2-report-visibility.test.mjs:39,46,54` also hardcode `source:
'beacon-tier2-audit@1'`. That is a synthetic specimen, not a claim, and
`isTier2Finding()` matches on the `beacon-tier2-audit` prefix by design — leave it, or
bump it for tidiness; it changes no behavior.

### HIGH-5 — Commit hygiene: four untracked fixtures are required by a tracked test

`test/tier2-audit.test.mjs` (modified, tracked) loads four fixtures that are still
untracked:

```
test/tier2-audit.test.mjs:268  contrast-overlay.html
:295  contrast-dark-canvas.html
:313  contrast-disabled.html
:332  settle.html
git ls-files test/tier2-fixtures/  ->  only contrast.html, touch-targets.html
```

Commit the modified files without these and a clean checkout fails four tests.
`test/tier2-report-visibility.test.mjs` is untracked too — the 381 count depends on it.

### MEDIUM-1 — A crashed viewport is reported as measured

@2 records `{viewport, error}` for a viewport whose capture threw
(`core/scripts/tier2-audit.mjs:559`). `computeTier2EvidenceByCategory`
(`core/scripts/generate-report.mjs:642-651`) maps **every** entry's `viewport` into the
label list while summing only the numeric fields, so a viewport that measured nothing is
still advertised. Verified on a spliced specimen whose 320x720 entry is an error:

```
chip renders: 「已量測 10 項（320x720 / 1280x900）」 / "10 measured (320x720 / 1280x900)"
```

320x720 measured zero samples. No crash — the error shape is handled safely, and the
all-viewports-errored case correctly renders no chip at all (`out = {}`). This is a
one-line honesty fix, and it becomes user-visible the moment HIGH-1 is wired.

### MEDIUM-2 — @2's own work is unrecorded in both the changelog and the calibration charter

`CHANGELOG.md`'s `[3.3.0]` entry documents @1's harness, `@10`, `@11`. It contains **no
mention** of: the four @2 defect fixes (disabled/aria-disabled contrast exemption,
broadened unresolvable classification, the settle window, per-viewport error capture), the
engine bump itself, or the tier-2 report rendering (provenance chip + measured values +
four new `FINDING_I18N` keys). Two whole workstreams of this batch are absent from the
release notes. `grep -n "@2" CHANGELOG.md` → 0 matches.

`VALIDATION.md`'s L2 section is the charter for tier-2 calibration decisions and says so
("Every threshold below is a CALIBRATION DECISION"). It records none of @2's:

- `SETTLE_QUIET_MS = 500` (`core/scripts/tier2-audit.mjs:503`) — a new calibration constant with measured backing (wayfair: 1 finding at 0ms, 5 findings stable from 300ms)
- the disabled/`aria-disabled` contrast exemption (`:267`) — the section mentions disabled exclusions only as a *touch-target* surface (`:159-161`)
- the three new unresolvable triggers + the dark-canvas rule — `:134-139` still describes image/gradient as the only blocker
- per-viewport error capture as a resilience behavior (and the "0 crashes" smoke figure predates it)
- the fixture bullet `:164-169` still lists two fixtures; there are six

### MEDIUM-3 — The merge-warning example numbers are not reproducible as written

`core/content/inspect.md:598-606` (mirrored to `commands/inspect.md`,
`adapters/codex/references/beacon-inspect.md`, and staged for `VALIDATION.md` in
`plans/2026-07-26-merge-scoring-note.md`) cites: baseline overall **56** / coverage 23% →
+1 merged = `insufficient-evidence` (56/23%) → +3 merged = contrast **scored at 23**,
overall **44**, coverage 36%.

What I could reproduce, exactly, using `docs/index.html` as the baseline and 3 synthetic
`tier2-contrast-fail` findings:

```
baseline      : overall 100  cov 23  contrast not-machine-checkable (0p/0f)
merge +1      : overall 100  cov 23  contrast insufficient-evidence  score null (0p/1f)
merge +3      : overall  64  cov 36  contrast scored                 score 0    (0p/3f)
```

The mechanism, the state transitions and the 23% → 36% coverage move reproduce exactly.
The absolute scores do not, and cannot. Cause confirmed by the authoring agent: the baseline
was a **throwaway 5-line HTML file that is not in the repo**, and the 3-finding merge was
2 fails + 1 pass (hence contrast 23 rather than 0). Nothing in a checkout scores 56 — I
probed `docs/index.html`, `docs/zh-Hant.html`, `test/golden/clean.html`,
`test/golden/dirty.html`, all four tier-2 fixtures, both mockup/screen reports, and
directory scans of `docs/`, `test/golden/`, `plans/mockups/`, `test/tier2-fixtures/`.

Same defect class as the `885 findings / 79-11-10` split the claims-fix pass just deleted
from the landing page: an unverifiable published number inside a document that invites
verification. Team-lead ruling: cite numbers from a committed artifact with the exact
command, or drop the numbers for the mechanism. Step 9 takes the first option.

### MEDIUM-4 — One instance's measurement is presented for a whole group

Findings group by key, so `tier2MeasuredHTML` (`core/scripts/generate-report.mjs:1114`)
renders `g.sample.computed` — the **first** instance — once per group. Rendered specimen:

```
瀏覽器量測對比低於門檻  ×6
  locations: #fail-normal-16 (320x720), #fail-both-16 (320x720), #fail-bold-not-large-enough (320x720), ...(1280x900 ×3)
  量測值 / Measured: 對比 4.478:1（前景 rgb(119,119,119) 對背景 rgb(255,255,255)，門檻 4.5:1）
```

Six locations with different ratios and colors, one unqualified measurement. Either mark
it as the first of N or render per-location values.

### LOW-1 — Artifact metadata also counts crashed viewports

`core/scripts/tier2-audit.mjs:588` sets `metadata.viewports = byViewport.map(v => v.viewport)`,
including errored ones, and the CLI summary line prints the same list. Same root cause as
MEDIUM-1; fix together if the chip fix touches the shape.

### LOW-2 — Two different settle recipes, one undocumented

`VALIDATION.md:49` (L0 capture recipe) pins "domcontentloaded + networkidle grace + 2s
settle"; tier-2 uses `load` (5s cap, swallowed) + 500ms. The engine comment at
`core/scripts/tier2-audit.mjs:537-540` says it matches L0's recipe, which is true only of
the `domcontentloaded` part. Record the 500ms figure and why it differs when MEDIUM-2's
VALIDATION additions are made.

### LOW-3 — `section.hero` element-level overflow is pre-existing, not a merge regression

My sweep flags `SECTION.hero` with `scrollWidth 1408 > clientWidth 1280` at ≥768px. Its
computed `overflow-x` is `hidden` (no scrollbar, no child extends past the hero's right
edge — a clipped decorative layer), the document never scrolls horizontally at any width,
and the identical flag appears on the pre-batch committed
`plans/2026-07-22-ws-b-screens/rakuten-report-v3.2.html`. Out of scope for this gate;
noted so the next sweep does not read it as new. Smallest rendered text is 12.48px
(`.engine-tag`) / 13.6px (toolbar buttons) — UI chrome, not running text.

## Required fixes (ordered)

Ordered so that each step's verification is meaningful. Steps 1-5 are the HIGHs; 6-9 the
MEDIUMs. Everything under `core/` requires `node build.mjs` afterwards — never hand-edit
`scripts/`, `commands/`, or `adapters/`.

**1. Wire the tier-2 rendering to the real pipeline (HIGH-1).** In
`core/scripts/static-audit.mjs`:

- `mergeExternalFindings`, the `addFinding({...})` call at `:1413-1423`: forward the
  evidence fields the renderer needs — `computed`, `selector`, `viewport` — alongside the
  existing whitelist. **Validate them**: this function's own comment says "Untrusted
  input: validated here", and `tier2MeasuredHTML` interpolates `c.ratio`, `c.fg.r`,
  `c.width.toFixed(0)` into HTML with no escaping, so a non-numeric `computed` field is
  either an injection vector or a `TypeError` that kills report generation. Coerce with
  `Number(...)` + `Number.isFinite` and drop `computed` entirely if it fails, or escape at
  the renderer — the coercion is the smaller diff and fixes both.
- After the merge call in `main()` (`:1463`): when the merged payload is a tier-2 artifact
  (`raw.metadata?.engine_fingerprint` starts with `beacon-tier2-audit` and
  `raw.summary?.by_viewport` is an array), attach `{ metadata, summary }` to the output
  artifact as `tier2`. The documented command already passes the whole artifact to
  `--merge-findings`, so no new flag is needed.
- Extend `test/tier2-report-visibility.test.mjs` with one case that goes through
  `--merge-findings` (not a hand-written audit JSON) and asserts both `tier2-provenance`
  and `tier2-measured` appear. That is the assertion whose absence let this ship.

Acceptance: the HIGH-1 three-command sequence above prints `report contains tier2-provenance
chip: true` and `report contains tier2-measured line: true`.

**2. Correct the unresolvable copy (HIGH-2).** Both surfaces, or the report keeps
overriding the engine:

- `core/scripts/tier2-audit.mjs:144` — title →
  `'Text contrast could not be resolved (effective background not determinable from computed styles)'`
- `core/scripts/tier2-audit.mjs:149` — description → name the real cause set, e.g.
  `` `The effective background behind "${s.selector}" cannot be computed from styles alone — an ancestor paints a background-image or gradient, a pseudo-element or inset box-shadow paints behind the text, a non-ancestor element overlaps it, or the page relies on a dark default canvas (color-scheme: dark).` ``
- `core/scripts/tier2-audit.mjs:590` — `audit_methods[0]` → replace
  "image/gradient backgrounds reported unresolvable, never guessed" with
  "backgrounds that cannot be resolved from computed styles (image/gradient, pseudo-element or inset-shadow paint, non-ancestor overlap, dark default canvas) are reported unresolvable, never guessed"
- `core/scripts/generate-report.mjs:428` (zh) — title
  「文字對比無法解析（無法從計算樣式判定有效底色）」； description
  「該文字的有效底色無法單純從計算樣式推算：祖先元素繪製圖片或漸層、由 pseudo-element 或 inset box-shadow 繪製背景、有非祖先元素疊在其後，或頁面採用深色預設畫布（color-scheme: dark）。」;
  fix 「以人工方式對照實際渲染結果確認對比，或在文字後方加上純色 fallback／覆蓋層以確保達到門檻。」
- `core/scripts/generate-report.mjs:429` (en) — the same three fields in English.

Preferred, still small: have `browserCollectContrastSamples` emit which signal fired
(`bgUnresolvedReason`) and interpolate it, so the finding names the actual cause instead of
listing four. The browser side already computes all four booleans at `:372-376`.

Acceptance: `node --test` green (the standard-coverage test asserts every tier-2 key keeps
a bilingual `standard` line), and the string "image or gradient" no longer appears in
`core/scripts/tier2-audit.mjs` or `core/scripts/generate-report.mjs`.

**3. Remove the "tier-2 never scores" premise (HIGH-3).** Five edits, one sentence each:

- `core/scripts/generate-report.mjs:424` — replace 「但目前仍不計入分數（tier-2 是否計分尚未拍板）」 with
  「這類發現預設只以證據呈現；只有在明確以 --merge-findings 併入時才會進入分數，併入後一旦該類別的機測數達到門檻就會計分」
- `core/scripts/generate-report.mjs:425` — replace "but not yet entered into the score (tier-2 scoring wiring is undecided)" with
  "presented as evidence by default; it affects the score only when it is explicitly merged with --merge-findings, at which point the category can become scored once it has enough machine checks"
- `core/scripts/tier2-audit.mjs:593` — `metadata.note` → "Findings + evidence only: this
  artifact carries no score. These findings reach `audit-results.json` only through an
  explicit `--merge-findings` run, which CAN move the score once the category reaches
  `THIN_EVIDENCE_MIN`; whether the default inspect flow should merge automatically is the
  open decision (see plans/2026-07-25-v3.3-browser-measurements.md Workstream A step 4)."
- `VALIDATION.md:110-112` — paste the replacement block already written and reviewed in
  `plans/2026-07-26-merge-scoring-note.md`, adjusting its engine reference to `@2`.
- `CHANGELOG.md:14` and `CHANGELOG.md:44-46` — rewrite both to the merged truth: the
  harness emits a separate findings-only artifact and adds no automatic scoring; merging
  its findings with `--merge-findings` can move `overall_score`, `coverage_percent` and the
  category's state, exactly like an axe or manual merge; what is deferred is auto-merging
  in the default flow, not the mechanism. Delete "have no scoring-weight denominator entry
  until a future release wires them in" — it is false as written.

Acceptance: no surface in the tree claims tier-2 findings cannot affect the score;
`node --test` green.

**4. Fix the version skew and label the @1-era measurements (HIGH-4).** The five edits in
the HIGH-4 table, plus:

- `VALIDATION.md:170` — "Real-page smoke run (2026-07-25, rakuten.co.jp benchmark snapshot
  #97, both viewports)" → add "**engine @1**" and a clause that @2's broader unresolvable
  classification and disabled-control exemption move these counts, not re-measured.
- After editing `core/content/inspect.md:148`, run `node build.mjs` (do not touch the two
  mirrors by hand) and re-run `node build.mjs --check`.

Acceptance: `grep -rn "beacon-tier2-audit@1" --include="*.md" --include="*.json"` returns
only `plans/` history files (those are dated records, correctly frozen at @1) and, if left
alone, the synthetic strings in `test/tier2-report-visibility.test.mjs`; `grep -n "376
tests" VALIDATION.md` returns nothing.

**5. Stage the untracked test assets with the commit (HIGH-5).**

```
git add test/tier2-fixtures/contrast-overlay.html test/tier2-fixtures/contrast-dark-canvas.html \
        test/tier2-fixtures/contrast-disabled.html test/tier2-fixtures/settle.html \
        test/tier2-report-visibility.test.mjs
```

Acceptance: `git status --porcelain test/` shows no `??` entries, and `git stash -u` +
`node --test` on a clean checkout (or a scratch `git worktree`) still reports 381.

**6. Do not advertise a crashed viewport as measured (MEDIUM-1).**
`core/scripts/generate-report.mjs:644` — build the label list from measured entries only:
`byViewport.filter(v => !v.error).map(v => v.viewport).filter(Boolean)`. Optionally append
a bilingual "(1 viewport failed to capture)" note when `byViewport.some(v => v.error)`.
Acceptance: a specimen with one error entry renders `10 measured (1280x900)`, not both
labels.

**7. Record @2 in the changelog (MEDIUM-2a).** Add to `CHANGELOG.md`'s `[3.3.0]`: an
engine-bump bullet for `beacon-tier2-audit@2` listing the four defect fixes with their
evidence (Mailchimp disabled button, Wix/Atlassian/linear.app background resolution,
wayfair settle, zoom.us context destruction — all documented in
`plans/2026-07-26-tier2-bugfix-notes.md` and `plans/2026-07-26-tier2-calibration.md`), and
a bullet for the tier-2 report rendering (provenance chip, measured values, four new
bilingual finding keys, unresolvable grouping) noting that category states and scores are
untouched by the rendering itself.

**8. Record @2's calibration decisions in VALIDATION L2 (MEDIUM-2b).** In the `### L2`
section: extend the "Background resolution" bullet `:134-139` with the three new triggers
and the dark-canvas rule; add a bullet for the disabled/`aria-disabled` **contrast**
exemption citing WCAG 1.4.3's inactive-component exemption; add `SETTLE_QUIET_MS = 500`
with the wayfair measurement and how it relates to L0's 2s settle (LOW-2); add
per-viewport error capture as a resilience behavior; update the fixture bullet `:164-169`
to list all six fixtures.

**9. Re-derive the merge example on a committed fixture (MEDIUM-3, team-lead ruling).**
Replace the numbers in `core/content/inspect.md:602-606` with the values below, which I
derived on `test/golden/clean.html` — committed, and pinned by
`test/golden/clean.expected.json`, so `test/golden-vectors.test.mjs` fails if the baseline
ever drifts and falsifies the doc. Verified twice on this tree:

```
# merge-1.json / merge-3.json: 1 and 3 objects of
#   {"category":"contrast","check":"fail","severity":"warning","wcag":"WCAG 2.2: 1.4.3 Contrast (Minimum)",
#    "key":"tier2-contrast-fail","title":"...","location":"#el0 (viewport 320x720)","source":"beacon-tier2-audit@2"}
node core/scripts/static-audit.mjs --scope golden-clean --date 2026-07-26   [--merge-findings merge-N.json] --output out.json test/golden/clean.html

baseline : overall 100  coverage 23%  contrast not-machine-checkable  score null  (0 pass / 0 fail)
+1 fail  : overall 100  coverage 23%  contrast insufficient-evidence  score null  (0 pass / 1 fail)
+3 fail  : overall  64  coverage 36%  contrast scored                 score 0     (0 pass / 3 fail)
```

Replacement sentence for the warning: baseline `test/golden/clean.html` (contrast 0 pass /
0 fail → `not-machine-checkable`, overall 100, coverage 23%); merging 1 tier-2/axe contrast
fail → still unscored, now `insufficient-evidence`, overall and coverage unchanged; merging
3 → contrast `scored` at 0, overall **100 → 64**, coverage **23% → 36%**. Do NOT keep the
`confidence_level` claim as part of *this* example: `metadata.confidence_level` stays `low`
in all three runs because the band boundary is 60% (`core/scripts/static-audit.mjs:1540`) —
say instead that it moves when the coverage change crosses that boundary.

Then `node build.mjs` for the two mirrors, and apply the same numbers to
`plans/2026-07-26-merge-scoring-note.md` before anything from it is pasted into
`VALIDATION.md` (step 3) — it carries the same unreproducible 56/44/23 figures.

Acceptance: every number in the warning is reproducible with the command printed beside it,
from a clean checkout, with no throwaway fixture.

MEDIUM-4 and the LOWs are not merge blockers. MEDIUM-4 is worth folding into step 1 while
that code is open: append "（6 項中的第 1 項）" / "(1 of 6)" to the measured line when the
group count exceeds 1.

## What I deliberately did not flag

- `test/tier2-report-visibility.test.mjs`'s hardcoded `@1` source strings — synthetic
  specimen, prefix matching is intentional (`isTier2Finding`, `:630`).
- `plans/*.md` notes citing `@1` or 376 tests — dated records of what was true when
  written; rewriting them would falsify the history.
- `section.hero` overflow and 12-13px chrome text — pre-existing, present in the committed
  pre-batch report (LOW-3).
- The absence of `plans/2026-07-26-contrast-calibration-broad.md` — that workstream simply
  has not landed; `VALIDATION.md:217-220` handles the gap correctly by publishing no
  numbers.

<!-- writing-harness: not applicable — engineering audit report for the team lead, not reader-facing prose -->

---

# Final pass (2026-07-27) — verdict on the fixed tree

Same frozen tree, all 9 required fixes + the round-3 static FP fix applied. Everything below
was re-run by me; nothing accepted from producer notes.

## Verdict

**FIX-BEFORE-COMMIT** — two one-line fixes. All five HIGHs and MEDIUMs 1-4 from the first
pass are genuinely resolved. Both blockers are "the claim is broader than the code", the same
defect class this batch existed to fix.

## First-pass items: verified fixed

| Item | Evidence (re-run) |
|---|---|
| HIGH-1 wiring | `tier2-audit` → `--merge-findings` → `generate-report` on `test/tier2-fixtures/contrast.html`: `.tier2` key **true**, `by_viewport` both viewports, 10 tier-2 findings with 6 `computed` / 10 `selector` / 10 `viewport`, chip **true**, measured line **true**. Rendered: 「已量測 20 項（320x720 / 1280x900）」 and 「對比 4.478:1（前景 rgb(119, 119, 119)…）」 |
| HIGH-1 injection | 8 malformed `computed` payloads through `--merge-findings`: `ratio:'<img src=x onerror=alert(1)>'`, `width:'abc'`, `computed:'"><script>alert(1)</script>'`, missing `fg`, HTML in an rgb channel — all dropped to `computed: undefined`. Report generated exit 0; `<img src=x onerror` and `<script>alert(1)</script>` both absent from the HTML. No crash, no raw interpolation |
| HIGH-2 copy | Engine emits per-reason title/description (4 reason keys + generic fallback); report i18n is now the truthful 4-cause enumeration in zh+en. Nothing states image/gradient as the sole cause |
| HIGH-3 | `grep` for `do not enter the weighted score` / `not yet entered into the score` / `no scoring-weight denominator` / 尚未拍板 outside `plans/`: **0 hits** |
| HIGH-4 | `beacon-tier2-audit@1` outside `plans/` survives only in `test/tier2-report-visibility.test.mjs` (the synthetic specimen I said to leave). `376 tests` gone, `VALIDATION.md:414` = 384. L2 header @2, measured-state header @11 + @2, and the pre-@2 smoke run at `:247-248` now labelled **engine @1** |
| HIGH-5 | Fixtures + new test file staged (`A` in `git status`); `git check-ignore` on all five: no matches |
| MEDIUM-1 (report) | Specimen with a crashed 320x720: chip renders 「已量測 10 項（1280x900）（1 個 viewport 擷取失敗）」 — crashed viewport excluded, failure disclosed |
| MEDIUM-2 | CHANGELOG now carries the @2 bump bullet (4 defects with their real-site evidence) and the report-rendering bullet; VALIDATION L2 gained the three new unresolvable signals, the disabled-control exemption, `SETTLE_QUIET_MS = 500` with the wayfair measurement and an explicit contrast to L0's 2s recipe, and per-viewport error capture |
| MEDIUM-3 | Ran the doc's own command via the mirror path: baseline **100 / 23%** `not-machine-checkable` → +1 **100 / 23%** `insufficient-evidence` → +3 **64 / 36%** `scored 0`, `confidence_level` `low` throughout. Matches `core/content/inspect.md:602-610` and `VALIDATION.md:112-122` exactly |
| MEDIUM-4 | Measured line now reads 「…門檻 4.5:1）（6 項中的第 1 項）」 / "(1 of 6)" |
| Whole tree | `node --test` **384/384**; `build.mjs --check` 50/50; `docs/reports/*` byte-identical to a fresh render at the engine now in the tree; landing 100/23% 1 finding, dirty 18 findings/13 critical; self-scan 0 critical / 0 warning on all three reports; no document-level horizontal scroll at 320/768/1024/1280/1440/1920 × light+dark; font gate clean |

## Round-3 static FP fix — judged on my own controls

Four fixtures through `static-audit.mjs`:

| Fixture | Shape | Result |
|---|---|---|
| c1 | `<img>` + `position:absolute` overlay, text in a child `<a>` (the 100291.html:2790 shape) | **0 resolved pairs** — fix works |
| c2 | same, but the text sits DIRECTLY on the absolutely-positioned element | **1 resolved pair, 1 sub-threshold finding** — the false positive survives |
| c3 | overlay declares its OWN background (`position:absolute;background:#000`) | 1 resolved, 0 findings — **positive control passes**, legitimate pairs are not suppressed |
| c4 | `position:absolute`, no `<img>` sibling | 1 resolved, 1 finding — no over-blocking |

**Evidence judgment**: the structurally-matching fixture plus the disable/restore experiment
is sufficient for the documented case (c1 reproduces it and confirms the fix), and c3/c4 show
the fix cannot suppress a legitimate pair. What it does not establish is completeness across
nesting depth. What would have sufficed is exactly the 4-cell matrix above; two of the four
cells are now in `test/static-contrast.test.mjs`.

## Version fold (@11 absorbing round 3) — honest, with one caveat

No `v3.3*` tag exists, so no release ever shipped `beacon-static-audit@11`; the release
commit sets that fingerprint's public meaning, and CHANGELOG describes the reference value as
"calibrated in three rounds" including this fix. Golden vectors are untouched
(`test/golden/*.expected.json` absent from `git status`) and 384 tests pass, so the fold is
artifact-neutral on committed vectors. Caveat: commit `7453725` already stamps `@11` with the
pre-round-3 behavior, so a later comparison against archived @11 outputs would compare two
behaviors under one fingerprint. Acceptable because nothing archived those outputs and GT is
review-blind, but do not later cite "@11" as one behavior across that boundary.

## Residual findings

**MEDIUM-A (blocking) — the round-3 fix misses the direct-text variant of the same leak.**
`blocksClimb` lives on the absolutely-positioned element's own stack frame, but the
resolution walk starts at `stack.length - 2` (`core/scripts/static-audit.mjs:501`), so when
the overlay itself carries the text its own flag is never consulted — c2 above. CHANGELOG and
`VALIDATION.md` state the rule unconditionally ("an `<img>` sibling behind a
`position:absolute`/`fixed` element now blocks the walk"), which is broader than the code.
Fix (one line, before the loop at `:499-500`):

```js
let bg = ownBg;
if (bg === undefined && stack[stack.length - 1]?.blocksClimb) bg = null;
if (bg === undefined) { /* existing walk */ }
```

Add c2 as a third test beside the existing two. Alternative if you prefer no code change:
narrow both claims to "text nested inside such an overlay". Acceptance: c2 yields 0 resolved
pairs.

**MEDIUM-B (blocking) — `sanitizeComputed` turns missing numbers into 0.**
`Number(null)`, `Number('')`, `Number(false)`, `Number([])` are all `0` and finite, so
`{"ratio": null, …}` merges as `ratio: 0` and the report renders 「對比 0:1」 — a fabricated
measurement invented from absent data, at the boundary whose own comment says untrusted input
is validated here. Verified: a `null`-ratio specimen renders 「對比 0:1（前景 rgb(0, 0, 0) 對背景
rgb(1, 2, 3)，門檻 4.5:1）」. Fix inside `sanitizeComputed`'s `n()`
(`core/scripts/static-audit.mjs`): reject `null`, `''`, and non-number/non-string types before
coercing — e.g. `const n = (v) => { if (v === null || v === '' || (typeof v !== 'number' && typeof v !== 'string')) return null; const x = Number(v); return Number.isFinite(x) ? x : null; };`
Acceptance: a merged finding with `"ratio": null` or `""` drops `computed` entirely.

**LOW-C — `required` that fails coercion is dropped, and the renderer then prints
「門檻 undefined:1」 / "required undefined:1"** (verified with a `required:'<u>x</u>'` specimen).
Treat a missing/invalid `required` like a missing `ratio`: drop the whole `computed`.

**LOW-D — the artifact side of MEDIUM-1 is still open.** `core/scripts/tier2-audit.mjs:622`
still maps every entry, so a crashed viewport appears in `metadata.viewports` and in the CLI's
"across …" line. Probed with an injected fake Playwright that throws on the first viewport:
`metadata.viewports: ["320x720","1280x900"]` while `by_viewport[0]` is an error entry.
`inspect.md` Step 3 has the agent summarize this artifact for a human, so the human is told
both viewports were measured. One line: filter, or add `viewports_failed`.

**LOW-E — the per-reason unresolvable text is invisible in the report.** `findingText` prefers
the keyed i18n, so the engine's four reason-specific descriptions surface only in
`tier2-results.json`. Coherent for v3.3 (the report text is truthful, just unspecific, and
bilingual coverage is a good reason to keep one shared entry) — worth one line in
`inspect.md` Step 3 telling the agent to carry the reason into the human summary, or that work
stays invisible to everyone but a JSON reader.

**LOW-F — `VALIDATION.md:113` cites `static-audit.mjs ~1384-1427` for
`mergeExternalFindings`; it now starts at `:1428`** (the new `sanitizeComputed` shifted it).

## Not flagged (checked, pre-existing)

`section.hero` element-level `scrollWidth > clientWidth` (`overflow-x: hidden`, a decorative
clip) and the 320px clipping of the long URL in `.exec` are both present in `HEAD`'s committed
`docs/reports/landing-self-audit.html`, and this batch adds no report CSS (0 CSS lines in the
`generate-report.mjs` diff). The current tree is strictly better: HEAD's copy also had a
`<ul>` with `overflow-x: auto` and `scrollWidth 917` at 320px, which is gone. Worth its own
ticket — `overflow-wrap: anywhere` is not reaching `.exec` headings — not a merge blocker.

---

# Confirmation pass (2026-07-27) — all six final-pass items

Verdict: **PASS**. Each item re-verified by running it; nothing taken from notes.

| Item | Check | Result |
|---|---|---|
| MEDIUM-B | 8 malformed `computed` payloads through `--merge-findings` (`null`, `''`, `false`, `[]`, `'abc'`, `null` rgb channel, bad `required`, `null` touch width) + one valid control | All 8 → `computed: undefined`, no measured line. Control survives and renders 「對比 2.5:1（前景 rgb(9, 9, 9)…）」. `grep` across all 9 rendered reports for 「對比 0:1」 and `undefined:1`: **none** |
| MEDIUM-A | four static-contrast fixtures | c1 (nested, the 100291.html shape) **0 resolved pairs**; c2 (text directly on the overlay) **0 resolved pairs** — fixed; c3 (overlay declares its own background) **still resolves, 1 pair, 0 findings** — no over-suppression; c4 (no `<img>` sibling) still resolves and still flags |
| LOW-C | `required:'<u>x</u>'` specimen | whole `computed` dropped, no measured line, no 「門檻 undefined:1」 |
| LOW-D | injected fake Playwright crashing the first viewport | `metadata.viewports: ["1280x900"]`, new `metadata.viewports_failed` present, `by_viewport[0]` keeps the error entry. CLI line (`tier2-audit.mjs:667`) reads from `metadata.viewports`, so it no longer names the crashed viewport |
| LOW-E | `core/content/inspect.md:363` | Present and sensible: tells the agent to carry the finding's cause (image/gradient, pseudo/inset-shadow, non-ancestor overlap, dark canvas) into the human summary, and says why the report's shared i18n stays general |
| LOW-F | `VALIDATION.md:113` cites `~1440-1486` | `mergeExternalFindings` is `core/scripts/static-audit.mjs:1440-1487` — accurate |
| Suite | `node --test`, `build.mjs --check`, self-scan | **385 pass / 0 fail**; `all 50 outputs match core.`; report self-scan 0 critical / 0 warning (4 AEO tips, expected for a local file) |

Optional nit, not a finding: the CLI summary line prints only measured viewports and says
nothing when one failed — `viewports_failed` and the `by_viewport` error entry carry it in the
artifact, so an operator reading only stdout would not notice. One line if it ever matters.

Tree left as found (38 tracked modifications/additions, unchanged from the start of this pass).
