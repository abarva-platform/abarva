# 2026-07-22-source-safe-repair-persisted-drafts — Safe repair for old persisted Source drafts

## Release ID

`2026-07-22-source-safe-repair-persisted-drafts`

## Status

`candidate`

## Plain-English Summary

Source now has an explicit safe-repair lane for old persisted artifact bodies that predate the current client-facing hygiene rules. Operators can dry-run a selected artifact row to see the before/after content-QA diff, then apply the deterministic repair only with an exact confirmation phrase and current body hash. The route records a durable receipt in artifact metadata and the Source activity log.

This is not silent cleanup and not a Claude regeneration path. It only repairs a specifically selected persisted body after a human/operator confirms the exact row and version.

## Layer Impact

- `global-control-lane`: Adds a governed Source API route and pure repair planner. The route is protected by the same tenant and artifact-upload rights as existing artifact body/status mutation routes.
- `client-data-lane`: Writes only when an authorized caller explicitly applies repair for one selected artifact row. The write stays inside existing Azure/Postgres-compatible tables: `source_event_artifact_states.body_generation_metadata` and `source_event_activity`.

## Client Applicability

- All clients: The route is available wherever Source artifact body mutation rights are available.
- Specific clients: The initial backlog driver is the old `d01_strategy_memo` content-blocker debt found during prior SkyHarbor proof, but the deterministic scanner uses the artifact's existing documentation profile.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/source/artifact-safe-repair.ts`: deterministic repair planner, body hash, expected confirmation phrase, receipt metadata helper.
- `src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/safe-repair/route.ts`: dry-run/apply route with selected-row, terminal-state, confirmation, body-hash, and clean-after-scan guards.
- `src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/safe-repair/__tests__/route.test.ts`: route regression coverage.
- `docs/backlog/source-product-backlog.md`: marks item #8 as candidate scope in this branch.

## QA / Validation

- PASS: `npm test -- --runInBand --runTestsByPath 'src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/safe-repair/__tests__/route.test.ts'` — 3/3 tests passed.
- PASS: `npx eslint 'src/lib/source/artifact-safe-repair.ts' 'src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/safe-repair/route.ts' 'src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/safe-repair/__tests__/route.test.ts'`.
- BLOCKED/UNRELATED: `npx tsc --noEmit` with a larger Node heap reached typechecking and failed on pre-existing Home graph dependency declarations: `@xyflow/react` and `@dagrejs/dagre`. No Source safe-repair type errors were reported before those project-level missing-module errors stopped the run.

## Rollout Plan

Merge via PR to `main`. The repo-owned Azure Container Apps main deploy workflow builds and deploys the merged SHA. After deploy, run the independent ACA runtime invariant. For live proof, use dry-run against the affected persisted artifact first. Applying a production repair is a data mutation and must be treated as an explicit operator action with the dry-run hash and confirmation phrase captured.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None in this PR.
- Approved image digest: Pending repo-owned deploy.
- ACA runtime invariant: Required after deploy before claiming live.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes for dry-run route visibility; apply proof requires explicit production data-repair approval or an approved test event.

## Rollback Plan

Revert the application PR and redeploy through the repo-owned ACA main workflow. Existing safe-repair receipts, if any were explicitly applied before rollback, should remain as audit history. If a body repair itself must be undone, use the receipt's `beforeSha256` plus existing backup/audit process rather than silently rewriting data.

## Audit Evidence

- PR: Pending.
- Focused test output: local pass listed above.
- Lint output: local pass listed above.
- Release check: Pending.
- ACA deploy/invariant: Pending merge.
- Live signed-in proof: Pending deploy.

## Known Gaps

- This slice does not add a UI button. It exposes the governed route that a UI can call after showing dry-run diff/confirmation.
- This slice does not call Claude to rewrite narrative quality. It only applies deterministic client-facing hygiene and refuses to apply if content blockers remain.
- Full production apply proof is intentionally not automatic because it mutates persisted client data.
