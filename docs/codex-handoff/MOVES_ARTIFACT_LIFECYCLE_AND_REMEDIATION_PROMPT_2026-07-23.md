# Codex handoff — Deliverable lifecycle Phase 1 implementation + MEMBER AI ASSIST remediation

**Date**: 2026-07-23
**Requested by**: Anand Sundaram (via delegated approval — see
`docs/backlog/decisions/2026-07-23-moves-owner-decisions.md` for full reasoning on every
decision referenced below)
**Context**: `MOVES-ARTIFACT-001` (deliverable quality and approval lifecycle) and its three
gating design decisions (`MOVES-DESIGN-001/002/003`) are now approved — Phase 1 only, exactly as
scoped in `docs/specs/programs/deliverable-quality-and-approval-lifecycle-design.md` §6. This
handoff also covers a separately-decided, unrelated item: the governed correction for the
MEMBER AI ASSIST disputed phase record (`MOVES-REMEDIATION-001`). These are two independent
pieces of work bundled in one document for sequencing convenience — **do not let the schema
work block on the remediation work or vice versa; they touch different tables and different
Moves.**

## Read first (mandatory)

1. `docs/specs/programs/deliverable-quality-and-approval-lifecycle-design.md` — the full design,
   in particular §3 (all sub-sections), §4 (schema), §6 (phased plan, quoted below), §9 (the gate
   invariant), §11 (backfill contract). This is the authoritative source — do not re-derive
   anything from scratch that's already specified here.
2. `docs/backlog/decisions/2026-07-23-moves-owner-decisions.md` — what was approved and why,
   including the two ambiguous calls resolved (charter/execution_roadmap minimum lifecycle
   state, requires_revalidation enforcement strength).
3. `docs/backlog/moves-product-backlog.md` — `MOVES-ARTIFACT-001`, `MOVES-BUG-001`,
   `MOVES-BUG-002`, `MOVES-CAPABILITY-001`, `MOVES-REMEDIATION-001` (all recently updated with
   the approval decisions — read the current entries, not a cached memory of older versions).
4. For the remediation task only: `docs/incidents/2026-07-20-member-ai-assist-p4-phase-integrity-disputed.md`
   and `docs/incidents/2026-07-20-member-ai-assist-decision-dossier.md`.
5. `docs/ops/aca-data-build-job-rule.md` — mandatory for the backfill job (Task A.2 below).

## Hard constraints — read twice

- **This is Phase 1 only.** Workstreams B, D, E, F, G (disclosure rendering, governance
  workspace UI, Files Explorer lineage UI, actual gate integration wiring, PDF/DOCX rendering
  changes) are explicitly NOT approved by this handoff — do not implement them. Phase 1 is
  schema, backfill, and the specific code changes listed in §6 of the design doc, nothing more.
- **No changes to `evaluateGate()`'s actual pass/fail semantics.** The new columns/table are
  additive data; wiring them into live gate evaluation is Workstream F, separate future work.
- **Schema changes are additive except one.** The `deliverable_role_approvals` unique-constraint
  widening (`UNIQUE(deliverable_id, role)` → `UNIQUE(deliverable_id, role, version)`) is the one
  non-additive change in this migration — follow the design doc's own backfill-before-constraint
  ordering precisely (§4, §11) so no existing row violates the new constraint mid-migration.
- **The backfill (Task A.2) is schema-adjacent data remediation, not a "context/corpus" governed
  dataset** under `AGENTS.md`'s governance policy (that policy covers tenant facts/evidence/
  corpus objects, not internal application lifecycle bookkeeping) — no dataset manifest is
  required for it. It IS a mutating, all-tenant operator data build, so it MUST run as a
  sanctioned ACA Job per `docs/ops/aca-data-build-job-rule.md`, never an ad-hoc script or
  `az containerapp exec` session.
