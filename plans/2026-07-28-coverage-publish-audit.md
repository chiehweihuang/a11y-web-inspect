# hakuso audit — publishing the self-measured WCAG coverage figures (2026-07-28)

Artifact: uncommitted working tree at `master` = `4c6862d`, 18 modified files plus the
`docs/reports/civicrm-event-case.*` relocation performed by this audit (see § Cleanup).
Source of truth for every published figure: `plans/2026-07-27-wcag-coverage-measurement.md`
(post-correction Arithmetic section, lines 136-171).

## Verdict

**FIX-BEFORE-COMMIT.** Every number published is correct, every link resolves, and the whole
tree is green. The change set is blocked on one thing: it updated 4 of the 6 places the
inherited hearsay lives inside the shipped surfaces and left the 2 most authoritative ones
untouched, so the report and the guide now each contradict themselves about the headline
number. Both fixes are copy-only, in `core/` sources with build mirrors.

## What checks out

| Check | Command / method | Result |
|---|---|---|
| Number fidelity, all 18 files | `grep -E '(15/55\|27\.3%\|34\.1%\|4/55\|7\.3%\|14/47\|29\.8%\|9\.1%\|0/55\|4\.3%)'` over every changed file | **0 hits** — no pre-correction figure survives anywhere |
| Published figures vs source doc | every surface says 14 of 55 = 25.5%, 2 of 55 = 3.6% | matches `plans/2026-07-27-wcag-coverage-measurement.md:144-149` exactly |
| zh/en parity | all 9 READMEs, both landing pages, hero panel, exec summary | same claim, same numbers, same qualifier structure in every language |
| CHANGELOG cross-check | `CHANGELOG.md:115-125` | already carries 14/55 (25.5%), 2/55 (3.6%), 14/48 (29.2%), 2/48 (4.2%) — all post-correction, consistent with the copy |
| GT recall separation | `grep '0\.727\|72\.7'` repo-wide | `0.727` appears only in the labelled precision/recall table (`docs/index.html:113`, `docs/zh-Hant.html:114`), CHANGELOG history and VALIDATION.md. Nothing averages, blends or substitutes it with the criterion figures |
| Link resolves — GitHub blob URL | `curl -I -L` | **200** `https://github.com/chiehweihuang/beacon/blob/master/plans/2026-07-27-wcag-coverage-measurement.md` |
| Link resolves — README relative form | same path verified on `origin/master`; README renders on GitHub, `plans/` is not `export-ignore`d in `.gitattributes` | resolves in both the GitHub view and a `git archive` install |
| Traveling artifact carries an absolute URL | `core/scripts/generate-report.mjs:1280` | the hero honesty panel emits the full `https://github.com/...` URL, unconditionally (`buildHeroHTML` is called without a guard at `:2404`), so every generated report keeps the promise wherever it travels |
| Mirrors in sync | `git hash-object` on all three `generate-report.mjs` | identical (`c7e17d0`) |
| Test suite | `node --test` | **402 pass / 0 fail** |
| Build parity | `node build.mjs --check` | `all 51 outputs match core.` (re-run after the file move: still 51/51) |
| Committed demo reports are current | regenerated both to a temp dir with the `docs/make-demos.mjs` procedure, byte-compared | **IDENTICAL** for `landing-self-audit.html` and `broken-fixture.html` — the committed reports reflect the current engine *and* the edited `docs/index.html` |
| Report self-scan | `static-audit.mjs` run ON each generated report | `landing-self-audit`: score 86, **0 critical / 0 warning**, 5 tips. `broken-fixture`: score 86, **0 critical / 0 warning**, 5 tips. Tips are the expected local-file set (`meta-description-missing`, `canonical-missing`, `jsonld-missing`, `contrast-not-verified`, `static-contrast-evidence`) |
| Landing badge claim | `docs/index.html:146` says "This page scores 100/100 (static tier, 23% of scoring weight measured)"; regenerated report reports 100/100 at 23% | **still true** after the edits |

