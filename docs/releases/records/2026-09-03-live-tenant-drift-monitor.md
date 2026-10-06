# 2026-09-03-live-tenant-drift-monitor — Run tenant drift checks inside the private operator path

## Release ID

`2026-09-03-live-tenant-drift-monitor`

## Status

`candidate`

## Plain-English Summary

The canonical tenant drift workflow now keeps pull-request checks static, but scheduled and manual runs also execute the live tenant identity verifiers through the private Azure Container Apps operator job. This prevents the workflow from reporting green when it has only validated repository arrays and never reached the database.

## Layer Impact

Internal control lane: updates GitHub Actions monitoring for tenant identity drift. The change does not alter product behavior, tenant data, migrations, loaders, or client-facing routes.

## Client Applicability

- All clients: The monitor covers the shared control database tenant identity contract.
- Specific clients: None.
- Internal only: Yes, this is an internal governance and security monitor.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `.github/workflows/canonical-tenant-drift.yml`: keeps the existing PR-safe static check name and adds a scheduled/manual live job.
- The live job resolves the currently deployed digest-pinned ACA image, then runs `db:verify:canonical-tenants` and `db:verify:tenant-keys` through `scripts/ops/submit-aca-operator-job.mjs`.
- The classifier separates `CLEAN`, `DRIFT`, and `NOT CHECKED` outcomes instead of treating an unreachable check as a pass.

## QA / Validation

- Pass: Manual dry-run evidence before this candidate: `db:cleanup:tenant-keys` dry-run through the deployed private operator job scanned 201 active tenant columns, found 1,784 alias rows, found 0 duplicate alias rows, and exited dry-run only.
- Pass: YAML parsed with Ruby `YAML.load_file`.
- Pass: `git diff --check`.
- Pending: PR validation.

## Rollout Plan

Merge to `main`. The workflow change becomes active immediately for scheduled/manual GitHub Actions runs. No database migration, seed, cleanup apply, feature flag, or product deploy is required for the monitor wiring itself.

## Deployment Authority

- Repo-owned deploy workflow: Not applicable; this changes a GitHub Actions monitor, not web runtime.
- Shared runtime mutators: The monitor uses `scripts/ops/submit-aca-operator-job.mjs` to run read-only verifier scripts inside the private operator job.
- Approved image digest: Resolved at monitor runtime from the deployed web Container App template image.
- ACA runtime invariant: The monitor uses the currently deployed digest-pinned image and does not shift traffic.
- Worker image invariant: Not changed.
- Feature/env flag update path: None.
- Live signed-in proof required: No; this is a database monitor, not a user-facing surface.

## Rollback Plan

Revert the workflow change. Scheduled/manual tenant drift runs would return to static-only behavior; no tenant data rollback is involved because this release performs no writes.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/7354.
- Manual operator dry-run evidence: `/tmp/tenant-canonical-cleanup-dryrun-operator-20260903`.
- Latest deployed image used for the dry-run: `acrabarvalab001.azurecr.io/abarva/web@sha256:2fe0ed3bf118f7d80ada249f02a158b3aedea5a57732b6607e7d368767430d7d`.

## Known Gaps

This release does not repair live tenant identity drift. It only makes scheduled/manual checks reach the database and report drift or unknown state honestly. Any tenant-key cleanup apply remains a separately approved data-plane mutation.