- **MEMBER AI ASSIST correction (Task B) is a real, live-data-mutating action against a specific
  named Move.** This is explicitly exempted from the standing "no live mutating action against
  any Move other than the confirmed sandbox" rule ONLY because it has genuine, documented owner
  authorization for exactly this correction (see the decision record) — this exemption does not
  extend to any other action on this Move, and does not apply to any other real Move at all.
  **The phase must never be silently mutated** — the correction must be implemented as a real,
  tested, auditable code path (a script or job with a clear audit trail: who authorized it, when,
  why, what changed), not a UI click-through or a bare SQL `UPDATE`.
- **Check for collisions before starting either task** — `git log --oneline -20 origin/main` and
  grep for related recent commits, per this session's standing practice.
- **Every merged PR needs**: real tests, a release record, and for Task A specifically, the
  backfill's proof bundle (rows affected, confidence breakdown, unresolvable rows) reviewed
  before considering the backfill "complete," not just "run."

---

## Task A — MOVES-ARTIFACT-001 Phase 1: schema + backfill + code

Implement exactly the plan in the design doc's §6 "Phase 1" list. Restated here with real file
anchors, but the design doc is authoritative for any detail not repeated below:

### A.1 Additive schema migration

New migration file under `supabase/migrations/` (follow the existing naming convention,
`YYYYMMDDHHMMSS_description.sql` — e.g. `supabase/migrations/20260723HHMMSS_deliverable_lifecycle_events.sql`,
check the latest existing migration timestamp before picking yours to avoid collision):
- `deliverables_v2`: add `authoritative_lifecycle_state`, `authoritative_flag_source`,
  `requires_revalidation` (exact CHECK constraints and defaults per design doc §4).
