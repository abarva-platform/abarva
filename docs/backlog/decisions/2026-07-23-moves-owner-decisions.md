# Owner decisions — Moves backlog blockers, 2026-07-23

## Authority

Anand Sundaram explicitly delegated approval authority for the four blocked Moves backlog
items below: "you should approve on my behalf and remove the blockers and continue." This
record documents each decision and its reasoning so the delegation is auditable, not silent.

## MOVES-DESIGN-001 — Reviewer-role to gate-role mapping

**Decision: Approved as written**, per `deliverable-quality-and-approval-lifecycle-design.md`
§3.8 — the 15-value `reviewer_role_code` taxonomy mapping to the 4-value gate-role axis
(`business_owner→business`, `technology_owner→technology`, `architecture→technology`,
`finance→finance`, `risk→risk_security`, `security→risk_security`; all other roles map to none
and remain descriptive-only), plus adding `compliance` as a 16th enum value.

**Reasoning**: the design is conservative by construction — unmapped roles never satisfy a gate
by themselves, which is the safe default. No open ambiguity was flagged in the source document
that would justify amendment.

## MOVES-DESIGN-002 — Full artifact gate-policy matrix

**Decision: Approved as written**, per §3.7's fully-filled 16-artifact-type matrix, including
its four flagged ambiguous calls:
- `charter` and `execution_roadmap` minimum lifecycle state: **`client_final`** (the stricter
  option), not `human_approved`. Reasoning: the design doc itself states the looser alternative
  "risks the same 'advanced without real evidence' failure class this whole program exists to
  prevent, just moved one phase later" — this program was built specifically in response to
  that failure class (MOVES-GATE-001/002), so the stricter reading is the only one consistent
  with why this work exists.
- `sourcing_strategy` and `tower_metrics_plan` missing hard-gate checks: **add them**, per the
  doc's own recommendation, in Workstream F — not deferred indefinitely.
- `requires_revalidation` enforcement: **hard block**, not a warning, for any gate-critical
  artifact — consistent with the stricter reading above.

## MOVES-DESIGN-003 — ACA lifecycle backfill contract

**Decision: Approved as written**, per §11 — tenant-batched rollout (not all-tenant-at-once),
mandatory dry-run before apply, conservative legacy inference (never infers `client_final`,
only ever `human_approved`; unresolvable `approved_artifact_id` always demotes to
`requires_revalidation = true`), advisory-locked and idempotent by
`(deliverable_id, version, workflow_run_id)`, bounded batches (200/batch default), rollback
strictly scoped to the exact workflow run's own rows.

**Reasoning**: every choice in this contract is the safety-first option consistent with this
repo's own ACA data-build job rule and the standing "no ad-hoc mutation" discipline already
established across this program.

## MOVES-ARTIFACT-001 — Deliverable quality and approval lifecycle, Phase 1

**Decision: Approved for Phase 1 implementation only**, scoped exactly as §6 defines it:
additive schema migration (`deliverable_lifecycle_events` table; additive columns on
`deliverables_v2`, `deliverable_versions`; the `version`-scoping fix to
`deliverable_role_approvals`, which is the one non-additive change — a unique-constraint
widening, not a data-loss risk), the governed ACA backfill job per MOVES-DESIGN-003, the three
new mutations (`uploadApprovedFinalReplacement`, `supersedeDeliverableVersion`,
`getAuthoritativeVersion`), the `completeDeliverable()`/`signOffDeliverable()` lifecycle-event
writes, and full regression coverage of every state transition.

**Explicitly NOT approved by this decision**: Workstreams B/D/E/F/G (disclosure rendering,
governance workspace UI, Files Explorer lineage UI, actual gate integration wiring, PDF/DOCX
rendering changes) remain separate, future work requiring their own scoping — this decision
does not pre-approve them.

**Reasoning**: Phase 1 is schema-and-data-integrity work with no UI/behavior surface change
until a later, separately-scoped phase wires it into live gates — this is exactly the same
low-risk-first sequencing this entire program has used throughout (Phase 0 → 1 → 2 → 3
patterns in every other Moves handoff this session). The dependent design decisions
(DESIGN-001/002/003) are approved above, so nothing here is proceeding on an unresolved
question.

## MOVES-TEST-001 — Isolated governed Moves test tenant

**Decision: Design approved. Provisioning sequenced AFTER MOVES-ARTIFACT-001 Phase 1 lands**,
per the design document's own recommended (not required) sequencing — so fixtures are seeded
against the final lifecycle schema rather than needing to be reseeded once that schema changes.

**Reasoning**: since MOVES-ARTIFACT-001 Phase 1 is being approved in the same decision round,
there's no reason to accept the rework risk of building the test tenant first. This unblocks
`MOVES-QUALITY-002` once both land, in the correct order.

## MOVES-REMEDIATION-001 — MEMBER AI ASSIST disputed phase record

**Live state verified this session** (2026-07-23, read-only, signed-in): the Move "MEMBER AI
ASSIST" (`HEALTHCARE_PROVIDER-MEMBER-2026`, Move ID `cd51e4fe-b5c4-4024-bc46-73afaff4e4b7`) is
genuinely at **P4 Build the Plan, 80%**, with P2 (5/5) and P3 (2/2) both showing complete. The
dispute is live and unresolved — it was not already moot, as an earlier incomplete
investigation had guessed.

**Decision: Return the Move to P3 via a governed correction** (option (a) of the two governed
paths the backlog itself lists), not ratification.

