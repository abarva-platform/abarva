# 2026-07-09-meridian-v6-v7-current-state-layer — Meridian V6/V7 Current-State Layer

## Release ID

`2026-07-09-meridian-v6-v7-current-state-layer`

## Status

`candidate`

## Plain-English Summary

Adds a reusable, manifest-gated tenant V6/V7 generation path and uses Meridian Health as the first proof tenant. The Meridian pack encodes the CDAO-provided current-state facts: Epic Hyperspace/Clarity/Caboodle, SQL Server mart sprawl, Tableau/SAS/Power BI reporting, outsourced analytics managed services, 120+ analytics/data resources with roughly 80 percent maintenance work, AWS Databricks aspiration, and explicit foundation gaps around medallion architecture, platform/network/security, and formal governance.

This release does not wire Moves or Source to V6/V7 and does not create a workshop write-back loop. Those remain follow-up architecture decisions.

## Layer Impact

- `client-data-lane`: Adds `datasets/meridian-health-v6-v7-current-state-v1/`, a new governed manifest, and Meridian Tower-standardized projections generated from the same V6 facts.
- `internal-admin`: Adds reusable operator scripts and shared modules for tenant V6 generation, validation, V7 derivation, Tower projection, and V7 Azure loading.
- `global-control-lane`: Home's V7 answer selector now uses the tenant's current active validated V7 pack instead of a single hardcoded contract version. The generic V7 loader is script-only and requires an explicit payload plus database credentials.

## Client Applicability

- All clients: The reusable scripts can support future tenants.
- Specific clients: Meridian Health receives the generated V6/V7 current-state pack.
- Internal only: Loader/generator scripts are internal operator tooling.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `docs/governance/dataset-manifests/meridian-health-v6-v7-current-state-v1.json`
- `scripts/lib/v6-v7/*`
- `scripts/tenant-v6/generate-tenant-v6-pack.mjs`
- `scripts/tenant-v6/validate-tenant-v6-pack.mjs`
- `scripts/tenant-v6/sync-tenant-v6-to-tower-standardized.mjs`
- `scripts/tenant-v6/configs/meridian-health.mjs`
- `scripts/v7/derive-tenant-v7-insights.mjs`
- `scripts/v7/load-tenant-v7-azure.mjs`
- `src/lib/home/know/v7-home-ask.ts`
- `src/lib/home/know/__tests__/v7-home-ask.test.ts`
- `datasets/meridian-health-v6-v7-current-state-v1/`
- `tower-standardized-v1/meridian-health/`
- `package.json` operator scripts for the reusable path.

## QA / Validation

- Pass: `npm run tenant-v6:generate -- --tenant meridian-health`
- Pass: `npm run tenant-v6:validate -- --tenant meridian-health`
- Pass: `npm run v7:tenant:derive -- --tenant meridian-health`
- Pass: `npm run tenant-v6:tower-sync -- --tenant meridian-health`
- Pass: `npm run validate:context-corpus:manifests`
- Pass: `npx jest src/lib/home/know/__tests__/v7-home-ask.test.ts --runInBand`
- Pass: `node --check` on the new V6/V7 operator scripts
- Pass: `git diff --check`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit`
- Pass: `npm run release:check`
- Pending: Azure/Postgres V7 load.
- Pending: signed-in Meridian Home answer proof.

## Rollout Plan

1. Merge the candidate PR to `main` after local and CI validation.
2. Run the generic V7 loader through the approved operator lane with `V7_PAYLOAD_FILE=datasets/meridian-health-v6-v7-current-state-v1/azure/v7-tenant-load-payload.json`.
3. Confirm `intelligence_v7.tenant_pack_runs` has the Meridian contract loaded and validated.
4. Deploy through the repo-owned Azure Container Apps lane if runtime code changes require a new image.
5. Run signed-in Meridian Home KNOW proof for the three required CDAO questions and capture transcripts/screenshots.

## Deployment Authority

- Repo-owned deploy workflow: Required before any runtime proof claim if merged code differs from live.
- Shared runtime mutators: Azure Postgres `intelligence_v7` load through the approved operator path.
- Approved image digest: Pending after merge/deploy.
- ACA runtime invariant: Pending after deploy.
- Worker image invariant: Pending for the operator load job.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Code rollback reverts the PR. Data rollback marks the Meridian V7 tenant pack run superseded or reloads the prior Meridian V7 contract if one exists. The generic loader is additive and requires explicit invocation, so no runtime data changes occur unless the operator load is run.

## Audit Evidence

- Validation summary: `out/meridian-health-v6-v7-current-state-v1-validation.json`
- V7 derivation summary: `out/meridian-health-v6-v7-current-state-v1-v7-derivation-summary.json`
- Tower sync summary: `out/meridian-health-v6-v7-current-state-v1-tower-sync.json`
- Generated dataset manifest: `datasets/meridian-health-v6-v7-current-state-v1/V6_V7_GENERATED_MANIFEST.json`
- Pending: PR URL, CI, Azure load summary, SQL readback, signed-in Home transcripts/screenshots.

## Known Gaps

- Moves and Source still have zero V6/V7 runtime coupling.
- Workshop findings still do not write back into V6/V7.
- V6 graph quality reports are not computed by this release.
- Cross-tenant benchmarking is not implemented in this data layer.
