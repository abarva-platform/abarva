# 2026-06-04-source-document-link-routing — Source Document Link Routing

## Release ID

`2026-06-04-source-document-link-routing`

## Status

`candidate`

## Plain-English Summary

Source document links now resolve through the same document naming convention the canvas uses. A clicked artifact can be addressed by its canonical document code, such as `d01_strategy_memo`, or by a stored upload/registry id. Previously, the artifact detail page only understood stored ids, so valid document-code links could land on an error page even though the document type existed in the event workspace.

The Source canvas also no longer labels `outline` artifact maturity as "In progress" beside an `Approved` workflow pill. The maturity labels are now buyer-safe (`Template`, `Prepared`, `Authored`) so the UI does not imply that an approved upstream artifact is still unfinished.

## Layer Impact

- `global-control-lane`: Updates Source server-side document resolution shared by Source event pages.
- `client-data-lane`: No schema, migration, seed, or tenant data change. Existing tenant scoping remains enforced by resolving the event first and only rendering registry records that belong to that event.

## Client Applicability

- All clients: Source event artifact detail routes receive the fix.
- Specific clients: Apex Retail AMS was the observed failure path and regression case.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/source/queries.ts`: `getSourcingEventArtifact` now accepts canonical artifact codes, per-event artifact-state ids, linked registry ids, and uploaded artifact ids while preserving event ownership checks.
- `src/lib/source/queries.ts`: Adds canonical template fallback so known document types render a governed workspace/template instead of failing when no uploaded file is linked yet.
- `src/lib/source/__tests__/queries-tenant-scope.test.ts`: Adds regression coverage for resolving `d01_strategy_memo` from the Apex AMS event-code URL.
- `src/components/source/canvas/workspace-tabs/DocumentTab.tsx`: Replaces confusing tier labels (`In progress`, `Draft`) with buyer-safe artifact-maturity labels (`Prepared`, `Template`).
- `src/__tests__/integration/source/source-event-canvas-render.test.tsx`: Adds regression coverage that an approved outline artifact does not render "In progress."

## QA / Validation

- `npx jest src/lib/source/__tests__/queries-tenant-scope.test.ts --runInBand` — passed, 10/10 tests.
- `npx jest src/__tests__/integration/source/source-event-canvas-render.test.tsx --runInBand` — passed, 23/23 tests.
- `npx eslint src/lib/source/queries.ts src/lib/source/__tests__/queries-tenant-scope.test.ts` — passed.
- `npx tsc --noEmit --pretty false --incremental false` — Source touched files passed; full repo check remains blocked by pre-existing missing packages `@azure-rest/ai-document-intelligence` and `@axe-core/playwright`.

## Rollout Plan

Merge to `main`, allow the Vercel production deployment to complete, then smoke a Source artifact detail URL under the production alias for the Apex AMS event.

## Rollback Plan

Revert the merge commit or redeploy the previous successful Vercel production deployment. No database rollback is required.

## Audit Evidence

- Focused Jest output in PR checks.
- Vercel production deployment for the merge commit.
- Post-deploy smoke of a canonical document-code route such as `/source/events/apex-retail-ams-outsourcing-2026/artifacts/d01_strategy_memo`.

## Known Gaps

Full TypeScript still reports unrelated missing dependency declarations in the current repository state: Azure Document Intelligence SDK and Playwright axe integration. This release does not add or remove those dependencies.
