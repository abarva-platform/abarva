# 2026-06-02-source-generated-memo-persistence — Persist generated Source artifacts into stored documents

## Release ID

`2026-06-02-source-generated-memo-persistence`

## Status

`candidate`

## Plain-English Summary

This release makes Source AI generation persist a real document record instead of only updating the in-canvas draft body. After `Generate with Sentinel` succeeds, the generated markdown is uploaded to object storage, registered in `source_artifacts`, and returned to the canvas so the `Stored documents` shelf reflects the saved artifact immediately.

## Layer Impact

- `global-control-lane`: the Source generation route and Source canvas shelf behavior are shared application behavior.
- `client-data-lane`: generated artifact bytes and registry rows are client-scoped records written into the existing Source artifact registry.

## Client Applicability

- All clients: receive persisted generated Source artifacts and immediate shelf refresh after successful generation.
- Specific clients: none.
- Internal only: none.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/generate-from-claude/route.ts`: uploads generated markdown to the `source-artifacts` bucket, registers a `source_artifacts` row, and returns the registry record in the response payload.
- `src/components/source/canvas/UniversalCanvasShell.tsx`: tracks registry artifacts in client state and prepends newly persisted generated documents into the `Stored documents` shelf without a full page revalidate.

## QA / Validation

- PASS: `npx eslint src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/generate-from-claude/route.ts src/components/source/canvas/UniversalCanvasShell.tsx`
- PASS: `git diff --check`
- INFO: `npx tsc --noEmit --pretty false` is currently blocked by a repo-baseline missing module error in `tests/accessibility/public-axe.spec.ts` for `@axe-core/playwright`; unrelated to this slice.

## Rollout Plan

Merge to `main`, then deploy the Next.js app to production through the standard Vercel production deployment path. No database migration is required.

## Rollback Plan

Revert the application commit. The generated `source_artifacts` rows already written before rollback remain as valid stored documents.

## Audit Evidence

After merge, inspect the PR diff, CI output, Vercel deployment, and a signed-in Source session where `Generate with Sentinel` creates a new row under `Stored documents` for the generated artifact.

## Known Gaps

This slice persists generated artifacts but does not add new end-to-end coverage for the client-side shelf refresh path yet.
