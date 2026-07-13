# 2026-07-13-admin-data-quality-control-center — Admin Data Quality Control Center

## Release ID

`2026-07-13-admin-data-quality-control-center`

## Status

`candidate`

## Plain-English Summary

Adds an Admin-only, read-only Data Quality Control Center at `/admin/data-quality`. It gives operators one place to see all-tenant source estate depth, candidate coverage, evidence quality, relationship quality, generated-data risk, module readiness impact, promotion blockers, and Admin/Home caveats before anyone treats candidate data as active truth.

This is visibility only. It does not create candidates, promote candidates, write production tenant data, update active pointers, or change any module runtime path.

## Layer Impact

- `internal-admin`: adds the `/admin/data-quality` route, Admin sidebar item, and focused page tests for authorized Admin users.
- `global-control-lane`: joins existing all-tenant quality audit artifacts into a shared read-only Admin model without changing runtime behavior for any tenant.
- `proof/reporting`: adds `npm run audit:admin-data-quality`, which writes deterministic proof artifacts under `reports/admin-data-quality/latest/`.

## Client Applicability

- All clients: Visible to authorized Admin users because the matrix reads all tenants present in the existing all-tenant data-quality audit artifacts.
- Specific clients: None singled out for behavior change; SkyHarbor is highlighted only by the audit/report because it is source-rich and candidate-thin in the existing artifacts.
- Internal only: Yes, this is an Admin/operator control surface.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- New read model: `src/lib/admin/admin-data-quality-control.ts`.
- New route: `/admin/data-quality`.
- Admin navigation/proxy mount for `/admin/data-quality`.
- New audit command: `npm run audit:admin-data-quality`.
- New focused test command: `npm run test:admin-data-quality`.
- New proof artifacts under `reports/admin-data-quality/latest/`.
- Refreshes the stale `/admin` source test to match the current setup-control overview.

## QA / Validation

- `npm run audit:admin-data-quality`: Pass.
- `npm run test:admin-data-quality`: Pass.
- Focused existing Admin subset: Pass after updating the stale `/admin` source expectation to current setup-control behavior.
- `npm run audit:enterprise-naming`: Pass.
- `npm run audit:architecture-rules`: Pass.
- `npm run release:check`: Pass.
- `npx tsc --noEmit --pretty false`: Pass.
- `git diff --check`: Pass.
- Wide 118-file Admin Jest sweep: Blocked by pre-existing unrelated upload/layout/TenantSwitcher/setup-data test failures; 107 suites passed and 11 failed outside the DQ1 route/model/proxy slice.

## Rollout Plan

Merge through PR. Deploy only through the repo-owned Azure Container Apps main deploy workflow. After deploy, verify ACA health/runtime invariant and run signed-in browser proof for `/admin/data-quality`, confirming the page renders the all-tenant quality matrix and tenant details rather than collapsing to the default Admin setup page.

## Deployment Authority

- Repo-owned deploy workflow: Required for any shared product/lab traffic update.
- Shared runtime mutators: None in this PR.
- Approved image digest: Produced by the main ACA deploy workflow after merge.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: No worker change expected; invariant still checked by deploy proof.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, focused `/admin/data-quality` route proof.

## Rollback Plan

Revert this PR and redeploy through the repo-owned ACA main deploy workflow. Rollback removes the route, read model, sidebar/proxy registration, audit command, generated proof artifacts, and tests. No migrations, production data writes, candidate versions, promotions, active-pointer updates, or module runtime behavior changes are introduced, so rollback is code-only.

## Audit Evidence

- PR URL: To be added after PR creation.
- Proof artifacts: `reports/admin-data-quality/latest/summary.md`, `tenant-quality-matrix.json`, `tenant-detail-snapshots.json`, `source-vs-candidate-coverage.json`, `evidence-quality-view.json`, `relationship-quality-view.json`, `module-readiness-impact.json`, `promotion-blockers-view.json`, `admin-home-caveats-view.json`, and `guardrails.json`.
- Local validation output: To be updated after final validation rerun.
- ACA deploy/runtime proof: To be added after merge and deployment.
- Signed-in browser proof: To be added after deployment.

## Known Gaps

- This PR does not redesign Add Data.
- This PR does not create inactive candidates.
- This PR does not promote candidates.
- This PR does not update active pointers.
- This PR does not make modules read candidate data.
- This PR does not perform signed-in browser proof; that remains a post-deploy proof step.
