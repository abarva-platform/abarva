# 2026-06-18-tower-atlas-grounded-chat — Tower Atlas chat routed to the grounded engine

## Release ID

`2026-06-18-tower-atlas-grounded-chat`

## Status

`candidate`

## Plain-English Summary

The AI Control Tower's Atlas chat was answering the wrong question. It used a client-side keyword router (`buildAtlasAnswer`) that classified any question into one of a few lens buckets and dumped a templated "Spend read" / "Actions read" — so "Which AI spend lacks adoption or value proof?" returned the top spend rows by size, dropping the actual predicate, and "What should go to the next steering meeting?" dumped all proposals unranked. This change routes the Tower chat to the real grounded Atlas engine (`POST /api/v1/atlas/chat` → `runAtlasTurn`), renders its prose answer with thread continuity and engine-suggested follow-ups, shows a loading state, and keeps the old local builder only as a clearly-marked offline fallback when the engine is unreachable. The keyword-routing branches are deleted.

## Layer Impact

- **global-control-lane**: `src/components/tower/AiControlTowerPage.tsx` — shared control-plane UI behavior for the AI Control Tower across all tenants. No schema, no data-plane, no per-tenant gating. Behavior change only: the Atlas chat now consumes the governed `/api/v1/atlas/chat` engine instead of an in-component keyword templater.

## Client Applicability

- All clients: the Tower Atlas chat is global control-plane UI; every tenant that opens the AI Control Tower gets the grounded path. No feature flag.

## Changes Included

- `src/components/tower/AiControlTowerPage.tsx` — MODIFIED:
  - `submitQuestion` is now async and POSTs to `/api/v1/atlas/chat` (`runAtlasTurn`), passing `clientId`, `threadId` (continuity), and `surfaceContext { surface: 'ai_control_tower', activeLens }`.
  - Renders the engine's prose `response` and maps `suggestions` to follow-up buttons.
  - Adds `pending` (loading state, disabled input/button) and `threadId` state.
  - Deletes the four keyword-routing branches in `buildAtlasAnswer` (`lower.includes('spend'|'risk'|'adoption'|'agent')`); the remaining structured-pack path is used only as an offline fallback, clearly marked "(offline read — Atlas engine unreachable)".
  - `AtlasAnswer` gains optional `body` (grounded prose) and `followUps`.
- `docs/releases/records/2026-06-18-tower-atlas-grounded-chat.md` — CREATED: this record.

## QA / Validation

Status: PASS (static) / NOT-RUN (live signed-in — requires deployed ACA + private data plane; localhost cannot reach the private DB)

- PASS: `npx eslint src/components/tower/AiControlTowerPage.tsx` — exit 0, clean.
- PASS: `npx tsc --noEmit` — zero errors in the touched file. (Pre-existing unrelated errors on main: stale `.next/dev/types` + Codex's `js-yaml` TS7016 in P1/P2 loader files — not introduced here and not build-blocking; current main deploys are green.)
- NOT-RUN: live signed-in Atlas verification — to be done post-deploy on app.abarva.ai against `first-capital`: ask "Which AI spend lacks adoption or value proof?" and confirm a grounded, fact-cited answer rather than a top-N-by-size lens dump.

## Rollout Plan

1. Squash-merge to `main`.
2. `.github/workflows/aca-main-deploy.yml` builds the web image and deploys a new revision to `ca-abarva-web-lab-eastus` (app.abarva.ai) automatically on push to main — single deploy authority, no manual `az containerapp update`.
3. Post-deploy: drive the live Tower Atlas chat on `first-capital` to confirm grounded answers.

## Rollback Plan

Single-file UI change with no schema or data-plane impact. Rollback = `git revert` the squash commit on `main`; the same `aca-main-deploy` workflow redeploys the prior revision. ACA also retains the prior revision, so traffic can be shifted back to it immediately if needed. No data migration to unwind.

## Known Gaps

- **Consolidation, not the cure.** `runAtlasTurn` / `buildStructuredAnswerFromContextPack` are themselves still intent-bucketed. Cross-metric predicates (`spend_ytd > 0 AND adoption_pct < x AND realized_value = 0`) only become fully answerable once the P5 `context-answer-engine` retrieves over typed facts. Tracked in `docs/codex-handoff/FIRST_CAPITAL_INTELLIGENCE_SUBSTRATE_BRIEF.md` (Atlas named as first consumer).
- Sentinel (Intelligence rail) is not part of this change; it gets the same treatment in P5.

## Audit Evidence

- Diff: `src/components/tower/AiControlTowerPage.tsx` (+83 / −114), keyword branches removed, grounded fetch added.
- Engine entry point: `src/app/api/v1/atlas/chat/route.ts` → `runAtlasTurn` (`src/lib/atlas/orchestrator.ts`).
- Deploy run: `aca-main-deploy.yml` execution for the merge commit (to be linked post-merge).
