# Tower Forbidden Identifiers Conflict Key

## Release ID
2026-06-26-tower-forbidden-identifiers-conflict-key

## Status
Ready for PR. Local focused validation passed; live migration/materialization proof pending after merge/deploy.

## Plain-English Summary
Adds the exact unique database key the Tower materializer needs to safely upsert forbidden identifier rows. This unblocks the live Tower read-model materialization that failed after the JSONB serialization repair.

## Layer Impact
client-data-lane: additive Azure/Postgres schema migration for Tower materialized read-model persistence.

global-control-lane: no runtime behavior change beyond letting the existing materializer complete.

## Client Applicability
Clients affected: Lakeshore Holdings and SkyHarbor Air for this demo-readiness pass. Shared infrastructure applicability: all clients that later use the same Tower materialized read-model writer.

## Changes Included
- Adds unique index `idx_tower_forbidden_identifiers_conflict_key` on `tower_forbidden_identifiers(tenant_key, identifier)`.
- Keeps the existing case-insensitive expression index for lookup.
- Adds a regression assertion that the writer uses `tenant_key,identifier` as the conflict target.

## QA / Validation
PASS: `npx jest src/lib/tower/__tests__/tower-materialization.test.ts --runInBand`.

PASS: `npx eslint src/lib/tower/__tests__/tower-materialization.test.ts`.

PENDING: `npm run release:check` after template correction.

PENDING: live migration job and VNet materialization rerun after merge.

## Rollout Plan
Merge through PR after CI. Apply the additive migration through the controlled database migration path. Deploy the exact main image to ACA. Rerun the private VNet Tower materialization for Lakeshore Holdings and SkyHarbor Air. Verify materialized row counts by tenant.

## Deployment Authority
Repo-owned main deployment path only. Build from the exact merged main SHA with ACR and deploy the digest-pinned image to Azure Container Apps. No local or non-main image should receive shared runtime traffic.

## Rollback Plan
No destructive data change. If runtime rollback is needed, shift ACA traffic back to the prior approved main revision. The unique index can remain in place because it is additive and compatible with the writer.

## Audit Evidence
- PR: TBD
- CI: pending
- Migration job: pending
- Materialization proof: pending
- ACA revision/digest: pending

## Known Gaps
This does not change Tower dashboard semantics or source data values. It only fixes the schema conflict target needed for the materializer to write rows.
