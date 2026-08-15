# 2026-08-14-contract-v2-current-layer-status — Contract V2 Current Layer Status

## Release ID

`2026-08-14-contract-v2-current-layer-status`

## Status

`candidate`

## Plain-English Summary

Refreshes the checked-in current-main layer status and graph disposition reports from a detached `origin/main` worktree at `25f1366bf68d8a053e7b6ae78dff4051cb34b82a`. The report confirms that Layer 2 dry-run is not the blocker, and that graph quarantine, Layer 3 canonical writes, Layer 4 projection refresh, and aVa readiness proof remain closed.

## Layer Impact

- Affected release lane: `global-control-lane`.
- Layer 1 Client Intake: read-only source inspection only; no intake files or template contract are changed.
- Layer 2 Source Adapters: dry-run status only; no adapter output is persisted.
- Layer 3 Canonical Enterprise Model: scaffold and graph disposition status only; no canonical object, fact, relationship, registry, or graph table write is performed.
- Layer 4 Products: status only; no projection refresh or runtime routing change.

## Client Applicability

- All clients: anonymized report-only status.
- Specific clients: none named in public release material.
- Internal only: operators and agents using current-main layer refresh evidence.
- Public/demo only: no direct change.
- Feature flag: none.

## Changes Included

- Refreshes `reports/layer-refresh-status/current-main-v2/layer-refresh-status-v2.json`.
- Refreshes `reports/layer-refresh-status/current-main-v2/layer-refresh-status-v2.md`.
- Refreshes `reports/graph-disposition-status/current-main/graph-disposition-status.json`.
- Refreshes `reports/graph-disposition-status/current-main/graph-disposition-status.md`.
- Keeps the Layer status Markdown generator from emitting a trailing blank line that fails `git diff --check`.
- Records `sourceSha` as `25f1366bf68d8a053e7b6ae78dff4051cb34b82a`.

## QA / Validation

- Pass: `npm run release:check` in detached `origin/main` worktree.
- Pass: `npm run audit:tenant-input-quality -- --out-dir /tmp/nexus-contract-v2-tenant-quality-25f1366.GYcAOw`.
- Pass: `npm run validate:context-corpus`.
- Pass: `node scripts/tower/fact-lineage-report.mjs`.
- Pass: `node scripts/audit/tenant-layer-refresh.mjs --tenant all --out /tmp/nexus-contract-v2-layer-refresh-25f1366.mTZLcA --no-package`.
- Pass: `npm run audit:tenant-graph-reconciliation -- --tenant all --out /tmp/nexus-contract-v2-graph-reconciliation-25f1366.cBbgod`.
- Pass: `npm run audit:layer-refresh-status -- --layer-dir /tmp/nexus-contract-v2-layer-refresh-25f1366.mTZLcA --graph-dir /tmp/nexus-contract-v2-graph-reconciliation-25f1366.cBbgod --quality-dir /tmp/nexus-contract-v2-tenant-quality-25f1366.GYcAOw --out-dir reports/layer-refresh-status/current-main-v2 --source-sha 25f1366bf68d8a053e7b6ae78dff4051cb34b82a`.
- Pass: `npm run audit:graph-disposition-status -- --graph-dir /tmp/nexus-contract-v2-graph-reconciliation-25f1366.cBbgod --out-dir reports/graph-disposition-status/current-main --source-sha 25f1366bf68d8a053e7b6ae78dff4051cb34b82a`.
- Pass: `node --check scripts/audit/build-layer-refresh-status-report.mjs && node --check scripts/audit/build-graph-disposition-status-report.mjs`.
- Pass: `npx eslint scripts/audit/build-layer-refresh-status-report.mjs scripts/audit/build-graph-disposition-status-report.mjs`.
- Pass: `git diff --check`.
- Pass: disclosure scan over changed report and release files.

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

Revert this report refresh and release record. No data rollback is needed because no tenant data, registry, index, data-plane state, graph table, projection, or runtime route changes are made.

## Audit Evidence

- `reports/layer-refresh-status/current-main-v2/layer-refresh-status-v2.json`
- `reports/layer-refresh-status/current-main-v2/layer-refresh-status-v2.md`
- `reports/graph-disposition-status/current-main/graph-disposition-status.json`
- `reports/graph-disposition-status/current-main/graph-disposition-status.md`
- Evidence worktree: `/tmp/nexus-verify-origin-main-25f1366.SvuQiv`
- Layer refresh evidence: `/tmp/nexus-contract-v2-layer-refresh-25f1366.mTZLcA`
- Graph reconciliation evidence: `/tmp/nexus-contract-v2-graph-reconciliation-25f1366.cBbgod`
- Tenant quality evidence: `/tmp/nexus-contract-v2-tenant-quality-25f1366.GYcAOw`
- PR URL: pending.

## Known Gaps

Layer 2 dry-run is clean at `133/133` rows, but all layers are not yet refreshing from new source files. Layer 3 canonical writes remain `0`, graph materialization remains blocked with `5,179` quarantined relationships, Layer 4 projection refresh remains `0/35`, semantic alias activation remains closed, graph dictionary/object-registry activation remains closed, and live-client truth claims remain closed.
