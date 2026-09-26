# 2026-09-26 Source 360 Direct Impact Detail

## Release ID

`2026-09-26-source-360-direct-impact-detail`

## Status

`candidate`

## Plain-English Summary

A Source 360 supplemental action can be listed by a governed direct impact read while summary views contain no corresponding row. Contract 360 now uses that same direct producer, scoped to the one requested contract, after canonical and summary lookups miss. Supplemental action evidence remains distinct from canonical contract value.

## Layer Impact

Release lane: `global-control-lane`. Layer 4 Source read projection only. The Layer 3 contract, opportunity, evidence and tenant relationships remain authoritative; no data is written or inferred.

## Client Applicability

All authorized clients using the Source 360 direct impact provider. No client-specific data, migration or feature flag is added.

## Changes Included

Contract-scoped direct impact SQL, a narrow detail read, and the Contract 360 route fallback. The existing portfolio-wide query remains available for the workspace list.

## QA / Validation

- Pass: route test first reproduced a 404 when summary views had no row; then resolved the direct action with null contract-value fields.
- Pass: direct producer test verifies tenant and exact contract bind parameters in evidence and both action source branches, plus cross-tenant rejection and read-error propagation.
- Pass: removing the legacy action branch's contract predicate makes the targeted test fail; mutation restored.
- Pass: focused tests, adjacent workspace tests, scoped ESLint, TypeScript and release control.
- Not run: signed-in replay of the exact failing handoff; required after official deploy.

## Rollout Plan

Squash merge after applicable CI and review. Only `.github/workflows/aca-main-deploy.yml` may update the shared ACA runtime. No migration, data build, or flag update.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: record from successful workflow and verify independently.
- ACA runtime invariant: digest-pinned web template and healthy 100%-traffic revision.
- Worker image invariant: both delivery workers pinned to the approved digest.
- Feature/env flag update path: none.
- Live signed-in proof required: replay the same supplemental action-to-detail handoff.

## Rollback Plan

Revert the merge in a new PR and redeploy through the repo-owned main workflow. No data rollback is required.

## Audit Evidence

Focused test output, PR/CI, official deploy run, read-only runtime digest proof, and private signed-in smoke ledger.

## Known Gaps

The earlier summary-view fallback passed local tests and deployed but failed signed-in readback on a direct-only action. This correction is not complete until that exact live handoff resolves.
