# Competitive scan: established a11y tools moving into AI, and the gaps left for an independent scanner

Date: 2026-07-27
Scope: Deque/axe, Lighthouse, WAVE/WebAIM, Siteimprove, Level Access, Silktide, Pa11y, IBM Equal Access, overlays (accessiBe/UserWay), 2025-2026 AI-marketed entrants (LambdaTest/TestMu, plus MCP-server entrants).

Every claim below is either sourced with a URL or marked "uncited - plausible" / "no evidence found" per the instructions.

---

## 1. Deque (axe-core, axe DevTools, axe Linter/Watcher, axe MCP Server)

- axe-core is the open-source rules engine; industry claim is it finds on average 57% of WCAG issues automatically and aims for zero false positives - Rocket Validator, Axe Core at Scale: https://rocketvalidator.com/axe-core . A separate secondary source states axe-core-class deterministic engines reliably detect ~30-50% of WCAG criteria - QASkills.sh, 2026-05: https://qaskills.sh/blog/axe-devtools-accessibility-testing-guide-2026 . These two figures (57% of issues vs 30-50% of criteria) are not the same denominator; treat both as vendor/secondary-source framing, not a single agreed number.
- 2026 AI features: Intelligent Guided Tests (IGTs) - semi-automated flows that ask a human simple questions and run complex checks in the background; auto-replay, keyboard-trap detection, Jira integration - Deque blog "Make accessibility testing up to 4x faster": https://www.deque.com/blog/make-accessibility-testing-up-to-4x-faster-with-deques-new-ai-powered-features/ , Deque blog three new features: https://www.deque.com/blog/deque-introduces-three-new-features-to-advance-accessibility-test-automation/
- Deque ships an official Axe MCP Server (dequelabs/axe-mcp-server-public) with two tools - analyze (scan) and remediate (AI code-level fix suggestions) - that plugs into Claude, Copilot, Cursor, Windsurf, VS Code and any MCP client. This is the clearest existing AI-agent-as-user integration found in the market - Deque axe MCP Server: https://www.deque.com/axe/mcp-server/ , GitHub dequelabs/axe-mcp-server-public: https://github.com/dequelabs/axe-mcp-server-public
- Single score: axe DevTools/axe-core does NOT publish a single 0-100 accessibility score itself (that is Lighthouse's layer on top of axe-core rule results) - Chrome for Developers, Lighthouse scoring: https://developer.chrome.com/docs/lighthouse/accessibility/scoring confirms Lighthouse's score is "a weighted average of all accessibility audits... using the axe-core library."
- Pricing: axe DevTools Pro from ~$45/user/month; enterprise contracts commonly $15k-$50k/yr for small-mid teams, $75k-$250k+/yr for full monitoring+services - Vendr: https://www.vendr.com/marketplace/deque , TrustRadius: https://www.trustradius.com/products/deque-systems-axe-devtools/pricing
- Honesty about coverage: Deque is generally candid in its own docs that automated testing is partial and IGTs are explicitly semi-automated (human answers questions) rather than claiming full automation - consistent with the 57%/30-50% figures above.

## 2. Google Lighthouse

- Uses axe-core under the hood; score is a weighted average of audits, weighting drawn from axe user-impact assessments - Chrome for Developers: https://developer.chrome.com/docs/lighthouse/accessibility/scoring
- Widely cited limitation: Lighthouse/automated tools can only detect ~30-40% of accessibility issues, and only about 30% of WCAG 2.1 success criteria can be tested with an automated tool - DEV Community "Your accessibility score is lying to you": https://dev.to/chris_devto/your-accessibility-score-is-lying-to-you-5fh2 , accessibility-test.org: https://accessibility-test.org/blog/testing-tools/lighthouse-accessibility-score-insights-and-limitations/ , AFixt: https://afixt.com/why-your-lighthouse-score-of-100-means-almost-nothing/
- Single score: yes, 0-100, and this is exactly the criticism - a 100 is read by non-experts as "fully accessible" when it only means "cleared the ~30-40% that's machine-checkable." No "insufficient evidence" state exists; every criterion is pass/fail/not-applicable, never "uncertain."
- No AI-agent-workflow integration of its own beyond being callable via CI/Node/CLI; no MCP server, no agentic remediation layer - no evidence found of Google adding LLM-based fix suggestions to Lighthouse itself as of this scan.

## 3. WAVE / WebAIM

- Free browser extension + web evaluator; overlays visual error/warning/feature icons directly on the page; checks WCAG 2.1 A/AA, structure, ARIA - accessibilitychecker.org roundup: https://www.accessibilitychecker.org/blog/top-five-accessibility-checkers/ , ratedwithai.com: https://ratedwithai.com/blog/best-website-accessibility-checker-tools-2026
- No evidence found of WAVE adding AI/LLM features, an MCP server, or agent integration - it remains a manual browser-extension/point-and-click tool. No single aggregate score (reports counts of errors/alerts/features per category, not a 0-100 number). The "WebAIM deliberately avoids a single score" framing is inferred from tool descriptions, not a direct WebAIM statement - flag as uncited - plausible.

## 4. Siteimprove

- Added an AI Assistant (plain-language issue explanations + suggested fixes) and AI Remediate (AI-generated code fixes), plus an Accessibility Code Checker for CI/CD shift-left testing - Siteimprove help center: https://help.siteimprove.com/support/solutions/articles/80001166886-feb-6th-2025-accessibility-code-checker , summarized via accessibilitychecker.org Siteimprove review: https://www.accessibilitychecker.org/blog/siteimprove-review/
- Positioned as an enterprise governance platform (accessibility + SEO + QA + analytics) with prioritization by business impact - BrowserStack Siteimprove alternatives guide: https://www.browserstack.com/guide/siteimprove-alternatives
- No evidence found of Siteimprove publishing precision/recall against a ground-truth set, or of an "insufficient evidence" result state, or of a coding-agent/MCP integration - its AI layer targets human remediation workflows and CI/CD pipelines, not an agent-as-user.

## 5. Level Access

- Level Access AMP (Accessibility Management Platform) - enterprise end-to-end program management: testing, tracking, training, risk/compliance, expert services - Slashdot comparison: https://slashdot.org/software/comparison/Level-Access-Accessibility-Platform-vs-Siteimprove/ . No detail found on AI-specific features comparable to Siteimprove's AI Assistant; treat "Level Access has no comparable AI-remediation feature yet" as uncited - plausible, not confirmed absence.
- No evidence found of an MCP server, agent-workflow integration, or published precision/recall.

## 6. Silktide

- UK-based web governance platform (accessibility + content quality + SEO), strong in UK government/education - G2 Silktide: https://www.g2.com/products/silktide/reviews , University of Maryland accessibility tools page: https://www.umaryland.edu/accessibility/tools-and-testing/silktide/
- Markets AI that "interprets semantic structure, visual elements, and user intent" to identify barriers, and analyzes visual components (images/buttons/layouts) for purpose/gaps - G2 Features: https://www.g2.com/products/silktide/features (vendor-sourced framing; treat performance claims as marketing, not independently verified - uncited - plausible for actual accuracy).
- No evidence found of ground-truth precision/recall, "insufficient evidence" state, bilingual reporting, or coding-agent integration.

## 7. Pa11y / IBM Equal Access Accessibility Checker

- Pa11y: free, open-source CLI tool, WCAG 2.1/2.2 coverage via axe-core/HTML_CodeSniffer-style rules - confirmed still one of the "major scanners" as of April 2026 - Vervali, WCAG 3.0 2026 tools roundup: https://www.vervali.com/blog/wcag-3-0-accessibility-testing-compliance-2026-standards-timeline-tools-and-how-to-prepare-your-stack/
- IBM Equal Access Accessibility Checker: no search results surfaced any 2026 AI-feature update - explicit no-evidence-found result from a targeted search; IBM's tool appears to remain a static rule-based checker with no recent public AI announcement found in this pass.
- Neither tool has a single aggregate score by design (Pa11y reports pass/error/warning/notice counts per rule); no evidence of MCP/agent integration for either.

## 8. Overlays - accessiBe / UserWay (AI accessibility marketing, and why it's the cautionary case, not the competitive threat)

- accessiBe: FTC fined it $1M in April 2025 for false advertising and fake reviews, specifically for misrepresenting that its AI widget could make any site WCAG-compliant - RatedWithAI accessiBe review: https://ratedwithai.com/blog/accessibe-review-2026 , lawfold.com settlement summary: https://lawfold.com/accessibe-lawsuit-settlement-2026/ . Blind users in legal-proceeding recordings failed basic tasks on accessiBe-equipped sites that sighted users completed in seconds - same source.
- UserWay: class-action filed 2024 in Delaware District Court alleging the widget was marketed as a "simple, foolproof ADA compliance solution" and failed; as of February 2026 a Magistrate Judge recommended denying UserWay's motion to dismiss - case is proceeding - lflegal.com overlays category: https://www.lflegal.com/category/digital-accessibility/overlays/ , Adirondack Website Design summary: https://adirondackwebsitedesign.com/lawsuits-rise-against-companies-using-overlay-solutions-like-accessibe-and-userway-adirondack-website-design/
- Over 1,000 companies running active overlay widgets were sued for inaccessibility in 2024 per UsableNet, cited via the Adirondack Website Design link above.
- Takeaway: overlays are the industry's clearest example of "AI accessibility" marketing outrunning actual capability, now with regulatory (FTC) and litigation consequences. Reputational cover for an honest independent scanner to point at, but overlays are a remediation-widget category, orthogonal to a scanner, not really a detection-tooling competitor.

## 9. 2025-2026 new "AI accessibility testing" entrants

- LambdaTest / TestMu AI: launched LambdaTest Web Scanner (Oct 2025) combining visual regression (SmartUI) + WCAG accessibility testing in one browser-based tool - FinancialContent/BusinessWire, 2025-10-24: https://markets.financialcontent.com/stocks/article/bizwire-2025-10-24-lambdatest-unveils-ai-powered-web-scanner-for-scalable-visual-and-accessibility-testing . TestMu AI Accessibility Testing Suite plugs WCAG/ADA/Section 508 checks into existing Selenium/Cypress suites - https://www.testmuai.com/blog/automated-accessibilty-testing-tools/ . CI/test-suite integration, not agent-as-user.
- Community-Access/accessibility-agents (open source, GitHub): "eleven specialists" - Claude Code/Copilot/Claude Desktop review agents enforcing WCAG 2.2 AA, explicitly aimed at stopping AI coding tools from generating inaccessible code in the first place, plus an MCP server exposing 24 scanning tools - https://github.com/Community-Access/accessibility-agents . Closest thing found to "agent-native, prevention-not-just-detection" positioning.
- A11y Pulse, BrowserStack MCP (accessibility tools), a11ymcp (ronantakizawa): all wrap an existing scanning engine (mostly axe-core-derived) behind an MCP interface for Claude/Cursor/Copilot - https://www.a11ypulse.com/features/mcp-server/ , https://www.browserstack.com/docs/browserstack-mcp-server/tools/accessibility , https://mcpservers.org/servers/ronantakizawa/a11ymcp . Industry commentary: "the accessibility tooling ecosystem and the AI coding tool ecosystem are merging fast... MCP servers now serving as the connective tissue" - Jeikin, "Accessibility MCP servers compared 2026": https://jeikin.com/blog/accessibility-mcp-servers-compared-2026
- General 2026 industry consensus: as of April 2026 no scanner has native WCAG 3.0 support; "the tooling that matters in 2026 is mostly built on axe-core plus screen readers plus paid disabled testers" - Vervali WCAG 3.0 roundup (link above in section 7).

---

## Comparison axes - direct answers

### (a) Does anyone publish a ground-truth validated precision/recall for their own detectors?

No evidence found of any commercial vendor (Deque, Siteimprove, Level Access, Silktide, WAVE, accessiBe, UserWay, LambdaTest) publishing precision/recall against an independent ground-truth dataset for their own product. What exists is academic/research-side: MotorEase (mobile motor-impairment detector) was benchmarked against Google's own Accessibility Scanner on the MotorCheck ground-truth set - MotorEase scored 1.0000 precision / 0.6648 recall, Google's Accessibility Scanner scored 0.5556 precision / 0.5085 recall - arXiv:2403.13690: https://arxiv.org/pdf/2403.13690 . That is a third party benchmarking Google's tool, not Google self-reporting. Secondary commentary notes the structural reason: heuristic scanners that lack ground-truth references publish recall-leaning numbers because they cannot measure their own precision (general methodology point surfaced during this search pass, no single vendor citation - uncited - plausible as a general pattern description). Net: this axis is wide open for an independent scanner that publishes its own precision/recall against a real ground-truth set - nobody else in this list does it.

### (b) Does anyone represent "insufficient evidence" as a state rather than a number?

No evidence found. Every tool surveyed returns pass/fail/warning/notice or folds everything into a single weighted score (Lighthouse, AccessibilityChecker.org-style 0-100 scores). The closest adjacent idea found is a research paper's recommendation that "tools should report the confidence level associated with a specific error when they cannot be sure it is an actual error" - ACM TACCESS, "The Transparency of Automatic Web Accessibility Evaluation Tools": https://dl.acm.org/doi/10.1145/3556979 - which is a call for confidence-scoring, not evidence that any shipped product does it. No vendor was found treating "we don't have enough signal to judge this criterion" as a distinct, surfaced state (as opposed to silently marking it "manual review needed" in a footnote). This is a clear, confirmed gap.

### (c) Does anyone ship a bilingual (zh/en) report?

No evidence found. Searches for multilingual/bilingual WCAG report generators returned only generic guidance on making websites accessible in multiple languages (lang attributes, screen-reader locale support) - Ben Myers, multilingual web accessibility: https://benmyers.dev/blog/multilingual-web-accessibility/ , Skynet Technologies: https://www.skynettechnologies.com/blog/multiple-language-websites-accessibility - not any vendor's own report output being bilingual. The W3C WCAG-EM Report Tool is English-only tooling for a human to fill in, not an auto-generated bilingual artifact - https://www.w3.org/WAI/news/2016-03-17/wcag-em-report-tool-accessibility-evaluation-report-generator/ . Confirmed gap.

### (d) Does anyone target the AI-agent-as-user workflow rather than CI or a browser extension?

Partial yes - this is the most contested axis. Deque's Axe MCP Server is a real, shipped, official product doing exactly this (scan + AI remediate, inside Claude/Copilot/Cursor) - https://www.deque.com/axe/mcp-server/ . BrowserStack, A11y Pulse, and the open-source a11ymcp/accessibility-agents projects do the same, generally as a thin MCP wrapper around axe-core rather than a purpose-built agent-native engine. So: the wrapper pattern is now common (2025-2026 land rush), but all of them inherit axe-core's ~30-57% ceiling and none were found pairing that with (a) published ground-truth precision/recall, (b) an explicit uncertainty/insufficient-evidence state, or (c) bilingual output. The gap isn't "nobody talks to agents" - it's "nobody talks to agents with calibrated, honest, bilingual signal."

---

## The two most threatening incumbents

1. Deque (axe DevTools + Axe MCP Server) - already inside the exact workflow (Claude/Copilot/Cursor), well-funded, axe-core is the de facto ground truth everyone else benchmarks against. Threat is distribution and incumbency, not honesty about coverage (Deque is reasonably candid that IGTs are semi-automated).
2. Siteimprove - the only enterprise platform with a genuinely public AI-remediation narrative (AI Assistant + AI Remediate) and CI/CD shift-left story, competing for the same "AI accessibility" budget line even though it doesn't reach into a coding agent.

## What none of them cover (the room left)

No incumbent publishes its own precision/recall against ground truth, none surface "insufficient evidence" as a first-class state (everything gets forced into pass/fail or a single score), none ship bilingual zh/en reporting, and the MCP wrapper land-rush (Deque, BrowserStack, A11y Pulse, open-source a11ymcp) all still just pipe axe-core's ~30-50%-of-criteria ceiling into an agent without adding calibration or honesty about what wasn't checked.
