# F-05 Substrate Migration Plan — 8→6 Phase Model

| Field | Value |
|---|---|
| **Doc ID** | F-05 |
| **WBS refs** | §5.4 Substrate Migration Coordination Track · §6.3 Substrate dependencies |
| **Backlog items** | B-027 Phase enum migration · B-028 Deliverable re-tagging · B-029 Tower handoff substrate |
| **Date** | 2026-05-05 |
| **Status** | Plan drafted — awaiting Anand review and merge to main |
| **Doctrine** | `docs/design/strategic-moves/PHASE_MODEL_V2_DOCTRINE.md` (locked 2026-05-05) |
| **Binding matrix** | `docs/design/strategic-moves/PHASE_PATTERN_BINDING_MATRIX_2026-05-05.md` |
| **Branch** | `spec/substrate-migration-plan` |

---

## 0 · Executive Summary

The codebase has two coexisting vocabularies that must be reconciled before
implementation of the Workspace and Originate detail pages can begin.

The **SQL substrate** was partially migrated by
`20260505000000_strategic_moves_six_phase_remap.sql` — it clamps
`engagements.current_phase` to 0..5 and backfills adjacent `phase_number`
columns.  The **TypeScript substrate** is split:

- `governance.ts`, `phase-labels.ts`, `types.db.ts`, and the five phase-pack
  files (P0–P5) already use the correct 6-phase vocabulary with accurate labels.
- `programs-types.ts` still defines `ProgramPhaseId = 0 | 1 | 2 | 3 | 4 | 5 | 6`
  (7 values) and the comment `// all 7 phases (P0-P6)`.
- `programs-fixture.ts` and `programs-detail-view.ts` still carry P6
  "Tower Handoff" labels and fixtures.
- `program-lifecycle-patterns.ts` and the four seed-pattern files that embed
  narrative text still reference the old 7-stage vocabulary
  (P0 Originate → P6 Operate).
- `mutations.ts` maps `tower_handoff_plan` and `control_tower_handoff`
  deliverable types to phase `[6]`.
- `phase-packs/` files (P1–P4) carry old internal constant names
  (`P1_DISCOVERY`, `P2_SYNTHESIS`, `P3_DESIGN`, `P4_BUILD`) and their labels
  partially updated — `P3_DESIGN` still uses `'P3 Design'` instead of
  `'P3 Design Future State'`.

This plan sequences three migration items so each can be shipped independently
without breaking the running application.

---

## 1 · Complete Inventory of Phase-Related Substrate

### 1.1 SQL substrate

| Table / column | Current state | Target state | Migration item |
|---|---|---|---|
| `engagements.current_phase` | `CHECK (0..5)` — correct post-`20260505000000` | No change needed | — |
| `program_milestones.phase_number` | `INT`, clamped to 0..5 | No change needed | — |
| `program_modules.phase_number` | `INT`, clamped to 0..5 | No change needed | — |
| `program_work_items.phase_number` | `INT`, clamped to 0..5 | No change needed | — |
| `program_risks.phase_number` | `INT`, clamped to 0..5 | No change needed | — |
| `program_evidence_items.phase` | `INT`, clamped to 0..5 | No change needed | — |
| `phase_snapshots.phase_number` | `INT`, clamped to 0..5 | No change needed | — |
| `deliverable_types.applicable_phases` | `INT[]`, clamped to 0..5 | Re-tag specific deliverable types to correct new phases | B-028 |
| `engagements.status` | legacy P6 rows mapped to `'complete'`, P7 to `'handed_off'` | Add `'handed_off'` and Tower-specific columns | B-029 |

**Assessment:** The main SQL migration (`20260505000000`) is already applied. No
new `ALTER TYPE` or enum migration is needed — the phase is an `INT` column, not
a Postgres enum type. B-027 is therefore a TypeScript-only change.

### 1.2 TypeScript substrate — phase-related files

