# AbarVa Experience System Adoption Bridge: Current App

## Purpose

This bridge maps the AbarVa Experience System to the current application implementation so future UI work can move from design canon to practical, sequenced adoption without broad redesign.

This is a documentation-only bridge. It does not implement tokens, components, routes, API behavior, model calls, upload/parsing, or page refactors.

## Source of Truth Inputs

- `docs/platform-design/experience-system/00_EXPERIENCE_SYSTEM_MASTER_ANCHOR.md`
- `docs/platform-design/experience-system/01_BRAND_AND_VISUAL_LANGUAGE.md`
- `docs/platform-design/experience-system/03_DESIGN_TOKENS_AND_USAGE.md`
- `docs/platform-design/experience-system/04_JOURNEY_PROGRESS_SYSTEM.md`
- `docs/platform-design/experience-system/07_AGENTIC_INTERACTION_PATTERNS.md`
- `docs/platform-design/experience-system/13_AGENT_RESPONSE_DESIGN_SYSTEM.md`
- `docs/platform-design/experience-system/14_THREE_CHOICES_PLUS_CUSTOM_PATTERN.md`
- `docs/platform-design/experience-system/15_CONTEXT_AWARENESS_UI_RULES.md`
- `docs/platform-design/experience-system/wireframes/`
- `docs/platform-design/experience-system/components/`

## Current App Surface Map

| Surface | Current Route / File Evidence | Experience System Target | Adoption Gap | Recommended Adoption |
| --- | --- | --- | --- | --- |
| Home | `src/app/(maestro)/home/page.tsx`, `src/components/home/composite/*` | Executive Entry / Home | Stronger fit than many surfaces: warm canvas, portfolio glance, stakeholder lens. Still uses local tokens rather than shared Experience System tokens. | Map Home to `01_home_executive_entry_wireframe.md` and migrate local colors into shared design tokens after token bridge exists. |
| Programs | `src/app/(maestro)/engagements/*`, `src/app/programs/*`, `src/components/programs/*`, `src/components/deliverables/NexusProgramRail.tsx` | Programs Portfolio and Program/Event Workbench | Multiple route families and legacy/canonical components. Phase/journey behavior exists in places but needs unified AbarVaJourneyMap contract. | Audit Programs against `02_programs_portfolio_wireframe.md`, `03_program_detail_by_phase_wireframes.md`, and component specs before any UI changes. |
| Source | `src/app/(maestro)/source/*`, `src/components/source/*` | Source Dashboard, Source Event by Stage, Vendor Evaluation, Artifacts/Approvals | Strong product foundation. Current `origin/main` still has a dark Source dashboard and component-local styling; Source light visual refinement is a separate open PR at time of this bridge. | Merge/review light dashboard work if accepted, then adopt shared table, pressure signal, journey, and context-used specs slice by slice. |
| Intelligence | `src/app/(maestro)/intelligence/*`, `src/components/intelligence/*` | Intelligence Sentinel Canvas | Rich pattern/library components exist, but many views use dark local constants and ask-bar/chat-like patterns that need context-aware guidance discipline. | Map library, pattern detail, and ask surfaces to `08_intelligence_sentinel_canvas_wireframe.md` and `13_AGENT_RESPONSE_DESIGN_SYSTEM.md`. |
| Control Tower | `src/app/(maestro)/tower/*`, `src/components/tower/*`, `src/components/atlas/*` | Control Tower Atlas Brief | Tower has warm canvas in places and Atlas rail behavior, but also uses local token sets and chat/rail patterns that should align to agent response modes and 3 choices rules. | Adopt Atlas brief, pressure signals, and recommendation list contracts before additional Tower UI work. |
| Admin/Setup | `src/app/(maestro)/platform/admin/*`, `src/components/admin/*` | Admin Setup Steward Control Plane | Admin already has Steward control-center direction and warm canvas in places, but contains emoji-heavy sidebar labels and local styles. | Align Admin to Steward control plane wireframe, dataset explorer, agent readiness, and minimal icon rules. |
| Platform | `src/app/(maestro)/platform/*`, `src/components/chrome/*` | AbarVa Page Shell and top navigation | Top nav includes Home, Programs, Source, Intelligence, Control Tower, Platform. It uses dark nav styling and local constants. | Define shared AbarVaPageShell/nav token adoption before surface-by-surface polishing. |
| Deliverables / Artifacts | `src/app/(maestro)/engagements/[engagementId]/deliverables/*`, `src/app/programs/[programId]/deliverable/[id]/page.tsx`, `src/components/deliverables/*` | Artifact Review Workspace and Artifact/Review/Approval patterns | Artifact rendering and Nexus rail exist, but lifecycle/version/review/approval patterns are not yet consistently rendered through Experience System components. | Use artifact strip, review approval panel, context used strip, and evidence drawer specs before artifact UI expansion. |

