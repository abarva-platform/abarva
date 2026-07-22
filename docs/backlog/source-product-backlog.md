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
  recommendation point 1 only (first-viewport fact hierarchy). Direct code inspection found
  slice 1 actually shipped more of points 2-4 than initially assumed (evidence/audit
  disclosures, disabled-until-ready Approve, overflow menu for secondary actions already
  exist). What's genuinely still open — real governance history in the audit disclosure, an
  evidence freshness signal, and a verification-first closing pass — is
  `SOURCE-APPROVAL-UX-002` through `004` below.

### SOURCE-APPROVAL-UX-002 — Governance history in the audit disclosure

- **Problem statement**: **correction to an earlier version of this entry** — direct
  inspection of `EventApprovalCard.tsx` shows slice 1 already shipped both a collapsed evidence
  disclosure (`data-testid="source-approval-evidence-disclosure"`, summary shows
  `Evidence reviewed · N facts`) and a collapsed audit disclosure
  (`data-testid="source-approval-audit-disclosure"`, summary shows
  `Intake audit trail · N turns`) — the "build a collapsed drawer" work this entry originally
  described is already done. The real, verified gap: the audit disclosure only renders
  `IntakeChatTrail` (intake conversation turns) — it never queries or shows the
  `SOURCE-SHELL-003` `source_event_approvals` ledger or the `SOURCE-SHELL-004`
  `source_artifact_acceptances` records, even though the recommendations doc explicitly asked
  for "prior approvals, acceptances, and reviewer notes" together in this drawer.
- **User/business impact**: an approver reviewing this event's governance history sees only
  the intake conversation, not who approved prior stage gates or accepted which artifacts as
  authoritative — the two features shipped earlier this session are invisible on the one page
  where a reviewer would most want to see them.
- **Severity**: P5 (workspace UX / decision clarity)
- **Workstream**: Approval/authority/lineage controls
- **Status**: `Merged — live-proven`. PR
  [#5299](https://github.com/abarva-platform/abarva/pull/5299), merged as `cc81e1b`.
  ACA deploy run `29917417511` succeeded; live signed-in proof captured on the SkyHarbor
  Source approval page. The tested live event had no prior stage approvals or artifact
  acceptances, so the proof confirms the honest empty state in production; render tests cover
  populated approval-ledger and artifact-acceptance rows.
- **Dependencies**: none — `loadApprovalLedger()` (`SOURCE-SHELL-003`) and
  `listArtifactAcceptances()`/`getLatestArtifactAcceptancesByArtifactIds()`
  (`SOURCE-SHELL-004`) already exist and are already tested; this wires existing repository
  functions into an existing disclosure, no schema change.
- **Acceptance criteria**: the existing audit disclosure (or a clearly-labeled adjacent one, if
  mixing intake chat with governance history reads badly) shows real approval-ledger rows and
  real artifact-acceptance records for the event, alongside the existing intake chat turns; an
  honest empty state when none exist yet (matching this session's established pattern — never
  fabricate placeholder rows); the existing intake-chat content is not removed, only
  supplemented.
- **Required tests**: render test confirming real ledger + acceptance data appears when
  present; honest-empty-state test when absent; existing `EventApprovalCard.test.tsx` cases
  must still pass unmodified in behavior.
- **Discovered from**: `docs/codex-handoff/SOURCE_P1_APPROVAL_UX_RECOMMENDATIONS_2026-07-22.md`,
  recommendation point 2 — corrected against actual code state 2026-07-22 after an initial,
  inaccurate version of this entry assumed no disclosure existed yet.
- **Execution instructions** (apply to `002` and `003` together): these touch two different,
  independent disclosures with no shared state — run them as two parallel work threads rather
  than serially, land as one integration PR or two, whichever is cleaner. Once each slice
  passes full local validation (typecheck, lint, tests, `release:check`), merge and deploy it
  without pausing to ask first — standing authority for this workstream, matching every other
  `SOURCE-SHELL`/`SOURCE-APPROVAL-UX` item this session. After deploying, capture live
  signed-in proof, update this entry's status, and move to `004` without stopping for
  confirmation. Real stop conditions: a database migration, a change to existing approval
  permissions/payload semantics, or a validation failure that isn't a simple fix.

### SOURCE-APPROVAL-UX-003 — Evidence freshness signal

- **Problem statement**: **correction to an earlier version of this entry** — the evidence
  disclosure already exists and already shows a count (`Evidence reviewed · N facts`); the
  originally-described "build a drawer" task is done. The real, verified gap: neither
  `EventApprovalCard.tsx`'s disclosure summary nor `IntakeFactsReview.tsx` (grepped directly,
  zero hits for any date/timestamp/freshness field) shows any recency signal — the
  recommendations doc specifically asked for "counts **and freshness signals** visible" while
  collapsed, and only the count half exists today.
