# 2026-06-03-raw-mode-native-pdf-runtime — Raw-Mode Native PDF Runtime Handoff

## Release ID

`2026-06-03-raw-mode-native-pdf-runtime`

## Status

`candidate`

## Plain-English Summary

This change completes the next runtime step for the raw-mode PDF escape hatch.
When a user explicitly clicks `Use raw mode` on an eligible garbled PDF, the
shared agent chat route can now fetch the stored PDF bytes and pass them to
Claude as native document input. The route still fails closed unless the
attachment is a PDF, belongs to the active client storage prefix, carries the
matching raw-mode acknowledgement, fits under a conservative server-side byte
ceiling, and the downloaded blob size matches the recorded attachment size.

## Layer Impact

- `global-control-lane`: Updates the shared agent chat endpoint and AgentDock
  contract docs. No database schema, private data-plane migration, or external
  storage provisioning changes are included.

## Client Applicability

- All clients: Applies wherever the shared AgentDock upload route and
  `/api/chat/agent` runtime are used.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- PR: https://github.com/abarva-platform/abarva/pull/2960.
- Commit: final merge commit pending.
- `src/app/api/chat/agent/route.ts` now treats acknowledged raw-mode PDF refs as
  eligible native document inputs alongside small-PDF shortcut refs.
- `src/app/api/chat/agent/__tests__/agent-route-context-bundle.test.ts` pins the
  route-level raw-mode handoff checks.
- `src/components/agent/AGENT_DOCK.md` documents that the runtime consumes the
  raw-mode acknowledgement.

## QA / Validation

- Passed locally:
  `npx jest src/app/api/chat/agent/__tests__/agent-route-context-bundle.test.ts src/components/agent/__tests__/AgentDock.test.tsx --runInBand`.
- Passed locally:
  `npx eslint src/app/api/chat/agent/route.ts src/app/api/chat/agent/__tests__/agent-route-context-bundle.test.ts src/components/agent/AGENT_DOCK.md`.
- Passed locally:
  `npx tsc --noEmit --pretty false`.
- Pending local validation before PR rerun:
  `npm run release:check -- --base origin/main --head HEAD`.
- Passed locally:
  `git diff --check origin/main...HEAD`.

## Rollout Plan

Merge through the protected GitHub PR flow. No separate migration is required.
Normal application deployment makes the runtime path available.

## Rollback Plan

Revert the PR. This removes raw-mode native document handoff while preserving
the earlier upload/UI acknowledgement contract. No data rollback is required.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/2960.
- Local QA output: focused Jest, ESLint, TypeScript, release control, and diff
  whitespace checks passed before PR.
- CI checks: Pending.

## Known Gaps

- Live authenticated proof against real object storage and Anthropic native PDF
  input remains required before T199 can be marked Done.
- This does not change human review, parser-bug triage, or downstream corpus
  commit gates.
