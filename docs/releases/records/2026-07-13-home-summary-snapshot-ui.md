# 2026-07-13-home-summary-snapshot-ui - Home Summary Snapshot and Final Enterprise UI

## Release ID

`2026-07-13-home-summary-snapshot-ui`

## Status

`candidate`

## Plain-English Summary

Adds a deterministic Home Summary Snapshot contract so Home has one governed,
read-only summary of the active tenant context before it renders executive
profile, data posture, aVa scope, lineage, and guardrails. The Home surface is
also aligned to the final Enterprise Knowledge UI direction: the right-side aVa
panel is hidden by default and opens only when invoked, keeping the main canvas
for the enterprise profile and context explorer.

## Layer Impact

- Lane: `global-control-lane`
- Derived Intelligence Store: adds deterministic Home summary snapshot
  generation from existing Home context, data-quality, and setup-control reads.
- Module Context APIs: adds a read-only `/api/home/summary-snapshot` route for
  inspecting the same snapshot contract without mutating tenant data.
- Home module view: consumes the snapshot for tenant profile header labels,
  active/candidate state, data origin, and aVa answerability scope.
- Module Memory / Outcome Ledger / Active Tenant Access Layer: no changes.

## Client Applicability

- All clients: yes, Home renders the same snapshot-backed UI pattern for active
  tenants.
- Specific clients: no tenant-specific runtime behavior is introduced.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/home/home-summary-snapshot.ts`
- `src/app/api/home/summary-snapshot/route.ts`
- `src/app/(maestro)/home/page.tsx`
- `src/components/home/HomeSurface.tsx`
- `scripts/audit/build-home-summary-snapshot.ts`
- `src/lib/home/__tests__/home-summary-snapshot.test.ts`
- `reports/home-summary-snapshot/latest/*`
- `npm run audit:home-summary-snapshot`
- `npm run audit:home-ava-snapshot-alignment`
- `npm run test:home-summary-snapshot`

## QA / Validation

- Pass: `npm run test:home-summary-snapshot`
- Pass: `npm run audit:home-summary-snapshot`
- Pass: `npm run audit:home-ava-snapshot-alignment`
- Pass: `npm run audit:data-quality:all-tenants`
- Pass: `npm run audit:tenant-manifest-completeness`
- Pass: `npm run audit:enterprise-naming`
- Pass: `npm run audit:architecture-rules`
- Pass: `npx eslint src/components/home/HomeSurface.tsx src/app/(maestro)/home/page.tsx src/app/api/home/summary-snapshot/route.ts src/lib/home/home-summary-snapshot.ts src/lib/home/__tests__/home-summary-snapshot.test.ts scripts/audit/build-home-summary-snapshot.ts`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npm run build`
- Pass: `npm run release:check`
- Pass: `git diff --check`
- Local browser route note: `/home` correctly redirects to Clerk when unsigned;
  signed-in browser proof is required after ACA deployment.

## Rollout Plan

Merge by pull request into `main`. The repo-owned Azure Container Apps main
deploy workflow builds the image from the merged SHA and deploys to the shared
Product/Lab web runtime. No migration, data load, candidate promotion, or
feature flag update is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: repo-owned ACA main deploy workflow only
- Approved image digest: captured by the deploy workflow after merge
- ACA runtime invariant: required after deploy
- Worker image invariant: required if worker images are part of the deploy proof
- Feature/env flag update path: none
- Live signed-in proof required: yes, Home active context plus aVa launcher/drawer

## Rollback Plan

Revert the pull request and redeploy through the repo-owned ACA main deploy
workflow. Since this release does not write production tenant data, create
candidate versions, promote candidates, or change module runtime consumption,
rollback is limited to restoring the previous Home UI/API code.

## Audit Evidence

- `reports/home-summary-snapshot/latest/home-summary-control.html`
- `reports/home-summary-snapshot/latest/home-summary-snapshots.json`
- `reports/home-summary-snapshot/latest/summary.md`
- Pull request URL and ACA deployment evidence to be attached after merge.

## Known Gaps

This release prepares the governed Home UI data contract and final surface
layout. It does not remediate stranded source domains, regenerate tenant
candidates, promote candidate data, or make modules read candidate data by
default.
