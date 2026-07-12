# 2026-07-12-admin-overview-setup-control — Admin Overview Setup-Control Redesign

## Release ID

`2026-07-12-admin-overview-setup-control`

## Status

`candidate`

## Plain-English Summary

Admin Overview now behaves like a tenant setup and data-control landing page. It
shows uploaded evidence, candidate-version status, active-access status, module
readiness, promotion blockers, and source-of-truth caveats without implying that
uploaded files are already active module context.

## Layer Impact

- Control plane: Redesigns the Admin Overview around the existing
  setup-control read model from ADMIN-PR1.
- Data plane: Read-only. No candidate versions, active access pointers, tenant
  facts, or module runtime paths are changed.
- Governance: Makes the truth split visible in the default Admin landing view:
  uploaded evidence, candidate state, active state, and runtime state are
  separate.

## Client Applicability

- All clients: Yes, shared Admin setup experience.
- Specific clients: None.
- Internal only: Admin/setup operators.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/admin/AdminSetupExperience.tsx`
- `scripts/audit/admin-data-control-center.mjs`
- `docs/architecture/admin-data-control-center.md`
- `reports/admin-setup-control/admin-pr2-overview-readout.md`

## QA / Validation

- `npm run audit:admin-data-control-center` — Pass
- `npx jest src/lib/admin/__tests__/setup-control.test.ts src/app/api/admin/setup-control/__tests__/route.test.ts --runInBand` — Pass
- `npm run audit:enterprise-naming` — Pass
- `npm run audit:architecture-rules` — Pass
- `npm run release:check` — Pass
- `npx tsc --noEmit --pretty false` — Pass
- `git diff --check` — Pass

## Rollout Plan

Merge after ADMIN-PR1, then deploy through the approved ACA main deploy lane.
This PR is stacked on ADMIN-PR1 because the overview consumes the setup-control
contract added there.

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

Revert the PR or return the Admin Overview to the ADMIN-PR1 compact control
panel. Since this PR is read-only, rollback is code-only.

## Audit Evidence

- Admin data-control-center audit checks for the redesigned overview strings.
- Existing setup-control API and read-model tests from ADMIN-PR1.
- PR2 readout under `reports/admin-setup-control`.

## Known Gaps

- No Add Data redesign.
- No tenant packet dry-run flow.
- No candidate preview or promotion control actions.
- No production tenant writes.
- No Active Tenant Access Layer update.
- No module runtime behavior change.
