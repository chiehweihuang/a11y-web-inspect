# WCAG 2.2 A+AA criterion coverage — measured, not inherited

Replaces the inherited "automated tools cover ~30-40% of WCAG criteria" line
(source of that hearsay figure: `core/scripts/generate-report.mjs:1272-1273`,
`1336-1337`, `1623`; `tools/validate-patterns.mjs:27`; duplicated in
`adapters/codex/scripts/generate-report.mjs` and `scripts/generate-report.mjs`)
with a number Beacon derived from its own code, reproducible by anyone with
this repo. **This document does not edit any of those files** — it is the
measurement the team lead will arbitrate before any copy changes.

## Denominator correction: 50 → 55

The work order states "there are 50 at A+AA in 2.2." That figure is **WCAG
2.1's** A+AA count (30 Level A + 20 Level AA = 50), not 2.2's. WCAG 2.2 added
six new Level A/AA success criteria and removed one:

- Added: 2.4.11 Focus Not Obscured (Minimum) — AA, 2.5.7 Dragging Movements —
  AA, 2.5.8 Target Size (Minimum) — AA, 3.2.6 Consistent Help — A, 3.3.7
  Redundant Entry — A, 3.3.8 Accessible Authentication (Minimum) — AA.
- Removed: 4.1.1 Parsing — A (deprecated as obsolete in 2.2; conforming user
  agents no longer benefit from it per the W3C errata).

Net: 50 − 1 + 6 = **55** (31 Level A + 24 Level AA). Total WCAG 2.2 criteria
across all three levels is 86 (55 A/AA + 31 AAA), which is the commonly cited
figure for 2.2's full size — a useful cross-check that 55 (not 50) is right
for the A+AA subset.

**Source**: W3C WCAG 2.2 Recommendation, https://www.w3.org/TR/WCAG22/ and
the quick reference at https://www.w3.org/WAI/WCAG22/quickref/, filtered to
Level A and Level AA; cross-checked against the WCAG 2.1→2.2 diff (the six
additions and one removal above are the entire diff at A/AA).

**This document uses 55 as the denominator.** If the team lead wants the
55-vs-50 discrepancy handled differently (e.g. citing 2.1's 50 on purpose for
some external comparison), that's a copy decision for arbitration, not a
measurement one.

## Definitions (the three axes)

- **Level**: A or AA per the WCAG 2.2 Recommendation. AAA criteria are out of
  scope entirely (not counted in the 55, not in the denominator).
- **Machine-testable in principle**: could ANY static/DOM/browser tool decide
  at least one real failure mode of this criterion without human judgment of
  meaning, adequacy, or quality? YES if a normative technical artifact exists
  that a tool can check (an attribute, a computed style, a geometry, a DOM
  structure) and deciding it doesn't require understanding what the content
  *means*. NO if the criterion's only failure modes are inherently semantic
  (is this description accurate, is this wording a suggestion, is this the
  only way information is conveyed) with no reliable structural proxy. This
  axis is about the criterion, not about Beacon — it asks what any tool
  could do, ever.