- **User/business impact**: an approver can't tell, without expanding the disclosure, whether
  the evidence behind this approval is current or stale.
- **Severity**: P6 (workspace UX polish)
- **Workstream**: Approval/authority/lineage controls
- **Status**: `Merged — live-proven`. PR
  [#5299](https://github.com/abarva-platform/abarva/pull/5299), merged as `cc81e1b`.
  ACA deploy run `29917417511` succeeded; live signed-in proof confirms the collapsed evidence
  summary shows the event-level `updated_at` freshness signal (`Evidence reviewed · 5 facts ·
updated 19 d ago` on the proof event).
- **Dependencies**: none — check what timestamp field is actually available on captured
  intake facts (likely `capturedAt`/`updatedAt` on the underlying fact record; verify the real
  field name before assuming one) and surface it, no schema change if one already exists.
- **Acceptance criteria**: the evidence disclosure's collapsed summary shows a freshness signal
  (e.g. "updated 2 days ago" or the most-recent capture date) alongside the existing fact
  count; if facts have materially different capture dates, show the most-stale one (worst
  case, not best case) so the signal is honest about what an approver should actually verify.
- **Required tests**: render test confirming the freshness signal appears with real data;
  confirm it reflects the most-stale fact when facts have mixed dates.
- **Discovered from**: `docs/codex-handoff/SOURCE_P1_APPROVAL_UX_RECOMMENDATIONS_2026-07-22.md`,
  recommendation point 2 — corrected against actual code state 2026-07-22.
- **Execution instructions**: same as `SOURCE-APPROVAL-UX-002` — build in parallel with `002`,
  merge/deploy/live-verify without pausing, then continue to `004`.

### SOURCE-APPROVAL-UX-004 — Acceptance-criteria verification pass

- **Problem statement**: **correction to an earlier version of this entry** — the originally
  proposed "footer action bar + checkout-style gating" slice is, on inspection, already
  substantially shipped: `Approve` is already `disabled={!actionReady}`, blocker copy already
  surfaces in the approval brief's "Next required step" strip, and the footer already
  distinguishes a primary action (Approve) from lower-frequency ones (Request changes/Reject
  already sit inside an "Other decisions" `<details>` overflow, "Send to co-approver" as the
  visible secondary). What's actually unverified is whether this already-shipped shape
  satisfies the recommendations doc's 5 explicit acceptance criteria (5-second scan test, ≤1
  primary + 1 secondary action visible in the first viewport, required confirmations visible
  without scrolling, evidence/audit reachable within one click, no unrelated
  future-stage/artifact-maintenance content shown by default) — nobody has checked this against
  the real, deployed page.
- **User/business impact**: without this pass, "done" is asserted per-slice but never confirmed
  against the original design intent as a whole, and `002`/`003` land without knowing whether
  they've actually closed the gap.
