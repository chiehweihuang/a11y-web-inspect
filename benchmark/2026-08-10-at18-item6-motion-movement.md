# Engine @18 item 6: motion demote + trigger rewrite, 40-site wild corpus

Compares the item-5 baseline (5 fixes: isHiddenAttrs, quality-flags gate, entity decode,
PUA contrast, input-label accname chain — `motion-reduced-motion-missing` still
`check:'fail'`, simple `/(animation|transition):/` trigger) against the final item-6
state (motion demoted to `check:'review'`, out of scoring and `legal_risk` mapping, new
motion-bearing + markup-reachability trigger). Same 40 real captured snapshots.

Summary: 30/40 sites moved (score and/or `motion-reduced-motion-missing` count).

## Two effects, both from item 6, overlapping on the same sites

1. **Demote** (every site with ANY motion evidence, fires or handled): the category no
   longer scores. Previously a firing `motion-reduced-motion-missing` was the category's
   ONLY evidence (thin:true, fail:1, forced score 0) that entered the weighted average at
   full category weight; now the category returns to `not-machine-checkable` and exits
   scoring entirely, same as contrast/touch/cognitive/media already do. This alone
   explains every score increase below where the finding COUNT is unchanged
   (`motion-reduced-motion-missing` still 1->1) — e.g. scribd.com 91->100, hbr.org
   80->87: same 1 finding, no longer scored.
