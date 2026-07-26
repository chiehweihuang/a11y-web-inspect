# WS-B FP calibration — broad population pass (engine `beacon-static-audit@11`)

Follow-up to `plans/2026-07-25-ws-b-contrast-calibration.md`, whose recalibrated population
(9 sites / 22 pairs) was below the "~10 sites" bar the plan itself flagged as insufficient.
This pass broadens the population by ~9x and re-adjudicates every sub-threshold pair against
literal CSS, reading full preludes directly (never a substring grep — the exact mistake the
prior file's methodology-correction section names and warns against repeating).

## Population and counts

| Population | Path | Files scanned |
|---|---|---|
| survey-snapshots | `beacon-benchmark-100/survey-snapshots/*.html.gz` (decompressed to a scratch dir first) | 735 |
| intake-snapshots | `beacon-benchmark-100/intake-snapshots/*.html` (2 stray `.json` files in that dir excluded, not snapshots) | 26 |
| run-2026-07-22-weekly | `beacon-benchmark-100/run-2026-07-22-weekly/snapshots/*.html` | 13 |
| **Total** | | **774** |

`targets.json`/`beacon-lab.db` were never opened (registry-concurrency trap avoided per the
work order). 0 scan failures across all 774 files.

| Metric | Value |
|---|---|
| Snapshots scanned | **774** |
| Sites with >=1 resolvable pair | **78** |
| Total resolved pairs | **483** |
| Sub-threshold (below 4.5:1) | **45** |
| Passing resolved pairs | 438 |

Compared to the prior narrow pass: 9x the snapshots (86 -> 774), 8.7x the sites-with-pairs
(9 -> 78), 22x the pairs (22 -> 483), 11.25x the sub-threshold findings (4 -> 45). The
"~10 sites" bar is now cleared by a wide margin.

## Reproduction

Single-file scans (same methodology as the prior pass), root = each population directory so
`location` is a bare filename, aggregating the `static-contrast-evidence` finding's
`computed.{resolved,subThreshold}` per file plus every `static-contrast-sub-threshold` finding:

```bash
# one-time: gunzip survey-snapshots/*.html.gz into a scratch dir (735 files)
for f in beacon-benchmark-100/survey-snapshots/*.html.gz; do
  gunzip -c "$f" > <scratch>/survey-html/"$(basename "${f%.gz}")"
done

# per population dir (cwd = that dir), per file:
node core/scripts/static-audit.mjs --output out.json "<file>"
# then read out.json.findings[]:
#   key 'static-contrast-evidence'      -> computed.{resolved, subThreshold}  (per-file totals)
#   key 'static-contrast-sub-threshold' -> one entry per failing pair (location, computed.{fg,bg,ratio})
```

Population dirs scanned this way: `<scratch>/survey-html/` (735), `beacon-benchmark-100/intake-snapshots/`
(26), `beacon-benchmark-100/run-2026-07-22-weekly/snapshots/` (13). A throwaway Node driver script did
this loop and JSON aggregation; not committed, lived only in the session scratchpad.

For the per-pair selector-level evidence below, a **temporary, env-gated debug hook** (mirrors
both prior passes' own ad hoc dumps) was added to `computeStaticContrastFindings` in
`core/scripts/static-audit.mjs`, printing `{loc, tag, id, classAttr, style, directText, fg, bg,
ratio}` to stderr for every sub-threshold pair when `BEACON_DEBUG_CONTRAST=1`. It was reverted
immediately after collecting the dump for this report — `git diff -- core/scripts/static-audit.mjs`
is empty; the working tree is clean.

## External-stylesheet cascade-override caveat (per work order)

Team-lead flagged that most of this corpus references external/root-relative stylesheets that
cannot load under static file replay. That is a corpus property, not a bug in this detector:
the static contrast detector **only ever resolves literal same-file `<style>` or inline
`style=""` declarations by design** (`core/scripts/static-audit.mjs` block comment above
`computeStaticContrastFindings`: "No external CSS (`<link>`) is ever consulted"). So the missing
external CSS mostly just means fewer resolvable pairs (safe) — it does not, by itself, make a
resolved pair wrong.

But it does raise a real, distinct risk the team-lead is right to flag: **whether a resolved
same-file rule would survive the cascade in a real browser once the external stylesheet the
page also references actually loads.** This risk is NOT uniform across the 45 pairs — it splits
cleanly on *how* the pair was resolved:

- **Inline-`style=""`-resolved pairs (fg and/or bg both anchored to inline styles on the
  element itself or a direct ancestor): cascade-safe.** An inline `style` attribute has the
  highest specificity in CSS and can only be beaten by an external `!important` rule, which is
  rare and would itself be an unusual, auditable override. **15 of the 44 genuine pairs** are
  in this bucket.
- **Same-file `<style>`-CLASS/ID-rule-resolved pairs: genuine override risk.** An external
  stylesheet loaded later with equal specificity, or with `!important`, can legitimately win
  in a real browser even though the same-file rule is literally, unambiguously true of the
  static markup. **29 of the 44 genuine pairs** are in this bucket — every row below is marked.
  Of these, 8 sites' pages were checked for `<link rel="stylesheet">` presence: 6 sites (100174,
  100774, 100784, 100787, 100851, 101149 — 27 pairs) DO reference external stylesheets, so the
  override risk is live and unverified without a browser; 2 sites (100626, 100955 — 14 pairs)
  reference **zero** external stylesheets in the captured snapshot, so for those two specifically
  the same-file rule is very likely the only rule in play (lower practical risk despite being
  class-anchored).

This caveat is stated per-row in the table below (column "Anchor"). It does not change any
verdict — no additional pair was found unresolvable or wrong because of it — but it does mean
"GENUINE (same-file class)" rows should be read as "correctly resolved from the literal static
CSS, contrast in a real render still needs Tier-2/browser confirmation," which is exactly what
every finding's own `description` field already says ("confirm in a real browser... before
treating as final").

## Per-pair evidence and adjudication (all 45 sub-threshold pairs)

Duplicate pairs at the identical location/selector (repeated template instances) are collapsed
into one row with a `xN` count; every distinct selector/rule is still shown.

| Site (survey-snapshots id) | Location | xN | Ratio | fg / bg | Element | Literal CSS evidence | Anchor | Verdict |
|---|---|---|---|---|---|---|---|---|
| 100061 | 100061.html:152 | x1 | 3.004 | #fff / #00a88e | `<a id="p4s-confirm-allow-button" class="...pushsender-btn-allow">Subscribe</a>` | `style="color:#ffffff; background-color: #00a88e;"` | inline | GENUINE |
| 100174 | 100174.html:37837 | x1 | 3.654 | #fff / #ff322e | `<a class="lb-row3 lb-row-action-button3">SUPPORT AP</a>` | `.lb-row-action-button3{...background-color: #ff322e; ...color: #fff;...}` (bare class, same-file `<style>`) | same-file class | GENUINE |
| 100201 | 100201.html:2138 | x1 | 3.466 | #fff / #e26150 | `<a class="menuLink menuSubLink customUpgradeBtn removeAdLink">Get Full SPICEVIDS Membership</a>` | `style="background: #e26150; color: #ffffff; border: 2px solid #e26150;"` | inline | GENUINE |
| 100275 | 100275.html:325 | x2 | 2.348 | #fff / #ff8b00 | `<button class="cky-btn cky-btn-accept">Accept all</button>` (CookieYes; main banner + preferences panel, 2 instances) | `style="color: #FFFFFF; border-color: #FF8B00; background-color: #FF8B00;"` | inline | GENUINE |
| **100291** | **100291.html:2790** | x1 | **1.00** | #fff / #fff | `<a aria-label="Try Alexa for Shopping" href="/s/browse/...">Try Alexa for Shopping</a>` | see FALSE POSITIVE writeup below | n/a | **FALSE POSITIVE** |
| 100292 | 100292.html:89 | x1 | 3.809 | #fff / #ee3293 | `<button class="_5f52c772 xh-button square small red">START CHAT</button>` | `style="background: rgb(238, 50, 147); border-color: rgb(238, 50, 147); color: rgb(255, 255, 255);"` | inline | GENUINE |
| 100343 | 100343.html:1163/1170/1178 | x3 | 4.341 | #0174c3 / #ecf2f7 | `<div class="card padding--medium" style="background:#ecf2f7"><h2 style="color:#0174c3">Login / Support / Resources</h2>` | inline `background:#ecf2f7` on the direct parent `.card` div, inline `color:#0174c3` on each `<h2>` | inline | GENUINE |
| 100429 | 100429.html:880 | x1 | 3.122 | #fff / #d97757 | `<button id="accept-btn">Accept</button>` | `style="background: #d97757; ...color: #fff; ..."` | inline | GENUINE |
| 100626 | 100626.html:129 | x1 | 3.545 | #fff / #888888 | `<span class="badge mobile-show-inline-block">6,800+</span>` | `.badge{...color:#fff;...background-color:#888;...}` (Bootstrap `.badge`, bare class, same-file `<style>`; page has **0** external stylesheets) | same-file class (no external CSS present) | GENUINE |
| 100655 | 100655.html:33 | x1 | 2.303 | #fefefe / #aaaaaa | `<p>Your browser does not support JavaScript...</p>` | `style="...color:#fefefe;background:#aaa;"` | inline | GENUINE |
| 100663 | 100663.html:1167 | x1 | 3.13 | #fff / #61a229 | `<a id="cookie_action_close_header" class="...wt-cli-accept-btn">Accept</a>` | `style="color: rgb(255, 255, 255); background-color: rgb(97, 162, 41);"` | inline | GENUINE |
| 100774 | 100774.html:60 | x3 | 3.028 | #fff / #439cd3 | `#truste-show-consent`/`#truste-consent-required`/`#truste-consent-button`, all `class="truste-buttons"` ("Customize Settings"/"No thanks"/"Count me in") | `.truste-buttons{font-family:"ProximaNovaSemiBold";...color:#fff;background:#439CD3;...}` (bare class — verified NOT the compound/descendant leak shape hakuso found last time) | same-file class (5 external stylesheets present) | GENUINE |
| 100784 | 100784.html:60 | x3 | 3.028 | #fff / #439cd3 | Same TrustArc widget, same three ids/class, embedded on a second site | Same `.truste-buttons` rule, independently confirmed in this file | same-file class (5 external stylesheets present) | GENUINE |
| 100787 | 100787.html:602/603 | x2 | 2.686 | #009ddb / #e6f1ff | `<span class="card-programacao__category">Novela / Filme</span>` | `.card-programacao__category{align-items:center;background:#e6f1ff;...color:#009ddb;...}` (bare class) | same-file class (3 external stylesheets present) | GENUINE |
| 100851 | 100851.html:7435 | x5 | 2.936 (x3) / 3.358 (x2) | #fff / #ff6600, #fff / #ff455b | `<span class="title-content-mark ie-vertical c-text c-gap-left-small c-text-hot">热</span>` / `...c-text-new">新</span>` | `.c-text{...color:#fff;...}`, `.c-text-hot{background-color:#f60}`, `.c-text-new{background-color:#ff455b}` — each bare class has a near-duplicate rule elsewhere in the file, but verified those duplicates sit OUTSIDE any `<style>` tag (JS/JSON blob), so no redeclaration ambiguity actually applies | same-file class (3 external stylesheets present) | GENUINE |
| 100931 | 100931.html:246 | x1 | 3.437 | #fff / #ff4053 | `<div class="styles-module-content-M8Kp5">Скидка</div>` | `style="color:#FFFFFF;background-color:#FF4053"` | inline | GENUINE |
| 100955 | 100955.html:190 | x13 | 3.10 | #fff / #f2681d | `<div class="logo-Download">Download</div>`, `<div class="aha-swiper-btn">Play Now</div>`, `<div class="aha-swiper-btn-m">Play</div>` (repeated across what is evidently a repeated carousel template) | `.logo-Download{background-color:#f2681d;...color:#fff;...}`; `.aha-swiper-btn,.aha-swiper-btn-m{background-color:#f2681d;...color:#fff;...}` (comma-separated bare classes, correctly split per the prior hakuso fix; page has **0** external stylesheets) | same-file class (no external CSS present) | GENUINE |
| 101066 | 101066.html:5321 | x1 | 1.813 | #fff / #9dc5e8 | `<div style="...background-color:rgb(157, 197, 232); color:#fff;"><a style="color: #FFFFFF;">...スマートフォン高価買取中...</a></div>` | inline bg on direct parent, inline fg on the `<a>` | inline | GENUINE |
| 101066 | 101066.html:5474 | x1 | 4.497 | #fff / #0e77da | `<a class="hero_cta_btn btn-primary-dark">詳しく見る</a>` | `style="background: rgb(14, 119, 218); color: rgb(255, 255, 255); border-color: rgb(14, 119, 218);"` | inline | GENUINE (right at the boundary) |
| 101083 | 101083.html:9561 | x1 | 4.435 | #999999 / #333333 | `<div id="box-gdpr" style="...background:#333; color: #fff;..."><div>...<p style="...color: #999;...">By continuing to use our site...</p></div></div>` | inline fg on the `<p>` itself (overrides the ancestor's own inline `color:#fff` for its own text, which is normal cascade behavior), inline bg on the `#box-gdpr` ancestor | inline | GENUINE |
| 101149 | 101149.html:43 | x1 | 3.847 | #fff / #0081f5 | `<button class="css-gvvygu e1fauubb2">OPEN</button>` | `.css-gvvygu{cursor:pointer;background-color:#0081F5;...color:#ffffff;...}` (bare class) | same-file class (3 external stylesheets present) | GENUINE |

44 of 45 pairs confirmed GENUINE by re-deriving the full CSS prelude / inline style text directly
from the file (never a substring grep). 1 confirmed FALSE POSITIVE.

## The confirmed false positive: 100291.html:2790

**Root cause (new leak shape, distinct from both bugs the prior two passes fixed):** the flagged
element is

```html
<a href="/s/browse/node=210710065011?..." tabindex="-1" aria-label="Try Alexa for Shopping"
   style="...color: rgb(255, 255, 255); ...">Try Alexa for Shopping</a>
```

sitting inside a caption overlay for carousel slide 2, whose real visual backdrop is a
photographic `<img alt="Person relaxing on green couch holding orange Fire TV Stick 4K Max
streaming device.">` occupying the same box via `position:relative`/`position:absolute`
layout, not a CSS `background`/`background-color` property. None of the intervening ancestor
`<div>`s (the caption flex container, the absolutely-positioned overlay wrapper, the
`carousel-item-1` slide container) declare a background at all — not even an unresolved one —
so the walker's "undeclared background -> keep climbing" rule (correct in general) climbs
straight past the image and lands on an unrelated ancestor many levels up:

```html
<div style="background: rgb(255, 255, 255); display: flex; flex-direction: column;
            align-items: center; max-width: 1504px; margin: 0px auto;">
 <div style="background: rgb(255, 255, 255); ...">  <!-- the page's outer content wrapper -->
```

resolving white text against this distant, visually-unrelated white page background: a
nonsensical 1.00:1 white-on-white "finding" for text that a real user sees on top of a photo.

This is the same FAMILY of false-certainty bug as the site-92 LINE-icon bug the initial pass
fixed (2026-07-05: an unresolved-but-present class blocked the walk), but a **different leak
shape**: here there is no class attribute to catch at all — a plain `<img>` sibling providing
the real visual backdrop is invisible to a detector that only understands the `background` /
`background-color` CSS properties. The existing code already blocks the walk at a
`background-image` CSS property (tested in `test/static-contrast.test.mjs`), but has no
equivalent block for "an ancestor's sibling is an `<img>`" or "this element is
`position:absolute` over unknown content." **Not fixed in this pass** (out of the broadening
work order's scope; a fix belongs with the next code change to this detector, and should treat
an `<img>` sibling the same way the existing background-image case is already treated: block,
don't guess).

## Miss-rate observation (not a bounded claim)

1 confirmed false positive out of 45 adjudicated sub-threshold pairs in this population
(~2.2%). This is an observation from one snapshot population, not a bounded error-rate claim —
the earlier, much smaller pass found 0 misses in its 22-pair population and only surfaced this
class of bug because the population grew ~22x. A future pass drawing from yet another
population could easily land anywhere in a wide range around this number; treat it as "broadening
the corpus keeps surfacing real bugs, at a low but non-zero rate" rather than as a rate to plan
around.

## Readiness for scoring wiring

Unchanged from the existing design: contrast findings stay `check:'review'` /
`state:"not-machine-checkable"` and are excluded from scoring by construction (`addFinding`'s
funnel only routes `check:'fail'` into the severity/score accounting) — nothing in this pass
required or exercised a scoring change. On the calibration-population question specifically:
the "~10 site" bar from the prior pass is now cleared (78 sites with resolvable pairs, 20 with
sub-threshold findings, 774 snapshots total), and adjudication confirms the resolver is correct
in 44/45 cases across a much wider variety of sites (news, adult, e-commerce, telco, retail,
consent-management widgets in EN/JA/RU/PT/ZH). The one confirmed miss is a real, reproducible
false-positive shape (absolutely-positioned text over a sibling `<img>` with no CSS background
anywhere in the chain) that should be fixed before this detector's findings are trusted for
anything beyond the current review-only, non-scored evidence line — it is not, by itself, a
reason to withhold the review-only evidence line that already ships.