## Design Token Adoption Findings

| Current Finding | Evidence | Risk | Recommendation |
| --- | --- | --- | --- |
| Current shared design system is dark-first. | `src/lib/design-system.ts` sets `pageBg` to `#060A12` and labels light tokens as wrong for product pages. | Conflicts with Experience System default: warm off-white primary canvas and dark panels used sparingly. | First implementation slice should reconcile design tokens by adding Experience System light tokens without immediately refactoring every page. |
| Many surfaces define local constants. | Home, Tower, Admin, Intelligence, Source files include local color/font constants. | Visual drift and inconsistent page patterns. | Create shared token aliases first, then migrate one surface at a time. |
| Dark panels are overused in some current surfaces. | Source dashboard on current main, Intelligence library, older design-system defaults. | Product can feel like dark command center instead of premium off-white workbench. | Use dark panels only for command reads, briefs, and agent insight moments. |
| Accent usage varies by surface. | Teal, purple, amber, coral, green appear across Tower/Intelligence/Admin. | Color semantics can become noisy. | Normalize accent and risk semantics in shared token layer before broad visual changes. |

## Component Reuse Opportunities

| Experience Component | Current Candidate Files | Adoption Path |
| --- | --- | --- |
| `AbarVaPageShell` | `src/components/shared/layout/PageShell.tsx`, `src/components/chrome/AppChrome.tsx`, `src/components/chrome/PrimaryNav.tsx` | Define shell/nav token bridge first; do not rewrite all shells at once. |
| `AbarVaCommandRead` | Source dashboard command read, Home briefing, Tower Atlas brief, Admin Steward brief | Extract after at least two surfaces align on shape and token usage. |
| `AbarVaPressureSignals` | `SourceAlertPanel`, Tower pressure cards, Admin governance gaps | Start with Source/Tower pressure signal shape; keep list compact and text-first. |
| `AbarVaMetricStrip` | Source KPI strip, Admin stat cards, Tower panels, Home breadth row | Standardize labels, values, details, and responsive wrapping. |
| `AbarVaDataTable` | `SourcingEventTable`, Admin tables, vendor/evaluation tables, dataset explorer | Use table-forward patterns; avoid replacing queues with card grids. |
| `AbarVaJourneyMap` | `SourceJourneyTracker`, Programs phase views, deliverable phase views | Align state vocabulary before component extraction. |
| `AbarVaAgentPanel` | `PersistentNexusPanel`, `NexusProgramRail`, `AtlasRail`, `StewardAdminRail`, Intelligence rails | Normalize agent identity, response card, context-used strip, and 3 choices behavior. |
| `AbarVaContextUsedStrip` | Agent citations, Source context validation outputs, deliverable evidence chips | Define compact context-used rendering before new chat or agent UI. |
| `AbarVaEvidenceDrawer` | Drawer provider, deliverable evidence chips, Source artifact drawer | Future evidence UI should not cite unparsed uploads. |
| `AbarVaReviewApprovalPanel` | Admin approvals, Source workflow specs, artifact review docs | Implement after workflow/document collaboration requirements are ready for UI. |

## Agent Design Gaps

| Gap | Current Evidence | Experience System Target | Recommendation |
| --- | --- | --- | --- |
| Agent UI patterns are fragmented. | `AgentRail`, `NexusProgramRail`, `PersistentNexusPanel`, `AtlasRail`, `StewardAdminRail`, `AgentResponse` all exist with different shapes. | Shared agent response modes, context used strip, action-oriented guidance. | Create an agent UI inventory before refactoring runtime components. |
| Chat-like surfaces still exist. | Engagement, sponsor, data, identity, Atlas chat, Intelligence ask patterns. | Chat/input is a workflow accelerator, not the whole product. | Future agent UI must cite `13_AGENT_RESPONSE_DESIGN_SYSTEM.md` and `14_THREE_CHOICES_PLUS_CUSTOM_PATTERN.md`. |
| 3 choices + custom is not yet a shared UI primitive. | Some program rail choices exist, but not platform-wide. | Contextual choices used only when they move workflow forward. | Build the primitive only after one approved page-level use case is chosen. |
| Context used is inconsistent. | Citations and evidence chips exist in separate areas. | Compact, plain-language context used strip with missing context visibility. | Implement context-used strip before broad chat/model UI expansion. |

## Journey Progress Gaps

