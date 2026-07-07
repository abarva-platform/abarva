# 2026-06-09-strategic-move-origination-redirect — Strategic Move Origination Redirect Fix

## Release ID

`2026-06-09-strategic-move-origination-redirect`

## Status

`candidate`

## Plain-English Summary

Strategic Moves origination now honors the canonical route returned by the backend submit API after a Move is promoted. This prevents the UI from hard-coding a Strategic Moves detail URL that can render a 404 immediately after creation when the server has already supplied the safe Programs detail route.

## Layer Impact

- `global-control-lane`: Updates shared Strategic Moves client-side navigation after P0 promotion for all tenants.
- `client-data-lane`: No source data, tenant records, corpus rows, or schema are changed.

## Client Applicability

- All clients: Yes, any tenant using Strategic Moves origination.
- Specific clients: SkyHarbor Air is the observed failing tenant.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/strategic-moves/StrategicMoveOriginateClient.tsx` now uses `payload.redirectTo` when present.
- `src/components/strategic-moves/resolveOriginationRedirect.ts` contains the pure redirect resolver with an older-response fallback.
- `src/components/strategic-moves/__tests__/StrategicMoveOriginateClient.test.ts` locks the redirect contract.

## QA / Validation

- `npx jest src/components/strategic-moves/__tests__/StrategicMoveOriginateClient.test.ts --runInBand` passed.
- `npx eslint src/components/strategic-moves/StrategicMoveOriginateClient.tsx src/components/strategic-moves/resolveOriginationRedirect.ts src/components/strategic-moves/__tests__/StrategicMoveOriginateClient.test.ts` passed.
- `git diff --check` passed.
- Focused `tsc` check for the pure resolver and test passed.
- Full repo `tsc` in the isolated worktree was blocked by unrelated missing optional packages in the linked dependency tree: `@azure-rest/ai-document-intelligence` and `@axe-core/playwright`.

## Rollout Plan

Merge to `main`, build an Azure Container Apps image from main, deploy by digest, wait for the revision to be ready, shift traffic to the new revision, and verify `app.abarva.ai` health.

## Rollback Plan

Revert the PR or shift Azure Container Apps traffic back to the prior healthy revision.

## Audit Evidence

- PR and CI after opening the release PR.
- Azure Container Apps revision, image digest, traffic proof, and `/api/health` output after deployment.

## Known Gaps

Live signed-in SkyHarbor promotion must be rerun after deployment to confirm the 404 is cleared end to end.
