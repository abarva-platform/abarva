# PHS-Inspired Market Research Brief

**Status:** draft for demo design
**Client demo tenant:** Meridian Health
**Real-world inspiration:** public Presbyterian Healthcare Services context
**Primary surface:** Moves
**Recommended visible stage:** Phase 3 - Architecture and Business Case Review

## Executive Answer

The strongest Meridian demo story is not a generic AI strategy. It is a population health and clinical performance operating model for an integrated payer-provider under quality, utilization, claims-cost, and margin pressure.

The demo should show AbarVa using approved evidence to help Meridian decide how to use Azure Databricks, governed AI, and human approval routines to prioritize care gaps, chronic disease cohorts, avoidable utilization, Stars measures, payment integrity, and care-management productivity.

## Public Evidence Spine

These evidence keys come from the approved prompt source and should be loaded before any generated artifact cites them.

| Evidence key | Public fact available for demo grounding | Demo implication |
|---|---|---|
| `PHS-PUBLIC-001` | Presbyterian Healthcare Services is an integrated New Mexico payer-provider with nine hospitals, 900+ providers, a statewide health plan, and about one in three New Mexicans served. | Supports a plan-plus-provider strategy, not a hospital-only modernization story. |
| `PHS-PUBLIC-002` | Presbyterian community health materials emphasize health equity, access, food as medicine, vaccine outreach, community health workers, and chronic disease management. | Supports a population health and intervention-operating-model narrative. |
| `PHS-PUBLIC-003` | Presbyterian Health Plan's 2026 rate transparency report projects a 27.1% overall rate increase and describes claims, trend, savings initiatives, morbidity, rebates, and risk-adjustment drivers. | Adds economic texture for claims trend, utilization management, care management, payment integrity, and actuarial assumptions. |
| `PHS-PUBLIC-004` | The same filing reports estimated commercial medical loss ratios of 120.0% in 2024, 100.2% in 2023, and 93.9% in 2022. | Supports urgency around plan-side margin, analytics precision, and intervention effectiveness. |
| `PHS-PUBLIC-005` | Presbyterian publishes 2026 Medicare Star Ratings documents; CMS positions Star Ratings as quality and performance comparisons. | Supports a quality-performance storyline without overclaiming private measure drivers. |
| `PHS-PUBLIC-006` | Ratings/news coverage describes operating pressure and downgrade activity while noting market strength. | Frames the moment as a credible transformation window: pressure plus durable local market relevance. |

## Market Context To Preserve

The demo should treat the real-world inspiration as public context only. It can say that the Meridian synthetic tenant is inspired by publicly available Presbyterian Healthcare Services materials. It should not imply that AbarVa has confidential PHS artifacts, internal operating data, claims files, quality files, or private strategic plans.

The best market thesis:

- Integrated payer-provider systems have more leverage than standalone providers because they can connect clinical delivery, member interventions, quality ratings, payment integrity, and financial performance.
- The operating problem is not simply "move data to Databricks"; it is how to turn data products, model monitoring, governance, and human workflows into measurable population health action.
- AbarVa's demo advantage is showing a decision system, not just a document generator: evidence register, current-state inventory, gates, artifact drafts, human approvals, and a value model.

## Recommended Hero Use Case

**Hero:** Population Health and Clinical Performance Command Center.

This hero is stronger than a narrow infrastructure modernization story because it lets the demo connect:

| Dimension | Demo expression |
|---|---|
| Clinical quality | Stars, care gaps, chronic disease cohorts, attribution, coding quality, and intervention logic. |
| Plan economics | Claims trend, avoidable utilization, payment integrity, care-management savings, and risk-adjusted value forecast. |
| Data architecture | Lakehouse zones, Unity Catalog, MLflow, feature store, model monitoring, data product ownership, audit trails, and governed PHI access. |
| Human governance | Agent recommendation, human approval, evidence citations, approval records, gate criteria, and no autonomous clinical action. |

## Recommended Visible Storyline

1. **Setup/Admin loads the factual spine.** Public PHS context, synthetic Meridian current-state inventory, synthetic quality baseline, rate cards, Databricks pattern pack, gates, and approval personas are loaded as inspectable objects.
2. **Moves starts at strategy and current-state readiness.** The system shows why Meridian should prioritize population health and clinical performance, which data domains matter, and which current-state blockers limit AI use.
3. **Architecture and business case are generated from approved evidence.** Live moments can include the AI Strategy Memo, Azure Databricks Target Architecture, Value Case, and Mobilization Plan.
4. **Human approval is visible.** The demo should make named approval the trust moment: CDAO for strategy and architecture, CFO for value case, and clinical quality leader for clinical logic.
5. **Source appears only if procurement is part of the story.** If Meridian needs an implementation partner or managed services partner, Source can start at Strategy or Scope. It should not jump to BAFO or Selection.

## Do-Not-Show Guardrails

| Do not show | Why |
|---|---|
| Realized value | The source plan permits baseline and forecast only unless clearly labeled synthetic future-state evidence exists. |
| BAFO, Selection, or Transition | These stages require prior-stage artifact chains, approvals, and gates that are not yet proven. |
| Confidential PHS claims or clinical data | The demo is inspired by public PHS context only. |
| Inline placeholder artifacts | The prompt source requires Setup/Admin loader-backed evidence and artifacts. |
| Autonomous clinical action | The responsible AI pattern requires agents to recommend and humans to approve. |

## Design Implications

Moves should make the demo feel like an executive operating room for a serious healthcare transformation decision:

- Lead with the next decision, not a wall of generated content.
- Put evidence class and citation keys close to material claims.
- Separate public evidence, synthetic demo evidence, assumptions, and generated recommendation.
- Show current gates and missing evidence as first-class objects.
- Make approval visible and named.
- Keep forecast economics in ranges, with low/base/high assumptions, rather than false precision.
- Treat data quality and trust as a prerequisite for AI use, not as a footnote.

## Open Evidence Gaps

These claims need loader proof before being treated as inspectable demo facts:

| Needed proof | Why it matters |
|---|---|
| Evidence register rows for `PHS-PUBLIC-001` through `PHS-PUBLIC-006` | Public facts need citation keys and sensitivity classification. |
| Synthetic Meridian workload inventory | Architecture recommendations must be tied to actual demo rows, not generated prose. |
| Synthetic data quality baseline | Data trust scores, remediation owners, and thresholds need inspectable rows. |
| Synthetic care-gap, chronic disease, utilization, and Stars baseline | Population health prioritization needs use-case evidence. |
| Rate card and estimation model | Value case and humans-vs-agents estimates need approved assumptions. |
| Approval personas and approval records | Stage advancement and external usability need named human decisions. |
