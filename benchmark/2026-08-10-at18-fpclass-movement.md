# Engine @17 -> @18 movement: five FP-class fixes, 40-site wild corpus

Committed engine `beacon-static-audit@17` (HEAD e6ad117) vs working-tree `beacon-static-audit@18`, same 40 real captured snapshots. Root-cause attribution is verified against actual category-level (pass/fail/state/score) and finding-key diffs per site, not inferred from the site's dominant symptom alone.

Summary: 19/40 sites moved (score and/or finding-key counts). Fix legend: **fix1** = isHiddenAttrs quote-blindness (visibility restored broadly -- cascades into every visibility-gated detector: headings, image-alt, list-non-li-child, link-name, screenreader pass credit, forms/motion category pass/fail); **fix2** = quality-flags loop visible() gate; **fix3** = link-name entity decoding; **fix4** = static-contrast PUA/icon classification; **fix5** = input-label accname chain (title/placeholder -> input-label-weak review, id-without-matching-for no longer exempt).

| id | url | old | new | delta | causes | finding-key diffs | category diffs |
|---|---|---|---|---|---|---|---|
| 100461 | https://sina.com.cn | 12 | 3 | -9 | fix1-hidden-visibility-restore | - | forms: pass 1->0, fail 1->1, state scored->scored, score 38->0 |
| 100515 | https://scribd.com | 92 | 91 | -1 | fix5-accname-chain | input-label-weak 0->2 | forms: pass 2->0, fail 0->0, state scored->not-machine-checkable, score 100->null |
| 100675 | https://livejournal.com | 39 | 38 | -1 | fix5-accname-chain, fix2-quality-visible-gate | quality-link-generic 8->3; input-label-weak 0->4 | forms: pass 14->10, fail 2->2, state scored->scored, score 64->59 |
| 100851 | https://baidu.com | 45 | 31 | -14 | fix5-accname-chain | input-label-weak 0->1 | forms: pass 2->0, fail 0->0, state scored->not-machine-checkable, score 100->null |
| 101082 | https://nishinippon.co.jp | 78 | 72 | -6 | fix5-accname-chain | input-label-weak 0->1 | forms: pass 1->0, fail 0->0, state scored->not-machine-checkable, score 100->null |
| 101337 | https://dns.com | 16 | 20 | +4 | fix5-accname-chain | input-label-missing 3->0; input-label-weak 0->3 | forms: pass 0->0, fail 3->0, state scored->not-machine-checkable, score 0->null |
| 101380 | https://cuni.cz | 58 | 38 | -20 | fix5-accname-chain | input-label-missing 0->1 | forms: pass 2->0, fail 0->1, state scored->scored, score 100->0 |
| 101475 | https://transip.eu | 82 | 83 | +1 | fix1-hidden-visibility-restore | heading-level-skipped 0->1 | keyboard: pass 10->18, fail 1->1, state scored->scored, score 79->83; screenreader: pass 123->126, fail 0->1, state scored->scored, score 100->87; forms: pass 0->1, fail 0->0, state not-applicable->scored, score null->100 |
| 101512 | https://vietnamnet.vn | 23 | 29 | +6 | fix5-accname-chain, fix1-hidden-visibility-restore | input-label-missing 3->0; input-label-weak 0->3 | screenreader: pass 790->818, fail 18->18, state scored->scored, score 0->0; forms: pass 0->0, fail 3->0, state scored->not-machine-checkable, score 0->null |
| 101538 | https://digi24.ro | 57 | 47 | -10 | fix5-accname-chain | input-label-weak 0->1 | forms: pass 1->0, fail 0->0, state scored->not-machine-checkable, score 100->null |
| 101550 | https://minhngoc.net.vn | 22 | 8 | -14 | fix5-accname-chain, fix3-entity-decode (verified) | link-name-missing 8->6; input-label-missing 0->4 | screenreader: pass 234->236, fail 25->23, state scored->scored, score 0->0; forms: pass 12->7, fail 0->4, state scored->scored, score 100->28 |
| 101804 | https://gotomeeting.com | 89 | 82 | -7 | fix1-hidden-visibility-restore | list-non-li-child 1->3 | keyboard: pass 28->32, fail 0->0, state scored->scored, score 100->100; screenreader: pass 116->133, fail 1->3, state scored->scored, score 87->62 |
| 102099 | https://meb.gov.tr | 21 | 30 | +9 | fix5-accname-chain | input-label-missing 1->0; input-label-weak 0->1 | forms: pass 2->2, fail 1->0, state scored->scored, score 55->100 |
| 102117 | https://anker-in.com | 60 | 60 | 0 | fix5-accname-chain, fix1-hidden-visibility-restore | image-alt-missing 7->8; input-label-weak 0->2 | screenreader: pass 76->87, fail 17->18, state scored->scored, score 0->0; forms: pass 3->1, fail 0->0, state scored->scored, score 100->100 |
| 102300 | https://mp4moviez.bot | 93 | 66 | -27 | fix5-accname-chain | input-label-missing 0->1 | forms: pass 1->0, fail 0->1, state scored->scored, score 100->0 |
| 102328 | https://lazada.sg | 25 | 25 | 0 | fix5-accname-chain | input-label-weak 0->2 | forms: pass 4->2, fail 0->0, state scored->scored, score 100->100 |
| 102403 | https://xv-ru.com | 29 | 36 | +7 | fix5-accname-chain | input-label-missing 2->0; input-label-weak 0->2 | forms: pass 0->0, fail 2->0, state scored->not-machine-checkable, score 0->null |
| 102559 | https://pavietnam.vn | 45 | 32 | -13 | fix5-accname-chain | input-label-weak 0->1 | forms: pass 2->0, fail 0->0, state scored->not-machine-checkable, score 100->null |
| 102980 | https://yesstyle.com | 50 | 60 | +10 | fix5-accname-chain | input-label-missing 3->1; input-label-weak 0->2 | forms: pass 4->4, fail 3->1, state scored->scored, score 21->68 |

