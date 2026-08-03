# 2026-08-02-home-canvas-refresh — Home Canvas Navigation and Architecture Board

## Release ID

`2026-08-02-home-canvas-refresh`

## Status

`candidate`

## Plain-English Summary

Updates the Home command-center experience so the left explorer changes the active canvas instead of navigating through a long scrolling document. The architecture visual is rebuilt as an executive review board with larger, structured architecture zones, lens controls, graph-derived metrics, selected detail, and review agenda context.

## Layer Impact

Release lane: `public-demo`.

Products: Home receives the interaction and visual-quality change. No source, canonical, ingestion, or database behavior changes.

Canonical model: No change. The visual remains bound to the existing graph and advisory payloads already read by Home.

## Client Applicability

- All clients: None.
- Specific clients: None.
- Internal only: None.
- Public/demo only: Home demo command-center surface.
- Feature flag: None.

## Changes Included

- `src/components/home/ai-success-command-center/AiSuccessCommandCenter.tsx`
- `src/components/home/ai-success-command-center/AiSuccessCommandCenter.module.css`
- `src/components/architecture/CurrentStateArchitectureMap.tsx`
- `src/app/(maestro)/home/__tests__/home-admin-boundary-contract.test.ts`

## QA / Validation

- `npx eslint src/components/home/ai-success-command-center/AiSuccessCommandCenter.tsx src/components/architecture/CurrentStateArchitectureMap.tsx src/app/(maestro)/home/__tests__/home-admin-boundary-contract.test.ts` — passed.
- `npm test -- --runTestsByPath src/app/(maestro)/home/__tests__/home-admin-boundary-contract.test.ts --runInBand` — passed.
- `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit --pretty false` — passed.
- `NODE_OPTIONS='--max-old-space-size=8192' npm run build` — passed with pre-existing broad filesystem trace warnings unrelated to this change.
- Local browser proof on `/home#posture` with temporary uncommitted auth bypass — passed. Assertions covered hash clearing, `window.scrollY = 0` after explorer clicks, active canvas changes, architecture board visibility, Cost lens refresh, no desktop/mobile horizontal overflow, and no page errors.

## Rollout Plan

Merge through PR, then deploy through the repo-owned Azure Container Apps main deployment workflow. Verify the live signed-in Home route after traffic moves to the new revision.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this PR.
- Approved image digest: To be recorded after deployment.
- ACA runtime invariant: Required before claiming live.
- Worker image invariant: Not affected.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes, for `/home` explorer clicks and architecture board rendering.

## Rollback Plan

Revert this PR and redeploy the previous approved Azure Container Apps image. No migration or data rollback is required.

## Audit Evidence

- PR URL: To be added after PR creation.
- Local validation commands listed above.
- Local browser evidence ZIP: `home-canvas-refresh-local-qa-20260802T2037.zip` captured outside the repository.
- Local browser evidence SHA-256: `dd7679799f50747d9b81ec3abcabab6ea5834eb3382c499cc8d93738de83330b`
- Live browser screenshots and interaction proof: To be captured after deployment.

## Known Gaps

Production browser proof is pending until the candidate is deployed.
