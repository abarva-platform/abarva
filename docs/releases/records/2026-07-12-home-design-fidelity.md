# 2026-07-12-home-design-fidelity — Home Design Fidelity Correction

## Release ID

`2026-07-12-home-design-fidelity`

## Status

`candidate`

## Plain-English Summary

Home was functionally wired but did not visually match the approved Enterprise Knowledge standalone design. This release corrects the Home surface so the default page behaves like the designed context browser: a stable Home header, seven high-level knowledge areas in the left Context Explorer, a default enterprise knowledge overview in the center, and a right-side aVa/evidence rail. Raw context dimensions remain available through selected area drilldowns, but the first screen no longer opens on a raw selected dimension.

## Layer Impact

- `global-control-lane`: updates the shared Home UI component and focused Home component tests.
- `data-plane read model`: no schema, ingestion, candidate, promotion, or active-access change. The visible seven-area explorer is derived from the existing Home browser payload and setup-control read-only fields.

## Client Applicability

- All clients: yes, for the shared Home experience.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/components/home/HomeSurface.tsx`: restores the approved Home Enterprise Knowledge layout, maps raw dimensions into the seven designed Home areas, keeps the default overview tab-free, and reorders the right rail so aVa appears before context quality.
- `src/components/home/__tests__/HomeSurface.test.tsx`: updates focused tests to assert the design contract and selected-area drilldowns.

## QA / Validation

- Pass: `npm test -- --runTestsByPath src/components/home/__tests__/HomeSurface.test.tsx --runInBand`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 ./node_modules/.bin/tsc --noEmit --pretty false`
- Pass: `npx eslint src/components/home/HomeSurface.tsx src/components/home/__tests__/HomeSurface.test.tsx`
- Pass: `git diff --check`

## Rollout Plan

Merge to `main` through PR review. The repo-owned Azure Container Apps main deploy workflow builds and deploys the new web image. After deployment, run signed-in Home browser proof against `https://app.abarva.ai/home` for at least Airline Demo and Lakeshore Holdings.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: none in this PR.
- Approved image digest: produced by the main ACA deploy workflow after merge.
- ACA runtime invariant: verify after deploy.
- Worker image invariant: not affected.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: yes, Home visual proof before claiming live-proven.

## Rollback Plan

Revert the PR or roll ACA traffic back to the prior healthy digest if the Home UI fails signed-in proof. No database rollback is required.

## Audit Evidence

- PR for `codex/home-design-fidelity`.
- Focused Jest, TypeScript, ESLint, and diff-check output.
- Post-deploy signed-in screenshots and DOM checks to be captured after ACA deploy.

## Known Gaps

Live browser proof and ACA revision/digest verification are pending until this candidate is merged and deployed.
