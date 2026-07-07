# 2026-06-17-first-capital-private-refresh-workflow - First Capital Private Refresh Workflow

## Release ID

`2026-06-17-first-capital-private-refresh-workflow`

## Status

`completed`

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
- FAIL, then fixed: First post-merge workflow dispatch `27698682569` failed before operator start because shell expanded SQL placeholders like `$1` in the generated receipt command and the restore YAML indentation was over-stripped. The follow-up patch escapes the SQL placeholders and preserves YAML indentation.
- FAIL, then fixed: Second workflow dispatch `27699679607` successfully ran the private loader and insight evaluator, but failed when the optional population audit attempted to write to read-only `/app/docs/build/data-quality` inside the immutable app image. The follow-up patch makes the audit output directory configurable and points the private workflow to `/tmp/abarva-data-quality`.
- FAIL, then fixed: Third workflow dispatch `27700490190` reported success but started an idle shared-operator execution because the shared `job-abarva-private-operator-eus` template can be restored by concurrent deploy/operator activity between update and start. The follow-up patch creates a unique ephemeral ACA job per workflow run (`fc-refresh-${GITHUB_RUN_ID}`), starts that job, captures logs with Azure's supported `--tail 300`, and deletes the one-off job afterward.
- FAIL, then fixed: Fourth workflow dispatch `27701532924` failed before creating the ephemeral ACA job because Azure CLI still requires `--name` with `az containerapp job create --yaml`. The follow-up patch passes `--name "$PRIVATE_REFRESH_JOB"` explicitly.
- FAIL, then fixed: Fifth workflow dispatch `27702192515` failed while provisioning the ephemeral ACA job because newly created jobs need the user-assigned identity attached at the job root. The follow-up patch adds the same `UserAssigned` identity block used by the existing private operator.
- FAIL, then fixed: Sixth workflow dispatch `27702808240` successfully ran the loader, embedded 400/400 chunks, inserted 180 applications, inserted 42 initiatives, inserted 70 vendor contracts, and wrote 27 context insights, but failed when the existing app image ran an older population-audit script that still wrote to read-only `/app/docs/build/data-quality`. The follow-up patch replaces that optional image-baked script call with an inline Postgres population audit that writes under `/tmp` and prints a `firstcapital_population_audit` event into the captured ACA log.
- PASS: Final post-merge workflow dispatch `27703561448` completed successfully on `main` with `dry_run=false`, `require_live_embeddings=true`, `evaluate_insights=true`, and `run_population_audit=true`. The private ACA execution `fc-refresh-27703561448-df8stfx` succeeded, the ephemeral job was deleted, and the evidence artifact uploaded.

## Rollout Plan

Merge to `main`. The workflow change becomes active immediately for manual `First Capital refresh load` dispatches. It does not require a product runtime feature flag. A main-branch deploy may rebuild the app image through the normal ACA pipeline, but the functional change is the GitHub workflow orchestration.

## Rollback Plan

Revert this workflow commit to restore the previous direct-runner workflow. If an operator run fails mid-flight, rerun the restore step or apply the generated idle operator YAML to reset `job-abarva-private-operator-eus` to `/bin/true`.

## Audit Evidence

- Private VNet proof execution: `job-abarva-private-operator-eus-wz2j1vw`.
- Failed first post-merge workflow dispatch, before loader execution: GitHub Actions run `27698682569`.
- Failed second post-merge workflow dispatch, after successful loader execution but before final receipt: GitHub Actions run `27699679607`, ACA execution `job-abarva-private-operator-eus-81feota`.
- Misleading successful third workflow dispatch, idle shared-operator execution rather than refresh execution: GitHub Actions run `27700490190`, ACA execution `job-abarva-private-operator-eus-oin1n4u`.
- Failed fourth workflow dispatch, before ephemeral job creation: GitHub Actions run `27701532924`.
- Failed fifth workflow dispatch, during ephemeral job provisioning: GitHub Actions run `27702192515`.
- Failed sixth workflow dispatch, after successful loader execution but before final workflow success: GitHub Actions run `27702808240`.
- Successful final workflow dispatch: GitHub Actions run `27703561448`, ACA execution `fc-refresh-27703561448-df8stfx`, evidence artifact `first-capital-refresh-load`.
- Final loader counts: chunks upserted=400, embedded=400, failed=0; applications inserted=180; initiatives inserted=42; vendor contracts inserted=70.
- Final insight evaluation counts: factsActive=6072, dimensionsLoaded=7, evaluated=6, fired=5, written=27, errors=[].
- Final population audit counts: applications=180, ai_initiatives=42, vendor_contracts=70, context_chunks_by_client=400, context_chunks_by_tenant=400, context_insights_active=15, active_moves=0, active_source_events=0.
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
- Context rows/facts/chunks committed to the client data plane: Final workflow dispatch `27703561448` refreshed and proved committed First Capital counts in Azure/Postgres.
- Embeddings/search index refreshed: Final workflow dispatch `27703561448` embedded 400/400 chunks with 0 failures.
- Live signed-in retrieval or answer QA proved context is usable: Still not complete in this patch.

## Known Gaps

The workflow dispatch and durable GitHub Actions artifact are complete for the refreshed First Capital run. Signed-in retrieval QA for First Capital remains a separate required proof before calling Intelligence/Tower fully demo-proven.
