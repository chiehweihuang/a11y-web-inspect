# Beacon

[English](./README.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md) · [简体中文](./README.zh-Hans.md) · [繁體中文](./README.zh-Hant.md) · [Bahasa Indonesia](./README.id.md) · [Tiếng Việt](./README.vi.md) · [ไทย](./README.th.md) · [हिन्दी](./README.hi.md)

Claude Code 向けの accessibility + AEO inspection plugin です。

Beacon は agent-assisted UI 開発のための高速なアクセシビリティ基準チェックです。まず静的ヒューリスティックで確認し、Playwright ベースの live audit で補強します(axe-core は任意)。レポートは、何を直すべきか、なぜ直すべきかを人間に分かる言葉で説明します。

Beacon は適合証明書ではなく、法律助言でもありません。障害のあるユーザーとのテストを置き換えるものでもありません。高いスコアは、確認できた証拠の範囲で自動チェックが見つけた問題が少ないことを示すだけです。

Beacon はローカルで実行され、サイトファイルは明示的に共有しない限り手元の環境に残ります。インストール済み plugin は環境内で自動的に変化しません。メンテナーがオフライン評価ループを実行し、後続リリースで detector を追加・改善することがあります。ユーザーは plugin を更新するとその改善を受け取れます。

## Commands

| Command | 使う場面 | 得られるもの |
|---|---|---|
| `beacon:inspect` | ページ、コンポーネント、HTML ファイル、UI 変更を確認するとき。 | 0-100 の基準スコア、10 分類のスコア、findings、管轄区域ごとの WCAG context、修復順序、interactive HTML report。 |
| `beacon:guide` | UI を設計または実装する前。 | アクセシブルな pattern、component guidance、WCAG の注意点、設計上の tradeoff。 |
| `beacon:advisor` | HTML、CSS、JSX、TSX、Vue、Svelte を編集しているとき。 | 文脈に応じた a11y 提示。Claude Code では UI ファイル編集時に PostToolUse hook でも起動します。 |

## Three-tier Model

| Tier | Evidence | Strength | Limitation |
|---|---|---|---|
| Tier 1 static scan | `scripts/static-audit.mjs` による file と markup pattern。 | 高速、再現可能、browser 不要。 | ヒューリスティック基準です。可視性、computed style、runtime focus、実際の contrast は判断できません。 |
| Tier 2 live audit | Beacon 自身の `scripts/tier2-audit.mjs`(素の Playwright — 320px/1280px での contrast 1.4.3 と touch-target サイズ 2.5.8)による browser evidence。axe-core は ARIA 妥当性チェックの任意のクロスチェックです。 | contrast、ARIA、visibility、runtime behavior で強い証拠が得られます。 | それでも自動化です。実際の task completion や言葉の分かりやすさは証明できません。 |
| Tier 3 human testing | 手動確認と障害のあるユーザーとのテスト。 | cognitive load、task completion、実際の assistive technology 利用を確認できます。 | 計画が必要で、AI では置き換えられません。 |

Tier 1 は高速な基準であり、最終判定ではありません。Tier 1 と Tier 2 が異なる場合は、live browser evidence(Beacon の Tier-2 harness。axe を実行していればそれも)を優先してください。

## Installation

```text
/plugin install beacon@beacon
```

Claude Code config の `extraKnownMarketplaces` に追加します。

```json
"beacon": {
  "source": {
    "source": "github",
    "repo": "chiehweihuang/beacon"
  }
}
```

Plugin facts: `beacon`, version `3.5.0`, MIT, repository `chiehweihuang/beacon`.

## スコアの解釈

スコアは優先順位を判断するための signal として使ってください。

| スコア帯 | 意味 |
|---|---|
| 90-100 | 自動チェックの基準は良好です。重要なフローでは keyboard、screen reader、zoom、実ユーザーによる確認を引き続き行ってください。 |
| 50-89 | いくつかの barrier や要確認項目が見つかりました。影響を受けるユーザーと深刻度で findings の優先順位を付けてください。 |
| 0-49 | 優先度の高いレビューを推奨します。検査された証拠は重大な barrier を示唆しています。 |

