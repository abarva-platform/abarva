# DES2 · Core UI Primitives

Slice ID: DES2
Slice name: Core UI Primitives
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-25
Author: Code (sole)

Implements the AbarVa visual canon (DES1) as a single shared theme
module plus eleven calm, deterministic React primitives. Every
primitive is a server component (no `useState`, no `useEffect`, no
data fetching, no model calls). Primitives accept fully-resolved
view-model props from caller slices — they never look up data,
agents, or evidence themselves.

## What changed

- New theme module
  [src/lib/design/abarva-theme.ts](../../../src/lib/design/abarva-theme.ts):
  - `COLORS` — surfaces (warm off-white), ink, NAVY (`#1B2B5C`)
    accent, AMBER and RED status accents, reserved dark surfaces.
  - `FONT` — DM Sans body, JetBrains Mono mono. No serif body.
  - `TYPE` — h1 / h2 / h3 / body / eyebrow / caption tokens.
  - `SPACING`, `RADIUS`, `BORDER` — calm hairline rhythm.
  - `ABARVA_AGENT_NAMES` (4) and `AGENT_ACCENT` partition matching
    canon §H.
  - `ABARVA_STATUS_KEYS` (7) + `statusAccent()` partition.
  - `ABARVA_FILE_CHIPS` (7), `ABARVA_EVIDENCE_STATES` (6).

- Eleven new primitives in
  [src/components/abarva/](../../../src/components/abarva/):
  - `AbarVaTopNav.tsx` — typographic wordmark + canonical surface
    list (`ABARVA_TOP_NAV_SURFACES`); no avatar.
  - `AgentBadge.tsx` — agent name + accent ring matching §H.
  - `AgentBriefPanel.tsx` — light or dark agent brief surface
    (Nexus / Sentinel / Atlas / Steward); summary + 1–4 supporting
    sentences + optional CTA slot.
  - `JourneyRail.tsx` — left rail of canonical phases (origination
    → charter → diagnose → design → execute → verify) with current
    + completed states.
  - `PatternCard.tsx` — Sentinel pattern card surface with title,
    eyebrow, status chip, evidence count, owner agent, optional
    pressure indicator.
  - `PressureCard.tsx` — Atlas pressure card surface (≤ 3 per page)
    with one big stat, two small stats, and an optional drilldown
    slot.
  - `MetricStrip.tsx` — calm horizontal strip of ≤ 5 stats; first
    stat may carry an emphasis ring.
  - `EvidenceChip.tsx` — evidence state pill mapped to the six
    `ABARVA_EVIDENCE_STATES`.
  - `FileTypeChip.tsx` — DOC / PDF / XLS / PPT / NOTE / HTML / DATA
    pill in mono font.
  - `DetailDrawerShell.tsx` — calm right-aligned drawer surface
    with header, body slot, footer slot. No own state — `open`
    comes from the consumer.
  - `EmptyInspector.tsx` — honest "nothing selected" surface used
    until a real selection is wired.

- New tests
  [src/__tests__/integration/design/abarva-ui-primitives.test.ts](../../../src/__tests__/integration/design/abarva-ui-primitives.test.ts):
  71 deterministic tests covering theme tokens (NAVY exact value,
  light surfaces, DM Sans body without serif), typography scale,
  spacing/radius/border invariants, agent partition (canon §H),
  status partition, top-nav canonical surface order, file-type
  enum, evidence-state enum, and module hygiene asserting that no
  primitive imports from `@/lib/sentinel/**`, `@/lib/atlas/**`,
  `@/lib/nexus/**`, `@/lib/agent/**`, `@/components/agent/**`,
  `@/lib/source/**`, `@/lib/programs/mock`, `@/lib/auth/**`, or
  `supabase`, and that no primitive uses `Date.now`, `Math.random`,
  `anthropic`, `openai`, `useState`, `useEffect`, or
  `fetch(`.

## What is deterministic today

- Theme module is pure tokens — no React, no runtime dependency.
- All primitives are server components (no client hooks).
- `AGENT_ACCENT[agent]` is a pure mapping; same input → same
  output across calls.
- `statusAccent(status)` is total over the seven canonical status
  keys — test enforced.
- `ABARVA_TOP_NAV_SURFACES` is a frozen canonical-order tuple —
  test enforced.
- No primitive reads from disk, network, or any agent / model
  service.

## What is NOT yet wired

- Page surfaces still use their existing component sets;
  DES3 / DES4 / DES5 / ADM5+ slices migrate Programs /
  Intelligence / AI Control Tower / Admin Setup onto these
  primitives.
- No theming / dark-mode toggle — dark surfaces are explicit
  per-component (e.g. `<AgentBriefPanel surface="dark" />`).
- No motion / transition system — primitives are static. A
  motion canon, if needed, lands as a separate slice.
- No icon component — icon-restraint canon (DES1 §I) means icons
  are imported per-surface from caller slices, not centralized.

## What is deferred to DES3+

- **DES3 — Programs UX Refresh** applies primitives to the
  Programs page (portfolio table, journey rail, phase canvas).
- **DES4 — Intelligence UX Refresh** applies primitives to the
  Intelligence page (Sentinel Brief, pattern strip, insight
  canvas).
- **DES5 — AI Control Tower UX Refresh** applies primitives to
  the AI Control Tower (Atlas Brief hero, scorecards, pressure
  cards, Ask Atlas drawer).
- **ADM5 — Admin Setup polish** lifts the Steward Setup +
  Dataset Explorer surfaces onto the canon.

## Honest fallbacks used

- Every primitive is purely presentational; the consumer owns
  data fetching, gating, and routing.
- `EmptyInspector` exists explicitly so that surfaces without a
  selection do not invent fake content.
- `AgentBriefPanel` accepts a `cta` slot but never builds one
  itself — caller slices must wire the CTA target.
- Module-hygiene tests block accidental imports from agent
  runtime, Source UI, mock data, auth, or supabase.

## Validation

- `npx tsc --noEmit --pretty false` — pass
- `npx jest src/__tests__/integration/design/abarva-ui-primitives.test.ts` — 71 passed
- `npm run build` — pass

## Status

Code complete. Pending founder review.
