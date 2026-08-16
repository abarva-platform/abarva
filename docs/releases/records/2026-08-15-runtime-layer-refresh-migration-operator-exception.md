# 2026-08-15-runtime-layer-refresh-migration-operator-exception — Runtime refresh migration boundary exception record

## Release ID

`2026-08-15-runtime-layer-refresh-migration-operator-exception`

## Status

`candidate`

## Plain-English Summary

Records an operator exception during the runtime layer refresh migration lane. The approved path was
the forced runtime refresh migration only. A later operator attempt invoked the broad pending
migration command instead of the forced runtime refresh command. That broad attempt failed, but not
before two older pending migrations were observed as applied.

This record is documentation only. It does not run migrations, change tenant source files, write
canonical data, refresh product projections, or make live-client claims.

## Layer Impact

Release lane: `client-data-lane`.

Layer 1 intake: no source files or tenant intake packets are changed.

Layer 2 adapters: no adapter behavior is changed.

Layer 3 canonical graph: documents an operator migration boundary exception affecting database
schema, privileges, and tenant-scoped policies outside the originally approved forced migration
script.

Layer 4 products: no product projection, cube, retrieval index, or read model is refreshed by this
record.

## Client Applicability

- All clients: no intentional runtime feature change.
- Specific clients: none from this documentation-only record.
- Internal only: migration governance, release audit, and operator follow-up.
- Public/demo only: no product-surface change.
- Feature flag: none.

## Changes Included

- Adds this release record to make the operator exception durable in the repository audit trail.
- References the approved boundary in
  `docs/releases/records/2026-08-15-runtime-layer-refresh-narrow-migration.md`.

Observed broad-command execution:

- ACA execution: `job-abarva-private-operator-eus-jreltqm`
- Command args retained in the ACA execution list: `run db:migrate:ci`
- Execution status retained in the ACA execution list: `Failed`
- Execution start retained in the ACA execution list: `2026-08-15T20:54:38Z`

Migrations observed as applied before the broad command failed:

- `20260804173000_source_contract_category_review_semantic.sql`
  - Creates `governance.contract_category_review`.
  - Enables RLS on that table.
  - Creates `contract_category_review_tenant_access` using `governance.can_access_tenant(tenant_key)`.
  - Grants `SELECT, INSERT` to `authenticated` and `service_role`; revokes `UPDATE, DELETE` from
    `authenticated`.
- `20260806125500_foundation_v2_meridian_health_demo_layer3_repair_delete_grants.sql`
  - Grants delete capability to a restricted Layer 3 replay writer role.
  - Drops/recreates delete policies fenced by tenant key, namespace, source release, and release
    alias.
  - Touches tenant-scoped delete policy and privilege behavior.

Migration observed as attempted next but not completed in that broad run:

- `20260808193000_cio_tower_outcome_proof_mart_v2.sql`
  - Failed on missing projection relation `cio_tower.mart_command_center`.
  - This record does not assert that any part of that migration committed.

## QA / Validation

- Verified current branch is based on `origin/main` SHA
  `99222b7b391d5b5fa33c515881a9bd914192c9a6`.
- Verified the narrow migration record already states:
  `Broad pending migration apply: Not approved by this record.`
- Verified migration content locally:
  - `20260804173000_source_contract_category_review_semantic.sql` touches RLS and grants on a
    governance ledger.
  - `20260806125500_foundation_v2_meridian_health_demo_layer3_repair_delete_grants.sql` touches
    tenant-scoped delete policies and grants.
- Verified ACA execution-list evidence for `job-abarva-private-operator-eus-jreltqm` shows the
  broad command `run db:migrate:ci` and failed status.
- Verified current committed-state runtime refresh proof exists after the exception:
  - Read-only ACA execution: `job-abarva-private-operator-eus-0xqcd9s`
  - Image:
    `acrabarvalab001.azurecr.io/abarva/web@sha256:9ba6e2467071f4ff8c02a3ee5f395fab6390d1048ef85181cf9070d5e6d531a4`
  - Proof bundle: `/tmp/nexus-runtime-layer-refresh-readback-590d4fb7/proof.tgz`
  - Result: `status=pass`, `failures=0`, `approvedScopeOnly=true`
  - Table counts passed for `business_records=9786`, `relationship_edges=4355`,
    `graph_nodes=1723`, `graph_edges=4355`, and `graph_quality_reports=2`.
  - Authenticated RLS readback passed for the scoped tenants with `visibleOtherTenantRows=0` on
    every checked runtime refresh table.

## Rollout Plan

Merge this documentation-only record through the normal PR path. There is no runtime rollout and no
operator action attached to this record.

## Deployment Authority

- Repo-owned deploy workflow: not required for the documentation itself.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not applicable to this documentation-only change.
- Worker image invariant: not applicable to this documentation-only change.
- Feature/env flag update path: none.
- Live signed-in proof required: none.

## Rollback Plan

Revert this release record only if a follow-up audit record supersedes it with stronger evidence.
Do not use a docs revert as a database rollback signal. Any database rollback or compensation must
have a separate approved operator plan.

## Audit Evidence

- Narrow migration boundary:
  `docs/releases/records/2026-08-15-runtime-layer-refresh-narrow-migration.md`
- Broad execution retained in local ACA execution-list proof:
  `/tmp/nexus-runtime-refresh-force-rls-migrate-68d98500-forced/99d-execution-list.json`
- Current read-only committed-state proof:
  `/tmp/nexus-runtime-layer-refresh-readback-590d4fb7/proof/runtime-layer-refresh-readback-590d4fb7/summary.json`
- Current readback proof bundle:
  `/tmp/nexus-runtime-layer-refresh-readback-590d4fb7/proof.tgz`
- Narrow runtime refresh migration apply proof:
  `/tmp/nexus-runtime-refresh-migrate-apply-56d7e489-db/06-migration-seal.json`
- Force-RLS follow-up migration log:
  `/tmp/nexus-runtime-refresh-force-rls-migrate-68d98500-forced/04-logs.txt`

## Known Gaps

- The broad execution's per-replica log was not present in the retained local proof roots during this
  documentation slice; `az containerapp job logs show` for
  `job-abarva-private-operator-eus-jreltqm` returned `No replicas found for execution`.
- This record does not reconstruct the interim runtime window between the broad command and the
  subsequent readback proof. It only records the observed exception and the later positive
  committed-state proof.
- This record does not perform an independent live database query against the migration ledger. If
  required, run a separate read-only governed operator check and append the result in a follow-up
  record.
