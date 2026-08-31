# 2026-08-31-tower-decision-review-link-targets — Tower Decision Review Link Targets

## Release ID

`2026-08-31-tower-decision-review-link-targets`

## Status

`candidate`

## Plain-English Summary

Tower decision review links now open the specific supporting subview for the decision being reviewed instead of only switching to a top-level tab. The change keeps normal tab clicks unchanged while making the decision rail behave like a guided path through evidence.

## Layer Impact

Layer 4 — Products, `global-control-lane`: Updates Tower Command Center client-side navigation only. No source, canonical, projection, serving view, migration, loader, or tenant data changes are included.

## Client Applicability

- All clients: Tower Command Center users receive the improved decision-link behavior.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/tower/command-center/TowerCommandCenter.tsx`
- `src/components/tower/command-center/__tests__/subtab-url-state.test.tsx`

## QA / Validation

- PASS — `npx jest src/components/tower/command-center/__tests__/subtab-url-state.test.tsx --runInBand`
- PASS — `npx jest src/components/tower/command-center/__tests__/TowerCommandCenter.test.tsx src/components/tower/command-center/__tests__/subtab-url-state.test.tsx --runInBand`
- PASS — `npx eslint src/components/tower/command-center/TowerCommandCenter.tsx src/components/tower/command-center/__tests__/subtab-url-state.test.tsx`
- PASS — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit`
- PASS — `git diff --check`
- PASS — `node scripts/release-check.mjs --base origin/main --head HEAD`

## Rollout Plan

Merge through a pull request to `main`. The repo-owned Azure Container Apps main deploy workflow will build and deploy the resulting image.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this release.
- Approved image digest: Assigned by the main deploy workflow.
- ACA runtime invariant: Verified by the main deploy workflow.
- Worker image invariant: Verified by the main deploy workflow.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, for Tower decision review link behavior after deployment.

## Rollback Plan

Revert the pull request and allow the main deploy workflow to publish the previous behavior. No data rollback is required.

## Audit Evidence

- Pull request, CI, and deploy workflow evidence for this release candidate.
- Focused tab-state regression test proving each decision review link writes the intended `tab` and `view` destination.

## Known Gaps

This release only fixes decision-link destinations inside the Tower Command Center. It does not change the underlying Tower data, projection jobs, serving views, or the broader tab/panel content.
