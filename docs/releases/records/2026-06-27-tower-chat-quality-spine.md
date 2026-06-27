# 2026-06-27-tower-chat-quality-spine — Tower chat deterministic factual spine

## Release ID

`2026-06-27-tower-chat-quality-spine`

## Status

`candidate`

## Plain-English Summary

Tower chat now answers factual budget, vendor, pressure, measured-value, ROI, and adoption questions from the same structured Tower read-model used by the dashboard before any model prose is allowed to shape the answer. The shared answer shaper also removes duplicated rows, broken delimiters, doubled words, stale branding, and dangling truncated next-step fragments.

## Layer Impact

- `global-control-lane`: updates the shared advisor response shaper used across agent surfaces.
- `runtime-app-lane`: updates the Tower chat path so factual questions use deterministic dashboard-backed values instead of model-generated numbers.
- `quality-lane`: adds focused regressions for duplicate/mangled answer assembly and chat/dashboard factual consistency.

## Client Applicability

- All clients: shared shaper cleanup applies wherever `shapeSharedAdvisorResponse` is used.
- Specific clients: Tower factual-spine behavior applies to every Tower tenant with a populated Tower read-model.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/answer/shared-response-shaper.ts`
- `src/lib/answer/__tests__/shared-response-shaper.test.ts`
- `src/lib/atlas/tower-factual-spine.ts`
- `src/lib/atlas/__tests__/tower-factual-spine.test.ts`
- `src/lib/atlas/llm.ts`
- `src/lib/atlas/orchestrator.ts`
- `scripts/qa/tower-chat-quality-fix-crawl.mjs`

## QA / Validation

- `npx jest src/lib/answer/__tests__/shared-response-shaper.test.ts src/lib/atlas/__tests__/tower-factual-spine.test.ts src/lib/tower/__tests__/tower-question-bank.test.ts src/lib/tower/__tests__/tower-question-readiness.test.ts --runInBand` — passed, 18 tests.
- `npx eslint src/lib/answer/shared-response-shaper.ts src/lib/answer/__tests__/shared-response-shaper.test.ts src/lib/atlas/llm.ts src/lib/atlas/orchestrator.ts src/lib/atlas/tower-factual-spine.ts src/lib/atlas/__tests__/tower-factual-spine.test.ts scripts/qa/tower-live-scorer.ts` — passed.
- `npx tsc --noEmit --pretty false` — passed.
- Rendered browser proof command after ACA deployment: `node scripts/qa/tower-chat-quality-fix-crawl.mjs`. The proof package format is `tower-chat-quality-fix-<timestamp>.zip`.

## Rollout Plan

Merge to main, build the exact main SHA image through Azure Container Apps, shift 100% traffic to the new healthy revision, then run the Lakeshore signed-in Tower rendered crawl for the ten factual/advisory prompts called out in the task.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: only repo-owned main deploy path may update ACA.
- Approved image digest: assigned during ACA deploy.
- ACA runtime invariant: template image, active revision image, and 100% traffic revision must match the approved main image digest.
- Worker image invariant: no worker image update required.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, Lakeshore Tower rendered crawl.

## Rollback Plan

Revert this release commit and redeploy the previous approved main digest. No schema migration or data mutation is included.

## Audit Evidence

- Focused Jest/ESLint/TypeScript output in the PR.
- Post-deploy ACA revision and digest proof.
- Post-deploy signed-in Tower rendered crawl package with `FINDINGS.md`, `BEFORE_AFTER.md`, `CONSISTENCY_REPORT.md`, `audit-matrix.md`, and screenshots.

## Known Gaps

Browser-rendered proof cannot be final until the candidate is deployed to ACA; local tests prove the deterministic assembly and consistency logic, not deployed visibility.
