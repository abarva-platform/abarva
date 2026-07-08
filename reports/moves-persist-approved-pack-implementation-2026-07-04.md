# Moves — Persist approved Inputs Packs (increment 10 implementation report)

**Date:** 2026-07-04 · **Slice:** persist the client-approved next-phase Inputs Pack through the existing governed Move-scoped store (Option A — no new table, no migration, no ACA migrate job), and read it back on the next phase.

## 1. Executive verdict

Level-2 feed-forward is live behind the flag: confirming the What-Changed review writes a **Move-scoped approved Inputs Pack** into the existing `program_evidence_items` store (JSONB payload under `evidence_type = 'approved_inputs_pack'`), through the **same governed DB client, tenancy, RLS, and audit log** the evidence writer uses. The next phase reads the latest approved pack targeting it; with none, it falls back to deterministic feed-forward. **No schema change, no migrate job.** The UI states "Approved for next phase" and "Enterprise context: Not added yet."

## 2. Storage decision (Option A)

`recordProgramEvidence` was too rigid (fixed `EvidenceType` union + fixed `extractedStructured` shape), so a tiny dedicated adapter (`approved-inputs-pack-store.ts`) inserts into the **same table** with the JSONB `extracted_structured` holding the pack and the TEXT `evidence_type` set to the discriminator — mirroring the evidence writer's DB client + best-effort audit log. Reuses proven tenancy/RLS; zero governance drift.

## 3. Flow

1. **Confirm** (client): on What-Changed confirm → `buildApprovedInputsPack(feedForwardPack, whatChanged, metadata)` → `POST /api/programs/workspace/[moveId]/approved-inputs-pack { pack }`.
2. **Write** (route): `requireTenancy` + program gate; server **overrides** `moveId`/`approvedBy`(=`ctx.userId`)/`approvedAt`(=server now) and re-asserts `moveScopedOnly`/`not_eligible`; validates via `isApprovedInputsPack`; persists via the store; audit-logged.
3. **Read** (phase page): reads the latest `approved_inputs_pack` row where `phase = currentPhase`; passes to the client.
4. **Render** (panel): `ApprovedInputsPackCard` when present ("You're starting from an approved Inputs Pack"); else the deterministic feed-forward stands.

## 4. Requirements coverage

| Req | Status |
|---|---|
| Reuse existing storage (no new table) | ✅ `program_evidence_items` |
| Move-scoped content | ✅ tenant_key + program_id + RLS |
| phase source / target / approved_by / approved_at / source id / payload | ✅ in the pack + row |
| No enterprise promotion | ✅ `enterprisePromotion: 'not_eligible'`, server-reasserted |
| Client status "Approved for next phase" + "not added" | ✅ card |
| Next phase reads latest approved pack | ✅ page read → panel |
| Fallback to deterministic feed-forward | ✅ tested |
| Keep existing workflow intact | ✅ additive, flag-gated |
| Tests (create / read / fallback / Move-scoped / no promotion / no leak) | ✅ 79/79 |
| Merge, deploy, live-prove | write-proven live; read-back gate-gated (see gaps) |

## 5. Files

New: `phase-templates/approved-inputs-pack.ts`, `approved-inputs-pack-store.ts`, `api/.../approved-inputs-pack/route.ts`, `phase-workspace/ApprovedInputsPackCard.tsx`, 2 test files. Edited: `page.tsx` (read), `StrategicMovePhaseClient.tsx` (write + accept), `MovePhaseWorkspacePanel.tsx` + indexes.

## 6. Validation

Jest 79/79; esbuild parse (client/route/page/store) 0; scoped strict tsc 0; eslint 0; DB read/write chain verified against existing usages. See the release record for the live-proof plan and the read-back gate-gating caveat.

## 7. Known gaps

- Read-back UI is gate-gated (move must advance to the next phase); not forced with fake data.
- `approvedBy` is the actor person id; a human-readable name is a later refinement.
- Content is structural (from the feed-forward pack + change summary), not a semantic synthesis (that's Claude / increment 12).
