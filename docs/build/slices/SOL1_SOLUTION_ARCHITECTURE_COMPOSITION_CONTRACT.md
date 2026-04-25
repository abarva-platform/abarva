# SOL1 · Solution Architecture Composition Contract

Slice ID: SOL1
Slice name: Solution Architecture Composition Contract
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-25
Author: Code (sole)
Type: Specification / contract document only — no application code,
no runtime modification, no migrations, no model calls.

This contract governs how AbarVa composes a **client-specific
solution architecture** from the client's current-state context,
the AbarVa pattern library, the AbarVa solution component library,
workshop findings, evidence, constraints, SME / client alignment,
and (in future runtime) LLM-assisted synthesis.

The architecture is the bridge between *what we have learned about
the client* and *the decision-grade deliverables we put in front of
the steering committee*. It is never a stock template. It is always
composed for the client in front of us.

---

## A. Purpose and scope

AbarVa programs end in decisions: charter sign-off, design approval,
go / no-go on funding, executive readout, business-case approval.
Every one of those decisions rests on a **solution architecture**
that the client recognizes as their own — grounded in their tools,
their team, their metrics, their constraints, their target outcomes.

The Solution Architecture Composition Contract defines:

- The **inputs** Nexus must compose (the Solution Context Bundle).
- The **library** Nexus draws from (patterns + solution components).
- The **composition flow** from raw context to decision-grade
  deliverable.
- The **three composition styles** (pattern-driven, LLM-composed,
  SME-validated) and when each is acceptable.
- The **agent role partition** across Nexus, Sentinel, Steward,
  Atlas.
- The **honest-fallback behavior** when inputs are missing.
- The **versioning** of architectures across workshop refinement
  loops.
- The **deliverable outputs** an approved architecture must produce.

This slice is **documentation only**. It does not modify the
runtime, the database, the auth layer, the agent runtime, or any
product UI. SOL2 onward implement the surface.

---

## B. Pattern vs. solution component vs. architecture vs. deliverable

These four concepts are routinely conflated. The contract states
them explicitly and treats the distinctions as load-bearing.

### Pattern

A **pattern** is a generic *shape of the problem*. It is
client-agnostic. It is detected, not composed.

Examples (canonical PF1 / I1 keys):

- `value_ledger_incompleteness` — programs without a value capture
  posture.
- `evidence_chain_gap` — programs without traceable evidence.
- `gate_governance_gap` — programs missing G1 / G2 / G3 / G4
  inputs.
- `program_context_sparsity` — programs running on assumptions.
- `ai_governance_operating_model_gap` — multiple programs sharing
  the same governance / gate / evidence / value gaps.

Patterns are owned by the AbarVa pattern library (PF1) and detected
by Sentinel (I1). They guide composition; they are not the
composition.

### Solution component

A **solution component** is a *reusable building block* of an
operating model. It is also client-agnostic. Components are owned
by SOL2 (the AI-led PDLC component pack is the first canonical
catalog).

Examples:

- `ai_code_review` — agent-driven pull-request review with
  human-in-loop approval.
- `spec_to_code` — spec-anchored code generation with ADR capture.
- `release_risk_intelligence` — model-assisted release risk scoring
  feeding the change-approval gate.
- `engineering_coach_agent` — per-engineer coach surfacing skill
  drift and adoption posture.
- `value_ledger_for_pdlc` — DORA + adoption + outcome telemetry
  bound to the program's value ledger.

Components carry a definition, required inputs, agent integration
points, telemetry hooks, evidence requirements, and
adoption-measurement guidance. Components are *available*; whether
a given component is *selected* for a specific client is a
composition decision.

### Architecture

A **solution architecture** is the *composed, client-specific
design*. It selects a subset of solution components, sequences
them into a phased operating model, names the integration points
into the client's existing tools and processes, and ties every
component back to a target business KPI.

The architecture is owned by Nexus. It carries a version (see §I)
and is always anchored to at least one composition style (see §F).

### Deliverable

A **deliverable** is an *artifact produced from the architecture*
and put in front of a human decision-maker. Canonical deliverables:

- Solution architecture document (HTML / Markdown render).
- Operating model document.
- Roadmap (phase-by-phase plan).
- Decision memo (named decisions + sponsor sign-off).
- Business case (value ledger + ROI).
- Executive readout (Atlas brief composed for steering committee).

Deliverables are owned by the PDEL contract (program deliverables
artifact read model). Every deliverable carries provenance back to
the architecture version it was rendered from.