すべてのスコアには `coverage_percent`(実際に測定された scoring weight の割合)が付きます。機械的な証拠がないカテゴリは数値の代わりに状態(`not-machine-checkable` / `not-applicable`)を報告します。証拠が1件でもあるカテゴリはスコアが付き、機械チェックが1-2件しかないカテゴリにはさらに `thin: true` が付与され、スコアと同じ行に「thin evidence」という補足が表示されます(非表示にはなりません)。確認された seizure リスクの finding(WCAG 2.3.1)がある場合は、カテゴリの重みに関わらず overall score が 0-49 帯に制限されます。

これらの数値がどのように誠実さを保っているか(信頼性、detector の妥当性、score-semantics の性質、外部 benchmark、fairness invariant)は [VALIDATION.md](VALIDATION.md) に仕様化され、実行可能な形で記載されています。計測データは [benchmark/](benchmark/) 以下にあります。

Detector の精度は、誰も恣意的に選んでいないページ群を対象に実測されたものであり、想定値ではありません。実際に収集したサイトの調査を対象に、もっとも使用頻度の高い 6 つの detector を複数の異なるサイトにわたってサンプリングし、引用された markup ごとにインスタンス単位で判定したうえで、敵対的に再判定しました: `image-alt` 1.000、`link-name` 0.933、`heading-order` 0.867、`clickable` 0.615、`button-name` 0.600、`input-label` 0.417(各 n=15 — confidence interval とインスタンスごとの判定はすべて [benchmark/2026-08-03-wild-precision/](benchmark/2026-08-03-wild-precision/) のデータに含まれます)。false positive の主な原因は、inline style ではなく stylesheet class によって隠された markup であり、CSS を一切読み込まない tier はこれを検知できません。この限界は、いまや単に開示されるだけでなく実測されています。

自動化ツールの WCAG カバー率は業界全体でおよそ 30-40% と推定されることが多いです。Beacon は自分自身のカバー率を実測しました: WCAG 2.2 の 55 件の A+AA 基準のうち、14 件に何らかのカバレッジがあり(25.5%)、2 件は自動化が届く範囲内で完全に判定できます(3.6%)。逐条対照表と再計算方法は [VALIDATION.md](VALIDATION.md#wcag-criterion-coverage) を参照してください。

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

Beacon は 23 の追跡対象法域（`core/scripts/jurisdictions.mjs`、一次資料に基づく調査）の findings を関連する WCAG criteria に対応づけます——14 法域には web アクセシビリティ専門法があり（US、EU、Japan、Taiwan、Canada、China、South Korea、Brazil、Argentina、Colombia、Peru、Chile、Uruguay、Ecuador）、2 法域は web 専用の条文を持たない一般的な差別禁止枠組みのみ（Australia、Hong Kong）、残り 7 法域は専門法が見つからなかったことを正直に記録しています（Macau、Mongolia、Venezuela、Bolivia、Paraguay、Guyana、Suriname）。これは法律助言ではなく、管轄区域ごとの機械的な risk score でもありません。Compliance claim を出す前に、現在有効な地域要件を確認してください。

## AEO And Agent Readiness Workflow

Beacon の Agent/AEO カテゴリは実行可能な構造チェックであり、AI 引用の保証ではありません。

1. Beacon が検出した構造問題を修正します: meta description、canonical、Schema.org JSON-LD、heading outline、crawlable content、`robots.txt`、`sitemap.xml`、optional `llms.txt`。
2. 公開サイトでは、Cloudflare の [`isitagentready.com`](https://isitagentready.com/) や URL Scanner Agent Readiness などの外部 scanner で robots policy、sitemap discovery、Markdown negotiation、Content Signals、MCP/API/OAuth discovery を交差確認します。
3. 実際の効果は別に測定します: server log の AI crawler hits、manual answer-engine queries、analytics referral。

External scanner は一部の構造チェックを補強または置き換えられますが、outcome measurement は置き換えられません。構造が整っていても、AI engine がその content を引用した証明にはなりません。

## Reading The Report

Read the context banner above the score first. Then review overall score, category scores, findings, Methodology & Limits, remediation priority, and jurisdiction context notes. Do not decide release readiness from the score alone.

`requires_live_audit: true` means static evidence is not enough. `review` and `incomplete` mean the condition could not be verified from the available evidence.

## Codex

Codex adapter lives in `adapters/codex/`; install it as a native Codex plugin:

```bash
codex plugin marketplace add chiehweihuang/beacon
codex plugin add beacon@beacon
```

See [ADAPTERS.md](./ADAPTERS.md).

## License

MIT
