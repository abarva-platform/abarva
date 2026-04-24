# AbarVa Source Build Pack Review Packet

This review packet evaluates the multi-file Build Pack for coherence, completeness, and implementation readiness before commit, PR, or merge.

## 1. Build Pack Inventory

### Anchor / Core Product Files

| File | Purpose | One-sentence summary | Status |
|---|---|---|---|
| `00_MASTER_ANCHOR.md` | Orchestrates the Build Pack | Defines Source as the premium agent-led sourcing workbench, establishes read order, build discipline, prohibitions, and implementation gates. | Needs review |
| `01_PRODUCT_VISION_AND_POSITIONING.md` | Product vision and category | Positions AbarVa Source against advisory firms, procurement suites, consulting firms, and generic AI tools. | Needs review |
| `02_USER_PERSONAS_AND_JOURNEYS.md` | Personas and workflows | Defines executive, procurement, PMO, legal, sponsor, and evaluator personas plus the primary sourcing journeys. | Needs review |
| `03_INFORMATION_ARCHITECTURE.md` | Product mental model | Defines dashboard, event canvas, stage workspace, Nexus panel, artifacts, scorecard, and value ledger boundaries. | Needs review |
| `04_VISUAL_EXPERIENCE_AND_DESIGN_SYSTEM.md` | UX/design rules | Establishes calm, premium, executive-grade UI guidance and discourages generic dashboard/chatbot patterns. | Needs review |
| `05_ROUTE_AND_NAVIGATION_MODEL.md` | Route ownership | Documents the `/source` route family under Maestro and explains route intent, components, data, and first-slice exposure. | Needs review |
| `06_DATA_MODEL_AND_ERD.md` | Domain model | Defines Source domain entities, relationships, text ERD, and likely alignment with existing platform primitives. | Needs review |
| `07_WORKFLOW_AND_STATE_MACHINE.md` | Workflow/state model | Defines the 10-stage sourcing lifecycle, lifecycle statuses, valid transitions, invalid transitions, aging, and at-risk rules. | Needs review |
| `08_AGENT_DESIGN_AND_HANDOFFS.md` | Agent model | Defines Nexus, Sentinel, Atlas, and Steward roles, handoff rules, and the future Nexus guidance data contract. | Needs review |
| `09_PATTERN_PACK_ARCHITECTURE.md` | Pattern-pack architecture | Defines Source pattern packs as authored sourcing archetype logic with defaults for stages, gates, scorecards, risks, and guidance. | Needs review |
| `10_ARTIFACT_AND_RFP_GENERATION_MODEL.md` | Artifact/RFP model | Defines artifact types, statuses, tiers, and a governed RFP/RFI generation process that avoids blind free-writing. | Needs review |
| `11_SCORECARD_GOVERNANCE.md` | Scorecard governance | Defines the scorecard lifecycle, validation rules, material-change rationale, and default scorecards for three archetypes. | Needs review |
| `12_VALUE_LEDGER_MODEL.md` | Value ledger | Defines projected and realized value structures, variance categories, and Data & AI example value line items. | Needs review |
| `13_EVENT_LIFECYCLE_AND_ALERTS.md` | Alerts and operating view | Defines dashboard alert types, severity, ownership, aging, and escalation behavior. | Needs review |
| `14_IMPLEMENTATION_SEQUENCE.md` | Build sequencing | Defines a gated implementation sequence from Build Pack review to single-component implementation, design review, and later agent integration. | Needs review |
| `15_ACCEPTANCE_CRITERIA.md` | Acceptance criteria | Defines readiness criteria for Build Pack completeness, dashboard, canvas, tracker, Nexus panel, scorecard, artifacts, value, and alerts. | Needs review |

### Wireframes

