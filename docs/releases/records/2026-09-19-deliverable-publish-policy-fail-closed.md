# 2026-09-19-deliverable-publish-policy-fail-closed — Require explicit publish rights for sign-off

## Release ID

`2026-09-19-deliverable-publish-policy-fail-closed`

## Status

`candidate`

## Plain-English Summary

The agent tools that save a signed-off Programs deliverable already refused users whose access
policy explicitly denied publish rights. They did not refuse when no access policy was resolved at
all. Because sign-off creates governed gate evidence, a missing policy must not behave like an
implicit grant.

The single-deliverable and batch-deliverable tools now require
`canPublishDeliverables === true` for sign-off. An absent policy and an explicit denial both refuse
before persistence. Saving a draft with `sign_off:false` remains available without publish rights.

## Layer Impact

Release lane: `global-control-lane`.

- **Agent write controls:** Programs deliverable sign-off authorization.
- **Product data and schema:** unchanged.
- **Client intake, adapters, and canonical projections:** unchanged.

## Client Applicability

- All clients using agent-assisted Programs deliverable persistence.
- No client-specific configuration, data, content, or exception is introduced.

## Changes Included

- Fail closed when the single-deliverable tool receives no publish policy.
- Fail closed when the batch-deliverable tool receives no publish policy.
- Keep explicit draft persistence available when sign-off is false.
- Make authorized test contexts state their publish entitlement explicitly.

## QA / Validation

- Failing first: 2 suites / 2 tests failed because both tools advanced into persistence when the
  policy was absent.
- Focused after repair: 2 suites / 21 tests pass.
- Full agent-tool directory: 11 suites / 82 tests pass.
- Removing either fail-closed condition is caught by its corresponding absent-policy behavior test.
- `npm run typecheck`, scoped ESLint, whitespace checks, and release control are required before PR.

## Rollout Plan

Merge through the protected PR lane. The repo-owned ACA main workflow deploys the resulting image.
No migration, data-build job, feature flag, tenant-data rewrite, or manual traffic command is
involved.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutation outside that workflow: none.
- Signed-in proof: attempt signed persistence from a context with no resolved Programs policy and
  confirm refusal; confirm an authorized publisher can still sign and a non-publisher can save a
  draft.

## Rollback Plan

Revert the merge commit. No persisted data or schema requires rollback.

## Audit Evidence

The PR, failing-first output, focused and full agent-tool test output, typecheck, lint, release
control, ACA digest readback, and signed-in authorization checks.

## Known Gaps

- This release does not change how the route resolves Source versus Programs access policies; it
  only makes the tools safe when neither policy is available.
