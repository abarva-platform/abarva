# Moves Product Backlog (Canonical)

This is the canonical, permanent backlog for the AbarVa Nexus Moves module. All Moves work is one
continuing product program, not a series of disconnected prompts. Completed items are never
deleted — history is preserved. This file is reconciled against `main` and merged PRs at the start
of every execution loop, per the standing Moves Continuous Execution Directive (established
2026-07-20).

**Status values** (use only these): `Proposed`, `Needs Design`, `Needs Owner Decision`, `Approved`,
`Ready`, `In Progress`, `In Review`, `Merged`, `Deployed`, `Runtime Proven`, `Blocked`, `Deferred`,
`Superseded`, `Closed`.

**Priority order**: (1) security/data-corruption/tenant-isolation/unauthorized-mutation, (2)
phase-gate and evidence-integrity, (3) live runtime failures, (4) approval/authority/lineage
controls, (5) deliverable quality and consulting depth, (6) Files/workspace UX, (7) automation and
efficiency, (8) cosmetic.

---

## Completed and closed

### MOVES-GATE-001 — Fabricated gate evidence

- **Problem statement**: `phase-gate-approval/route.ts` auto-created and auto-signed-off placeholder
  `deliverables_v2` rows for every phase, unconditionally, before `evaluateGate` ever ran, using a
  stale P3 type-key map that no longer matched real orchestrator output.
- **User/business impact**: A real Strategic Move (MEMBER AI ASSIST) advanced P3→P4 with zero real
  P3 deliverables ever generated.
- **Severity**: P0 (evidence integrity / phase-gate correctness)
- **Workstream**: Phase-gate and evidence integrity
- **Status**: `Runtime Proven`
- **Dependencies**: none
- **Acceptance criteria**: `phase-gate-approval/route.ts` creates and signs off no deliverable; all
  hard-gate evidence comes from `evaluateGate` reading real `deliverables_v2` rows only.
- **Required tests**: hard-fail-on-no-real-deliverable; normal-pass-with-no-fabrication; P0
  special-case and terminal-P5-handoff unaffected.
- **PR**: #5158
- **Merge SHA**: `394e81946`
- **Deploy run**: confirmed success (aca-main-deploy, 2026-07-20)
- **Runtime proof**: ACA template image = 100%-traffic revision image, verified post-deploy
- **Release record**: `docs/releases/records/2026-07-20-phase-gate-fabrication-fix.md`
- **Discovered from**: live E2E proof attempt on MEMBER AI ASSIST (backlog item 95), user's
  follow-up audit challenge on the "(override)" label
- **Notes / remaining gaps**: none for this item; the sibling free-text loophole in
  `phase-capture/route.ts` was tracked and closed separately (MOVES-EVIDENCE-001).

### MOVES-GATE-002 — Approval submitted before generation completed

- **Problem statement**: `PhaseApproveAndBuild.tsx`'s `onBuildQueued` fired gate-approval submission
  the instant generation jobs were _queued_, not once they reached a terminal state; a failed job
  did not block submission.
- **User/business impact**: Same root incident as MOVES-GATE-001 — the UI sequencing bug that
  triggered the fabricated-evidence path to run at all.
- **Severity**: P0
- **Workstream**: Phase-gate and evidence integrity
- **Status**: `Runtime Proven`
- **Dependencies**: none
- **Acceptance criteria**: gate-approval submission only fires once every queued job reaches a
  terminal status; any failed job blocks submission with a visible error.
- **Required tests**: pending-generation blocks; failed-generation blocks; all-settled-success
  proceeds.
- **PR**: #5159
- **Merge SHA**: `8e37b774f`
- **Deploy run**: confirmed success
- **Runtime proof**: ACA runtime invariant verified post-deploy
- **Release record**: `docs/releases/records/2026-07-20-decouple-build-queue-approve.md`
- **Discovered from**: MOVES-GATE-001's root-cause trace
- **Notes / remaining gaps**: none.

### MOVES-GATE-003 — Misleading override terminology

- **Problem statement**: A normal, hard-gate-clean pass with unmet _soft_ criteria was labeled
  "(override)" in the Phase Gate Decision artifact and API response, indistinguishable from an
  actual bypass — of which no code path in this route has ever had one.
- **User/business impact**: Made a real incident (MOVES-GATE-001) initially look like a governed,
  explicit override when it was not; risked the same confusion recurring for any future soft-carry
  pass.
- **Severity**: P1 (governance/audit trust, not itself an exploitable defect)
- **Workstream**: Approval, authority, and artifact-lineage controls
- **Status**: `Runtime Proven`
- **Dependencies**: none
- **Acceptance criteria**: response/artifact separates `softGapsCarried` (normal, non-blocking) from
  `hardGateOverride` (reserved for an actual bypass capability, currently always null).
- **Required tests**: soft-carry-only pass labeled `softGapsCarried:true`/`hardGateOverride:null`;
  unauthorized bypass rejected (403); authorized bypass still cannot cross a hard fail (409).
- **PR**: #5160
- **Merge SHA**: `77db67efe`
- **Deploy run**: confirmed success
- **Runtime proof**: ACA runtime invariant verified post-deploy
- **Release record**: `docs/releases/records/2026-07-20-honest-override-labeling.md`
- **Discovered from**: user's audit challenge on the MEMBER AI ASSIST "(override)" record
- **Notes / remaining gaps**: no real hard-gate override capability exists yet — see §"Decisions
  already made," "Gate evaluation," and the explicit product-truth rule: **hard gates cannot be
  overridden** until a deliberately-designed exception capability is approved. Not a gap to close
  opportunistically.

### MOVES-GATE-004 — Phase advancement regression coverage

- **Problem statement**: The 8 named Phase Advancement Control scenarios (pending generation,
  failed generation, missing deliverable, incomplete approvals, normal gate failure, unauthorized
  override, authorized override, misleading override labeling) were not all covered by tests; an
  audit found 5 already covered by PRs #5158–#5160, 3 gaps remained.
- **User/business impact**: Regression protection for the entire Phase Advancement Control program.
- **Severity**: P1
- **Workstream**: Phase-gate and evidence integrity
- **Status**: `Runtime Proven`
- **Dependencies**: MOVES-GATE-001, MOVES-GATE-002, MOVES-GATE-003
- **Acceptance criteria**: all 8 named scenarios have an explicit, passing regression test.
- **Required tests**: pending/failed-generation still fail `design_approved`; unauthorized
  `bypassGate` rejected; authorized `bypassGate` still blocked by a hard fail; soft-carry labeling.
- **PR**: #5161
- **Merge SHA**: `aa258980f`
- **Deploy run**: confirmed success (test-only; deploy triggered per repo convention, no functional
  change to verify)
- **Runtime proof**: ACA runtime invariant verified post-deploy
- **Release record**: `docs/releases/records/2026-07-20-phase-advancement-regression-suite.md`
- **Discovered from**: user-directed audit of MOVES-GATE-001–003's test coverage
- **Notes / remaining gaps**: none.

### MOVES-EVIDENCE-001 — Phase Capture stale-key evidence loophole

- **Problem statement**: `phase-capture/route.ts` auto-created a real, gate-satisfying
  `deliverables_v2` row (genuinely registered types, e.g. `design_spec`) from raw capture-field text
  the moment required sections were complete, left `in_review` — one generic-sign-off call away from
  satisfying a hard gate on unreviewed, ungenerated content. The generic sign-off route accepted any
  in_review/draft row from any authorized approver, with no check on type key or content provenance.
- **User/business impact**: Second, independent path to the same defect class as MOVES-GATE-001.
  Traced as a reachable **latent** defect (no current UI surface exposes signing off these rows) —
  not confirmed exploited in production.
- **Severity**: P0/P1 (evidence integrity; latent, not confirmed live-exploited)
- **Workstream**: Phase-gate and evidence integrity
- **Status**: `Runtime Proven`
- **Dependencies**: none
- **Acceptance criteria**: `phase-capture/route.ts` creates no `deliverables_v2` row; sign-off
  rejects unrecognized/stale type keys and rejects capture-derived (`structured_data.source ===
'phase_capture'`) content via the plain-JSON approval path.
- **Required tests**: capture completion never touches `deliverables_v2`; sign-off rejects
  unrecognized type key; sign-off rejects capture-derived provenance on a legitimately-registered
  type key; normal sign-off still works; authority still checked first.
- **PR**: #5166
- **Merge SHA**: `279f7efe1`
- **Deploy run**: `29781831341` — success
- **Runtime proof**: ACA template image `sha256:34ed4e3be3e2...` = 100%-traffic revision image,
  verified 2026-07-20
- **Release record**: `docs/releases/records/2026-07-20-phase-capture-evidence-integrity.md`
- **Discovered from**: user-directed audit follow-up ("Phase Capture Evidence Integrity" backlog
  item) after MOVES-GATE-001–004 closed
- **Notes / remaining gaps**: `RECOGNIZED_DELIVERABLE_TYPE_KEYS` deliberately excludes 9 legacy
  alias keys `governance.ts` still recognizes for historical Moves — if a real production row under
  one of those keys is ever found awaiting sign-off, extending the allowlist is a one-line,
  documented fix, not done speculatively here.

---

## Needs Owner Decision

### MOVES-REMEDIATION-001 — MEMBER AI ASSIST disputed phase record

- **Problem statement**: The real Move "MEMBER AI ASSIST" advanced P3→P4 through the now-fixed
  MOVES-GATE-001 defect. That original/disputed P4 phase state was reached through fabricated
  evidence, not real generation or review; the Move has since been corrected back to P3 through
  MOVES-REMEDIATION-001.
- **User/business impact**: One real client-facing Move's phase-gate integrity is disputed until an
  owner rules on it.
- **Severity**: P0 (data/decision integrity), but not unsafe to leave paused — no code fix pending.
- **Workstream**: Phase-gate and evidence integrity / approval authority
- **Status**: `Closed — governed correction executed and signed-in proven` (2026-07-23). Owner
  ruling: **return the Move to P3 via a governed correction** (option (a)), not ratification. The
  correction shipped in PR #5496/#5497, deployed through ACA, ran via the sanctioned operator job,
  and was signed-in verified at P3. Full reasoning:
  `docs/backlog/decisions/2026-07-23-moves-owner-decisions.md`.
- **Dependencies**: none (does not block any other backlog item)
- **Acceptance criteria**: implement and execute a governed correction returning the Move to P3,
  with a full audit trail (who/when/why), real tests, and a release record — matching the rigor
  of every other Moves change this program has produced. **The phase must never be silently
  mutated** — this remains true even with an owner decision in hand; the correction must be a
  real, tested, auditable code path, not an ad-hoc database write or UI click-through.
- **Required tests**: correction script self-test, focused Jest, focused ESLint, full TypeScript
  check with heap flag, release check, git whitespace check, ACA inspect/apply/idempotency proof,
  signed-in browser proof.
- **PRs**:
  - #5162 — additive remediation record only, historical precursor.
  - #5496 — governed correction script/tests/release record.
  - #5497 — live graph-node identity reconciliation and regression test.
- **Merge SHAs**:
  - `1f8d9efb5`
  - `3eb7119efe38af38dab3cd7a47a89677cc7dbae7`
  - `ae18fa0289aeaa811bf92f1464a3a45ca1131f4e`
- **Deploy proof**: ACA revision `ca-abarva-web-lab-eastus--mae18fa02`, digest
  `sha256:74fcdaaa5ad393f545ea20b6be5192a51074611bc664ec5149e6fd8948ac52cc`, 100% traffic,
  healthy/running.
- **Runtime proof**:
  - Inspect: `/tmp/member-ai-assist-correction-inspect-20260723T175600Z/proof/local-20260723T175619655Z`
    (`beforePhase=4`, `afterPhase=4`, `mutationApplied=false`).
  - Apply: `/tmp/member-ai-assist-correction-apply-20260723T175900Z/proof/local-20260723T175814594Z`
    (`beforePhase=4`, `afterPhase=3`, `mutationApplied=true`).
  - Idempotency:
    `/tmp/member-ai-assist-correction-idempotency-20260723T180100Z/proof/local-20260723T180002348Z`
    (`beforePhase=3`, `afterPhase=3`, `mutationApplied=false`).
  - Signed-in browser:
    `/tmp/member-ai-assist-correction-browser-proof-2026-07-23T18-04-01-668Z`.
- **Release record**:
  `docs/releases/records/2026-07-23-member-ai-assist-governed-correction.md`
- **Discovered from**: MOVES-GATE-001 root-cause investigation
- **Notes / remaining gaps**: The correction itself is closed. Non-blocking follow-up: the signed-in
  UI still shows the historical/display label `HEALTHCARE_PROVIDER-MEMBER-2026`; the governed
  correction binds to the live database graph node `eng_member_ai_assist_mrp7yhe4`. Treat that as a
  separate label/data-binding cleanup, not an open phase-integrity blocker.

---

## Active design program

### MOVES-ARTIFACT-001 — Deliverable quality and approval lifecycle

