# 2026-05-30-retail-overlay-live-loader — Retail Overlay v1 Loader

## Release ID

`2026-05-30-retail-overlay-live-loader`

## Status

`candidate`

## Plain-English Summary

This release adds the loader that turns the Retail Overlay v1 corpus into tenant-scoped retrieval chunks for Apex Retail. In plain terms: the retail knowledge is no longer just a document; this prepares it to become searchable context for the app.

## Layer Impact

- `industry-corpus-lane`: Extracts the consolidated `retail-v1` corpus into loadable chunks.
- `data-plane-lane`: Adds an auditable loader for `enterprise_context_chunks` scoped to `tenant_key = apex-retail`.
- `qa-validation-lane`: Adds a dry-run load report proving the extraction clears the Section 6.1 chunk, pack, and category gates.
- `runtime-app-lane`: No runtime code path changes in this PR.

## Client Applicability

- All clients: No runtime behavior change in this PR.
- Specific clients: Apex Retail receives the `retail-v1` load when the loader is run with `--apply` after merge.
- Internal only: Loader and verification artifact.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `scripts/corpus-generation/load-retail-overlay-to-enterprise-context.mjs`
- `verification/retail-overlay-v1/RETAIL_OVERLAY_v1_LOAD_REPORT.md`

## QA / Validation

- PASS: Dry-run extracted 5,691 chunks.
- PASS: Dry-run preserved 5,390 pattern chunks from the consolidated overlay.
- PASS: Dry-run added 301 pack-synthesis chunks for retrieval routing.
- PASS: Dry-run represented 301 source packs and 60 super-categories.
- PASS: `npx eslint scripts/corpus-generation/load-retail-overlay-to-enterprise-context.mjs`.
- PASS: `git diff --check`.
- PENDING: PR CI.

## Rollout Plan

Merge after CI passes. Then run the loader from main with `--apply`, embed pending `apex-retail` chunks through the existing audited embedding job in Postgres-only mode, and commit the live load/embedding report.

## Rollback Plan

Code rollback: revert this PR.

Data rollback after apply: delete rows from `enterprise_context_chunks` where `tenant_key = 'apex-retail'` and `chunk_metadata->>'overlay_namespace' = 'retail-v1'`.

## Audit Evidence

- Dry-run load report: `verification/retail-overlay-v1/RETAIL_OVERLAY_v1_LOAD_REPORT.md`
- Loader: `scripts/corpus-generation/load-retail-overlay-to-enterprise-context.mjs`

## Known Gaps

The loader has not yet been run with `--apply` in this PR. Embeddings and live retrieval validation follow after merge.
