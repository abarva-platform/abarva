# 2026-07-06-lakeshore-v7-holdco-entity-spine — Lakeshore V7 Holdco Entity Spine

## Release ID

`2026-07-06-lakeshore-v7-holdco-entity-spine`

## Status

`candidate`

## Plain-English Summary

This candidate corrects the Lakeshore V7 data model for a holding-company tenant. The prior V7 substrate had some portfolio-company names, but they were not modeled as a governed hierarchy across Enterprise Profile, functions, systems, roles, personas, vendors, spend, relationships, and retrieval. This release adds a first-class portfolio-company entity spine and regenerates Lakeshore synthetic data with enough depth to support a realistic $7B industrial holding-company CIO / VP Innovation / CFO demo.

## Layer Impact

- `client-data-lane`: Adds a repo-owned Lakeshore V7.1.1 synthetic holdco pack under `datasets/lakeshore-industries-synthetic-v7-holdco/`.
- `client-data-lane`: Adds the required entity-spine SQL extension for `intelligence_v7` so Azure Postgres can query `entity_id`, `parent_entity_id`, and entity coverage directly.
- `client-data-lane`: Adds an ACA-job-safe V7.1.1 loader script that defaults to the baked Lakeshore payload and applies the entity-spine SQL extension after load.
- `client-data-lane`: Hardens V7 current-run supersession so a refreshed tenant contract replaces prior active tenant runs in `current_*` read paths instead of double-counting old and new contracts.
- `global-control-lane`: Updates the Home V7 browser read-model labels so a loaded entity spine appears as `Portfolio Company Hierarchy`.
- `global-control-lane`: Hardens Home V7 dimension selection to derive visible dimensions from actual tenant records, then use the registry for labels/metadata, so a newer Lakeshore contract does not hide older validated V7 records for other tenants.
- `client-data-lane`: Regenerates the Lakeshore `tower-standardized-v1` package from the same V7.1.1 holdco spine so Tower receives portfolio-company-aware budget, initiative, vendor, system, relationship, and value-evidence rows instead of the older Lakeshore Industries package.
- `global-control-lane`: Updates the Tower standardized loader so `entity_id`, `entity_scope`, `parent_entity_id`, and portfolio-company metadata are preserved in `cio_tower.entities`, `facts`, and `relationships`.
- `global-control-lane`: Hardens the Tower standardized loader for tenant-scoped replacement so stale rows from the prior Lakeshore package do not collide with or pollute the refreshed V7.1.1 Tower substrate.

## Client Applicability

- All clients: The Home V7 browser can display a first-class portfolio entity registry when loaded.
- Specific clients: Lakeshore Holdings / Industrial Demo receives the regenerated holdco synthetic pack.
- Internal only: The generator, hygiene report, Azure payload, and client intake workbook are release artifacts.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `scripts/v7/build-lakeshore-holdco-v7.mjs`
- `scripts/v7/load-lakeshore-holdco-v7-azure.mjs`
- `scripts/v7/readback-lakeshore-holdco-v7-azure.mjs`
- `scripts/lakeshore/project-lakeshore-v7-to-tower-standardized.mjs`
- `scripts/tower/load-cio-tower-standardized-v1.mjs`
- `scripts/v7/sql/intelligence-v7-holdco-entity-spine.sql`
- `datasets/lakeshore-industries-synthetic-v7-holdco/`
- `tower-standardized-v1/lakeshore-industries/`
- `src/lib/home/v7-context-browser.ts`
- `src/lib/home/__tests__/v7-context-browser.test.ts`
- `package.json` scripts:
  - `v7:lakeshore:holdco:build`
  - `v7:lakeshore:holdco:validate`
  - `v7:lakeshore:holdco:tower-project`
  - `v7:lakeshore:holdco:azure-load`
  - `v7:lakeshore:holdco:azure-readback`

## QA / Validation

