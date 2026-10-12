# 2026-10-12 Tower proof count wording

## Release ID

`2026-10-12-tower-proof-count-basis`

## Status

`candidate`

## Plain-English Summary

Tower now explains what its review counts represent. Rows marked gated or blocked by a reporting rule, source follow-ups, and unavailable Tower details are shown as separate counts. The page no longer adds unrelated counts into one “gap” total or describes every flagged row as missing a dollar value.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 Products: Tower Command Center wording and count presentation only.
- Layers 1–3: No intake, adapter, canonical model, stored record, or metric calculation changes.

## Client Applicability

- All clients: Tower Command Center users after the standard web release.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- The executive view gives unavailable details and source follow-ups their own counts.
- The proof review names rows flagged for review and explains that a row is not necessarily a unique claim or a missing dollar value.
- The source follow-up label describes records needing source details or proof, with an explanation that the groups can overlap.
- No source amounts, claim statuses, or count calculations changed.

## QA / Validation

- Focused Tower rendering tests: 3 suites, 61 tests passed. They cover different count bases and prevent the combined gap label from returning.
- Focused ESLint, TypeScript, diff check, and `npm run release:check` passed locally.
- Exact-head CI and signed-in runtime proof are required after the protected release steps; local tests are not runtime evidence.

## Rollout Plan

Squash merge to `main` after the preceding Tower story release, then use the repo-owned ACA main deploy workflow. Verify the approved digest and inspect the signed-in Tower verdict and proof review panels.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None in this PR.
- Approved image digest: Determined by the main deploy workflow after merge.
- ACA runtime invariant: Verify template and traffic revision digest parity before claiming deployment.
- Worker image invariant: Verify required worker images in the standard deploy proof.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, for the affected Tower panels.

## Rollback Plan

Revert the squash commit and redeploy through the repo-owned ACA main deploy workflow. No data rollback is required.

## Audit Evidence

The PR diff, focused test output, release gate, exact-head CI, main deploy run, digest readback, and signed-in panel observations.

## Known Gaps

These counts describe separate, potentially overlapping loaded records. They do not establish that missing source evidence has been resolved or that benefit amounts are cleared for reporting.
