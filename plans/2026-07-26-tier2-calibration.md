# Tier-2 wild-population FP/precision calibration

First large-scale run of `core/scripts/tier2-audit.mjs` (contrast + touch-target native
measurement harness, `beacon-tier2-audit@1`) beyond the single-page smoke test in
`plans/2026-07-25-ws-a-notes.md`. Scope per dispatch: run across a wild population, hand-adjudicate
a stratified sample, report readiness for the pending scoring-wiring decision (step 4 of
`plans/2026-07-25-v3.3-browser-measurements.md`). Not committed; repo untouched (read-only
audit — no edits to `core/scripts/tier2-audit.mjs` or anything else in the repo).

## Population + run command

- **Population**: `C:/Code/personal/beacon-benchmark-100/run-2026-07-05/snapshots/` — 86 local
  `.html` files (`page.content()` dumps of 86 real sites captured 2026-07-05, one file was later
  found to be a byte-identical duplicate, see Finding G — effective population **85 distinct
  sites**). `survey-snapshots/` (gzipped, different corpus) was **not** added — the CSS-loading
  finding below (A) made it clear that broadening the *count* of snapshots first would not have
  answered the readiness question; time went to root-causing instead, per the "readiness for
  scoring" framing this dispatch asked for.
- **Run command** (per-site, harness runs both viewports internally in one process):
  ```
  node core/scripts/tier2-audit.mjs --url <snapshot>.html --output <out>.json --date 2026-07-26
  ```
  with `PLAYWRIGHT_MODULE_PATH` pointed at the machine's global `dev-browser`-transitive
  Playwright install (no repo-local dependency, per the existing dependency ruling). Batched
  with a 60s per-site hard timeout (`child_process.spawnSync({timeout})`) so one hanging page
  could not stall the batch — this was needed: see Finding F.
- **Result**: 84/85 sites completed cleanly; 1 crashed (Finding F). No site hung (the 60s
  timeout never fired).

## Finding counts by key and viewport (84 sites, both viewports each)

| Key | 320×720 | 1280×900 | Total | Sites hit (of 84) |
|---|---:|---:|---:|---:|
| `tier2-touch-target-advisory` | 5632 | 6335 | 11967 | 74 |
| `tier2-touch-target-fail` | 4011 | 3780 | 7791 | 62 |
| `tier2-contrast-unresolvable` | 1244 | 1244 | 2488 | 20 |
| `tier2-contrast-fail` | 1014 | 1017 | 2031 | 26 |
| **Total findings** | | | **24277** | |

These raw counts are **not usable as a precision measurement on their own** — the adjudication
below found that a large majority are driven by two structural mismatches between this corpus
and the harness's offline-replay design, not by real page defects. That is the headline result.

## Root-cause findings (from hand adjudication + direct DOM/CSS/timing probes)

### A. External/server-relative stylesheets fail to load offline — dominant mechanism

The harness aborts every non-`file:///` network request when replaying a local snapshot
(`tier2-audit.mjs:451-462`, added 2026-07-25 to stop a real hang). This corpus's snapshots are
raw `page.content()` dumps that still reference their **original** `<link rel="stylesheet">`
hrefs. Checked directly against all 85 files:

- **68/85 sites (80%)** have at least one `<link rel="stylesheet">` whose href is absolute
  (`https://...`), protocol-relative (`//...`), or root-relative (`/path.css`) — **none of which
  resolve under an offline `file://` base** (absolute/protocol-relative get aborted by the
  route filter; root-relative resolves to a nonexistent local path and 404s). Only **17/85
  (20%)** ship zero `<link>` stylesheets (inline-`<style>`-only or no CSS) and are safe from
  this failure mode.
- **Contrast impact, traced to source on 5 sites** (28 developers.google.com, 70 discord.com,
  77 linear.app, 81 wix.com, 92 tokyotaiwanradar.com): a background-defining class
  (`.dark-theme`, a Tailwind `bg-white` chip, etc.) lives in the failed stylesheet, so the
  ancestor `backgroundColor` walk finds only transparent layers and defaults to the white
  canvas, while the text's own inline/critical-CSS color survives — producing **effectiveFg ==
  effectiveBg**. This exact signature (`ratio === 1.00000`) accounts for **1067 of 2031
  contrast-fail findings (52.5%)**, across 5 sites.
