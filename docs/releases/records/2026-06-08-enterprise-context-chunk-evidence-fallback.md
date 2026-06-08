# 2026-06-08-enterprise-context-chunk-evidence-fallback — Count chunk evidence for promoted Enterprise Context tenants

## Release ID

`2026-06-08-enterprise-context-chunk-evidence-fallback`

## Status

`candidate`

## Plain-English Summary

Enterprise Context now reports committed Admin-loaded chunks as evidence when a tenant already has structured records and facts but the normalized evidence table has not been materialized yet. This keeps the Intelligence Enterprise Context surface from showing promoted records and facts alongside `0` evidence when source-backed chunks are already committed for retrieval.

## Layer Impact

- `global-control-lane`: Updates the shared Enterprise Context read-model used by the Intelligence surface.
- `client-data-lane`: Improves visibility of existing client-scoped context rows. It does not create, mutate, or delete client data.

## Client Applicability

- All clients: Any tenant with promoted `enterprise_context_records` and source-backed `enterprise_context_chunks`.
- Specific clients: Lakeshore Holdings is the immediate verification target.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/enterprise-context/intelligence-read-model.ts`
- `src/lib/enterprise-context/__tests__/intelligence-read-model.test.ts`
- Release record for this controlled read-model fix.

## QA / Validation

- PASS: Focused Enterprise Context read-model tests.
- PASS: ESLint on touched source and test files.
- PASS: TypeScript check.
- PASS: `git diff --check`
- PASS: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to `main`, build the Azure Container Apps image from merged main, deploy to the Azure web runtime, and verify Lakeshore Enterprise Context read-model proof from the in-VNet operator job.

## Rollback Plan

Revert the PR and redeploy the previous Azure image. No database rollback is required because this is a read-only presentation/read-model change.

## Audit Evidence

- PR and CI checks for this change.
- Azure `/api/health` after deploy.
- In-VNet operator read-model proof showing Lakeshore counts for sources, records, facts, chunks/evidence, and Sentinel facts.

## Known Gaps

This does not populate Art of Possible opportunity bands, Tower sequencing substrate, or Strategic Moves. Those module-specific substrates remain separate work.