| File | Current state | Migration item |
|---|---|---|
| `src/lib/programs/phase-labels.ts` | **Correct** — 6 labels P0..P5, `PHASE_LABELS_SHORT`, `PHASE_CODES`, `TOTAL_PHASES=6` | No change |
| `src/lib/programs/types.db.ts` | **Correct** — `PHASE_LABELS` 0..5, `current_phase` comment says 0..5 | No change |
| `src/lib/programs/governance.ts` | **Correct** — 5 gate rules P0→P1 through P4→P5, no P6 | No change |
| `src/lib/programs/failure-modes.ts` | **Correct** — all 10 items use `primaryPhases: number[]` with values in 0..5 only; preventionMechanism text updated to P5 Mobilize & Handoff / Tower language | No change |
| `src/lib/programs/phase-packs/types.ts` | **Correct** — `PhaseNumber = 0|1|2|3|4|5` | No change |
| `src/lib/programs/phase-packs/P0_originate.ts` | **Correct** — `phase: 0`, `label: 'P0 Originate'` | No change |
| `src/lib/programs/phase-packs/P5_activate.ts` | **Partially correct** — `label: 'P5 Mobilize & Handoff'` is right; internal constant `P5_ACTIVATE` and file name `P5_activate.ts` use old vocabulary | B-027 (rename) |
| `src/lib/programs/phase-packs/P1_discovery.ts` | **Stale** — constant `P1_DISCOVERY`, `label: 'P1 Charter'` is correct but file/constant name uses "Discovery" | B-027 (rename) |
| `src/lib/programs/phase-packs/P2_synthesis.ts` | **Stale** — constant `P2_SYNTHESIS`, `label: 'P2 Discover & Diagnose'` is correct but file/constant name uses "Synthesis" | B-027 (rename) |
| `src/lib/programs/phase-packs/P3_design.ts` | **Partially stale** — constant `P3_DESIGN`, `label: 'P3 Design'` (should be `'P3 Design Future State'`) | B-027 (rename + label fix) |
| `src/lib/programs/phase-packs/P4_build.ts` | **Stale** — constant `P4_BUILD`, `label: 'P4 Roadmap & Business Case'` is correct but file/constant name uses "Build" | B-027 (rename) |
| `src/lib/programs/phase-packs/index.ts` | **Stale** — imports and maps using old constant names | B-027 (update imports) |
| `src/lib/programs/programs-types.ts` | **Stale** — `ProgramPhaseId = 0|1|2|3|4|5|6`, comment `// all 7 phases (P0-P6)` | B-027 (narrow union) |
| `src/lib/programs/programs-fixture.ts` | **Stale** — `PHASE_LABEL_MAP` uses old 7-phase labels; `buildPhaseSlots` iterates `i <= 6`; one fixture at phase 6 | B-027 (update fixture) |
| `src/lib/programs/programs-detail-view.ts` | **Stale** — `GENERIC_P5_ACTIVATE_WORKBENCH`, `GENERIC_P6_OPERATE_WORKBENCH`, phase 6 branch | B-027 (retire P6 workbench) |
| `src/lib/programs/mutations.ts` | **Stale** — `tower_handoff_plan: [6]`, `control_tower_handoff: [6]` (phase array maps these to non-existent phase 6) | B-027 + B-028 (remap to phase 5) |
| `src/lib/programs/program-lifecycle-patterns.ts` | **Stale** — stages array still defines `P6-Operate`; gate IDs reference `P6-Operate`; narrative text says "7-phase P0..P6" | B-027 (retire P6 stage, update comment) |
| `src/lib/intelligence/seed-patterns-ai-programs.ts` | **Stale** — narrative text deeply embeds "7-phase lifecycle", "P6 Operate", "P5 Activate", "P5→P6 gate" in pattern prose | B-027 (text update — no structural change) |
| `src/lib/intelligence/ai-program-failure-modes.ts` | **Correct** — 12-key catalog uses no phase numbers | No change |
| `src/lib/programs/programs-page-view.ts` | **Stale** — comment `// Phase model: 7-phase P0–P6` | B-027 (comment update) |
| `src/lib/programs/programs-shape-resolver.ts` | **Stale** — comment `// Programs phases P0-P6` | B-027 (comment update) |
| `src/lib/programs/nexus-program-workbench-view.ts` | **Stale** — comment `// P6 hands monitoring to Tower` | B-027 (comment update) |
| `src/lib/programs/program-instance.ts` | **Stale** — comment `// all 7 phases`; `phases: ProgramPhaseState[]` sized to 7 in practice | B-027 (update comment + size guard) |

### 1.3 deliverable_types applicable_phases — specific re-tag targets (B-028)

The `20260505000000` migration clamped all `applicable_phases` values > 5 to 5.
That is a safe floor but not semantically correct for deliverables that were
previously tagged to old P6 (Tower Handoff). The following types need explicit
re-verification:

| deliverable_type_key | Current `applicable_phases` (post-clamp) | Correct target phases |
|---|---|---|
| `tower_handoff_plan` | `[5]` (clamped from `[6]`) | `[4, 5]` — drafted in P4, accepted in P5 |
| `control_tower_handoff` | `[5]` (clamped from `[6]`) | `[5]` — P5 only |
| `execution_monitoring_plan` | `[5]` (clamped from `[6]`) | `[4, 5]` |
| `approval_memo` | `[5]` — already correct | `[5]` |
| `sponsor_alignment` | `[5]` — already correct | `[5]` |
| `delivery_raci` | per migration | `[4, 5]` |
| `change_management_plan` / `readiness_and_change_plan` | per migration | `[3, 4, 5]` |

Also: `mutations.ts` has a `DELIVERABLE_PHASE_OVERRIDES` map that assigns
`tower_handoff_plan: [6]` and `control_tower_handoff: [6]`. These must be
updated to `[5]` and `[4, 5]` respectively as part of B-027/B-028 (no
migration needed — TypeScript change only).

