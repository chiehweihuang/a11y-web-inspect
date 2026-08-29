// Beacon jurisdiction data module — single source of truth for the legal/jurisdiction
// section of generate-report.mjs and for the default legal_exposure text static-audit.mjs
// stamps on every finding.
//
// Source: plans/2026-08-29-jurisdiction-expansion/{existing-six-deepened,east-asia,
// south-america}.md, primary-source research dated 2026-08-29 (re-read for any later
// "## Verification pass" section before this file is finalized — CONTRADICTED items follow
// the verified text, UNREACHABLE items get an explicit lower-confidence marker or a
// weaker tier, never a claim the verification pass contradicted).
//
// `tier`:
//   'specific-law'                — a statute exists that specifically addresses digital/
//                                    web/ICT accessibility (even if narrow, soft, or not yet
//                                    in force), with a named technical standard.
//   'framework-no-web-specifics'  — a general anti-discrimination/human-rights law that MAY
//                                    reach websites by broad interpretation ("services"), but
//                                    the statute itself has no web/ICT text; any WCAG mention
//                                    is non-statutory administrative guidance, not law.
//   'no-specific-law'             — no statute directly on point (may still have a general
//                                    disability-rights law with no digital component).
//
// `cardStyle` decides how generate-report.mjs renders the entry — tier alone can't (Macau
// and Venezuela are both 'no-specific-law' but one has real research depth, the other doesn't):
//   'full'    — full card: statute/scope/standard/enforcement/sources.
//   'grouped' — rendered together in one regional-comparison group, not as separate cards
//               (south-america.md's "regional-tier note" countries: Chile/Peru/Uruguay/
//               Ecuador — each has real research but a lighter, comparative presentation).
//   'oneline' — a single compact honest-null line (thin/low-confidence research only).

