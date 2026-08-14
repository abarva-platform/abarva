# 2026-08-14-semantic-alias-graph-registry-activation — Semantic Alias and Graph Registry Activation

## Release ID

`2026-08-14-semantic-alias-graph-registry-activation`

## Status

`candidate`

## Plain-English Summary

Layer 2 mapping profiles now encode the approved semantic identity aliases from the dry-run decision
packet. The graph reconciliation job also recognizes the approved relationship-type and endpoint
object aliases from the graph decision packet while remaining quarantine-first and report-only.

## Layer Impact

- Affected release lane: `client-data-lane`.
- Layer 1 Client Intake: read-only; no intake files are changed.
- Layer 2 Source Adapters: approved semantic aliases can satisfy required identity fields.
- Layer 3 Canonical Enterprise Model: relationship and endpoint aliases are available to validation
  reports only; no canonical store or graph tables are written.
- Layer 4 Products: no product projection, runtime routing, or read-model refresh is included.

## Client Applicability

- All clients: mapping and graph validation paths can use the approved aliases when matching source
  headers or relationship rows are present.
- Specific clients: none.
- Internal only: yes.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/enterprise-data/source-adapters/mapping-profiles.ts` adds approved semantic identity
  aliases and lineage aliases from the Layer 2 approval packet.
- `scripts/audit/tenant-layer-refresh.mjs` recognizes the approved `spend-value/v1`
  source-file domain alias during report-only dry-runs.
- `src/lib/enterprise-data/contracts/layer3-validation.ts` adds approved relationship dictionary
  entries for graph validation.
- `scripts/audit/tenant-graph-reconciliation.mjs` recognizes approved endpoint object aliases during
  quarantine-first graph reconciliation.
- Focused tests cover semantic alias parsing, relationship normalization, and endpoint alias
  normalization.

## QA / Validation

- Pass: `npx jest src/lib/enterprise-data/source-adapters/__tests__/mapping-profiles.test.ts --runInBand`
  - Result: 56 tests passed.
- Pass: `npx jest src/lib/enterprise-data/contracts/__tests__/layer3-validation.test.ts --runInBand`
  - Result: 4 tests passed.
- Pass: `node scripts/audit/__tests__/run-tenant-graph-reconciliation-tests.mjs`
- Pass: `node scripts/audit/__tests__/run-layer2-failure-classification-tests.mjs`
- Pass: `node scripts/audit/__tests__/run-layer2-semantic-decision-ledger-tests.mjs`
- Pass: `node scripts/audit/__tests__/run-layer2-code-only-alias-impact-tests.mjs`
- Pass: `node scripts/audit/tenant-layer-refresh.mjs --tenant all --out /tmp/nexus-semantic-alias-activation.Ys4Vyx/layer-reconciliation --no-package`
  - Result: 7 tenants, 56 layer rows, 109 claims, 56 gates.
  - Failure classification summary: 0 unique profile failures, 0 mirrored dimension failures.
  - Semantic decision ledger: 0 semantic-decision profiles and 0 activation-ready profiles remaining.
- Pass: `npm run audit:tenant-graph-reconciliation -- --tenant all --out /tmp/graph-reconciliation-activation.YDuowc`
  - Result: 7 tenants, 9,633 relationship rows, 4,454 relationship candidates, 5,179 quarantined.
  - Runtime guardrails: `graphTablesWritten=false`; `productReadModelsUpdated=false`.
- Pass: `npx eslint src/lib/enterprise-data/source-adapters/mapping-profiles.ts src/lib/enterprise-data/source-adapters/__tests__/mapping-profiles.test.ts src/lib/enterprise-data/contracts/layer3-validation.ts src/lib/enterprise-data/contracts/__tests__/layer3-validation.test.ts scripts/audit/tenant-layer-refresh.mjs scripts/audit/tenant-graph-reconciliation.mjs scripts/audit/__tests__/run-tenant-graph-reconciliation-tests.mjs`
- Pass: `git diff --check`
- Pass: `npm run release:check`
- Pass: `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false`

## Rollout Plan

Merge through a pull request after focused validation and CI pass. The repo-owned ACA deploy may run
after merge under the active session approval. No tenant CSV mutation, data-plane load/write, graph
table materialization, registry data-plane activation, product projection refresh, or live-client
truth claim is included.

## Deployment Authority

- Repo-owned deploy workflow: allowed by the session merge/deploy approval for merged code.
- Shared runtime mutators: none beyond the repo-owned deploy workflow.
- Approved image digest: produced by the repo-owned ACA main deploy if merged.
- ACA runtime invariant: required after repo-owned deploy if merged.
- Worker image invariant: required after repo-owned deploy if merged.
- Feature/env flag update path: none.
- Live signed-in proof required: no, because no product surface behavior changes.

## Rollback Plan

Revert the pull request to remove semantic alias activation and graph dictionary/object alias
activation from validation code.

## Audit Evidence

- Layer 2 semantic approval packet:
  `/tmp/nexus-layer2-post6296-main.BUoQyG/layer-reconciliation/layer2-semantic-approval-packet.compact.json`
- Graph decision packet:
  `/tmp/graph-reconciliation-main.MRnS8o/graph-decision-packet.compact.json`
- Post-change local report-only dry-run outputs after validation.
  - `/tmp/nexus-semantic-alias-activation.Ys4Vyx/layer-reconciliation`
  - `/tmp/graph-reconciliation-activation.YDuowc`

## Known Gaps

This release does not mutate tenant data, load/write Azure or Postgres data, materialize graph
tables, refresh product projections, promote Active Tenant Access, or create live-client truth
claims.
