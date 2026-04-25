# Core App Context Pack

Last updated: 2026-04-24

Workspace: `/Users/anand/Projects/nexus`

Primary live app host observed:
- `https://app.abarva.ai` resolves and returns HTTP 200 from Vercel. The response is signed out through Clerk and includes `x-clerk-auth-status: signed-out`.
- `https://app.abarva.com` did not resolve from this environment on 2026-04-24 (`curl: Could not resolve host: app.abarva.com`). Treat `.com` as unverified or not yet DNS-provisioned.
- Existing production test script still references `https://nexus-vert-kappa.vercel.app` via `npm run test:e2e:prod`.

## 1. Product Intent

AbarVa is an agent-led enterprise execution platform. It turns board-level technology, AI, sourcing, and transformation decisions into governed programs, source-backed intelligence, workflow state, deliverables, phase gates, and projected-vs-realized value tracking. The app is meant to help executive teams see what is active, what is stuck, what evidence exists, what value is at stake, what decision is needed next, and which specialist agent is accountable for the next step.

Primary users:
- CIO / CTO: portfolio pressures, technology strategy, sourcing decisions, AI operating model, program execution risk.
- CFO / Value Office lead: business cases, projected vs realized value, dual-ledger reconciliation, attribution, variance, board defensibility.
- Program owner / sponsor: phase gates, deliverables, stakeholders, risks, approvals, next decisions.
- Procurement / sourcing leader: AbarVa Source events, vendor selection, scorecard governance, RFP/RFI artifacts, vendor response normalization.
- Transformation / PMO lead: program portfolio, work queues, blockers, phase transitions, ownership and aging.
- Admin / Steward operator: tenants, users, roles, connectors, audit, quality, pattern/content governance.
- Agent admin / platform operator: runtime quality, prompt/voice contracts, context bundle health, retrieval integrity, agent handoffs.

Current product surfaces:
- Home / Command Center: tenant landing and portfolio overview.
- Programs: program portfolio, program detail, deliverables, gates, Nexus rail.
- AbarVa Source: sourcing-event workflow product under `/source` with dashboard foundation and context contracts.
- Intelligence: pattern library, Sentinel, pattern details, graph/retrieval concepts.
- Control Tower: portfolio pressure, AI use-case metrics, Atlas pressure synthesis.
- Platform/Admin: users, data, audit, connectors, quality, admin/restricted surfaces.
- Engagements: older engagement engine routes and persistence.
- Preview/Demo routes: legacy/demo surfaces retained but should not be extended for Source.

## 2. Current App Stack

Framework:
- Next.js `16.2.2`, App Router, React `19.2.4`, TypeScript.
- AGENTS.md warning: this Next.js version has breaking changes; read `node_modules/next/dist/docs/` before writing Next code.

UI library:
- Custom React components with inline style objects and a local design system in `src/lib/design-system.ts`.
- Recharts is installed for visualization.
- No dominant external component library in the production code path.

Database:
- Supabase Postgres via `@supabase/supabase-js`.
- Server access uses service role through `src/lib/supabase-server.ts`.
- Client helper exists at `src/lib/supabase.ts`.
- Migrations live under `supabase/migrations/`.

Auth:
- Clerk via `@clerk/nextjs` and `@clerk/backend`.
- Demo/test accounts use `+clerk_test`.
- Current auth-routing logic maps roles/client keys from Clerk metadata and email patterns.
- Tenant guard lives in `src/lib/auth/tenant-access.ts`.

Vector / graph store:
- Pinecone is used for ingestion/retrieval in `src/lib/data/ingest.ts` and `src/lib/intelligence/retrieval/vectorRetriever.ts`.
- OpenAI embeddings are used in the vector retriever.
- Neo4j driver exists and graph modules exist under `src/lib/graph/*`, but the Intelligence graph retriever currently says "No Neo4j per spec locked-decision (Postgres-only)" and uses Postgres-backed traversal.
- `db/graph/migrations/schema.cypher` exists for graph schema.

Agent runtime:
- Custom TypeScript orchestrators.
- Anthropic Claude via `@anthropic-ai/sdk`.
- OpenAI SDK used for embeddings and some retrieval support.
- Nexus has a documented six-phase `runPipeline()` in `src/lib/nexus/orchestrator.ts`.
- Sentinel and Atlas have separate orchestrators.
- Steward is partially represented in admin UI/stats, but not yet a full agent runtime.

Deployment target:
- Vercel.
- `app.abarva.ai` returns Vercel headers.
- `app.abarva.com` currently unresolved from this environment.

## 3. Current Repo Structure

Relevant route tree:

```text
src/app/
  (maestro)/
    layout.tsx
    home/page.tsx
    home/queue/page.tsx
    engagements/page.tsx
    engagements/[engagementId]/page.tsx
    engagements/[engagementId]/charter/page.tsx
    engagements/[engagementId]/deliverables/page.tsx
    engagements/[engagementId]/deliverables/[deliverableId]/page.tsx
    intelligence/ask/page.tsx
    intelligence/briefing/page.tsx
    intelligence/kpis/page.tsx
    intelligence/kpis/[kpiId]/page.tsx
    intelligence/library/page.tsx
    intelligence/patterns/page.tsx
    intelligence/patterns/[patternKey]/page.tsx
    intelligence/patterns/[patternKey]/[verticalKey]/page.tsx
    platform/page.tsx
    platform/admin/page.tsx
    platform/admin/*/page.tsx
    preview/programs/page.tsx
    preview/programs/[programSlug]/page.tsx
    preview/tower/page.tsx
    source/page.tsx
    source/events/page.tsx
    source/events/[eventId]/page.tsx
    source/events/[eventId]/scorecard/page.tsx
    source/events/[eventId]/artifacts/[artifactId]/page.tsx
    source/value/page.tsx
    tenant/[tenantSlug]/page.tsx
    tenant/[tenantSlug]/programs/page.tsx
    tenant/[tenantSlug]/programs/[programSlug]/page.tsx
    tenant/[tenantSlug]/programs/[programSlug]/deliverables/[deliverableCode]/page.tsx
    tenant/[tenantSlug]/programs/[programSlug]/phase/[phaseNum]/page.tsx
    tenant/[tenantSlug]/intelligence/patterns/[patternSlug]/page.tsx
    tenant/[tenantSlug]/tower/page.tsx
    tenant/[tenantSlug]/tower/[surface]/page.tsx
    tower/page.tsx
    tower/onboard/page.tsx
    tower/onboard/[dimension]/page.tsx
  api/
    v1/nexus/query/route.ts
    v1/sentinel/query/route.ts
    v1/atlas/chat/route.ts
    v1/programs/**/route.ts
    v1/threads/**/route.ts
    programs/approve/route.ts
    programs/phase-gate/route.ts
    programs/data-readiness/route.ts
    programs/sponsor-commitment/route.ts
    programs/stakeholder-success/route.ts
    tower/upload/route.ts
    admin/*/route.ts
  programs/**                # legacy/non-Maestro program routes
  demo/**                    # demo routes
  preview/**                 # legacy preview routes under maestro
```