export const JURISDICTIONS = [
  // ---- Existing six, corrected per existing-six-deepened.md's Flags section ----
  {
    id: 'us',
    name: { zh: '美國', en: 'United States' },
    tier: 'specific-law',
    cardStyle: 'full',
    statute: {
      name: { original: 'Americans with Disabilities Act of 1990 (ADA)', en: 'Americans with Disabilities Act of 1990 (ADA)' },
      year: 1990,
      provision: 'Title III (private public accommodations, no web-specific regulation); Title II (state/local government, 28 CFR Part 35, 2024 final rule). Section 508 (federal agencies) is a separate statute, not the ADA.',
    },
    scope: {
      public: true,
      private: true,
      text: {
        zh: 'Title III 適用任何構成「公共場所」且設有網站的私人企業；法院（以第九巡迴上訴法院為主）採「與實體場所或服務之關聯性」的判例法判準，而非法規明文，各巡迴法院見解不一。Title II 僅適用州與地方政府。',
        en: 'Title III covers any "place of public accommodation" with a website; courts (led by the Ninth Circuit) apply a case-law "nexus" test tying the site to a physical location or covered service — that theory is case law, not regulatory text, and varies by circuit. Title II covers state and local government only.',
      },
    },
    standard: { name: 'WCAG 2.1 Level AA', version: '2.1 AA', level: 'AA', binding: 'Title II only (28 CFR Part 35, codified 2024); Title III uses WCAG as evidentiary/settlement convention, not codified law' },
    enforcement: {
      mechanism: {
        zh: 'Title III 靠私人民事訴訟推動，無政府機關預先把關；2025 年美國全年約有 5,114 件聯邦與州層級數位無障礙訴訟（較 2024 年增加約 2 成）。Title II 由 DOJ 民權執法搭配私人訴訟；DOJ 於 2026 年 4 月發布過渡期最終規則，將大型機構期限延至 2027-04-26、小型機構與特別區延至 2028-04-26。',
        en: 'Title III runs on private civil litigation with no government gatekeeping — UsableNet counted about 5,114 federal and state digital-accessibility suits in 2025, up ~20% on 2024. Title II runs on DOJ civil-rights enforcement plus private suit; DOJ\'s April 2026 interim final rule extended compliance deadlines (large entities to 2027-04-26; small entities/special districts to 2028-04-26).',
      },
      realCase: {
        name: 'Robles v. Domino\'s Pizza',
        year: 2019,
        outcome: 'Ninth Circuit ruled for Robles (2019); the Supreme Court denied certiorari on 2019-10-07 without ruling on the merits — the Ninth Circuit decision stands as binding precedent in that circuit and persuasive elsewhere, it is not a nationwide Supreme Court holding.',
      },
    },
    sources: [
      'https://www.duanemorris.com/alerts/doj_extends_ada_title_ii_digital_accessibility_deadlines_one_year_0426.html',
      'https://www.jacksonlewis.com/insights/doj-extends-public-entities-compliance-deadline-ada-related-website-accessibility-hhss-may-2026-deadline-still-looms',
      'https://info.usablenet.com/2025-year-end-report-on-web-accessibility-lawsuits',
      'https://www.adasoutheast.org/legal/court/robles-v-dominos-pizza-llc/',
      'https://www.bclplaw.com/en-US/events-insights-news/supreme-court-denies-review-in-website-accessibility-case-against-domino-s-pizza.html',
      'https://dredf.org/nad-v-netflix/',
      'https://www.nfb.org/national-federation-blind-and-target-agree-class-action-settlement',
    ],
    confidence: 'high',
  },
  {
    id: 'eu',
    name: { zh: '歐盟', en: 'European Union' },
    tier: 'specific-law',
    cardStyle: 'full',
    statute: {
      name: { original: 'Directive (EU) 2019/882 — European Accessibility Act (EAA)', en: 'Directive (EU) 2019/882 — European Accessibility Act (EAA)' },
      year: 2019,
      provision: 'Adopted 2019-04-17; member states transposed by 2022-06-28; obligations on covered economic operators bind from 2025-06-28.',
    },
    scope: {
      public: true,
      private: true,
      text: {
        zh: '不是一般性的網站法，只涵蓋列舉的產品（電腦、智慧型手機、自助服務終端機、電子閱讀器等）與列舉的服務（消費銀行、電子通訊、電子商務、電子書、視聽媒體服務的相關元件、運輸電子票務與資訊、112 緊急通訊）。「電子商務服務」定義夠廣，多數線上交易型網站都落在範圍內，但純資訊性、無列舉服務的網站不受規範。僅提供服務的微型企業（未滿 10 人、年營業額或資產負債表未滿 200 萬歐元）豁免；2025 年 6 月前簽訂的服務合約可維持原狀至遲到 2030-06-28。對非歐盟企業具域外效力。',
        en: 'Not a general website law — covers enumerated products (computers, smartphones, self-service terminals, e-readers, etc.) and enumerated services (consumer banking, electronic communications, e-commerce, e-books, audiovisual-media-access components, transport e-ticketing/travel info, 112 emergency communications). "E-commerce services" is defined broadly enough to reach most transactional business websites; a purely informational site with no enumerated service is out of scope. Service-only microenterprises (under 10 employees, ≤€2M turnover/balance sheet) are exempt. Pre-2025-06-25 service contracts may run unaltered until the earlier of expiry or 2030-06-28. Applies extraterritorially to non-EU businesses selling into the EU.',
      },
    },
    standard: { name: 'EN 301 549 (incorporates WCAG 2.1/2.2 AA for web content, plus non-web ICT/hardware requirements)', version: 'WCAG 2.1/2.2 AA embedded', level: 'AA', binding: 'Binding from 2025-06-28 for in-scope operators' },
    enforcement: {
      mechanism: {
        zh: '指令要求各會員國自行指定市場監督與執法機關並訂定罰則，沒有單一歐盟層級的執法機關或罰則表，機制與罰則等級因國而異。截至本次查核，尚未發現公開報導的網站內容 EAA 案例（執法窗口於 2025-06-28 才開啟）。',
        en: 'The Directive requires each member state to designate its own market-surveillance/enforcement body and set penalties in national transposing law — there is no single EU-wide enforcement body or fine schedule, and mechanism/penalties vary by country. No web-content EAA case has been publicly reported as of this check (the enforcement window opened 2025-06-28).',
      },
      realCase: null,
    },
    sources: [
      'https://eur-lex.europa.eu/eli/dir/2019/882/oj/eng',
      'https://www.hsfkramer.com/insights/2025-06/accessibility-directive-final-countdown-before-application-on-28-june-2025',
      'https://www.taylorwessing.com/en/insights-and-events/insights/2025/09/european-accessibility-act-requirements-for-e-commerce-services',
      'https://accessible.org/does-eaa-apply-existing-services/',
    ],
    confidence: 'high',
  },
  {
    id: 'jp',
    name: { zh: '日本', en: 'Japan' },
    tier: 'specific-law',
    cardStyle: 'full',
    statute: {
      name: { original: '障害者差別解消法（障害を理由とする差別の解消の推進に関する法律）', en: 'Act for the Elimination of Discrimination against Persons with Disabilities' },
      year: 2013,
      provision: '2021年改正、2024-04-01施行：民間事業者の合理的配慮を努力義務から法的義務に引き上げ（行政機関と同水準に）。',
    },
    scope: {
      public: true,
      private: true,
      text: {
        zh: '義務是逐案觸發的：當身心障礙者提出具體請求、且提供合理配慮不構成過度負擔時才成立，不是「網站必須全面達標」的一般性強制規定。政府機關與公共採購適用更嚴格的標準。',
        en: 'The duty is triggered case by case — when a disabled person makes a specific request and accommodation is not an undue burden — not a blanket "your website must conform" mandate. Government agencies and public procurement are treated more strictly.',
      },
    },
    standard: { name: 'JIS X 8341-3:2016（技術上與 WCAG 2.0 對齊，定義 A/AA/AAA 三個等級）', version: '2016, WCAG 2.0-aligned', level: 'AA', binding: '公部門與採購場景較接近強制；私部門僅為內閣府「環境の整備」下的努力方向，本身不是法律強制標準' },
    enforcement: {
      mechanism: {
        zh: '沒有專責機關對不合規私人網站開罰；機制是個案民事請求或行政指導，加上對公開面向或政府案件的商譽與採購資格壓力。本次查核未發現具指標性的私部門網頁無障礙訴訟案例。',
        en: 'No dedicated regulator fines inaccessible private websites; the mechanism is civil claim or administrative guidance following an individual\'s unaccommodated request, plus reputational/procurement pressure for public-facing or government work. No landmark private-sector web-accessibility court case was found in this pass.',
      },
      realCase: null,
    },
    sources: [
      'https://www.gov-online.go.jp/article/202402/entry-5611.html',
      'https://www.navilens.com/ja/blog/shogai-sabetsu-kaishoho-2024-kaisei',
      'https://waic.jp/wp-content/uploads/2024/10/20240920-waic-a11y-seminar-1.pdf',
      'https://www.cybertrust.co.jp/blog/ssl/web-accessibility/necessity.html',
    ],
    confidence: 'medium',
  },
  {
    id: 'tw',
    name: { zh: '台灣', en: 'Taiwan' },
    tier: 'specific-law',
    cardStyle: 'full',
    statute: {
      name: { original: '身心障礙者權益保障法 第52條之2', en: 'Persons with Disabilities Rights Protection Act, Art. 52-2' },
      year: 2015,
      provision: '課予政府機關（含所屬機構）及學校通過第一優先等級以上無障礙檢測並取得標章之義務；技術內容授權主管機關另訂。',
    },
    scope: {
      public: true,
      private: false,
      text: {
        zh: '僅拘束各級政府機關、其所屬機構，以及學校，本條並未課予一般私部門任何義務。技術檢測標準（現行為網站無障礙規範2.0）為授權主管機關（數位發展部，2022年8月自NCC移轉部分職權）訂定的行政指引，本身不是法律。',
        en: 'Binds government agencies at every level, their subordinate bodies, and schools only — no general private-sector obligation exists under this article. The technical standard (currently 網站無障礙規範 2.0) is administrative guidance delegated to the competent authority (數位發展部, after an August 2022 transfer of relevant authority from NCC), not a statute itself.',
      },
    },
    standard: { name: '網站無障礙規範 2.0', version: '2.0', level: 'AA', binding: '僅拘束政府機關與學校；「第一優先等級」與 WCAG 等級的精確對應本次未逐字核對規範文本，列為中信心度' },
    enforcement: {
      mechanism: {
        zh: '行政性質：對受規範公部門實施驗證與稽核制度，非私人民事訴訟途徑。本次查核未發現任何對私人企業的執法或訴訟案例，這是結構性的（私部門本就不在本條規範範圍內），不是查核缺口。',
        en: 'Administrative — a certification and audit regime for covered public entities, not private civil litigation. No enforcement action or litigation against a private business was found, because private businesses are structurally outside this statute\'s scope, not a research gap.',
      },
      realCase: null,
    },
    sources: [
      'https://law.moj.gov.tw/LawClass/LawSingle.aspx?Pcode=D0050046&FLNO=52-2',
      'https://accessibility.moda.gov.tw/Accessible/Guide/68',
      'https://accessibility.ncc.gov.tw/',
    ],
    confidence: 'high',
  },
  {
    id: 'ca',
    name: { zh: '加拿大', en: 'Canada' },
    tier: 'specific-law',
    cardStyle: 'full',
    statute: {
      name: { original: 'Accessible Canada Act (ACA), S.C. 2019, c. 10', en: 'Accessible Canada Act (ACA), S.C. 2019, c. 10' },
      year: 2019,
      provision: 'Amending Digital Technologies Accessibility Regulations registered 2025-12-05 (Canada Gazette Part II); in force 2027 (federal public sector) / 2028 (large federally-regulated private sector).',
    },
    scope: {
      public: true,
      private: true,
      text: {
        zh: '僅拘束聯邦層級受規範主體：聯邦政府、皇家公司、銀行、電信業者、跨省運輸、廣播業，不涵蓋一般加拿大企業（一般企業由各省法規規範，如安大略省的 AODA，與聯邦 ACA 是不同法律）。',
        en: 'Binds federally regulated entities only — federal government, Crown corporations, banks, telecom carriers, interprovincial transport, broadcasting — not general Canadian businesses (those fall under separate provincial law, e.g. Ontario\'s AODA, distinct from the federal ACA).',
      },
    },
    standard: { name: 'EN 301 549 v3.2.1，2024年5月採納為自願性加拿大國家標準（CAN/ASC-EN 301 549:2024）', version: 'EN 301 549 v3.2.1', level: 'AA', binding: '尚未生效——已採納但拘束性技術法規要到 2027（聯邦公部門）/2028（大型聯邦受規範私部門）才施行；今日尚無任何具拘束力的網頁/ICT 技術標準' },
    enforcement: {
      mechanism: {
        zh: '無障礙專員可核發行政罰鍰（每次違規 250 至 25 萬加幣，依嚴重程度、規模與紀錄分級），但 2023-24 財年執法以矯正行動計畫為主（核發 59 件），且都與尚未生效的數位技術標準無關，僅涉及已生效的無障礙計畫與意見回饋義務。目前尚無任何網頁專屬的 ACA 執法案例，因為數位標準尚未生效，這是結構性的。',
        en: 'An Accessibility Commissioner can issue administrative monetary penalties (CAD 250–250,000 per violation, scaled by severity/size/history), but FY2023-24 enforcement was corrective-action-plan-based (59 plans) and concerned only the already-in-force accessibility-plan/feedback obligations, unrelated to the not-yet-in-force digital standard. No web-specific ACA enforcement case exists yet because the digital standard isn\'t in force yet — structural, not a search gap.',
      },
      realCase: null,
    },
    sources: [
      'https://gazette.gc.ca/rp-pr/p2/2025/2025-12-17/html/sor-dors255-eng.html',
      'https://www.blakes.com/insights/federal-government-finalizes-new-digital-technologies-accessibility-regulations/',
      'https://accessible.canada.ca/news/accessibility-standards-canada-adopts-globally-recognized-accessibility-standard-ict-products',
    ],
    confidence: 'high',
  },
  {
    id: 'au',
    name: { zh: '澳洲', en: 'Australia' },
    tier: 'framework-no-web-specifics',
    cardStyle: 'full',
    statute: {
      name: { original: 'Disability Discrimination Act 1992 (Cth)', en: 'Disability Discrimination Act 1992 (Cth)' },
      year: 1992,
      provision: '一般性反歧視禁止規定；沒有任何網頁專屬的修正條文或子法。',
    },
    scope: {
      public: true,
      private: true,
      text: {
        zh: '涵蓋「服務」，澳洲人權委員會（AHRC）已認定網站屬於服務範圍，法規本身沒有類似歐盟微型企業豁免的規模或行業排除。',
        en: 'Covers "services," which the Human Rights Commission has held includes a website; there is no size/sector carve-out comparable to the EU microenterprise exemption in the statute itself.',
      },
    },
    standard: { name: 'AHRC 2014 年諮詢指引建議 WCAG 2.1（原為 2.0）AA 級為實務基準——這是指引，不是法定要求', version: 'WCAG 2.1 AA (guidance)', level: 'AA', binding: '非法定；來自 AHRC 行政指引，不是法規條文' },
    enforcement: {
      mechanism: {
        zh: '向 AHRC 申訴後先進行調解（多數 DDA 申訴在此階段以非公開條件落幕）；調解不成可向聯邦法院起訴。',
        en: 'A complaint to the AHRC leads to conciliation (most DDA complaints resolve here, on non-public terms); if unresolved, the complainant may proceed to the Federal Court.',
      },
      realCase: {
        name: 'Maguire v. Sydney Organising Committee for the Olympic Games (SOCOG)',
        year: 2000,
        outcome: 'HREOC/AHRC 認定網站構成「服務」，SOCOG 未提供無障礙的雪梨奧運售票網站構成直接歧視，判賠 Maguire AUD 20,000；至今仍是本領域的指標判例。',
      },
    },
    sources: [
      'https://en.wikipedia.org/wiki/Maguire_v_Sydney_Organising_Committee_for_the_Olympic_Games',
      'https://humanrights.gov.au/our-work/disability-rights/chapter-1-legal-and-human-rights-obligations',
      'https://humanrights.gov.au/complaints/conciliation-register',
    ],
    confidence: 'high',
  },

  // ---- East Asia (new) ----
  {
    id: 'cn',
    name: { zh: '中國大陸', en: 'China (Mainland)' },
    tier: 'specific-law',
    cardStyle: 'full',
    statute: {
      name: { original: '中华人民共和国无障碍环境建设法', en: 'Law of the PRC on Accessibility Environment Construction' },
      year: 2023,
      provision: '2023-06-28通過，2023-09-01施行。第三章「無障礙資訊交流」專章規範數位／資訊無障礙；第32條為核心條文。',
    },
    scope: {
      public: true,
      private: false,
      text: {
        zh: '第32條：財政資金建立的網站、服務平台與行動應用「應當」逐步達到無障礙設計標準與國家資訊無障礙標準——公部門數位服務強制。同條也鼓勵（非強制）新聞、社群、電商、醫療、金融、教育、交通等民間應用逐步達標，屬軟性義務。',
        en: 'Art. 32: government-funded websites, service platforms, and apps "shall" ("应当") progressively meet accessibility design standards — mandatory for publicly funded digital services. The same article encourages (does not mandate) private-sector apps in news/social/e-commerce/healthcare/finance/education/transport to progressively comply — a soft obligation.',
      },
    },
    standard: { name: 'GB/T 37668-2019（參照 WCAG 2.0/2.1）', version: '2019, WCAG 2.0/2.1-referencing', level: 'AA', binding: '推薦性國家標準（非強制性），僅在第32條「應當」等其他條文要求時才具實質拘束力' },
    enforcement: {
      mechanism: {
        zh: '第65條：主管機關（住建、民政、交通等）限期改正，屆期未改正處人民幣1萬至3萬元（個人100至500元）罰款；第66條電信業違規公開通報；第67條電信業者違規處人民幣1萬至10萬元罰款（罰款金額為次級來源摘要，未逐字核對官方公報原文）。法律施行未滿兩年，本次查核未發現任何無障礙專屬的司法判決或公開執法案例，應陳述為「尚無已知案例」而非「無執法機制」。',
        en: 'Art. 65: authorities order correction within a deadline; uncorrected violations draw fines of RMB 10,000–30,000 for entities (RMB 100–500 for individuals). Art. 66/67: telecom-sector violations draw public notice / RMB 10,000–100,000 fines (fine figures are secondary-summary, not verified against the primary gazette PDF). The law is under two years old; no accessibility-specific court judgment or public enforcement action was found — state as "no known cases yet," not "no enforcement mechanism."',
      },
      realCase: null,
    },
    sources: [
      'https://www.gov.cn/yaowen/liebiao/202306/content_6888910.htm',
      'http://politics.people.com.cn/n1/2023/0629/c1001-40023507.html',
      'https://openstd.samr.gov.cn/bzgk/std/newGbInfo?hcno=35ECC696805C1A67C93B74FB6D0D8EFB',
      'https://www.w3.org/zh-hans/blog/2020/updated-chinese-accessibility-standard/',
    ],
    confidence: 'medium',
  },
  {
    id: 'kr',
    name: { zh: '南韓', en: 'South Korea' },
    tier: 'specific-law',
    cardStyle: 'full',
    statute: {
      // Verification pass 2026-08-29 (east-asia.md #1, CONTRADICTED / superseded): the
      // originally-cited 지능정보화기본법 제46조 was deleted (삭제) 2025-01-21; the
      // equivalent duty now lives in the standalone 디지털포용법 (Digital Inclusion Act,
      // 법률 제20672호), in force since 2026-01-22, at 제19조. Cite the current statute.
      name: { original: '장애인차별금지 및 권리구제 등에 관한 법률 + 디지털포용법', en: 'Act on the Prohibition of Discrimination Against Persons with Disabilities + Digital Inclusion Act' },
      year: 2007,
      provision: '前者第20-21條規範資訊近用與合理便利提供義務（2007制定、2008施行，第21條的合理便利為「提供하여야 한다」強制義務，非努力義務）；後者第19條（2026-01-22施行，取代已廢止的智慧資訊化基本法第46條）課予公部門保障義務，民間業者僅負「努力」義務。',
    },
    scope: {
      public: true,
      private: false,
      text: {
        zh: '國家機關等（公部門）依法「應當」保障數位弱勢族群（涵蓋範圍比身心障礙／高齡更廣）對網站、行動應用、資訊站與電子出版品的近用；智慧資訊服務提供者（含民間）僅負「努力」義務，屬盡力而非硬性標準。',
        en: 'National/public agencies "must" ensure digitally vulnerable groups (a broader category than just disabled/elderly) can access websites, apps, kiosks, and e-publications; intelligent-information-service providers (including private) are only obligated to "endeavor" — a best-efforts, not a hard, duty.',
      },
    },
    standard: { name: 'KWCAG（韓國型網頁內容近用性指引）2.2，2022年更新，4原則14指引33成功標準，結構仿WCAG但為獨立韓國標準', version: '2.2 (2022)', level: 'AA', binding: '公部門為拘束標準；民間為努力義務下的參考標準' },
    enforcement: {
      mechanism: {
        zh: '國家人權委員會調查認定歧視、法務部發出矯正命令後仍未遵行者（依障礙者歧視禁止法第50條），可處最高3,000萬韓元行政罰鍰——此罰則綁定一般歧視矯正命令，與另一條數位包容法第37條（僅適用無人資訊站業者違反第20條第3項矯正命令）的同額罰鍰是兩個不同機制，不可混用。本次查核未能獨立驗證具名的網頁無障礙訴訟案例；業界文獻常提及視障使用者對政府／銀行網站的週期性訴訟，但本次未能對照原始法院紀錄逐一核實具體案名，故不引用未經查證的案例名稱。',
        en: 'If the NHRCK investigates and finds discrimination and a Ministry of Justice corrective order is not complied with (Anti-Discrimination Act Art. 50), an administrative fine of up to KRW 30,000,000 may be imposed — this attaches to the general discrimination corrective order and is a separate mechanism from the Digital Inclusion Act\'s own KRW 30M fine (Art. 37), which applies only to unmanned-kiosk operators violating an Art. 20(3) corrective order; do not conflate the two. This pass could not independently verify a named web-accessibility litigation case against a primary court record; industry literature references periodic screen-reader-user suits against government/bank sites, but no specific case name is cited without verification.',
      },
      realCase: null,
    },
    sources: [
      'https://www.law.go.kr (장애인차별금지 및 권리구제 등에 관한 법률, rendered 2026-08-29)',
      'https://www.law.go.kr (디지털포용법 제19조, rendered 2026-08-29 — supersedes 지능정보화기본법 제46조, repealed 2025-01-21)',
      'https://www.rra.go.kr/ko/reference/kcsList_view.do?nb_seq=5247&nb_type=6',
      'https://a11ykr.github.io/kwcag22/',
    ],
    confidence: 'medium',
  },
  {
    id: 'hk',
    name: { zh: '香港', en: 'Hong Kong SAR' },
    tier: 'framework-no-web-specifics',
    cardStyle: 'full',
    statute: {
      name: { original: 'Disability Discrimination Ordinance (Cap. 487)', en: 'Disability Discrimination Ordinance (Cap. 487)' },
      year: 1995,
      provision: '1995年制定、1996年施行，一般性反歧視條例，沒有任何條文明文提及網站、應用程式或ICT。',
    },
    scope: {
      public: true,
      private: true,
      text: {
        zh: '第26條為核心的「貨品、服務或設施」歧視禁止條文，數位服務透過對「服務」一詞的一般性解釋而落入範圍，並非條例明文規範。',
        en: 'Section 26 is the core "goods, services or facilities" discrimination provision; digital services fall under the general "services" language by interpretation, not explicit statutory text.',
      },
    },
    // Verification pass 2026-08-29 (east-asia.md #5, PARTIALLY CONTRADICTED — version
    // stale): current DPO Web Accessibility Handbook (last reviewed 2026-06-30) targets
    // WCAG 2.2 A/AA/AAA, not 2.0; 1999 origin and non-statutory/government-only
    // characterization confirmed unchanged.
    standard: { name: '政府網站資訊發布指引，數字政策辦公室（前OGCIO）行政政策，起源1999年，現行（2026年6月版）以WCAG 2.2為目標', version: 'WCAG 2.2 AA (government policy)', level: 'AA', binding: '僅拘束政府部門，屬行政政策非條例衍生；私部門無拘束義務，另有自願性「數碼共融計劃」鼓勵採用；約650個政府網站達WCAG合規之數據為次級來源、未獨立驗證' },
    enforcement: {
      mechanism: {
        zh: '向平等機會委員會（EOC）申訴，可先調解，調解不成可向區域法院提告，法院依案例損害賠償級距判賠精神損害（依EOC案例約港幣9,500至475,000元不等）。本次查核找到就業與拒絕提供服務的歧視案例，但未找到網站／數位無障礙專屬的DDO案例，應陳述為「未找到網站案例」而非「DDO從未被執行」。',
        en: 'DDO complaints go to the EOC, which can conciliate; unresolved complaints proceed to the District Court (damages banding roughly HK$9,500–475,000 for injury to feelings, per EOC case summaries). Substantiated employment- and service-refusal cases exist, but no website/digital-accessibility-specific DDO case was found — state as "no web case found," not "DDO has never been enforced."',
      },
      realCase: null,
    },
    sources: [
      'https://www.elegislation.gov.hk/hk/cap487 (DDO full text, rendered directly 2026-08-29 — ss.6/25/26/27 confirmed verbatim)',
      'https://www.eoc.org.hk/en/discrimination-laws/disability-discrimination',
      'https://www.digitalpolicy.gov.hk (Web Accessibility Handbook, rendered directly 2026-08-29 — WCAG 2.2 target confirmed, 1999 origin confirmed)',
      'https://www.eoc.org.hk/en/legal-services/significant-court-cases/hong-kong/disability-discrimination',
      // W3C WAI's HK policy tracker (w3.org/WAI/policies/hong-kong-hksar/) was Cloudflare-
      // blocked in the 2026-08-29 verification pass -- unreachable, not corroboration either way.
    ],
    confidence: 'high',
  },
  {
    id: 'mo',
    name: { zh: '澳門', en: 'Macau SAR' },
    tier: 'no-specific-law',
    cardStyle: 'full',
    statute: null,
    scope: {
      public: false,
      private: false,
      text: {
        zh: '本次查核未找到任何反歧視或無障礙建設專屬法規；澳門的身心障礙框架分散在社會福利類法規（如第9/2011號法律的津貼與醫療制度）中，沒有類似中國大陸2023年法或香港DDO的專法。這是查核範圍內的否定發現，非窮盡式法規資料庫檢索的最終結論，建議後續直接查核澳門政府公報（bo.io.gov.mo）。',
        en: 'No disability-discrimination or web-accessibility statute was found; Macau\'s disability framework is scattered across social-welfare instruments (e.g. Law 9/2011) rather than an anti-discrimination or accessibility-construction law. This is a negative finding from search coverage, not a certified exhaustive legal-database check — recommend a follow-up direct check of Macau\'s official gazette (bo.io.gov.mo).',
      },
    },
    standard: { name: '2021年建築類無障礙通用設計指引（不涵蓋網站）；2014年政府部門網站規範指引據稱含WCAG 2.0基準元素，但無法律效力', version: null, level: null, binding: '無拘束力，僅適用新建設／政府資助項目的行政指引，對私人企業或公開場所無拘束力' },
    enforcement: { mechanism: { zh: '未找到任何執法機制；無專法即無專屬申訴管道或罰則。一般人權申訴管道可能存在，但不在本次查核範圍。', en: 'None found — no statute means no statutory complaint mechanism or penalty specific to (web) accessibility. General discrimination/human-rights complaint channels may exist but were not the object of this search.' }, realCase: null },
    sources: [
      'https://www.macaolaw.gov.mo/',
      'https://www.bo.dsaj.gov.mo/cn/legis',
      'https://www.synergymacao.org/2021/12/06/ronlam20211206a1/',
      'https://www.ias.gov.mo/wp-content/themes/ias/tw/download/2021-11-15_add3.pdf',
    ],
    confidence: 'medium',
  },
  {
    id: 'mn',
    name: { zh: '蒙古', en: 'Mongolia' },
    tier: 'no-specific-law',
    cardStyle: 'full',
    statute: {
      name: { original: 'Law of Mongolia on the Rights of Persons with Disabilities', en: 'Law of Mongolia on the Rights of Persons with Disabilities' },
      year: 2016,
      provision: '2016-02-05由國家大呼拉爾（國會）通過，符合CRPD精神的權利導向立法，據次級摘要涵蓋通訊科技，但本次未能核對到具體條號（官方英譯PDF讀取為無法解析的二進位內容）。',
    },
    scope: {
      public: false,
      private: false,
      text: {
        zh: '法律涵蓋無障礙設施、道路、公共運輸，據次級摘要也涵蓋通訊科技，但沒有網頁專屬的技術標準或條文，G3ict自身的國家概況也指出蒙古的ICT無障礙專業人才「非常少」，仍處於早期階段。',
        en: 'The law covers accommodations, public facilities, roads, transport, and per secondary summaries communication technology — but no web-specific technical standard or provision exists; G3ict\'s own country profile states ICT accessibility is "quite a new notion in Mongolia with very few professionals in the field."',
      },
    },
    standard: { name: '無專屬網頁無障礙技術標準（無「MWCAG」等同物）', version: null, level: null, binding: null },
    enforcement: { mechanism: { zh: '未找到任何無障礙專屬罰則或申訴機制；建築／實體環境無障礙已有查核清單（2022年起），但屬實體環境非數位／網頁範疇。未發現任何網頁無障礙執法或訴訟案例。', en: 'No accessibility-specific penalty/complaint mechanism located; a building/structure accessibility checklist has been in use since 2022, but that is the built environment, not digital/web. No web-accessibility litigation or enforcement example was found.' }, realCase: null },
    sources: [
      'https://dredf.org/wp-content/uploads/2018/10/The-Law-of-Mongolia-on-Human-Rights-of-Persons-with-Disabilities-02-05-16.pdf',
      'https://g3ict.org/country-profile/mongolia',
      'https://www.ohchr.org/en/meeting-summaries/2023/08/experts-committee-rights-persons-disabilities-commend-mongolia',
    ],
    confidence: 'low',
  },

  // ---- South America (new) ----
  {
    id: 'br',
    name: { zh: '巴西', en: 'Brazil' },
    tier: 'specific-law',
    cardStyle: 'full',
    statute: {
      name: { original: 'Lei Brasileira de Inclusão da Pessoa com Deficiência (Estatuto da Pessoa com Deficiência), Lei nº 13.146', en: 'Brazilian Law of Inclusion (LBI), Law No. 13,146' },
      year: 2015,
      provision: '2015-07-06制定，第63條為核心無障礙條文；2026-03-11發布ABNT NBR 17225技術標準，時隔近十年首次補上技術牙齒。',
    },
    scope: {
      public: true,
      private: true,
      text: {
        zh: '第63條本文（葡文）：「總部或商業代表設於巴西的企業，或政府機關，其維護的網站必須無障礙」——這是南美洲目前找到唯一一部由主要條文本身（非附屬條款）直接拘束私部門網站的法律。第1項要求可見的無障礙標誌；第2-3項規範公共上網據點，要求至少一成（最少1台）終端機提供視障使用者無障礙資源。',
        en: 'Art. 63 caput: "accessibility is mandatory for websites maintained by companies headquartered or with commercial representation in Brazil, or by government bodies" — the only South American statute found that reaches private-sector websites by its own main clause, not a subsidiary carve-out. §1 requires a visible accessibility symbol; §§2-3 require ≥10% (min. 1) of public-internet-access terminals to carry accessibility resources for visually impaired users.',
      },
    },
    standard: { name: 'ABNT NBR 17225（2026-03-11發布，是否強制尚待確認）', version: '2026', level: null, binding: '技術標準是否強制或僅為自願參考，本次研究未能確認，列為待查項目' },
    enforcement: {
      mechanism: {
        zh: '聯邦檢察署（MPF）對聯邦政府提起民事公益訴訟，指控其逾十年未就第63條訂定施行細則。2026年判決（Conjur報導，2026-07-08）命聯邦政府180天內提出過渡計畫，使所有聯邦公部門網站合規，違反法院命令者每日罰款巴西幣1萬元。此外LBI對歧視身心障礙者訂有刑事罰則（徒刑1-3年併科罰金），對不服從公益訴訟法院命令者訂有徒刑1-4年併科罰金；民事公益訴訟累計罰款可能超過巴西幣百萬元。',
        en: 'MPF (Federal Public Ministry) filed a civil public action against the Federal Union for failing to regulate Art. 63 for over a decade; a 2026 ruling (reported 2026-07-08) ordered a 180-day transition plan for federal public-administration websites, with a daily fine of R$10,000 for non-compliance with the court order. LBI separately carries criminal penalties for disability discrimination (1-3 years imprisonment + fine) and for disobeying a civil-public-action court order (1-4 years + fine); aggregate civil fines can exceed R$1 million.',
      },
      realCase: { name: 'MPF v. União Federal (civil public action, Art. 63 non-regulation)', year: 2026, outcome: '2026年判決命聯邦政府180天內提出網站無障礙過渡計畫，違反命令每日罰款巴西幣1萬元。' },
    },
    sources: [
      'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13146.htm',
      'https://modeloinicial.com.br/lei/L-13146-2015/lei-brasileira-inclusao-pessoa-deficiencia-estatuto-pessoa-deficiencia/art-63',
      'https://www.mpf.mp.br/o-mpf/unidades/pr-sp/noticias/mpf-exige-que-a-uniao-defina-regras-para-garantir-acessibilidade-em-sites-publicos-e-privados',
      'https://www.conjur.com.br/2026-jul-08/uniao-deve-implementar-adaptacoes-de-acessibilidade-nos-sites-federais/',
      'https://www.cgi.br/noticia/releases/desenvolvida-com-coordenacao-do-ceweb-br-nova-norma-da-abnt-estabelece-requisitos-para-melhorar-a-acessibilidade-de-sites/',
    ],
    confidence: 'medium',
  },
  {
    id: 'ar',
    name: { zh: '阿根廷', en: 'Argentina' },
    tier: 'specific-law',
    cardStyle: 'full',
    statute: {
      name: { original: 'Ley 26.653 de Accesibilidad de la Información en las Páginas Web', en: 'Web Information Accessibility Law No. 26,653' },
      year: 2010,
      provision: '2010-11-03通過，2010-11-30公告；ONTI第2/2014號決議訂定「2.0網頁無障礙標準」施行細節。',
    },
    scope: {
      public: true,
      private: false,
      text: {
        zh: '廣義公部門加上與國家有契約或受益關係的私人主體：國家三權機關、去中心化／自治機關、非國家公共實體、國營企業、持有公共服務特許的私人公司；也涵蓋向國家提供商品／服務的私人承包商，以及接受國家補助、捐贈或福利的公民社會組織（第10條將持續受益資格與合規綁定）。與國家無關係的一般私部門網站不受規範。',
        en: 'Public sector broadly defined, plus state contractors and subsidy recipients — not general private enterprise: all three branches of national government, decentralized/autonomous bodies, non-state public entities, state-owned companies, and private companies holding public-service concessions, plus state contractors and civil-society entities receiving state subsidies (Art. 10 ties continued eligibility to compliance). General private-sector sites with no state relationship are out of scope.',
      },
    },
    standard: { name: 'ONTI 2014年決議採用WCAG 2.0；現行採購實務逐漸要求WCAG 2.1 AA（尚非法定硬性門檻）', version: '2.0 (statutory); 2.1 AA (procurement trend)', level: 'AA', binding: '公部門及受規範私人主體強制；新頁面12個月、既有頁面24個月的合規期限，並訂有分階段合規門檻（首期50分、次期80分）' },
    enforcement: {
      mechanism: {
        zh: '主管機關為數位政府與科技創新事務局（前ONTI），可對官員施行政制裁並尋求司法強制執行。真實案例：聯邦行政爭訟法院第3庭於2021-04-13就ACIJ代表視障律師對司法委員會與最高法院提起的訴訟作出判決，命司法案件管理入口網站達到螢幕閱讀器可用，法院明確引用第26.653號法律，認定國家「完全怠於履行」法定義務。',
        en: 'Enforcing authority is the Secretaría de Gobierno Digital e Innovación Tecnológica (ONTI\'s successor), which can sanction officials and seek judicial enforcement. Real case: Federal Administrative Contentious Court No. 3 ruled (2021-04-13) in a suit by visually impaired lawyers with ACIJ against the National Judicial Council and Supreme Court, ordering the Judiciary\'s case-management portal made screen-reader accessible, explicitly invoking Ley 26.653 and finding the State in "absolute omission" of a mandatory duty.',
      },
      realCase: { name: 'ACIJ v. Consejo de la Magistratura / Corte Suprema de Justicia', year: 2021, outcome: '法院命司法案件管理入口網站達到螢幕閱讀器可用，援引第26.653號法律。' },
    },
    sources: [
      'https://www.argentina.gob.ar/normativa/nacional/175694/texto',
      'https://observatorioplanificacion.cepal.org/es/marcos-regulatorios/ley-26653-accesibilidad-de-la-informacion-en-las-paginas-web-de-argentina',
      'https://acij.org.ar/un-nuevo-fallo-obliga-a-la-justicia-nacional-a-garantizar-accesibilidad-en-su-sitio-web-para-que-personas-con-discapacidad-visual-puedan-utilizarlo-en-condiciones-de-igualdad/',
      'https://www.argentina.gob.ar/jefatura/innovacion-publica/onti/evaluacion-accesibilidad-web',
    ],
    confidence: 'high',
  },
  {
    id: 'co',
    name: { zh: '哥倫比亞', en: 'Colombia' },
    tier: 'specific-law',
    cardStyle: 'full',
    statute: {
      name: { original: 'Resolución 1519 de 2020 (MinTIC), under Ley 1712 de 2014', en: 'Resolution 1519 of 2020 (MinTIC), under Law 1712 of 2014 (Transparency Law)' },
      year: 2020,
      provision: '在2014年透明與公共資訊近用法的架構下，訂定網頁無障礙、資訊透明、數位安全與開放資料的統一指引。',
    },
    scope: {
      public: true,
      private: false,
      text: {
        zh: '僅適用第1712號法下的「義務主體」（公部門資訊揭露義務對象），本決議未找到任何私部門義務。',
        en: 'Applies only to "obligated subjects" under Ley 1712 (public entities with information-disclosure duties) — no private-sector obligation found in this resolution.',
      },
    },
    standard: { name: 'WCAG 2.1（未指定等級）或哥倫比亞國家標準NTC 5854:2011（分A/AA/AAA三級）二擇一', version: '2.1', level: null, binding: '公部門自2022-01-01起強制達標；具體要求哪個等級（A/AA/AAA）本次未在查核來源中找到明文，列為待查項目' },
    enforcement: { mechanism: { zh: '本次查核未找到任何網頁無障礙專屬的罰則表或執法案例。曾核對一件憲法法院判決（T-553/11，命司法委員會改善法院建築物的坡道、電梯等實體無障礙設施），但那是實體無障礙案例，與網頁無障礙無關，列於此僅為記錄「已查核、不適用」。', en: 'No specific penalty schedule or real enforcement case for web accessibility was located. A related Constitutional Court case (T-553/11) ordered physical/architectural accessibility improvements to a courthouse — not a web-accessibility ruling, noted here only to record it was checked and found inapplicable.' }, realCase: null },
    sources: [
      'https://www.inci.gov.co/blog/inci-celebra-expedicion-de-la-resolucion-1519-de-2020-que-emite-lineamientos-sobre',
      'https://gobiernodigital.mintic.gov.co/692/w3-article-160997.html',
      'https://www.corteconstitucional.gov.co/relatoria/2011/T-553-11.htm',
    ],
    confidence: 'medium',
  },

  // ---- South America regional comparison group (south-america.md "regional-tier note") ----
  {
    id: 'cl',
    name: { zh: '智利', en: 'Chile' },
    tier: 'specific-law',
    cardStyle: 'grouped',
    statute: { name: { original: 'Ley 20.422 (2010) + Decreto No. 1 (2015)', en: 'Ley 20.422 (2010) + Supreme Decree No. 1 (2015)' }, year: 2010, provision: '第20.422號法建立身心障礙者機會平等一般架構；第1號行政命令核准「網站系統與網站技術規範」，適用國家行政機關。' },
    scope: { public: true, private: false, text: { zh: '僅適用第18,575號組織法第1條所列的國家行政機關，明確排除國營企業。', en: 'Applies only to State Administration bodies listed under Ley 18,575 Art. 1, explicitly excluding state-created public enterprises.' } },
    standard: { name: 'WCAG 2.0 AA（依SENADIS 2017年更新指引）', version: '2.0 AA', level: 'AA', binding: '僅拘束公部門' },
    enforcement: { mechanism: { zh: '未找到罰則表或實際案例。', en: 'No penalty schedule or real case found.' }, realCase: null },
    sources: ['https://vlex.cl/vid/decreto-num-1-publicado-573535414', 'https://www.senadis.gob.cl/descarga/i/3676/documento'],
    confidence: 'medium',
  },
  // Promoted out of the regional-comparison group (verification pass 2026-08-29): Peru's
  // private-sector clause is now primary-quoted, not single-source-cluster — comparable
  // substance to the Brazil/Argentina/Colombia full cards above, so it renders as one too.
  {
    id: 'pe',
    name: { zh: '秘魯', en: 'Peru' },
    tier: 'specific-law',
    cardStyle: 'full',
    // Verification pass 2026-08-29 (south-america.md #1, VERIFIED with direct quote):
    // fetched the official gazette PDF (leyes.congreso.gob.pe, El Peruano 24 Dec 2012,
    // p. 482013) directly — the private-sector clause is written into Ley 29973 itself
    // (Décima Tercera Disposición Complementaria Modificatoria), not a secondary-source
    // paraphrase. Upgraded from single-source-cluster to primary-quoted.
    statute: { name: { original: 'Ley No. 29973 (Décima Tercera Disposición Complementaria Modificatoria de la Ley 28530) + Decreto Supremo No. 002-2014-MIMP', en: 'Law No. 29,973 (13th Complementary Amending Provision to Law 28530) + Supreme Decree No. 002-2014-MIMP' }, year: 2012, provision: '修正第28530號法第3條：「提供消費者資訊服務或其他服務的私人自然人或法人，須於其網頁或網路入口併入身心障礙者可用的近用選項」——與公部門及大學義務規定於同一條文，同一款待遇。' },
    scope: { public: true, private: true, text: { zh: '比阿根廷、智利、哥倫比亞、烏拉圭都廣——2026-08-29直接查核官方公報PDF（El Peruano，2012-12-24第482013頁）確認第28530號法第3條原文明文規定：向消費者提供資訊或其他服務的私人自然人或法人，須在網頁／入口網站併入身心障礙者近用選項，與公部門、大學義務同條同款，非附屬條款。條文本身未指定技術標準或合規等級。', en: 'Broader than most of the region. The 2026-08-29 verification pass fetched the official gazette PDF directly (El Peruano, 2012-12-24, p. 482013) and confirmed Ley 28530 Art. 3 explicitly requires private natural/legal persons offering consumer-information or other services via webpages to build in accessibility options — on the same footing as the public-entity/university duty in the same article, not a subsidiary carve-out. The article itself names no technical standard or conformance level.' } },
    standard: { name: '2016年起逐步與國際標準接軌的秘魯技術標準；確切WCAG版本／等級本次未確認（條文本身未指定）', version: null, level: null, binding: '不確定' },
    enforcement: { mechanism: { zh: 'CONADIS為違規裁罰主管機關（第29973號法第80-85條，一般性裁罰權限，涵蓋所有本法違規），罰則以UIT（秘魯課稅單位指數）計算，估計2026年每違規單位約S/5,150，依輕重分級；查核公報全文未見任何專門對應第28530號法第3條的裁罰項目，故「未找到具名的網頁無障礙執法案例」的結論維持不變。', en: 'CONADIS is the competent body for sanctions (Ley 29973 Arts. 80-85, general-purpose authority covering all infractions under the law), pegged to Peru\'s UIT tax-unit index (est. S/5,150 per infraction unit for 2026, tiered by severity); the fetched gazette text shows no sanction line item tied specifically to Ley 28530 Art. 3, so "no named web-accessibility enforcement case" stands unchanged.' }, realCase: null },
    sources: ['https://www.leyes.congreso.gob.pe/Documentos/Leyes/29973.pdf (official gazette PDF, fetched and read directly 2026-08-29, p. 13 of 15)', 'https://www.gob.pe/institucion/pcm/colecciones/73043-normativas-que-regulan-la-accesibilidad-digital-en-peru', 'https://hiperderecho.org/2024/04/crean-sello-de-accesibilidad-digital-en-que-consiste/'],
    confidence: 'medium',
  },
  {
    id: 'uy',
    name: { zh: '烏拉圭', en: 'Uruguay' },
    tier: 'specific-law',
    cardStyle: 'grouped',
    statute: { name: { original: 'Ley No. 19.924, Art. 88 + Decreto No. 406/022', en: 'Ley No. 19,924, Art. 88 + Decreto No. 406/022' }, year: 2022, provision: '母法第88條為框架條文，Decreto 406/022（2022年底核准，2023-01-16公告）訂定實施細節。' },
    scope: { public: true, private: false, text: { zh: '以公部門為中心——省級政府、自治機關、去中心化服務、非國家公共實體，加上行政部門得指定納入的特定私人產業（選擇性擴大機制，非一般性私部門義務）。', en: 'Public-sector-centered — departmental governments, autonomous entities, decentralized services, non-state public entities — plus specific private-activity sectors the Executive Power may designate (an opt-in extension, not a general private mandate).' } },
    standard: { name: 'WCAG 2.1 A/AA（Decreto 406/022，由AGESIC管理）', version: '2.1 A/AA', level: 'AA', binding: '公部門強制；為本區域技術上最新的規範框架' },
    enforcement: { mechanism: { zh: '未找到罰則表或實際案例。', en: 'No penalty schedule or real case found.' }, realCase: null },
    sources: ['https://www.impo.com.uy/bases/decretos-originales/406-2022', 'https://www.gub.uy/agencia-gobierno-electronico-sociedad-informacion-conocimiento/comunicacion/noticias/se-aprobo-decreto-sobre-accesibilidad-digital'],
    confidence: 'medium',
  },
  {
    id: 'ec',
    name: { zh: '厄瓜多', en: 'Ecuador' },
    tier: 'specific-law',
    cardStyle: 'grouped',
    // Open flag (south-america.md #4, not re-checked in the verification pass): the exact
    // article number in the Organic Law itself that states the public/private
    // website-accessibility requirement was not pinned down — do not cite an article
    // number for this specific clause as confirmed fact.
    statute: { name: { original: 'Ley Orgánica de Discapacidades + Decreto Ejecutivo 194', en: 'Organic Law on Disabilities + Executive Decree 194' }, year: 2012, provision: '公私部門網站無障礙義務所在的確切條號本次未查得（來源可定位到法律，但未逐條核對）；搭配專屬技術標準NTE INEN-ISO/IEC 40500（採用WCAG 2.0），2014-01-28公報公告，INEN 288為強制施行的技術法規（此部分條號已核實）。' },
    scope: { public: true, private: true, text: { zh: '明文規定公部門與私部門機構皆須設有無障礙網站——企圖心與巴西相當，但私部門這一半的執法機制在公開來源中未見記載，且法條的確切條號未經逐條核對。', en: 'States explicitly that both public and private institutions must have accessible websites — comparable in ambition to Brazil\'s clause — but the enforcement mechanism for the private-sector half is not documented in the sources found, and the exact article number for this clause has not been individually verified.' } },
    standard: { name: 'NTE INEN-ISO/IEC 40500（= WCAG 2.0），依INEN 288強制施行', version: '2.0', level: 'A', binding: '強制；2018-08-08起要求所有提供公共服務的厄瓜多網站達WCAG 2.0 A級' },
    enforcement: { mechanism: { zh: 'CONADIS將違反本法所生罰款導向權利倡議活動；未找到網頁無障礙專屬的罰則表或具名案例。', en: 'CONADIS directs monetary sanctions from violations toward rights-promotion campaigns; no web-accessibility-specific sanction schedule or named case was found.' }, realCase: null },
    sources: ['https://www.consejodiscapacidades.gob.ec/accesibilidad-web-en-ecuador/', 'https://accesibilidadenlaweb.blogspot.com/2014/02/ecuador-ya-tiene-una-norma-sobre.html'],
    confidence: 'low',
  },

  // ---- Honest-nulls / thin sourcing — one-line entries ----
  {
    id: 've',
    name: { zh: '委內瑞拉', en: 'Venezuela' },
    tier: 'no-specific-law',
    cardStyle: 'oneline',
    statute: null,
    scope: { public: true, private: false, text: { zh: 'Resolución 026/2011（公報第39,633號）僅為公部門入口網站的行政指引（參照WCAG 1.0/2.0），非拘束性法律；單一來源群，未交叉驗證。', en: 'Resolución 026/2011 (Gaceta Oficial No. 39,633) sets non-binding guidance (referencing WCAG 1.0/2.0) for public-administration portals only; single-source-cluster, not cross-verified.' } },
    standard: null,
    enforcement: { mechanism: null, realCase: null },
    sources: ['https://www.gacetaoficial.io/venezuela/2011-03-14-gaceta-oficial-39633'],
    confidence: 'low',
  },
  {
    id: 'bo',
    name: { zh: '玻利維亞', en: 'Bolivia' },
    tier: 'no-specific-law',
    cardStyle: 'oneline',
    statute: null,
    scope: { public: false, private: false, text: { zh: '未找到網頁無障礙法規；憲法有一般性身心障礙權利與資訊近用條文，政府網站規範指引據稱有一章談無障礙，但屬行政指引非法律，來源單薄，列為未確認而非確定的「無」。', en: 'No web-accessibility law found; general constitutional disability/information-access rights exist, and a government-website standardization guide reportedly devotes one chapter to accessibility, but this is administrative guidance, not law — thin sourcing, treat as unconfirmed rather than a solid "no law" finding.' } },
    standard: null,
    enforcement: { mechanism: null, realCase: null },
    sources: ['https://accesibilidadweb.dlsi.ua.es/?menu=bolivia'],
    confidence: 'low',
  },
  {
    id: 'py',
    name: { zh: '巴拉圭', en: 'Paraguay' },
    tier: 'no-specific-law',
    cardStyle: 'oneline',
    statute: null,
    scope: { public: true, private: false, text: { zh: '第5282/2015號法（身心障礙權利國家行動政策）據單一次級來源指稱要求公共資訊網站「完全無障礙」，Decreto 4064為施行細則；未對照官方公報原文，列為不確定。', en: 'Ley 5282/2015 (national disability-rights action policy) is cited by one secondary source as requiring public-information websites to be "completely accessible," with Decreto 4064 as implementing regulation; not corroborated against the official Gaceta Oficial text — uncertain.' } },
    standard: null,
    enforcement: { mechanism: null, realCase: null },
    sources: ['https://www.redalyc.org/journal/3505/350566284015/html/'],
    confidence: 'low',
  },
  {
    id: 'gy',
    name: { zh: '蓋亞那', en: 'Guyana' },
    tier: 'no-specific-law',
    cardStyle: 'oneline',
    statute: null,
    scope: { public: false, private: false, text: { zh: '2010年身心障礙者法（第36:05章）為一般性反歧視法，涵蓋實體與資訊近用，但未找到任何網頁專屬條文或技術標準——這是已查證的缺無，非查核缺口。', en: 'Persons with Disabilities Act 2010 (Cap. 36:05) is a general disability/anti-discrimination law covering physical and informational access; no web-specific accessibility provision or technical standard was found — a verified absence, not a search gap.' } },
    standard: null,
    enforcement: { mechanism: null, realCase: null },
    sources: ['https://webapps.ilo.org/dyn/natlex/natlex4.detail?p_lang=en&p_isn=99459&p_country=GUY&p_count=195&p_classification=08.01&p_classcount=1', 'https://www.parliament.gov.gy/publications/acts-of-parliament/persons-with-disability-act-2010'],
    confidence: 'medium',
  },
  {
    id: 'sr',
    name: { zh: '蘇利南', en: 'Suriname' },
    tier: 'no-specific-law',
    cardStyle: 'oneline',
    statute: null,
    scope: { public: false, private: false, text: { zh: '本次查核未搜尋荷蘭語原始來源（語言缺口），未找到任何身心障礙或網頁無障礙專屬法規；這是搜尋方法的缺口，不是已確認的「無」，需要荷蘭語後續查證。', en: 'This pass did not search Dutch-language primary sources (a language gap); no disability-specific or web-accessibility law surfaced. This is a search-method gap, not a confirmed "no law" — needs a Dutch-language follow-up.' } },
    standard: null,
    enforcement: { mechanism: null, realCase: null },
    sources: [],
    confidence: 'low',
  },
];

