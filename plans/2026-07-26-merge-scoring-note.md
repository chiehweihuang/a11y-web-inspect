# 2026-07-26 — merge-scoring correction, staged for VALIDATION.md L2

Not committed to VALIDATION.md (owned by a parallel claims-fix pass on this branch).
This file holds the corrected text so it can be pasted in later without re-deriving it.

**Target location**: VALIDATION.md, the `### L2 — Tier-2 (browser-measured) thresholds,
engine beacon-tier2-audit@1` section, replacing the sentence "Findings + evidence only so
far — these categories do NOT yet enter the weighted score; that wiring is a separate,
undecided step (see plans/2026-07-25-v3.3-browser-measurements.md Workstream A step 4)."
That sentence carries the same false premise corrected in the plan file and should not
survive as-is.

**Replacement text (paste verbatim, adjust the engine version number if it has moved by
the time this lands):**

> Findings render as evidence + findings by default because merge is an explicit,
> agent-initiated step (`--merge-findings`, `core/content/inspect.md` Step 6) — NOT
> because the scoring mechanism is undecided. `mergeExternalFindings()`
> (`core/scripts/static-audit.mjs` ~1384-1427) has been the sole channel for Tier-2/manual
> findings to enter the scored artifact since commit `a1d8cab` (2026-06-21), and
> `tier2-audit.mjs` findings use that exact same channel as axe or any manual finding.
> Once a category's merged evidence (pass + fail) reaches `THIN_EVIDENCE_MIN` (3), the
> category leaves `not-machine-checkable`/`insufficient-evidence` and becomes `scored`.
> Measured on the committed fixture `test/golden/clean.html` (pinned by
> `test/golden/clean.expected.json`, reproducible with `node scripts/static-audit.mjs
> --scope golden-clean --date 2026-07-26 [--merge-findings <N tier2-contrast-fail
> findings>.json] test/golden/clean.html`): baseline contrast (0 pass/0 fail) →
> `not-machine-checkable`, overall 100, coverage 23%; +1 merged fail →
> `insufficient-evidence` (still overall 100, coverage 23%); +3 → contrast `scored` at 0,
> overall 100 → 64, coverage 23% → 36%. `confidence_level` stays `low` throughout (the
> band boundary is 60% coverage) — it moves only when a coverage change crosses that
> boundary. What is genuinely undecided (USER DECISIONS, see
> `plans/2026-07-25-v3.3-browser-measurements.md` Workstream A step 4): (a) whether the
> default inspect flow should run tier-2 + auto-merge, so scores move by default rather
> than only on an explicit agent action; (b) whether `THIN_EVIDENCE_MIN=3` is the right
> threshold for a tier-2 source that can produce hundreds of checks per page, where one
> merge call instantly clears it; (c) how the report distinguishes a static-only score
> from a tier-2-inclusive one so the two numbers are never confusable.

Numbers corrected 2026-07-27 (v3.3 merge-audit MEDIUM-3): the original 56/44/23 figures
above came from a throwaway 5-line HTML file never committed to the repo, so they could
not be reproduced from a clean checkout. Replaced with the `test/golden/clean.html` figures
also landing in `core/content/inspect.md` Step 6 (v3.3 merge-audit step 9) — same mechanism
and state transitions, different (reproducible) absolute numbers.

No code or test changes accompany this note — it is a documentation correction only.
