# Existing Six Jurisdictions — Primary-Source Deepening

Verified against primary/near-primary sources, 2026-08-29. Current Beacon claims read from
`core/scripts/generate-report.mjs` (`DEFAULT_JURISDICTIONS`, lines 505-512; `buildLegalRiskHTML`)
and `core/references/cases.md`. Beacon's current per-jurisdiction text is one generic sentence
each — no statute year, no technical-standard version, no enforcement mechanism, no case, no
confidence marker. None of the six current entries is factually wrong on its face (they're all
hedged to "context, not legal advice"), but several omit information that changes what the hedge
should say. Flags below are the actionable output.

## Flags — claims that need to change

1. **US — Domino's v. Robles is mischaracterized in `cases.md`.** It says "Supreme Court
   confirmed ADA applies to websites/apps." The Supreme Court did not rule on the merits, it
   denied certiorari (Oct 7, 2019), leaving the Ninth Circuit's 2019 ruling in place. That is a
   real and important distinction: there is no nationwide Supreme Court holding, circuit splits
   on the "nexus to a physical place" question persist outside the Ninth Circuit, and the correct
   framing is "cert denied, Ninth Circuit ruling stands as binding precedent in that circuit and
   highly persuasive elsewhere," not "Supreme Court confirmed."
2. **US — Title III (private business) has no codified technical standard at all.** DOJ has never
   finalized a Title III regulation naming WCAG. The only codified WCAG 2.1 AA requirement is the
   2024 Title II final rule, which binds state and local governments only, and DOJ's April 2026
   interim final rule just extended those compliance deadlines by a year (large entities now April
   26, 2027; small entities and special districts April 26, 2028). Beacon's single "ADA Title III /
   Section 508 context" line conflates a judge-made private-sector duty (no named standard) with a
   now-delayed but real public-sector regulatory standard. These are different legal postures and
   should not share one card.
3. **Canada — the ACA does not yet have a binding digital or ICT technical standard.** Vendor
   compliance blogs (and by extension anyone treating "ACA = WCAG 2.1 AA now") are ahead of the
   actual law. Accessibility Standards Canada adopted EN 301 549 as a voluntary national standard
   (CAN/ASC-EN 301 549:2024) in May 2024, but the binding Digital Technologies Accessibility
   Regulations were only registered December 5, 2025, and do not come into force until 2027
   (federal public-sector entities) and 2028 (large federally-regulated private-sector entities,
   e.g. banks, telecom, transport, broadcasting). As of today, a Canada card implying an
   enforceable web technical standard is currently in effect is wrong; the correct framing is
   "adopted, not yet in force." The one AMP enforcement case findable (Air Canada, $97,500, Dec
   2023) was under the separate Accessible Transportation for Persons with Disabilities
   Regulations, not a web-content case, and should not be cited as ACA web-accessibility
   enforcement precedent.
4. **Taiwan — the statute does not reach private business at all, and Beacon should say so
   explicitly rather than hedge generically.** The binding provision is 身心障礙者權益保障法
   第52條之2, which only obligates government agencies, their subordinate bodies, and schools to
   pass first-tier-or-above accessibility testing and hold a certification mark; the technical
   content (currently 網站無障礙規範 2.0) is a delegated administrative guideline under that
   article, not itself a statute, and enforcement authority for the telecom-adjacent parts moved
   from NCC to 數位發展部 in Aug 2022. Beacon's current hedge ("confirm current local program...
   before making a compliance claim") is safe but vague enough to let a reader assume general
   private-sector applicability exists. It doesn't.
5. **Japan — reasonable accommodation became a legal duty for private business on 2024-04-01, but
   web accessibility and JIS X 8341-3 conformance specifically did not.** The Cabinet Office's
   basic policy places JIS X 8341-3 conformance under 環境の整備 (environment improvement), which
   is itself framed as effort-level groundwork for reasonable accommodation, not a directly
   enforceable requirement; a private business without an accessible site is not automatically in
   violation of the law, the duty triggers when a disabled person makes a specific request and it
   isn't reasonably accommodated. Beacon's "JIS X 8341-3 context" line reads as a technical-
   standard citation, which is accurate, but doesn't carry the "not itself a legal mandate for
   private sector" caveat that Japan's own guidance is explicit about.
