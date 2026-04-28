# ADMIN16 — Production Readiness Depth

## Metadata
- ID: ADMIN16
- Title: Production Readiness depth — per-tile expandable + per-blocker drawer + promotion gate
- Track: 06-admin-readiness-architecture
- Wave: wave-admin-completion
- Status: backlog
- Type: ui
- Dependencies: ADMIN9 audit, W32F, AGENT1
- Estimated complexity: M

## Purpose
Add depth to `/admin/production-readiness`: per-tile expandable detail (which features are READY/PARTIAL/BLOCKED for each environment), per-blocker drawer with full description + remediation plan, promotion-decision panel, and history tab.

## Context
ADMIN5 shipped the Demo READY / Pilot PARTIAL / Production BLOCKED tiles + W32F top-blockers table. ADMIN16 makes them interactive: click a tile to expand → see underlying criteria; click a blocker → drawer.

## Target state
- `/admin/production-readiness` has 4 tabs: Readiness Tiles (default) / Blockers / Promotion Gate / History.
- Tile click → expand-in-place: criteria list (READY/PARTIAL/BLOCKED counts + per-feature row).
- Blocker row click → drawer: full description, owner, downstream impact, remediation plan, "Mark resolved" button (HARD-GATED stub).
- Promotion Gate tab: gate criteria for Demo→Pilot→Production with Steward editorial explaining current state honestly.
- History tab: last 10 promotion-state changes (deterministic seed).

## Allowed files
- `src/app/(maestro)/admin/production-readiness/page.tsx`
- `src/lib/admin/production-readiness-page-view.ts`
- `src/components/admin/production-readiness/ReadinessTileExpand.tsx` (new)
- `src/components/admin/production-readiness/BlockerDetailDrawer.tsx` (new)
- `src/components/admin/production-readiness/PromotionGatePanel.tsx` (new)
- `src/components/admin/production-readiness/PromotionHistoryTab.tsx` (new)
- `src/__tests__/integration/admin/admin16-production-readiness-depth.test.ts` (new)
- `docs/build/slices/ADMIN16_PRODUCTION_READINESS_DEPTH.md`

## Forbidden files
- Real blocker-store writes
- Any `production_ready: true` flip — NEVER
- Other admin pages

## Implementation scope
1. Extend view-model with per-tile criteria + history seed.
2. Tile expand: shows feature-level READY/PARTIAL/BLOCKED.
3. Blocker drawer: full detail + Mark resolved STUB.
4. Promotion gate panel: reads gate criteria from W32F + AGENT1 editorial body.
5. History tab: deterministic seed.

## Tests
- Tile expand renders criteria.
- Blocker drawer opens, Mark resolved disabled with reason.
- Promotion gate panel shows correct gate state (NEVER `production_ready: true`).
- ADMIN7 visual-lock passes.

## Validation
```bash
npx tsc --noEmit --pretty false
npm run lint -- src/components/admin/production-readiness src/app/\(maestro\)/admin/production-readiness
npx jest src/__tests__/integration/admin/admin16-production-readiness-depth
bash scripts/integration/check_admin_design_tokens.sh
```

## Acceptance criteria
1. 4 tabs render.
2. Tile expand + blocker drawer functional.
3. Promotion gate honest — never claims production-ready.
4. ADMIN7 visual-lock passes.

## Risks
- Promotion gate copy must NEVER say "ready for production" until W32F's read-model says so. Hardcode honest copy from AGENT1 editorial.

## Founder review
Visit `/admin/production-readiness`. Click Pilot tile → expands. Click a blocker → drawer. Mark resolved → button disabled.
