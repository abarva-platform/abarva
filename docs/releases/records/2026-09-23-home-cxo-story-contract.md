# 2026-09-23-home-cxo-story-contract — Home CXO Story Contract

## Release ID

`2026-09-23-home-cxo-story-contract`

## Status

`candidate`

## Plain-English Summary

Home now keeps its executive-facing story contract tighter on the served-record path. Exhibits use reader-safe language, exhibit count lines are derived from the same record families as the page rail, operating-model platform tables are labelled as resilience and lifecycle evidence, and leadership pages state when interview responses are modelled rather than transcribed before they can be read as testimony.

## Layer Impact

- Release lane: `global-control-lane`.
- Products: updates Home rendering and deterministic Home bundle assembly. The change affects display labels, served-record context wording, and tests; it does not create or mutate client data.
- Canonical model: no schema, data-plane, or canonical object changes.

## Client Applicability

- All clients: yes, wherever Home v4 renders served or reviewed Home bundles.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: existing Home routing only; no new flag.

## Changes Included

- Home v4 exhibit rendering now launders visual title and key-message text through the CXO language gate.
- Home v4 exhibit metadata includes application and workload counts from the active record families.
- Home operating-model platform tables use operating-posture section labels.
- Served Home bundle context reports leadership interview rows as present when the interview family is served.
- Leadership readout surfaces the row-derived interview response basis before leadership material.
- Regression tests cover served-path exhibit language/counts, leadership response basis, operating table labels, and served bundle leadership scope.

## QA / Validation

- `npm test -- --runTestsByPath src/components/home/v4/__tests__/served-record-surface.test.tsx src/components/home/v4/__tests__/page-tables.test.ts src/components/home/v4/__tests__/leadership-interviews.test.ts src/lib/home/preview/__tests__/ecl-projection-bundle.test.ts`
- `npm test -- --runTestsByPath src/components/home/v4/__tests__/every-surface.test.tsx src/components/home/v4/__tests__/readout-label.test.tsx src/components/home/v4/__tests__/HomeV4App.depth.test.tsx src/components/home/v4/__tests__/home-landing.test.tsx src/components/home/v4/__tests__/record-not-served.test.tsx`
- `npx eslint src/components/home/v4/ChapterPage.tsx src/components/home/v4/Exhibit.tsx src/components/home/v4/HomeV4App.tsx src/components/home/v4/page-tables.ts src/components/home/v4/cxo-language.ts src/components/home/v4/__tests__/served-record-surface.test.tsx src/components/home/v4/__tests__/page-tables.test.ts src/lib/home/preview/ecl-projection-bundle.ts src/lib/home/preview/__tests__/ecl-projection-bundle.test.ts` passed with existing warnings in the touched table test file.
- `npm run typecheck`

## Rollout Plan

Merge to main through a pull request. The repo-owned Azure Container Apps main deploy workflow builds and deploys the resulting image to the shared Product/Lab web runtime.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the repo-owned workflow.
- Approved image digest: resolved by the deploy workflow after merge.
- ACA runtime invariant: required before claiming live.
- Worker image invariant: required by the deploy workflow.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, Home route proof after deployment.

## Rollback Plan

Revert the merge commit and run the repo-owned ACA main deploy workflow again. No data rollback or migration rollback is required.

## Audit Evidence

- Pull request URL, CI runs, merge commit SHA, ACA deploy workflow run, and signed-in Home proof will be attached when the candidate is merged and deployed.

## Known Gaps

This release does not implement cross-family executive findings, full walkthrough export, graph artifacts, or aVa quality-gate changes.
