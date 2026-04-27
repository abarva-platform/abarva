# Control Tower · Atlas Executive Operating View — AUTHORED-DRAFT canonical spec

_Imported from `AbarVa_Control_Tower_Wireframe_Specification.docx` (v1.0, 2026-04-27). Source of truth — supersedes the legacy `*_wireframe.md` sketches in this folder._

---

AI Control Tower · Atlas Executive Operating View
Wireframe Specification · AUTHORED-DRAFT
Page Name
 | AI Control Tower · Atlas Executive Operating View
 | 
Route
 | /tenant/[tenantSlug]/tower (also /tower and /tower/preview where active)
 | 
Surface
 | Tower
 | 
Agent Owner
 | Atlas
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
 | AI Control Tower · Atlas Executive Operating View
 | 
Route
 | /tenant/[tenantSlug]/tower — Apex example: /tenant/apex-retail/tower
 | 
Surface
 | Tower
 | 
Primary agent owner
 | Atlas
 | 
Secondary agent participation
 | Nexus for program actions, Sentinel for evidence/pattern risk, Steward for governance/readiness blockers.
 | 
Personas served
 | CIO, CTO, CFO / Value Office, CAIO, Transformation Lead, Investor/Board observer, Steward Admin.
 | 
Primary user question
 | Are AI investments creating enterprise value, scaling safely, and improving work, and what executive decision should we make next?
 | 
Canon trace: page identity and primary question are required by PX1 page blueprint authority and doc 01 §Five-question test.
Section 2 · Five-question test answers
Question
 | Answer source on wireframe
 | 
Where am I?
 | Zone A [A-1] and Zone C [C-1] identify Apex Retail · AI Control Tower · Atlas.
 | 
What matters right now?
 | Zone C [C-2] Atlas Executive Brief summarizes value/risk/adoption/productivity signal requiring attention.
 | 
What is blocked or at risk?
 | Zone C [C-5] Pressure Cards and [D-3] Steward blocker card show risk/governance/readiness blockers.
 | 
What does the agent recommend?
 | Zone C [C-6] Active Lens next action and [D-2] Atlas recommendation card.
 | 
What should I do next?
 | Zone C [C-8] Action Bar: open decision brief, assign evidence owner, schedule executive review, custom.
 | 
Canon trace: the five answers must be visible within three seconds of landing (doc 01 §Five-question test).
Section 3 · Zone composition
Zone
 | Composition
 | 
A
 | Fixed top header, canonical AbarVa shell with Control Tower active. Tenant badge visible. 72px desktop / 64px mobile (doc 04 §Zone A).
 | 
B
 | Present. Context strip shows tenant, portfolio lens, data tier, deterministic/live caveat, and latest manifest/seed freshness.
 | 
C
 | Primary workspace. Atlas editorial leads with executive brief, then active lens canvas. One lens at a time; five scorecards max; three pressure cards max. This is not a KPI grid (Control Tower blueprint; doc 04 §Zone C).
 | 
D
 | Agent rail with Atlas primary; Steward risk/governance blockers; Sentinel evidence/pattern caveats; Nexus program actions. Collapsible.
 | 
E
 | Drawers: Executive Decision Drawer, Evidence Basis Drawer, Program Impact Drawer, Risk/Readiness Drawer, Lens Detail Drawer.
 | 
