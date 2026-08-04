# Tower Implementation Handoff

Date: 2026-08-02

Branch: `codex/tower-command-center-local-model`

## Implemented

- `/tower` now reads from `src/lib/tower/readTowerCommandCenter.ts`.
- The new reader uses local `tower.*` objects and does not query `cio_tower`.
- Tenant resolution is fail-closed; non-SkyHarbor tenants do not fall back to SkyHarbor data.
- The command-center model carries known, unknown, and attestation claim counts.
- UI views label unknown value as unknown instead of rendering it as `$0`.
- Evidence gaps are generated for amount-unknown claims.
- Added focused unit coverage for the new reader and evidence-gap behavior.
- Added reviewable DDL for an unknown-safe `tower.value_funnel` view.

## Files Changed

- `src/app/(maestro)/tower/page.tsx`
- `src/lib/tower/readTowerCommandCenter.ts`
- `src/lib/tower/__tests__/readTowerCommandCenter.test.ts`
- `src/lib/cio-tower/tower-mart-view-model.ts`
- `src/lib/tower/command-center/types.ts`
- `src/lib/tower/command-center/view-model.ts`
- `src/lib/tower/command-center/__tests__/view-model.test.ts`
- `src/components/tower/command-center/TowerCommandCenter.tsx`
- `src/components/tower/command-center/views/CommandCenterView.tsx`
- `src/components/tower/command-center/views/ValueProofView.tsx`
- `src/components/tower/command-center/views/DecisionLanesView.tsx`
- `src/components/tower/command-center/views/EvidenceView.tsx`
- `db/tower/20260802_tower_value_funnel_unknown_safe.sql`

## Not Implemented

- No Azure, ACA, production, or shared database mutation.
- No destructive purge of old database tables.
- No canonical promotion or baseline activation.
- No Cube semantic layer.
- No browser-visible signed-in proof.
- No Claude production-provider change.

## Operator Follow-Up

1. Review and apply `db/tower/20260802_tower_value_funnel_unknown_safe.sql` through the approved DB lane.
2. Archive and purge `cio_tower.mart_*` only after a table manifest, checksums, and rollback archive are approved.
3. Populate baseline, target, actual, calculated value, Finance attestation, and business attestation fields.
4. Resolve promised-value source conflicts before allowing value totals.
5. Run signed-in browser proof for `/tower` with the approved local/lab environment.
