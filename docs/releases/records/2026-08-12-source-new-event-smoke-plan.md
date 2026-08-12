# 2026-08-12-source-new-event-smoke-plan - Source New Event Smoke Plan

## Release ID

`2026-08-12-source-new-event-smoke-plan`

## Status

`candidate`

## Plain-English Summary

Adds the first SRC57 smoke-harness foundation for the Source New Event journey.
The new QA helper builds a deterministic 11-stage smoke plan from the canonical
Source stage order, evidence requirements, and artifact specifications. It gives
future implementation slices a shared before/after proof checklist for stage
routes, files, intelligence, guidebooks, approvals, evidence readiness, and
deployment proof.

## Layer Impact

- Release lane: `global-control-lane`.
- Products: Source gains a QA contract for the New Event workflow. No user-facing
  runtime surface changes in this slice.
- Governance: The plan records non-mutating default behavior, required proof-pack
  fields, and when ACA deploy proof is required.

## Client Applicability

- All clients: Applies as Source QA/release discipline for the shared product.
- Specific clients: None.
- Internal only: The helper and tests are internal engineering/release proof.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/lib/qa/source-new-event-smoke-plan.ts`
- `src/__tests__/integration/qa/source-new-event-smoke-plan.test.ts`
- `docs/backlog/tracks/04-source-commercial/SOURCE_NEW_EVENT_BEST_IN_CLASS_PROGRAM.md`

## QA / Validation

- `npx jest src/__tests__/integration/qa/source-new-event-smoke-plan.test.ts --runInBand` passed.
- `npx eslint src/lib/qa/source-new-event-smoke-plan.ts src/__tests__/integration/qa/source-new-event-smoke-plan.test.ts` passed.
- `git diff --check` passed.
- `npm run release:check -- --base origin/main --head HEAD` is expected to pass with this record.

The focused Jest run emitted existing duplicate manual mock warnings for markdown
test mocks; the test suite still passed.

## Rollout Plan

Merge to `main`. No Azure Container Apps deployment is required because this is
QA helper/test/backlog code and does not change runtime behavior.

## Deployment Authority

- Repo-owned deploy workflow: Not required for this slice.
- Shared runtime mutators: None.
- Approved image digest: Not applicable.
- ACA runtime invariant: Not applicable.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Not for this QA contract slice; future runtime
  slices must use the smoke plan for signed-in proof.

## Rollback Plan

Revert the merge commit if the QA contract causes unexpected CI or release-check
issues. No data rollback, schema rollback, or runtime rollback is needed.

## Audit Evidence

- PR for this slice.
- Focused Jest output.
- Scoped ESLint output.
- Release-check output.

## Known Gaps

- This slice defines the deterministic smoke plan; it does not yet add the full
  Playwright stage crawler, screenshots, proof-pack writer, or live signed-in
  post-deploy proof workflow.
