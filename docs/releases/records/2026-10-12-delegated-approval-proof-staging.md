# 2026-10-12-delegated-approval-proof-staging — Save exact approval evidence privately

## Release ID

`2026-10-12-delegated-approval-proof-staging`

## Status

`candidate`

## Plain-English Summary

An operator can save the exact authority and normalized decision files for a delegated approval in the private data store. The job checks their checksums, confirms they refer to the same authorizer, delegate session, and human authorization reference, refuses to overwrite different content, and reads both files back. It only saves evidence; it does not approve a dataset or change what a product shows.

## Layer Impact

Release lane: `internal-admin`. The job writes two audit files in the private operator proof area. It does not change client intake, adapters, canonical records, product projections, or selectors.

## Client Applicability

- All clients: no automatic change.
- Specific clients: none from merging this helper.
- Internal only: a separately authorized, exact operator run can store two approval evidence files.
- Public/demo only: no direct change.
- Feature flag: none.

## Changes Included

- `scripts/tower/stage-delegated-approval-proof-job.mjs` checks exact input bytes and stores content-addressed authority and decision JSON in private Blob storage with create-only conditions and readback.
- `package.json` exposes the helper to the standard ACA operator-job wrapper.
- Focused tests cover changed bytes, reviewer provenance, claimed independent attestation, and pre-existing Blob content.

## QA / Validation

- PASS: focused Node tests (3/3), changed-file ESLint, and `git diff --check`.
- PASS: `npm run release:check` after this record is finalized.
- NOT RUN: protected PR checks and the private ACA proof job; record their status and the ACA execution, digest, two Blob URIs and SHA-256 values, and readback marker during rollout. No private approval contents are printed.

## Rollout Plan

Merge through a protected PR. The repo-owned ACA main workflow builds and deploys the exact commit. After runtime digest parity is checked and the shared private operator job is available, submit this helper on that digest with the two exact approved JSON files. Pass the file bytes through temporary job-scoped secret references, never plain job-start environment values: execution metadata and local polling artifacts can retain plain values. Confirm the execution is terminal, remove only the two temporary secrets, and read back the original job configuration. The job creates the private proof objects and confirms their bytes. The separate serving approval verifier still has to check authority, scope, and the exact candidate before any selector change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` alone changes shared web traffic.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: bind the operator job to the deployed digest.
- ACA runtime invariant: verify web template, healthy 100% traffic revision, and required workers on the same digest.
- Worker image invariant: verify required worker images before the job.
- Feature/env flag update path: none.
- Live signed-in proof required: no product surface changes from this helper. Serving promotion has its own signed-in proof gate.

## Rollback Plan

Stop using the helper and revert its code through a protected PR if needed. Keep already written content-addressed evidence for audit; this job never changes selectors or canonical records. A differing Blob is refused, not overwritten.

## Audit Evidence

The protected PR and checks, repo-owned deployment, exact ACA job request and execution, readback marker, and private Blob hashes provide the evidence chain.

## Known Gaps

This helper does not decide whether a delegated approval is valid or sufficient for any load or serving action. Those gates remain in the shared approval resolver and the product operator.
