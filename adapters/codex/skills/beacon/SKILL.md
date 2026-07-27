---
name: beacon
description: "Use Beacon accessibility + AEO review in Codex. Trigger when the user asks for accessibility, a11y, WCAG, inclusive design, UI/UX audit, legal accessibility risk, AEO / answer-engine optimization, schema/meta/AI-crawlability, or when reviewing/building UI where accessibility matters."
---

# Beacon

Use this skill to add Beacon's accessibility + AEO lens before, during, and after UI work. It is standalone; use other installed design skills only when they are relevant to the user's request.

The user-facing interface is a plain-language request or skill invocation, not the command line. Bundled scripts are internal repeat-testing helpers Codex may run when useful.

## Modes

1. **Guide before code**：when designing layout, forms, navigation, modals, color, typography, motion, responsive behavior, or component patterns.
2. **Advisor during code**：when editing HTML, CSS, JSX, TSX, Vue, Svelte, SwiftUI, Android Compose, Flutter, React Native, or UI-like JS/TS.
3. **Inspect after code**：when reviewing a page, component, prototype, PR, or live URL for accessibility / AEO risk.

Beacon's Codex package does not install a PostToolUse hook. Apply advisor mode explicitly when UI files are created or edited.

## Quick Workflow

1. Identify scope: page, component, entire project, live URL, or design mockup.
2. Default standard: WCAG 2.2 AA.
3. Default jurisdictions when relevant: US ADA, EU EAA, Japan JIS, Taiwan, Canada ACA, Australia DDA.
4. Run the strongest available checks:
   - Static review with file reads and `rg`.
   - Browser review with Playwright when a dev server / live page is available.
   - Keyboard path test for primary flow.
   - Screenshot checks at desktop and 320px mobile width.
5. Report findings as user-impact first, criterion second.

## Categories

- Contrast
- Keyboard
- Screen reader
- Forms
- Media
- Motion
- Touch target
- Cognitive load / dark patterns
- Responsive reflow
- Agent / AEO: schema, metadata, heading outline, AI-crawlability

## Reference Loading

Resolve the Beacon plugin root as the directory two levels above this `SKILL.md`. Load only the reference needed; the paths below are relative to this file:

- Full design guidance: `../../references/beacon-guide.md`
- During-code advisor rules: `../../references/beacon-advisor.md`
- Full audit process: `../../references/beacon-inspect.md`
- WCAG criteria: `../../references/wcag-quick.md`
- Component patterns: `../../references/patterns.md`
- Disability categories: `../../references/disabilities.md`
- Legal context: `../../references/legal-brief.md`
- Cases: `../../references/cases.md`
- Document accessibility: `../../references/documents.md`
- Auth-detect false-positive validation: `../../references/auth-detect-fp.md`
- PDF-detect false-positive validation: `../../references/pdf-detect-fp.md`

## Goal / Skill Workflow

When the user asks to run Beacon, repeat Beacon, or keep testing accessibility during UI iteration:

1. Treat this skill as the operating contract.
2. Run advisor checks after touching UI files.
3. For substantial UI work, produce a repeatable audit artifact.
4. Use LLM review for judgment that scripts cannot verify.
5. Report only the findings and residual risk the user needs.

User-facing prompt examples:

```text
Use beacon on this UI change and keep iterating until no blocking accessibility issues remain.
```

```text
Run the Beacon goal on this page: design guidance, implementation review, static baseline, then tell me remaining risks.
```

```text
每次你改 UI，都用 beacon 做 advisor review；完成後產出 accessibility summary。
```

See `../../references/goal-workflows.md` for reusable goal patterns.

## Internal Repeat Testing Helpers

Keep the shell working directory at the project being reviewed so project-relative inputs and outputs resolve correctly. Resolve `<beacon-plugin-root>` from this file, then run the advisor on touched files:

```text
node "<beacon-plugin-root>/scripts/advisor.mjs" path/to/file.tsx
```

For a repeatable static baseline, Codex may run:

```text
node "<beacon-plugin-root>/scripts/static-audit.mjs" --scope "Project UI" --output reports/a11y/audit-results.json src app public
```

Then generate the HTML report:

```text
node "<beacon-plugin-root>/scripts/generate-report.mjs" reports/a11y/audit-results.json --output reports/a11y/a11y-report.html
```

These commands are not the required user interface. They exist so the skill can repeat the same checks consistently instead of relying only on free-form review. If Node.js is unavailable, continue with manual review and state that the automated baseline was not run.

See `../../references/repeat-testing.md` and `../../references/goal-workflows.md` for the longer contract.

## HTML Report

If an audit JSON exists, generate Beacon's interactive report:

```text
node "<beacon-plugin-root>/scripts/generate-report.mjs" audit-results.json --output a11y-report.html
```

Do not invent a numeric score without an evidence-backed audit JSON. If you cannot verify runtime behavior, mark it unverifiable.

## Output Rules

- Findings first, ordered by severity.
- Name who is affected, not just which rule fails.
- Prefer native semantic HTML before ARIA.
- State what was checked and what could not be verified.
- For code work, make the smallest patch that fixes the issue.
- For design work, give the accessible pattern before decorative styling.
- For repeated testing, keep audit JSON and HTML report under a project-local `reports/a11y/` or equivalent ignored/generated folder unless the project already has a convention.
