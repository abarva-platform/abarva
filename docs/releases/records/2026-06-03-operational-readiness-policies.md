# 2026-06-03-operational-readiness-policies - DSAR, Retention, And Vendor Management

## Release ID

`2026-06-03-operational-readiness-policies`

## Status

`candidate`

## Plain-English Summary

Adds operational runbooks for DSAR intake, company records retention, and vendor
management. These close important operating-policy gaps without changing runtime
behavior or starting private data-plane implementation.

## Layer Impact

- `internal-admin`: Adds founder/operator policy runbooks for privacy,
  retention, and vendor governance.
- `global-control-lane`: Documents controls that apply across customers and
  release operations, with no product runtime impact.

## Client Applicability

- All clients: Indirect operating-policy benefit only.
- Specific clients: None.
- Internal only: AbarVa founder/operator use.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `docs/runbooks/dsar-process.md`
- `docs/runbooks/records-retention-policy.md`
- `docs/runbooks/vendor-management.md`

## QA / Validation

- `git diff --check`
- `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to `main` through the merge queue. No runtime deploy, database migration,
Azure rollout, Vercel rollout, or feature flag is required.

## Rollback Plan

Revert the documentation commit if the policies need to be replaced. There is
no runtime rollback.

## Audit Evidence

- Pull request URL after opening.
- This release record.
- The three runbooks listed above.

## Known Gaps

- T119 remains In progress until a first manual DSAR record template or issue
  process is identified for live operations.
- T122 remains In progress until the first live vendor register location is
  identified.
- Automated DSAR tooling, lifecycle-rule enforcement, and vendor renewal
  reminders are separate future implementation work.
