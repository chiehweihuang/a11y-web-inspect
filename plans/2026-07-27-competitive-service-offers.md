# Competitive landscape: AI-assisted accessibility auditing as a service

Research date: 2026-07-27. Scope: Taiwan, Japan, English-speaking baseline, plus EAA 2025 enforcement effect on demand.

## Method note

Web search plus targeted page fetches. No paid-database access (no Clutch/G2 vendor
directories with real deal sizes). Pricing is published where a URL is cited;
everything else is marked uncited-plausible or "no published price found".

---

## 1. Taiwan

Regulatory frame: the government site accessibility.moda.gov.tw (formerly
under NCC, accessibility.ncc.gov.tw) issues A / A+ level badges for web
accessibility. Process: free government tool Freego (automated scan, self
run), then manual review, then testing by users with disabilities arranged
via NGOs, then badge issued, valid 3 years, must be redone after any
redesign.
Source: https://accessibility.moda.gov.tw/Questions/Detail/47?Category=33
Source: https://accessibility.moda.gov.tw/Accessible/Detail/109?Category=8

Vendor landscape: no standalone accessibility-audit consultancy was found.
Everything located is a general web design/dev company that bundles the A/A+
badge work as one line item among many services (government, foundation,
and school clients). Example: Fanseo (design.fanseo.com) markets "over 300
government site successes," accessibility is one of roughly 12 service
lines, and the company references "AI empowered design" as a separate
generic marketing feature, not applied to the accessibility audit
methodology itself.
Source: https://design.fanseo.com/html/solution/web_accessibility.html
TSG and EzTrust run similar explainer content but no service-specific
pricing detail was retrievable (TSG page returned a TLS certificate error on
direct fetch, so treat as uncited beyond the search snippet).
URL (uncited beyond snippet): https://www.tsg.com.tw/blog-detail4-205-2-accessibility.htm

Disability-org testing channel: Eden Social Welfare Foundation and the
Taiwan Digital Audiobook Promotion Association are the visible bodies around
blind and disabled user web testing and advocacy, but neither surfaced a
public commercial audit-service price list. Treat as advocacy/training
oriented rather than a for-hire audit shop.
Source: https://www.eden.org.tw/
Source: https://tdtb.org/

Pricing: no published price was found anywhere in the Taiwan search. Every
vendor is quote-on-request. No solo consultant or small studio was found
publicly pitching "AI-assisted accessibility auditing" as a named service;
AI appears only as unrelated general-purpose marketing copy. Generic Taiwan
"AI consulting" project rates (NT$10,000 to 300,000, unrelated to
accessibility) are uncited, plausible proxy only, not an accessibility
market data point.
Source: https://www.tasker.com.tw/price/ai-automation

---

## 2. Japan

Regulatory frame: JIS X 8341-3:2016 is a voluntary industry standard, but is
mandatory for public sector sites and public procurement per the public
sector web operation guideline. Separately, the April 2024 amendment to the
Act on the Elimination of Discrimination against Persons with Disabilities
made reasonable accommodation a legal obligation for private businesses, but
multiple industry explainers are explicit that this does not make web
accessibility itself legally mandatory outside public bodies. It is read as
accommodation in general, and web a11y compliance is a recommended response,
not a direct mandate.
Source: https://webtan.impress.co.jp/e/2024/05/10/46759
Source: https://www.ab-net.co.jp/labo/107/
Several vendor blogs assert rising corporate demand and inquiries since the
amendment, but none quantified it. Treat as a vendor marketing claim, not a
measured figure.

The vendor landscape here is the most mature and price-transparent of the
three markets, spanning three shapes:

Large web/design agency add-on: Mitsue-Links offers full lifecycle support
(policy, build, test, publish, ongoing training), no public pricing,
quote-only.
Source: https://www.mitsue.co.jp/service/accessibility/support/jis_compliance.html