Relevant components:

```text
src/components/
  agent/
    AgentCitation.tsx
    AgentResponse.tsx
    ConfidenceQualifier.tsx
    HandoffAffordance.tsx
    HonestDisclosureBanner.tsx
    OutcomeVerdict.tsx
    SparsitySignal.tsx
  atlas/
    AtlasChatPanel.tsx
    AtlasRail.tsx
    AtlasSignalDetailPanel.tsx
  chrome/
    AppChrome.tsx
    ClientChrome.tsx
    MaestroChrome.tsx
    PrimaryNav.tsx
    TopBar.tsx
  deliverables/
    ApproveActions.tsx
    DeliverableTierRenderer.tsx
    EvidenceChipList.tsx
    NexusProgramRail.tsx
    SeedRouteShell.tsx
  drawer/
    DrawerProvider.tsx
  engagement/
    EngagementConsole.tsx
    EngagementCreationConsole.tsx
    TraceDrawer.tsx
  home/command-center/*
  home/composite/*
  intelligence/*
  programs/
    ProgramSurface.tsx
    PortfolioIndex.tsx
    ProgramDetailHeader.tsx
    ModuleWorkspace.tsx
    NexusPanel.tsx
    PhaseGateControl.tsx
    ExecutionRoadmapTrackerView.tsx
  shared/layout/PageShell.tsx
  source/
    AbarVaSourceDashboard.tsx
    SourcingEventTable.tsx
    SourceAlertPanel.tsx
    SourceFoundationShell.tsx
    NexusEngagementCanvas.tsx
    SourceJourneyTracker.tsx
    SourceStagePanel.tsx
    SourceActiveStageWorkspace.tsx
    PersistentNexusPanel.tsx
    SourceArtifactDrawer.tsx
    ScorecardGovernancePanel.tsx
    EvaluationCriteriaEditor.tsx
    SourceValueLedger.tsx
    EventLifecycleStatusBadge.tsx
  system/
    SkeletonScreen.tsx
    ErrorStateCard.tsx
    NotFoundSurface.tsx
  tower/*
  workflow/*
```

Relevant lib/services:

```text
src/lib/
  design-system.ts
  supabase.ts
  supabase-server.ts
  auth/
    access-routing.ts
    current-user.ts
    tenant-access.ts
    demo-code.ts
  agent/
    renderedResponse.ts
    voiceContracts.ts
    honestDisclosure.ts
    retrieval.ts
    stream.ts
    trace.ts
  nexus/
    orchestrator.ts
    assembler.ts
    composer.ts
    classifiers/*
    specialists/*
    prompts/*
  sentinel/
    orchestrator.ts
    types.ts
  atlas/
    orchestrator.ts
    llm.ts
    prompt.ts
    repository.ts
    scripted-engine.ts
    types.ts
  programs/
    queries.ts
    mutations.ts
    governance.ts
    quality-gates.ts
    nexus.ts
    nexus-free-text.ts
    mock.ts
    types.db.ts
    types.ui.ts
  source/
    constants.ts
    types.ts
    lifecycle.ts
    mock-seed.ts
    queries.ts
    scorecard.ts
    value-ledger.ts
    agent-context.ts
    context-builder.ts
    context-quality.ts
    agent-validation.ts
    attachments.ts
    chat-types.ts
  intelligence/
    ask/*
    db/*
    retrieval/*
    pattern-manifest.ts
    generated/pattern-manifest.json
  deliverables/
    evidence-registry.ts
    generate.ts
    v2-generator.ts
    seed-route-resolver.ts
    templates/*
  tower/
    aggregate.ts
    classify.ts
    enterprise-summary.ts
    ingest-portfolio.ts
    vendor-portfolio.ts
  graph/*
  audit/log.ts
  workflow/*
```

Database/schema files:

```text
supabase/migrations/
  001_three_layer_data_model.sql
  002_engagement_engine.sql
  013_engagement_state.sql
  018_teams_and_memberships.sql
  021_audit_log.sql
  022_tower_data_model.sql
  024_knowledge_sources.sql
  029_cross_industry_core.sql
  033_turn_traces.sql
  035_user_roles.sql
  040_topics.sql
  041_programs_foundation.sql
  042_engagements_six_phases.sql
  20260420170000_intelligence_threads.sql
  20260420170100_intelligence_thread_turns.sql
  20260420170200_intelligence_artifacts.sql
  20260420170300_portfolio_signals.sql
  20260420170400_emergent_patterns.sql
  20260421151100_signal_catalog.sql
  20260421151700_integration_health.sql
  20260421151800_signal_evidence_chains.sql
  20260421151900_atlas_threads.sql
  20260421152000_atlas_observations.sql
  20260421152100_atlas_message_traces.sql
  20260421152400_portfolio_aggregates.sql
  20260421152500_intelligence_layer_core.sql
  20260421152700_contradiction_engine_foundation.sql
  20260421152900_foundational_patterns_and_legal_contexts.sql
  20260421153000_briefing_engine.sql
db/graph/migrations/schema.cypher
scripts/setup-db.sql
```

