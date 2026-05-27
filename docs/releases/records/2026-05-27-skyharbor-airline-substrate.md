# 2026-05-27-skyharbor-airline-substrate — SkyHarbor Airline Modernization Substrate

## Release ID

`2026-05-27-skyharbor-airline-substrate`

## Status

`candidate`

## Plain-English Summary

Adds a CTO-defensible synthetic airline tenant substrate named SkyHarbor Air. The pack models a $52B global network carrier five years into IBM mainframe to AWS modernization, with reusable templates, source-upload examples, generated records, graph artifacts, retrieval chunks, provenance, and verification reports.

## Layer Impact

- Data plane: adds a new synthetic tenant dataset under `datasets/skyharbor-air-synthetic-v1/`.
- Knowledge fabric: adds 480 Sentinel-ready enterprise context chunks and graph/provenance artifacts.
- Loader/tooling: extends the tenant substrate loader and DB audit registry to recognize `skyharbor` / `skyharbor-air`.
- Documentation: adds customer adoption, architecture, FAQ, and Azure private-load runbook docs.

## Client Applicability

- All clients: no direct runtime behavior change.
- Specific clients: SkyHarbor Air synthetic/demo tenant only.
- Internal only: generation, verification, and private Azure load scripts.
- Public/demo only: intended for airline modernization demo rehearsal and methodology review.
- Feature flag: none.

## Changes Included

- PR: `#2374`
- Commit: `fc75aaad7`
- Scripts: `scripts/skyharbor/*`, `scripts/seed/load-tenant-substrate.ts`, `scripts/audit/db-substrate-audit.mjs`
- Dataset: `datasets/skyharbor-air-synthetic-v1/`
- Docs: `docs/skyharbor/*`
- Package scripts: `generate:skyharbor-substrate`, `verify:skyharbor-substrate`, `load:skyharbor-substrate:dry`, `load:skyharbor-substrate`

## QA / Validation

- `node scripts/skyharbor/generate-skyharbor-substrate.mjs` passed.
- `node scripts/skyharbor/verify-skyharbor-substrate.mjs` passed with `records=645 chunks=480 entities=645 edges=259 provenance=645`.
- `TENANT_KEY=skyharbor npx -y -p tsx tsx scripts/seed/load-tenant-substrate.ts --dry-run` passed with 92 applications, 38 initiatives, 52 vendor contracts, and 480 chunks ready.
- `npx eslint scripts/skyharbor/generate-skyharbor-substrate.mjs scripts/skyharbor/verify-skyharbor-substrate.mjs scripts/audit/db-substrate-audit.mjs` passed.
- Forbidden-term scan found no target-carrier or cross-tenant terms in generated substrate content.

## Rollout Plan

Merge to main. No automatic production data mutation is expected. Final data load must be run from an approved Azure private runtime using `docs/skyharbor/AZURE_PRIVATE_LOAD_RUNBOOK.md`, because the Azure Postgres endpoint resolves through Private Link and is not reachable from local machines or public CI.

## Rollback Plan

Revert the PR to remove the synthetic dataset, package scripts, loader tenant registry entry, audit registry entry, and SkyHarbor documentation. If a private Azure load has already been run, remove SkyHarbor rows scoped to client ID `6f3c8d21-9b45-4f12-8d61-4b8f7c2a9301` from the affected data-plane tables.

## Audit Evidence

- HTML quality report: `datasets/skyharbor-air-synthetic-v1/verification/SUBSTRATE_QUALITY_REPORT.html`
- Verification output: `datasets/skyharbor-air-synthetic-v1/verification/`
- Provenance ledger: `datasets/skyharbor-air-synthetic-v1/provenance/provenance_ledger.jsonl`
- Customer adoption guide: `docs/skyharbor/CUSTOMER_ADOPTION_GUIDE.md`
- Azure private-load runbook: `docs/skyharbor/AZURE_PRIVATE_LOAD_RUNBOOK.md`

## Known Gaps

- Final live Azure load is pending private-network execution. Local load was attempted and failed with `getaddrinfo ENOTFOUND pg-abarva-context-lab-001.postgres.database.azure.com`, which is expected outside the Azure Private Link path.
- Full repo `tsc` still fails on pre-existing unrelated issues: PostgresCompat/Supabase test factory mismatches and missing optional Azure/PPTX packages.
