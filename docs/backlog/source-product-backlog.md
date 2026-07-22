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
- **Status**: `Merged — live-proven`. Migration applied through the governed
  `db-migration-lab.yml` lane with explicit user confirmation (`mode=status` then
  `mode=apply`, both succeeded, all steps including the new repository-readback step and the
  post-migration health check passed). Live signed-in proof performed: a real artifact was
  accepted on a real production event, with the real "Artifact status" panel confirming the
  real rationale, real Clerk accepted-by id, and real gate-precondition selection persisted
  and rendered back.
- **Dependencies**: none remaining — schema built using the field list from the mockup's
  design-contract page as the source of truth. Investigation found 2 of the 11 fields
  (`artifact_origin`, `supersedes_artifact_id`) already exist as exact-match columns on
  `source_artifacts` — reused via join, not duplicated. `artifact_role` was reconciled with an
  existing computed-only UI concept (`SourceShellFileItem.artifactRole`) rather than creating a
  second, colliding vocabulary. See the release record for the full field-by-field accounting.
- **Acceptance criteria**: new `source_artifact_acceptances` table (append-only); `POST
  .../artifacts/:artifactCode/accept` route, `artifactState`/`artifactRole` computed
  server-side (never trusted from the client), requires a non-empty `approvalRationale`; an
  "Artifact status" panel on each File Cabinet card showing the latest real acceptance or an
  honest never-accepted state, with an Accept form; the existing "Stage gate" panel
  (`SOURCE-SHELL-003`) unchanged, placed alongside; `resolveAuthoritativeArtifact()` gains one
  new optional, backward-compatible pool. Plain-language UI copy only — no "Track A"/"Track B"
  anywhere on screen. All met, migration applied, live-proven.
- **Required tests**: `artifact-acceptances.test.ts` (7 cases), the accept route's own test
  suite (6 cases), 2 new `client-final-artifacts.test.ts` cases for the new resolver pool, and
  `ArtifactAcceptancePanel.test.tsx` (5 cases). Full adjacent-suite regression sweep confirmed
  zero regressions against a clean `origin/main` baseline (byte-identical failing-suite set
  before/after, via `git stash`).
