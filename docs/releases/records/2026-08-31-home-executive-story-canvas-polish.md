# 2026-08-31 Home Executive Story Canvas Polish

## Release ID

`2026-08-31-home-executive-story-canvas-polish`

## Status

`candidate`

## Plain-English Summary

This change tightens the Home executive story shell so it behaves more like a product canvas and less like a document page. The active Home canvas now fills the shell with internal scrolling, and the evidence entry controls have explicit title/body separation.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 PRODUCTS only. The change affects Home executive story rendering and its UI regression test. It does not change source files, canonical data, projections, serving views, loaders, migrations, or tenant rows.

## Client Applicability

- All clients: yes, wherever the Home executive story preview surface is enabled.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/components/home/v4/ExecutiveStoryPage.tsx`
- `src/components/home/v4/HomeV4App.tsx`
- `src/components/home/v4/__tests__/HomeV4App.tier1.test.tsx`

## QA / Validation

Status: PASS.

- PASS — `npx jest --runTestsByPath src/components/home/v4/__tests__/HomeV4App.tier1.test.tsx --runInBand`
- PASS — `npx eslint src/components/home/v4/ExecutiveStoryPage.tsx src/components/home/v4/HomeV4App.tsx src/components/home/v4/__tests__/HomeV4App.tier1.test.tsx`
- PASS — `git diff --check`
- PASS — `npm run release:check`

## Rollout Plan

Merge through a pull request. The repo-owned Azure Container Apps main deploy workflow publishes the rendering update after merge.

## Deployment Authority

- Repo-owned deploy workflow: Required after merge before claiming runtime availability.
- Shared runtime mutators: None in this PR.
- Approved image digest: Produced by the repo-owned deploy workflow.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: Required before claiming rendered Home proof.

## Rollback Plan

Revert the PR and redeploy through the repo-owned main deploy workflow. No data rollback is required.

## Audit Evidence

Inspect the PR diff, UI regression test output, release-control output, ACA deploy evidence, and signed-in Home screenshots after deployment.

## Known Gaps

This PR improves the Home shell and control layout only. It does not regenerate Home narrative content or redesign the architecture/data browser workbenches.
