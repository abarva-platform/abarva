# 2026-06-02-source-active-client-ui-404 — Source Active-Client UI 404

## Release ID

`2026-06-02-source-active-client-ui-404`

## Status

`candidate`

## Plain-English Summary

This release tightens the Source event page boundary so a tenant-hinted event URL that conflicts with the active client cookie returns a plain HTTP 404 before the page renders. It closes the remaining anti-enumeration gap found after the prior Source isolation fixes: the page body was generic and leak-free, but Next.js still returned HTTP 200 for the UI route.

## Layer Impact

- `global-control-lane`: Updates shared routing/proxy behavior for authenticated Source event pages.
- `client-data-lane`: Protects client-scoped Source event identifiers from cross-client enumeration when a browser session is pinned to another client.

## Client Applicability

- All clients: Applies to Source event page routing for all client workspaces.
- Specific clients: Verified scenario targets Meridian Health attempting to reach an Apex Retail event URL.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/auth/access-routing.ts`: Adds an active-client-cookie deny predicate for tenant-hinted Source event slugs.
- `src/proxy.ts`: Returns a no-store HTTP 404 when the active client cookie conflicts with the requested Source event slug.
- `tests/unit/access-routing.test.ts`: Adds regression coverage for the active-client cookie deny predicate.
- `.github/workflows/migration-drift-pr.yml`: Runs the required migration-drift check for every PR so non-migration PRs receive the required no-op status.

## QA / Validation

- PASS: `npx jest tests/unit/access-routing.test.ts --runInBand` — 16 tests passed.
- PASS: `npx eslint src/lib/auth/access-routing.ts src/proxy.ts tests/unit/access-routing.test.ts`.
- NOT RUN YET: `npm run release:check -- --base origin/main --head HEAD` will be rerun after this QA status correction.
- BLOCKED/RESOLVED IN THIS PR: GitHub required `New migration drift surface`, but the workflow only triggered on migration-path changes. The workflow now runs for every PR and no-ops when no migrations are added.
- NOT RUN YET: live `tests/e2e/source/cross-tenant-isolation.spec.ts` against `https://app.abarva.ai` with Clerk env loaded; this must run after merge and production deploy.

## Rollout Plan

Merge to `main`; Vercel production deploys the proxy change automatically for the `abarva` and `nexus` projects.

## Rollback Plan

Revert this release commit. The rollback restores the previous behavior where the page body remains generic but the UI route may return HTTP 200 because the denial happens during streamed page rendering.

## Audit Evidence

- PR URL: to be added after opening.
- CI: to be added after PR checks.
- Production deploy: to be added after merge.
- Live E2E output: to be added after production verification.

## Known Gaps

This release only addresses exact HTTP 404 status for tenant-hinted Source event page URLs. Broader Source Golden Event workflow gaps remain outside this fix.