- **PR**: [#5264](https://github.com/abarva-platform/abarva/pull/5264), squash-merged as
  `539ae678a9cb6cf0b93878894673c4d0f3b22437`.
- **Discovered from**: user-directed follow-up after reviewing the mockup's Track A/B
  prototype; UI copy explicitly must NOT say "Track A"/"Track B" on screen — plain language
  ("Artifact status"/"Stage gate") per direct user feedback.
- **Notes / remaining gaps**: `downstream_context_policy` is captured but not yet enforced by
  `buildValidatedAgentContextBundle` — a real hook for the mandatory Context & Corpus
  Governance policy (AGENTS.md), flagged as separate follow-up work. No backfill of historical
  acceptances for already-approved artifacts, matching the same honesty pattern
  `SOURCE-SHELL-003` established.

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

### SOURCE-APPROVAL-UX-001 — Approval brief simplification (slice 1 of 5)

- **Problem statement**: the Source event approval page (`EventApprovalCard.tsx`) surfaced too
  many adjacent governance details at once, forcing an approver to hunt for the actual decision
  among evidence, intake trail, routing, and audit detail all shown at equal visual weight.
- **User/business impact**: slower, more error-prone approvals; the actual decision (approve /
  request changes / reject) competed for attention with secondary reference material.
- **Severity**: P5 (workspace UX / decision clarity)
- **Workstream**: Approval/authority/lineage controls
- **Status**: `Merged — live-proven`. Two PRs: initial compact-brief slice
  ([#5277](https://github.com/abarva-platform/abarva/pull/5277), bundled with
  `SOURCE-SHELL-003/004/005/006/007` e2e coverage in the same PR — a scope-mixing deviation
  from this workstream's own stated non-goal, noted for future PR hygiene, not reverted since
  both halves shipped clean) and a flattening polish pass
  ([#5279](https://github.com/abarva-platform/abarva/pull/5279), merged as `b7138c81`). ACA
  deploy run succeeded for `b7138c81`; live signed-in browser proof performed on the Source
  approval page.
- **Dependencies**: none.
- **Acceptance criteria**: a compact approval brief (five governed facts, flattened into a
  definition-list layout, not nested tiles) appears first; required rationale, gate
  confirmations, blocker state, and the primary approval action stay in the active path;
  evidence review, intake audit trail, routing, and next-step detail move behind disclosures;
  existing approval API payload, permissions, self-approval behavior, and strategy-gate
  confirmation semantics unchanged. Met.
- **Required tests**: `EventApprovalCard.test.tsx` (6 cases, existing gate-readiness/API-payload
  coverage preserved plus new hierarchy regression coverage).
- **PR**: [#5277](https://github.com/abarva-platform/abarva/pull/5277),
  [#5279](https://github.com/abarva-platform/abarva/pull/5279).
- **Discovered from**: surfaced during the `SOURCE-SHELL` golden-event E2E crawl extension —
  the approval page "looked too cluttered for the decision being asked of the user."
- **Notes / remaining gaps**: full target shape captured in
  `docs/codex-handoff/SOURCE_P1_APPROVAL_UX_RECOMMENDATIONS_2026-07-22.md` — this slice covers
  recommendation point 1 only (first-viewport fact hierarchy). Points 2-5 (drawers, footer
  action bar, checkout-style gating) are `SOURCE-APPROVAL-UX-002` through `005` below.

### SOURCE-APPROVAL-UX-002 — Evidence drawer (slice 2 of 5)

- **Problem statement**: full evidence detail (artifact inventories, source basis, freshness)
  still renders inline on the approval page rather than behind the collapsed drawer the
  recommendations doc calls for — an approver who doesn't need to inspect evidence still pays
  its visual cost.
- **User/business impact**: same clutter problem as `SOURCE-APPROVAL-UX-001`, one layer deeper.
- **Severity**: P5 (workspace UX / decision clarity)
- **Workstream**: Approval/authority/lineage controls
- **Status**: `Proposed` — not started.
- **Dependencies**: none — reads already-governed data the approval page already has access
  to; no schema change.
- **Acceptance criteria**: a collapsed-by-default "Evidence" drawer on the approval page shows
  a count and freshness signal when collapsed (per the recommendations doc's "counts and
  freshness signals visible" requirement even while collapsed); expanding it reveals the full
  evidence detail currently shown inline; no evidence data is dropped, only its default
  visibility changes.
- **Required tests**: collapsed-state render test (count/freshness visible, detail absent);
  expanded-state render test (full detail present); existing `EventApprovalCard.test.tsx`
  cases must still pass unmodified in behavior (payload/permissions/gate logic untouched).
- **Discovered from**: `docs/codex-handoff/SOURCE_P1_APPROVAL_UX_RECOMMENDATIONS_2026-07-22.md`,
  recommendation point 2 ("Evidence drawer: collapsed by default, with counts and freshness
  signals visible").
- **Execution instructions** (apply to `002` and `003` together): these two drawers are
  independent, self-contained components with no shared state — build them as two separate
  parallel work threads (parallel agents/workers) rather than serially, then land them as
  either one integration PR or two independent PRs, whichever produces a cleaner diff. Once
  each slice passes its own full local validation (typecheck, lint, tests,
  `release:check`), merge and deploy it — do not pause to ask before merging; this is
  pre-approved standing authority for this workstream, matching how every other
  `SOURCE-SHELL`/`SOURCE-APPROVAL-UX` slice this session was handled. After deploying,
  capture live signed-in proof, update this backlog entry's status, and move directly to the
  next slice in sequence (`003`, then `004`, then `005`) without stopping for confirmation
  between slices. Only stop and ask if something in a slice touches a database migration,
  changes existing approval permissions/payload semantics, or fails validation in a way that
  isn't a simple fix — those remain real stop conditions, not this workflow's default.

### SOURCE-APPROVAL-UX-003 — Audit trail drawer (slice 3 of 5)

- **Problem statement**: the intake audit trail (prior approvals, artifact acceptances,
  reviewer notes) renders inline rather than behind a collapsed drawer.
- **User/business impact**: same clutter problem, audit-history-specific.
- **Severity**: P5 (workspace UX / decision clarity)
- **Workstream**: Approval/authority/lineage controls
- **Status**: `Proposed` — not started.
- **Dependencies**: none — reads the already-shipped `SOURCE-SHELL-003` approvals ledger and
  `SOURCE-SHELL-004` artifact-acceptance data the approval page already has access to; no
  schema change.
- **Acceptance criteria**: a collapsed-by-default "Audit trail" drawer shows prior stage-gate
  approvals (from the `SOURCE-SHELL-003` ledger) and artifact acceptances (from
  `SOURCE-SHELL-004`) together, with reviewer notes; expanding it reveals full detail; nothing
  currently shown inline is dropped, only its default visibility changes.
- **Required tests**: collapsed/expanded render tests; confirm real ledger + acceptance data
  renders (not a placeholder) when present, and an honest empty state when absent.
- **Discovered from**: `docs/codex-handoff/SOURCE_P1_APPROVAL_UX_RECOMMENDATIONS_2026-07-22.md`,
  recommendation point 2 ("Audit trail drawer: collapsed by default, showing prior approvals,
  acceptances, and reviewer notes").
- **Execution instructions**: same as `SOURCE-APPROVAL-UX-002` — build in parallel with `002`,
  merge/deploy/live-verify without pausing for confirmation, then continue to `004`.

### SOURCE-APPROVAL-UX-004 — Footer action bar + checkout-style gating (slice 4 of 5)

- **Problem statement**: approval/reject/request-changes actions and their surrounding
  copy aren't yet organized into the recommended footer action bar (`Approve` / `Request
  changes` / overflow menu), and `Approve` isn't yet disabled until blockers clear with the
  blocker copy placed directly beside the disabled action.
- **User/business impact**: the primary decision action isn't yet visually or behaviorally
  distinct from lower-frequency actions; a blocked approval doesn't fail as clearly as it
  should before submission.
- **Severity**: P5 (workspace UX / decision clarity)
- **Workstream**: Approval/authority/lineage controls
- **Status**: `Proposed` — not started, depends on `002` and `003` landing first (the footer
  bar's final layout assumes both drawers exist above it).
- **Dependencies**: `SOURCE-APPROVAL-UX-002`, `SOURCE-APPROVAL-UX-003`.
- **Acceptance criteria**: footer action bar shows `Approve`, `Request changes`, and a small
  overflow menu for lower-frequency actions; `Approve` is disabled until all required gate
  confirmations/blockers clear, with the blocker copy shown directly beside the disabled
  action (not buried elsewhere on the page); the reject/request-changes flow stays symmetric
  with approval (same visual weight, same confirmation pattern); existing approval API
  payload, permissions, and gate-contract semantics unchanged — this is presentation and
  client-side gating only, never a substitute for the server-side gate contract already
  enforced in the approve/gate-decision routes.
- **Required tests**: disabled-until-ready state test; blocker-copy-visible-beside-button
  test; symmetric reject-flow test; confirm the existing gate contract is still
  server-enforced (a disabled client button is UX, not the security boundary).
- **Discovered from**: `docs/codex-handoff/SOURCE_P1_APPROVAL_UX_RECOMMENDATIONS_2026-07-22.md`,
  recommendation points 2 and 4 ("Footer action bar" + "Make the page behave like a governed
  checkout").
- **Execution instructions**: sequential after `002`/`003` land (not parallel — this slice's
  layout depends on both). Same standing merge/deploy/live-verify authority as `002`/`003` —
  do not pause between landing this and starting `005`.

### SOURCE-APPROVAL-UX-005 — Acceptance-criteria verification pass (slice 5 of 5)

- **Problem statement**: the recommendations doc defines 5 explicit, testable acceptance
  criteria for the whole approval-UX simplification effort (5-second scan test, ≤1 primary +
  1 secondary action in the first viewport, required confirmations visible without scrolling,
  evidence/audit reachable within one click, no unrelated future-stage/artifact-maintenance
  content shown by default) — these have never been verified end-to-end against the finished
  page.
- **User/business impact**: without this pass, "done" is asserted per-slice but never
  confirmed against the original design intent as a whole.
- **Severity**: P5 (workspace UX / decision clarity, closing verification)
- **Workstream**: Approval/authority/lineage controls
- **Status**: `Proposed` — not started, depends on `002`, `003`, and `004` all landing first.
- **Dependencies**: `SOURCE-APPROVAL-UX-002`, `003`, `004`.
- **Acceptance criteria**: all 5 criteria from
  `docs/codex-handoff/SOURCE_P1_APPROVAL_UX_RECOMMENDATIONS_2026-07-22.md`'s "Suggested
  acceptance criteria" section verified against the real, deployed page via live signed-in
  browser proof (not asserted from reading the code) — including checking that governed
  evidence/approvals/artifact-acceptance/audit records are never removed or hidden
  permanently (only collapsed), matching the doc's own stated Non-Goals.
- **Required tests**: none new — this is a verification pass over the prior three slices'
  shipped behavior, not new functionality.
- **Discovered from**: `docs/codex-handoff/SOURCE_P1_APPROVAL_UX_RECOMMENDATIONS_2026-07-22.md`,
  "Suggested acceptance criteria" + "Non-Goals" sections.
- **Execution instructions**: this is the wrap-up slice — after it passes, update this
  workstream's summary in the "Ready / in progress" section below to reflect closure (or
  note what's still open, honestly, if a criterion doesn't pass).

---

## Ready / in progress

`SOURCE-APPROVAL-UX-002` and `SOURCE-APPROVAL-UX-003` are next, in parallel; `004` then `005`
follow sequentially. See execution instructions embedded in each entry above — standing
authority to merge, deploy, live-verify, and proceed to the next slice without pausing for
confirmation between slices, same as every closed `SOURCE-SHELL`/`SOURCE-APPROVAL-UX` item
above.

## Blocked

None open.
