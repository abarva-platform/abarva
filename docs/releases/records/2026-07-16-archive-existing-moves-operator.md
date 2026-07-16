# 2026-07-16-archive-existing-moves-operator — Existing Moves Archive Operator

## Release ID

`2026-07-16-archive-existing-moves-operator`

## Status

`candidate`

## Plain-English Summary

Adds a controlled operator job for resetting the Strategic Moves estate. The job inventories all active Move records, writes a proof bundle with the linked uploads, deliverables, evidence, approvals, workspace state, and blob paths, then can archive the top-level Move records and remove linked runtime Move content from active tables. It does not delete immutable audit history and it does not delete blob objects directly.

Follow-up hardening after the first ACA dry-run: snapshot queries now tolerate legacy Move-linked tables that do not expose the expected timestamp ordering column. When that happens, the proof bundle records a `snapshot-query-warnings.json` note and continues the snapshot without `ORDER BY` instead of failing before proof generation.

## Layer Impact

- `internal-admin`: adds an operator-only script and npm command for the Moves reset operation.
- `client-data-lane`: the script can mutate tenant Move data only when run explicitly with `--execute` through the approved operator-job lane.
- `global-control-lane`: no product runtime behavior changes are introduced by this PR.

## Client Applicability

- All clients: the operator can target all active tenants by default.
- Specific clients: the operator supports repeated `--tenant <key-or-name>` filters for scoped cleanup.
- Internal only: yes, this is an AbarVa operator job.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `scripts/ops/archive-existing-moves.ts`
- `package.json` command: `ops:archive-existing-moves`
- This release record.
- Snapshot proof hardening for linked legacy tables without timestamp ordering columns.

## QA / Validation

- `npm run ops:archive-existing-moves -- --self-test --out-dir /tmp/moves-archive-self-test`: Pass.
- `ARCHIVE_EXISTING_MOVES_ARGS="--purge-linked-records --operator env-self-test" npm run ops:archive-existing-moves -- --self-test --out-dir /tmp/moves-archive-env-self-test`: Pass.
- `npx eslint scripts/ops/archive-existing-moves.ts`: Pass.
- `npm run release:check`: Pass.
- `git diff --check`: Pass.

## Rollout Plan

Merge to `main`, let the repo-owned ACA main deploy workflow build the digest-pinned image, then submit the operator job through `npm run ops:aca-job` using the approved image digest and `--script ops:archive-existing-moves`. Run dry-run first. Only run mutation with an explicit environment override such as `--env ARCHIVE_EXISTING_MOVES_ARGS="--execute --purge-linked-records"` after reviewing the dry-run proof bundle.

## Deployment Authority

- Repo-owned deploy workflow: required before shared runtime/operator image use.
- Shared runtime mutators: do not mutate ACA web traffic from this PR.
- Approved image digest: required for the ACA operator job.
- ACA runtime invariant: required after any main deploy, if deployed.
- Worker image invariant: operator job must use the approved digest-pinned image.
- Feature/env flag update path: none.
- Live signed-in proof required: after execution, verify the Moves portfolio no longer shows old active Moves for affected tenants.

## Rollback Plan

Because the operation archives top-level `engagements` rows rather than hard-deleting them, rollback can restore those rows by clearing archive fields or using the existing restore path. Linked runtime rows removed with `--purge-linked-records` must be restored from the proof bundle snapshots. Blob deletion is intentionally out of scope; blob references are captured for a separate retention workflow.

## Audit Evidence

- Operator proof bundle under `reports/moves-archive/<run-id>/`.
- `moves-in-scope.json`.
- `linked-record-counts.json`.
- `storage-paths.json`.
- `mutation-result.json`, when `--execute` is used.
- `verification.json`, when `--execute` is used.
- ACA operator-job logs and extracted proof bundle.
- `snapshot-query-warnings.json`, when a table snapshot had to run without an ordering column.

## Known Gaps

- This PR adds the operator job but does not execute the production cleanup by itself.
- Physical Azure Blob deletion is out of scope and should be handled by a separate storage-retention job after proof review.
- The first ACA dry-run exposed a legacy table without `created_at`; this record includes the follow-up snapshot-order hardening needed before rerunning the operator.
