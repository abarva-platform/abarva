# 2026-07-09-meridian-v6-v7-current-state-layer — Meridian V6/V7 Current-State Layer

## Release ID

`2026-07-09-meridian-v6-v7-current-state-layer`

## Status

`deployed-live-proof-in-progress`

## Plain-English Summary

Adds a reusable, manifest-gated tenant V6/V7 generation path and uses Meridian Health as the first proof tenant. The Meridian pack encodes the CDAO-provided current-state facts: Epic Hyperspace/Clarity/Caboodle, SQL Server mart sprawl, Tableau/SAS/Power BI reporting, outsourced analytics managed services, 120+ analytics/data resources with roughly 80 percent maintenance work, AWS Databricks aspiration, and explicit foundation gaps around medallion architecture, platform/network/security, and formal governance.

This release does not wire Moves or Source to V6/V7 and does not create a workshop write-back loop. Those remain follow-up architecture decisions.

## Layer Impact

- `client-data-lane`: Adds `datasets/meridian-health-v6-v7-current-state-v1/`, a new governed manifest, and Meridian Tower-standardized projections generated from the same V6 facts.
- `internal-admin`: Adds reusable operator scripts and shared modules for tenant V6 generation, validation, V7 derivation, Tower projection, and V7 Azure loading.
- `global-control-lane`: Home's V7 answer selector now uses the tenant's current active validated V7 pack instead of a single hardcoded contract version. The generic V7 loader is script-only and requires an explicit payload plus database credentials.
- `global-control-lane`: Home's deterministic V7 answer composer now routes source-system/reporting-tool questions to the applications/systems dimension and surfaces loaded detail fields such as technologies, blockers, dependencies, lifecycle, and known gaps instead of only row display names.

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
- Pass: Azure/Postgres V7 load through the approved operator job lane; run `run:v7.1.0-meridian-current-state-20260709:meridian-health` loaded 25 files, 442 records, 11,507 fields, 97 graph nodes, 69 relationship edges, and 118 chunks.
- Pass: independent Azure/Postgres readback confirmed the active validated Meridian V7 run and zero weak/unscored graph edges.
- Pass: signed-in Chrome Home proof reached `tenantKey=meridian-health`, `composer=home_v7_dataset_contract`, no V7 fallback, no dollar figure fabrication, and no real-patient/real-member claim.
- Follow-up Pass: Chrome proof exposed a shallow deterministic summary for systems/gaps prompts; patched the generic Home V7 composer and added a regression proving concrete system details and loaded blockers surface from record fields.
- Follow-up Pass: Increased the generic V7 systems summary sample depth so medium-size reporting estates can show additional tools such as Power BI instead of truncating after the first six records.

## Rollout Plan

1. Merge the candidate PR to `main` after local and CI validation.
2. Run the generic V7 loader through the approved operator lane with `V7_PAYLOAD_FILE=datasets/meridian-health-v6-v7-current-state-v1/azure/v7-tenant-load-payload.json`.
3. Confirm `intelligence_v7.tenant_pack_runs` has the Meridian contract loaded and validated.
4. Deploy through the repo-owned Azure Container Apps lane if runtime code changes require a new image.
5. Run signed-in Meridian Home KNOW proof for the three required CDAO questions and capture transcripts/screenshots.
6. Follow up with the Home V7 composer hardening PR if Chrome proof shows the route is correct but answer text is too shallow for demo use.

## Deployment Authority

- Repo-owned deploy workflow: Required before any runtime proof claim if merged code differs from live.
- Shared runtime mutators: Azure Postgres `intelligence_v7` load through the approved operator path.
- Approved image digest: `acrabarvalab001.azurecr.io/abarva/web@sha256:90c63a51322ae26183a2b602b756852bbe1e72a41f86fd36f3dbec197a1fc35c` after the active-pack selector deployment.
- ACA runtime invariant: Pass; web template and 100 percent traffic revision were on the approved digest after deployment.
- Worker image invariant: Pass; delivery worker jobs matched the approved digest after deployment.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Code rollback reverts the PR. Data rollback marks the Meridian V7 tenant pack run superseded or reloads the prior Meridian V7 contract if one exists. The generic loader is additive and requires explicit invocation, so no runtime data changes occur unless the operator load is run.

## Audit Evidence

- Validation summary: `out/meridian-health-v6-v7-current-state-v1-validation.json`
- V7 derivation summary: `out/meridian-health-v6-v7-current-state-v1-v7-derivation-summary.json`
- Tower sync summary: `out/meridian-health-v6-v7-current-state-v1-tower-sync.json`
- Generated dataset manifest: `datasets/meridian-health-v6-v7-current-state-v1/V6_V7_GENERATED_MANIFEST.json`
- PRs: `https://github.com/abarva-platform/abarva/pull/4641`, `https://github.com/abarva-platform/abarva/pull/4642`, plus follow-up Home V7 composer hardening.
- ACA deploy workflow runs: `29041065478` for the data-layer merge and `29042347525` for the Home active-pack selector merge.
- Azure V7 load execution: `job-abarva-private-operator-eus-kj2hxad`.
- Azure readback execution: `job-abarva-private-operator-eus-bssz0lg`.
- Signed-in Chrome proof artifacts: `/tmp/meridian-home-chrome-proof-*.json` and `/tmp/meridian-home-targeted-proof-*.json`.

## Known Gaps

- Moves and Source still have zero V6/V7 runtime coupling.
- Workshop findings still do not write back into V6/V7.
- V6 graph quality reports are not computed by this release.
- Cross-tenant benchmarking is not implemented in this data layer.
