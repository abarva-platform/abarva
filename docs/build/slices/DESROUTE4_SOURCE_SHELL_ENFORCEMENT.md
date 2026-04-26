# DESROUTE4 — Source Shell Enforcement

## Goal
Ensure active Source routes use the approved AbarVa Source shell and expose commercial intelligence workflow clearly from the mounted event route.

## Target Routes
- `/source`
- `/source/events`
- `/source/events/[eventId]`

## Implementation
- Added `SourceCanonShell` as canonical wrapper on Source routes.
- Updated target route files to use `SourceCanonShell`.
- Preserved deterministic Source event behavior and existing component mounts.
- Preserved `SourceCommercialEventSection` mount on event detail route.

## Workflow Orientation
- Explicit commercial workflow strip:
  - Event → Pricing → Risk → BAFO → Readiness → Missions → Signals
- Deterministic caveat shown in shell.

## Validation
- `npx tsc --noEmit --pretty false`
- `npx jest src/__tests__/integration/source/source-route-shell-enforcement.test.ts`
- `npx eslint --max-warnings=0 src/components/source/SourceCanonShell.tsx src/components/source/index.ts src/app/(maestro)/source/page.tsx src/app/(maestro)/source/events/page.tsx src/app/(maestro)/source/events/[eventId]/page.tsx src/__tests__/integration/source/source-route-shell-enforcement.test.ts`

## Guardrails
- No model calls.
- No upload/parsing runtime changes.
- No Source workflow engine rewrite.
- No separate readiness tracker.

