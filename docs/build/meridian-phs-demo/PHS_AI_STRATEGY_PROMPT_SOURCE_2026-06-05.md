# Prompt Source - Meridian / PHS AI Strategy Demo

Use this file as the canonical prompt source after human approval of `PHS_AI_STRATEGY_DEMO_PLAN_2026-06-05.docx`.

## Mission

Create a Meridian Health demo, inspired by public Presbyterian Healthcare Services context, for an AI-enabled Population Health and Clinical Performance Command Center on Azure Databricks.

The demo must feel real because the artifacts, evidence, gates, approvals, and storage paths are real synthetic demo objects. Do not show a stage as advanced unless all prior-stage artifacts are materialized, parseable, evidence-linked, and approved or explicitly waived by a named synthetic human.

## Non-Negotiables

1. Use OpenAI-only generation paths.
2. Do not fabricate confidential PHS data.
3. Distinguish public evidence, synthetic internal demo evidence, and generated recommendations.
4. Every material claim must cite an evidence key.
5. Do not invent realized outcomes.
6. Use Setup/Admin loader-backed evidence and artifacts, not inline placeholders.
7. Every generated artifact requires named human approval before external use.
8. If evidence is missing, say what is missing and create an evidence request.

## Public Evidence To Load

| Evidence key | Public fact | Source |
|---|---|---|
| PHS-PUBLIC-001 | Presbyterian Healthcare Services is an integrated New Mexico payer-provider with nine hospitals, 900+ providers, a statewide health plan, and about one in three New Mexicans served. | https://www.phs.org/about-us |
| PHS-PUBLIC-002 | Presbyterian community health materials emphasize health equity, access, food as medicine, vaccine outreach, community health workers, and chronic disease management. | https://www.abq.org/wp-content/uploads/2023/12/presbyterian-central-new-mexico-community-health-implementation-plan-2023-2025.pdf |
| PHS-PUBLIC-003 | Presbyterian Health Plan's 2026 rate transparency report projects a 27.1% overall rate increase and describes claims, trend, savings initiatives, morbidity, rebates, and risk-adjustment drivers. | https://www.osi.state.nm.us/wp-content/uploads/2025/08/Presbyterian-Health-Plan-Rate-Transparency-Report.pdf |
| PHS-PUBLIC-004 | The same rate filing reports estimated commercial MLR of 120.0% in 2024, 100.2% in 2023, and 93.9% in 2022. | https://www.osi.state.nm.us/wp-content/uploads/2025/08/Presbyterian-Health-Plan-Rate-Transparency-Report.pdf |
| PHS-PUBLIC-005 | Presbyterian publishes 2026 Medicare Star Ratings documents for Presbyterian Health Plan and its D-SNP plan; CMS positions Star Ratings as quality and performance comparisons. | https://onbaseext.phs.org/PEL/DisplayDocument?ContentID=OB_000000042705 |
| PHS-PUBLIC-006 | Ratings/news coverage describes operating pressure and downgrade activity while noting market strength. | https://www.spglobal.com/ratings/en/regulatory/article/-/view/sourceId/101677751 |

## Demo Stage

- Primary surface: Moves
- Visible stage: Phase 3 - Architecture and Business Case Review
- Source role: Optional follow-on only if the storyline includes procurement of a Databricks SI, managed services partner, or implementation partner
- Value posture: baseline and forecast only, not realized value

## Required Demo Objects

Load these before live generation:

- Evidence register
- Synthetic current-state workload inventory
- Synthetic data quality baseline
- Rate card and estimation model
- Databricks modernization pattern pack
- Gate criteria by phase
- Approval personas and records

## Required Artifacts

| Phase | Artifact | Generation posture | Approval owner |
|---|---|---|---|
| Setup | Evidence Register | Preload | Data steward |
| Setup | Current-State Workload Inventory | Preload | CIO delegate |
| Setup | Rate Card and Estimation Model | Preload | Finance reviewer |
| Strategy | AI Strategy Memo | Generate live from approved evidence | CIO / CDAO |
| Strategy | Population Health Opportunity Map | Generate live from approved evidence | Clinical quality + plan quality |
| Strategy | Decision Principles | Generate live | Compliance / governance |
| Current State | Data and Analytics Baseline | Preload structured data; generate narrative | Data platform owner |
| Current State | Lift / Shift / Modernize Baseline | Generate live from inventory | Architecture review board |
| Current State | Data Quality and Trust Assessment | Generate live | Data governance |
| Architecture | Azure Databricks Target Architecture | Generate live | Architecture review board |
| Architecture | Data Product Map | Generate live | Data product council |
| Architecture | Agent Operating Model | Generate live | Clinical governance + compliance |
| Business Case | Value Case | Generate live from evidence and rate cards | CFO |
| Business Case | Mobilization Plan | Generate live | Program sponsor |
| Business Case | Humans vs Agents Recommendation | Generate live | Sponsor + operations |
| Approval | Executive Decision Brief | Generate after all prior artifacts exist | Executive sponsor |
| Approval | Approval Record | Human-clicked or pre-seeded synthetic approval | Executive sponsor |

## Artifact Prompt Template

```
Draft {artifact_name} for {client_name}.

Visible phase: {phase}
Audience: {audience}
Decision to support: {decision}

Approved evidence:
{evidence_list}

Current-state workload inventory:
{workload_inventory}

Rate cards and estimation assumptions:
{rate_card_context}

Open gates and missing evidence:
{gate_context}

Rules:
- Material claims must cite evidence keys.
- Separate public facts, synthetic demo evidence, and assumptions.
- Do not claim realized outcomes.
- Do not fabricate confidential PHS data.
- Use Azure Databricks patterns only where the current-state workload inventory supports them.
- Recommend human approval owner and next action.
- Write at the level a top-tier consulting partner would sign.
```

## First Backlog After Approval

1. Audit all existing Meridian Moves and Source demo objects.
2. Decide which Meridian objects to show, hide, archive, or rebuild from ground zero.
3. Build the evidence loader pack.
4. Build the artifact gold-standard library.
5. Build the materializer script that persists files and DB records.
6. Generate the first artifact pack using OpenAI-only generation.
7. Run browser QA: every artifact opens; downloads work or are gracefully disabled; no blank pages.
8. Produce an approval-ready readiness report.

