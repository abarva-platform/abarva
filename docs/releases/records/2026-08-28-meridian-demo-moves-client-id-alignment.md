# 2026-08-28-meridian-demo-moves-client-id-alignment — Meridian Demo Moves Client Alignment

## Release ID

`2026-08-28-meridian-demo-moves-client-id-alignment`

## Status

`candidate`

## Plain-English Summary

Aligns the Meridian synthetic demo Moves activation package to the live Meridian client row that the product routes resolve. Existing stable Move rows can now be corrected to the live client on rerun instead of remaining under a stale client id.

## Layer Impact

Release lane: `client-data-lane`.

Layer 2/operations: updates the governed Moves activation package generator and executor defaults.

Layer 4/products: no UI code changes. The product route should see the governed Moves rows after the activation job reruns and readback passes.

## Client Applicability

- All clients: No.
- Specific clients: Meridian synthetic demo tenant only.
- Internal only: No.
- Public/demo only: Yes, synthetic demo proof lane.
- Feature flag: Not applicable.

## Changes Included

- Updates the activation package default client id to the live Meridian client row.
- Updates primary-key engagement upserts to carry `client_id` and `solution` from the generated package on conflict.
- Updates activation plan and execution tests to assert the primary-key upsert contract.

## QA / Validation

- Pass: `npm run test:ecl-meridian-phs-moves-activation`
- Pass: `npm run test:ecl-meridian-phs-moves-activation-execute`
- Pass: `git diff --check`
- Pending: `npm run release:check -- --base origin/main --head HEAD`
- Not run until deploy: governed ACA activation job rerun and readback.
- Not run until data job: signed-in browser proof for `/strategic-moves`.

## Rollout Plan

Merge through a pull request. The repo-owned ACA main deploy workflow builds and deploys the image. After deployment, rerun the governed Meridian Moves activation job with the digest-pinned image and existing Azure Postgres secret, then run signed-in browser proof.

## Deployment Authority

- Repo-owned deploy workflow: Required before the updated activation package runs in ACA.
- Shared runtime mutators: None from this PR.
- Approved image digest: Resolved by the main ACA deploy workflow.
- ACA runtime invariant: Required before claiming deployed.
- Worker image invariant: Not changed.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, after the data job rerun.

## Rollback Plan

Revert the PR to restore the previous activation defaults. If the activation job has already moved rows, rerun the prior activation package only if a rollback decision requires returning the synthetic demo rows to their former client id.

## Audit Evidence

- Pull request for this release.
- Local activation tests and release gate.
- ACA activation job output and readback after deployment.
- Signed-in browser proof for the Meridian Moves route.

## Known Gaps

This fixes the known client-id alignment issue. It does not change Moves visual design or broaden the demo to non-Meridian tenants.
