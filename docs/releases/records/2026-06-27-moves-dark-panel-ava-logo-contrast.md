# 2026-06-27-moves-dark-panel-ava-logo-contrast — Moves Originate Dark Panel aVa Contrast

## Release ID

`2026-06-27-moves-dark-panel-ava-logo-contrast`

## Status

`candidate`

## Plain-English Summary

The Strategic Moves originate page already uses the shared aVa logo component, but its agent panel is dark. This release switches that page to the light wordmark variant so the leading `a` is visible on the navy panel.

## Layer Impact

- `global-control-lane`: UI-only agent branding correction on `/strategic-moves/new`. No data-plane, prompt, model, retrieval, or authorization behavior changes.

## Client Applicability

- All clients: Yes, wherever `/strategic-moves/new` is available.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/strategic-moves/StrategicMoveOriginateClient.tsx`: renders `AvaAskMark` with `variant="wordmark-light"` on the dark Moves originate chat panel.
- `src/components/strategic-moves/__tests__/StrategicMoveOriginateClient.test.tsx`: asserts the light wordmark asset is used on that page.

## QA / Validation

- Pass: `npm test -- --runTestsByPath src/components/strategic-moves/__tests__/StrategicMoveOriginateClient.test.tsx src/components/agent-answer/__tests__/AvaAskMark.assets.test.ts`.
- Pass: `npx eslint src/components/strategic-moves/StrategicMoveOriginateClient.tsx src/components/strategic-moves/__tests__/StrategicMoveOriginateClient.test.tsx`.
- Pass: `npm run release:check`.
- Not run yet: ACA deploy and signed-in visual smoke on `/strategic-moves/new`.

## Rollout Plan

Merge to `main`, deploy through the approved Azure Container Apps main workflow, then verify `https://app.abarva.ai/strategic-moves/new` in a signed-in tenant session.

## Deployment Authority

- Repo-owned deploy workflow: ACA main deploy.
- Shared runtime mutators: None.
- Approved image digest: Pending deploy.
- ACA runtime invariant: Pending deploy.
- Worker image invariant: Pending deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, `/strategic-moves/new` must show the light aVa wordmark on the dark panel.

## Rollback Plan

Revert the variant prop change and redeploy through ACA. This is UI-only and has no data rollback.

## Audit Evidence

- PR: Pending.
- CI: Pending.
- Deployment: Pending.
- Signed-in screenshots: Pending.

## Known Gaps

Live signed-in proof is pending until this candidate is merged and deployed. This release is intentionally limited to the dark-panel contrast issue on Moves originate.
