# 2026-07-22-moves-learning-legacy-agent-blocker-copy — Moves Learning Legacy Agent Blocker Copy

## Release ID

`2026-07-22-moves-learning-legacy-agent-blocker-copy`

## Status

`candidate`

## Plain-English Summary

Makes the Moves learning approval queue explain why legacy learning rows are blocked from active enterprise context. Instead of the vague blocker `Missing valid applicable agents`, the UI now distinguishes missing applicable-agent metadata from legacy/non-canonical values such as `moves` or `intelligence`, and tells the steward which canonical ids are expected.

This is a read-only clarification. It does not repair old rows, promote any candidate, index anything, or mark any Move-derived learning row as `agent_ready`.

## Layer Impact

- `internal-admin`: Improves the Context Approval Queue blocker details so stewards can see the actual metadata issue and remediation path.
- `client-data-lane`: Reads the same tenant-scoped readiness rows as the prior release. No data writes or migrations are added.
- `global-control-lane`: Keeps canonical promotion gating intact while making legacy metadata blockers actionable.

## Client Applicability

- All clients: Yes, for any tenant with persisted Moves learning candidates.
- Specific clients: FS Demo / First Capital has the current live proof rows with legacy applicable-agent metadata.
- Internal only: Admin review surface only.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/programs/learning-writeback/review-queue.ts`: Adds canonical applicable-agent diagnostics to promotion-preview checks and review-packet blockers.
- `src/lib/programs/learning-writeback/__tests__/moves-learning-writeback.test.ts`: Adds regression coverage for missing applicable-agent metadata and legacy/non-canonical applicable-agent values.

## QA / Validation

- Pass: `npx jest --runTestsByPath src/lib/programs/learning-writeback/__tests__/moves-learning-writeback.test.ts --runInBand`.
- Pass: `npx eslint src/lib/programs/learning-writeback`.
- Pass: `npm run release:check`.
- Pass: `git diff --check`.
- Pending: GitHub PR checks.
- Pending: ACA runtime invariant proof.
- Pending: Signed-in FS Demo browser proof on `/admin/context-layer/approval-queue`.

## Rollout Plan

Open a PR, merge through the protected PR-only path, deploy via the repo-owned ACA main workflow, verify the ACA runtime invariant, then prove the updated blocker text in a signed-in FS Demo admin session.

## Deployment Authority

- Repo-owned deploy workflow: Required because this changes runtime Admin copy.
- Shared runtime mutators: None outside the repo-owned deploy workflow.
- Approved image digest: Pending deploy.
- ACA runtime invariant: Pending deploy.
- Worker image invariant: No worker job change.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the PR and redeploy through the ACA main workflow. No data rollback is required because this release is read-only and does not mutate legacy metadata.

## Audit Evidence

Pending:

- PR URL
- Merge SHA
- ACA deploy run
- ACA revision and digest
- Runtime invariant proof
- Signed-in browser proof

## Known Gaps

- Existing rows with legacy applicable-agent values remain blocked until a separate steward-controlled remediation updates them.
- No steward approval/write action is added.
- No Azure AI Search indexing is added.
- No `agent_ready` promotion is added.
- No default module or agent consumption path is added.