### Render check (item 4 — the one the producer could not complete)

Playwright resolved at
`C:/Users/tacit/AppData/Local/npm-cache/_npx/361ceb562f3b3235/node_modules/playwright/index.mjs`,
Chromium from `C:/Users/tacit/AppData/Local/ms-playwright/`. Rakuten specimen regenerated
from `C:/Code/personal/beacon-benchmark-100/run-2026-07-05/audits/97.json` (the snapshot at
`snapshots/97.html` is present, 1.5 MB) into the scratchpad — the repo tree was not touched.

Assertion: `document.documentElement.scrollWidth <= clientWidth`, viewports 320 and 1280,
`colorScheme` light and dark, 5 documents = **20 combinations, 20 PASS, 0 overflow**.

| Document | 320 light | 320 dark | 1280 light | 1280 dark |
|---|---|---|---|---|
| rakuten specimen (regenerated) | 320/320 | 320/320 | 1280/1280 | 1280/1280 |
| `docs/index.html` | 320/320 | 320/320 | 1280/1280 | 1280/1280 |
| `docs/zh-Hant.html` | 320/320 | 320/320 | 1280/1280 | 1280/1280 |
| `docs/reports/landing-self-audit.html` | 320/320 | 320/320 | 1280/1280 | 1280/1280 |
| `docs/reports/broken-fixture.html` | 320/320 | 320/320 | 1280/1280 | 1280/1280 |

(values are `scrollWidth`/`clientWidth`; the probe also recorded the widest element extending
past `clientWidth` — none did.) Element screenshots of the rewritten `.honesty` panel at
320 light, 1280 light and 1280 dark confirm the longer copy wraps cleanly, both links render,
and no text clips.

## Findings

### HIGH-1 — the report contradicts its own linked table in the Methodology & Limits tab

`core/scripts/generate-report.mjs:1593` (zh) and `:1678` (en), mirrored to
`scripts/generate-report.mjs:1593,1678`, `adapters/codex/scripts/generate-report.mjs:1593,1678`,
and baked into `docs/reports/landing-self-audit.html:791,876` and
`docs/reports/broken-fixture.html:1101,1186`.

The misframing table still ships this row, unchanged:

> "axe found 0 violations, we're done." → **Roughly 60&ndash;70% of WCAG criteria are not
> machine-decidable. axe's authors say so explicitly.**
> 「axe 沒抓到任何違規，就完工了。」→ **大約 60–70% 的 WCAG 條款不是機器可判定的。axe 作者明確這麼說。**

The measurement document this same report now links to says the opposite on that axis: of the
55 A+AA criteria, **7 (12.7%) are not machine-testable in principle** and 48 (87.3%) are
(`plans/2026-07-27-wcag-coverage-measurement.md:150-161`). The doc's escape-hatch rule
(`:58-69`) exists precisely to settle this axis, and the predecessor audit flipped three rows
(1.2.5, 1.4.5, 1.4.1) to YES to apply it consistently.

Why it matters: the honesty panel's own link text is "See full methodology & limits →"
(`:1279`), so a reader who follows the panel's first link lands on the contradicting number,
one line above a second link to the table that refutes it. Beacon's positioning is that its
numbers are checkable; a client who checks finds the tool disagreeing with itself in the same
document. This is the same inherited hearsay the change set exists to retire — the hero
(`:1276-1277`) and exec summary (`:1341-1342`) were reframed as an industry estimate; these
two were not.

The 60-70% point is worth keeping — it is substantively true that most WCAG *failures in the
wild* are not caught by tooling, and the axe attribution is real. The defect is that it is
stated as a bare property of WCAG criteria, on the axis Beacon just measured differently, with
no attribution scope. Fix the framing, not the point.

### HIGH-2 — `guide.md` contradicts itself 40 lines apart, in the same file this change set edited

