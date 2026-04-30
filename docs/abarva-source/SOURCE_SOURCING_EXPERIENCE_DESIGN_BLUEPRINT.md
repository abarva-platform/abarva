# AbarVa Source Sourcing Experience Design Blueprint

Status: canonical Source / Outsourcing experience design reference for technology and IT sourcing only.
Scope: documentation and design only. This blueprint does not approve runtime code, UI implementation, API routes, model calls, upload or parsing implementation, approval engine behavior, workflow engine behavior, production claims, or live benchmark integration.

This document consolidates the current Source build pack, Source readiness trackers, AMS managed services sourcing pattern, current slice plans, and the platform experience-system design lock into one detailed experience blueprint for technology and IT sourcing only. It is intentionally direct because Source has to become a senior technology sourcing workbench, not a nicer wrapper around procurement checklists.

## 1. Purpose and product thesis

AbarVa Source is the outsourcing and technology sourcing operating workspace for enterprise IT decisions. It helps teams structure a sourcing event, prepare scope, prepare RFP or RFI materials, validate data readiness, manage vendor responses, normalize pricing, detect commercial traps, plan BAFO and negotiation, prepare executive decisions, assess selection readiness, transition to mobilization, and track value realization. The product exists because important sourcing work fails when scope is thin, evidence is scattered, vendor proposals are not comparable, commercial traps are hidden until contract negotiation, and executive decisions are made from summary decks that do not show what was known, missing, waived, or risky.

Source is not a procurement checklist. A checklist asks whether a step happened; Source asks whether the step is decision-grade. A checklist can mark "RFP drafted" even when the pricing template is unusable. Source must say, "This package is only Outline quality because ticket history and transition cost evidence are missing." That difference is the product.

Source is not a generic RFP builder. It should create and review RFP artifacts, but document production is only one surface. The deeper product job is to decide what artifact quality is safe, which inputs are missing, which gates are blocked, which vendors are comparable, and what executives need to know before selection. A beautiful RFP generated from poor context is a failure, not a feature.

Source is not a chatbot. Nexus may talk to the user, but the workspace is not a blank prompt with a long answer below it. The sourcing lead should land in a workbench that already knows the event, stage, blockers, value, data readiness, vendors, artifacts, and gates. The agent should be concise, contextual, and action-oriented. The right rail should update with evidence, gates, and next actions instead of forcing the user to scroll through a transcript.

Source is not a static dashboard. It is a stage-governed operating surface. The dashboard shows the portfolio, but the event canvas drives work. Every table row should answer what the user sees, what they do next, what data supports the state, what evidence is weak, and what gate is affected.

Source is not a vendor scoring spreadsheet. It includes scorecards, but vendor selection readiness depends on response completeness, normalized pricing, transition risk, evidence confidence, unresolved assumptions, approvals, and value at stake. A score alone is insufficient when a low price excludes transition, assumes lower ticket volume, or hides change-order exposure.

Technology-only scope: Source is intentionally limited to IT and technology sourcing. In-scope categories include application managed services, infrastructure managed services, cloud operations, data platform managed services, analytics and AI services, systems integration, implementation partners, SaaS/platform selection, cybersecurity services, enterprise software, and technology operating-model outsourcing. Out-of-scope categories include facilities, travel, contingent labor outside technology delivery, marketing agencies, legal services, benefits, office supplies, logistics, manufacturing inputs, and other non-technology procurement domains. If a future workflow uses Source for a non-IT category, that is product drift and should be rejected or routed to a different product surface.

Source is agent-guided, evidence-aware, commercially intelligent, gate-governed, artifact-driven, table-forward, and decision-oriented for IT services, platforms, software, cloud, data, AI, and technology-enabled operating models. Nexus leads the sourcing motion. Sentinel challenges evidence. Steward protects gates, readiness, approvals, and auditability. Atlas frames executive consequences and value. The user should feel that a senior sourcing partner, commercial advisor, governance lead, and executive chief of staff are collaborating around the same event state.

Acceptance criteria:
- Source is described as an outsourcing and technology sourcing workspace for IT decisions, not as a generic procurement tool.
- The product thesis connects scope, evidence, pricing, gates, artifacts, agents, and executive decisions.
- The document makes clear that chat is supporting infrastructure, not the product center of gravity.
- The design rejects static dashboards, vendor scoring spreadsheets, and generic RFP generation as insufficient.
- The design explicitly limits Source to technology and IT sourcing categories.

## 2. Design principles for Source

Source uses the AbarVa experience-system direction for IT sourcing work: warm off-white canvas, table-forward operating workbench, visible journey state, compact agent guidance, and decision-grade evidence. The default experience should be calm and premium. It should not look like a full dark dashboard, a procurement portal clone, or a generic AI chat application. The current brand direction is the name-only AbarVa wordmark. Avoid decorative marks, excessive icons, generic AI sparkle, neon effects, and color-heavy status badge walls.

The canvas is warm off-white because Source work is dense. Users need long tables, status rows, evidence states, and comparison views. Off-white gives the work room to breathe. Dark navy can be used for a command read or a single important brief, but not for a full-page chat slab that pushes the actual work below the fold.

Source is table-forward because technology sourcing is evidence and comparison work: applications, tickets, workloads, contracts, SLAs, integrations, transition plans, security posture, pricing assumptions, and value evidence must be inspectable. Event portfolios, in-scope/out-of-scope boundaries, vendor responses, pricing normalization, scorecard governance, artifacts, gates, and value ledger rows should all be tables before they are card grids. Cards can summarize; tables operate.

The journey map must be visible wherever workflow state matters. It must show current stage, completed stages, blocked stages, waiting states, and next stage. It is not decorative. If the user asks whether the event can move forward, the journey map and gate panel should already answer.

Nexus guidance must be compact. The first agent response on a page should not be a lecture. It should name the stage, top blocker, next action, and three context-relevant choices only when multiple actions are valid. If one action is clearly required, the UI should not manufacture three choices.

Steward gate visibility must be persistent. The user should always know whether a gate is clear, blocked, waiver-required, deferred, or pending review. Steward is not a separate chat persona; Steward is the governance spine that keeps the product honest.

Sentinel evidence cautions must appear where evidence is used. If a row says ticket history is loaded but not parsed, Sentinel should keep Source from treating it as usable evidence. If vendor automation claims are unsupported, Sentinel should label them weak before the scorecard or executive brief reuses them.

Atlas executive implications should appear at decision moments: value at stake, commercial confidence, transition risk, CFO/CIO impact, and board-readiness. Atlas should not flood early scope work with executive prose, but it should make the consequence of thin evidence visible.

These principles show up on each Source page. The dashboard is a portfolio command surface with a table and mission preview, not a chat prompt. The events portfolio is a filtered operating queue with value, waiting, blocked, linked program, and next action columns. The event canvas shows the event header, journey map, stage workspace, gate panel, artifact strip, and agent rail above the fold. Scope uses tables for in-scope, out-of-scope, and data dependencies. Vendor Responses uses a completeness matrix. Pricing Normalization uses comparison tables and multi-year cost visuals. BAFO uses a vendor-specific question matrix. Executive Decision uses a tradeoff table. Value Realization uses a ledger.

Acceptance criteria:
- Source pages use off-white, table-forward, journey-visible design language.
- Agent guidance is compact, contextual, and never a generic chatbot panel.
- Steward, Sentinel, and Atlas appear as functional roles tied to gates, evidence, and executive implications.
- Every implementation slice can trace visual behavior back to these principles.

## 3. Source lifecycle and stage journey

The canonical Source journey for technology and IT sourcing is Strategy, Scope, RFP / RFI Readiness, Vendor Responses, Evaluation, Pricing Normalization, BAFO / Negotiation, Executive Decision, Vendor Selection Readiness, Transition, and Value Realization. Some existing code and build-pack files use Intake, Sourcing Strategy, RFP Package, Orals / BAFO, Selection, Contract / Mobilization, and Verify / Value Realization. This blueprint keeps the existing intent but names the user-facing journey around the sourcing experience the user must understand. Implementation can map old ids to the canonical labels through a stage resolver rather than creating duplicate workflow models.

### 3.1. Strategy

User goal: establish the sourcing thesis, commercial ambition, event archetype, rigor level, and owner model before the team spends time on scope mechanics.

Primary user question: What technology sourcing problem are we solving, why now, and what decision-quality IT outcome must this event create?

Primary agent: Nexus. Supporting agents: Atlas, Sentinel, Steward.

Required data:
- event trigger.
- business owner.
- linked program or standalone reason.
- current spend or value-at-stake estimate.
- incumbent/vendor landscape.
- known risk posture.
- target timing.
- governance owner.

Required artifacts:
- Sourcing Strategy Memo.
- Minimum Data Request.

Entry criteria: An authorized user has opened a new sourcing event or selected an intake candidate from Programs, Source portfolio, or Control Tower signal.

Exit criteria: Event thesis, archetype, rigor, owner, value-at-stake basis, and minimum data request are recorded with open unknowns labeled.

Gate owner: Sourcing lead with procurement sponsor review.

Blockers:
- no decision owner.
- unclear trigger.
- no value or risk basis.
- wrong archetype confidence.
- missing linked program context when event is embedded.

Waiver/defer behavior: A strategy gap can be deferred only if the gap is named, its downstream risk is visible on the journey map, and Steward records the owner who accepted the defer. Strategy cannot be waived when there is no owner or no event thesis.

What appears above the fold: A narrow command read with event name, tenant, linked program badge, stage Strategy, rigor, top mission, and a one-sentence Nexus read: "This is an AMS cost and accountability event, not a generic RFP." A small value-at-stake strip sits beside the journey map, not inside a dark chat block.

What appears in the primary workspace: A table-forward strategy workbook: trigger, objectives, current model, incumbent posture, likely sourcing model, critical decision dates, and initial risks. Rows are editable later by sanctioned workflow, but the design assumes read-only seeded state until persistence is approved.

What appears in the agent rail: Nexus explains the current strategy posture. Atlas shows executive implication. Sentinel identifies evidence weakness. Steward states whether Strategy can move to Scope.

What appears in drawers: Evidence Drawer for spend and incumbent references, Linked Program Drawer for embedded event context, Gate Detail Drawer for Strategy-to-Scope requirements, and Context Used Drawer from every agent response.

Three choices plus custom examples:
- Confirm sourcing thesis.
- Generate minimum data request.
- Check linked program impact.
- Custom: Custom examples: "This is board-driven cost takeout", "The event is standalone, not linked to a program", "Treat the incumbent as at-risk but not excluded".

Context-used behavior: Context chips distinguish pattern basis, seeded portfolio facts, linked program facts, and client evidence. If only pattern basis exists, the strip says pattern-only and the rail asks for the first client fact.

Acceptance criteria:
- Strategy shows user goal, stage status, gate owner, blockers, and next action without scrolling past the primary workspace.
- Required data and artifacts are visible as concrete rows or strips, not hidden inside agent prose.
- Waiver and defer states remain visible with owner, rationale, and downstream impact.
- Agent rail copy is stage-specific and uses context-used chips before making evidence-sensitive claims.

### 3.2. Scope

User goal: turn the sourcing thesis into a pricing-ready scope boundary with in-scope services, explicit exclusions, assumptions, ambiguities, and data-readiness impact.

Primary user question: Is this scope pricing-ready?

Primary agent: Nexus. Supporting agents: Steward, Sentinel, Atlas.

Required data:
- in-scope towers.
- out-of-scope exclusions.
- application or service inventory.
- ticket/application/workload baselines.
- current cost baseline.
- service hours.
- SLA expectations.
- retained/vendor responsibility view.

Required artifacts:
- Scope Document.
- Minimum Data Request.
- Value Ledger Assumptions.

Entry criteria: Strategy is complete, explicitly deferred with owner, or the event is created directly into Scope with enough trigger and owner context to avoid a blank workspace.

Exit criteria: Scope boundary, exclusions, assumptions, missing inputs, RFP tier impact, and data-readiness dependencies are visible and either usable, assigned, or waived with impact.

Gate owner: Sourcing lead with business sponsor and Steward gate visibility.

Blockers:
- enterprise all towers without exclusions.
- missing inventory baseline.
- missing cost baseline.
- missing service-level assumptions.
- no owner for missing data.
- ambiguous retained responsibilities.

Waiver/defer behavior: A missing baseline can be waived only into a lower RFP tier. The UI must show that Rich RFP and pricing normalization are weakened. Waiver does not erase the missing input.

What appears above the fold: Stage header shows Scope active, pricing-ready state, RFP tier impact, and a compact top blocker. The page should never bury the agent prompt below the fold; the first viewport must include workbench, gate state, and action choices.

What appears in the primary workspace: Three tables dominate: In Scope, Out of Scope, and Baseline/Data Dependencies. Below them sit assumptions, ambiguities, and suggested actions. The table is not decorative; each row has owner, evidence state, pricing impact, and next action.

What appears in the agent rail: Nexus tells the user whether the scope is pricing-ready. Steward states gate readiness. Sentinel notes evidence limitations. Atlas frames value confidence and executive implication.

