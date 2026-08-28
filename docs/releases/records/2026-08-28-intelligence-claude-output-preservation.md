# 2026-08-28-intelligence-claude-output-preservation — Preserve Claude-authored Intelligence answers

## Release ID

`2026-08-28-intelligence-claude-output-preservation`

## Status

`candidate`

## Plain-English Summary

The Intelligence Ask surface now preserves the advisor answer text produced by the model instead of rewriting it after generation. Runtime code still removes structured protocol payloads from the visible chat, keeps tenant-safety guards, and renders governed table/chart/graph artifacts through native components.

## Layer Impact

Layer 4 Products, `global-control-lane`: Updates the Intelligence chat rendering and streaming path. The change does not alter Layer 1 intake, Layer 2 adapters, Layer 3 canonical data, retrieval indexes, cubes, or tenant projections.

## Client Applicability

- All clients: Applies to the Intelligence Ask surface.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: No new flag.

## Changes Included

- Preserve model-authored rich Intelligence deltas while stripping structured tab protocol markers from visible streaming text.
- Preserve rich Intelligence answer packets through the aVa chat shell and native answer renderer.
- Keep hard tenant/product truth guards and client-safe source chrome in place.
- Restrict post-generation answer shaping to plain-text callers and explicit blocking-repair mode.

## QA / Validation

- `npm test -- --runTestsByPath src/components/intelligence-advisory/__tests__/resolveAssistantAnswerText.test.ts src/app/api/intelligence/ask/__tests__/route.telemetry.test.ts src/components/agent-answer/__tests__/AgentAnswerRenderer.test.tsx --runInBand` — passed, 31/31.
- `npx tsc --noEmit --pretty false` — passed.
- `npx eslint src/components/intelligence-advisory/AdvisoryIntelligencePage.tsx src/components/ava-chat/AvaChatShell.tsx src/components/agent/AgentDock.tsx src/components/agent-answer/AgentAnswerRenderer.tsx src/app/api/intelligence/ask/route.ts src/lib/intelligence/ask/synthesizer.ts src/components/intelligence-advisory/__tests__/resolveAssistantAnswerText.test.ts src/app/api/intelligence/ask/__tests__/route.telemetry.test.ts src/components/agent-answer/__tests__/AgentAnswerRenderer.test.tsx` — passed.

## Rollout Plan

Merge by PR to main. The repo-owned Azure Container Apps main deploy workflow will build and deploy the resulting image.

## Deployment Authority

- Repo-owned deploy workflow: Approved for this session.
- Shared runtime mutators: None outside the repo-owned deploy workflow.
- Approved image digest: To be produced by the main deploy workflow.
- ACA runtime invariant: Required after deploy before claiming live proof.
- Worker image invariant: Not applicable.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes, `/intelligence` chat-first surface and streamed answer behavior.

## Rollback Plan

Revert the PR and let the repo-owned deploy workflow restore the prior runtime behavior.

## Audit Evidence

PR, merge commit, CI/deploy run, ACA runtime invariant, and signed-in `/intelligence` smoke proof after merge.

## Known Gaps

The existing broad `ask-guardrails` suite has stale assertions on current main that are unrelated to this release candidate; focused affected suites pass.