| Gap | Current Evidence | Experience System Target | Recommendation |
| --- | --- | --- | --- |
| Source has a journey tracker but needs canon alignment. | `SourceJourneyTracker.tsx` exists. | Real workflow states: waiting, blocked, needs approval, reopened, deferred. | Align Source tracker to `04_JOURNEY_PROGRESS_SYSTEM.md` before event canvas expansion. |
| Programs has multiple phase views. | `ProgramJourneyView`, `PhaseGateControl`, phase route files. | Unified phase map: Origination, Charter, Diagnose, Design, Execute, Verify. | Audit Programs phase display before redesign. |
| Artifacts need visible lifecycle and approval state. | Deliverable components exist; review/approval UI is not unified. | Draft, review, external edit, re-upload, approval, locked/final. | Do not expand artifact UI before lifecycle tracker spec is consumed. |
| Value realization journey is not a shared primitive. | Source value ledger and Programs value concepts exist separately. | Projected, baselined, measured, realized, reconciled. | Plan a ValueJourney spec-to-component slice later. |

## Source Dashboard Adoption Recommendations

The Source dashboard is the most immediate proving ground for the Experience System because it already has:

- Source route family.
- Source nav placement.
- Source domain types.
- Dashboard component family.
- Context validation foundation.
- Workflow validation foundation.

Recommended Source adoption order:

1. Resolve current Source visual PR state. At the time of this bridge, `feat(source): refine dashboard visual language` is open as PR #219 and not merged.
2. If PR #219 merges, perform authenticated screenshot review against `04_source_dashboard_wireframe.md` and `11_VISUAL_ACCEPTANCE_CRITERIA.md`.
3. Do not expand event canvas until the dashboard is accepted as baseline.
4. Next Source UI slice should cite:
   - `01_BRAND_AND_VISUAL_LANGUAGE.md`
   - `03_DESIGN_TOKENS_AND_USAGE.md`
   - `04_source_dashboard_wireframe.md`
   - `components/06_AbarVaCommandRead.md`
   - `components/07_AbarVaPressureSignals.md`
   - `components/08_AbarVaMetricStrip.md`
   - `components/09_AbarVaDataTable.md`

## Sequenced Adoption Path

### Step 1: Design Token Bridge

Create Experience System token aliases in `src/lib/design-system.ts` without refactoring every page. This should reconcile the current dark-first shared tokens with the new warm off-white default.

Scope should be tiny:

- Add warm canvas, surface, text, navy, accent, border, risk, and success tokens.
- Do not refactor pages in the same slice.
- Include a migration note for legacy dark tokens.

### Step 2: Source Dashboard Canon Adoption

After token bridge and PR #219 resolution, align Source dashboard to shared tokens and Experience System component shapes.

### Step 3: Agent UI Inventory

Map all existing agent/rail/chat components to the agent response design system:

- `AgentRail`
- `AgentResponse`
- `PersistentNexusPanel`
- `NexusProgramRail`
- `AtlasRail`
- `StewardAdminRail`
- Intelligence ask/rail components

No refactor in this inventory slice.

### Step 4: Context Used Strip Primitive

Build the smallest shared context-used UI primitive after inventory, using one surface as the proving ground.

### Step 5: Journey Map Alignment

Normalize Source and Programs journey-state vocabulary before broad page polish.

### Step 6: Data Table Pattern Adoption

Adopt shared table pattern one surface at a time, starting with Source or Admin dataset explorer.

### Step 7: Artifact Review Pattern Planning

Plan artifact lifecycle/review/approval UI before implementation.

## First Recommended Implementation Slice

Recommended first implementation slice: **Experience System token bridge**.

Suggested scope:

- Update `src/lib/design-system.ts` only.
- Add Experience System token aliases for warm off-white canvas, warm surfaces, near-black text, charcoal secondary text, navy command panels, restrained blue/teal accents, warm borders, muted amber/red risk colors, and sparing success green.
- Preserve existing dark tokens for current surfaces.
- Do not refactor pages in this slice.
- Add comments clarifying migration path from dark-first tokens to Experience System tokens.

Why first:

- It addresses the biggest implementation mismatch between canon and app.
- It gives all later UI slices a shared vocabulary.
- It prevents every page from inventing local warm/off-white colors.

## Explicit Out of Scope

- No UI changes.
- No runtime code changes in this bridge.
- No API routes.
- No model wiring.
- No upload/parsing.
- No page refactors.
- No `/programs`, `/preview`, `/demo`, `ProgramSurface`, or `src/lib/programs/mock.ts` changes.

## Bridge Decision

The Experience System is ready to guide implementation, but adoption should proceed through a token bridge and tightly scoped surface slices. Do not start broad redesign. Do not build agent UI until the relevant agent response, three choices, and context-awareness files are cited in the slice plan.

