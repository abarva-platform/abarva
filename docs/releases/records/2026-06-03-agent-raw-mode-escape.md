# 2026-06-03-agent-raw-mode-escape — Agent PDF Raw-Mode Escape Contract

## Release ID

`2026-06-03-agent-raw-mode-escape`

## Status

`candidate`

## Plain-English Summary

Agent PDF uploads now expose a deliberate raw-mode escape-hatch contract. When a parsed PDF looks garbled, the upload chip can show a cost warning and a `Use raw mode` action. If the user clicks it, the attachment reference carries an explicit acknowledgement, estimated token cost, and parser-bug ticket id into the next message.

## Layer Impact

- `global-control-lane`: Updates shared AgentDock upload metadata, upload API response shape, and client-side attachment acknowledgement behavior.
- No database schema, private data-plane, migration, or external model routing changes.

## Client Applicability

- All clients: Applies wherever the shared AgentDock upload route and chip are used.
- Specific clients: None.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/lib/agent/attachments.ts` adds raw-mode metadata, token estimate, cost warning, and parser-bug ticket id helpers.
- `src/app/api/v1/agent/attachments/route.ts` exposes `parse_metadata.raw_mode_escape`.
- `src/components/agent/AgentDock.tsx` displays the raw-mode warning and forwards explicit user acknowledgement in the attachment ref.
- `src/components/agent/AGENT_DOCK.md` documents the raw-mode approval contract and its remaining runtime gap.

## QA / Validation

- PASS: `npx jest src/lib/agent/__tests__/attachments.test.ts src/app/api/v1/agent/attachments/__tests__/route.test.ts src/components/agent/__tests__/AgentDock.test.tsx --runInBand` (63 tests passed; Jest reported pre-existing duplicate manual mock warnings).
- PASS: `npx tsc --noEmit --pretty false`.
- PASS: `npx eslint src/lib/agent/attachments.ts src/lib/agent/__tests__/attachments.test.ts src/app/api/v1/agent/attachments/route.ts src/app/api/v1/agent/attachments/__tests__/route.test.ts src/components/agent/AgentDock.tsx src/components/agent/__tests__/AgentDock.test.tsx`.
- PASS: `git diff --check`.
- PASS: `npm run release:check -- --base origin/main --head HEAD`.

## Rollout Plan

Merge through the protected main merge queue. No deployment action beyond normal application deploy is required.

## Rollback Plan

Revert the PR to remove the raw-mode metadata and UI acknowledgement contract. No data rollback is required.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/2947.
- CI: pending at PR open.
- Local QA: focused Jest, TypeScript, eslint, diff whitespace, and release control pass locally before PR.

## Known Gaps

This is the raw-mode approval contract, warning, and parser-bug ticket propagation. It does not yet send stored PDF bytes through Claude native document input; T199 should remain `In progress` until that runtime handoff is implemented and verified end to end.
