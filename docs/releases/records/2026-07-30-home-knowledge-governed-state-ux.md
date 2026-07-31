# 2026-07-30-home-knowledge-governed-state-ux — Home Knowledge Governed-State UX

## Release ID

`2026-07-30-home-knowledge-governed-state-ux`

## Status

`candidate`

## Plain-English Summary

Improves the signed-in Home Knowledge brief so honest unpublished states read as governed product states instead of operational error blocks. The page still refuses to invent missing purpose, goal, interpretation, or advisory content, but the visual treatment now presents those gaps calmly and keeps the aVa disabled state in one polished dock surface.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 Products: Home Knowledge presentation components only. No source data, canonical model, publication, baseline, projection, Cube, provider, Source, or aVa grounding contract changes.

## Client Applicability

- All clients: yes, for the signed-in Home Knowledge presentation.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Adds a calm governed-state panel for expected unpublished Knowledge sections.
- Uses the governed-state treatment for unpublished interpretation, purpose, goals, and AbarVa-view surfaces.
- Removes the duplicate main-page model-off banner from the Knowledge shell.
- Polishes the aVa dock disabled state as the single model-unavailable surface.
- Updates focused render-gate and Knowledge shell tests.

## QA / Validation

- PASS: focused Jest for Knowledge render-gate and shell tests: 2 suites / 11 tests passed.
- PASS: focused ESLint for modified Knowledge files.
- PASS: TypeScript project check: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit`.
- PASS: `npm run release:check`.
- Pending: signed-in browser screenshots after merge and ACA deployment. Current desktop signed-in proof is blocked because the controllable in-app browser is signed out and the local Mac is locked.

## Rollout Plan

Merge by PR to `main`. The repo-owned Azure Container Apps main deploy workflow builds and deploys the exact merged SHA. After deployment, run signed-in browser proof on Home Knowledge to verify the governed-state panels, single toolbar, and single aVa disabled-state surface.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: none by this PR.
- Approved image digest: produced by the main deploy workflow.
- ACA runtime invariant: required after deploy.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA workflow. No data rollback is required because the change is presentation-only.

## Audit Evidence

- PR URL: pending.
- Focused test output: pending.
- ACA deploy run and image digest: pending.
- Signed-in screenshots: pending.

## Known Gaps

This does not create or publish missing purpose, goal, interpretation, advisory, baseline, projection, Cube, or aVa grounding content.