### Stated principle

> **Pattern ≠ Solution Architecture.** Patterns guide; architecture
> is composed for the client.

The platform never auto-promotes a pattern detection or a stock
solution component into a decision-grade deliverable. The
architecture is always the intermediate step where client context
+ patterns + components are *composed* into something the client
can sign.

---

## C. Solution Context Bundle categories

For Nexus to compose an architecture honestly, it must assemble a
**Solution Context Bundle** from the inputs below. Every category is
explicit; missing categories must be surfaced (per §H) rather than
papered over.

### C.1 Client context

- Industry / sub-industry.
- Scale (revenue, headcount, geography).
- Geographic footprint (regions, regulated markets).
- Regulatory regime (e.g., HIPAA, SOX, PCI, GDPR, FedRAMP, OCC).
- Ownership (public, PE-owned, family).

### C.2 Current-state ways of working

- Org structure (functions, reporting lines, decision rights).
- Workflow shape (intake, planning, build, release, run).
- Tooling already in place across the SDLC.
- Human-in-loop posture (where approvals live today).
- Cultural posture toward AI / automation.

### C.3 Tech stack / tools

- Engineering apps (IDE, code host, CI, CD, observability).
- Vendor catalog (commercial software in the SDLC + ops chain).
- Infra posture (cloud account model, network, identity).
- Data platform (warehouse, lakehouse, governance layer).

### C.4 DORA / baseline metrics

- Deployment frequency.
- Lead time for changes.
- Change-failure rate.
- Mean time to recovery (MTTR).
- Per-team or per-product variance, where measurable.
- Source of truth (manual roll-up, telemetry, vendor dashboard).

### C.5 Engineering / persona context

- Team size and shape (squads, platform team, SRE).
- Skill profile (languages, frameworks, AI fluency).
- On-call posture (rotations, escalation, incident pattern).
- Engineering manager span and review posture.
- Velocity expectations from the business.

### C.6 AI adoption data

- Copilot adoption (seats licensed vs. seats active).
- Claude Code adoption (pilot, team, org-wide).
- Codex / other model adoption (production vs. shadow IT).
- Agent surface adoption (review, test, release, ops).
- Current effective usage (events per active developer per week).
- Known shadow-IT usage of public LLMs.

### C.7 Security / compliance constraints

- Regulatory regime (re-stated from C.1 with controls implication).
- Audit posture (last audit, open findings, owner).
- Data classification (public / internal / confidential / regulated).
- Data residency requirements.
- Secrets management posture.
- Third-party model usage policy.

### C.8 Target outcomes

- Named business KPIs the program is accountable for.
- Baseline value (today).
- Target value (program-end).
- Owner (executive accountable for the KPI).
- Telemetry source.

### C.9 Applicable patterns (from PF1 / I1)

- Active pattern detections for the tenant.
- Severity and confidence per detection.
- Affected programs and source signals.
- Recommended interventions (deterministic seed, not synthesized).

### C.10 Workshop findings (from MW1 / MW2)

- Decisions captured in the room.
- Risks raised.
- Objections logged (and by whom).
- Missing inputs surfaced during the session.
- Stakeholder alignment (who agreed to what, in their own words).
- Follow-up actions captured by the Maestro.

### C.11 Existing deliverables / decisions

- Prior charters, design memos, ADRs, business cases.
- Prior gate sign-offs and the conditions they carried.
- Prior architecture versions for the same program.

### C.12 Missing inputs (the explicit "we don't have this yet" list)

- Per-category list of inputs the platform expects but does not
  yet have.
- Per-input reason (not collected / requested but pending /
  blocked by access).
- Per-input owner (who must produce it next).

The missing-inputs list is a **first-class artifact**, not an
afterthought. It is what Steward enforces gates against (§G) and
what Nexus must surface in every honest fallback (§H).

---

## D. AI-led PDLC example (worked example)

To make the contract concrete, the canonical worked example is an
**AI-led PDLC transformation** — the kind of program AbarVa runs
when a client wants to move from manual SDLC to an AI-anchored
product development lifecycle.

### D.1 Current ways of working

- Pull requests reviewed manually by a senior engineer; no
  scorecard.
- No DORA telemetry; release cadence reported by team lead in a
  weekly sync.
- Ad-hoc release process; release manager runs a checklist in a
  Confluence page.
- ADRs written inconsistently; design decisions live in Slack
  threads.
- Test plans authored manually per release; coverage measured per
  team, not per change.
