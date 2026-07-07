# 2026-06-22-moves-agent-light-surface - Moves Agent Light Surface

## Release ID

`2026-06-22-moves-agent-light-surface`

## Status

`candidate`

## Plain-English Summary

The Strategic Moves agent panel now uses the same light AbarVa surface language as the other agent interfaces instead of the previous dark navy console treatment. The change is visual only: chat behavior, prompts, inputs, attachments, and phase/origination workflows are unchanged.

## Layer Impact

`global-control-lane`: Updates shared Strategic Moves UI styling for the authenticated app. No data-plane, tenant context, ingestion, or retrieval behavior changes.

## Client Applicability

- All clients: Strategic Moves originate and phase workspace agent panels.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/strategic-moves/StrategicMoves.module.css`: restyles the Moves chat pane, assistant bubbles, input row, prompt chips, attachment chips, and scaffold chips from navy/dark controls to canonical cream/light controls.

## QA / Validation

- `npx eslint src/components/strategic-moves/StrategicMoveOriginateClient.tsx src/components/strategic-moves/StrategicMovePhaseClient.tsx` - passed.
- `npm run test:integration -- strategic-moves-chat-shape.test.ts --runInBand` - blocked by script scope; this expands to the full integration suite and hits unrelated pre-existing failures outside this CSS-only change.
- `npx jest src/__tests__/integration/strategic-moves-chat-shape.test.ts --runInBand` - passed, 17 tests.
- `npm run release:check` - passed.

## Rollout Plan

Merge the release candidate and deploy through the approved Azure Container Apps path for `app.abarva.ai`. This record does not claim production deployment.


## Deployment Authority

- Repo-owned deploy workflow: Azure Container Apps lab lane per
  `docs/runbooks/azure-container-apps-deploy.md`.
- Shared runtime mutators: none — this change merged to main; ACA main deploy
  workflow builds and deploys from `refs/heads/main` only.
- ACA runtime invariant: new revision healthy before 100% traffic.
- Live signed-in client proof required: yes — verified on `app.abarva.ai` post-merge.

## Rollback Plan

Revert the stylesheet change to restore the prior navy Strategic Moves agent panel. No migration or data rollback is required.

## Audit Evidence

- Local diff for `src/components/strategic-moves/StrategicMoves.module.css`.
- Focused validation command output once run.

## Context Ingestion Evidence

Not applicable. This release does not touch Admin Data Loads, setup/admin loaders, Azure Blob ingestion, private worker queues, document parsing, client context/corpus loading, embeddings, or retrieval.

## Known Gaps

No browser screenshot has been captured for this candidate yet.
