# ADMIN2 — Admin Shell: 3-Zone Canonical Layout

## Metadata
- ID: ADMIN2
- Title: Admin Shell — 3-Zone Canonical Layout
- Track: 06-admin-readiness-architecture
- Wave: wave-admin-redesign
- Status: backlog
- Type: ui
- Dependencies: ADMIN1
- Estimated complexity: L

## Purpose
Build the canonical 3-zone admin shell (sidebar / canvas / agent rail) as wireframed by the founder on 2026-04-27. This shell is the chassis every admin sub-page (ADMIN4–6) inherits.

## Context
The current admin shell renders a 2-zone layout, has no agent rail, and uses ad-hoc tokens. The wireframes lock 3 zones at 280 / flex / 320 px, with an 8-item sub-sidebar and a 4-card agent rail. The shell must use ADMIN1 tokens — no hex literals.

## Target state
- `AdminCanonShellV2` renders 3 zones in a CSS grid.
- `AdminSidebar` lists the 8 canonical items with subtitles + active state via `usePathname`. Bottom amber Live caveat pill.
- `EditorialCanvas` exposes `eyebrow` / `title` / `subtitle` / `contextBar` / `children` slots. Title in Cormorant Garamond.
- `AgentRail` renders a primary agent header card + 4 agent cards (Steward / Nexus / Sentinel / Atlas) + "3 choices + custom" action set.
- Below 1280px, the agent rail collapses to a drawer.
- All consumers of color reference design tokens — no inline hex.

## Allowed files
- `src/components/admin/AdminCanonShellV2.tsx` (new)
- `src/components/admin/AdminSidebar.tsx` (new — or modify existing)
- `src/components/admin/EditorialCanvas.tsx` (new)
- `src/components/admin/AgentRail.tsx` (new)
- `src/lib/admin/admin-shell-config.ts` (new)
- `src/__tests__/integration/admin/admin-shell-v2.test.ts` (new)
- `docs/build/slices/ADMIN2_ADMIN_SHELL_3ZONE.md`

## Forbidden files
- `src/app/(maestro)/admin/**` — page wiring lands in ADMIN4–6
- `src/components/brand/AbarVaLogo.tsx` — owned by ADMIN1
- `src/lib/design/design-tokens.ts` — owned by ADMIN1
- Any read-model file in `src/lib/admin/` other than `admin-shell-config.ts`

## Implementation scope
1. CSS grid layout: `grid-template-columns: 280px 1fr 320px`.
2. Sidebar items: Overview, Data Trust, Connectors, Users & Access, Agent Readiness, Production Readiness, Build Progress, Architecture. Each carries a short subtitle. Active state matches via `usePathname` startsWith.
3. Editorial canvas exposes the named slots and renders Cormorant Garamond title at canonical scale. Cream background, ink text.
4. Agent rail: primary agent header card, then 4 agent cards. Each agent card carries name + posture pill (BLOCKED / PARTIAL / THIN) + 1 short editorial line. Action set lists "3 choices + custom".
5. Responsive collapse: < 1280px hides agent rail behind a drawer toggle.
6. ALL color values come from ADMIN1 tokens. No literals, no inline hex.

## Tests
- `src/__tests__/integration/admin/admin-shell-v2.test.ts` (30+ tests):
  - shell renders 3 zones
  - sidebar lists exactly 8 items in order
  - active state lights up for matched route
  - editorial canvas slots render
  - agent rail renders 4 cards with posture pills
  - responsive collapse threshold present
  - no banned tokens
  - no inline hex literals (regex scan)

## Validation
```bash
npx tsc --noEmit --pretty false
npm run lint -- src/components/admin src/lib/admin
npx jest src/__tests__/integration/admin/admin-shell-v2
```

## Acceptance criteria
1. Shell renders standalone in tests.
2. 8 sub-pages addressable from sidebar.
3. No banned tokens.
4. ESLint clean.
5. `npx tsc --noEmit` clean.

## Risks
- `usePathname` behavior in test environment may need a mock helper.
- CSS grid + responsive collapse logic may interact with existing AdminCanonShell (legacy) — keep V2 isolated and let pages opt in via ADMIN4–6.

## Founder review
After ADMIN2 alone, no admin route renders the new shell yet — pages must opt in (ADMIN4–6). Reviewer can run unit tests to confirm shell shape and structure.