Mocks/test data:

```text
src/lib/programs/mock.ts                         # legacy/mock-heavy program data; avoid extending for Source
src/lib/source/mock-seed.ts                      # deterministic Source seed data
src/lib/demo-data/*
src/lib/home/tenant-inventory.ts
src/lib/intelligence/generated/pattern-manifest.json
src/scripts/seed/*
src/testing/findings/schema.ts
tests/e2e/*
src/__tests__/*
```

Design system files:

```text
src/lib/design-system.ts
src/components/shared/layout/PageShell.tsx
src/components/shared/typography/*
src/components/source/foundationStyles.ts
docs/design-canon/*
docs/abarva-source/build-pack/*
```

## 4. Existing Pages/Routes

### Root / auth / home

- `/` - `src/app/page.tsx`
  - Current functionality: public/root landing path.
  - Mock vs real: likely marketing/static plus auth-aware redirects.
  - Missing/broken: not the primary enterprise work surface.
- `/sign-in/[[...sign-in]]` - `src/app/sign-in/[[...sign-in]]/page.tsx`
  - Current functionality: Clerk sign-in shell, demo code support.
  - Mock vs real: real Clerk auth, demo conventions.
  - Missing/broken: historic Clerk rebinding was reported; code now includes demo-code sign-in and active-client hardening, but live persona re-walk remains required.
- `/home` - `src/app/(maestro)/home/page.tsx`
  - Current functionality: tenant command center with tenant portfolio, IT stack, vendors, uploaded data.
  - Mock vs real: seed and Supabase mix; tenant inventory has seeded composite rows.
  - Missing/broken: must keep tenant identity stable; queue persona naming was fixed but needs live verification.
- `/home/queue` - `src/app/(maestro)/home/queue/page.tsx`
  - Current functionality: open tasks, approvals, phase gates.
  - Mock vs real: shared ledgers and in-memory/file-backed demo flows in places.
  - Missing/broken: not yet a full executive-specific queue.

### Setup/Admin

- `/platform/admin` and `/platform/admin/*` - `src/app/(maestro)/platform/admin/**/page.tsx`
  - Current functionality: restricted admin portal, users, connectors, audit, data, intelligence, outcomes, revenue, approvals, playbook, quality.
  - Mock vs real: mixed; Clerk user stats, Supabase data, seeded connector/quality views.
  - Missing/broken: Steward is not yet a full runtime; connector health and audit need production-grade telemetry.
- `/api/admin/*`
  - Current functionality: invite, seed Clerk metadata, steward stats, upload dataset.
  - Mock vs real: real API route scaffolds; operational maturity varies.
  - Missing/broken: production safety and complete audit/permission model remain backlog items.

### Programs

- `/tenant/[tenantSlug]/programs` - `src/app/(maestro)/tenant/[tenantSlug]/programs/page.tsx`
- `/tenant/[tenantSlug]/programs/[programSlug]` - `src/app/(maestro)/tenant/[tenantSlug]/programs/[programSlug]/page.tsx`
- `/tenant/[tenantSlug]/programs/[programSlug]/deliverables/[deliverableCode]` - tenant deliverable route.
- `/programs/*` - legacy/non-Maestro program routes.
  - Current functionality: program list/detail, deliverables, phase routes, deliverable rendering, approval/gate actions.
  - Mock vs real: significant seeded program/deliverable content; some Supabase program foundation APIs exist.
  - Missing/broken: hero financial/clinical deliverable content remains a blocker; some deliverables are still rich-looking scaffolds rather than decision-grade content.
  - Security state: tenant access guard exists in `src/lib/auth/tenant-access.ts`; cross-tenant read defect was code-fixed in Cycle 2 and Dr. L verified check #1, but broader live persona verification remains pending.

### AbarVa Source

- `/source` - `src/app/(maestro)/source/page.tsx`
- `/source/events` - `src/app/(maestro)/source/events/page.tsx`
- `/source/events/[eventId]`
- `/source/events/[eventId]/scorecard`
- `/source/events/[eventId]/artifacts/[artifactId]`
- `/source/value`
  - Current functionality: Source dashboard/front-door, events table, context/data contracts, deterministic seed context, placeholder event/canvas/value routes.
  - Mock vs real: currently deterministic seed-backed, not production data-backed.
  - Current state: dashboard has been refactored into `AbarVaSourceDashboard`, `SourcingEventTable`, and `SourceAlertPanel`; Source has context builder and validation contracts under `src/lib/source`.
  - Missing/broken: do not expand UI until next approved slice. No real upload/parsing, model calls, vendor response flow, scorecard production workflow, artifact generation, or value-ledger persistence yet.

### Intelligence

- `/intelligence` and `/intelligence/thread/[threadId]` - non-Maestro Intelligence routes.
- `/intelligence/ask`, `/intelligence/library`, `/intelligence/patterns/*`, `/tenant/[tenantSlug]/intelligence/patterns/[patternSlug]`
  - Current functionality: Sentinel-oriented pattern library, pattern details, query routes, thread persistence, pattern manifest, retrieval dimensions.
  - Mock vs real: pattern manifest and Supabase intelligence tables; content quality varies by pattern tier.
  - Missing/broken: pattern library content depth, evidence registry backend, contradiction surfacing, and graph traversal need completion.

### Control Tower

- `/tower`, `/tower/preview`, `/tower/onboard/*`, `/tenant/[tenantSlug]/tower`, `/tenant/[tenantSlug]/tower/[surface]`
  - Current functionality: pressure cards, enterprise summaries, onboarding dimensions, vendor portfolio, uploads, Atlas chat.
  - Mock vs real: portfolio metrics are seeded/Supabase mix. Atlas has scripted and LLM routes.
  - Missing/broken: prior crawler found Tower pressure drill-in 404; Cycle 2 says this was fixed in code, live persona re-walk pending. Atlas free-text runtime shipped but needs broader validation.

### Engagements

