# 2026-07-16-tower-cxo-business-story-fix — Tower CXO Business Story Fix

## Release ID

`2026-07-16-tower-cxo-business-story-fix`

## Status

`candidate`

## Plain-English Summary

Tower's selected Meridian runtime view now leads with a CIO/CFO business story instead of internal proof machinery. The page presents budget posture, planned value, evidence blockers, and leadership decisions in executive language while retaining the governed runtime classification and bridge diagnostics for the Evidence/Diagnostics layer.

## Layer Impact

- Lane: `global-control-lane`.
- Product UI: updates the Tower selected runtime panel to use a CXO-facing story layer and calmer executive exhibit copy.
- Tower read model: adds a read-only story projection on top of the existing Tower runtime view model; deterministic metrics, value hypotheses, gates, and diagnostics remain unchanged.
- Governance: keeps outcome-proof language blocked unless the existing claim gate allows it; no realized value, savings, ROI, achieved, or measured-outcome claims are introduced.

## Client Applicability

- All clients: no broad default behavior change outside the selected Tower runtime view.
- Specific clients: Meridian / Healthcare Demo Tower runtime view benefits from the business-story presentation.
- Internal only: no.
- Public/demo only: no.
- Feature flag: uses the existing selected Tower runtime flag path; this PR does not create or mutate flags.

## Changes Included

- `src/lib/tower/tower-v3-runtime-view.ts`: adds the `TowerCxoStory` projection and business tab posture while preserving runtime source classifications.
- `src/components/tower/TowerIndexPage.tsx`: renders the CXO story in the primary Tower panel and moves technical diagnostics away from the executive first read.
- `src/lib/tower/__tests__/tower-v3-runtime-view.test.ts`: adds regression coverage that the primary CXO story does not expose runtime proof vocabulary or unsupported outcome claims.

## QA / Validation

- Pass: `npm test -- --runTestsByPath src/lib/tower/__tests__/tower-v3-runtime-view.test.ts --runInBand`
- Blocked/Retry required: initial `npx tsc --noEmit --pretty false` exceeded the default Node heap before diagnostics; rerun with a larger heap before merge.

## Rollout Plan

Merge through the protected PR lane. The repo-owned Azure Container Apps main deploy workflow must build and deploy the image. After deployment, run signed-in Meridian Tower proof to confirm the page shows the executive business story and keeps diagnostics scoped to Evidence/Diagnostics.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: none in this PR.
- Approved image digest: assigned by the ACA main deploy workflow after merge.
- ACA runtime invariant: required before claiming live.
- Worker image invariant: not applicable.
- Feature/env flag update path: existing approved flag path only; no ad-hoc ACA mutation.
- Live signed-in proof required: yes, Meridian Tower signed-in browser proof.

## Rollback Plan

Revert the PR or redeploy the previous digest-pinned ACA image through the approved lane. No migrations or data writes are included.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/4883
- Local test: focused Tower runtime view Jest test.
- Live proof: pending post-merge ACA deployment.

## Known Gaps

This PR does not implement batch Claude generation of Tower story blocks or visual specs. It provides the immediate deterministic CXO business-story layer and keeps the full Claude-generated story-block architecture as a future slice.
