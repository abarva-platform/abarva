# 2026-08-05-skyharbor-candidate-preview-gate - SkyHarbor Candidate Preview Gate Cleanup

## Release ID

`2026-08-05-skyharbor-candidate-preview-gate`

## Status

`candidate`

## Plain-English Summary

The default post-deploy crawl now proves the active SkyHarbor client surfaces without running an admin-only candidate-preview preflight under a client automation identity. The inactive candidate-preview tooling remains available for an explicit operator proof, and its SkyHarbor tenant key is normalized to the active `skyharbor_global` key.

## Layer Impact

- global-control-lane: Post-deploy crawl behavior changes for the client-facing product proof harness. Admin candidate preview remains a gated, explicit proof surface rather than a default client crawl dependency.
- client-data-lane: The admin candidate-preview proof path now normalizes SkyHarbor to the active tenant key, without mutating tenant data.
- Canonical model: No data model, migration, or runtime tenant data mutation.
- Source adapters: No loader or adapter changes.

## Client Applicability

- All clients: None.
- Specific clients: SkyHarbor Global demo proof lane only.
- Internal only: Post-deploy crawl and admin candidate-preview proof tooling.
- Public/demo only: None.
- Feature flag: `CRAWL_INCLUDE_ADMIN_CANDIDATE_PREVIEW=true` or `--candidate-preview` opts the admin proof back in.

## Changes Included

- `scripts/crawl/post-deploy-harness.ts` makes admin candidate-preview proof opt-in.
- `src/lib/enterprise-data/candidate-preview-enablement/skyharbor-preview-package.ts` uses `skyharbor_global`.
- `src/lib/enterprise-data/candidate-preview-enablement/candidate-preview-enablement.ts` uses the active SkyHarbor tenant key type.
- `src/lib/enterprise-data/candidate-version-build/candidate-version-build.ts` normalizes admin candidate report artifacts to the active SkyHarbor candidate only.
- `src/app/(maestro)/admin/candidate-preview/page.tsx` defaults to `skyharbor_global`.
- `scripts/smoke/p21-post-deploy-crawl.spec.ts` covers the active crawl roster and candidate-preview tenant key.

## QA / Validation

- Pass: `npx tsx scripts/smoke/p21-post-deploy-crawl.spec.ts`
- Pass: `npx jest src/lib/crawl/__tests__/post-deploy-crawl-guard.test.ts src/__tests__/unit/proxy-active-admin-subroutes.test.ts --runInBand`
- Pass: `npx eslint scripts/crawl/post-deploy-harness.ts scripts/crawl/candidate-preview-proof.ts scripts/smoke/p21-post-deploy-crawl.spec.ts src/lib/enterprise-data/candidate-preview-enablement/skyharbor-preview-package.ts src/lib/enterprise-data/candidate-preview-enablement/candidate-preview-enablement.ts src/lib/enterprise-data/candidate-version-build/candidate-version-build.ts 'src/app/(maestro)/admin/candidate-preview/page.tsx'`
- Pass: `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit --pretty false`

## Rollout Plan

Merge to `main`. The repo-owned Azure Container Apps main deploy workflow builds and deploys the web image. The next automatic post-deploy crawl should run only the SkyHarbor client automation persona by default.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: Produced by the deploy workflow.
- ACA runtime invariant: Required after deploy workflow.
- Worker image invariant: Required after deploy workflow.
- Feature/env flag update path: No runtime flag change. `CRAWL_INCLUDE_ADMIN_CANDIDATE_PREVIEW` is opt-in for future operator proof runs.
- Live signed-in proof required: Yes, default post-deploy crawl.

## Rollback Plan

Revert this release and redeploy through the repo-owned ACA workflow. No database rollback is required.

## Audit Evidence

- PR URL and deploy run to be attached after merge.
- Local smoke, Jest, ESLint, TypeScript, and release-check output from this release branch.
- Post-deploy crawl artifact after the ACA deploy.

## Known Gaps

Historical checked-in demo datasets and old release records still contain legacy tenant names. This release removes them from the active default crawl/admin preview proof path; it does not delete archival repository artifacts.