What appears in drawers: Data Readiness Drawer, Evidence Drawer, Gate Detail Drawer, Artifact Detail Drawer for Scope Document, and Linked Program Drawer when the event is embedded.

Three choices plus custom examples:
- Show missing inputs.
- Draft minimum data request.
- Review scope exclusions.
- Custom: Custom examples: "All towers except security operations", "Proceed as Outline RFP with finance waiver", "Ask what ServiceNow extracts we need".

Context-used behavior: Context-used chips show scope rows, Admin/Setup readiness, AMS pattern pack basis, and any linked program constraints. Missing inventory appears as a blocker chip, not as a footnote.

Acceptance criteria:
- Scope shows user goal, stage status, gate owner, blockers, and next action without scrolling past the primary workspace.
- Required data and artifacts are visible as concrete rows or strips, not hidden inside agent prose.
- Waiver and defer states remain visible with owner, rationale, and downstream impact.
- Agent rail copy is stage-specific and uses context-used chips before making evidence-sensitive claims.

### 3.3. RFP / RFI Readiness

User goal: decide what vendor-facing package is safe to prepare: Rich, Outline, Stub, Blocked, or Waiver Required.

Primary user question: Can we prepare or release vendor-facing materials without creating a non-comparable event?

Primary agent: Nexus. Supporting agents: Steward, Sentinel, Atlas.

Required data:
- approved or deferred scope state.
- pricing template requirements.
- scorecard status.
- vendor universe.
- Q&A protocol.
- legal/security review requirement.
- evidence status by required section.

Required artifacts:
- RFP Package.
- Pricing Template.
- Vendor Q&A Tracker.

Entry criteria: Scope is complete, deferred, or waiver-required with all missing-input impacts visible.

Exit criteria: Readiness tier is assigned, required sections are visible, release blockers are named, and the next vendor-facing artifact action is safe.

Gate owner: Procurement lead with Steward release gate.

Blockers:
- scope not pricing-ready.
- pricing template missing.
- scorecard not defined.
- approval path missing.
- evidence dependency unresolved.
- vendor list not approved.

Waiver/defer behavior: A waiver can allow an Outline or Stub package, but the UI must block language that implies release-ready quality. Steward marks release gate as conditional and requires reviewer rationale.

What appears above the fold: Readiness card with tier, top blocker, release posture, and next action. Journey map shows RFP / RFI Readiness active and vendor response stage disabled until release criteria are cleared.

What appears in the primary workspace: A requirements-section matrix: executive brief, scope, service model, pricing template, scorecard, Q&A, security/legal terms, transition expectations, and evidence state. Each section has status, source, owner, and action.

What appears in the agent rail: Nexus recommends Rich, Outline, Stub, Blocked, or Waiver Required. Steward explains release gate. Sentinel marks sections that cannot be cited. Atlas explains executive consequence if issued thin.

What appears in drawers: Artifact Drawer for RFP Package, Gate Detail Drawer for release criteria, Evidence Drawer for source materials, Vendor Detail Drawer for planned invitees.

Three choices plus custom examples:
- Show release blockers.
- Draft outline package path.
- Review approval route.
- Custom: Custom examples: "Prepare an RFI instead of an RFP", "Show only sections blocked by pricing", "Ask how to keep vendors comparable".

Context-used behavior: Context-used chips include scope readiness, required artifact state, scorecard lock state, approval route state, and evidence coverage. The strip suppresses confident release language if context is partial.

Acceptance criteria:
- RFP / RFI Readiness shows user goal, stage status, gate owner, blockers, and next action without scrolling past the primary workspace.
- Required data and artifacts are visible as concrete rows or strips, not hidden inside agent prose.
- Waiver and defer states remain visible with owner, rationale, and downstream impact.
- Agent rail copy is stage-specific and uses context-used chips before making evidence-sensitive claims.

### 3.4. Vendor Responses

User goal: track which vendor submissions are complete, comparable, evidence-backed, and ready to feed evaluation.

Primary user question: Can we cite and compare these vendor responses?

Primary agent: Nexus. Supporting agents: Sentinel, Steward, Atlas.

Required data:
- vendor submissions.
- required response sections.
- pricing templates.
- transition plans.
- assumptions/exclusions.
- security/compliance responses.
- Q&A tracker.
- submission dates.

Required artifacts:
- Vendor Q&A Tracker.
- Vendor Response Completeness Checklist.

Entry criteria: RFP/RFI package is issued or equivalent vendor response request is recorded with required sections.

Exit criteria: Each vendor is complete, partially complete, incomplete, not comparable, or blocked, with recommended next action and evidence status.

Gate owner: Sourcing lead with vendor management support.

Blockers:
- missing pricing template.
- missing transition plan.
- vendor uses different assumptions.
- unsupported automation claims.
- security response absent.
- late response without owner action.

Waiver/defer behavior: A response gap can be accepted into Evaluation only when the missing section is listed, the affected score criteria are flagged, and Steward records the evaluator decision to proceed under condition.

What appears above the fold: A vendor response posture strip: vendors received, complete, not comparable, blocked, and top next vendor action. It should be scannable before any narrative.

What appears in the primary workspace: Vendor response completeness table with vendors as rows and required sections as grouped columns. Each cell states submitted, missing, weak, cited, or blocked. The table includes recommended action by vendor.

What appears in the agent rail: Nexus summarizes comparability. Sentinel flags uncited or weak vendor claims. Steward states whether Evaluation can begin. Atlas frames the executive confidence impact.

What appears in drawers: Vendor Detail Drawer, Evidence Drawer for submission excerpts, Risk/Exception Drawer for exclusions, Artifact Detail Drawer for response checklist.

Three choices plus custom examples:
- Show incomplete responses.
- Request vendor clarification.
- Mark response at risk.
- Custom: Custom examples: "Compare only Vendor A and Vendor C", "Show missing transition plans", "Explain why Vendor B is not comparable".

Context-used behavior: Context-used chips include RFP section requirements, vendor submission state, evidence status, and comparability state. If uploads are unparsed, response card says uploaded but not usable evidence.

Acceptance criteria:
- Vendor Responses shows user goal, stage status, gate owner, blockers, and next action without scrolling past the primary workspace.
- Required data and artifacts are visible as concrete rows or strips, not hidden inside agent prose.
- Waiver and defer states remain visible with owner, rationale, and downstream impact.
- Agent rail copy is stage-specific and uses context-used chips before making evidence-sensitive claims.

### 3.5. Evaluation

User goal: evaluate vendors against governed criteria after response completeness and pricing comparability are sufficient.

Primary user question: Can we compare vendors fairly, and what does the governed scorecard actually support?

Primary agent: Steward. Supporting agents: Nexus, Sentinel, Atlas.

Required data:
- locked scorecard criteria.
- vendor responses.
- normalized pricing.
- evidence confidence.
- evaluator assignments.
- rationale entries.
- risk exceptions.

Required artifacts:
- Vendor Response Completeness Checklist.
- Pricing Normalization Workbook.
- Executive Decision Brief.

Entry criteria: Vendor responses are complete or conditionally accepted, pricing normalization is in progress or available, and scorecard governance has an owner.

Exit criteria: Scorecard is locked, scoring rationale is sufficient, evidence gaps are visible, and Evaluation can feed BAFO or executive decision framing.

Gate owner: Evaluation chair with Steward governance enforcement.

Blockers:
- scorecard unlocked.
- missing rationale.
- criteria not tied to event goals.
- pricing not normalized.
- evidence confidence low for scored claims.
- evaluator conflict unresolved.

Waiver/defer behavior: A missing rationale cannot be waived silently. A score can proceed only with explicit low-confidence status and visible owner acceptance.

What appears above the fold: Evaluation readiness meter, scorecard lock state, and one table row for top vendor tradeoff. The UI must not imply a final recommendation before governance clears.

What appears in the primary workspace: Criteria table by category: commercial, transition, evidence, automation, risk, governance. Vendor scores sit beside rationale and evidence state. Missing rationale is a first-class cell state.

What appears in the agent rail: Steward leads with readiness and lock status. Nexus explains what the scorecard supports. Sentinel checks evidence confidence. Atlas turns the emerging tradeoff into executive language.

What appears in drawers: Gate Detail Drawer for evaluation gate, Evidence Drawer for score rationale, Vendor Detail Drawer, Artifact Detail Drawer for scorecard or decision brief.

Three choices plus custom examples:
- Review missing rationale.
- Explain vendor tradeoffs.
- Lock scorecard path.
- Custom: Custom examples: "Show all low-confidence criteria", "Explain why lowest price is not leading", "Route unresolved security issue to Steward".

Context-used behavior: Context-used chips show scorecard version, response completeness, pricing normalization, and evidence state. If criteria are pattern-derived, the strip labels them pattern basis until approved for the event.

Acceptance criteria:
- Evaluation shows user goal, stage status, gate owner, blockers, and next action without scrolling past the primary workspace.
- Required data and artifacts are visible as concrete rows or strips, not hidden inside agent prose.
- Waiver and defer states remain visible with owner, rationale, and downstream impact.
- Agent rail copy is stage-specific and uses context-used chips before making evidence-sensitive claims.

### 3.6. Pricing Normalization

User goal: separate base price, transition cost, assumptions, exclusions, and risk-adjusted economics so commercial comparison is defensible.

Primary user question: What is the comparable commercial picture after assumptions, exclusions, transition cost, and risk are normalized?

Primary agent: Nexus. Supporting agents: Sentinel, Atlas, Steward.

Required data:
- vendor pricing workbooks.
- year 1/2/3 costs.
- one-time cost.
- transition cost.
- volume assumptions.
- app count assumptions.
- SLA assumptions.
- onshore/offshore mix.
- rate escalation.
- change-order exposure.

Required artifacts:
- Pricing Normalization Workbook.
- Value Ledger Assumptions.

Entry criteria: Vendor pricing templates are received or vendor commercial responses are loaded enough to produce a normalization posture.

Exit criteria: Normalized annual run cost, multi-year cost, transition-inclusive cost, excluded scope, and commercial traps are visible by vendor.

Gate owner: Commercial lead with finance review.

Blockers:
- vendor pricing not in common structure.
- missing transition cost.
- scope exclusions hide required services.
- volume assumptions below baseline.
- rate escalation undefined.
- automation savings unsupported.

Waiver/defer behavior: Pricing normalization gaps can move forward only with risk-adjusted label. The UI must not improve projected savings when price is lower because required scope is excluded.

What appears above the fold: A commercial comparison strip with normalized annual run cost, year-one delta, transition-inclusive cost, and top commercial trap. Use table and concise charts, not a dense dashboard.

What appears in the primary workspace: Vendor comparison table plus one visual lane for year 1, year 2, year 3. Rows expose base run cost, transition, one-time, optional/excluded services, assumptions, rate escalation, automation, and trap flags.

What appears in the agent rail: Nexus explains comparable cost. Sentinel challenges unsupported claims. Atlas explains CFO/CIO tradeoff. Steward notes whether BAFO can proceed.

What appears in drawers: Pricing Detail Drawer, Evidence Drawer for proposal basis, Risk/Exception Drawer for traps, Value Assumptions Drawer for ledger impact.

Three choices plus custom examples:
- Show commercial traps.
- Normalize transition cost.
- Prepare BAFO asks.
- Custom: Custom examples: "Model Vendor B including release support", "Show year-three escalation risk", "Explain why transition exclusion blocks savings claim".

Context-used behavior: Context-used chips include vendor proposal, client baseline, pricing template, and pattern commercial trap basis. Benchmark chips are absent unless licensed or cited benchmark evidence exists.

Acceptance criteria:
- Pricing Normalization shows user goal, stage status, gate owner, blockers, and next action without scrolling past the primary workspace.
- Required data and artifacts are visible as concrete rows or strips, not hidden inside agent prose.
- Waiver and defer states remain visible with owner, rationale, and downstream impact.
- Agent rail copy is stage-specific and uses context-used chips before making evidence-sensitive claims.

### 3.7. BAFO / Negotiation

User goal: turn evaluation and commercial gaps into vendor-specific BAFO questions, assumption locks, negotiation asks, and executive tradeoffs.

Primary user question: What must we ask, lock, or challenge before selection?

Primary agent: Nexus. Supporting agents: Sentinel, Atlas, Steward.

Required data:
- evaluation gaps.
- normalized pricing.
- commercial traps.
- vendor assumptions.
- excluded scope.
- risk notes.
- legal/security exceptions.
- desired concessions.

Required artifacts:
- BAFO Question Pack.
- Pricing Normalization Workbook.

Entry criteria: Evaluation and pricing normalization identify unresolved gaps that can be converted into BAFO questions or negotiation objectives.

Exit criteria: Vendor-specific BAFO question set, assumption lock list, negotiation priorities, expected value impact, and residual risks are ready for governed execution.

Gate owner: Procurement lead with commercial sponsor.

Blockers:
- no normalized commercial baseline.
- questions not tied to decision criteria.
- excluded scope not challenged.
- legal/security blockers unresolved.
- walkaway credibility weak.

Waiver/defer behavior: A BAFO gap can be deferred to contracting only when the decision brief says the risk moves to contract negotiation and Steward labels selection as conditional.

