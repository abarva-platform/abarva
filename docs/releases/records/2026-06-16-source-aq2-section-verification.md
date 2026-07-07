# 2026-06-16-source-aq2-section-verification — Source AQ2 Section Verification

## Release ID

`2026-06-16-source-aq2-section-verification`

## Status

`candidate`

## Plain-English Summary

Generated Source strategy and scope memos now get a deterministic section check before they are saved. A memo that is missing its executive summary, in-scope list, out-of-scope section, or another required section is marked as unverified instead of looking complete.

## Layer Impact

- `global-control-lane`: Source document-generation metadata and Source workspace rendering now show whether required sections are present. No schema, storage, route, model, or data-plane migration changes are included.

## Client Applicability

- All clients: Applies to Source generated `d01_strategy_memo` and `d05_scope_memo` drafts.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Adds a shared required-section registry and deterministic verifier for generated Source artifacts.
- Reuses that registry in the D01/D05 prompt section lists so prompts and verification cannot drift.
- Persists `body_generation_metadata.sectionVerification` on generated drafts.
- Adds a compact workspace marker: `Verified` or `Unverified · N sections missing`.

## QA / Validation

- Focused Jest: `npx jest src/lib/source/agent-generation/__tests__/section-conformance.test.ts src/lib/source/agent-generation/__tests__/prompt-registry.test.ts src/components/source/canvas/workspace-tabs/__tests__/DocumentTab.test.tsx --runInBand` passed.
- TypeScript: `npx tsc --noEmit --pretty false` passed.
- ESLint: `npx eslint 'src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/generate/route.ts' src/lib/source/agent-generation src/components/source/canvas/workspace-tabs/DocumentTab.tsx src/components/source/canvas/workspace-tabs/__tests__/DocumentTab.test.tsx` passed.
- Behavior tests: `npm run test:behaviors` passed.
- Release gate: `node scripts/release-check.mjs --base origin/main --head HEAD` passed.
- Live browser/download proof to be completed after merge and deploy.

## Rollout Plan

Merge to `main`, then deploy the next Azure Container Apps web image. The check runs on every new D01/D05 generation after deploy. Existing generated artifacts are not backfilled.

## Rollback Plan

Revert the application commit. Existing JSON metadata containing `sectionVerification` is harmless if the UI no longer reads it.

## Audit Evidence

- PR and CI run for this release candidate.
- Browser screenshots showing a fresh generated memo marked `Verified` and a deliberately incomplete memo marked `Unverified`.
- Download-to-disk proof that generated artifacts remain retrievable as DOCX from the File Cabinet.

## Known Gaps

- AQ2 is deterministic only; consulting-grade LLM quality review for D01/D05 remains AQ3.
- Existing pre-AQ2 artifacts are stale and are not backfilled.
