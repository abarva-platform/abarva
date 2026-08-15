# 2026-08-15-graph-source-value-repair - Graph Endpoint Cataloguing Guardrail

## Release ID

`2026-08-15-graph-source-value-repair`

## Status

`candidate`

## Plain-English Summary

Adds source-backed identity values to scoped active synthetic tenant input CSVs so graph relationship
endpoints resolve to Layer 1 source objects instead of being treated as orphan edges. Generated-ID
values in human identity columns are blocked so source repair cannot create placeholder nodes merely
to satisfy graph endpoints. Repair-stamped identities that already exist as another dimension's
identity are blocked so endpoint type errors stay quarantined instead of being laundered into the
wrong source file. No relationship rows are retired or deleted.

## Layer Impact

- Layer 1 Client Intake: scoped active synthetic CSV packets gain explicit identity values for graph
  endpoints already present in relationship evidence.
- Layer 2 Source Adapters: no adapter code changes.
- Layer 3 Canonical Enterprise Model: no canonical objects, facts, relationships, graph tables, or
  data-plane state written.
- Layer 4 Products: no projection, read model, routing, or runtime behavior changed.

## Client Applicability

- All clients: not applicable.
- Specific clients: scoped active synthetic/demo packets only.
- Internal only: graph reconciliation and source-data repair evidence.
- Public/demo only: planning-grade synthetic data, not client-certified fact.
- Feature flag: none.

## Changes Included

- Adds or fills graph endpoint identity values across scoped active synthetic source CSVs where the
  value is a source-backed business label.
- Blocks generated IDs in human identity/name columns so placeholder endpoint-repair rows fail the
  tenant input quality gate.
- Blocks endpoint source-value repairs that catalogue an identity under one dimension when the same
  identity already exists under another dimension, forcing source-backed edge-type correction or
  continued quarantine instead.
- Preserves relationship rows; no edge is retired, removed, or materialized.
- Refreshes the sanitized graph quarantine reduction report under
  `reports/graph-quarantine-reduction/current-main/`.

## QA / Validation

- Pass: `node scripts/audit/__tests__/run-tenant-graph-reconciliation-tests.mjs`
- Pass: `node scripts/audit/__tests__/run-graph-quarantine-reduction-plan-tests.mjs`
- Pass: `node scripts/audit/__tests__/run-graph-source-data-gated-decision-matrix-tests.mjs`
- Pass: `npm run audit:tenant-input-quality -- --out-dir /tmp/nexus-tenant-input-quality-type-collision-guard`
- Pass: `npm run audit:tenant-graph-reconciliation -- --tenant all --out /tmp/nexus-graph-reconcile-type-collision-guard-20260815T150246Z`
- Pass: `npm run audit:graph-quarantine-reduction -- --graph-dir /tmp/nexus-graph-reconcile-type-collision-guard-20260815T150246Z --out-dir reports/graph-quarantine-reduction/current-main --source-sha c6fde1b7380db40f0527d326142dd1fd2d1368a5`
- Pass: `npm run audit:graph-source-data-gated-matrix -- --graph-dir /tmp/nexus-graph-reconcile-type-collision-guard-20260815T150246Z --out-dir reports/graph-source-data-gated-decision-matrix/current-main --source-sha c6fde1b7380db40f0527d326142dd1fd2d1368a5`
- Pass: `npm run audit:graph-quarantine-alias-analysis -- --graph-dir /tmp/nexus-graph-reconcile-type-collision-guard-20260815T150246Z --out-dir reports/graph-quarantine-alias-analysis/current-main --source-sha c6fde1b7380db40f0527d326142dd1fd2d1368a5`
- Pass: `npm run release:check`
- Pass: `git diff --check`

## Evidence

- Current source SHA for regenerated reports:
  `c6fde1b7380db40f0527d326142dd1fd2d1368a5` plus this release-recorded amend.
- After scoped source-backed cataloguing, generated-ID placeholder rejection, and endpoint type-error
  repair quarantine: `3823` quarantined relationships and `5810` candidate relationships.
- Source-data-gated matrix after repair: `3684` endpoint occurrences and `656` decision rows.
- Graph alias analysis after repair: `3684` unresolved endpoints and `0` code-only alias
  candidates.
- `graphTablesWritten`: `false`.
- `productReadModelsUpdated`: `false`.

## Rollout Plan

Merge through a pull request after local validation. Repo-owned deployment may publish the updated
repository artifacts, but this release does not load data, activate registries, materialize graph
tables, refresh projections, or make runtime truth claims.

## Deployment Authority

- Repo-owned PR merge and deploy require the current session approval in effect at merge time.
- No Azure/Postgres data writes, graph materialization, registry activation, product projection
  refresh, tenant deletion/move, or live-client truth claim is included.

## Audit Evidence

- Focused graph reconciliation output in
  `/tmp/nexus-graph-reconcile-type-collision-guard-20260815T150246Z`.
- Durable sanitized graph quarantine reduction report in
  `reports/graph-quarantine-reduction/current-main/`.
- `npm run release:check` output.

## Rollback Plan

Revert the pull request. Reverting removes the added planning-grade source values and the stricter
placeholder-identity gate, restoring the previous graph reconciliation quarantine behavior. No
data-plane or graph-table rollback is needed because none is written.

## Known Gaps

The remaining `3823` quarantined rows are intentionally not retired or materialized. `3684` endpoint
occurrences remain source-data gated after generated-ID placeholder rows were rejected and the
`Cybersecurity & IT Risk` workforce-role repair was removed because it is already a business
function. `519` rows still have blank graph endpoint values in the source relationship packet.
Resolving either class requires source-backed values, endpoint type correction, or an explicit
disposition gate, not inferred node creation.
