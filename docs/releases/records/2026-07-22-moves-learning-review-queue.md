# 2026-07-22-moves-learning-review-queue — Moves Learning Review Queue

## Release ID

`2026-07-22-moves-learning-review-queue`

## Status

`candidate`

## Plain-English Summary

Makes persisted Moves learning candidates visible to administrators in the Context Approval Queue. After a Move writes approved evidence, client-approved deliverables, and gate decisions into the enterprise context layer, stewards can now see those rows as reviewable candidates before any indexing or agent-ready promotion happens. This keeps the learning loop honest: Moves can teach the context layer over time, but review, promotion, and retrieval remain separate governed steps.

## Layer Impact

- `internal-admin`: Adds a read-only admin view for Move-derived learning candidates.
- `client-data-lane`: Reads tenant-scoped `moves_learning` rows from Azure/Postgres and their readiness sidecars. No write, promotion, indexing, or active-context consumption is added.

## Client Applicability

- All clients: Available wherever an active client has persisted Moves learning rows.
- Specific clients: None hardcoded. Tenant aliases are resolved through the canonical tenant alias registry.
- Internal only: Yes. The view is in the Admin Context Approval Queue.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/programs/learning-writeback/review-queue.ts`: Read-only Azure/Postgres queue builder for `moves_learning` candidates and readiness summaries.
- `src/lib/programs/learning-writeback/index.ts`: Exports the review queue helpers.
- `src/lib/programs/learning-writeback/__tests__/moves-learning-writeback.test.ts`: Adds coverage for review-queue summaries and canonical/legacy tenant alias reads.
- `src/app/(maestro)/admin/context-layer/approval-queue/page.tsx`: Shows Moves learning candidates separately from pending embedding chunks, with explicit review-required status and no implication that rows are agent-ready.
- `docs/releases/records/2026-07-22-moves-learning-review-queue.md`: This release record.

## QA / Validation

- Pass: `npx jest --runTestsByPath src/lib/programs/learning-writeback/__tests__/moves-learning-writeback.test.ts --runInBand`.
- Pass: `npx eslint src/lib/programs/learning-writeback src/app/'(maestro)'/admin/context-layer/approval-queue/page.tsx`.
- Pass: `npm run release:check`.
- Pass: `git diff --check`.
- Blocked: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json` is blocked by pre-existing Home graph optional dependency resolution errors for `@xyflow/react` and `@dagrejs/dagre`, outside the Moves learning-review files.
- Not-run yet: ACA deploy and signed-in admin browser proof happen after merge.

## Rollout Plan

Merge through PR to `main`, deploy through the repo-owned ACA main workflow, verify the ACA runtime invariant, then open the Admin Context Approval Queue in a signed-in session for a tenant with persisted Moves learning rows. The page should show the Moves learning candidates as review-required and still show pending embedding chunks separately.

## Deployment Authority

- Repo-owned deploy workflow: Required, because this changes a runtime Admin page.
- Shared runtime mutators: None outside the repo-owned deploy workflow.
- Approved image digest: Captured by ACA deploy after merge.
- ACA runtime invariant: Required before claiming deployed.
- Worker image invariant: No worker job change.
- Feature/env flag update path: None.
- Live signed-in proof required: Required before claiming browser-visible.

## Rollback Plan

Revert the PR and redeploy through the ACA main workflow. No data rollback is needed because this release is read-only.

## Audit Evidence

- PR URL: Pending.
- Merge SHA: Pending.
- ACA revision/digest: Pending.
- Signed-in proof: Pending.

## Known Gaps

- No stewardship approval or promotion workflow is added.
- No Azure AI Search indexing is added.
- No `agent_ready` promotion is added.
- No default Home/Intelligence/Moves/Tower agent consumption path is added.
- No automatic phase-gate writeback trigger is added.