Disability-employment social enterprise, human testers as the pitch:
BIPROGY Challenged (a disability-employment subsidiary of BIPROGY) sells
tiered per-site packages, minimum 10 pages: Starter 170,000 yen and up
(about 1 week), Light 220,000 yen and up (about 2 weeks), Standard 275,000
yen and up (about 3 weeks, adds certificate plus report meeting), Premium
325,000 yen and up (about 1.5 months, adds policy document support plus
ongoing QA). Volume and repeat-customer discounts are available.
Source: https://biprogy-chd.co.jp/service/web-accessibility-inspection/service-prices/
Sunny Bank (a crowdsourcing platform for people with disabilities) prices
its diagnosis courses on request (JIS course 1 to 1.5 months; Premium adds
disabled-specialist review), but publishes itemized extras: user testing
example 728,000 to 1,248,000 yen (10 evaluators times 10 pages), a 3 hour
training session at 320,000 yen, report meetings at 80,000 to 100,000 yen,
member interviews across 6 disability types at 550,000 yen, and design or
coding remediation at 55,000 to 128,000 yen per page.
Source: https://sunnybank.jp/business/service/accessibility_diagnosis/

Boutique dev-shop specialist, tool plus manual tiers: Coding Bear (part of
DAWN Inc., about 15 years of frontend experience, claims 40,000+ pages
checked) charges per page, 1,000 to 15,000 yen depending on depth. Worked
example for a 40 page site: 90,000 yen (automated tool only, WCAG 2.0 Level
A) up to 750,000 yen (tool plus manual, WCAG 2.2 AA).
Source: https://coding-bear.com/menu/accessibility/

AI-in-pitch: none of the Japanese vendors found market AI-assisted auditing
as a differentiator. The opposite framing dominates: BIPROGY and Sunny Bank
explicitly sell human, often disabled, testers as the value proposition. One
general how-to blog (not tied to a named commercial vendor) describes an
emerging technique of piping automated-scan errors and code into an LLM to
draft fix suggestions for engineer review, a real workflow pattern, but not
a market positioning anyone is selling on yet.
Source: https://media.tcdigital.jp/ai-knowledge-flow/articles/ai-web-accessibility-automation/

---

## 3. English-speaking baseline

Solo or small-studio operators explicit about AI limits (closest to the
"honesty" angle asked about):

Kris Rivenburgh, operating as Accessible.org, is a solo-founder-led shop.
Published per-page pricing: primary pages 100 to 250 dollars, light pages 25
to 100 dollars, typical project 1,250 to 2,750 dollars; consulting at 495
dollars per hour, technical support at 195 dollars per hour (2 hour
minimum); VPAT/ACR at 350 dollars plus audit cost; user testing at 550
dollars per session (450 dollars bundled with an audit). The site states
plainly that audits are "fully manual evaluations (not automated scans)."
In a 2026 pricing update post, Rivenburgh states: "AI is not auditing
anything. AI is improving and automating the stuff around the audits, the
emails, the platform, the administration." That is the clearest, most
citable instance of the "show what the machine cannot check" honesty angle
found in this whole survey, and it was used to justify a 10 percent price
cut driven by efficiency gains from AI on operations, not from replacing
audit labor.
Source: https://accessible.org/pricing/
Source: https://adabook.medium.com/accessibility-services-ai-driving-down-wcag-audit-costs-in-2026-80e2576a08e1

Equal Entry is a manual-audit-first consultancy that prices by unique page
count, with a cited range of 10,000 to 30,000 dollars per engagement, and
recommends biannual manual audits. Its explicit position is that automation
only supplements, and does not replace, manual work.
Source: https://equalentry.com/accessibility-audits-automation/

Intopia (Australia and New Zealand, a disability-led boutique, describing
itself as the largest accessibility team in the southern hemisphere) has no
published pricing and is quote-only. It differentiates on lived-experience
testers and a disability-led team rather than on AI messaging.
Source: https://intopia.digital/services/accessibility-usability-testing/

DigitalA11Y (an aggregator/small consultancy) lists per-page tiers roughly
100 to 300 dollars per page depending on complexity.
Source: https://www.digitala11y.com/how-much-does-a-web-accessibility-audit-cost/

AI-platform companies (products, not solo services, but relevant since they
lead with AI in the pitch):

TestParty runs a subscription/platform model, not per-audit, and markets
"continuous assessment" as a replacement for point-in-time audits, plus "AI
generates actual code fixes." It notably concedes, in its own content, that
"automated tools catch only 30-40% of issues," and pitches a hybrid of AI
monitoring plus periodic expert review as the honest middle path. This is an
AI vendor conceding its own tool's limits to justify keeping, and reselling,
human review.
Source: https://testparty.ai/blog/accessibility-audit-cost

