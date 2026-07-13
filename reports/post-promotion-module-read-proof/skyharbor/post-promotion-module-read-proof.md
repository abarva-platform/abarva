# Post-Promotion Module Read Proof - SkyHarbor

Generated: `2026-07-13T00:00:00.000Z`
Tenant: `skyharbor-air`
Active version: `skyharbor-air:skyharbor-air-pr10-candidate:candidate-dry-run`

The proof harness resolved the promoted Active Tenant Access metadata pointer for
Home, Intelligence, Moves, Source, and Tower. This proof does not change module
runtime consumption or make modules read promoted data by default.

## Module Reads

- home: pass - home resolved active version skyharbor-air:skyharbor-air-pr10-candidate:candidate-dry-run through the proof harness.
- intelligence: pass - intelligence resolved active version skyharbor-air:skyharbor-air-pr10-candidate:candidate-dry-run through the proof harness.
- moves: pass - moves resolved active version skyharbor-air:skyharbor-air-pr10-candidate:candidate-dry-run through the proof harness.
- source: pass - source resolved active version skyharbor-air:skyharbor-air-pr10-candidate:candidate-dry-run through the proof harness.
- tower: pass - tower resolved active version skyharbor-air:skyharbor-air-pr10-candidate:candidate-dry-run through the proof harness.

## Guardrails

- Production tenant data written: false
- Active Tenant Access updated in this proof: false
- Candidate promoted in this proof: false
- Module runtime consumption changed: false
- Default module reads candidate data: false
