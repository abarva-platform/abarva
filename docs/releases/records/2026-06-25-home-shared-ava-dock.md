# 2026-06-25-home-shared-ava-dock — Home Uses Shared aVa Chat Shell

## Release ID

`2026-06-25-home-shared-ava-dock`

## Status

`candidate`

## Plain-English Summary

Home now uses the same shared aVa chat dock as Intelligence instead of its older top-of-page ask bar. The chat panel keeps the conversation on the left, supports the shared dock controls, preserves prompt history in the session, and renders the Home KNOW response through the canonical aVa answer packet path.

## Layer Impact

- `global-control-lane`: changes the shared Home React surface for all tenants.
- `frontend/runtime`: replaces the Home-specific chat shell with the shared `AvaChatShell`/`AgentDock` component. The backend Home KNOW endpoint and retrieval contract remain unchanged.

## Client Applicability

- All clients: yes, Home receives the shared chat shell wherever the current Home surface is enabled.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: no new feature flag.

## Changes Included

- `src/components/home/HomeSurface.tsx`
- `src/components/home/__tests__/HomeSurface.test.tsx`

## QA / Validation

- `npx eslint src/components/home/HomeSurface.tsx src/components/home/__tests__/HomeSurface.test.tsx` passed.
- `npx jest src/components/home/__tests__/HomeSurface.test.tsx --runInBand` passed.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` still fails on pre-existing missing declarations/packages outside this change: `js-yaml`, `@azure-rest/ai-document-intelligence`, and `@axe-core/playwright`. No HomeSurface errors remain.

## Rollout Plan

Merge to `main`, build the exact main SHA into an Azure Container Registry image, deploy the image to `ca-abarva-web-lab-eastus`, shift 100% traffic to the new healthy ACA revision, then verify `https://app.abarva.ai/home` in a signed-in browser.

## Deployment Authority

- Repo-owned deploy workflow: preferred path when available; this release is otherwise deployed with the Azure Container Apps operator runbook by explicit user approval.
- Shared runtime mutators: no new mutator path added.
- Approved image digest: to be recorded after ACR build.
- ACA runtime invariant: template image, active revision image, and 100% traffic revision must match the approved main SHA image.
- Worker image invariant: not changed.
- Feature/env flag update path: not changed.
- Live signed-in proof required: yes, Home must show the shared aVa dock and the context explorer canvas after rollout.

## Rollback Plan

Rollback ACA traffic/template to the previous approved main revision. The change is frontend-only and does not include migrations or data-plane changes.

## Audit Evidence

- PR URL: pending.
- CI/checks: pending.
- ACA revision/digest: pending deployment.
- Browser proof: pending deployment.

## Known Gaps

Full TypeScript remains blocked by pre-existing missing dependency declarations/packages outside this release.
