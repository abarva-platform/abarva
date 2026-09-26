# 2026-09-26 Source action error-loop guard

## Release ID

`2026-09-26-source-action-error-loop`

## Status

`candidate`

## Plain-English Summary

When Source has already received a contract-detail failure, the related action drawer no longer offers a link straight back to that failed detail view. The action remains available for review. A contract outside the preloaded summary is not considered failed until its own detail request actually fails.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 Products: Source workspace presentation only. Layer 3 contract identities, facts, and action records are unchanged.

## Client Applicability

- All clients: Source workspace users.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- The action drawer reads the selected contract's actual detail-error state before offering Contract 360 navigation.
- The existing CI-wired workspace browser test covers the error loop. The separate successful off-slice detail case remains covered.
- No migration, loader, email, supplier contact, or tenant data mutation.

## QA / Validation

- Pass: red-first browser behavior and a deliberate false-state mutation that caused the regression test to fail.
- Pass: three focused Source workspace suites, 21/21 tests.
- Pass: ESLint, full TypeScript check with an 8 GB Node heap, and release check.
- Not run: post-deploy signed-in replay; required after the official main workflow.

## Rollout Plan

Squash-merge after applicable CI and review. Only the repo-owned ACA main workflow may build and deploy the web image.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside that workflow.
- Approved image digest: Verify from the completed workflow.
- ACA runtime invariant: Verify digest-pinned template and 100%-traffic revision after deployment.
- Worker image invariant: Verify required workers separately.
- Feature/env flag update path: None.
- Live signed-in proof required: Reopen the measured missing-detail action, review its drawer, and confirm the failed Contract 360 link is absent; also verify a detail-backed path.

## Rollback Plan

Revert the PR through protected main and let the repo-owned workflow deploy the reverted image. No schema rollback is required.

## Audit Evidence

- PR, CI, deploy run, and signed-in replay are recorded in the private smoke ledger as they complete.

## Known Gaps

The missing contract detail/identity mapping remains a separate read-model task. This release does not create a canonical contract or claim Contract 360 acceptance for that record.