6. **EU — Beacon never states EAA's actual technical standard is EN 301 549, not WCAG**, and EN
   301 549 goes beyond WCAG 2.1 AA (adds non-web ICT and hardware requirements). Beacon's "use the
   mapped WCAG criteria as technical evidence" framing is directionally fine (WCAG 2.1 AA is
   embedded inside EN 301 549 for web content) but should say so rather than imply WCAG alone
   demonstrates EAA conformance. Also worth surfacing: EAA doesn't cover all websites, it's scoped
   to enumerated services (e-commerce, banking, telecom, transport ticketing/info, e-books,
   audiovisual media access, 112 emergency comms) plus a microenterprise carve-out for
   service-only providers (under 10 employees, at most 2 million euro turnover or balance sheet)
   and a transition allowing pre-June-2025 service contracts to run unchanged until June 28, 2030.

## Per-jurisdiction records

### United States — ADA

- Statute: Americans with Disabilities Act of 1990, Title III (public accommodations, private)
  and Title II (state and local government). No ADA-specific web regulation exists for Title III;
  Title II got a codified rule via 28 CFR Part 35 in 2024. Section 508 (Rehabilitation Act,
  federal agencies) is a separate statute, not ADA. Confidence: high.
- Scope: Title III binds any "place of public accommodation" with a website; courts, led by the
  Ninth Circuit, apply a "nexus" test tying the website to a physical location or a covered
  service, and that theory is case law, not regulatory text, so scope varies by circuit. Title II
  binds state and local government entities only. Confidence: high on the nexus doctrine; the
  degree of circuit variation is qualitative, not a hard count, so treat that part as medium.
- Technical standard: the Title II final rule (2024) names WCAG 2.1 Level AA explicitly, applying
  to content the entity produces and anything "provided or made available" via vendors or
  licensors. Title III has no named standard; WCAG 2.1/2.2 AA is used as evidentiary and
  settlement convention, not codified law. Confidence: high.
- Enforcement: Title III runs on private civil litigation with no government agency gatekeeping.
  UsableNet's 2025 year-end tracking counted 5,114 federal and state digital-accessibility suits
  in 2025, about 20 percent up on 2024, 62 percent federal and 38 percent state (NY and CA), about
  28 percent against repeat defendants, and 70 percent of targets in e-commerce. Title II runs on
  DOJ civil rights enforcement plus private suit; DOJ's April 2026 interim final rule extended
  compliance deadlines (large entities to April 26, 2027; small entities and special districts to
  April 26, 2028), citing resource constraints and limits of generative-AI remediation tooling.
  Real cases: Robles v. Domino's Pizza (9th Cir. 2019, cert. denied Oct 7, 2019), where Ninth
  Circuit precedent stands and SCOTUS did not rule on the merits; NAD v. Netflix (D. Mass., 2012
  consent decree), the first ruling that an online-only streaming service is covered without a
  physical location, with Netflix paying $755,000 in fees and costs plus $40,000 monitoring and
  agreeing to 100 percent captioning by Sept 30, 2014; NFB v. Target (2008), $6M to the California
  settlement class, the first major e-commerce ADA settlement. Confidence: high for case outcomes
  and 2025 litigation counts (primary and vendor-tracker sources); medium for any extrapolation
  beyond 2025.
- Sources: DOJ Title II rule extension summary at duanemorris.com/alerts/doj_extends_ada_title_ii_digital_accessibility_deadlines_one_year_0426.html;
  Jackson Lewis DOJ extension summary at jacksonlewis.com/insights/doj-extends-public-entities-compliance-deadline-ada-related-website-accessibility-hhss-may-2026-deadline-still-looms;
  UsableNet 2025 Year-End Report at info.usablenet.com/2025-year-end-report-on-web-accessibility-lawsuits;
  Robles v. Domino's summary at adasoutheast.org/legal/court/robles-v-dominos-pizza-llc/;
  cert denial summary at bclplaw.com/en-US/events-insights-news/supreme-court-denies-review-in-website-accessibility-case-against-domino-s-pizza.html;
  NAD v. Netflix summary at dredf.org/nad-v-netflix/;
  NAD v. Netflix settlement terms at adatitleiii.com/2012/10/netflix-settles-massachusetts-web-video-captioning-action/;
  NFB v. Target settlement announcement at nfb.org/national-federation-blind-and-target-agree-class-action-settlement.

