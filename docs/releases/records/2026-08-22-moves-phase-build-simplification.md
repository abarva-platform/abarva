# 2026-08-22-moves-phase-build-simplification — Moves Phase Build Simplification

## Release ID

`2026-08-22-moves-phase-build-simplification`

## Status

`candidate`

## Plain-English Summary

The Moves phase build panel is simplified so the page leads with one clear status sentence, a small set of gate-ready counters, and collapsed detail for blocked outputs. This keeps the workflow closer to a step-by-step operating surface instead of a dense evidence dashboard.

## Layer Impact

- **Release lane:** `global-control-lane`
- **Layer 4 Products:** Updates the Moves phase build user interface only. No canonical data, projections, tenant input, registry, migration, artifact-generation logic, or runtime routing behavior changes.

## Client Applicability

- All clients: Applies to the Moves phase build surface for all users.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/strategic-moves/PhaseApproveAndBuild.tsx`

## QA / Validation

- Pass: `npx eslint src/components/strategic-moves/PhaseApproveAndBuild.tsx src/components/strategic-moves/__tests__/moves-liability-visible-controls.test.tsx src/components/strategic-moves/__tests__/phase-approve-and-build-settle.test.tsx`
- Pass: `npx jest src/components/strategic-moves/__tests__/phase-approve-and-build-settle.test.tsx --runInBand`
- Pass: `npx tsc --noEmit --pretty false`
- Blocked/pre-existing harness issue: `npx jest src/components/strategic-moves/__tests__/moves-liability-visible-controls.test.tsx src/components/strategic-moves/__tests__/phase-approve-and-build-settle.test.tsx --runInBand` still hits the existing Clerk ESM import path through `PhaseDocumentsPanel`; the phase build sequencing suite itself passes.

## Rollout Plan

Merge through the normal repository PR process. The repo-owned ACA main deploy workflow may rebuild the web image after merge.

## Deployment Authority

- Repo-owned deploy workflow: Approved session path if main deploy runs after merge.
- Shared runtime mutators: None.
- Approved image digest: Not applicable until the repo-owned deploy workflow builds from main.
- ACA runtime invariant: Required if a main deploy is produced.
- Worker image invariant: No worker image change.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, after deploy, verify the Moves phase page renders the simplified build panel in the signed-in product.

## Rollback Plan

Revert the UI component change. No data rollback, migration rollback, tenant cleanup, or artifact cleanup is required.

## Audit Evidence

- Local validation commands are listed in the QA section.
- Signed-in browser proof should be captured after deployment.

## Known Gaps

- This does not redesign generated DOCX/PPTX templates.
- This does not change artifact generation prompts.
- This does not change approval semantics or gate policy; it only simplifies how the phase build state is presented.
