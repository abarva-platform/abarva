# ADMIN3 — Steward Editorial Component

## Metadata
- ID: ADMIN3
- Title: Steward Editorial Component (+ Context Bar, Evidence Pill, Blocker Pill)
- Track: 06-admin-readiness-architecture
- Wave: wave-admin-redesign
- Status: backlog
- Type: ui
- Dependencies: ADMIN1, ADMIN2
- Estimated complexity: M

## Purpose
Ship the canonical Steward editorial card and the supporting pills + context bar that every admin page (ADMIN4–6) must render at the top of its canvas.

## Context
The wireframes lock a Steward editorial pattern: eyebrow → title → body → context-used chips → evidence-strength pill → optional blocker pill → primary action. The wireframes also lock a 5-cell context strip (TENANT / MODE / AGENT / DATA / LIVE STATUS) above the editorial card. None of these components exist today.

## Target state
- `StewardEditorial`, `ContextBar`, `EvidenceStrengthPill`, `BlockerPill` exist as pure presentational components — props in, JSX out.
- Component variants cover all evidence-strength values and the blocker-present / blocker-absent cases.
- All color values reference ADMIN1 tokens.

## Allowed files
- `src/components/admin/StewardEditorial.tsx` (new)
- `src/components/admin/ContextBar.tsx` (new)
- `src/components/admin/EvidenceStrengthPill.tsx` (new)
- `src/components/admin/BlockerPill.tsx` (new)
- `src/__tests__/integration/admin/steward-editorial.test.ts` (new)
- `docs/build/slices/ADMIN3_STEWARD_EDITORIAL.md`

## Forbidden files
- `src/app/(maestro)/admin/**`
- `AdminCanonShellV2`, `AdminSidebar`, `EditorialCanvas`, `AgentRail` (owned by ADMIN2)
- Any `src/lib/admin/` read-model file (those land in ADMIN4–6)

## Implementation scope
1. `StewardEditorial` props:
   - `title: string`
   - `body: string`
   - `contextUsed: string[]`
   - `evidenceStrength: 'strong' | 'partial' | 'thin'`
   - `blocker?: string`
   - `primaryAction: { label: string; href: string }`
   Renders eyebrow + serif title + body + context-used chips + evidence pill + optional blocker pill + primary action button.
2. `ContextBar` props: `tenant`, `mode`, `agent`, `data`, `liveStatus`. 5 cells with uppercase labels. Cell separators in navy at low opacity.
3. `EvidenceStrengthPill` — soft mint / amber / coral fill keyed off the strength value.
4. `BlockerPill` — soft coral fill, only renders when a `blocker` string is present.
5. Pure presentational. No data fetching, no defaults that synthesize content.

## Tests
- `src/__tests__/integration/admin/steward-editorial.test.ts` (25+ tests):
  - StewardEditorial renders with all required props
  - blocker pill is absent when blocker prop is omitted
  - evidence pill matches strength variant (3 cases)
  - context-used chips render every entry
  - context bar renders all 5 cells with the canonical labels
  - no fabricated defaults — every visible value comes from props

## Validation
```bash
npx tsc --noEmit --pretty false
npm run lint -- src/components/admin
npx jest src/__tests__/integration/admin/steward-editorial
```

## Acceptance criteria
1. Components render with all variants.
2. No fabricated data inputs allowed (props only).
3. `npx tsc --noEmit` clean.
4. ESLint clean.

## Risks
- Designers may want a `'critical'` evidence-strength state later — leave the type closed at strong/partial/thin for this slice and revisit if a wireframe shows a 4th tone.
- BlockerPill copy guidance from the founder is short; keep it neutral and don't fabricate language.

## Founder review
Components don't render in any route until ADMIN4–6 wire them. Reviewer can verify via storybook/test snapshots if available, or by inspecting unit tests.