### European Union — EAA

- Statute: Directive (EU) 2019/882, the European Accessibility Act. Adopted April 17, 2019;
  member states had to transpose by June 28, 2022; obligations on covered economic operators bind
  from June 28, 2025. Confidence: high.
- Scope: not a general website law, it covers enumerated products (computers, smartphones,
  smart-TV equipment, self-service terminals, e-readers) and enumerated services (consumer
  banking, electronic communications, e-commerce, e-books, audiovisual media access components,
  transport e-ticketing and travel info, 112 emergency communications). "E-commerce services" is
  defined broadly enough (any distance service concluding a consumer contract online) to reach
  most transactional business websites, but a purely informational or brochure site with no
  enumerated service falls outside scope. Microenterprises providing services only (under 10
  employees, at most 2 million euro turnover or balance sheet) are exempt; microenterprises
  manufacturing or distributing covered products are not. Pre-June-2025 service contracts may run
  unaltered until the earlier of expiry or June 28, 2030. Applies extraterritorially to non-EU
  businesses selling into the EU market. Confidence: high.
- Technical standard: EN 301 549 (harmonized European standard for ICT accessibility), which
  incorporates WCAG 2.1/2.2 AA for web and software content but adds requirements beyond web
  content (hardware, native apps, real-time text, etc.). Conformance to the harmonized standard
  creates a presumption of conformity with the Directive. Confidence: high.
