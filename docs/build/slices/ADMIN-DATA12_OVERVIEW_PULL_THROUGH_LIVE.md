# ADMIN-DATA12 — ADMIN18 Overview Pull-Through (Live Data)

## Metadata
- ID: ADMIN-DATA12
- Title: ADMIN18 Overview rebuilt against real DB tables (replaces deferred ADMIN18)
- Track: 06-admin-readiness-architecture
- Wave: wave-admin-data
- Status: backlog
- Type: code
- Dependencies: ADMIN-DATA10, ADMIN-DATA11
- Estimated complexity: M

## Purpose
Ship what ADMIN18 was originally scoped to do — Overview pull-through with setup timeline + recent activity strip + cross-page CTAs — but using **real data** from `admin_setup_progress` and `admin_audit_log` instead of deterministic seed. This is the slice that closes founder's complaint that triggered the wave.

## Context
ADMIN18 was deferred from `wave-admin-completion` because founder rejected deterministic seed for setup timeline + recent activity. ADMIN-DATA12 ships the same UI structure (depth components from the original ADMIN18 spec) wired to `getAdminOverviewSnapshot(tenantSlug)`, which reads from `admin_setup_progress` (timeline) and `admin_audit_log` (recent activity), and aggregates cross-page counts (open blockers, datasets pending approval, etc.) from the rest of the admin tables.

## Target state
- `src/lib/admin/overview-page-view.ts` removes `SETUP_ITEMS` literal.
- View builder calls `getAdminOverviewSnapshot(tenantSlug)`.
- Adds: `SetupTimelineCard` (steps with status + last-completed-at), `RecentActivityCard` (last 10 events from `admin_audit_log`), `CrossPageCTAGrid` (5 CTAs with live counts: "3 open blockers — Resolve →", etc.).
- Page route at `src/app/(maestro)/admin/page.tsx` awaits builder.
- New components in `src/components/admin/overview/`.
- WIRE2B Admin Overview score eligible to rescore from 92 → 96 (Overview depth shipped).

## Allowed files
- `src/lib/admin/overview-page-view.ts`
- `src/app/(maestro)/admin/page.tsx`
- `src/components/admin/overview/SetupTimelineCard.tsx` (new)
- `src/components/admin/overview/RecentActivityCard.tsx` (new)
- `src/components/admin/overview/CrossPageCTAGrid.tsx` (new)
- `src/lib/admin/__tests__/overview-page-view.test.ts`
- `src/components/admin/overview/__tests__/**`
- `docs/build/slices/ADMIN-DATA12_*.md`
- `docs/build/build-slices.json`

## Forbidden files
- `src/lib/admin/data/**` — adapters already exist
- `supabase/migrations/**`
- Other admin pages
- `docs/build/production-readiness.json` (no promotion)

## Implementation scope
1. Async view builder; remove `SETUP_ITEMS` literal.
2. Build 3 new overview components.
3. Page renders ContextBar + Editorial + SetupTimelineCard + RecentActivityCard + CrossPageCTAGrid + AgentRail.
4. URL searchParams for any drawer state (consistent with other admin pages).
5. All design tokens via `@/lib/design/design-tokens`; banned-token sweep clean.
6. Cross-page CTA counts computed at adapter (overview snapshot includes them).

## Tests
- ~30 new tests across page-view + 3 components.
- ADMIN19 regression suite must extend; DATA13 owns the lock.

## Validation
```bash
npx tsc --noEmit
npm test -- src/lib/admin/__tests__/overview src/components/admin/overview
npm run build
bash scripts/integration/hygiene_gate.sh --skip-build
```

## Acceptance criteria
1. No `SETUP_ITEMS` literal in `overview-page-view.ts`.
2. 3 new components render correctly.
3. Setup timeline reflects `admin_setup_progress` data; recent activity reflects last 10 events from `admin_audit_log`; cross-page CTAs show live counts.
4. URL searchParams contract clean.
5. Design-token sweep clean; banned-token sweep clean.
6. ~30 new tests green; full admin regression green.
7. `production_ready` not promoted.

## Risks
- Cross-page count adapter performance → 5-table join; mitigate with materialized view or caching in Wave 27 if slow.
- Recent activity may be empty in fresh dev DB → adapter falls back to "no events yet" empty state.

## Founder review
Visit `/admin`. Setup timeline shows real progress; recent activity shows real events; cross-page CTAs show live counts. Click each CTA — routes to the relevant admin sub-page.
