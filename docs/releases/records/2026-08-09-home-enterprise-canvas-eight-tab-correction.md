# 2026-08-09-home-enterprise-canvas-eight-tab-correction - Home Canvas Correction

## Release ID

`2026-08-09-home-enterprise-canvas-eight-tab-correction`

## Status

`candidate`

## Plain-English Summary

This release corrects the Home Enterprise Landscape surface so it follows the approved eight-tab executive canvas rather than adding separate context and architecture pages. Context and architecture signals remain visible, but they now support the executive story inside Patterns and Coherence. The tabs are visually differentiated: Summary anchors, Patterns portrait, Economics bridge, Posture heatmap, Coherence relationship and architecture flow, Trajectory shift table, Watchlist signals, and Evidence confidence view.

## Layer Impact

`global-control-lane` - Home UI and deterministic render model only. No data-plane mutation, schema change, prompt execution, publication, client activation, or tenant data load.

## Client Applicability

- All clients: Home shell behavior and tab contract.
- Specific clients: none; the current package remains synthetic and planning-grade.

## Changes Included

- Removes Context and Architecture as top-level Home tabs.
- Preserves loaded context metrics inside Patterns.
- Preserves source-to-consumption Data and AI architecture inside Coherence.
- Replaces the thin relationship map with a larger governed constraint-map SVG.
- Reworks Posture into a normalized heatmap.
- Updates Trajectory, Watchlist, and Evidence copy to match executive confidence and authority boundaries.
- Redirects legacy `?view=context` to Patterns and `?view=architecture` to Coherence.

## QA / Validation

- Pass: `npx eslint src/components/home/enterprise-landscape-v2/homeEnterpriseLandscapeV2Model.ts src/components/home/enterprise-landscape-v2/HomeEnterpriseLandscapeV2.tsx src/app/'(maestro)'/home/page.tsx src/components/home/enterprise-landscape-v2/__tests__/HomeEnterpriseLandscapeV2.test.tsx src/app/'(maestro)'/home/__tests__/home-admin-boundary-contract.test.ts`
- Pass: `npx jest src/components/home/enterprise-landscape-v2/__tests__/HomeEnterpriseLandscapeV2.test.tsx --runInBand`
- Pass: `npx jest --runTestsByPath 'src/app/(maestro)/home/__tests__/home-admin-boundary-contract.test.ts' --runInBand`
- Pass: `npm run build -- --webpack`
- Note: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` still reports existing generated `.next/types` route-export errors outside this Home slice.

## Rollout Plan

Merge to `main`, let the repo-owned ACA main deployment workflow build and deploy the digest-pinned web image, then verify `/home` in a signed-in browser session.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: none in this PR.
- Approved image digest: assigned by the main deploy workflow after merge.
- ACA runtime invariant: prove after deploy.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, for `/home` and representative tabs.

## Rollback Plan

Revert this release and redeploy the prior known-good web image through the same ACA main deploy workflow.

## Audit Evidence

- PR URL
- Focused Jest output
- ESLint output
- Next production build output
- Signed-in `/home` screenshots after deployment

## Known Gaps

This release does not run a new Claude synthesis and does not claim a new deterministic content pipeline. It corrects the current deterministic Home rendering contract while preserving the planning-grade evidence boundary.
