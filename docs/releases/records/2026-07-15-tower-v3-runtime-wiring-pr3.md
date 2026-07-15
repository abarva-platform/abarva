# 2026-07-15-tower-v3-runtime-wiring-pr3 — Selected Tower Runtime View Behind Flag

## Release ID

`2026-07-15-tower-v3-runtime-wiring-pr3`

## Status

`candidate`

## Plain-English Summary

This release candidate wires one selected Tower runtime view to the proven Meridian TowerContextPack path behind `ENABLE_TOWER_V3_CONTEXT_RUNTIME=false` by default. When the flag is off, existing Tower behavior remains unchanged. When the flag is on for Meridian / Healthcare Demo, the selected `/tower` portfolio view can render measurement readiness, value hypotheses, claim-gate status, grouped blocker themes, and next measurement actions from the governed context pack. This is not Tower v3 completion.

## Layer Impact

- Tower runtime view: Adds a flagged selected `/tower` rendering path for Meridian / Healthcare Demo only.
- Enterprise knowledge layer: Reuses the Meridian TowerContextPack proof path from active v3 dimensions 08, 09, 11, 14, 17, and 18.
- Governance and audit: Adds source-of-truth alignment and runtime wiring proof scripts.
- UI language: Renders measurement/readiness/value-hypothesis language and keeps unsupported outcome-proof language blocked.
- Data plane: No production tenant writes, no candidate creation, no candidate promotion, and no Active Tenant Access update.

## Client Applicability

- All clients: The flag and runtime wiring pattern are shared platform controls.
- Specific clients: The selected runtime proof applies only to Meridian Health / Healthcare Demo aliases while the flag is enabled.
- Internal only: The proof reports are internal release evidence.
- Public/demo only: None.
- Feature flag: `ENABLE_TOWER_V3_CONTEXT_RUNTIME=false` by default.

## Changes Included

- `src/app/(maestro)/tower/page.tsx`
- `src/components/tower/TowerIndexPage.tsx`
- `src/lib/tower/tower-v3-runtime-flag.ts`
- `src/lib/tower/tower-v3-runtime-view.ts`
- `src/lib/tower/__tests__/tower-v3-runtime-flag.test.ts`
- `src/lib/tower/__tests__/tower-v3-runtime-view.test.ts`
- `scripts/audit/build-tower-v3-runtime-wiring-proof.ts`
- `scripts/audit/check-tower-v3-source-of-truth-alignment.ts`
- `reports/tower-v3-runtime-wiring/`
- `package.json` scripts `audit:tower-v3-runtime-wiring` and `audit:tower-v3-source-of-truth-alignment`

## QA / Validation

- Pass: `npx jest --runInBand src/lib/tower/__tests__/tower-v3-runtime-view.test.ts src/lib/tower/__tests__/tower-v3-runtime-flag.test.ts src/lib/enterprise-knowledge/tower/__tests__/tower-v3-context-pack-from-tenant-inputs.test.ts src/lib/tower/__tests__/value-claim-gate.test.ts src/lib/enterprise-knowledge/assembler/__tests__/tower-context-pack-builder.test.ts`
- Pass: `npm run audit:tower-v3-runtime-wiring`
- Pass: `npm run audit:tower-v3-meridian-context-pack`
- Pass: `npm run audit:tower-v3-source-of-truth-alignment`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`
- Pass: `npm run audit:architecture-rules`
- Pass: `npm run audit:enterprise-naming`
- Pass: `npm run release:check`
- Pass: `git diff --check`
- Browser proof: Not run; proof folder includes an explicit blocker/status note.

## Rollout Plan

Open as a stacked draft PR after Tower PR1 and PR2. This PR should not be deployed as Tower completion. If merged later, the runtime path remains off by default until `ENABLE_TOWER_V3_CONTEXT_RUNTIME=true` is set through the approved runtime flag path and signed-in browser proof passes.

## Deployment Authority

- Repo-owned deploy workflow: Required for any future runtime deployment.
- Shared runtime mutators: None in this PR.
- Approved image digest: Not applicable until deployment.
- ACA runtime invariant: Required after any future deploy or flag update.
- Worker image invariant: Not applicable.
- Feature/env flag update path: Approved ACA/runtime env update only; default is off.
- Live signed-in proof required: Yes, before any live-runtime claim.

## Rollback Plan

Disable `ENABLE_TOWER_V3_CONTEXT_RUNTIME` or revert this PR. Existing Tower behavior remains available when the flag is off. No data migration, production write, candidate promotion, or Active Tenant Access update is involved.

## Audit Evidence

- `reports/tower-v3-runtime-wiring/summary.md`
- `reports/tower-v3-runtime-wiring/summary.json`
- `reports/tower-v3-runtime-wiring/context-pack-used.json`
- `reports/tower-v3-runtime-wiring/value-claim-gate-results.csv`
- `reports/tower-v3-runtime-wiring/gap-theme-aggregation.csv`
- `reports/tower-v3-runtime-wiring/rendering-proof.csv`
- `reports/tower-v3-runtime-wiring/screenshots/browser-proof-not-run.md`
- `reports/tower-v3-runtime-wiring/tower-v3-runtime-wiring-proof.html`

## Known Gaps

- Browser proof is not run yet.
- This does not claim Tower v3 completion.
- This does not retire `cio_tower`.
- This does not migrate all Tower routes.
- This does not prove measured outcomes.
- This does not update Active Tenant Access.
