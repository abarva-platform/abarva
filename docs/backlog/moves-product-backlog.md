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
  MOVES-GATE-001 defect. Its current P4 phase state was reached through fabricated evidence, not
  real generation or review.
- **User/business impact**: One real client-facing Move's phase-gate integrity is disputed until an
  owner rules on it.
- **Severity**: P0 (data/decision integrity), but not unsafe to leave paused — no code fix pending.
- **Workstream**: Phase-gate and evidence integrity / approval authority
- **Status**: `Needs Owner Decision`
- **Dependencies**: none (does not block any other backlog item)
- **Acceptance criteria**: an owner reviews the override/gate trace and either (a) returns the Move
  to P3 through a governed correction, or (b) ratifies P4 with a named-owner approval and documented
  conditions. **The phase must never be silently mutated.**
- **Required tests**: N/A (this is an operational decision + a governed correction/ratification
  action, not a code change)
- **PR**: #5162 (additive remediation record only — does not resolve the dispute, documents it)
- **Merge SHA**: `1f8d9efb5`
- **Deploy run**: confirmed success (docs-only)
- **Runtime proof**: N/A (no runtime behavior to prove — additive record only)
- **Release record**: N/A (docs/incidents record, not a release-relevant change)
- **Discovered from**: MOVES-GATE-001 root-cause investigation
- **Notes / remaining gaps**: **Do not alter the phase without explicit owner authorization.** Full
  incident record and required remediation steps: `docs/incidents/2026-07-20-member-ai-assist-p4-phase-integrity-disputed.md`.
  **New finding, unresolved**: an attempt to prepare the full owner-decision dossier hit a live,
  signed-in read of the Strategic Moves list showing this Move currently at **P3** (60% complete),
  not P4 — see `docs/incidents/2026-07-20-member-ai-assist-decision-dossier.md`. Deeper verification
  (the Move's detail page, real `deliverables_v2`/approval state) could not be completed because the
  browser session for this tenant expired mid-investigation with no re-authentication path available
  in this environment (OTP-only sign-in, no email inbox access, no in-app tenant switcher). **The
  owner should confirm the Move's actual current phase from their own signed-in session before this
  dossier's remaining questions (artifacts present, approvals present/missing, gate pass/fail,
  recommended option) can be answered accurately.**

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
- **Status**: `Needs Owner Decision`
- **Dependencies**: MOVES-DESIGN-001, MOVES-DESIGN-002, MOVES-DESIGN-003 must resolve before Phase 1
  schema implementation begins
- **Acceptance criteria**: see design doc §§2–6 for the full Phase-1 schema/behavior contract
- **Required tests**: full state-transition table (valid + explicitly-invalid transitions),
  revocation, supersession, 3 legacy-backfill scenarios — specified in design doc §6, not yet written
- **PR**: #5168 (**draft, design-only — do not merge until approved**)
- **Merge SHA**: n/a (not merged)
- **Deploy run**: n/a
- **Runtime proof**: n/a
- **Release record**: n/a (design doc is not release-relevant; will need one at Phase-1 implementation)
- **Discovered from**: user-directed follow-up after the Phase Advancement Control program closed —
  "the recent gate-control work fixed whether a phase is allowed to advance... it does not by itself
  complete the broader deliverable governance and quality model"
- **Notes / remaining gaps**: 7 connected workstreams, approved sequence **A → C → B → D → E → F →
  G**. Full design: `docs/specs/programs/deliverable-quality-and-approval-lifecycle-design.md`. Do
  not begin schema implementation until MOVES-DESIGN-001/002/003 resolve.

---

## Required design decisions before Phase 1 implementation

### MOVES-DESIGN-001 — Reviewer-role to gate-role mapping

- **Problem statement**: The new `reviewer_role_code` taxonomy (15 values) must map onto the
  existing 4-value `REQUIRED_APPROVAL_ROLES` gate axis (`business`, `technology`, `finance`,
  `risk_security`) without silently collapsing meaning.
- **Severity**: Blocks MOVES-ARTIFACT-001 Phase 1
- **Workstream**: Approval, authority, and artifact-lineage controls
- **Status**: `Needs Owner Decision`
- **Dependencies**: none (pure decision, no code)
- **Discovered from**: MOVES-ARTIFACT-001 design pass
- **Decision table** (proposed mapping, awaiting confirmation or correction):

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

**Owner decision needed**: confirm this mapping, or specify corrections (e.g., should `data` map to
`technology`? should `legal`/`procurement` map to `risk_security`?).

