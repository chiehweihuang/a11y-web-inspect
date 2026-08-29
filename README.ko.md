# Beacon

[English](./README.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md) · [简体中文](./README.zh-Hans.md) · [繁體中文](./README.zh-Hant.md) · [Bahasa Indonesia](./README.id.md) · [Tiếng Việt](./README.vi.md) · [ไทย](./README.th.md) · [हिन्दी](./README.hi.md)

Claude Code용 accessibility + AEO inspection plugin입니다.

Beacon은 agent-assisted UI 작업을 위한 빠른 접근성 기준 점검 도구입니다. 먼저 정적 휴리스틱을 실행하고, Playwright 기반 live audit로 보강합니다(axe-core는 선택 사항). 보고서는 무엇을 고쳐야 하는지와 왜 중요한지를 사람이 읽기 쉬운 방식으로 설명합니다.

Beacon은 적합성 인증서가 아니며 법률 자문도 아닙니다. 장애가 있는 사용자와의 테스트를 대체하지 않습니다. 높은 점수는 확인된 증거 범위에서 자동 검사로 발견된 문제가 적다는 뜻일 뿐, 제품이 완전히 접근 가능하다는 증명은 아닙니다.

Beacon은 로컬에서 실행되며, 명시적으로 공유하지 않는 한 사이트 파일은 사용자의 기기에 남습니다. 설치된 plugin은 환경 안에서 자동으로 변경되지 않습니다. 유지관리자가 오프라인 평가 루프를 실행해 detector를 개선하고 이후 릴리스에 반영할 수 있습니다. 사용자는 plugin을 업데이트해야 그 개선을 받을 수 있습니다.

## Commands

| Command | 사용 시점 | 결과 |
|---|---|---|
| `beacon:inspect` | 페이지, 컴포넌트, HTML 파일, UI 변경을 검토할 때. | 0-100 기준 점수, 10개 카테고리 점수, findings, 관할권별 WCAG context, 수정 우선순위, interactive HTML report. |
| `beacon:guide` | UI를 설계하거나 코딩하기 전. | 접근 가능한 pattern, component guidance, WCAG 리마인더, design tradeoff. |
| `beacon:advisor` | HTML, CSS, JSX, TSX, Vue, Svelte를 편집할 때. | 상황에 맞는 a11y 안내. Claude Code에서는 UI 파일 편집 후 PostToolUse hook으로도 실행됩니다. |

## Three-tier Model

| Tier | Evidence | Strength | Limitation |
|---|---|---|---|
| Tier 1 static scan | `scripts/static-audit.mjs`가 파일과 markup pattern을 검사합니다. | 빠르고 반복 가능하며 browser가 필요 없습니다. | 휴리스틱 기준입니다. 실제 visibility, computed style, runtime focus, true contrast는 알 수 없습니다. |
| Tier 2 live audit | Beacon 자체 `scripts/tier2-audit.mjs`(순수 Playwright — 320px/1280px에서 contrast 1.4.3, touch-target 크기 2.5.8)의 browser evidence. axe-core는 ARIA 유효성을 위한 선택적 cross-check입니다. | contrast, ARIA, visibility, runtime behavior에 더 강합니다. | 여전히 자동화입니다. 실제 task completion이나 문구의 이해 가능성은 증명하지 못합니다. |
| Tier 3 human testing | 수동 점검과 장애 사용자 테스트. | cognitive load, task completion, 실제 assistive technology 사용을 확인합니다. | 계획이 필요하며 AI로 대체할 수 없습니다. |

Tier 1은 빠른 기준선이지 최종 판정이 아닙니다. Tier 1과 Tier 2가 다르면 live browser evidence(Beacon의 Tier-2 harness, axe를 실행했다면 그것도)를 우선하세요.

## Installation

```text
/plugin install beacon@beacon
```

`extraKnownMarketplaces`에 다음을 추가합니다.

```json
"beacon": {
  "source": {
    "source": "github",
    "repo": "chiehweihuang/beacon"
  }
}
```

Plugin facts: `beacon`, version `3.5.0`, MIT, repository `chiehweihuang/beacon`.

## 점수 해석

점수는 우선순위를 정하는 signal로 사용하세요.

| 점수 구간 | 의미 |
|---|---|
| 90-100 | 자동 검사 기준이 양호합니다. 중요한 흐름에서는 keyboard, screen reader, zoom, 실제 사용자 확인을 계속 진행하세요. |
| 50-89 | 일부 barrier 또는 검토가 필요한 항목이 발견되었습니다. 영향받는 사용자와 심각도에 따라 findings의 우선순위를 정하세요. |
| 0-49 | 우선순위가 높은 검토를 권장합니다. 검사된 증거는 상당한 barrier가 있음을 시사합니다. |

모든 점수에는 `coverage_percent`(실제로 측정된 scoring weight의 비율)가 함께 표시됩니다. 기계적 증거가 없는 카테고리는 숫자 대신 상태(`not-machine-checkable` / `not-applicable`)를 표시합니다. 증거가 하나라도 있는 카테고리는 점수가 매겨지며, 기계 점검이 1-2건뿐인 카테고리는 추가로 `thin: true` 표시를 달고 점수와 같은 줄에 "thin evidence" 표기를 보여줍니다(숨겨지지 않습니다). 확인된 발작 위험 finding(WCAG 2.3.1)이 있으면 카테고리 가중치와 관계없이 overall score가 0-49대로 제한됩니다.

이 수치가 정직하게 유지되는 방식(신뢰성, detector 유효성, score-semantics 속성, 외부 benchmark, fairness invariant)은 [VALIDATION.md](VALIDATION.md)에 명세되어 실행 가능한 형태로 기록되어 있습니다. 측정 데이터는 [benchmark/](benchmark/) 아래에 있습니다.

