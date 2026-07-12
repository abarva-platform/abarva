# Moves Shadow Proof - SkyHarbor

Tenant: `skyharbor-air`
Candidate: `skyharbor-air:skyharbor-air-pr10-candidate:candidate-dry-run`
Generated: `2026-07-10T00:00:00.000Z`
Quality gate: `pass`

This proof simulates a governed Moves P0-P5 path from inactive candidate
evidence. It does not advance a live Move, approve a gate, write Moves tables,
write Outcome Ledger tables, update active access, promote a candidate, change
runtime module behavior, or claim realized value.

## Move Context

- Selected Move: IROPS AI recovery cockpit (SHA-MOVE-001)
- Current-state findings: 28
- Golden questions: 42
- Workbench facts: 24
- Workbench relationships: 48
- Derived insights: 1

## Phase Readiness

| Phase | Name                     | Status          | Candidate inputs | Evidence refs | Blockers |
| ----- | ------------------------ | --------------- | ---------------: | ------------: | -------: |
| P0    | Originate                | shadow_ready    |               24 |            24 |        2 |
| P1    | Charter                  | partially_ready |               53 |            13 |        3 |
| P2    | Understand Current State | shadow_ready    |               28 |            24 |        2 |
| P3    | Choose the Approach      | shadow_ready    |               48 |            24 |        2 |
| P4    | Build the Plan           | partially_ready |               42 |            24 |        3 |
| P5    | Prepare to Execute       | blocked         |                1 |            24 |        4 |

## Guardrails

- Production tenant data written: false
- Active Tenant Access Layer updated: false
- Candidate promoted: false
- Live Move advanced: false
- Gate approval auto-executed: false
- Module runtime consumption changed: false
- Candidate read by default: false
- Realized value claimed: false
