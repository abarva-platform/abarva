# 2026-09-03-tenant-cleanup-durable-proof — Require durable proof before tenant cleanup apply

## Release ID

`2026-09-03-tenant-cleanup-durable-proof`

## Status

`candidate`

## Plain-English Summary

The tenant canonical cleanup script now refuses apply mode unless durable proof storage is configured. It writes the cleanup report and manifest before commit, uploads the same evidence to Blob storage when configured, and emits a structured evidence event for the ACA operator wrapper.

## Layer Impact

Internal control lane: hardens an operator cleanup script used for tenant identity maintenance. The change does not perform tenant cleanup, alter product behavior, add migrations, or change client-facing routes.

## Client Applicability

- All clients: The cleanup script covers shared control-plane tenant identity rows.
- Specific clients: None.
- Internal only: Yes, this is an internal governance/operator safety change.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `scripts/tenant-canonical-cleanup.ts`: requires durable proof configuration before apply mode can run.
- Local report and manifest are written before commit, so evidence-write failures roll back the transaction instead of failing after commit.
- Optional Blob proof upload is supported through `TENANT_CLEANUP_PROOF_BLOB_*` or shared object-store env vars.
- A structured `tenant_canonical_cleanup_evidence` event records totals, report hash, local report path, and Blob proof result.

## QA / Validation

- Pass: Apply mode with a dummy `DATABASE_URL` and no proof storage config failed before connecting.
- Pass: File-level ESLint for `scripts/tenant-canonical-cleanup.ts`.
- Pass: `git diff --check`.
- Pending: `node scripts/release-check.mjs`.
- Pending: PR validation.
- Pending: Post-merge dry-run through the private operator job with Blob proof env configured.

## Rollout Plan

Merge to `main`. The next repo-owned ACA main deploy image will include the script change. A tenant cleanup apply remains a separately approved data-plane mutation and must pass explicit Blob proof env values.

## Deployment Authority

- Repo-owned deploy workflow: The normal ACA main deploy workflow builds the updated runtime image after merge.
- Shared runtime mutators: None in this candidate.
- Approved image digest: Produced by the repo-owned deploy workflow after merge.
- ACA runtime invariant: To be verified by the repo-owned deploy workflow if a deploy is triggered.
- Worker image invariant: Not changed.
- Feature/env flag update path: None.
- Live signed-in proof required: No; this is an operator script, not a user-facing surface.

## Rollback Plan

Revert the script change. No tenant data rollback is involved because this release performs no cleanup apply.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/7357.
- Dry-run evidence that motivated the guard: tenant cleanup report path must be writable and durable before apply mode.

## Known Gaps

This release does not repair live tenant identity drift. It only makes the eventual cleanup apply proof-safe. The cleanup apply itself remains out of scope until explicitly approved.
