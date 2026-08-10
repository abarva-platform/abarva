# 2026-08-09-source-event-archive-cleanup-operator — Source Event Cleanup Operator

## Release ID

`2026-08-09-source-event-archive-cleanup-operator`

## Status

`candidate`

## Plain-English Summary

Adds an operator-only cleanup script for Source event rehearsal data. The script inventories target Source events, exports event-owned rows and blob locations into a proof bundle, deletes recorded Source artifact blobs, removes event-owned Source rows, and leaves the Source event records archived rather than active.

## Layer Impact

Release lane: `internal-admin`.

Client Intake: no impact. The script does not read or mutate tenant intake files.

Source Adapters: no impact. The script does not change parser or adapter behavior.

Canonical Model: no impact intended. The script is explicitly scoped to Source event-owned tables and reports canonical tables touched as an empty list.

Products: Source only. Archived events are removed from active Source workflows, and event-owned evidence/artifact/fact rows can be cleaned up by an explicit operator run.

## Client Applicability

All clients: no automatic runtime behavior change.

Specific clients: none.

Internal only: yes, operator cleanup path only.

Public/demo only: no.

Feature flag: apply mode requires `SOURCE_EVENT_CLEANUP_APPLY=true` and a confirmation env value.

## Changes Included

- `scripts/source/archive-source-event-data.ts`
- `package.json` script `ops:source-events:archive-cleanup`

## QA / Validation

Pass:

- `npm run ops:source-events:archive-cleanup -- --help`
- `npx eslint scripts/source/archive-source-event-data.ts`
- `npx tsc --noEmit --pretty false --ignoreConfig --module commonjs --moduleResolution node --target es2022 --esModuleInterop --skipLibCheck --ignoreDeprecations 6.0 scripts/source/archive-source-event-data.ts`
- `npm run release:check`

Not run yet:

- Dry-run proof bundle with target row counts.
- Apply proof bundle with blob delete count, deleted row counts, and after-count readback.

## Rollout Plan

Merge to main, let the repo-owned Azure Container Apps deploy workflow build and deploy the digest-pinned image, then run the script through `npm run ops:aca-job` using the deployed image digest.

## Deployment Authority

Repo-owned deploy workflow: required before the script is available in the shared operator image.

Shared runtime mutators: no direct web traffic mutation by this release record.

Approved image digest: recorded by the ACA deploy workflow.

ACA runtime invariant: required before claiming the script is available in the live operator lane.

Worker image invariant: not applicable.

Feature/env flag update path: pass apply/scope/confirmation values only to the ACA operator job execution.

Live signed-in proof required: verify active Source event list after cleanup if the apply job runs.

## Rollback Plan

Revert the script and package entry to remove the operator path. If an apply cleanup was run, use the exported proof bundle to review archived event rows and event-owned row exports before any restore action.

## Audit Evidence

Expected evidence:

- PR URL and merge commit.
- ACA deploy workflow run and digest.
- ACA operator job request, logs, proof bundle, and idle-restore verification.
- Post-cleanup Source event list proof.

## Known Gaps

The script intentionally does not delete canonical contract, vendor, application, or tenant-wide projection tables.
