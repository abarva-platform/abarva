# 2026-06-25-intelligence-agent-shell-route — Intelligence Uses Shared aVa Chat Shell

## Release ID

`2026-06-25-intelligence-agent-shell-route`

## Status

`candidate`

## Plain-English Summary

The tenant-bound `/intelligence` page now uses the shared aVa chat shell with a left-side conversation rail, message history, multi-line composer, and dock controls. The old centered Intelligence ask page and its deterministic explorer fallback were removed from the live route so the page cannot flip back to the old experience for bound tenants.

## Layer Impact

- `global-control-lane`: changes the shared Intelligence surface behavior for all tenant users who land on `/intelligence`.
- `UI/runtime surface`: replaces the old centered ask control with the shared `AvaChatShell`/`AgentDock` path and removes the old `ContextCorpusExplorerPage` fallback from the route.
- `QA guard`: adds route-level tests that fail if `/intelligence` imports the deleted explorer fallback or the old centered `AvaAsk` control.

## Client Applicability

- All clients: yes, applies to every tenant with an Intelligence binding payload.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: no new flag; activated by merge and deploy.

## Changes Included

- `src/app/(maestro)/intelligence/page.tsx`: always renders the tenant-bound `IntelligenceV2Surface` for known tenants and returns `notFound()` instead of old explorer fallback when no binding exists.
- `src/components/intelligence-v2/IntelligenceV2Surface.tsx`: wires the surface to shared `AvaChatShell`, preserves conversation history, streams `/api/intelligence/ask`, renders structured `AvaAnswerPacket` output, and keeps supporting Intelligence tabs in the canvas.
- Deleted `src/components/intelligence-v4/ContextCorpusExplorerPage.tsx`: old fallback page removed.
- Replaced the old route test with `src/__tests__/integration/intelligence/intelligence-agent-shell-route.test.ts`.
- Updated `src/components/intelligence-v2/__tests__/IntelligenceV2Surface.test.tsx`.

## QA / Validation

- `npx jest src/components/intelligence-v2/__tests__/IntelligenceV2Surface.test.tsx src/__tests__/integration/intelligence/intelligence-agent-shell-route.test.ts --runInBand` — passed, 6/6.
- `npx eslint 'src/app/(maestro)/intelligence/page.tsx' src/components/intelligence-v2/IntelligenceV2Surface.tsx src/components/intelligence-v2/__tests__/IntelligenceV2Surface.test.tsx src/__tests__/integration/intelligence/intelligence-agent-shell-route.test.ts` — passed.
- `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit --pretty false` — blocked by existing workspace dependency declaration gaps outside this change: `js-yaml`, `@azure-rest/ai-document-intelligence`, and `@axe-core/playwright`.
- Live signed-in browser proof: required after merge and Azure Container Apps deployment.

## Rollout Plan

Merge to `main`, build the approved Azure Container Apps image from the merge SHA, deploy to `ca-abarva-web-lab-eastus`, assign 100% traffic to the new healthy revision, then verify signed-in `/intelligence` for the five pilot tenants.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: no manual/non-main ACA mutation.
- Approved image digest: to be recorded by deploy workflow.
- ACA runtime invariant: active revision, template image, and 100% traffic image must match the approved main image.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, `/intelligence` must show the shared aVa chat shell, not the old centered ask page.

## Rollback Plan

Revert this PR and redeploy the previous approved main image. No database migration is included.

## Audit Evidence

- PR URL: to be added.
- CI run: to be added.
- ACA revision/digest: to be added after deployment.
- Browser screenshots: to be attached after signed-in proof.

## Known Gaps

This change fixes the Intelligence page shell and removes the old route fallback. It does not redesign Home’s separate dossier/fallback lanes; Home should receive the same one-composer/one-contract treatment in its own scoped PR.