What appears above the fold: BAFO posture card: number of vendor-specific asks, estimated value impact, unresolved blockers, and walkaway signal. Keep it sharp; this is where Source should feel like a senior deal advisor.

What appears in the primary workspace: BAFO matrix by vendor: question, evidence basis, expected movement, risk if unanswered, owner, due date, and decision impact. Assumption lock list and excluded scope list sit below the matrix.

What appears in the agent rail: Nexus recommends negotiation sequence. Sentinel warns where evidence is weak. Atlas frames executive tradeoff. Steward enforces that BAFO output cannot imply final selection.

What appears in drawers: Vendor Detail Drawer, Pricing Detail Drawer, Risk/Exception Drawer, Gate Detail Drawer for BAFO-to-selection readiness.

Three choices plus custom examples:
- Draft BAFO question pack.
- Show assumption locks.
- Review walkaway signal.
- Custom: Custom examples: "Make transition cost fixed-price", "Challenge offshore mix", "Ask for year-two price-down tied to automation".

Context-used behavior: Context-used chips show evaluation findings, pricing normalization rows, commercial trap catalog, proposal evidence, and missing legal/security context.

Acceptance criteria:
- BAFO / Negotiation shows user goal, stage status, gate owner, blockers, and next action without scrolling past the primary workspace.
- Required data and artifacts are visible as concrete rows or strips, not hidden inside agent prose.
- Waiver and defer states remain visible with owner, rationale, and downstream impact.
- Agent rail copy is stage-specific and uses context-used chips before making evidence-sensitive claims.

### 3.8. Executive Decision

User goal: prepare a concise decision package that shows viable vendors, tradeoffs, value at stake, commercial risk, transition risk, confidence, blockers, and decision options.

Primary user question: What decision should executives make, and what tradeoffs must they accept?

Primary agent: Atlas. Supporting agents: Nexus, Sentinel, Steward.

Required data:
- evaluation result.
- BAFO responses.
- normalized pricing.
- value ledger assumptions.
- transition risk.
- evidence confidence.
- unresolved assumptions.
- gate status.

Required artifacts:
- Executive Decision Brief.
- Vendor Selection Memo.

Entry criteria: Evaluation and BAFO produce enough evidence to frame one or more viable decision options.

Exit criteria: Decision needed, decision posture, viable vendors, blocked vendors, tradeoffs, blockers, and next action are executive-ready with evidence confidence visible.

Gate owner: Executive sponsor with procurement and finance support.

Blockers:
- no viable vendor.
- unresolved commercial trap.
- low evidence confidence.
- transition risk not accepted.
- required approval missing.
- scorecard mismatch.

Waiver/defer behavior: Executive decision can accept residual risk, but the residual risk must remain visible in the brief and must not be converted into a clean recommendation.

What appears above the fold: Executive decision strip with decision needed, recommended posture, viable vendors, value at stake, confidence, and top unresolved assumption. Atlas should be concise and direct.

What appears in the primary workspace: Decision table: vendor, normalized cost, commercial risk, transition risk, evidence confidence, strategic fit, unresolved issues, and decision option. A brief narrative sits above, not instead of the table.

What appears in the agent rail: Atlas leads the executive brief. Nexus states next workflow action. Sentinel cautions unsupported claims. Steward states approval/gate status.

What appears in drawers: Evidence Drawer for cited claims, Gate Detail Drawer, Vendor Detail Drawer, Value Assumptions Drawer, Artifact Detail Drawer for decision brief.

Three choices plus custom examples:
- Prepare selection memo.
- Show unresolved blockers.
- Explain executive tradeoffs.
- Custom: Custom examples: "Frame Vendor A as preferred with conditions", "Show why Vendor C is blocked", "Create CFO version focused on value".

Context-used behavior: Context-used chips separate client evidence, vendor proposal, pattern guidance, scorecard, and value ledger assumptions. Low evidence confidence must be visible near the recommendation.

Acceptance criteria:
- Executive Decision shows user goal, stage status, gate owner, blockers, and next action without scrolling past the primary workspace.
- Required data and artifacts are visible as concrete rows or strips, not hidden inside agent prose.
- Waiver and defer states remain visible with owner, rationale, and downstream impact.
- Agent rail copy is stage-specific and uses context-used chips before making evidence-sensitive claims.

### 3.9. Vendor Selection Readiness

User goal: determine whether the event is ready for a selection review without automating the final vendor choice.

Primary user question: Is the selection review ready, conditional, or blocked?

Primary agent: Steward. Supporting agents: Nexus, Sentinel, Atlas.

Required data:
- decision brief.
- scorecard lock.
- pricing normalization.
- BAFO closure.
- approval requirements.
- unresolved commercial issues.
- unresolved evidence issues.
- unresolved gate issues.

Required artifacts:
- Vendor Selection Memo.
- Transition Readiness Checklist.

Entry criteria: Executive decision package exists or is being prepared and selection posture needs governance validation.

Exit criteria: Selection review readiness is marked yes, conditional, or no, with viable vendors, blocked vendors, required artifacts, required approvals, and unresolved issues visible.

Gate owner: Steward gate with executive sponsor approval path.

Blockers:
- selection memo missing.
- required approvals missing.
- scorecard not locked.
- residual risk not accepted.
- commercial issue unresolved.
- evidence issue unresolved.

Waiver/defer behavior: Selection readiness can be conditional but not falsely ready. A conditional state lists each condition and whether it must clear before contracting or before transition.

What appears above the fold: Selection readiness card with ready yes/no, viable vendors, blocked vendors, required approvals, and next review action. It must say what is not automated: Source prepares the decision; humans select.

What appears in the primary workspace: Readiness checklist table grouped by commercial, transition, evidence, gate, approval, and artifact requirements. Each row has state, owner, blocker, evidence, and next action.

What appears in the agent rail: Steward leads with gate truth. Nexus recommends action. Sentinel checks evidence gaps. Atlas explains executive consequence of conditional approval.

What appears in drawers: Gate Detail Drawer, Artifact Detail Drawer for selection memo, Evidence Drawer, Vendor Detail Drawer, Linked Program Drawer for downstream program impact.

Three choices plus custom examples:
- Show selection blockers.
- Review required approvals.
- Prepare transition checklist.
- Custom: Custom examples: "Proceed conditional on legal issue", "Show blocked vendors", "Explain what humans must decide".

Context-used behavior: Context-used chips show scorecard, BAFO, pricing, executive decision, approvals, and evidence. If an approval engine is not implemented yet, the UI states planned approval state, not completed approval.

Acceptance criteria:
- Vendor Selection Readiness shows user goal, stage status, gate owner, blockers, and next action without scrolling past the primary workspace.
- Required data and artifacts are visible as concrete rows or strips, not hidden inside agent prose.
- Waiver and defer states remain visible with owner, rationale, and downstream impact.
- Agent rail copy is stage-specific and uses context-used chips before making evidence-sensitive claims.

### 3.10. Transition

User goal: move the selected vendor into mobilization with ownership, knowledge transfer, contract alignment, and service handoff clarity.

Primary user question: Can the selected vendor mobilize without hidden transition, contract, or owner gaps?

Primary agent: Nexus. Supporting agents: Steward, Sentinel, Atlas.

Required data:
- selected vendor.
- selection rationale.
- contract status.
- transition plan.
- KT plan.
- SME calendar.
- service handoff model.
- retained roles.
- risk register.

Required artifacts:
- Transition Readiness Checklist.
- Value Ledger Assumptions.

Entry criteria: Vendor selection has been approved or conditionally approved with contract and mobilization dependencies visible.

Exit criteria: Transition readiness checklist, owner map, KT plan, service handoff plan, risk acceptance, and value measurement setup are ready for mobilization.

Gate owner: Transition owner with procurement and service owner participation.

Blockers:
- contract not aligned to scope.
- KT plan missing.
- retained roles unclear.
- SME availability missing.
- cutover risk unresolved.
- service reporting not defined.

Waiver/defer behavior: Transition gaps can be deferred only to named mobilization milestones with owner, due date, and risk. A missing KT plan should block unless sponsor explicitly accepts takeover risk.

What appears above the fold: Transition readiness strip: selected vendor, contract state, KT readiness, owner map, mobilization blockers. The event canvas remains the center; no separate project-management wall is introduced.

What appears in the primary workspace: Transition checklist table with workstream, owner, evidence, due date, blocker, and Source-to-Programs handoff. Contract, KT, service operations, governance, and value measurement rows are grouped.

What appears in the agent rail: Nexus guides mobilization. Steward enforces readiness. Sentinel flags missing evidence in contract/KT claims. Atlas frames the risk to expected value.

What appears in drawers: Linked Program Drawer, Artifact Detail Drawer, Gate Detail Drawer, Evidence Drawer, Risk/Exception Drawer.

Three choices plus custom examples:
- Show mobilization gaps.
- Build transition checklist.
- Prepare value measurement setup.
- Custom: Custom examples: "Show KT items by app criticality", "Route contract gap to legal", "Link transition milestone to program P4".

Context-used behavior: Context-used chips show selection memo, contract state, transition plan, linked program, and value assumptions. Contract facts must be labeled unavailable if contract ingestion has not happened.

Acceptance criteria:
- Transition shows user goal, stage status, gate owner, blockers, and next action without scrolling past the primary workspace.
- Required data and artifacts are visible as concrete rows or strips, not hidden inside agent prose.
- Waiver and defer states remain visible with owner, rationale, and downstream impact.
- Agent rail copy is stage-specific and uses context-used chips before making evidence-sensitive claims.

### 3.11. Value Realization

User goal: track projected, committed, measuring, and realized value without overstating savings before measurement evidence exists.

Primary user question: What value has been projected, committed, measured, realized, or put at risk?

Primary agent: Atlas. Supporting agents: Nexus, Sentinel, Steward.

Required data:
- projected savings.
- contracted commitments.
- measurement owner.
- baseline evidence.
- actuals.
- variance notes.
- value at risk.
- CFO/CIO implication.

Required artifacts:
- Value Ledger Assumptions.
- Executive Decision Brief.

Entry criteria: Selection and transition have produced a value baseline, committed economics, or measurement plan.

Exit criteria: Value ledger rows are classified as projected, committed, measuring, or realized with owner, evidence confidence, assumptions, and variance notes.

Gate owner: Finance/value owner with Atlas executive view.

Blockers:
- no measurement owner.
- baseline not usable evidence.
- actuals missing.
- vendor commitment not contract-backed.
- variance unexplained.
- claim not attributable.

Waiver/defer behavior: Value realization cannot be waived into realized value. A gap can be carried as projected or measuring, with clear confidence and next evidence request.

What appears above the fold: Value ledger command read: projected, committed, measuring, realized, value at risk, and confidence. It must never claim realized value just because selection is complete.

What appears in the primary workspace: Line-item value ledger table: source, baseline, commitment, current actual, variance, owner, evidence state, confidence, and next measurement action. CFO/CIO implication sits in a compact executive panel.

What appears in the agent rail: Atlas leads. Nexus states next operating action. Sentinel validates evidence confidence. Steward prevents close if measurement gate is unmet.

What appears in drawers: Value Assumptions Drawer, Evidence Drawer, Linked Program Drawer, Gate Detail Drawer.

Three choices plus custom examples:
- Show value gaps.
- Request measurement evidence.
- Prepare CFO brief.
- Custom: Custom examples: "Show savings that are contract-backed", "Explain variance from BAFO case", "Mark automation savings as projected only".

Context-used behavior: Context-used chips show baseline source, contract commitment, measurement evidence, owner, and value ledger status. Pattern guidance is never enough to label realized savings.

Acceptance criteria:
- Value Realization shows user goal, stage status, gate owner, blockers, and next action without scrolling past the primary workspace.
- Required data and artifacts are visible as concrete rows or strips, not hidden inside agent prose.
- Waiver and defer states remain visible with owner, rationale, and downstream impact.
- Agent rail copy is stage-specific and uses context-used chips before making evidence-sensitive claims.

## 4. Source Dashboard design

The `/source` dashboard is the Source command center. Its purpose is to answer, in the first three seconds, what sourcing events exist, where pressure is building, what value is at stake, which events are waiting, and what Nexus recommends opening first. It should not start with a giant chat area or a vague "Ask Sentinel" heading. The page should orient the user before asking them to type.

First three seconds: the user sees the AbarVa wordmark, tenant, Source label, a clear title such as "Source command center", a primary action named "Create sourcing event", a compact Nexus command read, a value-at-stake summary, pressure signals, and the event portfolio table. If the user is authenticated as an Apex Retail operator, the page should use Apex Retail seeded facts where available and disclose seeded state where facts are not live.

Key visual zones:
- Header: tenant, Source, create event action, optional linked program filter.
- Mission preview: Nexus reads the portfolio and names the top event needing attention.
- Pressure signals: waiting on client, waiting on vendor, at risk, BAFO, selection-ready, value at stake.
- Event portfolio table: primary operating surface.
- Right rail or side panel: mission preview, top blocker, linked programs, and value implication.
- Drawers: event preview, evidence, linked program, value assumptions, and gate detail.