// SEVERITY_MATRIX-style lookup: which jurisdictions have a technical standard at/below a
// given WCAG level (A < AA < AAA). AAA is never a binding floor anywhere in this dataset —
// every tracked standard (WCAG 2.x AA, EN 301 549, JIS X 8341-3, KWCAG 2.2, GB/T 37668,
// NTC 5854, INEN 40500...) tops out at AA. This is the honest technical-mapping check that
// replaces the old identical-boilerplate legal_exposure string.
const LEVEL_RANK = { A: 1, AA: 2, AAA: 3 };

function jurisdictionsCoveringLevel(level) {
  // Any binding-or-government-facing technical standard reaches at least AA, so it covers
  // any finding at A or AA; nothing in this dataset reaches AAA.
  if (level === 'AAA') return [];
  return JURISDICTIONS.filter(j => (j.cardStyle === 'full' || j.cardStyle === 'grouped') && j.standard && j.standard.level);
}

// The per-finding replacement for the old hardcoded "May affect ADA / EAA / JIS / Taiwan..."
// string (static-audit.mjs addFinding()) — derives from the WCAG level the finding actually
// carries, and is honest that this is a technical-standard summary, not a legal opinion.
export function legalExposureFor(level) {
  if (level === 'AAA') {
    return {
      zh: '此為 AAA 等級的最佳實務準則；本資料集追蹤的所有法域，其具拘束力或政府適用的技術標準都不要求 AAA 等級一致性。這是技術對照，不是逐法域的法律判斷。',
      en: 'This is an AAA-level best-practice criterion; none of the tracked jurisdictions\' binding or government-facing technical standards require AAA conformance. Technical mapping only, not a jurisdiction-specific legal determination.',
    };
  }
  const names = jurisdictionsCoveringLevel(level).map(j => j.name.en);
  return {
    zh: `此準則屬 A／AA 等級，落在多數追蹤法域技術標準的範圍內（例如 WCAG 2.1 AA、EN 301 549、JIS X 8341-3、KWCAG 2.2、GB/T 37668 等），包括：${names.join('、')}。這是摘要層級的技術對照，不是逐法域、逐準則的法律判斷；實際曝險取決於部署情境、目標市場，以及該法域規範是否已經生效。`,
    en: `This criterion is at A/AA level, within the range most tracked jurisdictions' technical standards cover (e.g. WCAG 2.1 AA, EN 301 549, JIS X 8341-3, KWCAG 2.2, GB/T 37668), including: ${names.join(', ')}. This is a summary-level technical mapping, not a jurisdiction-by-jurisdiction legal determination; actual exposure depends on deployment context, target market, and whether that jurisdiction's rule is currently in force.`,
  };
}
