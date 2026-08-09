# 2026-08-08-source-contract-optimization-v11-portability — Source Contract Optimization Portability

## Release ID

`2026-08-08-source-contract-optimization-v11-portability`

## Status

`candidate`

## Plain-English Summary

This release makes Source existing-contract optimization a shared product capability instead of a canary-specific path. Contract 360, Door 1 exports, and aVa now look for a persisted contract-optimization profile scoped to the active tenant and event. If no exact profile exists, the optimization pack is not served. A shared four-ledger decision/evidence substrate is added so future tenant loads can normalize contract, invoice, SLA, usage, supplier, agreement, and finance proof into the same read contract.

## Layer Impact

- Affected lane(s): `global-control-lane`, `client-data-lane`
- Client Intake: no direct runtime change; the design guide defines the minimum source extracts and contract PDF extraction requirements for future tenant packages.
- Source Adapters: adds the normalized evidence-observation target expected from adapters.
- Canonical / Semantic Source Model: adds tenant-scoped decision and evidence tables for the four contract optimization ledgers.
- Products: updates Source export/aVa routing to use exact persisted event profiles instead of tenant-specific optimization fixtures.

## Client Applicability

- All clients: yes, once their source adapters load the shared optimization evidence classes.
- Specific clients: none hardcoded.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none introduced.

## Changes Included

- `supabase/migrations/20260808213000_source_contract_optimization_v11_portability.sql`
- `src/lib/source/contract-optimization/eligibility.ts`
- `src/lib/source/contract-optimization/read.ts`
- Source event page and Source export/aVa routes for contract optimization profile lookup.
- Contract optimization portability tests and design guide.

## QA / Validation

- Pass: `npm test -- src/lib/source/contract-optimization/__tests__/read.test.ts src/lib/source/contract-optimization/__tests__/eligibility.test.ts src/lib/source/data-model/__tests__/contract-optimization-ledger.test.ts src/lib/source/data-model/__tests__/contract-optimization-spine.test.ts src/lib/source/data-model/__tests__/contract-optimization-portability.test.ts 'src/app/api/v1/source/[eventId]/contract-optimization/brief/__tests__/route.test.ts' --runInBand`
- Pass: `npm test -- --runTestsByPath 'src/app/api/v1/source/[eventId]/contract-optimization/brief/__tests__/route.test.ts' --runInBand`
- Pass: targeted `npx eslint` on changed Source runtime, data-model, and test files.
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`
- Pass: `npm run release:check`
- Pending after deploy: signed-in browser proof for a canary tenant and a second tenant with no product-code fork.

## Rollout Plan

Merge through the protected PR path. The repo-owned Azure Container Apps main deployment workflow builds and deploys the web image after merge. The new migration must be applied through the approved data-plane migration/operator path before relying on the new Source tables for live tenant data.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this PR
- Approved image digest: produced by the repo-owned workflow after merge
- ACA runtime invariant: verify template image and 100% traffic revision image after deploy
- Worker image invariant: no worker image change
- Feature/env flag update path: none
- Live signed-in proof required: yes, for affected Source routes after deployment

## Rollback Plan

Revert the PR for runtime behavior. The migration is additive; if rollback is required, stop writers to the new Source tables and leave the tables unused until a follow-up migration removes them under the normal data-plane process.

## Audit Evidence

- PR URL after publication.
- Unit and lint command output.
- Release check output.
- Migration review.
- Post-deploy signed-in browser proof for Source Contract 360 / Door 1 profile routing.

## Known Gaps

- This release does not load a second tenant's data by itself; it makes the product path tenant-agnostic and defines the shared load target.
- This release does not prove live browser behavior until the PR is merged, deployed, and tested in the signed-in app.
