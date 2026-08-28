# 2026-08-28-meridian-phs-handoff-proof-status — Meridian Handoff Proof Status

## Release ID

`2026-08-28-meridian-phs-handoff-proof-status`

## Status

`candidate`

## Plain-English Summary

Adds a deterministic Meridian/PHS cross-module handoff proof artifact for the executive demo. The proof records whether the demo loop across Moves, Tower, Intelligence, and Source is structurally supported by code and tests, and it deliberately reports the Tower-to-Moves write-side gap instead of counting read-side traceability as a complete workflow.

## Layer Impact

Lane: `global-control-lane`.

Layer 4 Products: adds proof/status tooling only. It does not change product runtime behavior, data-plane reads, route defaults, serving views, or Azure data.

Reporting and release evidence: extends the Meridian/PHS demo readiness status writer so a handoff proof summary can populate the cross-module handoff denominator.

## Client Applicability

- All clients: none.
- Specific clients: Meridian/PHS synthetic demo tenant only.
- Internal only: proof tooling and readiness reporting.
- Public/demo only: Meridian/PHS demo readiness evidence.
- Feature flag: none.

## Changes Included

- `scripts/ecl/write_meridian_phs_handoff_proof.mjs`
- `scripts/ecl/write_meridian_phs_demo_status.mjs`
- `docs/architecture/meridian-phs-demo-readiness-status.json`
- `package.json` script `ecl:meridian-phs-handoff-proof:write`

## QA / Validation

Validation status:

- PASS: `node --check scripts/ecl/write_meridian_phs_handoff_proof.mjs`
- PASS: `npm run ecl:meridian-phs-handoff-proof:write -- --json`
- PASS: `node --check scripts/ecl/write_meridian_phs_demo_status.mjs`
- PASS: `npm run ecl:meridian-phs-demo-status:write -- --handoff-proof job-output/meridian-phs-handoff-proof/meridian_phs_handoff_proof_summary.json --json`
- PASS: `git diff --check`
- PASS: `npm run release:check`

## Rollout Plan

Merge to main after local validation. No ACA deployment is required because this is proof tooling and status-reporting infrastructure only.

## Deployment Authority

- Repo-owned deploy workflow: not required.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not applicable.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: not for this deterministic proof slice; still required for route/browser claims.

## Rollback Plan

Revert the PR. The rollback removes the handoff proof writer and status-summary integration without touching runtime product paths or data-plane state.

## Audit Evidence

Audit evidence will be the merged PR, local validation output, and generated `job-output/meridian-phs-handoff-proof/meridian_phs_handoff_proof_summary.json`.

## Known Gaps

Tower-to-Moves is not counted as fully proven. The read-side trace can resolve Move-subject Tower outcome-ledger rows, but a Tower action that creates or updates a Move still needs product proof.