### 1.4 Tower handoff substrate gap (B-029)

The doctrine (§ "P5 Mobilize & Handoff — Tower Handoff Package") specifies that
Tower receives at P5 completion:

- Execution roadmap (from P4)
- Monitoring plan (KPIs, thresholds, measurement cadence, data sources)
- Value realization framework (committed outcomes vs actuals tracking)
- Risk register (carried forward)
- RACI (named people)
- Change plan status
- Dependency map

Current substrate gaps for Tower handoff state:

| Gap | Current state | Required for B-029 |
|---|---|---|
| Tower receiver identity | No `tower_receiver_user_id` on `engagements` | Add column to `engagements` |
| Tower handoff accepted status | `engagements.status` carries `'handed_off'` but no timestamp or receiver acknowledgment | Add `tower_handoff_accepted_at TIMESTAMPTZ` + `tower_handoff_accepted_by_user_id UUID` |
| Tower monitoring config | `tower_handoff_plan` deliverable contains prose; no structured JSONB | Add `tower_config_jsonb JSONB` to `engagements` or create a separate `engagement_tower_config` table |
| Value tracking setup | No column linking to a value tracking cadence; P5 gate checks `tower_metric_plan_drafted` via deliverable presence only | Consider `tower_value_tracking_setup JSONB` on engagements |

**Recommendation:** Add a new table `engagement_tower_handoffs` rather than
expanding `engagements` further, to keep Tower-specific substrate isolated.
See §3.3 for the proposed DDL.

### 1.5 Origination draft substrate — D-11 gap (related)

WBS decision D-11 resolved that `/strategic-moves/new` auto-saves drafts. The
`program_origination_drafts` table already exists
(`supabase/migrations/20260429190000_program_origination_drafts.sql`) with the
right shape (`state JSONB`, committed/open split via `committed_engagement_id`).

The surface-level name `surface TEXT NOT NULL` will need a value of
`'strategic-moves'` (or `'strategic-moves-new'`) distinct from the existing
`'programs'` / `'programs-new'` surface values. No DDL change needed — this is
a runtime value choice for the Originate page implementation.

---

## 2 · B-027 — Phase Enum Migration (TypeScript Vocabulary)

### 2.1 What "migration" means here

There is no Postgres enum type to ALTER. The phase is stored as an `INT` column
constrained to 0..5. B-027 is entirely a **TypeScript vocabulary cleanup** — the
goal is that every file in the codebase uses consistent 6-phase language so
agents, UI, and tests do not encounter P6 / "Activate" / "Synthesis" /
"Discovery" / "Build" vocabulary at runtime or in logs.

### 2.2 Current state — stale vocabulary map

| Stale term | Appears in | Replace with |
|---|---|---|
| `P6 Operate` | `program-lifecycle-patterns.ts` stage IDs, narrative text in `seed-patterns-ai-programs.ts` | Retire as a phase; reference Control Tower as the downstream surface |
| `P6 Tower Handoff` | `programs-fixture.ts` PHASE_LABEL_MAP, `programs-detail-view.ts` workbench | Remove; `engagements.status = 'handed_off'` + Tower indicator |
| `P5 Activate` | `phase-packs/P5_activate.ts` (internal name only; label is already correct) | Rename constant to `P5_MOBILIZE`, file to `P5_mobilize.ts` |
| `P4 Build` | `phase-packs/P4_build.ts` constant/file | Rename to `P4_ROADMAP`, file to `P4_roadmap.ts` |
| `P3 Design` (short label) | `phase-packs/P3_design.ts` label field | Update to `'P3 Design Future State'` |
| `P2 Synthesis` | `phase-packs/P2_synthesis.ts` constant/file, narrative in `program-lifecycle-patterns.ts` | Rename to `P2_DIAGNOSE`, file to `P2_diagnose.ts` |
| `P1 Discovery` | `phase-packs/P1_discovery.ts` constant/file, narrative text | Rename to `P1_CHARTER`, file to `P1_charter.ts` |
| `ProgramPhaseId = 0|1|2|3|4|5|6` | `programs-types.ts` | Narrow to `0|1|2|3|4|5` |
| `buildPhaseSlots` loop `i <= 6` | `programs-fixture.ts` | Change to `i <= 5` |
| `tower_handoff_plan: [6]` in DELIVERABLE_PHASE_OVERRIDES | `mutations.ts` | Change to `[4, 5]` |
| `control_tower_handoff: [6]` | `mutations.ts` | Change to `[5]` |

### 2.3 Migration approach

**No database changes.** All changes are TypeScript file edits.

Sequencing within B-027 (to avoid TypeScript compilation errors mid-migration):

1. Update `programs-types.ts` — narrow `ProgramPhaseId` union to 0..5. This
   will break callers that pass `6` — those callers are the stale fixtures.
