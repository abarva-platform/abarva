# 2026-07-17-tower-claimable-value-label — Tower Claimable Value Label

## Release ID

`2026-07-17-tower-claimable-value-label`

## Status

`candidate`

## Plain-English Summary

Tower command-center labels now say `Claimable value gate` and `Claimable value allowed` instead of wording that could imply finance-validated realized value exists before the value-claim gate passes.

## Layer Impact

- Product UI: copy-only change in the Tower command-center surface.
- Data plane: no change.
- Agent or prompt path: no change.
- Runtime flags: no change.

## Client Applicability

- All clients: applies wherever the Tower command-center surface is enabled.
- Specific clients: validated against Healthcare Demo / Meridian context.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/components/tower/TowerIndexPage.tsx`: updates Tower value-gate labels from realized-value wording to claimable-value wording.
- `docs/releases/records/2026-07-17-tower-claimable-value-label.md`: release record for the copy fix.

## QA / Validation

- PASS: `npm test -- --runTestsByPath src/components/tower/__tests__/TowerCioDashboardSurface.test.tsx --runInBand`
- PASS: `npx eslint src/components/tower/TowerIndexPage.tsx` completed with pre-existing warnings and no errors.
- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`
- PASS: `git diff --check`
- PENDING: signed-in ACA browser proof after merge/deploy.

## Rollout Plan

Merge through the protected PR lane. The repo-owned ACA main deploy workflow should build and deploy the resulting main SHA. Signed-in browser proof is required before calling the release live-proven.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: not used by this PR.
- Approved image digest: pending ACA main deploy.
- ACA runtime invariant: pending ACA main deploy.
- Worker image invariant: not applicable.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: yes.

## Rollback Plan

Revert this PR and redeploy through the repo-owned ACA main deploy workflow.

## Audit Evidence

- PR URL: pending.
- Focused local validation: listed above.
- Post-deploy screenshot and DOM proof: pending.

## Known Gaps

This PR does not redesign Tower layout, change Tower data, refresh Azure/Postgres, or alter aVa behavior. It only removes ambiguous realized-value wording from Tower labels.
