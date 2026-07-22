# 2026-07-22-moves-learning-canonical-promotion-evaluator — Moves Learning Canonical Promotion Evaluator

## Release ID

`2026-07-22-moves-learning-canonical-promotion-evaluator`

## Status

`candidate`

## Plain-English Summary

Aligns the Moves learning review queue with the canonical context/corpus promotion evaluator. The Admin approval queue now reads the full governed readiness sidecar for Move-derived learning and explains the same promotion blockers used by the context governance layer: tenant scope, policy status, classification, source basis, confidence, provenance, valid applicable agents, Azure retrievability, cite-render proof, and steward decision.

This does not promote any Move-derived candidate, mark anything `agent_ready`, index anything in Azure AI Search, or make Moves learning available to Nexus modules by default.

## Layer Impact

- `internal-admin`: Improves the Context Approval Queue so stewards see canonical promotion readiness instead of a hand-rolled readiness approximation.
- `client-data-lane`: Reads additional tenant-scoped fields from `governed_object_readiness` for Move-derived learning candidates. No data writes are added by the review queue.
- `global-control-lane`: Normalizes new Moves learning writeback rows to use canonical applicable-agent ids (`nexus`, `tower`, `steward`) instead of legacy module labels that the governance evaluator rejects.

## Client Applicability

- All clients: Yes, for any tenant with persisted Moves learning candidates.
- Specific clients: Browser proof should use FS Demo / First Capital because it currently has visible Moves learning candidates.
- Internal only: Admin review surface only.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/programs/learning-writeback/review-queue.ts`: Reads full readiness sidecar fields and uses `evaluatePromotion` for promotion preview/rollup checks.
- `src/lib/programs/learning-writeback/build-writeback.ts`: Writes canonical applicable-agent ids for future Moves learning candidates.
- `src/lib/programs/learning-writeback/types.ts`: Updates the Moves learning readiness draft type to match canonical applicable-agent ids.
- `src/lib/programs/learning-writeback/__tests__/moves-learning-writeback.test.ts`: Adds regression coverage for canonical eligibility, active-looking rows, and preview-ready-but-not-stewarded candidates.
- `docs/specs/programs/moves-learning-ledger-enterprise-context-contract.md`: Clarifies canonical applicable-agent vocabulary.

## QA / Validation

- Pass: `npx jest --runTestsByPath src/lib/programs/learning-writeback/__tests__/moves-learning-writeback.test.ts --runInBand`.
- Pending: ESLint on changed files.
- Pending: `npm run release:check`.
- Pending: `git diff --check`.
- Pending: GitHub PR checks.
- Pending: ACA deploy and runtime invariant.
- Pending: Signed-in browser proof on the Admin Context Approval Queue.

## Rollout Plan

Open a PR, squash merge to `main`, deploy through the repo-owned ACA main workflow, verify the ACA runtime invariant, then run signed-in browser proof on `/admin/context-layer/approval-queue`.

## Deployment Authority

- Repo-owned deploy workflow: Required because this changes runtime Admin behavior and future writeback metadata.
- Shared runtime mutators: None outside the repo-owned deploy workflow.
- Approved image digest: Pending deploy.
- ACA runtime invariant: Pending deploy.
- Worker image invariant: No worker job change.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Admin approval queue proof after deploy.

## Rollback Plan

Revert the PR and redeploy through the ACA main workflow. No data rollback is required for the Admin read-path change. Existing rows written with legacy applicable-agent values are intentionally not mutated by this release; future-row normalization can be reverted by restoring the prior writeback list if required.

## Audit Evidence

- PR URL: Pending.
- Merge SHA: Pending.
- ACA deploy run: Pending.
- ACA revision: Pending.
- ACA digest: Pending.
- Runtime invariant proof: Pending.
- Signed-in browser proof: Pending.

## Known Gaps

- Existing Moves learning rows that already contain legacy applicable-agent values remain unchanged and may still show canonical eligibility blockers until a separate steward-controlled remediation updates them.
- No steward approval/write action is added.
- No Azure AI Search indexing is added.
- No `agent_ready` promotion is added.
- No default module or agent consumption path is added.