- `/engagements`, `/engagements/[engagementId]`, `/engagements/[engagementId]/turns`, `/charter`, `/deliverables`, `/topics`
  - Current functionality: earlier engagement engine and Maestro workspace concepts.
  - Mock vs real: Supabase-backed engagement tables exist; legacy and new Programs coexist.
  - Missing/broken: not the recommended path for new Source work.

### Preview/Demo

- `/preview/*`, `/demo/*`
  - Current functionality: demo/preview surfaces.
  - Guardrail: do not extend these for AbarVa Source or new canonical product work.

## 5. Current Agent Architecture

Agents that exist today:

### Nexus

- Main orchestrator: `src/lib/nexus/orchestrator.ts`.
- API route: `src/app/api/v1/nexus/query/route.ts`.
- Program-specific routes: `src/app/api/v1/programs/[programId]/nexus/*`.
- Program support: `src/lib/programs/nexus.ts`, `src/lib/programs/nexus-free-text.ts`.
- Pipeline: six-phase `runPipeline()`:
  1. parse/classify
  2. retrieval plan
  3. parallel retrieval
  4. assemble
  5. compose
  6. render
- Prompts: `src/lib/nexus/prompts/*`, `src/lib/agent/prompts/*`.
- Context access: current pipeline uses intake/evidence/value/decision/contradiction specialists plus optional session context. It does not yet globally use the full A1 5-state Context Bundle runtime described in backlog.
- Persistence: intelligence threads and turns through `src/lib/intelligence/db/threadRepository.ts` and `turnRepository.ts`.
- Streaming: SSE through `src/lib/nexus/sseStream.ts`.

### Sentinel

- Orchestrator: `src/lib/sentinel/orchestrator.ts`.
- API route: `src/app/api/v1/sentinel/query/route.ts`.
- Current behavior: pattern matching over manifest, applicable programs, evidence/observation counts, confidence bands, fallback response if Claude unavailable.
- Context access: pattern manifest and tenant/client context.
- Missing: full evidence-registry validation service callable by other agents; full contradiction/risk validation runtime.

### Atlas

- Orchestrator: `src/lib/atlas/orchestrator.ts`.
- API routes: `src/app/api/v1/atlas/chat/route.ts`, `src/app/api/v1/atlas/ask/route.ts`.
- Current behavior: classified scripted/hybrid/LLM routes, Atlas thread persistence, observations, message traces.
- Components: `AtlasChatPanel`, `AtlasRail`, signal detail panels.
- Missing: complete 150-word cap enforcement and portfolio pressure generation tied to production-grade aggregation.

### Steward

- Components/admin: `src/components/admin/StewardAdminRail.tsx`, `/platform/admin`, `/api/admin/steward-stats`.
- Current behavior: admin/stats/operational shell.
- Missing: full Steward agent runtime for gate enforcement, connector monitoring, audit aging, and operational blocking.

### Source/Nexus sidecar context

- Context builder: `src/lib/source/context-builder.ts`.
- Quality scoring: `src/lib/source/context-quality.ts`.
- Context contract: `src/lib/source/agent-context.ts`.
- Validation: `src/lib/source/agent-validation.ts`.
- Chat types: `src/lib/source/chat-types.ts`.
- Current behavior: deterministic Source portfolio/event/stage context from seed data, context quality scores, missing inputs, allowed actions, value ledger snapshots, pattern pack identity.
- Missing: global integration into `runPipeline()` and real data/evidence/file-backed context assembly.

Agent registry:
- No single canonical agent registry is present yet.
- Agents are organized by folder/runtime (`nexus`, `sentinel`, `atlas`, admin/steward concepts) rather than one registry.

Tool registry:
- No canonical production tool registry is present yet.
- Atlas has `tool-belt.ts`; Nexus has specialists; Source has allowed actions in context contract.

Audit trail:
- Supabase `audit_log`, `turn_traces`, `atlas_message_traces`, intelligence thread turns, program approvals, phase gates, and file-backed demo approval ledgers exist.
- Full cross-agent audit and handoff traceability remains backlog.

## 6. Data Model

### Clients/accounts/users/roles

Key files:
- `src/lib/client-config.ts`
- `src/lib/auth/current-user.ts`
- `src/lib/auth/access-routing.ts`
- `src/lib/auth/tenant-access.ts`

Current client keys:
- `meridian` - Meridian Health System.
- `arcturus` - Arcturus Financial Group / First Capital aliases.
- `apexretail` - Apex Retail Group.
- `keystone` - Keystone Energy Holdings / Nexora aliases.

Key tables/migrations:
- `clients`
- `persons`
- `teams`
- `team_memberships`
- `person_client_memberships`
- `audit_log`
- Clerk metadata fields: role, clientId, person_id.

### Programs

Key files:
- `src/lib/programs/types.db.ts`
- `src/lib/programs/types.ui.ts`
- `src/lib/programs/queries.ts`
- `src/lib/programs/mutations.ts`
- `src/lib/programs/governance.ts`
- `src/lib/programs/quality-gates.ts`

Key entities:
- ProgramCore / engagements.
- Program modules.
- Work items.
- Milestones.
- Risks.
- Founder approval requests.
- Maestro flags.
- Phase snapshots.
- Deliverables.

Key migrations:
- `041_programs_foundation.sql`
- `042_engagements_six_phases.sql`
- `040_topics.sql`

### Use cases / Control Tower

Key tables:
- `use_cases`
- `use_case_usage_metrics`
- `use_case_value_metrics`
- `use_case_risk`
- `use_case_cost_metrics`
- `contradictions`
- `portfolio_signals`
- `signal_catalog`
- `signal_firings`
- `signal_evidence_chains`
- `portfolio_aggregates`
- `integration_health`

Key files:
- `src/lib/tower/aggregate.ts`
- `src/lib/tower/enterprise-summary.ts`
- `src/lib/tower/vendor-portfolio.ts`
- `src/lib/tower/ingest-portfolio.ts`

### Agents/conversations

