# 2026-09-29 Moves Client Approval Lineage

## Release ID

`2026-09-29-moves-client-approval-lineage`

## Status

`candidate`

## Plain-English Summary

When a reviewer accepts a generated Moves deliverable, its validated source artifact and approved-evidence revision are now recorded on the governed deliverable row that the phase gate evaluates. The gate continues to block approvals whose evidence revision is stale or cannot be verified.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4, Moves: generated-artifact acceptance now persists its verified lineage on the authoritative deliverable record used by the phase gate.
- Layer 3, canonical enterprise model: no new canonical object or client fact is created; no schema change.
- Layer 1/2: no intake format or source-adapter change.

## Client Applicability

- All clients: yes, for generated Moves deliverable approvals.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Persist validated generated-artifact ID, approval mode, and evidence revision alongside the governed sign-off state.
- Preserve generation lineage on uploaded reviewed versions.
- Add route and mutation tests for accepted uploads and current-evidence gate lineage.
- No migration, data job, approval-policy relaxation, or external transmission.

## QA / Validation

- Pass: focused route, sign-off mutation, and gate suites, 49/49.
- Pass: mutation removing the governed-row lineage write failed the uploaded-final sign-off regression; implementation restored and all focused suites passed.
- Pass: `npm run typecheck` completed cleanly.
- Pass: scoped ESLint on the changed implementation and test files.
- Pass: `node scripts/release-check.mjs --base origin/main --head HEAD`.
- Pending: PR CI and signed-in post-deploy replay.

## Rollout Plan

Squash-merge the reviewed PR to `main`. Only the repo-owned ACA main workflow may build and deploy the digest-pinned web image. No migration or data build is part of this release. After runtime proof, repeat generated DOCX review/upload and sign-off through the product, then confirm the P1 gate evaluates against the current approved-evidence revision.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: pending official build.
- ACA runtime invariant: pending web template and 100%-traffic revision readback.
- Worker image invariant: pending required worker readback.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, review/upload, sign-off, then gate readback.

## Rollback Plan

Revert through a PR and the repo-owned main deploy workflow. No migration or bulk data rewrite is included. Existing sign-offs remain auditable; any artifact requiring new approval must be reviewed and approved through the normal product flow.

## Audit Evidence

- Focused tests and mutation result are recorded in the private execution ledger; PR, CI, deployment, and signed-in receipts will be appended when available.

## Known Gaps

- Existing signed-off rows are not backfilled. Their evidence lineage remains governed by the revision already recorded; reapproval through the corrected flow is required when the product identifies a stale or unverifiable revision.
