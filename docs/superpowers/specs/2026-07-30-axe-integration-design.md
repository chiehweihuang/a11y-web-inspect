# axe-core Integration · Design

**Date:** 2026-07-30  
**Status:** draft for user review  
**Scope posture:** hold Beacon 3.3.0 and harden the existing audit pipeline

## Goal

Make axe-core a first-class input to Beacon's authoritative
`audit-results.json`, alongside Tier 1 static findings and Beacon-native Tier 2
browser findings.

Beacon must list every axe violation and every affected DOM node. It must score
an axe violation once when Beacon has no equivalent evidence, while avoiding a
second score penalty when Beacon Tier 2 already confirms the same WCAG
criterion. Possible false positives remain visible for human judgment.

## Selected approach

Extend `static-audit.mjs` with an `--axe-results <raw-axe.json>` input. This is
the only scoring entry point; no post-hoc score editor or second scoring engine
is introduced.

```text
Tier 1 files
  + --merge-findings tier2-results.json
  + --axe-results axe-results.json
        |
        v
static-audit.mjs: validate, normalize, reconcile, score
        |
        v
audit-results.json: findings + raw outcomes + provenance
        |
        v
generate-report.mjs: client summary + complete Audit evidence
```

This is preferred over a separate `axe-extract.mjs --merge` command because a
post-hoc merge would have to duplicate or re-enter Beacon's scoring logic.
Running axe inside `tier2-audit.mjs` is out of scope: Tier 2 remains an
axe-free, dependency-light browser measurement layer, while axe remains a
first-class optional input when its raw JSON is available.

## CLI and artifact contract

New usage:

```bash
node scripts/static-audit.mjs \
  --scope "Page" \
  --merge-findings tier2-results.json \
  --axe-results axe-results.json \
  --output audit-results.json \
  snapshot/
```

`--axe-results` accepts one raw axe-core result object. The command fails with
an actionable error when:

- the file is unreadable or invalid JSON;
- it does not contain axe outcome arrays;
- `violations`, `passes`, `incomplete`, or `inapplicable` is present but is not
  an array.

The output stores a normalized `axe` object containing:

- engine name and version;
- tested URL and timestamp when supplied;
- complete `violations`, `passes`, `incomplete`, and `inapplicable` arrays;
- outcome counts;
- reconciliation metadata describing which axe rules were independently scored
  and which were corroborating existing Beacon evidence.

No axe nodes, selectors, snippets, failure summaries, help URLs, or outcome
lists are discarded.

## Finding normalization

Each axe violation becomes one Beacon finding containing all of the rule's DOM
nodes as `instances`. This keeps the report grouped by one repair action without
hiding affected elements.

Normalization preserves:

- `axe_rule_id`;
- impact and mapped Beacon severity;
- WCAG criterion tags;
- affected selectors and HTML snippets;
- failure summaries and rule help URL;
- `source: "axe-core@<version>"`;
- `check: "fail"`.

Normalization reuses Beacon's existing axe category mapping currently embedded
in `generate-report.mjs` (`AXE_RULE_CATEGORY`, axe `cat.*` tags, then the
screen-reader fallback). Rules without a machine-readable WCAG tag use
`axe:<rule-id>` as their scoring identity and remain visible as best-practice
findings. They are not silently dropped.

`incomplete` outcomes are rendered as review evidence and do not reduce the
score. `passes` and `inapplicable` remain evidence lists; they are not converted
into remediation findings.

## Scoring and overlap reconciliation

The scoring identity is the normalized Beacon category plus WCAG criterion.
This is intentionally criterion-level rather than selector-string-level:
Beacon Tier 2 and axe often produce different valid selectors for the same DOM
node, so raw selector equality would fail to recognize the overlap.

For rules carrying multiple WCAG criteria, each criterion is checked for
overlap. The axe violation is corroborating-only only when every criterion is
already covered by a confirmed Beacon failure. If any criterion is new, the
rule contributes one new failure check, never one penalty per criterion.

