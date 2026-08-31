# 2026-08-31-tower-chat-selected-client-routing — Tower Chat Selected Client Routing

## Release ID

`2026-08-31-tower-chat-selected-client-routing`

## Status

`candidate`

## Plain-English Summary

Tower Command Center chat now posts to the active Tower chat route and carries the selected client key with the question. The server route resolves the Tower answer context from that selected key before reading the current Tower layer, so the assistant and the visible dashboard stay scoped to the same selected client.

## Layer Impact

Layer 4 PRODUCTS, `global-control-lane`: updates the Tower Command Center assistant shell and the Tower chat API route. No intake, adapter, canonical-model, projection, migration, or data-build behavior changes.

## Client Applicability

- All clients: yes, for signed-in Tower Command Center chat.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/components/tower/command-center/TowerCommandCenterAvaShell.tsx`
- `src/app/api/tower/chat/route.ts`
- `src/app/(maestro)/tower/page.tsx`
- `src/components/tower/command-center/__tests__/TowerCommandCenterAvaShell.test.tsx`
- `src/app/api/tower/chat/route.test.ts`

## QA / Validation

- Passed: `npx jest --runTestsByPath src/components/tower/command-center/__tests__/TowerCommandCenterAvaShell.test.tsx src/app/api/tower/chat/route.test.ts --runInBand`
- Passed: `npx eslint src/components/tower/command-center/TowerCommandCenterAvaShell.tsx src/components/tower/command-center/__tests__/TowerCommandCenterAvaShell.test.tsx src/app/api/tower/chat/route.ts src/app/api/tower/chat/route.test.ts 'src/app/(maestro)/tower/page.tsx'`
- Passed: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit`
- Passed: `node scripts/release-check.mjs --base origin/main --head HEAD`

## Rollout Plan

Merge through PR. The repo-owned Azure Container Apps main deployment workflow builds and deploys the updated web image. No manual data-plane job is required.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: none in this change.
- Approved image digest: produced by the main deploy workflow after merge.
- ACA runtime invariant: verify template image and 100% traffic revision after deployment.
- Worker image invariant: no worker image changes.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, verify Tower loads the selected client and Ask aVa returns a governed Tower answer.

## Rollback Plan

Revert the PR and allow the repo-owned main deployment workflow to redeploy the previous route/shell behavior. No data rollback is required.

## Audit Evidence

Inspect the PR diff, focused test output, lint output, TypeScript output, release check output, ACA deployment run, runtime invariant, and signed-in Tower chat proof.

## Known Gaps

The Tower chat answer path remains constrained to the current Tower layer and deterministic answer contract. Free-form generation of arbitrary custom visuals from raw source files is out of scope for this release.
