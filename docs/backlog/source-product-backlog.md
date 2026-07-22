# Source Product Backlog (Canonical)

This is the canonical, permanent backlog for the AbarVa Nexus Source module. Established
2026-07-21, following the same convention as `docs/backlog/moves-product-backlog.md`
(the Moves Continuous Execution Directive, established 2026-07-20). Completed items are
never deleted — history is preserved. This file should be reconciled against `main` and
merged PRs at the start of every execution loop.

**Status values** (use only these): `Proposed`, `Needs Design`, `Needs Owner Decision`,
`Approved`, `Ready`, `In Progress`, `In Review`, `Merged`, `Deployed`, `Runtime Proven`,
`Blocked`, `Deferred`, `Superseded`, `Closed`.

**Priority order** (mirrors Moves): (1) security/data-corruption/tenant-isolation/
unauthorized-mutation, (2) evidence-integrity and governed-migration correctness, (3)
live runtime failures, (4) approval/authority/lineage controls, (5) deliverable/content
quality, (6) workspace UX, (7) automation and efficiency, (8) cosmetic.

---

## Completed and closed

### SOURCE-GUIDEBOOK-001 — Stage guidebooks foundation + read-only workspace tab

- **Problem statement**: Source had no facilitator-guide content system for the working
  session that moves an event through a stage's gate (Moves' Workshop Facilitator Guide
  had this; Source did not).
- **User/business impact**: No structured agenda/talking-points/decision-capture surface
  for the Strategy gate conversation (or any stage).
- **Severity**: P4 (capability gap, not a defect)
- **Workstream**: Deliverable/content quality
- **Status**: `Deployed` — code and migration both live; component rendering proven; a
  real signed-in click-through is not yet done (tracked separately as
  `SOURCE-GUIDEBOOK-002`).
- **Dependencies**: the governed database-migration delivery lane
  (`docs/releases/records/2026-07-20-db-migration-lab-workflow.md`) — this was the
  feature that originally surfaced the need for that lane.
- **Acceptance criteria**: schema + repository function + one real authored guidebook
  (Strategy); a read-only "Guidebook" workspace tab on the Source event shell, visible
  only for stages with authored content.
- **Required tests**: `src/lib/source/stage-guidebooks/__tests__/repository.test.ts`;
  `src/lib/source/__tests__/source-event-shell-v2.test.ts` (guidebook cases);
  `src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.guidebook.test.tsx`.
