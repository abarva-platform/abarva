# 2026-09-23-home-cross-family-findings — Home Cross-Family Finding Rules

## Release ID

`2026-09-23-home-cross-family-findings`

## Status

`candidate`

## Plain-English Summary

This release lets Home surface a small set of deterministic findings that cross already-served record families. The rules only fire when served rows join through exact declared names or exact delimited values, so unresolved relationship edges remain visible as gaps rather than becoming inferred claims.

## Layer Impact

- Release lane: `global-control-lane`.
- Products: Updates Home chapter-depth rendering for the What Needs Attention chapter.
- Canonical model: No change.
- Source adapters: No change.
- Client intake: No change.

## Client Applicability

- All clients: Applies to Home surfaces that receive the served Home bundle with the relevant record families.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/home/v4/page-tables.ts`
- `src/components/home/v4/chapter-page-content.ts`
- `src/components/home/v4/HomeV4App.tsx`
- `src/components/home/v4/__tests__/cross-family-findings.test.ts`

## QA / Validation

- PASS: `npm test -- --runTestsByPath src/components/home/v4/__tests__/cross-family-findings.test.ts src/components/home/v4/__tests__/relationship-edges.test.tsx`
- PASS: `npx eslint src/components/home/v4/HomeV4App.tsx src/components/home/v4/chapter-page-content.ts src/components/home/v4/page-tables.ts src/components/home/v4/__tests__/cross-family-findings.test.ts`
- PASS: `npm run typecheck`

## Rollout Plan

Merge by PR to `main`, then deploy through the repo-owned ACA main deploy workflow.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the approved workflow.
- Approved image digest: To be recorded by the deploy workflow.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, for the affected Home surface.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main deploy workflow.

## Audit Evidence

- PR URL and CI run to be attached after PR creation.
- Deploy run and runtime invariant to be attached after release.
- Live signed-in proof to be recorded after deploy.

## Known Gaps

This release does not generate new governed graph data and does not infer unresolved edges. Broader executive graph synthesis remains gated on served relationship quality and any required governed data generation.
