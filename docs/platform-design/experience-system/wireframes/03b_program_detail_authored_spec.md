# Program Detail · Flagship Workspace — AUTHORED-DRAFT canonical spec

_Imported from `AbarVa_Program_Detail_Wireframe_Specification.docx` (v1.0, 2026-04-27). Source of truth — supersedes the legacy `*_wireframe.md` sketches in this folder._

---

Program Detail · Flagship Workspace
Wireframe Specification · AUTHORED-DRAFT
Page Name
 | Program Detail · Flagship Workspace
 | 
Route
 | /tenant/[tenantSlug]/programs/[programSlug] (example: /tenant/apex-retail/programs/demand-forecasting-modernization)
 | 
Surface
 | Programs
 | 
Agent Owner
 | Nexus
 | 
Status
 | AUTHORED-DRAFT
 | 
Version
 | 1.0
 | 
Date
 | 2026-04-27
 | 
Dependencies
 | doc 01 §Five-question test; doc 02 addendum §5-state context classification; doc 03 §Agent editorial contract; doc 04 §Zones A-E and named primitives; doc 05 §Suggested actions and file attachments; doc 06 §Persona crawler; doc 07 §Failure modes; doc D1 §Workflow state models; PX1 page blueprints; AGENTX agent-centric enforcement; AbarVa visual canon.
 | 
Section 1 · Page identity
Field
 | Specification
 | 
Canonical page name
 | Program Detail · Flagship Workspace
 | 
Route
 | /tenant/[tenantSlug]/programs/[programSlug] — Apex example: /tenant/apex-retail/programs/demand-forecasting-modernization
 | 
Surface
 | Programs
 | 
Primary agent owner
 | Nexus
 | 
Secondary agent participation
 | Steward for gates/readiness, Sentinel for evidence gaps, Atlas for executive value/risk implications.
 | 
Personas served
 | Client Maestro, Transformation Lead, CIO/CTO sponsor, Value Office/CFO delegate, Data Owner, Program Manager.
 | 
Primary user question
 | How do we move this program to the next decision or gate with the right workshop, evidence, deliverables, and actions?
 | 
Canon trace: page identity and primary question are required by PX1 page blueprint authority and doc 01 §Five-question test.
Section 2 · Five-question test answers
Question
 | Answer source on wireframe
 | 
Where am I?
 | Zone A [A-1] tenant/program breadcrumb and Zone C [C-1] program header: “Apex Retail · APX-02 · Demand Forecasting Modernization.”
 | 
What matters right now?
 | Zone C [C-2] Nexus executive brief and [C-4] current gate card: current phase P4 Design; next gate decision requires evidence and sponsor alignment.
 | 
What is blocked or at risk?
 | Zone C [C-4] Gate State Badge + [C-7] Evidence/Missing Inputs panel: missing value hypothesis evidence, platform owner confirmation, and unresolved evidence coverage.
 | 
What does the agent recommend?
 | Zone C [C-5] Nexus Workshop Canvas: next workshop agenda and recommended Client Maestro action.
 | 
What should I do next?
 | Zone C [C-9] Action Bar and Zone D [D-2] Nexus mission card: “Confirm Workshop 5 outputs and assign value evidence owner.”
 | 
Canon trace: the five answers must be visible within three seconds of landing (doc 01 §Five-question test).
Section 3 · Zone composition
Zone
 | Composition
 | 
A
 | Fixed top header, 72px desktop / 64px mobile. Contains canonical AbarVaLogo, tenant badge, primary nav, Admin/user chip. It must use AbarVaAppShell, not legacy TopBar/PrimaryNav (doc 04 §Zone A).
 | 
B
 | Present. Context strip [B-1] shows tenant, program code, phase, gate, deterministic/live caveat, and source-linked event chip when available. Sticky below Zone A on desktop; collapses to two-line pill stack on mobile.
 | 