| File | Purpose | One-sentence summary | Status |
|---|---|---|---|
| `wireframes/01_source_dashboard_wireframe.md` | Dashboard wireframe | Defines header, KPI strip, Nexus alerts, and event portfolio table/list for the Source dashboard. | Needs review |
| `wireframes/02_event_canvas_wireframe.md` | Event canvas wireframe | Defines event header, journey tracker, stage panel, center workspace, Nexus panel, and artifact/value entry points. | Needs review |
| `wireframes/03_scope_workspace_wireframe.md` | Scope stage wireframe | Defines required inputs, in-scope/out-of-scope boundaries, assumptions, dependencies, risks, readiness, and gate state. | Needs review |
| `wireframes/04_nexus_panel_wireframe.md` | Nexus right-rail wireframe | Defines contextual recommendation, missing inputs, risks, actions, confidence, and handoff notes. | Needs review |
| `wireframes/05_journey_tracker_wireframe.md` | Journey tracker wireframe | Defines the 10-stage tracker, stage states, locked behavior, reopened behavior, and readiness display. | Needs review |
| `wireframes/06_scorecard_governance_wireframe.md` | Scorecard governance wireframe | Defines default/edited weights, rationale, material-change indicators, validation, approval, lock, and audit trail. | Needs review |
| `wireframes/07_artifact_drawer_wireframe.md` | Artifact drawer wireframe | Defines artifact cards with status, tier, confidence, owner, required inputs, citations, and actions. | Needs review |
| `wireframes/08_value_ledger_wireframe.md` | Value ledger wireframe | Defines projected value line items, measurement method, owner, confidence, realized value placeholder, and variance placeholder. | Needs review |

### Component Specs

| File | Purpose | One-sentence summary | Status |
|---|---|---|---|
| `components/01_AbarVaSourceDashboard.md` | Dashboard component contract | Defines the portfolio dashboard as an orchestrator that composes event table and alert panel without owning downstream logic. | Needs review |
| `components/02_SourcingEventTable.md` | Event table contract | Defines row fields, open behavior, responsive shape, and future sorting/filtering boundaries. | Needs review |
| `components/03_NexusEngagementCanvas.md` | Event canvas shell contract | Defines the single-event workspace shell and its relationship to journey, stage, Nexus, artifacts, scorecard, and value. | Needs review |
| `components/04_SourceJourneyTracker.md` | Journey tracker contract | Defines stage visualization, state behavior, locked stages, readiness, and non-decorative gate logic. | Needs review |
| `components/05_SourceStagePanel.md` | Stage panel contract | Defines the left-stage summary for goals, required inputs, artifacts, risks, decisions, and gate status. | Needs review |
| `components/06_SourceActiveStageWorkspace.md` | Active workspace contract | Defines the center workspace for stage work, beginning with Scope-stage behavior. | Needs review |
| `components/07_PersistentNexusPanel.md` | Nexus panel contract | Defines the persistent guidance rail, recommendation hierarchy, actions, risks, confidence, and handoff model. | Needs review |
| `components/08_SourceAlertPanel.md` | Alert panel contract | Defines alert display, severity, ownership, aging, escalation, and dashboard/canvas usage. | Needs review |
| `components/09_SourceArtifactDrawer.md` | Artifact drawer contract | Defines artifact metadata, drawer behavior, stub handling, and generation boundaries. | Needs review |
| `components/10_ScorecardGovernancePanel.md` | Scorecard governance contract | Defines lifecycle, validation, default/edited weights, material changes, approval, lock, and audit placeholders. | Needs review |
| `components/11_EvaluationCriteriaEditor.md` | Criteria editor contract | Defines governed weight editing, total validation, rationale requirements, and audit-friendly override behavior. | Needs review |
| `components/12_SourceValueLedger.md` | Value ledger contract | Defines projected/realized ledger display, assumptions, timing, measurement ownership, variance, and attribution confidence. | Needs review |

## 2. Source-Of-Truth Map

| Topic | Source-of-truth file |
|---|---|
| Product vision | `01_PRODUCT_VISION_AND_POSITIONING.md` |
| User personas | `02_USER_PERSONAS_AND_JOURNEYS.md` |
| Information architecture | `03_INFORMATION_ARCHITECTURE.md` |
| Visual design rules | `04_VISUAL_EXPERIENCE_AND_DESIGN_SYSTEM.md` |
| Routes/navigation | `05_ROUTE_AND_NAVIGATION_MODEL.md` |
| Data model | `06_DATA_MODEL_AND_ERD.md` |
| Workflow/state machine | `07_WORKFLOW_AND_STATE_MACHINE.md` |
| Agent design | `08_AGENT_DESIGN_AND_HANDOFFS.md` |
| Pattern-pack architecture | `09_PATTERN_PACK_ARCHITECTURE.md` |
| Artifact/RFP model | `10_ARTIFACT_AND_RFP_GENERATION_MODEL.md` |
| Scorecard governance | `11_SCORECARD_GOVERNANCE.md` |
| Value ledger | `12_VALUE_LEDGER_MODEL.md` |
| Lifecycle/alerts | `13_EVENT_LIFECYCLE_AND_ALERTS.md` |
| Implementation sequence | `14_IMPLEMENTATION_SEQUENCE.md` |
| Acceptance criteria | `15_ACCEPTANCE_CRITERIA.md` |

