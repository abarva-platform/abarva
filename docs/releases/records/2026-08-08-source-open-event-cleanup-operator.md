# 2026-08-08-source-open-event-cleanup-operator — Source Open-Event Cleanup Operator

## Release ID

`2026-08-08-source-open-event-cleanup-operator`

## Status

`candidate`

## Plain-English Summary

Adds a reusable internal operator script for cleaning up Source events that should no longer appear
as open work. The script is dry-run by default: it inventories candidate Source events, linked
artifact registry rows, related per-event state rows, and exact blob locations. Apply mode requires
an explicit confirmation token and archives candidate events through `source_events.lifecycle_state`.
It does not delete or soft-delete artifact rows, blob objects, contract records, vendor records,
application/context data, or any other tenant substrate.

## Layer Impact

- Layer 4 Products: Source portfolio visibility can be cleaned by archiving event rows through an
  internal operator command.
- Data-plane operations: Adds a governed cleanup path for Source event lifecycle rows when an
  operator explicitly runs apply mode. Linked artifacts and blob locations are backed up and
  inventoried only.

## Client Applicability

- All clients: The operator can be run for any explicitly supplied tenant key.
- Specific clients: None by default.
- Internal only: Yes. This is an AbarVa operator script, not a user-facing route.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `scripts/ops/source-open-event-cleanup.ts`
- `package.json` script `ops:source-open-events:cleanup`
- `src/components/source/SourceOriginatePage.tsx` keeps the canonical Source category picker
  visible by default so new events can select the real taxonomy after cleanup.

## QA / Validation

- Pass: `npx tsx scripts/ops/source-open-event-cleanup.ts --help`
- Pass: `npx eslint scripts/ops/source-open-event-cleanup.ts`
- Pass: `npx jest src/components/source/__tests__/SourceOriginatePage.contractOptimization.test.ts --runInBand`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`
- Pass: `npm run release:check`

## Rollout Plan

Merge to `main` through the protected PR flow and deploy through the repo-owned ACA main workflow.
Run dry-run inventory through `npm run ops:aca-job` using the deployed digest-pinned image and
`SOURCE_CLEANUP_TENANT_KEYS`. Review the proof bundle before any apply run. Apply mode must use the
same operator job lane plus `SOURCE_CLEANUP_APPLY=true` and the script confirmation token. The
script's apply path is intentionally archive-only.

## Deployment Authority

- Repo-owned deploy workflow: Required before the operator script is available inside the deployed
  ACA image.
- Shared runtime mutators: None from merge alone.
- Approved image digest: Resolved by the ACA main deploy workflow.
- ACA runtime invariant: Required after deployment before using the deployed image for an operator
  job.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Not for the script itself. If used to clean a live portfolio, run
  a signed-in Source portfolio proof after the cleanup.

## Rollback Plan

Revert the PR and redeploy the prior ACA image to remove the operator command from future runs. If
an apply run has already archived Source events, restore the affected rows from the generated proof
backup or update their lifecycle state back to the prior value using a separately approved operator
repair run. No blob deletion is available through this script.

## Audit Evidence

- PR URL and CI checks after publishing.
- Operator dry-run proof bundle containing candidate events, linked artifacts, blob targets, related
  row backups, before/after lifecycle counts, and SHA-256 checksums.
- Apply proof bundle, if apply mode is ever used.
- Post-cleanup signed-in Source portfolio proof for the scoped tenant, if run against live data.

## Known Gaps

- This release does not execute cleanup. It only adds the governed operator command.
- Source does not yet have a self-service UI archive action for events.
