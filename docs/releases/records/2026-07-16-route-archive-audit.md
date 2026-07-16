# 2026-07-16-route-archive-audit — Route Archive Audit and First Cleanup

## Release ID

`2026-07-16-route-archive-audit`

## Status

`candidate`

## Plain-English Summary

Adds a controlled route-retirement audit for the Next.js App Router and applies the first approved cleanup slice. The audit inventories every page route, counts route references, and classifies routes as keep, redirect-candidate, archive-candidate, or human-review. The cleanup removes the page files that the audit identified as safe archive or redirect-backed legacy aliases, while preserving compatibility through `next.config.ts` redirects.

## Layer Impact

- Release lane: `global-control-lane`.
- Internal admin / engineering control: adds an operator audit script and report bundle for route cleanup planning.
- Runtime product behavior: retires selected old page routes and relies on config-level redirects for legacy paths.
- APIs, data plane, middleware, navigation, and client data behavior are unchanged.

## Client Applicability

- All clients: legacy route compatibility redirects apply globally.
- Specific clients: none.
- Internal only: no.
- Public/demo only: removes two unreferenced dev/preview pages.
- Feature flag: none.

## Changes Included

- Adds `scripts/audit/route-archive-audit.mjs`.
- Adds `npm run audit:route-archive`.
- Adds generated report files under `reports/route-archive-audit/`.
- Removes archived page routes:
  - `src/app/_dev/agent-dock/page.tsx`
  - `src/app/(maestro)/preview/nexus/page.tsx`
- Removes redirect-backed legacy page aliases:
  - `src/app/(maestro)/moves/page.tsx`
  - `src/app/(maestro)/moves/[moveId]/page.tsx`
  - `src/app/programs/compare/page.tsx`
  - `src/app/programs/patterns/page.tsx`
  - `src/app/programs/expert-kernel/page.tsx`
  - `src/app/programs/expert-kernel/expert-review/page.tsx`
- Adds explicit compatibility redirects for:
  - `/programs/expert-kernel`
  - `/programs/expert-kernel/expert-review`
  - `/preview/nexus`

## QA / Validation

- Pass: `node --check scripts/audit/route-archive-audit.mjs`
- Pass: `npm run audit:route-archive`
- Pass: `npx tsx -e "<redirect contract check>"`
- Pass: `git diff --check`
- Pass: `npm run release:check`

## Rollout Plan

Merge through PR. This changes route resolution only for retired legacy/dev/preview page routes. Normal main deploy will carry the route cleanup to ACA; no data migration or feature flag rollout is required.

## Deployment Authority

- Repo-owned deploy workflow: required before production reflects the route cleanup.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: required only after normal deployment.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: no for authenticated product workflows; redirect smoke is sufficient for changed legacy paths.

## Rollback Plan

Revert the PR to restore the retired page files, remove the added redirects, and remove the audit script/report if needed. No data, migration, or worker rollback is required.

## Audit Evidence

- Report bundle: `reports/route-archive-audit/`
- PR URL: https://github.com/abarva-platform/abarva/pull/4859

## Known Gaps

- The 26 remaining human-review routes are intentionally untouched.
- Classification is conservative and literal-reference based; externally linked, role-gated, and dynamic routes still require human owner review.
