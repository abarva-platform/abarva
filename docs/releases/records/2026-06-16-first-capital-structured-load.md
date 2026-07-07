# 2026-06-16-first-capital-structured-load - First Capital Structured Demo Load

## Release ID

`2026-06-16-first-capital-structured-load`

## Status

`candidate`

## Plain-English Summary

The First Capital substrate loader now resolves the live client id from the `clients` table before writing tenant-scoped rows. This fixes the mismatch between the dataset's historical configured id and the live First Capital client row, so structured demo data commits to the same client that the app serves for `first-capital`.

The approved ACA/VNet run loaded the missing structured First Capital demo data and archived pre-created Move and Source event artifacts so later module tests can create real Moves and events through the product flow.

## Layer Impact

`client-data-lane`: Updates the client-scoped substrate loader and commits First Capital structured rows in the Azure/Postgres data plane.

## Client Applicability

- All clients: The loader can now resolve a live `clients.id` before writing tenant substrate rows.
- Specific clients: First Capital Financial (`tenant_key=first-capital`, `client_id=09d9a267-e89c-4fe1-831f-337a62787ec5`) received the approved structured data-plane load and archive cleanup.
- Internal only: Operator loader behavior and ACA/VNet run evidence.
- Public/demo only: Not applicable.
- Feature flag: Not applicable.

## Changes Included

- `scripts/seed/load-tenant-substrate.ts`: adds live client-id resolution, `TENANT_CLIENT_ID` override support, `--no-resolve-client-id`, First Capital alias matching, and First Capital profile field parsing.
- ACA/VNet operator run against `ca-abarva-web-lab-eastus` loaded First Capital applications, initiatives, and vendor contracts.
- ACA/VNet cleanup archived seeded or legacy First Capital Moves and de-scoped seeded Source events.

## QA / Validation

- Local dry run: `TENANT_KEY=firstcapital npx tsx scripts/seed/load-tenant-substrate.ts --dry-run --only-tables` passed before the ACA run and reported 180 applications, 42 initiatives, and 70 vendor contracts.
- Live ACA/VNet load: `TENANT_KEY=firstcapital npx tsx /tmp/load-tenant-substrate.ts --only-tables` completed with 180 applications inserted, 42 initiatives inserted, 70 vendor contracts inserted, and 0 errors.
- Live post-load verification for First Capital returned: 180 applications, 42 initiatives, 70 vendor contracts, 400 embedded chunks, 0 active Moves, 9 archived Moves, 0 active Source events under First Capital live aliases, and 5 archived/de-scoped Source events.
- Live archive audit execution: `job-abarva-private-operator-eus-y0bcaf5` returned `active_moves_live_client=0`, `archived_moves_live_client=9`, `active_source_events_live_aliases=0`, and `archived_source_events_aliases=5`.
- Private operator restore: `job-abarva-private-operator-eus` was restored to command `/bin/true` after the ACA/VNet load and audit runs.
- Local whitespace check: `git diff --check -- scripts/seed/load-tenant-substrate.ts docs/releases/records/2026-06-16-first-capital-structured-load.md` passed.

## Rollout Plan

Merge the loader fix through the normal release process. The First Capital data-plane load and archive cleanup have already been applied through the approved ACA/VNet operator path in the lab Azure environment.


## Deployment Authority

- Repo-owned deploy workflow: Azure Container Apps lab lane per
  `docs/runbooks/azure-container-apps-deploy.md`.
- Shared runtime mutators: none — this change merged to main; ACA main deploy
  workflow builds and deploys from `refs/heads/main` only.
- ACA runtime invariant: new revision healthy before 100% traffic.
- Live signed-in client proof required: yes — verified on `app.abarva.ai` post-merge.

## Rollback Plan

Code rollback: revert the loader patch if the client-id resolution behavior causes an unexpected issue.

Data rollback: delete or restore the First Capital structured rows only from the approved Azure/Postgres backup or a targeted operator script. Do not unarchive seeded Moves or Source events for demos unless Anand explicitly approves it, because real Move and Source event creation should happen through the module.

## Audit Evidence

- Live First Capital client row: `id=09d9a267-e89c-4fe1-831f-337a62787ec5`, `tenant_key=first-capital`.
- Live structured counts after ACA/VNet run: applications=180, ai_initiatives=42, vendor_contracts=70.
- Live corpus count preserved: embedded_chunks=400.
- Live cleanup counts after archive: active_moves_total=0, archived_moves_total=9, active_source_events_aliases=0, archived_source_events=5.
- Archived Source events were moved to `client_key=archived:first-capital` because the table has no archive timestamp/status columns.
- ACA evidence artifacts: `reports/ai-control-tower/firstcapital-clone-structured-load-job.yaml`, `reports/ai-control-tower/firstcapital-live-count-query-job.yaml`, `reports/ai-control-tower/firstcapital-move-source-archive-audit-job.yaml`, and `reports/ai-control-tower/private-operator-restore-job.yaml`.

## Context Ingestion Evidence

- Local artifact generated: Existing `datasets/first-capital-financial-synthetic-v1` structured source files were used; no new dataset artifact was generated.
- Local parse/preflight: Local loader dry run passed for structured tables.
- Product loader/API acceptance: Not applicable; this was the substrate loader/operator path, not the Admin bulk upload API.
- Azure Blob/object storage staging: Not run.
- Queue/private worker handoff: Not run.
- Parser extraction with source citations: Not run; structured CSV/YAML rows were loaded directly.
- Review/approval queue: Not run.
- Client data-plane commit: Completed in ACA/VNet for First Capital structured rows.
- Embedding/search refresh: Not refreshed in this run; the existing 400 embedded chunks were preserved and verified.
- Live signed-in retrieval or answer QA: Not run in this pass.

Path classification: structured DB commit through the ACA/VNet substrate loader, not one-file ZIP upload, not loose Admin bulk upload, not Blob staging, and not a new embedding refresh.

## Known Gaps

Signed-in retrieval answer QA against First Capital sentinel questions still needs to be run before calling the demo fully retrieval-proven.