2. Update `programs-fixture.ts` — remove P6 slot, update `PHASE_LABEL_MAP` to
   6 entries, fix `buildPhaseSlots` loop, remove the one P6 fixture.
3. Rename phase-pack files and constants in one commit:
   - `P1_discovery.ts` → `P1_charter.ts` (export `P1_CHARTER`)
   - `P2_synthesis.ts` → `P2_diagnose.ts` (export `P2_DIAGNOSE`)
   - `P3_design.ts` → `P3_design_future_state.ts` (export `P3_DESIGN_FUTURE_STATE`,
     update label to `'P3 Design Future State'`)
   - `P4_build.ts` → `P4_roadmap.ts` (export `P4_ROADMAP`)
   - `P5_activate.ts` → `P5_mobilize.ts` (export `P5_MOBILIZE`)
   - Update `index.ts` imports
4. Update `programs-detail-view.ts` — remove `GENERIC_P5_ACTIVATE_WORKBENCH`
   and `GENERIC_P6_OPERATE_WORKBENCH`; replace P6 branch with Tower indicator.
5. Update `program-lifecycle-patterns.ts` — retire `P6-Operate` stage; update
   gate IDs that referenced `P6-Operate` to reference Tower handoff instead.
6. Update `mutations.ts` — fix `DELIVERABLE_PHASE_OVERRIDES` for
   `tower_handoff_plan` and `control_tower_handoff`.
7. Update narrative text in `seed-patterns-ai-programs.ts` — replace "7-phase
   lifecycle", "P6 Operate", "P5 Activate", "P5→P6 gate" with 6-phase language.
8. Comment-only updates: `programs-page-view.ts`, `programs-shape-resolver.ts`,
   `nexus-program-workbench-view.ts`, `program-instance.ts`.

### 2.4 Code gating — what must be updated before migration

- All tests in `src/lib/programs/phase-packs/__tests__/` reference the current
  constant names. They must be updated in the same PR as the renames.
- `src/app/api/chat/agent/route.ts` calls `getPhasePack(promptPhase)` and
  `formatPhasePackForPrompt()` — these go through `index.ts` and will continue
  to work after the index is updated. No route change needed.
- Any component that renders `ProgramPhaseId` values must handle the narrowed
  union. Search: `grep -rn "ProgramPhaseId\|currentPhase.*6\|phase.*===.*6"`.

### 2.5 Data backfill

No data backfill needed. The DB already has `current_phase` constrained to 0..5.
TypeScript narrowing `ProgramPhaseId` to 0..5 is a compile-time change only.

### 2.6 Rollback plan — B-027

B-027 is a pure TypeScript change with no DB mutations. Rollback = revert the
PR. No data is at risk. The PR must keep tests green so `git revert` is always
safe.

Rollback trigger: any CI failure on type-check or test after the rename PR.

### 2.7 Blocking dependencies

- B-027 does NOT block spec drafting (Layers 1–5 can be written against intended
  substrate).
- B-027 MUST be merged before implementation starts (W-IG gate in the WBS).
- B-027 MUST be merged before the phase-pack content replacement (S-4 in the WBS),
  because S-4 replaces pack content and relies on the renamed files.

---

## 3 · B-028 — Deliverable Re-tagging

### 3.1 Current state

`deliverable_types.applicable_phases` is an `INT[]` column. The
`20260505000000` migration applied a blanket clamp (`LEAST(p, 5)`) to every
element. This means P6-tagged deliverables now say `[5]` when they may belong
at `[4, 5]` or `[3, 4, 5]`. It also means deliverables that were pre-doctrine
phase-specific may no longer match correctly.

Known re-tagging needed (from governance.ts deliverable lookup patterns and the
deliverable_types seed migration):

| deliverable_type_key | Post-clamp `applicable_phases` | Correct target | Rationale |
|---|---|---|---|
| `tower_handoff_plan` | `[5]` | `[4, 5]` | P4 requires the plan drafted; P5 requires it accepted |
| `control_tower_handoff` | `[5]` | `[5]` | P5 only — accepted at handoff |
| `execution_monitoring_plan` | `[5]` | `[4, 5]` | Drafted in P4 as part of roadmap; finalized in P5 |
| `tower_metric_plan` / `control_tower_metrics` | `[5]` | `[4, 5]` | Same rationale as execution_monitoring_plan |
| `delivery_raci` | (verify) | `[4, 5]` | Drafted in P4; confirmed in P5 mobilization |
| `change_management_plan` / `readiness_and_change_plan` / `business_readiness_plan` | (verify) | `[3, 4, 5]` | Change plan starts in P3 design; formalized P4; executed in P5 |
| `execution_roadmap` / `mobilization_roadmap` | (verify) | `[4]` | P4 only — roadmap is the P4 output |
| `business_case` / `funding_business_case` | (verify) | `[4]` | P4 only |
| `design_spec` / `operating_model_design` | (verify) | `[3]` | P3 only |
| `discovery_report` / `discovery_synthesis` | (verify) | `[2]` | P2 only |
| `charter` | (verify) | `[1]` | P1 only |
| `origination_brief` / `program_seed` | (verify) | `[0]` | P0 only |

