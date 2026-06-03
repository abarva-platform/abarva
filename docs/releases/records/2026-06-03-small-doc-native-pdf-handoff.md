# 2026-06-03-small-doc-native-pdf-handoff — Small PDF Native Handoff

## Release ID

`2026-06-03-small-doc-native-pdf-handoff`

## Status

`candidate`

## Plain-English Summary

Eligible small PDF uploads can now move from AgentDock into the shared agent
runtime as native Claude document blocks. The server treats upload metadata as a
routing hint, then re-checks the active-client storage path, PDF MIME, byte
threshold, and stored blob size before attaching the original PDF bytes to the
model call. If any check fails, the request falls back to the normal text-only
message path.

## Layer Impact

- `global-control-lane`: Updates the shared agent chat route and Steward
  AgentDock bridge so small-PDF attachments can be passed to the model through a
  governed native-document path.
- `client-data-lane`: No schema, migration, or storage topology change. The
  route reads the already-uploaded `agent-attachments` blob only after the
  sensitive-upload guard and tenant-scoped storage write have succeeded.

## Client Applicability

- All clients: Applies to shared AgentDock uploads routed through the Steward
  shared agent endpoint.
- Specific clients: None.
- Internal only: None.
- Public/demo only: None.
- Feature flag: Existing thresholds remain configurable with
  `AGENT_SMALL_DOC_NATIVE_PDF_MAX_BYTES` and
  `AGENT_SMALL_DOC_NATIVE_PDF_MAX_PAGES`.

## Changes Included

- `src/app/api/chat/agent/route.ts` builds native Anthropic document blocks for
  eligible AgentDock small-PDF refs, with fail-closed tenant/path/MIME/size
  checks.
- `src/components/shell/AtlasPageStateProvider.tsx` allows a per-turn
  `surfaceContext` patch without changing the existing attachment chip path.
- `src/components/admin/StewardDockPane.tsx` forwards AgentDock attachment refs
  as `surfaceContext.agentAttachments`.
- `src/components/agent/AgentDock.tsx` carries the small-doc shortcut metadata
  in the shared attachment ref type.
- `src/app/api/chat/agent/__tests__/agent-route-context-bundle.test.ts` pins
  the native-PDF handoff wiring and fail-closed conditions.

## QA / Validation

- PASS: `npx jest src/app/api/chat/agent/__tests__/agent-route-context-bundle.test.ts src/components/agent/__tests__/AgentDock.test.tsx --runInBand` (63 tests passed; Jest reported pre-existing duplicate manual mock warnings).
- PASS: `npx eslint src/app/api/chat/agent/route.ts src/app/api/chat/agent/__tests__/agent-route-context-bundle.test.ts src/components/admin/StewardDockPane.tsx src/components/agent/AgentDock.tsx src/components/shell/AtlasPageStateProvider.tsx src/lib/shell/atlas-page-state.ts`.
- PASS: `npx tsc --noEmit --pretty false`.
- PASS: `git diff --check origin/main...HEAD`.
- PASS: `npm run release:check -- --base origin/main --head HEAD`.

## Rollout Plan

Merge through the protected main merge queue. After deployment, eligible
Steward AgentDock small-PDF uploads can be sent to Claude as native document
parts on the next shared agent turn. No migration is required.

## Rollback Plan

Revert the PR to remove the native-PDF handoff builder, per-turn
`surfaceContext` patch, Steward forwarding, and type/test additions. No data
rollback is required.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/2958
- CI: pending.
- Local QA: focused Jest, ESLint, TypeScript, and diff whitespace checks passed
  before PR.

## Known Gaps

Live Anthropic/Azure verification is still required after deployment to prove
that an authenticated small-PDF upload reaches the model as a native document
part in the intended environment. Raw-mode last-resort routing for T199 remains
separate.