Key tables:
- `intelligence_threads`
- `intelligence_thread_turns`
- `intelligence_artifacts`
- `atlas_threads`
- `atlas_observations`
- `atlas_message_traces`
- `turn_traces`
- `session_messages`
- `turns`

Key files:
- `src/lib/intelligence/db/threadRepository.ts`
- `src/lib/intelligence/db/turnRepository.ts`
- `src/lib/atlas/repository.ts`
- `src/lib/nexus/sessionContext.ts`

### Knowledge sources / patterns

Key tables:
- `knowledge_sources`
- `knowledge_chunks`
- `emergent_patterns`
- `foundational_pattern_packs`
- `foundational_pattern_variants`
- `legal_privileged_contexts`
- `contradiction_detection_rules`
- `contradiction_detection_runs`
- `contradiction_evidence`
- `contradiction_resolution_actions`

Key files:
- `src/lib/intelligence/pattern-manifest.ts`
- `src/lib/intelligence/generated/pattern-manifest.json`
- `src/lib/intelligence/retrieval/*`
- `src/lib/deliverables/evidence-registry.ts`

### Source

Key files:
- `src/lib/source/types.ts`
- `src/lib/source/constants.ts`
- `src/lib/source/context-builder.ts`
- `src/lib/source/context-quality.ts`
- `src/lib/source/agent-context.ts`
- `src/lib/source/mock-seed.ts`

Current Source data is seed-backed. Domain concepts include:
- `SourcingEventSummary`
- `SourcingEventDetail`
- `SourceLifecycleStatus`
- `SourceStageKey`
- `WorkflowStage`
- `StageGate`
- `SourceArtifactSummary`
- `ScorecardGovernance`
- `ValueLedgerEntry`
- `SourceAgentContextBundle`
- `SourceContextQualityScore`

Canonical Source stages:
- Intake
- Scope
- Sourcing Strategy
- RFP/RFI Package
- Vendor Responses
- Evaluation
- Orals/BAFO
- Selection
- Contract/Mobilization
- Value Realization

Canonical Source lifecycle statuses:
- Active
- Waiting on Client
- Waiting on Vendor
- Waiting on Procurement
- Waiting on Executive Decision
- Paused
- At Risk
- Completed
- Archived

Golden Source demo events:
- Data & AI Modernization SI Selection - $18.5M.
- AMS Consolidation Assessment - $42.0M.
- Digital App Build Partner Selection - $2.8M.
- Total value at stake - $63.3M.

## 7. Current Design/Component System

Shell/layout/nav:
- `src/components/chrome/AppChrome.tsx`
- `src/components/chrome/MaestroChrome.tsx`
- `src/components/chrome/ClientChrome.tsx`
- `src/components/chrome/PrimaryNav.tsx`
- `src/components/chrome/TopBar.tsx`
- `src/components/shared/layout/PageShell.tsx`
- `src/components/drawer/DrawerProvider.tsx`

Page headers/typography:
- `src/components/shared/typography/*`
- `src/lib/design-system.ts`
- `src/components/source/foundationStyles.ts`

Cards/tables:
- `src/components/grid/DataGrid.tsx`
- `src/components/programs/ProgramsGrid.tsx`
- `src/components/source/SourcingEventTable.tsx`
- `src/components/source/SourceAlertPanel.tsx`
- `src/components/tower/*`

Forms:
- `src/components/workflow/DataReadinessForm.tsx`
- `src/components/workflow/SponsorCommitmentForm.tsx`
- `src/components/workflow/StakeholderSuccessForm.tsx`
- `src/components/workflow/ProgramTensionForm.tsx`
- `src/components/shared/AutosizeTextarea.tsx`
- `src/components/programs/OriginationFlow.tsx`

Drawers/modals:
- `src/components/drawer/DrawerProvider.tsx`
- `src/components/engagement/TraceDrawer.tsx`
- `src/components/atlas/AtlasSignalDetailPanel.tsx`
- `src/components/source/SourceArtifactDrawer.tsx`

Timeline/activity:
- `src/components/programs/ProgramJourneyView.tsx`
- `src/components/programs/ProgramStreamView.tsx`
- `src/components/programs/TimelineResourceEstimateView.tsx`
- `src/components/source/SourceJourneyTracker.tsx`

Status chips/primitives:
- `src/components/agent/ConfidenceQualifier.tsx`
- `src/components/agent/HonestDisclosureBanner.tsx`
- `src/components/agent/OutcomeVerdict.tsx`
- `src/components/workflow/GateReadinessBanner.tsx`
- `src/components/workflow/PhaseGateIndicator.tsx`
- `src/components/source/EventLifecycleStatusBadge.tsx`
- `src/components/system/SkeletonScreen.tsx`
- `src/components/system/ErrorStateCard.tsx`
- `src/components/system/NotFoundSurface.tsx`

Charts/visuals:
- Recharts dependency.
- `src/components/viz/MicroViz.tsx`
- `src/components/intelligence/*Viz*.tsx`
- `src/components/tower/PressureCardDerivation.tsx`

## 8. Build/Test Commands

Install:

```bash
npm install
```

Dev:

```bash
npm run dev
```

Lint:

```bash
npm run lint
```

Targeted Source lint:

```bash
npx eslint 'src/app/(maestro)/source' src/components/source src/lib/source
```

Typecheck:

```bash
npx tsc --noEmit --pretty false
```

Test:

```bash
npm test
npm run test:nav
npm run test:behaviors
npm run test:integration
npm run test:integration:nexus
npm run test:e2e
```

Build:

```bash
npm run build
```

Before commit:

```bash
npm run test:before-commit
```

Known latest checks from this thread:
- `npx eslint 'src/app/(maestro)/source' src/components/source src/lib/source` passed.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.

Known live/domain issue:
- `app.abarva.com` did not resolve from this environment.
- `app.abarva.ai` returned HTTP 200 from Vercel and Clerk signed-out headers.

## 9. Guardrails