### 3.2 Migration approach — SQL

A single idempotent `UPDATE` migration. No data loss possible (changing an array
of phase numbers that are purely metadata).

```sql
-- B-028 · Deliverable re-tagging to 6-phase doctrine
-- Run after B-027 TypeScript changes are merged.
-- Each UPDATE is idempotent (uses explicit WHERE to avoid double-applying).

UPDATE deliverable_types
SET applicable_phases = ARRAY[4, 5]
WHERE key IN ('tower_handoff_plan', 'execution_monitoring_plan',
              'tower_metric_plan', 'control_tower_metrics', 'delivery_raci')
  AND applicable_phases = ARRAY[5];

UPDATE deliverable_types
SET applicable_phases = ARRAY[5]
WHERE key IN ('control_tower_handoff')
  AND applicable_phases = ARRAY[5];  -- already correct, verify only

UPDATE deliverable_types
SET applicable_phases = ARRAY[3, 4, 5]
WHERE key IN ('change_management_plan', 'readiness_and_change_plan',
              'business_readiness_plan')
  AND applicable_phases = ARRAY[5];

UPDATE deliverable_types
SET applicable_phases = ARRAY[4]
WHERE key IN ('execution_roadmap', 'mobilization_roadmap',
              'business_case', 'funding_business_case', 'approval_business_case')
  AND applicable_phases = ARRAY[5];

UPDATE deliverable_types
SET applicable_phases = ARRAY[3]
WHERE key IN ('design_spec', 'design', 'design_brief',
              'solution_design', 'operating_model_design',
              'requirements_traceability', 'requirements_design_outcome_trace')
  AND (applicable_phases = ARRAY[5] OR applicable_phases = ARRAY[3, 5]);
```

**Before running:** execute a dry-run `SELECT` on each `WHERE` clause to
confirm row counts match expectations. Unexpected high row counts indicate the
clamp migration ran on a different dataset than expected.

### 3.3 Dependent code

Any query that filters deliverables by `applicable_phases` must be verified
after B-028:

- `governance.ts` `findDeliverable()` — filters by `deliverable_type_key`, not
  `applicable_phases`; unaffected.
- `src/lib/programs/program-future-phase-deliverables.ts` — likely queries
  `applicable_phases`; must re-test after B-028.
- `src/lib/programs/deliverables-library-view.ts` — phase filter view; must
  re-test.
- `src/app/api/v1/programs/[programId]/deliverables/route.ts` — verify phase
  filter queries.

### 3.4 Rollback plan — B-028

The migration is `UPDATE`-only (no `DELETE`, no schema changes). Rollback = run
the inverse `UPDATE` statements restoring original `applicable_phases` values.
Because the original values were all `[5]` (post-clamp), rollback SQL is:

```sql
-- Rollback B-028: restore all touched rows to [5]
UPDATE deliverable_types
SET applicable_phases = ARRAY[5]
WHERE key IN (
  'tower_handoff_plan', 'execution_monitoring_plan', 'tower_metric_plan',
  'control_tower_metrics', 'delivery_raci', 'control_tower_handoff',
  'change_management_plan', 'readiness_and_change_plan',
  'business_readiness_plan', 'execution_roadmap', 'mobilization_roadmap',
  'business_case', 'funding_business_case', 'approval_business_case',
  'design_spec', 'design', 'design_brief', 'solution_design',
  'operating_model_design', 'requirements_traceability',
  'requirements_design_outcome_trace'
);
```

Rollback trigger: gate evaluation regresses (gates fail for deliverables that
were previously passing) on staging smoke test.

### 3.5 Blocking dependencies

- B-028 MUST run after B-027 (TypeScript changes must already be merged so
  the application reads the updated `DELIVERABLE_PHASE_OVERRIDES` from
  `mutations.ts` before the DB is updated).
- B-028 blocks: Workspace artifact shelf implementation (W-4.5), training pack
  pattern bundles (T-* packs that reference deliverable types by phase).
- B-028 does NOT block spec drafting.

---

## 4 · B-029 — Tower Handoff Substrate

### 4.1 Current state

No dedicated Tower handoff table exists. The current approach is:

- `engagements.status = 'handed_off'` signals post-P5 state.
- `tower_handoff_plan` deliverable (type key) carries the handoff package as
  prose content in `deliverable_versions.content`.
- No structured JSONB for Tower monitoring config, receiver identity, or
  handoff acceptance timestamp.

The P4→P5 gate check in `governance.ts` already has a soft check
`tower_handoff_plan_accepted` that reads `isSignedOff(towerHandoffRow)` — this
works today for gate evaluation. What is missing is the **structured Tower
substrate** that Tower's own surface needs after the handoff is accepted.

