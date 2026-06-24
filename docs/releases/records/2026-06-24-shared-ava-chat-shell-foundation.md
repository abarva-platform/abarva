# 2026-06-24-shared-ava-chat-shell-foundation — Shared aVa Chat Shell Foundation

## Release ID

`2026-06-24-shared-ava-chat-shell-foundation`

## Status

`candidate`

## Plain-English Summary

AbarVa now has an explicit shared aVa chat shell component family that can become the common GPT/Claude-like experience across Intelligence, Home, Tower, Source, and Moves. Intelligence is the first consumer: it still uses the same backend answer stream, but it now imports the shared `AvaChatShell` and `AvaCanvas` instead of wiring directly to the lower-level dock.

## Layer Impact

- `global-control-lane`: introduces shared frontend components used by signed-in product surfaces.
- Frontend shell only: does not change tenant retrieval, semantic routing, model prompts, evidence binding, or backend answer verification.

## Client Applicability

- All clients: yes, for the Intelligence Ask page after deployment.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/components/ava-chat/AvaChatShell.tsx`: adds `AvaChatShell`, `AvaThread`, `AvaMessage`, `AvaComposer`, `AvaCanvas`, `AvaEvidencePreview`, `AvaAnswerSummary`, and `AvaDockControls`.
- `src/components/agent/AgentDock.tsx`: adds a human-facing composer placeholder prop while keeping the existing dock behavior.
- `src/app/(maestro)/intelligence/ask/SentinelReasoningCards.tsx`: wires Intelligence through `AvaChatShell` and `AvaCanvas`, preserving backend `/api/intelligence/ask` behavior and existing canvas tabs.
- Tests: adds shared shell coverage and updates the Intelligence shell test for the `aVa` label.

## QA / Validation

- `passed`: `npx jest --runTestsByPath 'src/components/ava-chat/__tests__/AvaChatShell.test.tsx' 'src/app/(maestro)/intelligence/ask/__tests__/SentinelReasoningCards.test.tsx' --runInBand` — 2 suites / 8 tests passed. Jest still reports existing duplicate manual mock warnings unrelated to this release.
- `passed`: focused ESLint for `AvaChatShell`, its tests, `AgentDock`, and the Intelligence Ask surface.
- `passed`: `npm run audit:ai-surface-controls`.
- `passed`: `npm run release:check`.
- `passed`: `git diff --check`.
- `blocked`: `npx tsc --noEmit --pretty false --project tsconfig.json` is blocked by existing repo-wide missing declarations/modules for `js-yaml`, `@azure-rest/ai-document-intelligence`, and `@axe-core/playwright`. No touched-file TypeScript errors were emitted before those baseline failures.
- `pending`: PR CI, ACA deploy, and signed-in browser proof.

## Rollout Plan

Merge to `main`, deploy through the repo-owned Azure Container Apps main workflow, then run signed-in browser proof on `https://app.abarva.ai/intelligence/ask`.

## Deployment Authority

- Repo-owned deploy workflow: required for `app.abarva.ai`.
- Shared runtime mutators: no branch/local deploy path is authorized.
- Approved image digest: produced by the ACA main deploy workflow after merge.
- ACA runtime invariant: template image, active revision image, and 100% traffic revision must match the approved main digest.
- Worker image invariant: main deploy workflow should keep worker job image aligned.
- Feature/env flag update path: none.
- Live signed-in proof required: yes; verify aVa mark, persistent thread, always-visible composer, canvas tabs, no visible Sentinel/debug labels, and follow-up behavior.

## Rollback Plan

Revert this PR and redeploy the previous approved main digest through the ACA main workflow. No data migration or schema rollback is required.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/3929
- CI run: pending.
- Deployment evidence: pending.
- Browser proof: pending.

## Known Gaps

This release creates the reusable shell and proves Intelligence as the first consumer. It does not cut over Home, Tower, Source, or Moves yet, and it does not improve answer quality or semantic retrieval.
