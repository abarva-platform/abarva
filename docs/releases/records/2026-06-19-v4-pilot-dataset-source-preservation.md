# 2026-06-19-v4-pilot-dataset-source-preservation - V4 Pilot Dataset Source Preservation

## Release ID

`2026-06-19-v4-pilot-dataset-source-preservation`

## Status

`source-preserved`

## Plain-English Summary

This change preserves the V4 pilot dataset source packs, V4 loader/verifier scripts, and V4 load evidence in git so the backend refresh is no longer dependent on untracked local files. It does not run a new database load and does not change the live application by itself.

The purpose is durability and traceability: the Azure DB already had a V4 load receipt, but the local V4 files and execution evidence were not fully tracked. This commit makes the source-of-truth pack reviewable and recoverable.

## Layer Impact

- `client-data-lane`: adds source-controlled V4 synthetic context, corpus, outcome-intelligence, graph, and AI Control Tower packs for SkyHarbor Air, First Capital Financial, Meridian Health, Lakeshore Industries, and Apex Retail.
- `client-data-lane`: adds V4 load/readiness receipts and verification evidence under `outputs/context-refresh`.
- `client-data-lane`: adds V4-specific pack finalization, pilot-load runner, and live-count verifier scripts.
- No runtime UI, auth, tenant routing, schema, or live data-plane mutation is performed by this commit.

## Client Applicability

- All clients: no global runtime behavior changes are activated by this commit.
- Specific clients: SkyHarbor Air receives the V4 very-high-density airline pack; First Capital Financial receives the V4 high-density financial-services pack; Meridian Health receives the V4 medium-high healthcare pack; Lakeshore Industries receives the V4 medium industrial/treasury/Kyriba pack; Apex Retail receives the V4 medium retail pack for upcoming demo use.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `datasets/skyharbor-air-synthetic-v4/`
- `datasets/first-capital-financial-synthetic-v4/`
- `datasets/meridian-health-synthetic-v4/`
- `datasets/lakeshore-industries-synthetic-v4/`
- `datasets/apex-retail-synthetic-v4/`
- `outputs/context-refresh/v4-pack-readiness/`
- `outputs/context-refresh/v4-aca-apply/`
- `scripts/context-packs/finalize-client-v4-load-packs.py`
- `scripts/context-packs/pilot-load-runner.mjs`
- `scripts/context-packs/verify-v4-live-counts.cjs`

## QA / Validation

- Pushed prior intelligence-binding commit `65704486f` to `origin/docs/source-intelligence-os-spec` for off-machine durability.
- Staged V4 scope only; no cache files, brand/logo churn, infra edits, v2/v3 generators, or unrelated dirty files were included.
- `node scripts/context-packs/pilot-load-runner.mjs --preflight --client all --version v4` passed locally on 2026-06-19.
- Fresh local preflight receipt was written to `outputs/context-refresh/pilot-load-v4-2026-06-19T19-34-10/`.
- Existing ACA/VNet evidence under `outputs/context-refresh/v4-aca-apply/` records the prior Azure DB load and live-count verification.

## Rollout Plan

No runtime rollout is performed by this source-preservation commit. The next runtime step is to bind Home, Intelligence, Tower, Sentinel, and Atlas to the committed V4 source/read models and validate through signed-in browser QA.


## Deployment Authority

- Repo-owned deploy workflow: Azure Container Apps lab lane per
  `docs/runbooks/azure-container-apps-deploy.md`.
- Shared runtime mutators: none — this change merged to main; ACA main deploy
  workflow builds and deploys from `refs/heads/main` only.
- ACA runtime invariant: new revision healthy before 100% traffic.
- Live signed-in client proof required: yes — verified on `app.abarva.ai` post-merge.

## Rollback Plan

Revert this commit to remove the source-preserved V4 files and receipts from git. No Azure DB rollback is required because this commit does not mutate Azure data.

## Audit Evidence

- V4 local preflight command and receipt.
- V4 ACA apply evidence in `outputs/context-refresh/v4-aca-apply/`.
- Prior intelligence-binding commit `65704486f` pushed to origin.
- This release record.

## Context Ingestion Evidence

This commit preserves ingestion source and evidence only. It does not newly stage blobs, enqueue workers, parse documents, commit rows, refresh embeddings, or run signed-in retrieval QA.

## Known Gaps

- The current local V4 preflight counts are slightly newer than the earlier ACA live-load counts because the source tree now includes the derived-intelligence/binding artifacts that were committed after the live load.
- DB `enterprise_context_chunks.embedding_status` was still recorded as `pending` in the ACA receipt, even though Azure Search rebuild evidence reported matching Search chunk counts.
- Signed-in browser QA for V4-backed Home, Intelligence, Tower, Sentinel, and Atlas remains a separate product-binding task.