**Reasoning**: the original P3→P4 advancement is disputed specifically because it happened
through fabricated evidence (the MOVES-GATE-001 defect, since fixed). Ratifying P4 now — even
with a named-owner approval and documented conditions — would mean accepting a phase transition
whose evidentiary basis is unknown-to-tainted, on a $2M-projected business case, purely because
reverting is more work. Every other ambiguous call resolved in this decision round has taken
the stricter, trust-preserving reading; this is the same principle applied to an actual
disputed Move rather than a hypothetical policy question.

**Execution constraint at decision time**: this decision did not authorize an ad-hoc database write
or UI click-through. It authorized a real, governed, tested mutation path with its own audit trail,
tests, release record, and signed-in proof.

**Execution closure (2026-07-23)**: that governed correction is now complete. PR #5496 implemented
the correction script/tests/release record; PR #5497 corrected the identity guardrail to the live
database graph node `eng_member_ai_assist_mrp7yhe4`. ACA operator proof shows inspect
`beforePhase=4/afterPhase=4`, apply `beforePhase=4/afterPhase=3`, and idempotency
`beforePhase=3/afterPhase=3`. Signed-in browser proof confirms `MEMBER AI ASSIST` opens on P3
`Choose the Approach`.

## What this unblocks

- `MOVES-ARTIFACT-001` Phase 1 schema/backfill/mutation work can now be implemented.
- `MOVES-BUG-002` (full fix) and `MOVES-CAPABILITY-001` (explicit supersession), both previously
  blocked on MOVES-ARTIFACT-001, can now be implemented as part of the same Phase 1 work.
- `MOVES-TEST-001` provisioning can proceed once Phase 1 lands.
- `MOVES-QUALITY-002` (live E2E proof) can proceed once the test tenant exists.
- `MOVES-REMEDIATION-001`'s governed correction has been implemented and executed; remaining work
  shifts back to isolated P0-P5 proof and the open artifact-quality profile sweep.

See `docs/codex-handoff/MOVES_ARTIFACT_LIFECYCLE_AND_REMEDIATION_PROMPT_2026-07-23.md` for the
grounded implementation handoff covering all of the above.

## Addendum (same day) — Backfill dry-run reviewed, apply authorized

PR #5438 (schema), #5440 (ACA operator-job bridge), #5443 (dry-run label fix) verified
independently: all three confirmed as ancestors of the current `origin/main` tip via
`git merge-base --is-ancestor`; ACA runtime invariant holds (template image matches the
100%-traffic revision). The reported revision name (`m46793612`) had already been superseded by
an unrelated later deploy (`mae5c2501`, PR #5460) by the time this was checked — normal given
this repo's deploy cadence; ancestry confirms the lifecycle work is genuinely live regardless.

**Dry-run status report reviewed** (workflow run `local-20260723T070210304Z`, tenants
`meridian-health`/`skyharbor-air`/`first-capital`, 12 candidates): matches the approved
MOVES-DESIGN-003 contract exactly — 2 `high`-confidence rows resolve a real `approved_artifact_id`
(`requires_revalidation=false`), 10 `inferred` rows are `signed_off_version`-only
(`requires_revalidation=true`); every row targets `human_approved`, never `client_final`; all
carry `authoritative_flag_source=legacy_backfill`. No fabrication, no over-claiming, correctly
conservative.

**Decision: apply authorized** for this exact reviewed report (workflow run
`local-20260723T070210304Z`, migration hash
`ff49c850a9bfe18ac837e7dfab19256d8cfe51f22cb01f86dbd0bdf014dabfcb`) against these three tenants
only. Proceed through the sanctioned ACA operator job's apply mode, capture the same
proof-bundle discipline as the dry-run, and confirm post-apply that `deliverables_v2.status`
reads identically to pre-apply for every existing caller (per the design doc's own compatibility
plan, §5) before considering this closed.

## Addendum (same day) — Authorized lifecycle apply executed and idempotency proven

The authorized apply was executed through the sanctioned ACA operator job using the live
digest-pinned web image
`acrabarvalab001.azurecr.io/abarva/web@sha256:a2759de6ef44923dceb31ceeb852883de7fb85d971a0d014a705a2359506e481`.
The first attempt failed mechanically because the operator job did not receive a database URL; it
made no data change and the job template was restored to idle. The corrected run supplied
`DATABASE_URL` from the approved operator secret and succeeded.

**Apply proof**: `/tmp/moves-lifecycle-apply-authorized-20260723T170036Z-db/proof/local-20260723T070210304Z`.
The proof bundle reports `status=PASS`, `mode=apply`, the approved workflow run
`local-20260723T070210304Z`, the reviewed report id `local-20260723T070210304Z`, the approved
migration hash `ff49c850a9bfe18ac837e7dfab19256d8cfe51f22cb01f86dbd0bdf014dabfcb`, and
`counts.backfilled=12`.

CSV proof confirms the applied rows remained conservative: 12 rows total; `skyharbor-air=7`,
`first-capital=5`, `meridian-health=0`; confidence `high=2`, `inferred=10`;
`requires_revalidation=false` only for the 2 high-confidence rows and `true` for the 10 inferred
rows; every row is `proposed_lifecycle_current_state=human_approved`; every row has
`authoritative_designation=true:legacy_backfill`. No row inferred `client_final`.

**Idempotency proof**:
`/tmp/moves-lifecycle-apply-idempotency-20260723T170259Z-db/proof/local-20260723T070210304Z`.
The same approved workflow id was rerun through the operator job and reported
`counts.skipped:already_processed_for_workflow_run=12`, proving the apply does not silently
duplicate lifecycle rows.

Compatibility note: both the apply and idempotency proof runs discovered the same 12 legacy rows
through the script's legacy `deliverables_v2.status = 'signed_off'` candidate query, so existing
status-based readers remain compatible with the Phase 1 lifecycle backfill. This does not mean
phase gates consume the lifecycle model yet; gate integration remains separate future work.