`core/content/guide.md:121` (`@cc` block) and `:126` (`@codex` block), mirrored to
`commands/guide.md:115` and `adapters/codex/references/beacon-guide.md:115`.

The "Calibration Against the Inspect Tier System" table's **"What it cannot do"** column reads:

> | Review | `/beacon:inspect` | Tier 1–3 audit, scoring, jurisdiction-aware WCAG context | Detect ~60–70% of WCAG criteria that need humans |

That asserts ~60-70% of WCAG criteria need humans, i.e. inspect covers ~30-40%. Forty lines
earlier, at `core/content/guide.md:81` and `:84`, this change set added:

> Beacon's own measured coverage is 14 of WCAG 2.2's 55 A+AA criteria (25.5%), 2 fully
> decided (3.6%)

Two claims about the same quantity in one document, differing by roughly ten points, one
measured and one inherited. `commands/guide.md` ships to Claude Code users and
`adapters/codex/references/beacon-guide.md` to Codex users, so both carry the contradiction
into the agent's context where it will be read aloud to users as fact.

### MEDIUM-1 — the hero honesty panel lost "test alongside disabled users"

`core/scripts/generate-report.mjs:1276-1277` (+ 2 mirrors, + both regenerated reports).

Before: "…the remaining 60–70% (cognitive load, real screen-reader task completion, whether
labels are genuinely clear) **needs testing alongside disabled users**. A high score does not
mean fully accessible." After: the coverage figures, then "A high score does not mean fully
accessible."

