# 2026-06-16-source-client-facing-hygiene — Source Client-Facing Label Hygiene

## Release ID

`2026-06-16-source-client-facing-hygiene`

## Status

`candidate`

## Plain-English Summary

Generated Source memos now receive a final deterministic cleanup so client-facing documents say business document names such as `Sourcing Strategy Memo` and `Scope Memo`, not internal artifact codes like `d01_strategy_memo`.

## Layer Impact

- `global-control-lane`: Adds a small post-generation text hygiene step before generated Source artifacts are saved, rendered, and section-verified.

## Client Applicability

- All clients: Applies to newly generated Source documents.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Adds `sanitizeClientFacingSourceDraft` for generated Source markdown.
- Wires the cleanup into the Source artifact generation route after generation and before quality/section verification and rendering.
- Adds unit tests for artifact-code replacement and internal source-term suppression.

## QA / Validation

- PASS: `npx tsc --noEmit --pretty false`.
- PASS: `npx eslint 'src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/generate/route.ts' src/lib/source/agent-generation`.
- PASS: `npx jest src/lib/source/agent-generation/__tests__/client-facing-hygiene.test.ts src/lib/source/agent-generation/__tests__/section-conformance.test.ts src/lib/source/agent-generation/__tests__/prompt-registry.test.ts --runInBand`.
- PASS: `npm run test:behaviors`.
- PASS: `node scripts/release-check.mjs --base origin/main --head HEAD`.
- NOT-RUN: Live DOCX proof; runs after merge and deploy.

## Rollout Plan

Merge to `main`, then deploy the next Azure Container Apps web image. Existing already-generated files are not rewritten; fresh generated artifacts receive the cleanup.

## Rollback Plan

Revert the application commit. No data migration or schema rollback is required.

## Audit Evidence

- PR and CI run for this release candidate.
- Live DOCX proof after deployment showing no raw artifact codes in the generated memo.

## Known Gaps

- This is deterministic hygiene, not a full semantic quality review. AQ3 remains the consulting-grade async quality pass.
