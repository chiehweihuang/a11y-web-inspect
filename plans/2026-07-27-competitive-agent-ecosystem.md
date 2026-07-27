# Competitive survey: accessibility capabilities in AI coding-agent ecosystems (2026-07-27)

Question: what accessibility-checking capabilities already exist inside AI coding-agent
ecosystems (Claude Code skills/plugins, MCP servers, Cursor/Windsurf/Cline rules,
GitHub Copilot extensions), and how do they compare to Beacon (self-contained,
zero-dependency, own detectors, 0-100 score across 10 categories, HTML report,
evidence-state honesty, bilingual)?

Method: web search + gh api for repo metadata (stars, pushed_at) + WebFetch on
READMEs. Star/push dates pulled live 2026-07-27 via GitHub API, treated as ground
truth over search-result summaries.

## Artifacts examined (13+ distinct real artifacts, all verified via repo/README)

### 1. Claude Code skills/plugins - audit/review focused

| Name | URL | Stars | Last push | What it actually does |
|---|---|---|---|---|
| Community-Access/accessibility-agents | https://github.com/Community-Access/accessibility-agents | 369 | 2026-07-25 (very active) | 79 specialist review agents across 8 teams / 5 platforms (Claude Code, Copilot, Claude Desktop). Real-time review/guidance during coding, not a standalone scan+score tool. Output: SARIF 2.1.0, CSV, VPAT 2.5, inline recommendations. No unified 0-100 score. Deps: Node 18+, optional Playwright/axe-core/NVDA. Closest in scale/adoption, but it is an agent-guidance layer, not a scanner-with-report. |
| masuP9/a11y-specialist-skills | https://github.com/masuP9/a11y-specialist-skills | 54 | 2026-06-13 | 4 skills (review, WCAG audit, audit planning, maturity roadmap). Structured Critical/Major/Minor findings, no scoring, no HTML report. The audit skill wraps axe-core + Playwright via a separate npm package, depends on a browser + node deps, not self-contained. |
| deventually/a11y-plugin (listed as a11y-wcag22) | https://github.com/deventually/a11y-plugin | 0 | 2026-03-31 (dormant) | Closest structural analogue to Beacon: 71 deterministic checks / 9 categories, parallel subagent orchestration, incremental caching, optional Playwright browser pass (+20 checks). BUT checks are evaluated by an LLM subagent per file, not a deterministic script, and output is JSON + Markdown only, pass/fail/manual counts, no 0-100 score, no HTML report. Zero community traction. |
| CFLW-AI/wcag-audit-claude-skill | https://github.com/CFLW-AI/wcag-audit-claude-skill | 6 | 2026-04-21 (dormant) | Scans DOM/CSS, computes real contrast ratios via a Python contrast_checker.py, produces a styled HTML report, but per-criterion pass/fail across the 28 WCAG 2.2 AA criteria, no aggregate 0-100 score. Needs a Python environment (not zero-dependency). Static analysis only; claims 100% TP / 0% FP on its own 10-page test suite (self-reported). |
| AccessLint/claude-marketplace (@accesslint/core) | https://github.com/accesslint/claude-marketplace | 70 | uncited - not surfaced by the API call used | Live-DOM auditing via Chrome DevTools Protocol (auto-launches Chrome) or browser MCP. Outputs a prioritized violation worklist (selectors, evidence, fix directives), can auto-apply mechanical fixes. No score, no HTML report; fix-oriented worklist, needs a live browser. |
| mrKanoh/claude-wcag-accessibility-skill | https://github.com/mrKanoh/claude-wcag-accessibility-skill | 3 | 2026-04-21 (dormant) | Not a scanner; a reference/pattern database: 15 searchable databases of WCAG criteria, ARIA patterns, testing tools. Advisory/lookup, closer to Beacon's beacon:guide than beacon:inspect. |
| tendera01-spec/accessibility-audit-toolkit | https://github.com/tendera01-spec/accessibility-audit-toolkit | 0 | 2026-05-17 | WCAG 2.2 AA + BFSG/EAA (EU law) compliance focus, generates VPAT 2.5 documents. Compliance-documentation tool, not a scored scanner. No stars. |
| rampstackco/claude-skills (accessibility-audit skill) | https://github.com/rampstackco/claude-skills | 496 (whole repo, multi-domain) | 2026-07-21 | Part of a broad stack-agnostic skills collection (brand/design/content/SEO/dev/ops/growth). The accessibility-audit skill is one of many skills in a general-purpose pack; the star count reflects the whole pack, not this skill specifically. |

