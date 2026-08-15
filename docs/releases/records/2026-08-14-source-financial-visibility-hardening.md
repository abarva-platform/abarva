# 2026-08-14-source-financial-visibility-hardening — Source financial visibility hardening

## Release ID

`2026-08-14-source-financial-visibility-hardening`

## Status

`candidate`

## Plain-English Summary

Source now treats workflow administration and exact financial visibility as
separate permissions. A user can administer Source events for a client without
automatically receiving restricted financial values. Exact vendor spend,
contract value, and other restricted financial details require explicit
membership financial visibility or explicit source-event participant financial
visibility.

This aligns Source with the safer permission shape already used by the program
access policy. It does not change tenant scoping, event scoping, workflow
approval authority, or any Source Optimize calculation.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 Products: Source authorization policy and prompt context controls.
- Canonical data/model: no schema or data changes.
- Source adapters/cubes: no change.

## Client Applicability

- All clients: yes, wherever Source routes rely on
  `loadUserSourceAccessPolicy`.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/auth/source-access-policy.ts`: removes implicit restricted-financial
  access from the generic Source client-admin role.
- `src/lib/auth/__tests__/source-access-policy.test.ts`: adds regression
  coverage proving client-admin administration remains available while
  restricted financial visibility requires explicit authorization.

## QA / Validation

- Pass: `npm test -- --runTestsByPath src/lib/auth/__tests__/source-access-policy.test.ts --runInBand`.
- Pass: `npx eslint src/lib/auth/source-access-policy.ts src/lib/auth/__tests__/source-access-policy.test.ts`.
- Noted during broader auth check: `src/lib/auth/__tests__/program-access-policy.test.ts`
  has an unrelated pre-existing canonical-admin fixture failure on this
  worktree. The Source-focused suite passes and the Program policy already uses
  explicit financial visibility.
- Pending: TypeScript and release check.

## Rollout Plan

Merge by PR. The repo-owned Azure Container Apps main deploy workflow builds
and deploys the digest-pinned web image. After deployment, verify ACA runtime
invariant and confirm Source routes still render for an authorized user.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: none outside the repo-owned workflow.
- Approved image digest: pending deploy.
- ACA runtime invariant: pending deploy.
- Worker image invariant: pending deploy.
- Live signed-in proof required: yes, for at least one Source route that
  requires administration but should not imply restricted financial visibility
  unless explicitly granted.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA workflow. No schema or
data rollback is required.

## Audit Evidence

- Pull request URL: pending.
- Focused Jest and ESLint output above.
- ACA workflow run and runtime invariant after merge/deploy.

## Known Gaps

Signed-in browser proof remains dependent on the available authenticated browser
bridge. Do not mark this release live-browser-proven until the Source route is
captured with an authenticated session.
