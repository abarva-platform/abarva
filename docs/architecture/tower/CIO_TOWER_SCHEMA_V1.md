# CIO Tower Schema v1

This is the replacement Tower database contract after sunsetting the old
`public.tower_*`, `public.ai_control_*`, and `public.semantic2_tower_*` layers.

## Naming Convention

All new Tower-owned database objects live under the dedicated `cio_tower`
Postgres schema.

Do not create new objects named:

- `public.tower_*`
- `public.ai_control_*`
- `public.semantic2_tower_*`

Those names are reserved as retired legacy layers.

## Design Authority

Tower has three jobs:

1. Prove what the CIO/CFO dashboard says.
2. Answer deterministic portfolio/spend/value/risk questions from the same facts.
3. Package the right prompt for Claude only when a prose advisory answer is needed.

The app must not silently rewrite Claude prose. AbarVa owns context, routing,
artifacts, validation, and rendering. Claude owns the visible prose answer.

## Core Tables

| Table | Purpose |
|---|---|
| `cio_tower.source_registry` | File/system/run lineage for every source. |
| `cio_tower.entities` | Portfolio companies, initiatives, vendors, contracts, systems, org units, KPIs, risks. |
| `cio_tower.facts` | Atomic numeric, text, date, and boolean facts with scope, basis, period, formula, and source lineage. |
| `cio_tower.relationships` | Entity graph: funds, supports, depends_on, renews, rolls_up_to, allocates_to. |
| `cio_tower.measures` | Governed metric registry read by both dashboard and chat. |
| `cio_tower.question_contracts` | Natural-language question families mapped to measures, dimensions, artifact type, and refusal rules. |
| `cio_tower.measure_results` | Optional cached/materialized metric results for fast dashboard reads. |
| `cio_tower.prompt_packages` | Exact prompt text and deterministic packet sent to Claude/model. |
| `cio_tower.answer_traces` | User question, resolved contract, raw model output, rendered response, latency, and validation status. |
| `cio_tower.validation_runs/results` | Source reconciliation, dashboard/chat parity, crawl, and prompt/render trace results. |

## Non-Negotiable Gates

- Dashboard/chat parity: a dashboard KPI and equivalent chat question must resolve to the same measure.
- Scope safety: enterprise envelope, initiative, contract, vendor, and system scopes cannot be mixed silently.
- ROI safety: numerator and denominator must share compatible scope, period, and basis.
- Synthetic honesty: synthetic values stay labeled and are never laundered as tenant-attested.
- Prompt proof: every Claude/model answer stores the exact prompt package.
- Render proof: if prose is rendered, `raw_model_response` must equal `rendered_response`.
- Outside-scope handling: non-Tower questions are refused or handed off, not answered from Tower.

## First Load Target

Use the standardized source package in:

`/Users/anand/Projects/nexus/tower-standardized-v1`

The first loader should populate:

1. `source_registry`
2. `entities`
3. `facts`
4. `relationships`
5. `measures`
6. `question_contracts`

Only after those pass reconciliation should the dashboard/chat read from
`cio_tower`.
