# 2026-08-08-source-rfp-preflight-trust-fixes — Source RFP Preflight Trust Fixes

## Release ID

`2026-08-08-source-rfp-preflight-trust-fixes`

## Status

`candidate`

## Plain-English Summary

This release fixes several Source new-event preflight issues where the product could overstate readiness. New competitive events now route to their event-specific approval page, template-bound uploads only mark evidence as parsed when typed facts are actually written, the checklist exposes the matching governed input template, and aVa withholds supplier finalist language until event-specific proposal evidence exists.

## Layer Impact

Release lane: `global-control-lane`.

Client intake and Source adapters: the Source event creation route continues to persist the same event shape, but returns the correct approval URL and selected category readback remains available through operator proof.

Canonical model and product projections: template-bound fact ingest now stamps the associated artifact row with typed-parse success or failure, so the visible file ledger reflects whether structured facts exist.

Products: Source intake, Source canvas task checklist, File Cabinet readiness, and Source aVa answers are affected. Other product surfaces are not changed.

## Client Applicability

- All clients: Source new competitive-event creation, template-bound Source uploads, Source aVa event answers, Source operator cleanup/readback.
- Specific clients: None.
- Internal only: the cleanup/readback script enhancement is operator-facing.
- Public/demo only: None.
- Feature flag: existing Source feature gates still apply.

## Changes Included

- `src/app/api/v1/source/events/route.ts`
- `src/components/source/SourceOriginatePage.tsx`
- `src/components/source/canvas/analytics/TaskChecklist.tsx`
- `src/components/source/canvas/analytics/upload-artifact.ts`
- `src/app/api/v1/source/[eventId]/facts/ingest-file/route.ts`
- `src/lib/source/source-answer-engine.ts`
- `src/lib/source/facts/template-requirements.ts`
- `src/lib/source/exports/input-template.ts`
- `scripts/ops/source-open-event-cleanup.ts`

## QA / Validation

- `npx jest --runTestsByPath src/components/source/canvas/analytics/__tests__/TaskChecklist.upload.test.tsx 'src/app/api/v1/source/[eventId]/facts/ingest-file/__tests__/route.test.ts' src/app/api/v1/source/events/__tests__/route.test.ts src/lib/source/__tests__/source-answer-engine.test.ts --runInBand` passed.
- `npx eslint ...` on all touched source and test files passed.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` passed.

## Rollout Plan

Merge to `main`, then deploy through the repo-owned Azure Container Apps main workflow. After deployment, run a signed-in Source preflight with a temporary event, verify event-specific approval routing, template download, typed upload/readback, aVa missing-evidence behavior, and final archive/readback cleanup.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: no ad-hoc shared runtime mutation in this release.
- Approved image digest: assigned by the ACA main workflow after merge.
- ACA runtime invariant: required before live proof.
- Worker image invariant: not changed.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, Source new-event preflight and isolation cleanup.

## Rollback Plan

Revert the merge commit and redeploy through the same ACA main workflow. The change does not include a destructive migration. Existing source event, artifact, and fact rows remain intact.

## Audit Evidence

- PR and merge record for this branch.
- Local Jest, ESLint, TypeScript, and release-check output.
- ACA main workflow run and deployed image digest.
- Signed-in browser proof after deployment, including final operator readback.

## Known Gaps

The full 11-stage RFP journey remains broader than this preflight fix. This release does not make Door 2 evidence requirements branch by archetype; it only preserves category persistence and prevents unsupported evidence strength claims.
