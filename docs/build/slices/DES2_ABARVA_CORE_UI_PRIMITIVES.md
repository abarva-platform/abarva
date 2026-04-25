# DES2 · AbarVa Core UI Primitives

Slice ID: DES2
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-25

Implements the 11 canonical AbarVa UI primitives + the theme tokens
module. Subsequent UX-refresh slices (DES3 / DES4 / DES5 / ADM5)
consume these primitives.

## What changed

- New theme module
  [src/lib/design/abarva-theme.ts](../../../src/lib/design/abarva-theme.ts)
  — `COLORS`, `FONT`, `TYPE`, `SPACING`, `RADIUS`, `BORDER`,
  `AGENT_ACCENT`, `statusAccent` helper. Re-exports
  `ABARVA_AGENT_NAMES`, `ABARVA_STATUS_KEYS`, `ABARVA_FILE_CHIPS`,
  `ABARVA_EVIDENCE_STATES`.
- New components in `src/components/abarva/`:
  - `AbarVaTopNav.tsx` — exports `AbarvaTopNav`, `AbarvaWordmark`,
    `ABARVA_TOP_NAV_SURFACES`. The wordmark renders "Abar" near-black
    bold + "Va" navy slightly larger inside a single inline-flex
    container — no SVG.
  - `AgentBadge.tsx` — inline mono-uppercase pill in agent accent.
  - `AgentBriefPanel.tsx` — shared brief shell with light /
    dark variants. Three disabled "Ask <agent>" follow-up chips
    with sub-label `deferred · live <agent> runtime`. Source +
    interpretation-basis footer caption.
  - `MetricStrip.tsx` — calm horizontal row of stat chips, ≤ 5.
  - `PressureCard.tsx` — Tower / Programs pressure card with severity
    accent top border.
  - `PatternCard.tsx` — Sentinel pattern card with severity +
    confidence chips, affected programs (top 4 + overflow),
    collapsible missing-inputs detail, recommended action, handoff
    chips, "Open pattern detail →" affordance.
  - `JourneyRail.tsx` — 6-phase rail with G1–G4 gate caps.
  - `FileTypeChip.tsx` — text-only file chip (DOC / PDF / XLS / PPT
    / NOTE / HTML / DATA).
  - `EvidenceChip.tsx` — evidence reference state chip with NAVY /
    AMBER / RED palette per state.
  - `DetailDrawerShell.tsx` — right-side overlay shell with eyebrow,
    title, plain-text "Close ✕" affordance, optional source caption.
  - `EmptyInspector.tsx` — honest dashed-border placeholder with
    optional route hint.

- New tests
  [src/__tests__/integration/design/abarva-ui-primitives.test.ts](../../../src/__tests__/integration/design/abarva-ui-primitives.test.ts):
  30 deterministic tests covering theme tokens, agent + status
  partitions, top nav surface list, file + evidence chip enums, and
  module hygiene across the theme module + every component file.

## What is deterministic today

- All component props are pure data; no `useState` / `useEffect` /
  `useMemo` required for any primitive in this slice.
- No animation beyond the theme's 120ms-fade ceiling.
- Components import only `next/link` and the AbarVa theme module
  (or sibling primitives) — never Sentinel / Atlas / Nexus / Agent
  runtime, Source UI, legacy /programs, mock.ts, auth, or supabase
  (test enforced).
- The wordmark renders without external SVG assets and without
  network fonts — DM Sans is the canonical body family already
  loaded by the application.

## What is NOT yet wired

- Components have no `useState` / `useEffect` — drawer open / close,
  modal mounting, and route navigation are the consumer's
  responsibility.
- `EmptyInspector` exposes a `routeHint`; `DetailDrawerShell`
  exposes a `closeHref`. These are passive props for now; the
  consumer wires the runtime.

## Validation

- `npx tsc --noEmit --pretty false` — pass
- `npx jest src/__tests__/integration/design/abarva-ui-primitives.test.ts` — 30 passed
- `npm run build` — pass

## Status

Code complete. Pending founder review.
