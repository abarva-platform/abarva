# DESROUTE5 — Program Shell Enforcement

## Goal
Ensure tenant program routes use a canonical AbarVa program shell with clear workflow orientation, while preserving existing program detail/index behavior.

## Target Routes
- `/tenant/[tenantSlug]/programs`
- `/tenant/[tenantSlug]/programs/[programSlug]`

## Implementation
- Added `ProgramCanonShell` route wrapper.
- Mounted canonical shell on both tenant program routes.
- Preserved existing `ProgramsCanonicalIndex` and `ProgramCanonicalDetail` rendering.
- Added deterministic workflow strip:
  - journey state
  - current phase/gate orientation
  - Nexus next action
  - deliverables/evidence + mission framing

## Validation
- `npx tsc --noEmit --pretty false`
- `npx jest src/__tests__/integration/programs/program-route-shell-enforcement.test.ts`
- `npx eslint --max-warnings=0 src/components/programs/ProgramCanonShell.tsx src/app/(maestro)/tenant/[tenantSlug]/programs/page.tsx src/app/(maestro)/tenant/[tenantSlug]/programs/[programSlug]/page.tsx src/__tests__/integration/programs/program-route-shell-enforcement.test.ts`

## Guardrails
- No persistence/write actions.
- No model/API calls.
- No auth rewrite.
- No fake approvals/live actions.

