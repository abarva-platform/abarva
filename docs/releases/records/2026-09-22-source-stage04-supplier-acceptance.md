# 2026-09-22-source-stage04-supplier-acceptance — Source Stage 04 Supplier Acceptance

## Release ID

`2026-09-22-source-stage04-supplier-acceptance`

## Status

`candidate`

## Plain-English Summary

Source New Stage 04 now has a governed human acceptance path from an eligible supplier suggestion to the event candidate-supplier authority table. A signed-in reviewer can accept one currently eligible registry supplier onto one event panel with a rationale. The path does not contact suppliers, invite suppliers, select respondents, infer approvals, make awards, or change tenant source data.

## Layer Impact

Release lane: `global-control-lane`.

Layer 3 canonical model: appends one event-scoped authority record only when the supplier is already present in the governed supplier registry and still matches the event category/archetype mapping.

Layer 4 product projection: mounts a readiness-gated Stage 04 acceptance form beside eligible Source New supplier suggestions and then reuses the existing read-only panel projection.

## Client Applicability

- All clients: yes, wherever Source New and the existing candidate-supplier authority schema are available.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/source/candidate-suppliers/event-candidate-acceptance-repository.ts` adds the tenant/event/mapping/registry-fenced append path.
- `src/app/api/v1/source/[eventId]/candidate-suppliers/accept/route.ts` adds the signed-in POST route.
- `src/components/source/new-workspace/SourceNewWorkspace.tsx` mounts the Stage 04 accept form for eligible suggestions.
- `src/lib/source/intake/source-request-supplier-suggestions.ts` carries the accepted category/archetype ids into each suggestion for stale-form rejection.
- Focused repository, route, behavior, and workspace tests cover the acceptance contract.

## QA / Validation

- `npm test -- src/lib/source/candidate-suppliers/__tests__/event-candidate-acceptance-repository.test.ts 'src/app/api/v1/source/[eventId]/candidate-suppliers/accept/__tests__/route.test.ts' src/components/source/new-workspace/SourceNewWorkspace.test.tsx src/__tests__/behaviors/source-request-supplier-suggestions.test.ts --runInBand` — pass, 68 tests.

## Rollout Plan

Merge through a pull request. The change becomes active only after the normal repo-owned Azure Container Apps main deployment. No migration is applied by this release.

## Deployment Authority

- Repo-owned deploy workflow: required after merge.
- Shared runtime mutators: none in this pull request.
- Approved image digest: not assigned until the repo-owned deploy builds from main.
- ACA runtime invariant: required after deployment before any live claim.
- Worker image invariant: required after deployment before any live claim.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, to prove a real authenticated reviewer can submit the form on an eligible event without contact, invitation, respondent selection, award, or approval side effects.

## Rollback Plan

Revert the pull request before deployment, or merge a revert and redeploy through the repo-owned ACA workflow after deployment. Accepted authority rows are append-only governed records; rollback must not rewrite existing accepted rows.

## Audit Evidence

- Pull request URL after opening.
- Focused Jest output above.
- Typecheck, scoped ESLint, and release-check output from the pull request.
- Post-deploy ACA runtime invariant and signed-in Source New Stage 04 proof before any live-proven claim.

## Known Gaps

- This candidate does not apply migrations, import supplier registry rows, seed tenant data, or dispatch data-build jobs.
- Signed-in acceptance and data-plane readback require an environment with the authority table and eligible registry rows already present.