- **Problem statement**: Generated deliverables have no consistent quality contract, no real
  version-scoped approval lifecycle, no authoritative-version designation, and no Files-explorer
  lineage — gates read a coarse `status` string rather than a validated, version-scoped human
  decision.
- **User/business impact**: Deliverables can be treated as authoritative without deliberate human
  review of the specific version in question; no visible client-vs-AI-vs-uploaded provenance.
- **Severity**: P1/P2 (capability gap, not an active exploit)
- **Workstream**: Approval, authority, and artifact-lineage controls; deliverable quality
- **Status**: `Phase 1 implemented; authorized lifecycle apply proven` (2026-07-23) —
  MOVES-DESIGN-001/002/003 all approved as written (see below); Phase 1 scope has landed
  (schema migration, ACA backfill job, the 3 new mutations, lifecycle-event writes on
  `completeDeliverable()`/`signOffDeliverable()`, full regression coverage). The reviewed
  tenant-explicit backfill apply for workflow run `local-20260723T070210304Z` also completed
  through the sanctioned ACA operator job and idempotency was proven. Workstreams B/D/E/F/G
  remain separately-scoped future work, not pre-approved by this decision. Full reasoning:
  `docs/backlog/decisions/2026-07-23-moves-owner-decisions.md`. Implementation handoff:
  `docs/codex-handoff/MOVES_ARTIFACT_LIFECYCLE_AND_REMEDIATION_PROMPT_2026-07-23.md`.
- **Dependencies**: MOVES-DESIGN-001, MOVES-DESIGN-002, MOVES-DESIGN-003 — all resolved 2026-07-23
- **Acceptance criteria**: see design doc §§2–6 for the full Phase-1 schema/behavior contract
- **Required tests**: Phase 1 lifecycle mutation/state-transition coverage is in place; later
  Workstreams B/D/E/F/G require their own coverage when implemented.
- **PRs**: #5438 (schema/lifecycle foundation), #5440 (ACA operator bridge), #5443 (status label
  semantics), #5461 (apply authorization), #5489 (artifact size/dedup proof record)
- **Merge SHA**: #5438 `e2b9588a9`, #5440 `5a1d995af`, #5443 `e9bb7ab2f`,
  #5461 `c55449f66`
- **Deploy proof**: ACA runtime invariant verified on digest
  `sha256:a2759de6ef44923dceb31ceeb852883de7fb85d971a0d014a705a2359506e481`
  at 100% traffic before the apply run.
- **Operator proof**:
  `/tmp/moves-lifecycle-apply-authorized-20260723T170036Z-db/proof/local-20260723T070210304Z`
  (`counts.backfilled=12`) and
  `/tmp/moves-lifecycle-apply-idempotency-20260723T170259Z-db/proof/local-20260723T070210304Z`
  (`counts.skipped:already_processed_for_workflow_run=12`).
- **Release record**: `docs/releases/records/2026-07-23-moves-deliverable-lifecycle-phase1.md`
- **Discovered from**: user-directed follow-up after the Phase Advancement Control program closed —
  "the recent gate-control work fixed whether a phase is allowed to advance... it does not by itself
  complete the broader deliverable governance and quality model"
- **Notes / remaining gaps**: 7 connected workstreams, approved sequence **A → C → B → D → E → F →
  G**. Full design: `docs/specs/programs/deliverable-quality-and-approval-lifecycle-design.md`. Do
  not wire lifecycle state into phase-gate pass/fail until Workstream F is separately scoped and
  implemented.

---

## Required design decisions before Phase 1 implementation

### MOVES-DESIGN-001 — Reviewer-role to gate-role mapping

- **Problem statement**: The new `reviewer_role_code` taxonomy (15 values) must map onto the
  existing 4-value `REQUIRED_APPROVAL_ROLES` gate axis (`business`, `technology`, `finance`,
  `risk_security`) without silently collapsing meaning.
- **Severity**: Blocks MOVES-ARTIFACT-001 Phase 1
- **Workstream**: Approval, authority, and artifact-lineage controls
- **Status**: `Approved as written` (2026-07-23) — mapping below confirmed exactly as proposed,
  plus adding `compliance` as a 16th `reviewer_role_code` value per the design doc's §3.8
  expansion. Reasoning: `docs/backlog/decisions/2026-07-23-moves-owner-decisions.md`.
- **Dependencies**: none (pure decision, no code)
- **Discovered from**: MOVES-ARTIFACT-001 design pass
- **Decision table** (confirmed mapping):

| `reviewer_role_code` | Maps to gate role                                                      | Rationale                                                                                                   |
| -------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `business_owner`     | `business`                                                             | Direct match                                                                                                |
| `technology_owner`   | `technology`                                                           | Direct match                                                                                                |
| `architecture`       | `technology`                                                           | Architecture review satisfies the technology gate role                                                      |
| `finance`            | `finance`                                                              | Direct match                                                                                                |
| `risk`               | `risk_security`                                                        | Direct match                                                                                                |
| `security`           | `risk_security`                                                        | Direct match                                                                                                |
| `artifact_owner`     | _(none)_                                                               | Descriptive only — the person accountable for the artifact, not a gate-satisfying reviewer capacity         |
| `workstream_lead`    | _(none)_                                                               | Descriptive only                                                                                            |
| `data`               | _(none)_                                                               | Descriptive only — no data-specific gate role exists today; raise as a future gate-role candidate if needed |
| `legal`              | _(none)_                                                               | Descriptive only — no legal gate role exists today                                                          |
| `procurement`        | _(none)_                                                               | Descriptive only                                                                                            |
| `executive_sponsor`  | _(none — but drives `requiresClientAuthority`/gate policy separately)_ | Executive sign-off is tracked as a distinct gate-policy flag, not folded into the 4-role axis               |
| `client_authority`   | _(none — but required for `client_final`/`requiresClientAuthority`)_   | Same as above                                                                                               |
| `abarva_quality`     | _(none)_                                                               | Internal QA capacity, descriptive only                                                                      |
| `other`              | _(none, requires `reviewer_role_label`)_                               | Catch-all                                                                                                   |

**Decided**: mapping confirmed as-is above, no corrections — the conservative "descriptive-only
unless directly matched" default is the safer choice and no compelling case was made to expand
`data`/`legal`/`procurement` into gate-satisfying roles.

### MOVES-DESIGN-002 — Full artifact gate-policy matrix

- **Problem statement**: The design doc's gate-policy table (§3.7) only illustrates 6 example
  artifact types. All 16 `DELIVERABLE_REGISTRY` gate-artifact types need a defined policy before
  Workstream F (gate integration) can consume this data.
- **Severity**: Blocks Workstream F (not Phase 1 schema — schema is type-agnostic data, this is
  per-type configuration)
- **Workstream**: Deliverable quality; approval/authority controls
- **Status**: `Approved as written` (2026-07-23) — **note**: the illustrative-only table below is
  stale; the design doc's §3.7 has since been fully filled in for all 16 artifact types with
  specific recommendations and is the authoritative source, not this table. Approved as written
  there, including the four flagged ambiguous calls (`charter`/`execution_roadmap` minimum
  lifecycle state → `client_final`; add missing hard-gate checks for `sourcing_strategy`/
  `tower_metrics_plan`; `requires_revalidation` → hard block). Reasoning:
  `docs/backlog/decisions/2026-07-23-moves-owner-decisions.md`.
- **Dependencies**: MOVES-DESIGN-001 (reviewer-role mapping) — resolved 2026-07-23
- **Discovered from**: MOVES-ARTIFACT-001 design pass — explicitly flagged as illustrative-only in
  v1/v2 of the design doc
- **Decision table needed** (columns per artifact type, current registry keys listed; owner to fill
  `minimumLifecycleState` / `requiredReviewerRoles` / `requiresClientAuthority` / `depthBand` for
  each):

