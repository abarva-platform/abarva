# 2026-07-12-candidate-preview-route-visibility - Candidate Preview Route Visibility

## Release ID

`2026-07-12-candidate-preview-route-visibility`

## Status

`candidate`

## Plain-English Summary

Allows the new explicit candidate preview admin page to render instead of being
silently consolidated back to the generic Admin setup overview. The page remains
auth-gated and admin-only; this change only fixes browser-visible access to the
inactive-candidate preview proof surface added by PR22.

## Layer Impact

- Lane: `global-control-lane` for the shared route guard behavior.
- Lane: `internal-admin` for the operator-only candidate preview surface.
- Active Tenant Access Layer: No change.
- Candidate tenant data: No writes, no promotion, and no default module reads.
- Module runtime behavior: No change.

## Client Applicability

- All clients: No user-facing default behavior change.
- Specific clients: SkyHarbor synthetic/reference candidate preview route.
- Internal only: Yes, operator/admin preview inspection.
- Public/demo only: None.
- Feature flag: Preview still requires the explicit request flag and inactive
  candidate acknowledgement.

## Changes Included

- `src/proxy.ts`
- `src/__tests__/unit/proxy-public-routes.test.ts`

## QA / Validation

- Pass: focused proxy unit test for candidate preview route visibility
- Pass: `npm run audit:candidate-preview-enablement`
- Pass: `npm run audit:enterprise-naming`
- Pass: `npm run audit:architecture-rules`
- Pass: `npm run release:check`
- Pass: focused ESLint for changed files
- Pass: isolated TypeScript compile for changed proxy/test files
- Pass: `npm run build`
- Pass: `git diff --check`

## Rollout Plan

Merge to `main` by PR and let the repo-owned Azure Container Apps main deploy
workflow build and deploy the digest-pinned image. After deployment, verify
health, runtime invariant, signed-in crawl, and a targeted live candidate
preview browser check.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this PR.
- Approved image digest: Captured by the ACA main deploy workflow after merge.
- ACA runtime invariant: Required after deployment.
- Worker image invariant: Required by the deploy workflow if worker images are
  in scope.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert this PR and redeploy through the repo-owned ACA main deploy workflow.
Rollback is code-only because no production tenant data is written and no
active tenant access pointer is updated.

## Audit Evidence

- PR URL
- Focused test output
- ACA deploy run
- Runtime invariant proof
- Signed-in crawl artifact
- Targeted live candidate preview screenshot

## Known Gaps

This fixes route visibility only. It does not promote any candidate, make
candidate data active, or change default module runtime reads.