Silktide is a 300 to 1,000-plus dollar per month platform tier, strong on
WCAG detection. Third-party comparison content is explicit that it "cannot
fix" what it finds, a detection-only positioning, not an audit service.
Source: https://silktide.com/pricing/
Source: https://testparty.ai/blog/testparty-vs-silktide

accessiBe is an overlay/widget product at 59 dollars per month and up by
traffic tier. Its industry reputation is contested (widely criticized by
accessibility professionals for the overlay approach). Flagged for context
only, not a comparable audit-service offer.
Source: https://accessibe.com/pricing/accesswidget

General market benchmarks, repeated consistently across Accessible.org,
DigitalA11Y, TestParty, and Skynet Technologies blog posts: automated
scan-only 0 to 500 dollars per month; manual audit for a mid-size site
3,000 to 25,000 dollars (5,000 to 15,000 dollars typical, per TestParty's
own bracket); comprehensive enterprise assessment 15,000 to 75,000-plus
dollars; hourly consulting from roughly 50 dollars per hour (junior) to 195
to 495 dollars per hour (senior/founder level, Accessible.org).

---

## 4. EAA 2025 enforcement wave, effect on demand

The European Accessibility Act became enforceable across the EU on 28 June
2025. Through the second half of 2025, most national authorities were still
building enforcement capacity; several had begun auditing organizations,
handling complaints, and issuing formal notices. The first EAA-related
lawsuits were filed in France in November 2025.
Source: https://www.deque.com/blog/early-signs-of-eaa-enforcement-across-europe/
Source: https://www.pivotalaccessibility.com/2025/09/eaa-enforcement-in-europe-following-the-june-2025-deadline/

No vendor published a quantified "bookings surge" number. The
demand-increase claim is an inference from the volume of vendor content
(Level Access, Deque, Usablenet, Pivotal Accessibility, and the ADA Title
III blog all published EAA compliance-support explainers and services
through 2025), plus a direct assertion from Pivotal Accessibility framing
consultancy partnership as the response to EAA risk. Treat as uncited,
plausible that this converts to revenue, but no market-size or
engagement-count figure was found.
Source: https://www.levelaccess.com/compliance-overview/european-accessibility-act-eaa/
Source: https://blog.usablenet.com/why-eaa-compliance-and-legal-trends-are-shaping-accessibility-in-2025

---

## 5. Who uses the "we show you what the machine cannot check" honesty angle

Ranked by how explicit and citable the claim is:

1. Kris Rivenburgh / Accessible.org (English): most explicit, "AI is not
   auditing anything, the actual work stays 100% human." Clean, quotable,
   and tied to a real solo-operator price list.
2. Equal Entry and general English-market blog content: a near-universal
   "automated tools catch only 30-40% of issues" statistic, but almost
   always used by manual-audit sellers to upsell their own manual service,
   not a neutral third-party disclosure.
3. TestParty (an AI-tool vendor): the same 30-40% statistic, used in
   reverse, an AI-product company admitting its own tool's ceiling to
   justify a hybrid, human-in-the-loop upsell.
4. Japan: nobody frames it as an AI versus human honesty statement, but
   BIPROGY and Sunny Bank achieve the same functional effect by selling
   disabled testers as the differentiator, arguably a stronger, more
   concrete version of the same claim, just not phrased as an AI-limits
   argument.
5. Taiwan: not found at all. No vendor addresses automated-tool coverage
   limits as a sales point; the market has not reached that framing.

---

## The clearest gap

Nobody found, in any of the three markets, combines all three of: an actual
boutique or solo price point, an explicit and honest statement of where the
AI/automated layer stops and a human has to look, and a Taiwan or Japan
market presence (or a bridging position for Japan/Taiwan companies newly
exposed to the EAA via EU customers). The Rivenburgh transparency model
exists only in the English market; it has not crossed into Taiwan or Japan,
where the market instead either bundles a11y into general web-design
retainers (Taiwan) or sells human/disabled testers as the differentiator
without ever mentioning AI at all (Japan). A solo operator who can state, in
plain language, exactly what an AI-assisted scan does and does not catch,
aimed at Japan/Taiwan based teams selling into the EU post-EAA, has no
visible incumbent in this survey.
