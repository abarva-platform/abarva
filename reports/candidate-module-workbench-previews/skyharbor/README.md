# Candidate Module Workbench Preview

Tenant: `skyharbor-air`
Candidate: `skyharbor-air:skyharbor-air-pr10-candidate:candidate-dry-run`
Generated: `2026-07-10T00:00:00.000Z`

This report creates read-only candidate workbench packets for Moves, Source,
and Tower. It does not write production tenant data, update active tenant
access, promote the candidate, change module runtime behavior, or allow modules
to read candidate data by default.

## Summary

- Quality gate: pass
- Workbench preview packets: 3
- Runtime-ready modules: 0
- Evidence keys: 47
- Moves facts: 24
- Source facts: 24
- Tower facts: 24

## Module Packets

| Module | Readiness                | Facts | Derived insights | Runtime eligible | Blockers |
| ------ | ------------------------ | ----: | ---------------: | ---------------- | -------: |
| moves  | preview_packet_available |    24 |                1 | false            |        4 |
| source | preview_packet_available |    24 |                1 | false            |        4 |
| tower  | preview_packet_available |    24 |                1 | false            |        4 |

## Guardrails

- Production tenant data written: false
- Active Tenant Access Layer updated: false
- Candidate promoted: false
- Module runtime routes changed: false
- No module reads candidate by default: true
