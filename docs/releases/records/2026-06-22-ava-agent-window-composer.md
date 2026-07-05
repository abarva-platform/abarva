# 2026-06-22-ava-agent-window-composer - Ava Agent Window Composer

## Release ID

`2026-06-22-ava-agent-window-composer`

## Status

`candidate`

## Plain-English Summary

Agent windows now carry the approved lowercase `aVa` wordmark instead of relying only on initials or generic glyphs. Fixed single-line ask inputs on Home and legacy Tower surfaces now expand into multiline textareas, and shared chat composers keep typed multiline text visible as users write.

## Layer Impact

`global-control-lane`: Updates shared app UI chrome and composer behavior across agent surfaces. No tenant data, ingestion, retrieval, authorization, or write-path behavior changes.

## Client Applicability

- All clients: Shared agent chat windows and ask/composer surfaces.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Added the `aVa` wordmark as a served brand asset.
- Added reusable `AvaWordmark` UI component.
- Embedded the `aVa` mark in AgentDock, AtlasDrawer, AgentColumn, Home ask bar, legacy Tower ask panel, Intelligence reasoning ask form, and Strategic Moves chat panes.
- Converted fixed ask inputs on Home and legacy Tower to multiline auto-growing textareas.
- Hardened textarea resizing and reset behavior in shared agent composers.

## QA / Validation

- `npx eslint src/components/brand/AvaWordmark.tsx src/components/agent/AgentDock.tsx src/components/agent/AskAnythingBar.tsx src/components/shell/AtlasDrawer.tsx src/components/shell/AgentColumn.tsx src/components/home/EnterpriseLandscapeHome.tsx src/components/tower/AiControlTowerPage.tsx 'src/app/(maestro)/intelligence/ask/SentinelReasoningCards.tsx' src/components/strategic-moves/StrategicMoveOriginateClient.tsx src/components/strategic-moves/StrategicMovePhaseClient.tsx` - passed.
- `npx jest src/components/agent/__tests__/AgentDock.test.tsx src/components/shell/__tests__/AtlasDrawerCanvasContinuity.test.ts --runInBand` - passed, 24 tests.
- `npm run release:check` - passed.

## Rollout Plan

Merge the release candidate and deploy through the approved Azure Container Apps path for `app.abarva.ai`. This record does not claim production deployment.

## Rollback Plan

Revert the UI component/style changes and remove the served `aVa` asset to return to the previous initials/glyph agent identity and fixed ask inputs. No migration or data rollback is required.

## Audit Evidence

- Local diff for touched UI components and public brand asset.
- Focused validation command output once run.

## Context Ingestion Evidence

Not applicable. This release does not touch Admin Data Loads, setup/admin loaders, Azure Blob ingestion, private worker queues, document parsing, client context/corpus loading, embeddings, or retrieval.

## Known Gaps

No browser screenshot has been captured for this candidate yet.
