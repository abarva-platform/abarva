# 2026-07-29-module-data-plane-certification — Governed Module Data-Plane Certification

## Release ID

`2026-07-29-module-data-plane-certification`

## Status

`candidate`

## Plain-English Summary

This release adds the first controlled certification package for proving whether enabled product modules are using the governed Azure PostgreSQL data plane and the active Knowledge baseline. It does not replay review decisions, republish domains, rebuild projections, or change foundation data.

## Layer Impact

- Layer 3 canonical model: no data changes. The already-active baseline remains immutable.
- Layer 4 products: adds proof tooling and a runtime guard so aVa packets for governed foundation tenants bind to the server-resolved Knowledge baseline instead of trusting browser-supplied baseline identifiers.
- Operations and audit: adds static and runtime evidence scripts for the module data-plane certification gate.

## Client Applicability

- All clients: no immediate behavior change unless they are on the governed foundation tenant path.
- Specific clients: applies to the foundation tenant certification lane.
- Internal only: proof scripts and reports are operator/auditor artifacts.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- Adds module data-plane certification report generation under `scripts/qa/airline-module-data-plane-certification.mjs`.
- Adds read-only runtime database proof script under `scripts/qa/airline-module-runtime-db-proof.mjs`.
- Adds aVa packet binding helper and regression tests under `src/lib/knowledge/consumption-server/`.
- Updates `/api/knowledge/ava` so governed foundation tenants bind to the active server-side consumption envelope before model invocation.
- Adds npm commands for the two proof scripts.
- Updates the read-only runtime DB proof script to inspect the deployed baseline row shape and projection relation availability instead of assuming every optional proof column exists.
- Adds tenant-aware data-plane selection for governed foundation tenants. Legacy tenants keep the historical default, but foundation tenants resolve module write seams to Azure PostgreSQL by tenant key and fail closed if explicitly routed to Supabase.
- Threads tenant keys through the obvious Moves/Programs and Source write selectors so governed tenant operations cannot silently choose the legacy write plane.
- Extends the same tenant-aware guard to Tower aggregate and enterprise-summary read adapters, and threads the tenant key through the Atlas portfolio fallback so governed tenant Tower reads cannot silently choose the legacy read plane.
- Adds a shared foundation-tenant key helper and fences the legacy Enterprise Agent Context Broker for governed foundation tenants so fixture and tenant-data fallback paths cannot supply model context.
- Fences the legacy Intelligence Home-tab route for governed foundation tenants so it fails closed instead of using the old Home/V6 answer path.
- Blocks Tower demo seed/reset writes for governed foundation tenants before admin role lookup or demo-data mutation.
- Adds regression proof that a legacy fixture-specific Source contract-optimization pack is unavailable to the governed foundation tenant path.

## QA / Validation

- Pass: `npm run qa:airline-module-data-plane-certification`
- Pass: `node --check scripts/qa/airline-module-runtime-db-proof.mjs`
- Pass: `npx jest src/lib/knowledge/consumption-server/__tests__/ava-packet-binding.test.ts --runInBand`
- Pass: `npm run test:phase3c2e-data-layer`
- Pass: `npx tsc --noEmit`
- Pass: `npm run release:check`
- Pass: deployed read-only proof script syntax after schema-tolerant update: `node --check scripts/qa/airline-module-runtime-db-proof.mjs`
- Pass: governed tenant write-plane selector regression tests for Source writes, Source facts, Source artifacts, and Moves/Programs writes.
- Pass: governed tenant read-plane selector regression tests for Tower aggregate and enterprise-summary reads.
- Pass: governed foundation tenant broker tests for both sync and async Enterprise Agent Context Broker entry points.
- Pass: `npx jest --runTestsByPath src/app/api/tower/__tests__/seed-demo-route.test.ts 'src/app/api/v1/source/[eventId]/contract-optimization/brief/__tests__/route.test.ts' --runInBand`

Live signed-in proof and read-only VNet database proof are required after deployment before any all-module migration closure claim.

## Rollout Plan

Merge to `main` through PR, build and deploy through the repo-owned Azure Container Apps main deploy workflow, then run the read-only runtime proof from the governed ACA/VNet lane. No manual foundation data mutation is part of this rollout.

## Deployment Authority

- Repo-owned deploy workflow: required for web runtime changes.
- Shared runtime mutators: none in this release.
- Approved image digest: captured after ACA deploy.
- ACA runtime invariant: required after deploy.
- Worker image invariant: not changed by this release.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, for aVa baseline binding and module certification evidence.

## Rollback Plan

Rollback the ACA web runtime to the previous digest if the aVa route or Knowledge proof regresses. The proof scripts are additive and do not mutate data.

## Audit Evidence

- Static certification report: `reports/airline-all-module-data-plane-certification-2026-07-29.md`.
- Proof bundle: `proof/airline-all-module-data-plane-certification-2026-07-29/`.
- Jest regression for server-side aVa baseline binding.
- Post-deploy ACA digest and signed-in proof bundle to be appended after deployment.
- Runtime DB proof script now reports missing projection relations as proof findings instead of aborting on optional-column drift.
- Tenant-aware write-plane guard tests cover Source writes, Source facts, Source artifacts, and Moves/Programs writes.
- Tenant-aware read-plane guard tests cover Tower aggregate and enterprise-summary reads.
- Enterprise Agent Context Broker tests prove governed foundation tenants are blocked from legacy fixture and persisted tenant-data fallback paths.
- Tower demo seed/reset route tests prove governed foundation tenants cannot seed or remove deterministic Tower demo data.
- Source contract-optimization route test proves a legacy fixture-specific contract-optimization pack does not serve the governed foundation tenant.

## Known Gaps

This release does not complete all-module migration. It identifies partial/legacy module paths and adds proof tooling. The follow-up guards close a class of accidental Supabase fallback for governed Source and Moves write seams, Tower aggregate/enterprise-summary read seams, legacy Intelligence context fallbacks, Tower demo seed/reset writes, and one legacy Source contract-optimization route. Tower, Intelligence, Cube, Superset, Observable, Source operational state, Moves operational state, and Admin still require module-by-module runtime proof or follow-up migration before the foundation tenant can be called fully migrated.
