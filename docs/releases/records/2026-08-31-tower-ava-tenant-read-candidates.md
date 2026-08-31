# 2026-08-31-tower-ava-tenant-read-candidates — Tower aVa Tenant Read Candidates

## Release ID

`2026-08-31-tower-ava-tenant-read-candidates`

## Status

`candidate`

## Plain-English Summary

Tower aVa now passes the same resolved tenant identifiers into the governed Tower read path that the page uses. This keeps the chat drawer aligned with the populated Tower surface instead of collapsing to one inferred key.

## Layer Impact

Lane: `global-control-lane`.

Layer 4 PRODUCTS: updates the Tower chat and ask API paths plus the deterministic Tower answer reader. No canonical data, source adapter, projection schema, or loader behavior changes.

## Client Applicability

All clients: applies to Tower aVa responses wherever the current-layer Tower answer path is enabled.

Specific clients: none.

Internal only: no.

Public/demo only: no.

Feature flag: none.

## Changes Included

- Tower current-layer answer accepts additional tenant read candidates.
- Tower chat route forwards resolved client identifiers, route/request key, and tenancy identifiers after client resolution.
- Tower ask route uses the same selected-client resolution shape.
- Regression tests cover selected tenant propagation on both chat paths.

## QA / Validation

- Pass: `npx jest --runTestsByPath src/lib/tower/__tests__/current-layer-answer.test.ts src/app/api/tower/chat/route.test.ts src/app/api/tower/ask/route.test.ts src/components/tower/command-center/__tests__/TowerCommandCenterAvaShell.test.tsx --runInBand`.
- Pass: focused ESLint on changed Tower files.
- Pass: full TypeScript check with `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit`.
- Pass: release check with `node scripts/release-check.mjs --base origin/main --head HEAD`.

## Rollout Plan

Merge through the protected pull-request path. The repo-owned Azure Container Apps main deploy workflow builds and deploys the resulting image. After deployment, verify the runtime image, traffic revision, health endpoint, and signed-in Tower aVa behavior on the affected route.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: none in this change.
- Approved image digest: produced by the main deploy workflow.
- ACA runtime invariant: verify template image and 100% traffic revision image after deployment.
- Worker image invariant: verify worker image alignment if the workflow updates shared images.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the pull request and allow the repo-owned main deploy workflow to publish the previous Tower chat behavior. No data rollback is required.

## Audit Evidence

Inspect the pull request, focused test output, TypeScript output, release-check output, deploy workflow run, ACA runtime invariant output, and signed-in Tower aVa smoke proof.

## Known Gaps

No data-plane reload, projection rebuild, feature flag, or schema migration is included. The final proof requires the repo-owned deploy workflow to publish the merged image and a signed-in Tower aVa smoke check to confirm the drawer and page resolve the same governed Tower rows.