`00_MASTER_ANCHOR.md` remains the orchestration source of truth and should be read first for build discipline, prohibition rules, and implementation gating.

## 3. Cross-File Consistency Check

| Check | Result | Notes |
|---|---|---|
| Product name: AbarVa Source | Pass | Consistent across anchor, product vision, IA, wireframes, and component specs. |
| Lead agent: Nexus | Pass | Nexus is consistently treated as the lead sourcing agent and front-door advisor. |
| Platform relationship | Pass | Files consistently state AbarVa is the platform and Source is the sourcing workflow/product surface. |
| Route family: `/source` under Maestro shell | Pass | Route family is clearly documented in `05_ROUTE_AND_NAVIGATION_MODEL.md`; component specs point to `src/app/(maestro)/source/...`. |
| Avoid dependency on `/programs`, `/preview`, `/demo`, `ProgramSurface`, `src/lib/programs/mock.ts` | Pass with reference caveat | These files are referenced only as explicit avoid-list / files-not-to-touch items, not as dependencies. |
| Core stages | Minor inconsistency | Stage names are semantically consistent, but formatting varies between `RFP / RFI Package` and `RFP/RFI Package`, `Orals / BAFO` and `Orals/BAFO`, `Contract / Mobilization` and `Contract/Mobilization`. Normalize before implementation. |
| Lifecycle statuses | Minor inconsistency | Canonical statuses are defined in `07_WORKFLOW_AND_STATE_MACHINE.md`, but the dashboard wireframe abbreviates row status as `Waiting` instead of `Waiting on Client` or `Waiting on Vendor`. Normalize display copy before implementation. |
| Scorecard governance lifecycle | Pass | Lifecycle is consistent: Default Generated -> Client Edited -> Rationale Added -> Reviewed -> Approved -> Locked -> Used for Vendor Evaluation. |
| Artifact statuses and tiers | Pass | Artifact statuses and Rich/Outline/Stub tiers are consistently defined and respected. |
| Golden demo seed data | Minor inconsistency | The three event names and facts are consistent, but value formatting varies (`$42M` vs `$42.0M`) and dashboard status abbreviates waiting states. Normalize in seed constants. |
| Design quality bar | Pass | Premium, calm, executive-grade, agent-led, decision-oriented guidance is repeated across anchor, design system, wireframes, and specs. |

Flagged inconsistencies to resolve during review:

- Normalize stage labels to one canonical spelling. Recommended: `RFP/RFI Package`, `Orals/BAFO`, `Contract/Mobilization`.
- Normalize lifecycle display statuses to full canonical labels. Recommended: `Waiting on Client`, `Waiting on Vendor`, `Waiting on Procurement`, `Waiting on Executive Decision`.
- Normalize money display in seed data. Recommended: one formatter in `src/lib/source` later.

## 4. Component Readiness Matrix

| Component | Wireframe exists? | Data model clear? | States defined? | Interactions defined? | Nexus role defined? | Empty/loading/error states defined? | Acceptance criteria defined? | Ready for implementation? | Notes |
|---|---|---|---|---|---|---|---|---|---|
| AbarVaSourceDashboard | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Partial | Ready after status/value formatting normalization; should be split into table and alert children. |
| SourcingEventTable | Yes, via dashboard | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Safe as a contained child component after dashboard review. |
| NexusEngagementCanvas | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Partial | Architecture is clear, but should not be implemented until dashboard/component split is approved. |
| SourceJourneyTracker | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Strong candidate for isolated implementation after dashboard cleanup. |
| SourceStagePanel | Yes, via event canvas/scope | Yes | Yes | Yes | Yes | Yes | Yes | Partial | Ready conceptually; depends on event canvas shell decision. |
| SourceActiveStageWorkspace | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Partial | Scope-stage design is clear; editing/upload behavior intentionally deferred. |
| PersistentNexusPanel | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Partial | Static guidance contract is clear; runtime agent wiring deferred. |
| SourceAlertPanel | Yes, via dashboard/canvas | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Good candidate for dashboard split; alert generation rules need pure helper later. |
| SourceArtifactDrawer | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Partial | Drawer states are clear; artifact route/body implementation should wait. |
| ScorecardGovernancePanel | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Partial | Governance model is strong; should wait until dashboard/canvas foundation is stable. |
| EvaluationCriteriaEditor | Yes, via scorecard governance | Yes | Yes | Yes | Yes | Yes | Yes | Partial | Clear, but should not be first because scorecard page is downstream. |
| SourceValueLedger | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Partial | Ledger model is clear, but realized-value behavior depends on later persistence/evidence. |

