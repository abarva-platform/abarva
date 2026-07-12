# Candidate Module Graph Plan

Tenant: `skyharbor-air`
Candidate: `skyharbor-air:skyharbor-air-pr10-candidate:candidate-dry-run`
Generated: `2026-07-10T00:00:00.000Z`

This report creates module-targeted graph-plan objects for inactive candidate
workbench previews. It does not write production tenant data, update active
tenant access, promote the candidate, change module runtime behavior, or let
modules read candidate data by default.

## Summary

- Quality gate: pass
- Source records read: 53
- Graph objects planned: 3
- Graph nodes planned: 150
- Graph edges planned: 147
- Runtime-ready modules: 0

## Module Plans

| Module | Nodes | Edges | Status                   |
| ------ | ----: | ----: | ------------------------ |
| moves  |    50 |    49 | planned_not_materialized |
| source |    50 |    49 | planned_not_materialized |
| tower  |    50 |    49 | planned_not_materialized |

## Guardrails

- Production tenant data written: false
- Active Tenant Access Layer updated: false
- Candidate promoted: false
- Module runtime routes changed: false
- No module reads candidate by default: true
