# 2026-06-02-admin-context-layer-shell — Admin Context Layer Shell

## Release ID

`2026-06-02-admin-context-layer-shell`

## Status

`candidate`

## Plain-English Summary

The reload-related Context Layer pages now live inside the canonical Admin workspace shell. Templates, Uploads, Approval Queue, Syncs, and Evidence Map keep the same tenant-scoped reads, but no longer render as detached full-window pages. The template explorer also shows which surfaces each template unlocks.

## Layer Impact

- `global-control-lane`: Admin control-plane presentation and source guards only. No data-plane mutation, migration, live Azure call, or private data load is introduced.

## Client Applicability

- All clients: yes, for Admin users viewing the active-client Admin Context Layer.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/app/(maestro)/admin/context-layer/layout.tsx`
- `src/app/(maestro)/admin/context-layer/page.tsx`
- `src/app/(maestro)/admin/context-layer/templates/page.tsx`
- `src/app/(maestro)/admin/context-layer/uploads/page.tsx`
- `src/app/(maestro)/admin/context-layer/approval-queue/page.tsx`
- `src/app/(maestro)/admin/context-layer/syncs/page.tsx`
- `src/app/(maestro)/admin/context-layer/evidence-map/page.tsx`
- `src/app/(maestro)/admin/context-layer/__tests__/layout-source.test.ts`
- `src/app/(maestro)/admin/context-layer/templates/__tests__/page-source.test.ts`

## QA / Validation

- PASS: `npx jest --runTestsByPath 'src/app/(maestro)/admin/context-layer/__tests__/layout-source.test.ts' 'src/app/(maestro)/admin/context-layer/templates/__tests__/page-source.test.ts' --runInBand`
- PASS: `npx eslint 'src/app/(maestro)/admin/context-layer/layout.tsx' 'src/app/(maestro)/admin/context-layer/page.tsx' 'src/app/(maestro)/admin/context-layer/templates/page.tsx' 'src/app/(maestro)/admin/context-layer/uploads/page.tsx' 'src/app/(maestro)/admin/context-layer/approval-queue/page.tsx' 'src/app/(maestro)/admin/context-layer/syncs/page.tsx' 'src/app/(maestro)/admin/context-layer/evidence-map/page.tsx' 'src/app/(maestro)/admin/context-layer/__tests__/layout-source.test.ts' 'src/app/(maestro)/admin/context-layer/templates/__tests__/page-source.test.ts'`
- PASS: `git diff --check`
- PASS: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to `main`; Vercel deploy updates Admin Context Layer routing and presentation. No migration or feature flag is required.

## Rollback Plan

Revert this PR to remove the nested Admin Context Layer shell and restore the prior standalone page framing.

## Audit Evidence

PR URL and CI checks will be attached after opening the PR.

## Known Gaps

This release does not implement live schema-anomaly pause/resume, live Azure parsing, or end-to-end data-load smoke. Those remain separate private data-plane execution items.
