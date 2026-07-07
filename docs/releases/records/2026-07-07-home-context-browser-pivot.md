# 2026-07-07-home-context-browser-pivot — Restore Home Context Browser Route

## Release ID

`2026-07-07-home-context-browser-pivot`

## Status

`candidate`

## Plain-English Summary

The Home route had flipped back to the older consulting-report surface. This release restores the Home route to the data-backed Context Browser surface: left Context Explorer, center Summary/Data/Gaps/Sources/Relationships tabs, and the right context-quality plus scoped-aVa rail.

The fix does not hardcode the standalone mock values. It restores the route to the existing V7-first browser so Home shows the actual loaded tenant context where V7 is available, with V6 as the existing fallback.

It also sunsets the older Home report surface by deleting `EnterpriseLandscapeHome` from `src/components/home` and adding a release-control guard that fails future PRs if `/home` imports retired Home surfaces again.

## Layer Impact

- `global-control-lane`: Restores the shared `/home` route wiring for all authenticated tenants.
- `client-data-lane`: No schema, ingestion, RLS, or tenant data changes. The page reads existing V7/V6 context browser payloads.
- `internal-admin`: No change.
- `public-demo`: No public route change.

## Client Applicability

- All clients: Yes, authenticated Home users receive the restored Context Browser.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None added.

## Changes Included

- `src/app/(maestro)/home/page.tsx`: restores the `HomeSurface` route wiring, `AppShell` wrapper, active-client/search-param tenant resolution, V7 browser read path, and V6 fallback.
- `src/components/home/EnterpriseLandscapeHome.tsx`: deleted; this retired report surface must not be mounted by `/home`.
- `src/components/home/EnterpriseLandscapeHome.module.css`: deleted with the retired surface.
- `src/components/home/__tests__/EnterpriseLandscapeHome.ask-boundary.test.tsx`: deleted with the retired surface.
- `scripts/release-control/check-home-route-surface.mjs`: adds the executable Home route guard.
- `scripts/release-check.mjs`: runs the Home route guard in the existing release-control gate.

## QA / Validation

- Pass: `npx eslint 'src/app/(maestro)/home/page.tsx' src/components/home/HomeSurface.tsx src/components/home/__tests__/HomeSurface.test.tsx src/__tests__/integration/home/home-v2-all-client-binding.test.ts scripts/release-control/check-home-route-surface.mjs`.
- Pass: `npx jest src/components/home/__tests__/HomeSurface.test.tsx src/__tests__/integration/home/home-v2-all-client-binding.test.ts --runInBand` (13/13 focused Home tests passed; Jest printed existing duplicate manual mock warnings).
- Pass: `git diff --check`.
- Pass: `node scripts/release-control/check-home-route-surface.mjs`.
- Blocked: local browser smoke proof on `http://localhost:3021/home?client=lakeshore`; the clean worktree dev server runs under webpack, but the local Clerk session redirects to `/responsible-ai/acknowledgment` and proxy logs show the session as anonymous. This must be re-proven with a valid acknowledged session or on the deployed ACA app.
- Pass: `npm run release:check`.
- Pass: `npx next build --webpack` (Turbopack build in this clean worktree is blocked before app compilation because `node_modules` is symlinked outside the project root).
- Not run: signed-in live proof; required after ACA deployment.

## Rollout Plan

Merge through PR, then deploy through the repo-owned Azure Container Apps main deployment workflow. After the new ACA revision is healthy and receives 100% traffic, verify `/home` in a signed-in tenant session.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: None beyond normal ACA image rollout.
- Approved image digest: Pending deployment.
- ACA runtime invariant: Must be verified after deployment.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Rollback by reverting this route wiring change and redeploying, or by moving ACA traffic back to the previous healthy revision. No database rollback is required.

## Audit Evidence

- PR URL: Pending.
- Test output: focused lint, Jest, diff check, and release check listed above.
- Browser screenshots: Local blocked proof captured under `proof/home-context-browser-pivot-local-*`; deployed signed-in screenshot pending.
- ACA revision and image digest: Pending deployment.

## Known Gaps

None known at candidate creation.
