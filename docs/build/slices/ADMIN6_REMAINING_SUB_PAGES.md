# ADMIN6 — Remaining 6 Admin Sub-Pages

## Metadata
- ID: ADMIN6
- Title: Remaining 6 Admin Sub-Pages — Wired to AdminCanonShellV2
- Track: 06-admin-readiness-architecture
- Wave: wave-admin-redesign
- Status: backlog
- Type: ui
- Dependencies: ADMIN1, ADMIN2, ADMIN3
- Estimated complexity: XL

## Purpose
Wire the remaining 6 admin sub-pages (Overview, Data Trust, Connectors, Users & Access, Agent Readiness, Build Progress) to the new shell so all 8 admin routes match the canonical wireframe.

## Context
ADMIN4 wires Architecture, ADMIN5 wires Production Readiness. The remaining 6 routes still use the legacy shell (or stubs). Existing read-models cover most page-specific content: W32D for Connectors, ADM6 for Users & Access, existing agent-readiness model for Agent Readiness, build-slices.json for Build Progress, data-trust modules for Data Trust.

## Target state
All 8 admin routes resolve under the new 3-zone shell with Steward editorial, context bar, agent rail, and Live caveat. No fabricated counts.

## Allowed files
- `src/app/(maestro)/admin/page.tsx` (Overview)
- `src/app/(maestro)/admin/data-trust/page.tsx`
- `src/app/(maestro)/admin/connectors/page.tsx`
- `src/app/(maestro)/admin/users-access/page.tsx`
- `src/app/(maestro)/admin/agent-readiness/page.tsx`
- `src/app/(maestro)/admin/build-progress/page.tsx`
- Corresponding read-model files in `src/lib/admin/` (e.g. `admin-overview-page-view.ts`, `data-trust-page-view.ts`, `users-access-page-view.ts`, `build-progress-page-view.ts`)
- Tests under `src/__tests__/integration/admin/`
- `docs/build/slices/ADMIN6_REMAINING_SUB_PAGES.md`

## Forbidden files
- Architecture page (ADMIN4)
- Production Readiness page (ADMIN5)
- W32D `connectors-readiness-view`, ADM6 access models — consume only
- Components owned by ADMIN1/ADMIN2/ADMIN3

## Implementation scope
Each sub-page uses the same template (eyebrow + serif title + context bar + Steward editorial + page-specific content + agent rail).

- **Overview** (`/admin`) — portfolio-summary tiles. Steward editorial: "What needs your attention this week."
- **Data Trust** (`/admin/data-trust`) — dataset trust ladder + sharing levels. Reuses `src/lib/data-trust/`.
- **Connectors** (`/admin/connectors`) — consumes W32D `connectors-readiness-view` (6 connectors).
- **Users & Access** (`/admin/users-access`) — deterministic seed list. Reuses ADM6 ground.
- **Agent Readiness** (`/admin/agent-readiness`) — consumes existing `agent-readiness` model.
- **Build Progress** (`/admin/build-progress`) — wave + slice progress (read from `build-slices.json` or existing progress view).

All page-specific content uses real models or deterministic seeds — no fabricated counts.

## Tests
- ~10 tests per page, ~60 total across 6 page tests:
  - each page renders the canonical 3-zone shell
  - each page renders a Steward editorial card
  - each page renders the 5-cell context bar
  - each page renders an agent rail with honest posture
  - each page renders the Live caveat pill
  - no banned tokens
  - no fabricated counts (every count traces to a read-model or seed file)

## Validation
```bash
npx tsc --noEmit --pretty false
npm run lint -- src/app/\(maestro\)/admin src/lib/admin
npx jest src/__tests__/integration/admin
```

## Acceptance criteria
1. All 8 admin sub-routes resolve cleanly with the new shell.
2. No fabricated counts or percentages.
3. `npx tsc --noEmit` clean.
4. ESLint clean.

## Risks
- Largest lane in the wave; consider splitting into ADMIN6a/6b if scope expands.
- Existing data-trust / agent-readiness models may need light adapters, not modifications. Keep adapters in `src/lib/admin/`.
- Build Progress page must not synthesize percentages — it should display only what the manifest manifestly states.

## Founder review
After merge: visit each of the 6 routes. Expect canonical 3-zone layout, page-specific content, agent rail with honest posture, no production_ready promotion.
