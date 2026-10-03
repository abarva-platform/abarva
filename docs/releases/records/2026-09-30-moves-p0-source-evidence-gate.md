# 2026-09-30-moves-p0-source-evidence-gate — Require reviewed source evidence before P0 advances

## Release ID

`2026-09-30-moves-p0-source-evidence-gate`

## Status

`candidate`

## Plain-English Summary

Moves P0 can no longer advance on intake answers alone. Before sponsor approval,
the system must verify at least one phase-scoped uploaded file is linked to the
Move, parsed, and approved through the human evidence-review flow. A file still
awaiting review is shown as awaiting review and continues to block the gate.

## Layer Impact

**Release lane: `global-control-lane`.** This changes the shared Moves gate
behavior for all tenants.

- **Layer 3 (Canonical model):** Reads the existing tenant-scoped evidence and
  review records; no schema or canonical-object changes are introduced.
- **Layer 4 (Products):** P0 readiness, approval endpoints, and origination copy
  now distinguish completed intake from evidence-backed approval. No evidence
  can be counted from a different phase or from an unlinked/unparsed record.

## Client Applicability

- All clients: yes, for new or open P0 Moves
- Specific clients: none
- Internal only: no
- Public/demo only: no
- Feature flag: none

## Changes Included

- Require at least one uploaded, parsed, human-reviewed P0 source file before
  either P0 approval path can record approval or advance the phase.
- Verify any `move_artifact_id` against the current, same-tenant, same-Move
  uploaded artifact registry row; summary-only or unparsed records do not count.
- Keep evidence readiness fail-closed when the read model is unavailable.
- Show missing evidence and uploaded-but-awaiting-review as distinct states;
  both remain hard blockers.
- Re-label intake submission so it cannot be mistaken for sponsor approval or
  phase advancement.
- Persist the P0 phase on new origination approval requests so the shared
  approval service can apply the evidence check without a phase guess.
- Add regression coverage for evidence linkage, tenant/Move scoping, P0 gate
  open/blocked behavior, approval routing, and user-facing readiness.
- Regenerate the product manual from the phase-pack source so its P0 evidence
  requirement matches the executable workflow contract.

## QA / Validation

- **Pass:** 83 targeted tests across seven suites, including the P0 phase-gate route
  (run by exact test paths to include the bracketed route directory).
- **Pass:** Moves visible-controls matrix, 15 suites and 170 tests.
- **Pass:** all 96 Programs library unit suites, 864 tests.
- **Pass:** governed Programs integration matrix, 26 suites; 518 passed and 12 skipped.
- **Pass:** guarded repository typecheck.
- **Pass:** targeted ESLint and `git diff --check`.
- **Pass:** test CI coverage census refreshed; new suites are covered by the
  existing programs library workflow.
- **Pass:** release check with the exact `origin/main` base and generated manual
  freshness check.
- **Pass:** mutation probes show the phase-gate regression test fails when the
  evidence blocker is weakened, and the artifact-link test fails when orphaned
  artifact references are accepted.
- **Pending:** pull-request CI, deployed runtime invariant, and signed-in
  synthetic P0 upload/review/approval proof.

## Rollout Plan

Merge through a pull request. Deploy the exact merge SHA only through
`.github/workflows/aca-main-deploy.yml`. Verify the matching workflow run, the
Container App template and 100%-traffic revision digest, and all required worker
job digests before performing the signed-in synthetic P0 smoke.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside that workflow
- Approved image digest: pending exact merge-SHA deployment
- ACA runtime invariant: pending exact merge-SHA deployment
- Worker image invariant: pending exact merge-SHA deployment
- Feature/env flag update path: none
- Live signed-in proof required: yes; verify upload, parsed extraction review,
  P0 sponsor approval, and P1 opening through product paths

## Rollback Plan

Revert the code through a pull request and deploy the resulting main SHA through
the repo-owned ACA workflow. No database migration, data repair, or flag change
is required.

## Audit Evidence

- PR and exact merge-SHA deployment records: pending
- Regression suites: P0 evidence contract, evidence read model, phase readiness,
  approval service, phase-gate route, and origination client tests
- CI logs and signed-in result: pending

## Known Gaps

The full synthetic client journey from P0 through P5 remains in progress. This
release record does not claim artifact-generation, redline, estimate, business
case, or mobilization runtime proof.
