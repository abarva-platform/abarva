# 2026-07-13-skyharbor-data-layer-quality-audit — SkyHarbor Data Layer Quality Audit

## Release ID

`2026-07-13-skyharbor-data-layer-quality-audit`

## Status

`candidate`

## Plain-English Summary

This release makes the Admin Data Layer Explorer honest about SkyHarbor data quality. The page now shows that SkyHarbor has rich source evidence for mainframe, Teradata, SAP, BI, integrations, systems, data products, and platform volumetrics, while the current inactive candidate proof only covers a thin minimal slice. The page remains read-only and does not create, promote, or activate candidate data.

## Layer Impact

- Release lane: `internal-admin`.
- Evidence Registry: Adds a reference audit summary showing which source evidence exists and which files support the richness claim.
- Candidate Tenant Data Version: Shows that the current SkyHarbor candidate version is review-required because it processed only the minimal candidate packet.
- Enterprise Relationship Graph: Flags that zero relationship operations are planned even though dependency-rich source evidence exists.
- Admin / Steward control surface: Adds visible review-required data-quality signals to the read-only Data Layer Explorer.

## Client Applicability

- All clients: The page pattern applies to the shared Admin Data Layer Explorer.
- Specific clients: SkyHarbor Air is the first reference audit shown.
- Internal only: Yes. This is an admin/read-only proof surface.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Adds a SkyHarbor reference data audit to `src/lib/admin/data-layer-explorer.ts`.
- Renders the audit in `/admin/data-layer-explorer`.
- Writes `reports/admin-data-layer-explorer/latest/reference-data-audit.json`.
- Adds regression tests for source richness, thin candidate coverage, relationship plan gap, and non-mutating guardrails.

## QA / Validation

- Pass: `npx jest --runTestsByPath src/lib/admin/__tests__/data-layer-explorer.test.ts src/app/'(maestro)'/admin/data-layer-explorer/__tests__/page-source.test.ts --runInBand`
- Pass: `npx eslint src/lib/admin/data-layer-explorer.ts src/app/'(maestro)'/admin/data-layer-explorer/page.tsx src/lib/admin/__tests__/data-layer-explorer.test.ts src/app/'(maestro)'/admin/data-layer-explorer/__tests__/page-source.test.ts`
- Pass: `npm run audit:admin-data-layer-explorer`

## Rollout Plan

Merge through PR to `main`. The repo-owned Azure Container Apps main deploy workflow will build and deploy the exact merged SHA. After deploy, run runtime invariant, production health, and focused signed-in crawl for `/admin/data-layer-explorer`.

## Deployment Authority

- Repo-owned deploy workflow: Required for production/lab rollout.
- Shared runtime mutators: None in this PR.
- Approved image digest: To be captured after merge/deploy.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: No worker behavior change expected; invariant remains part of deploy proof.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, focused `/admin/data-layer-explorer` crawl.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main deploy workflow. Because this is read-only UI/proof metadata with no data writes, rollback does not require data migration or tenant data repair.

## Audit Evidence

- `reports/admin-data-layer-explorer/latest/reference-data-audit.json`
- `reports/admin-data-layer-explorer/latest/summary.md`
- Focused unit tests for the admin data layer explorer.
- Focused post-deploy crawl after merge.

## Known Gaps

- This release does not expand the SkyHarbor candidate packet.
- This release does not add the missing source adapters or mapping profiles.
- This release does not write production tenant data.
- This release does not promote any candidate data to Active Tenant Access.
