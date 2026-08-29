# Beacon

[English](./README.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md) · [简体中文](./README.zh-Hans.md) · [繁體中文](./README.zh-Hant.md) · [Bahasa Indonesia](./README.id.md) · [Tiếng Việt](./README.vi.md) · [ไทย](./README.th.md) · [हिन्दी](./README.hi.md)

Private-beta accessibility + AEO inspection plugin for Claude Code and Codex.

**Landing page & live sample reports**: [chiehweihuang.github.io/beacon](https://chiehweihuang.github.io/beacon/) ([繁體中文](https://chiehweihuang.github.io/beacon/zh-Hant.html)) — the page is styled freely and audited by its own engine, with the machine-checked score and evidence coverage shown as separate values.

Beacon is a fast accessibility baseline for agent-assisted UI work: static heuristics first, live audit support when available, and report language that explains what to fix and why. It is useful in the same part of the workflow where teams use Lighthouse, axe, Pa11y, or WAVE, but Beacon is tuned for agent coding sessions, jurisdiction-aware WCAG context, Answer Engine Optimization, and human-centered explanations.

As of 2.1.0, `beacon:inspect` also folds in Lighthouse performance, best-practices, and SEO as supplementary signals and connects them back to accessibility through shared cross-cutting root causes — for example, an oversized DOM that slows style and layout, burdens screen-reader traversal, and hampers AI crawlability at the same time. These signals sit beside the accessibility score; they are not part of it.

Beacon is not a compliance certificate, not a legal opinion, and not a replacement for testing with disabled users. A high Beacon score means the automated checks found fewer problems in the inspected evidence. It does not prove that the product is fully accessible.

Beacon runs locally; site files stay on your machine unless you explicitly share them. The installed plugin does not change itself inside your environment. Maintainers may run offline evaluation loops and add better detectors in later releases; users benefit by updating the plugin.

## What Beacon Does

Beacon provides three Claude Code commands:

| Command | Use it when | What you get |
|---|---|---|
| `beacon:inspect` | You have a page, component, HTML file, or UI change to review. | An evidence-backed baseline score, category states (and scores only where measured), findings, jurisdiction context notes, remediation order, and an interactive HTML report — plus an optional Performance Signals section (Lighthouse performance/best-practices/SEO) when a browser is available. |
| `beacon:guide` | You are about to design or code UI. | Accessible patterns, component guidance, WCAG reminders, and design tradeoffs before code is written. |
| `beacon:advisor` | You are editing HTML, CSS, JSX, TSX, Vue, or Svelte. | Contextual accessibility prompts while you work. It also runs through the Claude Code PostToolUse hook for UI file edits. |

For substantial rendered UI work, `beacon:inspect` can also run `scripts/design-qa.mjs`: a seven-width light/dark screenshot and layout gate with a machine-readable ledger. It can block horizontal overflow, crushed primary text columns, forbidden MingLiU fallbacks, and page errors. A machine pass is not visual approval; actual 200% browser zoom, dead space, supported locales/states, and human visual quality remain explicit manual checks.

Typical usage in Claude Code:

```text
/beacon:guide
I am building a checkout form with address autocomplete and inline validation.
```

```text
/beacon:advisor
Review the modal I am editing for keyboard, focus, and screen-reader issues.
```

```text
/beacon:inspect
Inspect this page for WCAG 2.2 AA, jurisdiction context, and AEO readiness.
```

## Audit Model

Beacon uses a three-tier model.

| Tier | Evidence | Strength | Important limitation |
|---|---|---|---|
| Tier 1: static scan | Files and markup patterns through `scripts/static-audit.mjs`. | Fast, repeatable, zero browser dependency. Good for regression baselines. | Heuristic only. It cannot compute real visibility, computed styles, runtime focus behavior, or true contrast. Hidden elements may be over-reported. |
| Tier 2: live audit | Browser evidence through Beacon's own `scripts/tier2-audit.mjs` (plain Playwright — contrast 1.4.3 and touch-target size 2.5.8 at 320px/1280px); axe-core is an optional cross-check for ARIA-validity rules. | Stronger evidence for computed style, contrast, ARIA, visibility, and runtime behavior. | Still automated. It cannot prove task success or language clarity for real users. |
| Tier 3: human testing | Manual walkthroughs and tests with disabled users. | Required for cognitive load, task completion, real assistive technology behavior, and usability. | Takes planning and cannot be replaced by AI. |

Tier 1 is a fast baseline, not the authority. If Tier 1 and Tier 2 disagree, prefer the live browser evidence (Beacon's Tier-2 harness, plus axe if you ran it). Static checks intentionally err on the side of surfacing review items, so dense real-world pages can have false positives, especially around hidden links, list structure, and anything that depends on CSS visibility.

The Design QA gate complements these accessibility tiers. Within an authorized coding task, an agent may fix a blocking root cause and rerun it for at most three rounds. It must stop earlier when the same blocker repeats without new evidence, and it must not rewrite product intent or design direction merely to make the gate pass.

## Installation

Install from the Claude Code plugin marketplace:

```text
/plugin install beacon@beacon
```

(The format is `plugin@marketplace`. This repository is both the marketplace and its only plugin, and both are named beacon — hence the doubled name.)

Your Claude Code config must include `beacon` in `extraKnownMarketplaces`:

```json
"beacon": {
  "source": {
    "source": "github",
    "repo": "chiehweihuang/beacon"
  }
}
```

Plugin facts:

| Field | Value |
|---|---|
| Name | `beacon` |
| Version | `3.5.0` |
| Repository | `chiehweihuang/beacon` |
| License | MIT |
| Author | chiehweihuang |

## First Inspection

Run `beacon:inspect` after a substantial UI change or against a page you want to evaluate.

Beacon can produce:

- `audit-results.json`: structured audit data and findings.
- `a11y-report-*.html`: an interactive human-readable report.
- before/after comparison when a previous audit JSON is supplied.

Use the score as a triage signal:

| Score band | Meaning |
|---|---|
| 90-100 | Automated baseline looks strong. Still run keyboard, screen-reader, zoom, and real-user checks for important flows. |
| 50-89 | Some barriers or review items were found. Prioritize findings by affected users and severity. |
| 0-49 | High-priority review recommended. The inspected evidence suggests substantial barriers. |

Every score is paired with `coverage_percent`, the share of scoring weight actually measured. Categories without machine evidence report a state (`not-machine-checkable` / `not-applicable`) instead of a number. A category with any evidence scores; one with only 1-2 machine checks additionally carries `thin: true` and renders a same-line "thin evidence" qualifier next to the score, rather than being hidden. A confirmed seizure-risk finding (WCAG 2.3.1) caps the overall score into the 0-49 band regardless of category weights.

If a report says `requires_live_audit: true`, Beacon found signals that static evidence is not enough. That is common for client-rendered apps, hidden/conditional UI, runtime ARIA, computed contrast, and interactive behavior.

`review` or `incomplete` items are not passes and not failures. They mean Beacon could not verify the condition from the available evidence.

How these numbers are kept honest — reliability, detector validity, score-semantics
properties, external benchmarks, and fairness invariants — is specified and executable
in [VALIDATION.md](VALIDATION.md); the measured data lives under [benchmark/](benchmark/).
Result stability across patch, minor, and major versions, plus the review-only lifecycle
for new detectors, is governed by [RELEASE-POLICY.md](RELEASE-POLICY.md).

Detector precision is measured on pages nobody hand-picked, not assumed. Against a
survey of real captured sites, six of the highest-volume detectors were sampled across
distinct sites, judged instance by instance at their cited markup and adversarially
re-judged: `image-alt` 1.000, `link-name` 0.933, `heading-order` 0.867, `clickable`
0.615, `button-name` 0.600, `input-label` 0.417 (n=15 each — the confidence intervals
and every per-instance call ship with the data in
[benchmark/2026-08-03-wild-precision/](benchmark/2026-08-03-wild-precision/)). The
dominant cause of false positives is markup hidden by a stylesheet class rather than an
inline style, which a tier that never loads CSS cannot see; that limit is now measured
rather than merely disclosed.

The underlying engine-`@18` survey now contains **3,700 unique real-world sites** with
matched rendered snapshots and audit artifacts; 3,625 are in the current active analysis
cohort after artifact/status exclusions. This is the mother cohort for stratified
precision samples, false-positive discovery, release movement, and regression selection
— not 3,700 manually adjudicated audits. See the
[cohort definition and permitted claims](benchmark/2026-08-13-survey-3700.md).

Automated tools are often estimated to cover ~30-40% of WCAG criteria industry-wide.
Beacon measured its own coverage: of WCAG 2.2's 55 A+AA criteria, 14 have any coverage
(25.5%) and 2 are fully decided within automation's reach (3.6%) — row-by-row table and
re-derivation method in [VALIDATION.md](VALIDATION.md#wcag-criterion-coverage).

## Inspection Categories

| Category | What it checks |
|---|---|
| Contrast | Text and UI contrast ratios, color-only information, dark mode, and contrast-sensitive states. |
| Keyboard | Tab order, focus indicators, keyboard traps, skip links, and keyboard alternatives for pointer interactions. |
| Screen Reader | Landmarks, heading structure, alt text, names, roles, ARIA, page language, and semantic structure. |
| Forms | Labels, instructions, error messages, autocomplete, required fields, and validation behavior. |
| Media | Captions, transcripts, autoplay, audio control, flashing content, and media alternatives. |
| Motion | `prefers-reduced-motion`, time limits, auto-moving content, and animation from interaction. |
| Touch | Target size, spacing, drag alternatives, pointer gestures, and orientation assumptions. |
| Cognitive | Consistent navigation, help mechanisms, readable labels, predictable flows, and dark patterns. |
| Responsive | 320px reflow, zoom, viewport settings, fixed widths, fluid typography, and layout overflow. |
| Agent/AEO | Schema.org, metadata, canonical links, heading outline, crawlable content, `robots.txt`, `sitemap.xml`, optional `llms.txt`, and answer-engine clarity. |

### Performance Signal (supplementary)

When Lighthouse and Chrome are available, `beacon:inspect` also runs Lighthouse for **performance, best-practices, and SEO** — the categories Beacon's engine does not cover — in parallel with the live audit, and shows them in a Performance Signals section. These are supplementary signals: they are **not** part of the 0-100 accessibility score.

Their value is cross-cutting root causes: one cause (such as an oversized DOM) mapped to every dimension it harms — performance, accessibility, and AEO at once — which no single-purpose tool surfaces on its own. Lighthouse scores vary run-to-run with device emulation and CPU throttle (the CLI default is mobile with 4x CPU throttle; `--preset=desktop` typically scores 15-25 points higher), so treat them as directional, not absolute.

## Jurisdiction Context Coverage

Beacon maps findings to WCAG-linked context across 23 tracked jurisdictions
(`core/scripts/jurisdictions.mjs`, primary-source research): 14 have a specific
web-accessibility law with a named technical standard (US, EU, Japan, Taiwan, Canada,
China, South Korea, Brazil, Argentina, Colombia, Peru, Chile, Uruguay, Ecuador), 2 have
only a general anti-discrimination framework with no web-specific statutory text
(Australia, Hong Kong), and 7 are tracked as no specific law found, honestly, rather than
omitted (Macau, Mongolia, Venezuela, Bolivia, Paraguay, Guyana, Suriname).

These notes are not legal advice and are not a mechanical per-jurisdiction risk score. Use them to understand which WCAG criteria are relevant in each context, then confirm current local requirements before making a compliance claim.

## AEO And Agent Readiness Workflow

Beacon's Agent/AEO category is an actionable structure check, not a promise of AI citation.

Use it in three steps:

1. Fix Beacon findings that an agent can directly help with: meta description, canonical links, Schema.org JSON-LD, heading outline, crawlable content, `robots.txt`, `sitemap.xml`, and optional `llms.txt`.
2. For public sites, cross-check with an external agent-readiness scanner such as [Cloudflare's `isitagentready.com`](https://isitagentready.com/) or Cloudflare URL Scanner Agent Readiness. These scanners cover broader public-site signals such as robots policy, sitemap discovery, Markdown negotiation, Content Signals, MCP/API/OAuth discovery, and related agent-facing standards.
3. Measure actual outcome separately: AI-crawler hits in server logs, manual answer-engine queries, and referral sources in analytics.

External scanners can supplement or replace parts of Beacon's structural AEO check. They cannot replace outcome measurement, because a ready structure does not prove that an AI engine has cited the content.

## How To Read The HTML Report

Start above the score. The report includes a context banner explaining what automation can and cannot validate.

Then read in this order:

1. Overall score and category scores for triage.
2. Category summary for where the risk clusters.
3. Findings, grouped by priority.
4. Methodology & Limits to understand evidence strength.
5. Remediation priority for a practical fix order.
6. Jurisdiction context notes if the surface is public-facing or regulated.
7. Performance Signals section, when present, for the Lighthouse performance/best-practices/SEO snapshot and its cross-cutting root causes. These scores are directional and separate from the accessibility score.

Do not use the score alone to decide release readiness. Keyboard walkthroughs, zoom/reflow checks, and assistive technology tests matter more than a clean-looking dashboard.

## Codex Adapter

Beacon also runs in Codex as a native plugin. The source lives in `adapters/codex/`; install it:

```bash
codex plugin marketplace add chiehweihuang/beacon
codex plugin add beacon@beacon
```

The Codex adapter carries the same accessibility and AEO knowledge without the Claude Code hook layer. Codex invokes Beacon by skill or goal, not by PostToolUse hook. See [ADAPTERS.md](./ADAPTERS.md).

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for the full history. Recent highlights:

- **3.3.2** — Six measured false-positive-class fixes, including quote-aware hidden-state parsing, accessible-name corrections, entity decoding, icon contrast classification, and demotion of the AAA motion heuristic out of scoring; 31/40 wild pages changed under engine `@18`, with the missing same-generation GT/P/R rerun disclosed.
- **3.3.0** — Native Tier-2 browser measurement harness (contrast 1.4.3, touch-target size 2.5.8; findings-only, scoring deferred), a static contrast reference value for certain literal pairs (review-severity, score-neutral), and axe-core optionalization with a code-backed contrast gate.
- **3.2.0** — New `insufficient-evidence` category state (fewer than 3 machine checks reports a state instead of a coin-flip number) and a report information-architecture redesign (decision hero, evidence-density category cards, findings grouped by fix action).
- **3.0.0** — Validated scoring semantics: unmeasured categories now report states instead of invented scores, every overall score carries measured-weight coverage, life-safety findings cap the score, and the committed validation suite covers reliability, detector validity, score properties, external benchmarks, fairness, and interpretation.
- **2.3.0** — Held-out detector precision/recall improvements, including Latin-language mismatch detection and stricter false-positive guards.
- **2.2.0** — Shared declarative Pattern Library used by both the Claude Code hook and Codex advisor, eliminating detector drift between runtimes.
- **2.1.0** — Lighthouse performance/best-practices/SEO signal in `beacon:inspect`, with cross-cutting root causes and a Performance report tab. Supplementary; not part of the accessibility score. Backward compatible.

## Development Notes

Generated plugin outputs are built from `core/`.

When changing shared scripts or skill content:

```bash
node build.mjs
node build.mjs --check
node --test test/*.test.mjs
```

Do not edit generated copies under `scripts/`, `commands/`, `references/`, or `adapters/codex/` when the source lives in `core/`. Change `core/`, then rebuild.

For architecture and roadmap details:

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [ROADMAP.md](./ROADMAP.md)
- [ADAPTERS.md](./ADAPTERS.md)

## Known Limits

- Static scanning can over-report hidden or conditional UI.
- Static scanning cannot compute true contrast from runtime CSS.
- Static list checks intentionally inspect conservative structural signals.
- Browser and axe-backed checks are stronger, but still automated.
- AI review cannot replace testing with disabled users.
- Beacon runs locally; site files and audit artifacts stay on your machine unless you explicitly share them.

## Data & Improvement Loop

- **Local usage ledger**: `beacon:inspect` appends a one-line summary (engine version, finding keys, category states, coverage) and any false-positive marks you make to `~/.beacon/usage.jsonl`. This file is local-only, never transmitted, and safe to delete at any time. Its purpose: your own score history across audits, and the raw material for any false-positive report you later CHOOSE to send.
- **Upstream false-positive reports** (opt-in, never automatic): if you want a false positive fixed for everyone, Beacon builds a sanitized payload (generic identifiers, placeholder text, no URLs/paths/content), shows you the complete payload before anything leaves your machine, and prefills a [GitHub issue form](https://github.com/chiehweihuang/beacon/issues/new?template=fp-report.yml). GitHub requires an account, so this path is pseudonymous rather than anonymous.
- Detector changes triggered by these reports go through the committed validation discipline ([VALIDATION.md](./VALIDATION.md)): regression corpus, wild-sample false-positive measurement, ground-truth re-verification.

## Professional Services

Beacon's maintainer offers accessibility consulting for AI-assisted development —
remediation of audit findings, accessibility validation of AI-generated UI, and
audits beyond the automated tiers, with particular depth in CJK-language products.
Details and contact: [chiehweihuang.github.io/beacon#services](https://chiehweihuang.github.io/beacon/#services).
Disclosure: the tool is free and its validation data is public precisely so findings
can be judged independently of any service.

See [ROADMAP.md](./ROADMAP.md) for known incomplete areas and future work.

## License

MIT
