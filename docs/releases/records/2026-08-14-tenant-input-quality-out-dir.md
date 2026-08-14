# 2026-08-14-tenant-input-quality-out-dir — Keep tenant input quality gate reports out of CI working trees

## Release ID

`2026-08-14-tenant-input-quality-out-dir`

## Status

`candidate`

## Plain-English Summary

The tenant input quality gate already checks active intake files for depth, declared column shape,
line-ending consistency, and hollow rows. Its reports were always written to the checked-in
`reports/canonical-tenant-inputs/latest/` path, which made CI runs leave report artifacts in the
working tree.

This adds an explicit `--out-dir` option and routes the workflow invocation to `/tmp`. Local users can
still omit the flag to refresh the checked-in report intentionally.

## Layer Impact

Release lane: `client-data-lane`. This is a Layer 1 validation-script ergonomics change only.

- **Layer 1 (Client Intake):** report output is configurable; validation semantics are unchanged.
- **Layers 2-4:** unaffected.

## Client Applicability

- All clients: no.
- Specific clients: none.
- Internal only: yes.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `scripts/audit/tenant-input-quality-depth.ts` — adds `--out-dir <path>` and `--out-dir=<path>`
  parsing while preserving the existing default report directory.
- `.github/workflows/canonical-tenant-drift.yml` — runs the gate with a `/tmp` output directory so CI
  can validate without checked-in report churn.

## QA / Validation

| Check                     | Command                                                                           | Result                                                           |
| ------------------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Gate with external output | `npm run audit:tenant-input-quality -- --out-dir /tmp/tenant-input-quality-depth` | pass — 7 active tenants audited; report written outside the repo |
| Script lint               | `npx eslint scripts/audit/tenant-input-quality-depth.ts`                          | pass                                                             |
| Release control           | `npm run release:check`                                                           | pass                                                             |

## Rollout Plan

Merge to `main`. No runtime rollout: this only changes a CI workflow command and a local audit script.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (unchanged).
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: unchanged.
- Worker image invariant: unchanged.
- Feature/env flag update path: not used.
- Live signed-in proof required: no.

## Rollback Plan

Revert the squash commit. The audit returns to writing its reports only under the checked-in default
path when run.

## Audit Evidence

- External-output report from the validation run: `/tmp/tenant-input-quality-depth/tenant-input-quality-depth.md`.
- Workflow command: `.github/workflows/canonical-tenant-drift.yml`, step `Verify tenant input quality,
depth, and column contract`.

## Known Gaps

- Validation findings are unchanged by design. Existing approved waivers remain visible in the
  generated report and still expire on their configured dates.