- **Beacon coverage**: FULL if a Beacon detector decides the criterion for
  the cases it applies to (no other realistic technical failure mode within
  automation's reach is left undecided). PARTIAL if a detector catches one
  or some failure modes but leaves others technically decidable and
  unaddressed (named in "what's missed"). NONE if no detector exists.
- **Escape-hatch rule** (hakuso audit flagged this as a per-row judgment call
  that needed a stated rule, not a per-row decision — see 1.2.3 below): a
  criterion satisfiable through more than one path counts YES on the
  machine-testable axis if AT LEAST ONE of those paths has a checkable
  structural proxy, even when a DIFFERENT satisfying path is only checkable
  by judging unstructured prose (e.g. "is there a transcript somewhere on
  this page that adequately covers the audio track" — inherently semantic).
  The axis asks whether any tool could decide *a* real failure mode, not
  whether every escape hatch can be exhaustively ruled out; a criterion is
  NO only when NO path at all has a structural proxy. This mirrors how
  Beacon coverage itself already treats partial/proxy-only detection
  (that gap is exactly what PARTIAL vs FULL is for) — applied one level up,
  to the machine-testable axis.

## The 55-criterion table

Detector keys are grep-verifiable: `grep -n "key: '<name>'" core/scripts/*.mjs`.
"review" beside a key means Beacon emits it as `check:'review'` (human
confirmation flagged, never auto-fails and never moves a score) rather than
`check:'fail'`.

| # | Criterion | Level | Machine-testable in principle | Beacon coverage | Detector key(s) | What's missed |
|---|---|---|---|---|---|---|
| 1.1.1 | Non-text Content | A | YES | **PARTIAL** | `image-alt-missing`; `quality-alt-generic`/`quality-alt-filename`/`quality-alt-redundant` (review) | CSS background-only meaningful images, SVG/canvas/object/embed alternatives; alt-text *meaningfulness* is review-only, never a scored fail |
| 1.2.1 | Audio-only and Video-only (Prerecorded) | A | NO | NONE | — | no detector |
| 1.2.2 | Captions (Prerecorded) | A | YES | NONE | — | no `<track kind="captions">`/caption-file check exists in either script |
| 1.2.3 | Audio Description or Media Alternative (Prerecorded) | A | YES | NONE | — | `<track kind="descriptions">` is a checkable structural artifact (escape-hatch rule above — the transcript-elsewhere path is semantic, but that doesn't make the whole criterion NO); no detector implemented |
| 1.2.4 | Captions (Live) | AA | NO | NONE | — | no detector |
| 1.2.5 | Audio Description (Prerecorded) | AA | YES | NONE | — | `<track kind="descriptions">` is the identical artifact to 1.2.2's caption-track check; no detector implemented |
| 1.3.1 | Info and Relationships | A | YES | **PARTIAL** | `main-landmark-missing`; `heading-level-skipped`; `list-non-li-child`; `pdf-untagged`; `pdf-marked-false`; `pdf-encrypt-blocks-at`; `pdf-encrypt-a11y-bit-cleared` | table header/scope association, fieldset/legend grouping, aria-owns/describedby validity, reading-order mismatches, definition lists |
| 1.3.2 | Meaningful Sequence | A | YES | NONE | — | no DOM-order-vs-visual-order comparison exists in either script |
| 1.3.3 | Sensory Characteristics | A | NO | NONE | — | no detector |
| 1.3.4 | Orientation | AA | YES | NONE | — | no detector |
| 1.3.5 | Identify Input Purpose | AA | YES | NONE | — | no `autocomplete` token check exists |
| 1.4.1 | Use of Color | A | YES | NONE | — | a computed-style comparison (e.g. a link distinguished from body text by color alone, with no underline/weight/icon difference) is a checkable structural proxy; no detector implemented |
| 1.4.2 | Audio Control | A | YES | NONE | — | no autoplay-audio detector |
| 1.4.3 | Contrast (Minimum) | AA | YES | **PARTIAL**† | `tier2-contrast-fail`; `tier2-contrast-unresolvable` (review); `static-contrast-sub-threshold` (review, static-audit only); `contrast-not-verified` (review); `static-contrast-evidence` (review) | †only when `tier2-audit.mjs` is run and its findings merged — the default static-only pass emits review evidence, never a scored fail. Demoted from FULL by the hakuso audit (fixture-verified): `browserCollectContrastSamples` walks `document.body.querySelectorAll('*')` and reads only direct text child nodes, so `::before`/`::after` generated caption text, `::placeholder` text, `<input value>` text, shadow DOM, and iframe content are never sampled — all decidable and industry-covered. Backgrounds it cannot resolve (image/gradient, pseudo-element paint, non-ancestor overlay, dark-canvas) also stay unresolved rather than guessed |
| 1.4.4 | Resize Text | AA | YES | **PARTIAL** | `viewport-zoom-disabled` | does not verify actual 200%-zoom reflow/clipping — no browser zoom-and-measure step exists |
| 1.4.5 | Images of Text | AA | YES | NONE | — | OCR-based image-vs-real-text detection is checkable (same class of specialized analysis as 2.3.1's flash-rate tooling); no detector implemented |
| 1.4.10 | Reflow | AA | YES | **PARTIAL** | `viewport-meta-missing`; `fixed-minmax-overflow`; `large-fixed-width` (review) | no actual rendered-320px horizontal-scroll/clipping check, even though `tier2-audit.mjs` already renders at 320×720 for other purposes |
| 1.4.11 | Non-text Contrast | AA | YES | NONE | — | no UI-component/icon border-contrast check (Beacon's contrast detectors are text-only) |
| 1.4.12 | Text Spacing | AA | YES | NONE | — | no detector |
| 1.4.13 | Content on Hover or Focus | AA | YES | NONE | — | no detector |
| 2.1.1 | Keyboard | A | YES | **PARTIAL** | `clickable-non-button`; `click-handler-keyboard-missing` | custom widgets/drag targets/canvas controls with no click-listener pattern at all; framework event-binding idioms outside inline `onClick`/`addEventListener('click')` |
| 2.1.2 | No Keyboard Trap | A | YES | NONE | — | `focus-flow.mjs` targets this but is **not imported by** `static-audit.mjs` or `tier2-audit.mjs`; its capture layer is not currently functional (round-2 calibration) |
| 2.1.4 | Character Key Shortcuts | A | YES | NONE | — | no detector |
| 2.2.1 | Timing Adjustable | A | YES | NONE | — | no detector |
| 2.2.2 | Pause, Stop, Hide | A | YES | NONE | — | `motion-reduced-motion-missing` exists but is tagged `WCAG 2.2: 2.3.3` in code, not 2.2.2, and checks CSS `prefers-reduced-motion` support rather than presence of a pause/stop control for auto-updating content |
| 2.3.1 | Three Flashes or Below Threshold | A | YES (specialized frame analysis, e.g. PEAT) | NONE | — | no flash-rate/frame analysis exists; Beacon's only motion detector targets a different (AAA) criterion |
| 2.4.1 | Bypass Blocks | A | YES | NONE | — | no skip-link detector; `main-landmark-missing` is tagged 1.3.1, not 2.4.1 |
| 2.4.2 | Page Titled | A | YES | **FULL**‡§ | `document-title-missing`; `pdf-title-not-shown` | ‡decides presence/non-emptiness only; title *descriptiveness* is semantic and outside any automated check's reach, same as every tool in the industry. §The hakuso audit demoted this to PARTIAL with two fixture bugs (an `<svg><title>icon label</title></svg>` with no real title read as present; `<title>   </title>` whitespace read as present) — both fixed at engine `beacon-static-audit@12`: the check strips inline `<svg>` (a different, SVG-namespaced element) and requires non-empty trimmed text on the first remaining `<title>`, matching `document.title` semantics — a `<title>` anywhere in the document, body or hidden ancestor included, still counts (a first attempt scoped to before `</head>`/`<body>`, which a hakuso auditor caught as over-flagging real titled pages; dropped). Verified against the fix, not assumed: new fixture tests for both bugs + a hidden-body-div regression + a positive control (real title alongside an svg title) pass; GT retention re-run shows zero finding-set diff on 20 GT sites + the 86-site benchmark population |
| 2.4.3 | Focus Order | A | YES | NONE | — | `focus-flow.mjs` targets this but is not wired into either script (see 2.1.2) |
| 2.4.4 | Link Purpose (In Context) | A | YES | **PARTIAL** | `quality-link-generic` (review) | review-only (never a scored fail); catches only the generic-phrase pattern ("click here"/"read more"), misses context-dependent purpose ambiguity |
| 2.4.5 | Multiple Ways | AA | YES | NONE | — | no detector |
| 2.4.6 | Headings and Labels | AA | YES | NONE | — | Demoted from PARTIAL by the hakuso audit: 2.4.6 is about whether headings/labels *describe* topic or purpose. `heading-level-skipped` is tagged `1.3.1` in code (hierarchy is a 1.3.1 failure mode, not 2.4.6's), and `headings-missing` fires when a page has no headings at all, which 2.4.6 does not require. Neither key decides any actual 2.4.6 failure mode — descriptiveness is untested by any detector. (The `headings-missing` mis-tag itself is a separate engine ticket, not fixed in this pass — see side-findings) |
| 2.4.7 | Focus Visible | AA | YES | **PARTIAL** | `focus-outline-removed` | doesn't verify indicator contrast/thickness once present, JS-based removal, or externally-linked (non-same-file) CSS |
| 2.4.11 | Focus Not Obscured (Minimum) | AA | YES | NONE | — | `focus-flow.mjs` targets this but is not wired into either script (see 2.1.2) |
| 2.5.1 | Pointer Gestures | A | NO | NONE | — | no detector |
| 2.5.2 | Pointer Cancellation | A | YES | NONE | — | no down-event-vs-up-event detector |
| 2.5.3 | Label in Name | A | YES | NONE | — | no visible-label-vs-accessible-name comparison |
| 2.5.4 | Motion Actuation | A | NO | NONE | — | no detector |
| 2.5.7 | Dragging Movements | AA | YES | NONE | — | no drag-listener/alternative detector |
| 2.5.8 | Target Size (Minimum) | AA | YES | **PARTIAL**† | `tier2-touch-target-fail`; `tier2-touch-target-advisory` (review, 44px best practice) | †only when `tier2-audit.mjs` is run — the static-only pipeline has no target-size check at all. Demoted from FULL by the hakuso audit: `VALIDATION.md` L2 itself states the inline, equivalent-target-elsewhere, and essential-presentation exceptions are NOT implemented — a `tier2-touch-target-fail` may still be a false positive under one of those three, so the detector does not fully decide the criterion |
| 3.1.1 | Language of Page | A | YES | **FULL**§ | `html-lang-missing`; `html-lang-mismatch`; `html-lang-mismatch-review`; `html-lang-invalid`; `pdf-lang-missing` | content-mismatch layer falls back to no-finding on JS-heavy pages with too little static text to judge. §The hakuso audit demoted this to PARTIAL with two fixture bugs (`xml:lang="en"` with no real `lang` attribute read as present; `lang="english"` — not a valid BCP-47 tag — never flagged, since `assessLang` fell through to `UNMODELLED`) — both fixed at engine `beacon-static-audit@12`: presence now requires the whitespace separating a real HTML attribute (excludes `xml:lang=`/`data-lang=`), and a new `html-lang-invalid` finding (new `isWellFormedLangTag()` BCP-47-shape gate in `lang-detect.mjs`) catches a malformed tag before falling through to content assessment. A shape-valid-but-wrong code (`lang="jp"`) is unaffected — still caught by `assessLang`'s existing country-code path, unchanged. Verified against the fix, not assumed: new fixture tests for both bugs + a positive control (`lang="en-US"`) pass; GT retention re-run shows zero finding-set diff on 20 GT sites |
| 3.1.2 | Language of Parts | AA | YES | NONE | — | `detectLangParts` exists in `lang-detect.mjs` but is deliberately gated off (0 true / 2 false positives on the 2026-06-15 36-page calibration), never emitted |
| 3.2.1 | On Focus | A | YES | NONE | — | no detector |
| 3.2.2 | On Input | A | YES | NONE | — | no detector |
| 3.2.3 | Consistent Navigation | AA | YES | NONE | — | no cross-page structural comparison — both scripts operate per-file/per-page |
| 3.2.4 | Consistent Identification | AA | YES | NONE | — | no cross-page structural comparison |
| 3.2.6 | Consistent Help | A | YES | NONE | — | no cross-page structural comparison |
| 3.3.1 | Error Identification | A | YES | NONE | — | no form-submission/error-association check |
| 3.3.2 | Labels or Instructions | A | YES | **PARTIAL** | `input-label-missing` | only checks `<input>`, not `<select>`/`<textarea>`; no check for instructions/format hints or required-field indication. (Expanded by the hakuso audit, re-verified directly: the exemption regex `/<input\b(?![^>]*(aria-label\|aria-labelledby\|\sid=\|type=["']hidden["']))[^>]*>/` exempts ANY input carrying an `id`, without checking that a `<label for>` actually references that id anywhere in the document — confirmed with `<input id="email">` and no label anywhere in the fixture: no finding) |
| 3.3.3 | Error Suggestion | AA | NO | NONE | — | no detector |
| 3.3.4 | Error Prevention (Legal, Financial, Data) | AA | NO | NONE | — | no detector |
| 3.3.7 | Redundant Entry | A | YES | NONE | — | no multi-step-form field comparison |
| 3.3.8 | Accessible Authentication (Minimum) | AA | YES | **PARTIAL** | `auth-recaptcha-invisible`; `auth-recaptcha-v2`; `auth-turnstile`; `auth-text-captcha`; `auth-password-paste-blocked`; `auth-password-autocomplete-off`; `auth-recaptcha-js-render`; `auth-hcaptcha-js-render`; `auth-captcha-injected-script`; `auth-password-clipboard-blocked-js` | custom/non-branded CAPTCHA and hand-rolled cognitive-function-test implementations that don't match a known vendor signature. (Key list corrected by the hakuso audit + re-verified directly against `grep -n "key: 'auth-" core/scripts/auth-detect.mjs`: the original list cited a non-existent `auth-hcaptcha` and omitted three real keys — `auth-recaptcha-invisible`, `auth-turnstile`, `auth-captcha-injected-script`.) |
| 4.1.2 | Name, Role, Value | A | YES | **PARTIAL** | `frame-title-missing`; `button-name-missing`; `link-name-missing`; `quality-label-role-echo` (review); `pdf-encrypt-blocks-at`; `pdf-encrypt-a11y-bit-cleared` | ARIA state/property correctness (`aria-expanded`/`checked`/`selected`), invalid role values, custom-widget value exposure, form controls beyond buttons/links |
| 4.1.3 | Status Messages | AA | YES | NONE | — | no `aria-live`/`role="status"` detector |

## Arithmetic

Recomputed after the hakuso audit's five row-verdict corrections and three
machine-testable axis flips (plus a fourth flip, 1.2.3, resolved here by the
escape-hatch rule stated in Definitions) — see the audit section below for
the full evidence trail, and each row's own inline note above for what
changed and why.

- **(a) Criteria with ANY Beacon coverage (FULL + PARTIAL) / 55**: 2 FULL + 12
  PARTIAL = 14 → **14/55 = 25.5%**
- **(b) FULL-coverage criteria / 55**: **2/55 = 3.6%**
  (2.4.2 Page Titled, 3.1.1 Language of Page — both verified against the
  `beacon-static-audit@12` fix, not assumed; 1.4.3 Contrast and 2.5.8 Target
  Size are demoted to PARTIAL, see their rows)
- **(c) Same two figures against the machine-testable-in-principle subset**
  (48 of 55 criteria; 7 are NO — see table): every FULL/PARTIAL criterion
  above is already within the 48, so:
  - any coverage: **14/48 = 29.2%**
  - FULL only: **2/48 = 4.2%**

7 machine-untestable-in-principle criteria (excluded from the fairer
denominator): 1.2.1, 1.2.4, 1.3.3, 2.5.1, 2.5.4, 3.3.3, 3.3.4. (1.2.3, 1.2.5,
1.4.1, and 1.4.5 moved from NO to YES here — see their rows and the
escape-hatch rule in Definitions; none of the four have a Beacon detector,
so none of them move the FULL/PARTIAL/any-coverage counts, only the
denominator.)

**These are NOT the ground-truth recall figure (0.727).** That number
measures *instances* (how many real violations Beacon's detectors caught out
of a labeled benchmark corpus of actual findings) with the benchmark's
instance count as denominator. This document measures *criteria* (how many
of WCAG's 55 A+AA success-criterion *categories* have any Beacon detector at
all) with 55 (or 48) as denominator. A criterion can be "covered" here while
Beacon's recall on real pages for that criterion's failure mode is far below
1.0, and vice versa — do not average, blend, or substitute one for the
other in any report.

## Notable side-findings (not fixed here — flagged for arbitration/audit)

- `motion-reduced-motion-missing` (`static-audit.mjs:1185`) is tagged `WCAG
  2.2: 2.3.3 Animation from Interactions` in code. **2.3.3 is a Level AAA
  criterion** — outside this document's A+AA scope entirely, so this
  detector contributes to none of the 55 rows above (not counted anywhere,
  including not credited to 2.2.2 Pause/Stop/Hide, the nearest A/AA
  criterion, since it checks a different failure mode — CSS reduced-motion
  support, not a pause control).
- `focus-flow.mjs` is written to target 2.1.2/2.4.3/2.4.7/2.4.11, but is not
  `import`ed by either `static-audit.mjs` or `tier2-audit.mjs` — it's a
  separate manual-trace-guided tool per `commands/inspect.md` Step 4, and
  its capture layer is not currently functional (per prior round-2
  calibration). None of its three criteria beyond 2.4.7 get any credit here.
- Six finding keys carry non-WCAG tags (`AEO structural hygiene`: 
  `meta-description-missing`, `canonical-missing`, `jsonld-missing`;
  `Agent readiness structural hygiene`: `robots-txt-missing`,
  `sitemap-missing`, `llms-txt-missing`) and are excluded from this analysis
  entirely — they're Beacon's separate AEO/agent-readiness axis, not WCAG.
- 1.4.3 and 2.5.8 still require `tier2-audit.mjs` (Playwright) to actually run
  and be merged via `--merge-findings` before either criterion scores at
  all — a static-only `static-audit.mjs` run alone never scores either. The
  hakuso audit demoted both from FULL to PARTIAL even when tier-2 does run
  (contrast sampling misses pseudo-element/placeholder/input-value/shadow-DOM/
  iframe text; touch-target sizing doesn't implement the three SC exceptions —
  see their rows), so **2.4.2 and 3.1.1 are now the ONLY two FULL rows in
  this table**, and the only two that reach FULL without a browser.

## How to re-derive this

1. **Criterion list + levels**: https://www.w3.org/WAI/WCAG22/quickref/,
   filter to Level A and Level AA (55 rows). Cross-check the 2.1→2.2 diff:
   +2.4.11, +2.5.7, +2.5.8, +3.2.6, +3.3.7, +3.3.8, −4.1.1.
2. **Every WCAG tag Beacon's two audit scripts emit**:
   ```
   grep -n "wcag:" core/scripts/static-audit.mjs core/scripts/tier2-audit.mjs \
     core/scripts/auth-detect.mjs core/scripts/quality-detect.mjs core/scripts/pdf-detect.mjs
   ```
   (the last three are `import`ed into `static-audit.mjs` and their findings
   flow through its single `addFinding()` funnel — `core/scripts/lang-detect.mjs`
   is also imported but carries no `wcag:`/`key:` of its own; its output is
   inlined directly into `static-audit.mjs`'s own `html-lang-*` findings.)
3. **Confirm a key exists** before citing it as coverage:
   `grep -n "key: '<name>'" core/scripts/*.mjs`
4. **Confirm `focus-flow.mjs` is not wired in**:
   `grep -n "focus-flow" core/scripts/static-audit.mjs core/scripts/tier2-audit.mjs`
   returns only a comment reference (`tier2-audit.mjs:12`, "Division of labour
   mirrors focus-flow.mjs" — not an import; the hakuso audit caught this
   step's original wording claiming the command "returns nothing," which it
   does not). To confirm no REAL import, run
   `grep -n "^import.*focus-flow" core/scripts/static-audit.mjs core/scripts/tier2-audit.mjs`,
   which does return nothing — it is a separate, manually-invoked script per
   `commands/inspect.md` Step 4.
5. **Re-run the live artifacts** to see the same keys fire on a real page:
   `node core/scripts/static-audit.mjs --output /tmp/static.json <fixture-dir>`
   and `node core/scripts/tier2-audit.mjs --url <file-or-url> --output /tmp/tier2.json`,
   then inspect `.findings[].key` / `.findings[].wcag` in each JSON output.

---

# hakuso audit of this measurement (2026-07-27)

Verdict: **FIX-BEFORE-PUBLISHING**. The denominator, the table membership, the arithmetic and
the GT separation are all correct. Five row verdicts and three axis calls are not, and every
one of them moves a number that is headed for user-facing copy. All findings below were
produced by running the code, not by reading the table.

**Status: RESOLVED (2026-07-27, engine `beacon-static-audit@12`)** — every correction below
is applied to the table and Arithmetic section above this audit; the two detector bugs
(`document-title-missing`, `html-lang-missing`/lang validity) are fixed and verified with
fixtures + a GT re-run, not just proposed. This section is kept as the audit trail; read the
table above for the current numbers, not the "Corrected counts" figures below (those predate
the fix and still show 0 FULL).

## What checks out

- **Denominator 55 confirmed.** WCAG 2.1 A+AA = 30 A + 20 AA = 50; WCAG 2.2 removes 4.1.1
  Parsing (A) and adds 3.2.6 + 3.3.7 (A) and 2.4.11 + 2.5.7 + 2.5.8 + 3.3.8 (AA) → 31 A +
  24 AA = **55**. Cross-check: 2.2's 9 additions include 3 AAA (2.4.12, 2.4.13, 3.3.9), so
  78 + 9 − 1 = 86 total, matching the doc's stated cross-check. The brief's 50 was indeed
  2.1's count. (Verified against the criterion list, not fetched — this machine has no
  network tool in my kit; the enumeration above is checkable line by line.)
- **Table membership**: I extracted all 55 rows and diffed against the canonical A/AA set —
  0 extra, 0 missing, 0 duplicates, and every Level cell matches (31 A / 24 AA).
- **Arithmetic**: 4 FULL + 11 PARTIAL = 15; 15/55 = 27.27%, 4/55 = 7.27%, 15/44 = 34.09%,
  4/44 = 9.09%. All four printed figures are correctly rounded from the table as written.
- **Sub-detector attribution**: `WCAG_ALT`→1.1.1, `WCAG_LINK`→2.4.4, `WCAG_NAME`→4.1.2,
  `WCAG_TAGGED`→1.3.1, `WCAG_LANG`→3.1.1, `WCAG_TITLE`→2.4.2, `WCAG_AT`→1.3.1/4.1.2,
  auth `WCAG`→3.3.8 — every one matches the row it is cited in.
- **NONE rows spot-checked for under-claims**: 0 hits in `static-audit.mjs` for skip-link,
  autoplay, `aria-live`, `role="status"`, `autocomplete=`, orientation, `track`/captions,
  accesskey. Those NONEs are real.
- **Side-findings**: `motion-reduced-motion-missing` is tagged `WCAG 2.2: 2.3.3` in code and
  2.3.3 is Level AAA — correct, and correctly excluded. `focus-flow.mjs` is not imported by
  either script (`import` lists verified) — correct.
- **No GT blending**: `0.727` appears exactly once, in the paragraph that separates the two
  metrics. Nothing averages or substitutes them.

## Row verdicts I would change

| # | Row | From | To | Evidence |
|---|---|---|---|---|
| 1 | 1.4.3 Contrast | FULL | **PARTIAL** | Fixture with a `::before` generated caption (#bbb), an `::placeholder` (#c8c8c8) and an `<input value>` (#c0c0c0), all on white: the harness reports **1** finding — the plain `<p>` control. `browserCollectContrastSamples` iterates `document.body.querySelectorAll('*')` and reads only direct text child nodes, so pseudo-element text, placeholder text, input value text, shadow DOM and iframe content are never sampled. All are decidable and industry-covered |
| 2 | 2.4.2 Page Titled | FULL | **PARTIAL** | The check is `/<title\b[^>]*>[^<]+<\/title>/`. Fixture with **no document title but an inline `<svg><title>icon label</title></svg>`** → no finding (false pass). Fixture with `<title>   </title>` → no finding. Both are decidable (axe's `document-title` requires non-whitespace text in the head title) |
| 3 | 3.1.1 Language of Page | FULL | **PARTIAL** | Fixture `<html lang="english">` (not a valid BCP-47 tag) on English text → no finding: there is no language-tag validity check at all (axe's `valid-lang`). Fixture `<html xml:lang="en">` with no plain `lang` → no `html-lang-missing`, because the presence test is `/<html[^>]+lang=/`, which the substring `xml:lang=` satisfies |
| 4 | 2.5.8 Target Size | FULL | **PARTIAL** | `VALIDATION.md` L2 states it itself: "The inline, equivalent-target-elsewhere, and essential-presentation exceptions are NOT implemented … a target flagged `tier2-touch-target-fail` may still be a false positive under one of those three." A detector that flags SC-exempt targets does not decide the criterion. The interactive-element selector list is also called a calibration surface there |
| 5 | 2.4.6 Headings and Labels | PARTIAL | **NONE** | 2.4.6 is about whether headings and labels *describe* topic or purpose. `heading-level-skipped` is tagged `1.3.1` in code and hierarchy is not a 2.4.6 failure mode; `headings-missing` fires when a page has no headings, which 2.4.6 does not require. The row's own "what's missed" concedes the whole criterion ("descriptiveness untested; existence+hierarchy only"). Neither key decides any 2.4.6 failure |

## Machine-testable axis — defensible rule, inconsistently applied

Three rows are marked NO under a rule the doc applies as YES elsewhere. Each flip enlarges
the fairer denominator and therefore *lowers* the headline percentage — the current 34.1% is
optimistic, not pessimistic.

| Row | From | To | Inconsistency |
|---|---|---|---|
| 1.2.5 Audio Description (Prerecorded) | NO | **YES** | 1.2.2 Captions is YES on the strength of a `<track kind="captions">` check. `<track kind="descriptions">` is the identical artifact on the identical element |
| 1.4.5 Images of Text | NO | **YES** | 2.3.1 is YES with the explicit justification "specialized frame analysis, e.g. PEAT". OCR is the same class of specialized analysis; admitting one and refusing the other is not a rule |
| 1.4.1 Use of Color | NO | **YES** | "Link distinguished from body text by color alone" is a computed-style comparison (text-decoration + color delta) that shipping tools implement. One decidable failure mode is all this axis requires |

Same-shape judgment call the producer must resolve one way or the other: **1.2.3** (Audio
Description *or* Media Alternative) has the same `<track kind="descriptions">` artifact as
1.2.5 but an escape hatch — a transcript elsewhere on the page — so NO is arguable. State the
rule; do not decide it per row.

## Corrected counts

With rows 1-5 and the three axis flips:

- any coverage: **14/55 = 25.5%** (was 15/55 = 27.3%)
- FULL only: **0/55 = 0%** (was 4/55 = 7.3%)
- machine-testable denominator 47 (was 44): any coverage **14/47 = 29.8%** (was 34.1%);
  FULL **0/47 = 0%** (was 9.1%)
- if 1.2.3 also flips: denominator 48 → **14/48 = 29.2%**

A 0% FULL figure is useless in copy, so note the cheap alternative: rows 2 and 3 are one-regex
bugs, not scope gaps. Fix `document-title-missing` (require non-whitespace text in a `<title>`
that is not inside `<svg>`) and `html-lang-missing`/lang validity (require a real `lang`
attribute and a well-formed BCP-47 primary subtag), and both return to FULL — **2/55 = 3.6%,
2/47 = 4.3%** — with the detectors genuinely deciding what the rows claim. That is the honest
way to publish a non-zero FULL number.

**Resolution (2026-07-27, engine `beacon-static-audit@12`)**: both fixes above shipped —
see the corrected table and the "Arithmetic" section earlier in this document, which are
the CURRENT authoritative numbers (14/55 any-coverage, 2/55 FULL, 14/48 and 2/48 against
the machine-testable subset — 48 rather than this section's 47, since 1.2.3's escape-hatch
judgment call was also resolved to YES via the stated rule in Definitions, not decided
ad hoc). The claim that the fixes would restore FULL was verified against the actual code
and GT re-run, not assumed — see each row's own inline note and VALIDATION.md's `@12`
engine section for the fixture/GT evidence.

## Reproducibility defects (no count change, but the doc invites verification)

- **`auth-hcaptcha` does not exist.** Row 3.3.8 cites it; `grep -n "key: 'auth-` returns
  `auth-recaptcha-invisible`, `auth-recaptcha-v2`, `auth-turnstile`, `auth-text-captcha`,
  `auth-password-paste-blocked`, `auth-password-autocomplete-off`, `auth-recaptcha-js-render`,
  `auth-hcaptcha-js-render`, `auth-captcha-injected-script`,
  `auth-password-clipboard-blocked-js`. The row also omits three real keys
  (`auth-recaptcha-invisible`, `auth-turnstile`, `auth-captcha-injected-script`). This breaks
  the doc's own rule at "How to re-derive" step 3. **Fixed above** (row 3.3.8's key list).
- **Step 4 is wrong as written.** `grep -n "focus-flow" core/scripts/static-audit.mjs
  core/scripts/tier2-audit.mjs` does not return nothing — it returns `tier2-audit.mjs:12`, a
  comment ("Capture/analyze split mirrors focus-flow.mjs"). The *claim* holds (no `import`);
  the stated command does not. Say "returns only a comment reference, no import". **Fixed
  above** ("How to re-derive" step 4).
- **3.3.2's "what's missed" is thin.** Beyond `<select>`/`<textarea>`, the regex
  `/<input\b(?![^>]*(aria-label|aria-labelledby|\sid=|type=["']hidden["']))[^>]*>/` exempts
  **any input carrying an `id`**, without checking that a `<label for>` actually references
  it. Verified: `<input id="email">` with no label anywhere → no finding. **Fixed above**
  (row 3.3.2's "what's missed").
- I ran steps 1-3 and 5 of "How to re-derive" and they otherwise work; the counts in the
  Arithmetic section fall out of the table as written

## Side-finding for the engine (out of this doc's scope)

`headings-missing` is tagged `WCAG 2.2: 2.4.6` in `static-audit.mjs`. 2.4.6 does not require
headings to exist; 1.3.1 is the criterion a heading-less page implicates. The coverage table
inherited the mis-tag. Worth a separate ticket, not a change to this measurement.
