# 2026-09-22-source-stage08-acceptance-spine - Source Stage 08 Acceptance Spine

## Release ID

`2026-09-22-source-stage08-acceptance-spine`

## Status

`candidate`

## Plain-English Summary

This release adds a narrow read-only acceptance spine for Source. It proves that the existing
Evaluation/BAFO readiness projection and Stage 08 Award/SOW handoff projection can be executed
together from synthetic fixtures: normalized response questions, named evaluator scorecard review,
support-only pricing/TCO comparison, draft clarification/BAFO asks, named selection evidence,
contract formation readiness, canonical contract handoff planning, and the Optimize route identity.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 product projection only. The new code composes existing Source read models and readiness
builders into an executable acceptance object for shared Source control-plane behavior. It does not
create or mutate canonical records, tenant records, supplier records, contracts, awards, approvals,
signatures, or Optimize cases.

## Client Applicability

- All clients: No direct client data-plane change.
- Specific clients: None.
- Internal only: Validation/proof support for Source release governance.
- Public/demo only: Uses existing synthetic fixtures only.
- Feature flag: None.

## Changes Included

- Adds `src/lib/source/stage08-acceptance-spine.ts`.
- Mounts the read-only spine through the existing Source analytics Stage 08 readiness consumer.
- Reconciles the mounted Transition summary with the same Stage 08 handoff readiness result, so a
  recorded stage approval remains recorded while open contract-formation blockers remain visible.
- Exports the read-only spine types through `src/lib/source/index.ts`.
- Adds `src/__tests__/behaviors/source-stage08-acceptance-spine.test.ts`.

## QA / Validation

- Red-first focused behavior test failed before the spine module existed.
- Focused behavior test passed after implementation:
  `npx jest src/__tests__/behaviors/source-stage08-acceptance-spine.test.ts --runInBand`.
- Mutation proof inverted the Optimize route identity check; the focused behavior test failed with
  the spine status changed to `blocked`, then passed again after restoration.
- Mount mutation proof forced the rendered acceptance status to `not_evaluated`; the focused test
  failed against the expected `passed_read_only_acceptance`, then passed after restoration.
- A mounted Transition regression first reproduced a recorded approval summary that omitted the
  blocked handoff result. The corrected summary preserves the approval record and directs the user
  to resolve Stage 08 handoff blockers.
- Mutation proof forced the mounted handoff-blocked signal off; the regression failed by returning
  to `No further approval required`, then passed after restoration.
- The focused Stage 08 test and approval-honesty canvas regressions passed together: 2 suites / 19
  tests.
- `npm run audit:lib-orphans` passed after the spine was mounted through product code; the Stage 08
  acceptance builder is not a test-only helper.
- TypeScript passed by exit code: `npm run typecheck`.

## Rollout Plan

Merge through a pull request to `main`. The repo-owned Azure Container Apps deploy workflow will
publish the next shared web image. No migration, data build, tenant load, manual workflow dispatch,
feature flag, or operator data-plane action is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None in this change.
- Approved image digest: To be produced by the repo-owned deploy workflow after merge.
- ACA runtime invariant: Required after merge/deploy before claiming deployed runtime state.
- Worker image invariant: Required after merge/deploy before claiming deployed runtime state.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes. The acceptance status is mounted on the existing Stage 08
  readiness panel, so a signed-in check must confirm the visible status and fail-closed blockers on
  the deployed digest before this release can be called live-proven.

## Rollback Plan

Revert the pull request. Because the change is read-only TypeScript and tests only, rollback does
not require migration rollback, tenant data repair, supplier communication, or traffic cutover.

## Audit Evidence

- Pull request URL after opening.
- Focused behavior test output.
- Mutation proof output for the Optimize route identity check.
- TypeScript, ESLint, behavior suite, release check, and hosted PR checks.
- ACA runtime invariant artifact after repo-owned deployment, if the PR is merged.

## Known Gaps

Signed-in Source acceptance is still owed and is not claimed. A signed-in read identified the
Transition-summary contradiction addressed by this candidate, but the corrected rendering still
requires deployed signed-in verification. The spine proves projection continuity and guardrails
locally; it does not approve an award, create a canonical contract, publish Contract 360, launch
Optimize, contact suppliers, or validate realized savings.