### 2. MCP servers - all wrap axe-core/IBM Equal Access via a real browser

| Name | URL | Stars | Last push | What it actually does |
|---|---|---|---|---|
| ronantakizawa/a11ymcp | https://github.com/ronantakizawa/a11ymcp | 89 | 2026-03-10 | Wraps axe-core + Puppeteer. #20 on ProductHunt, 10k+ downloads (own description). Raw axe violation output, no proprietary scoring or report generation. |
| JustasMonkev/mcp-accessibility-scanner | https://github.com/JustasMonkev/mcp-accessibility-scanner | 56 | 2026-07-27 (actively maintained) | Playwright + axe-core, covers wcag2a through wcag22aaa. Same pattern: browser-driven axe wrapper, no own scoring/report layer. |
| priyankark/a11y-mcp | https://github.com/priyankark/a11y-mcp | 48 | 2026-03-22 | axe-core audits for an agentic fix loop (Amp/Cline/Cursor/Copilot). Violation list, not a report artifact. |
| Duds/accessibility-mcp | https://github.com/Duds/accessibility-mcp | 1 | 2025-12-14 (dormant) | axe-core + Playwright, WCAG 2.1/2.2 coverage. Minimal traction. |
| (also found, not deep-dived: jbuchan/accessibility-mcp-server, joe-watkins/accessibility-testing-mcp [axe-core + IBM Equal Access dual-engine], alexanderuk82/mcp-wcag-accessibility, bilhasry-deriv/mcp-web-a11y) | - | - | - | Same category: thin MCP wrappers around existing engines, browser-driven, no independent scoring model or bundled report generator found in any of them. |

Pattern across every MCP server found: all are thin protocol adapters over axe-core
(or IBM Equal Access) plus a browser driver (Playwright/Puppeteer/CDP). None have
their own detector logic, none produce a 0-100 composite score, none bundle an HTML
report generator; they hand raw violation JSON to the calling LLM/agent. Real
dependency footprint: Node + browser binary + axe-core npm package, the opposite
of zero-dependency.

### 3. Cursor / Windsurf / Cline

| Name | URL | Stars | Last push | What it actually does |
|---|---|---|---|---|
| fecarrico/A11Y.md | https://github.com/fecarrico/A11Y.md | 231 | 2026-07-25 (very active) | Not a scanner. A single agent-agnostic rules/context file (works with Claude, Cursor, Copilot, etc.) that constrains code generation toward WCAG 2.2 AA up front. No scan, no score, no report; a prevention layer, not a detection layer. Higher star count and more recently active than any Claude-only skill found here. |
| PatrickJS/awesome-cursorrules - cypress-accessibility-testing-cursorrules-prompt-file | https://github.com/PatrickJS/awesome-cursorrules/blob/main/rules/cypress-accessibility-testing-cursorrules-prompt-file/.cursorrules | (part of a large awesome-list) | - | A prompt file nudging Cursor to write Cypress+axe accessibility tests. Generation guidance, not a scanner. |
| tonynguyennvt/cursor-rules-awesome | https://github.com/tonynguyennvt/cursor-rules-awesome | - | - | Accessibility is 1 of 72 generic coding-standard sections (WCAG 2.1 AA alongside OWASP, HIPAA, etc.) inside a huge omnibus rules file, not a dedicated tool. |
| ivangrynenko/cursorrules | https://github.com/ivangrynenko/cursorrules | - | - | Includes an accessibility-standards.mdc rule file. Static guidance text, no execution/scoring. |

Windsurf/Cline specifically: no dedicated accessibility scanner, skill, or
extension found for either. Search results returned only generic browser-extension
WCAG checkers (Silktide, axe DevTools, GetWCAG - not agent-integrated) and a
marketing blog post about Windsurfs Cascade agent following WCAG by prompting,
with no actual tool artifact. This is a real gap: Windsurf/Cline accessibility
support today is whatever rules file you paste in (e.g. A11Y.md), not a dedicated
integration.

### 4. GitHub Copilot