## 5. Wireframe Readiness Matrix

| Wireframe | Layout clear? | Above-the-fold clear? | Interactions clear? | Responsive behavior clear? | What-not-to-show clear? | Acceptance criteria clear? | Ready for implementation? | Notes |
|---|---|---|---|---|---|---|---|---|
| Source Dashboard | Yes | Yes | Yes | Yes | Yes | Yes | Partial | Needs canonical status/value display normalization. |
| Event Canvas | Yes | Yes | Yes | Yes | Yes | Yes | Partial | Strong shell wireframe, but should wait until review approves canvas as next slice. |
| Scope Workspace | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Clear first stage workspace. |
| Nexus Panel | Yes | Yes | Yes | Yes | Yes | Yes | Partial | Static guidance is ready; runtime chat/generation intentionally excluded. |
| Journey Tracker | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Non-decorative behavior is well specified. |
| Scorecard Governance | Yes | Yes | Yes | Yes | Yes | Yes | Partial | Strong, but downstream. |
| Artifact Drawer | Yes | Yes | Yes | Yes | Yes | Yes | Partial | Strong, but route/body/generation should wait. |
| Value Ledger | Yes | Yes | Yes | Yes | Yes | Yes | Partial | Projected value is ready; realized value remains intentionally future-gated. |

## 6. Architecture Readiness Check

| Area | Assessment | Gap / action |
|---|---|---|
| Bounded Source domain | Clear | Source is separated from legacy programs/preview/demo concepts. |
| Route ownership | Clear | `/source` route family under Maestro is documented. |
| Component ownership | Clear | Component specs identify responsibility and files to modify/not touch. |
| `lib/source` ownership | Mostly clear | Types, constants, queries, scorecard, lifecycle, value-ledger, and optional seed files are defined; exact module boundaries can be finalized during first implementation slice. |
| Pattern-pack configuration | Clear | Pattern packs are defined as authored IP/configuration, not hard-coded UI. |
| Workflow state ownership | Clear | `src/lib/source/lifecycle.ts` is identified as owner for transition and alert logic. |
| Scorecard governance | Strong | Lifecycle, validation, material-change rationale, lock, and audit trail are clearly specified. |
| Artifact/RFP generation separation | Strong | Model prevents blind free-writing and separates artifact structure from AI generation. |
| Agent API boundaries | Partial | Nexus/Sentinel/Atlas/Steward roles are clear, but runtime API routes/contracts beyond `NexusSourceGuidance` remain future work. |
| Seed/mock data boundaries | Partial | Build Pack says `mock-seed.ts` only if needed and warns against leakage; implementation should include explicit seed/persistence switch. |
| Eventual Supabase migration path | Partial | Existing primitive alignment is discussed, but no migration/table DDL exists yet. This is acceptable for docs phase, but must be designed before production persistence. |

Architecture gaps to address before production-grade implementation:

- Define exact `src/lib/source` module exports during first approved code slice.
- Add a future persistence design with table names, ownership, tenant scoping, and migration path before real data.
- Define final agent API route contracts after static UX is approved.
- Add canonical enum constants for stage labels, lifecycle statuses, artifact statuses, and scorecard lifecycle to prevent string drift.

## 7. Design Excellence Check

| Quality check | Assessment | Notes |
|---|---|---|
| Premium enterprise UX | Strong | Language and layouts avoid consumer chatbot and procurement-suite defaults. |
| Calm information density | Strong | Wireframes favor KPI strips, structured tables, and progressive disclosure over dense dashboards. |
| Clear next action | Strong | Dashboard, Nexus panel, event table, and stage workspace all expose next action and owner. |
| Persistent Nexus guidance | Strong | Nexus is defined as a persistent advisory rail, not a floating chat. |
| Non-decorative journey tracker | Strong | Tracker has state logic, locked behavior, readiness, blocked state, and reopened behavior. |
| Scorecard governance differentiator | Strong | The scorecard lifecycle and material-change rationale are product-grade and differentiated. |
| Artifact drawer meaningful states | Strong | Artifact status, tier, confidence, required inputs, citations, and stub behavior are defined. |
| Value ledger tied to sourcing value | Strong | Projected and realized ledgers are linked to assumptions, measurement, owners, milestones, and variance. |
| Avoids procurement-portal feel | Strong | Build Pack avoids vendor portal, long forms, and generic procurement workflow clutter. |
| Avoids generic chatbot feel | Strong | Nexus is workflow-authoritative and constrained; free-text chat is explicitly not first. |