Event portfolio table columns should include event name, archetype, current stage, lifecycle status, owner, linked program, value at stake, readiness posture, top blocker, next action, aging, and evidence state. Status filters should include All, Active, Waiting, At Risk, BAFO, Evaluation, Responses, Selection Ready, and Value Realization. Filters preserve context and update the mission preview, not merely hide rows.

The dashboard should support click behavior that makes the product intent obvious. Clicking a row opens `/source/events/[eventId]`. Clicking value at stake opens the Value Assumptions Drawer. Clicking linked program opens the Linked Program Drawer. Clicking top blocker opens Gate Detail or Evidence Drawer depending on blocker type. Clicking Create sourcing event opens the creation/intake path. If creation runtime is not implemented, the page may show a design-safe path description, but it must not fake event persistence.

What must not appear: a full dark dashboard, a long generic chat, a decorative card grid that hides the table, a release action for an event that is not ready, fake live evidence claims, uncited market benchmark claims, or a static "AI can help" panel.

Empty state: show why Source exists, what a sourcing event is, and a single primary action to create or connect an event. Loading state: show shell, filters, and table skeleton with disabled risky actions. Error state: show which data failed and prevent unsafe actions; do not fall back to generic chatbot assistance. Seeded state: state that portfolio facts are seeded or deterministic if no live persistence exists.

Acceptance criteria:
- `/source` communicates purpose and next action in the first viewport.
- The event portfolio table is the dominant workspace.
- Create sourcing event is visible, named, and not buried behind chat.
- Mission preview, pressure signals, value summary, and filters update from event context.
- No runtime persistence, approval, model, or upload behavior is implied unless implemented.

## 5. Source Events Portfolio design

`/source/events` is the portfolio command surface for operators who want the full queue rather than the dashboard summary. It should feel like the sourcing operations room: event count, value at stake, waiting events, blocked events, linked program count, and stage distribution are visible at the top. The primary workspace is a table, not cards.

The page answers: which events are active, which are waiting, which are blocked, which are linked to Programs, who owns the next action, and what value or risk is exposed. It uses the same design language as `/source` but with more table depth and less marketing explanation.

Table columns: event, tenant/client, archetype, linked program, current stage, lifecycle status, owner, gate status, evidence state, data readiness, vendor count, normalized value, value at stake, top blocker, next action, aging, and last updated. Columns should be text-first and sortable where safe. Badge overload is an anti-pattern; statuses must be readable.

Filters: stage, lifecycle, owner, linked program, archetype, evidence state, gate state, value band, aging, and blocked reason. Status filter behavior should preserve the Nexus briefing and update it: "Showing 2 BAFO events; 1 has weak walkaway credibility." A filtered empty state should say what the filter means and how to clear it.

Context-used behavior: the page should show a compact context strip for the current table view: source event seed or persistence state, tenant, filter set, pattern basis, and live/seeded evidence state. If the user asks Nexus about the table, Nexus should answer from the filtered view and disclose that context.

Workflow rail: a right rail can show journey distribution, top gate blockers, and pressure signals. It should not replace the table. Row click opens event canvas. Top blocker opens Gate Detail Drawer. Linked program opens Linked Program Drawer. Evidence state opens Evidence Drawer.

Acceptance criteria:
- The portfolio page is table-forward and lets users triage many events quickly.
- Event count, value at stake, waiting/blocked count, and linked program count are visible.
- Filters alter both table and Nexus briefing context.
- Row and drawer behavior is deterministic and safe.
- No vendor selection, approval, or live data claim is implied without supporting state.

## 6. Source Event Canvas design

`/source/events/[eventId]` is the Source center of gravity. It must not force the user to scroll eight pages to reach the agent or the actual work. The first viewport should contain the event header, linked program badge, journey map, current stage workspace, stage gate panel, artifact strip, mission preview, data readiness summary, commercial intelligence summary when relevant, persistent Nexus rail, and context-used access. It may be dense, but it must be organized as an operating canvas.

Event header: event name, tenant, event id or short code, archetype, linked program badge, rigor, current stage, lifecycle, owner, value at stake, and top blocker. If the event is seeded or deterministic, the header or context strip should disclose that status.

Journey map: horizontal stage map with Strategy through Value Realization. It must show current, complete, blocked, waiting, and future states. Stages can be clicked for preview, but future-stage actions stay disabled unless entry criteria are met. Clicked future stages can open a drawer explaining prerequisites.

Current stage workspace: the center column changes by stage. Scope shows scope tables. RFP readiness shows section readiness. Vendor Responses shows completeness table. Pricing shows normalized comparison. BAFO shows question matrix. Executive Decision shows tradeoff table. Selection Readiness shows governance checklist. Transition shows mobilization checklist. Value Realization shows ledger.

Stage gate panel: visible near the workspace, not hidden. It shows gate state, owner, required data, artifacts, evidence, approval state, blockers, waiver/defer path, and suggested next action. Full approval engine is not implemented yet and should not be implied; planned approval state can be shown as a requirement, not as a completed approval.

Artifact strip: compact rows for stage artifacts with status, version, owner, evidence state, missing input, and primary action. Clicking opens Artifact Detail Drawer. It should never look like a static file gallery.

Persistent Nexus rail: Nexus is the lead work guide. The rail includes a concise status, missing context, top action, three choices plus custom only when appropriate, context-used chips, and handoff notes from Sentinel, Steward, or Atlas. It should not create a full generic chat panel. If chat exists later, it should be a compact interaction mode attached to the workbench, not the workbench itself.

Drawers: Context Used, Evidence, Gate, Artifact, Vendor/Pricing, Linked Program, Risk/Exception, and Value Assumptions. Drawers should not become new pages unless the work is complex enough for a dedicated route.

Acceptance criteria:
- The event canvas communicates event, stage, blocker, gate, artifact, data, and next action above the fold.
- The center workspace changes by stage and remains table-forward.
- The agent rail is concise, context-aware, and tied to real state.
- Drawers expose detail without replacing the primary workflow.
- Seeded, deterministic, or non-live states are disclosed.

## 7. Scope workspace design

The Scope workspace answers one question: "Is this scope pricing-ready?" It is not a form and not a chat transcript. It is a workbench that shows the scope boundary, evidence readiness, and RFP impact.

Readiness state: Ready, Outline-only, Stub-only, Blocked, Waiver Required, or Not Enough Context. The label must be tied to specific rows. For AMS, the most important data rows are application inventory, app criticality, business/IT ownership, ticket history, incident/problem/request/enhancement volumes, current cost, support hours, SLA expectations, retained roles, and vendor contracts.

In-scope table: service/tower, description, volume basis, owner, evidence state, pricing impact, assumptions, and next action. Out-of-scope table: excluded service, reason, approval owner, vendor communication impact, and risk if vendors price it implicitly. Assumptions table: assumption, owner, evidence state, pricing impact, status, and action. Ambiguities table: ambiguity, likely commercial consequence, owner, due date, and whether it blocks RFP tier.

Missing inputs and data readiness dependencies should be grouped by required, recommended, and optional. Each row uses the readiness states from Admin/Setup: Missing, Requested, Uploaded, Connected, Loaded, Parsed, Available, Usable Evidence, Low Confidence, Stale, Access Restricted, Not Applicable, and Waived. Loaded is not usable. Uploaded is not parsed. Available is not validated evidence. This distinction should be visible.

RFP tier impact: Scope drives Rich, Outline, Stub, Blocked, or Waiver Required. A missing ticket baseline for AMS should block Rich RFP and pricing normalization. A missing vendor contract may allow Outline if spend extracts exist, but the panel should say commercial confidence is lower.

Agent behavior: Nexus says whether the scope is pricing-ready and what must happen next. Steward says whether the Scope-to-RFP gate is blocked or waiver-required. Sentinel notes low-confidence or unavailable evidence. Atlas states value implication: "Savings remain projected because current run-cost baseline is not usable evidence."

Suggested actions: show missing inputs, draft minimum data request, review exclusions, request waiver, route setup gap to Steward/Admin, or ask custom question. The UI should avoid a long response when the user only asks what to do next.

Acceptance criteria:
- Scope workspace directly answers pricing readiness.
- In-scope, out-of-scope, assumptions, ambiguities, and data dependencies are table-driven.
- RFP tier impact is visible beside missing inputs.
- Nexus, Steward, Sentinel, and Atlas each have distinct functional notes.
- A scope cannot look ready while required baselines are missing or only uploaded.

## 8. Data readiness design

Data readiness is owned by Admin/Setup. Source consumes readiness to make sourcing decisions. Source should not create a duplicate connector setup, dataset inventory, parsing pipeline, file store, access-control model, or evidence store. When Source needs data, it explains the sourcing impact and routes the user toward the Admin/Setup-owned action.

Readiness states: Missing, Requested, Uploaded, Connected, Loaded, Parsed, Available, Usable Evidence, Low Confidence, Stale, Access Restricted, Not Applicable, Waived. These states are not synonyms. Uploaded means a file exists. Loaded means the platform has ingested data. Parsed means the platform has extracted structure. Available means data can be viewed or retrieved. Usable Evidence means Source can rely on it for claims, citations, artifacts, scorecards, gates, pricing, or value. Low Confidence means the source exists but quality, completeness, provenance, or extraction confidence is weak. Stale means age affects confidence. Access Restricted means the data exists but this user or agent cannot use it. Waived means an authorized owner accepted the gap and its impact.

Panel layout: Data Readiness for This Event. Rows include data category, required/recommended/optional, readiness state, evidence usability, owner, source system or file, last updated, confidence, workflow impact, Nexus recommendation, Steward/Admin handoff, and affected artifacts/gates. The panel appears in the event canvas and opens a drawer for full detail.

Workflow impact: data readiness affects RFP tier, scope gate, scorecard confidence, vendor response citation, pricing normalization, BAFO asks, selection readiness, and value ledger confidence. Missing ticket history may block pricing normalization. Uploaded vendor proposals may not be citable until parsed and validated. Access-restricted contract data may require Steward/Admin handoff.

Missing data behavior: the UI should not shame the user with a blank screen. It should show the minimum data request, owner, why it matters, which stage it blocks, and safe next action. Nexus should say, "We can draft an Outline path, but not Rich RFP, until ticket history is usable evidence." Steward should say, "Admin/Setup action required: connect ServiceNow export or upload ticket history." Sentinel should say, "Do not cite the uploaded file until parsing and evidence validation complete."

Acceptance criteria:
- Source distinguishes loaded, available, and usable evidence.
- Admin/Setup ownership is explicit.
- Data readiness rows show owner, source, last updated, confidence, workflow impact, and handoff.
- Missing or weak data changes agent guidance, gates, artifact tier, and value confidence.
- Source never treats uploaded files as trusted evidence by default.

## 9. RFP readiness design

RFP readiness states: Rich, Outline, Stub, Blocked, Waiver Required. Rich means scope, pricing template, required sections, scorecard dependency, approval dependency, and evidence dependency are strong enough for decision-grade vendor-facing material. Outline means the event can structure the package but must show gaps. Stub means only a skeletal package is safe. Blocked means vendor-facing material should not be prepared. Waiver Required means a reviewer may proceed under accepted risk, but downstream impact must remain visible.

Required inputs: scope boundary, out-of-scope list, assumptions, required baselines, vendor universe, pricing model, evaluation criteria, Q&A process, security/legal terms, transition expectations, approval path, and evidence basis. Required sections: executive brief, event context, scope, service model, requirements, pricing template, vendor response instructions, Q&A protocol, evaluation process, transition expectations, security/compliance response, and commercial terms.

Pricing template readiness is a first-class dependency. If the pricing template does not force vendors into comparable fields, the RFP package should not appear release-ready. Scorecard dependency is also first-class: criteria and weighting must be known before vendor responses arrive, or evaluation becomes biased by vendor narratives.

Nexus recommendation: short, specific, and tier-based. Example: "This is Outline-ready, not Rich-ready. Scope exclusions are clear, but ticket history and current run cost are not usable evidence. Next action: issue minimum data request or request a finance waiver." Steward release gate: shows required approvals and blockers. Sentinel evidence notes: identifies sections without citable support.

Acceptance criteria:
- RFP readiness uses Rich, Outline, Stub, Blocked, and Waiver Required consistently.
- Required inputs and sections are visible as rows with status and owner.
- Pricing template, scorecard, approvals, and evidence dependencies affect readiness.
- Nexus, Steward, and Sentinel guidance is concise and tied to specific blockers.
- The UI never shows release-ready posture when evidence or gate state cannot support it.

## 10. Vendor response completeness design

Vendor response states: complete, partially complete, incomplete, not comparable, blocked, late, clarification requested, withdrawn, and accepted with condition. A response is complete only when required sections exist in comparable structure and the claims can be inspected. A response can be present but not comparable. It can be complete in file count but weak in evidence.

Required sections: executive response, scope confirmation, pricing template, assumptions, exclusions, transition plan, delivery model, SLA commitments, security/compliance response, automation/productivity commitments, references/evidence, and commercial terms. Submitted/missing sections should appear per vendor in a matrix. Pricing template status, transition plan status, assumptions/exclusions, evidence status, comparability status, and recommended next action should be visible in the same row.