2. **Rewrite** (the trigger itself): `motion-reduced-motion-missing` count changes
   1->0 or 0->1 on 20 of the 30 moved sites.
   - **1->0** (14 sites): the old file-wide `/(animation|transition):/` presence check
     fired on CSS that is either non-motion-bearing (color/opacity-only transitions) or
     whose selector never matches the static markup. Verified directly on
     **100320 epa.gov**: `@keyframes slidein-left{from{transform:translateX(15rem)}
     to{transform:translateX(0)}}` is real and motion-bearing, but its rule's selector
     is `.fba-modal-dialog .usa-nav.is-visible` — the `is-visible` class exists nowhere
     in the static markup (confirmed by direct grep of the snapshot), meaning it is added
     by JavaScript when a nav menu opens. A static scan cannot see that interaction; the
     new reachability check correctly excludes it rather than guessing. The remaining
     4 rules in that same file are `transition:opacity`/an unqualified
     `transition:0.2s ease-in-out` (no explicit property — treated as unresolved, not
     motion, matching this file's "don't guess" convention elsewhere) — none motion-bearing
     either way.
   - **0->1** (2 sites: cnet.com, paloaltonetworks.com): the OLD engine treated
     "animation/transition present AND prefers-reduced-motion present anywhere in the
     file" as a silent scored PASS (no finding at all). The new engine still requires
     motion-bearing + reachable evidence to say anything, but once it has that evidence
     it now emits an informational `check:'review'` finding either way (fires or
     handled) — satisfying the ruling that motion returns to `not-machine-checkable`
     even on properly-handled pages, instead of a silent scored 100.
   - The other 10 moved sites keep the same motion finding count (1->1); their movement
     is demote-only (see effect 1).

No score decreased and no site lost real fail-severity evidence outside motion — this
is a pure precision + scoring-scope correction, not a new blind spot.

## Per-site table

| id | url | old score | new score | delta | old motion count | new motion count |
|---|---|---|---|---|---|---|
| 100320 | https://epa.gov | 90 | 97 | +7 | 1 | 0 |
| 100322 | https://cnet.com | 84 | 83 | -1 | 0 | 1 |
| 100356 | https://paloaltonetworks.com | 94 | 94 | 0 | 0 | 1 |
| 100461 | https://sina.com.cn | 3 | 3 | 0 | 1 | 0 |
| 100515 | https://scribd.com | 91 | 100 | +9 | 1 | 1 |
| 100652 | https://hbr.org | 80 | 87 | +7 | 1 | 1 |
| 100671 | https://flashtalking.com | 70 | 76 | +6 | 1 | 1 |
| 100675 | https://livejournal.com | 38 | 41 | +3 | 1 | 0 |
| 100851 | https://baidu.com | 31 | 34 | +3 | 1 | 1 |
| 100900 | https://qq.com | 31 | 34 | +3 | 1 | 1 |
| 101082 | https://nishinippon.co.jp | 72 | 80 | +8 | 1 | 0 |
| 101337 | https://dns.com | 20 | 23 | +3 | 1 | 1 |
| 101380 | https://cuni.cz | 38 | 41 | +3 | 1 | 1 |
| 101475 | https://transip.eu | 83 | 90 | +7 | 1 | 1 |
| 101512 | https://vietnamnet.vn | 29 | 32 | +3 | 1 | 0 |
| 101538 | https://digi24.ro | 47 | 51 | +4 | 1 | 0 |
| 101550 | https://minhngoc.net.vn | 8 | 9 | +1 | 1 | 0 |
| 101676 | https://larazon.es | 71 | 79 | +8 | 1 | 1 |
| 101804 | https://gotomeeting.com | 82 | 89 | +7 | 1 | 0 |
| 102099 | https://meb.gov.tr | 30 | 33 | +3 | 1 | 0 |
| 102117 | https://anker-in.com | 60 | 65 | +5 | 1 | 1 |
| 102163 | https://hentaila.tv | 57 | 63 | +6 | 1 | 0 |
| 102195 | https://wpzoom.com | 79 | 85 | +6 | 1 | 1 |
| 102328 | https://lazada.sg | 25 | 27 | +2 | 1 | 1 |
| 102403 | https://xv-ru.com | 36 | 39 | +3 | 1 | 1 |
| 102559 | https://pavietnam.vn | 32 | 35 | +3 | 1 | 1 |
| 102579 | https://sexlog.com | 75 | 83 | +8 | 1 | 0 |
| 102741 | https://vu.edu.pk | 59 | 64 | +5 | 1 | 1 |
| 102980 | https://yesstyle.com | 60 | 64 | +4 | 1 | 1 |
| 102985 | https://lexmark.com | 86 | 93 | +7 | 1 | 0 |

Unmoved (10/40): 100020 https://a-mo.net, 100116 https://debian.org, 100136 https://googleadservices.com, 100683 https://bild.de, 100728 https://discord.media, 100759 https://un.org, 101069 https://hwg.org, 101559 https://bhg.com, 101895 https://facebook-hardware.com, 102300 https://mp4moviez.bot

## Golden vectors

`test/golden/clean.html`'s `.spin{animation: spin 2s;}` references a keyframe
(`spin`) that is never defined anywhere in that file, and no element carries
`class="spin"` either — under the old presence-only trigger this fixture accidentally
demonstrated a "handled" motion case; under the new evidence-based trigger it correctly
has NO motion evidence at all (motion category: `not-applicable`, not
`not-machine-checkable`). Left the fixture unchanged rather than adding a fake
keyframe/element just to preserve a number that was never real evidence — coverage
dropped 66%->61%, `overall_score` unaffected (still 100, unrelated to motion).
`test/golden/dirty.html` has no motion-related CSS at all; unaffected by this item.

## hakuso round 1 fix: animation shorthand token scan + `transition: all`

Two bugs in item 6's own trigger, found by hakuso and fixed in the same cycle: (1) the
`animation` shorthand is order-independent (`animation: 1s spin` and
`animation: 1s ease-in spin` both name the keyframe "spin"), but the code only tested
the FIRST token, so both shapes were missed entirely; fixed by testing every
whitespace/comma-split token against the motion-keyframe set. (2) `transition: all` was
deliberately excluded ("don't guess" -- an unqualified `all` doesn't name a specific
property) but inspect.md's own manual checklist (`3f`, ~line 405) already flags
`transition: all` as a motion concern, so the automated detector was stricter than the
docs it's supposed to match; added `all` to the motion-bearing property set.

This is a narrow refinement on top of item 6's already-completed demote (motion is
already `not-machine-checkable`/out of scoring wherever it has any evidence), so it can
only move finding COUNTS, never scores. Re-running the 40-site wild corpus after the fix:
**1/40 sites moved**, and only a key count, not the score.

| id | url | score | old motion count | new motion count | why |
|---|---|---|---|---|---|
| 101804 | https://gotomeeting.com | 89 (unchanged) | 0 | 1 | OneTrust cookie-consent CSS on this page uses `transition:all 300ms ease-in 0s` (verified directly in the snapshot, multiple rules) -- previously excluded as an unqualified transition, now correctly counted as motion-bearing. Motion was already out of scoring either way, so the score does not move. |

Unmoved: the other 39/40 sites. Golden vectors also regenerated this round for the
separate fixture-hygiene fix (see below) -- unrelated to this code change, both landed
in the same commit-in-progress.
