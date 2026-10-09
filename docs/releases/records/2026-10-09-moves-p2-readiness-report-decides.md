# 2026-10-09 — P2 readiness: a readable Discovery Report decides

## Release ID

`2026-10-09-moves-p2-readiness-report-decides`

## Status

`candidate`

## Plain-English Summary

Leaving Discovery (P2) requires the hard check `p2_readiness_cleared`. It
passed in one of two ways: the signed Discovery Report is readable and records
no hard gap and no conditional proceed, OR the completed P2 answers contain a
word such as "proceed" or "recommend" and none of "stop", "kill" or "do not
advance".

The second path exists for one case: a report row with no readable text. But
it also applied when the report was readable and recorded an unresolved hard
gap, so a consultant's "we recommend proceeding" overrode the report's own
finding. This change limits the second path to its intended case: the P2
answers decide only when the report has no readable text.

## Layer Impact

- Release lane: `global-control-lane`.
- Product projection: the Moves P2 → P3 gate. One hard check is narrowed so a
  readable report's hard gap can no longer be overridden by capture text.
- Canonical model: no schema, data or tenant change.

## Client Applicability

- All clients: yes. A Move whose readable Discovery Report records a hard gap
  or a conditional proceed now stays at P2 until the report is resolved, even if
  its P2 recommendation says to proceed.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. This closes a governance hole rather than adding a
  capability.

## Changes Included

- `src/lib/programs/governance.ts`: the capture path of `p2_readiness_cleared`
  requires that the Discovery Report has no readable text.
- `src/lib/programs/__tests__/governance-evaluate-gates.test.ts`: a new case
  reuses the completed P2 capture of the existing capture-path test (whose
  recommendation says "proceed to Design") with a readable report that records
  a hard gap, and asserts the check fails with the hard-gap reason.

## QA / Validation

- The new case fails with the fix reverted and passes with it in place.
- The existing capture-path case (report row with no readable text) still
  clears; the existing contentless-report and hard-gap cases still block.
- 28 suites that exercise gate evaluation: 951 tests pass.
- `npm run typecheck` (includes tests): clean. ESLint: clean. Prettier: the
  test file is clean; `governance.ts` was already failing the check at base and
  was not reformatted.
- Six unrelated suites fail identically on untouched `main` (12 tests); they
  are not affected by this change.

## Rollout Plan

Merge through the protected main branch; the repo-owned ACA main deploy
workflow builds and deploys the digest-pinned image. No flag, migration or data
job.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: assigned by the workflow.
- ACA runtime invariant: verify web template and serving revision match the
  approved digest.
- Worker image invariant: verify required worker images match the approved
  digest.
- Feature/env flag update path: none.
- Live signed-in proof required: on a Move at P2 with a readable report that
  records a hard gap, the gate reports `p2_readiness_cleared` as failed with the
  hard-gap reason.

## Rollback Plan

Revert this change through a pull request; the capture path again applies
regardless of the report.

## Audit Evidence

- Pull request and CI results.
- The fix-reverted / fix-applied test runs above.

## Known Gaps

The capture path still decides by phrase matching when a report has no readable
text, and the gate does not yet require root causes to be ranked and evidenced
or findings to be reviewed. Both are replaced by the structured P2 root-cause
step in a following increment.
