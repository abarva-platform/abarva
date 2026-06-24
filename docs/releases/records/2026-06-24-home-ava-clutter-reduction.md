# 2026-06-24-home-ava-clutter-reduction — Home aVa Clutter Reduction

## Release ID

`2026-06-24-home-ava-clutter-reduction`

## Status

`candidate`

## Plain-English Summary

Home aVa now presents a cleaner chat surface. The user no longer sees left/right/top/bottom dock controls or internal Home KNOW intent chips in the narrow chat column. Evidence remains available, but it starts collapsed so the first read is the answer, not the debug/proof scaffold.

## Layer Impact

- `global-control-lane`: shared Home surface presentation behavior changes for all clients.
- `global-control-lane`: Home KNOW answer cards use human status labels instead of internal mode/intent labels.

## Client Applicability

- All clients: yes.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/components/home/HomeSurface.tsx`
- `src/components/home/know/HomeKnowAnswerRenderer.tsx`

## QA / Validation

- PASS: focused Home tests:
  `npx jest src/components/home/know/__tests__/HomeKnowAnswerRenderer.test.tsx src/components/home/know/__tests__/HomeKnowAsk.test.tsx src/components/home/__tests__/HomeSurface.test.tsx --runInBand`
- PASS: touched-file ESLint:
  `npx eslint src/components/home/HomeSurface.tsx src/components/home/know/HomeKnowAnswerRenderer.tsx src/components/home/__tests__/HomeSurface.test.tsx src/components/home/know/__tests__/HomeKnowAnswerRenderer.test.tsx`
- PASS: TypeScript compile:
  `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`
- PENDING: release check rerun after release-record format update.
- PENDING: ACA deploy and live smoke verification.

## Deployment Authority

Production deployment authority is Azure Container Apps only. The approved lane is:

1. Build the exact git SHA in Azure Container Registry.
2. Deploy the digest-pinned image to `ca-abarva-web-lab-eastus`.
3. Assign 100% ingress traffic to the healthy revision.
4. Verify `https://app.abarva.ai` after rollout.

Vercel deploys, aliases, or rollback commands are not valid production evidence for this release.

## Rollout Plan

Commit to the clean `origin/main`-based deploy branch, push, build an Azure Container Registry image from the exact commit SHA, deploy to Azure Container Apps, assign 100% traffic to the healthy revision, then verify `https://app.abarva.ai`.

## Rollback Plan

Rollback is an Azure Container Apps traffic operation to the prior healthy revision. No data-plane migration is included.

## Audit Evidence

- Focused local test output.
- TypeScript and release-check output.
- ACR build image tag/digest.
- ACA revision and live route smoke output.

## Context Ingestion Evidence

Not applicable.

## Known Gaps

Signed-in browser screenshot proof is pending until after deployment.
