# 2026-08-16-integrated-layer-refresh-runner — Integrated Layer Refresh Coverage

## Release ID

`2026-08-16-integrated-layer-refresh-runner`

## Status

`candidate`

## Plain-English Summary

Adds canonical coverage for every active tenant source file currently in scope, including source
files that were previously scanned but not canonicalized. The canonical build now emits a
source-integration coverage report and fails visibly when an active file with rows has no canonical
domain mapping or produces no canonical records. It also adds a report-only runner that executes the
tenant refresh evidence chain in one ordered command: Layer 1 input quality, Layer 2 adapter dry-run,
Layer 3 canonical and graph dry-run, Layer 4 Source cube dry-run, then the integrated inventory
report.

## Layer Impact

- Release lane: `internal-admin`.
- Layer 1: Runs the existing tenant input quality audit and records row/count evidence.
- Layer 2: Runs the existing adapter/workstream dry-run for the registry-scoped tenants.
- Layer 3: Adds canonical mappings for supplemental active source domains, emits
  `source-integration-coverage.json`, and runs the canonical and graph dry-run with one shared build
  version and idempotency key.
- Layer 4: Runs the existing Source cube projection dry-run and carries its projected row counts into
  the integrated run manifest.

## Client Applicability

- All clients: No runtime behavior change.
- Specific clients: None.
- Internal only: Operators and agents running governed tenant refresh evidence.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- Adds `scripts/data-build/run-integrated-layer-refresh.mjs`.
- Adds `npm run data-build:integrated-layer-refresh`.
- Updates `src/lib/enterprise-data/canonical-build/canonical-tenant-data-build.ts` so active source
  files with rows must be integrated or explicitly blocked.
- Adds canonical handling for supplemental active source domains used by the current integrated
  healthcare and airline tenant roots.

## QA / Validation

- PASS: `npm run data-build:integrated-layer-refresh -- --out-dir /tmp/nexus-integrated-layer-refresh-allfiles.Bnkxhn --include-tenant-names true`.
- PASS: canonical coverage in `/tmp/nexus-integrated-layer-refresh-allfiles.Bnkxhn/03-l3-runtime/canonical-build/source-integration-coverage.json` reports 50 files, 9,676 source rows integrated, and 0 blocked source rows.
- PASS: `npm run data-build:integrated-layer-refresh -- --out-dir /tmp/nexus-integrated-layer-refresh-write-refusal --write` exits non-zero with the expected direct-write refusal.
- PASS: `npx eslint src/lib/enterprise-data/canonical-build/canonical-tenant-data-build.ts scripts/data-build/run-integrated-layer-refresh.mjs`.
- PASS: `npx tsc --noEmit --pretty false`.
- Pending: `npm run release:check` after this release-record update.

## Rollout Plan

Merge to main. The repo-owned deploy workflow may rebuild the web image, but this change only updates
canonical build/report code and an operator script. No database migration, registry activation, data
load, graph materialization, product read-model refresh, or runtime routing change is performed by
this release.

## Deployment Authority

- Repo-owned deploy workflow: Allowed by standing session approval if the PR is merged.
- Shared runtime mutators: None.
- Approved image digest: Determined by repo-owned deploy workflow if triggered.
- ACA runtime invariant: Required only if the repo-owned deploy workflow runs.
- Worker image invariant: Required only if the repo-owned deploy workflow runs.
- Feature/env flag update path: None.
- Live signed-in proof required: No; operator-only script. Post-deploy crawl may still run by repo
  automation.

## Rollback Plan

Revert the PR. Since the runner is report-only by default and the canonical changes affect local
build/report output only until a governed data-build job writes them, rollback does not require
data-plane repair.

## Audit Evidence

- Local dry-run output under the operator-provided `--out-dir`.
- PR checks and release-control output.

## Known Gaps

This release does not perform canonical/data-plane writes, graph materialization, product read-model
updates, cube readbacks, retrieval indexing, or live-client claims. Source L4 dry-run projection is
covered by the integrated runner; Home, Tower, Moves, and Intelligence still need product projection
fanout/readback from the same Layer 3 build before any runtime refresh claim.