- `npm run v7:lakeshore:holdco:validate` — Pass.
- Hygiene summary — Pass:
  - 25 files
  - 3,094 rows
  - 8 entity rows
  - 7 named portfolio companies
  - 96 business functions
  - 116 org ownership rows
  - 82 workforce personas
  - 152 application/system rows
  - 529 relationship edges
  - 510 function/system/data/vendor bridge rows, including OpCo consumption of corporate shared systems
  - All 25 V7 dimensions pass explicit row-count health gates
  - 0 hygiene errors
- Corporate shared application coverage — Pass:
  - 24 holdco-owned shared-service systems
  - 16-20 local systems per named portfolio company, tailored by OpCo archetype
  - Every corporate shared-service system lists all 7 served portfolio companies
  - Every portfolio company has at least 12 corporate-shared-system consumption bridge rows
- Tower standardized package projection — Pass:
  - `npm run v7:lakeshore:holdco:tower-project` — Pass.
  - Projects 8 entities, 7 portfolio companies, 96 functions, 116 org rows, 152 systems, 96 vendors, and 36 programs into `tower-standardized-v1/lakeshore-industries/`.
  - Tower budget envelope reconciles to `$190.6M` from the entity budget spine.
  - Tower rows now carry `entity_id`, `entity_scope`, `parent_entity_id`, `portfolio_company_id`, and `portfolio_company_name`.
  - Corporate shared-service systems remain tagged to Lakeshore Holdings and list served portfolio companies; OpCo-local systems remain tagged to the individual portfolio company.
- Budget / project / people depth — Pass:
  - IT budget rows map to corporate vs OpCo spend categories, initiative refs, funding status, and value-evidence status
  - Program rows include budget, sponsor, impacted systems, value metric, and decision required
  - Org ownership rows include accountable budget, team size, escalation path, and key initiatives owned
  - Workforce persona rows include population basis, systems used, pain points, AI need, and decisions supported
- Tower loader / dashboard substrate — Pass:
  - `node --check scripts/lakeshore/project-lakeshore-v7-to-tower-standardized.mjs` — Pass.
  - `node --check scripts/tower/load-cio-tower-standardized-v1.mjs` — Pass.
  - `TOWER_STANDARDIZED_TENANTS=lakeshore-industries npm run tower:cio:load-standardized -- --dry-run` — Pass; dry-run sees 49 source files, 306 entities, 140 facts, 126 relationships, 8 measure results.
  - Tower loader replacement check — Pass; loader now deletes only the target tenant rows from `measure_results`, `relationships`, `facts`, `entities`, and `source_registry` inside the reload transaction before inserting the refreshed package.
  - Tower relationship schema compatibility — Pass; holdco-to-portfolio-company hierarchy writes through the existing allowed `owns` relationship type while retaining the precise `owns_portfolio_company` semantic label in relationship attributes.
  - `npm run tower:cio:quality` — Pass; 300/300 question checks and 1/1 integrity checks.
  - `npx jest src/lib/tower/__tests__/v7-tower-projection.test.ts --runInBand` — Pass. The duplicate Jest mock warnings are pre-existing repository warnings.
- Small-dimension health — Pass:
  - Industry/pattern corpus expanded to 24 patterns
  - Expert lenses expanded to 18 lenses
  - External benchmark corpus expanded to 24 benchmarks
  - Rate card expanded to 54 rows
  - Operational process evidence expanded to 112 rows
  - Infrastructure/cloud estate expanded to 128 rows
- `npx jest src/lib/home/__tests__/v7-context-browser.test.ts --runInBand` — Pass after linking existing local `node_modules` into the clean worktree.
- `node --check scripts/v7/load-lakeshore-holdco-v7-azure.mjs` — Pass.
- `node --check scripts/v7/readback-lakeshore-holdco-v7-azure.mjs` — Pass.
- Azure V7 readback gate now asserts exactly one active current Lakeshore tenant run, contract `v7.1.1-holdco-depth-correction-20260706`, 3,094 rows, 8 entity rows, 24 corporate shared-service systems, 128 OpCo-local systems, and shared-system bridge rows for all 7 OpCos.
- Client workbook formula-error scan — Pass, 0 formula errors.
- Client workbook visual preview — Pass for entity registry and applications/systems sheets.

