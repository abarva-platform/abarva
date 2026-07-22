# 2026-07-22-moves-learning-legacy-agent-blocker-copy — Moves Learning Legacy Agent Blocker Copy

## Release ID

`2026-07-22-moves-learning-legacy-agent-blocker-copy`

## Status

`deployed and live-proven`

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
- Pass: GitHub PR checks for PR #5378, including Typecheck + reasoning-layer tests, Chrome Firefox Safari mobile smoke, release record, production readiness, and hygiene gate.
- Pass: ACA main deploy run `29960589740` for merge SHA `dd7292166012c3b0a2e74c226af830e8f6f8dddc`.
- Pass: Proof-record deploy run `29962297354` for merge SHA `b561acbf271cca1d3abc5237b71d6d326a9b7664`.
- Pass: Current ACA runtime invariant proof after later main deploy run `29962440669` in `proof/122-moves-learning-legacy-agent-blocker-current-runtime`.
- Pass: Signed-in FS Demo browser proof on `/admin/context-layer/approval-queue` in `proof/118-moves-learning-legacy-agent-blocker-final-browser`.
- Pass: Current signed-in FS Demo browser proof after latest active deploy in `proof/123-moves-learning-legacy-agent-blocker-current-browser`.
- Note: A current tenant probe in `proof/121-moves-learning-approval-queue-tenant-probe` shows Meridian and SkyHarbor now have honest empty queues, while FS Demo still has 11 visible legacy-blocked candidates.

## Rollout Plan

Completed. PR #5378 was squash-merged to `main`, deployed through the repo-owned ACA main workflow, and verified in a signed-in FS Demo admin session. Later main deploys for PR #5379, PR #5380, and PR #5381 also completed successfully; current runtime proof confirms the live revision still includes the Moves blocker copy.

## Deployment Authority

- Repo-owned deploy workflow: Required because this changes runtime Admin copy.
- Shared runtime mutators: None outside the repo-owned deploy workflow.
- Approved image digest: `sha256:bd9fe21a3061cc8d90a21775f7b77d228ba8f8752958b6fcc4ab7cb3a2d0344d` on current active revision.
- ACA runtime invariant: Passed. Template image and 100%-traffic active revision image match the approved digest.
- Worker image invariant: No worker job change.
- Feature/env flag update path: None.
- Live signed-in proof required: Passed.

## Rollback Plan

Revert the PR and redeploy through the ACA main workflow. No data rollback is required because this release is read-only and does not mutate legacy metadata.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/5378
- Merge SHA: `dd7292166012c3b0a2e74c226af830e8f6f8dddc`
- Moves deploy run: `29960589740`
- Proof-record PR URL: https://github.com/abarva-platform/abarva/pull/5380
- Proof-record merge SHA: `b561acbf271cca1d3abc5237b71d6d326a9b7664`
- Proof-record deploy run: `29962297354`
- Current active main deploy run: `29962440669`
- Current active ACA revision: `ca-abarva-web-lab-eastus--m32952b76`
- Current active ACA digest: `sha256:bd9fe21a3061cc8d90a21775f7b77d228ba8f8752958b6fcc4ab7cb3a2d0344d`
- Runtime invariant proof: `proof/122-moves-learning-legacy-agent-blocker-current-runtime`
- Signed-in browser proof: `proof/123-moves-learning-legacy-agent-blocker-current-browser`
- Browser proof details: FS Demo approval queue returned HTTP 200; 11 candidates were visible; legacy/non-canonical copy, canonical id hint, and specific legacy values `moves, intelligence` were visible; material failed requests were 0.

## Known Gaps

- Existing rows with legacy applicable-agent values remain blocked until a separate steward-controlled remediation updates them.
- No steward approval/write action is added.
- No Azure AI Search indexing is added.
- No `agent_ready` promotion is added.
- No default module or agent consumption path is added.