Table design: vendor rows, section group columns, status cells, evidence confidence, comparability, blocker, next action, owner, due date. A summary footer states how many vendors are evaluable. Row click opens Vendor Detail Drawer. Missing section click opens Risk/Exception Drawer or Vendor Detail Drawer. Evidence cell opens Evidence Drawer.

Agent behavior: Nexus says which vendors are evaluable. Sentinel says which vendor claims cannot be cited. Steward says whether Evaluation can begin. Atlas says whether executive confidence is weakening. Example Nexus copy: "Two vendors are evaluable. Vendor B is not comparable because transition cost and excluded services are missing; do not rank it against the others until clarification returns."

Acceptance criteria:
- Completeness and comparability are different states.
- Required sections are visible by vendor.
- Pricing, transition, assumptions, exclusions, evidence, and next action are visible in the table.
- Agent guidance prevents premature Evaluation.
- Uploaded but unparsed submissions are not treated as citable evidence.

## 11. Pricing normalization design

Pricing normalization shows normalized annual run cost, year 1, year 2, year 3, transition-inclusive cost, one-time cost, optional and excluded services, ticket volume assumptions, app count assumptions, SLA assumptions, onshore/offshore mix, rate escalation, automation assumptions, change-order exposure, and commercial traps. It should help users understand what vendors are pricing, what they excluded, and why lower price may be less valuable or more risky.

Visual comparison design: a table first, then a small multi-year cost visual. Rows are vendors. Columns are base annual run cost, transition cost, one-time cost, year-one total, year-two total, year-three total, app count assumed, ticket volume assumed, SLA coverage, support hours, offshore/onshore mix, automation commitment, exclusions, change-order exposure, and trap flags. A side-by-side visual can show year 1/2/3 bars, but bars must never hide assumptions.

Commercial traps: low base fee with high change-order rates, transition excluded, release support excluded, minor enhancements excluded, tooling excluded, security/compliance excluded, low volume assumption, weak SLA credits, uncommitted automation savings, high rate escalation, unrealistic offshore mix, KT not priced, hidden retained-team burden, out-of-hours support excluded, and optional services hiding required scope. Each trap has evidence basis, commercial impact, negotiation question, and mitigation.

Acceptance criteria:
- Normalized cost views separate base run cost, transition, one-time, options, exclusions, and assumptions.
- Year 1/2/3 comparison is visible and assumption-backed.
- Commercial traps are attached to vendor-specific evidence.
- The design does not require paid third-party benchmarks for MVP.
- Value confidence improves only when commercial commitments are evidence-backed.

## 12. BAFO / negotiation design

BAFO is where Source should feel commercially sharp. The workspace shows vendor-specific BAFO questions, assumption lock list, excluded scope list, commercial risk summary, BAFO priorities, negotiation asks, expected value impact, and risk notes. It should not produce generic negotiation advice.

Vendor-specific BAFO questions must cite the gap they address. Example: "Your pricing assumes 1,200 incidents per month, but the client baseline shows 1,850. Confirm whether the fixed fee covers current volume or only your lower assumed volume." Assumption lock list includes app count, ticket volume, severity mix, support hours, SLA model, transition inclusion, release support, minor enhancement threshold, tooling, and automation commitments. Excluded scope list shows what must be moved into base price, priced separately, accepted as risk, or removed from scope.

Nexus guidance: sequence the asks, separate must-lock from nice-to-have, and explain expected value impact. Sentinel evidence caution: label each ask with proposal evidence, client baseline evidence, or pattern basis. Atlas executive tradeoff: explain whether negotiation is protecting savings, reducing transition risk, or improving service accountability. Steward gate: BAFO-to-selection cannot clear if must-lock items are unresolved.

Acceptance criteria:
- BAFO questions are vendor-specific and evidence-backed.
- Assumption locks, exclusions, priorities, asks, expected impact, and risks are visible.
- Nexus, Sentinel, Atlas, and Steward each provide distinct guidance.
- BAFO output does not imply selection approval.
- Deferred BAFO gaps remain visible in Executive Decision and Vendor Selection Readiness.

## 13. Executive decision summary design

The executive decision summary answers what decision is needed, what the recommended posture is, which vendors are viable, what tradeoffs matter, what value is at stake, what commercial and transition risks remain, how confident the evidence is, which assumptions remain unresolved, what blockers exist, and what options the executive can choose.

Decision posture can be recommend, recommend with conditions, defer, re-open BAFO, re-scope, or no viable vendor. Viable vendors and blocked vendors appear in a table. Vendor tradeoff table columns: normalized cost, transition-inclusive cost, commercial risk, transition risk, evidence confidence, scorecard posture, value impact, unresolved assumptions, and next action.

Atlas brief: concise executive language, no fluff. Example: "Vendor A is the strongest risk-adjusted choice if transition cost is included in the final commercial schedule. Vendor B is cheaper on base run cost but excludes release support and assumes ticket volumes below baseline. Decision options: select Vendor A with transition lock, reopen BAFO on Vendor B, or defer selection until release support pricing is clarified."

Nexus next action: prepare selection memo, resolve blockers, or route to BAFO. Sentinel cautions: unsupported savings, weak transition evidence, missing contract proof. Steward notes: required approvals, gate state, and any conditional approval requirements.

Acceptance criteria:
- Executive decision summary includes decision needed, posture, viable vendors, tradeoffs, value, risks, evidence, assumptions, blockers, and options.
- Atlas copy is executive-grade and context-specific.
- Nexus, Sentinel, and Steward notes are concise and functional.
- The design does not automate final vendor selection.
- Low-confidence evidence cannot support clean recommendation language.

## 14. Vendor selection readiness design

Vendor selection readiness determines whether the selection review is ready, conditional, or blocked. It is not final vendor selection automation. The readiness status should say selection review ready yes, conditional, or no. Selection posture should say preferred vendor supported, preferred vendor conditional, multiple viable vendors, no viable vendor, or re-open BAFO.

The workspace shows viable vendors, blocked vendors, unresolved commercial issues, unresolved evidence issues, unresolved gate issues, required artifacts, required approvals, recommendation posture, and what is not automated. Required artifacts include Executive Decision Brief, Vendor Selection Memo, Pricing Normalization Workbook, BAFO Question Pack or closure summary, and Transition Readiness Checklist.

Required approvals are rendered as planned or required approval states unless the approval engine exists. The UI can show who must approve, why, and what is blocking; it must not pretend an approval workflow executed if it did not. Steward leads. Nexus recommends next action. Sentinel flags unsupported claims. Atlas describes executive consequence.

Acceptance criteria:
- Selection readiness is clearly yes, conditional, or no.
- Viable and blocked vendors are visible.
- Commercial, evidence, gate, artifact, and approval blockers are listed.
- The UI says Source prepares the decision; humans make the selection.
- Approval engine behavior is not implied before implementation.

## 15. Scorecard governance design

Scorecard governance is a Steward-led workspace. It protects evaluation from drift, bias, missing rationale, and unsupported scoring. It includes a readiness meter, criteria table, rationale state, audit trail plan, gate impact, evidence confidence, and action layer.

Criteria categories: commercial, transition, evidence, automation, risk, governance. Each criterion has default pattern basis, event-specific wording, weight, owner, rationale required yes/no, evidence requirement, scoring scale, and lock state. Missing rationale behavior is strict: a score without rationale is incomplete, not merely weak. If evidence confidence is low, the criterion can still be scored only with explicit caveat.

Action layer: review defaults, edit criterion, request rationale, attach evidence, lock scorecard, reopen with reason, export review packet later when export exists. What is deferred: full audit engine, approval routing runtime, document export, and automatic model-generated scoring. Steward can show these as required future capabilities, not as current behavior.

Acceptance criteria:
- Scorecard governance is Steward-led and readiness-metered.
- Criteria table includes commercial, transition, evidence, automation, risk, and governance.
- Missing rationale and low evidence confidence affect readiness.
- Gate impact is visible.
- No automated final scoring or vendor selection is implied.

## 16. Artifact detail/review design

Artifact detail/review surfaces show title, status, version, owner, stage, evidence state, missing inputs, review state, planned approval state, version plan, evidence rail, context-used, and Nexus editorial guidance. The artifact metadata strip must appear at the top. Users should not need to open a document body to know whether it is usable.

Artifact states: Not Started, Draft, Needs Inputs, In Review, Changes Requested, Approved, Locked, Issued, Superseded, Archived. Evidence state: missing, partial, usable evidence, low confidence, stale, access restricted, waived. Review state: not required, not started, pending, changes requested, approved, rejected, waived. Version behavior: future versioning must preserve prior versions and review state; until the engine exists, the UI should describe version requirement without pretending version history is live.

Nexus editorial: concise help on what the artifact needs. Example: "The Scope Document is Draft. It has clear inclusions and exclusions, but pricing baselines are missing. Next action: attach usable ticket history or downgrade RFP path to Outline." Upload/re-upload caveat: file uploads are not trusted evidence until Admin/Setup and Sentinel readiness say usable.

Acceptance criteria:
- Artifact metadata strip shows status, version, owner, evidence state, and missing inputs.
- Review and approval states are visible without implying unimplemented workflow execution.
- Evidence rail and context-used strip distinguish pattern guidance from client evidence.
- Nexus editorial is artifact-specific and concise.
- Upload/re-upload behavior is described as future or dependent where not implemented.

## 17. Value ledger design

The value ledger is Atlas-led. It distinguishes projected, committed, measuring, and realized value. Projected means modeled or expected. Committed means supported by vendor or contract commitment. Measuring means actuals are being tracked against baseline. Realized means evidence supports the value claim and an owner accepts it.

Line-item table columns: value item, stage created, source, projected amount, committed amount, actual amount, measurement owner, baseline evidence, confidence, assumptions, variance notes, value at risk, CFO implication, CIO implication, and next measurement action. Examples: run-rate savings, transition cost avoidance, automation productivity, SLA/service improvement, retained-team burden reduction, contract leakage avoided, and price-down commitment.

What not to claim: Source should not claim realized savings without baseline, actuals, measurement owner, and evidence. It should not treat vendor-proposed savings as realized. It should not improve confidence when a vendor lowers price by excluding required scope. It should not use pattern guidance as value proof.

Acceptance criteria:
- Value ledger distinguishes projected, committed, measuring, and realized.
- Each line item has owner, evidence confidence, assumptions, variance, and value at risk.
- CFO/CIO implication is visible at executive moments.
- Unsupported value claims are blocked or caveated.
- Atlas leads value narrative, Sentinel validates evidence, and Steward blocks close when measurement is missing.

## 18. Stage gates and approvals design

Stage gates are the product honesty layer. They show what is required, what is missing, who owns it, what can be waived, what must block, and what should happen next. Full approval engine is not implemented yet and should not be implied. The design can render required approval, planned approval state, and reviewer responsibility; it cannot claim an approval was executed unless a real approval record exists.

### Strategy to Scope

Owner: Sourcing lead.

Required data: event thesis, archetype, owner, value-at-stake basis.

Required artifact: Sourcing Strategy Memo or intake brief.

Required evidence: trigger, owner, spend/value basis, linked program context if embedded.

Required approval: procurement sponsor review requirement.

Blockers: no owner; unclear event thesis; no value/risk basis; wrong archetype confidence.

Waiver/defer logic: Can defer market detail, cannot defer owner or thesis.

UI rendering: Gate card beside journey map with blocker count and Start Scope action disabled until clear.

Suggested actions: Confirm owner, generate minimum data request, link program, or revise archetype.

Acceptance criteria:
- Gate state, owner, blockers, required artifact, required evidence, and approval requirement are visible.
- Unsafe next-stage actions are disabled or clearly conditional.
- Waiver/defer language preserves downstream impact.
- Agent copy does not override deterministic gate state.

### Scope to RFP

Owner: Steward with sourcing lead.

Required data: scope boundary, exclusions, baselines, assumptions, data readiness.

Required artifact: Scope Document and Minimum Data Request.

Required evidence: usable or waived required baselines, owner map, in/out scope evidence.

Required approval: business sponsor or procurement release review requirement.

Blockers: missing inventory, missing cost/ticket baseline, ambiguous all-towers scope, no exclusions.

Waiver/defer logic: Waiver downgrades RFP tier and keeps impact visible.

UI rendering: RFP action card shows Rich/Outline/Stub/Blocked.

Suggested actions: Resolve missing input, request waiver, or downgrade package tier.

Acceptance criteria:
- Gate state, owner, blockers, required artifact, required evidence, and approval requirement are visible.
- Unsafe next-stage actions are disabled or clearly conditional.
- Waiver/defer language preserves downstream impact.
- Agent copy does not override deterministic gate state.

### RFP to Vendor Responses

Owner: Procurement lead.

Required data: RFP package, pricing template, vendor list, scorecard dependency, Q&A plan.

Required artifact: RFP Package and Pricing Template.

Required evidence: scope evidence, pricing basis, approval evidence, scorecard basis.

Required approval: release approval requirement.

Blockers: unapproved package, missing pricing template, unlocked scorecard, no Q&A protocol.

Waiver/defer logic: Waiver can issue Outline/Stub only with visible risk.