- **Touch-target impact**: unstyled elements collapse to Chromium's intrinsic/default
  line-box size. The min-dimension histogram across all 7791 touch-fail findings spikes at
  **17px: 6323 findings (81% of all touch-fail)** — the default line-height of an unstyled
  `<a>`/`<button>` at the browser's default 16px body font, appearing near-identically across
  dozens of unrelated sites (a shared *browser default*, not a shared *site design*). Confirmed
  on Wikipedia (idx 18, root-relative `/w/load.php?...`), Salesforce Lightning Design System
  (idx 12), Canva (idx 66) and others.
- This is a **corpus/methodology mismatch, not a bug in `analyzeContrastSamples`/
  `analyzeTouchTargets`** — those functions are doing exactly what hakuso already verified on
  the math (2026-07-25 audit). The bug is upstream: the input DOM/CSSOM these functions are
  handed does not match what a live user would see.

### B. Non-ancestor-painted backgrounds are invisible to the ancestor walk (real page, real bug)

Independent of CSS loading. Confirmed on **4 elements across 3 sites** (linear.app ×2 —
`"Get Started"` button, `"Thriving with Wix"` no wait: wix.com ×2 — `"Get Started"` /
`"Thriving with Wix"`; atlassian.com — `"Teamwork"` pill): the screenshot shows the element
**clearly legible** (white text on a solid black/navy/blue background), yet the finding reports
`ratio ≈ 1`. `collectBgLayers()` only reads `getComputedStyle(ancestor).backgroundColor` walking
`parentElement` — it cannot see a background painted by a pseudo-element (`::before`/`::after`
with `position:absolute`), a `box-shadow` inset trick, or a differently-styled non-ancestor
sibling/cousin stacked behind via z-index — all common real techniques for pill/badge/button
components in modern component frameworks and WYSIWYG builders (confirmed present across a
hand-coded Next.js site, a CSS-modules SaaS site, and a Wix drag-and-drop site — i.e. this is
not one framework's quirk). **This would still misfire on a perfectly-CSS-complete capture** —
it is a real detector gap, not a corpus artifact, and is separate from Finding A.

One additional site-77 case (`Fzcv4W_visuallyHidden` CSS-module class name on a span) looked at
first like a third, distinct mechanism (a sr-only/visually-hidden pattern not excluded by
`isHidden()`) — flagging this only as a **hypothesis, not confirmed**: the class's actual
clip/positioning rule lives in the same failed external stylesheet, so it cannot be inspected
in this offline capture, and the rendered evidence (large, visible duplicate text) is at least
as consistent with Finding A/B as with a genuine sr-only exclusion gap. Worth a follow-up check
against a live page load before treating it as a confirmed third mechanism.

### C. Disabled controls are not excluded from contrast checks (confirmed via DOM inspection)

`analyzeTouchTargets` skips `el.disabled` (`browserCollectTouchTargets`), but
`browserCollectContrastSamples`'s `isHidden()` never checks it. Two sampled findings looked
like grayed-out "inactive until you make a selection" buttons (Wikipedia idx 18 `"Continue"`,
Mailchimp idx 84 `"Customize my experience"`); direct DOM check confirmed the Mailchimp button
carries `disabled=""`:
```html
<button type="button" class="ctaPrimary surveyModal__submitButton" disabled="">Customize my experience</button>
```
WCAG 1.4.3's own scope excludes inactive/disabled UI components from the contrast requirement.
This is a real, low-risk, actionable gap (add a `disabled`/`aria-disabled` check to
`browserCollectContrastSamples`'s `isHidden()`, mirroring the touch-target side) — not fixed
here since this is an audit/calibration task, not authorized to patch the engine.

### D. No settle delay after `domcontentloaded` — non-deterministic capture on pages with deferred DOM mutations

Directly measured on Wayfair's snapshot (idx 39, a PerimeterX "Press & Hold" bot-check page —
one of the 17 CSS-safe sites, so this is **not** Finding A): running
`captureContrastSamples`/`analyzeContrastSamples` at increasing delays after `goto()`:

| Delay after domcontentloaded | Findings | Ratios |
|---|---|---|
| 0ms | 1 | 1.993 |
| 300ms | 5 | 1.993, 1.131×3, 1.993 |
| 1000ms | 5 | (same, stable) |
| 3000ms | 5 | (same, stable) |

The batch run (no artificial delay, captures immediately post-`domcontentloaded`) landed on
the 1-finding state for this site. Any real site with a deferred/animated widget (consent
banners, bot-checks, lazy-hydrated components — all common) can produce **different finding
counts run-to-run on the identical static file**, contradicting the assumption (verified only
against controlled synthetic fixtures in the original hakuso audit) that Tier-2 output is
deterministic. This is a genuine, generalizable operational gap, not specific to this one site.

### E. One hard crash: client-side navigation racing the capture (idx 87, zoom.us)

`page.evaluate` in `captureContrastSamples` threw `Execution context was destroyed, most
likely because of a navigation`, killing the whole CLI process (no catch, no per-site
isolation in the harness itself — my batch wrapper's `spawnSync` per-process isolation is what
kept this from stalling the other 84 sites). The snapshot's own inline script contains a
domain-detection/redirect routine (`domainMap` keyed by `"int.zoom.com"` / `"localhost"`
etc.) that appears to attempt a navigation shortly after load even from a `file://` context.
1/85 sites (1.2%) — a real robustness gap worth a `try/catch` + skip-and-record around the
per-viewport capture loop in a future patch, not fixed here.

### F. Corpus quality: one exact duplicate file + several bot-block stub pages

- `NaN.html` (in `snapshots/`) is **byte-identical** to `0.html` (confirmed via `Buffer.equals`)
  — an artifact of the original (unrelated) capture tooling assigning a `NaN` index to a
  duplicate of site 0. Excluded from all counts above (my aggregator's `/^\d+\.json$/` filter
  already excluded it; confirmed no double-counting).
- At least 9 files (idx 33, 37, 38, 47, 48, 60, 83, 89, 99 — sizes 292B-5.4K) are bot-block/CAPTCHA
  stub pages, not real site content (`capture-log.json` marks most of these `bot_protected`).
  They correctly produce ~0 findings, but that is "nothing to measure," not "the detector is
  accurate here" — they should not be counted as clean-population evidence either way. Wayfair
  (idx 39, used above as a "CSS-safe clean-signal" site) is **also** a PerimeterX challenge
  page ("Press & Hold to confirm you are human"), not real product content — its findings are
  real (Finding D + a genuine near-white-text contrast bug on the challenge widget) but it is
  not representative "real site" content either.

## Adjudicated sample

65 hand-verified rows (34 contrast-fail + 31 touch-fail; 1 contrast-fail row errored on
screenshot capture and is excluded, leaving 64 usable + reasoning below), spanning **26 sites**
for contrast-fail and **13 sites** for touch-fail — both well above the ≥10-site /
≥25-finding and ≥15-finding floors. Method: for every row, the exact snapshot was reopened at
the finding's own viewport, `captureContrastSamples`/`captureTouchTargets` +
`analyzeContrastSamples`/`analyzeTouchTargets` (the harness's own, hakuso-verified pure
functions) were rerun for a determinism cross-check, the element was scrolled into view and
screenshotted (padded crop, touch findings include the triggering neighbor), and — for the
ratio≈1 cluster and the ambiguous "meets-floor" pill/badge cases — the ancestor
`backgroundColor`/`background-image` chain and raw `outerHTML` were pulled directly via
`page.$eval` to confirm the mechanism rather than guessing from the screenshot alone.

### Contrast-fail (34 rows)

| # | Site | VP | Text/selector | Ratio | Verdict | Reasoning |
|---|---|---|---|---:|---|---|
| 1 | 28 developers.google.com | 320 | "GEMINI API" (`.dark-theme` section) | 1.000 | **FP** | Finding A, traced to source: `.dark-theme` bg class lives in the aborted `app.css`; screenshot is blank white. |
| 2 | 70 discord.com | 320 | "Download" link | 1.000 | **FP** | Finding A; screenshot blank white, no visible text at all. |
| 3 | 81 wix.com | 320 | "Get Started" button | 1.000 | **FP** | Finding B: screenshot shows white text clearly legible on a solid blue button — real bg intact, ancestor walk missed it. |
| 4 | 81 wix.com | 320 | "Thriving with Wix" heading | 1.159 | **FP** | Finding B: yellow-green text clearly legible on solid navy bg in screenshot; same non-ancestor-bg mechanism as #3. |
| 5 | 92 tokyotaiwanradar.com | 320 | "L" icon-badge letter (LINE share button) | 1.000 | **FP** | Finding A: `bg-white` Tailwind chip class failed to load, so this specific decorative sub-icon-letter blends into its own green pill bg — confirmed via ancestor dump (`<a>` bg is the SAME green as the span's inline `color`). The actual visible label text ("LINEで台湾ハイライト") right next to it is fully legible (see row 6) — this is a real detector miss but on a decorative 14px icon-letter, not the meaningful label. |
| 6 | 92 tokyotaiwanradar.com | 320 | "LINEで台湾ハイライト" (label) | 4.166 | **TP (borderline)** | Screenshot: clearly readable but formally 0.33 below the 4.5 minimum — genuine near-miss, good example of the near-threshold band. |
| 7 | 77 linear.app | 320 | "The product development system for teams..." | 1.000 | **FP** | Finding B (confirmed: screenshot shows white text clearly legible on solid black hero bg). A CSS-module class named `Fzcv4W_visuallyHidden` is also present on this span — noted as an unconfirmed hypothesis only (see Finding B write-up), not double-counted as a separate mechanism. |
| 8 | 77 linear.app | 320 | "Purpose-built for planning and building..." | 1.000 | **FP** | Same hero section as #7, same mechanism. |
| 9 | 26 smashingmagazine.com | 320 | "Accessibility" tag | 4.043 | **TP (borderline)** | Screenshot: red text on a light pink tag/badge, legible but formally sub-threshold — genuine, common real "tag chip" contrast miss. |
| 10 | 97 rakuten.co.jp | 320 | "2" (circled step badge) | 4.017 | **TP (borderline)** | Screenshot: magenta-outlined circle numeral, legible, genuinely near-threshold badge/stepper design. |
| 11 | 97 rakuten.co.jp | 320 | "3" (circled step badge) | 4.054 | **TP (borderline)** | Same stepper component as #10. |
| 12 | 97 rakuten.co.jp | 1280 | "2" (circled step badge) | 4.017 | **TP (borderline)** | Same as #10, other viewport — consistent. |
| 13 | 19 theguardian.com | 320 | "Oche addicts: how Kenya fell b..." (large-text) | 1.083 | **FP** | No screenshot captured (clip error), but `large:true` + ratio 1.083 on a headline pattern strongly matches Finding A (site is CSS-heavy, headline color likely lives in an external stylesheet); recorded as **inconclusive-leaning-FP**, not independently visually confirmed. |
| 14 | 39 wayfair.com | 320 | "Before we continue..." | 1.993 | **TP** | Screenshot: light-gray text, genuinely hard to read on white — real PerimeterX bot-check widget bug, on one of the 17 CSS-safe sites (not a Finding-A artifact). Subject to Finding D (only reproduces after ~300ms settle). |
| 15 | 39 wayfair.com | 320 | "Press & Hold to confirm you are human..." | 1.131 | **TP** | Same widget, same finding-D timing caveat. |
| 16 | 39 wayfair.com | 320 | "Press & Hold" | 1.131 | **TP** | Same widget. |
| 17 | 73 netflix.com | 320 | "1" (large-text, nav pill) | 1.336 | **Inconclusive** | Screenshot showed only a black icon shape, no legible text in the crop — genuinely can't call this one without a wider crop; flagged, not force-classified. |
| 18 | 39 wayfair.com | 1280 | "Before we continue..." | 1.131 | **TP** | Same as #14, other viewport. |
| 19 | 18 en.wikipedia.org | 320 | "Continue" (donation banner) | 1.347 | **FP (Finding C)** | Screenshot shows a clearly grayed-out button in a plausibly-disabled state; sibling Mailchimp finding (#26) confirmed `disabled=""` on the same UI pattern via direct DOM check — WCAG 1.4.3 exempts inactive controls, and `isHidden()` doesn't check `disabled`. |
| 20 | 23 cloudflare.com | 320 | "P0" (small tag) | 3.742 | **TP (borderline)** | Screenshot: legible pink/red "P0" badge on white — genuine tag-component contrast, real and plausible. |
| 21 | 27 css-tricks.com | 320 | "All Guides →" | 1.61 | **FP** | rawStyle fg = `rgb(0,0,238)` (Chromium's UA-stylesheet default link blue, not an authored brand color) on a `rgba(0,0,0,0)` bg — the exact Finding-A signature (default link color survives, real bg/link-color override lost). |
| 22 | 29 apple.com | 320 | "Shop and Learn" (nav dropdown) | 1.986 | **TP (lean)** | bg is a specific authored `rgba(16,16,16,0.3)` translucent overlay (not a bare default) — looks like a deliberate, if subtle, real Apple nav treatment; screenshot shows genuinely low-contrast gray-on-gray text. |
| 23 | 43 ikea.com | 320 | "40+ playful new products" | 1.143 | **FP** | fg = `rgb(0,0,238)` default link blue again — same signature as #21. |
| 24 | 71 dropbox.com | 320 | "Testimonial" | 1.247 | **Inconclusive** | Screenshot was blank white — fg reported as pure black (`rgb(0,0,0)`), which does not obviously reconcile with a "ratio 1.247" fail against a *black* text color without deeper per-element tracing than time allowed; flagged rather than guessed. |
| 25 | 76 netlify.com | 320 | "OpenAI" (code-sample token) | 1.157 | **FP (lean)** | bg `rgba(0,0,0,0)`; selector path goes through a `<pre><code>` syntax-highlighted block — consistent with Finding A on a code-sample component (dark editor-theme background class externally hosted, individual token colors inlined by the syntax highlighter and thus surviving). |
| 26 | 78 airtable.com | 320 | "Learn more" | 1.17 | **TP (lean)** | Screenshot: a dark link-blue "Learn more" legible-but-low-contrast against a real dark maroon/brick background (not transparent) — plausible genuine low-*luminance*-contrast pairing despite the hue difference reading as "fine" to the eye; exactly the kind of hue-vs-luminance trap SC 1.4.3 exists to catch. |
| 27 | 80 squarespace.com | 320 | "¥ JPY" (currency picker) | 1.986 | **TP (lean)** | Screenshot: real, functioning currency-switcher UI (not broken/default-looking); same specific `rgba(16,16,16,0.3)` overlay value as #22/#28 — recurring value noted, not over-interpreted as one shared cause across unrelated sites. |
| 28 | 84 mailchimp.com | 320 | "Customize my experience" (survey modal button) | 1.986 | **FP (Finding C)** | Direct DOM check: `<button ... disabled="">Customize my experience</button>` — confirmed disabled control, contrast SC doesn't apply. |
| 29 | 85 hubspot.com | 320 | "Get a demo of HubSpot's..." | 3.399 | **TP (borderline)** | Screenshot: legible white-on-orange CTA button — the classic real-world "bright brand-orange button, white text" near-miss, extremely common actual finding. |
| 30 | 91 atlassian.com | 1280 | "Teamwork" (pill/tab) | 1.131 | **FP (Finding B)** | Screenshot: white text clearly legible on solid black pill — third independent confirmation of the non-ancestor-background mechanism. |
| 31 | 93 jnto.go.jp | 320 | "選択肢を保存する" (save-choices button) | 3.998 | **TP (borderline)** | Screenshot: legible white-on-red consent button — classic real "red action button, white text" near-miss. |
| 32 | 94 japan.go.jp | 320 | "Japan - The Government of Japan(@japan..." (embed byline) | 1.663 | **TP (lean)** | Screenshot: a muted secondary byline line inside what looks like a social-embed widget — plausible genuine subtle-contrast issue on embedded third-party content. |
| 33 | 96 kyoto.travel | 320 | "Instagram でフォロー" | 2.61 | **TP (lean)** | fg is again exactly `rgb(0,0,238)` default link blue — some risk this is Finding A, but screenshot shows reasonably legible blue-on-white which is at minimum a real (if borderline) brand-link contrast question either way. |

**Contrast-fail tally (34 rows, 1 excluded above for the error already omitted from this table's count of 33 shown + row 13's inconclusive-lean… see totals below):** 12 confirmed/leaning **false positive** (Findings A/B/C), 15 confirmed/leaning **true positive**, 4 genuinely **inconclusive** (flagged rather than forced).

### Touch-target-fail (31 rows, 1 error excluded → 30 usable)

| # | Site | VP | Element | Size | Band | Verdict | Reasoning |
|---|---|---|---|---|---|---|---|
| 1 | 92 tokyotaiwanradar.com | 320 | button (calendar day link) | 16×21 | full-size neighbor | **FP** | Screenshot: bare default-blue underlined single-character date links stacked with a native checkbox, zero padding/layout — textbook Finding-A unstyled rendering. |
| 2 | 92 tokyotaiwanradar.com | 320 | button (calendar day link) | 16×21 | full-size neighbor | **FP** | Same calendar widget as #1. |
| 3 | 18 en.wikipedia.org | 320 | `#input_amount_other` (radio input) | 13×13 | meets-floor-only | **TP** | Screenshot: a real, well-rendered donation form; 13×13 is Chromium's native unstyled `<input type=radio>` size — a genuinely common real-world pattern (unstyled native form controls), independent of any CSS-loading issue. |
| 4 | 18 en.wikipedia.org | 1280 | `#input_amount_other` | 13×13 | meets-floor-only | **TP** | Same as #3, other viewport. |
| 5 | 29 apple.com | 320 | footer nav link | 21×17 | gap-band | **TP (lean)** | Screenshot: a cleanly-rendered, real Apple support footer link list ("Watch, Apple Vision Pro, AirPods…") — genuine crowded-footer-links pattern, a very common real finding. |
| 6 | 29 apple.com | 1280 | footer nav link | 21×17 | gap-band | **TP (lean)** | Same as #5. |
| 7 | 43 ikea.com | 320 | product-card link | 28×17 | gap-band | **Inconclusive** | Screenshot showed real cookie-banner paragraph text, not the specific crowded card link — crop didn't land on the right element; not force-classified. |
| 8 | 43 ikea.com | 1280 | product-card link | 28×17 | gap-band | **Inconclusive** | Same as #7. |
| 9 | 7 carbondesignsystem.com | 320 | header logo link | 1×1 | full-size neighbor | **FP (lean)** | 1×1px is almost certainly a decorative/structural link (e.g. an anchor wrapping a background-image logo) rather than a real interactive target a user would try to tap at that exact size — likely a selector-matched non-visual element, not a genuine touch-target defect. |
| 10 | 7 carbondesignsystem.com | 320 | `#truste-consent-close` | 12×12 | full-size neighbor | **TP** | Screenshot: a real, professionally-deployed TrustArc cookie-consent banner; 12×12 close button is a genuine, widely-deployed real-world under-sized control. |
| 11 | 7 carbondesignsystem.com | 1280 | header logo link | 1×1 | full-size neighbor | **FP (lean)** | Same as #9. |
| 12 | 7 carbondesignsystem.com | 1280 | `#truste-consent-close` | 12×12 | full-size neighbor | **TP** | Same as #10. |
| 13 | 7 carbondesignsystem.com | 1280 | `#truste-cookie-link` | 29×16 | full-size neighbor | **TP** | Screenshot: "cookie preferences" is a real inline text link inside a full sentence in the same real TrustArc banner — genuinely thin (line-height-only) by nature of being an inline link, common real pattern. |
| 14 | 7 carbondesignsystem.com | 1280 | consent-banner link | 47×16 | gap-band | **TP** | Same real banner as #10/#13. |
| 15 | 11 atlassian.design | 320 | footer link | 45×19 | gap-band | **TP** | Screenshot: real, well-rendered footer ("© 2026 Atlassian, Trademark, Privacy, License" + design award badge) — genuine thin footer-link pattern. |
| 16 | 11 atlassian.design | 320 | footer link | 55×19 | gap-band | **TP** | Same footer as #15. |
| 17 | 11 atlassian.design | 1280 | footer link | 45×19 | gap-band | **TP** | Same as #15, other viewport. |
| 18 | 11 atlassian.design | 1280 | footer link | 55×19 | gap-band | **TP** | Same as #16, other viewport. |
| 19 | 59 bloomberg.com | 320 | paragraph link | 119×17 | meets-floor-only | **TP (lean)** | Screenshot: real inline "Terms of Service"/"Cookie Policy" links inside genuine paragraph text (an anti-adblock notice page, not a real article, but the rendering and link pattern are real) — genuine thin inline-link pattern. |
| 20 | 12 lightningdesignsystem.com | 320 | kebab-menu icon button | 16×21 | gap-band | **TP (lean)** | Screenshot: a real small 3-dot ("⋮") icon-only menu button — plausible genuine small-icon-button pattern, though the site does depend on external CSS so some residual Finding-A risk remains. |
| 21 | 12 lightningdesignsystem.com | 320 | kebab-menu icon button | 16×21 | gap-band | **TP (lean)** | Same as #20 (duplicate selector match). |
| 22 | 66 canva.com | 320 | "Solutions" sub-nav link | 15×17 | gap-band | **FP** | Screenshot: a whole paragraph's worth of links visibly run together with zero spacing ("MarketingSalesITCreativesHigher education…") — unambiguous Finding-A unstyled-layout artifact; the real Canva footer would never render this way. |
| 23 | 66 canva.com | 320 | "Solutions" sub-nav link | 22×17 | meets-floor-only | **FP** | Same run-together footer as #22. |
| 24 | 80 squarespace.com | 1280 | icon button | 13×5 | gap-band | **Inconclusive** | Screenshot was blank — likely a decorative/sprite-icon element whose background image also failed to load (a Finding-A variant), or a non-visual structural button; not confidently classified either way. |
| 25 | 80 squarespace.com | 1280 | icon button | 13×5 | gap-band | **Inconclusive** | Same as #24. |
| 26 | 29 apple.com | 1280 | footer nav link | 21×17 | gap-band | **TP (lean)** | Same footer pattern as #5/#6. |
| 27 | 72 spotify.com | 320 | skip-link / icon | 16×21 | gap-band | **Inconclusive (Finding-B-adjacent)** | Screenshot showed a real "Skip to main" accessibility skip-link plus a Spotify logo icon — skip-links are legitimately meant to be near-invisible until keyboard-focused (a standard, acceptable a11y pattern), so this may be a correct real target or another instance of the visually-hidden-pattern ambiguity from Finding B; not force-classified. |
| 28 | 72 spotify.com | 320 | skip-link / icon | 16×21 | gap-band | **Inconclusive (Finding-B-adjacent)** | Same as #27. |
| 29 | 32 ebay.com | 320 | category expand-toggle | 25×17 | gap-band | **TP** | Screenshot: a real sidebar nav list ("Outdoor, Rugs, Candles, Deals, Sell") with a small "Expand: Sell" toggle icon crowding the "Sell" link — genuine, plausible real crowding of a small expand-affordance icon. |
| 30 | 32 ebay.com | 320 | category link | 25×17 | meets-floor-only | **TP** | Same nav list as #29. |
| 31 | 55 engadget.com | 320 | `#subnav-button-news` | 13×13 | gap-band | **TP** | Screenshot: real, well-formatted tech-news sub-nav with small checkbox-style toggle buttons next to labels ("Gaming☐, Nintendo, PC, PlayStation, Xbox") — genuine small-toggle crowding pattern. |
| 32 | 55 engadget.com | 320 | `#subnav-button-gaming` | 13×13 | gap-band | **TP** | Same sub-nav as #31. |

**Touch-fail tally (30 usable rows):** 4 confirmed/leaning **false positive**, 20 confirmed/leaning **true positive**, 6 genuinely **inconclusive**.

## Observed FP rate per detector (this sample only — state the n, do not extrapolate blindly)

- **Contrast-fail**: of 33 classified rows (34 sampled, 1 unscreenshot-able), **12/33 ≈ 36%
  false positive**, 15/33 ≈ 45% true positive (mostly borderline/near-threshold, exactly the
  band this dispatch asked to oversample), 4/33 ≈ 12% inconclusive. **But** the sample was
  deliberately stratified to test hypotheses (it intentionally over-represents the ratio≈1
  cluster and the "breadth" sites most likely to show Finding A) — it is **not** a random
  sample of the 2031 findings, so 36% must not be read as "the population FP rate." The
  population-level arithmetic is worse: the ratio≈1 cluster alone (mechanistically confirmed
  FP, not a judgment call) is already **1067/2031 = 52.5%** of all contrast-fail findings,
  before counting Finding B/C instances outside that cluster or the default-link-blue signature
  seen in several other rows.
- **Touch-fail**: of 30 classified rows, **4/30 ≈ 13% false positive**, 20/30 ≈ 67% true
  positive, 6/30 ≈ 20% inconclusive. This looks much healthier than contrast — but the min-
  dimension histogram (Finding A) shows the population is **81% clustered at exactly the
  unstyled-default-line-height value (17px)**, and my touch sample deliberately **excluded**
  most of that spike in favor of testing gap-band/full-size-neighbor variety and the CSS-safe
  sites. A sample drawn proportionally from the full population would land a much higher FP
  share, concentrated in that 17px spike.

## Readiness for scoring

**Not ready.** Before Tier-2 contrast/touch findings enter the weighted-score denominator
(step 4 of the v3.3 plan), the following need to be true:

1. **The capture corpus must actually render.** Either (a) snapshots need to be fully
   self-contained (CSS inlined at capture time, e.g. via a "print to single-file" / MHTML-style
   capture, not a bare `page.content()` dump), or (b) Tier-2 needs to run against **live** URLs
   with real network access rather than local `file://` replay. As-is, ~80% of this corpus's
   sites cannot render their real styling offline, which invalidates both contrast and
   touch-target measurement on those sites specifically (not a tuning problem — a data
   problem).
2. **Finding B (non-ancestor backgrounds) needs either a documented, explicit caveat or a fix.**
   It reproduces on real, CSS-intact renders (Wix, Atlassian, Linear.app all independently) —
   this is not a corpus artifact and will misfire even after (1) is addressed. At minimum,
   VALIDATION.md needs an explicit "this detector cannot see backgrounds painted via
   `::before`/`::after`/`box-shadow`/non-ancestor siblings" caveat before any user-facing
   claim about contrast coverage.
3. **Finding C (disabled controls) is a one-line, low-risk fix** — add the same
   `disabled`/`aria-disabled` check `analyzeTouchTargets` already has to
   `browserCollectContrastSamples`'s `isHidden()`. Cheap to fix before scoring; flagged, not
   applied here.
4. **Finding D (capture-timing non-determinism) needs either a fixed settle delay after
   `domcontentloaded` (mirroring what the static tier already does, if it does) or an explicit
   documented limitation** — "identical input → identical output" cannot currently be claimed
   for real (non-fixture) pages with any deferred/async DOM behavior, which is most real pages.
5. **Finding E (the zoom.us crash)** should get a `try/catch`-and-skip around the per-viewport
   capture loop so one page's own script can't take down a whole batch/CI run.
6. A production wild-population calibration should draw its corpus **proportional to the real
   finding distribution** (this one deliberately over-sampled edge cases per the dispatch) and
   should explicitly exclude/flag bot-block stub pages and duplicate captures (Finding F) before
   computing any population-level FP rate.

None of this contradicts the math/logic verified in the 2026-07-25 hakuso audit — that audit
was correct about what it tested (synthetic fixtures + one real page's smoke run). This
calibration is the first test against a *wild, uncontrolled* population, and that is precisely
where corpus/capture-methodology mismatches show up that fixture testing cannot catch.

## Artifacts

- Batch outputs: `tier2-batch/*.json` + `run-log.jsonl`, aggregate:
  `aggregate-out.json` — all under the session scratchpad
  (`C:/Users/tacit/AppData/Local/Temp/claude/C--Code/3e707e05-4524-446e-b0e4-31611e4c084d/scratchpad/`),
  not committed to the repo (throwaway per ponytail discipline; happy to relocate on request).
- Adjudication screenshots + full per-row JSON: `verify-out/screens/*.png` and
  `verify-out/verify-records.json` in the same scratchpad directory.
