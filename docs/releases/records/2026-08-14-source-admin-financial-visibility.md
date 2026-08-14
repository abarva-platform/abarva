# 2026-08-14-source-admin-financial-visibility — Source Admin Financial Visibility

## Release ID

`2026-08-14-source-admin-financial-visibility`

## Status

`candidate`

## Plain-English Summary

Source client administrators with governed membership now receive restricted-financial visibility with their admin Source policy. Before this change, the same administrator could approve Source work and see all events while still being treated as unable to view exact financial details unless a separate financial flag was set.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 Products: Source access policy now aligns financial output permissions with the client-admin policy for membership-backed administrators. It does not change canonical data, source adapters, tenant identity, or event scoping.

## Client Applicability

- All clients: Yes, for membership-backed Source client administrators.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/auth/source-access-policy.ts`
- `src/lib/auth/__tests__/source-access-policy.test.ts`

## QA / Validation

- Pass: `npx jest --runTestsByPath src/lib/auth/__tests__/source-access-policy.test.ts --runInBand` passed 20 tests. Jest emitted existing duplicate manual mock warnings unrelated to this change.
- Pass: `npx eslint src/lib/auth/source-access-policy.ts src/lib/auth/__tests__/source-access-policy.test.ts`.
- Pass: `npm run release:check`.

## Rollout Plan

Merge to main and deploy through the repo-owned Azure Container Apps main workflow. No database migration or data operator job is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: captured after deploy.
- ACA runtime invariant: required before claiming live.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: recommended for Source financial surfaces.

## Rollback Plan

Revert the PR and redeploy through the same repo-owned ACA workflow. The rollback restores the previous requirement that client admins need an explicit financial visibility flag or event participant financial grant.

## Audit Evidence

- PR URL: pending.
- Deploy workflow run: pending.
- Runtime invariant: pending.
- Test output: focused Jest suite, ESLint, and release check pass before PR.

## Known Gaps

Canonical shortcut admins and automation proof personas remain intentionally unchanged by this slice; this change only covers membership-backed client administrators.
