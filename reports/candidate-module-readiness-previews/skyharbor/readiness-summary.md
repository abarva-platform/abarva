# Candidate Module Readiness Preview

Tenant: `skyharbor-air`
Candidate: `skyharbor-air:skyharbor-air-pr10-candidate:candidate-dry-run`
Generated: `2026-07-10T00:00:00.000Z`

This preview shows module readiness for an inactive candidate tenant data
version. It does not write production tenant data, update active tenant access,
promote the candidate, or change module runtime behavior.

## Summary

- Quality gate: pass
- Modules evaluated: 5
- Preview-packet modules: 2
- Candidate-context modules: 1
- Blocked modules: 2
- Runtime-ready modules: 0
- Promotion decision: ready-for-operator-approval
- Promotion enabled: false

## Module Matrix

| Module       | Status                       | Preview packet | Runtime ready | Blockers | Next proof                                                                                                |
| ------------ | ---------------------------- | -------------- | ------------- | -------- | --------------------------------------------------------------------------------------------------------- |
| home         | preview_packet_available     | true           | false         | 4        | Persist and promote the candidate version, then prove Home reads the promoted active tenant slice.        |
| intelligence | preview_packet_available     | true           | false         | 4        | Run signed-in answer retrieval with citations from the promoted active tenant slice.                      |
| moves        | candidate_context_available  | false          | false         | 5        | Run a phase workspace proof that consumes promoted facts, evidence, graph context, and derived readiness. |
| source       | blocked_missing_derived_plan | false          | false         | 7        | Run a sourcing workflow proof that consumes promoted vendor, contract, evidence, and value context.       |
| tower        | blocked_missing_derived_plan | false          | false         | 7        | Run an outcome-ledger proof before any realized value or ROI claim.                                       |

## Guardrails

- Production tenant data written: false
- Active Tenant Access Layer updated: false
- Candidate promoted: false
- Module runtime routes changed: false
- No module reads candidate by default: true
