# 2026-06-16-atlas-chat-wiring — Wire Atlas chat in AiControlTowerPage

## Release ID

`2026-06-16-atlas-chat-wiring`

## Status

`candidate`

## Plain-English Summary

The Atlas rail on the AI Control Tower page was not answering questions. Submitting text only switched the active lens tab — it never called `/api/v1/atlas/chat` and never showed a response in the rail. This PR wires `AiControlTowerPage` to the same Atlas API path used by `TowerIndexPage`: the rail now maintains a message thread, shows the user's question immediately, calls the live API, and renders Atlas's response. The Atlas rail now starts empty (no fake opener) and speaks only when the user asks.

## Layer Impact

- **global-control-lane**: UI-only change to `AiControlTowerPage.tsx`. No schema, migration, or data-plane change. Adds `useCallback` + `useState` for thread/pending/messages; replaces the hollow `onAtlasSubmit` stub with a real `fetch` to the existing `/api/v1/atlas/chat` route.

## Client Applicability

All clients — feature flag: the AI Control Tower surface is already guarded by the feature flag `ai_control_tower_enabled`; this fix applies only when that surface is active.

## Changes Included

- `src/components/tower/AiControlTowerPage.tsx`: import `AtlasMessage`, `AtlasChatResponse`, `useCallback`; add `atlasMessages`, `atlasPending`, `atlasThreadId`, `atlasSuggestions` state; replace stub `onAtlasSubmit` with `sendToAtlas` calling `/api/v1/atlas/chat`; wire `AtlasChatPanel` props to real state.

## QA / Validation

- `npx tsc --noEmit` pass (no new type errors)
- Manual: type a question in Atlas rail on `/tower` → user message appears → pending state shows → Atlas responds from live API → response renders in thread
- Regression: tab click does not produce Atlas messages (behaviour preserved from PR #3572)

## Rollout Plan

Merge to main → Azure Container Apps image rebuild → deploy to `ca-abarva-web-lab-eastus`. No migration. No feature flag change required.

## Rollback Plan

Revert this PR. The prior stub (`onAtlasSubmit` switching only the lens) is restored.

## Audit Evidence

- PR on `abarva-platform/abarva`, branch `fix/atlas-chat-wiring`
- Manual browser verification on `app.abarva.ai/tower` after ACA deploy

## Known Gaps

- The lens-switch side-effect on submit (navigating to the matching tab based on keywords) is intentionally removed — the real Atlas response provides routing direction instead.
- `pressuresView` prop remains in `AiControlTowerPageProps` but is not passed in this fix (existing gap, not introduced here).
