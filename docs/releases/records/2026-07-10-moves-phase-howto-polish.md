# 2026-07-10-moves-phase-howto-polish — Moves phase how-to polish

## Release ID

`2026-07-10-moves-phase-howto-polish`

## Status

`candidate`

## Plain-English Summary

This is a focused UI/UX polish follow-up for the standalone Moves phase workspace. Live proof of the new workspace showed the "How to complete this phase" card rendering with overlapping step text and arrows. This release replaces that brittle layout with a stable three-step card grid and responsive mobile fallback.

## Layer Impact

- `global-control-lane`: visual-only polish in the shared Moves phase workspace.
- No `client-data-lane` impact: no schema, data load, read-model mutation, or workflow state change.

## Client Applicability

- All clients: yes, for Moves phase pages.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx`: fixes the how-to card layout, mobile fallback, and stale aVa badge selector.

## QA / Validation

- Pass: `npx eslint src/components/strategic-moves/MovesPhaseStandaloneClient.tsx src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`.
- Pass: `npx jest src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx --runInBand` — focused component regression remains green. Jest printed pre-existing duplicate manual mock warnings, but no failures.
- Pass: `npm run release:check`.
- Live proof: pending merge/deploy. Required proof is the deployed Moves phase page screenshot showing non-overlapping how-to steps.

## Rollout Plan

Merge to `main`, let the repo-owned Azure Container Apps main deploy workflow build and deploy the image, verify ACA runtime invariant, then rerun the signed-in Moves phase screenshot proof.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this PR.
- Approved image digest: to be confirmed post-deploy.
- ACA runtime invariant: to be verified post-deploy.
- Worker image invariant: unaffected.
- Feature/env flag update path: no env or flag update required.
- Live signed-in proof required: yes.

## Rollback Plan

Revert this release and redeploy. Because this is visual-only CSS/markup polish, rollback restores the previous standalone workspace styling without data impact.

## Audit Evidence

- Live screenshot from the previous release showed the how-to flow overlapping inside the phase page.
- Focused local validation commands listed above.

## Known Gaps

- Live signed-in proof is pending deployment.
