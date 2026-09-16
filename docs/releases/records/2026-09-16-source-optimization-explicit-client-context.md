# 2026-09-16 Source optimization explicit-client context

## Release ID

`2026-09-16-source-optimization-explicit-client-context`

## Status

`candidate`

## Plain-English Summary

Starting an optimization workflow from a contract now resolves an explicitly selected client through authenticated access control before building the event's actor and client context. A temporary default-client lookup failure no longer blocks an otherwise authorized selection. Contract detail distinguishes a failed data-plane read from an actual missing contract.

## Layer Impact

`global-control-lane`: Layer 4 application routing and identity context only. No Layer 1, 2, or 3 records or schemas change in this release.

## Client Applicability

All clients using the Source workspace contract-optimization action. No feature flag.

## Changes Included

The contract optimization POST route uses an authorized explicit-client tenancy context. The tenant helper looks up that client's row and preserves the authenticated actor identity. It rejects unauthorized selections before reading a client row. The contract-detail GET returns a retryable, non-cacheable 503 when all available read paths fail rather than a false 404.

## QA / Validation

Focused tests cover authorized routing, unauthorized and unauthenticated refusals, retryable client-row lookup failures, tenancy response mapping, true not-found versus failed reads, and fallback recovery. Scoped ESLint and TypeScript checks are required before merge. Signed-in event-creation proof remains a post-deploy gate because it writes an event.

## Rollout Plan

Merge by PR, then allow the repo-owned ACA main deploy workflow to build and deploy the exact main SHA. No migration or data job for this release.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: resolve from the deploy run.
- ACA runtime invariant: template and 100% traffic revision must match the approved digest.
- Worker image invariant: required workers must match the approved digest.
- Feature/env flag update path: none.
- Live signed-in proof required: an authorized Source create actor can open an optimization event on its own contract; a cross-client actor is refused.

## Rollback Plan

Revert the PR through the main deploy lane. No data rollback is required for the code change; any test events created during proof require separate governed review.

## Audit Evidence

PR and deploy run links, focused test output, digest invariant, and signed-in proof after rollout.

## Known Gaps

The separately governed contract-intelligence view migration and full signed-in content acceptance are not part of this release.
