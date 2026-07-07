# 2026-07-03-moves-p0-inline-capture — Moves P0 Inline Brief Capture

## Release ID

`2026-07-03-moves-p0-inline-capture`

## Status

`candidate`

## Plain-English Summary

Moves P0 now fills the seven-section origination brief directly from explicit labeled user text before waiting on model artifacts or server-side reconciliation. If a user provides a complete prompt with business problem, sponsor, scope, evidence, value, and readiness, the scaffold becomes promotion-ready even when aVa narrates instead of emitting a `brief-progress` artifact.

## Layer Impact

- `global-control-lane`: Updates the shared Strategic Moves P0 client behavior for all tenants.
- Product UI: The right-side P0 checklist updates immediately from explicit user input and remains compatible with model artifacts and server reconciliation.

## Client Applicability

- All clients: Yes, for Strategic Moves P0 origination.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/strategic-moves/StrategicMoveOriginateClient.tsx`
- `src/components/strategic-moves/__tests__/StrategicMoveOriginateClient.test.tsx`

## QA / Validation

- Pass: `npm test -- --runTestsByPath src/components/strategic-moves/__tests__/StrategicMoveOriginateClient.test.tsx src/app/api/v1/programs/originate/extract-brief/extract-brief-deterministic.test.ts --silent`
- Pass: `npx eslint src/components/strategic-moves/StrategicMoveOriginateClient.tsx src/components/strategic-moves/__tests__/StrategicMoveOriginateClient.test.tsx`
- Pass: `npm run release:check`
- Pending: production signed-in Moves P0 browser proof after ACA deployment.

## Rollout Plan

Merge to `main`, run the repo-owned Azure Container Apps main deploy workflow, wait for healthy revision and 100% traffic shift, then rerun the signed-in Industrial Demo Moves P0 pressure proof.

## Deployment Authority

- Repo-owned deploy workflow: ACA main deploy on `main`
- Shared runtime mutators: None
- Approved image digest: Pending deploy
- ACA runtime invariant: Required
- Worker image invariant: Required by deploy workflow
- Feature/env flag update path: None
- Live signed-in proof required: Yes

## Rollback Plan

Revert this commit and redeploy through the same ACA main deploy workflow. No migration or data rollback is required.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/4370
- CI run: Pending
- Deployment run: Pending
- Production browser report: Pending

## Known Gaps

This only fills fields that are explicit in the user text. It does not invent missing sponsor, scope, value, or readiness content.
