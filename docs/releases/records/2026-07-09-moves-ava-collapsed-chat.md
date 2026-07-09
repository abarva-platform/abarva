# 2026-07-09-moves-ava-collapsed-chat — Moves aVa Collapsed Chat

## Release ID

`2026-07-09-moves-ava-collapsed-chat`

## Status

`candidate`

## Plain-English Summary

Moves pages now give the deterministic workflow canvas the first viewport. The aVa chat is collapsed by default on Move detail, phase workspace, and origination surfaces, and can be opened on demand into the expanded advisor view. The visible aVa mark uses the same repo-stored aVa asset family used by Home and Intelligence.

## Layer Impact

- `global-control-lane`: Updates shared React UI behavior for Strategic Moves pages and the shared `AgentDock` collapsed restore behavior. No tenant data, schema, retrieval, model prompt, or deployment workflow is changed.

## Client Applicability

- All clients: Yes, for authenticated users visiting Strategic Moves pages.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/agent/AgentDock.tsx`: Adds a collapsed restore mode override and aligns dock marks to the shared aVa asset component.
- `src/components/strategic-moves/StrategicMoveDetailClient.tsx`: Defaults detail-page aVa to collapsed and restores to expanded.
- `src/components/strategic-moves/StrategicMovePhaseClient.tsx`: Defaults all phase-workspace aVa docks to collapsed and restores to expanded.
- `src/components/strategic-moves/StrategicMoveOriginateClient.tsx`: Adds a collapsed aVa launcher for the bespoke origination chat.
- `src/components/strategic-moves/StrategicMoves.module.css`: Adds origination launcher and hidden-chat canvas layout styles.
- Focused component tests updated for the new collapsed-first contract.

## QA / Validation

- `Pass`: `npx eslint src/components/agent/AgentDock.tsx src/components/strategic-moves/StrategicMoveDetailClient.tsx src/components/strategic-moves/StrategicMovePhaseClient.tsx src/components/strategic-moves/StrategicMoveOriginateClient.tsx src/components/strategic-moves/__tests__/StrategicMoveDetailClient.test.tsx src/components/strategic-moves/__tests__/StrategicMoveOriginateClient.test.tsx`
- `Pass`: `npx jest src/components/strategic-moves/__tests__/StrategicMoveDetailClient.test.tsx src/components/strategic-moves/__tests__/StrategicMovePhaseClient.operating-layer.test.tsx src/components/strategic-moves/__tests__/StrategicMoveOriginateClient.test.tsx --runInBand`
- `Pass`: `NODE_OPTIONS='--max-old-space-size=6144' ./node_modules/.bin/tsc --noEmit --pretty false --incremental false`
- `Pass`: `npm run release:check`
- `Pass`: `git diff --check`
- `Blocked`: `npx prettier --check ...` reports style issues in existing large Moves files; `--write` was intentionally not used as final proof because it creates broad formatter churn unrelated to this change.
- `Blocked`: Local Playwright smoke for `/strategic-moves/new` and `/strategic-moves` redirected to Clerk sign-in with a local Clerk session-key mismatch warning, so it did not prove browser-visible Moves UI.

## Rollout Plan

Merge through PR to `main`. The repo-owned Azure Container Apps main deploy workflow will build and promote the image for `app.abarva.ai`; no manual runtime mutation is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this change.
- Approved image digest: To be assigned by the ACA main deploy workflow after merge.
- ACA runtime invariant: Required after deployment before claiming live-proven.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, browser-visible proof on at least one Strategic Moves detail/phase surface before calling the UX live-proven.

## Rollback Plan

Revert the PR. No migrations or data-plane changes are involved.

## Audit Evidence

- Focused Jest output from the component tests listed above.
- Future PR URL and ACA deploy run after merge.

## Known Gaps

`Blocked`: signed-in browser visual proof is not captured yet for this UI candidate because the local dev smoke redirected to Clerk sign-in.
