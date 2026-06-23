# 2026-06-23-v4-context-loader-aliases — V4 Context Loader Header Alignment

## Release ID

`2026-06-23-v4-context-loader-aliases`

## Status

`candidate`

## Plain-English Summary

The governed tenant context loader now understands the canonical v4 dataset headers used by the five synthetic tenant packs. This prevents v4 data from failing old template checks or falling into the wrong template shape before records, facts, chunks, and relationships are loaded.

## Layer Impact

`client-data-lane`: Updates the context-loader path and template registry used to commit tenant-scoped context rows into Azure/Postgres. No data is loaded by this PR; it makes the loader contract correct before the operational load runs.

## Client Applicability

- All clients: Applies to all five canonical v4 tenant dataset packs.
- Specific clients: Apex Retail, First Capital, Lakeshore Holdings, Meridian Health, SkyHarbor Air.
- Internal only: No.
- Public/demo only: No.
- Feature flag: No.

## Changes Included

- `scripts/jobs/load-first-capital-v2.ts` adds v4 header alias materialization, file-level load logging, manifest supplement existence checks, and a no-write `--preflight` mode.
- `src/lib/context-ingestion/template-registry.ts` registers the six v4 outcome-intelligence templates that were present in manifests but absent from the retrievable template registry.

## QA / Validation

- PASS: `npx eslint scripts/jobs/load-first-capital-v2.ts src/lib/context-ingestion/template-registry.ts`
- PASS: v4 loader preflight for all five tenant packs; each checked 23 CSV files with v4 aliases enabled.
- BLOCKED/PRE-EXISTING: `npx tsc --noEmit --pretty false` is blocked by existing missing type declarations for `js-yaml`, Azure Document Intelligence, and axe Playwright packages.

## Rollout Plan

Merge to `main`, deploy the new ACA web image through the repo-owned Azure Container Apps workflow, then rerun the Lakeshore governed v4 context load inside the VNet job using the live `clients.id` for `lakeshore-holdings`.

## Deployment Authority

- Repo-owned deploy workflow: Required for `app.abarva.ai`.
- Shared runtime mutators: ACA web image and DB migration/job image only through the approved repo workflow/job.
- Approved image digest: To be captured after deployment.
- ACA runtime invariant: Template image, active revision image, and 100% traffic revision must match.
- Worker image invariant: DB/VNet job must use the same approved image digest before live load proof.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, after the Lakeshore load and Home KNOW data gate pass.

## Rollback Plan

Revert this PR and redeploy the prior ACA image. No schema migration or data mutation is included in this PR, so rollback does not require DB rollback.

## Audit Evidence

- PR link to be added after opening.
- Local preflight output showing all five v4 tenant packs pass required-field checks.
- Follow-up live evidence: Lakeshore loader execution, Home KNOW data gate, and browser proof.

## Known Gaps

This PR does not load Lakeshore data by itself. It removes the loader/schema blocker so the VNet load can run cleanly as the next operational step.
