# 2026-07-03-home-v6-context-strength-labels — Home V6 Context Strength Labels

## Release ID

`2026-07-03-home-v6-context-strength-labels`

## Status

`candidate`

## Plain-English Summary

Home no longer presents every context area as the same percentage coverage score when V6 source previews are available. The context selector now shows source rows and evidence gaps for each dimension, and the dimension detail view shows evidence gaps instead of a repeated generic coverage percentage.

## Layer Impact

- `global-control-lane`: Updates the shared Home context browser presentation for signed-in product users.
- `public-demo`: Improves demo clarity by making loaded context dimensions easier to explain before recording.

## Client Applicability

- All clients: Yes, wherever Home has V6 browser previews.
- Specific clients: Not client-specific.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/home/HomeSurface.tsx`
- `src/components/home/__tests__/HomeSurface.test.tsx`

## QA / Validation

- Pass: `npm test -- --runTestsByPath src/components/home/__tests__/HomeSurface.test.tsx src/lib/home/__tests__/v6-context-browser.test.ts`
- Pass: `npx eslint src/components/home/HomeSurface.tsx src/components/home/__tests__/HomeSurface.test.tsx`
- Pending: `npm run release:check`

## Rollout Plan

Merge to `main`, allow the repo-owned ACA main deploy workflow to build and deploy the new image, then verify `https://app.abarva.ai/home` with a signed-in browser smoke.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None beyond normal ACA deployment.
- Approved image digest: Resolved by ACA main deploy.
- ACA runtime invariant: Required in ACA main deploy.
- Worker image invariant: Required in ACA main deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert this release commit or roll back the ACA revision to the previously healthy image. No schema, migration, or data rollback is required.

## Audit Evidence

- Focused Home test output.
- ESLint output.
- Release check output.
- Post-deploy signed-in Home screenshot/text proof after merge and deploy.

## Known Gaps

This does not solve generic demo-name hygiene across every route/persona. The post-deploy pressure test still found Industrial CFO surfaces showing `Lakeshore Holdings` and Airline Tower showing `SkyHarbor` strings; that is separate from the Home V6 context strength label fix.