The call to action is gone from the most prominent honesty surface in the report. It survives
in the exec summary just below (`:1341-1342`, "test core flows with disabled users before
launch") and 9 times elsewhere in the rendered document, so the message is not lost — but
`ARCHITECTURE.md:335` describes this banner as the place Beacon ships its limits as
first-class content, and the panel is now purely quantitative. Restoring one clause costs
~15 words and no numbers.

### MEDIUM-2 — "2 are fully decided" drops the bound the source doc puts on FULL

All 15 published surfaces.

The doc defines FULL as "a Beacon detector decides the criterion for the cases it applies to
(no other realistic technical failure mode **within automation's reach** is left undecided)"
(`:52-56`), and 2.4.2's own row concedes it "decides presence/non-emptiness only; title
*descriptiveness* is semantic and outside any automated check's reach" (`:107`). Published
unqualified, "2 are fully decided" invites a client to read it as "Beacon guarantees WCAG
2.4.2 conformance" — a page titled `Untitled Document` passes.

Direction of error is self-deprecating (3.6% understates rather than inflates) and the
definition is one click away, which is why this is MEDIUM and not HIGH. A three-word bound
("fully decided within automation's reach" / 「在自動化可及範圍內完整決定」) closes it.

### MEDIUM-3 — the verifiability promise points into `plans/`, the least stable directory in the repo

15 surfaces, including every generated report that travels to a client, now hard-code
`.../blob/master/plans/2026-07-27-wcag-coverage-measurement.md`.

Before this change set, **zero** user-facing surfaces linked into `plans/`
(`grep 'blob/master/plans\|](plans/'` over `*.html`, `*.md`, `*.mjs` excluding `plans/`
itself returns nothing at `4c6862d`). `plans/` holds 29 dated working-notes files and is
treated as prunable — this very ticket asked me to archive an orphan out of a published
directory, which is the same class of tidy-up that would break this link.

The URL resolves today (200, verified). The exposure is that a client report delivered this
week 404s the moment anyone reorganises `plans/`, and the report is a permanent artifact the
client keeps. Cheapest durable fix: `git mv` the measurement doc to a stable path (root
`COVERAGE.md`, or a section anchor inside `VALIDATION.md`, which is already the load-bearing
public link in these same surfaces) and repoint the 15 references.

### MEDIUM-4 — `ARCHITECTURE.md:335` still presents the industry figure as Beacon's own

> Every audit ships with "this is ~30-40% of what matters" as visible content.

Stale as a description of the report (the banner now says 25.5% is Beacon's, 30-40% is the
industry estimate) and it is the conflation the change set exists to remove, in the doc
contributors and agents read to understand the design. One-line edit.

### MEDIUM-5 — 0.727 and 25.5% now sit adjacent on the landing page with no disambiguator

`docs/index.html:113` vs `:129`; `docs/zh-Hant.html:114` vs `:130`.

Nothing blends them — the table caption says "20-site evidence-anchored ground truth", its
rows say "Recall — violation **patterns**" and "violation **instances**", and the new stat says
"criterion coverage". A careful reader can separate them. A skimming reader sees 0.727 and
25.5% in one screenful with no cue that the denominators differ (instances vs criteria), which
is exactly what the source doc warns against at `:163-171`. Adding "criteria, not instances —
a different denominator from the recall table above" to the stat's description resolves it.

### LOW

- **En dash vs hyphen.** `docs/index.html:129` and `docs/zh-Hant.html:130` write `~30-40%`
  with an ASCII hyphen; every other surface uses `–` / `&ndash;`, and `docs/index.html:57`
  already writes `0–100` with an en dash. Cosmetic inconsistency inside one file.
- **`tools/validate-patterns.mjs:27`** still carries `the machine layer (~30-40% of WCAG)` in
  a code comment. Dev-only, never rendered; sweep it with HIGH-1 for consistency.
- **`ARCHITECTURE.md:370`** lists "the 30-40% split" among claims that "would benefit from
  explicit citation" — now partly answered by the measurement doc. Stale, harmless.
- **`——` as parenthetical** in the new zh copy (`README.zh-Hant.md:64`,
  `README.zh-Hans.md:64`, `docs/zh-Hant.html:130`) conflicts with the standing style rule
  against em dash as supplementary insertion. Noted, not gated: the surrounding files already
  use this convention throughout, so consistency argues for a separate sweep rather than
  making these three lines the exception.
- **Release-tag drift.** `v3.3.0` is tagged and pushed at `3844587`, four commits behind
  `HEAD`, yet `CHANGELOG.md:115-125` already describes this coverage work under `[3.3.0]`.
  The primary distribution path is unaffected — `.claude-plugin/marketplace.json` uses
  `"source": "./"`, so marketplace installs track `master` and do get this copy — but the
  GitHub release tarball for v3.3.0 ships the old banner while its changelog claims the new
  one. A retag or a `3.3.1` heading resolves it; not a gate on this diff.

## Cleanup performed (item 6)

`docs/reports/civicrm-event-case.{html,json}` — engine `beacon-static-audit@8`, dated
2026-07-11, added at `d05ccdc`, zero inbound references anywhere in the repo, sitting in the
GitHub Pages publish directory. It also still carried the original unqualified
"automated tools cover 30–40% of WCAG criteria" as Beacon's own claim (`:748`, `:762`),
which is exactly the framing this change set retires.

Moved with `git mv` to `plans/archive/` (directory created). Both files preserved as history,
rename detected by git (`R` status, content unchanged). Post-move verification:

- `grep -ril 'civicrm'` outside `plans/archive/` → **0 files**. Nothing referenced the old path.
- `node build.mjs --check` → `all 51 outputs match core.` (unchanged).
- `docs/reports/` now contains only `landing-self-audit.html` and `broken-fixture.html`.

Note for the arbiter, since this is outward-facing: the orphan is **currently live** —
`https://chiehweihuang.github.io/beacon/reports/civicrm-event-case.html` returns 200 today.
Committing and pushing this move replaces that with a 404. Given zero inbound links and the
stale claim it carries, that is the intended outcome, but it is a public URL that will break.

## Required fixes

Both are copy-only edits in `core/` sources; `node build.mjs` propagates to the mirrors, then
`node docs/make-demos.mjs` regenerates the two demo reports.

1. **HIGH-1** — `core/scripts/generate-report.mjs:1593` (zh) and `:1678` (en). Scope the claim
   the same way the hero and exec summary were scoped: attribute the 60-70% to axe's authors
   as an estimate about what tooling catches in practice, and say Beacon's own criterion-level
   measurement is published, so the two are not read as one number. Something of the shape:

   > "axe found 0 violations, we're done." → axe's authors say explicitly that most WCAG
   > failures are not machine-decidable in practice. Beacon's own criterion-level measurement:
   > 14 of 55 A+AA criteria have any detector at all.

   Then `node build.mjs` (updates both mirrors) and `node docs/make-demos.mjs` (updates
   `docs/reports/landing-self-audit.html:791,876` and `docs/reports/broken-fixture.html:1101,1186`).
   Verify: `grep -rn '60&ndash;70' core/ scripts/ adapters/ docs/reports/` returns only
   reframed lines; `node build.mjs --check` → 51/51; demo reports byte-identical to a fresh render.

2. **HIGH-2** — `core/content/guide.md:121` and `:126`. Replace the "What it cannot do" cell
   `Detect ~60–70% of WCAG criteria that need humans` with a statement that does not restate a
   coverage percentage, e.g. `Decide the criteria that need human judgement — see the coverage
   table above`. The measured figure already appears at `:81`/`:84`; the table cell should not
   carry a second, different one. Then `node build.mjs`.
   Verify: `grep -n '60–70' core/content/guide.md commands/guide.md adapters/codex/references/beacon-guide.md`
   returns nothing; `node build.mjs --check` → 51/51.

MEDIUM-1 through MEDIUM-5 are worth batching into the same pass — each is one sentence — but
none of them gates the commit.

---

# Verification round (2026-07-28, same auditor)

## Verdict: PASS

Both HIGH findings closed at the root, all five MEDIUMs addressed, whole tree green.

### (a) Reframed Methodology copy names the right quantity

`core/scripts/generate-report.mjs:1593` (zh) / `:1678` (en), + 2 mirrors + both regenerated
reports:

> "axe found 0 violations, we're done." → axe's authors say explicitly that most WCAG
> **failures** are not machine-decidable **in practice**. Beacon's own criterion-level
> measurement: **14 of 55 A+AA criteria have any detector at all.**

The old defect was a specific percentage (60-70%) on the *criteria-in-principle* axis, which
the measurement puts at 7/55. That number is gone from every shipped surface
(`grep '60-70\|60–70\|60&ndash;70'` outside `plans/` returns only `ROADMAP.md:103`, a
struck-through retired question). What replaces it is unquantified, attributed, and scoped to
*failures in practice* — so it cannot be arithmetically compared with 7/55 — while the engine
quantity is stated exactly and correctly: 14/55 have a detector, complement 41/55. zh matches
en (失敗 / 實務上 / 準則層級 / 有偵測器涵蓋). Not a vague formulation swapped for another: the
vagueness is confined to a qualitative attributed claim with no number, and the precise number
sits beside it, correctly labelled.

`core/content/guide.md:121` (@cc) and `:126` (@codex) — both blocks fixed, mirrored to
`commands/guide.md:115` and `adapters/codex/references/beacon-guide.md:115`. The cell now
makes no quantitative claim, so the same-file contradiction with `:81`/`:84` is gone.

### (b) The anchor resolves — verified, not assumed

Two live checks, because the sanitizer question is real:

1. **GitHub markdown API** (`POST https://api.github.com/markdown`) on the exact construct at
   `VALIDATION.md:434-435`: the `<a id="wcag-criterion-coverage"></a>` **survives** the
   sanitizer, rewritten to `id="user-content-wcag-criterion-coverage"` — the identical
   treatment GitHub gives its own heading anchors in the same response.
2. **Live Chromium** on a published GitHub blob page, testing whether the un-prefixed fragment
   resolves to a `user-content-` id after GitHub's JS runs:
   - `VALIDATION.md#l0--reliability-details` → **scrollY 1746**, `plainId=false`,
     `userContentId=true`
   - control `#this-anchor-does-not-exist-xyz` → scrollY 0

So the un-prefixed fragment does resolve, the hand-written anchor gets the same id shape as the
heading anchor that scrolled, and `VALIDATION.md#wcag-criterion-coverage` will work once pushed.
Note on scope: the section is not pushed yet, so this verifies the **mechanism** on live GitHub,
not the final URL. The base `VALIDATION.md` URL already returns 200.

The explicit anchor is load-bearing, not decorative: GitHub's auto-slug for that heading is
`wcag-22-aaa-criterion-coverage--measured-not-inherited`, so there is no fallback. The section's
own do-not-rename warning at `:437-439` is the right guard.

### (c) Figures and link targets

- Pre-correction figures in shipped surfaces: **0**. The only hits repo-wide are inside
  `plans/2026-07-27-...md`'s audit-trail section, where they are explicitly labelled "(was …)"
  under a RESOLVED banner — correct by purpose — and this report's own grep pattern.
- Orphaned links to the old `plans/` path from shipped surfaces: **0**. Remaining mentions are
  CHANGELOG history, two test comments, and VALIDATION.md's own deliberate "working record
  stays at …" pointers.
- All 15 surfaces + the canonical section = **21** occurrences of
  `VALIDATION.md#wcag-criterion-coverage`.
- The standalone report carries the absolute stable URL:
  `docs/reports/landing-self-audit.html:516` →
  `href="https://github.com/chiehweihuang/beacon/blob/master/VALIDATION.md#wcag-criterion-coverage"`,
  same in `broken-fixture.html`.
- `plans/2026-07-27-...md` now opens by naming `VALIDATION.md#wcag-criterion-coverage` as the
  canonical published home and itself as the working record. MEDIUM-3 closed.

### (d) VALIDATION.md structure intact

Headings in order: `Layer map` (17) → L0 (30) → L1 (68) → L2 (81) → L3 (409) → **new section
(435)** → L4 (531) → L5 (548) → Release gate → Measured state → Open items. No duplicated
headings. The new section holds a full **55-row** table (counted) and arithmetic that matches
the source exactly: 2 FULL + 12 PARTIAL = 14 → 14/55 = 25.5%; 2/55 = 3.6%; 14/48 = 29.2%;
2/48 = 4.2%.

It also closes two MEDIUMs at the canonical location: the FULL rows carry
"both within automation's reach, **not full conformance**", and `:520-524` states the
criteria-vs-instances separation naming 0.727 with "do not average, blend, or substitute".

### (e) Whole tree

`node --test` **402 pass / 0 fail** · `node build.mjs --check` **all 51 outputs match core** ·
both demo reports **byte-identical to a fresh render** · self-scan **0 critical / 0 warning**
on both (5 expected local-file tips) · rakuten specimen regenerated and carrying the new URL ·
no-overflow assertion re-run: **20/20 PASS**, `scrollWidth == clientWidth` at 320 and 1280 in
light and dark across rakuten + `docs/index.html` + `docs/zh-Hant.html` + both reports.

### Residue (LOW, not gating)

- `core/content/guide.md:121,126` says "see the coverage table **above**" — what is above at
  `:81`/`:84` is a *link* labelled "row-by-row table", not a table in the document. Resolves
  correctly for a careful reader; "the linked coverage table above" would be exact.
- The new section sits between L3 and L4, interrupting the L0-L5 spine. It is not a layer and
  is not in the Layer map. Consider moving it after L5, or adding a map row.

Cleanup from the first round still holds: `plans/archive/civicrm-event-case.{html,json}`,
rename detected, 0 references to the old path, `docs/reports/` down to the two live demos.
That URL is still live at 200 — pushing turns it into a 404, as intended.
