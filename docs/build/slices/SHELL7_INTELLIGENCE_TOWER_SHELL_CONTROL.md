# SHELL7 — Intelligence / Control Tower Shell Control

**Wave:** wave-20
**Lane:** G
**Status:** code_complete

## Summary

Lands two orientation shell components that wrap the Intelligence and Control Tower routes with a deterministic-data caveat strip and route identity label.

## Components

### `src/components/intelligence/IntelligenceRouteShell.tsx`

Wraps Intelligence route content. Renders a sticky identity bar showing:
- Route label: `INTELLIGENCE · PATTERN DETECTION`
- Tenant name (prop, default `Apex Retail`)
- Caveat: `Deterministic pattern detection. Not client-specific live intelligence. All signals are seed data.`

Props: `children`, `tenantName`, `pageMode` (`'index' | 'pattern_detail'`), `caveat`.

### `src/components/tower/TowerRouteShell.tsx`

Wraps Control Tower route content. Renders a sticky identity bar showing:
- Route label: `CONTROL TOWER · SIGNAL INTELLIGENCE`
- Tenant name (prop, default `Apex Retail`)
- Caveat: `Deterministic signals. No live procurement monitoring. All values are seed data.`

Props: `children`, `tenantName`, `caveat`.

## Route wiring

Both `intelligence/page.tsx` and `tower/page.tsx` exist. Additive shell wiring was assessed and deferred — both pages are server components with complex existing render trees; wrapping them with these shells is a safe follow-up slice to avoid blast-radius risk.

## Design canon compliance

- Background: `#FBFAF7` (near-white, canon-compliant)
- No teal (`#14B8A6`) or non-canon colors
- Font: `DM Sans` (canon body font)
- All values are deterministic seed data; no live model calls, no live monitoring

## Test

`src/__tests__/integration/qa/intelligence-tower-shell-control.test.ts` — 10 fs-only assertions covering:
- Component existence
- No teal colors
- Deterministic caveat present
- Orientation strings present
- Route files exist (both confirmed present)

## Non-goals

- No live signal ingestion
- No model calls
- No production_ready promotion
- No auth modification
