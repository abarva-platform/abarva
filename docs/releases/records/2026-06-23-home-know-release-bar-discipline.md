# 2026-06-23-home-know-release-bar-discipline — Home KNOW Answer Discipline

## Release ID

`2026-06-23-home-know-release-bar-discipline`

## Status

`candidate`

## Plain-English Summary

This release tightens the Home KNOW answer path so Home does not leak experts, does not answer exact unknowable questions with generic context tables, and does not return blank graph answers. It also hardens the deep reality crawl so these failures count explicitly instead of hiding behind aggregate shape checks.

## Layer Impact

- `global-control-lane`: Home Ask Ava routing and deterministic Home KNOW response behavior change for all clients.
- `global-control-lane`: The reality crawl release-bar judge becomes stricter for Home expert leakage, generic summaries, citation metadata, exact-question honesty, and missing artifacts.

## Client Applicability

- All clients: Apex Retail, First Capital, SkyHarbor, Meridian, and Lakeshore receive the Home KNOW behavior after deployment.
- Specific clients: None.
- Internal only: QA harness changes are operator-facing.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/lib/home/know/home-know-agent-answer.ts`: Routes every Home Ask Ava question through Home KNOW so the general expert path cannot emit Home experts.
- `src/lib/home/know/home-know-engine.ts`: Adds exact-question gap handling, fallback citations, typed graph artifacts with explicit gaps, and more specific Home prose.
- `scripts/qa/reality-crawl.mjs`: Adds release-bar failures for Home expert leakage, generic Home summaries, citation claims with empty metadata, exact-question bluffing, and artifact blanks.
- `src/lib/home/know/__tests__/home-know-engine.test.ts`: Adds regression tests for broad Home routing, exact unknowns, and graph gap artifacts.

## QA / Validation

- PASS: `npm test -- --runTestsByPath src/lib/home/know/__tests__/home-know-engine.test.ts --runInBand`
- PASS: `npx eslint src/lib/home/know/home-know-engine.ts src/lib/home/know/home-know-agent-answer.ts src/lib/home/know/__tests__/home-know-engine.test.ts scripts/qa/reality-crawl.mjs`
- PASS: `npm run release:check`
- BLOCKED: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` currently fails on repository-wide pre-existing missing dependency/type declarations for `js-yaml`, `@azure-rest/ai-document-intelligence`, and `@axe-core/playwright`, not on the touched Home KNOW files.
- NOT-RUN until after deployment: signed-in tenant matrix and deep reality crawl against `https://app.abarva.ai`

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps deployment builds the exact main SHA and shifts traffic to the new ACA revision. After deployment, rerun the signed-in tenant matrix and the deep reality crawl against `https://app.abarva.ai`.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: None outside the repo-owned ACA deployment.
- Approved image digest: Pending post-merge ACA build.
- ACA runtime invariant: Template image, active revision image, and 100% traffic revision must match.
- Worker image invariant: Not changed.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, deep reality crawl and report after deployment.

## Rollback Plan

Revert this PR and redeploy the previous approved ACA image digest. No schema migration is included.

## Audit Evidence

PR URL, CI run, release check output, and post-deploy reality crawl report.

## Known Gaps

This release improves backend answer discipline and the judge. It does not perform frontend live wiring and does not change Tower shared-thread behavior.
