# v3.3.0 claims-audit fix notes (2026-07-26)

Executed the 12 "Required fixes (ordered)" from `plans/2026-07-26-v33-claims-audit.md`.
Did not touch `core/scripts/generate-report.mjs`, `test/generate-report-standard-coverage.test.mjs`,
`test/tier2-report-visibility.test.mjs`, or any other concurrent agent's files
(`core/content/inspect.md`, `commands/inspect.md`, `adapters/codex/references/beacon-inspect.md`,
`plans/2026-07-25-v3.3-browser-measurements.md`, `plans/2026-07-26-merge-scoring-note.md`) — those
were already dirty from other agents active in this session and are out of this ticket's scope.

## Per-item status

1-5, 7, 10-11: applied verbatim per the audit's replacement text, zh/en landing pages in sync,
all 8 translated READMEs mirrored (including their version lines, item 8).

**Item 6** (885/88/79-11-10 design-impact split): **deleted**, not re-derived. No committed
artifact backs the classification at any engine version — `benchmark/2026-07-05/` only has
per-category pass/fail summaries (`results-engine6.json`), no per-finding-key breakdown and no
raw HTML captures, so the visual-impact bucketing can't be recomputed from a clean checkout
without re-crawling 87 sites and re-doing the manual classification by hand. Rewrote
`docs/index.html`/`docs/zh-Hant.html` "Will it fight your design?" section to keep the true
qualitative groupings (which finding types are zero-pixel / state-only / copy-only) without any
number.

**Item 7**: GT table → `1.000 / 0.727 / 0.829`, column labelled `Beacon 3.3 (engine @8 GT
mapping)` / `Beacon 3.3（引擎 @8 GT 對映）`.

**Item 8**: CHANGELOG `[3.3.0]` entry written (native Tier-2 harness @1, static contrast
reference @10, axe optionalization + code-backed contrast gate @11, explicit "what did not
change" paragraph). `plugin.json` → 3.3.0. `.release.json` `readmeSync`: **extended**, not
hand-only — added the 8 translation files with their exact "Plugin facts: ... version
`{VERSION}` ..." phrasing so future releases auto-sync them. No runnable release script exists
in this repo to invoke that sync now, so this release's actual version-line edits in all 9
README files were done by hand; the extended config is for the next release onward.

**Item 9**: ran `node docs/make-demos.mjs` — regenerated both demo reports at engine @11, nav
injection confirmed present in both (`landing-self-audit.html` score 100, `broken-fixture.html`
score 0). Independently re-audited the broken fixture myself (did not trust the audit's number):
**18 findings, 13 critical** — matches what the audit suggested; landing gallery text updated to
18 in both languages.

**Item 12**: VALIDATION.md — release gate line → 376 tests (verified live: `node --test` on the
current worktree, which includes the other agents' in-flight test files, per the team lead's
"expect 376" note); header → `2026-07-25, engines beacon-static-audit@11 + beacon-tier2-audit@1`;
GT rows extended to `@8/@9/@10/@11` with the neutrality argument (contrast isn't a GT criterion,
`@10`/`@11` findings are all `check:'review'`); added a note at the round-2 contrast-calibration
section (9-site figure) that a broader FP pass is in progress separately and its numbers are not
published here yet — no in-flight numbers from task #1 were cited.

## Final verification

- `node --test`: **376/376 pass**, 0 fail.
- `node build.mjs` + `node build.mjs --check`: **clean**, all 50 generated outputs match `core/`.
- Re-audited `docs/index.html` + `docs/style.css` against the live engine today: **100/100,
  23% coverage, 1 finding** — matches the published badge/table exactly.
- Re-audited `test/golden/dirty.html` (the broken-fixture source) today: **18 findings, 13
  critical, score 0** — matches the published gallery text.

<!-- writing-harness: not applicable — engineering notes for another agent, not reader-facing prose -->
