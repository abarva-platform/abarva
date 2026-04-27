# Intelligence · Sentinel Pattern Workspace — AUTHORED-DRAFT canonical spec

_Imported from `AbarVa_Intelligence_Wireframe_Specification.docx` (v1.0, 2026-04-27). Source of truth — supersedes the legacy `*_wireframe.md` sketches in this folder._

---

Intelligence · Sentinel Pattern Workspace
Wireframe Specification · AUTHORED-DRAFT
Page Name
 | Intelligence · Sentinel Pattern Workspace
 | 
Route
 | /tenant/[tenantSlug]/intelligence and /tenant/[tenantSlug]/intelligence/patterns/[patternKey]
 | 
Surface
 | Intelligence
 | 
Agent Owner
 | Sentinel
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
 | Intelligence · Sentinel Pattern Workspace
 | 
Route
 | /tenant/[tenantSlug]/intelligence; pattern detail: /tenant/[tenantSlug]/intelligence/patterns/[patternKey] (example: /tenant/apex-retail/intelligence/patterns/contact-center-ai)
 | 
Surface
 | Intelligence
 | 
Primary agent owner
 | Sentinel
 | 
Secondary agent participation
 | Nexus converts patterns into workshops/actions; Steward validates evidence/governance readiness; Atlas translates patterns into executive value/risk tradeoffs.
 | 
Personas served
 | CIO/CTO, Transformation Lead, Data Owner, Client Maestro, Sourcing Lead, Steward Admin.
 | 
Primary user question
 | What patterns, risks, evidence gaps, and opportunities is Sentinel detecting for this tenant, and what should we do next?
 | 
Canon trace: page identity and primary question are required by PX1 page blueprint authority and doc 01 §Five-question test.
Section 2 · Five-question test answers
Question
 | Answer source on wireframe
 | 
Where am I?
 | Zone A [A-1] + Zone C [C-1]: “Apex Retail · Intelligence · Sentinel.”
 | 
What matters right now?
 | Zone C [C-2] Sentinel Brief identifies the top active pattern and impacted work object.
 | 
What is blocked or at risk?
 | Zone C [C-5] Evidence Basis panel and [D-3] Sentinel gap card show unsupported claims/missing evidence.
 | 
What does the agent recommend?
 | Zone C [C-6] Recommended Actions canvas shows next workshop/action and handoff agent.
 | 
What should I do next?
 | Zone C [C-8] Action Bar offers three context actions + custom, driven by pattern/evidence state.
 | 
Canon trace: the five answers must be visible within three seconds of landing (doc 01 §Five-question test).
Section 3 · Zone composition
Zone
 | Composition
 | 
A
 | Fixed top header, 72px desktop / 64px mobile. Canonical AbarVa shell with Intelligence active. Tenant badge shows Apex Retail rich or Meridian thin depending route (doc 04 §Zone A).
 | 
B
 | Present. Context strip [B-1] shows tenant data tier, Intelligence mode, top pattern, evidence confidence, deterministic/live caveat.
 | 
C
 | Primary workspace. Sentinel editorial leads, followed by active pattern strip, one active canvas mode at a time: Summary, Evidence, Programs, Actions, Signals. No stacked dashboard grid (doc 04 §Zone C; Intelligence blueprint).
 | 
D
 | Agent rail present. Sentinel is primary; Nexus, Steward, Atlas appear only as handoff cards tied to concrete pattern/evidence/action. Collapses to bottom sheet on mobile.
 | 
E
 | Drawers: Evidence Drawer, Pattern Detail Drawer, Source Basis Drawer, Program Impact Drawer, Action/Handoff Drawer.
 | 
