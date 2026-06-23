# 2026-06-23-v4-graph-loader-aliases — V4 Graph Relationship Loader Aliases

## Release ID

`2026-06-23-v4-graph-loader-aliases`

## Status

`candidate`

## Plain-English Summary

The tenant v4 graph files use `edge_id`, `from`, `to`, and `relationship/type` fields, while the existing graph loader only understood the older `relationship_key`, `from_record_key`, and `to_record_key` fields. This change lets the loader read both formats so v4 tenant loads create active relationship rows instead of silently skipping every edge.

## Layer Impact

- `client-data-lane`: Changes the context-ingestion graph loader used by tenant dataset loads and Admin manifest loads. It does not change the product UI directly.

## Client Applicability

- All clients: Any tenant loaded from a v4 graph JSONL pack benefits from the alias support.
- Specific clients: Lakeshore Holdings is the immediate live repair target because its v4 dataset loaded records/facts/chunks but failed the Home KNOW data gate with zero relationships.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/context-ingestion/jsonl-graph-loader.ts`: normalizes old and v4 relationship graph row shapes before resolving record IDs and upserting `enterprise_context_relationships`.
- `src/lib/context-ingestion/__tests__/jsonl-graph-loader.test.ts`: regression coverage for both legacy and v4 graph JSONL rows.

## QA / Validation

- `npm test -- --runTestsByPath src/lib/context-ingestion/__tests__/jsonl-graph-loader.test.ts --runInBand` — passed, 2 tests.
- `npx eslint src/lib/context-ingestion/jsonl-graph-loader.ts src/lib/context-ingestion/__tests__/jsonl-graph-loader.test.ts` — passed.
- Live pre-fix evidence: Lakeshore v4 load succeeded with 1,032 records, 11,781 facts, 1,032 chunks, but Home KNOW data gate failed because `enterprise_context_relationships` was 0.

## Rollout Plan

Merge to main, allow the repo-owned Azure Container Apps deploy workflow to build and deploy the image, then rerun the Lakeshore v4 load inside the private VNet using the deployed image. After the reload, rerun `scripts/qa/home-know-data-gate.mjs` inside the VNet and proceed to browser proof only if all five tenants pass.

## Deployment Authority

- Repo-owned deploy workflow: Required for the shared ACA web image before the VNet load job uses this loader fix.
- Shared runtime mutators: The VNet job may be temporarily pointed at the deployed image and loader command, then restored to the migration command.
- Approved image digest: To be captured from ACA after merge/deploy.
- ACA runtime invariant: Template image, active revision image, and 100% traffic revision must match the merged main image before proof.
- Worker image invariant: The VNet job image must match the deployed web image used for the repair run.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, after the five-tenant data gate passes.

## Rollback Plan

Revert this PR and redeploy the prior image. If relationship rows are loaded by the fixed parser and a rollback is required, tenant-scoped reload/reset can remove and reload that tenant context using the prior approved loader behavior.

## Audit Evidence

- PR URL: To be added after PR creation.
- CI: To be added after PR checks.
- VNet proof target: Lakeshore Home KNOW data gate should move from `relationships=0` to non-zero after deploy and reload.

## Known Gaps

- This does not repair source graph files that reference nonexistent record IDs. It only fixes the confirmed v4 field-name mismatch.