Do not touch without explicit instruction:
- Do not extend `src/app/programs/*` for AbarVa Source.
- Do not extend `src/app/(maestro)/preview/*` for AbarVa Source.
- Do not extend `src/app/demo/*` for AbarVa Source.
- Do not extend `src/components/programs/ProgramSurface.tsx` for AbarVa Source.
- Do not extend `src/lib/programs/mock.ts` for AbarVa Source.
- Do not build Source event canvas, scorecard page, artifact drawer, value ledger, vendor response flow, upload/parsing, or AI/RFP generation unless explicitly approved by slice.
- Do not rewrite auth wholesale. Tenant isolation fixes should be surgical and verified.
- Do not add production DB migrations without explicit approval.
- Do not make model calls for tests unless requested.
- Do not deploy unless requested.
- Do not merge or auto-merge without explicit founder approval.
- Do not perform unrelated cleanup in a dirty worktree.
- Do not revert user changes.

Source-specific pause:
- Current dashboard work is prototype/refactor only.
- Build Pack remains design authority.
- Next Source work should follow approved component/spec/wireframe review discipline.

## 10. Backlog

### Operating gates and critical path

Universal gates:
- Canon `AUTHORED-LOCKED` gates all major implementation.
- `A1 Context Bundle runtime` gates all agents, surfaces, deliverables, chat, and validation.
- `A3 Tenant isolation hardening` is P0 and runs in parallel with A1.
- `J2 Page readiness contracts` gate per-surface implementation.
- `J4 Auto-merge retirement` gates Cycle 4 scope lock.

Critical path:

```text
Canon AUTHORED-LOCKED
-> A1 Context Bundle runtime
-> B1 Nexus runtime
-> C1 Programs or C2 Source first surface
-> I1/I2 validation
-> F1/F2 deliverable substance
-> K1 production deploy
```

Current memory from `CYCLE_STATE.md`:
- Cycle 2 crawler sweep: 14/14 shipped, only tenant isolation live persona-verified. Remaining Cycle 2 items code-present on main but still need live persona re-walk.
- Cycle 3 Wave 1: multiple P0 design-canon items shipped through PRs #167-#184.
- PR #188 merged: AbarVa Source foundation docs and context contracts.
- Source sidecar current milestone: Build Pack docs, Source context contracts, deterministic Source context builder.
- Next recommended Source item in state file: Source context validation fixtures.
- File 07 P0 narrative items are blocked awaiting authoring.
- Heavy content items remain for Tier 2/Tier 3 patterns and hero deliverable substance.

### Category A - Foundation Runtime

#### A1 - Context Bundle runtime

Status: Not complete globally. Source has a sidecar deterministic context builder, but Nexus `runPipeline()` still uses the older six-phase bundle/composition path.

Tasks:
- Implement 5-state bundle classifier.
- Build 8-category bundle assembly functions.
- Compute 6-dimension quality scoring.
- Integrate bundle into existing `runPipeline()` retrieve and assemble phases.
- Gate response composition against bundle state.

Existing anchors:
- `src/lib/nexus/orchestrator.ts`
- `src/lib/nexus/assembler.ts`
- `src/lib/nexus/composer.ts`
- `src/lib/source/context-builder.ts`
- `src/lib/source/context-quality.ts`
- `src/lib/source/agent-context.ts`

Outcome target:
- Every agent turn produces a scored Context Bundle before Claude invocation.
- Responses are rejected or downgraded when bundle context is insufficient or vanilla-response risk is high.

#### A2 - Honest-disclosure response rendering

Status: Partial. UI primitives exist; global wiring to actual bundle scores is not complete.

Existing anchors:
- `src/components/agent/HonestDisclosureBanner.tsx`
- `src/components/agent/ConfidenceQualifier.tsx`
- `src/components/agent/SparsitySignal.tsx`
- `src/components/agent/AgentResponse.tsx`
- `src/lib/agent/honestDisclosure.ts`
- `src/lib/agent/renderedResponse.ts`

Outcome target:
- Agents never bluff on thin context.
- Users see confidence, context-used, and disclosure language derived from actual bundle quality.

#### A3 - Tenant isolation hardening

Status: Code-fixed in Cycle 2; live re-verification still needed beyond Dr. L check #1.

Existing anchors:
- `src/lib/auth/tenant-access.ts`
- `src/lib/auth/access-routing.ts`
- `src/lib/auth/current-user.ts`
- tenant routes under `src/app/(maestro)/tenant/[tenantSlug]/*`
- program action routes under `src/app/api/programs/*`

Outcome target:
- Cross-tenant navigation returns 403.
- Cross-tenant reads/writes are blocked.
- File uploads and evidence entries are tenant-scoped.

#### A4 - Evidence registry backend

Status: Partial. Deliverable evidence registry exists, but full backend E-id assignment/citation resolution/provenance is not complete.

Existing anchors:
- `src/lib/deliverables/evidence-registry.ts`
- `src/lib/integrity/evidence-citations.ts`
- `src/app/api/knowledge/chunk/route.ts`
- `supabase/migrations/024_knowledge_sources.sql`

Outcome target:
- Every citation resolves to a real evidence entry.
- Fabricated E-ids become structurally impossible.

### Category B - Agent Runtimes

#### B1 - Nexus agent for Programs + Source

Status: Partial. Nexus exists with six-phase pipeline and program routes. Needs A1/A2 integration and final voice/refusal/handoff contract.

Existing anchors:
- `src/lib/nexus/*`
- `src/app/api/v1/nexus/query/route.ts`
- `src/lib/programs/nexus.ts`
- `src/components/deliverables/NexusProgramRail.tsx`
- `src/components/source/PersistentNexusPanel.tsx`

Need:
- Maestro-collegial voice contract.
- Response modes A-E.
- Refusal behavior on missing evidence.
- Handoff affordances to Sentinel and Steward.
- Opus/model-tier routing for high-stakes prompts.

#### B2 - Sentinel agent for Intelligence

Status: Partial. Sentinel can retrieve/rank patterns and refuse thin evidence. Needs full validation and contradiction services.

Existing anchors:
- `src/lib/sentinel/orchestrator.ts`
- `src/app/api/v1/sentinel/query/route.ts`
- `src/lib/intelligence/pattern-manifest.ts`