- Enforcement: the Directive requires each member state to designate market-surveillance and
  enforcement bodies and set penalties in national transposing law, so mechanism and penalty
  levels vary by country; there is no single EU-wide enforcement body or fine schedule. No
  web-content EAA case has yet been publicly reported as of this check (enforcement window opened
  June 28, 2025), and that is stated as "no case found" rather than guessed. Confidence: medium
  (enforcement is fragmented by design and country-level detail wasn't exhaustively checked here);
  explicitly low or unverified for "no case yet," since a national case could exist without
  English-language coverage.
- Sources: EUR-Lex text of Directive 2019/882 at eur-lex.europa.eu/eli/dir/2019/882/oj/eng;
  Herbert Smith Freehills Kramer application-date summary at hsfkramer.com/insights/2025-06/accessibility-directive-final-countdown-before-application-on-28-june-2025;
  Taylor Wessing e-commerce scope summary at taylorwessing.com/en/insights-and-events/insights/2025/09/european-accessibility-act-requirements-for-e-commerce-services;
  Accessible.org existing-services transition summary at accessible.org/does-eaa-apply-existing-services/.

### Japan — JIS X 8341-3 and 障害者差別解消法

- Statute: 障害者差別解消法 (Act for the Elimination of Discrimination against Persons with
  Disabilities). The 2021 amendment, effective April 1, 2024, upgraded 合理的配慮 (reasonable
  accommodation) for private businesses from an effort obligation (努力義務) to a legal duty
  (法的義務), matching the duty level government entities already had. Confidence: high.
- Scope: the duty is triggered case by case, when a disabled person makes a specific request and
  accommodation is not an undue burden; it is not a blanket "your website must conform" mandate.
  Government agencies and public procurement are treated more strictly. Confidence: high.
- Technical standard: JIS X 8341-3:2016 (national standard, technically aligned with WCAG 2.0,
  defines A, AA, and AAA conformance levels). The Cabinet Office's 基本方針 (basic policy)
  references JIS X 8341-3 conformance as part of 環境の整備 (environment improvement, preparatory
  groundwork for accommodation), which is explicitly not itself a legal mandate for
  private-sector websites; it is closer to expected good practice feeding into the
  reasonable-accommodation duty, not a standalone violation trigger. Public-sector and procurement
  contexts treat JIS X 8341-3 conformance as closer to required. Confidence: medium, since this
  field depends on interpreting Cabinet Office guidance language rather than a bright-line
  statutory test.
- Enforcement: no dedicated regulator issues fines for inaccessible private websites; the
  mechanism is civil claim or administrative guidance following an individual's unaccommodated
  request, plus reputational and procurement-eligibility pressure for public-facing or government
  work. No landmark private-sector web-accessibility court case was found in this pass, and that
  is stated honestly rather than inventing one. Confidence: medium-low on "no case found" (the
  search covered Japanese and English sources; a case could exist that wasn't surfaced).
- Sources: gov-online.go.jp 2024 amendment summary at gov-online.go.jp/article/202402/entry-5611.html;
  NaviLens private-sector guide at navilens.com/ja/blog/shogai-sabetsu-kaishoho-2024-kaisei;
  WAIC seminar deck on JIS X 8341-3 status at waic.jp/wp-content/uploads/2024/10/20240920-waic-a11y-seminar-1.pdf;
  Cybertrust private-company obligations summary at cybertrust.co.jp/blog/ssl/web-accessibility/necessity.html.

### Taiwan — 身心障礙者權益保障法

- Statute: 身心障礙者權益保障法 (Persons with Disabilities Rights Protection Act), specifically
  第52條之2. Confidence: high.
- Scope: binds government agencies at all levels and their subordinate bodies, and schools, only;
  no general private-sector obligation exists under this article. Covered entities must pass
  accessibility testing at "第一優先等級以上" (first priority level or above) and obtain a
  certification mark; testing standards, method, frequency, and certification procedure are
  delegated to the competent authority (數位發展部, after an Aug 2022 transfer of the relevant NCC
  authority). Confidence: high on scope and delegation; the exact meaning of "第一優先等級"
  relative to WCAG conformance levels should be pinned to the current 網站無障礙規範 version text
  before being restated as "WCAG 2.1 AA," which some secondary sources assert but this pass did
  not confirm against the regulation's own wording, so mark that mapping medium confidence.
- Technical standard: 網站無障礙規範 (Website Accessibility Guidelines), currently version 2.0,
  issued as administrative guidance under the delegated authority above, not a standalone statute.
  Confidence: high on existence and versioning; medium on the exact current WCAG-level mapping.
- Enforcement: administrative, a certification and audit regime for covered public entities, not
  private civil litigation. No case of enforcement action or litigation against a private business
  was found, because private businesses are outside this statute's scope; that absence is
  structural, not a gap. Confidence: high.
- Sources: 法務部全國法規資料庫 第52條之2 at law.moj.gov.tw/LawClass/LawSingle.aspx?Pcode=D0050046&FLNO=52-2;
  數位發展部無障礙網路空間服務網 網站無障礙規範 at accessibility.moda.gov.tw/Accessible/Guide/68;
  國家通訊傳播委員會無障礙網路空間服務網 at accessibility.ncc.gov.tw/.

### Canada — Accessible Canada Act

- Statute: Accessible Canada Act (ACA), S.C. 2019, c. 10. Confidence: high.
- Scope: binds federally regulated entities only, federal government, Crown corporations, banks,
  telecom carriers, interprovincial transport, broadcasting, not general Canadian businesses (that
  is the separate, provincial AODA in Ontario and similar provincial laws elsewhere, which
  Beacon's card doesn't currently distinguish from the federal ACA at all). Confidence: high.
- Technical standard: not yet binding. Accessibility Standards Canada adopted EN 301 549 (v3.2.1)
  as a voluntary National Standard of Canada (CAN/ASC-EN 301 549:2024) in May 2024. The binding
  Digital Technologies Accessibility Regulations amending the Accessible Canada Regulations were
  registered December 5, 2025 (Canada Gazette Part II) and come into force in 2027 for federal
  public-sector entities and 2028 for large federally-regulated private-sector entities, meaning
  as of today there is no enforceable web or ICT technical standard under the ACA yet; it is
  adopted but not yet in force. Confidence: high, the Canada Gazette is a primary source.
- Enforcement: an Accessibility Commissioner can issue administrative monetary penalties ($250 to
  $250,000 per violation, scaled by severity, size, and history), but FY2023-24 enforcement was
  corrective-action-plan-based (59 plans issued) rather than penalty-based, and none of that
  activity was under a digital technical standard since there wasn't one yet; it concerns
  accessibility-plan and feedback-process obligations, which are already in force. The one
  concrete AMP case found, Air Canada ($97,500, Dec 2023), was issued under the separate
  Accessible Transportation for Persons with Disabilities Regulations, a different regulation
  administered by the Canadian Transportation Agency about in-person and onboard service, not web
  content, so it should not be cited as ACA digital-accessibility enforcement precedent. No
  web-specific ACA enforcement case exists yet because the digital standard isn't in force yet.
  Confidence: high on the Air Canada case's regulatory basis (primary source is a Canada.ca news
  release); high on "no ACA web case yet" being structural, not a search gap.
- Sources: Canada Gazette Digital Technologies Accessibility Regulations at gazette.gc.ca/rp-pr/p2/2025/2025-12-17/html/sor-dors255-eng.html;
  Blakes regulation summary at blakes.com/insights/federal-government-finalizes-new-digital-technologies-accessibility-regulations/;
  Accessibility Standards Canada EN 301 549 adoption announcement at accessible.canada.ca/news/accessibility-standards-canada-adopts-globally-recognized-accessibility-standard-ict-products;
  Canada.ca Air Canada AMP announcement at canada.ca/en/transportation-agency/news/2023/12/the-canadian-transportation-agency-issues-administrative-monetary-penalty-to-air-canada-for-violations-of-the-accessible-transportation-for-persons.html.

### Australia — Disability Discrimination Act

- Statute: Disability Discrimination Act 1992 (Cth). No web-specific amendment or regulation
  exists; accessibility is reached through the general discrimination prohibition. Confidence:
  high.
- Scope: covers "services," which the Human Rights Commission has held includes a website; there
  is no size or sector carve-out comparable to the EU microenterprise exemption in the statute
  itself. Confidence: high.
- Technical standard: none codified in the Act. The Australian Human Rights Commission's 2014
  advisory guidance recommends WCAG 2.1 (originally 2.0) Level AA as the practical benchmark for
  compliance; this is guidance, not a legal requirement, so a site can diverge from WCAG AA and
  still not be in breach, or conform to WCAG AA and still face a complaint on a fact pattern the
  guidance didn't anticipate. Confidence: high.
- Enforcement: a complaint to the AHRC leads to conciliation (the large majority of DDA complaints
  resolve here, on non-public terms); if unresolved, the complainant may proceed to the Federal
  Court. Real case: Maguire v. Sydney Organising Committee for the Olympic Games (HREOC/AHRC,
  1999-2000), the Sydney Olympics ticketing, souvenir-program, and website case; the Commission
  found the website was a "service" under the DDA, found direct discrimination in how SOCOG "used
  its computer technology," ordered the website be made accessible, and awarded Maguire $20,000 in
  damages. This remains the landmark precedent; no comparably prominent web-specific successor
  case was found in this pass (AHRC's public Conciliation Register logs many resolved complaints,
  but individual accessibility-specific case narratives from the 2020s weren't surfaced with
  enough detail to cite by name), and that is stated as a gap rather than filled with an
  unverified example. Confidence: high on Maguire; medium-low on "no comparable case since," since
  AHRC conciliations are often confidential or under-indexed rather than genuinely absent.
- Sources: Wikipedia summary of Maguire v SOCOG at en.wikipedia.org/wiki/Maguire_v_Sydney_Organising_Committee_for_the_Olympic_Games (secondary, restates the AHRC/HREOC decision, treat as pointer not the primary record);
  Australian Human Rights Commission legal obligations chapter at humanrights.gov.au/our-work/disability-rights/chapter-1-legal-and-human-rights-obligations;
  AHRC Conciliation Register at humanrights.gov.au/complaints/conciliation-register.

## Verification pass 2026-08-29

Spot-checked 3 of the claims flagged as becoming customer-facing, against their cited primary URLs
(fetched via plain `curl -sL -A "Mozilla/5.0"`, no Playwright needed — none of these three hosts are
JS-rendered). The other three jurisdiction records (US, Japan, Australia) were not re-checked this
pass.

1. **EU — EAA dates and EN 301 549 basis — VERIFIED, with one nuance.** Fetched the Directive
   2019/882 text directly from eur-lex.europa.eu. All three cited dates confirm verbatim: adopted
   "17 April 2019," member-state transposition deadline "28 June 2022," application/obligation date
   "28 June 2025." Nuance: the Directive's own text does **not** name "EN 301 549" anywhere — Chapter
   VI, Article 15 ("Presumption of conformity") instead sets up a general mechanism, that products/
   services conforming to harmonised standards "the references of which have been published in the
   Official Journal" are presumed compliant, and recital text names only the earlier standardisation
   mandates (M/376, M/473, M/420) that fed into drafting such a standard. EN 301 549 is the standard
   that was later published under that Article 15 mechanism, not text baked into the Directive
   itself — this is expected EU legislative practice (harmonised standards are listed in the OJ after
   the fact), not an error in the file's claim, but worth stating precisely if a customer asks "where
   does the Directive say EN 301 549." Independently cross-corroborated: the Canada Gazette DTAR text
   (item 2 below) itself references "EN 301 549... a global standard that has been adopted in several
   countries," consistent with EN 301 549 being the operative harmonised standard under the EAA.
   Source: eur-lex.europa.eu/eli/dir/2019/882/oj/eng, fetched 2026-08-29.

2. **Canada — DTAR registration and in-force dates — VERIFIED.** Fetched the Canada Gazette Part II
   text directly from gazette.gc.ca. Registration date confirms verbatim: "SOR/2025-255 December 5,
   2025." The coming-into-force clause (regulation text, not the file's paraphrase) reads: "(1)
   ... these Regulations come into force on the second anniversary of the day on which they are
   registered. (2) Sections 7 to 14, 16 and 17 come into force on the third anniversary of the day on
   which these Regulations are registered" — i.e. December 5, 2027 for the general/public-sector
   baseline and December 5, 2028 for the sections covering large businesses (500+ employees, per the
   Regulatory Impact Analysis Statement's own definition), matching the file's "2027 (federal
   public-sector) / 2028 (large federally-regulated private-sector)" framing. One nuance the file
   doesn't currently mention: the regulation also defines a "medium-sized businesses" tier (100-499
   employees) with its own separate treatment in the RIAS — not itself a contradiction, but a gap
   worth adding if the Canada card gets more granular. The Air Canada AMP citation and "not yet in
   force" framing were not re-checked this pass (unchanged from the file's existing sourcing).
   Source: gazette.gc.ca/rp-pr/p2/2025/2025-12-17/html/sor-dors255-eng.html, fetched 2026-08-29.

