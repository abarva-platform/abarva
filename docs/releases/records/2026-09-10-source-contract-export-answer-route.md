# 2026-09-10-source-contract-export-answer-route — Source Contract Export Answer Route

## Release ID

`2026-09-10-source-contract-export-answer-route`

## Status

`candidate`

## Plain-English Summary

Source contract optimization questions that ask for a client-ready memo, PDF, report, or lever table now return a deterministic answer packet from the selected Contract 360 context. The response is one short executive read plus one governed lever table, so the answer can be exported without generic chart, map, or extra-section material.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 Products: Source aVa routing now recognizes selected-contract optimization export asks and uses a deterministic Source answer packet before the generic Intelligence synthesis path.
- Layer 3 Canonical Model: No schema, migration, tenant-data, or canonical-model mutation.

## Client Applicability

- All clients: Applies to Source Contract 360 aVa turns when a selected-contract Source surface context is present.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Adds a deterministic selected-contract optimization export answer builder.
- Routes Source Contract 360 memo/PDF/report/lever asks through that builder in `/api/intelligence/ask`.
- Adds route and pure-function regression coverage proving the generic model synthesis path is bypassed for this answer shape.

## QA / Validation

- PASS: `npm test -- --runTestsByPath src/lib/source/ava/__tests__/source-workspace-visual-answer.test.ts src/app/api/intelligence/ask/__tests__/route.telemetry.test.ts`
- PASS: `npx tsc --noEmit --pretty false`
- PASS: `npx eslint src/lib/source/ava/source-workspace-visual-answer.ts src/lib/source/ava/__tests__/source-workspace-visual-answer.test.ts src/app/api/intelligence/ask/route.ts src/app/api/intelligence/ask/__tests__/route.telemetry.test.ts`
- PASS: `git diff --check`
- PASS: `npm run release:check`

## Rollout Plan

Merge through a pull request, then deploy through the repo-owned Azure Container Apps main deploy workflow. No data-build job or migration apply is required for this release.

## Deployment Authority

- Repo-owned deploy workflow: Required for shared Product/Lab runtime.
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: Captured after deploy.
- ACA runtime invariant: Verify web template image, 100%-traffic revision image, and worker job images match the approved digest before live proof.
- Worker image invariant: Required.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Source Contract 360 aVa must answer an optimization export ask with one executive read and one lever table only.

## Rollback Plan

Revert the pull request and redeploy through the repo-owned workflow. There is no database rollback because this release does not add migrations or mutate tenant data.

## Audit Evidence

- Pull request URL after creation.
- CI/local validation output listed above.
- ACA main deploy workflow URL after merge.
- Runtime invariant output after deployment.
- Signed-in Source Contract 360 aVa proof for a selected contract optimization export ask.

## Known Gaps

The release creates the governed answer packet that can feed export. It does not add a visible one-click email workflow. External email dispatch should require explicit recipient confirmation at send time because it can move contract-sensitive material outside the application.
