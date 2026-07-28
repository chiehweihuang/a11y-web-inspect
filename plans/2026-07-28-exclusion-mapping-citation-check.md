# Exclusion mapping citation check - VALIDATION.md "who this scan's silence leaves out"

Verifier: research agent (subagent). Source checked: W3C "Understanding WCAG 2.2"
(https://www.w3.org/WAI/WCAG22/Understanding/), Intent + Benefits sections, one page
per success criterion, retrieved 2026-07-28. Each W3C page was read via a
fetch-and-summarize tool, not raw HTML diffed byte-for-byte - treat quoted text
below as accurate paraphrase/quote of the source page as returned by that tool, not
a guaranteed verbatim copy. Where a finding is load-bearing (a WRONG verdict), a
second, more targeted fetch was made against the same page before concluding.

Verdict legend: ACCURATE (source supports the row's "who," no material
omission) - IMPRECISE (row's primary claim is directionally right but omits or
softens something the source explicitly names) - WRONG (row names a group the
source's own Intent/Benefits section does not name for that criterion, and/or omits
the primary group the source leads with).

---

## Group B - 7 criteria marked "machine-testable in principle: NO" (full verify)

| SC | VALIDATION.md "who" claim | Verdict | W3C source | Intent/Benefits quote |
|---|---|---|---|---|
| 1.2.1 Audio-only/Video-only (Prerecorded) | "Deaf and hard-of-hearing users, who get no transcript of audio-only content, and blind and low-vision users, who get no description of what a video-only presentation shows" | ACCURATE (minor omission) | https://www.w3.org/WAI/WCAG22/Understanding/audio-only-and-video-only-prerecorded.html | "make information conveyed by prerecorded audio-only and prerecorded video-only content available to all users." Matches the standard technique split (transcript for audio-only to deaf/HoH; alternative for video-only to blind/low-vision). Source also credits parallel text presentation as helping "those with cognitive, language and learning disabilities" - the row doesn't mention this third group; doesn't invalidate the row, just incomplete. |
| 1.2.4 Captions (Live) | "Deaf and hard-of-hearing viewers of live streams, webinars, and broadcasts" | ACCURATE | https://www.w3.org/WAI/WCAG22/Understanding/captions-live.html | "enable people who are deaf or hard of hearing to watch real-time presentations." Exact match. |
| 1.3.3 Sensory Characteristics | "Blind and low-vision users who cannot perceive a shape/location-only reference, and users who cannot rely on a sound-only cue" | IMPRECISE | https://www.w3.org/WAI/WCAG22/Understanding/sensory-characteristics.html | Benefits section, verified on a second targeted fetch, names only: "People who are blind and people who have low vision may not be able to understand instructions if they rely only on a description of the shape and/or location of content." The Benefits section does not mention deaf/hard-of-hearing/deafblind users at all for the sound-cue half of the SC. The row's first half (shape/location, blind/low-vision) is accurate; the second half ("users who cannot rely on a sound-only cue") is the row author's own inference from the SC's plain text (which does list "sound" as a prohibited sole cue), not something the source's Benefits section actually states or attributes to a population. Not wrong, but unsourced - should either cite the SC text directly for that clause or drop the implied population claim. |
| 2.5.1 Pointer Gestures | "People with motor impairments, including many single-finger-only touch and switch-device users, who cannot perform a pinch, multi-finger, or path-based gesture" | ACCURATE | https://www.w3.org/WAI/WCAG22/Understanding/pointer-gestures.html | Benefits: "Users who cannot (accurately) perform path-based pointer gestures... Users who cannot perform multi-pointer gestures... [use] an alternative input such as a head pointer." Row correctly excludes the secondary cognitive-disabilities benefit (which is about not understanding custom gestures, a different mechanism) rather than folding it in. |
| 2.5.4 Motion Actuation | "People with mobility impairments who cannot tilt or shake a device, or who trigger a motion-based control by accident with no way to turn it off, and people whose device is mounted in a fixed position" | ACCURATE | https://www.w3.org/WAI/WCAG22/Understanding/motion-actuation.html | "users with disabilities are not able to operate these device sensors ... because the device is on a fixed mount (perhaps a wheelchair) or due to motor impairments" plus accidental activation from tremor. Exact match. |
| 3.3.3 Error Suggestion | "People with cognitive and learning disabilities who know something is wrong but have no idea what value would be accepted, and screen-reader users who need that same information stated in text" | ACCURATE | https://www.w3.org/WAI/WCAG22/Understanding/error-suggestion.html | "Persons with cognitive limitations" and "People with visual disabilities" who have difficulty determining how to correct errors. "Screen-reader users" is a fair, specific instantiation of "visual disabilities" in the text-based-message context. |
| 3.3.4 Error Prevention (Legal, Financial, Data) | "People with cognitive disabilities most exposed to a binding commitment or deletion submitted by mistake with no chance to review or undo it" | IMPRECISE | https://www.w3.org/WAI/WCAG22/Understanding/error-prevention-legal-financial-data.html | Source: "People with reading disabilities may transpose numbers and letters, and those with motor disabilities may hit keys by mistake." The row generalizes to "cognitive disabilities" and entirely drops the motor-disabilities group the source names as equally prone to the mistakes this SC guards against (hitting the wrong key/button). Correction: name reading disabilities and motor disabilities specifically, not a blanket "cognitive disabilities." |

Automatability check (Group B): no counter-evidence found. Every sufficient
technique W3C lists for these 7 SCs (e.g. G164/G98/G99/G168 for 3.3.4, G151/G158 for
1.2.1) is a procedural/workflow or authoring-judgment technique, not a
markup/structure pattern a scanner reads off the DOM - consistent with why axe-core,
Lighthouse, and WAVE all likewise carry zero automated rules for these 7 SCs. The
doc's "boundary of automation, not a Beacon gap" framing holds up.

---

## Persona Spectrum examples (3 criteria, full verify)

| SC | Claim | Verdict | Notes |
|---|---|---|---|
| 2.5.7 Dragging Movements | Row "who" (exclusion table): "People with motor impairments, tremor, or single-switch access..." - ACCURATE, matches source directly. Persona-spectrum prose frames the SAME SC as "one hand available" (congenital limb difference/amputation, cast, holding a baby). | IMPRECISE (persona-spectrum framing only) | Second fetch confirmed https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html Intent + Benefits never mention one hand, both hands, single-arm use, or a prosthetic - the source's own axis is precision/dexterity ("cannot perform dragging movements in a precise manner") plus compatibility with adapted single-pointer devices (trackball, head pointer, eye-gaze, speech-controlled mouse emulator). "One hand available" is a defensible situational extension (reduced dexterity in the one free hand while holding a device unsupported does degrade drag precision) but it is not the source's own framing and should not read as if quoted from WCAG. Recommend rewording the example to lead with precision/dexterity, with one-handed scenarios as an illustration rather than the header. |
| 2.2.1 Timing Adjustable | Row "who": "People with cognitive, learning, or motor disabilities, and screen-reader users navigating item-by-item, who need more time..." | IMPRECISE | https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html Intent names blindness, low vision, dexterity impairments, cognitive limitations, and explicitly "Deaf users communicating in sign language may need more time when interpreting audio content." The row omits this named group entirely. Correction: add Deaf/sign-language users needing extra time to interpret audio/video before a timer expires. (The persona-spectrum prose itself, covering only the permanent/temporary/situational triad for one illustrative case, is fine - it explicitly disclaims exhaustiveness.) |
| 1.2.2 Captions (Prerecorded) | Row "who": "Deaf and hard-of-hearing viewers of prerecorded audio/video content" | ACCURATE | https://www.w3.org/WAI/WCAG22/Understanding/captions-prerecorded.html: "enable people who are deaf or hard of hearing to watch synchronized media presentations." Exact match. Persona-spectrum "sound off on a train" situational example is a standard, well-established illustration of this SC, not a fabrication. |

---

## Group A sample - 20 of 46 criteria checked (target was >=15; stopped adding new criteria once the error rate below was already established, per the ~1-in-10 stop rule)

| SC | Claim (abbrev.) | Verdict | W3C source | Note |
|---|---|---|---|---|
| 1.3.1 Info and Relationships | "AT users who cannot tell which header a table cell belongs to... reading order doesn't match visual layout" | ACCURATE | https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html | Matches "screen reader user will hear that the item is a link" / programmatic-relationship framing. Correctly kept separate from 2.4.6 (see below) - no confusion found. |
| 1.4.1 Use of Color | "Colorblind users who cannot distinguish a cue conveyed by color alone" | IMPRECISE | https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html | Source names 4 groups: color deficiencies, partial sight/limited color vision, older users, and monochrome/limited-color-display users. Row's primary group (colorblind approx color deficiency) is right but drops the other 3 named groups, notably older users and monochrome-display users. |
| 1.4.11 Non-text Contrast | "Low-vision users who cannot locate/distinguish a control boundary or state" | ACCURATE | https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html | "distinguishable by people with moderately low vision... may be completely missed by people with a visual impairment." Correctly kept distinct from 1.4.1 (contrast vs. color-meaning) - no confusion found. |
| 1.2.3 Audio Description or Media Alternative | "Blind and low-vision viewers who miss visual-only information" | ACCURATE | https://www.w3.org/WAI/WCAG22/Understanding/audio-description-or-media-alternative-prerecorded.html | Exact match: "provide people who are blind or visually impaired access to the visual information." |
| 1.2.5 Audio Description (Prerecorded) | "Same population as 1.2.3, at the stronger AA level" | ACCURATE | https://www.w3.org/WAI/WCAG22/Understanding/audio-description-prerecorded.html | Same beneficiary population confirmed; AA does remove the full-text-alternative option and mandate audio description - row's characterization of why AA is stronger is a fair paraphrase, not verbatim W3C wording. |
| 1.3.5 Identify Input Purpose | "Cognitive disabilities who rely on autofill/personalized symbols... motor impairments avoiding re-typing" | ACCURATE | https://www.w3.org/WAI/WCAG22/Understanding/identify-input-purpose.html | Benefits section: memory-related disabilities, executive-function disabilities, cerebral palsy/stroke/motor neuron disease, motor impairments - both named groups in the row are genuinely in the source. |
| 1.4.12 Text Spacing | "Low vision or dyslexia who override spacing... clipped/overlapping content" | ACCURATE | https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html | Matches "people with low vision who require increased space" and "people with dyslexia may increase space." Source's third group (cognitive disabilities, benefiting from author-provided white space) doesn't apply to the row's specific override-behavior framing - reasonable to omit. |
| 2.1.4 Character Key Shortcuts | "Speech-input users and screen-reader users whose commands collide with an un-remappable single-key shortcut" | WRONG | https://www.w3.org/WAI/WCAG22/Understanding/character-key-shortcuts.html | Confirmed on a second, targeted fetch: Benefits section names speech users and keyboard-only users who have dexterity challenges, plus users with cognitive disabilities (remapping) - it does not mention screen-reader users or screen-reader quick-nav keys anywhere. The row substitutes screen-reader users for the source's actual second named group (dexterity-impaired keyboard users), which it omits entirely. Correction: speech-input users, and keyboard-only users prone to accidentally triggering keys due to dexterity challenges. |
| 2.2.2 Pause, Stop, Hide | "Attention-related cognitive disabilities, and screen-reader/low-vision users" | ACCURATE | https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html | Matches attention deficit disorders and screen-reader-conflict language; source's separately-named low literacy, reading and intellectual disabilities group is omitted but doesn't contradict the row. |
| 2.4.1 Bypass Blocks | "Keyboard and screen-reader users forced to tab/listen through repeated navigation" | ACCURATE | https://www.w3.org/WAI/WCAG22/Understanding/bypass-blocks.html | "people who navigate sequentially through content" is exactly keyboard plus screen-reader users. |
| 2.4.5 Multiple Ways | "Cognitive disabilities and screen-reader users who need more than one way to find a page" | ACCURATE | https://www.w3.org/WAI/WCAG22/Understanding/multiple-ways.html | Benefits: visual-impairment/screen-magnifier/screen-reader users prefer search over scrolling a nav bar; cognitive-disability users prefer a site map. Both row groups genuinely named. |
| 2.4.6 Headings and Labels | Row says screen-reader users scanning a page by its list of headings get an uninformative heading | WRONG | https://www.w3.org/WAI/WCAG22/Understanding/headings-and-labels.html | Benefits section, confirmed verbatim order: (1) users who have disabilities that make reading slow, (2) people with limited short-term memory, (3) people who use screen readers. The row leads with the group the source lists third, and omits the two groups the source lists first (reading-disability and short-term-memory populations) - the exact cognitive-load-misattribution risk this check was commissioned to catch. Correction: lead with people whose disabilities make reading slow, and people with limited short-term memory, with screen-reader users as an additional, not sole, named group. Row does correctly separate 2.4.6 (descriptiveness) from 1.3.1 (hierarchy/existence) - confirmed by the source's own statement that this success criterion does not require headings or labels, i.e. it only governs descriptiveness where present. |
| 2.5.3 Label in Name | "Speech-input users who activate a control by speaking its visible label" | ACCURATE | https://www.w3.org/WAI/WCAG22/Understanding/label-in-name.html | Exact match, speech-input users are the source's first and headline group. |
| 3.1.2 Language of Parts | "Screen-reader users who hear a foreign-language word/passage mispronounced" | ACCURATE | https://www.w3.org/WAI/WCAG22/Understanding/language-of-parts.html | "Screen readers can use the pronunciation rules of the language of the text" - exact mechanism match; correctly kept distinct from 3.1.1 (page-level language), no confusion found. |
| 3.2.3 Consistent Navigation | "People with cognitive disabilities and repeat visitors who must re-learn navigation" | WRONG | https://www.w3.org/WAI/WCAG22/Understanding/consistent-navigation.html | Source names, in order: low-vision users using screen magnification (rely on visual cues/page boundaries), blind users who navigate sequentially (rely on consistent source order), and sighted users relying on spatial memory. Cognitive disabilities appears nowhere in 3.2.3's own Intent/Benefits - that framing belongs to the neighboring criterion 3.2.4 (see next row) and looks like cross-contamination between the two. Correction: lead with low-vision/screen-magnifier users and blind/screen-reader users navigating sequentially. |
| 3.2.4 Consistent Identification | "Same population as 3.2.3, for icon/control identity across pages" | IMPRECISE | https://www.w3.org/WAI/WCAG22/Understanding/consistent-identification.html | Source: people who use screen readers (rely on familiarity with repeated functions) and people with cognitive limitations (increased cognitive load from inconsistent labels) are 3.2.4's own named groups - cognitive limitations is genuinely correct here, but it arrived by inheriting 3.2.3's error rather than being sourced to 3.2.4 directly, and the row's explicit screen-reader-users naming is missing. Not wrong on content, wrong on justification/completeness - fold in people who use screen readers explicitly and stop citing 3.2.3 as the basis. |
| 3.3.7 Redundant Entry | "Cognitive or motor disabilities forced to re-enter information" | ACCURATE | https://www.w3.org/WAI/WCAG22/Understanding/redundant-entry.html | Benefits section, confirmed: cognitive disabilities, memory/recall difficulties, and users with mobility impairments, for example using switch control or voice input - all three row-adjacent claims are genuinely sourced. |

---


## Verdict counts and conclusion

Counting each Group A row once (17 rows in the table above, plus the 3
persona-spectrum criteria 2.5.7 / 2.2.1 / 1.2.2, which are also Group A criteria and
are graded here on their exclusion-table "who" row, separately from the
persona-spectrum prose):

- Group B (7/7 checked): 5 ACCURATE, 2 IMPRECISE, 0 WRONG.
- Group A (20/46 checked): 14 ACCURATE, 3 IMPRECISE, 3 WRONG.
- Persona-spectrum prose specifically (3/3, a distinct check from the row verdicts above): 2 ACCURATE (2.2.1, 1.2.2), 1 IMPRECISE (2.5.7's one-hand framing substitutes hand-count for the source's actual precision/dexterity axis).

Group A error rate (WRONG / checked) = 3/20 = 15%, exceeding the ~1-in-10 stop
threshold. Per the task's own instruction, this means: do not extrapolate the
remaining 26 Group A rows from this sample - they need a full row-by-row pass,
not a coverage estimate. Two of the three WRONG findings (2.4.6, 3.2.3) share a
specific, checkable failure signature: attributing a neighboring or
similarly-themed criterion's population (or a generic "screen-reader users" /
"cognitive load" default) instead of the specific source page's own named group.
The third (2.1.4) substitutes screen-reader users for the source's actual
dexterity-impaired-keyboard-user population. Future passes should specifically
cross-check pairs of adjacent/similarly-named criteria (3.2.3 vs 3.2.4, 2.4.6 vs
1.3.1, 1.4.1 vs 1.4.11, 3.1.1 vs 3.1.2) against each other's own sources, since
that is where the mix-ups occurred.