### 4.2 Required additions

Per the doctrine "Tower receives at P5 completion" and WBS §6.3:

```sql
-- B-029 · Tower handoff substrate
--
-- Creates engagement_tower_handoffs table to hold structured Tower
-- handoff state, receiver identity, acceptance, and monitoring config.
-- Kept separate from engagements to isolate Tower-specific substrate.
--
-- Naming doctrine:
--   External UI: "Strategic Move handoff to Control Tower"
--   Internal:    engagements + engagement_tower_handoffs
--   API:         /api/v1/programs/{id}/tower-handoff

CREATE TABLE IF NOT EXISTS engagement_tower_handoffs (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id             UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  -- Tower receiver
  tower_receiver_user_id    UUID,  -- user who accepted handoff on Tower side
  tower_receiver_name       TEXT,  -- display name if user not in system
  tower_receiver_role       TEXT,  -- e.g. 'delivery_owner', 'program_monitor'
  -- Handoff state
  handoff_status            TEXT NOT NULL DEFAULT 'pending'
                            CHECK (handoff_status IN ('pending', 'accepted', 'rejected', 'on_hold')),
  handoff_initiated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  handoff_accepted_at       TIMESTAMPTZ,
  handoff_accepted_by       UUID,  -- user_id of accepting party
  handoff_rejection_reason  TEXT,
  -- P5 package snapshot (JSONB mirror of key deliverable content)
  -- Structured per PHASE_MODEL_V2_DOCTRINE.md P5 package spec
  execution_roadmap_ref     UUID,  -- deliverables_v2.id of the signed roadmap
  monitoring_plan_ref       UUID,  -- deliverables_v2.id of the monitoring plan
  value_framework_ref       UUID,  -- deliverables_v2.id of the value realization plan
  raci_ref                  UUID,  -- deliverables_v2.id of the signed RACI
  risk_register_ref         UUID,  -- deliverables_v2.id of the risk register
  change_plan_ref           UUID,  -- deliverables_v2.id of the change plan
  dependency_map_ref        UUID,  -- deliverables_v2.id of the dependency map
  -- Monitoring configuration
  tower_config_jsonb        JSONB, -- KPIs, thresholds, measurement cadence, data sources
  -- Audit
  created_by_user_id        UUID,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Constraint: one active handoff per engagement
  CONSTRAINT uq_active_tower_handoff UNIQUE (engagement_id)
    DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX IF NOT EXISTS idx_tower_handoffs_engagement
  ON engagement_tower_handoffs (engagement_id);

CREATE INDEX IF NOT EXISTS idx_tower_handoffs_status
  ON engagement_tower_handoffs (handoff_status)
  WHERE handoff_status = 'pending';

-- Auto-touch updated_at
CREATE OR REPLACE FUNCTION touch_tower_handoff_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_tower_handoff_touch ON engagement_tower_handoffs;
CREATE TRIGGER trg_tower_handoff_touch
  BEFORE UPDATE ON engagement_tower_handoffs
  FOR EACH ROW EXECUTE FUNCTION touch_tower_handoff_updated_at();
```

### 4.3 Relationship to `engagements`

The `engagement_tower_handoffs` table is a 1:1 extension of `engagements` once
a handoff is initiated. The `engagements.status = 'handed_off'` flag remains the
primary status signal; `engagement_tower_handoffs` carries the structured detail.

`engagements.current_phase` stays at 5 after handoff — the doctrine says
`findGateRule(5, 6) === null`. The move does not advance beyond P5; Tower
tracking happens in a different surface.

**Open question (Q4 from binding matrix §12):** Is `engagements.current_phase`
ever mutated post-handoff? Recommendation: no — leave it at 5, use
`handoff_status` in `engagement_tower_handoffs` for Tower-side state. If
Control Tower needs to mark "monitoring active", use `handoff_status =
'accepted'` rather than incrementing `current_phase`.

### 4.4 D-11 substrate gap — Origination draft (related)

WBS decision D-11 (auto-save on scaffold step completion, 30-day idle abandon)
is addressed by the existing `program_origination_drafts` table. No new DDL is
needed.

The implementation must:

1. Use `surface = 'strategic-moves'` as the surface key (distinct from
   `'programs'` surface).
2. Set a 30-day TTL: add a scheduled job or Supabase cron to delete rows
   where `updated_at < NOW() - INTERVAL '30 days'` and
   `committed_engagement_id IS NULL`.
3. Add a `notified_at TIMESTAMPTZ` column to track the 25-day notification
   trigger (can be added in a small addendum migration).

The draft persistence table is **already shipped**; no B-029 dependency.

### 4.5 Rollback plan — B-029

`DROP TABLE IF EXISTS engagement_tower_handoffs CASCADE;`

