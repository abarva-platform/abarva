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
- **Status**: `Needs Owner Decision` (design is now decision-complete — see below; the remaining
  blocker is explicit sign-off on the recommendations, not unresolved design work)
- **Dependencies**: MOVES-DESIGN-001, MOVES-DESIGN-002, MOVES-DESIGN-003 must be approved (or
  amended) before Phase 1 schema implementation begins
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
  G**. Full design: `docs/specs/programs/deliverable-quality-and-approval-lifecycle-design.md`
  (v3 — decision-complete). Do not begin schema implementation until the owner approves or amends
  §3.8/§3.7/§11 of that document (MOVES-DESIGN-001/002/003, below).

---

## Required design decisions before Phase 1 implementation

All three items below are **decision-complete** as of design doc v3 — each has a specific,
adoptable recommendation, not an open questionnaire. What remains is the owner choosing to adopt
(or amend) the recommendation; no further research or design work is needed to unblock Phase 1.

### MOVES-DESIGN-001 — Reviewer-role to gate-role mapping

- **Status**: `Needs Owner Decision` — recommendation ready
- **Final mapping, exceptions, and consequences**: design doc §3.8 (all 16 `reviewer_role_code`
  values resolved, including the addition of `compliance` as a 16th code; explicit
  separation-of-duties and self-approval-prohibition rules enforced at the write path)
- **Recommended decision**: adopt §3.8 as written.
- **Owner action needed**: approve, or specify corrections.

### MOVES-DESIGN-002 — Full artifact gate-policy matrix

- **Status**: `Needs Owner Decision` — recommendation ready
- **Complete 16-artifact matrix**: design doc §3.7 (all 16 governed types — the 15
  `DELIVERABLE_REGISTRY` entries plus `origination_brief`/P0 — every cell filled; ambiguous cases
  resolved with recommended-vs-alternative-vs-risk reasoning, not left blank)
- **Recommended decision**: adopt §3.7 as written, including its two most consequential calls —
  `charter` and `execution_roadmap` both require `client_final`, not just `human_approved` — and its
  flagged Known Gap (`sourcing_strategy`/`tower_metrics_plan` have no independently-named
  `governance.ts` hard check today; recommended to add one as part of Workstream F).
- **Owner action needed**: approve, or specify corrections.

### MOVES-DESIGN-003 — ACA lifecycle backfill contract

- **Status**: `Needs Owner Decision` — recommendation ready
- **Resolved contract**: design doc §11 (all 9 originally-open questions answered: tenant-batched
  dry-run-then-apply, `approved_artifact_id`-only eligibility for non-revalidated authority,
  advisory-locked/idempotent/restartable execution, bounded batches, immutable per-record audit
  output with explicit skip/fail reasons, rollback scoped to the exact workflow run, sanctioned ACA
  Job path only)
- **Recommended decision**: adopt §11 as written; run the first real `apply` against a single named
  tenant, not an all-tenant rollout, as a deliberate rollout-safety choice.
- **Owner action needed**: approve, or specify corrections.

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
- **Status**: `Runtime Proven`
- **Dependencies**: none
- **Acceptance criteria**: format parity with DOCX export (sections, in-document tables, rasterised
  exhibit diagrams, recommendation, next actions, checklist, assumptions, source register),
  AI-disclosure block present (shared constants, identical wording to DOCX/HTML), no new heavy
  dependency (`@react-pdf/renderer` — already used across Programs/Source/Intelligence/Tower).
- **Required tests**: valid PDF buffer with full content; exhibit title/description present;
  rasterisation-failure fallback (no thrown error); disclosure text present; route serves real PDF
  for `pdf`-prescribed artifacts and honors `?format=pdf` override.
- **PR**: #5170
- **Merge SHA**: `0b59e44bc4612d0fe4402ce86cf13007303ba156`
- **Deploy run**: `29785592357` — success
- **Runtime proof**: ACA template image `sha256:2c88e2d7dcacd95a397e441a8f2e009d0c31f5e7205cbc8a962efe8f60f7f624`
  = 100%-traffic revision image, verified 2026-07-20; `app.abarva.ai` read-only health check passed
- **Release record**: `docs/releases/records/2026-07-20-orchestrator-pdf-renderer.md`
- **Discovered from**: earlier session backlog (pre-dates the Phase Advancement Control program);
  selected as the next safe, independent, unblocked item per the standing Moves Continuous
  Execution Directive while MOVES-ARTIFACT-001 (PR #5168) awaited owner sign-off
- **Notes / remaining gaps**: no UI download link added for PDF specifically — existing callers
  (`PhaseDocumentsPanel.tsx`, `GenerateDeliverableButton.tsx`, the Maestro dossier page) call the
  route without a hardcoded format, so any artifact with `outputFormat: 'pdf'` now renders correctly
  with no caller-side change needed. PDF typography uses `@react-pdf/renderer`'s built-in fonts
  (same as every other PDF renderer in this codebase) — brand font registration remains a
  previously-deferred, cross-cutting slice, not specific to this item.

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
- **PR**: #TBD (design doc: `docs/specs/programs/moves-isolated-e2e-test-tenant.md`)
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