- **Severity**: P5 (workspace UX / decision clarity, closing verification)
- **Workstream**: Approval/authority/lineage controls
- **Status**: `Merged — live-proven`. PR
  [#5299](https://github.com/abarva-platform/abarva/pull/5299), merged as `cc81e1b`.
  Live signed-in proof confirmed all 5 acceptance criteria on the deployed Source approval
  page: approval object and primary action visible, only one primary + one direct secondary
  approval action visible, required confirmations visible without scrolling, evidence/audit
  reachable within one click, and no unrelated future-stage or artifact-maintenance content
  shown by default.
- **Dependencies**: `SOURCE-APPROVAL-UX-002`, `SOURCE-APPROVAL-UX-003`.
- **Acceptance criteria**: all 5 criteria from the recommendations doc's "Suggested acceptance
  criteria" section checked against the real, deployed page via live signed-in browser proof —
  not asserted from reading the code. For any criterion that fails, make the smallest
  targeted fix that closes it (e.g. if "Request changes" being inside an overflow menu turns
  out to fail the ≤1-primary/1-secondary-action criterion in practice, promote it to a visible
  secondary button — don't rebuild the footer from scratch if it's already close). Confirm
  governed evidence/approvals/artifact-acceptance/audit records are never removed or
  permanently hidden (only collapsed), matching the doc's own stated Non-Goals.
- **Required tests**: whatever's needed for any targeted fix made during this pass; none if all
  5 criteria already pass.
- **Discovered from**: `docs/codex-handoff/SOURCE_P1_APPROVAL_UX_RECOMMENDATIONS_2026-07-22.md`,
  "Suggested acceptance criteria" + "Non-Goals" sections — corrected against actual code state
  2026-07-22 (originally split across two entries, `004`/`005`, on the wrong assumption that
  the footer/gating work hadn't started; consolidated into one verification-first pass).
- **Execution instructions**: this is the closing slice — verify first, fix only what's
  genuinely failing, merge/deploy/live-verify without pausing between any targeted fixes. After
  it passes, update the "Ready / in progress" section below to reflect closure, or note
  honestly what's still open if a criterion doesn't pass and isn't a small fix.

### SOURCE-UX-DECLUTTER-001 — P0 approvals bugs + first Stripe-style declutter pass

- **Problem statement**: a broad 5-area UI/UX audit (UI/UX quality, aVa chat analytics
  capability, artifact narrative quality, guidebook content, upload/persistence) found real
  bugs and clutter in the Source event canvas. This entry covers batch 1: two confirmed P0
  bugs in the per-event Approvals workspace, and a first Stripe-style decluttering pass
  (reduce repeated/redundant content, keep all functionality) per direct user instruction to
  fix incrementally rather than batch everything into one large change.
- **User/business impact**: the Approvals tab showed other events' pending items mixed in with
  no explanation and rendered its own featured card twice — undermines trust in the one
  surface that most needs to be unimpeachable. The Evidence ledger repeated an internal QA
  sentence 25+ times and always showed all 11 stages/33 artifact standards regardless of which
  stage the user was viewing — reads as noise and alarm rather than progress.
- **Severity**: P0 (approvals bugs) / P2 (declutter)
- **Workstream**: Workspace UX
- **Status**: `Merged — live-proven`. Live signed-in verification confirmed: exactly one
  approval card per event (no duplicate, no cross-event mixing), the "Go to steps to decide"
  button correctly switches tabs, the stage-relative progress line and "Show all 11 stages"
  toggle render with real data.
- **Dependencies**: none.
- **Acceptance criteria**: Approvals workspace shows only this event's items, never renders
  the featured item twice; the featured stage-gate card's CTA switches to Steps instead of
  linking to the page already open; the Evidence ledger's per-row "not scored" boilerplate is
  shown once (already-existing summary line) instead of per-row; the artifact-standards table
  defaults to the viewed stage with a one-click "show all 11 stages" toggle; the quality-score
  KPI leads with a stage-relative "N of M artifacts due so far are registered" line. All met.
- **Required tests**: new regression test in `source-event-shell-v2.test.ts` (cross-event
  exclusion + no duplicate); new test in `SourceAnalyticsCanvas.approvalLedger.test.tsx` (real
  render, CTA behavior); 2 existing `SourceAnalyticsCanvas.chat.test.tsx` cases updated for
  the new default stage-scoping (not weakened — they now explicitly toggle to all-stages,
  matching what they were actually testing).
- **PR**: [#5322](https://github.com/abarva-platform/abarva/pull/5322), squash-merged as
  `1d01c16d82c8eee057a32bfe6ba2922c09d15cfd`.
- **Discovered from**: 5 parallel-agent audits launched from a direct user request to evaluate
  UI/UX quality, aVa chat analytics capability, artifact narrative quality, guidebook content,
  and upload/persistence. One reported finding (the "✦ Intelligence" tab silently redirecting
  out of Source) was live-tested and disproven before any code was touched — recorded in the
  release record so it isn't rediscovered as a false lead later.
- **Notes / remaining gaps**: this is batch 1 of a larger incremental sequence. Follow-on
  batches, not yet started: `SOURCE-UX-002` (Files tab / lifecycle matrix further polish if
  needed after live use), `SOURCE-ANALYTICS-CHAT-001` (wire aVa chat to the existing
  `AgentAnswerRenderer`/Recharts pipeline — infrastructure already proven on Home/Intelligence/
  Tower, just unused by Source), `SOURCE-ARTIFACT-QUALITY-001` (expand the narrative-quality
  LLM-judge rubric beyond the one hard-gated artifact code), `SOURCE-GUIDEBOOK-004`
  (per-client guidebook content using the already-existing but unused `client_key` override
  column), `SOURCE-INGEST-001` (dedicated workshop/session-notes capture surface + a
  parse worker for PDF/XLSX/PPTX uploads currently stuck at `parse_status: "pending"` with no
  consumer).

### SOURCE-ANALYTICS-CHAT-001 — Wire Source's aVa chat to the AgentAnswerRenderer pipeline

- **Problem statement**: Source's chat surfaces (in-canvas `AvaBottomBar`, portfolio
  `SourceEventsAgentDockView`) only stream raw prose. A real, already-live chart/table
  rendering pipeline (`AgentAnswerRenderer`, driven by an `AvaAnswerPacket`) already works in
  production on Home and Intelligence — Source just never builds a packet to hand it.
- **User/business impact**: real, already-computed Source analytics (vendor response
  coverage, value waterfall, artifact quality/lifecycle) can only be seen on their own canvas
  panels — aVa chat can't answer a question like "how are vendors doing on coverage?" with
  an actual table, only prose.
- **Severity**: P3 (real capability gap, highest-leverage item from the 6-area UX audit)
- **Workstream**: Analytics / aVa chat
- **Status**: `Shipped — deployed and live-proven`. First slice built: vendor
  response-coverage only (value waterfall and artifact-quality answers are explicit follow-on,
  not in this slice). See
  `docs/releases/records/2026-07-22-source-vendor-coverage-governed-chat-answer.md` for the
  full build record, including the honest `retrievability: "not_indexed"` /
  `requireAgentReady: false` limitation this data class hits under the current governance
  model. **Correction (same day, caught during live-verify)**: the initial client wiring
  targeted `UniversalCanvasShell.tsx`/`AvaBottomBar.tsx`, which turned out to be unmounted
  dead code — the real live Source event chat is the platform-wide
  `AtlasPageStateProvider`/`AgentColumn` (rendered by `AppShell` on every page). See
  `docs/releases/records/2026-07-22-source-vendor-coverage-live-surface-fix.md` for the
  follow-up that moves the NDJSON request + `AgentAnswerRenderer` rendering to the real
  surface; `UniversalCanvasShell`/`AvaBottomBar` remain in the tree as confirmed dead code,
  flagged as cleanup debt, not deleted in this pass. Below is the original
  architecture-decision grounding this build resolved:
  1. **No dormant transport exists.** Source's chat calls `/api/chat/agent`
     (`src/app/api/chat/agent/route.ts`, ~3630 lines, shared by many non-Source surfaces) —
     this route streams plain text only, with no NDJSON `agent-answer` event mechanism. The
     real, proven `AvaAnswerPacket` pattern lives entirely on the separate
     `/api/intelligence/ask` NDJSON route (Home + Intelligence), which Source does not call.
     Building this means either retrofitting the large shared route (broad blast radius) or
     adding a new Source branch to the Intelligence-ask route (new code, not flipping on
     something latent) — both are real builds, not toggles. **Resolved**: neither — the
     event-canvas chat calls its own `/api/v1/source/[eventId]/nexus/ask` route (not
     `/api/chat/agent`), which got a new opt-in NDJSON branch instead, leaving both existing
     shared routes untouched.
  2. **A real governance gap was found and deliberately NOT fixed here** — see
     `docs/governance/CONTEXT_CORPUS_ENFORCEMENT_TRACKER_2026-06-08.md`'s "Known gap
     (2026-07-22)" section: Home/Intelligence's actual live packet-building path
     (`composeAvaAnswer`/`buildStructuredExhibits`) never calls the mandatory
     `buildValidatedAgentContextBundle` gate — it hardcodes `safety` flags as passed rather
     than deriving them from a real check. Per explicit user decision (2026-07-22): **build
     the new Source chat-answer path as the first surface that actually wires the governance
     gate into a live route** — do not just copy the existing (ungoverned) Home/Intelligence
     pattern for consistency. Retrofitting Home/Intelligence's existing routes is tracked as
     separate, deliberate follow-up work, not bundled into this item.
  3. **`isSourceSurface()` may not even be firing today** — `SourceEventsAgentDockView.tsx`
     sends `surface: 'source/events'` (no leading slash), which doesn't match
     `isSourceSurface()`'s matcher (`src/app/api/chat/agent/route.ts`) — worth fixing
     regardless of which transport path is chosen, since it gates whether Source-scoped
     context/access-policy logic fires at all.
- **Dependencies**: a real implementation plan covering the transport decision and the new
  governance wiring (turning `VendorCoverageView`/waterfall/lifecycle data into
  `GovernedCandidate[]` for `buildValidatedAgentContextBundle`) before any code is written.
- **Acceptance criteria**: TBD — to be finalized in the implementation plan.
- **Discovered from**: the 6-area UX audit's aVa chat/analytics capability finding, then
  deep-grounded before implementation per this session's established discipline (verify
  before building, especially for anything touching the mandatory governance gate).

---

### SOURCE-ARTIFACT-AUTHORITY-001 — One authoritative artifact per event+slot, consumed everywhere downstream

- **Problem statement**: Source has a real, working artifact-authority resolver
  (`resolveAuthoritativeArtifact()` in `src/lib/source/client-final-artifacts.ts`) and a real
  precedence order (client-final → explicit acceptance → current-authoritative →
  approved/locked → generated → any). It is correctly wired into the client-final route and
  the artifact render route's client-final short-circuit, and into two aVa-adjacent modules
  (`ava/mode-grounding.ts`, `source-answer-engine.ts`). But it is **not** the single downstream
  authority layer yet — several real consumers still read raw/unscoped artifact records
  instead of resolving through it, so a superseded or generated draft can still surface as if
  it were current in some surfaces even after a client-final has been accepted.
- **User/business impact**: A reviewer or downstream system (chat, Files list, direct
  download, Deal Pack) can be shown or can retrieve a stale/generated version of an artifact
  the client has already superseded with an accepted final — the exact trust failure the
  client-final acceptance flow (`SOURCE-SHELL-004`, PR #5114) exists to prevent.
- **Severity**: P4 (evidence-integrity / lineage-controls class — priority tier 4 in this
  backlog's ordering)
- **Workstream**: Deliverable/content quality, evidence integrity
- **Status**: `Needs Owner Decision` — see reconciliation table below for what's already
  fixed vs open, and the recommended next single PR.
- **Reconciliation method**: inspected `origin/main` directly (not assumed from memory),
  confirmed via `git grep` which real call sites already import
  `resolveAuthoritativeArtifact`/`client-final-artifacts.ts`, and read the actual route bodies
  for the two most consequential findings (render-route format-mismatch fallback,
  nexus/ask's un-scoped evidence context) rather than taking the audit claims at face value.

**Reconciliation table** (state as of `main` @ `d5610a737`, 2026-07-22):

| # | Item | Already fixed on `main`? | Open gap | Proposed PR scope | Tests | Deploy proof needed |
|---|---|---|---|---|---|---|
| 1 | Artifact Authority Resolver (one artifact per event+slot, with audit history) | **Partially.** `resolveAuthoritativeArtifact()` exists and is correct (client-final → acceptance → current-authoritative → approved/locked → generated → any, tie-broken by acceptedAt/updatedAt/createdAt then version). No slot-grouping variant exists on `main` yet. | No `resolveAuthoritativeArtifactSlots()` — nothing returns "one winner + audit history" per event×artifact-code today. | Land the worktree's additive `resolveAuthoritativeArtifactSlots()` + `sourceOrigin` fallback (see below) as its own reviewable diff, or bundle with #2 (they're one coupled change in the current worktree). | Worktree already has 68 new lines of test coverage in `client-final-artifacts.test.ts` (uncommitted) — verify they assert slot-collapse + history ordering + `sourceOrigin` fallback explicitly. | None (pure lib addition, no route behavior changes by itself). |
| 2 | aVa / Source ask authority slice | **Not fixed.** `nexus/ask/route.ts`'s `loadSourceEventArtifactContext()` builds `artifactEvidence`/chunks/facts from **all** artifact rows for the event, unscoped by authority — confirmed by direct read of `main`'s `route.ts` (no `resolveAuthoritativeArtifact` import at all). | Superseded/generated-draft chunks and facts can outrank or sit alongside client-final evidence in what aVa cites. | The worktree's uncommitted diff to this exact function already closes this: resolves per-slot winners, scopes `chunks`/`facts`/`artifactEvidence` to only authoritative artifact ids, and adds a bounded (`slice(0, 8)`) "audit-only lineage" evidence entry for superseded artifacts so they're citable as history but not as substantive evidence. Verified this diff touches a different region of `route.ts` than PR #5350's NDJSON branch — low rebase-conflict risk. | Worktree ran `npm test -- --runInBand client-final-artifacts.test.ts artifact-lifecycle-matrix.test.ts mode-grounding.test.ts` — PASS. Add a route-level test asserting a superseded draft's chunk text never appears in `artifactEvidence` when a client-final sibling exists. | Live signed-in: ask aVa about an artifact stage that has both a superseded generated draft and an accepted client-final; confirm the answer/citations trace only to the final. |
| 3 | Files API/listing unification | **Not fixed.** `src/app/api/v1/source/events/[eventId]/artifacts/route.ts` has zero references to the resolver — confirmed via `git grep`. | Durable + fallback-generated rows for the same slot can both render in the Files list without collapsing to one authoritative row + a visible history affordance. | Separate PR, after #1/#2 land: wire this route through `resolveAuthoritativeArtifactSlots()`; preserve the existing `includeHistory` query param's raw-row behavior for audit mode. | New route test: same-slot durable+generated rows collapse to one row by default; `includeHistory=true` still returns all rows. | Live signed-in: Files tab for an event with a superseded draft + accepted final shows one row, with history reachable via the existing history affordance. |
| 4 | Render/export authority slice — format-mismatch honesty | **Partially fixed, one confirmed real gap.** The render route (`.../[artifactCode]/render/route.ts`) already calls `resolveAuthoritativeArtifact()` and short-circuits to the client-final file **only when the requested format exactly matches the stored final's format** — confirmed by reading `streamClientFinalIfAvailable()` directly: `if (authoritative.fileFormat !== requestedFileFormat) return null;`. When it returns `null`, the caller (`if (clientFinalResponse) return clientFinalResponse;`) **silently falls through** to the normal generated-render path with no signal that a client-final exists in a different format. | A DOCX client-final + a `?format=pdf` request silently returns a freshly generated PDF draft, indistinguishable in the response from a case where no final exists at all. | Add an explicit branch: when `resolveAuthoritativeArtifact()` finds a client-final artifact but its format doesn't match the request, either (a) transcode/convert from the stored final rather than regenerating from scratch, or (b) return a clear 409/422 `{error: "client_final_format_mismatch", availableFormat, requestedFormat}` instead of silently generating. Standardize `x-source-artifact-authoritative` / governance-stage headers on every branch (client-final hit, mismatch, and generated-fallback) so callers can always tell which case fired. | New test: client-final exists as DOCX, request `?format=pdf` → asserts the new explicit behavior (not a silent generated-draft 200). | Live signed-in: request a client-final artifact in its stored format (should stream the real file) and in a mismatched format (should show the new explicit signal, not a silently-generated draft). |
| 5 | Direct artifact download authority | **Not fixed.** `src/app/api/v1/source/artifacts/[artifactId]/download/route.ts` has zero references to the resolver — confirmed via `git grep`. | A direct download link to a generated-draft artifact id still streams that draft even when a client-final sibling for the same slot exists and the caller didn't explicitly ask for history. | Separate PR: resolve the requested id's slot, and if a more-authoritative sibling exists and the request isn't in explicit history mode, redirect/serve the authoritative sibling instead (with a clear indicator that a substitution happened). | New test: generated-draft id + client-final sibling in the same slot → returns/redirects to the final; explicit history-mode request still returns the originally-requested draft id. | Live signed-in: old draft download link for an artifact that has since gone client-final resolves to the final, not the stale draft. |
| 6 | Deal Pack authority | **Not fixed.** `assemble-deal-pack.ts` reads `ctx.artifactStates` directly (confirmed via `git grep` — zero resolver references) rather than resolving through the shared authority layer or consulting File Cabinet client-final blobs. | Deal Pack can assemble from generated-draft context even when a client-final exists for the same artifact slot. | Separate PR, sequenced after #1: thread `resolveAuthoritativeArtifactSlots()` output into the Deal Pack assembler; client-final wins over `ctx.artifactStates` for any slot where both exist. | New test: Deal Pack output for a slot with both a superseded AI draft and an accepted client-final uses the final's content, and the draft appears (if at all) only as labeled audit history. | Live signed-in: generate a Deal Pack for an event with a mixed final/draft artifact set; confirm the final's content appears and the draft doesn't silently substitute. |
| 7 | Governance label unification | **Partially fixed.** `src/lib/source/artifact-governance.ts` is already established this session (see `SOURCE-SHELL` slices above) as the canonical governance-stage/banner source, consumed by the 4 structured artifact families and by the render route's client-final path. `source-answer-engine.ts` has a **duplicated, hand-synced** precedence re-implementation (with an explicit code comment acknowledging the duplication risk: *"must stay identical so this surface never disagrees... Update both together"*) rather than calling the shared resolver directly — confirmed by reading the file. | Real (small, contained) drift risk: a future edit to `resolveAuthoritativeArtifact()`'s precedence order without the matching manual update in `source-answer-engine.ts` would silently desync aVa's answer-engine artifact selection from every other surface. | Separate, small PR: since `source-answer-engine.ts` parses regex-extracted prose evidence (not typed DB rows), either (a) normalize those records into the typed `AuthoritativeArtifactCandidate` shape early and call the real resolver, or (b) if that's not feasible without a larger refactor, add a unit test that runs both implementations against the same fixture set and asserts identical winners — turning the comment's promise into an enforced invariant. | New test: parallel-fixture equivalence test between `resolveAuthoritativeArtifact()` and the answer-engine's local logic (option b), or a call-site test if refactored to option (a). | None required for option (b) (test-only); live signed-in re-verification of aVa answers if refactored to option (a). |
| 8 | Safe repair/regenerate old persisted drafts (`d01_strategy_memo` CONTENT BLOCKERS 3) | **Not fixed.** This is existing, already-identified debt from PR #5126's live-proof pass — the generation-hygiene sanitizer added there only prevents *future* generated drafts from carrying internal/mechanical terms; it does not touch already-persisted bodies. | The specific persisted `d01` artifact still fails content-blocker checks and has no safe repair/regenerate path that respects the locked/superseded-content rule. | Separate PR: a targeted, explicit "safe regenerate" action (not a silent overwrite) for a locked/superseded artifact — must produce an audit receipt and a before/after content-QA diff, and must not run automatically for any artifact the user hasn't explicitly selected. | New test: regenerate action on a locked artifact requires explicit confirmation, produces an audit row, and the before/after diff is captured. | Live signed-in: run the safe-regenerate action on the actual affected `d01` artifact and confirm the audit receipt + clean content-blocker result. |
| 9 | Artifact prompt/workflow maturity by phase (d06, d08, d10, d12–d33 partial) | **Not assessed in this reconciliation pass** — real, large, multi-artifact-code scope explicitly called out by the requester as its own sequenced backlog (Pricing d19–d21 → Responses d13–d15 → Evaluation d16–d18 → Transition d29–d31 → Value d32–d33). | Prompt/workflow coverage gaps per the requester's own priority order. | Do not bundle with #1–#8. Scope and sequence as its own set of future backlog entries once #1–#7 (the authority-layer foundation) are live, since new per-phase artifact work should generate against the corrected authority model from day one rather than needing a second migration later. | TBD per artifact family, at scoping time. | TBD per artifact family, at scoping time. |

**Partial worktree disposition** (`/Users/anand/Projects/nexus-source-artifact-governance-20260722`,
branch `codex/source-artifact-governance-unification`, based on `main` @ `3f34e1723` — 4 commits
behind current `main` as of this reconciliation):

- **Decision: KEEP, rebase, and ship as the next PR.** The uncommitted diff is real, additive,
  and directly closes reconciliation items #1 and #2 together (they are one coupled change in
  this worktree — the slot-resolver extension exists specifically to serve the `nexus/ask`
  scoping change). Read the full diff directly (not just the worktree's own self-report):
  `client-final-artifacts.ts` gets a purely-additive `sourceOrigin` fallback field and a new
  `resolveAuthoritativeArtifactSlots()` export (existing `resolveAuthoritativeArtifact()`
  signature and behavior unchanged for every existing caller); `nexus/ask/route.ts`'s
  `loadSourceEventArtifactContext()` is rewritten to scope chunks/facts/primary evidence to
  authoritative-only artifact ids, with superseded artifacts demoted to a bounded, clearly
  labeled "audit lineage" evidence entry rather than dropped or left indistinguishable from
  live evidence.
- **Real risk found and already checked**: this worktree's `nexus/ask/route.ts` diff and PR
  #5350 (`fix(source): render governed vendor-coverage answer in the real AskAnythingBar` — do
  not confuse with the different, also-merged PR #5341, `feat(source): first governed
  structured chat answer`) both touch this same file. Direct diff comparison confirms they
  touch different, non-overlapping regions (PR #5350/#5341's changes are in `POST()`'s
  top-level NDJSON branch near the top of the file plus a new import; the worktree's diff is
  entirely inside `loadSourceEventArtifactContext()` and two new helper functions near the
  bottom) — rebase conflict risk is low, but must be verified for real by actually rebasing,
  not assumed from this description.
- **Before shipping**: (1) rebase the worktree branch onto current `origin/main` (currently 4
  commits behind — includes both merged Source PRs from this session); (2) install a complete
  dependency tree (`npm install`, not a `node_modules` symlink) so `tsc --noEmit` runs clean
  without the `@xyflow/react`/`@dagrejs/dagre` false-missing-module errors this session hit
  from a partial symlinked `node_modules` — needed to trust a clean typecheck result, not just
  the targeted Jest run the worktree already passed; (3) re-run the full targeted test set
  post-rebase; (4) write the release record documenting reconciliation items #1 and #2 as this
  PR's real scope (do not silently expand it to cover #3–#9 in the same PR).
- **Do not classify the `nexus-api-live-context` "AbarVa generated" vs "AbarVa-generated"
  wording mismatch as a regression from this diff without an explicit before/after check** —
  the worktree's own validation notes correctly flag this as needing verification, not
  assumption, before either fixing it in this PR or filing it separately.

**Recommended next single PR**: reconciliation items **#1 + #2 together** (the worktree's
existing diff, rebased) — `SOURCE-ARTIFACT-AUTHORITY-001a`. This is the true dependency root:
every other open item (#3 Files listing, #5 download, #6 Deal Pack) either directly imports
`resolveAuthoritativeArtifactSlots()` or should, so shipping it first — narrowly scoped to the
one route it's already wired into — gives every subsequent slice a real, tested primitive to
build on rather than each slice re-deriving slot-collapse logic independently. Item #4
(render-route format-mismatch honesty) is real and worth fixing but is independent of #1/#2 and
should be its own follow-on PR, not bundled in. Items #3, #5, #6 are explicitly sequenced after
#1/#2 land (per the requester's own execution order) and should each be their own PR. Items #7
and #8 are small, independent, and can be picked up opportunistically. Item #9 (per-phase prompt
maturity) is deliberately out of scope for the authority-layer work entirely.

---

## Ready / in progress

`SOURCE-UX-DECLUTTER-001` batch 1 is merged and live-proven; `SOURCE-ANALYTICS-CHAT-001`
(vendor-response-coverage governed chat answer) is merged, deployed, and live-proven on
`app.abarva.ai` as of 2026-07-22. `SOURCE-ARTIFACT-AUTHORITY-001` is next — start with the
`#1 + #2` slice (`SOURCE-ARTIFACT-AUTHORITY-001a`: rebase and ship the existing
`/Users/anand/Projects/nexus-source-artifact-governance-20260722` worktree diff), per its own
reconciliation table and recommended-PR section above. After that: `SOURCE-ARTIFACT-QUALITY-001`,
`SOURCE-GUIDEBOOK-004`, `SOURCE-INGEST-001`. Continue the same standing authority already
established this session for contained, low-risk changes: merge, deploy, and live-verify
without pausing for confirmation between batches. Real stop conditions remain: a database
migration, a change to existing permissions/payload semantics, a broad-blast-radius change to
widely-shared code (like the chat-answer transport decision above), or an unfixable
validation failure.

## Blocked

None open. (Separately tracked, not blocking Source: the Home/Intelligence chat-governance
gap in `docs/governance/CONTEXT_CORPUS_ENFORCEMENT_TRACKER_2026-06-08.md`'s "Known gap
(2026-07-22)" section — flagged, not fixed, per explicit user decision to keep it as its own
follow-up rather than bundle it into `SOURCE-ANALYTICS-CHAT-001`.)
