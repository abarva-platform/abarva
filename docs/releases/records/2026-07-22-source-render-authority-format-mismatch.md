# 2026-07-22-source-render-authority-format-mismatch — Source Render Authority Format Honesty

## Release ID

`2026-07-22-source-render-authority-format-mismatch`

## Status

`candidate`

## Plain-English Summary

Source artifact rendering now refuses to silently regenerate a different-format draft when a client-final artifact already exists as the authoritative deliverable of record. If the client-final is stored as DOCX and a caller asks the unified render route for PDF, the route returns an explicit `client_final_format_mismatch` conflict with the available and requested formats instead of producing a fresh generated PDF that could be mistaken for the final.

## Layer Impact

- **global-control-lane**: Changes one shared Source render API route used by authenticated Source artifact export/view links.
- **Evidence integrity / lineage controls**: Preserves the authority boundary between client-final artifacts and generated fallback output by making mismatch cases machine-visible.
- **No schema or data-plane mutation**: No database migration, no artifact rewrite, and no blob conversion.

## Client Applicability

- All clients: yes, for Source events using the unified render route.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/render/route.ts`
  - Adds explicit `409 client_final_format_mismatch` when a client-final artifact exists but the requested render format differs from the stored final format.
  - Adds `x-source-artifact-authoritative: client-final-format-mismatch` for mismatch responses.
  - Adds `x-source-artifact-authoritative: generated-fallback` for generated fallback responses.
  - Keeps the existing matching client-final stream behavior unchanged.
- `src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/render/__tests__/route.test.ts`
  - Covers the mismatch branch and the generated-fallback header branch.
- `docs/backlog/source-product-backlog.md`
  - Reconciles `SOURCE-ARTIFACT-AUTHORITY-001` item #3 as live-proven and item #4 as this active candidate slice.

## QA / Validation

- PASS: `npx jest --runTestsByPath 'src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/render/__tests__/route.test.ts' --runInBand`

Additional validation before merge/deploy:

- Focused ESLint for the changed route and test.
- Focused adjacent resolver/API tests.
- TypeScript check.
- `npm run release:check`.
- PR checks.
- ACA main deploy workflow.
- Independent ACA runtime invariant.
- Signed-in `app.abarva.ai` proof against a real Source event/client-final artifact pair.

## Rollout Plan

Merge to `main` through a PR. The repo-owned ACA main deploy workflow builds and deploys the digest-pinned image to `app.abarva.ai`, waits for the new revision to become healthy, shifts 100% traffic, and captures deployment evidence. No manual Azure runtime mutation is approved or required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the repo-owned workflow.
- Approved image digest: pending ACA main deploy.
- ACA runtime invariant: pending post-deploy proof.
- Worker image invariant: unchanged; verify through the deploy workflow/runtime invariant.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the PR and redeploy through the ACA main deploy workflow. No migration rollback is needed. The behavioral rollback restores the old generated-fallback behavior for format mismatches.

## Audit Evidence

- PR: pending.
- Release record: `docs/releases/records/2026-07-22-source-render-authority-format-mismatch.md`
- Local focused test output: route test passed.
- Post-merge ACA run, invariant proof, and signed-in proof: pending.

## Known Gaps

- This release does not transcode/convert a client-final DOCX into PDF. It deliberately returns an explicit conflict so callers do not mistake generated fallback output for the authoritative final.
- Legacy per-format routes are not changed in this slice.