- Security review run as an end-of-quarter sweep, not per change.
- Knowledge transfer happens through tribal pairing, not a
  knowledge graph.

### D.2 DORA metrics (baseline)

- Deployment frequency: ~1 / week per service (variance high).
- Lead time for changes: 9 days p50, 21 days p95.
- Change-failure rate: 18% rolling 90-day.
- MTTR: 4.2 hours p50, 18 hours p95.
- Source of truth today: manual roll-up; only 30% of services
  emit telemetry.

### D.3 DevOps toolchain

- Code host: GitHub Enterprise.
- CI: Jenkins (legacy), partial migration to GitHub Actions.
- CD: ServiceNow change requests, manual release approval.
- Issue tracking: Jira (Cloud).
- Observability: Datadog (50% coverage), New Relic (20%).
- Secrets: HashiCorp Vault.

### D.4 AI tool adoption

- Copilot: ~30% of seats licensed; ~12% effective weekly active.
- Claude Code: pilot in two squads (~40 engineers).
- Codex: licensed, unused (no pattern of adoption).
- Cursor / Windsurf: shadow IT, unmanaged.
- Public ChatGPT: heavy shadow usage; not allowed by policy.

### D.5 Testing / release / security process

- Unit testing: per repo, varies wildly.
- Integration testing: manual, per release.
- E2E: a single legacy Selenium suite, flaky.
- Release approval: change-advisory board (CAB) twice weekly.
- SAST: weekly batch scan; results triaged by AppSec.
- DAST: pre-prod environment, monthly.
- Secrets scanning: GitHub native + manual quarterly review.

### D.6 Target AI-led PDLC operating model

The composed architecture introduces the following solution
components (canonical SOL2 catalog):

- **spec_to_code** — every change starts from a spec; spec is
  versioned and bound to the change set.
- **ai_code_review** — agent-driven first-pass PR review; human
  approver receives a scorecard and a recommended decision.
- **ai_test_generation** — test generation bound to the spec;
  coverage measured per change, not per repo.
- **secure_coding_guardrails** — pre-commit + pre-merge guardrails
  bound to data-classification policy and licensing posture.
- **adr_capture** — design decisions captured as ADRs at point of
  decision; ADRs anchor the knowledge graph.
- **knowledge_graph** — code, ADRs, incidents, runbooks, and
  decisions composed into a per-tenant graph; Sentinel detects
  drift.
- **dora_telemetry** — first-class DORA capture across every
  service; per-team and per-product roll-up.
- **adoption_measurement** — per-engineer AI adoption signal
  (events, accepted suggestions, generated tests, scorecards used);
  bound to the program's value ledger.
- **human_in_loop_approval** — every AI-recommended decision lands
  in a queue for a named human approver with explicit sign-off.
- **release_risk_intelligence** — model-assisted release risk
  scoring composed from change set, test coverage, dependency
  delta, and historical incident pattern.
- **engineering_coach_agent** — per-engineer coach surfacing skill
  drift, adoption posture, and recommended next learning step.
- **value_ledger_for_pdlc** — DORA + adoption + outcome telemetry
  bound to the program's value ledger; this is the artifact the
  business case (§J) is rendered from.

The architecture sequences these components across the program
phases (Origination → Discovery → Design → Build → Run → Steady
state), names the integration points into GitHub / Jenkins /
ServiceNow / Jira / Datadog / Vault, and binds each component to a
target KPI from §C.8.

---

## E. Composition flow

The composition flow is **deterministic** — every step has a named
input and a named output. The flow runs whenever a Maestro requests
a composed architecture for a program.

1. **Assemble context.** Nexus assembles the Solution Context
   Bundle from §C. The bundle is scored (per S2) and classified
   into one of `empty`, `low`, `usable_with_gaps`, `usable`,
   `rich`. Any category in §C that cannot be assembled is recorded
   as a missing input.
2. **Retrieve patterns.** Nexus retrieves applicable patterns from
   PF1 (the failure-mode library) and I1 (the per-tenant
   detection read model). Patterns are not selected here; they are
   *retrieved* into the bundle.
3. **Retrieve solution components.** Nexus retrieves the candidate
   solution components from SOL2 (the component library). For the
   canonical example (§D), the AI-led PDLC component pack is the
   primary catalog. Components are not selected here either;
   they are *retrieved* into the bundle.
4. **Identify missing inputs.** Steward enforces honesty by
   walking the §C categories and producing the explicit
   missing-inputs list. If the bundle is below `usable_with_gaps`,
   Steward refuses substantive composition and the flow halts at
   step 4 with an honest fallback (§H).
