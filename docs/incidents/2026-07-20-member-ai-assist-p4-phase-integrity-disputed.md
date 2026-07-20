# MEMBER AI ASSIST — P4 Phase Integrity Remediation Record

This is an additive, documentation-only remediation record. It does not change the Move's phase,
gate state, or any production data. No live phase transition was run against this Move to produce
or verify this record, per the standing constraint established during this incident's audit.

## Disposition

```
Current phase: P4
Phase integrity: disputed
Reason: advanced during incomplete P3 generation proof
Required remediation:
- review override/gate trace
- determine authoritative phase
- obtain named owner approval
- either return to P3 through a governed correction
  or ratify P4 with documented conditions
```

## Incident summary

On 2026-07-20, the Strategic Move "MEMBER AI ASSIST" advanced from Phase 3 (Design Future State) to
Phase 4 (Execution Roadmap) with zero real P3 deliverables ever generated. The transition was
recorded via `POST /api/v1/programs/:id/phase-gate-approval` and produced an Artifact Vault record
titled "Phase Gate Decision — P3 → P4 (override)".

## Answers to the 6 audit questions (established during root-cause investigation)

1. **Which endpoint was called** — `POST /api/v1/programs/:id/phase-gate-approval`
   (`src/app/api/v1/programs/[programId]/phase-gate-approval/route.ts`), the signed-in Moves
   workspace's phase-gate approval path. Not `POST /api/v1/programs/:id/advance` and not the Nexus
   chat `advance_phase` tool.
2. **Whether the request explicitly contained an override flag or reason** — No. The route's only
   accepted body fields were `{ phase, rationale }`. No override, bypass, or force flag exists in
   this route's request schema, then or now.
3. **Which user/action initiated it** — The signed-in Moves workspace's "Approve & Build" flow
   (`PhaseApproveAndBuild.tsx` → `MovesPhaseStandaloneClient.tsx`'s `approvePhaseGateAfterBuild`),
   which — at the time of the incident — called the gate-approval endpoint immediately once
   generation jobs were *queued*, not once they had actually completed. This sequencing bug is
   fixed in PR #5159 (`onBuildSettled` now waits for every job to reach a terminal status).
4. **Whether `evaluateGate()` returned pass, fail, or was bypassed** — It returned a genuine
   `pass`. It was never bypassed; there is no bypass mechanism in this route. The pass was real,
   but the evidence it evaluated was fabricated: the route's `preparePhaseGateApprovalRecords`
   helper (deleted in PR #5158) auto-created and auto-signed-off a placeholder `deliverables_v2`
   row for every phase, unconditionally, using a stale P3 type-key map (`design_spec`,
   `requirements_traceability`) that no longer matches any key the real orchestrator produces
   (`target_state_architecture`, `solution_design`, `operating_model_design`, `sourcing_strategy`).
   `evaluateGate`'s hard checks found this fabricated, self-signed evidence and correctly passed
   against it.
5. **Why the UI allowed advancement while generation jobs were still pending** — Because of the
   sequencing bug in item 3: the UI requested gate approval before generation had run to
   completion, and the route's fabrication bug (item 4) meant the request succeeded regardless of
   whether real generation had produced anything.
6. **Whether the "override" label is a true bypass status or merely a misleading record label** —
   Merely a misleading label. It reflected `carriedGaps.length > 0` (unmet *soft*, non-blocking
   criteria) — a normal, hard-gate-clean pass — not an actual bypass. This is fixed in PR #5160:
   the field is now `softGapsCarried` (never rendered as "override"), with a separate
   `hardGateOverride` field reserved for a genuine authorized bypass, which no code path in this
   route can produce.

## Root-cause fixes already shipped (code, not data)

- PR #5158 — removed the deliverable-fabrication helper entirely; `evaluateGate` is now the sole,
  authoritative check against real `deliverables_v2` rows.
- PR #5159 — decoupled "Approve & Build" queueing from gate-approval submission; gate approval is
  now requested only after every deliverable in the batch reaches a terminal status, and a failed
  deliverable now visibly blocks the request instead of being silently ignored.
- PR #5160 — split the misleading `override` field into honestly-named `softGapsCarried` /
  `hardGateOverride`, so a normal soft-carry pass is never labeled as a bypass.
- PR #5161 — regression tests for all 8 named Phase Advancement Control scenarios.

None of these fixes altered the MEMBER AI ASSIST Move's own phase or gate-decision records — they
change the code path going forward, not this Move's history. That history is exactly why this
record exists: the Move's current P4 phase state was reached through a since-fixed defect, and its
integrity is disputed until a named owner reviews and rules on it.

## Required remediation (owner action, not yet performed)

This record is deliberately additive-only. The following actions require a named human owner and
have **not** been performed as part of this record:

1. **Review override/gate trace** — Pull the Move's `phase_gate_decision` artifact(s) and
   `module_state_log`/audit-log entries for the P3→P4 transition and confirm the account above
   against the actual persisted records for this specific Move.
2. **Determine authoritative phase** — Decide whether P4 should stand or whether the Move's true
   state is still P3 given the absence of real P3 deliverables.
3. **Obtain named owner approval** — A named accountable owner (sponsor, program lead, or founder)
   must sign off on whichever disposition is chosen below.
4. **Either**:
   - **Return to P3 through a governed correction** — not a silent phase-field edit. This should go
     through a deliberate, audited correction path (e.g., a dedicated remediation route or ACA Job
     per `docs/ops/aca-data-build-job-rule.md`, never an ad-hoc `az containerapp exec` or direct SQL
     write), with its own rationale, actor, and timestamp recorded.
   - **Or ratify P4 with documented conditions** — if the owner determines the Move's actual P3
     work was substantively done (even though the specific `deliverables_v2` rows were never
     generated) and P4 should stand, that decision must be recorded with explicit conditions (e.g.,
     required backfill of the missing P3 artifacts before P4 deliverables are treated as final).

Whichever path is chosen, it should raise a `maestro_oversight_flags` row against this Move
(`raiseMaestroFlag` in `src/lib/programs/governance.ts`, `flagType: 'policy_violation'`,
`severity: 'critical'`) through the live, signed-in application path — not an ad-hoc script against
production data — so the flag is visible in the Move's own oversight surface and carries a real
tenant-scoped actor identity. That live action is intentionally out of scope for this repo-level,
additive documentation record.
