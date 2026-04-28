# ADMIN5 — Production Readiness Page Wired to New Shell

## Metadata
- ID: ADMIN5
- Title: Production Readiness Page — Wired to AdminCanonShellV2
- Track: 06-admin-readiness-architecture
- Wave: wave-admin-redesign
- Status: backlog
- Type: ui
- Dependencies: ADMIN1, ADMIN2, ADMIN3
- Estimated complexity: M

## Purpose
Convert `/admin/production-readiness` to use the new 3-zone shell with Demo / Pilot / Production status tiles and a top blockers table backed by the existing W32F view-model.

## Context
W32F (wave-32) shipped the deterministic blocker-detail read-model. The current Production Readiness page uses an older shell, no agent rail, and risks promoting `production_ready` claims. The wireframe locks tiles + blockers table + Steward editorial.

## Target state
- Page wraps content in `AdminCanonShellV2`.
- Steward editorial card honest about pilot vs production posture.
- Three tiles: Demo READY / Pilot PARTIAL / Production BLOCKED.
- Top blockers table consumes `src/lib/admin/blocker-detail-view.ts` (W32F).
- Context bar same template; LIVE STATUS=Deferred.
- Agent rail: Steward primary; no `production_ready: true` anywhere.

## Allowed files
- `src/app/(maestro)/admin/production-readiness/page.tsx` (modify)
- `src/lib/admin/production-readiness-page-view.ts` (new)
- `src/components/admin/DemoPilotProductionTiles.tsx` (new)
- `src/components/admin/TopBlockersTable.tsx` (new)
- `src/__tests__/integration/admin/production-readiness-page-view.test.ts` (new)
- `docs/build/slices/ADMIN5_PRODUCTION_READINESS_PAGE.md`

## Forbidden files
- Architecture page (ADMIN4)
- Other admin pages (ADMIN6)
- W32F view-model (`blocker-detail-view.ts`) — consume only, don't modify

## Implementation scope
1. Wrap page in `AdminCanonShellV2` + `EditorialCanvas`.
2. Render Steward editorial: title naming pilot/production posture honestly. Evidence strength `'partial'`. Primary action route to top blocker.
3. `DemoPilotProductionTiles` — 3 tiles, statuses fixed by the read-model. Demo READY, Pilot PARTIAL, Production BLOCKED.
4. `TopBlockersTable` — consumes W32F `BlockerDetailDrawerView`. Renders severity / owner / pilotImpact / productionImpact columns.
5. Context bar with TENANT=Apex Retail, MODE=Setup/Admin, AGENT=Steward, DATA=Manifest+seeds, LIVE STATUS=Deferred.
6. Agent rail: Steward primary. No `production_ready: true` anywhere.

## Tests
- `src/__tests__/integration/admin/production-readiness-page-view.test.ts` (22+ tests):
  - tile statuses are Demo READY / Pilot PARTIAL / Production BLOCKED
  - blocker table renders entries from W32F view-model
  - drawer integration links to blocker detail
  - no `production_ready: true` literal anywhere in page tree
  - no fabricated counts or percentages

## Validation
```bash
npx tsc --noEmit --pretty false
npm run lint -- src/app/\(maestro\)/admin/production-readiness src/lib/admin/production-readiness-page-view.ts src/components/admin/DemoPilotProductionTiles.tsx src/components/admin/TopBlockersTable.tsx
npx jest src/__tests__/integration/admin/production-readiness-page-view
```

## Acceptance criteria
1. Page renders.
2. Never claims `production_ready`.
3. Blocker drawer integration works.
4. `npx tsc --noEmit` clean.

## Risks
- Drawer wiring may require client-side state — keep it minimal and avoid introducing a new state library.
- Production Readiness audit scoring will move; ADMIN7 owns the score bump.

## Founder review
After merge: visit `/admin/production-readiness`. Expect 3-zone shell, 3 tiles (Demo READY / Pilot PARTIAL / Production BLOCKED), top blockers table with W32F entries, agent rail with Steward primary, no production_ready promotion.
