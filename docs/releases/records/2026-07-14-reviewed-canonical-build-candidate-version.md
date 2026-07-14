# 2026-07-14-reviewed-canonical-build-candidate-version — Reviewed Build to Inactive Candidate Versions

## Release ID

`2026-07-14-reviewed-canonical-build-candidate-version`

## Status

`candidate`

## Plain-English Summary

This release adds the controlled step after the canonical tenant data build: reviewed inactive build output can now be materialized as inactive candidate-version metadata and preview read models. It proves that rich canonical build output, including SkyHarbor and Meridian, can be inspected before promotion without changing active tenant truth.

## Layer Impact

- Candidate Tenant Data Version: Adds deterministic inactive candidate-version build artifacts from `reports/canonical-data-build/latest`.
- Admin Control Plane: Updates Candidate Preview and Data Layer Explorer to show inactive candidate ids, quality gates, source lineage, domain counts, and promotion blockers.
- Active Tenant Access Layer: No change. This release does not update active access, promote data, or change default module reads.

## Client Applicability

- All clients: Candidate-version build reports cover every active tenant in the canonical input registry.
- Specific clients: SkyHarbor and Meridian have explicit proof slices because they were the known richness and healthcare-context checks.
- Internal only: Admin Candidate Preview and Data Layer Explorer visibility.
- Public/demo only: None.
- Feature flag: Candidate preview remains explicit-request only through route parameters; default Home and module runtime reads remain unchanged.

## Changes Included

- `src/lib/enterprise-data/candidate-version-build/candidate-version-build.ts`
- `scripts/data-build/build-candidate-version.ts`
- `scripts/data-build/audit-candidate-version.ts`
- `scripts/data-build/audit-active-candidate-separation.ts`
- `src/app/(maestro)/admin/candidate-preview/page.tsx`
- `src/app/(maestro)/admin/data-layer-explorer/page.tsx`
- `reports/candidate-version-build/latest/*`

## QA / Validation

- `npm run build:candidate-version` — Pass.
- `npm run audit:candidate-version` — To run before merge.
- `npm run audit:active-candidate-separation` — To run before merge.
- `npm run build:canonical-tenant-data` — To run before merge.
- `npm run audit:canonical-data-build` — To run before merge.
- `npm run audit:enterprise-profile-foundation` — To run before merge.
- `npm run audit:home-ava-build-readiness` — To run before merge.
- `npm run audit:canonical-tenant-inputs` — To run before merge.
- `npm run audit:tenant-input-quality` — To run before merge.
- `npm run audit:enterprise-naming` — To run before merge.
- `npm run audit:architecture-rules` — To run before merge.
- `npm run release:check` — To run before merge.

## Rollout Plan

Merge through the standard PR path. The ACA main deploy workflow may deploy the admin/report visibility code, but the data created here remains inactive report metadata. Operators can inspect the report bundle and explicit candidate preview page; no active data pointer changes.

## Deployment Authority

- Repo-owned deploy workflow: Required for runtime admin page changes after merge.
- Shared runtime mutators: None in this PR.
- Approved image digest: Captured by ACA main deploy workflow after merge.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required by ACA main deploy workflow.
- Feature/env flag update path: None.
- Live signed-in proof required: Admin Candidate Preview and Data Layer Explorer after deploy if runtime visibility is claimed.

## Rollback Plan

Revert the PR or remove the generated `reports/candidate-version-build/latest` artifact. Because this release does not write production tenant data, promote a candidate, or update active access, rollback is code/report-only.

## Audit Evidence

- Candidate proof bundle: `reports/candidate-version-build/latest/`
- Source build fingerprint: stored in `reports/candidate-version-build/latest/candidate-version-index.json`
- Active/candidate separation proof: `reports/candidate-version-build/latest/active-vs-candidate-separation.json`
- Guardrails: `reports/candidate-version-build/latest/guardrails.json`
- SkyHarbor proof: `reports/candidate-version-build/latest/skyharbor-candidate-preview.json`
- Meridian proof: `reports/candidate-version-build/latest/meridian-candidate-preview.json`

## Known Gaps

- Candidate versions are preview-ready, not active-runtime-ready.
- Enterprise profile gaps remain promotion blockers until remediated.
- Default Home does not consume these candidates yet.
- No candidate promotion is implemented in this release.
