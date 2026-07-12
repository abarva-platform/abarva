# 2026-07-12-candidate-preview-enablement - Explicit Candidate Preview Enablement

## Release ID

`2026-07-12-candidate-preview-enablement`

## Status

`candidate`

## Plain-English Summary

Adds PR22, a controlled SkyHarbor candidate preview enablement proof. Operators
can exercise candidate preview only through an explicit request with a preview
flag and acknowledgement that the candidate is inactive and not active tenant
truth.

## Layer Impact

- Lane: `global-control-lane` for the shared candidate preview contract and
  read-only preview API/page behavior.
- Lane: `internal-admin` for the operator/admin inspection surface.
- Active Tenant Access Layer: No change. Candidate data is not promoted or made
  active.
- Module Context APIs: Adds a read-only candidate preview enablement contract
  and packet summary for Home, Intelligence, Moves, Source, and Tower.
- Module Memory / Outcome Ledger: No writes and no runtime consumption changes.
- Admin/API surface: Adds an explicit, read-only candidate preview inspection
  path with an inactive-candidate banner.

## Client Applicability

- All clients: No default runtime behavior change.
- Specific clients: SkyHarbor synthetic/reference candidate only.
- Internal only: Operator/admin preview inspection.
- Public/demo only: None.
- Feature flag: Preview requires an explicit request flag; default candidate
  reads remain disabled.

## Changes Included

- `src/lib/enterprise-data/candidate-preview-enablement/*`
- `scripts/audit/build-candidate-preview-enablement.ts`
- `src/app/api/operator/candidate-preview/route.ts`
- `src/app/(maestro)/admin/candidate-preview/page.tsx`
- `docs/architecture/candidate-preview-enablement.md`
- `reports/candidate-preview-enablement/skyharbor/*`
- `npm run audit:candidate-preview-enablement`

## QA / Validation

- Pass: `npm run audit:candidate-preview-enablement`
- Pass: `npm run audit:operator-promotion-workflow`
- Pass: `npm run audit:candidate-preview-mode`
- Pass: `npm run audit:candidate-readiness-control`
- Pass: `npm run audit:candidate-module-workbench-preview`
- Pass: `npm run audit:candidate-module-readiness-preview`
- Pass: `npm run audit:enterprise-naming`
- Pass: `npm run audit:architecture-rules`
- Pass: `npm run release:check`
- Pass: isolated TypeScript compile for candidate preview enablement and route
  files
- Pass: `git diff --check`

## Rollout Plan

Merge to `main` by PR and let the repo-owned Azure Container Apps main deploy
workflow build and deploy the digest-pinned image. After deployment, verify
health, runtime invariant, and signed-in crawl.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this PR.
- Approved image digest: Captured by the ACA main deploy workflow after merge.
- ACA runtime invariant: Required after deployment.
- Worker image invariant: Required by the deploy workflow if worker images are
  in scope.
- Feature/env flag update path: None. Preview is request-scoped and disabled by
  default.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert this PR and redeploy through the repo-owned ACA main deploy workflow.
Because no production tenant data is written and no active access pointer is
updated, rollback is code-only.

## Audit Evidence

- PR URL
- Local audit output
- `reports/candidate-preview-enablement/skyharbor/candidate-preview-enablement.json`
- ACA deploy run
- Runtime invariant proof
- Signed-in crawl artifact

## Known Gaps

This is candidate preview enablement only. It is not active promotion, not
runtime default module consumption, not rollback execution, and not realized
value proof.
