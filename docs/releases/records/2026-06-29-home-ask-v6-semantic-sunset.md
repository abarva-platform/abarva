# 2026-06-29-home-ask-v6-semantic-sunset — Home Ask V6 Semantic Sunset

## Release ID

`2026-06-29-home-ask-v6-semantic-sunset`

## Status

`candidate`

## Deployment Authority

Azure Container Apps only. `app.abarva.ai` must be built from the exact git SHA with `az acr build`, deployed to `ca-abarva-web-lab-eastus`, moved to 100% traffic on the healthy revision, and verified with signed-in production Home Ask evidence. Vercel is not an approved production lane for this release.

## Plain-English Summary

Home Ask no longer answers from the retired Semantic2/Home KNOW dossier path. The `/api/home/know/ask` runtime now builds its visible answer directly from the tenant's generated V6 dataset pack. If V6 is thin, the answer says so; it must not borrow older budget, vendor, application, operations, or AI facts from retired layers.

## Layer Impact

- `global-control-lane`: changes the shared Home Ask API route for all tenants that have generated V6 packs.
- `client-data-lane`: reads generated V6 dataset files from `datasets/*-synthetic-v6`; no database migration or ingestion commit is included.

## Client Applicability

- All clients: yes, for Home Ask routing where a V6 generated pack exists.
- Specific clients: regression coverage targets Lakeshore Industries and SkyHarbor Air.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/app/api/home/know/ask/route.ts`: removed the Semantic2 dossier composer path and routes Home Ask to the V6 dataset contract answerer.
- `src/lib/home/know/v6-home-ask.ts`: new V6-only answer assembler for Home Ask.
- `src/app/api/home/know/ask/__tests__/route.test.ts`: regression tests for the sunset and the known weak prompts.

## QA / Validation

- Passed: `npx tsc --noEmit --pretty false --incremental false`
- Passed: `npx eslint src/app/api/home/know/ask/route.ts src/lib/home/know/v6-home-ask.ts src/app/api/home/know/ask/__tests__/route.test.ts`
- Passed: `npx jest --runTestsByPath src/app/api/home/know/ask/__tests__/route.test.ts --runInBand`
- Passed local 50-question V6-only module check for Lakeshore and SkyHarbor: `50/50`, with no old Semantic2 composer symbols, no retired SkyHarbor budget figures, `semantic2Loaded:false`, and `dossierAttached:false`.

## Rollout Plan

Merge through the controlled release path, build the exact git SHA into ACR, update `ca-abarva-web-lab-eastus`, shift 100% traffic to the healthy revision, then rerun signed-in production Home Ask 50-question accuracy for Lakeshore and SkyHarbor. Record the ACA revision, image digest, and live smoke output after deployment.

## Rollback Plan

Rollback by assigning ACA traffic back to the previous healthy revision. No database migration rollback is required.

## Audit Evidence

- Local route tests listed above.
- Local 50-question V6-only module check listed above.
- Pending after deployment: live signed-in browser/API evidence for Lakeshore and SkyHarbor.

## Context Ingestion Evidence

No ingestion path changed. This release reads generated V6 dataset files already present in the repo.

- Local artifact generated: not applicable.
- Local parse/preflight: V6 CSV parsing exercised by route tests and local 50-question check.
- Product loader/API acceptance: not applicable.
- Azure Blob/object storage staging: not applicable.
- Queue/private worker handoff: not applicable.
- Parser extraction with source citations: not applicable.
- Review/approval queue: not applicable.
- Client data-plane commit: not applicable.
- Embedding/search refresh: not applicable.
- Live signed-in retrieval or answer QA: pending deployment.

## Known Gaps

- Not deployed yet.
- The old Semantic2 helper files still exist elsewhere in the repository for non-Home work, but `/api/home/know/ask` no longer imports or invokes them.
- This is a deterministic V6 contract answerer. It intentionally does not invoke Claude until the V6 packet-to-model contract is reintroduced without retired data access.
