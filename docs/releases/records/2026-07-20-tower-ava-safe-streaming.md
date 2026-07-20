# 2026-07-20-tower-ava-safe-streaming — Tower aVa Safe Streaming

## Release ID

`2026-07-20-tower-ava-safe-streaming`

## Status

`candidate`

## Plain-English Summary

Tower aVa now supports a safe streaming response path. The UI receives immediate progress events while the governed Tower answer is assembled, validated, and converted into the shared aVa answer packet. The final answer, tables, charts, metrics, follow-up question, export packet, and validation state still come only from the completed governed response.

## Layer Impact

- Global control lane: updates the shared Tower chat adapter and `/api/tower/cio-chat` response lifecycle for all tenants with Tower enabled.
- Product UI: replaces the static pending copy with live streamed progress labels in the Tower AgentDock pending turn.
- Model/prompt path: no prompt relaxation and no raw unvalidated Claude-token display. This PR streams progress metadata and the final governed payload.
- Data plane: no schema, migration, ingestion, retrieval, or client data change.

## Client Applicability

- All clients: tenants using the Tower aVa chat surface.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/app/api/tower/cio-chat/route.ts` supports `Accept: application/x-ndjson` / `stream: true` while preserving the existing JSON response for non-stream callers.
- `src/components/tower/TowerIndexPage.tsx` consumes Tower NDJSON events, displays streamed status labels, and builds the final typed answer packet from the final validated response.
- `src/components/atlas/AtlasChatPanel.tsx` accepts an optional pending message for streamed progress.
- `src/components/atlas/__tests__/AtlasChatPanel.test.tsx` covers the streamed pending label while preserving the old default pending text.

## QA / Validation

- `npx jest src/components/atlas/__tests__/AtlasChatPanel.test.tsx --runInBand` — passed.
- `npx eslint src/app/api/tower/cio-chat/route.ts src/components/tower/TowerIndexPage.tsx src/components/atlas/AtlasChatPanel.tsx src/components/atlas/__tests__/AtlasChatPanel.test.tsx` — passed with existing TowerIndexPage warnings only.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit` — passed.
- `npm run release:check` — pending.
- ACA deploy and live signed-in Tower proof — pending merge/deploy.

## Rollout Plan

Merge the PR to `main`; the repo-owned Azure Container Apps main deploy workflow builds and deploys the digest-pinned image to `ca-abarva-web-lab-eastus`. After deploy, run signed-in Tower chat proof on `https://app.abarva.ai` and verify streamed pending status plus final tables/charts.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the repo-owned deploy workflow.
- Approved image digest: pending ACA deploy.
- ACA runtime invariant: pending ACA deploy.
- Worker image invariant: no worker change.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the PR and redeploy the previous healthy `main` image through the ACA main lane. Non-stream JSON callers are preserved, so rollback is UI/API behavior only; no data rollback is required.

## Audit Evidence

- PR URL: pending.
- CI run: pending.
- ACA deployment evidence: pending.
- Live signed-in proof: pending.

## Known Gaps

This PR does not stream raw Claude tokens. The safe streaming contract emits progress events immediately and emits the final governed answer packet after validation. Token-level streaming should be added only when the Tower answer engine exposes sentence-buffered, guardable deltas.