Automatability check (Group B's "no tool can decide this" claim): holds up. No W3C
sufficient technique found for any of the 7 Group B criteria that a static/dynamic
scanner could execute without human judgment of meaning.

---

# Second pass: remaining 26 Group A rows (full pass, per team-lead request 2026-07-28)

All 46 Group A criteria are now checked. Same verdict legend as above.

| SC | Claim (abbrev.) | Verdict | W3C source | Note |
|---|---|---|---|---|
| 1.1.1 Non-text Content | "Blind and low-vision screen-reader/braille-display users - left out when an image's meaning lives in CSS background/SVG/canvas/embed with no text alternative" | ACCURATE | https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html | Row is scoped to the image-alternative failure mode specifically; source's deaf/hard-of-hearing/audio groups belong to the audio-alternative failure mode, correctly not claimed here. Blind/low-vision/deaf-blind (braille) match the source's photo-understanding and braille-reading groups. |
| 1.3.2 Meaningful Sequence | "Screen-reader and other AT users who hear content read in an order that doesn't match the sighted reading order" | ACCURATE | https://www.w3.org/WAI/WCAG22/Understanding/meaningful-sequence.html | "may help people who rely on assistive technologies that read content aloud" - direct match. |
| 1.3.4 Orientation | "People with mobility impairments using a device mounted in a fixed orientation (wheelchair or bed mount)" | ACCURATE | https://www.w3.org/WAI/WCAG22/Understanding/orientation.html | Source's own example: "devices mounted in a fixed orientation (e.g. on the arm of a power wheelchair)." Exact match. |
| 1.4.2 Audio Control | "Screen-reader users, whose access to their own AT's speech is drowned out by audio that starts playing with no warning" | ACCURATE | https://www.w3.org/WAI/WCAG22/Understanding/audio-control.html | "Individuals who use screen reading software can find it hard to hear the speech output if there is other audio playing." Exact match. |
| 1.4.3 Contrast (Minimum) | "Low-vision readers of exactly the content classes never sampled" | ACCURATE (minor omission) | https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html | Matches "moderately low vision" (primary named group); omits the co-named "color vision deficiency" group, whose members also experience reduced effective contrast - minor, not disqualifying. |
| 1.4.4 Resize Text | "Low-vision users who zoom to 200% and hit horizontally-scrolling or clipped/overlapping text" | ACCURATE | https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html | "people with milder visual impairments... people with low vision." Direct match. |
| 1.4.5 Images of Text | "Low-vision users who need to resize, recolor, or otherwise restyle text, and cannot when the text is a picture" | IMPRECISE | https://www.w3.org/WAI/WCAG22/Understanding/images-of-text.html | Source names THREE distinct groups for three distinct restyling needs: "people with low vision" (font/size/color), "people with visual tracking problems" (line spacing/alignment), and "people with cognitive disabilities that affect reading" (restyle to suit needs) - the row folds all three under "low-vision users," which is not the same population as the other two. |
| 1.4.10 Reflow | "Low-vision users at high zoom or on narrow viewports who hit two-dimensional scrolling" | ACCURATE | https://www.w3.org/WAI/WCAG22/Understanding/reflow.html | "users who need bigger text... people with low vision." Direct match. |
| 1.4.13 Content on Hover or Focus | "Screen-magnifier users... and people with tremor who trigger a hover tooltip by accident" | ACCURATE | https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html | Screen-magnifier users confirmed verbatim ("users with low vision who view content under magnification"). Source's own term is "low pointer accuracy," not "tremor" by name, but tremor is a standard cause of low pointer accuracy - reasonable instantiation, not a fabrication. |
| 2.1.1 Keyboard | "Keyboard-only and switch-device users who hit a custom control this scan reports as fine because its detector recognizes only one authoring pattern" | ACCURATE | https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html | Source names blind users (can't use mice), low-vision users (trouble tracking a pointer), and users with hand tremors (mouse difficulty) - all reasons keyboard operability matters; row's "keyboard-only and switch-device users" is a fair umbrella term for that union. |
| 2.1.2 No Keyboard Trap | "Keyboard-only users trapped inside a component (a modal, a rich-text editor, an embedded widget) with no keyboard path back out" | ACCURATE | https://www.w3.org/WAI/WCAG22/Understanding/no-keyboard-trap.html | "People who rely on a keyboard... including people who are blind and people with physical disabilities." Direct match. |
| 2.3.1 Three Flashes or Below Threshold | "People with photosensitive seizure disorders, for whom flashing content above the threshold is a physical trigger, not an inconvenience" | ACCURATE | https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html | "individuals who have photosensitive seizure disorders... photosensitive epilepsy." Exact match. |
| 2.4.3 Focus Order | "Keyboard users whose Tab order jumps in a sequence that doesn't match the visual or reading order, losing track of where focus is" | ACCURATE | https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html | Source names 4 groups (mobility impairments, reading-disability, visual impairments, screen-magnifier users at high magnification) under the umbrella "keyboard users who navigate sequentially" - row's generic "keyboard users" is a fair compression, though naming screen-magnifier/visual-impairment users specifically (the group most literally "losing track of where focus is") would be a sharper match. |
| 2.4.4 Link Purpose (In Context) | "Screen-reader users navigating a page's pulled-out links list who land on link text that's distinct-looking but still uninformative out of context" | ACCURATE | https://www.w3.org/WAI/WCAG22/Understanding/link-purpose-in-context.html | Source's own Benefits list leads with motion impairment (skip-link cost) before visual disabilities/cognitive limitations; row's AT/screen-reader framing matches the source's "visual disabilities" group and is the standard, well-established justification for this SC (the AT "list links" feature showing link text out of context) - legitimate secondary framing, not fabricated. |
| 2.4.7 Focus Visible | "Keyboard-only users (sighted, low-vision, or with certain motor/cognitive conditions) whose focus indicator is technically present but too faint or thin to see, or removed by JavaScript or a stylesheet" | ACCURATE | https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html | "anyone who relies on the keyboard"; plus attention, short-term-memory, and executive-process limitations. Comprehensive match. |
| 2.4.11 Focus Not Obscured (Minimum) | "Keyboard and screen-magnifier users who tab to a control hidden behind a sticky header, cookie banner, or overlay" | ACCURATE | https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html | "sighted users who rely on a keyboard"; low/limited vision; attention/short-term-memory/executive-process limitations. Direct match. |
| 2.5.2 Pointer Cancellation | "People with tremor or limited fine motor control who press the wrong target and need to slide off or release without triggering it" | IMPRECISE | https://www.w3.org/WAI/WCAG22/Understanding/pointer-cancellation.html | Source's Benefits section names THREE co-equal groups - "people with visual disabilities, cognitive limitations, and motor impairments" - all benefiting from reduced accidental activation. The row picks only the motor-impairment group and drops the other two, which the source weights equally. |
| 2.5.8 Target Size (Minimum) | "People with limited fine motor control (tremor, reduced dexterity) hitting a target this scan mis-scores in either direction" | ACCURATE | https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html | Source's extensive list (dexterity limitations, tremor, spasticity, quadriplegia, one-handed/large-finger touchscreen use, shaking environments) is overwhelmingly a fine-motor-control/dexterity list; row's summary is a fair compression. |
| 3.2.1 On Focus | "People with visual or cognitive disabilities disoriented by an unannounced context change (new window, auto-submit) triggered merely by an element receiving focus" | IMPRECISE | https://www.w3.org/WAI/WCAG22/Understanding/on-focus.html | Source's Benefits section names THREE co-equal groups: "people with visual disabilities, cognitive limitations, and motor impairments." The row drops motor impairments entirely - motor-impaired users are equally disoriented by an unexpected context change (losing their place, having to re-navigate). |
| 3.2.2 On Input | "The same population as 3.2.1, for context changes triggered by selecting an option or typing" | ACCURATE (fragile linkage, see note) | https://www.w3.org/WAI/WCAG22/Understanding/on-input.html | 3.2.2's own Benefits section names only "users with visual disabilities or cognitive limitations" - it does NOT name motor impairments, unlike 3.2.1. The row's current wording (visual + cognitive, inherited from 3.2.1) happens to match 3.2.2's own source correctly. Caution: if 3.2.1's row is corrected to add motor impairments (per the finding above), do NOT mechanically copy that addition onto 3.2.2 - the two SCs' named populations are not identical, despite the "same population" framing. |
| 3.2.6 Consistent Help | "People with cognitive disabilities who rely on finding help (contact, chat, FAQ) in the same relative place on every page" | ACCURATE | https://www.w3.org/WAI/WCAG22/Understanding/consistent-help.html | Confirmed: the page carries a dedicated "Support for people with cognitive and learning disabilities" subsection, and the Intent section is framed around "difficulty locating help." Cross-checked against 3.2.3/3.2.4 (below) for contamination: no overlap found - 3.2.6's own cognitive-disability framing is independently correct and distinct from 3.2.3's actual population (low-vision/blind/spatial-memory, see first-pass table) and 3.2.4's (screen-reader users/cognitive limitations). |
| 3.3.1 Error Identification | "Screen-reader users who submit a form and get no text-based indication of which field failed or why, and people with cognitive disabilities who can't tell what needs fixing" | ACCURATE | https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html | Source names blind/low-vision/color-vision-deficiency (visual tier) and cognitive/language/learning disabilities (cognitive tier); row compresses the visual tier into "screen-reader users," a reasonable single instantiation, and matches the cognitive tier directly. |
| 3.3.2 Labels or Instructions | "Screen-reader and other AT users on an unlabeled select or textarea, or on any input this scan assumed was labeled purely because it has an id, with no label actually pointing at it" | ACCURATE (see mapping note) | https://www.w3.org/WAI/WCAG22/Understanding/labels-or-instructions.html | For the failure mode as described (missing programmatic label association), AT users are correctly named as the affected population. Flag, out of this check's formal scope: 3.3.2's own Intent/Benefits is centered on providing labels/instructions "particularly for people with cognitive, language, and learning disabilities" to enter data correctly - a comprehension concern, not primarily an AT-association concern. The programmatic-association failure mode this row describes (a label existing but not `<label for>`-associated) reads as more native to 1.3.1 Info and Relationships or 4.1.2 Name, Role, Value. This is a detector-to-SC mapping question, not a "who" citation error, and is outside this check's scope - flagging for the team to decide whether the mapping itself needs revisiting. |
| 3.3.8 Accessible Authentication (Minimum) | "People with cognitive disabilities blocked by an in-house puzzle or CAPTCHA that isn't one of the handful of branded services this scan recognizes" | ACCURATE | https://www.w3.org/WAI/WCAG22/Understanding/accessible-authentication-minimum.html | "people with certain cognitive disabilities... memory... dyslexia... dyscalculia... perception-processing limitations" - all filed under cognitive disabilities per WCAG's own framing. Direct match. |
| 4.1.2 Name, Role, Value | "AT users (screen readers, switch access, voice control) operating a custom widget whose ARIA is present but wrong, incomplete, or absent" | ACCURATE | https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html | "screen readers, screen magnifiers, and speech recognition software" confirmed; screen readers and voice control (speech recognition) match directly, "switch access" is a reasonable addition (switch-scanning software relies on the same accessibility-tree data) even though the source's own second example is screen magnifiers rather than switch access. |
| 4.1.3 Status Messages | "Screen-reader users who miss a status update (an item added to a cart, a background error, a loading state) because the page never announces the DOM change a sighted user would simply see" | ACCURATE | https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html | "blind and low vision users" (screen readers) confirmed as the primary named group; source's secondary group ("users with cognitive disabilities," personalization angle) is omitted but doesn't contradict the row. |

---

## Second-pass verdict counts (26 rows)

- ACCURATE: 22 (1.1.1, 1.3.2, 1.3.4, 1.4.2, 1.4.3, 1.4.4, 1.4.10, 1.4.13, 2.1.1, 2.1.2, 2.3.1, 2.4.3, 2.4.4, 2.4.7, 2.4.11, 2.5.8, 3.2.2, 3.2.6, 3.3.1, 3.3.2, 3.3.8, 4.1.2, 4.1.3)
- IMPRECISE: 4 (1.4.5, 2.5.2, 3.2.1, and see fragile-linkage note on 3.2.2 - counted ACCURATE, not IMPRECISE, since its own source supports it as written)
- WRONG: 0

No new criteria-confusion contamination found in the specific adjacent pairs re-checked
(3.2.3/3.2.4 already corrected in the first pass; 2.4.6/1.3.1 already correct; 1.4.1/1.4.11
already correct). One new adjacent-pair note surfaced: 3.2.1/3.2.2 share near-identical
"who" language in VALIDATION.md ("same population as 3.2.1") but their own W3C sources are
NOT identical - 3.2.1 additionally implies motor impairments, 3.2.2 does not. Also flagged
(out of formal verdict, a possible SC-mapping question rather than a "who" error): 3.3.2's
detector-described failure mode (missing `<label for>` association) reads as more native to
1.3.1/4.1.2 than to 3.3.2's own comprehension-centered Intent.

## Combined totals - all 46 Group A rows (both passes)

- ACCURATE: 36 (14 + 22)
- IMPRECISE: 7 (3 + 4)
- WRONG: 3 (3 + 0) - all found in the first pass: 2.1.4, 2.4.6, 3.2.3

Group A error rate: WRONG 3/46 = 6.5%. Non-accurate (IMPRECISE + WRONG) 10/46 = 21.7%.

## Combined totals - all 53 rows (46 Group A + 7 Group B)

- ACCURATE: 41
- IMPRECISE: 9
- WRONG: 3

Overall WRONG rate: 3/53 = 5.7%. Overall non-accurate rate: 12/53 = 22.6%.

---

## Correction list - verbatim replacement wording for every IMPRECISE/WRONG row (both passes)

Twelve rows need a wording fix. Each entry gives the exact current text, the exact
replacement text (drop-in for VALIDATION.md's "Who that leaves out" column, or the
persona-spectrum prose for the one row in that section), and the source URL. Usable
directly without re-reading W3C.

### 1. 1.3.3 Sensory Characteristics (Group B)

Current: "Blind and low-vision users who cannot perceive a shape/location-only reference (click the round button on the right), and users who cannot rely on a sound-only cue"

Replacement: "Blind and low-vision users who cannot perceive a shape- or location-only reference (click the round button on the right). WCAG's own Understanding document names no specific population for the sound-only-cue half of this criterion - that clause rests on the SC's own text, not a sourced population claim."

Source: https://www.w3.org/WAI/WCAG22/Understanding/sensory-characteristics.html - "People who are blind and people who have low vision may not be able to understand instructions if they rely only on a description of the shape and/or location of content."

### 2. 3.3.4 Error Prevention (Legal, Financial, Data) (Group B)

Current: "People with cognitive disabilities most exposed to a binding commitment or deletion submitted by mistake with no chance to review or undo it"

Replacement: "People with reading disabilities, who may transpose numbers and letters, and people with motor disabilities, who may hit the wrong key or button by mistake - both most exposed to a binding commitment or deletion submitted by mistake with no chance to review or undo it"

Source: https://www.w3.org/WAI/WCAG22/Understanding/error-prevention-legal-financial-data.html - "People with reading disabilities may transpose numbers and letters, and those with motor disabilities may hit keys by mistake."

### 3. 2.5.7 Dragging Movements - Persona Spectrum example #1 (prose, not the exclusion-table row, which is already accurate)

Current headline: "One hand available (2.5.7, Dragging Movements - Group A, NONE)."

Replacement headline and body: "Limited precision in a sustained drag gesture (2.5.7, Dragging Movements - Group A, NONE). Permanent: someone with a tremor or a condition affecting fine motor control. Temporary: a wrist injury or a cast limiting precise, sustained pointer movement. Situational: someone operating a device one-handed and unsupported (holding a baby, a bag, a handrail), whose free hand loses the steadiness a supported grip would give it, trying to reorder a list or operate a slider. All three need a tap/click alternative to a drag gesture; none of the three get one from a detector this scan doesn't have."

Source: https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html - "Some people cannot perform dragging movements in a precise manner. Others use a specialized or adapted input device, such as a trackball, head pointer, eye-gaze system, or speech-controlled mouse emulator."

### 4. 2.4.6 Headings and Labels

Current: "Screen-reader users scanning a page by its list of headings, who get one like Section 3 that tells them nothing about what follows"

Replacement: "People whose disabilities make reading slow, and people with limited short-term memory, who rely on a descriptive heading to know what a section contains without reading it in full - and screen-reader users scanning a page by its list of headings, who get one like Section 3 that tells them nothing about what follows"

Source: https://www.w3.org/WAI/WCAG22/Understanding/headings-and-labels.html - Benefits, verbatim order: "users who have disabilities that make reading slow," "people with limited short-term memory," "people who use screen readers."

### 5. 3.2.3 Consistent Navigation

Current: "People with cognitive disabilities and repeat visitors who must re-learn navigation because its relative order changes from page to page - invisible to a single-page audit by construction"

Replacement: "Low-vision users who use screen magnification and rely on visual cues and page boundaries to locate repeated content quickly, and blind screen-reader users who navigate sequentially and rely on a consistent source order - both lose that shortcut when navigation's relative order changes from page to page, invisible to a single-page audit by construction"

Source: https://www.w3.org/WAI/WCAG22/Understanding/consistent-navigation.html

### 6. 2.1.4 Character Key Shortcuts

Current: "Speech-input users and screen-reader users whose own single-letter navigation or dictation commands collide with a page's un-remappable single-key shortcut"

Replacement: "Speech-input users, whose dictation is interpreted as strings of letters and can accidentally fire single-key shortcuts, and keyboard-only users with dexterity challenges who are prone to hitting keys by accident, on a page whose single-key shortcut cannot be turned off or remapped"

Source: https://www.w3.org/WAI/WCAG22/Understanding/character-key-shortcuts.html - "inappropriate and frustrating for speech input users, whose dictation is interpreted as strings of letters, and for keyboard users who are prone to accidentally hit keys."

### 7. 1.4.1 Use of Color

Current: "Colorblind users who cannot distinguish a cue conveyed by color alone (a red required-field mark, a link the same color as body text with no underline)"

Replacement: "Colorblind users, people with low vision or partial sight, older users experiencing age-related color-vision decline, and users on monochrome or limited-color displays - anyone who cannot distinguish a cue conveyed by color alone (a red required-field mark, a link the same color as body text with no underline)"

Source: https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html

### 8. 3.2.4 Consistent Identification

Current: "Same population as 3.2.3, for a control or icon whose identity (label, icon) changes across pages for the same function"

Replacement: "People who use screen readers, who rely on familiarity with a consistently-labeled function across pages, and people with cognitive limitations, for whom a control or icon whose identity (label, icon) changes across pages for the same function increases cognitive load"

Source: https://www.w3.org/WAI/WCAG22/Understanding/consistent-identification.html

### 9. 2.2.1 Timing Adjustable

Current: "People with cognitive, learning, or motor disabilities, and screen-reader users navigating item-by-item, who need more time than a fixed session or activity timer allows and have no way to extend it"

Replacement: "People with cognitive, learning, or motor disabilities; blind and low-vision users navigating item-by-item; and Deaf users communicating in sign language, who may need more time to interpret audio content - all needing more time than a fixed session or activity timer allows and having no way to extend it"

Source: https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html - "People with disabilities such as blindness, low vision, dexterity impairments, and cognitive limitations may require more time... Deaf users communicating in sign language may need more time when interpreting audio content."

### 10. 1.4.5 Images of Text

Current: "Low-vision users who need to resize, recolor, or otherwise restyle text, and cannot when the text is a picture"

Replacement: "Low-vision users who need to resize or recolor text, people with visual tracking problems who need to change its line spacing or alignment, and people with cognitive disabilities affecting reading who need to restyle it to suit their needs - none of whom can do any of that when the text is a picture"

Source: https://www.w3.org/WAI/WCAG22/Understanding/images-of-text.html

### 11. 2.5.2 Pointer Cancellation

Current: "People with tremor or limited fine motor control who press the wrong target and need to slide off or release without triggering it"

Replacement: "People with visual disabilities, cognitive limitations, or motor impairments (including tremor and limited fine motor control) who press the wrong target and need to slide off or release without triggering it"

Source: https://www.w3.org/WAI/WCAG22/Understanding/pointer-cancellation.html - "Helps people with visual disabilities, cognitive limitations, and motor impairments by reducing the chance that a control will be accidentally activated."

### 12. 3.2.1 On Focus

Current: "People with visual or cognitive disabilities disoriented by an unannounced context change (new window, auto-submit) triggered merely by an element receiving focus, before they have done anything else"

Replacement: "People with visual disabilities, cognitive limitations, or motor impairments, disoriented by an unannounced context change (new window, auto-submit) triggered merely by an element receiving focus, before they have done anything else"

Source: https://www.w3.org/WAI/WCAG22/Understanding/on-focus.html - "helps people with visual disabilities, cognitive limitations, and motor impairments by reducing the chance that a change of context will occur unexpectedly."

Note on 3.2.2: do not copy the 3.2.1 fix onto 3.2.2. 3.2.2's own source (on-input.html) names only visual disabilities and cognitive limitations, not motor impairments - its current wording stays as-is.

---

## Does the "screen-reader default" bias warrant a standing methodology note?

Marginal - one clear case in 53, not a systemic pattern. The screen-reader-as-default
substitution appears cleanly only once: 2.1.4 Character Key Shortcuts, where the source's
real second population (dexterity-impaired keyboard users) was replaced with
screen-reader users, who are not named in that SC's source at all. Elsewhere,
"screen-reader users" appears as a legitimate, source-supported instantiation of a named
visual-disability group (3.3.1, 4.1.3, 2.4.4, 2.1.1), not a substitution. The more common,
repeatable failure mode across the 3 WRONG rows is not "defaults to screen-reader users"
specifically but "borrows a neighboring or similarly-themed criterion's population instead
of checking its own source page" (2.4.6, 3.2.3) or "substitutes a plausible-sounding but
unsourced group for the source's actual named group" (2.1.4). Recommend a short standing
note in VALIDATION.md's methodology (near the exclusion-mapping section's intro) along
these lines: "Each row's population claim was checked against that specific criterion's
own W3C Understanding page - not inferred from a neighboring or similarly-named criterion,
and not defaulted to screen-reader users as a generic AT stand-in." That is enough to close
the gap without over-indexing on a single-occurrence bias.

## Confirmation

The correction list above (12 entries) is complete and verbatim-usable: every IMPRECISE
and WRONG row from both passes has an exact current-text / replacement-text / source-URL
entry, ready to apply to VALIDATION.md without re-fetching W3C.