Detector 정밀도는 임의로 선택하지 않은 페이지를 대상으로 실측된 것이며, 가정한 값이 아닙니다. 실제로 수집된 사이트 조사를 대상으로, 사용 빈도가 가장 높은 6개의 detector를 서로 다른 사이트에 걸쳐 샘플링하여 인용된 markup마다 인스턴스 단위로 판정한 뒤 적대적으로 재판정했습니다: `image-alt` 1.000, `link-name` 0.933, `heading-order` 0.867, `clickable` 0.615, `button-name` 0.600, `input-label` 0.417(각 n=15 — confidence interval과 인스턴스별 판정 전체는 [benchmark/2026-08-03-wild-precision/](benchmark/2026-08-03-wild-precision/) 데이터에 함께 제공됩니다). False positive의 주된 원인은 inline style이 아니라 stylesheet class로 숨겨진 markup이며, CSS를 전혀 로드하지 않는 tier는 이를 감지할 수 없습니다. 이 한계는 이제 단순히 공개되는 데 그치지 않고 실측되었습니다.

업계에서는 자동화 도구가 WCAG 기준의 약 30-40%를 커버한다고 추정합니다. Beacon은 자체 커버리지를 측정했습니다: WCAG 2.2의 A+AA 55개 기준 중 14개에 어떤 형태로든 커버리지가 있고(25.5%), 2개는 automation이 닿는 범위 내에서 완전히 판정됩니다(3.6%) — 항목별 대조표와 재계산 방법은 [VALIDATION.md](VALIDATION.md#wcag-criterion-coverage)에 있습니다.

## Categories

| Category | What it checks |
|---|---|
| Contrast | Text/UI contrast ratios, color-only information, dark mode, and state contrast. |
| Keyboard | Tab order, focus indicators, keyboard traps, skip links, and keyboard alternatives. |
| Screen Reader | Landmarks, headings, alt text, names, roles, ARIA, language, and semantic structure. |
| Forms | Labels, instructions, errors, autocomplete, required fields, and validation. |
| Media | Captions, transcripts, autoplay, audio controls, flash, and alternatives. |
| Motion | `prefers-reduced-motion`, time limits, moving content, and interaction animation. |
| Touch | Target size, spacing, drag alternatives, pointer gestures, and orientation assumptions. |
| Cognitive | Consistent navigation, help mechanisms, readable labels, predictable flows, and dark patterns. |
| Responsive | 320px reflow, zoom, viewport, fixed widths, fluid typography, and overflow. |
| Agent/AEO | Schema.org, metadata, canonical links, heading outline, crawlable content, `robots.txt`, `sitemap.xml`, optional `llms.txt`, and answer-engine clarity. |

## Jurisdiction Context

Beacon은 23개 추적 대상 법역(`core/scripts/jurisdictions.mjs`, 1차 자료 조사)의 findings를 관련 WCAG criteria에 연결합니다 — 14개 법역은 웹 접근성 전용 법률이 있고(US, EU, Japan, Taiwan, Canada, China, South Korea, Brazil, Argentina, Colombia, Peru, Chile, Uruguay, Ecuador), 2개 법역은 웹 전용 조문이 없는 일반 차별금지 프레임워크만 있으며(Australia, Hong Kong), 나머지 7개 법역은 전용 법률을 찾지 못했다고 정직하게 기록되어 있습니다(Macau, Mongolia, Venezuela, Bolivia, Paraguay, Guyana, Suriname). 이는 법률 자문이 아니며 관할권별 기계적 risk score도 아닙니다. Compliance claim을 하기 전에는 현재 적용되는 지역 요구사항을 확인해야 합니다.

## AEO And Agent Readiness Workflow

Beacon의 Agent/AEO 카테고리는 실행 가능한 구조 점검이며 AI citation 보장이 아닙니다.

1. Beacon이 찾은 구조 문제를 먼저 수정합니다: meta description, canonical, Schema.org JSON-LD, heading outline, crawlable content, `robots.txt`, `sitemap.xml`, optional `llms.txt`.
2. 공개 사이트는 Cloudflare의 [`isitagentready.com`](https://isitagentready.com/) 또는 URL Scanner Agent Readiness 같은 외부 scanner로 robots policy, sitemap discovery, Markdown negotiation, Content Signals, MCP/API/OAuth discovery를 교차 확인합니다.
3. 실제 효과는 별도로 측정합니다: server log의 AI crawler hits, manual answer-engine queries, analytics referral.

External scanner는 일부 구조 점검을 보강하거나 대체할 수 있지만 outcome measurement를 대체할 수는 없습니다. 구조가 준비되어 있어도 AI engine이 content를 실제로 citation했다는 증거는 아닙니다.

## Reading The Report

점수 위의 context banner를 먼저 읽으세요. 그다음 overall score, category scores, findings, Methodology & Limits, remediation priority, jurisdiction context notes를 확인합니다. 점수만으로 릴리스 가능 여부를 결정하지 마세요.

`requires_live_audit: true`는 정적 증거만으로 충분하지 않다는 뜻입니다. `review`와 `incomplete`는 현재 증거로 확인할 수 없다는 뜻입니다.

## Codex

Codex adapter는 `adapters/codex/`에 있으며, 네이티브 Codex 플러그인으로 설치합니다.

```bash
codex plugin marketplace add chiehweihuang/beacon
codex plugin add beacon@beacon
```

See [ADAPTERS.md](./ADAPTERS.md).

## License

MIT