UI rendering: Release gate panel with package readiness and disabled issue action if blocked.

Suggested actions: Fix package, lock scorecard, review approval path.

Acceptance criteria:
- Gate state, owner, blockers, required artifact, required evidence, and approval requirement are visible.
- Unsafe next-stage actions are disabled or clearly conditional.
- Waiver/defer language preserves downstream impact.
- Agent copy does not override deterministic gate state.

### Vendor Responses to Evaluation

Owner: Evaluation chair.

Required data: response completeness, pricing template status, assumptions/exclusions, evidence status.

Required artifact: Vendor Response Completeness Checklist.

Required evidence: vendor files, parsed/citable evidence, Q&A closure.

Required approval: response acceptance requirement.

Blockers: not comparable vendor responses, missing pricing, weak evidence, late vendor action.

Waiver/defer logic: Conditional evaluation allowed only with affected criteria caveated.

UI rendering: Gate panel says Evaluation ready yes/conditional/no.

Suggested actions: Request clarification, exclude blocked vendor, or accept condition.

Acceptance criteria:
- Gate state, owner, blockers, required artifact, required evidence, and approval requirement are visible.
- Unsafe next-stage actions are disabled or clearly conditional.
- Waiver/defer language preserves downstream impact.
- Agent copy does not override deterministic gate state.

### Evaluation to BAFO

Owner: Steward with evaluation chair.

Required data: locked scorecard, scoring rationale, pricing normalization, risk exceptions.

Required artifact: Evaluation summary and Pricing Normalization Workbook.

Required evidence: score rationale, normalized pricing, evidence support.

Required approval: evaluation governance review.

Blockers: unlocked criteria, missing rationale, unnormalized pricing, unsupported score.

Waiver/defer logic: Can defer low-impact rationale only with visible confidence downgrade.

UI rendering: BAFO gate card with must-lock issues.

Suggested actions: Complete rationale, normalize price, or reopen criteria.

Acceptance criteria:
- Gate state, owner, blockers, required artifact, required evidence, and approval requirement are visible.
- Unsafe next-stage actions are disabled or clearly conditional.
- Waiver/defer language preserves downstream impact.
- Agent copy does not override deterministic gate state.

### BAFO to Selection

Owner: Procurement lead and executive sponsor.

Required data: BAFO response, assumption locks, exclusions, residual risk.

Required artifact: BAFO Question Pack and closure summary.

Required evidence: vendor BAFO answers, pricing updates, risk resolution.

Required approval: sponsor and procurement approval requirement.

Blockers: must-lock ask unresolved, walkaway signal weak, commercial trap open.

Waiver/defer logic: Can move conditional only when residual risk is assigned to contracting or selection review.

UI rendering: Selection gate shows unresolved must-lock items.

Suggested actions: Reopen BAFO, accept condition, or block selection.

Acceptance criteria:
- Gate state, owner, blockers, required artifact, required evidence, and approval requirement are visible.
- Unsafe next-stage actions are disabled or clearly conditional.
- Waiver/defer language preserves downstream impact.
- Agent copy does not override deterministic gate state.

### Selection to Transition

Owner: Executive sponsor with Steward gate.

Required data: selection posture, required approvals, transition owner, contract state.

Required artifact: Vendor Selection Memo and Transition Readiness Checklist.

Required evidence: decision brief, approval evidence, transition risk evidence.

Required approval: executive selection approval requirement.

Blockers: no selected vendor, required approval missing, transition owner absent, contract mismatch.

Waiver/defer logic: Conditional transition only with explicit contract/mobilization conditions.

UI rendering: Transition gate with owner and conditions.

Suggested actions: Assign owner, finalize selection memo, route approval.

Acceptance criteria:
- Gate state, owner, blockers, required artifact, required evidence, and approval requirement are visible.
- Unsafe next-stage actions are disabled or clearly conditional.
- Waiver/defer language preserves downstream impact.
- Agent copy does not override deterministic gate state.

### Transition to Value Realization

Owner: Transition owner and finance/value owner.

Required data: mobilization plan, KT plan, contract commitment, measurement owner.

Required artifact: Transition Readiness Checklist and Value Ledger Assumptions.

Required evidence: KT evidence, contract alignment, baseline and measurement plan.

Required approval: transition readiness review.

Blockers: KT missing, owner absent, measurement plan missing, contract gap.

Waiver/defer logic: Can defer non-critical workstream with due date; cannot defer measurement owner.

UI rendering: Value gate shows readiness and measurement setup.

Suggested actions: Complete KT plan, assign measurement owner, update ledger.

Acceptance criteria:
- Gate state, owner, blockers, required artifact, required evidence, and approval requirement are visible.
- Unsafe next-stage actions are disabled or clearly conditional.
- Waiver/defer language preserves downstream impact.
- Agent copy does not override deterministic gate state.

### Value Realization to Closed

Owner: Finance/value owner with Atlas review.

Required data: actuals, baseline, variance, evidence confidence, owner attestation.

Required artifact: Value Ledger Assumptions and realization report.

Required evidence: measurement evidence, actuals, variance notes.

Required approval: finance/value signoff requirement.

Blockers: no actuals, baseline not usable, variance unexplained, no owner.

Waiver/defer logic: Cannot waive into realized; can close with projected/unrealized status if explicit.

UI rendering: Close gate shows realized/projection split.

Suggested actions: Request actuals, explain variance, keep measuring, or close as not realized.

Acceptance criteria:
- Gate state, owner, blockers, required artifact, required evidence, and approval requirement are visible.
- Unsafe next-stage actions are disabled or clearly conditional.
- Waiver/defer language preserves downstream impact.
- Agent copy does not override deterministic gate state.

## 19. Deliverables and artifacts design

Deliverables are not decorative files. Each artifact maps to a stage, owner agent, reviewer, approval state, evidence requirement, missing input behavior, versioning requirement, future export behavior, UI placement, and acceptance criteria. Future export behavior is allowed as a design requirement, but export/import runtime is not approved by this document.

### Sourcing Strategy Memo

Stage: Strategy.

Purpose: states the why-now, sourcing model, value thesis, archetype, rigor, and governance path.

Owner agent: Nexus. Reviewer: Procurement sponsor. Approval state: planned review state. Evidence requirement: trigger, value basis, owner evidence. Missing input behavior: show missing trigger, owner, or value basis as blockers. Versioning requirement: retain versions once versioning engine exists. Future export behavior: export should preserve status, version, evidence state, and context-used record when export is implemented. UI placement: Strategy workspace and artifact strip.

Acceptance criteria:
- Artifact status, owner, evidence state, missing inputs, and review state are visible.
- Artifact cannot imply approval or issue state without supporting workflow record.
- Evidence requirements are stage-specific.
- Future export/version behavior is described without implying current runtime.

### Minimum Data Request

Stage: Strategy / Scope.

Purpose: asks for the least data needed to make scope and pricing credible.

Owner agent: Steward. Reviewer: Admin/Setup owner and sourcing lead. Approval state: planned review state. Evidence requirement: data category owner and readiness reason. Missing input behavior: show missing owner and workflow impact. Versioning requirement: retain request revisions and fulfilled state later. Future export behavior: export should preserve status, version, evidence state, and context-used record when export is implemented. UI placement: Scope workspace and Data Readiness drawer.

Acceptance criteria:
- Artifact status, owner, evidence state, missing inputs, and review state are visible.
- Artifact cannot imply approval or issue state without supporting workflow record.
- Evidence requirements are stage-specific.
- Future export/version behavior is described without implying current runtime.

### Scope Document

Stage: Scope.

Purpose: defines in-scope, out-of-scope, assumptions, ambiguities, and pricing impact.

Owner agent: Nexus. Reviewer: Business sponsor and sourcing lead. Approval state: planned review state. Evidence requirement: scope rows, baselines, exclusions. Missing input behavior: downgrade RFP tier or block when missing. Versioning requirement: version each scope boundary change later. Future export behavior: export should preserve status, version, evidence state, and context-used record when export is implemented. UI placement: Scope workspace and artifact drawer.

Acceptance criteria:
- Artifact status, owner, evidence state, missing inputs, and review state are visible.
- Artifact cannot imply approval or issue state without supporting workflow record.
- Evidence requirements are stage-specific.
- Future export/version behavior is described without implying current runtime.

### RFP Package

Stage: RFP / RFI Readiness.

Purpose: packages vendor-facing requirements, context, response instructions, and terms.

Owner agent: Nexus. Reviewer: Procurement, legal/security as required. Approval state: planned release approval. Evidence requirement: approved scope, pricing template, scorecard, evidence. Missing input behavior: show Rich/Outline/Stub/Blocked tier. Versioning requirement: version released packages later. Future export behavior: export should preserve status, version, evidence state, and context-used record when export is implemented. UI placement: RFP readiness workspace and artifact strip.

Acceptance criteria:
- Artifact status, owner, evidence state, missing inputs, and review state are visible.
- Artifact cannot imply approval or issue state without supporting workflow record.
- Evidence requirements are stage-specific.
- Future export/version behavior is described without implying current runtime.

### Pricing Template

Stage: RFP / RFI Readiness.

Purpose: forces comparable commercial input across vendors.

Owner agent: Steward. Reviewer: Commercial lead and finance. Approval state: planned review state. Evidence requirement: scope, baseline volumes, pricing fields. Missing input behavior: block release when comparability fields are missing. Versioning requirement: version field changes and released copy later. Future export behavior: export should preserve status, version, evidence state, and context-used record when export is implemented. UI placement: RFP readiness and pricing drawers.

Acceptance criteria:
- Artifact status, owner, evidence state, missing inputs, and review state are visible.
- Artifact cannot imply approval or issue state without supporting workflow record.
- Evidence requirements are stage-specific.
- Future export/version behavior is described without implying current runtime.

### Vendor Q&A Tracker

Stage: RFP / Vendor Responses.

Purpose: records vendor questions, responses, owners, and clarifications.

Owner agent: Nexus. Reviewer: Sourcing lead. Approval state: planned review state. Evidence requirement: vendor questions and answered clarifications. Missing input behavior: show unanswered critical questions as response blockers. Versioning requirement: retain Q&A rounds later. Future export behavior: export should preserve status, version, evidence state, and context-used record when export is implemented. UI placement: Vendor Responses workspace.

Acceptance criteria:
- Artifact status, owner, evidence state, missing inputs, and review state are visible.
- Artifact cannot imply approval or issue state without supporting workflow record.
- Evidence requirements are stage-specific.
- Future export/version behavior is described without implying current runtime.

### Vendor Response Completeness Checklist

Stage: Vendor Responses.

Purpose: states which vendor submissions are complete, partial, missing, not comparable, or blocked.

Owner agent: Sentinel. Reviewer: Sourcing lead and evaluation chair. Approval state: planned acceptance state. Evidence requirement: vendor sections, pricing, assumptions, evidence. Missing input behavior: show exact missing sections and next action. Versioning requirement: version per response round later. Future export behavior: export should preserve status, version, evidence state, and context-used record when export is implemented. UI placement: Vendor Responses workspace.

Acceptance criteria:
- Artifact status, owner, evidence state, missing inputs, and review state are visible.
- Artifact cannot imply approval or issue state without supporting workflow record.
- Evidence requirements are stage-specific.
- Future export/version behavior is described without implying current runtime.

### Pricing Normalization Workbook

Stage: Pricing Normalization.

Purpose: normalizes vendor economics and exposes traps.

Owner agent: Nexus. Reviewer: Finance/commercial lead. Approval state: planned review state. Evidence requirement: vendor pricing, baseline, assumptions, exclusions. Missing input behavior: show non-comparable fields and confidence downgrade. Versioning requirement: version every BAFO refresh later. Future export behavior: export should preserve status, version, evidence state, and context-used record when export is implemented. UI placement: Pricing Normalization workspace.

Acceptance criteria:
- Artifact status, owner, evidence state, missing inputs, and review state are visible.
- Artifact cannot imply approval or issue state without supporting workflow record.
- Evidence requirements are stage-specific.
- Future export/version behavior is described without implying current runtime.

### BAFO Question Pack

Stage: BAFO / Negotiation.

Purpose: creates vendor-specific negotiation questions and assumption locks.

Owner agent: Nexus. Reviewer: Procurement lead. Approval state: planned review state. Evidence requirement: evaluation gaps, pricing traps, evidence. Missing input behavior: show unsupported asks and missing evidence. Versioning requirement: version by BAFO round later. Future export behavior: export should preserve status, version, evidence state, and context-used record when export is implemented. UI placement: BAFO workspace.

Acceptance criteria:
- Artifact status, owner, evidence state, missing inputs, and review state are visible.
- Artifact cannot imply approval or issue state without supporting workflow record.
- Evidence requirements are stage-specific.
- Future export/version behavior is described without implying current runtime.

### Executive Decision Brief

Stage: Executive Decision.

Purpose: frames decision options, tradeoffs, value, risk, and confidence for executives.

Owner agent: Atlas. Reviewer: Executive sponsor. Approval state: planned approval state. Evidence requirement: scorecard, pricing, BAFO, evidence, value ledger. Missing input behavior: show unresolved blockers and caveats. Versioning requirement: version final and revised briefs later. Future export behavior: export should preserve status, version, evidence state, and context-used record when export is implemented. UI placement: Executive Decision workspace.

