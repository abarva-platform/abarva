# 2026-07-10-moves-phase-gate-cta-polish — Moves phase gate CTA polish

## Release ID

`2026-07-10-moves-phase-gate-cta-polish`

## Status

`candidate`

## Plain-English Summary

This is a focused UI/UX and gate-action polish pass for the standalone Moves phase workspace. Live review showed the final step's top-right CTA still said "Approve & advance" while the governed action lower on the page correctly said "Approve & generate deliverables." This release aligns the top CTA with the real gate behavior so the final-step action starts required deliverable generation and submits gate approval through the same path.

## Layer Impact

- `global-control-lane`: shared Moves phase page UI and client-side action wiring.
- No `client-data-lane` impact: no schema, data load, read-model mutation, or migration.

## Client Applicability

- All clients: yes, for Moves phase pages.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx`: final-step stage-bar CTA now says "Approve & generate" and calls the same gate generation/approval action as the gate card.
- `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`: asserts the misleading "Approve & advance" CTA is absent on the gate step.

## QA / Validation

- Pass: `npx eslint src/components/strategic-moves/MovesPhaseStandaloneClient.tsx src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`.
- Pass: `npx jest src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx --runInBand` — focused component regression remains green. Jest printed pre-existing duplicate manual mock warnings, but no failures.
- Pass: `npm run release:check`.
- Live proof: pending merge/deploy. Required proof is the deployed Gate approval step showing "Approve & generate" and no "Approve & advance" CTA.

## Rollout Plan

Merge to `main`, let the repo-owned Azure Container Apps main deploy workflow build and deploy the image, verify ACA runtime invariant, then rerun the signed-in Moves phase gate-step proof.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this PR.
- Approved image digest: to be confirmed post-deploy.
- ACA runtime invariant: to be verified post-deploy.
- Worker image invariant: unaffected.
- Feature/env flag update path: no env or flag update required.
- Live signed-in proof required: yes.

## Rollback Plan

Revert this release and redeploy. Because this is client-side UI/action wiring only, rollback restores the prior final-step CTA behavior without data migration impact.

## Audit Evidence

- Live gate-step screenshot showed the top CTA label did not match the governed generation action.
- Focused local validation commands listed above.

## Known Gaps

- Live signed-in proof is pending deployment.
