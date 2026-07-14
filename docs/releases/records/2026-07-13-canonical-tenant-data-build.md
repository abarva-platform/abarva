# 2026-07-13-canonical-tenant-data-build — Canonical Tenant Input to Data Layer Build

## Release ID

`2026-07-13-canonical-tenant-data-build`

## Status

`candidate`

## Plain-English Summary

This release adds the first deterministic data-build job that reads only the canonical tenant input root and produces inactive data-layer build artifacts for every active tenant. It turns active input files into canonical record summaries, evidence attachment summaries, relationship candidates, enterprise profile status, quality/depth posture, and Home/aVa readiness artifacts.

This does not regenerate active runtime data. It does not write production tenant data, update the Active Tenant Access Layer, promote a candidate, or change module runtime reads.

## Layer Impact

- `client-data-lane`: adds an inactive file-based build proof from canonical tenant input files into canonical data-layer artifacts.
- `internal-admin`: adds deterministic proof reports under `reports/canonical-data-build/latest/`.
- `global-control-lane`: adds package commands for build/audit validation; no runtime module behavior changes.

## Client Applicability

- All clients: active tenants in `datasets/tenant-inputs/tenant-input-registry.json` are processed.
- Specific clients: Apex Retail, First Capital Financial, Lakeshore Holdings, Lakeshore Industries, Meridian Health, and SkyHarbor Air.
- Internal only: proof bundle and audit commands.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `src/lib/enterprise-data/canonical-build/canonical-tenant-data-build.ts`
- `scripts/data-build/build-canonical-tenant-data.ts`
- `scripts/data-build/audit-canonical-data-build.ts`
- `scripts/data-build/audit-enterprise-profile-foundation.ts`
- `scripts/data-build/audit-home-ava-build-readiness.ts`
- `package.json` commands:
  - `npm run build:canonical-tenant-data`
  - `npm run audit:canonical-data-build`
  - `npm run audit:enterprise-profile-foundation`
  - `npm run audit:home-ava-build-readiness`
- `reports/canonical-data-build/latest/`

## QA / Validation

- Pass: `npm run build:canonical-tenant-data`
- Pass: `npm run audit:canonical-data-build`
- Pass: `npm run audit:enterprise-profile-foundation`
- Pass: `npm run audit:home-ava-build-readiness`
- Pass: `npm run audit:canonical-tenant-inputs`
- Pass: `npm run audit:tenant-input-quality`
- Pass: `npm run audit:enterprise-naming`
- Pass: `npm run audit:architecture-rules`
- Pass: `npm run release:check`
- Pass: isolated TypeScript compile for canonical data-build files using local no-save TypeScript tooling
- Pass: `git diff --check`

## Rollout Plan

Merge through PR to `main`. The change is a deterministic build/audit/reporting capability only. It does not require a database migration, data promotion, feature flag update, or module runtime rollout. If merged, the standard ACA workflow may deploy the code path, but no production data is written by the deploy itself.

## Deployment Authority

- Repo-owned deploy workflow: standard ACA main deploy if merged.
- Shared runtime mutators: none in this PR.
- Approved image digest: assigned by ACA main deploy workflow after merge.
- ACA runtime invariant: required only if deployed.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: not required for inactive report-only scripts; deployment health/runtime invariant are sufficient if merged.

## Rollback Plan

Revert the PR or remove the new package commands and report files. Because this release does not write production tenant data, does not promote candidates, and does not change module reads, rollback has no data-plane cleanup requirement.

## Audit Evidence

- `reports/canonical-data-build/latest/summary.md`
- `reports/canonical-data-build/latest/tenant-build-index.json`
- `reports/canonical-data-build/latest/canonical-records-summary.json`
- `reports/canonical-data-build/latest/evidence-attachment-summary.json`
- `reports/canonical-data-build/latest/relationship-candidates-summary.json`
- `reports/canonical-data-build/latest/enterprise-profile-build.json`
- `reports/canonical-data-build/latest/placeholder-rejection-report.json`
- `reports/canonical-data-build/latest/tenant-gaps.json`
- `reports/canonical-data-build/latest/tenant-quality-depth.json`
- `reports/canonical-data-build/latest/home-ava-readiness.json`
- `reports/canonical-data-build/latest/source-path-enforcement.json`
- `reports/canonical-data-build/latest/archive-read-violations.json`
- `reports/canonical-data-build/latest/all-tenant-build-control.html`

## Known Gaps

- Enterprise profile fields still contain reportable gaps for some tenants; this PR reports those gaps instead of fabricating profile facts.
- Home/aVa readiness remains an artifact only. Home rendering and aVa runtime consumption are intentionally unchanged.
- Active tenant truth is not regenerated or promoted by this PR.