Canon trace: Zones A-E and named primitives are required by doc 04 §Composition zones.
Section 4 · ASCII wireframe with coordinate labels
Desktop rendering · 1440px
+--------------------------------------------------------------------------------------------------------------+| [A-1] AbarVaLogo [A-2] Apex Retail · Rich [A-3] Home Programs Source Intelligence Tower Admin [A-4] User      |+--------------------------------------------------------------------------------------------------------------+| [B-1] Context: Tower · Atlas · Lens: Portfolio · Data: deterministic · Source signal: AMS commercial risk      |+--------------------------------------------------------------------------------------------------------------+| [C-1] Control Tower Header: Enterprise AI operating view                                                     [D]|| [C-2] Atlas Executive Brief: value/risk tradeoff, missing data, recommended executive action                [D-1] Agent Rail || [C-3] Lens Nav: Portfolio | Adoption | Value | Risk | Cost | Productivity | Tech/Data Readiness             [D-2] Atlas || +----------------------------------------------------------------------------------------------------------+ [D-3] Steward || | [C-4] Active Lens Canvas: five scorecards max, one active narrative, data basis and caveats              | [D-4] Sentinel || +----------------------------------------------------------------------------------------------------------+ [D-5] Nexus || | [C-5] Pressure Cards: top 3 pressures only — value risk, governance gap, data readiness                  | [D-6] 3+Custom || +----------------------------------------------------------------------------------------------------------+ || | [C-6] Recommended Executive Action + Decision Options                                                    | || +----------------------------------------------------------------------------------------------------------+ || | [C-7] Evidence / Source Basis Preview: program, Source event, metric readiness, missing evidence         | || +----------------------------------------------------------------------------------------------------------+ || | [C-8] Action Bar: Open decision brief | Assign evidence owner | Schedule review | Custom                 | |+--------------------------------------------------------------------------------------------------------------+| [E-1] Decision, evidence, program impact, risk/readiness, active lens detail drawers                         |+--------------------------------------------------------------------------------------------------------------+
Mobile rendering · 375px
+-----------------------------+| [A-1] AbarVaLogo     [A-4]  || [A-2] Apex Retail · Rich    |+-----------------------------+| [B-1] Tower · Portfolio     || Deterministic signals       |+-----------------------------+| [C-1] AI Control Tower      || [C-2] Atlas Executive Brief |+-----------------------------+| [C-3] Lens chips            || Portfolio Adoption Value    |+-----------------------------+| [C-4] Active Lens Canvas    |+-----------------------------+| [C-5] Top 3 Pressure Cards  |+-----------------------------+| [C-6] Executive Action      |+-----------------------------+| [C-7] Evidence Basis        |+-----------------------------+| [C-8] Action Bar            |+-----------------------------+| [D-1] Agent rail bottom     |+-----------------------------+
Section 5 · Element catalog
Every coordinate-labeled element below has explicit visual treatment, data source, empty/loading/error behavior. Hardcoded content is limited to static labels (authoring rule 4).
A-1 · Canonical AbarVa logo
Element type: brand/logo.
Visual treatment: AbarVaLogo SVG.
Data source: Brand asset.
Empty state: Text fallback.
Loading state: Immediate.
Error state: Text fallback.
A-2 · Tenant data tier badge
Element type: chip.
Visual treatment: Rich/Thin/Shell-only.
Data source: Demo dataset registry.
Empty state: Unknown tenant.
Loading state: Skeleton.
Error state: Unavailable.
A-3 · Primary navigation
Element type: nav links.
Visual treatment: Control Tower active with dark-blue underline.
Data source: AbarVa shell nav config.
Empty state: Canonical nav.
Loading state: Progressive.
Error state: Navigation error.
B-1 · Tower context strip
Element type: context strip.
Visual treatment: Context chips: lens, data tier, caveat, source signal.
Data source: Context Bundle: tenant, lens, tower signals, source/program refs.
Empty state: Show low-context tower strip.
Loading state: Skeleton strip.
Error state: Error strip.
C-1 · Control Tower header
Element type: heading.
Visual treatment: H1 dark navy, concise subtitle.
Data source: Route/tenant context.
Empty state: Unavailable header.
Loading state: Skeleton.
Error state: Error.
C-2 · Atlas executive brief
Element type: agent editorial/executive panel.
Visual treatment: Selective dark navy header allowed; 110-150 words.
Data source: Tower read models: adoption/value/risk/productivity/cost/source signals.
Empty state: Thin-context executive caveat.
Loading state: Skeleton paragraph.
Error state: Atlas refusal_or_caveat.
C-3 · Active lens navigation
Element type: tabs/chips.
Visual treatment: Thin chips; one active lens; no dashboard filters overload.
Data source: Static blueprint lens set + selected lens.
Empty state: Default Portfolio.
Loading state: No loading.
Error state: Disable invalid lens.
C-4 · Active lens canvas
Element type: workflow canvas.
Visual treatment: Five scorecards max, strong whitespace.
Data source: Selected lens read model.
Empty state: Show lens with missing data caveat.
Loading state: Skeleton cards.
Error state: Lens unavailable.
C-5 · Pressure cards
Element type: pressure card group.
Visual treatment: Three cards max with restrained severity chips.
Data source: Tower pressure/risk models + Source signals.
Empty state: No pressure signals; show “No pressures detected in seed.”
Loading state: Skeleton cards.
Error state: Pressure cards unavailable.
C-6 · Recommended executive action
Element type: decision panel.
Visual treatment: Decision options with readiness/evidence basis.
Data source: Atlas recommendation view.
Empty state: Show setup/review action only.
Loading state: Skeleton action block.
Error state: Action unavailable.
C-7 · Evidence/source basis preview
Element type: evidence panel.
Visual treatment: Evidence chips + missing metrics.
Data source: Evidence ledger, source signals, program deliverables.
Empty state: Show “No decision-grade evidence yet.”
Loading state: Skeleton.
Error state: Evidence unavailable.
C-8 · Action Bar
Element type: action bar.
Visual treatment: Three context actions + custom.
Data source: Suggested action generator.
Empty state: Setup actions only.
Loading state: Skeleton buttons.
Error state: Disable actions.
D-1 · Agent rail
Element type: agent rail.
Visual treatment: Atlas primary; handoffs only when contextual.
Data source: Agent mission queue/handoffs.
Empty state: No missions.
Loading state: Skeleton.
Error state: Unavailable.
D-2 · Atlas recommendation
Element type: agent card.
Visual treatment: Value/risk tradeoff.
Data source: Atlas executive brief read model.
Empty state: No Atlas recommendation.
Loading state: Skeleton.
Error state: Unavailable.
D-3 · Steward blocker
Element type: agent card.
Visual treatment: Governance/readiness blocker.
Data source: Governance/readiness models.
Empty state: No blocker.
Loading state: Skeleton.
Error state: Unavailable.
D-4 · Sentinel evidence caveat
Element type: agent card.
Visual treatment: Evidence gap.
Data source: Evidence/source basis.
Empty state: No evidence gap.
Loading state: Skeleton.
Error state: Unavailable.
D-5 · Nexus program action
Element type: agent card.
Visual treatment: Program action handoff.
Data source: Programs/work items.
Empty state: No action.
Loading state: Skeleton.
Error state: Unavailable.
D-6 · 3 suggestions + custom
Element type: suggested actions.
Visual treatment: Context-generated.
Data source: Context Bundle.
Empty state: Setup suggestions.
Loading state: Skeleton.
Error state: Disabled.
Section 6 · Click and interaction map
C-3 Lens chip
Click target: C-4 Active Lens Canvas updates
Permission required to render: tenant member
Permission required to execute: tenant member
Confirmation flow: none
State change on success: Active lens changes; [B-1] context updates.
State change on failure: Remain on current lens.
Audit event emitted: tower.lens.changed
Effect on conversation history: None.
C-4 Scorecard
Click target: Lens Detail Drawer E-1
Permission required to render: tenant member
Permission required to execute: tenant member
Confirmation flow: none
State change on success: Open metric basis/missing data.
State change on failure: Drawer unavailable.
Audit event emitted: tower.scorecard.opened
Effect on conversation history: None.
C-5 Pressure card
Click target: Risk/Readiness Drawer E-1
Permission required to render: tenant member
Permission required to execute: tenant member
Confirmation flow: none
State change on success: Open pressure rationale and evidence.
State change on failure: Show unavailable.
Audit event emitted: tower.pressure.opened
Effect on conversation history: None.
C-6 Open decision brief
Click target: Executive Decision Drawer E-1
Permission required to render: tenant member
Permission required to execute: CIO/exec for future approve
Confirmation flow: explicit confirm only if future decision action becomes live; current view read-only
State change on success: Open read-only decision brief.
State change on failure: Show unavailable.
Audit event emitted: atlas_decision.opened
Effect on conversation history: Adds decision context if queried.
C-6 Assign evidence owner
Click target: Evidence owner drawer; disabled live write
Permission required to render: tenant member
Permission required to execute: Steward/admin for future write
Confirmation flow: explicit confirm with rationale if future write exists
State change on success: Current state: show deferred assignment caveat.
State change on failure: Show deferred.
Audit event emitted: tower_action.deferred
Effect on conversation history: None.
C-6 Schedule review
Click target: Calendar/workflow deferred drawer
Permission required to render: tenant member
Permission required to execute: tenant member
Confirmation flow: soft confirm if future scheduling enabled
State change on success: Show scheduling deferred/copy action.
State change on failure: Show error/deferred.
Audit event emitted: tower_review.deferred
Effect on conversation history: None.
C-7 Evidence chip
Click target: Evidence Drawer E-1
Permission required to render: tenant member
Permission required to execute: tenant member
Confirmation flow: none
State change on success: Open evidence/source details.
State change on failure: Show unavailable.
Audit event emitted: evidence.opened
Effect on conversation history: None.
C-8 Custom
Click target: Custom query input
Permission required to render: tenant member
Permission required to execute: tenant member
Confirmation flow: none
State change on success: Open Ask Atlas contextual input; must show context used.
State change on failure: Low-context refusal.
Audit event emitted: atlas_custom.opened
Effect on conversation history: Creates scoped conversation turn.
D-3 Steward card
Click target: Governance drawer
Permission required to render: tenant member
Permission required to execute: tenant member
Confirmation flow: none
State change on success: Open governance blocker.
State change on failure: Show unavailable.
Audit event emitted: steward_blocker.opened
Effect on conversation history: None.
D-5 Nexus action
Click target: Program impact drawer
Permission required to render: tenant member
Permission required to execute: tenant member
Confirmation flow: none
State change on success: Open impacted program/action.
State change on failure: Show unavailable.
Audit event emitted: nexus_handoff.opened
Effect on conversation history: None.
Section 7 · Agent editorial contract
Authoring agent: Atlas.
Required Context Bundle categories: tenant, portfolio signals, adoption/value/risk/productivity/cost data, evidence basis, missing metrics, source/program impacts.
Editorial response modes permitted: status, diagnostic, recommendation, executive, evidence, refusal_or_caveat.
Word count budget: status 35-60 words; diagnostic 70-110 words; recommendation 80-130 words; evidence 60-100 words; executive 110-160 words; refusal_or_caveat 45-80 words.
Voice contract: Atlas voice: executive value/risk synthesis; translates signals into decisions and tradeoffs (doc 03 §Atlas; AGENTX rule 6).
Honest-disclosure behavior: use doc 02 addendum five states — full_context, partial_context, thin_context, blocked_context, unavailable_context. Thin or blocked states must show missing data before recommendations.
Citation rendering rules: cite evidence/source basis chips in the editorial footer; use human-readable source labels such as “Apex Retail AMS seed scenario” or “Program APX-02 evidence trace,” not opaque IDs only.
Confidence chip rendering rules: use Confidence Qualifier primitive with supported, partial, low, blocked, or unavailable; never show green confidence when evidence is missing.
Specific refusals: Atlas will not invent financial results, claim live telemetry, or make investment recommendations without evidence caveat.
Section 8 · Suggested actions specification
Every substantive agent response closes with exactly three context-generated suggestions plus a custom option when suggestions help move work forward (doc 05 §Suggested actions; AGENTX rule 7).
Fresh load with full context
Open executive decision brief
Show top risk pressure
Compare value and adoption signals
Custom: ask Atlas for tradeoff summary
Missing value data
Show missing metrics
Open evidence basis
Ask Steward for readiness blockers
Custom: explain what prevents pilot readiness
High-risk portfolio
Open risk lens
Create executive review action
Show affected programs
Custom: ask Atlas for next board-ready point
Context Bundle fields driving suggestions: activeLens, scorecards, pressureCards, valueSignals, riskSignals, adoptionSignals, missingMetrics, sourceSignals.
Forbidden suggestions: “Tell me more,” “Generate insights,” “Analyze this,” “Ask AI,” “Next,” or any filler that does not identify a work object, stage, evidence gap, or action.
Section 9 · Workflow state rendering
State machine being rendered: Control Tower active-lens state from doc D1: selected_lens plus signal states observed, evidence_partial, action_recommended, deferred. It renders executive decision readiness rather than program workflow transitions.
Current state: Current lens chip [C-3] is dark-blue accented; active canvas [C-4] title repeats lens question.
Completed states: Resolved pressure signals are muted and moved below active pressures; summary counts only remain above fold.
Blocked/at-risk states: At-risk signals use pressure cards [C-5] with missing evidence, governance blocker, or data readiness reason.
Future locked states: Future unavailable lenses render locked/deferred with data-tier caveat, especially for Meridian/Arcturus.
Click-through behavior per state: Clicking lens/score/pressure updates canvas or opens drawer; it never changes enterprise status without approved workflow.
Section 10 · File attachment behavior
Not applicable on this page. Control Tower consumes program/source/evidence data and does not accept direct uploads. Attachments must be added at the originating Programs, Source, or Admin/Data surfaces so evidence provenance and work-object association remain intact (doc 05 §File attachments).
Section 11 · Cross-surface consistency
Scorecard counts and active program counts must match Programs list, Program Flagship, and Demo Dataset Registry.
Source commercial signals must match SourceCommercialSignalsPreview and Intelligence pattern outputs if surfaced.
Value/risk claims must match Production Readiness caveats and not imply live telemetry.
Atlas recommended actions must map to real Program/Source/Admin work objects or show missing data.
Tenant identity and data tier must match the shell/nav badge and Admin setup readiness.
Section 12 · Failure modes this page must prevent
Generic AI response (F1.1): prevented by requiring Context Bundle categories, context-used strip, evidence/source basis, and page-specific agent voice before editorial renders (doc 07 §F1.1; doc 03).
Blank-prompt dead-end (F1.2): prevented by mandatory three context-generated suggestions plus custom; suggestions are derived from current work object and state (doc 05 §Suggested actions).
Agent-as-rail (F1.3): prevented by placing agent editorial at top of Zone C, not only in Zone D rail (doc 04 §Zone C; AGENTX).
Static template response (F1.4): prevented by Context Bundle scoring and thin-context disclosure; generic text fails acceptance criteria (doc 02 addendum; doc 07 §F1.4).
F2 KPI theater: scorecard grid without decision context is forbidden. Prevented by Atlas executive brief and active lens model.
F3 Fake live telemetry: deterministic seed data cannot appear as live enterprise metrics. Prevented by live/deterministic caveat in Zone B and C-2.
F4 Overloaded executive dashboard: more than five scorecards or three pressure cards above fold is forbidden. Prevented by active lens caps.
F5 Unactionable insight: each lens must include next executive action and missing data.
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
Atlas executive brief, active lens, top scorecards, top pressure cards, evidence basis, and next action render above first scroll depth.
No more than five scorecards and three pressure cards appear at once.
Section 14 · Persona walkthrough
Persona identity and context: Rafael Ortiz, CFO/Value Office sponsor for Apex Retail, opens Control Tower before an executive review of AI and sourcing investments.
Goal entering the page: see whether AI initiatives are producing value safely and where executive attention is needed.
First three seconds: he sees Atlas executive brief, active Portfolio lens, top risk pressure, missing value data, and recommended executive action.
Turn 1: Rafael clicks the Risk lens [C-3]. The active lens canvas switches from Portfolio to Risk and shows governance/data readiness signals plus missing evidence.
Turn 2: Rafael clicks the top pressure card [C-5]. The risk drawer opens and shows source/program basis, missing data, and Steward blocker. It does not claim live telemetry.
Turn 3: Rafael clicks “Open decision brief” [C-6]. Atlas opens a read-only executive decision brief with value/risk tradeoff and next evidence action.
State they leave in: no executive decision is falsely made; Rafael has a clear review agenda and evidence gaps to resolve.
Verdict demonstrated: doc 06 persona crawler ACCEPT for CFO/Value persona because Atlas summarizes tradeoffs with missing-data caveats and concrete next action.
