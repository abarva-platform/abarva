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
  the instant generation jobs were *queued*, not once they reached a terminal state; a failed job
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

- **Problem statement**: A normal, hard-gate-clean pass with unmet *soft* criteria was labeled
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

| `reviewer_role_code` | Maps to gate role | Rationale |
|---|---|---|
| `business_owner` | `business` | Direct match |
| `technology_owner` | `technology` | Direct match |
| `architecture` | `technology` | Architecture review satisfies the technology gate role |
| `finance` | `finance` | Direct match |
| `risk` | `risk_security` | Direct match |
| `security` | `risk_security` | Direct match |
| `artifact_owner` | *(none)* | Descriptive only — the person accountable for the artifact, not a gate-satisfying reviewer capacity |
| `workstream_lead` | *(none)* | Descriptive only |
| `data` | *(none)* | Descriptive only — no data-specific gate role exists today; raise as a future gate-role candidate if needed |
| `legal` | *(none)* | Descriptive only — no legal gate role exists today |
| `procurement` | *(none)* | Descriptive only |
| `executive_sponsor` | *(none — but drives `requiresClientAuthority`/gate policy separately)* | Executive sign-off is tracked as a distinct gate-policy flag, not folded into the 4-role axis |
| `client_authority` | *(none — but required for `client_final`/`requiresClientAuthority`)* | Same as above |
| `abarva_quality` | *(none)* | Internal QA capacity, descriptive only |
| `other` | *(none, requires `reviewer_role_label`)* | Catch-all |

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

| `deliverableTypeKey` | Phase | `minimumLifecycleState` | `requiredReviewerRoles` | `requiresClientAuthority` | `depthBand` |
|---|---|---|---|---|---|
| `charter` | 1 | *(reviewer's example: `client_final`)* | — | true | ? |
| `discovery_report` | 1 | *(reviewer's example: `human_approved`, "Diagnostic findings")* | — | false | ? |
| `root_cause_worksheet` | 1 | ? | ? | ? | ? |
| `target_state_architecture` | 3 | *(reviewer's example: `human_approved`)* | `architecture` | false | ? |
| `solution_design` | 3 | ? | ? | ? | ? |
| `operating_model_design` | 3 | ? | ? | ? | ? |
| `sourcing_strategy` | 3 | ? | ? | ? | ? |
| `p3_design` (deprecated alias) | 3 | ? | ? | ? | ? |
| `execution_roadmap` | 4 | ? | ? | ? | ? |
| `business_case` | 4 | *(reviewer's example: `human_approved`)* | `finance` | false | ? |
| `financial_model` | 4 | ? | ? | ? | ? |
| `tower_metrics_plan` | 4 | ? | ? | ? | ? |
| `roadmap` (deprecated alias) | 4 | ? | ? | ? | ? |
| `handoff_package` | 5 | *(reviewer's "Mobilization authorization" example: `client_final`)* | `executive_sponsor` | true | ? |
| `value_measurement_contract` | 5 | ? | ? | ? | ? |
| Workshop guide (no registry key yet — non-gate working doc) | — | *(reviewer's example: `human_approved`)* | — | false | ? |

**Owner decision needed**: fill in every `?` cell. Rows in *italics* already have the reviewer's own
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

| Contract element | Options / question for owner |
|---|---|
| Eligible legacy records | All `deliverables_v2` rows with `status = 'signed_off'`, tenant-unscoped (all tenants) — confirm scope, or restrict to specific tenants first? |
| Inference rules | As specified in design doc §3.12: `approved_artifact_id`-backed rows → `human_approved`, `authoritative_flag_source='legacy_backfill'`; `signed_off_version`-only rows → same state but `requires_revalidation=true`. Confirm or adjust. |
| `requires_revalidation` handling | Should gate policies that require `client_final` treat a `requires_revalidation=true` row as an automatic block, or merely a warning? |
| Batching | Per-tenant, or a single all-tenant run? What batch size / rate limit against Postgres? |
| Dry-run report | Required before any live run — proof bundle format: rows to be backfilled, confidence breakdown, any rows that cannot be inferred at all (e.g. `signed_off = true` but no `signed_off_version` set). |
| Idempotency key | Proposed: `(deliverable_id, version)` — a backfill event is a no-op if one already exists for that pair. Confirm. |
| Rollback | Since new columns/table are additive, rollback = stop reading them (code-level), leave backfilled rows in place — is this acceptable, or is a hard delete of backfilled rows required if the backfill is later found wrong? |
| Audit output | What's the minimum required proof artifact — a Blob-stored report? A `maestro_oversight_flags` summary row per tenant? Both? |
| Failure handling | Does one tenant's backfill failure block the whole run, or does the job skip and report per-tenant, continuing others? |
| Operator path | Confirm this runs through the sanctioned ACA Job path only — no `az containerapp exec`, no local script against production Postgres. |

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
- **Status**: `Approved` — independent of MOVES-ARTIFACT-001, does not touch the new lifecycle
  schema, safe to execute while design decisions are pending
- **Dependencies**: none
- **Acceptance criteria**: TBD at implementation time (format parity with DOCX export, exhibit
  rendering, AI-disclosure block present per §10 of the standing directive)
- **Required tests**: TBD
- **PR**: not yet opened
- **Discovered from**: earlier session backlog (pre-dates the Phase Advancement Control program)
- **Notes / remaining gaps**: this is the next safe, independent, unblocked item — see the return
  summary in this turn's response for the recommendation to begin it now.

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
