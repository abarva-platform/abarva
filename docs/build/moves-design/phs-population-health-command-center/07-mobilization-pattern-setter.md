# PHS Population Health Command Center — Mobilization Pattern Setter

Date: 2026-06-05
Status: Mobilization contract

## Mobilization Thesis

Mobilization should prove the operating model before it tries to scale AI. The
first 90 days should stand up evidence, governance, data products, and decision
routines before any high-risk clinical automation.

## 30 / 60 / 90 Plan

| Window | Outcome | Evidence of completion |
|---|---|---|
| Days 0-30 | Evidence and inventory foundation | public evidence register loaded, workload inventory approved, data quality baseline approved, gate criteria active |
| Days 31-60 | Architecture and data product design | architecture artifact approved, data product owners named, Unity Catalog policy draft approved, initial pipeline contracts defined |
| Days 61-90 | Pilot operating routines | care-gap worklist design approved, human review queue defined, value case approved, mobilization RACI accepted |

## Workstreams

| Workstream | Owner | First deliverable |
|---|---|---|
| Executive governance | executive sponsor | decision cadence and gate authority |
| Data platform | CDIO / architecture lead | Databricks target architecture and migration backlog |
| Population health | plan quality + clinical quality | use-case scorecard and measure-owner map |
| Clinical operations | CMO delegate | human review policy and action workflow |
| Finance/value | CFO delegate | approved baseline and forecast assumptions |
| Compliance/AI governance | compliance / clinical governance | no-autonomous-clinical-action policy and audit trail |
| Source optional | sourcing VP | partner decision only if Phase 5 chooses partner-led delivery |

## RACI Rules

- Agents recommend and draft.
- Humans approve evidence, assumptions, external artifacts, stage promotion, and clinical policies.
- The system logs every evidence link, approval, waiver, and generated artifact.
- No anonymous approvals.
- No stage promotion without named rationale.

## Source Trigger

Source may start only when:

- the Business Case selects partner-led delivery
- Phase 2-5 artifact IDs exist
- approved scope and evaluation criteria exist
- sourcing owner accepts the event
- the event starts at Strategy or Scope, not BAFO

## QA Requirements

The mobilization crawl must prove:

- each milestone has owner and completion evidence
- approval state is visible
- missing evidence blocks advancement
- Source is absent when partner-led delivery is not selected
- generated recommendations cite evidence keys
