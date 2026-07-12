# 2026-07-12-admin-setup-control — Admin Setup-Control API

## Release ID

`2026-07-12-admin-setup-control`

## Status

`candidate`

## Plain-English Summary

Admin now has a read-only setup-control contract that separates uploaded files
from candidate data versions, promotion gates, and module readiness. The change
also labels legacy Admin import paths so operators can see when a path is not
candidate-version promoted.

## Layer Impact

- Control plane: Adds `GET /api/admin/setup-control` and a compact Admin
  overview panel backed by the setup-control read model.
- Data plane: Read-only. No tenant facts, candidate versions, active access
  pointers, or module runtime read paths are changed.
- Governance: Labels legacy direct import paths as legacy controlled imports
  and documents the candidate-version runway.

## Client Applicability

- All clients: Yes, the read model and guard labels are shared Admin behavior.
- Specific clients: None.
- Internal only: Admin/setup operators.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/admin/setup-control.ts`
- `src/app/api/admin/setup-control/route.ts`
- `src/components/admin/AdminSetupExperience.tsx`
- Legacy import labels in Admin upload, bulk upload, loader commit, and triage
  routes.
- `scripts/audit/admin-data-control-center.mjs`
- `docs/architecture/admin-data-control-center.md`
- `reports/admin-setup-control/airline-demo/setup-control.json`
- `reports/admin-setup-control/airline-demo/setup-control-summary.md`

## QA / Validation

- `npm run audit:admin-data-control-center` — Pass
- `npx jest src/lib/admin/__tests__/setup-control.test.ts src/app/api/admin/setup-control/__tests__/route.test.ts --runInBand` — Pass
- `npm run audit:enterprise-naming` — Pass
- `npm run audit:architecture-rules` — Pass
- `npm run release:check` — Pass
- `npx tsc --noEmit --pretty false` — Pass
- `git diff --check` — Pass

## Rollout Plan

Merge through the normal PR lane. The route is read-only and becomes available
after the next ACA deployment from main.

## Deployment Authority

- Repo-owned deploy workflow: Required for ACA production/lab deploy.
- Shared runtime mutators: None in this PR.
- Approved image digest: Not applicable until deploy.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Required before claiming browser-visible
  production proof.

## Rollback Plan

Revert the PR. Since no tenant data is written and no active access pointer is
changed, rollback is code-only.

## Audit Evidence

- Setup-control API contract tests.
- Admin data-control-center audit script.
- Airline Demo proof JSON and summary under `reports/admin-setup-control`.
- Architecture note under `docs/architecture/admin-data-control-center.md`.

## Known Gaps

- No candidate tenant data version table/model is created in this PR.
- No Active Tenant Access Layer pointer is updated.
- No candidate promotion or rollback action exists yet.
- Admin visual redesign is deferred to PR23.
- Live ACA/browser proof is not claimed until deployed and verified.
