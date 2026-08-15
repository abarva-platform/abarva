# 2026-08-15-graph-semantic-alias-activation - Approved Graph Semantic Alias Ledger

## Release ID

`2026-08-15-graph-semantic-alias-activation`

## Status

`candidate`

## Plain-English Summary

Graph reconciliation now applies exactly three approved semantic identity aliases for the anonymized
`tenant-07` organization-ownership dimension. The aliases resolve reviewed acronym endpoints to
existing canonical node IDs during report-only graph reconciliation. The change also adds a
source-data-gated decision matrix for the remaining unresolved endpoints.

## Layer Impact

- Layer 1 Client Intake: no intake files changed.
- Layer 2 Source Adapters: no adapter output changed.
- Layer 3 Canonical Enterprise Model: no canonical objects, facts, relationships, graph tables, or
  data-plane state written.
- Layer 4 Products: no projection, read model, routing, or runtime behavior changed.

## Client Applicability

- All clients: the report-only source-data-gated decision matrix can run across active tenant
  packets.
- Specific clients: the approved semantic aliases apply only to anonymized `tenant-07`.
- Internal only: graph reconciliation audit tooling and operator review artifacts.
- Public/demo only: not applicable.
- Feature flag: none.

## Changes Included

- Added `datasets/reference/graph-semantic-identity-aliases/approved-aliases.json` with only:
  `CFO -> Chief Financial Officer`, `CHRO -> Chief Human Resources Officer`, and
  `CISO -> Chief Information Security Officer` for `tenant-07`.
- `scripts/audit/tenant-graph-reconciliation.mjs` applies approved semantic aliases as lookup
  aliases against existing node IDs and fails closed on canonical row/profile mismatch.
- Added durable sanitized activation proof under
  `reports/graph-semantic-alias-activation/current-main/`.
- Updated post-activation alias analysis under
  `reports/graph-quarantine-alias-analysis/current-main/`.
- Added a sanitized source-data-gated decision matrix under
  `reports/graph-source-data-gated-decision-matrix/current-main/`.

## QA / Validation

- Pass: `node --check scripts/audit/tenant-graph-reconciliation.mjs`
- Pass: `node --check scripts/audit/build-graph-quarantine-alias-analysis.mjs`
- Pass: `node --check scripts/audit/build-graph-semantic-alias-activation-report.mjs`
- Pass: `node --check scripts/audit/build-graph-source-data-gated-decision-matrix.mjs`
- Pass: `node scripts/audit/__tests__/run-tenant-graph-reconciliation-tests.mjs`
- Pass: `node scripts/audit/__tests__/run-graph-source-data-gated-decision-matrix-tests.mjs`
- Pass: `npm run audit:tenant-graph-reconciliation -- --tenant all --out /tmp/nexus-graph-reconcile-before-approved-alias.nVsE6L`
- Pass: `npm run audit:tenant-graph-reconciliation -- --tenant all --out /tmp/nexus-graph-reconcile-after-approved-alias.YWjncq`
- Pass: `npm run audit:graph-semantic-alias-activation -- --before-dir /tmp/nexus-graph-reconcile-before-approved-alias.nVsE6L --after-dir /tmp/nexus-graph-reconcile-after-approved-alias.YWjncq --out-dir reports/graph-semantic-alias-activation/current-main --source-sha ee14b409a9a93ca1286d8b7b38e6823ab35db6a7 --ledger datasets/reference/graph-semantic-identity-aliases/approved-aliases.json`
- Pass: `npm run audit:graph-quarantine-alias-analysis -- --graph-dir /tmp/nexus-graph-reconcile-after-approved-alias.YWjncq --out-dir reports/graph-quarantine-alias-analysis/current-main --source-sha ee14b409a9a93ca1286d8b7b38e6823ab35db6a7`
- Pass: `npm run audit:graph-source-data-gated-matrix -- --graph-dir /tmp/nexus-graph-reconcile-after-approved-alias.YWjncq --out-dir reports/graph-source-data-gated-decision-matrix/current-main --source-sha ee14b409a9a93ca1286d8b7b38e6823ab35db6a7`

## Evidence

- Before graph reconciliation: `5179` quarantined relationships, `4454` candidate relationships.
- After approved aliases: `5129` quarantined relationships, `4504` candidate relationships.
- Quarantine delta: `-50`, matching the approved alias occurrence count.
- Remaining source-data-gated endpoints: `6103`, grouped into `1632` report-only decision rows.
- `graphTablesWritten`: `false`.
- `productReadModelsUpdated`: `false`.

## Rollout Plan

Merge through a pull request. The repo-owned deploy can publish the updated audit tooling and
sanitized reports, but no runtime route, tenant data, registry, graph table, canonical store, or
product projection is changed by this release.

## Deployment Authority

- Repo-owned PR merge and deploy are allowed under the session approval.
- No Azure/Postgres data writes, tenant data mutation, graph materialization, registry activation,
  product projection refresh, or live-client truth claim is included.

## Audit Evidence

- Focused graph reconciliation and source-data decision-matrix test output.
- Before/after graph reconciliation output directories in `/tmp`.
- Durable sanitized activation proof in `reports/graph-semantic-alias-activation/current-main/`.
- Durable sanitized post-activation alias analysis in
  `reports/graph-quarantine-alias-analysis/current-main/`.
- Durable sanitized source-data-gated decision matrix in
  `reports/graph-source-data-gated-decision-matrix/current-main/`.
- `npm run release:check` output.

## Rollback Plan

Revert the pull request. Removing the ledger entries disables these lookup aliases because the
aliases are not written into tenant inputs, canonical stores, graph tables, or product projections.

## Known Gaps

The remaining `6103` source-data-gated unresolved endpoint occurrences require source-owner
decisions to catalogue objects from real evidence or retire/correct relationship edges.
