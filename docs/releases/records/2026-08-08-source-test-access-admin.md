# 2026-08-08-source-test-access-admin — Source Test Access Admin

## Release ID

`2026-08-08-source-test-access-admin`

## Status

`candidate`

## Plain-English Summary

This release keeps pinned AbarVa testing accounts from being blocked by stale Source membership rows when they create or approve Source events in their own tenant. It also collapses the Source intake helper copy so the right rail is less confusing after the intake facts are captured.

## Layer Impact

- `global-control-lane`: same-tenant pinned AbarVa testing/admin identities keep Source create and approval rights even after they are mapped to a durable person row.
- `global-control-lane`: static Source intake usage guidance is still available, but it is collapsed into a compact disclosure instead of appearing as multiple always-visible cards.
- `internal-admin`: Source test personas are provisioned with stage and award approval rights for testing.

## Client Applicability

- All clients: Source intake UI helper copy presentation.
- Specific clients: pinned testing/admin identities only within their inferred home tenant.
- Internal only: test-user setup rights.
- Public/demo only: no public surface change.
- Feature flag: none.

## Changes Included

- `src/lib/auth/source-access-policy.ts`
- `src/lib/auth/__tests__/source-access-policy.test.ts`
- `src/testing/test-users/spec.ts`
- `src/components/source/SourceOriginatePage.tsx`

## QA / Validation

- Pass: `npx eslint src/lib/auth/source-access-policy.ts src/lib/auth/__tests__/source-access-policy.test.ts src/testing/test-users/spec.ts src/components/source/SourceOriginatePage.tsx`
- Pass: `npx jest --runTestsByPath src/lib/auth/__tests__/source-access-policy.test.ts --runInBand -t "pinned AbarVa"`
- Pending: full typecheck and release check before merge.
- Known unrelated red tests observed in the broader Source/auth focused run: older auth shortcut expectations and older Source originate text assertions are already inconsistent with the current page.

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps main deploy workflow builds and deploys the shared app image.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the repo-owned workflow
- Approved image digest: resolved by the deploy workflow
- ACA runtime invariant: required after deploy
- Worker image invariant: unchanged by this release, verified by deploy workflow
- Feature/env flag update path: none
- Live signed-in proof required: Source intake create path as a pinned testing account

## Rollback Plan

Revert the merge commit and redeploy through the repo-owned ACA main workflow. No schema or data rollback is required.

## Audit Evidence

- PR URL once opened
- GitHub Actions deploy run once merged
- ACA runtime invariant output
- Signed-in Source intake proof after deploy

## Known Gaps

- This does not add a general product-side user management workflow for Source entitlements.