## Rollout Plan

1. Review and merge this candidate.
2. Build a digest-pinned ACA image from the merged SHA.
3. Run `npm run v7:lakeshore:holdco:azure-load` through the approved ACA Job/operator path so Azure Postgres is mutated only inside the private VNet. The loader supersedes any prior active Lakeshore run before inserting the refreshed tenant pack.
4. Run Azure readback validation for `intelligence_v7.current_entity_registry`, `entity_dimension_coverage`, `business_records`, `relationship_edges`, and `chunk_registry`.
5. Run `npm run tower:cio:load-standardized` for `lakeshore-industries` through the approved ACA Job/operator path so `cio_tower` receives the regenerated Tower standardized package.
6. Run Tower readback/proof for the `cio_tower` entities, facts, relationships, measure results, and visible `/tower` budget cards.
7. Only after readback passes, browser-test Home for Lakeshore and then move to Intelligence/Tower proof.

## Deployment Authority

- Repo-owned deploy workflow: Not required for data-only reload; required only if the Home read-model change is deployed.
- Shared runtime mutators: Azure Postgres schema extension and V7 loader job.
- Approved image digest: Not assigned yet.
- ACA runtime invariant: Not applicable until app deploy.
- Worker image invariant: V7 loader image must be pinned when reload is executed.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, after Azure reload and app deploy.

## Rollback Plan

- Data rollback: Mark the V7.1.1 Lakeshore run as superseded and restore traffic/read-model use to the prior validated V7.0 or V7.1 contract.
- Schema rollback: The SQL extension is additive. If needed, stop using the new views/columns; do not drop columns during active proof unless a DBA/operator approves.
- App rollback: Revert the Home V7 browser display change or redeploy the prior ACA image.

## Audit Evidence

- `datasets/lakeshore-industries-synthetic-v7-holdco/V7_HOLDCO_HYGIENE_REPORT.json`
- `datasets/lakeshore-industries-synthetic-v7-holdco/V7_HOLDCO_HYGIENE_REPORT.html`
- `datasets/lakeshore-industries-synthetic-v7-holdco/V7_SYNTHETIC_MANIFEST.json`
- `datasets/lakeshore-industries-synthetic-v7-holdco/azure/v7-holdco-azure-load-payload.json`
- `tower-standardized-v1/lakeshore-industries/family-4-financial-commercial/F12_it-budget-financials.csv`
- `tower-standardized-v1/lakeshore-industries/derived/tower_financial_amounts.csv`
- `tower-standardized-v1/lakeshore-industries/ai-control-tower/T01_initiative-registry.csv`
- `tower-standardized-v1/lakeshore-industries/family-8-semantic-enrichment/F25_context-node-dictionary.csv`
- Tower quality report: `/private/tmp/nexus-v7-holdco-spine/out/cio-tower-quality/cio-tower-quality-report.html`
- Client workbook: `/Users/anand/Downloads/lakeshore-v7-holdco-entity-spine-20260706/Lakeshore_V7_Holdco_Entity_Spine_Client_Intake.xlsx`
- Workbook previews:
  - `/Users/anand/Downloads/lakeshore-v7-holdco-entity-spine-20260706/entity-registry-preview.png`
  - `/Users/anand/Downloads/lakeshore-v7-holdco-entity-spine-20260706/systems-preview.png`

## Known Gaps

- Azure reload has not been executed yet.
- Tower `cio_tower` Azure reload has not been executed yet.
- ACA production deployment has not been executed yet.
- Signed-in browser proof has not been executed yet.
- This release rebuilds Lakeshore first; the same entity-spine pattern should be generalized to other holdco/multi-division tenants after Lakeshore passes Azure readback.
