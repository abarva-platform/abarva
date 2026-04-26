Date: 2026-04-26
Slice: BAFO / Negotiation Panel Shell
Status: done

## Scope

- Add a deterministic BAFO/negotiation workspace shell inside the Source event canvas.
- Render it when the active stage is `orals_bafo`.
- Consume the deterministic BAFO negotiation read-model only.
- Keep behavior read-only, no artifact drawer or external workflow actions.

## Inputs

- `buildSourceBafoNegotiationPlan` output from seeded vendor responses + pricing normalization.
- `SourceBafoNegotiationPlan` (overall readiness, readiness blockers, priorities, commercial traps, assumptions, excluded scope).

## UI Behavior

- Overall negotiation readiness and next action.
- Executive tradeoff summary and Atlas implication.
- Vendor-specific negotiation questions with reasoned priority.
- Assumption lock list and excluded scope list.
- Commercial trap summary table.
- Steward and Sentinel notes.
- Top vendor blocks with key issues, recommended asks, and readiness.

## Files

- `src/lib/source/bafo-negotiation.ts`
- `src/lib/source/bafo-negotiation-types.ts`
- `src/lib/source/index.ts`
- `src/components/source/SourceBafoNegotiationPanel.tsx`
- `src/components/source/SourceActiveStageWorkspace.tsx`
- `src/__tests__/integration/source/source-bafo-negotiation-panel.test.ts`

## Validation

- `npx jest src/__tests__/integration/source/source-bafo-negotiation-panel.test.ts`
- `npx eslint src/components/source/SourceBafoNegotiationPanel.tsx src/components/source/SourceActiveStageWorkspace.tsx src/lib/source/bafo-negotiation.ts src/lib/source/bafo-negotiation-types.ts src/lib/source/mock-seed.ts src/__tests__/integration/source/source-bafo-negotiation-panel.test.ts`
- `npx tsc --noEmit --pretty false`
- `npm run build -- --webpack`
- existing Source shell/smoke coverage tests
- `git diff --check`

## Design compliance

- Off-white surface and compact card/table layout consistent with existing Source panels.
- No dark dashboard or chat-like input surface.
- No model/Claude/OpenAI calls.
- No workflow engine mutation, upload, parsing, or artifact drawer behavior.

## Production-readiness impact

- Adds BAFO negotiation panel surface in shell (read-model only).
- Does not alter production runtime contracts or model calls.
- No service or schema changes.