- `deliverable_versions`: add `origin` (CHECK constraint, `NOT NULL DEFAULT 'ai_generated'`).
- `deliverable_role_approvals`: add `version INT` (backfilled before being made `NOT NULL`, per
  §4's own ordering note); replace `UNIQUE(deliverable_id, role)` with
  `UNIQUE(deliverable_id, role, version)`.
- New table `deliverable_lifecycle_events` — full column list, CHECK constraints, and both
  indexes exactly as specified in design doc §4's SQL block.

### A.2 ACA backfill job (per design doc §11, MOVES-DESIGN-003)

Build the governed ACA Job — tenant-batched, dry-run mandatory before apply, inference rules
exactly per §3.12/§11.2 (never infers `client_final`; `approved_artifact_id`-backed rows →
`human_approved`; `signed_off_version`-only rows → same state but `requires_revalidation=true`),
idempotent by `(deliverable_id, version, workflow_run_id)`, bounded batches (200/batch default
per the approved contract), per-candidate output report row per §11.5. Produce and review the
dry-run proof bundle before running the live backfill on any tenant.

### A.3 Required code changes (§5, §6 step 3-4)

- `src/lib/programs/deliverable-role-approvals.ts`: `getRoleApprovalSummary()` and
  `recordRoleApprovalDecision()` — both must filter/write by the deliverable's current version
  now that the table's cardinality has changed. This is the one **required, non-deferrable**
  code change per §5 — every existing caller must keep working, not just the new ones.
- New mutations (place alongside `signOffDeliverable()` in `src/lib/programs/mutations.ts`,
  matching its existing style): `uploadApprovedFinalReplacement()` (§3.4 — requires named
  uploader, named approving authority, approval date, approval basis, explicit confirmation
  flag), `supersedeDeliverableVersion()` (§3.11 — marks the prior authoritative version
  `superseded` when a newer version becomes authoritative, without altering the prior version's
  own approval history), `getAuthoritativeVersion()` (§3.6 — validated live resolution, not a
  trusted stale pointer read).
- `completeDeliverable()` (`src/lib/agent/tools/program/completeDeliverable.ts`) and
  `signOffDeliverable()` (`src/lib/programs/mutations.ts:618`) — both updated to also write
  `deliverable_lifecycle_events` rows per §3.14's convergence plan, so every existing write path
  lands in the new event log. This closes `MOVES-BUG-002` (the confirmed missing lineage write
  in `completeDeliverable()`) as part of the same change, per the backlog's own instruction not
  to patch it independently.

### A.4 Regression suite (§3.10, §6 step 5)

Full state-transition coverage: every valid transition in the §3.10 table, every explicitly-listed
invalid transition asserted as rejected, revocation (§3.9), supersession (§3.11), and all three
legacy-backfill scenarios (`approved_artifact_id`-backed, `signed_off_version`-only, no prior
signed-off history at all). This closes `MOVES-BUG-001` (version-scoping) and
`MOVES-CAPABILITY-001` (explicit supersession) as part of the same change, per their own backlog
entries' instruction not to patch them independently.

**Acceptance criteria**: migration applies cleanly against a copy of the real schema; backfill
dry-run report reviewed and shows expected confidence distribution before any live run;
`getRoleApprovalSummary()`/`recordRoleApprovalDecision()` continue to pass every existing test
unmodified in behavior (only cardinality-handling changes); the three new mutations have real
tests exercising their actual specified behavior, not shape-only assertions; the full
state-transition regression suite passes. Report exactly which of Workstream A's existing
`VisualArtifactContract`/quality-gate code (unrelated, don't touch) remains untouched — this
task must not accidentally widen scope into Workstream F.

---

## Task B — MEMBER AI ASSIST governed phase correction (MOVES-REMEDIATION-001)

**Owner decision** (see `docs/backlog/decisions/2026-07-23-moves-owner-decisions.md`): return
the Move to P3 via a governed correction — not ratification.

**Confirmed live state** (2026-07-23, signed-in, read-only): Move "MEMBER AI ASSIST"
(`HEALTHCARE_PROVIDER-MEMBER-2026`, Move ID `cd51e4fe-b5c4-4024-bc46-73afaff4e4b7`) is genuinely
at **P4 Build the Plan, 80%**, with P2 (5/5) and P3 (2/2) showing complete. Re-verify this is
still the current state before doing anything — if it has changed since 2026-07-23, stop and
report rather than assuming this description is still accurate.

### Task

1. Read the full incident trace: `docs/incidents/2026-07-20-member-ai-assist-p4-phase-integrity-disputed.md`
   and `docs/incidents/2026-07-20-member-ai-assist-decision-dossier.md` — understand exactly
   which gate criteria were satisfied through the fabricated-evidence exploit (the now-fixed
   MOVES-GATE-001 defect) versus which, if any, have since been genuinely re-validated.
2. Design a real, governed correction — not an ad-hoc `UPDATE strategic_moves SET current_phase
   = 3`. This should be a script or one-off governed mutation with: an explicit audit record
   (who authorized this — Anand Sundaram, 2026-07-23, delegated decision — why, and a link back
   to the incident docs and the decision record), a real test verifying the correction only
   touches this one Move's row(s) and does not affect any other Move, and a clear statement of
   what happens to P4 content/deliverables that were generated while the Move was incorrectly at
   P4 (per the design doc's lifecycle model from Task A, if it's landed by the time this runs,
   consider marking any P4-generated deliverables `superseded`/flagged rather than deleting them —
   preserve the audit trail, don't erase evidence of what happened).
3. Execute the correction against the real Move, then verify live (signed-in) that the Move now
   shows P3, and that its P3 state reflects genuine, real gate satisfaction (not just a phase
   number rollback with stale/fabricated P3 data still attached).
4. Update `docs/incidents/2026-07-20-member-ai-assist-p4-phase-integrity-disputed.md` and the
   backlog's `MOVES-REMEDIATION-001` entry with the correction's outcome — PR number, what
   exactly changed, and the live-verification result.

**Acceptance criteria**: the Move is confirmed, live, at P3; a real audit trail exists for the
correction (not a silent mutation); no other Move's data was touched; the incident record and
backlog entry are updated to close this item.

---

## Report format

For Task A: PR number(s), exact schema diff, backfill dry-run report summary (rows affected,
confidence breakdown), backfill live-run result once dry-run is reviewed and approved, test
results for the full regression suite, release record. For Task B: PR number, the correction
script/mechanism used, the audit-trail record, live-verification screenshot/observation
confirming the Move is at P3, and the updated incident/backlog records. Flag explicitly anything
left incomplete rather than rounding up to "done" — this is schema and incident-remediation work,
the bar for "done" is higher than for a UI change.