5. **Generate draft solution.** Nexus composes the draft
   architecture by selecting and sequencing a subset of the
   retrieved components, naming integration points into the
   client's existing tools, and binding each component to a target
   KPI. In the future runtime, this step is LLM-assisted (per §F);
   today it is deterministic seed only.
6. **SME / client validation.** The Maestro brings the draft into
   the workshop loop per MW1 / MW2. SMEs validate technical
   feasibility; the client validates target-outcome alignment;
   both contributions are captured in the workshop notes.
7. **Refine through workshops → produce decision-grade
   deliverable.** Workshop refinement loops (§I.workshop refinement
   versions) tighten the architecture until the steering committee
   is willing to sign. The PDEL renderer produces the
   decision-grade deliverable artifact.

The flow is the same whether the architecture is pattern-driven,
LLM-composed, or SME-validated (§F). The composition style governs
how step 5 is performed and how confidence is reported, not the
flow itself.

---

## F. Pattern-driven vs. LLM-composed vs. SME-validated

Every composed architecture is anchored to **at least one** of the
three composition styles below. Production-grade work — the kind
that ends in a signed business case or a funded program — requires
SME validation regardless of how the draft was composed.

### F.1 Pattern-driven

- **What it is.** The architecture is composed by deterministic
  rules from the AbarVa pattern library (PF1 / I1) and the
  solution component catalog (SOL2). For each detected pattern,
  the recommended interventions are mapped onto the candidate
  components; the components are sequenced by canonical phase
  ordering.
- **When to use it.** The default for the seed runtime today.
  Always available, even for low-context bundles, because patterns
  carry safe defaults.
- **Traceability.** Every selected component must trace to a named
  pattern and a named target KPI. The deliverable carries the
  trace.
- **Confidence cap.** Pattern-driven alone never exceeds `medium`
  confidence on the executive readout (per Atlas conventions in
  S9g / I2 / I3).

### F.2 LLM-composed

- **What it is.** The draft is *synthesized* by a runtime model
  call composed against the Solution Context Bundle. The model is
  given the bundle, the retrieved patterns, the retrieved
  components, and the explicit missing-input list, and is asked
  to compose the draft architecture.
- **Pre-conditions.** The bundle must be at or above
  `usable_with_gaps`. Below that, Nexus refuses substantive
  composition (per §G / §H).
- **Required scaffolding.** Retrieval must be live (real pattern
  detections, real component catalog, real evidence). Atlas owns
  the executive editorial; Nexus owns the program-mastermind voice.
  The runtime must capture the model invocation as a
  Steward-auditable record (provenance, prompt, completion,
  retrieval set).
- **Confidence cap.** LLM-composed alone never exceeds `medium`
  confidence. Promotion to `high` requires SME validation.

### F.3 SME-validated

- **What it is.** A human consultant — typically the Maestro plus a
  named AbarVa SME — reviews the draft and either approves it as
  composed, requests changes, or rejects it. The reviewer's
  identity, decision, and rationale are captured by Steward.
- **When to use it.** Required for any architecture that will be
  used to produce a decision-grade deliverable (charter, design
  pack, decision memo, business case, executive readout).
- **Traceability.** The SME's review row binds to the architecture
  version (§I); the next version cannot supersede the prior
  approval without re-validation.
- **Confidence cap.** SME-validated is the only path to `high`
  confidence on the executive readout. Auto-promotion is forbidden.

### F.4 Anchoring rule

Every composed architecture must be anchored to **at least one** of
F.1 / F.2 / F.3. Production-grade work requires F.3 regardless of
how the draft was composed. The platform never silently substitutes
one composition style for another; the anchor set is recorded with
the architecture version and surfaced on the deliverable.

---

## G. Agent roles

The composition flow partitions cleanly across the four agents.
Voice and authority below match the canonical conventions (per
ADM1 / I2 / S9g / MW1).

### G.1 Nexus

- **Role.** Composes the draft architecture. Program-mastermind
  voice.
- **Reads.** The full Solution Context Bundle (§C).
- **Writes.** The draft architecture, its version, and its
  composition-style anchor set (§F).
- **Refusal.** Refuses substantive composition when the bundle is
  below `usable_with_gaps`. Returns an honest fallback (§H) and
  the missing-input list.
- **Tone.** Disciplined, named-input-anchored, never speculative
  about inputs it does not have.

### G.2 Sentinel

