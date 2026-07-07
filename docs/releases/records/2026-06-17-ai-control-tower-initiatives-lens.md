# 2026-06-17-ai-control-tower-initiatives-lens — AI Control Tower Initiatives Lens

## Release ID

`2026-06-17-ai-control-tower-initiatives-lens`

## Status

`candidate`

## Plain-English Summary

Adds an Initiatives lens to AI Control Tower so a CIO or CFO can inspect the individual AI initiatives behind the portfolio totals. The lens shows a list/table of initiatives and a selected-initiative detail read with scope, owner, promised value, measured value, tracking posture, status, and template lineage.

## Layer Impact

- `global-control-lane`: updates the shared AI Control Tower page and lens contract for all clients using the redesigned Tower shell.
- `client-data-lane`: no schema, loader, migration, or client-data write. The lens reads the already-loaded `ai_initiatives` page data.

## Client Applicability

- All clients: yes, for clients with AI initiative registry rows loaded.
- Specific clients: immediately useful for SkyHarbor Air and First Capital Financial demo tenants.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/components/tower/AiControlTowerPage.tsx`
- `src/lib/ai-control-tower/contracts.ts`
- `docs/releases/records/2026-06-17-ai-control-tower-initiatives-lens.md`

## QA / Validation

- `git diff --check`: pass.
- `npm run release:check -- --base origin/main --head HEAD`: pass.
- `npx tsc --noEmit --pretty false`: blocked by pre-existing missing optional packages `@azure-rest/ai-document-intelligence` and `@axe-core/playwright`; no AI Control Tower or lens-contract errors remain after the confidence enum fix.
- Focused ESLint for `src/components/tower/AiControlTowerPage.tsx` and `src/lib/ai-control-tower/contracts.ts`: pass.
- `jest src/components/tower/__tests__/AiControlTowerPage.test.tsx --runInBand`: pass; covers tab selection, dropdown repaint, table-row repaint, and no chat noise.
- Focused browser verification that the Initiatives tab renders, the dropdown changes the selected initiative, and table row clicks repaint the detail panel: blocked locally because the custom one-time-code sign-in screen does not expose the Clerk browser object needed for ticket login; production browser proof is required after deployment.

## Rollout Plan

Merge to `main` through the normal PR flow. The normal Azure Container Apps control-lane deployment publishes the updated Tower UI. No migration, loader, or feature flag is required.

## Rollback Plan

Revert the PR and redeploy the prior ACA revision. No data rollback is required because this is read-only UI over existing initiative rows.

## Audit Evidence

To be attached after PR and deployment:

- PR URL and merged commit.
- CI check set.
- ACA deployment run or explicit deployment status.
- Browser screenshot/crawl evidence for the Initiatives lens.
- Local browser attempt: blocked by auth, not by render or compile failure.

## Known Gaps

This does not add a persistent initiative-detail route, initiative edit workflow, or new evidence loading. It only exposes details already present in the initiative registry on the Tower page.