B-029 creates a new table. Rolling back drops it. No data in `engagements` is
modified. Safe to rollback at any time before implementation writes production
data to the table.

Rollback trigger: Workspace P5 smoke test fails, or Tower surface design
changes require a different handoff schema.

### 4.6 Blocking dependencies

- B-029 MUST run after B-027 (the TypeScript `ProgramPhaseId` union must be
  narrowed so no code accidentally writes `phase = 6`).
- B-029 SHOULD run after B-028 (deliverable type re-tagging should be stable
  before `*_ref` columns point at deliverables).
- B-029 blocks: Workspace P5 phase implementation (W-4.2 per-phase canvas data
  bindings for P5), W-IG (Workspace Implementation Gate).

---

## 5 · Sequencing and Rollout

### 5.1 Dependency graph

```
B-027 (TypeScript vocabulary)
  │
  ├─► B-028 (deliverable re-tagging SQL)
  │       │
  │       └─► Workspace artifact shelf implementation (W-4.5)
  │           Training pack pattern bundles (T-P4, T-P5)
  │
  └─► B-029 (Tower handoff table)
          │
          └─► Workspace P5 data bindings (W-4.2 P5 slice)
              W-IG Workspace Implementation Gate
```

### 5.2 What can proceed during migration

Spec work (Layers 1–5) does NOT block on any migration item. The spec is written
against the *intended* substrate (post-migration). The WBS explicitly states:
"Spec can proceed against the intended substrate."

| Work package | Can start before migration? |
|---|---|
| All spec Layer 1–4 docs (O-*, W-1 through W-4) | Yes |
| Agent training packs T-P0 through T-P5 | Yes |
| Layer 5 knowledge surfacing specs | Yes (after T-* packs, per existing gate) |
| Originate implementation | Yes (after O-IG gate) |
| Workspace P0–P4 implementation | After B-027 + B-028 |
| Workspace P5 implementation | After B-027 + B-028 + B-029 |

### 5.3 Execution order

| Step | Migration item | Branch convention | Gate |
|---|---|---|---|
| 1 | B-027 TypeScript vocabulary | `substrate/phase-vocab-6` | Type-check clean + tests pass |
| 2 | B-028 Deliverable re-tagging SQL | `substrate/deliverable-retag` | Staging dry-run + gate evaluation smoke test |
| 3 | B-029 Tower handoff table | `substrate/tower-handoff-substrate` | Staging apply + Anand review |
| 4 | S-4 Phase-pack file migration (WBS) | `substrate/phase-pack-file-migration` | Test harness passes all 30 fixtures |

Steps 1–3 must be sequential (see §5.1). Step 4 can overlap with step 3 once
step 2 is merged.

### 5.4 Rollback checkpoints

| After step | Rollback action | Data at risk |
|---|---|---|
| After B-027 merged | `git revert` the PR | None — TypeScript only |
| After B-028 applied to staging | Run rollback SQL (§3.4) | None — array values only |
| After B-028 applied to prod | Run rollback SQL (§3.4) | None — array values only |
| After B-029 applied to staging | `DROP TABLE engagement_tower_handoffs CASCADE` | None — new table |
| After B-029 applied to prod | `DROP TABLE engagement_tower_handoffs CASCADE` | Any handoff rows written (should be zero pre-launch) |

---

## 6 · Risk and Safety

### 6.1 Risk table

| ID | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R-S1 | B-027 TypeScript rename breaks a build path not covered by type-check | Medium | Medium | Run `tsc --noEmit` + full test suite before PR merge; search for dynamic string-keyed imports of old filenames |
| R-S2 | B-028 `applicable_phases` update touches more rows than expected (data drift) | Low | Medium | Run SELECT dry-run before UPDATE; confirm row counts match expectations |
| R-S3 | `governance.ts` gate evaluation breaks after B-028 (deliverable lookup by type key, not phase) | Low | High | Gate evaluation uses `deliverable_type_key` not `applicable_phases`; unaffected. Verify with integration test post-migration. |
| R-S4 | B-029 `engagement_tower_handoffs` schema is wrong for eventual Tower surface | Medium | Medium | B-029 adds a new table with nullable columns; schema can be extended without data loss. Use `IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS` pattern for addendum migrations. |
| R-S5 | `seed-patterns-ai-programs.ts` narrative update changes agent behavior | Low | Low | Text updates are non-breaking for pattern embedding; embeddings are re-indexed on next seed run. Flag for re-indexing after B-027 merge. |
| R-S6 | D-11 draft persistence uses wrong `surface` key, collides with programs surface | Low | Medium | Implementation must use `'strategic-moves'` as surface value; add a `CHECK` constraint or application validation. |
| R-S7 | Migration applied to prod before staging verification | Low | High | Always apply to staging first; require passing smoke test before prod apply. Gate is Anand approval on staging confirmation. |
| R-S8 | Phase-pack renames (S-4) applied before agent route is updated to use new names | Low | High | S-4 must be a single PR that renames files AND updates `index.ts` in the same commit. Never rename files without updating `index.ts`. |