Acceptance criteria:
- Artifact status, owner, evidence state, missing inputs, and review state are visible.
- Artifact cannot imply approval or issue state without supporting workflow record.
- Evidence requirements are stage-specific.
- Future export/version behavior is described without implying current runtime.

### Vendor Selection Memo

Stage: Vendor Selection Readiness.

Purpose: records recommended posture, viable vendors, blocked vendors, residual risks, and required approvals.

Owner agent: Atlas. Reviewer: Executive sponsor and procurement. Approval state: planned approval state. Evidence requirement: decision brief, scorecard, pricing, risk acceptance. Missing input behavior: show selection not ready if approvals or evidence missing. Versioning requirement: version selection packets later. Future export behavior: export should preserve status, version, evidence state, and context-used record when export is implemented. UI placement: Selection Readiness workspace.

Acceptance criteria:
- Artifact status, owner, evidence state, missing inputs, and review state are visible.
- Artifact cannot imply approval or issue state without supporting workflow record.
- Evidence requirements are stage-specific.
- Future export/version behavior is described without implying current runtime.

### Transition Readiness Checklist

Stage: Transition.

Purpose: prepares mobilization, KT, contract alignment, owners, and milestones.

Owner agent: Steward. Reviewer: Transition owner. Approval state: planned readiness approval. Evidence requirement: selection memo, contract state, KT plan. Missing input behavior: show transition blockers by workstream. Versioning requirement: version by mobilization phase later. Future export behavior: export should preserve status, version, evidence state, and context-used record when export is implemented. UI placement: Transition workspace.

Acceptance criteria:
- Artifact status, owner, evidence state, missing inputs, and review state are visible.
- Artifact cannot imply approval or issue state without supporting workflow record.
- Evidence requirements are stage-specific.
- Future export/version behavior is described without implying current runtime.

### Value Ledger Assumptions

Stage: Value Realization.

Purpose: tracks projected, committed, measuring, and realized value basis.

Owner agent: Atlas. Reviewer: Finance/value owner. Approval state: planned finance signoff. Evidence requirement: baseline, commitment, actuals, owner, variance. Missing input behavior: show claims as projected until evidence supports realized. Versioning requirement: version assumptions and actuals later. Future export behavior: export should preserve status, version, evidence state, and context-used record when export is implemented. UI placement: Value Ledger workspace.

Acceptance criteria:
- Artifact status, owner, evidence state, missing inputs, and review state are visible.
- Artifact cannot imply approval or issue state without supporting workflow record.
- Evidence requirements are stage-specific.
- Future export/version behavior is described without implying current runtime.

## 20. Agent behavior and editorial examples

Agents in Source should speak like a disciplined consulting team. Nexus leads the work. Sentinel challenges evidence. Atlas briefs executives. Steward enforces gates. They should not sound interchangeable, and they should not create long generic answers when the user needs one concrete next action. Each response should use the current event, stage, evidence state, blockers, and allowed actions.

### Nexus

Stage-specific responsibilities: lead sourcing workflow, sequence next action, explain stage posture, draft safe artifact paths, and keep the user moving through evidence-backed sourcing work.

What Nexus says: short, context-aware, stage-aware guidance that names the current object, blocker, evidence state, and next action.

What Nexus never says: never invent client facts, never give a long essay when one action is required, never claim release or selection readiness when Steward state blocks it, and never hide missing context.

Suggested action sets: show blockers, draft minimum data request, prepare artifact path, compare vendors, prepare BAFO asks, route to Steward/Admin.

Handoffs: Nexus remains the front door. Sentinel is invoked for evidence-sensitive claims. Atlas is invoked for executive framing. Steward is invoked for gate, approval, readiness, waiver, or audit-sensitive actions.

### Sentinel

Stage-specific responsibilities: validate evidence strength, citeability, low-confidence data, unsupported vendor claims, stale inputs, access restrictions, and commercial-trap evidence.

What Sentinel says: short, context-aware, stage-aware guidance that names the current object, blocker, evidence state, and next action.

What Sentinel never says: never replace Nexus as the lead workflow voice, never certify evidence that is only uploaded or loaded, and never allow unsupported savings or vendor claims to look final.

Suggested action sets: show missing evidence, flag low-confidence claim, open evidence drawer, label pattern-only guidance, request source refresh, mark vendor claim uncitable.

Handoffs: Nexus remains the front door. Sentinel is invoked for evidence-sensitive claims. Atlas is invoked for executive framing. Steward is invoked for gate, approval, readiness, waiver, or audit-sensitive actions.

### Atlas

Stage-specific responsibilities: translate sourcing state into executive implication, value-at-stake, CFO/CIO tradeoff, decision posture, portfolio impact, and value confidence.

What Atlas says: short, context-aware, stage-aware guidance that names the current object, blocker, evidence state, and next action.

What Atlas never says: never make executive recommendation from weak evidence, never convert projected value into realized value, and never bury caveats behind polished prose.

Suggested action sets: prepare executive brief, show CFO impact, show CIO transition risk, summarize decision options, explain value confidence, flag portfolio implication.

Handoffs: Nexus remains the front door. Sentinel is invoked for evidence-sensitive claims. Atlas is invoked for executive framing. Steward is invoked for gate, approval, readiness, waiver, or audit-sensitive actions.

### Steward

Stage-specific responsibilities: enforce gates, readiness, scorecard lock, approval requirements, data handoff, auditability, waiver/defer logic, and unsafe action prevention.

What Steward says: short, context-aware, stage-aware guidance that names the current object, blocker, evidence state, and next action.

What Steward never says: never act like a conversational assistant, never let narrative override deterministic state, never hide waiver impact, and never imply approval engine behavior before implementation.

Suggested action sets: show gate blockers, require owner, record planned waiver path, block unsafe stage move, route Admin/Setup data action, show readiness meter.

Handoffs: Nexus remains the front door. Sentinel is invoked for evidence-sensitive claims. Atlas is invoked for executive framing. Steward is invoked for gate, approval, readiness, waiver, or audit-sensitive actions.

Concrete response examples:

- Nexus full-context Scope: "Scope is not pricing-ready yet. I can see the AMS scope, out-of-scope security operations, app inventory uploaded, and finance spend extract loaded, but ticket history is not usable evidence. Next action: ask Admin/Setup to make ticket volumes usable or downgrade the RFP path to Outline. Choices: show missing inputs, draft minimum data request, review scope exclusions, or ask a custom question."
- Nexus thin-context intake: "I can help structure an AMS outsourcing event, but right now I only have a category phrase. I need four facts before registering it as a sourcing event: why now, decision owner, scope boundary, and value or risk driver. Start with the trigger: cost mandate, service issue, contract renewal, or strategic shift?"
- Nexus refusal/caveat: "I would not release an RFP from this state. The scope says enterprise all towers, but exclusions, ticket baseline, and retained roles are not clear. I can prepare an Outline path, not a release-ready package."
- Sentinel full-context evidence: "Evidence caution: Vendor B claims 18 percent automation productivity, but the response does not include a committed price-down, KPI, or contract mechanism. Treat the claim as proposal narrative, not value evidence."
- Sentinel thin-context evidence: "I can give pattern-level risk guidance, but I cannot cite client evidence yet. The application inventory is uploaded, not parsed, and the ticket baseline is missing."
- Sentinel refusal/caveat: "Do not cite that vendor response yet. The file exists in the event record, but it is not marked usable evidence and no parsed sections are available."
- Atlas full-context executive: "Executive posture: Vendor A is the stronger risk-adjusted selection if transition cost is locked in BAFO. Vendor B is cheaper on base run cost, but excludes release support and assumes lower ticket volumes than the client baseline. Decision options are select Vendor A with transition lock, reopen BAFO on Vendor B, or defer selection until exclusions are priced."
- Atlas thin-context executive: "The executive implication is still preliminary. I can see projected value at stake, but not a usable baseline or vendor commitments. Keep the steering message at opportunity and risk, not realized savings."
- Atlas refusal/caveat: "I would not brief this as savings realized. Selection has not transitioned, actuals are absent, and no finance owner has attested the baseline."
- Steward full-context gate: "Gate state: Scope to RFP is blocked. Required blockers are ticket history usable evidence and retained-role boundary. A finance waiver can downgrade the package to Outline, but it will not clear Rich RFP readiness."
- Steward thin-context gate: "I cannot evaluate the gate from category text alone. Provide event owner, scope boundary, and data readiness state, or keep this as an intake idea."
- Steward refusal/caveat: "I cannot mark selection ready. Required approvals are only planned, the selection memo is not approved, and the scorecard lock is missing."

Acceptance criteria:
- At least twelve concrete response examples are present across Nexus, Sentinel, Atlas, and Steward.
- Every agent has responsibilities, what it says, what it never says, suggested actions, and handoffs.
- Examples distinguish full-context, thin-context, and refusal/caveat behavior.
- Agent copy is concise and consulting-grade, not generic chatbot prose.

## 21. Context-used and 3 choices plus custom design

The context-used chip group is mandatory for evidence-sensitive guidance. It should show event, stage, pattern basis, client evidence, vendor evidence, missing context, confidence, and evidence state. Confidence chips can be Complete, Partial, Pattern-only, Client Evidence, Missing, Blocked, Low Confidence, or Citation Pending. Evidence state chips should not hide the important difference between uploaded, parsed, available, and usable evidence.

Missing context disclosure should be plain: "Ticket history missing; blocks Rich RFP and pricing normalization." It should not say "insufficient data" without telling the user what to do. The context strip opens Context Used Drawer, not a raw debug panel.

Action sets by stage must be contextual. Strategy: confirm thesis, generate minimum data request, check linked program impact. Scope: show missing inputs, draft minimum data request, review exclusions. RFP: show release blockers, draft outline path, review approval route. Vendor Responses: show incomplete responses, request clarification, mark at-risk response. Evaluation: review missing rationale, explain vendor tradeoffs, lock scorecard path. Pricing: show commercial traps, normalize transition cost, prepare BAFO asks. BAFO: draft BAFO pack, show assumption locks, review walkaway signal. Executive Decision: prepare selection memo, show unresolved blockers, explain tradeoffs. Value: show value gaps, request measurement evidence, prepare CFO brief.

Forbidden generic suggestions: "Tell me more", "Summarize this", "Generate insights", "What else can I help with", "Analyze vendors", or any choice that could appear unchanged on every stage. Custom option behavior: a free-text action remains available but is visually secondary. If context is too weak, the three choices pattern pauses and the agent requests the minimum safe input instead.

Drawer behavior: context chip opens Context Used Drawer with sources, evidence state, pattern basis, client basis, vendor basis, missing context, and confidence. Evidence chip opens Evidence Drawer. Gate chip opens Gate Detail Drawer. The strip must stay compact; detail belongs in drawers.

Acceptance criteria:
- Context-used chips appear for agent recommendations, gates, artifacts, and decision surfaces.
- Confidence and evidence states are distinct and text-visible.
- Missing context includes owner/action impact where known.
- Three choices are stage-specific and suppressed when only one action is valid or context is too weak.
- Generic suggestions are treated as design failures.

## 22. Drawers and drilldowns

Drawers keep the event canvas focused while allowing detail. They open from table cells, artifact strips, context chips, gate panels, value rows, and linked program badges. They must have explicit data sources, empty states, loading states, error states, and not-implemented-yet disclosures where appropriate.

Evidence Drawer: opens from evidence chips, Sentinel notes, scorecard evidence cells, vendor response cells, and value ledger rows. Contents: source title, evidence type, readiness state, citation/provenance where available, confidence, owner, last updated, and where the evidence is used. Data source: Admin/Setup readiness, evidence ledger when available, seeded evidence in deterministic demo. Empty: "No usable evidence linked." Loading: skeleton with source identity. Error: "Evidence source failed; decision actions disabled." Not implemented yet: live parsing and full citation extraction where absent.

Context Used Drawer: opens from context-used strip. Contents: event, stage, route, pattern basis, client evidence, vendor evidence, missing context, confidence, and agent handoff basis. Data source: SourceAgentContextBundle or deterministic context projection. Empty: "No event context loaded; response must stay low-context." Loading: context skeleton. Error: response falls back to low-context.

Gate Detail Drawer: opens from gate panel, journey blocked state, or Steward note. Contents: owner, required data, required artifacts, required evidence, required approvals, blockers, waiver/defer path, next actions. Data source: stage gate model, artifact states, readiness rows. Empty: "No gate criteria configured for this stage" should be treated as design debt. Loading: gate skeleton. Error: unsafe stage movement disabled.

Artifact Detail Drawer: opens from artifact strip or artifact table. Contents: title, status, version, owner, stage, evidence, missing inputs, review state, planned approval state, Nexus editorial note. Data source: artifact model, seeded state, future artifact store. Empty: "Artifact not started." Loading: metadata skeleton. Error: do not show stale artifact body as current.

