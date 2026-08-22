# 2026-08-22-move-artifact-current-listing-and-proof-labels — Moves Artifact Listing and Display Hygiene

## Release ID

`2026-08-22-move-artifact-current-listing-and-proof-labels`

## Status

`candidate`

## Plain-English Summary

Moves generated-artifact lists now honor the existing `currentOnly=1` request for generated deliverables, so older generated versions are not returned as current file-cabinet records. Moves artifact prompts also remove internal proof or QA prefixes from the client-facing move reference before generation, preventing operator labels from appearing in generated deliverable bodies.

## Layer Impact

Layer 4 Products: updates Moves artifact listing and generation prompt hygiene only. No canonical records, tenant inputs, data-plane schema, or Source/Tower/Home projections change.

## Client Applicability

- All clients: Moves generated artifact cabinet listing and client-facing move-reference prompt hygiene.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/app/api/v1/programs/[programId]/artifacts/route.ts`
- `src/app/api/v1/programs/[programId]/artifacts/__tests__/route.test.ts`
- `src/lib/deliverables/strategic-moves-artifact-standard.ts`
- `src/lib/deliverables/__tests__/visual-and-prompt.test.ts`

## QA / Validation

- `npx jest --runTestsByPath 'src/app/api/v1/programs/[programId]/artifacts/__tests__/route.test.ts' 'src/lib/deliverables/__tests__/visual-and-prompt.test.ts' --runInBand` — passed, 29/29 tests.
- `npx eslint 'src/app/api/v1/programs/[programId]/artifacts/route.ts' 'src/app/api/v1/programs/[programId]/artifacts/__tests__/route.test.ts' 'src/lib/deliverables/strategic-moves-artifact-standard.ts' 'src/lib/deliverables/__tests__/visual-and-prompt.test.ts'` — passed.

## Rollout Plan

Merge to main through PR. The repo-owned ACA main deploy workflow may rebuild and deploy the runtime image as part of the normal main path.

## Deployment Authority

- Repo-owned deploy workflow: Approved for this session.
- Shared runtime mutators: None outside the repo-owned deploy workflow.
- Approved image digest: Captured by the deploy workflow if deployed.
- ACA runtime invariant: Required after deploy before claiming live behavior.
- Worker image invariant: Required after deploy before rerunning worker-backed artifact proof.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, for the Moves artifact cabinet and regenerated artifact output before claiming the E2E Move proof complete.

## Rollback Plan

Revert the PR. This restores the previous generated-artifact listing behavior and prompt text construction. No data migration rollback is required.

## Audit Evidence

- PR URL and merge SHA once created.
- Focused Jest and ESLint output above.
- Post-deploy ACA runtime invariant proof if the repo-owned deploy runs.
- Signed-in Moves proof after regeneration.

## Known Gaps

This does not regenerate existing artifacts by itself. Existing generated artifacts retain whatever title/body text they had until the phase is rerun.
