# 2026-08-16-layer-refresh-readiness-status — Layer refresh readiness and boundary proof

## Release ID

`2026-08-16-layer-refresh-readiness-status`

## Status

`candidate`

## Plain-English Summary

This change makes the layer refresh status reports follow the active tenant input registry and records the current read-only refresh boundary. It proves the source declaration and adapter dry run are ready for the scoped refresh tenants, and it preserves the hard distinction that canonical writes, graph materialization, Layer 4 projections, runtime reads, and live proof have not happened in this code/report slice.

## Layer Impact

**Release lane: `internal-admin`.** This is operator report/tooling and inactive proof artifact work. It does not load, activate, index, promote, publish, route, or refresh runtime product data.

- Layer 1: report-only audit now derives active input roots from `datasets/tenant-inputs/tenant-input-registry.json` instead of a stale hard-coded tenant list.
- Layer 2: report-only dry-run evidence remains adapter/mapping only; no adapter output is promoted.
- Layer 3: current dry-run artifacts show planned canonical and graph rows for the scoped refresh tenants, with graph tables unwritten.
- Layer 4: boundary reports explicitly show product read models and Home runtime reads are not refreshed by this change.

## Client Applicability

- All clients: no runtime behavior change.
- Specific clients: scoped demo refresh status for the current two-tenant refresh lane.
- Internal only: operator readiness, audit reports, and refresh proof artifacts.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `src/lib/admin/tenant-manifest-projection-audit.ts`: derives active tenant audit targets from the tenant input registry and treats each canonical input root as the active declared source baseline.
- `scripts/audit/build-layer-refresh-status-report.mjs`: labels current-worktree evidence paths honestly instead of claiming a detached-main command.
- `reports/data-quality/manifest-projection/latest/*`: regenerated registry-driven source projection audit artifacts.
- `reports/runtime-layer-refresh/latest/*`: regenerated read-only runtime layer refresh dry-run artifacts.
- `reports/home-layer4-boundary/current-main/*`: refreshed Home Layer 4 boundary artifact.
- `reports/layer-refresh-status/current-main/*` and `reports/tenant-layer-refresh-current/*`: scoped report-only layer status evidence.

## QA / Validation

- Pass: `npm run audit:tenant-manifest-completeness`
- Pass: `npm run data-build:runtime-layer-refresh -- --out-dir reports/runtime-layer-refresh/latest --build-version runtime-layer-refresh-2026-08-16 --input-source-version c4d5afd301ab24ec23ed86510f06469255b1b807 --idempotency-key runtime-layer-refresh:c4d5afd301ab24ec23ed86510f06469255b1b807:dry-run`
- Pass: `node scripts/audit/tenant-layer-refresh.mjs --tenant meridian-health --tenant skyharbor-air --out reports/tenant-layer-refresh-current --no-package`
- Pass: `node scripts/audit/build-layer-refresh-status-report.mjs --layer-dir reports/tenant-layer-refresh-current --graph-dir reports/runtime-layer-refresh/latest/graph-reconciliation --quality-dir /tmp/nexus-tenant-input-quality-20260816 --out-dir reports/layer-refresh-status/current-main --source-sha c4d5afd301ab24ec23ed86510f06469255b1b807`
- Pass: `npm run audit:home-ava-build-readiness`
- Pass: `npm run build:candidate-version`
- Pass: `npm run audit:home-layer4-boundary -- --out-dir reports/home-layer4-boundary/current-main --source-sha c4d5afd301ab24ec23ed86510f06469255b1b807`
- Pass: `npm run audit:tenant-input-quality -- --out-dir /tmp/nexus-tenant-input-quality-20260816`

## Rollout Plan

Merge through PR. The repo-owned deploy may rebuild the web image, but this change is report/tooling only and does not change runtime routes, data-plane state, graph tables, projection tables, or tenant access.

## Deployment Authority

- Repo-owned deploy workflow: allowed if triggered by merge.
- Shared runtime mutators: none.
- Approved image digest: not applicable to this report-only slice.
- ACA runtime invariant: no runtime behavior change is claimed.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: not for this report-only slice; required before any later claim that Home or Source is refreshed.

## Rollback Plan

Revert the PR to restore the prior report generators and report artifacts. No database, tenant input, registry, graph, projection, runtime route, feature flag, or deployment state is mutated by this change.

## Audit Evidence

- `reports/data-quality/manifest-projection/latest/promotion-blockers.json`
- `reports/runtime-layer-refresh/latest/summary.json`
- `reports/home-layer4-boundary/current-main/home-layer4-boundary-report.json`
- `reports/layer-refresh-status/current-main/layer-refresh-status-v2.json`
- `reports/tenant-layer-refresh-current/summary.json`

## Known Gaps

- This is not a full layer refresh. Canonical writes, graph materialization, Layer 4 Home/Source projection refresh, retrieval indexing, runtime route/read-model adoption, and signed-in live proof remain separate gated steps.
- Some active tenants may be retired by a separate lane. This report follows the active registry as it exists at generation time.
