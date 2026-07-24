# Hakuso audit — v3.3 Workstream B: static contrast reference value

Target: frozen uncommitted diff on `c2846d3` (static-audit.mjs +224, generate-report +8, golden
fingerprint-bump, VALIDATION.md, new static-contrast.test.mjs). All probes first-hand; artifacts in
`C:/Users/tacit/.claude/jobs/f448fc13/tmp/hakuso3/`. Tree left as found.

## Verdict

**PASS WITH FIXES.** One HIGH: the same-file rule-extraction regex resolves compound / descendant /
element-qualified selectors as if they were bare classes, producing resolved-but-uncertain pairs —
the exact false-certainty this feature promises never to emit. Evidence-only (never scored), so not
a BLOCK, but the "statically certain" claim is the whole point and it is demonstrably false for
common CSS shapes; fix before ship.

## HIGH

1. **`static-audit.mjs:392` (`extractSameFileStyleRules`) records `.a.b`, `.p .c`, and `div.c4`
   under their bare tail class/id token.** The regex `/([.#][\w-]+)\s*\{([^{}]*)\}/g` skips the
   leading selector parts and matches the last simple token before `{`, so a compound/descendant/
   element-qualified rule is stored as a lone-class rule and then matches any element carrying that
   class without satisfying the full selector. **Demonstrated first-hand** (fixture
   `tmp/hakuso3/adversarial.html`): `<span class="c2b">` (rule `.c2a.c2b`), `<span class="c3child">`
   outside `.c3parent` (rule `.c3parent .c3child`), and `<span class="c4">` (rule `div.c4`) ALL
   resolved to #777/#fff and emitted `static-contrast-sub-threshold` findings; the evidence line
   reported `resolved=5` (2 controls + 3 false). In the 41-pair benchmark this stays invisible only
   because the compound OneTrust rows land on elements that DO carry the full class set
   (correct-by-accident); any page with `div.foo`/descendant/partial-class markup will emit false
   pairs. Fix: split each rule prelude on `,` and record only entries matching `^\s*[.#][\w-]+\s*$`
   (reject compound, combinator, and element-qualified selectors — pseudo/attribute selectors are
   already correctly skipped). Add a regression fixture with the three shapes above asserting zero
   resolution.

## Verified green (first-hand)

- **Conservative boundary holds for everything else.** Same fixture, cases 5-10 all correctly
  UNRESOLVED (no finding): external/Tailwind class (bg blocked via the calibration fix; fg from an
  external class skipped), redeclared-rule tie → null, alpha<1 fg, `var()` fg, inherited fg (resolved
  on the element itself only), `@media`-scoped rule (stripped by `stripAtMedia`). Named colors and
  `currentColor` rejected by `parseStaticColor`. Reaching root with no declared bg → unresolved (no
  white default).
- **Zero score effect.** @9 (HEAD) vs @10 on snapshots 43/91/1: overall score, coverage %, and the
  contrast category state/score/pass/fail are IDENTICAL; only the review-finding count rises (the new
  evidence, which `check:'review'` keeps out of scoring). Evidence line + sub-threshold render
  bilingually (zh+en titles/standard confirmed); report self-scan stays 0 critical / 0 warning.
- **Calibration integrity.** Re-adjudicated 8 of 41 from literal snapshot text: site 43
  `#onetrust-pc-btn-handler{background-color:#6cc04a;color:#fff}` (OneTrust, sub-threshold), site 94
  inline `color:#3897f0`/`#c9c8cd` (sub-threshold), site 78 `background-color:#AA2D00;color:#FCAB79`
  (scss-module), site 7 TrustArc `#truste-consent-show-button` (#0f62fe), site 91 atomic
  `._…{color:#fff}` (CSS-in-JS, bare single classes → safe), site 90 `.mktoButton`/#99c47c. All
  literals match; hand-recomputed white/#6cc04a=2.262 and #fcab79/#aa2d00=3.643 match the tool. No
  wrong verdict in the sample; all 8 use safe paths (id/inline/bare-class).
- **Version + provenance.** `beacon-static-audit@10` in all three mirrors, 0 lingering `@9`. Golden
  delta is fingerprint-only AND findings are byte-identical @9-vs-@10 on both golden fixtures
  (retention neutral). `tier2-audit.mjs` import + target present in all three mirror locations.
- **Suite.** `node --test` 369/369 (0 fail); `node build.mjs --check` 50/50.

---

## Final pass (2026-07-25) — HIGH fix verified

**Verdict: PASS.** Selector-extraction fix is correct; both prior HIGHs (this pass's + the
initial-pass background bug) resolved and regression-tested. Tree frozen, probes in tmp only.

- **Leak closed** (`static-audit.mjs:400-408`): full-prelude capture, comma-split, whole-string
  `^[.#][\w-]+$` filter. First-hand: `.c2a.c2b` / `.parent .child` / `div.c4` on tail-class-only
  elements now ALL unresolved (evidence `resolved=1`); the comma-list `.cl1,.cl2` positive still
  resolves. Compound/descendant/qualified/pseudo/attr dropped by omission.
- **All 4 remaining sub-threshold pairs re-adjudicated from literal text (full coverage):**
  site 78 `#fcab79/#aa2d00`=3.644 and `#254fad/#fa91e0`=3.639 (per-element `style="..."` inline —
  4 different inline pairs share the class name, so not a nulled class rule), site 94 `#3897f0/#fff`
  =3.064 and `#c9c8cd/#fff`=1.663 (inline fg `<div>/<a>`, white bg from a real `background:#FFF`
  ancestor). Every literal confirmed in the snapshot; all four ratios recompute exactly; all resolve
  via safe paths (inline / ancestor).
- **Calibration methodology correction is accurate, not padded:** it names the first-pass error
  (grep-substring adjudication matched tokens INSIDE descendant selectors like
  `#onetrust-banner-sdk #onetrust-pc-btn-handler`), lists the 5 re-checked removed shapes + the
  site-7 comma-list pair GAINED, and states the 9-site shortfall against the ~10-site bar explicitly
  rather than backfilling. Honest self-correction; not a code defect.
- **No regression:** `node --test` 375/375, `build.mjs --check` 50/50, golden diff fingerprint-only
  with findings byte-identical @9-vs-@10, snapshot-78 score-neutral (overall 54 / coverage 36 /
  contrast not-machine-checkable / fail 0 identical; only review count rises 1→4).

Residual (not blocking): the recalibrated 9-site / 22-pair population is below the ~10-site
acceptance spirit — flagged in the calibration file; a broader benchmark pass would strengthen the
FP-rate claim before step-4 scoring wiring.
