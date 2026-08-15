# 2026-08-14-home-layer4-boundary-report — Home Layer 4 Boundary Report

## Release ID

`2026-08-14-home-layer4-boundary-report`

## Status

`candidate`

## Plain-English Summary

Adds a sanitized report-only audit for the Home Layer 4 boundary. The audit scans Home runtime and read-model code for direct reads from intake packets, pre-projection repository artifacts, and static product fixtures so the next implementation slice can rewire Home from an evidence-bound projection instead of guessing from stale status notes.

## Layer Impact

`global-control-lane`

Layer 4 — Home projection boundary reporting only. This release does not change Home runtime behavior, product routing, canonical data, graph materialization, or projection refresh.

## Client Applicability

- All clients: No runtime behavior change.
- Specific clients: None named in public release material.
- Internal only: Operators and agents using the committed boundary report.
- Public/demo only: No direct change.
- Feature flag: None.

## Changes Included

- Adds `scripts/audit/build-home-layer4-boundary-report.mjs`.
- Adds `scripts/audit/__tests__/run-home-layer4-boundary-report-tests.mjs`.
- Adds `npm run audit:home-layer4-boundary`.
- Publishes `reports/home-layer4-boundary/current-main/`.

## QA / Validation

- Pass: `node --check scripts/audit/build-home-layer4-boundary-report.mjs`.
- Pass: `node --check scripts/audit/__tests__/run-home-layer4-boundary-report-tests.mjs`.
- Pass: `node scripts/audit/__tests__/run-home-layer4-boundary-report-tests.mjs`.
- Pass: `npm run audit:home-layer4-boundary -- --out-dir reports/home-layer4-boundary/current-main --source-sha 5f58bb3f0a7329d47f5bdcf54079f7400342c375`.
- Pass: `npx eslint scripts/audit/build-home-layer4-boundary-report.mjs scripts/audit/__tests__/run-home-layer4-boundary-report-tests.mjs`.
- Pass: disclosure scan over the report, script, test, and release record for tenant-name/path leakage.
- Pass: `npm run audit:tenant-input-quality -- --out-dir /tmp/nexus-home-l4-tenant-quality` audited 7 active tenants.
- Pass: `npm run validate:context-corpus` passed exceptions, tenant coverage, agent readiness, duplicates, and manifests.
- Pass: `git diff --check`.
- Pass: `npm run release:check`.

## Rollout Plan

Merge to `main`. The repo-owned ACA main deploy workflow may deploy the script/report, but the change is inert and does not alter Home runtime reads or product routing.

## Deployment Authority

- Repo-owned deploy workflow: Approved for this session.
- Shared runtime mutators: None beyond the repo-owned main deploy.
- Approved image digest: Captured by ACA main deploy if this report is merged.
- ACA runtime invariant: Required only if the repo-owned deploy runs.
- Worker image invariant: Required only if the repo-owned deploy runs.
- Feature/env flag update path: None.
- Live signed-in proof required: No; report-only, no runtime behavior change.

## Rollback Plan

Revert the report script, report artifacts, package script, and this release record. No data rollback is needed because no tenant data, registry, data-plane state, projection, or runtime route changes are made.

## Audit Evidence

- `reports/home-layer4-boundary/current-main/home-layer4-boundary-report.json`
- `reports/home-layer4-boundary/current-main/home-layer4-boundary-report.md`
- PR URL: pending.

## Known Gaps

This does not rewire Home to a Layer 4 projection, refresh the 35 tracked surfaces, activate canonical writes, materialize graph tables, or prove aVa loaded/indexed/retrievable/cited states.