Canon trace: Zones A-E and named primitives are required by doc 04 §Composition zones.
Section 4 · ASCII wireframe with coordinate labels
Desktop rendering · 1440px
+--------------------------------------------------------------------------------------------------------------+| [A-1] AbarVaLogo [A-2] Apex Retail · Rich [A-3] Home Programs Source Intelligence Tower Admin [A-4] User      |+--------------------------------------------------------------------------------------------------------------+| [B-1] Context: Intelligence · Sentinel · Top pattern: commercial variance · Evidence: partial · Seed-backed   |+--------------------------------------------------------------------------------------------------------------+| [C-1] Intelligence Header: What Sentinel is detecting                                                       [D]|| [C-2] Sentinel Editorial Brief: active pattern, evidence state, missing inputs, recommended next action     [D-1] Agent Rail || [C-3] Active Pattern Strip: Commercial variance | Evidence gap | BAFO readiness | Governance gap             [D-2] Sentinel || [C-4] Canvas Mode Tabs: Summary | Evidence | Programs | Actions | Signals                                   [D-3] Nexus Handoff || +----------------------------------------------------------------------------------------------------------+ [D-4] Steward || | [C-5] Active Insight Canvas: pattern detail, source basis, confidence, affected work objects             | [D-5] Atlas || +----------------------------------------------------------------------------------------------------------+ [D-6] 3+Custom || | [C-6] Recommended Actions: run workshop, request evidence, create mission, brief executive               | || +----------------------------------------------------------------------------------------------------------+ || | [C-7] Evidence / Source Basis Preview: source event, program, evidence status, unsupported claims        | || +----------------------------------------------------------------------------------------------------------+ || | [C-8] Action Bar: Open evidence drawer | Create workshop brief | Ask Sentinel | Custom                    | |+--------------------------------------------------------------------------------------------------------------+| [E-1] Evidence, Pattern, Source Basis, Program Impact, Action/Handoff drawers                                |+--------------------------------------------------------------------------------------------------------------+
Mobile rendering · 375px
+-----------------------------+| [A-1] AbarVaLogo     [A-4]  || [A-2] Apex Retail · Rich    |+-----------------------------+| [B-1] Sentinel · Evidence   || partial · Seed-backed       |+-----------------------------+| [C-1] Intelligence          || [C-2] Sentinel Brief        |+-----------------------------+| [C-3] Active Pattern Chips  |+-----------------------------+| [C-4] Modes: Summary Evidence|+-----------------------------+| [C-5] Insight Canvas        |+-----------------------------+| [C-6] Recommended Actions   |+-----------------------------+| [C-7] Evidence Basis        |+-----------------------------+| [C-8] Action Bar            |+-----------------------------+| [D-1] Agent rail bottom     |+-----------------------------+
Section 5 · Element catalog
Every coordinate-labeled element below has explicit visual treatment, data source, empty/loading/error behavior. Hardcoded content is limited to static labels (authoring rule 4).
A-1 · Canonical AbarVa logo
Element type: brand/logo.
Visual treatment: AbarVaLogo SVG, 32px desktop.
Data source: Brand asset.
Empty state: Text fallback.
Loading state: Immediate.
Error state: Text fallback.
A-2 · Tenant data tier badge
Element type: chip.
Visual treatment: Rich/Thin/Shell-only badge with caveat.
Data source: Demo dataset registry.
Empty state: Unknown tenant badge.
Loading state: Skeleton chip.
Error state: Data tier unavailable chip.
A-3 · Primary nav
Element type: nav links.
Visual treatment: Active Intelligence dark-blue underline.
Data source: AbarVa shell nav config.
Empty state: Canonical nav.
Loading state: Progressive.
Error state: Navigation error message.
B-1 · Intelligence context strip
Element type: context strip.
Visual treatment: Context Used Chip Group + confidence qualifier.
Data source: Context Bundle: tenant, patterns, evidence, source basis.
Empty state: Show low-context strip.
Loading state: Skeleton strip.
Error state: Show error strip.
C-1 · Intelligence header
Element type: heading.
Visual treatment: H1 dark navy; subtitle explains Sentinel.
Data source: Route/tenant context.
Empty state: Show “Intelligence unavailable.”
Loading state: Header skeleton.
Error state: Error header with retry.
C-2 · Sentinel editorial brief
Element type: agent editorial block.
Visual treatment: 90-120 words; white/ivory block; evidence chip.
Data source: Context Bundle: patterns, evidence, programs/source events.
Empty state: Thin-context disclosure.
Loading state: Skeleton lines.
Error state: Sentinel refusal_or_caveat.
C-3 · Active pattern strip
Element type: chip group.
Visual treatment: Horizontal chips, no icon spam.
Data source: Intelligence patterns read model.
Empty state: No active patterns; show setup/data action.
Loading state: Skeleton chips.
Error state: Pattern service unavailable.
C-4 · Canvas mode tabs
Element type: tabs.
Visual treatment: Thin segmented nav; one active canvas.
Data source: Static blueprint modes.
Empty state: Default Summary.
Loading state: No loading.
Error state: Disable invalid mode.
C-5 · Insight canvas
Element type: workflow canvas.
Visual treatment: Active mode panel; evidence/source basis visible.
Data source: Selected pattern + source basis + context quality.
Empty state: Show low-context canvas.
Loading state: Skeleton panel.
Error state: Error panel with caveat.
C-6 · Recommended actions
Element type: action list.
Visual treatment: Three actions max plus custom.
Data source: Suggestion generator from pattern/evidence state.
Empty state: Setup/data actions only.
Loading state: Skeleton list.
Error state: Disable actions.
C-7 · Evidence/source basis preview
Element type: evidence panel.
Visual treatment: Evidence cards with Confidence Qualifier.
Data source: Evidence ledger / source commercial patterns / program links.
Empty state: Show “No usable evidence.”
Loading state: Skeleton cards.
Error state: Evidence unavailable.
C-8 · Action bar
Element type: action bar.
Visual treatment: Open drawer, create brief, custom.
Data source: Context action generator.
Empty state: Only “Add evidence”/“Review context.”
Loading state: Skeleton buttons.
Error state: Action error.
D-1 · Agent rail
Element type: agent rail.
Visual treatment: Sentinel primary, handoffs only when relevant.
Data source: Agent mission/handoff read models.
Empty state: No missions.
Loading state: Skeleton.
Error state: Rail unavailable.
D-2 · Sentinel gap card
Element type: agent card.
Visual treatment: Evidence gap summary.
Data source: Unsupported claims / evidence gap.
Empty state: No gap shown.
Loading state: Skeleton.
Error state: Unavailable.
D-3 · Nexus handoff card
Element type: agent card.
Visual treatment: Workshop/action recommendation.
Data source: Pattern-to-action/handoff.
Empty state: No handoff.
Loading state: Skeleton.
Error state: Unavailable.
D-4 · Steward governance card
Element type: agent card.
Visual treatment: Readiness/gate blocker.
Data source: Governance/evidence policy.
Empty state: No governance blocker.
Loading state: Skeleton.
Error state: Unavailable.
D-5 · Atlas implication card
Element type: agent card.
Visual treatment: Executive value/risk implication.
Data source: Tower/Atlas read model.
Empty state: No implication.
Loading state: Skeleton.
Error state: Unavailable.
D-6 · 3 suggestions + custom
Element type: suggested actions.
Visual treatment: Context-generated suggestions only.
Data source: Context Bundle + selected pattern.
Empty state: Setup suggestions.
Loading state: Skeleton.
Error state: Disabled.
Section 6 · Click and interaction map
C-3 Pattern chip
Click target: C-5 Insight Canvas updates; pattern detail drawer optional
Permission required to render: tenant member
Permission required to execute: tenant member
Confirmation flow: none
State change on success: Canvas switches to selected pattern; context strip updates.
State change on failure: Chip remains unselected and error shown.
Audit event emitted: intelligence.pattern.selected
Effect on conversation history: Adds selected pattern to conversation scope.
C-4 Summary/Evidence/Programs/Actions/Signals tab
Click target: Same-page canvas mode
Permission required to render: tenant member
Permission required to execute: tenant member
Confirmation flow: none
State change on success: Active canvas changes; no route change.
State change on failure: Mode remains current.
Audit event emitted: intelligence.mode.changed
Effect on conversation history: None.
C-7 Evidence item
Click target: Evidence Drawer E-1
Permission required to render: tenant member
Permission required to execute: tenant member
Confirmation flow: none
State change on success: Drawer opens with evidence/source details.
State change on failure: Shows evidence unavailable.
Audit event emitted: evidence.drawer.opened
Effect on conversation history: None.
C-6 Recommended action: Create workshop brief
Click target: Proposed workshop brief drawer; no write
Permission required to render: tenant member
Permission required to execute: Client Maestro / Nexus operator
Confirmation flow: soft confirm if future action applies
State change on success: Preview recommended workshop/action; no state transition.
State change on failure: Action disabled.
Audit event emitted: intelligence.action.proposed
Effect on conversation history: Adds context turn.
C-8 Ask Sentinel
Click target: Custom contextual query box
Permission required to render: tenant member
Permission required to execute: tenant member
Confirmation flow: none
State change on success: Open query scoped to selected pattern/evidence.
State change on failure: Low-context refusal if missing context.
Audit event emitted: sentinel.query.opened
Effect on conversation history: Creates scoped conversation turn.
D-3 Nexus handoff
Click target: Handoff drawer
Permission required to render: tenant member
Permission required to execute: tenant member
Confirmation flow: none
State change on success: Open handoff rationale and suggested workshop.
State change on failure: Show unavailable.
Audit event emitted: agent_handoff.opened
Effect on conversation history: None.
D-4 Steward card
Click target: Governance/evidence drawer
Permission required to render: tenant member
Permission required to execute: Steward/admin for future changes
Confirmation flow: none for read-only
State change on success: Open gate/readiness blocker.
State change on failure: Show unavailable.
Audit event emitted: steward_blocker.opened
Effect on conversation history: None.
D-5 Atlas card
Click target: Executive implication drawer
Permission required to render: tenant member
Permission required to execute: tenant member
Confirmation flow: none
State change on success: Open value/risk tradeoff.
State change on failure: Show unavailable.
Audit event emitted: atlas_implication.opened
Effect on conversation history: None.
D-6 Custom
Click target: Custom input
Permission required to render: tenant member
Permission required to execute: tenant member
Confirmation flow: none
State change on success: Opens custom prompt; response must show context used.
State change on failure: Refusal/caveat state.
Audit event emitted: agent_custom.opened
Effect on conversation history: Creates scoped turn.
Section 7 · Agent editorial contract
Authoring agent: Sentinel.
Required Context Bundle categories: tenant, intelligence patterns, source basis, evidence confidence, impacted work objects, missing inputs, context quality.
Editorial response modes permitted: status, diagnostic, recommendation, evidence, refusal_or_caveat. Artifact mode only as evidence brief, not generated deliverable.
Word count budget: status 35-60 words; diagnostic 70-110 words; recommendation 80-130 words; evidence 60-100 words; executive 110-160 words; refusal_or_caveat 45-80 words.
Voice contract: Sentinel voice: evidence skeptic and pattern detector; surfaces unsupported claims and missing evidence (doc 03 §Sentinel; AGENTX rules 4, 8, 10).
Honest-disclosure behavior: use doc 02 addendum five states — full_context, partial_context, thin_context, blocked_context, unavailable_context. Thin or blocked states must show missing data before recommendations.
Citation rendering rules: cite evidence/source basis chips in the editorial footer; use human-readable source labels such as “Apex Retail AMS seed scenario” or “Program APX-02 evidence trace,” not opaque IDs only.
Confidence chip rendering rules: use Confidence Qualifier primitive with supported, partial, low, blocked, or unavailable; never show green confidence when evidence is missing.
Specific refusals: Sentinel will not make unsupported pattern claims, hide low-context state, or produce generic AI insights.
Section 8 · Suggested actions specification
Every substantive agent response closes with exactly three context-generated suggestions plus a custom option when suggestions help move work forward (doc 05 §Suggested actions; AGENTX rule 7).
Fresh load with full context
Open evidence basis
Show impacted programs
Create Nexus workshop handoff
Custom: ask Sentinel what is unsupported
Low-context tenant
Show missing data
Open setup/data readiness guidance
Switch to Apex Retail rich demo
Custom: ask what evidence is required
Blocked evidence state
List unsupported claims
Request evidence manifest
Ask Steward to review evidence usability
Custom: explain confidence score
Context Bundle fields driving suggestions: tenantDataTier, activePatterns, evidenceConfidence, unsupportedClaims, impactedPrograms, sourceEvents, missingInputs.
Forbidden suggestions: “Tell me more,” “Generate insights,” “Analyze this,” “Ask AI,” “Next,” or any filler that does not identify a work object, stage, evidence gap, or action.
Section 9 · Workflow state rendering
State machine being rendered: Intelligence triage state from doc D1: observed → evidence_partial → evidence_supported → action_recommended → actioned/deferred. Pattern status may be active, monitoring, blocked_by_evidence, retired.
Current state: Current pattern chip [C-3] and canvas [C-5] use dark-blue active state plus confidence qualifier.
Completed states: Actioned/resolved patterns are muted, shown after active patterns, and remain clickable for audit.
Blocked/at-risk states: Blocked patterns require a missing-evidence or unsupported-claim explanation in [C-7].
Future locked states: Future signals render as locked/deferred with low-context caveat.
Click-through behavior per state: Clicking pattern states changes canvas/drawer, never marks patterns resolved without workflow support.
Section 10 · File attachment behavior
Not applicable on this page. Intelligence does not directly accept uploads because evidence must enter through Source, Programs, Admin/Data, or a dedicated evidence drawer on the originating work object. Intelligence may open an Evidence Drawer to inspect source basis, but not upload files directly (doc 05 §File attachments).
Section 11 · Cross-surface consistency
Pattern names and categories must match Intelligence pattern registry and Source commercial patterns where sourced from Source.
Evidence confidence must match Evidence Drawer and any Program deliverable evidence trace that references the same work object.
Tenant data tier must match Demo Dataset Registry: Apex Retail rich, Meridian thin, Arcturus shell-only.
Impacted program/source event names must match Program and Source routes; no new work-object names invented in Intelligence.
Sentinel evidence gap missions must match Agent Mission Queue and Source/Program missing-input lists.
Section 12 · Failure modes this page must prevent
Generic AI response (F1.1): prevented by requiring Context Bundle categories, context-used strip, evidence/source basis, and page-specific agent voice before editorial renders (doc 07 §F1.1; doc 03).
Blank-prompt dead-end (F1.2): prevented by mandatory three context-generated suggestions plus custom; suggestions are derived from current work object and state (doc 05 §Suggested actions).
Agent-as-rail (F1.3): prevented by placing agent editorial at top of Zone C, not only in Zone D rail (doc 04 §Zone C; AGENTX).
Static template response (F1.4): prevented by Context Bundle scoring and thin-context disclosure; generic text fails acceptance criteria (doc 02 addendum; doc 07 §F1.4).
F2 Pattern theater: pattern lists without evidence/source basis are forbidden. Prevented by evidence/source basis drawer and confidence chips.
F3 Fake confidence: confidence cannot be high when evidence is partial/missing. Prevented by confidence qualifier rules.
F4 Tenant overclaim: Meridian/Arcturus cannot show Apex-level intelligence. Prevented by tenant data tier caveats.
F5 Chat-first intelligence: page cannot be a blank chat prompt. Prevented by Sentinel brief, pattern strip, and active canvas modes.
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
Sentinel brief, active pattern strip, evidence/source basis, and next action all render without opening a drawer.
Low-context tenants visibly disclose missing data and never show Apex-level signals.
Section 14 · Persona walkthrough
Persona identity and context: Priya Rao, Data Owner for Apex Retail, opens Intelligence after Source commercial signals indicate pricing comparability and evidence gaps.
Goal entering the page: understand which patterns are evidence-backed, which are unsupported, and what data is needed before action.
First three seconds: she sees Sentinel, top pattern, evidence confidence partial, impacted Source event/program, and missing evidence callout.
Turn 1: Priya clicks the “Evidence” canvas mode [C-4]. The canvas switches to evidence/source basis and shows which Source event and program evidence supports the pattern.
Turn 2: Priya clicks an unsupported claim in [C-7]. Evidence Drawer opens with missing evidence and confidence state. Sentinel refuses to treat the claim as supported.
Turn 3: Priya clicks “Create Nexus workshop handoff” [C-6]. A handoff drawer opens with recommended workshop purpose and missing evidence to capture; no live workflow write occurs.
State they leave in: pattern remains active with partial evidence, but next evidence/workshop action is clear.
Verdict demonstrated: doc 06 persona crawler ACCEPT for Data Owner because Sentinel does not overclaim and turns evidence gaps into concrete next actions.
