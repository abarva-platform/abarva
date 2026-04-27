# ADMIN14 — Data Trust Depth

## Metadata
- ID: ADMIN14
- Title: Data Trust depth — per-rung dataset list + drawer + approval stub + promotion + quality tabs
- Track: 06-admin-readiness-architecture
- Wave: wave-admin-completion
- Status: backlog
- Type: ui
- Dependencies: ADMIN9 audit, AGENT1
- Estimated complexity: L

## Purpose
Lift `/admin/data-trust` from a 5-rung ladder to a full canvas with per-rung dataset list, dataset detail drawer, trust-progression chart, plus three new tabs that absorb the substantive content of legacy `/platform/admin/data`, `/platform/admin/data-governance`, and `/platform/admin/quality`.

## Context
The 5-rung trust ladder ships today. Legacy `/platform/admin/data` (file upload listing, 452 lines), `/platform/admin/data-governance` (promotion request workflow, 518 lines), and `/platform/admin/quality` (4×4 confidence scorecard, 974 lines) all host data-trust-adjacent content with no canonical home. ADMIN14 consolidates them as tabs within Data Trust.

## Target state
- `/admin/data-trust` has 5 tabs: Trust Ladder (default) / Loaded Files / Promotion Queue / Quality Scorecard / Audit Trail.
- Trust Ladder tab: existing 5-rung ladder + click-to-expand per-rung dataset list.
- Dataset row click → drawer: provenance, last-updated, evidence-usable flag, approval owner, Approve dataset (HARD-GATED stub).
- Trust progression visualization: small line chart of dataset counts per rung over 30 days (deterministic seed).
- Loaded Files tab: file list with status pills (approved / missing / processing) by segment.
- Promotion Queue tab: promotion-request workflow (pending / approved / rejected) — Approve/Reject buttons HARD-GATED stubs.
- Quality Scorecard tab: 4 tenants × 4 pillars confidence grid (uses `lib/confidence`).
- Audit Trail tab: last 20 dataset-trust events (deterministic seed).

## Allowed files
- `src/app/(maestro)/admin/data-trust/page.tsx`
- `src/lib/admin/data-trust-page-view.ts`
- `src/components/admin/data-trust/DatasetDetailDrawer.tsx` (new)
- `src/components/admin/data-trust/TrustProgressionChart.tsx` (new)
- `src/components/admin/data-trust/LoadedFilesTab.tsx` (new)
- `src/components/admin/data-trust/PromotionQueueTab.tsx` (new)
- `src/components/admin/data-trust/QualityScorecardTab.tsx` (new — re-uses `lib/confidence`)
- `src/__tests__/integration/admin/admin14-data-trust-depth.test.ts` (new)
- `docs/build/slices/ADMIN14_DATA_TRUST_DEPTH.md`

## Forbidden files
- Real evidence-ledger writes
- Real promotion writes
- Other admin pages
- `src/lib/agent/**`

## Implementation scope
1. Extend `data-trust-page-view.ts` with per-rung dataset deterministic seed + 30-day progression points.
2. Build 5 tab components.
3. Drawer with provenance + Approve stub.
4. QualityScorecardTab pulls confidence calculation from existing `lib/confidence`.
5. PromotionQueueTab uses promotion-request data model from legacy `/platform/admin/data-governance` (lift the type, NOT the route).

## Tests
- 5 tabs render.
- Rung expand → dataset list.
- Drawer opens, Approve button disabled with reason.
- Quality scorecard shows 4×4 grid with deterministic confidence values.
- Promotion queue shows pending/approved/rejected sections.

## Validation
```bash
npx tsc --noEmit --pretty false
npm run lint -- src/components/admin/data-trust src/app/\(maestro\)/admin/data-trust
npx jest src/__tests__/integration/admin/admin14-data-trust-depth
bash scripts/integration/check_admin_design_tokens.sh
```

## Acceptance criteria
1. All 5 tabs render with deterministic data.
2. Drawer + Approve stub functional.
3. Confidence calculation matches legacy quality page output.
4. ADMIN7 visual-lock passes.
5. AGENT1 Sentinel posture reflects evidence-strength state.

## Risks
- 974-line legacy quality page is the largest legacy file. Don't reimplement all 974 lines — lift only the confidence calculation + the 4×4 grid render. Discard demo-narrative copy.

## Founder review
Visit `/admin/data-trust`. Click a rung → expand → dataset row → drawer. Switch to Quality Scorecard → 4×4 grid renders. Switch to Promotion Queue → pending/approved/rejected sections visible.
