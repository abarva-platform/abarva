# 2026-07-22-moves-learning-canonical-promotion-evaluator — Moves Learning Canonical Promotion Evaluator

## Release ID

`2026-07-22-moves-learning-canonical-promotion-evaluator`

## Status

`deployed and live-proven`

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
- Pass: `npx eslint src/lib/programs/learning-writeback`.
- Pass: `npm run release:check`.
- Pass: `git diff --check`.
- Pass: GitHub PR checks for PR #5376, including Typecheck + reasoning-layer tests.
- Pass: ACA deploy run `29958659879`.
- Pass: ACA runtime invariant proof in `proof/112-moves-learning-canonical-evaluator-runtime`.
- Pass: Signed-in FS Demo browser proof in `proof/113-moves-learning-canonical-evaluator-browser`.
- Note: local full `tsc` in the worktree was blocked by pre-existing Home optional dependency gaps (`@xyflow/react`, `@dagrejs/dagre`), while GitHub CI typecheck passed for the PR.

## Rollout Plan

Completed. PR #5376 was squash-merged to `main`, deployed through the repo-owned ACA main workflow, verified by ACA runtime invariant, then opened in a signed-in FS Demo session on `/admin/context-layer/approval-queue`.

## Deployment Authority

- Repo-owned deploy workflow: Required because this changes runtime Admin behavior and future writeback metadata.
- Shared runtime mutators: None outside the repo-owned deploy workflow.
- Approved image digest: `sha256:5e7296565fa2c1d7ca5c3a461a54a09a2417e460ce4f4c9041a8aa197f49081c`.
- ACA runtime invariant: Passed. Template image and 100%-traffic active revision image match the approved digest.
- Worker image invariant: No worker job change.
- Feature/env flag update path: None.
- Live signed-in proof required: Passed.

## Rollback Plan

Revert the PR and redeploy through the ACA main workflow. No data rollback is required for the Admin read-path change. Existing rows written with legacy applicable-agent values are intentionally not mutated by this release; future-row normalization can be reverted by restoring the prior writeback list if required.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/5376
- Merge SHA: `e6f82101795344f00b9229c64298e9794e0b4b99`
- ACA deploy run: `29958659879`
- ACA revision: `ca-abarva-web-lab-eastus--me6f82101`
- ACA digest: `sha256:5e7296565fa2c1d7ca5c3a461a54a09a2417e460ce4f4c9041a8aa197f49081c`
- Runtime invariant proof: `proof/112-moves-learning-canonical-evaluator-runtime`
- Signed-in browser proof: `proof/113-moves-learning-canonical-evaluator-browser`

## Known Gaps

- Existing Moves learning rows that already contain legacy applicable-agent values remain unchanged and may still show canonical eligibility blockers until a separate steward-controlled remediation updates them.
- No steward approval/write action is added.
- No Azure AI Search indexing is added.
- No `agent_ready` promotion is added.
- No default module or agent consumption path is added.
