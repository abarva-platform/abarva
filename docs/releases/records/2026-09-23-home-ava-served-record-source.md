# 2026-09-23-home-ava-served-record-source - Home aVa Served Record Source

## Release ID

`2026-09-23-home-ava-served-record-source`

## Status

`candidate`

## Plain-English Summary

Home aVa now answers from the same served Home bundle resolver that renders the Home page. If the served projection is unavailable, the API keeps the reviewed-snapshot fallback but returns that fallback source explicitly so the answer path is visible instead of silent.

## Layer Impact

Product projection: The Home aVa API now shares the page's served-bundle/fallback resolver and returns record-source metadata with each answer. No intake files, canonical records, serving-table rows, loaders, adapters, tenancy rules, or security checks are changed.

Release lane: `global-control-lane`.

## Client Applicability

- All clients: Home aVa uses the same Home bundle source resolution as the rendered Home page when the route is available.
- Specific clients: None.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/app/api/home/preview/ask/route.ts`
- `src/app/api/home/preview/ask/__tests__/route.test.ts`

## QA / Validation

- `npm test -- --runTestsByPath src/app/api/home/preview/ask/__tests__/route.test.ts` - passed.
- `npm test -- --runTestsByPath 'src/app/(maestro)/home/__tests__/home-page-ecl-route.test.tsx'` - passed.

## Rollout Plan

Open a PR, merge to `main` after checks pass, and let the repo-owned Azure Container Apps main deploy workflow build and promote the image.

## Deployment Authority

- Repo-owned deploy workflow: Required for production.
- Shared runtime mutators: None in this change.
- Approved image digest: To be produced by the repo-owned deploy workflow.
- ACA runtime invariant: Required after deployment.
- Worker image invariant: Required after deployment if the deploy workflow updates workers.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, for `/home` and the Home aVa API.

## Rollback Plan

Revert the Home aVa route change and deploy through the same repo-owned main workflow. No data rollback is required.

## Audit Evidence

- PR URL after creation.
- GitHub checks for the focused route/page tests and release gate.
- ACA main deploy run after merge.
- Signed-in `/home` proof showing the visible record-source label.
- Signed-in Home aVa proof showing the API answer source marker matches the rendered Home source marker.

## Known Gaps

This does not regenerate governed Home content or repair stale authored claims inside a served bundle. It only ensures the rendered page and Home aVa use one visible bundle source path.
