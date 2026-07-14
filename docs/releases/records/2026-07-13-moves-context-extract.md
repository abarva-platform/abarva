# 2026-07-13-moves-context-extract — Move Context Extract

## Release ID

`2026-07-13-moves-context-extract`

## Status

`candidate`

## Plain-English Summary

Moves Approve & Build now creates a Move-scoped Context Extract before phase deliverables are queued. The extract snapshots relevant governed enterprise context for the phase, writes a File Cabinet artifact with attached/suggested/excluded/gap sections, and only records agent-ready attached evidence into the Move evidence ledger for downstream generation.

## Layer Impact

- `global-control-lane`: Adds shared Moves orchestration behavior to the phase generation route.
- `data/read-model`: Reads active tenant context through the existing tenant-context search lane with an explicit `agent_ready` filter.
- `evidence/audit`: Persists a Move artifact and optional Move evidence row with lineage and guardrail metadata.

## Client Applicability

- All clients: Yes, for Moves phase Approve & Build.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None. Candidate preview remains explicit request/header only and is not default runtime truth.

## Changes Included

- `src/lib/programs/move-context-extract.ts`
- `src/app/api/v1/deliverables/generate-phase/route.ts`
- `src/lib/programs/evidence-ingestion.ts`
- `src/lib/programs/__tests__/move-context-extract.test.ts`
- `src/app/api/v1/deliverables/generate-phase/__tests__/route.test.ts`
- `scripts/audit/moves-context-extract.mjs`
- `package.json`

## QA / Validation

- `Pass`: `npm run test:moves-context-extract -- --silent` (2 suites, 11 tests; repo emits pre-existing duplicate manual mock warnings for markdown mocks)
- `Pass`: `npm run audit:moves-context-extract`
- `Pass`: `npm run audit:active-candidate-separation`
- `Pass`: `npm run audit:tenant-isolation:moves`
- `Pass`: `npm run audit:architecture-rules`
- `Pass`: `npm run audit:enterprise-naming`
- `Pass`: `npm run release:check`
- `Pass`: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`
- `Pass`: `git diff --check`

## Rollout Plan

Merge to `main`, allow the repo-owned Azure Container Apps main deploy workflow to build and deploy the digest-pinned image, then verify the signed-in Moves phase Approve & Build path. The change is active after ACA deployment.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: None in this PR.
- Approved image digest: Pending deploy.
- ACA runtime invariant: Pending deploy.
- Worker image invariant: Pending deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, for a Moves phase Approve & Build smoke.

## Rollback Plan

Revert the PR and redeploy the prior ACA image through the repo-owned workflow. Existing Move Context Extract artifacts/evidence rows are append-only and can be ignored by downstream generation if the route no longer creates new rows.

## Audit Evidence

- PR URL: Pending.
- CI/checks: Pending.
- ACA deployment proof: Pending.
- Live signed-in Moves proof: Pending.

## Known Gaps

- Candidate promotion is not implemented.
- Active Tenant Access is not updated.
- Home runtime is not changed.
- Module-wide runtime context is not changed.
- Suggested Context is visible only in the extract artifact metadata/body and is not a review/approval UI yet.
- Browser proof is pending.
