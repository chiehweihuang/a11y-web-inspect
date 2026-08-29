# Accessibility Legal Quick Reference

**Superseded (2026-08-29): the jurisdiction table and litigation-statistics below predate
the jurisdiction-expansion primary-source research and disagree with it on specifics (e.g.
this file's US lawsuit count and Canada's ACA/AODA/penalty framing do not match the
verified figures) — do not cite them.** The canonical, verification-passed source is
`core/scripts/jurisdictions.mjs` (research: `plans/2026-08-29-jurisdiction-expansion/`):
23 tracked jurisdictions — 14 with a specific web-accessibility law and a named technical
standard, 2 with only a general anti-discrimination framework and no web-specific
statutory text, 7 tracked as no specific law found (never silently omitted). Each record
carries statute/scope/standard/enforcement detail, sources, and an explicit confidence
label; `legalExposureFor(level)` is the single source for the level-aware legal-exposure
sentence `generate-report.mjs` renders. The "When to Flag" and "One-Line Summaries"
sections below are still-valid judgment heuristics, not jurisdiction-specific facts, and
remain in force.

## When to Flag Legal Risk

Flag in advisor output when:
1. A Level A criterion is violated → noncompliant under ALL jurisdictions
2. A Level AA criterion is violated → noncompliant under most jurisdictions
3. Project targets users in EU → EAA is in force NOW
4. Project targets US government → Section 508 applies
5. Project targets Japan → private sector "reasonable accommodation" is mandatory
6. CAPTCHA or overlay widget detected → known litigation triggers

## One-Line Summaries for Each Audience

- **lead**: "This violation exposes us to litigation in [X] jurisdictions. Average ADA lawsuit settlement: $50K-$100K."
- **dev**: "WCAG 2.2: [criterion] (Level [X]). Required by [laws]."
- **designer**: "This design choice excludes [disability category] users and violates [law]."
