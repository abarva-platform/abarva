# 2026-07-18-active-tenant-module-routing-fix — Active Tenant Module Routing Fix

## Release ID

`2026-07-18-active-tenant-module-routing-fix`

## Status

`candidate`

## Plain-English Summary

This release fixes a routing/read-model problem where Airline and Financial Services demo surfaces could prefer stale local fallback context even though active standard v3 tenant packets exist. Home now prefers active/current context packets, SkyHarbor Intelligence reads the active packet before legacy synthetic V6 files, and Tower no longer applies holdco or healthcare language to Airline and FS demo prompts.

## Layer Impact

- Release lane: `global-control-lane`
- Active tenant context/read model: Home local runtime now resolves active/current standard v3 packets before legacy fallbacks.
- AI prompt context: SkyHarbor Intelligence source attachment now builds from active/current standard v3 files when present.
- UI/advisor shell: Tower suggested questions and budget posture copy are tenant-aware for Airline, FS, Healthcare, and holdco tenants.

## Client Applicability

- All clients: safer active-context routing pattern where active standard v3 packets are present.
- Specific clients: SkyHarbor Air / Airline Demo and First Capital Financial / Financial Services Demo.
- Internal only: no.
- Public/demo only: demo tenants are the primary proof targets.
- Feature flag: none.

## Changes Included

- `src/lib/home/local-cxo-runtime.ts`
- `src/lib/home/v6-context-browser.ts`
- `src/app/(maestro)/home/page.tsx`
- `src/lib/intelligence/skyharbor-cto-readiness.ts`
- `src/lib/intelligence/ask/skyharbor-cto-readiness-source.ts`
- `src/components/tower/TowerIndexPage.tsx`
- Focused Home, Intelligence, and Tower regression tests.
- Local proof artifacts under `reports/active-tenant-module-routing-fix/`.

## QA / Validation

- `npm test -- --runTestsByPath src/lib/intelligence/ask/__tests__/skyharbor-cto-readiness-source.test.ts src/lib/home/__tests__/local-cxo-runtime.test.ts --runInBand` passed.
- `npm test -- --runTestsByPath src/components/tower/__tests__/TowerCioDashboardSurface.test.tsx --runInBand` passed.
- `npx eslint src/lib/home/local-cxo-runtime.ts src/lib/home/v6-context-browser.ts 'src/app/(maestro)/home/page.tsx' src/lib/intelligence/skyharbor-cto-readiness.ts src/lib/intelligence/ask/skyharbor-cto-readiness-source.ts src/components/tower/TowerIndexPage.tsx` passed with existing Tower unused-code warnings only.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` passed.
- `git diff --check` passed.

## Rollout Plan

Merge through the protected PR lane, then allow the repo-owned Azure Container Apps main deploy workflow to build and deploy the image. After deploy, run signed-in Airline and FS browser proof across the affected modules before calling this live-proven.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none from this branch.
- Approved image digest: pending main deploy.
- ACA runtime invariant: required after deploy.
- Worker image invariant: no worker change.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the merge commit or redeploy the previous ACA digest through the approved rollback lane. No database migration or data mutation is included.

## Audit Evidence

- `reports/active-tenant-module-routing-fix/summary.md`
- `reports/active-tenant-module-routing-fix/summary.json`
- Focused Jest, TypeScript, ESLint, release, and diff-check command output.

## Known Gaps

- Production browser proof is pending merge and ACA deploy.
- This release does not reload Azure/Postgres data, promote candidate data, or rewrite module runtime data marts.