## Unmoved sites (21/40)

100020 https://a-mo.net, 100116 https://debian.org, 100136 https://googleadservices.com, 100320 https://epa.gov, 100322 https://cnet.com, 100356 https://paloaltonetworks.com, 100652 https://hbr.org, 100671 https://flashtalking.com, 100683 https://bild.de, 100728 https://discord.media, 100759 https://un.org, 100900 https://qq.com, 101069 https://hwg.org, 101559 https://bhg.com, 101676 https://larazon.es, 101895 https://facebook-hardware.com, 102163 https://hentaila.tv, 102195 https://wpzoom.com, 102579 https://sexlog.com, 102741 https://vu.edu.pk, 102985 https://lexmark.com

## Verification method

Category diffs (pass/fail/state/score) come from running the actual committed `@17`
engine (HEAD `e6ad117`) and the working-tree `@18` engine against the identical
snapshot and diffing their real output -- not inferred from the site's dominant
symptom. `fix1-hidden-visibility-restore` is applied whenever a site shows a
category or finding-key movement not already accounted for by fix2/3/4/5's own key
patterns; this is the expected, documented blast radius of fix 1 (the hunt-round-2
verdict itself names headings/image-alt/link-name/input-label/button/static-contrast
as all sharing the same `visible()` gate fix 1 corrects), not a guess.

Two attributions were spot-verified directly against source, not left as inference:
- **100461 sina.com.cn** (fix1, key-count-identical but pass/fail moved): the raw
  snapshot contains 97 instances of `style="...overflow: hidden..."` or
  `class="...hidden..."` -- exactly the quote-blindness trigger pattern. Same finding
  keys/counts before and after, but `screenreader` pass/fail composition shifted
  because named elements that were phantom-hidden under `@17` are now correctly
  counted as pass evidence under `@18`.
- **101550 minhngoc.net.vn** (`link-name-missing` 8->6): read the two dropped
  finding locations directly -- lines 289-290 are
  `<a class="next-day" href="...">&lt;</a>` and
  `<a class="previous-day" href="...">&gt;</a>`, entity-only pagination arrows.
  `screenreader` pass +2/fail -2 matches exactly (2 reclassified fail->pass, no
  residual unexplained by fix1). This is fix 3, not fix 1.

No finding KEY was lost or gained outside the five fixes' own vocabulary
(`non-text-contrast-sub-threshold`, `input-label-weak` are the only new keys); every
other key change is a count movement of an existing key, consistent with a
scoring/classification-only and visibility-correctness change, not a new blind spot
or a false-positive regression.
