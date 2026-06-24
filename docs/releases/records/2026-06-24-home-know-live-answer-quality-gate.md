# 2026-06-24-home-know-live-answer-quality-gate — Home KNOW Live Answer Quality Gate

## Release ID

`2026-06-24-home-know-live-answer-quality-gate`

## Status

`candidate`

## Plain-English Summary

Home/aVa now has a shared answer-quality gate for the live SkyHarbor organization-question failure. If an answer has loaded business or IT organization context, Home must synthesize the role/domain/portfolio view first and only then name the precise gap, instead of saying the topic cannot be characterized.

## Layer Impact

- `global-control-lane`: shared Home KNOW answer behavior for all clients.
- Home KNOW runtime: validates and repairs false no-data language before the answer reaches the renderer.
- Home KNOW test/proof layer: adds exact-question regression tests and trace documentation.

## Client Applicability

- All clients: receive the shared Home KNOW quality gate after rollout.
- Specific clients: none; SkyHarbor is used only as the regression shape.
- Internal only: no.
- Public/demo only: no.
- Feature flag: works with the existing `home_know_llm_synthesis` flag; the repair gate also protects deterministic fallback prose.

## Changes Included

- Adds `src/lib/home/know/home-answer-quality-gate.ts`.
- Wires the quality gate into `src/lib/home/know/home-know-engine.ts`.
- Adds exact-question tests under `tests/home-know/`.
- Adds production-trace and before/after documentation under `docs/home-know/`.

## QA / Validation

- PASS: `npx jest tests/home-know/home-org-answer-quality.test.ts tests/home-know/home-answer-forbidden-language.test.ts src/lib/home/know/__tests__/home-know-engine.test.ts src/lib/home/know/__tests__/home-know-synthesis.test.ts --runInBand`
- PASS: `npx eslint src/lib/home/know/home-answer-quality-gate.ts src/lib/home/know/home-know-engine.ts tests/home-know/home-org-answer-quality.test.ts tests/home-know/home-answer-forbidden-language.test.ts`
- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`
- PASS: `npm run audit:control-plane-purity:check`
- PASS: `git diff --check`
- PASS: `npm run release:check`

## Rollout Plan

Merge to main after checks pass. Do not shift ACA production traffic until the exact Home question is browser-proven in a signed-in SkyHarbor session.

## Deployment Authority

- Repo-owned deploy workflow: ACA `aca-main-deploy` only.
- Shared runtime mutators: Home KNOW answer runtime.
- Approved image digest: pending.
- ACA runtime invariant: must pass before traffic shift.
- Worker image invariant: not applicable.
- Feature/env flag update path: no new flag.
- Live signed-in proof required: yes, exact SkyHarbor Home question before claiming client-ready.

## Rollback Plan

Revert this release commit. The previous Home KNOW composer/table-binding patch remains independently revertible through its own release record.

## Audit Evidence

- `docs/home-know/URGENT_LIVE_ANSWER_TRACE.md`
- `docs/home-know/HOME_ORG_ANSWER_BEFORE_AFTER.md`
- `docs/home-know/HOME_ORG_LIVE_PROOF.md`
- Focused Jest / ESLint / TypeScript outputs from this release candidate.

## Known Gaps

Live signed-in browser proof has not been completed because production currently serves stale ACA image tag `main-a739bc12`, while current main is `ff9e3713c8c0455db6ac3fa2ac7ba69ebeba8c97`. The pending deploy was cancelled before traffic shift per the urgent instruction not to deploy until the exact-question proof plan is in place.
