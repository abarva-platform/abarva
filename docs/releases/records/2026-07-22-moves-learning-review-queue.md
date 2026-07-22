# 2026-07-22-moves-learning-review-queue — Moves Learning Review Queue

## Release ID

`2026-07-22-moves-learning-review-queue`

## Status

`candidate-follow-up`

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
- `src/proxy.ts`: Adds the Context Approval Queue to the active Admin subroute allowlist so the deployed page is browser-reachable instead of being consolidated back to `/admin`.
- `docs/releases/records/2026-07-22-moves-learning-review-queue.md`: This release record.

## QA / Validation

- Pass: `npx jest --runTestsByPath src/lib/programs/learning-writeback/__tests__/moves-learning-writeback.test.ts --runInBand`.
- Pass: `npx eslint src/lib/programs/learning-writeback src/app/'(maestro)'/admin/context-layer/approval-queue/page.tsx`.
- Pass: `npm run release:check`.
- Pass: `git diff --check`.
- Blocked: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json` is blocked by pre-existing Home graph optional dependency resolution errors for `@xyflow/react` and `@dagrejs/dagre`, outside the Moves learning-review files.
- Pass: GitHub checks for PR #5359, including `Typecheck + reasoning-layer tests`, `ESLint`, `Production readiness gate`, `Release record and impact note`, and `Chrome Firefox Safari mobile smoke`.
- Pass: ACA deploy for PR #5359 to revision `ca-abarva-web-lab-eastus--m6b4f1777`, digest `sha256:0d7c4812683db092d01f3242d8fdbc4ecc3fce517f2bc1bfb7a0e9790c226698`, 100% traffic.
- Blocked: First signed-in browser proof reached `/admin?from=%2Fadmin%2Fcontext-layer%2Fapproval-queue` because the production proxy only allowed a narrow set of active Admin subroutes. This follow-up release adds the queue route to that allowlist.
- Not-run yet: signed-in browser proof after the proxy follow-up deploy.

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

- PR URL: `https://github.com/abarva-platform/abarva/pull/5359`.
- Merge SHA: `6b4f1777b60dac339f2e39b8a18ab310258232b6`.
- ACA revision: `ca-abarva-web-lab-eastus--m6b4f1777`.
- ACA digest: `sha256:0d7c4812683db092d01f3242d8fdbc4ecc3fce517f2bc1bfb7a0e9790c226698`.
- Runtime invariant proof: `/private/tmp/nexus-moves-learning-review-20260722-2/proof/94-moves-learning-review-queue-runtime`.
- First signed-in browser proof: `/private/tmp/nexus-moves-learning-review-20260722-2/proof/95-moves-learning-review-queue-browser`.
- Follow-up PR URL: Pending.
- Follow-up merge SHA: Pending.
- Follow-up signed-in browser proof: Pending.

## Known Gaps

- No stewardship approval or promotion workflow is added.
- No Azure AI Search indexing is added.
- No `agent_ready` promotion is added.
- No default Home/Intelligence/Moves/Tower agent consumption path is added.
- No automatic phase-gate writeback trigger is added.