Need:
- Research-rigorous voice.
- Evidence validation service callable by Nexus.
- Contradiction surfacing instead of flattening.
- Pattern library content depth.

#### B3 - Atlas agent for Control Tower

Status: Partial. Atlas chat/orchestrator exists; Cycle 2 free-text runtime shipped. Needs cap/pressure rigor.

Existing anchors:
- `src/lib/atlas/*`
- `src/app/api/v1/atlas/chat/route.ts`
- `src/components/atlas/AtlasChatPanel.tsx`

Need:
- Executive-concise voice with 150-word cap.
- Pressure card generation tied to aggregation data.
- Dollar-quantified pressures.

#### B4 - Steward agent for Admin

Status: Mostly missing as a runtime; admin surfaces exist.

Existing anchors:
- `src/components/admin/StewardAdminRail.tsx`
- `src/app/api/admin/steward-stats/route.ts`
- `/platform/admin/*`

Need:
- Operationally terse voice.
- Gate enforcement logic.
- Connector health monitoring.
- Audit surfacing.
- Permission enforcement.

#### B5 - Cross-agent handoff visibility

Status: Partial. `HandoffAffordance` exists but end-to-end handoff visibility/thread continuity is incomplete.

Existing anchors:
- `src/components/agent/HandoffAffordance.tsx`
- `src/lib/agent/voiceContracts.ts`
- `src/lib/atlas/repository.ts`
- intelligence thread repositories.

Need:
- Handoff event logging.
- UI status like "Sentinel is validating...".
- Conversation continuity across handoffs.

### Category C - Surface Applications

#### C1 - Programs surface

Status: Exists but needs decision-grade content and locked page readiness contract.

Existing anchors:
- tenant program routes under `src/app/(maestro)/tenant/[tenantSlug]/programs/*`
- legacy `/programs/*`
- `src/components/programs/*`
- `src/components/deliverables/*`

Need:
- Zone A-E layout completion.
- Phase timeline and deliverables grid.
- Gate status.
- Nexus editorial lead.
- Hero deliverables with substantive content.

#### C2 - Source event canvas

Status: Dashboard and context foundation exist. Event canvas should not be expanded until approved.

Existing anchors:
- `src/app/(maestro)/source/*`
- `src/components/source/*`
- `src/lib/source/*`
- `docs/abarva-source/build-pack/*`

Need:
- 10-stage journey tracker with real state logic.
- Scope/RFP/scorecard/selection workspaces.
- Scorecard editor with rationale-on-override.
- Locked state enforcement.
- Source context validation fixtures first.

#### C3 - Intelligence library

Status: Exists; content/retrieval depth incomplete.

Existing anchors:
- `/intelligence/*`
- `/tenant/[tenantSlug]/intelligence/patterns/[patternSlug]`
- `src/components/intelligence/*`
- `src/lib/intelligence/*`

Need:
- Pattern renderer per canonical 10-section template.
- Evidence drawer.
- Cross-pattern graph traversal.
- Authored pattern content.

#### C4 - Control Tower

Status: Exists; pressure card derivation and Atlas improving; aggregation completeness needed.

Existing anchors:
- `/tower/*`
- `/tenant/[tenantSlug]/tower/*`
- `src/components/tower/*`
- `src/lib/tower/*`

Need:
- Portfolio aggregation across Programs and Source.
- Atlas editorial lead.
- Projected vs realized vs variance across portfolio.

#### C5 - Setup/Admin

Status: Exists; operational depth incomplete.

Existing anchors:
- `/platform/admin/*`
- `src/components/admin/StewardAdminRail.tsx`
- `src/app/api/admin/*`

Need:
- Users, connectors, audit, quality, patterns as robust admin surfaces.
- Steward runtime.
- Complete role/permission editing.

#### C6 - Named visual primitives

Status: Many primitives shipped; some still need spec/story/accessibility.

Existing anchors:
- `src/components/agent/*`
- `src/components/workflow/*`
- `src/components/system/*`
- `src/components/source/EventLifecycleStatusBadge.tsx`

Need:
- Readiness Meter.
- Gate State Badge.
- Action Bar.
- Refinement of Context Strip, Agent Rail, Context Used Chip Group, Confidence Qualifier, Evidence Drawer.

### Category D - Data Architecture

#### D1 - Workflow state machines

Status: Partial. Program phase labels and Source constants exist, but no single production state-machine layer yet.

Need:
- Program 6 phases and 4 hard gates.
- Source 10 stages with wait states.
- Pattern status state machine.
- Audit event emission on transitions.

#### D2 - Program data model

Status: Partial with Supabase program foundation.

Existing anchors:
- `supabase/migrations/041_programs_foundation.sql`
- `src/lib/programs/types.db.ts`

Need:
- Complete program registry, module registry, deliverable registry, phase-gate registry, sponsor registry.

#### D3 - Sourcing data model

Status: Seed-only for Source.

Existing anchors:
- `src/lib/source/types.ts`
- `src/lib/source/constants.ts`
- `src/lib/source/mock-seed.ts`

Need:
- Supabase registry for sourcing events, stages, scorecards, vendors, RFP artifacts.
- Archetype-to-pattern-pack mapping.

#### D4 - Pattern registry and graph

Status: Partial.

Existing anchors:
- `src/lib/intelligence/pattern-manifest.ts`
- `src/lib/intelligence/retrieval/graphRetriever.ts`
- `supabase/migrations/20260421152900_foundational_patterns_and_legal_contexts.sql`

Need:
- Pattern registry with tier/vertical/status.
- Pattern-to-pattern edges.
- Citation index.
- Observation log.

#### D5 - Admin data layer

Status: Partial.

Need:
- User registry, role registry, permission matrix, connector registry, audit log, quality score log.
- Clerk hardening.
- Audit retention.

#### D6 - Conversation and session persistence

Status: Partial.

Existing anchors:
- intelligence threads/turns.
- Atlas threads/traces.
- Nexus session context.

Need:
- Per-surface conversation log.
- Session resumption.
- Feedback signal capture.
- Compression for long threads.

