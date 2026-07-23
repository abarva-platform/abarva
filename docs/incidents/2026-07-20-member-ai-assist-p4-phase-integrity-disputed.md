# MEMBER AI ASSIST — P4 Phase Integrity Remediation Record

This began as an additive, documentation-only remediation record. On 2026-07-23, after explicit
owner authorization, the governed correction path described below was implemented, deployed, run
through the ACA operator job, and signed-in verified. The Move was returned from P4 to P3 through an
audited correction; no P4 content was deleted.

## Disposition

```
Current phase: P3
Phase integrity: corrected through governed remediation
Reason: advanced during incomplete P3 generation proof
Required remediation:
- review override/gate trace — complete
- determine authoritative phase — owner chose P3
- obtain owner approval — complete
- return to P3 through a governed correction — complete
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

Those code fixes did not alter the MEMBER AI ASSIST Move's own phase or gate-decision records. The
separate owner-authorized correction below did.

## Governed correction executed (2026-07-23)

Owner ruling: return the Move to P3, not ratify P4. The correction was implemented as a dedicated
operator script, not as an ad-hoc SQL edit or UI click-through.

Execution chain:

- PR #5496 added `scripts/programs/correct-member-ai-assist-phase.ts`, its focused tests, npm
  operator scripts, and the release record.
- The first ACA inspect run failed safely before any mutation because the script's original guardrail
  used the historical/display identifier `HEALTHCARE_PROVIDER-MEMBER-2026`; the live database row's
  `engagements.graph_node_id` was `eng_member_ai_assist_mrp7yhe4`.
- PR #5497 corrected the guardrail to the live database graph node and added a regression test
  proving the stale display id is rejected.
- Runtime invariant before operator execution: revision `ca-abarva-web-lab-eastus--mae18fa02`,
  image
  `acrabarvalab001.azurecr.io/abarva/web@sha256:74fcdaaa5ad393f545ea20b6be5192a51074611bc664ec5149e6fd8948ac52cc`,
  100% traffic, healthy/running.
- Corrected inspect: `status=PASS`, `beforePhase=4`, `afterPhase=4`,
  `planStatus=would_correct`, `mutationApplied=false`.
- Apply: `status=PASS`, `beforePhase=4`, `afterPhase=3`,
  `planStatus=would_correct`, `mutationApplied=true`.
- Idempotency: `status=PASS`, `beforePhase=3`, `afterPhase=3`,
  `planStatus=already_at_target`, `mutationApplied=false`.
- Signed-in browser proof with the Meridian automation agent confirmed
  `https://app.abarva.ai/strategic-moves/cd51e4fe-b5c4-4024-bc46-73afaff4e4b7/phase/3`
  returns HTTP 200, does not redirect to sign-in, and renders `MEMBER AI ASSIST` at P3
  `Choose the Approach`.

Proof bundles:

- Corrected inspect:
  `/tmp/member-ai-assist-correction-inspect-20260723T175600Z/proof/local-20260723T175619655Z`
- Apply:
  `/tmp/member-ai-assist-correction-apply-20260723T175900Z/proof/local-20260723T175814594Z`
- Idempotency:
  `/tmp/member-ai-assist-correction-idempotency-20260723T180100Z/proof/local-20260723T180002348Z`
- Signed-in browser proof:
  `/tmp/member-ai-assist-correction-browser-proof-2026-07-23T18-04-01-668Z`

## Remediation status

The required remediation is now complete. The following original requirements are retained for
traceability with their closure status:

1. **Review override/gate trace** — Pull the Move's `phase_gate_decision` artifact(s) and
   `module_state_log`/audit-log entries for the P3→P4 transition and confirm the account above
   against the actual persisted records for this specific Move. **Closed by the inspected/apply
   proof chain above.**
2. **Determine authoritative phase** — Decide whether P4 should stand or whether the Move's true
   state is still P3 given the absence of real P3 deliverables. **Closed: owner chose P3.**
3. **Obtain named owner approval** — A named accountable owner (sponsor, program lead, or founder)
   must sign off on whichever disposition is chosen below. **Closed by Anand Sundaram delegated
   owner decision, 2026-07-23.**
4. **Return to P3 through a governed correction** — not a silent phase-field edit. **Closed by PR
   #5496/#5497 and the ACA operator proof chain above.**

Remaining non-blocking follow-up: the signed-in UI still displays the historical/display label
`HEALTHCARE_PROVIDER-MEMBER-2026` in the header. The correction guardrail intentionally binds to
the live database graph node `eng_member_ai_assist_mrp7yhe4`; cleaning up the display label is a
separate data-binding/backlog item.
