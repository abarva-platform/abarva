# TOWER1 — Control Tower Route Shell Wiring

**Wave:** wave-21
**Lane:** H
**Status:** code_complete
**Date:** 2026-04-26

## What shipped

- Updated `src/components/tower/TowerRouteShell.tsx` to satisfy the Control Tower Page Blueprint (CONTROL_TOWER_PAGE_BLUEPRINT.md).
- Wired `TowerRouteShell` as the outer wrapper in `src/app/(maestro)/tenant/[tenantSlug]/tower/page.tsx`.
- Created integration test at `src/__tests__/integration/tower/tower-route-shell-wiring.test.ts`.

## Blueprint followed

**Source:** `docs/platform-design/page-blueprints/CONTROL_TOWER_PAGE_BLUEPRINT.md`

- Atlas is declared as primary agent in the orientation strip label: `CONTROL TOWER · SIGNAL INTELLIGENCE · ATLAS`.
- Tenant name is rendered in the strip via `tenantName` prop.
- Deterministic caveat rendered: `Deterministic signals. No live procurement monitoring.`
- `activeLens` prop exposes the active lens label (e.g. `Portfolio`, `Risk`, `Value`) in the strip.
- `Ask Atlas` is a drawer (secondary affordance) — it is NOT rendered in the shell strip.

## Props interface

```tsx
interface TowerRouteShellProps {
  children: React.ReactNode;
  tenantName?: string;
  activeLens?: string;    // e.g. "Portfolio" | "Value" | "Risk" etc.
  caveat?: string;
}
```

## Design canon

- Background: `#F8F7F4` (canonical warm off-white)
- Font: DM Sans (body), Georgia serif used in Atlas brief (not the shell strip)
- Atlas badge: dark-blue/navy (`#1B2B5C`) — no teal
- No `#14B8A6` anywhere in the shell
- No full-page dark mode
- No sparkles

## Agent-centric

- Atlas is the primary agent declared in the orientation label
- Caveat is always visible (deterministic seed, no live signals)
- Ask Atlas is a drawer affordance only — not a hero button in the shell

## Canonical logo

n/a — shell orientation strip only; no logo swap required.

## Route wiring

`src/app/(maestro)/tenant/[tenantSlug]/tower/page.tsx` now wraps its existing content (`ProgramPressureCards` + `SeedTenantTower`) with `TowerRouteShell`. The wrap is additive — all existing components are preserved.

## Deviations

None. All blueprint requirements satisfied.

## Tests

`src/__tests__/integration/tower/tower-route-shell-wiring.test.ts` — 7 deterministic filesystem checks:

1. TowerRouteShell.tsx exists
2. Tower route page file exists
3. Shell contains `CONTROL TOWER` orientation string
4. Shell contains `Atlas` or `ATLAS` agent label
5. Shell contains `Deterministic` caveat
6. Shell does NOT contain `#14B8A6`
7. Shell does NOT reference `Ask Atlas` as a primary affordance