| Name | URL | What it is |
|---|---|---|
| GitHubs own Accessibility auditor custom-instructions doc | https://docs.github.com/en/copilot/tutorials/customization-library/custom-instructions/accessibility-auditor | An official custom-instructions template; paste into Copilots custom instructions to bias generation/review toward accessibility. Same category as A11Y.md: a prompt, not a scanner. |
| a11y scanner GitHub Action (public preview, per Copilot docs) | found via search, marketplace listing | A CI Action that scans and files trackable issues, uses Copilot for AI-assisted fixes. Still public preview per its own docs. Could not confirm a public repo URL beyond the marketplace listing; mark uncited - plausible. |
| Community-Access/accessibility-agents | (see above) | Same 79-agent framework; Copilot is one of its 3 supported platforms. |

### 5. Anthropics official skills registry

anthropics/skills (https://github.com/anthropics/skills) is real and public
(Apache 2.0), but its shipped skill folders are document-creation focused
(docx/pdf/pptx/xlsx). No accessibility skill exists in Anthropics own first-party
registry. A community-run aggregator (referenced via a GitHub Discussion, "250+
skills auto-discovered daily") exists but is third-party, not Anthropics, and was
not deep-verified here.

## Where Beacon sits

Every artifact examined falls into one of three buckets, and none combine all of
Beacons stated traits (self-contained own detectors + deterministic + 0-100 score
across a fixed category set + bundled HTML report + zero runtime dependency +
evidence-state honesty language):

1. LLM-judgment skills (Community-Access, masuP9, deventually/a11y-plugin,
   mrKanoh): findings come from an LLM reading code/checklists, not a deterministic
   script. Output is prose/JSON/Markdown, not a scored HTML artifact. deventuallys
   plugin is architecturally the closest (71 checks, 9 categories, caching, parallel
   dispatch) but is explicitly LLM-evaluated per file, not a static engine, and has
   zero users (0 stars, dormant since March).
2. Thin MCP wrappers over axe-core/IBM Equal Access (all MCP servers found):
   detector logic borrowed wholesale from an existing engine, browser-dependent, no
   scoring layer, no report generator; the calling agent must synthesize a report
   itself.
3. Prevention-only rules text (A11Y.md, Cursor rule files, Copilot custom
   instructions): bias code generation toward accessibility up front, but perform
   no detection/scoring/reporting at all. The highest-star, most-recently-active
   artifacts found (A11Y.md at 231 stars/pushed 2026-07-25; accessibility-agents at
   369 stars/pushed 2026-07-25) both fall in buckets 1 and 3, not scanners with scores.

No artifact found bundles a deterministic, dependency-free static engine plus a
composite 0-100 score across a fixed 10-category rubric plus a generated interactive
HTML report plus explicit evidence-tier honesty (static vs. live vs. human) in one
package. This specific combination appears genuinely unoccupied among the artifacts
surveyed, though "genuinely unoccupied" is a claim about what was findable via
search plus GitHub API on 2026-07-27, not a claim of exhaustive coverage of every
private/unlisted repo.

## Sources
1. https://github.com/Community-Access/accessibility-agents
2. https://github.com/masuP9/a11y-specialist-skills
3. https://github.com/deventually/a11y-plugin
4. https://github.com/CFLW-AI/wcag-audit-claude-skill
5. https://github.com/accesslint/claude-marketplace
6. https://github.com/mrKanoh/claude-wcag-accessibility-skill
7. https://github.com/tendera01-spec/accessibility-audit-toolkit
8. https://github.com/rampstackco/claude-skills
9. https://github.com/ronantakizawa/a11ymcp
10. https://github.com/JustasMonkev/mcp-accessibility-scanner
11. https://github.com/priyankark/a11y-mcp
12. https://github.com/Duds/accessibility-mcp
13. https://github.com/fecarrico/A11Y.md
14. https://github.com/PatrickJS/awesome-cursorrules/blob/main/rules/cypress-accessibility-testing-cursorrules-prompt-file/.cursorrules
15. https://github.com/tonynguyennvt/cursor-rules-awesome
16. https://github.com/ivangrynenko/cursorrules
17. https://docs.github.com/en/copilot/tutorials/customization-library/custom-instructions/accessibility-auditor
18. https://github.com/anthropics/skills
19. https://www.claudepluginhub.com/plugins/deventually-a11y-wcag22 (secondary listing, 403 on direct fetch, corroborated via the GitHub source repo instead)
