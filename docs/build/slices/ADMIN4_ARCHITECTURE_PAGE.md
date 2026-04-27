# ADMIN4 — Architecture Page Wired to New Shell

## Metadata
- ID: ADMIN4
- Title: Architecture Page — Wired to AdminCanonShellV2
- Track: 06-admin-readiness-architecture
- Wave: wave-admin-redesign
- Status: backlog
- Type: ui
- Dependencies: ADMIN1, ADMIN2, ADMIN3
- Estimated complexity: M

## Purpose
Convert the existing `/admin/architecture` page to use the new 3-zone shell, the Steward editorial card, the 5-cell context bar, and an honest 4-card agent rail. Render the canonical 7-row plane stack as a deterministic read-model.

## Context
`/admin/architecture` is currently the lowest-scoring admin page in the WIRE2B audit (58/100 baseline). It lacks the agent rail, Steward editorial, and context bar. The wireframe locks a 7-plane vertical stack: App / Agent / Context / Evidence / Data / Gateway+Tools / Deployment.

## Target state
- Page wraps content in `AdminCanonShellV2`.
- Steward editorial titled "Atlas + Steward editorial · Architecture posture" with honest body, context-used chips, evidence strength `'partial'`, and primary action `"Open Azure story"`.
- Context bar: TENANT=Apex Retail, MODE=Setup/Admin, AGENT=Steward, DATA=Manifest+seeds, LIVE STATUS=Deferred.
- 7-row plane stack as a deterministic read-model, no live calls.
- Agent rail: Steward BLOCKED with primary action `"Open Azure story"`. Other agents reflect honest current posture.

## Allowed files
- `src/app/(maestro)/admin/architecture/page.tsx` (modify)
- `src/lib/admin/architecture-page-view.ts` (new — read-model)
- `src/components/admin/ArchitecturePlaneStack.tsx` (new)
- `src/__tests__/integration/admin/architecture-page-view.test.ts` (new)
- `docs/build/slices/ADMIN4_ARCHITECTURE_PAGE.md`

## Forbidden files
- Any other admin page (ADMIN5/ADMIN6 own those)
- Components owned by ADMIN2 / ADMIN3 (`AdminCanonShellV2`, `StewardEditorial`, etc. — consume only)
- `src/lib/design/design-tokens.ts` (ADMIN1)

## Implementation scope
1. Replace existing architecture page content with `<AdminCanonShellV2>` wrapping `<EditorialCanvas>` + `<StewardEditorial>` + `<ArchitecturePlaneStack>` + `<AgentRail>`.
2. Steward editorial body: honest description of plane coverage. Context-used: e.g. `["routes-registry", "azure-architecture-docs"]`.
3. 7-plane stack — deterministic read-model returning each plane's name, status, and at least one component reference. No live calls.
4. Context bar with the locked values above.
5. Agent rail: Steward primary, BLOCKED, with `"Open Azure story"` primary action.

## Tests
- `src/__tests__/integration/admin/architecture-page-view.test.ts` (20+ tests):
  - read-model returns 7 planes in canonical order
  - each plane has name, status, and ≥1 component reference
  - read-model is deterministic (two calls return equivalent objects)
  - no banned tokens anywhere in the page tree
  - Steward editorial reflects partial evidence
  - agent rail honesty: Steward BLOCKED, no production_ready

## Validation
```bash
npx tsc --noEmit --pretty false
npm run lint -- src/app/\(maestro\)/admin/architecture src/lib/admin/architecture-page-view.ts src/components/admin/ArchitecturePlaneStack.tsx
npx jest src/__tests__/integration/admin/architecture-page-view
```

## Acceptance criteria
1. Page renders.
2. 7 planes visible.
3. No banned tokens.
4. Agent rail honest about posture.
5. `npx tsc --noEmit` clean.

## Risks
- Existing architecture page content may carry inline styles with banned tokens — strip them as part of this slice.
- Read-model determinism is critical; avoid `Date.now()`, `Math.random()`, or any environment-derived input.

## Founder review
After merge: visit `/admin/architecture`. Expect 3-zone shell, new logo lockup, Cormorant Garamond title, 5-cell context bar, Steward editorial card with `"Open Azure story"` action, 7-plane stack, 4-card agent rail with Steward BLOCKED.