Design review conclusion: the Build Pack is strong enough to prevent a generic dashboard if implementation follows the component boundaries and does not overbuild multiple surfaces at once.

## 8. Implementation Risk List

| Risk | Mitigation |
|---|---|
| Dashboard prototype may become monolithic | Refactor dashboard into `AbarVaSourceDashboard`, `SourcingEventTable`, and `SourceAlertPanel`; keep aggregation in `src/lib/source`. |
| Design system drift | Reuse Maestro shell and existing tokens; define Source-specific styling only as small semantic extensions. |
| Mock seed leakage | Keep seed data in `src/lib/source/mock-seed.ts` only, label it internal, and create a clean query adapter boundary. |
| Route/shell fragmentation | Keep all routes under `src/app/(maestro)/source/...`; do not reuse `/programs`, `/preview`, or `/demo`. |
| Overbuilding too many components at once | Approve one component/slice at a time per `14_IMPLEMENTATION_SEQUENCE.md`. |
| Generic scorecard risk | Use pattern-pack defaults and governance lifecycle; require rationale and total=100 validation. |
| Nexus panel becoming ornamental | Bind Nexus output to stage, missing inputs, risks, owner, next action, confidence, and handoff rules. |
| Artifact drawer becoming static template list | Require artifact status, tier, confidence, required inputs, citations, and honest stub handling. |
| Journey tracker becoming decorative | Implement lifecycle helper functions and locked/future-stage behavior before broad visual polish. |
| Agent runtime added too early | Keep first slices deterministic/static; add agent API only after static UX and data contracts are stable. |
| Supabase schema ambiguity | Before production data, create Source-specific persistence design and tenant-scoped access rules. |
| Canonical string drift | Add central constants for stages, statuses, artifact tiers/statuses, scorecard lifecycle, and demo event ids. |

## 9. Recommended Next Implementation Slice

Recommendation: **Option A: refine dashboard by splitting it into Dashboard + SourcingEventTable + SourceAlertPanel.**

Why this is the right next slice:

- It directly addresses the current risk that the dashboard prototype may become monolithic.
- It is the smallest useful implementation unit that improves architecture without jumping into downstream surfaces.
- It validates the Source visual language, event data shape, lifecycle labels, Nexus alerts, and mock-seed boundary.
- It does not require building the event canvas, scorecard, artifact drawer, value ledger, vendor response flow, or AI generation.
- It creates reusable primitives needed by later slices without committing to the full event workspace.

Recommended implementation boundary:

- Refactor only `/source` dashboard surface.
- Create or refine only `AbarVaSourceDashboard`, `SourcingEventTable`, `SourceAlertPanel`, and minimal `src/lib/source` constants/types/mock seed helpers needed for those components.
- Normalize canonical stage/status/value formatting first.
- Do not build event detail, scorecard, artifact drawer, value ledger, vendor response flow, or agent runtime.

Alternatives not recommended yet:

- Option B, building `NexusEngagementCanvas` shell only, is valuable but higher risk because it pulls in tracker, stage, Nexus rail, artifact entry, and value context at once.
- Option C, building `SourceJourneyTracker` only, is clean but too isolated to validate the dashboard architecture and current prototype risk.

## 10. Commit Recommendation

Recommendation: **revise specific files first** before commit.

Required revisions are small and should happen before implementation, not after:

- Normalize core stage labels across all files: use `RFP/RFI Package`, `Orals/BAFO`, and `Contract/Mobilization`.
- Normalize lifecycle status display to full canonical labels, especially dashboard rows that currently say `Waiting`.
- Normalize golden demo value formatting, especially `$42M` versus `$42.0M`.
- Consider adding a short constants appendix or note in `06_DATA_MODEL_AND_ERD.md` or `07_WORKFLOW_AND_STATE_MACHINE.md` saying implementation must centralize canonical enums in `src/lib/source/constants.ts`.

After those revisions, the Build Pack should be ready to commit as the reviewable Source product foundation.
