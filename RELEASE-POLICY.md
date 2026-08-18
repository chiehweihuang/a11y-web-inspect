# Beacon release and detector policy

Beacon is used as a regression baseline. A release therefore has two compatibility
surfaces: its CLI/JSON/plugin interfaces and the findings or scores produced for the
same input.

## Version contract

### Patch

A patch may contain false-positive fixes, reliability fixes, performance changes,
documentation, localization, and security fixes. It must not intentionally:

- add, enable, disable, rename, or remove a detector;
- promote a review-only detector into scoring;
- change category weights, severity penalties, score bands, or category-state rules;
- change a public CLI option, JSON field, finding key, or plugin entry point.

Bug fixes can still change results. Every result change must be explained against the
golden vectors and wild corpus. A false-negative fix that intentionally makes unchanged
pages newly fail belongs in a minor release, not a patch.

### Minor

A minor may add detectors or technology support, disable a detector, promote an
experimental detector into scoring, or change scoring semantics. It may therefore make
an unchanged page report new findings or a different score. Release notes must name
those changes and the affected finding keys or score fields.

### Major

A major may make incompatible CLI, JSON, plugin, category, or finding-key changes and
may remove detectors. A public interface or detector must be marked deprecated for at
least six months before removal, except when retaining it would create a security or
materially misleading accessibility result.

## Detector lifecycle

1. **Proposal**: define the user harm, target condition, likely false-positive classes,
   result state, and promotion evidence before implementation.
2. **Experimental**: ship as `review` / not scored. It may appear in reports as evidence
   requiring confirmation, but it cannot lower a category or overall score.
3. **Validation**: add positive, negative, and near-miss regression fixtures; run the
   unselected wild sample; publish precision, recall where measurable, sample size, and
   known blind spots.
4. **Promotion**: move into scoring only in a minor release after its proposal's stated
   evidence gate passes. The gate must be chosen before looking at the final results;
   Beacon does not use one universal precision threshold for every detector.
5. **Correction**: every confirmed false-positive class gets a minimal regression
   fixture. Search sibling detectors for the same root cause before closing the fix.
6. **Deprecation**: demote unreliable scoring detectors to review immediately when that
   prevents misleading results; remove them only under the version contract above.

Existing scored detectors that predate this policy are not retroactively certified.
Their published measurements and limitations remain authoritative until each detector
passes a new promotion review.

## Release gate

Before publishing any release:

1. Run `node --test` and `node build.mjs --check`.
2. Compare golden vectors and the 40-page wild corpus with the previous release.
3. Explain every changed finding key, category state, coverage value, and score.
4. For a minor or major, rerun the relevant ground-truth and wild measurements.
5. Freeze detector and scoring code for the final seven days before a public minor or
   major release; only documentation, metadata, localization, and release-blocking
   security fixes may enter during the freeze.

This policy adapts the result-stability principles in axe-core's
[release and support policy](https://github.com/dequelabs/axe-core/blob/develop/doc/release-and-support.md),
[backwards-compatibility contract](https://github.com/dequelabs/axe-core/blob/develop/doc/backwards-compatibility-doc.md),
and [experimental-rule model](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md#experimental-rules)
to Beacon's score and evidence model. It is a Beacon contract, not a claim that the two
projects have identical release processes.
