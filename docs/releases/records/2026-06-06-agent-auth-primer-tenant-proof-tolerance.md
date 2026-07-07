# 2026-06-06-agent-auth-primer-tenant-proof-tolerance — Agent Auth Primer Tenant Proof Tolerance

## Release ID

`2026-06-06-agent-auth-primer-tenant-proof-tolerance`

## Status

`candidate`

## Plain-English Summary

The agent auth-state primer still fails when a signed-in route renders a known foreign tenant name, but it no longer fails only because a valid client route omits the expected tenant name from visible copy. This keeps the proof guard focused on cross-client leakage while allowing sparse operational pages such as Source redirects or Moves lists that may not print the tenant display name.

## Layer Impact

- `global-control-lane`: adjusts local QA/auth priming behavior for all agent persona storage-state generation.
- `public-demo`: improves Lakeshore proof generation by preventing false negatives on tenant-correct pages that omit tenant copy.

## Client Applicability

- All clients: applies to the local `auth:agent-client-states` proof script.
- Specific clients: Lakeshore is the immediate validated tenant.
- Internal only: the generated `.auth/` storage-state files remain local-only and ignored.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `scripts/auth/prime-agent-client-auth-states.ts`: foreign tenant names remain hard failures; missing expected tenant text becomes a warning-style note in the report.

## QA / Validation

- pass: `npx eslint scripts/auth/prime-agent-client-auth-states.ts`
- pass: `git diff --check`
- pass: `npm run release:check -- --base origin/main --head HEAD`
- planned-post-merge: `BASE_URL=https://app.abarva.ai npm run auth:agent-client-states -- --client lakeshore --refresh`

## Rollout Plan

Merge to main. No app redeploy is required for runtime behavior, but the script change will be available to future proof runs after main is pulled or the branch is used locally.

## Rollback Plan

Revert this PR to restore the stricter requirement that every probe route render the expected tenant display name.

## Audit Evidence

- PR URL: to be added after opening PR.
- Auth report: `reports/agent-client-auth/`.

## Known Gaps

This does not prove Source artifact exports by itself; it only corrects the auth primer's tenant-copy assertion.