- **Role.** Validates the patterns and evidence the architecture
  rests on. Clinical voice.
- **Reads.** The PF1 library, the I1 detection read model, and the
  evidence registry (per ADM3 / ADM4).
- **Writes.** Pattern-detection rows, evidence-trail rows,
  recurrence callouts, operating-model gap callouts.
- **Refusal.** Will not endorse a composition that rests on a
  pattern with `evidence_chain_gap` or `value_ledger_incompleteness`
  — those compositions surface as needing remediation before
  promotion.

### G.3 Steward

- **Role.** Enforces missing-input gates. Utility-clerical voice.
- **Reads.** The §C bundle, the §C.12 missing-inputs list, the
  §I.versioning rows, and the canonical S9c hard-gate inputs
  (G1 / G2 / G3 / G4).
- **Writes.** The Steward Brief: ready / missing / blocking /
  deferred buckets per architecture version. The audit row when
  an architecture version is promoted (or refused).
- **Refusal.** Refuses promotion of an architecture to a
  decision-grade deliverable until the canonical hard-gate inputs
  for the next gate are captured. Never auto-promotes.

### G.4 Atlas

- **Role.** Composes the executive implications. Executive
  editorial voice.
- **Reads.** The composed architecture, the value ledger, the
  governance review, and the SME validation row (§F.3).
- **Writes.** The executive readout brief — composed *only after*
  the value ledger and the governance review are captured. Never
  speaks during the workshop itself (per MW1 §J).
- **Confidence rule.** Caps confidence at `medium` for any
  architecture that has not been SME-validated. Caps at
  `no_signals` for empty bundles (per S9g convention).

---

## H. Missing-input behavior

The composition flow makes the missing-input list a first-class
output, every step.

- **Honest surfacing.** Step 4 (Identify missing inputs) walks the
  §C categories and produces an explicit list with per-input
  reason and owner. The list is attached to the bundle and to
  every downstream artifact.
- **No fabrication.** Nexus never fills a missing input with a
  plausible-sounding default. If a target KPI is unknown, the
  architecture says *unknown*; if a tool is unmapped, the
  architecture says *unmapped*.
- **Phase-advancement refusal.** Steward refuses to advance the
  program to the next gate when the canonical hard-gate inputs
  for that gate are missing. The refusal is captured as a
  Steward audit row, not silenced.
- **Honest fallbacks.** Per ADM1 §J (the canonical evidence-state
  honest-fallback contract), every state — including `not_seeded`,
  `not_yet_wired`, `pending_owner`, `blocked_by_access` — must
  produce a non-empty caption that says what is missing and what
  the next action is.
- **Composition-style implication.** Below `usable_with_gaps`,
  LLM-composed (F.2) is forbidden. Pattern-driven (F.1) and
  SME-validated (F.3) remain available, but both must surface the
  bundle gap on the deliverable.

The platform's reputation rests on this behavior. The shortest path
to losing a steering committee is to render a confident-looking
architecture from a thin bundle.

---

## I. Versioning and refinement

Architectures carry an explicit version. Versioning is the
mechanism by which workshop refinement loops compose the final
decision-grade artifact.

### I.1 Version scheme

- `vMAJOR.MINOR`.
- `v0.1` — initial draft (Nexus-composed, pre-workshop).
- `v0.2` … `v0.N` — workshop refinement loops; each MW1 / MW2
  capture loop bumps the minor version.
- `v1.0` — first client-approved version (steering committee
  sign-off captured by Steward).
- `v1.1` … — post-approval refinement during execution.
- `v2.0` — material change requiring re-approval (e.g., scope
  re-baseline, regulatory pivot).

### I.2 Refinement rules

- Workshop refinement loops bump the minor version.
- SME validation (F.3) attaches a review row to the current
  version; it does not bump the version on its own.
- Client approval bumps the major version.
- Every version is immutable once written; the next version
  supersedes but does not overwrite.

### I.3 Provenance

Every version carries:

- `composedBy` — Nexus (always).
- `compositionAnchors` — subset of {pattern_driven, llm_composed,
  sme_validated} (F.4).
- `bundleClassification` — empty / low / usable_with_gaps /
  usable / rich (per S2).
- `missingInputsAtVersion` — snapshot of the §C.12 list.
- `derivedFromVersion` — prior version (or null for v0.1).
- `stewardAuditRow` — promotion / refusal record.

### I.4 PDEL contract

