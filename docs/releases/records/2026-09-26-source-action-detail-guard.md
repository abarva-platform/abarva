# 2026-09-26 Source action detail recovery

## Release ID

`2026-09-26-source-action-detail-guard`

## Status

`candidate`

## Plain-English Summary

When a contract detail request returns not found, Source now stops retrying that terminal response and retains the related sourcing action for review. It does not substitute another contract or manufacture a detail record. A transient service failure still follows the existing retry policy.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 Products: Source changes the contract-detail error and action-review path only. Layer 3 canonical contract facts and identities are unchanged.

## Client Applicability

- All clients: Source workspace users.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Source workspace contract-detail fetch and unavailable-state presentation.
- A browser-surface regression for missing detail and preservation of a valid off-slice contract path.
- No migration, loader, external notification, or tenant data mutation.

## QA / Validation

- Pass: three Source workspace suites, 21/21 tests, including the CI-wired browser suite.
- Pass: red-first missing-detail regression and a deliberate 404-classification mutation that made the test fail.
- Pass: ESLint on changed TypeScript files.
- Pass: full TypeScript check with an 8 GB Node heap; the default 4 GB attempt exhausted memory.
- Not run: signed-in post-deployment replay; required after the official main deployment.

## Rollout Plan

Squash-merge a reviewed PR into main. Only the repo-owned ACA main workflow may build and deploy the web image. No environment or data-plane change is needed.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside that workflow.
- Approved image digest: Verify from the completed workflow.
- ACA runtime invariant: Verify digest-pinned template and 100%-traffic revision after deployment.
- Worker image invariant: Verify required workers separately; this change does not update them.
- Feature/env flag update path: None.
- Live signed-in proof required: Reopen a missing-detail action and a valid detail-backed action.

## Rollback Plan

Revert the PR through the protected main branch and allow the repo-owned workflow to deploy the reverted image. No schema rollback is required.

## Audit Evidence

- PR and CI links are recorded on the release candidate when available.
- Local browser-surface tests and mutation proof are described above.

## Known Gaps

The missing contract detail record remains a separate identity/read-model reconciliation task. This release does not claim that a contract was created or that the affected record is accepted in Contract 360.
