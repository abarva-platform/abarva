# 2026-10-08-moves-gate-signoff-count — Count only recorded gate sign-offs

## Release ID

`2026-10-08-moves-gate-signoff-count`

## Status

`candidate`

## Plain-English Summary

The gate ledger previously counted an unbuilt or unverified gate artifact as “signed off” while its row said no sign-off existed. The displayed count now includes only a current recorded sign-off. The submit control still holds known unsigned drafts and defers other readiness checks to the existing build-set and server gate.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4, Products: shared Moves phase-build sign-off status. No canonical data, adapter, intake, authorization, or server gate change.

## Client Applicability

- All clients using the Moves phase gate ledger.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: existing Moves workspace enrollment remains unchanged.

## Changes Included

- Separate the count of recorded sign-offs from the count of known unsigned drafts.
- Keep an unbuilt or unverified output out of the signed-off count without changing server gate evaluation.

## QA / Validation

- PASS: seven focused gate-ledger tests, including unbuilt and unverified rows.
- PASS: full typecheck, scoped lint, coverage census, and release check (11/11 gates).
- NOT RUN: signed-in post-deployment ledger readback.

## Rollout Plan

Squash merge the scoped PR. The repo-owned ACA main deploy workflow builds and deploys the approved digest. Verify runtime digest invariants and the signed-in phase ledger after a full reload.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this PR.
- Approved image digest: assigned by the deploy workflow.
- ACA runtime invariant: verify template and 100% traffic revision against the approved digest.
- Worker image invariant: verify required worker images against the approved digest.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, the initial and hydrated ledger counts must be checked.

## Rollback Plan

Revert the PR and redeploy the previous approved digest through the repo-owned workflow. No stored approval record changes.

## Audit Evidence

PR checks, gate-ledger test output, ACA deploy run, runtime invariant proof, and signed-in ledger readback.

## Known Gaps

This corrects the displayed sign-off count. It does not create a missing artifact or sign-off and does not approve a phase gate.
