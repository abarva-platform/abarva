# 2026-08-03 Tower Evidence Quality Corrective

## Release ID

2026-08-03-tower-quality-corrective

## Status

candidate

## Plain-English Summary

Tower sparse-state pages should read like an executive evidence diagnosis. This release removes repetitive per-program unknown rows from the Evidence ownership and blocked-decision questions, fixes evidence progression clipping, and replaces an empty decision queue with measurement intervention work when value is not yet claimable.

## Layer Impact

Release lane: `global-control-lane`.

Product layer: Tower UI projection only. Data layer: no schema, data load, claim-state mutation, tenant record mutation, Azure job mutation, or prompt/runtime answer-generation change.

## Client Applicability

- All clients: receive the Tower command-center projection behavior when Tower is enabled.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

The change is most visible when governed claims exist but baseline, outcome, value, or attestation evidence is incomplete.

## Changes Included

- Evidence question 3 groups open evidence gates by accountable owner role.
- Evidence question 4 groups blocked decisions by proof/intervention lane.
- Value Proof renders the evidence progression as a vertical maturity ladder to avoid horizontal clipping.
- Command Center shows measurement intervention rows when scale, fund, freeze, and stop actions are not yet claimable.
- Focused tests assert grouped owner and decision evidence instead of the old repetitive gap-row pattern.

## QA / Validation

- pass: `npx jest src/lib/tower/command-center/__tests__/view-model.test.ts src/components/tower/command-center/__tests__/TowerCommandCenter.test.tsx --runInBand`
- pass: `npx eslint src/components/tower/command-center/views/CommandCenterView.tsx src/components/tower/command-center/views/EvidenceView.tsx src/components/tower/command-center/__tests__/TowerCommandCenter.test.tsx`
- not-run: live signed-in ACA proof, pending PR merge and deployment.

## Rollout Plan

Merge through the protected PR lane. The repo-owned ACA main deploy workflow builds and deploys the digest-pinned image. After deploy, run signed-in Tower proof for Command Center, Value Proof, Decision Lanes, AI Portfolio, Evidence, and Recommended Actions.

## Deployment Authority

Only the repo-owned ACA main deploy workflow may shift shared Product/Lab web traffic for this release. Branch-local validation and pull request checks are not production evidence.

## Rollback Plan

Revert this PR and redeploy the previous digest-pinned ACA revision. No data rollback is required because this release changes only the Tower UI projection.

## Audit Evidence

- Focused Jest and ESLint commands listed in QA / Validation.
- `npm run release:check` must pass before PR merge.
- Signed-in ACA Tower screenshots and console/network proof are required after deployment.

## Known Gaps

- This release does not create baseline, target, actual, calculated value, or attestation evidence.
- This release does not mutate or reload tenant data.
- Browser screenshot proof remains pending until the approved production deploy completes.
