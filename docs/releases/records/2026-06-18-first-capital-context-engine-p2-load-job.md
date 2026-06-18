# 2026-06-18-first-capital-context-engine-p2-load-job - First Capital V2 ACA Seed Job

## Release ID

`2026-06-18-first-capital-context-engine-p2-load-job`

## Status

`candidate`

## Plain-English Summary

This release adds the ACA seed job that will load the First Capital Financial V2 context dataset into the Azure/Postgres client data plane. The job is tenant-scoped, deletes only First Capital context rows, stages every source file to Blob, commits the 19 base dimensions plus the AI Control Tower supplement, and loads relationship graph edges last.

## Layer Impact

`client-data-lane`: Adds an executable data-plane load job for First Capital Financial. The job mutates only the `first-capital` tenant context tables when run inside ACA/VNet.

## Client Applicability

- All clients: No runtime behavior changes unless the job is explicitly run with another tenant configuration.
- Specific clients: First Capital Financial.
- Internal only: ACA/operator seed job.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- Adds `scripts/jobs/load-first-capital-v2.ts`.
- Adds `Dockerfile.seed` so ACR can build a seed-job image without requiring a full web build.
- Deletes existing First Capital enterprise context rows in FK-safe order.
- Loads YAML, CSV, Tower supplement CSVs, and JSONL graph edges.
- Stages each source file to `context-drops` before DB commit.
- Prints a JSON receipt with deleted row counts, per-file counts, Blob staging status, and load totals.

## QA / Validation

- Pass: `npx tsc --noEmit --pretty false`.
- Pass: `npm run release:check -- --base origin/main --head HEAD`.
- Pass: `git diff --check`.
- Pass: First Capital V2 manifest parse smoke proved 29 ordered entries, 1 YAML profile record, 413 CSV rows, and 151 graph edges are discoverable from the committed dataset plus Tower supplement injection.
- Not run: ACA/VNet job execution; this PR adds the job script but does not run it locally.

## Rollout Plan

Merge after local and CI validation. Build the seed image with `az acr build`, run the ACA job inside the VNet with `TENANT_KEY=first-capital`, `CLIENT_ID=a75687bf-71b9-4524-ab4e-68ae3f28d200`, and `DATASET_PATH=datasets/first-capital-financial-synthetic-v2`, then capture the JSON receipt from Log Analytics.

## Rollback Plan

Before the ACA job runs, revert this PR. After the job runs, use the tenant-scoped delete order in the job to clear First Capital context rows, then redeploy the previous loader image if needed. Do not delete shared clients, users, memberships, organizations, moves, or source events.

## Audit Evidence

- PR URL: Pending.
- CI run: Pending.
- Typecheck: Passed locally with `npx tsc --noEmit --pretty false`.
- Release check: Passed locally with `npm run release:check -- --base origin/main --head HEAD`.
- Static diff check: Passed locally with `git diff --check`.
- Manifest parse smoke: Passed locally; 29 files, 1 YAML profile, 413 CSV rows, 151 graph edges.
- ACA load receipt: Pending.
- Golden-question smoke: Pending for Phase 4.

## Known Gaps

This release does not run the job, refresh embeddings, expose the Admin explorer summary, or prove signed-in retrieval. Those remain the post-merge ACA execution and Phases 3-4.