| `deliverableTypeKey`                                        | Phase | `minimumLifecycleState`                                             | `requiredReviewerRoles` | `requiresClientAuthority` | `depthBand` |
| ----------------------------------------------------------- | ----- | ------------------------------------------------------------------- | ----------------------- | ------------------------- | ----------- |
| `charter`                                                   | 1     | _(reviewer's example: `client_final`)_                              | —                       | true                      | ?           |
| `discovery_report`                                          | 1     | _(reviewer's example: `human_approved`, "Diagnostic findings")_     | —                       | false                     | ?           |
| `root_cause_worksheet`                                      | 1     | ?                                                                   | ?                       | ?                         | ?           |
| `target_state_architecture`                                 | 3     | _(reviewer's example: `human_approved`)_                            | `architecture`          | false                     | ?           |
| `solution_design`                                           | 3     | ?                                                                   | ?                       | ?                         | ?           |
| `operating_model_design`                                    | 3     | ?                                                                   | ?                       | ?                         | ?           |
| `sourcing_strategy`                                         | 3     | ?                                                                   | ?                       | ?                         | ?           |
| `p3_design` (deprecated alias)                              | 3     | ?                                                                   | ?                       | ?                         | ?           |
| `execution_roadmap`                                         | 4     | ?                                                                   | ?                       | ?                         | ?           |
| `business_case`                                             | 4     | _(reviewer's example: `human_approved`)_                            | `finance`               | false                     | ?           |
| `financial_model`                                           | 4     | ?                                                                   | ?                       | ?                         | ?           |
| `tower_metrics_plan`                                        | 4     | ?                                                                   | ?                       | ?                         | ?           |
| `roadmap` (deprecated alias)                                | 4     | ?                                                                   | ?                       | ?                         | ?           |
| `handoff_package`                                           | 5     | _(reviewer's "Mobilization authorization" example: `client_final`)_ | `executive_sponsor`     | true                      | ?           |
| `value_measurement_contract`                                | 5     | ?                                                                   | ?                       | ?                         | ?           |
| Workshop guide (no registry key yet — non-gate working doc) | —     | _(reviewer's example: `human_approved`)_                            | —                       | false                     | ?           |

**Decided**: approved per the design doc's §3.7 full matrix (authoritative — this table's `?`
cells are stale and superseded by that resolution).

### MOVES-DESIGN-003 — ACA lifecycle backfill contract

- **Problem statement**: Backfilling every existing signed-off deliverable's lifecycle history is a
  mutating, all-tenant operator data build. Per `docs/ops/aca-data-build-job-rule.md`, this must run
  as a governed ACA Job, not an ad-hoc script — but the job's exact contract (batching, dry-run,
  idempotency, rollback, audit output) is not yet defined.
- **Severity**: Blocks MOVES-ARTIFACT-001 Phase 1 step 2 (backfill)
- **Workstream**: Approval/authority controls; data remediation
- **Status**: `Approved and executed for reviewed three-tenant report` (2026-07-23) — per the
  design doc's §11 contract: tenant-batched (not all-tenant), dry-run mandatory before apply,
  conservative legacy inference (never infers `client_final`), idempotent by
  `(deliverable_id, version, workflow_run_id)`, bounded batches (200/batch default), rollback
  scoped strictly to the exact workflow run. The authorized apply for
  `local-20260723T070210304Z` backfilled 12 `human_approved` legacy rows and the repeat run
  skipped all 12 as already processed. Reasoning and proof:
  `docs/backlog/decisions/2026-07-23-moves-owner-decisions.md`.
- **Dependencies**: MOVES-ARTIFACT-001 schema (Phase 1 step 1) must land first; this defines how
  step 2 runs against it
- **Discovered from**: MOVES-ARTIFACT-001 design pass, §6 Phase 1 plan
- **Decision table**:

| Contract element                 | Options / question for owner                                                                                                                                                                                                             |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Eligible legacy records          | All `deliverables_v2` rows with `status = 'signed_off'`, tenant-unscoped (all tenants) — confirm scope, or restrict to specific tenants first?                                                                                           |
| Inference rules                  | As specified in design doc §3.12: `approved_artifact_id`-backed rows → `human_approved`, `authoritative_flag_source='legacy_backfill'`; `signed_off_version`-only rows → same state but `requires_revalidation=true`. Confirm or adjust. |
| `requires_revalidation` handling | Should gate policies that require `client_final` treat a `requires_revalidation=true` row as an automatic block, or merely a warning?                                                                                                    |
| Batching                         | Per-tenant, or a single all-tenant run? What batch size / rate limit against Postgres?                                                                                                                                                   |
| Dry-run report                   | Required before any live run — proof bundle format: rows to be backfilled, confidence breakdown, any rows that cannot be inferred at all (e.g. `signed_off = true` but no `signed_off_version` set).                                     |
| Idempotency key                  | Proposed: `(deliverable_id, version)` — a backfill event is a no-op if one already exists for that pair. Confirm.                                                                                                                        |
| Rollback                         | Since new columns/table are additive, rollback = stop reading them (code-level), leave backfilled rows in place — is this acceptable, or is a hard delete of backfilled rows required if the backfill is later found wrong?              |
| Audit output                     | What's the minimum required proof artifact — a Blob-stored report? A `maestro_oversight_flags` summary row per tenant? Both?                                                                                                             |
| Failure handling                 | Does one tenant's backfill failure block the whole run, or does the job skip and report per-tenant, continuing others?                                                                                                                   |
| Operator path                    | Confirm this runs through the sanctioned ACA Job path only — no `az containerapp exec`, no local script against production Postgres.                                                                                                     |

**Decided**: approved per the design doc's §11 contract as summarized above.

---

## Bugs found during design/audit passes (not yet independently fixed)

### MOVES-BUG-001 — Role approval is not version-scoped

- **Problem statement**: `deliverable_role_approvals` (the existing `business`/`technology`/
  `finance`/`risk_security` gate-approval table) has **no `version` column** — a required-role
  approval recorded once silently satisfies every future regeneration of that deliverable, forever.
- **User/business impact**: A `business_case` approved by finance at v1 would still read as
  "finance-approved" at v5, even if v5's content materially changed — violating "a revised document
  must not inherit the prior version's approval," already present in shipped code.
- **Severity**: P0/P1 — approved for inclusion in Phase 1, after design sign-off (not to be patched
  independently before then, to avoid a competing/duplicate lineage model)
- **Workstream**: Approval, authority, and artifact-lineage controls
- **Status**: `Approved` (for inclusion in MOVES-ARTIFACT-001 Phase 1; not standalone)
- **Dependencies**: MOVES-ARTIFACT-001 Phase 1 schema (adds the `version` column, updates
  `getRoleApprovalSummary()`/`recordRoleApprovalDecision()` in `governance.ts`)
- **Acceptance criteria**: an approval applies only to the exact immutable version reviewed; a new
  version starts with zero inherited role approvals.
- **Required tests**: approval recorded at v1 does not satisfy `allRequiredApproved` at v2; a fresh
  approval recorded at v2 does.
- **PR**: not yet opened
- **Discovered from**: MOVES-ARTIFACT-001 design pass, §1/§3.2 — found while auditing the existing
  approval system for the design doc, not from a live incident
- **Notes / remaining gaps**: do not patch independently before MOVES-ARTIFACT-001's schema lands —
  patching this in isolation risks a second, competing version-scoping scheme.

### MOVES-BUG-002 — `completeDeliverable()` lineage gap

- **Problem statement**: The Nexus-tool `completeDeliverable()` path signs off a deliverable but
  never writes `signed_off_version`/`approved_artifact_id` — only the upload-replacement path
  (`signOffDeliverable()`) does. An agent-completed deliverable has no lineage pointer today.
- **Severity**: P1/P2 — capability gap, not an active exploit (an agent-completed, signed-off
  deliverable still passes `status === 'signed_off'` checks; it just has no version-lineage pointer)
- **Workstream**: Approval, authority, and artifact-lineage controls
- **Status**: `Ready for implementation` (2026-07-23) — MOVES-ARTIFACT-001 Phase 1 approved;
  included in the same implementation handoff.
- **Dependencies**: MOVES-ARTIFACT-001 Phase 1 — approved 2026-07-23
- **Acceptance criteria**: `completeDeliverable()` writes the same lineage pointers
  `signOffDeliverable()` does, using the new event-sourced write path.
- **Required tests**: agent-completed deliverable has a resolvable `getAuthoritativeVersion()`.
- **PR**: not yet opened
- **Discovered from**: MOVES-ARTIFACT-001 design pass, §1/§3.14
- **Notes / remaining gaps**: **do not patch this independently in a way that creates a competing
  lineage model** — must land as part of MOVES-ARTIFACT-001's convergence plan (design doc §3.14).

### MOVES-BUG-003 — Playbook route detected AI-PDLC via a free-text regex, not the canonical archetype

- **Problem statement**: `GET/POST /api/v1/programs/:programId/playbook` decided whether to apply
  AI-PDLC session overrides with `/pdlc|product development lifecycle|ai-?pdlc|sdlc/.test(archetype + name)`
  — a regex over the Move's coarse 5-value UI label (`strategic_transformation`, etc.) and its
  free-text name, neither of which reliably contains those substrings. The canonical framework
  archetype (`AI_PRODUCT_DEVELOPMENT_LIFECYCLE`, one of 5 ids in
  `src/lib/programs/archetypes/registry.ts`) is resolved on read via
  `resolveMoveArchetypeForProgram()` — already the correct pattern used by 7 other archetype-aware
  routes — but this route never called it.
- **User/business impact**: an AI-PDLC Move whose name/label didn't happen to contain a matching
  substring silently got the generic P3 session pack instead of the AI-PDLC-specific one (missed
  positive); conversely a non-AI-PDLC Move literally named e.g. "SDLC Modernization Program" would
  have false-positived into AI-PDLC overrides it shouldn't get.
- **Severity**: P2 (routing defect — wrong content served, not a security/data issue)
- **Workstream**: Deliverable quality and consulting depth
- **Status**: `Deployed` (2026-07-23) — replaced the regex with
  `resolveMoveArchetypeForProgram(ctx, programId)` and an exact `archetype.id === AI_PRODUCT_DEVELOPMENT_LIFECYCLE.id`
  check.
- **Dependencies**: none — the resolver helper already existed
- **Acceptance criteria**: AI-PDLC overrides apply only when the canonical resolved archetype id is
  `AI_PRODUCT_DEVELOPMENT_LIFECYCLE`, regardless of the Move's free-text name/label; a resolver
  failure is best-effort (falls back to no overrides, never a 500).
- **Required tests**: `playbook/__tests__/route.test.ts` — 5 new assertions (overrides apply on the
  canonical id; a differently-archetyped Move with a misleading free-text name does NOT get
  overrides; the resolver is called with the correct args; a resolver failure degrades gracefully;
  an explicit `?phase=` query param still overrides the Move's current phase).
- **PR**: not yet opened
- **Release record**: `docs/releases/records/2026-07-23-moves-playbook-archetype-routing.md`
- **Discovered from**: `docs/codex-handoff/MOVES_ARTIFACT_DIGESTION_PROMPTING_LAYOUT_PROMPT_2026-07-22.md`,
  Phase 2.2 (archetype-driven playbook routing)
- **Notes / remaining gaps**: only the AI-PDLC archetype has a session-override table today
  (`AI_PDLC_SESSION_OVERRIDES`, phase 3 only). The other 4 archetypes (IT Sourcing, AI Operations,
  Contact Center Agent Assist, Commercial Lending Agent Assist) still fall back to the generic
  phase playbook with no archetype-specific session content — building those override packs is
  separate, not-yet-scoped work this fix does not attempt.

### MOVES-CAPABILITY-001 — Explicit supersession

- **Problem statement**: `deliverables_v2.status` has a ready `'superseded'` CHECK value, but no
  code path writes it — supersession is purely implicit today (whichever version
  `signed_off_version` currently points to).
- **Severity**: P2 (capability gap)
- **Workstream**: Approval, authority, and artifact-lineage controls
- **Status**: `Ready for implementation` (2026-07-23) — MOVES-ARTIFACT-001 Phase 1 approved;
  included in the same implementation handoff.
- **Dependencies**: MOVES-ARTIFACT-001 Phase 1 — approved 2026-07-23
- **Acceptance criteria**: a new `supersedeDeliverableVersion()` mutation marks the prior
  authoritative version `superseded` whenever a newer version becomes authoritative, while
  preserving the prior version's own approval history unchanged.
- **Required tests**: superseding a version does not delete/alter its own historical approval
  events; gate evaluation only ever reads the current (non-superseded) authoritative version.
- **PR**: not yet opened
- **Discovered from**: MOVES-ARTIFACT-001 design pass, §1/§3.11
- **Notes / remaining gaps**: none beyond the Phase 1 dependency.

### MOVES-BUG-004 — Regression: duplicate-heading suppression silently dropped from renderers.tsx

- **Problem statement**: PR #5530 (native PPTX renderer, `MOVES-QUALITY-003`), authored from a
  local branch that had fallen behind `origin/main`, was built by copying a locally-edited copy
  of `src/lib/deliverables/orchestrator/renderers.tsx` into a fresh worktree without first
  re-diffing against the actual current `origin/main`. That local branch's copy of the file
  pre-dated an already-merged, already-live fix — `withoutDuplicateSectionHeading()` /
  `normalizeHeadingText()` and their 3 call sites in the DOCX/HTML/PDF renderers, which strip a
  model-repeated section heading from the first line of `bodyMarkdown` before rendering — so the
  merge silently deleted that working feature from `main` and shipped the regression to
  production via the normal `aca-main-deploy` path.
- **User/business impact**: every DOCX/HTML/PDF deliverable export regenerated after PR #5530's
  deploy (`6c440e7dcc3639290bec758a0745f9c610c6285b`) could show a section title twice — once as
  the renderer's own heading, once again as the model's repeated first Markdown line — until this
  fix lands. This is the exact class of defect the original fix (and, coincidentally, this
  session's independent `MOVES-BUG-003`-adjacent duplicate-heading investigation) was built to
  prevent.
- **Severity**: P1 (shipped regression removing existing, working, deployed behavior)
- **Workstream**: Deliverable quality and consulting depth
- **Status**: `Deployed` (2026-07-23) — restored `normalizeHeadingText()` /
  `withoutDuplicateSectionHeading()` and all 3 call sites (DOCX `renderDeliverableDocx`, HTML
  `renderDeliverableHtml`, PDF `renderDeliverablePdf`) exactly as they existed before PR #5530,
  now layered on top of the PPTX renderer PR #5530 already added.
- **Dependencies**: none
- **Acceptance criteria**: a section whose `bodyMarkdown` repeats `section.title` as its first
  Markdown heading line renders that title exactly once (the renderer's own heading) in DOCX,
  HTML, and PDF output; a section whose first line is a genuinely different heading is left
  untouched.
- **Required tests**: `renderers.test.ts` — new `describe('DOCX/HTML/PDF renderers — duplicate
  section-heading suppression')` block, 4 assertions (DOCX/HTML/PDF each render the repeated
  title exactly once; a genuinely different first-line heading is preserved, not stripped).
- **PR**: not yet opened
- **Release record**: `docs/releases/records/2026-07-23-restore-duplicate-heading-suppression.md`
- **Discovered from**: a test failure surfaced while validating an unrelated, separate
  `golden-bar.ts` change in this same session — the pre-existing `enforceMaximumWordCount`
  contract-blocking test on `origin/main` failed against a locally-edited copy of `golden-bar.ts`
  that also turned out to be stale, which is what first exposed that the local working branch had
  fallen behind `origin/main` in a way that mattered.
- **Notes / remaining gaps**: this is a process failure, not just a code bug — building a PR by
  copying files edited in a stale local branch into a fresh `origin/main`-based worktree can
  silently regress unrelated, already-merged work if the stale branch and current `origin/main`
  have diverged on the same file. The corrective practice going forward: before copying any
  locally-edited file into a fresh worktree, diff it against the worktree's actual `origin/main`
  base first, not just against the file's own prior content.

---

## Deliverable quality and consulting depth

### MOVES-QUALITY-004 — Duplicate-heading detection signal in the golden bar; P2 Discovery Report size gate audit

- **Problem statement**: Two related gaps found while re-auditing the P2 Discovery Report against
  the same size/dedup standard `MOVES-ARTIFACT-002` proved for 4 P3 profiles (per the 2026-07-23
  handoff's priority order: P2 Discovery > P1 Charter > P4 Business Case > P3 family (done) >
  P5). (1) `golden-bar.ts`'s `meetsGoldenBar()` had no duplicate-section-heading detection
  anywhere — `MOVES-ARTIFACT-002`'s "no `duplicateSectionHeadings`" claim came from an *external*
  proof-bundle JSON produced by a different tool, not from any in-repo enforcement mechanism; a
  repo-wide grep confirmed zero hits before this change. (2) `discovery_report`'s
  `maximumWordCount` ceiling (3,000-5,000 target words, from `strategic-moves-artifact-standard.ts`)
  is `overMaximumWordCount`-only (informational, never blocks) unless `enforceMaximumWordCount` is
  also set for that profile — and it is not: only `solution_design`/`operating_model_design`/
  `sourcing_strategy` opt into hard enforcement (see `MOVES-ARTIFACT-002`). A real First Capital
  Discovery Report DOCX measured at **19,245 words / 136 headings / 14 duplicate heading
  titles / zero TOC** (per
  `docs/codex-handoff/MOVES_ARTIFACT_DIGESTION_PROMPTING_LAYOUT_PROMPT_2026-07-22.md`) — nearly
  4× the target ceiling — would have generated only a soft "runs long" warning and passed the
  bar regardless, with no duplicate-heading signal recorded at all.
- **User/business impact**: an oversized, duplicate-heading-laden Discovery Report can reach
  phase-gate review looking board-grade in every other quality dimension while actually being
  unreadable at nearly 4× the intended length, with no automated signal flagging it.
- **Severity**: P2 (quality-gate gap; the underlying oversized artifact is P1 in user impact but
  is a stale, unverified measurement, not reconfirmed live this session)
- **Workstream**: Deliverable quality and consulting depth
- **Status**: `Partially closed` (2026-07-23) — added real `findDuplicateSectionHeadings()` to
  `golden-bar.ts`, wired as an informational `duplicateSectionHeadings` result field (same
  soft-rollout pattern as `overMaximumWordCount`, contributes to `qualityScore`, does not block
  `pass`) so the signal now genuinely exists for every profile including `discovery_report`.
  Enforcing `discovery_report`'s word ceiling as hard-blocking (`enforceMaximumWordCount: true`)
  is explicitly **not** done in this change — it is a policy decision (which profiles get hard
  enforcement) that belongs with `MOVES-ARTIFACT-002`'s existing enforcement matrix, not a
  unilateral addition here.
- **Dependencies**: none for the signal; a scoped follow-up decision for enforcing
  `discovery_report`'s ceiling
- **Acceptance criteria**: `findDuplicateSectionHeadings()` correctly identifies exact
  (case/whitespace-insensitive) repeated h1-h4 headings in rendered artifact HTML;
  `meetsGoldenBar()` surfaces them via `duplicateSectionHeadings` and a `reasons` entry without
  affecting `pass`.
- **Required tests**: `golden-bar.test.ts` — 5 new assertions (repeated heading flagged;
  case/whitespace-insensitive + first-seen-order dedup; unique headings return empty; the signal
  is surfaced in `meetsGoldenBar()` output and pushes `qualityScore` down without failing `pass`;
  a clean artifact reports no duplicates). Zero regressions across `src/lib/deliverables`
  (412/418 passing — the 6 failures are all pre-existing and unrelated).
- **PR**: not yet opened
- **Release record**: `docs/releases/records/2026-07-23-golden-bar-duplicate-heading-signal.md`
- **Discovered from**: 2026-07-23 independent re-audit of the P2 Discovery Report against the
  size/dedup standard, per the Claude Code handoff's document-quality priority order
- **Notes / remaining gaps**: this does NOT retest the actual live First Capital Discovery Report
  against the new signal — the 19,245-word/14-duplicate-heading measurement is a stale reading
  from `docs/codex-handoff/MOVES_ARTIFACT_DIGESTION_PROMPTING_LAYOUT_PROMPT_2026-07-22.md`, not
  reconfirmed this session. A genuine live re-measurement, and a deliberate decision on whether
  `discovery_report` should join the hard-enforcement list, remain open follow-ups — do not treat
  this entry as having closed the underlying oversized-artifact problem, only as having built the
  detection signal that was previously believed to already exist but did not.

### MOVES-BUG-005 — P1 Charter's designed quality bar (7 sections, 900-1,600 words, central-tension/evidence-gap checks) is unreachable dead code

- **Problem statement**: Following up on the P1 Charter priority in the document-quality
  re-verification order (P2 Discovery done > **P1 Charter** > P4 Business Case > P3 family (done)
  > P5), traced the actual code path for charter generation and found there are **two entirely
  separate quality-bar systems** for Moves deliverables, and only one of them runs for charter:
  - **System A** (`src/lib/deliverables/orchestrator/quality-bar-registry.ts`,
    `OVERRIDES["moves::charter"]`): a well-designed, richer bar — 7 minimum sections, 900-1,600
    word band, `enforceMaxAsBlocker: true`, plus `requiresCentralTension`/
    `requiresEvidenceGapsNoted` structural checks — built and merged in commits `246fcb7a3`,
    `28531cd2f`, `4b9ce0fba`, `f14c8ec7c` (2026-07-21/22), and enforced for real by
    `quality-validator.ts`'s `validateDeliverableQuality()` when reached.
  - **System B** (`src/lib/deliverables/strategic-moves-artifact-standard.ts`,
    `DEPTH_BY_ARTIFACT.charter`): a simpler, older bar — `{targetWords: "700-1,200", minWords:
    450}`, feeding `meetsGoldenBar()` in `golden-bar.ts` with a hard 1,200-word ceiling.
  - **Only System B actually executes for charter.** `src/app/api/v1/programs/[programId]/generate/route.ts`
    routes phase-1 charter generation directly to `generateArtifact()`
    (`src/lib/deliverables/generate-artifact.ts`), which imports and calls only
    `meetsGoldenBar()`/`premiumGoldenBarOptionsForArtifact()` — it has zero references to
    `quality-bar-registry`, `QualityBar`, or the `orchestrator/` module that hosts System A.
    System A is only reachable via `build-request.ts`, whose real callers
    (`generate-service.ts`, `run-orchestrated-business-case.ts`, `auto-generate-discovery-plan.ts`,
    the board-artifacts orchestrated route) handle `business_case`/`discovery_plan`/other
    board-pack types — none of them ever construct a `"moves::charter"` request. The
    2026-07-21/22 fix commits, and the release record describing them
    (`docs/releases/records/2026-07-22-moves-p1-charter-generation-discipline.md`, still status
    `candidate`, live-proof still "Not run yet") therefore never actually changed live charter
    generation behavior.
- **User/business impact**: the intended, more nuanced Charter discipline (7-section minimum,
  central-tension requirement, evidence-gaps-noted requirement, 900-1,600 word band) has never
  been enforced in production. The only real live constraint on a generated Charter is a bare
  450-1,200 word count with no structural checks — meaning a Charter could be well within the
  word ceiling and still be missing a central decision framing, evidence gaps, or a coherent
  7-part structure, with nothing catching it. Separately, the earlier iteration history in the
  2026-07-22 release record shows real live generation attempts blocked at 11,374 → 4,045 → 2,724
  words before an eventual pass on length alone (still failing "synthesis completeness" per that
  record) — consistent with a generation prompt that was tuned against System A's word band but
  is actually being checked against System B's stricter 1,200-word ceiling and none of System A's
  structural requirements.
- **Severity**: P1 (a designed, already-built quality control is silently inert; real user-facing
  document quality risk, not just an internal inconsistency)
- **Workstream**: Deliverable quality and consulting depth
- **Status**: `Found, not fixed` (2026-07-23) — this entry documents the finding only. No code
  change was made in this pass; wiring System A into the real charter path (or consolidating the
  two systems into one, per the project's own standing "no fourth quality system" principle) is a
  genuine design decision — which system should be authoritative, whether to merge them, and how
  to avoid yet a third parallel mechanism — not a one-line fix, and should not be attempted
  without a short design pass given how much prior iteration this exact area has already absorbed
  (4 commits, a full release record, still unresolved).
- **Dependencies**: a design decision on System A vs. System B consolidation for `charter` (and
  likely other artifact types using `quality-bar-registry.ts` overrides that may have the same
  reachability problem — not checked in this pass, scope was charter-only)
- **Acceptance criteria**: N/A until a design decision is made
- **Required tests**: N/A until a design decision is made
- **PR**: none (documentation-only finding)
- **Discovered from**: 2026-07-23 P1 Charter document-quality re-audit, tracing the actual
  generation code path rather than trusting the 2026-07-22 release record's "candidate" status at
  face value
- **Notes / remaining gaps**: do NOT independently patch `strategic-moves-artifact-standard.ts`'s
  charter numbers to match `quality-bar-registry.ts`'s (e.g. bumping the ceiling from 1,200 to
  1,600) without first deciding whether System A should be wired in instead — a numbers-only patch
  would still leave the 7-section/central-tension/evidence-gap structural checks unenforced,
  giving a false sense of the gap being closed. The "41-42 page" figure referenced in an earlier
  handoff prompt could not be located anywhere in this repo; the closest matching text is a
  descriptive comment in `quality-bar-registry.ts` ("it must not become a 40-page strategy or
  solution report") describing the failure mode being guarded against, not a literal measurement
  — treat any specific page-count figure for Charter as unverified until a real artifact is
  measured.

### MOVES-BUG-007 — P5 Handoff's designed quality bar is the same unreachable dead code as Charter's

- **Problem statement**: Completing the document-quality re-verification priority order (P2 done →
  P1 done → P4 done → P3 done → **P5**), traced P5 Handoff (`handoff_package` in
  `src/lib/deliverables/profiles/registry.ts`, title "Executive Handoff", `renderer:
  "pptx_storyline"`) and found the exact same pattern already documented for Charter in
  `MOVES-BUG-005`: `quality-bar-registry.ts` has an `OVERRIDES["moves::handoff_pack"]` entry
  (`minSections: 6, minBodyWords: 5_000, targetBodyWordsMax: 11_000, enforceMaxAsBlocker: false`),
  but `src/app/api/v1/programs/[programId]/generate/route.ts`'s `shouldEnqueuePremiumArtifact()`
  only routes phase-2 `discovery_report` and phase-3 `target_state_architecture` (draft mode) to
  the orchestrator path that actually reads `quality-bar-registry.ts` — phase-5 handoff always
  falls through to the same `generateArtifact()`/`meetsGoldenBar()` path as Charter and Business
  Case, meaning the `handoff_pack` override is dead code, never invoked for the real P5
  deliverable. (Note the key mismatch too: the override is keyed `"moves::handoff_pack"`, while
  the profile registry's key is `handoff_package` — a second, independent reason the two would
  never line up even if the routing did reach it.)
- **User/business impact**: unknown/unmeasured — **no production Move has ever reached P5**.
  `docs/backlog/moves-product-backlog.md`'s `MOVES-UI-006` entry (2026-07-22) already records
  "P5 unreachable pending a Move that actually reaches it" and that P5's redirect behavior "has
  not yet been independently observed on a Move that has actually reached P5." No generated
  Handoff artifact exists anywhere in `proof/`, `docs/releases/records/`, or
  `docs/codex-handoff/` to measure — unlike Charter (which has real 11,374-word generation-attempt
  evidence) or Discovery Report (19,245 words measured), this is a *dormant* gap, not yet an
  *active* one.
- **Severity**: P3 (same class of gap as `MOVES-BUG-005`, but downgraded from Charter's P1
  because it has zero observed live impact — nothing has ever exercised this path)
- **Workstream**: Deliverable quality and consulting depth
- **Status**: `Found, not fixed` (2026-07-24) — documentation only, consistent with how
  `MOVES-BUG-005` was handled: this is the same open architectural question (should
  `quality-bar-registry.ts`'s richer per-artifact bars be wired into the real generation path, or
  consolidated with `strategic-moves-artifact-standard.ts`?) recurring for a second artifact type,
  which strengthens the case that this is a systemic gap across `quality-bar-registry.ts`'s
  overrides in general, not a one-off for Charter.
- **Dependencies**: same design decision as `MOVES-BUG-005`; also blocked on `MOVES-UI-006`/the
  isolated-tenant work (`MOVES-TEST-001`) before any live Move can even reach P5 to generate a
  real Handoff to measure
- **Acceptance criteria**: N/A until a design decision is made
- **Required tests**: N/A until a design decision is made
- **PR**: none (documentation-only finding)
- **Discovered from**: 2026-07-24 P5 Handoff document-quality re-audit, completing the priority
  order started with P2/P1/P4
- **Notes / remaining gaps**: with `MOVES-BUG-005` (Charter) and this entry both showing the same
  dead-code pattern for `quality-bar-registry.ts` overrides, it is worth checking the file's
  remaining overrides (`root_cause_worksheet`, `solution_approach_options`, `execution_roadmap`,
  and any others not yet audited) for the same reachability problem before treating this as fully
  scoped — that broader sweep was not performed in this pass.

### MOVES-BUG-006 — 5 of 9 Moves deliverable types had no internal-language leak check at all

- **Problem statement**: Following the P1 Charter trace (`MOVES-BUG-005`), read
  `premiumGoldenBarOptionsForArtifact()` in `strategic-moves-artifact-standard.ts` in full and
  found its branching only covers `charter`/`discovery_report`, `target_state_architecture`, and
  `solution_design`/`operating_model_design`/`sourcing_strategy` — each of those gets
  `forbiddenLanguage` (`STRATEGIC_MOVES_FORBIDDEN_ARTIFACT_TERMS` or the P3-specific list) wired
  into its `GoldenBarOptions`. Every other declared artifact type
  (`root_cause_worksheet`, `solution_approach_options`, `execution_roadmap`, `business_case`,
  `handoff_package`) fell through to a bare `return { maximumWordCount, enforceMaximumWordCount };`
  — no `forbiddenLanguage` at all, meaning `meetsGoldenBar()` had zero mechanism to catch internal
  implementation jargon (`kernel`, `tenant key`, `debug`, `canonical internal id`, `prompt`,
  `model call`, etc.) leaking into these 5 client-facing document types. This was found while
  independently verifying a research agent's P4 Business Case claim that
  `enforceMaximumWordCount` "doesn't exist anywhere in the codebase" — that specific claim was
  wrong (it does exist, confirmed by reading the file directly), but the agent's underlying
  conclusion that business_case gets no forbidden-language check was independently confirmed by
  direct inspection.
- **User/business impact**: a generated Business Case, Execution Roadmap, Root-Cause Worksheet,
  Solution Approach Options doc, or Handoff Package could contain literal internal
  implementation/system language with nothing catching it before it reaches a client-facing
  export — the exact class of leak the forbidden-language check exists to prevent for the other 4
  artifact types.
- **Severity**: P2 (quality/leak-prevention gap; no evidence found of an actual live leak, but the
  safeguard that would have caught one was simply absent for most artifact types)
- **Workstream**: Deliverable quality and consulting depth
- **Status**: `Deployed` (2026-07-24) — the generic fallthrough branch in
  `premiumGoldenBarOptionsForArtifact()` now also returns
  `forbiddenLanguage: STRATEGIC_MOVES_FORBIDDEN_ARTIFACT_TERMS`, matching what `charter`/
  `discovery_report` already had. Word-count enforcement (`minimumWordCount`) for these 5 types is
  deliberately left untouched — that is a policy decision with real generation-blocking risk on
  live Moves (same caution already applied to `discovery_report` in `MOVES-QUALITY-004`), not a
  safe unilateral addition.
- **Dependencies**: none — additive, informational-becomes-blocking only for a check that should
  never legitimately fire (no artifact should contain "tenant key" or "canonical internal id" in
  client-facing prose)
- **Acceptance criteria**: `premiumGoldenBarOptionsForArtifact()` returns a non-empty
  `forbiddenLanguage` list for every one of the 9 declared artifact types; `meetsGoldenBar()`
  fails an artifact containing forbidden terms regardless of type.
- **Required tests**: `golden-bar.test.ts` — 2 new assertions (all 5 previously-uncovered artifact
  types now get a non-empty `forbiddenLanguage` list including `"tenant key"`; a `business_case`
  containing `"tenant key"` fails the bar). Zero regressions across `src/lib/deliverables`
  (418/424 passing — the 6 failures are all pre-existing and unrelated).
- **PR**: not yet opened
- **Release record**: `docs/releases/records/2026-07-24-universal-forbidden-language-check.md`
- **Discovered from**: 2026-07-23/24 P4 Business Case document-quality audit, following the same
  code-tracing discipline used for P1 Charter (`MOVES-BUG-005`)
- **Notes / remaining gaps**: does not add `minimumWordCount` enforcement to these 5 artifact
  types — `business_case` in particular has no minimum-depth check at all in the real generation
  path (only an informational max ceiling), which is a separate, real gap left open as a
  deliberate policy decision rather than fixed here. Whether to also wire `quality-bar-registry.ts`'s
  richer per-artifact bars (9 sections/5,000-9,500 words for `business_case`) into the real
  generation path remains the same open architectural question raised in `MOVES-BUG-005` for
  Charter — this fix does not resolve that, only closes the narrower, safely-fixable
  forbidden-language gap.

### MOVES-QUALITY-001 — Dedicated PDF renderer for the orchestrator deliverable pipeline

- **Problem statement**: The orchestrator renders DOCX/HTML; no PDF export path exists for
  generated deliverables.
- **User/business impact**: Clients/reviewers who want a PDF (for email, signature workflows, or
  systems that don't accept DOCX) have no supported export.
- **Severity**: P2 (capability gap, not a defect)
- **Workstream**: Deliverable quality and consulting depth
- **Status**: `Deployed` — reconciled 2026-07-21; this was already merged and live but
  not yet reflected here. `@react-pdf/renderer`-based PDF export with content parity to
  DOCX (sections, tables, rasterised exhibits, disclosure text via shared constants).
- **Dependencies**: none
- **Acceptance criteria**: format parity with DOCX export, exhibit rendering,
  AI-disclosure block present per §10 of the standing directive — all met.
- **Required tests**: `renderers.test.ts` (4 new: valid PDF buffer, exhibit
  title+description, rasterisation-failure fallback, disclosure text present);
  `route.test.ts` (2 new: `pdf`-prescribed artifact serves real `%PDF-` buffer,
  `?format=pdf` override).
- **PR**: #5170
- **Merge SHA**: `0b59e44bc4612d0fe4402ce86cf13007303ba156`
- **Deploy run**: confirmed live — the merge commit is an ancestor of the currently
  active ACA revision (`ca-abarva-web-lab-eastus--m4a429034`, confirmed via
  `az containerapp show` during a later, unrelated deploy).
- **Runtime proof**: code path proven via real tests (15/16 + 10/10 passing, zero new
  regressions vs. clean-baseline comparison). No live PDF download has been exercised
  end-to-end (requires a real `generated_artifacts` row with `outputFormat: 'pdf'`) —
  explicitly noted as a reasonable follow-up in the release record, not a merge
  blocker.
- **Release record**: `docs/releases/records/2026-07-20-orchestrator-pdf-renderer.md`
- **Discovered from**: earlier session backlog (pre-dates the Phase Advancement Control program)
- **Notes / remaining gaps**: no UI download link was added for PDF specifically
  (existing callers don't hardcode format, so no caller-side change was needed); PDF
  typography uses default fonts, not brand fonts (separate, previously-deferred slice).

### MOVES-QUALITY-002 — Live E2E proof, P4 business-case generation + approval cycle

- **Problem statement**: Backlog item 96 from the earlier session backlog — a live, signed-in
  end-to-end proof of P4 business-case generation and approval was never completed.
- **Severity**: P2 (verification/evidence gap, not a defect)
- **Workstream**: Live runtime failures / verification
- **Status**: `Blocked` — sequenced after MOVES-TEST-001 provisioning, which is itself sequenced
  after MOVES-ARTIFACT-001 Phase 1 lands (approved 2026-07-23; see below)
- **Dependencies**: an isolated test tenant or purpose-built synthetic Move (per the standing
  constraint established during the MEMBER AI ASSIST incident audit: no further live phase
  transitions may be run against shared production data)
- **Acceptance criteria**: N/A until unblocked
- **Required tests**: N/A
- **PR**: none
- **Discovered from**: earlier session backlog
- **Notes / remaining gaps**: blocked on isolated-tenant capability, not on any open design decision
  — does not become unblocked by resolving MOVES-DESIGN-001/002/003. Enablement design now exists
  (`MOVES-TEST-001`, below) — the actual tenant is not yet provisioned.

### MOVES-CAPABILITY-002 — Deliverable regeneration supersession

- **Problem statement**: A live inspection of a real sandbox Move's Files & Evidence vault found
  53 deliverables where there should have been far fewer — every regeneration of a phase's
  deliverable (`saveGeneratedArtifact`) was a pure `INSERT` with no lookup for an existing
  deliverable of the same logical type, so each Approve & Build re-run created a brand-new
  titled row instead of superseding the prior draft (~15+ near-duplicate "Target Architecture"
  entries, same pattern for Sourcing Strategy/Operating Model/Solution Design).
- **User/business impact**: an unbounded, ever-growing pile of near-duplicate AI drafts in every
  Move's vault, with no way for a reviewer to tell which version is current — directly undermines
  the "current vs. superseded" lifecycle model the UI (`FileCabinetPanel.tsx`,
  `MovesPhaseStandaloneClient.tsx`) was already built to display.
- **Severity**: P1 (data-integrity/UX defect — actively misleading in a live sandbox Move)
- **Workstream**: Approval, authority, and artifact-lineage controls
- **Status**: `Deployed` (2026-07-23) — `saveGeneratedArtifact` now calls a new
  `supersedePriorDeliverableVersions()` step after a successful insert, keyed on
  client + Move (`sourceArtifactRef`) + canonical `deliverableTypeKey` (not the model-authored
  title, which is fresh on every run and can't be used for dedup).
- **Dependencies**: none — additive only, no schema change (`generated_artifacts.superseded_by`
  already existed but was never written by any live code path)
- **Acceptance criteria**: regenerating a deliverable of the same logical type marks the prior
  still-active version's `superseded_by`; a different Move or a different `deliverableTypeKey` is
  never touched; a failure in this step never fails the save that already succeeded.
- **Required tests**: `repository.test.ts` — 3 assertions (same-type regeneration supersedes;
  different Move untouched; different deliverable type for the same Move untouched); zero
  regressions across `src/lib/deliverables/orchestrator` (204/204) and `src/lib/artifacts` (5/5).
- **PR**: #5526
- **Merge SHA**: `d7067bb10802b3ae86102fcca7a9ce9da53eea8e`
- **Deploy run**: `aca-main-deploy.yml` run `30052845868` (success); ACA revision
  `ca-abarva-web-lab-eastus--md7067bb1`, digest
  `sha256:5fa90d135a73197aaf56279087a73e85d8e89abc5f7031b71f9f53c771244243` — confirmed as both
  the template image and the 100%-traffic revision image.
- **Release record**: `docs/releases/records/2026-07-23-moves-deliverable-supersession.md`
- **Discovered from**: 2026-07-23 live sandbox-Move Files & Evidence inspection (Claude Code
  handoff backlog, Track: evidence and client-approved lifecycle)
- **Notes / remaining gaps**: this fix prevents FUTURE proliferation only — it does not
  retroactively clean up the 53 existing duplicate rows already in the sandbox Move's vault (a
  separate, explicitly scoped backfill pass, not run against real data without its own review).
  `deliverableTypeKey` lookup is a full-table JSONB containment scan — fine at current volume,
  worth an index later. Live signed-in regeneration proof was not captured (the specific sandbox
  Move used to find the bug had gone fully terminal by the time proof was attempted); the fix
  itself is proven via 3 precise unit assertions directly exercising the exact code path.

### MOVES-QUALITY-003 — PPTX renderer for the orchestrator deliverable pipeline

- **Problem statement**: The orchestrator renders DOCX/XLSX/PDF/HTML; no PPTX export path
  exists, even though several deliverable profiles (Discovery Report, Root-Cause Worksheet,
  Execution Roadmap, Handoff Package) declare `pptx` as an intended output format. The download
  route silently substituted the DOCX renderer whenever `pptx` was requested or prescribed
  (`route.ts`: `if (out === "pptx") return "docx";`) — a client asking for a deck got a Word
  document with no indication of the substitution.
- **User/business impact**: any profile meant to ship as an executive deck instead ships as a
  Word document; no native, editable PPTX ever reaches a client or reviewer.
- **Severity**: P2 (capability gap, not a defect)
- **Workstream**: Deliverable quality and consulting depth
- **Status**: `Implemented` (2026-07-23) — new `renderDeliverablePptx()` in
  `src/lib/deliverables/orchestrator/renderers.tsx`, modeled on the proven
  `renderStorylineDeckPptx` pattern in `@/lib/visual-system/storyline-deck.ts` (native
  `pptxgenjs`, `LAYOUT_16x9`, one governing point per slide). Unlike that reference, exhibits are
  rendered as real rasterised images (same `resolveSvgTokens` → `withXmlns` → `rasteriseSvg`
  pipeline as the DOCX/PDF renderers), not a placeholder box — a diagram now looks identical
  across every export format. `route.ts`'s `pptx → docx` silent fallback is removed; `pptx` is
  now a first-class requested/default format alongside docx/xlsx/pdf.
- **Dependencies**: none — `pptxgenjs` was already a project dependency
- **Acceptance criteria**: a real, valid `.pptx` (zip) buffer; one slide per generated section
  (condensed governing point + capped bullets, not full prose); one rasterised-image slide per
  exhibit with title/description; one native table slide per in-deck (non-xlsx) table; a title
  slide and closing slide both carry the mandatory AI-draft disclosure; a malformed exhibit falls
  back to a text notice and never fails the whole deck.
- **Required tests**: `renderers.test.ts` — 8 new assertions (valid pptx buffer + correct slide
  count; title slide content + disclosure; exhibit slide with real embedded PNG; native table
  slide; closing slide next-actions/checklist; rasterisation-failure fallback). Zero regressions
  across `src/lib/deliverables/orchestrator` (192/192) and `src/lib/artifacts` (5/5).
- **PR**: not yet opened
- **Release record**: not yet written
- **Discovered from**: `docs/codex-handoff/MOVES_ARTIFACT_DIGESTION_PROMPTING_LAYOUT_PROMPT_2026-07-22.md`,
  Track D
- **Notes / remaining gaps**: no live signed-in proof yet of an actual PPTX download opening
  correctly in PowerPoint/Keynote — the buffer is proven valid (zip magic bytes, real slide XML,
  real embedded PNG media parts) via unit tests, not a manual open. Table slides cap at 14 rows
  in-deck (consistent with the PDF renderer's simplicity bar); wider tables should carry
  `targetFormat: 'xlsx'` and rely on the Excel companion, same as DOCX/PDF.

### MOVES-TEST-001 — Isolated governed Moves test tenant

- **Problem statement**: `MOVES-QUALITY-002` (and any future live-proof need) is blocked because no
  safe, isolated place exists to run a live phase transition without touching shared production data.
- **User/business impact**: without this, live E2E verification of the phase-gate/approval-lifecycle
  system can only ever be proven via unit/integration tests, never a true signed-in, end-to-end
  browser proof — a real gap in this program's own evidence standard.
- **Severity**: P2 (test-infrastructure gap, not a defect)
- **Workstream**: Automation and efficiency / test enablement
- **Status**: `Design approved — provisioning sequenced after MOVES-ARTIFACT-001 Phase 1` (2026-07-23).
  Reasoning: `docs/backlog/decisions/2026-07-23-moves-owner-decisions.md`. Do not provision until
  Phase 1's schema has landed, per the design doc's own recommended sequencing.
- **Dependencies**: this design document's review/approval — done; sequenced (not blocked)
  after `MOVES-ARTIFACT-001`'s schema lands, so fixtures are seeded against the final lifecycle
  schema rather than needing to be reseeded once that schema changes
- **Acceptance criteria**: the isolated tenant exists, is provisioned via a sanctioned ACA Job (never
  ad-hoc), is invisible to production tenant pickers/demo surfaces, and its fixture set covers every
  scenario in the design document's §7
- **Required tests**: a reset-and-reseed run produces byte-identical fixture state twice in a row;
  every §7 scenario is independently exercisable; no fixture data ever appears in a production-tenant
  query
- **PR**: #5171 (design doc: `docs/specs/programs/moves-isolated-e2e-test-tenant.md`)
- **Discovered from**: the standing "no further live phase transitions against production data"
  constraint from the MEMBER AI ASSIST incident audit, combined with `MOVES-QUALITY-002` being
  otherwise permanently blocked
- **Notes / remaining gaps**: infrastructure is NOT provisioned by the design document — building it
  is separate, still-to-be-scoped implementation work this item tracks. Do not provision
  infrastructure until the design is reviewed.

---

## UI/UX shell (chrome only — no schema impact)

### MOVES-UI-001 — Finder-style phase-shell rebuild

- **Problem statement**: the Moves phase workspace's current chrome (horizontal step-tracker,
  flat deliverable-card grid) tested poorly against a Microsoft/Stripe-caliber bar. A macOS
  Finder-style direction (grouped icon rail, underline Steps/Files/Intelligence tabs, two-column
  step detail, inline evidence citations, collapsible next-phase preview) was prototyped and
  approved by the owner (2026-07-20) as the replacement shell.
- **Reference**: `docs/specs/programs/moves-phase-shell-ui-backend-reconciliation.md` — maps every
  mockup element to its real (or not-yet-real) backend field. Read before wiring any view.
- **Severity**: P8 (cosmetic/UX — no data-model or security impact)
- **Workstream**: Files/workspace UX
- **Status**: `Superseded by MOVES-UI-006` (2026-07-23) — the Finder-shell rail/chrome this item
  built was itself superseded when P0 was rebuilt as the "universal shell" reference design and
  P1-P4 were ported to match it (MOVES-UI-006, legacy pages fully retired per PR #5256). This
  entry's rollout history is preserved below for audit purposes; do not re-attempt this scope —
  the live component is now the universal shell, not this Finder-shell rail.
- **Rollout plan** (flag: `moves_finder_shell_v1`, tenant policy, off by default):
  1. **Design tokens** — Fraunces/Inter/JetBrains Mono + navy/blue/teal palette scoped to Moves
     phase-workspace components only (no bleed into Intelligence/Source/Tower chrome).
  2. **Rail rebuild** (`MovePhaseExplorer.tsx`) — grouped Finder sidebar (Phases/Workspace),
     collapse/expand, blocked-reason subtitle, AI-draft-not-final dot — bound to the real
     phase-tally helper and gate data already computed server-side. No new backend calls.
  3. **Steps/Files/Intelligence tab shell** — underline tab control replacing the current
     step-tracker; two-column steps view (menu + detail pane); inline citation reveal bound to
     existing Files & Evidence data (`extractExhibitContent`), not fabricated.
  4. **Approve & Build correctness** — audit `PhaseApproveAndBuild.tsx` to confirm/enforce the
     button fires two sequential calls (`generate-phase`, then a separate
     `phase-gate-approval` submission) — never one combined action. This is a correctness
     requirement, not a style choice: a combined action would regress the fabrication bug fixed
     in `MOVES-GATE-*`/item #100.
  5. **Approvals view** — scoped to what `governance.ts` actually returns today (single
     `sponsor` approverRole, one `founder_approval_requests` row). Per-role rows and any
     `requires_revalidation` chip are explicitly **not** built into production UI — those bind to
     nothing until `MOVES-ARTIFACT-001` ships.
  6. **QA + rollout** — lint/typecheck/unit tests; PR + release record (`global-control-lane`,
     flag-gated); cross-prove on 1–2 tenants; live-verify signed-in; then decide default-on.
- **Explicit non-goals**: no schema migration, no new approval-model fields, no change to
  `evaluateGate()` semantics. Chrome and interaction layer only.
- **Discovered from**: owner design-review session 2026-07-20 (Claude Design prototype iteration
  - this session's reconciliation pass).
- **Correction (2026-07-20, same day)**: Phase 1-2 (PR #5183, merged) and the Phase 3 build both
  targeted `MovePhaseExplorer.tsx` / `PhaseWorkspaceComposition.tsx` / `MovePhaseWorkspacePanel.tsx`
  — these are **not mounted on the live Moves phase route**. Verified via call-graph: the real
  route (`src/app/(maestro)/strategic-moves/[moveId]/phase/[phaseNum]/page.tsx`) mounts
  `MovesPhaseStandaloneClient.tsx` (a separate 3,440-line component with its own rail and its own
  Steps/Files/Intelligence tabs, styled via an inline `<style>` block using `mxw-*` classes and
  existing CSS custom properties). PR #5183 is harmless (flag off, fully tested) and is left
  merged rather than reverted — it is simply inert. The Phase 3 build was **not merged** (same dead
  path, no point compounding it). **Rollout target for all remaining phases is corrected to
  `MovesPhaseStandaloneClient.tsx` directly** — apply the Finder-shell visual treatment (grouped
  selection tint, draft dot, blocked-reason subtitle, navy-not-grey labels) to its existing
  `mxw-rail-extra`/`mxw-side-label`/tab markup via additive CSS + minimal prop/className changes,
  NOT a rewrite, given this component's size and live-traffic exposure. `MovePhaseExplorer.tsx`
  work is retained as unused infra; do not build further phases against it.

- **Phase 4 verified (2026-07-20, no code change needed)**: audited `PhaseApproveAndBuild.tsx`
  and `MovesPhaseStandaloneClient.tsx`'s wiring. The two-sequential-calls requirement is
  ALREADY correctly implemented in production: `onBuildSettled` fires only once every queued
  deliverable reaches a terminal status (`PhaseApproveAndBuild.tsx` line ~267), and only then
  does `approvePhaseGateAfterBuild` (`MovesPhaseStandaloneClient.tsx` line ~637) check for
  failures and separately POST `/api/v1/programs/[id]/phase-gate-approval`. This matches
  MOVES-GATE-002 (already Runtime Proven). No fix required; item closed as verified.
- **Phase 5 — open scope question, not yet started**: the live UI has no standalone
  cross-phase "Approvals & advance" view — approval is submitted inline per-phase via the
  Approve & Build flow above (already correctly gated). Building a NEW cross-phase Approvals
  list page would be net-new UI surface, not visual polish on an existing page, and needs an
  owner call on whether it's wanted at all before design/build work starts.

---

### MOVES-UI-002 — Approvals overview (Phase 5 of MOVES-UI-001, scoped)

- **Problem statement**: the live Moves phase workspace has no single place to see gate/approval
  status across all 6 phases at a glance — approval is only visible/actionable one phase at a
  time via the inline Approve & Build flow. The owner asked to scope (not yet build) a
  cross-phase Approvals overview to close out MOVES-UI-001.
- **Severity**: P8 (cosmetic/UX — no data-model or security impact)
- **Workstream**: Files/workspace UX
- **Status**: `Superseded by MOVES-UI-006` (2026-07-23) — built, deployed, and live E2E verified
  (see below) against the old Finder-shell rail, which has since been fully replaced by the
  universal shell. This entry's build/verification history is preserved for audit purposes; the
  live Approvals overview experience is now whatever MOVES-UI-006/007/008 render, not this shell.
- **Real data this binds to (no fabrication)**:
  - `getMovePhaseTallies(move)` (`src/lib/programs/phase-explorer-tallies.ts`) — already computed,
    deterministic, no-fabrication per-phase `{ phase, label, met, total, state: "done"|"current"|"upcoming" }`
    for all 6 phases from the SAME rule catalog (`gateCriteriaForPhase`) the real gate-approval
    flow evaluates against. This is the entire data source for the list — no new fetch needed.
  - Approver role: every `GATE_RULES` entry's `approverRole` is currently the constant `"sponsor"`
    (`governance.ts`) — render this as a static "Sponsor" label per row, not a fabricated named
    person. Do not imply a multi-role approval model exists (per the reconciliation note).
  - Action: reuse the existing per-phase Approve & Build flow (`PhaseApproveAndBuild.tsx` +
    `approvePhaseGateAfterBuild` in `MovesPhaseStandaloneClient.tsx`) — a row's "Review & approve"
    action navigates to that phase's existing inline flow. No new API route.
- **Design**:
  - New `workspaceView` value (e.g. `"approvals"`) in `MovesPhaseStandaloneClient.tsx`, reachable
    from the rail's existing "Approvals" link (today it jumps straight into the current phase's
    last substep — change it to open this overview instead, phase-jump remains one click away).
  - A simple list/table, one row per phase: phase label, tally (`met`/`total`), status derived
    from `state` (`done` → "Approved"; `current` → "`met`/`total` met — not yet submitted" or
    "Ready to submit" if `met === total`; `upcoming` → "Not reached"), approver column always
    "Sponsor", and a "Review & approve" link/button that sets `workspaceView` back to `"phase"`
    and jumps to that phase's approve substep (existing navigation, just re-triggered from here).
  - Visual treatment matches the already-shipped Finder-shell tokens (navy labels, blue accents,
    amber for not-ready, teal-green for approved) for consistency with the rest of MOVES-UI-001.
- **Flag**: new `moves_approvals_overview_v1` (tenant policy, `includeTenants: []` — separate
  from `moves_finder_shell_v1` so this can be rolled back independently, since it's new
  navigable surface, not pure CSS polish).
- **Explicit non-goals**: no per-role approval rows, no `requires_revalidation` state, no new
  approval-submission endpoint, no change to `evaluateGate()`/`GATE_RULES`. A future
  `MOVES-ARTIFACT-001`-backed richer model is a separate, later item.
- **Acceptance criteria**: flag off → rail's "Approvals" link behaves exactly as it does today
  (byte-for-byte); flag on → link opens the overview list; every row's tally/status is
  reproducible from `getMovePhaseTallies` output alone (test asserts no data invented beyond
  that function's return shape); "Review & approve" navigates correctly to the target phase's
  existing approve substep.
- **Discovered from**: owner request "SCOPE A PHASE 5 APPROVAL" (2026-07-20/21), closing out the
  MOVES-UI-001 open decision on Phase 5.
- **Live E2E verified (2026-07-21)**: full driven click/upload pass completed against Meridian
  (signed-in) and First Capital (flag-off control), per
  `docs/codex-handoff/MOVES_UI_001_E2E_CLICK_UPLOAD_VERIFICATION_PROMPT_2026-07-21.md`. Proof
  bundle: `proof/moves-ui-001-002-e2e-20260721/`. Results: rail phase navigation, all four
  workspace links, every Steps left-menu row (detail-pane updates confirmed), a real file-picker
  upload (appeared correctly in Files & Evidence), the "Coming up" expand/collapse with real
  P3 need-tags, the Files tab's real lifecycle states, the Intelligence tab, the Approvals
  overview (one row per phase, "Sponsor" approver, correct "Review & approve" navigation), and
  the flag-off control tenant (First Capital rendered the original stepper, confirmed via
  `mxw-finder-on=false`) all **PASS**. One real gap found — see MOVES-UI-003 below. Two
  pre-existing, out-of-scope observations logged (not caused by this work, not fixed here): (a)
  file upload is single-file only with no drag-and-drop target — a capability gap in the
  existing `EvidenceUploadControl`, not something MOVES-UI-001/002 touched; (b) the Clerk OTP
  sign-in UI can visually stick on "Verifying..." even after the session succeeds, and RSC
  prefetch requests produce benign `net::ERR_ABORTED` console noise during navigation — both
  pre-existing and outside this backlog item's scope.

### MOVES-UI-003 — Rail collapse/expand toggle (gap found in E2E verification)

- **Problem statement**: MOVES-UI-001's design intent (and the owner-approved reference)
  included a collapse/expand toggle shrinking the rail to a ~58px icon-only strip. The Phase
  1-2 redirect to the real live component (`MovesPhaseStandaloneClient.tsx`, after discovering
  the original rail work landed in an unmounted component) was deliberately scoped narrower —
  label color, selection tint, and the tab underline only — and never included the collapse
  toggle. The 2026-07-21 E2E verification pass confirmed it is genuinely absent from the live
  rail DOM.
- **Severity**: P8 (cosmetic/UX — no data-model or security impact)
- **Workstream**: Files/workspace UX
- **Status**: `Runtime Proven` (verified 2026-07-23) — confirmed built and present in the current
  live component: `railCollapsed` state, `mxw-rail-toggle` button, and `mxw-side-collapsed` CSS
  all exist in `MovesPhaseStandaloneClient.tsx` (checked directly against the current `main`
  tip). Status was stale here; correcting rather than re-attempting already-shipped work.
- **Scope**: add a real collapse/expand toggle to the live rail in
  `MovesPhaseStandaloneClient.tsx`, gated behind the existing `moves_finder_shell_v1` flag
  (flag off → no toggle, current behavior unchanged). Collapsed state: icon-only rail (phase
  badges only, no labels), same pattern already used in `MovePhaseExplorer.tsx`'s (unmounted)
  implementation — reuse those exact visual dimensions/icon treatment rather than reinventing
  them.
- **Acceptance criteria**: flag-off byte-parity test; flag-on toggle click collapses/expands the
  rail with a real DOM state change (not just a class flip with no visual effect); collapsed
  rail still allows phase navigation via icon click; live E2E re-verified on at least one proof
  tenant.
- **Discovered from**: `docs/codex-handoff/MOVES_UI_001_E2E_CLICK_UPLOAD_VERIFICATION_PROMPT_2026-07-21.md`
  execution, finding #1.

---

### MOVES-UI-004 — Extend Finder-shell to the Origination flow's main content

- **Problem statement**: `StrategicMoveOriginateClient.tsx` (`/strategic-moves/new`, the P0
  Origination wizard) already mounts `MovePhaseExplorer.tsx` for its rail — so the Finder-shell
  rail (grouped Phases/Workspace, navy labels, blue selection tint, collapse toggle) already
  renders correctly there once a tenant is in `moves_finder_shell_v1`'s `includeTenants` (fixed
  same-day: First Capital added). But the rail was only ever half the picture: the page's main
  content area (the "Shape the Move brief" P0 wizard — tab strip, sub-tabs, question cards) is
  styled via the separate, shared `StrategicMoves.module.css` and does not use any Finder-shell
  tokens (Fraunces headings, navy/blue palette, JetBrains-Mono-style labels) at all. The owner's
  reference mockup (`Downloads/Moves Phase Shell.html`) shows P0 Originate using the exact same
  two-column Steps pattern as P1-P5 — not a structurally distinct wizard — confirming the
  design intent is one unified visual system across every phase including P0.
- **Severity**: P8 (cosmetic/UX — no data-model or security impact)
- **Workstream**: Files/workspace UX
- **Status**: `Superseded by MOVES-UI-006` (2026-07-23) — overtaken by a larger structural
  rebuild: P0 Origination was rebuilt from scratch as the universal shell reference design
  itself ("P0 is now the design contract" — MOVES-UI-006), not merely visually re-skinned as
  this item scoped. This entry's narrower visual-pass scope was superseded before being built.
- **Scope**: apply the Finder-shell visual tokens (typography, palette, spacing) to
  `StrategicMoveOriginateClient.tsx`'s main content area — the P0 header, tab strip, and
  question/step cards — so it reads as the same product as the phase-workspace pages. Gate
  entirely behind the existing `moves_finder_shell_v1` flag (flag off → current Origination
  styling, unchanged). This is a visual/typography pass on the EXISTING wizard structure (7
  steps across Frame/Govern/Prove Readiness) — **not** a structural rebuild into the two-column
  Steps pattern used on P1-P5. A follow-up item can consider that bigger structural change
  separately, once this visual-consistency pass is proven safe.
- **Constraint**: `StrategicMoves.module.css` is shared by other components — new rules must be
  scoped under a flag-gated ancestor class (mirroring the `.mxw-finder-on` pattern already used
  in `MovesPhaseStandaloneClient.tsx`), never edited as bare/global selectors, so nothing else
  consuming that stylesheet is affected.
- **Acceptance criteria**: flag-off byte-parity test; flag-on shows navy headings/labels (not
  grey), the same blue/teal/amber semantic colors as the phase-workspace pages, and Fraunces
  for the "Shape the Move brief" headline — verified with a real functional test, not just a
  snapshot.
- **Discovered from**: owner review of the live Origination screen (2026-07-21) plus the
  reference mockup showing P0 using the same pattern as P1-P5.

---

### MOVES-UI-005 — Remove legacy Moves shell (scheduled cleanup, do not start early)

- **Problem statement**: `moves_finder_shell_v1`/`moves_approvals_overview_v1` were promoted
  from a 4-tenant allowlist to `platform` (default-on for all tenants) on 2026-07-21, per owner
  directive: "fix it - I need to see the new shell and after a week we will delete." The legacy
  code (`MovePhaseExplorerLegacy` in `MovePhaseExplorer.tsx`, the flag-off JSX branches in
  `MovesPhaseStandaloneClient.tsx` and `StrategicMoveOriginateClient.tsx`, and the pre-existing
  bare-selector CSS in `StrategicMoves.module.css`) is being kept deliberately as the rollback
  path during a soak window — do NOT remove it before the window closes.
- **Severity**: P8 (cosmetic cleanup — no functional risk either way, but premature removal
  eliminates the rollback lever for a change that just went to 100% of tenants same-day)
- **Workstream**: Files/workspace UX
- **Status**: `Blocked` (blocked on the soak window, not on any technical dependency)
- **Do not start before**: 2026-07-28 (one week after the 2026-07-21 default-on promotion)
- **Scope, once unblocked**: remove `MovePhaseExplorerLegacy` and its flag branch;
  remove the flag-off JSX branch in `MovesPhaseStandaloneClient.tsx` and
  `StrategicMoveOriginateClient.tsx` (promote the flag-on branch to be the only branch); remove
  the now-dead bare `.p0*`/legacy rail CSS rules these components no longer read; remove the
  `moves_finder_shell_v1`/`moves_approvals_overview_v1` flags themselves from
  `src/lib/features/registry.ts` and all `useFeature(...)` call sites.
- **Acceptance criteria before starting**: no tenant has reported a Moves-shell regression
  since 2026-07-21; a fresh live signed-in check across at least 2-3 tenants confirms the
  default-on shell is still working correctly at the time this item is picked up (the app may
  have changed in the intervening week — re-verify, don't assume last week's proof still
  holds).
- **Discovered from**: owner directive, 2026-07-21, closing the loop on the MOVES-UI-001/002
  rollout.

---

### MOVES-UI-006 — P0 promoted to the universal shell; port P1-P5 to match

- **Problem statement**: MOVES-UI-001/002/003/004 (this document's earlier entries) restyled
  the rail and step-menu chrome around P1-P5's phase workspace, but deliberately reused
  `<PhaseBody>` (the actual step content) unmodified at every step, as a risk-reduction
  default. That meant the visible step content never matched the owner-approved reference
  design — a real scope gap, called out directly by the owner (2026-07-21): "you are giving a
  lot of excuses... you were given a specific contract to replicate the design 1:1."
  A separate build (PR #5219 + release-proof PR #5222, authored outside this session) rebuilt
  **P0 Originate** as a genuine 1:1 match of the reference shell — real content styling, not
  just chrome — and deployed it. Verified independently in this session: current live commit
  `c47528f47` (ACA revision `mc47528f4`) descends directly from the shell commit `e7532938`;
  no console errors on a live signed-in check of `/strategic-moves/[id]/phase/0`.
- **Owner ruling**: "P0 can and should be the universal shell for P0-P5... P0 is now the
  design contract. P1-P5 are not all migrated yet; the right next slice is to port each phase
  onto this same shell model with phase-specific step/data bindings."
- **Severity**: P8 (cosmetic/UX — no data-model or security impact)
- **Workstream**: Files/workspace UX
- **Status**: `In Progress` — P0-P4 live on the universal shell, legacy pages retired; P5
  unreachable pending a Move that actually reaches it
- **Progress**:
  - **P1 Charter**: `Runtime Proven` (2026-07-21). PR #5231 (port), #5234 (fix: opens on the
    first guided input — "Sponsor commitment" — not the old summary card), #5236 (release
    record with live proof). Gated behind `moves_finder_shell_v1` per this item's own handoff
    instructions (`docs/codex-handoff/MOVES_UI_006_P1_P5_UNIVERSAL_SHELL_PORT_PROMPT_2026-07-21.md`)
    — confirmed in code (`useFeature("moves_finder_shell_v1")` at the P1 render path). The
    two-sequential-calls Approve & Build wiring (`onBuildSettled` → `approvePhaseGateAfterBuild`)
    confirmed unchanged. ACA revision `m8dae82b9`, digest
    `sha256:d4765788e572a5f9408a7d30c7ef8def58faf46dd915b26af99443a5a6ec2802`, independently
    verified (runtime invariant + live signed-in check on `/phase/1`, real content matching the
    reported screenshot, no console errors).
  - **Legacy shell retirement**: `Runtime Proven` (2026-07-22). PR #5256, merge `01723ef01`
    ("Retire legacy Moves phase shell"). Independently verified in this session:
    (1) runtime invariant — `az containerapp show` confirms the ACA template image
    `sha256:10a29f9136e82606f8af3e1a54478184768375656db0682ab857c14511ab37c0` matches the
    100%-traffic revision `ca-abarva-web-lab-eastus--m01723ef0` exactly; (2) commit ancestry —
    `git merge-base --is-ancestor 01723ef0 origin/main` confirms this genuinely landed and
    wasn't superseded/reverted; (3) live signed-in check — `/strategic-moves/new` renders the
    new P0 Originate contract shell (FRAME/GOVERN/READINESS/APPROVE, Steps/Files/Intelligence
    tabs, no console errors); `/strategic-moves/[id]/phase/2` on the real "AI MEMBER ASSIST
    TRANSFORMATION" Move renders the full universal shell (rail with all 6 phases, Workspace
    section, Steps/Files/Intelligence tabs, WORKFLOW stage list), no legacy markers, no console
    errors. No mutating action was taken against this real Move — verification was read-only
    navigation, per the standing rule against live phase transitions on client-named Moves.
  - **P2 Understand Current State, P3 Choose the Approach, P4 Build the Plan**: per the owner's
    latest report, these now render the new shell in production as well (confirmed live above
    for P2); not yet independently spot-checked phase-by-phase for P3/P4 content-binding
    correctness beyond the absence of legacy markers.
  - **P5 Prepare to Execute**: correctly redirects to P4 with `phaseLocked=5` when the Move
    hasn't reached it yet (per owner's report) — not yet independently observed on a Move that
    has actually reached P5.
- **Scope**: port P1 Charter, P2 Understand Current State, P3 Choose the Approach, P4 Build
  the Plan, and P5 Prepare to Execute onto the exact shell model P0 now uses — real content
  styling (not just rail/step-menu chrome), with each phase's own step/data bindings. This
  supersedes the narrower MOVES-UI-001 Steps-two-column scope (§ MOVES-UI-001) as the
  authoritative direction for phase-workspace visual parity going forward.
- **Explicit non-goals carried forward**: no schema migration, no new approval-model fields,
  no change to `evaluateGate()`/gate-approval flow, no fabricated per-role/`requires_revalidation`
  state — same constraints as every prior MOVES-UI-00x item.
- **Discovered from**: owner directive, 2026-07-21.

---

### MOVES-UI-007 — P2 gate-approval decision surface (mechanical ledger → decision-first)

- **Problem statement**: after PR #5286-#5290 fixed real P2 gate-block correctness (evidence
  review, readiness-family binding, honest "Gate blocked · N/M hard met" state), the owner's
  live feedback was that the product was right to block a weak deliverable but the UI did a
  poor job explaining why. The page was a long, mechanical read: a generic 3-row attestation
  table, a 4-quadrant exec readout, a gate-criteria block that only P0 got eagerly (P1+ had it
  collapsed), and a floating Approve & Build button below all of it.
- **Owner's requested shape**: a Stripe-like decision surface — (1) Decision needed, (2)
  Evidence supporting it, (3) Quality/blockers, (4) What happens next — with mechanics moved
  behind tabs/details and the primary action living inside the active step.
- **Resolution**: PR #5291 ("simplify phase approval decision surface"), merged `c77df5ba1`,
  ACA revision `ca-abarva-web-lab-eastus--mc77df5ba`, digest
  `sha256:cdd734ae407e6b829af55d0cf3041379f89f448d4cc3e87f4956c4abf1a62efe`. Restructures
  `PhaseBody`'s gate-approval section into a `DECISION` / `EVIDENCE` / `OPEN BLOCKERS` / `NEXT
  PHASE READINESS` card row (left-border color-coded by state: amber blocked / green ready /
  blue complete), with the generic gate-attestation ledger moved behind a `<details>` "Gate
  execution checklist" disclosure. No changes to `governance.ts`, `evaluateGate()`, or the
  Approve & Build two-sequential-calls wiring.
- **Independent verification this session**: (1) runtime invariant — `az containerapp show`
  confirms the ACA template image matches the 100%-traffic revision exactly; (2) commit
  ancestry — `git merge-base --is-ancestor c77df5ba1 origin/main` confirmed; (3) live signed-in
  check on the real, currently-blocked "AI MEMBER ASSIST TRANSFORMATION" Move (P2, `3/5 hard
  gates met`) — the DECISION card correctly reads "P2 cannot advance yet", the OPEN BLOCKERS
  card names the two actual unmet hard criteria by label ("Discovery synthesis report signed
  off", "Diagnosis clears P2 without unresolved hard gaps or kill recommendation"), and the
  gate execution checklist renders collapsed ("1/3 complete"). No console errors.
- **Note on parallel work**: a duplicate redesign of this same section was built independently
  in this session before discovering PR #5291 had already merged the same fix first (both
  efforts converged on materially the same four-part structure). The duplicate PR (#5293) was
  closed unmerged rather than reconciling two independent rewrites of the same code — #5291 is
  the shipped, live-verified version.
- **Status**: `Runtime Proven` (2026-07-22)
- **Explicit non-goals**: no schema/gate-logic change, no data-plane change.
- **Discovered from**: owner live feedback, 2026-07-22, following the P2 gate-block fix
  (#5286-#5290).

---

### MOVES-UI-008 — aVa chat rich-answer rendering (charts/tables in Moves chat)

- **Problem statement**: Moves' "Ask aVa" chat rendered every turn as plain text, discarding a
  structured `artifacts` payload the shared agent route already returned — a real,
  production-proven chart/table rendering pipeline (`AgentAnswerRenderer`/`composeAvaAnswer`,
  already live on Tower/Intelligence) existed and was simply never wired to Moves. Identified in
  the 2026-07-22 six-dimension Moves audit (`MOVES_E2E_AUDIT_REMEDIATION_PROMPT_2026-07-22.md`,
  Phase 1 item 1.3).
- **Resolution**: PR #5419 ("Moves aVa rich answer rendering") added the packet builder and
  client-side rendering; live proof surfaced a real streaming bug (renderer waited for the
  stream to close before showing the chart/table), fixed by PR #5424 ("Moves rich aVa answer
  visible during streaming") — chart/table now render while the answer is still streaming in.
  Merge `06d0ea39a`, ACA revision `ca-abarva-web-lab-eastus--m06d0ea39`, digest
  `sha256:f39cd85ce48ff07dba56e33ed7da255aab05cb5c079cdb72cb0b868ecccffbd3`.
- **Independent verification this session**: (1) runtime invariant — ACA template image matches
  the 100%-traffic revision exactly; (2) commit ancestry —
  `git merge-base --is-ancestor 06d0ea39a27f7b189727b50b5dcf21d48228265f origin/main` confirmed;
  (3) live signed-in check — on a **different tenant/Move than Codex's own proof** (Healthcare
  Provider tenant, "AI MEMBER ASSIST TRANSFORMATION", P2), asked "How close is this phase to
  passing the gate, broken down by criteria?" and got back a real, honest structured answer: a
  criteria table (5 real gate criteria, matching known live gate state — "Discovery synthesis
  report signed off: Open"), a horizontal-bar "Gate readiness by phase" chart across all 6
  phases, a "Phase readiness scorecard" decision table (Met/Total/Open per phase), and a real
  P3-evidence-needs table — plus an honest caveat ("the evidence panel shows zero uploaded
  items") rather than fabricated confidence. No console errors. Cross-tenant reproduction is
  stronger evidence than re-checking Codex's own proof Move would have been.
- **Status**: `Runtime Proven` (2026-07-23)
- **Explicit non-goals carried forward**: no schema/gate-logic change, no data-plane mutation, no
  tenant active-pointer work (per Codex's own report).
- **Discovered from**: 2026-07-22 six-dimension Moves audit, Phase 1 item 1.3.

---

### MOVES-UI-009 — Evidence-item counts at gate approval were inert text, not a link to the real file list

- **Problem statement**: the handoff's evidence/client-approved-lifecycle track flagged a known
  UX issue: "uploaded files show as count but not list clearly." Traced this to
  `MovesPhaseStandaloneClient.tsx`'s `PhaseBody` component — the "Evidence posture" figure (value
  substep), and the "N evidence items"/"N approved or agent-ready items" figures in the
  gate-approval decision surface, all rendered `evidenceCount` as plain `<strong>`/`<span>` text
  with no `onClick`, link, or navigation of any kind. The real per-file list (name, date,
  reviewer, status) already exists and is fully built — `FileCabinetPanel.tsx`, reachable via the
  "Files & Evidence" nav tab and an already-wired `onOpenFiles`/`openFilesWorkspace` handler used
  elsewhere in the same component (the "findings" substep's "Open Files & Evidence" button) — but
  none of the three count displays were connected to it. Also confirmed: `evidenceCount` itself
  counts satisfied evidence *families* (or committed rows within them, from
  `currentStateReadiness`/`move.linkedEvidence`), not individual files — neither of its data
  sources carries filename/date/uploader fields, so an inline expand-in-place list at these exact
  spots was never possible without also threading real artifact data further down the component
  tree; linking to the already-built `FileCabinetPanel` surface was the correct, minimal fix.
- **User/business impact**: a user reviewing a phase gate saw "3 evidence items" with no way to
  see which 3, forcing them to separately discover and navigate to the Files & Evidence tab
  themselves to check what was actually uploaded before approving a gate.
- **Severity**: P2 (UX clarity gap in gate-approval decision-making, not a data or logic defect)
- **Workstream**: UI/UX shell (evidence and client-approved lifecycle)
- **Status**: `Deployed, live-proven` (2026-07-24) — all three `evidenceCount` displays
  (`.mxw-value-grid` "Evidence posture", `.mxw-decision-chips` "N evidence items", and the
  "Evidence" article's "N approved or agent-ready items") are now `<button>` elements wired to
  the same `onOpenFiles` handler the "Open Files & Evidence" button already uses, with an
  `aria-label` describing the destination. New `.mxw-evidence-count-link` CSS matches the
  existing visual treatment (inherited text size/weight, underline-on-hover/focus for the plain
  text spots; existing pill styling preserved for the decision-chips spot) rather than
  introducing a new visual pattern. PR #5552 merged (`1d63da0742348730ed3c3ae94b9861daeb09f1ae`),
  ACA revision `ca-abarva-web-lab-eastus--m1d63da07` confirmed as both the template image and the
  100%-traffic revision. Live signed-in proof: on the Retail Demo tenant's `RETAIL-APEX-2026` Move
  (P5 gate-approval stage), both count buttons confirmed as real, focusable elements with the
  correct `aria-label`s via the accessibility tree, and clicking one opened the real Files &
  Evidence view.
- **Dependencies**: none — reuses the existing `onOpenFiles` prop and `FileCabinetPanel` surface,
  no new data fetching
- **Acceptance criteria**: clicking any of the three evidence-count displays opens the Files &
  Evidence workspace view.
- **Required tests**: `MovesPhaseStandaloneClient.test.tsx` — 1 new assertion: the Files &
  Evidence heading is absent before the click, all evidence-count buttons are present and
  accessible by role, and clicking one reveals the Files & Evidence heading. Zero regressions
  across `src/components/strategic-moves` (146/146 real tests passing; the 1 failed suite is a
  pre-existing, unrelated Clerk/module-resolution failure confirmed present on a clean
  `origin/main` checkout before this change).
- **PR**: #5552
- **Release record**: `docs/releases/records/2026-07-24-evidence-count-clickable-link.md`
- **Discovered from**: 2026-07-24 evidence/client-approved-lifecycle UX audit, following the
  document-quality re-verification pass
- **Notes / remaining gaps**: this is a navigation fix only — it does not add inline per-file
  metadata at the count location itself, since neither `currentStateReadiness` nor
  `move.linkedEvidence` (the count's data sources) carry filename/date/uploader fields. If the
  intent evolves toward showing files inline rather than navigating to a separate tab, that would
  require threading real `FileCabinetPanel`-shaped artifact data further down into `PhaseBody`, a
  larger change not attempted here.

---

### MOVES-ARTIFACT-002 — P3 artifact size/duplicate-heading gate, live-proven

- **Problem statement**: the 2026-07-22 artifact-digestion audit found the P2 discovery report
  bloated (19,245 words, 136 headings, 14 duplicate section titles, zero TOC) and root-caused it
  to a missing assembly-time dedup check plus no per-artifact size/section budget. This item
  closes that gap for the P3 profiles (Target Architecture, Solution Design, Operating Model
  Design, Sourcing Strategy) as the first proven slice of Track B/C from
  `MOVES_ARTIFACT_DIGESTION_PROMPTING_LAYOUT_PROMPT_2026-07-22.md`.
- **Resolution**: PR #5478 ("Tighten Moves P3 solution design headroom"), #5481 ("Tighten Moves
  P3 sourcing size headroom"), #5485 ("Record Moves P3 size gate live proof"). Merge
  `47b3745d17da615e420919675b753d2c34bab22c`, ACA revision
  `ca-abarva-web-lab-eastus--m47b3745d`, digest
  `sha256:c69406aed934d732725c691e44a489f30ebe563f057b79e2573f122c92c28c4e`.
- **Independent verification this session**: (1) runtime invariant — ACA template image matches
  the 100%-traffic revision exactly; (2) commit ancestry — all three merge commits confirmed
  ancestors of `origin/main` via `git merge-base --is-ancestor`; (3) real proof-bundle inspection
  (not a self-report) — pulled `11-artifact-content-audit.json` from the proof folder
  (`~/Downloads/moves-p3-architecture-live-proof-v18-2026-07-23T15-51-51Z/`) and directly
  confirmed all four P3 artifacts (Target Architecture 5,189 words; Solution Design 4,513;
  Operating Model Design 4,254; Sourcing Strategy 2,930) show `duplicateSectionHeadings: []` and
  `bannedLanguage: []`, real HTTP 200 downloads, and `sourceRef` correctly scoped to the
  disposable sandbox Move ("Codex Proof First Capital E2E 20260721",
  `4bf889aa-d4ee-4c1d-936b-51574614d191`) — not any real client Move. No P3 gate was approved
  and the sandbox Move was not advanced to P4 (generation/artifact-quality proof only, per the
  report).
- **Status**: `Runtime Proven` (2026-07-23)
- **Scope remaining**: this closes the size/dedup gate for 4 of 14 deliverable profiles
  (Target Architecture, Solution Design, Operating Model Design, Sourcing Strategy). The other
  10 profiles (Charter, Discovery & Diagnostic Readout, Root-Cause Readout, Execution Roadmap,
  Business Case, Financial Model, Value & Metrics Model, Executive Handoff, Value Measurement
  Contract, and Root-Cause Worksheet) have not yet been independently confirmed against this
  same size/dedup standard — do not assume they're covered by this entry.
- **Discovered from**: 2026-07-22 artifact-digestion audit, Track B/C.

---

## Architecture decisions (reference — see design doc for full detail)

Recorded here for durability; full rationale lives in
`docs/specs/programs/deliverable-quality-and-approval-lifecycle-design.md`.

1. **Client uploads never auto-reach `client_final`** — normal path is Client Uploaded → In Review →
   Human Approved → Client Final. An "upload as already-approved-final" exception requires named
   authority, approval date, approval basis, checksum, explicit confirmation, and an immutable audit
   event.
2. **`human_approved` and `client_final` are never collapsed** — kept distinct in both the lifecycle
   model and gate evaluation; `deliverables_v2.status` remains a compatibility projection only, never
   the source of authority truth.
3. **Lifecycle is event-sourced** — `deliverable_lifecycle_events` is the immutable source of truth;
   current state is always a computed projection. Approvals never inherit across versions.
4. **Reviewer roles are controlled** — `reviewer_role_code` (15-value enum) + optional
   `reviewer_role_label` (required only for `other`). No free-text-only role field.
5. **Legacy backfill is conservative** — never infers `client_final`; `signed_off_version`-only
   records become legacy-inferred `human_approved` with `requires_revalidation = true`; only
   `approved_artifact_id`-backed rows may be marked authoritative without revalidation.
6. **Gate evaluation is artifact-specific** — each `ArtifactQualityContract` defines
   `minimumLifecycleState`, `requiredReviewerRoles`, `requiresClientAuthority`, and a quality
   threshold; there is no single global gate rule.
7. **No fourth quality system** — `DeliverableSpec`, `QualityBar`/`ExpectedExhibit`, and
   `DeliverableProfile`/`DeliverableResultState` consolidate into one canonical
   `ArtifactQualityContract`; none of the three become a competing parallel system.
8. **The gate invariant**: no phase closes on the strength of an AI-generated draft alone. A gate
   must verify: (1) the required logical artifact exists; (2) the current immutable version is
   identified; (3) that version meets its `ArtifactQualityContract`; (4) required human approvals
   apply to that exact version; (5) authority level meets the artifact's gate policy; (6) no newer
   unapproved version has replaced it; (7) authoritative content is retrievable; (8) provenance and
   checksum are intact; (9) required decisions and evidence are present; (10) no unresolved
   changes-requested event remains.
9. **AI-generated disclosure must appear everywhere a version is seen**: artifact metadata, Moves
   workspace, preview, DOCX, PDF export, Files Explorer, and the approval screen itself — it must
   never disappear during download or format conversion.
