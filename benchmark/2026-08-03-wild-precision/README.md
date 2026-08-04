# Wild-sample precision — round 1 (2026-08-03, engine `beacon-static-audit@14`)

VALIDATION.md L1 requires every detector that feeds the score to carry a **wild-sample
false-positive measurement**: precision measured on pages nobody hand-picked, because
"0 FP on the corpus I wrote for it is not evidence". Until now only the detectors covered
by the semantic held-out gate had one. This round starts paying that debt using the
survey tier (1,704 captured sites, engine-unified).

## Method

- Sampling (`wild-precision-sample.mjs` in the local benchmark workspace, deterministic):
  for each detector key, draw instances **spread across distinct sites**, at most one
  site per instance, so no single template stamp can dominate a detector's score. 15
  instances per detector.
- Judgement: one agent per detector judges every instance against the L3 judgement rules
  at its exact cited line in the stored snapshot; a second, independent agent
  adversarially re-judges, prioritising every `fp` call (precision measured *too high* is
  the dangerous direction for a number that goes into public documentation).
- `unclear` is a permitted verdict and is excluded from the precision denominator. It is
  used when the snapshot alone cannot decide (typically: visibility governed by an
  external stylesheet Beacon never sees).

## Results

| Detector | Precision | decided n | 95% CI | sites carrying it (of 1,662) |
|---|---|---|---|---|
| `image-alt-missing` | **1.000** | 14 | 0.78–1.00 | 469 |
| `link-name-missing` | **0.933** | 15 | 0.70–0.99 | 629 |
| `heading-level-skipped` | **0.867** | 15 | 0.62–0.96 | 523 |
| `clickable-non-button` | **0.615** | 13 | 0.36–0.82 | 102 |
| `button-name-missing` | **0.600** | 15 | 0.36–0.80 | 519 |
| `input-label-missing` | **0.417** | 12 | 0.19–0.68 | 428 |

**Read the intervals, not the point estimates.** n=15 per detector is a first pass: it
is enough to rank detectors and to surface FP *classes*, not to publish a precise number
per detector. The classes below are the durable finding; the percentages will move as n
grows.

## False-positive classes found

**1. Class-based hidden subtrees (dominant, affects five of six detectors).** Elements
inside `class="hidden"`, Tailwind `invisible` / `md:hidden`, closed Webflow dropdowns,
unopened `<dialog>`, OneTrust `.ot-hide` panels, hover-triggered nav flyouts. They are
outside the accessibility tree at rest, but the hiding lives in a stylesheet the static
tier never loads. This is the known architectural gap (VALIDATION.md L4 / the Tier-2
capture-annotation plan), and this round is the first measurement of how much it costs:
it is the single largest source of wild false positives, and it is what drags
`input-label-missing` down — that detector fires inside closed overlays constantly.

**2. Out-of-scope input types** (`input-label-missing`). `type="submit"` / `type="hidden"`
flagged for a missing label despite the ruleset excluding them. A real implementation
bug, cheap to fix.

**3. `title` not accepted as an accessible name** (`button-name-missing`). `title` is the
last-resort name source in the accname spec and the link detector already honours it; the
button detector does not. A real bug.

**4. Attribute-substring match** (`clickable-non-button`). A framework config attribute
whose name contains `clickable` was read as an `onclick` handler, so the detector fired
on an element with no handler at all. Same class as the 2026-07 `data-reactid` contains
`id=` bug; needs the same whitespace-anchoring fix.

**5. Accessible name in a sibling span after an icon** (`button-name-missing`): one case
where the name text sits outside the element the engine inspected. Recorded, not yet
diagnosed as a class.

## What this changes

- Detector precision is now a **measured, published number** rather than an assumption,
  for six detectors covering the highest-volume findings in the survey tier.
- The class-based hiding gap has a price tag for the first time. It is no longer an
  abstract limitation; it is the leading cause of wild false positives, and the case for
  the Tier-2 capture-annotation plan is now empirical.
- Three cheap implementation bugs (classes 2–4) are queued for the next detector round.

## Honest limits

- Precision only. This measurement says nothing about **recall** — findings the engine
  never emitted cannot appear in a sample of findings it emitted. Recall still comes only
  from the constructed ground-truth inventory (`benchmark/2026-07-06-ground-truth/`).
- The judges are AI agents applying a written constitution with an adversarial second
  pass, the same standard as the ground-truth study; they are not an independent human
  audit. Every call is anchored to a cited line in a stored snapshot and is re-checkable.
- Six of ~36 detectors measured. The rest still rest on their own regression corpora.

## Files

| File | Content |
|---|---|
| `results.json` | per-detector totals, precision, FP classes, reviewer notes |
| `calls.json` | every instance judged: site id, cited line, final call, reasoning, and — where the adversarial pass overturned the first judgement — what it was changed from and why (8 of 90 calls were overturned) |

Snapshots and the sampling harness live in the local benchmark workspace; the
`wild-precision/round-1/` directory there holds the manifest and the extracted pages.