### 6.2 Feature flag strategy

No application-level feature flag is needed for these migrations because:

- B-027 is a TypeScript rename; the application is redeployed, not toggled.
- B-028 is a DB metadata update; deliverable phase arrays are read at query time.
- B-029 adds a new table; code that reads it is deployed when the Workspace P5
  implementation ships, which is gated on W-IG (after migration is complete).

The natural rollout gate is Vercel deployment: staging deploy → staging smoke
test → production deploy. No feature flag infrastructure required.

### 6.3 Testing migration on staging

**B-027 validation:**

1. `npm run typecheck` — must pass with zero errors.
2. `npm test` — all phase-pack tests must pass.
3. Spot-check: navigate to any demo program on staging, verify phase rail shows
   correct 6 labels (Originate, Charter, Diagnose, Design, Roadmap, Mobilize).
4. Open agent chat on a P3 program; confirm Nexus loads the correct pack label
   (`P3 Design Future State` not `P3 Design`).

**B-028 validation:**

1. Run `SELECT key, applicable_phases FROM deliverable_types WHERE key IN (...)` 
   against staging — verify arrays match the target state in §3.1.
2. Trigger a P4→P5 gate evaluation on a staging program; confirm the gate check
   for `tower_handoff_plan_accepted` still resolves correctly.
3. Run deliverable library view for phase 4 and phase 5 on staging; confirm
   `tower_handoff_plan` appears in both phase views.

**B-029 validation:**

1. `SELECT * FROM engagement_tower_handoffs LIMIT 1` — table exists, columns
   match DDL.
2. Insert a test row with all nullable columns null; confirm constraint and
   trigger work.
3. Confirm `engagements` table is unmodified (no new columns).

---

## 7 · Coverage Confirmation (Self-QA)

This plan addresses every phase-related field called out in the playbook Step 1.3
self-QA checklist:

| Field / file | Addressed in section |
|---|---|
| `governance.ts` — gate rules | §1.1, §1.2 — already correct; no change needed |
| `phase-labels.ts` — phase label constants | §1.2 — already correct; no change needed |
| `phase-packs/` — P0..P5 files | §2.3 — B-027 renames P1_DISCOVERY, P2_SYNTHESIS, P3_DESIGN, P4_BUILD, P5_ACTIVATE |
| `failure-modes.ts` — failure mode catalog | §1.2 — already correct; all primaryPhases in 0..5 |
| `seed-patterns-*` — narrative text | §2.2 — B-027 step 7 updates narrative in `seed-patterns-ai-programs.ts` |
| `program-lifecycle-patterns.ts` | §2.2, §2.3 step 5 — retire P6-Operate stage |
| `programs-types.ts` — ProgramPhaseId union | §2.2, §2.3 step 1 |
| `programs-fixture.ts` — PHASE_LABEL_MAP | §2.2, §2.3 step 2 |
| `mutations.ts` — DELIVERABLE_PHASE_OVERRIDES | §1.3, §2.3 step 6 |
| `deliverable_types.applicable_phases` | §3 — B-028 SQL migration |
| Tower handoff substrate | §4 — B-029 DDL |
| `engagement_drafts` / D-11 substrate gap | §4.4 — `program_origination_drafts` already exists |
| Rollback plan per migration item | §2.6 (B-027), §3.4 (B-028), §4.5 (B-029) |
| Sequencing (B-027 before B-028 before B-029) | §5 |

---

## 8 · Open Questions (for Anand)

These do not block the plan merge but must be resolved before implementation:

| # | Question | Default assumption if not resolved |
|---|---|---|
| Q1 | Should `PhaseNumber` in `phase-packs/types.ts` remain `0|1|2|3|4|5` (unchanged) or should the phase-pack type and `ProgramPhaseId` in `programs-types.ts` be unified into a single type exported from `types.db.ts`? | Keep separate — consolidate post-launch |
| Q2 | For `engagement_tower_handoffs`, should `tower_config_jsonb` be typed with a published JSON schema now, or left as untyped JSONB until the Tower surface is specced? | Untyped JSONB with inline comment for now |
| Q3 | Should `program_origination_drafts` get a `surface` CHECK constraint (`CHECK (surface IN ('programs', 'strategic-moves', 'strategic-moves-new'))`) to prevent surface key drift across teams? | Add CHECK in D-11 implementation PR |
| Q4 (from binding matrix) | Is `engagements.current_phase` ever incremented past 5 after handoff, or is Tower state tracked entirely in `engagement_tower_handoffs`? | Never increment past 5; Tower state in handoff table |

---

## 9 · Document Evolution

| Version | Date | Changes | Author |
|---|---|---|---|
| 1.0 | 2026-05-05 | Initial draft — F-05 deliverable | Claude Code |
