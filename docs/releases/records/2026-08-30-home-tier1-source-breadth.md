# 2026-08-30-home-tier1-source-breadth — Home Tier 1 Source Breadth

## Release ID

`2026-08-30-home-tier1-source-breadth`

## Status

`candidate`

## Plain-English Summary

Home preview now opens on a concise executive story instead of the chapter/tab explorer. The story uses six leadership questions, keeps drilldowns available for architecture and evidence review, and avoids filling unsupported sections with weak prose. The enterprise thesis packet also carries source-file breadth summaries so the deterministic writer can see which source families are present, thin, or absent before writing the narrative.

## Layer Impact

- Lane: `global-control-lane`.
- Layer 4 Products: Home preview defaults to a Tier 1 executive story while retaining the existing deeper explorer paths.
- Layer 2 Source Adapters / Narrative Build: the enterprise signal packet now includes non-citable source summaries and named packet limits so narrative generation has better context without turning file summaries into claim evidence.
- Documentation: the Home V2 design contract records the source-breadth packet rules, packet limits, and visual intent boundary.

## Client Applicability

- All clients: Home preview behavior and narrative generation contract.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none in this slice.

## Changes Included

- New Home Tier 1 executive story component.
- Home preview default route state opens on the executive story; architecture, data-flow, and evidence browser remain available through drilldowns and hashes.
- Enterprise signal packet adds `sourceSummaries` plus named packet limits.
- Enterprise thesis prompt records the larger output budget and explains how source summaries may and may not be used.
- Home V2 design doc updated with source-breadth, packet-limit, and visual-intent contracts.

## QA / Validation

- PASS: `npm test -- tests/behaviors/build-home-chapters.test.ts tests/behaviors/enterprise-thesis-validation.test.ts scripts/data-build/__tests__/enterprise-signal-packet.test.ts src/components/home/v4/__tests__/HomeV4App.tier1.test.tsx --runInBand`
- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false`
- PASS with warnings: `npx eslint src/components/home/v4/ExecutiveStoryPage.tsx src/components/home/v4/HomeV4App.tsx src/components/home/v4/__tests__/HomeV4App.tier1.test.tsx scripts/data-build/enterprise-signal-packet.ts scripts/data-build/build-enterprise-thesis.ts scripts/data-build/__tests__/enterprise-signal-packet.test.ts scripts/ecl/build_home_ecl_narrative_layer.ts tests/behaviors/build-home-chapters.test.ts tests/behaviors/enterprise-thesis-validation.test.ts`

ESLint reported warnings in an existing ECL narrative loader but no errors.

## Rollout Plan

Merge to `main` by PR. The repo-owned Azure Container Apps main deploy workflow builds and deploys the resulting image.

## Deployment Authority

- Repo-owned deploy workflow: required for live rollout.
- Shared runtime mutators: none outside the deploy workflow.
- Approved image digest: resolved by the deploy workflow.
- ACA runtime invariant: required before claiming live.
- Worker image invariant: not changed by this slice.
- Feature/env flag update path: none.
- Live signed-in proof required: required before claiming product proof.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main deploy workflow. The old Home preview chapter explorer remains in the code path and can also be reached by hash while this release is active.

## Audit Evidence

- PR and deploy workflow evidence to be added after merge.
- Local focused tests, TypeScript, and ESLint commands listed above.

## Known Gaps

- This slice does not regenerate tenant narrative content. It improves the page shell and the deterministic writer context contract.
- Existing ECL narrative loader warnings are not addressed in this release.
