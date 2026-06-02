# 2026-06-02-source-artifact-api-404 — Source Artifact API 404

## Release ID

`2026-06-02-source-artifact-api-404`

## Status

`candidate`

## Plain-English Summary

This release closes the remaining Source artifact API anti-enumeration gap found by the live cross-tenant Playwright gate. After the Source event page and event-detail API returned exact 404s for a Meridian user probing an Apex Retail event, the artifact body endpoint still returned HTTP 405 because the route did not support GET. That revealed route shape before the tenant guard ran. This change makes artifact body and render requests prove event access first and return a generic 404 for out-of-tenant event ids.

## Layer Impact

- `global-control-lane`: Updates shared Source API route behavior for artifact body and render endpoints.
- `client-data-lane`: Protects client-scoped Source event and artifact identifiers from cross-client enumeration.

## Client Applicability

- All clients: Yes. Applies to Source artifact API routes for all client workspaces.
- Specific clients: Verified scenario targets Meridian Health attempting to reach an Apex Retail Source event and artifact URL.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/body/route.ts`: Adds tenant-safe GET support and moves the PATCH tenant guard ahead of request body validation.
- `src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/render/route.ts`: Adds POST support and moves event/auth checks ahead of format, variant, and artifact-code validation.

## QA / Validation

- PASS: `npx jest tests/unit/access-routing.test.ts src/lib/source/__tests__/queries-tenant-scope.test.ts --runInBand` — 22 tests passed.
- PASS: `npx eslint 'src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/body/route.ts' 'src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/render/route.ts'`.
- PASS: `git diff --check`.
- PASS: `npm run release:check -- --base origin/main --head HEAD`.
- KNOWN REPO ISSUE: `npx tsc --noEmit --pretty false` currently fails before checking this slice because `tests/accessibility/public-axe.spec.ts` imports missing `@axe-core/playwright` types.
- NOT RUN YET: live `tests/e2e/source/cross-tenant-isolation.spec.ts` against `https://app.abarva.ai` must pass after merge and production deploy.

## Rollout Plan

Merge to `main`; Vercel production deploys the API route changes automatically for the `abarva` and `nexus` projects.

## Rollback Plan

Revert this release commit. Rollback restores the previous method behavior, including the artifact body GET returning 405 before tenant scoping.

## Audit Evidence

- PR URL: https://github.com/anandsundaram-hash/abarva/pull/2793
- CI: to be added after PR checks.
- Production deploy: to be added after merge.
- Live E2E output: to be added after production verification.

## Known Gaps

This release only addresses cross-tenant anti-enumeration for the artifact body and unified artifact render API routes. Broader Source Golden Event workflow gaps remain outside this fix.