3. **Taiwan — 第52條之2 scope — VERIFIED, verbatim.** Fetched the article text directly from
   law.moj.gov.tw (全國法規資料庫). Full text: "各級政府及其附屬機關（構）、學校所建置之網站，應通過第
   一優先等級以上之無障礙檢測，並取得認證標章。前項檢測標準、方式、頻率與認證標章核發辦法，由目的事業
   主管機關定之。" This confirms the file's claim exactly and completely: the article's scope is
   government at all levels plus their subordinate agencies/institutions and schools ONLY — the
   article contains no private-sector language of any kind, and delegates all technical-standard
   detail (test standard, method, frequency, certification-mark procedure) to the competent authority
   rather than specifying it in the statute itself. This directly supports the file's flag #4 point
   that Taiwan's private-sector non-coverage should be stated explicitly rather than left to a generic
   hedge. Source: law.moj.gov.tw/LawClass/LawSingle.aspx?Pcode=D0050046&FLNO=52-2, fetched 2026-08-29.

**Counts for this pass**: 3 items checked, 3 verified (0 outright contradicted), 1 verified-with-
nuance (EAA/EN 301 549 provenance mechanism, doesn't change the card's substance). No tier changes
from this spot-check; the US/Canada/Taiwan/Japan/EU tier calls in the "Flags" section above stand.
US and Japan were not re-checked this pass.