### Category E - Pattern Library Content

Status summary: content-heavy, founder/domain-authoring dependent.

E1 Meta-patterns M1-M6:
- Need authored/reviewed/locked meta-patterns governing architecture.

E2 Tier 3 hero use-case patterns:
- Need deep healthcare, retail, and financial services patterns.
- Critical for Marcus T and Dr. L approval.

E3 Pattern packs per archetype:
- Need AMS, Data & AI Modernization, Digital Build, Managed Services packs.
- Required for Source archetype routing.

E4 Tier 1 craft patterns:
- Need AI Governance Operating Model, Vendor Sprawl Rationalization, etc.

E5 Tier 2 capability patterns:
- Need Vendor Evaluation, Estimation, Change Management, Transition Management.

E6 Pattern authoring infrastructure:
- Need template linter, Sentinel validation, promotion workflow.

### Category F - Deliverables and Artifacts

#### F1 - Deliverable generation engine

Status: Partial. Existing generators and renderers exist, but content still falls back to scaffolds in places.

Existing anchors:
- `src/lib/deliverables/generate.ts`
- `src/lib/deliverables/v2-generator.ts`
- `src/components/deliverables/DeliverableTierRenderer.tsx`

Need:
- Rich/Outline/Stub generator grounded in patterns/evidence.
- Missing-input tagging.
- Tier reflects completeness.

#### F2 - Hero deliverable content

Status: Major blocker.

Need:
- D16 Business Case.
- D17 Decision Memo.
- D01 Program Charter.
- D10 Executive Summary.
- D12 RACI / roadmap.
- Healthcare and retail tenant-specific substance.
- Three-option framing, counterfactual, clinical regulatory framing, real financial model scaffolding.

#### F3 - Value Ledger

Status: Partial.

Existing anchors:
- `src/lib/source/value-ledger.ts`
- `src/components/source/SourceValueLedger.tsx`
- program baseline/actual metrics in migrations.

Need:
- Projected value capture.
- Realized measurement.
- Variance attribution.
- Counterfactual pre-registration.

#### F4 - Scorecard system

Status: Partial/Source seed only.

Existing anchors:
- `src/lib/source/scorecard.ts`
- `src/components/source/ScorecardGovernancePanel.tsx`
- `src/components/source/EvaluationCriteriaEditor.tsx`

Need:
- Scorecard model with weights/rationale/overrides/locks.
- Rationale-on-material-change enforcement.
- Audit trail.

#### F5 - Artifact versioning and lock

Status: Partial.

Need:
- Version history.
- Lock state enforcement.
- Supersession tracking.
- Review/approve workflow.

### Category G - File Ingestion and Evidence

G1 Upload pipeline:
- Status: partial routes exist (`/api/tower/upload`, `/api/data/upload`, `/api/v1/nexus/upload`), but production-grade Source/program upload pipeline is not complete.
- Needs MIME/size/malware validation and tenant binding.

G2 Parse and extract pipeline:
- Status: libraries installed (`pdf-parse`, `mammoth`, `exceljs`, `papaparse`), but full structured extraction pipeline is incomplete.

G3 Attachment-to-evidence conversion:
- Status: not complete.
- Needs file classification and evidence registry conversion.

G4 Multi-file reasoning:
- Status: not complete.
- Needs agent retrieval over parsed files, file citations, stale-file detection.

### Category H - Chat and Input

H1 Three-choices-plus-custom:
- Status: partial (`ResponseOptions`, `ChoiceChips`, Source chat model docs).
- Needs context-aware suggestions per surface.

H2 Suggested action quality linter:
- Status: missing.

H3 Typo tolerance with protected terms:
- Status: missing.

H4 Conversation continuity:
- Status: partial through intelligence/Atlas/Nexus thread persistence.
- Needs work-object scoping and no cross-user leakage.

### Category I - Validation Infrastructure

I1 Crawler persona infrastructure:
- Status: manual crawler reports exist; callable persona runner not fully codified.

I2 Golden prompt harness:
- Status: missing/partial.
- Needs 50-100 prompts across surfaces, CI regression checks.

I3 ACCEPT/DEFER/REJECT verdict format:
- Status: manual reports use verdicts; automation incomplete.

I4 Observability dashboards:
- Status: missing.
- Needs vanilla-response risk, context quality distribution, latency, failure mode detection frequency.

### Category J - Governance and Build Discipline

J1 PR review packet template:
- Status: needed.

J2 Page readiness contracts:
- Status: Build Pack exists for Source; other surfaces need locked contracts.

J3 CYCLE_STATE discipline:
- Status: active. `CYCLE_STATE.md` exists and is detailed.
- Need keep updated at every merge/CI failure/30 minutes.

J4 Retirement of auto-merge authority:
- Status: founder decision required.

J5 Canon/design-canon reconciliation:
- Status: ongoing.
- Need reconcile new File 08/09/10 and existing design canon contradictions.

### Category K - Deploy and Operations

K1 Multi-tenant production deployment:
- Status: Vercel deployed for `.ai`; `.com` unresolved.
- Needs production-grade tenant provisioning, auth, rate limiting, secrets, Claude cost controls.

K2 Observability and alerting:
- Status: missing/partial.

K3 Data retention, backup, and privacy:
- Status: missing.

K4 Customer documentation:
- Status: missing.

K5 Enterprise readiness:
- Status: missing.
- Needs SOC2 prep, SSO, audit export, data residency options.

## Immediate Priority Recommendation

Do not let Source UI expansion jump ahead of the runtime foundation.

Recommended next highest-leverage sequence:
1. Confirm domain/DNS plan for `app.abarva.com` vs `app.abarva.ai`.
2. Run live tenant re-walk for Cycle 2 fixes.
3. Implement Source context validation fixtures if staying in Source sidecar.
4. Start A1 global Context Bundle integration into `runPipeline()`.
5. Wire A2 honest-disclosure rendering to actual context quality scores.
6. Continue A3/A4 hardening in parallel: tenant/file/evidence boundaries.

