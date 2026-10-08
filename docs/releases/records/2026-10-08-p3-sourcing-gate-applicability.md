# 2026-10-08-p3-sourcing-gate-applicability — Keep the declared P3 sourcing artifact in the build

## Release ID

`2026-10-08-p3-sourcing-gate-applicability`

## Status

`candidate`

## Plain-English Summary

P3 declares a sourcing brief as a gate artifact, but adaptive-depth resolution could omit it whenever no vendor decision was evidenced. The build then returned a shorter package than the workspace's declared gate set. This change keeps a bounded delivery-assumption brief in the package without implying a vendor selection or a settled build/buy decision.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4, Products: shared Moves deliverable applicability and generation instructions. No canonical data, intake, adapter, or tenant authorization change.

## Client Applicability

- All clients using the broad P3 build set when no vendor decision is evidenced.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: existing Moves generation enrollment is unchanged.

## Changes Included

- Classify `sourcing_strategy` as lightweight when the vendor decision signal is absent, preserving its declared gate-artifact slot.
- Require the resulting brief to state delivery-capacity assumptions, open sourcing decisions, and P4 sizing inputs without selecting or implying a vendor.
- Clarify the adaptive-depth prompt so content directly required by the current artifact's applicability is allowed at bounded depth.

## QA / Validation

- PASS: 65 focused adaptive-depth and phase-enqueue tests, including a no-vendor P3 case and the existing six-document batch case.
- PASS: scoped ESLint and regenerated coverage census after the main-branch test-file delta.
- PASS: full typecheck, including tests, and release check (11/11).
- NOT RUN: signed-in P3 rebuild and artifact/gate readback after deployment.

## Rollout Plan

Squash merge the scoped PR. The repo-owned ACA main deploy workflow builds and deploys the approved digest. Verify the web and worker runtime invariant, then run a signed-in P3 build and inspect the sourcing brief and gate ledger before any approval.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this PR.
- Approved image digest: assigned by the deploy workflow.
- ACA runtime invariant: verify template and 100% traffic revision against the approved digest.
- Worker image invariant: verify required worker images against the approved digest.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, the built artifact and gate standing must be read back.

## Rollback Plan

Revert the PR and redeploy the previous approved digest through the repo-owned workflow. Existing artifacts and program state remain unchanged.

## Audit Evidence

PR checks, test output, signed-in build response, artifact readback, ACA deploy run, and runtime invariant proof.

## Known Gaps

An earlier run that omitted the brief does not acquire it automatically. Rebuild the phase after deployment, then review and sign off the newly generated version before submitting the gate.
