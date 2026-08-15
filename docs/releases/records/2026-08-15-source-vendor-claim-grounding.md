# 2026-08-15-source-vendor-claim-grounding — Source Vendor Claim Grounding

## Release ID

`2026-08-15-source-vendor-claim-grounding`

## Status

`candidate`

## Plain-English Summary

Routes Source event questions about unsupported or unproven vendor claims through the governed
vendor-response answer packet instead of letting the visible drawer prose answer from broader
context. This keeps response-stage answers aligned to the event's persisted response vendors and
evidence rows.

Follow-up hardening keeps response-stage answers grounded to the same proposal-profile substrate the
Responses page renders when that substrate exists, instead of falling through to lower-level vendor
lever rows from a different response view.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 — Products. This changes Source event aVa intent routing and regression coverage only. It
does not change tenant data, canonical facts, adapters, calculation logic, or any workflow state.

## Client Applicability

- All clients: Source event canvas users asking about unsupported or unproven vendor claims receive
  the same governed response-coverage packet used for vendor-response coverage questions.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/app/api/v1/source/[eventId]/nexus/ask/route.ts`
- `src/app/api/v1/source/[eventId]/nexus/ask/__tests__/vendor-coverage-intent.test.ts`
- `src/lib/source/ava/vendor-coverage-governed-answer.ts`
- `src/lib/source/ava/__tests__/vendor-coverage-governed-answer.test.ts`

## QA / Validation

- PASS: `npx jest --runTestsByPath 'src/app/api/v1/source/[eventId]/nexus/ask/__tests__/vendor-coverage-intent.test.ts' --runInBand`
  (4/4 tests passed).
- PASS: `npx jest src/lib/source/ava/__tests__/vendor-coverage-governed-answer.test.ts --runInBand`
  (13/13 tests passed, including a profile-grounding regression that proves unsupported-claim
  answers list only the visible response profiles and do not include ambient vendor names).
- Required after deploy: signed-in Source event aVa proof that an unsupported-claim question renders
  only the governed event response vendors in both visible prose and structured output.

## Rollout Plan

Merge to `main`. The normal repo-owned Azure Container Apps deploy workflow rolls the application
code forward. No database migration, data load, feature flag, or manual runtime action is required.

## Deployment Authority

- Repo-owned deploy workflow: Normal main deploy workflow if/when application code deploys.
- Shared runtime mutators: None.
- Approved image digest: Not applicable at PR time.
- ACA runtime invariant: Required before claiming the change is live.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Required before claiming live product proof.

## Rollback Plan

Revert the PR to restore the prior narrower vendor-coverage intent trigger.

## Audit Evidence

PR, targeted Jest output, lint/typecheck output, release-control output, ACA deploy run, and
signed-in Source event aVa proof after deployment.

## Known Gaps

This does not complete the remaining Source aVa hard-QA question rerun or the real document
upload/parse/persist proof.
