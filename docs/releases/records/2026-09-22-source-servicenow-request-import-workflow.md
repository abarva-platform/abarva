# 2026-09-22-source-servicenow-request-import-workflow — Controlled Request Import Dispatch

## Release ID

`2026-09-22-source-servicenow-request-import-workflow`

## Status

`candidate`

## Plain-English Summary

Adds a manual, repo-owned workflow that can run the existing ServiceNow request importer in proof-only mode against the digest-pinned deployed image. Apply remains a separate, human-gated action requiring one tenant, an exact input hash, an approval reference, and an exact confirmation phrase.

## Layer Impact

Release lane: `client-data-lane`.

- Client intake: dispatches the existing governed request adapter with immutable source identity.
- Source adapter/operator: reuses the single merged operator entrypoint; no second loader or wrapper is introduced.
- Canonical model: apply can append request-version rows only after the existing loader and workflow gates pass.
- Product: unchanged by workflow deployment alone.

## Client Applicability

- All clients: Reusable after tenant-specific approval.
- Specific clients: None.
- Internal only: Workflow dispatch and proof capture.
- Public/demo only: The checked-in fixture is synthetic.
- Feature flag: None.

## Changes Included

- Manual `.github/workflows/source-servicenow-request-import-job.yml` dispatch.
- Integration test for trigger, immutable scope, apply approval, branch, and single-entrypoint rules.
- Workflow proof records hashes of the approval reference and idempotency key without exposing their values.
- No new loader, migration, data model, or product route.

## QA / Validation

- Pass — red-first workflow contract failed because no workflow existed.
- Pass — focused workflow integration tests.
- Pass — workflow reuses `source:servicenow-requests:job` and `source:servicenow-requests:apply-job`.
- Pass — workflow contains no migration command and defaults to proof-only mode.
- Not run — ACA workflow dispatch, migration apply, request import apply, tenant write, supplier contact, event creation, or signed-in acceptance.

## Rollout Plan

Squash merge through the protected repository and deploy the resulting image through the repo-owned ACA main workflow. Deployment makes the dispatch definition available but does not run it. A later proof-only dispatch may be run without data mutation; apply requires separate action-time authorization.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: The new workflow submits the existing private ACA operator job; it does not shift web traffic.
- Approved image digest: Resolved from the deployed Container App and required to be digest-pinned.
- ACA runtime invariant: Required before any operator execution claim.
- Worker image invariant: The operator uses the explicitly resolved approved digest.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, only after a separately authorized apply and readback.

## Rollback Plan

Revert the workflow PR. Workflow rollback does not delete or rewrite any request authority rows from a separately approved prior apply.

## Audit Evidence

- Pull request and hosted checks.
- Focused workflow contract test.
- Repo-owned ACA deployment evidence.
- Future proof-only or approved apply artifact bundle and independent readback.

## Known Gaps

- The request authority migration remains a separate operator-controlled prerequisite.
- This release does not dispatch the workflow or load request data.
