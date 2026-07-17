# 2026-07-17-meridian-runtime-module-context-access — Meridian Runtime Module Context Access

## Release ID

`2026-07-17-meridian-runtime-module-context-access`

## Status

`candidate`

## Plain-English Summary

This release refreshes the Meridian active tenant input packet with the current
reviewed V3 Meridian source packet and adds an explicit audit proving Home,
Intelligence, and Tower can request Meridian context through the governed
module-context serving contract. The proof keeps the truth split clear: this
makes governed context available through the module-context access layer, but it
does not write physical production tables, make modules read candidate data by
default, or claim that the legacy Tower dashboard read model or default
Intelligence ask path has been fully migrated. It also does not claim all
modules consume pre-generated Claude-approved story blocks; that local
approved-content bridge is currently verified for Home only.

## Layer Impact

- Lane: `client-data-lane` for Meridian / Healthcare Demo context metadata and
  module-context proof artifacts.
- Active Tenant Access metadata: Meridian now points to the current reviewed
  candidate metadata version for safe demo module-context reads.
- Module context serving: Home, Intelligence, and Tower are audit-proven to
  receive `active_tenant_access` packets with evidence-backed records.
- Tower runtime guardrail: default Tower dashboard and Tower aVa do not build
  from tenant-input CSV files. The file-backed TowerContextPack path remains an
  explicit proof harness behind `ENABLE_TOWER_V3_CONTEXT_RUNTIME`; the target
  runtime path is governed Azure/Postgres projection and Active Tenant Access.
- Release proof: A new Meridian runtime-module-access audit records the access
  state and guardrail truth split.

## Client Applicability

- All clients: No default behavior change for other tenants.
- Specific clients: Meridian / Healthcare Demo only.
- Internal only: The audit command and generated proof artifacts are internal
  release evidence.
- Public/demo only: Supports Meridian demo readiness.
- Feature flag: `ENABLE_TOWER_V3_CONTEXT_RUNTIME` controls the file-backed
  Tower V3 proof panel. It is off by default and must not be treated as the
  production Tower source of truth.

## Changes Included

- Added `npm run audit:meridian-runtime-module-access`.
- Added `scripts/tenant-v3/audit-meridian-runtime-module-access.ts`.
- Updated `reports/active-tenant-access/meridian/*` to the current Meridian
  candidate metadata version.
- Added `reports/meridian-runtime-module-access/summary.{json,md}`.
- Added `npm run report:meridian-data-plane-layout` and
  `reports/meridian-data-plane-layout/*` to document current source packet,
  derived-layer, Active Tenant Access, Tower projection, and target
  Azure/Postgres serving-layer volumetrics.
- Refreshed `datasets/tenant-inputs/active/meridian-health/current/` from the
  reviewed Meridian V3 source packet so active module-context serving reads the
  current budget/program/AI/interview-rich source rows instead of the older
  thin compatibility packet.
- Split Meridian `00_enterprise_profile.csv` provenance so the original
  high-confidence enterprise summary remains separate from profile sizing and
  operating-model planning assumptions. Revenue, employee count, headquarters,
  leadership, mission, vision, and strategy now ride on a dedicated low-
  confidence `profile_planning_assumption` evidence row until client-attested
  source evidence is loaded.
- Updated the Tower V3 proof harness to read the current Meridian V3 budget and
  managed-services file names. Default Tower runtime remains data-plane/read
  model backed unless the explicit proof flag is enabled.
- Added `npm run report:meridian-page-fact-lineage` and
  `reports/meridian-page-fact-lineage/*` to prove approved Home/Tower content
  and Tower projection/value-claim rows map back to the active V3 packet,
  evidence IDs, and refreshed source-template rows.

## QA / Validation

- `npm run audit:meridian-home-context-view` — Pass.
- `npx tsx scripts/tenant-v3/audit-home-v3-runtime-reachability.ts` — Pass.
- `npm run audit:meridian-approved-claude-content` — Pass.
- `npm run audit:meridian-tower-dashboard-view` — Pass.
- `npm run audit:tower-governed-candidate-load` — Pass.
- `npm run audit:meridian-v3-reload-readiness` — Pass.
- `npm run audit:tenant-v3-data` — Pass.
- `npm run audit:meridian-executive-interviews` — Pass.
- `npm run audit:tower-v3-meridian-context-pack` — Pass.
- `npm test -- --runTestsByPath src/lib/tower/__tests__/tower-v3-runtime-view.test.ts --runInBand` — Pass, 6 tests. Jest reports pre-existing duplicate manual mock warnings for Markdown/GFM mocks.
- `npm run audit:active-module-context-promotion -- --tenant meridian-health --slug meridian` — Pass.
- `npm run audit:module-context-serving` — Pass, 24 tests. Jest reports pre-existing duplicate manual mock warnings for Markdown/GFM mocks.
- `npm run audit:meridian-runtime-module-access` — Pass.
- `npm run report:meridian-data-plane-layout` — Pass.
- `npm run report:meridian-page-fact-lineage` — Pass.

## Rollout Plan

Merge through the protected PR lane. Let the repo-owned Azure Container Apps
main deploy workflow build and deploy the digest-pinned image. After deploy,
verify the runtime invariant, then run signed-in Home, Intelligence, and Tower
checks for Meridian / Healthcare Demo.

## Deployment Authority

- Repo-owned deploy workflow: Required for `app.abarva.ai`.
- Shared runtime mutators: None in this PR.
- Approved image digest: Captured after ACA main deploy.
- ACA runtime invariant: Required before claiming live.
- Worker image invariant: Not applicable.
- Feature/env flag update path: `ENABLE_TOWER_V3_CONTEXT_RUNTIME` remains off
  by default; enabling it requires the approved runtime/config path and must
  also preserve the digest-pinned ACA image invariant.
- Live signed-in proof required: Yes, after deploy.

## Rollback Plan

Revert the PR or restore the previous Meridian Active Tenant Access metadata
record from git. No database rollback is required because this PR does not write
physical production tables.

## Audit Evidence

- `reports/active-tenant-access/meridian/active-tenant-access-record.json`
- `reports/active-tenant-access/meridian/module-context-read-proof.json`
- `reports/meridian-runtime-module-access/summary.json`
- `reports/meridian-runtime-module-access/summary.md`
- `reports/meridian-data-plane-layout/summary.json`
- `reports/meridian-data-plane-layout/summary.md`
- `reports/meridian-data-plane-layout/proof.html`
- `reports/meridian-page-fact-lineage/summary.json`
- `reports/meridian-page-fact-lineage/summary.md`
- `reports/meridian-page-fact-lineage/proof.html`
- `reports/meridian-page-fact-lineage/approved-content-lineage.csv`
- `reports/meridian-page-fact-lineage/tower-record-lineage-to-source.csv`
- `reports/meridian-page-fact-lineage/tower-value-claim-lineage-to-source.csv`
- `reports/meridian-page-fact-lineage/profile-assumption-provenance-check.csv`

## Known Gaps

- This PR does not submit an ACA data-build job or write Azure/Postgres physical
  data-plane tables.
- This PR does not claim full legacy Tower dashboard runtime migration.
- This PR does not claim Tower's dashboard source of truth is the tenant-input
  file system. Files are intake/proof artifacts; dashboard truth must come from
  governed Azure/Postgres projections or Active Tenant Access.
- This PR does not claim default Intelligence ask-path migration to the
  knowledge runtime.
- This PR does not claim Moves, Source, Intelligence, or Tower consume the local
  pre-generated Claude-approved content bridge. Home is the verified bridge.
