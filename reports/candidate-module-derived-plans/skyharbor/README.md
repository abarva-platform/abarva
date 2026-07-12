# Candidate Module Derived Plan

Tenant: `skyharbor-air`
Candidate: `skyharbor-air:skyharbor-air-pr10-candidate:candidate-dry-run`
Generated: `2026-07-10T00:00:00.000Z`

This report creates module-targeted derived-plan objects for inactive candidate
workbench previews. It does not write production tenant data, update active
tenant access, promote the candidate, change module runtime behavior, or let
modules read candidate data by default.

## Summary

- Quality gate: pass
- Source records read: 53
- Derived objects planned: 3
- Moves facts covered: 33
- Source facts covered: 34
- Tower facts covered: 27
- Runtime-ready modules: 0

## Module Plans

| Module | Source facts | Evidence keys | Status                   | Purpose                                                                                                                               |
| ------ | -----------: | ------------: | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| moves  |           33 |            33 | planned_not_materialized | Plan phase-workspace candidate context for governed P0-P5 execution without advancing a live Move.                                    |
| source |           34 |            28 | planned_not_materialized | Plan candidate sourcing context across vendors, contracts, artifacts, and commercial evidence without starting a live sourcing event. |
| tower  |           27 |            27 | planned_not_materialized | Plan candidate outcome-ledger context across value signals, cost evidence, and leakage controls without claiming realized value.      |

## Guardrails

- Production tenant data written: false
- Active Tenant Access Layer updated: false
- Candidate promoted: false
- Module runtime routes changed: false
- No module reads candidate by default: true
