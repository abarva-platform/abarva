# 2026-08-14-layer-refresh-status-current-main-v2-refresh — Layer Refresh Status Current-Main V2 Refresh

## Release ID

`2026-08-14-layer-refresh-status-current-main-v2-refresh`

## Status

`candidate`

## Plain-English Summary

Refreshes the checked-in Layer 1 through Layer 4 status report against current `origin/main` and adds the missing npm script for the report builder. The status remains report-only: it answers that all data layers are not yet refreshing from new source files, because Layer 3 canonical writes, graph materialization, Layer 4 projection refresh, data-plane loads, and live proof remain closed.

## Layer Impact

- Affected release lane: `global-control-lane`.
- Layer 1 Client Intake: read-only source inspection; no intake files or template contract are changed.
- Layer 2 Source Adapters: dry-run status only; no adapter output is persisted.
- Layer 3 Canonical Enterprise Model: scaffold and graph quarantine status only; no canonical object, fact, relationship, registry, or graph table write is performed.
- Layer 4 Products: status only; no projection refresh or runtime routing change.

## Client Applicability

- All clients: anonymized report-only status.
- Specific clients: none named in public release material.
- Internal only: operators and agents using current-main layer refresh evidence.
- Public/demo only: no direct change.
- Feature flag: none.

## Changes Included

- Adds `audit:layer-refresh-status` to `package.json`.
- Updates `scripts/audit/build-layer-refresh-status-report.mjs` so generated evidence commands use the actual quality output directory instead of a stale temporary path.
- Refreshes `reports/layer-refresh-status/current-main-v2/layer-refresh-status-v2.json`.
- Refreshes `reports/layer-refresh-status/current-main-v2/layer-refresh-status-v2.md`.
- Records `sourceSha` as `dbe4c86a91eac5ac05b218c6ba15ef396ff6fe80`.

## QA / Validation

- Pass: `npm run audit:tenant-input-quality -- --out-dir /tmp/nexus-v2-layer-refresh-current-dbe4c86/tenant-input-quality`.
- Pass: `npm run validate:context-corpus`.
- Pass: `node scripts/tower/fact-lineage-report.mjs`.
- Pass: `node scripts/audit/tenant-layer-refresh.mjs --tenant all --out /tmp/nexus-v2-layer-refresh-current-dbe4c86/layer-reconciliation --no-package`.
- Pass: `npm run audit:tenant-graph-reconciliation -- --tenant all --out /tmp/nexus-v2-layer-refresh-current-dbe4c86/graph-reconciliation`.
- Pass: `npm run audit:layer-refresh-status -- --layer-dir /tmp/nexus-v2-layer-refresh-current-dbe4c86/layer-reconciliation --graph-dir /tmp/nexus-v2-layer-refresh-current-dbe4c86/graph-reconciliation --quality-dir /tmp/nexus-v2-layer-refresh-current-dbe4c86/tenant-input-quality --out-dir reports/layer-refresh-status/current-main-v2 --source-sha dbe4c86a91eac5ac05b218c6ba15ef396ff6fe80`.
- Pass: `node --check scripts/audit/build-layer-refresh-status-report.mjs`.
- Pass: `npx eslint scripts/audit/build-layer-refresh-status-report.mjs`.
- Pass: `git diff --check`.
- Pass: disclosure scan over changed report and release files.
- Pass: `npm run release:check`.

## Rollout Plan

Merge through a pull request. The repo-owned ACA main deploy workflow may deploy the report, but the change is inert and does not change runtime behavior.

## Deployment Authority

- Repo-owned deploy workflow: approved for this session.
- Shared runtime mutators: none beyond the repo-owned main deploy.
- Approved image digest: captured by ACA main deploy if this report is merged.
- ACA runtime invariant: required if the repo-owned deploy runs.
- Worker image invariant: required if the repo-owned deploy runs.
- Feature/env flag update path: none.
- Live signed-in proof required: no, because this is report-only.

## Rollback Plan

Revert this report refresh, npm script addition, and release record. No data rollback is needed because no tenant data, registry, index, data-plane state, graph table, projection, or runtime route changes are made.

## Audit Evidence

- `reports/layer-refresh-status/current-main-v2/layer-refresh-status-v2.json`
- `reports/layer-refresh-status/current-main-v2/layer-refresh-status-v2.md`
- Evidence bundle: `/tmp/nexus-v2-layer-refresh-current-dbe4c86`
- PR URL: pending.

## Known Gaps

Layer 2 dry-run is clean at `133/133` rows, but this is not a full layer refresh. Layer 3 canonical writes remain `0`, graph materialization remains blocked with `5,179` quarantined relationships, Layer 4 projection refresh remains `0/35`, semantic alias activation remains closed, graph dictionary/object-registry activation remains closed, and live-client truth claims remain closed.