### MOVES-DESIGN-002 — Full artifact gate-policy matrix

- **Problem statement**: The design doc's gate-policy table (§3.7) only illustrates 6 example
  artifact types. All 16 `DELIVERABLE_REGISTRY` gate-artifact types need a defined policy before
  Workstream F (gate integration) can consume this data.
- **Severity**: Blocks Workstream F (not Phase 1 schema — schema is type-agnostic data, this is
  per-type configuration)
- **Workstream**: Deliverable quality; approval/authority controls
- **Status**: `Needs Owner Decision`
- **Dependencies**: MOVES-DESIGN-001 (reviewer-role mapping) should resolve first so this matrix's
  `requiredReviewerRoles` column is meaningful
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

**Owner decision needed**: fill in every `?` cell. Rows in _italics_ already have the reviewer's own
worked examples from the design conversation.

### MOVES-DESIGN-003 — ACA lifecycle backfill contract

- **Problem statement**: Backfilling every existing signed-off deliverable's lifecycle history is a
  mutating, all-tenant operator data build. Per `docs/ops/aca-data-build-job-rule.md`, this must run
  as a governed ACA Job, not an ad-hoc script — but the job's exact contract (batching, dry-run,
  idempotency, rollback, audit output) is not yet defined.
- **Severity**: Blocks MOVES-ARTIFACT-001 Phase 1 step 2 (backfill)
- **Workstream**: Approval/authority controls; data remediation
- **Status**: `Needs Owner Decision`
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

**Owner decision needed**: resolve every row above before this job can be scoped/built.

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
- **Status**: `Ready after canonical lifecycle schema is approved` (i.e., blocked on MOVES-ARTIFACT-001 Phase 1)
- **Dependencies**: MOVES-ARTIFACT-001 Phase 1
- **Acceptance criteria**: `completeDeliverable()` writes the same lineage pointers
  `signOffDeliverable()` does, using the new event-sourced write path.
- **Required tests**: agent-completed deliverable has a resolvable `getAuthoritativeVersion()`.
- **PR**: not yet opened
- **Discovered from**: MOVES-ARTIFACT-001 design pass, §1/§3.14
- **Notes / remaining gaps**: **do not patch this independently in a way that creates a competing
  lineage model** — must land as part of MOVES-ARTIFACT-001's convergence plan (design doc §3.14).

### MOVES-CAPABILITY-001 — Explicit supersession

- **Problem statement**: `deliverables_v2.status` has a ready `'superseded'` CHECK value, but no
  code path writes it — supersession is purely implicit today (whichever version
  `signed_off_version` currently points to).
- **Severity**: P2 (capability gap)
- **Workstream**: Approval, authority, and artifact-lineage controls
- **Status**: `Ready after lifecycle design approval` (blocked on MOVES-ARTIFACT-001 Phase 1)
- **Dependencies**: MOVES-ARTIFACT-001 Phase 1
- **Acceptance criteria**: a new `supersedeDeliverableVersion()` mutation marks the prior
  authoritative version `superseded` whenever a newer version becomes authoritative, while
  preserving the prior version's own approval history unchanged.
- **Required tests**: superseding a version does not delete/alter its own historical approval
  events; gate evaluation only ever reads the current (non-superseded) authoritative version.
- **PR**: not yet opened
- **Discovered from**: MOVES-ARTIFACT-001 design pass, §1/§3.11
- **Notes / remaining gaps**: none beyond the Phase 1 dependency.

---

## Deliverable quality and consulting depth

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
- **Status**: `Blocked`
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

### MOVES-TEST-001 — Isolated governed Moves test tenant

- **Problem statement**: `MOVES-QUALITY-002` (and any future live-proof need) is blocked because no
  safe, isolated place exists to run a live phase transition without touching shared production data.
- **User/business impact**: without this, live E2E verification of the phase-gate/approval-lifecycle
  system can only ever be proven via unit/integration tests, never a true signed-in, end-to-end
  browser proof — a real gap in this program's own evidence standard.
- **Severity**: P2 (test-infrastructure gap, not a defect)
- **Workstream**: Automation and efficiency / test enablement
- **Status**: `Needs Design Review`
- **Dependencies**: this design document's review/approval; recommended (not required) to sequence
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
- **Status**: `In Progress`
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
- **Status**: `Ready`
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
- **Status**: `Ready`
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
- **Status**: `Ready`
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
- **Status**: `Ready` — not yet started; coordinate before starting to avoid duplicate work
  (a parallel Codex session built the P0 reference and may continue the P1-P5 port)
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