- **PR**: #5135 (schema/repository/seed), #5175 (workspace tab UI)
- **Merge SHA**: `02c08d3e28f16d6fe708fb9caaca3c56d3e1547b` (#5135),
  `4a4290345db4624bbcee08e4f66f98574b82c5fe` (#5175)
- **Deploy run**: aca-main-deploy [29790788429](https://github.com/abarva-platform/abarva/actions/runs/29790788429),
  `success`
- **Runtime proof**: ACA revision `ca-abarva-web-lab-eastus--m4a429034` confirmed
  matching the deploy digest via `az containerapp show`. Migration applied for real via
  the governed migration lane, real apply run
  [29789097644](https://github.com/abarva-platform/abarva/actions/runs/29789097644);
  real repository readback confirms the seeded Strategy row. Component rendering proven
  via real RTL tests. **Live signed-in server-to-database rendering is NOT proven** —
  see `SOURCE-GUIDEBOOK-002`.
- **Release record**: `docs/releases/records/2026-07-20-source-stage-guidebooks-foundation.md`,
  `docs/releases/records/2026-07-20-source-guidebook-workspace-ui.md`
- **Discovered from**: a proposal for consulting-grade Source artifact governance,
  referencing Moves' Workshop Facilitator Guide pattern.
- **Notes / remaining gaps**: only the Strategy stage has authored content (the other 10
  stages correctly hide the tab, not show it empty); no authoring/edit UI exists yet.

### SOURCE-GUIDEBOOK-003 — Render guidebook section bodies as real Markdown

- **Problem statement**: `SourceStageGuidebookSection.body` is typed and documented as
  Markdown, but `GuidebookWorkspace` in `SourceAnalyticsCanvas.tsx` rendered it with
  `whiteSpace: 'pre-wrap'` plain text — the seeded Strategy agenda's numbered list
  showed literal `1. `/`2. ` prefixes instead of a real ordered list.
- **User/business impact**: Cosmetic (content-fidelity), not a defect.
- **Severity**: P7 (cosmetic / content-quality)
- **Workstream**: Workspace UX
- **Status**: `Deployed` — real Markdown rendering via `react-markdown` +
  `remark-gfm` + `rehype-sanitize` (already-bundled dependencies, no new one added).
- **Dependencies**: none.
- **Acceptance criteria**: met — real `<ol>`/`<li>` output confirmed via
  `renderToStaticMarkup` against the real library and the real seeded agenda content.
- **Required tests**:
  `src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.guidebook.test.tsx`
  — asserts rendering delegates to `ReactMarkdown` (this repo's global Jest mock for
  `react-markdown` is a hard passthrough, so the committed test can only guard against
  regressing back to plain text; real markup rendering was verified separately, see the
  release record).
- **PR**: #5180
- **Merge SHA**: `7888cab375fde5224bb03f6b9b7100a46ef66deb`
- **Deploy run**: [aca-main-deploy #29793844800](https://github.com/abarva-platform/abarva/actions/runs/29793844800),
  `success`
- **Runtime proof**: ACA revision `ca-abarva-web-lab-eastus--m7888cab3` confirmed
  matching the deploy digest via `az containerapp show`. Live signed-in
  server-to-database rendering not proven — same open item as `SOURCE-GUIDEBOOK-002`.
- **Release record**: `docs/releases/records/2026-07-20-source-guidebook-markdown-rendering.md`
- **Discovered from**: `SOURCE-GUIDEBOOK-001`'s own Known Gaps.
- **Notes / remaining gaps**: none yet.

### SOURCE-SHELL-001 — Stage header lead-agent label was hardcoded

- **Problem statement**: found while comparing a user-provided Source Event Shell redesign
  mockup against the live app. The stage header printed "Stage NN · aVa" for every stage,
  including Transition and Value, contradicting the canvas's own rail note on the same page
  ("aVa guides steps 1-9 · Atlas takes over for Transition & Value").
- **User/business impact**: cosmetic but visibly self-contradictory copy on every Source
  event's Transition and Value stages.
- **Severity**: P7 (cosmetic)
- **Workstream**: Workspace UX
- **Status**: `Runtime Proven` (partial) — merged, deployed, ACA runtime invariant confirmed;
  the `aVa` branch is live-verified on real production data, the `Atlas` branch is not (no
  real event in current tenant data has reached Transition/Value — see the release record's
  Known Gaps).
- **Dependencies**: none.
- **Acceptance criteria**: header label derives from `view.stage.key`
  (`transition`/`value` → Atlas, else aVa) instead of a hardcoded string. Met.
- **Required tests**: `SourceAnalyticsCanvas.stageHeader.test.tsx` (new) — asserts both
  branches.
- **PR**: #5192
- **Discovered from**: direct comparison against the user's mockup, which correctly showed
  "STAGE 11 · ATLAS" for Value.
- **Notes / remaining gaps**: deliberately does not reconcile with the separate, richer
  `Nexus`/`Sentinel`/`Governance`/`Atlas`/`aVa` per-stage model in `stage-canvas-config.ts`
  (used by a different, older component) — that's a separate product decision.

### SOURCE-SHELL-002 — Per-file artifact role badge (Authoritative/Evidence)

- **Problem statement**: the mockup showed each Files-tab file tagged `AUTHORITATIVE` or
  `EVIDENCE` — whether the file is required to gate the stage. Live Source already computed
  this exact classification (`ArtifactLifecyclePanel`'s Gate-defining/Supporting split) but
  only showed it in the aggregate quality matrix, not per file.
- **User/business impact**: a user scanning the Files tab couldn't tell at a glance which
  files actually matter for gate advancement without cross-referencing the separate matrix
  panel.
- **Severity**: P6 (workspace UX / information density)
- **Workstream**: Workspace UX
- **Status**: `Runtime Proven` — merged, deployed, ACA runtime invariant confirmed, live
  signed-in click-through performed against real production data (real `.docx` shows
  `AUTHORITATIVE`, real `.md`/`.html` renderings of the same memo show `EVIDENCE`).
- **Dependencies**: none — reuses the existing `specByCode().gateDefining` lookup, no new
  derivation logic, no schema change.
- **Acceptance criteria**: `SourceShellFileItem` carries `artifactRole`; `FileCard` renders
  an `ArtifactRoleBadge`; unknown artifact codes default to `evidence` (fail-safe). Met.
- **Required tests**:
  `SourceAnalyticsCanvas.artifactRoleBadge.test.tsx` (new) — functional: real click to open
  the Files tab, real differing badge output from two real spec codes, real status values,
  real unknown-code fallback.
- **PR**: #5195, merged as `5721079099d86bbd611b349177af7ebde619c9eb`.
- **Discovered from**: direct comparison against the user's mockup.
- **Notes / remaining gaps**: the Files-tab lifecycle-explainer banner half of the mockup's
  two-axis pattern was evaluated and found to already exist in substance
  (`ArtifactLifecyclePanel`'s intro paragraph) — not duplicated with different wording.

### SOURCE-SHELL-003 — Single-event Approvals ledger view

- **Problem statement**: the mockup's "Approvals & advance" page shows one event's full
  11-stage gate history as a table — named approver role per gate, sequential
  APPROVED/LOCKED chips. Live `ApprovalsWorkspace` is a cross-event inbox of pending
  approvals only; the real governance mechanics (server-enforced sequential gates,
  append-only `source_event_approvals`) already exist, but this per-event table view does
  not.
- **User/business impact**: no single place to see one event's full governance history at a
  glance; must infer state from the cross-event inbox plus each stage's own gate card.
- **Severity**: P5 (workspace UX / governance visibility)
- **Workstream**: Approval/authority/lineage controls
- **Status**: `Merged` — PR merged; migration dependency applied and confirmed live
  (`2026-07-21-source-event-approvals-stage-key-migration`); ACA deploy/runtime-proof
  evidence for the app-code PR pending.
- **Dependencies**: `source_event_approvals.stage_key` migration — **resolved**: real
  investigation of `source-access-policy.ts` found Source approval authority is a flat,
  per-person capability uniform across all 11 stages, with no per-stage named-approver-role
  data anywhere. Rather than fabricate that concept, the ledger shows the real historical
  approver (Clerk-resolved) when a matching `stage_key` row exists, and a plain, honest
  authorization statement otherwise — not a named individual invented for stages nobody is
  specifically assigned to.
- **Acceptance criteria**: `SourceShellApprovalsWorkspace.ledger` carries the real 11-row
  ledger; approved/current/locked derives from stage position (always reliable); approver
  name/timestamp is real-or-null, never guessed; UI renders it in the Approvals workspace.
  Met.
- **Required tests**: `approval-ledger.test.ts` (7 pure-function cases, including the
  send-back/most-recent-row-wins case and the honest-null case) +
  `SourceAnalyticsCanvas.approvalLedger.test.tsx` (2 functional UI cases, real click + real
  differing rendered output).
- **PR**: schema — #5201 (merged, applied); app code — to be recorded on merge.
- **Discovered from**: direct comparison against the user's mockup.
- **Notes / remaining gaps**: no event in currently-available tenant data has a
  `stage_key`-tagged approval yet (migration just landed) — every ledger currently shows the
  honest "not recorded" path for its already-approved stages, which is correct, not a bug.

### SOURCE-SHELL-004 — Two-track artifact approval (Track A/B)

- **Problem statement**: the mockup's design-contract page specifies that artifact
  acceptance and the stage gate are two distinct approvals — an authoritative artifact must
  be explicitly accepted (author, timestamp, rationale, append-only) independent of the gate
  being armed. No live equivalent exists; today acceptance is inferred from artifact status
  flags, not recorded as its own action.
- **User/business impact**: no accountable, auditable record of who accepted a specific
  artifact as final and why, independent of the separate gate-approval record.
- **Severity**: P4 (approval/authority/lineage controls)
- **Workstream**: Approval/authority/lineage controls
- **Status**: `Proposed` — not started. Requires a real database migration through the
  governed migration lane (`db-migration-lab.yml`) — the highest-scrutiny category in this
  repo's governance model.
- **Dependencies**: schema design using the field list already specified in the mockup's own
  design-contract page (`artifact_role`, `artifact_origin`, `artifact_state`,
  `authoritative_version_id`, `supersedes_artifact_id`, `diff_summary`, `drift_status`,
  `accepted_by`/`accepted_at`, `approval_rationale`, `gate_precondition_status`,
  `downstream_context_policy`) as the source of truth rather than an invented shape.
- **Acceptance criteria**: TBD on start — will list explicit criteria including the governed
  migration plan/apply/evidence sequence before implementation.
- **Discovered from**: user-directed follow-up after reviewing the mockup's Track A/B
  prototype; UI copy explicitly must NOT say "Track A"/"Track B" on screen — plain language
  ("Artifact status"/"Stage gate") per direct user feedback.

### SOURCE-SHELL-005 — Real per-vendor coverage in the Responses step body

- **Problem statement**: the mockup's Responses stage shows each vendor's response
  completeness inline in the step body (Halcyon MS/Northgate Global "complete", Vantage
  Digital "partial", Cormorant IT "awaiting"). Live `StepDetail` rendered only a bare upload
  prompt with no per-vendor breakdown.
- **User/business impact**: no at-a-glance view of which vendors have actually responded to
  which value levers while working the Responses step; that data existed but only surfaced
  in the separate Intelligence tab.
- **Severity**: P5 (workspace UX / information density)
- **Workstream**: Stage step-body content parity
- **Status**: `Merged` — see PR below.
- **Dependencies**: none — reuses the already-live `buildResponseCoverageInsight` →
  `VendorCoverageView` computation (Intelligence tab's `response_coverage` insight); no new
  data source.
- **Acceptance criteria**: when the active step's `factTemplateCode` is
  `RESPONSE_COVERAGE_V1` and the insight is genuinely live (`isModel: false`) with vendor
  data, `StepDetail` renders a `VendorResponseCoverageList` below the upload widget — real
  addressed/partial counts over `totalLevers`, status Complete/Partial/Awaiting derived from
  those counts. Renders nothing extra when the insight is still the honest MODEL state. Met.
- **Required tests**: `SourceAnalyticsCanvas.vendorResponseCoverage.test.tsx` — fixture-drift
  guard + real live-data render assertions + honest-MODEL-state no-render assertion.
- **PR**: [#5239](https://github.com/abarva-platform/abarva/pull/5239).
- **Discovered from**: mockup-anchored audit pass across Responses/Evaluation/Executive
  Decision/Selection stages.
- **Notes / remaining gaps**: does not replicate the mockup's file-chip / document-upload
  treatment (`response.pdf`, "148 requirements answered") — that would require a different,
  not-currently-computed data source (per-document upload tracking cross-referenced by
  vendor). Surfaces real per-vendor **value-lever** coverage instead, reusing the one
  source of truth the Intelligence tab already has, rather than fabricating a second one.
  Two other candidate gaps from the same audit pass (Evaluation should-cost step body,
  Executive Decision bridge step body) were investigated and retracted — direct mockup
  verification showed both already match live behavior.

### SOURCE-SHELL-006 — Keep viewed stage label and step body coherent

- **Problem statement**: a live Source event sitting at Scope could be opened with
  `?stage=responses`; the header, breadcrumb, and rail correctly said Responses, but the
  Steps workspace rendered the Scope fallback scaffold ("Provide the volumetrics",
  "Inclusions & exclusions", "Baseline evidence", "Boundary & owner"). The page was mixing
  the requested viewed-stage label with the generic Scope sample fallback when no live stage
  view existed for the requested stage.
- **User/business impact**: users reviewing a future stage could see the wrong work under the
  right stage label, making live QA and operator guidance misleading.
- **Severity**: P4 (stage navigation correctness / shell trust)
- **Workstream**: Stage route/view coherence
- **Status**: `Merged` — see PR below.
- **Dependencies**: none — uses existing stage sample view models, no schema/API/data changes.
- **Acceptance criteria**: when `viewStage` is `responses` or `evaluation` and the route has no
  live fact-backed `stageView`, `SourceAnalyticsCanvas` falls back to that requested stage's
  own scaffold rather than Scope. The focused regression uses an event whose current stage is
  Scope while `viewStage="responses"` and verifies the Responses step appears and Scope's
  "Provide the volumetrics" step does not.
- **Required tests**: `SourceAnalyticsCanvas.vendorResponseCoverage.test.tsx` — viewed-stage
  fallback coherence regression plus existing vendor-coverage checks.
- **PR**: [#5239](https://github.com/abarva-platform/abarva/pull/5239).
- **Discovered from**: signed-in live proof attempt for `SOURCE-SHELL-005` against a Healthcare
  Demo Source event currently sitting at Scope.

### SOURCE-SHELL-007 — Honest placeholders for Source stages without sample fixtures

- **Problem statement**: after `SOURCE-SHELL-006`, Responses and Evaluation correctly use their
  own fallback scaffolds, but Pricing, Executive Decision, and Transition still had no sample
  fixtures. With no live `stageView`, those stages could still fall through to Scope's sample
  body because the fallback selector's final default was `SAMPLE_SCOPE_STAGE`.
- **User/business impact**: users opening a stage without live facts could still see another
  stage's work under the correct stage label, eroding trust in stage navigation and QA proof.
- **Severity**: P4 (stage navigation correctness / shell trust)
- **Workstream**: Stage route/view coherence
- **Status**: `Live-proven` — merged in PR below and deployed through ACA main deploy run
  [29874391399](https://github.com/abarva-platform/abarva/actions/runs/29874391399).
- **Dependencies**: none — uses existing view-model contract, no schema/API/data changes.
- **Acceptance criteria**: the fallback selector explicitly maps every existing fixture-backed
  canonical stage; Scope has its own explicit branch; Pricing, Executive Decision, and Transition
  render stage-specific "no illustrative preview built yet" placeholders with zero tasks rather
  than Scope content.
- **Required tests**: `SourceAnalyticsCanvas.stageFallbacks.test.tsx` iterates the real
  `SOURCE_STAGE_ORDER` and renders `SourceAnalyticsCanvas` with `stageView={undefined}` for all 11
  canonical stages.
- **PR**: [#5242](https://github.com/abarva-platform/abarva/pull/5242).
- **Discovered from**: follow-up root-cause prompt for
  `SOURCE_SHELL_SAMPLE_STAGE_FALLBACK_FIX_PROMPT_2026-07-21`.

### SOURCE-GUIDEBOOK-002 — Signed-in guidebook runtime certification

- **Problem statement**: `SOURCE-GUIDEBOOK-001` shipped and is deployed, but a real
  signed-in user opening a Source event's Strategy stage and seeing the Guidebook tab
  render real content from the live database had never been observed. Component-level
  tests are real and pass, but they do not exercise the live server-side
  `getSourceStageGuidebook()` call against real Postgres through a real authenticated
  session.
- **User/business impact**: The feature was very likely working (every layer up to the
  authenticated boundary was independently proven), but "very likely" is not "proven" —
  this was the one remaining gap between deployed code and a certified user-facing
  feature.
- **Severity**: P5 (verification/evidence gap, not a known defect)
- **Workstream**: Live runtime verification
- **Status**: `Closed — live-proven 2026-07-21`. An earlier attempt via a fresh
  claude-in-chrome browser was stopped by Clerk's one-time-email-code sign-in flow with
  no inbox access available. Closed using an already-authenticated claude-in-chrome
  session (the same one used to live-verify `SOURCE-SHELL-006`/`007` the same day) — no
  credentials were entered by the agent at any point; the session was already signed in
  as Anand Sundaram, Healthcare Demo tenant.
- **Dependencies**: none (resolved).
- **Acceptance criteria** — all met, see
  `docs/releases/records/2026-07-20-source-guidebook-workspace-ui.md` for full evidence:
  1. Authenticate using an approved test account or reusable signed-in storage state. Met.
  2. Open a Source event at the Strategy stage. Met — event
     `cea10d0a-6d5d-49d2-8522-173c2d6fd520`.
  3. Verify the Guidebook workspace tab is visible. Met.
  4. Confirm the rendered title is "Strategy Gate Review". Met.
  5. Verify all five authored sections render. Met.
  6. Confirm stages without guidebooks hide the workspace tab (not shown-and-empty).
     Met — verified on the Scope stage of the same event.
  7. Capture screenshot, response evidence, tenant/event identity, and the deployed
     commit SHA. Met — commit `01723ef0123a4e7d85716f1133ae67cd58f72263`.
  8. Add the evidence to `docs/releases/records/2026-07-20-source-guidebook-workspace-ui.md`.
     Met.
- **Required tests**: none new — this was a verification pass, not a code change.
- **PR**: N/A (docs-only evidence update).
- **Discovered from**: `SOURCE-GUIDEBOOK-001`'s deploy — flagged honestly rather than
  claimed complete; closed once real signed-in access became available.

---

## Ready / in progress

`SOURCE-SHELL-004` is the next larger backlog item.

## Blocked

None open.