Every version is a deliverable artifact under the PDEL contract
(program deliverables / artifacts read model). The deliverable
inventory is the projection that surfaces architecture versions
on the canonical Programs detail surface.

---

## J. Deliverable outputs

A composed architecture produces the canonical deliverable set
below. Each deliverable is rendered from a specific architecture
version (§I) and inherits its composition anchors (§F) and its
missing-input list (§H).

### J.1 Solution architecture document

- **Form.** HTML / Markdown render.
- **Content.** Selected components, sequencing, integration points,
  per-component KPI binding, per-component evidence requirements.
- **Caption.** Composition anchors (F), bundle classification (S2),
  missing inputs (H).

### J.2 Operating model document

- **Form.** HTML / Markdown render.
- **Content.** Roles, decision rights, RACI, governance cadence,
  agent role partition (G), human-in-loop approval flow.

### J.3 Roadmap

- **Form.** Phase-by-phase plan.
- **Content.** Per-phase scope, per-phase exit criteria, per-phase
  evidence checklist, per-phase value-capture posture.

### J.4 Decision memo

- **Form.** Named decisions + sponsor sign-off.
- **Content.** Decisions taken, decisions deferred, owner per
  decision, sign-off identity captured by Steward.

### J.5 Business case

- **Form.** Value ledger + ROI render.
- **Content.** Baseline → target per KPI (§C.8), value capture
  posture, telemetry source, assumptions, risk-adjusted ROI band.
- **Constraint.** Never invents a dollar amount. If a number is
  unknown, the business case says *unknown* and lists what would
  resolve it.

### J.6 Executive readout

- **Form.** Atlas brief composed for steering committee.
- **Content.** Headline, top three pressure points, top three
  decisions requested, recommended next action, suggested
  follow-ups (visible-but-disabled until live runtime), confidence
  label, source label, interpretation basis.
- **Confidence cap.** `medium` unless SME-validated; `no_signals`
  if the architecture is empty.

---

## K. Future slices

This contract opens a SOL family. The following slices are
proposed — each is a separate documentation or implementation
slice with its own allowed-files set.

- **SOL2 · AI-led PDLC Solution Component Pack.** Deterministic
  catalog of canonical solution components, starting with the
  twelve named in §D.6. No live runtime; component metadata only.
- **SOL3 · Solution Draft Read Model.** Per-tenant composed
  architecture draft as a deterministic read model, paralleling
  the I1 / S9e shape.
- **SOL4 · Architecture Canvas UI.** Apple-like canvas surface
  that renders the composed architecture (components, sequencing,
  integration points, KPI bindings) and supports honest-fallback
  display of missing inputs.
- **SOL5 · Workshop-to-Architecture Refinement Loop.** The MW1 /
  MW2 capture loop bound to architecture versioning (§I); each
  workshop loop bumps the minor version and updates the
  Steward audit trail.
- **SOL6 · Decision-Grade Architecture Deliverable Renderer.**
  PDEL-anchored renderer that produces the canonical deliverable
  set (§J) from a named architecture version with full
  provenance.

Each future slice will follow the canonical slice format: purpose,
data dependencies, agent behavior, states, acceptance criteria,
validation commands, deferred items, no-fabrication rules.

---

## L. Acceptance criteria for SOL1

- Contract names purpose and scope (§A) and states the
  documentation-only constraint.
- Contract states the principle *Pattern ≠ Solution Architecture*
  and distinguishes pattern, solution component, architecture,
  and deliverable (§B).
- Contract enumerates the twelve canonical Solution Context Bundle
  categories (§C.1 through §C.12).
- Contract walks the canonical AI-led PDLC worked example,
  including current ways of working, DORA, toolchain, AI adoption,
  testing / release / security, and the target operating model
  (§D).
- Contract defines the deterministic seven-step composition flow
  (§E).
- Contract defines the three composition styles — pattern-driven,
  LLM-composed, SME-validated — with anchoring rule and
  confidence caps (§F).
- Contract defines per-agent roles for Nexus, Sentinel, Steward,
  Atlas with explicit refusal behavior (§G).
- Contract defines the missing-input behavior, including
  honest fallbacks and phase-advancement refusal (§H).
- Contract defines architecture versioning, refinement rules,
  provenance, and the PDEL anchor (§I).
- Contract enumerates the canonical deliverable outputs (§J) with
  no-fabrication constraint on the business case.
- Contract proposes the future-slice plan SOL2 through SOL6 (§K).
- Documentation only; no application code, runtime, auth,
  supabase, agent runtime, or migrations are modified.
