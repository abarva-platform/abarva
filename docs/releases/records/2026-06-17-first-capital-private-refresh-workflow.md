# 2026-06-17-first-capital-private-refresh-workflow - First Capital Private Refresh Workflow

## Release ID

`2026-06-17-first-capital-private-refresh-workflow`

## Status

`candidate`

## Plain-English Summary

The First Capital refresh workflow no longer tries to connect to the private Azure/Postgres data plane from a public GitHub runner. It now logs into Azure, runs the substrate loader inside the existing private ACA operator job, streams the operator logs back as evidence, and restores the operator to an idle command after every run.

This keeps monthly First Capital structured-data refreshes on the VNet path that can actually reach the database and preserves the evidence trail needed for demo readiness.

## Layer Impact

`client-data-lane`: Changes the operational path used to refresh First Capital client-scoped substrate data in Azure/Postgres.

`internal-admin`: Updates an AbarVa-operated GitHub workflow and ACA job orchestration. No product UI route changes are included.

## Client Applicability

- All clients: Not directly affected.
- Specific clients: First Capital Financial refresh runs now use the private ACA/VNet operator path.
- Internal only: GitHub Actions orchestration and Azure Container Apps operator execution.
- Public/demo only: Not applicable.
- Feature flag: Not applicable.

## Changes Included

- `.github/workflows/first-capital-refresh-load.yml`: replaces direct public-runner database access with Azure OIDC login, private ACA operator job update/start/wait/log capture, final row-count receipt, and automatic idle restore.
- `docs/releases/records/2026-06-17-first-capital-private-refresh-workflow.md`: records the release control scope and validation plan.

## QA / Validation

- PASS: Live private connectivity proof before the workflow patch: ACA execution `job-abarva-private-operator-eus-wz2j1vw` succeeded from inside the VNet and returned First Capital counts: applications=180, ai_initiatives=42, vendor_contracts=70, chunks_by_client=400, chunks_by_tenant=400, active_moves=0, active_source_events=0.
- PASS: Private operator restore after the proof run returned the shared operator to command `/bin/true` on image `acrabarvalab001.azurecr.io/abarva/web@sha256:e7668ebbb670bc014893fcc3265341cc56810c98a73b104d05ef3a079c430b3c`.
- PASS: Local whitespace validation: `git diff --check`.
- PASS: Local release validation: `npm run release:check -- --base origin/main --head HEAD`.
- NOT RUN: Post-merge validation will dispatch `First Capital refresh load` on `main` with `dry_run=false` and verify the workflow finishes with a `firstcapital_refresh_receipt` log.

## Rollout Plan

Merge to `main`. The workflow change becomes active immediately for manual `First Capital refresh load` dispatches. It does not require a product runtime feature flag. A main-branch deploy may rebuild the app image through the normal ACA pipeline, but the functional change is the GitHub workflow orchestration.

## Rollback Plan

Revert this workflow commit to restore the previous direct-runner workflow. If an operator run fails mid-flight, rerun the restore step or apply the generated idle operator YAML to reset `job-abarva-private-operator-eus` to `/bin/true`.

## Audit Evidence

- Private VNet proof execution: `job-abarva-private-operator-eus-wz2j1vw`.
- First Capital live client row observed in the proof run: `id=09d9a267-e89c-4fe1-831f-337a62787ec5`, `tenant_key=first-capital`, `slug=first-capital`, `name=First Capital Financial`.
- First Capital live counts observed in the proof run: applications=180, ai_initiatives=42, vendor_contracts=70, chunks_by_client=400, chunks_by_tenant=400, active_moves=0, active_source_events=0.
- Private operator restored to idle after the proof run.

## Context Ingestion Evidence

- Local artifact generated: No new client dataset artifact was generated; this release changes the refresh orchestration.
- Local parse/preflight passed: Not applicable to this workflow patch.
- Product loader/API accepted upload: Not applicable; this is the substrate loader/operator path.
- Azure Blob/object storage staged original files: Not run.
- Queue/private worker handoff happened: GitHub now hands off to the private ACA operator job.
- Parser extracted text/tables/facts with source citations: Not changed by this workflow patch.
- Review/approval queue received evidence: Not changed by this workflow patch.
- Context rows/facts/chunks committed to the client data plane: The proof run verified existing committed First Capital counts; the post-merge workflow dispatch will refresh and prove the same state.
- Embeddings/search index refreshed: The workflow enforces a live embedding credential check, but the proof run did not refresh embeddings.
- Live signed-in retrieval or answer QA proved context is usable: Still not complete in this patch.

## Known Gaps

The workflow still needs to be dispatched on `main` after merge to produce a durable GitHub Actions artifact for the refreshed First Capital run. Signed-in retrieval QA for First Capital remains a separate required proof before calling Intelligence/Tower fully demo-proven.