Vendor Detail Drawer: opens from vendor table rows. Contents: vendor identity, response state, pricing state, assumptions, exclusions, transition plan, evidence, risks, next action. Data source: vendor response completeness, pricing normalization, BAFO model. Empty: "Vendor response not received." Loading: vendor skeleton. Error: row remains not comparable.

Pricing Detail Drawer: opens from pricing cells, trap flags, BAFO asks. Contents: normalized fields, source price, assumptions, exclusions, year 1/2/3, transition, one-time, change-order exposure, evidence. Data source: pricing normalization model, vendor proposals, client baseline. Empty: "No comparable pricing." Loading: pricing skeleton. Error: pricing comparison disabled.

Linked Program Drawer: opens from linked program badge. Contents: program name, phase, sponsor, dependency, value, related Source events, handoff state. Data source: Source-program link model and Programs context. Empty: "Standalone Source event." Loading: program skeleton. Error: do not imply linked-program context.

Risk/Exception Drawer: opens from risk flags, exclusions, commercial traps, gate blockers. Contents: risk title, severity, evidence, owner, mitigation, downstream impact, related artifact/gate. Data source: commercial signals, Sentinel, Steward, stage gates. Empty: "No active exceptions." Loading: risk skeleton. Error: keep blocker visible.

Value Assumptions Drawer: opens from value rows and Atlas notes. Contents: projected, committed, measuring, realized state; assumptions; owner; evidence; variance; CFO/CIO implication. Data source: value ledger. Empty: "No value basis recorded." Loading: value skeleton. Error: prevent realized-value claim.

Acceptance criteria:
- Each drawer has opening points, contents, data source, empty, loading, and error states.
- Drawers support the event canvas instead of replacing it.
- Not-implemented-yet behavior is disclosed where runtime capability is absent.
- Evidence, context, gate, artifact, vendor, pricing, linked program, risk, and value details are reachable.

## 23. Demo data and Apex Retail storyline

Apex Retail is the seeded enterprise storyline. The demo should show a real-feeling retail technology estate: active Programs, linked Source events, sourcing pressure, data readiness gaps, executive value concerns, and vendor comparison. The most important demo Source event is an AMS or data/AI managed services sourcing event linked to a modernization program.

Apex Retail AMS Source event: trigger is cost pressure and service accountability across application support. Linked program is a modernization or run-cost optimization program. Scope includes application managed services across named towers, not an undefined "all towers" phrase. Demo vendors can be named neutral fictional vendors such as Northbridge Services, Meridian Digital Operations, Ardent Managed Solutions, and Kestrel Technology Partners unless real vendor evidence exists. Pricing assumptions should be seeded and clearly labeled: application count, ticket volume, support hours, SLA expectations, transition cost, year 1/2/3 run cost, offshore/onshore mix, automation commitments, exclusions, and rate escalation.

Commercial risks: transition excluded, release support excluded, minor enhancements vague, ticket volume assumption below baseline, automation savings not committed, hidden retained-team burden, and weak SLA credits. BAFO questions: lock transition cost, confirm ticket volume bands, include release support, define minor enhancement threshold, commit year-two price-down, cap rate escalation, and clarify retained team assumptions. Executive decision posture: one vendor may be preferred with conditions, one cheaper but risky, one blocked by non-comparable response.

What is demo-ready: deterministic dashboard/event canvas, seeded event posture, scope/data readiness panels, RFP readiness, vendor response completeness, pricing normalization, BAFO panel, executive decision summary, vendor selection readiness panel, stage gate panel, artifact strip, and value ledger shell where present. What remains seeded or thin: persistence, live upload/parsing, full approval engine, live model responses, real tenant evidence ingestion, artifact versioning, document export/import, and live market benchmarks. What not to claim: production-ready sourcing engine, live procurement write-back, final vendor selection automation, realized savings, citable uploaded documents unless evidence state supports it, or live benchmark coverage.

Acceptance criteria:
- Demo storyline uses Apex Retail facts and seeded states honestly.
- AMS Source event includes linked program, vendors, pricing assumptions, risks, BAFO asks, and decision posture.
- Demo-ready and seeded/thin areas are separated.
- The story does not claim production capabilities that are not implemented.

## 24. Implementation status matrix

| Area | Implemented | Partial | Planned | Not started | Key files | Tests | Next gap |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Dashboard | Yes | Mission and visual polish remain | More production-domain visual QA | No | `src/components/source/SourceIndexPage.tsx`, `SourcePortfolioPage.tsx`, `AbarVaSourceDashboard.tsx` | Source route/component smoke where present | Make purpose and create-event path clearer |
| Events portfolio | Yes | Filter/context behavior can deepen | Portfolio command refinements | No | `src/app/(maestro)/source/events/page.tsx`, `SourceEventsPortfolio.tsx` | smoke coverage where present | Ensure context-used and mission preview update with filters |
| Event canvas | Yes | Stage-specific depth varies | Continued canvas polish | No | `SourceEventDetailPage.tsx`, `SourceEventAgentCanvas.tsx` | event canvas smoke | Keep all key work above fold |
| Scope | Yes | Seeded/deterministic | Live data backing | No | `SourceScopeStageWorkspace.tsx`, `source-stage-gates.ts` | scope smoke and model tests where present | Stronger intake/create-event and scope entry design |
| Data readiness | Yes | Read-only deterministic contract | Live Admin/Setup integration | Runtime evidence pipeline | `SourceDataReadinessPanel.tsx`, `admin-setup-readiness-contract.ts` | panel smoke | Connect real readiness and evidence store later |
| RFP readiness | Yes | Deterministic tiering | Artifact generation later | Release workflow engine | `SourceRfpReadinessPanel.tsx`, `rfp-readiness.ts` | model/panel tests where present | Keep release gate honest |
| Vendor responses | Yes | Deterministic completeness | Live upload/parsing later | Vendor portal | `SourceVendorResponseCompletenessPanel.tsx`, `vendor-response-completeness.ts` | model/panel tests where present | Better table UX and evidence detail |
| Pricing normalization | Yes | Deterministic comparison | Canonical convergence | Live benchmark integration | `SourcePricingComparisonPanel.tsx`, `pricing-normalization.ts`, `commercial-signals.ts` | pricing smoke | Keep adapters canonical |
| BAFO | Yes | Deterministic panel | BAFO round workflow later | Vendor messaging | `SourceBafoNegotiationPanel.tsx`, `bafo-negotiation.ts` | BAFO smoke | Vendor-specific question quality |
| Executive decision | Yes | Deterministic summary | Approval packet later | Final selection automation | `SourceExecutiveDecisionSummaryPanel.tsx`, `executive-decision-summary.ts` | executive decision smoke | Ensure Atlas copy is concise and evidence-aware |
| Vendor selection readiness | Yes | Deterministic readiness | Approval integration later | Automated selection | `SourceVendorSelectionReadinessPanel.tsx`, `vendor-selection-readiness.ts` | readiness smoke | Keep human decision boundary explicit |
| Scorecard governance | Partial | Shell exists | Deeper rationale/audit later | Full approval runtime | `ScorecardGovernancePanel.tsx`, `scorecard.ts` | component test | Missing rationale and lock behavior depth |
| Artifact detail | Partial | Artifact strip/drawer exist | Review/approval/versioning later | Full document lifecycle | `SourceArtifactStatusStrip.tsx`, `SourceArtifactDrawer.tsx` | drawer test | Artifact review workflow and versioning |
| Value ledger | Partial | Shell/model exists | Measurement workflow later | Real actuals ingestion | `SourceValueLedger.tsx`, `value-ledger.ts` | limited | Avoid realized value claims |
| Context-used enforcement | Partial | Docs and validation foundations | UI enforcement everywhere | Full runtime bundle | `agent-context.ts`, `context-builder.ts`, design docs | context validation tests | Make every agent surface show context-used |
| Drawers | Partial | Some drawers/components exist | Complete drawer taxonomy | Full evidence/artifact/vendor drawer set | `SourceArtifactDrawer.tsx`, related components | component tests | Evidence, pricing, linked program drawer depth |
| Upload/parsing | Partial contracts | Deterministic attachment types | Upload/parsing design later | Runtime pipeline | `attachments.ts`, readiness docs | validation defer | Do not treat uploads as evidence yet |
| Approval engine | Planned only | Gate panels show requirements | Approval workflow later | Full engine | `SourceStageGatePanel.tsx`, `source-stage-gates.ts` | stage gate smoke | Avoid implying approvals executed |
| Model runtime | API stub only | Deterministic no-model behavior | Model gateway/context later | Live Source model responses | `src/app/api/v1/source/[eventId]/nexus/ask/route.ts`, `nexus-api.ts` | API consistency tests | No model calls until gates are ready |

Acceptance criteria:
- Matrix names implemented, partial, planned, and not-started states across required areas.
- Key files, tests, and next gaps are visible.
- Current deterministic/seeded state is not overstated.
- Runtime, persistence, upload, approval, and model gaps remain visible.

## 25. What not to build yet

Do not build model calls, chat UI, upload/parsing runtime, approval engine, workflow engine, final vendor selection automation, document export/import, artifact versioning engine, production claims, live market benchmarks, or non-technology sourcing categories from this blueprint. Do not add a vendor portal. Do not create a second Admin/Setup data readiness workflow inside Source. Do not wire live procurement write-back. Do not claim realized savings from seeded data. Do not add direct imports that bypass canonical commercial adapters in executive paths. Do not create duplicate models when existing Source contracts can be extended through canonical adapters.

Acceptance criteria:
- Future slices can read this section and understand what remains blocked.
- The blueprint cannot be used as permission for runtime expansion.
- Production claims, live benchmarks, approval engine, upload/parsing, and model calls stay out of scope.
- Commercial and context models remain converged through canonical contracts.

## 26. Codex implementation guidance

Future Codex slices should consume this document as the canonical experience reference for Source / Outsourcing in technology and IT sourcing only. Start with the master anchor, this blueprint, the relevant Source build-pack file, the platform design lock, the component spec, and the wireframe. Then implement only the named slice. If the slice changes user experience, include a Design Compliance Gate in the PR body: page purpose, first viewport, data sources, agent roles, context-used behavior, gate behavior, forbidden claims, and tests.

PR lifecycle: one fresh branch per slice, scoped files only, explicit validation, no `git add .`, review staged diff before commit, push branch, open PR, monitor checks, fix in-scope issues, merge only when green and scoped if the user has granted merge authority. If CI fails for unrelated reasons, inspect and report before broad changes. State/tracker updates should happen last and only when the slice genuinely changes readiness or build-pack canon.

Test requirements: docs-only changes need word count or content validation when relevant, `git diff --check`, trailing whitespace check, non-ASCII check when requested, and prohibited-language scan. Runtime slices need focused unit tests, smoke tests, typecheck, lint, and relevant route/browser verification. Do not run production deploys unless requested or required by the task. Readiness update rules: update readiness trackers only for real status change, not for speculative design. Allowed file discipline: named docs and associated anchor/tracker files. Forbidden file discipline: no runtime/UI/API/model/upload files for docs-only tasks.

Avoid duplicate models by using the current Source contracts, stage packs, commercial signal adapters, SourceAgentContextBundle shape, and Admin/Setup readiness contract. Avoid drifting from canonical commercial signals by routing executive decision paths through `commercial-signals`, `commercial-mission-adapter`, and executive decision summary contracts rather than importing pricing or BAFO detail modules directly.

Acceptance criteria:
- Implementation guidance includes Design Compliance Gate, PR lifecycle, validation, and merge discipline.
- `git add .` is explicitly forbidden.
- Allowed and forbidden file discipline is clear.
- Readiness updates happen only when justified.
- Future slices are told how to avoid duplicate models and commercial-signal drift.

## 27. Acceptance criteria for the design blueprint

The design blueprint is complete when every Source stage has UX details; every stage has data, artifact, gate, and agent rules; every major Source page has layout and interaction guidance; every agent has response examples; every deliverable maps to a stage; all implementation gaps are visible; there are no contradictions with the existing Source build pack; and no new process is invented outside existing canon. The blueprint should reconcile existing naming differences without creating duplicate models.

Document-level acceptance criteria:
- Every Source stage has concrete UI behavior, data requirements, artifact requirements, gates, blockers, waiver/defer behavior, drawers, choices, context-used behavior, and acceptance criteria.
- Dashboard, events portfolio, and event canvas designs define first viewport, visual zones, interactions, drawers, and states.
- Scope, data readiness, RFP readiness, vendor response completeness, pricing normalization, BAFO, executive decision, selection readiness, scorecard, artifact review, and value ledger designs are concrete.
- Gate and approval design defines owner, required data, required artifact, required evidence, approval requirement, blockers, waiver/defer logic, UI rendering, and next actions for each gate.
- Deliverables map to stages and include owner agent, reviewer, approval state, evidence requirement, missing input behavior, versioning, export behavior, UI placement, and acceptance criteria.
- Agent behavior includes at least twelve concrete response examples and clear handoffs.
- Context-used, three choices plus custom, drawer taxonomy, Apex Retail demo storyline, implementation matrix, not-to-build list, and Codex guidance are present.
- The file is documentation/design only and does not modify runtime, UI, API, model, upload/parsing, approval, or workflow engine code.
