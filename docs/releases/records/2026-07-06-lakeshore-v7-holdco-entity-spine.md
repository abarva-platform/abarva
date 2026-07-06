# 2026-07-06-lakeshore-v7-holdco-entity-spine — Lakeshore V7 Holdco Entity Spine

## Release ID

`2026-07-06-lakeshore-v7-holdco-entity-spine`

## Status

`candidate`

## Plain-English Summary

This candidate corrects the Lakeshore V7 data model for a holding-company tenant. The prior V7 substrate had some portfolio-company names, but they were not modeled as a governed hierarchy across Enterprise Profile, functions, systems, roles, personas, vendors, spend, relationships, and retrieval. This release adds a first-class portfolio-company entity spine and regenerates Lakeshore synthetic data with enough depth to support a realistic $7B industrial holding-company CIO / VP Innovation / CFO demo.

## Layer Impact

- `client-data-lane`: Adds a repo-owned Lakeshore V7.1 synthetic holdco pack under `datasets/lakeshore-industries-synthetic-v7-holdco/`.
- `client-data-lane`: Adds the required entity-spine SQL extension for `intelligence_v7` so Azure Postgres can query `entity_id`, `parent_entity_id`, and entity coverage directly.
- `client-data-lane`: Adds an ACA-job-safe V7.1 loader script that defaults to the baked Lakeshore payload and applies the entity-spine SQL extension after load.
- `global-control-lane`: Updates the Home V7 browser read-model labels so a loaded entity spine appears as `Portfolio Company Hierarchy`.
- `global-control-lane`: Hardens Home V7 dimension selection to derive visible dimensions from actual tenant records, then use the registry for labels/metadata, so a newer Lakeshore contract does not hide older validated V7 records for other tenants.

## Client Applicability

- All clients: The Home V7 browser can display a first-class portfolio entity registry when loaded.
- Specific clients: Lakeshore Holdings / Industrial Demo receives the regenerated holdco synthetic pack.
- Internal only: The generator, hygiene report, Azure payload, and client intake workbook are release artifacts.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `scripts/v7/build-lakeshore-holdco-v7.mjs`
- `scripts/v7/load-lakeshore-holdco-v7-azure.mjs`
- `scripts/v7/sql/intelligence-v7-holdco-entity-spine.sql`
- `datasets/lakeshore-industries-synthetic-v7-holdco/`
- `src/lib/home/v7-context-browser.ts`
- `src/lib/home/__tests__/v7-context-browser.test.ts`
- `package.json` scripts:
  - `v7:lakeshore:holdco:build`
  - `v7:lakeshore:holdco:validate`
  - `v7:lakeshore:holdco:azure-load`

## QA / Validation

- `npm run v7:lakeshore:holdco:validate` — Pass.
- Hygiene summary — Pass:
  - 25 files
  - 2,974 rows
  - 8 entity rows
  - 7 named portfolio companies
  - 96 business functions
  - 116 org ownership rows
  - 82 workforce personas
  - 150 application/system rows
  - 522 relationship edges
  - 595 function/system/data/vendor bridge rows, including OpCo consumption of corporate shared systems
  - 0 hygiene errors
- Corporate shared application coverage — Pass:
  - 24 holdco-owned shared-service systems
  - 18 local systems per named portfolio company
  - Every corporate shared-service system lists all 7 served portfolio companies
  - Every portfolio company has at least 12 corporate-shared-system consumption bridge rows
- `npx jest src/lib/home/__tests__/v7-context-browser.test.ts --runInBand` — Pass after linking existing local `node_modules` into the clean worktree.
- `node --check scripts/v7/load-lakeshore-holdco-v7-azure.mjs` — Pass.
- Client workbook formula-error scan — Pass, 0 formula errors.
- Client workbook visual preview — Pass for entity registry and applications/systems sheets.

## Rollout Plan

1. Review and merge this candidate.
2. Build a digest-pinned ACA image from the merged SHA.
3. Run `npm run v7:lakeshore:holdco:azure-load` through the approved ACA Job/operator path so Azure Postgres is mutated only inside the private VNet.
4. Run Azure readback validation for `intelligence_v7.current_entity_registry`, `entity_dimension_coverage`, `business_records`, `relationship_edges`, and `chunk_registry`.
5. Only after readback passes, browser-test Home for Lakeshore and then move to Intelligence/Tower proof.

## Deployment Authority

- Repo-owned deploy workflow: Not required for data-only reload; required only if the Home read-model change is deployed.
- Shared runtime mutators: Azure Postgres schema extension and V7 loader job.
- Approved image digest: Not assigned yet.
- ACA runtime invariant: Not applicable until app deploy.
- Worker image invariant: V7 loader image must be pinned when reload is executed.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, after Azure reload and app deploy.

## Rollback Plan

- Data rollback: Mark the V7.1 Lakeshore run as superseded and restore traffic/read-model use to the prior validated V7.0 contract.
- Schema rollback: The SQL extension is additive. If needed, stop using the new views/columns; do not drop columns during active proof unless a DBA/operator approves.
- App rollback: Revert the Home V7 browser display change or redeploy the prior ACA image.

## Audit Evidence

- `datasets/lakeshore-industries-synthetic-v7-holdco/V7_HOLDCO_HYGIENE_REPORT.json`
- `datasets/lakeshore-industries-synthetic-v7-holdco/V7_HOLDCO_HYGIENE_REPORT.html`
- `datasets/lakeshore-industries-synthetic-v7-holdco/V7_SYNTHETIC_MANIFEST.json`
- `datasets/lakeshore-industries-synthetic-v7-holdco/azure/v7-holdco-azure-load-payload.json`
- Client workbook: `/Users/anand/Downloads/lakeshore-v7-holdco-entity-spine-20260706/Lakeshore_V7_Holdco_Entity_Spine_Client_Intake.xlsx`
- Workbook previews:
  - `/Users/anand/Downloads/lakeshore-v7-holdco-entity-spine-20260706/entity-registry-preview.png`
  - `/Users/anand/Downloads/lakeshore-v7-holdco-entity-spine-20260706/systems-preview.png`

## Known Gaps

- Azure reload has not been executed yet.
- ACA production deployment has not been executed yet.
- Signed-in browser proof has not been executed yet.
- This release rebuilds Lakeshore first; the same entity-spine pattern should be generalized to other holdco/multi-division tenants after Lakeshore passes Azure readback.