C
 | Primary workspace. Starts with agent editorial block at [C-2], followed by phase/gate journey, Nexus workshop canvas, deliverables/evidence, and action/mission strip. The page is organized as workflow movement, not dashboard cards (doc 04 §Zone C; AGENTX §Nexus).
 | 
D
 | Agent rail present on desktop right side (320px max) and collapses into bottom sheet on mobile. Contains Nexus, Steward, Sentinel, Atlas mission summaries, confidence/evidence states, and suggested actions. Never a chat-only rail (doc 04 §Zone D).
 | 
E
 | Drawers: Evidence Drawer, Deliverable Detail Drawer, Gate Readiness Drawer, Mission Detail Drawer, Source Event Link Drawer. Drawers are side panels on desktop and full-screen sheets on mobile (doc 04 §Zone E).
 | 
Canon trace: Zones A-E and named primitives are required by doc 04 §Composition zones.
Section 4 · ASCII wireframe with coordinate labels
Desktop rendering · 1440px
+--------------------------------------------------------------------------------------------------------------+| [A-1] AbarVaLogo  [A-2] Apex Retail · Rich  [A-3] Home Programs Source Intelligence Tower Admin    [A-4] User |+--------------------------------------------------------------------------------------------------------------+| [B-1] Context: APX-02 · Demand Forecasting Modernization · P4 Design · Gate: Pending · Seed-backed  [B-2] Linked Source Event |+--------------------------------------------------------------------------------------------------------------+| [C-1] Program Header: APX-02 · Demand Forecasting Modernization                                           [D] || [C-2] Nexus Editorial Brief: what matters, what is blocked, recommended next action                       [D-1] Agent Rail || +-----------------------------+ +-----------------------------+ +-----------------------------+             [D-2] Nexus Mission || | [C-3] Phase Journey Rail    | | [C-4] Gate Readiness Card   | | [C-5] Next Workshop Canvas  |             [D-3] Steward Gate || | P1 P2 P3 [P4] P5 P6        | | Pending · Missing evidence  | | Agenda / questions / SMEs   |             [D-4] Sentinel Evidence || +-----------------------------+ +-----------------------------+ +-----------------------------+             [D-5] Atlas Implication || [C-6] Subnav: Overview | Workshop | Deliverables | Evidence | Actions | Gate | Decisions                 [D-6] 3 Suggestions+Custom || +----------------------------------------------------------------------------------------------------------+ || | [C-7] Deliverables by Phase + Evidence Coverage: current deliverable, versions, evidence state, missing | || +----------------------------------------------------------------------------------------------------------+ || | [C-8] Evidence / Missing Inputs: value hypothesis, platform owner confirmation, Workshop 5 outputs      | || +----------------------------------------------------------------------------------------------------------+ || | [C-9] Action Bar: Confirm workshop outputs | Assign evidence owner | Open gate drawer | Custom action     | |+--------------------------------------------------------------------------------------------------------------+| [E-1] Drawers open from evidence, gate, deliverable, mission, linked Source event                           |+--------------------------------------------------------------------------------------------------------------+
Mobile rendering · 375px
+-----------------------------+| [A-1] AbarVaLogo     [A-4]  || [A-2] Apex Retail · Rich    |+-----------------------------+| [B-1] APX-02 · P4 Design    || Gate pending · Seed-backed  |+-----------------------------+| [C-1] Program Header        || Demand Forecasting Modern.  || [C-2] Nexus Brief           |+-----------------------------+| [C-6] Subnav chips          || Overview Workshop Evidence  |+-----------------------------+| [C-3] Phase Journey         || P1 P2 P3 [P4] P5 P6         |+-----------------------------+| [C-4] Gate Card             || Pending · 3 missing inputs  |+-----------------------------+| [C-5] Workshop Canvas       || Next agenda + evidence      |+-----------------------------+| [C-7] Deliverables/Evidence |+-----------------------------+| [C-9] Next Action Bar       |+-----------------------------+| [D-1] Agent rail bottom     || Nexus · Steward · Sentinel  |+-----------------------------+
Section 5 · Element catalog
Every coordinate-labeled element below has explicit visual treatment, data source, empty/loading/error behavior. Hardcoded content is limited to static labels (authoring rule 4).
A-1 · Canonical AbarVa logo
Element type: brand/logo.
Visual treatment: AbarVaLogo SVG, 32px height desktop, 28px mobile; no hand-coded wordmark; color from brand asset.
Data source: Brand asset public/brand/abarva-logo.svg.
Empty state: Text fallback “AbarVa” in near-black/dark-blue only.
Loading state: Immediate; no skeleton for logo.
Error state: Show text fallback and do not block page.
A-2 · Tenant data tier badge
Element type: chip.
Visual treatment: Rounded chip, dark-blue text, muted ivory background; compact density.
Data source: Demo dataset registry: tenantSlug apex-retail, richness rich.
Empty state: Show “Tenant unknown · shell-only” caveat.
Loading state: Skeleton chip.
Error state: Show “Data tier unavailable” with Steward caveat.
A-3 · Primary navigation
Element type: nav links.
Visual treatment: Thin top nav, dark navy text, dark-blue underline for active Programs.
Data source: AbarVa shell nav config.
Empty state: Render canonical surfaces only.
Loading state: Progressive nav labels.
Error state: Keep current route and show nav unavailable message.
A-4 · User/admin chip
Element type: user menu.
Visual treatment: Small text + avatar initials; no large profile card.
Data source: Auth/session user; Clerk user if available.
Empty state: Show “Signed in user” initials.
Loading state: Skeleton circle.
Error state: Hide menu actions requiring identity.
B-1 · Program context strip
Element type: context strip.
Visual treatment: Single-line pill strip desktop; two-line mobile. Uses Context Used Chip Group.
Data source: Context Bundle: tenant, program, phase, gate, deterministic/live state.
Empty state: Show “Program context not loaded” and link to Programs list.
Loading state: Skeleton strip.
Error state: Show refusal/caveat state; no agent recommendation.
B-2 · Linked Source Event chip
Element type: chip/drawer trigger.
Visual treatment: Compact dark-blue outline chip.
Data source: SourceProgramLink: sourceEventId apex-retail-ams-outsourcing-2026.
Empty state: Render “No linked Source event yet.”
Loading state: Skeleton pill.
Error state: Show Source link unavailable.
C-1 · Program header
Element type: heading.
Visual treatment: H1 32/40 desktop; 24/32 mobile; dark navy/near-black.
Data source: Program canonical view: APX-02 title, tenant, status.
Empty state: Show “Program unavailable” with fallback list link.
Loading state: Header skeleton.
Error state: Show error summary + retry not agent output.
C-2 · Nexus editorial brief
Element type: agent editorial block.
Visual treatment: Executive brief block, ivory/white, left dark-blue accent, 90-130 words.
Data source: Context Bundle: program state, phase/gate, workshop, evidence, actions.
Empty state: Thin-context editorial with missing data disclosure.
Loading state: Progressive skeleton lines.
Error state: Nexus refusal_or_caveat; no generic guidance.
C-3 · Phase Journey Rail
Element type: workflow state rail.
Visual treatment: Six phase cards, current phase highlighted dark-blue border; completed muted.
Data source: Program phase state model.
Empty state: Show phase unknown; no gate action.
Loading state: Skeleton phase rail.
Error state: Show phase state error and hide gate transitions.
C-4 · Gate Readiness Card
Element type: gate state badge/readiness meter.
Visual treatment: Badge + readiness meter; amber/red only for blocked/risk; not color-heavy.
Data source: Phase gate advancement flow / Steward readiness.
Empty state: Show “Gate not evaluated.”
Loading state: Skeleton gate card.
Error state: Show “Gate readiness unavailable.”
C-5 · Nexus Workshop Canvas
Element type: workflow canvas.
Visual treatment: Large central canvas, agenda/questions/evidence columns; no chat box.
Data source: Workshop readiness + SME recs + meeting notes outcomes.
Empty state: Show “No recommended workshop yet” and next setup action.
Loading state: Canvas skeleton.
Error state: Show missing workshop data caveat.
C-6 · Program subnav
Element type: segmented tabs.
Visual treatment: Thin chip row; active tab dark-blue underline.
Data source: Static page blueprint + active state.
Empty state: Default to Overview.
Loading state: No loading.
Error state: Disable invalid tab and preserve current.
C-7 · Deliverables by Phase panel
Element type: table/card hybrid.
Visual treatment: Grouped rows by phase, evidence chips, version chips, disabled future actions.
Data source: Program deliverables evidence view.
Empty state: Show “No deliverables seeded for this phase.”
Loading state: Skeleton rows.
Error state: Show “Deliverables unavailable” and keep page usable.
C-8 · Evidence / Missing Inputs panel
Element type: evidence panel.
Visual treatment: Evidence Drawer triggers with confidence chips.
Data source: Evidence trace + claim support + context quality.
Empty state: Show missing evidence list.
Loading state: Skeleton evidence chips.
Error state: Show evidence unavailable caveat.
C-9 · Action Bar
Element type: action bar.
Visual treatment: Three contextual actions + Custom, fixed inside canvas bottom on desktop.
Data source: Agent suggestions from context: gate, workshop, evidence, missions.
Empty state: Show setup actions only.
Loading state: Skeleton buttons.
Error state: Disable actions and show error explanation.
D-1 · Agent rail container
Element type: agent rail.
Visual treatment: Right rail, 320px, collapsible; bottom sheet mobile.
Data source: Agent mission queue, cross-agent handoffs.
Empty state: Show “No active missions.”
Loading state: Rail skeleton.
Error state: Rail shows unavailable state.
D-2 · Nexus mission card
Element type: mission card.
Visual treatment: Subtle dark-blue label; not avatar/chat.
Data source: Program mission queue.
Empty state: No Nexus mission; show next action from page.
Loading state: Skeleton card.
Error state: Show mission unavailable.
D-3 · Steward gate card
Element type: mission/card.
Visual treatment: Gate blocker summary.
Data source: Gate readiness / approval flow.
Empty state: No gate data; show setup caveat.
Loading state: Skeleton.
Error state: Show unavailable.
D-4 · Sentinel evidence gap card
Element type: mission/card.
Visual treatment: Evidence confidence chip.
Data source: Evidence trace / missing inputs.
Empty state: Show “No evidence gaps surfaced yet.”
Loading state: Skeleton.
Error state: Show unavailable.
D-5 · Atlas implication card
Element type: mission/card.
Visual treatment: Executive implication, one paragraph max.
Data source: Value/risk read model.
Empty state: Show “Executive implication deferred.”
Loading state: Skeleton.
Error state: Show unavailable.
D-6 · Suggested actions
Element type: 3 choices + custom.
Visual treatment: Three context actions + custom, no filler.
Data source: Suggested action generator from Context Bundle.
Empty state: Show only setup/diagnostic actions.
Loading state: Skeleton.
Error state: Disable with error.
Section 6 · Click and interaction map
A-3 Programs link
Click target: /tenant/[tenantSlug]/programs
Permission required to render: authenticated tenant member
Permission required to execute: same
Confirmation flow: none
State change on success: Navigate to programs list; preserve tenant context.
State change on failure: Stay on current route and show navigation error.
Audit event emitted: nav.programs.opened
Effect on conversation history: None.
B-2 Linked Source Event chip
Click target: Drawer E-1 Source Event Link or /source/events/apex-retail-ams-outsourcing-2026 if route is resolvable
Permission required to render: tenant member
Permission required to execute: tenant member
Confirmation flow: none
State change on success: Open drawer or route; log context bridge view.
State change on failure: Show link unavailable caveat.
Audit event emitted: source_program_link.opened
Effect on conversation history: Adds context handoff note.
C-3 Phase card
Click target: Gate/phase drawer E-1
Permission required to render: tenant member
Permission required to execute: none
Confirmation flow: none
State change on success: Open phase details; no transition.
State change on failure: Drawer shows error.
Audit event emitted: program_phase.viewed
Effect on conversation history: None.
C-4 Gate card
Click target: Gate Readiness Drawer E-1
Permission required to render: tenant member
Permission required to execute: Steward/admin for any future decide action
Confirmation flow: soft confirm only for future decide; current view no confirm
State change on success: Open Steward gate detail; no state transition.
State change on failure: Show gate details unavailable.
Audit event emitted: gate_readiness.opened
Effect on conversation history: None.
C-5 Workshop evidence item
Click target: Evidence Drawer E-1
Permission required to render: tenant member
Permission required to execute: tenant member
Confirmation flow: none
State change on success: Open evidence-to-capture details.
State change on failure: Show evidence drawer error.
Audit event emitted: workshop_evidence.opened
Effect on conversation history: Adds context if custom query begins.
C-6 Subnav tab
Click target: Same-page canvas mode
Permission required to render: tenant member
Permission required to execute: tenant member
Confirmation flow: none
State change on success: Switch active view without route change.
State change on failure: Keep current tab and show warning.
Audit event emitted: program_tab.changed
Effect on conversation history: None.
C-7 Deliverable row
Click target: Deliverable Detail Drawer E-1
Permission required to render: tenant member
Permission required to execute: tenant member
Confirmation flow: none
State change on success: Open deliverable version/evidence detail.
State change on failure: Show drawer unavailable.
Audit event emitted: deliverable.opened
Effect on conversation history: None.
C-8 Evidence chip
Click target: Evidence Drawer E-1
Permission required to render: tenant member
Permission required to execute: tenant member
Confirmation flow: none
State change on success: Open evidence detail.
State change on failure: Show evidence unavailable.
Audit event emitted: evidence.opened
Effect on conversation history: None.
C-9 Confirm workshop outputs
Click target: Proposed update drawer; no write
Permission required to render: tenant member
Permission required to execute: Client Maestro
Confirmation flow: soft confirm with rationale if future apply is introduced
State change on success: Open proposed update preview; no state change until future approval flow.
State change on failure: Action disabled with explanation.
Audit event emitted: program_action.proposed
Effect on conversation history: Adds proposed action context.
C-9 Assign evidence owner
Click target: Owner assignment drawer; disabled unless future workflow exists
Permission required to render: tenant member
Permission required to execute: Client Maestro / Steward
Confirmation flow: explicit confirm with rationale if real assignment added
State change on success: Current state: show deferred workflow caveat.
State change on failure: Show deferred state.
Audit event emitted: program_action.deferred
Effect on conversation history: None.
C-9 Open gate drawer
Click target: Gate Readiness Drawer E-1
Permission required to render: tenant member
Permission required to execute: tenant member
Confirmation flow: none
State change on success: Open gate details.
State change on failure: Show error state.
Audit event emitted: gate_drawer.opened
Effect on conversation history: None.
D-6 Custom option
Click target: Custom context query box inside rail
Permission required to render: tenant member
Permission required to execute: tenant member
Confirmation flow: none
State change on success: Open custom action input; response must cite context used.
State change on failure: Show low-context refusal if bundle thin.
Audit event emitted: agent_custom.opened
Effect on conversation history: Creates conversation turn scoped to program.
Section 7 · Agent editorial contract
Authoring agent: Nexus.
Required Context Bundle categories: tenant, program, phase, gate, workshop readiness, deliverables, evidence, missions, linked Source event if present.
Editorial response modes permitted: status, diagnostic, recommendation, artifact, evidence, refusal_or_caveat. Executive mode only via Atlas handoff.
Word count budget: status 35-60 words; diagnostic 70-110 words; recommendation 80-130 words; evidence 60-100 words; executive 110-160 words; refusal_or_caveat 45-80 words.
Voice contract: Nexus voice: orchestration lead, specific to current program/event/stage; never chatbot-first (doc 03 §Nexus; AGENTX rules 1 and 3).
Honest-disclosure behavior: use doc 02 addendum five states — full_context, partial_context, thin_context, blocked_context, unavailable_context. Thin or blocked states must show missing data before recommendations.
Citation rendering rules: cite evidence/source basis chips in the editorial footer; use human-readable source labels such as “Apex Retail AMS seed scenario” or “Program APX-02 evidence trace,” not opaque IDs only.
Confidence chip rendering rules: use Confidence Qualifier primitive with supported, partial, low, blocked, or unavailable; never show green confidence when evidence is missing.
Specific refusals: Nexus will not approve gates, invent evidence, claim live model output, or apply program state transitions.
Section 8 · Suggested actions specification
Every substantive agent response closes with exactly three context-generated suggestions plus a custom option when suggestions help move work forward (doc 05 §Suggested actions; AGENTX rule 7).
Fresh load with full context
Confirm Workshop 5 outputs
Open evidence gaps for current gate
Preview deliverables for Design phase
Custom: ask Nexus about next action
Blocked gate state
Assign value evidence owner
Open Steward gate rationale
Review linked Source event commercial blockers
Custom: explain why gate is blocked
Ambiguous program context
Show context used
Select a phase to inspect
Open program resume state
Custom: ask what data is missing
Context Bundle fields driving suggestions: program.currentPhase, gate.status, workshop.nextRecommended, evidence.missingInputs, missions.active, sourceProgramLink.
Forbidden suggestions: “Tell me more,” “Generate insights,” “Analyze this,” “Ask AI,” “Next,” or any filler that does not identify a work object, stage, evidence gap, or action.
Section 9 · Workflow state rendering
State machine being rendered: Program phase/gate state model from doc D1: Origination/Charter/Diagnose/Design/Execute/Verify, with some data seeds mapping Discovery/Synthesis to Diagnose/Design where needed. Gate readiness uses Steward states ready, pending, blocked, warning, deferred.
Current state: Current phase card [C-3] uses dark-blue border and “current” label; gate card [C-4] uses Gate State Badge.
Completed states: Completed phases are muted with check marks and lower visual weight; rows remain clickable for audit, not editing.
Blocked/at-risk states: Blocked/at-risk states use restrained amber/red chips and require a reason and missing input list.
Future locked states: Future phases are locked/outline with disabled future actions and missing-evidence caveat.
Click-through behavior per state: Clicking any phase opens read-only detail drawer. Gate transitions are not executed on this page until workflow engine is approved.
Section 10 · File attachment behavior
Programs detail accepts evidence/deliverable attachments only from the Evidence Drawer or Deliverable Detail Drawer, not from the top-level page. Accepted types: PDF, DOCX, PPTX, XLSX/CSV, image screenshots, architecture diagrams. Default classification: evidence_candidate for Evidence drawer, deliverable_artifact for Deliverable drawer. Default association: current program, current phase, optional deliverable ID. Parse status appears in Evidence Drawer as stored / parsing / parsed / failed_conversion / stored_not_usable_as_evidence. Failed conversions render “Stored but not yet usable as evidence” and cannot support Sentinel claims until reviewed (doc 05 §File attachments).
Section 11 · Cross-surface consistency
Program phase labels must match Programs list, Program detail, Tower program impact, and Production Readiness route-smoke references.
Active program counts on Programs index must match Tower active programs count if Tower displays active programs.
Program IDs use APX-## or APX-CDP-2026 consistently; Source event link must use apex-retail-ams-outsourcing-2026 after Wave 19.
Agent names are Nexus, Sentinel, Steward, Atlas exactly; no alternate naming or avatar personas.
Deliverable evidence coverage must match ProgramDeliverablesEvidencePanel, DeliverableEvidenceTracePanel, and Production Readiness notes.
Section 12 · Failure modes this page must prevent
Generic AI response (F1.1): prevented by requiring Context Bundle categories, context-used strip, evidence/source basis, and page-specific agent voice before editorial renders (doc 07 §F1.1; doc 03).
Blank-prompt dead-end (F1.2): prevented by mandatory three context-generated suggestions plus custom; suggestions are derived from current work object and state (doc 05 §Suggested actions).
Agent-as-rail (F1.3): prevented by placing agent editorial at top of Zone C, not only in Zone D rail (doc 04 §Zone C; AGENTX).
Static template response (F1.4): prevented by Context Bundle scoring and thin-context disclosure; generic text fails acceptance criteria (doc 02 addendum; doc 07 §F1.4).
F2 Program drift: phase/gate labels can drift across list/detail/tower. Prevented by phase state model and cross-surface consistency checks.
F3 Fake approval: approval/gate actions must remain read-only/proposed until workflow engine is live. Prevented by disabled future actions and explicit caveat.
F4 Evidence laundering: deliverables cannot claim support from missing evidence. Prevented by evidence trace and Confidence Qualifier.
F5 Workshop theater: workshop canvas must show agenda, decisions, evidence to capture, attendees, and tensions, not a generic “run workshop” card.
Section 13 · Acceptance criteria
All five-question answers are present within three seconds using the specific wireframe elements named in Section 2.
Compositional test passes: Zones A-E are present or explicitly marked not applicable according to doc 04; Zone C includes agent editorial at top.
Click map is fully implemented: every button, tab, chip, drawer trigger, and custom action in Section 4 has an interaction definition in Section 6.
Agent editorial renders for full_context and thin_context; thin_context includes missing data before any recommendation.
Every data-bound element in Section 5 has a data source, empty state, loading state, and error state.
All anti-patterns in Section 12 are demonstrably prevented by source checks, UI checks, or workflow tests.
Persona crawler verdict per doc 06 returns ACCEPT for the primary persona named in Section 14.
No page output claims live model calls, live telemetry, production readiness, gate approval, or real vendor/customer data unless explicitly backed by an approved live data source.
AbarVa design canon is followed: canonical shell/logo, off-white base, dark navy text, dark-blue accents, no teal/cyber dashboard drift.
Program phase, gate, workshop, deliverable/evidence, action/mission, and next action sections all render above or within the first scroll depth at desktop 1440px.
Apex Retail program detail uses real seeded program identity and does not show generic placeholders.
Section 14 · Persona walkthrough
Persona identity and context: Maya Chen, Client Maestro for Apex Retail, opens APX-02 after sponsor asks whether the program is ready to move from Design planning toward execution.
Goal entering the page: understand what blocks the next decision/gate and what Nexus recommends she do next.
First three seconds: she sees Apex Retail / APX-02, P4 Design, Gate Pending, Nexus brief, missing evidence, and the suggested action “Confirm Workshop 5 outputs.”
Turn 1: Maya clicks the Gate Readiness Card [C-4]. The Gate Drawer opens and shows missing value hypothesis evidence and platform owner confirmation. Nexus does not approve the gate; Steward explains blockers.
Turn 2: Maya clicks “Open evidence gaps” from Action Bar [C-9]. Evidence Drawer opens with missing inputs and confidence chips. Sentinel explains unsupported claims and required evidence.
Turn 3: Maya clicks the Nexus Workshop Canvas [C-5] decision item. The workshop drawer shows agenda, attendees, decisions needed, and expected outputs. Maya leaves with a proposed action to confirm Workshop 5 outputs and assign evidence ownership.
State they leave in: program remains pending, but the next Client Maestro action is clear and audit-scoped; no fake approval occurred.
Verdict demonstrated: doc 06 persona crawler ACCEPT for Client Maestro because the page answers where am I, what is blocked, what Nexus recommends, and what to do next.