Rules:

1. An axe violation for a criterion with no confirmed Beacon finding is added
   as a normal confirmed finding and contributes one failure check to Beacon's
   existing scoring model. Existing minimum-evidence thresholds still determine
   whether that category receives a numeric score.
2. When Tier 2 already has a confirmed failure in the same category and WCAG
   criterion, the axe violation remains a confirmed finding in the artifact and
   report, but is marked `score_effect: "corroborating"` and adds no second
   penalty.
3. The existing Tier 2 finding receives axe-core in its evidence-source list so
   the report can state that both engines confirmed the criterion.
4. Multiple axe nodes for one rule are all listed but do not multiply the
   severity penalty; this matches Beacon's existing template-stamped finding
   cap.
5. Review-only Tier 2 evidence does not suppress a confirmed axe failure. If
   Tier 2 could not resolve contrast but axe confirmed a failure, axe supplies
   the scored result.

This reconciliation affects score penalties only. It never removes a rule,
node, selector, or evidence source.

## Report behavior

The Audit report shows an explicit axe-core evidence summary:

- engine/version;
- violation-rule and affected-node counts;
- passed, incomplete, and inapplicable counts;
- expandable outcome lists;
- per-finding axe rule links and DOM instances;
- a visible “also confirmed by Beacon Tier 2” provenance label where applicable.

The client report does not expose raw axe internals. Its confirmed-issue count
uses reconciled score-bearing findings, so corroborating axe evidence does not
inflate the headline or top-three priorities.

If Tier 2 ran without axe, the Audit report explicitly says “axe-core was not
included in this run.” It must not silently hide the absence merely because
`requires_live_audit` is false.

Lighthouse remains supplementary performance, best-practices, and SEO
evidence. Its accessibility category remains excluded to avoid a third
overlapping accessibility result set.

## Source ownership and generated outputs

Canonical changes live under `core/`. Any new shared script is added to the
generated manifest and built to both runtime surfaces. Generated root and Codex
adapter copies are never edited directly.

Expected touched areas:

- `core/scripts/axe-results.mjs`, owning the existing axe mappings,
  normalization, validation, and finding conversion used by both consumers;
- `core/scripts/static-audit.mjs`;
- `core/scripts/generate-report.mjs`, importing the shared normalizer instead
  of retaining a second embedded axe parser;
- `core/content/inspect.md`;
- generated outputs from `node build.mjs`;
- focused tests under `test/`.

No dependency is added. Beacon consumes raw axe JSON produced by any supported
runner.

## Testing

TDD acceptance cases:

1. Raw axe JSON is attached to `audit-results.json` with all outcome counts.
2. A unique axe violation becomes a scored Beacon finding.
3. An axe violation overlapping a confirmed Tier 2 criterion remains visible
   but does not change the score a second time.
4. Review-only Tier 2 evidence does not suppress a confirmed axe violation.
5. All nodes under an axe rule render in the Audit report.
6. The report shows axe passes, incomplete, and inapplicable outcomes.
7. A Tier 2 run without axe visibly reports that axe was not included.
8. Invalid axe JSON fails with an actionable message.
9. The real ADALS artifact contains axe-core 4.11.4 results and the Audit report
   visibly shows 2 violation rules, 13 affected nodes, 24 passes, 1 incomplete,
   and 38 inapplicable.

Final gates:

- focused red/green tests;
- full `node --test`;
- `node build.mjs --check`;
- `git diff --check`;
- regenerate both ADALS reports;
- report layout checks at 320, 768, 1024, 1280, 1440, 1742, and 1920 in
  Chinese/light and English/dark modes.

## Out of scope

- Bundling or installing axe-core;
- making axe mandatory when it is unavailable;
- replacing Beacon-native Tier 2;
- scoring Lighthouse accessibility;
- automatically deciding that an axe result is a false positive;
- modifying the production WordPress page.
