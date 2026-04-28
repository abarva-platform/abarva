# 00 MASTER ANCHOR

This Build Pack is the source of truth for **AbarVa Source**.

Codex must read [CYCLE_STATE.md](/Users/anand/Projects/nexus/CYCLE_STATE.md) first for live operating state, then this file before reading any other file in [docs/abarva-source/build-pack](/Users/anand/Projects/nexus/docs/abarva-source/build-pack).

## What AbarVa Source Is

AbarVa Source is an AI-led sourcing and vendor-selection workflow product inside the broader AbarVa platform.

- AbarVa is the platform.
- AbarVa Source is the sourcing workflow and product surface.
- Nexus is the lead sourcing agent.
- Sentinel supports evidence, rigor, citations, and risk validation.
- Atlas supports executive synthesis and steering committee views.
- Steward supports gate enforcement, readiness, auditability, and operational integrity.

AbarVa Source is not a demo route, CRUD dashboard, procurement portal clone, generic AI chatbot, or static template library.

Agent context awareness is a load-bearing product capability. No Nexus, Sentinel, Atlas, or Steward UI should be considered complete until the response is grounded in the current Source context and passes the context validation harness.

Workflow richness and document collaboration are production-readiness requirements. Source must support artifact lifecycles, document export/edit/re-upload, version history, review cycles, approval routing, wait states, rework loops, and workflow validation before it can be considered enterprise-ready.

## Platform Fit

Source uses platform foundations rather than inventing an isolated product stack:

- Pattern Fabric provides sourcing archetypes, pattern packs, stage gates, scorecard defaults, artifact templates, and reusable sourcing logic.
- Agent Fabric provides Nexus, Sentinel, Atlas, and Steward.
- Artifact Studio generates structured sourcing work products.
- Control Tower provides portfolio and executive visibility.
- Value Ledger tracks projected versus realized value.

## Mental Model

- Source Dashboard = portfolio of sourcing events
- Sourcing Event = core unit of work
- Nexus Engagement Canvas = where one sourcing event is managed
- Journey Tracker = where the event is in the lifecycle
- Stage Workspace = what is being worked on now
- Nexus Panel = what the AI sourcing lead recommends
- Artifact Drawer = what has been generated
- Scorecard Governance = how vendor evaluation is controlled
- Value Ledger = whether projected value was realized

## Read Order

Codex should read operating state first, then the Build Pack in this order:

0. [CYCLE_STATE.md](/Users/anand/Projects/nexus/CYCLE_STATE.md)
1. [00_MASTER_ANCHOR.md](/Users/anand/Projects/nexus/docs/abarva-source/build-pack/00_MASTER_ANCHOR.md)
2. [01_PRODUCT_VISION_AND_POSITIONING.md](/Users/anand/Projects/nexus/docs/abarva-source/build-pack/01_PRODUCT_VISION_AND_POSITIONING.md)
3. [02_USER_PERSONAS_AND_JOURNEYS.md](/Users/anand/Projects/nexus/docs/abarva-source/build-pack/02_USER_PERSONAS_AND_JOURNEYS.md)
4. [03_INFORMATION_ARCHITECTURE.md](/Users/anand/Projects/nexus/docs/abarva-source/build-pack/03_INFORMATION_ARCHITECTURE.md)
5. [04_VISUAL_EXPERIENCE_AND_DESIGN_SYSTEM.md](/Users/anand/Projects/nexus/docs/abarva-source/build-pack/04_VISUAL_EXPERIENCE_AND_DESIGN_SYSTEM.md)
6. [05_ROUTE_AND_NAVIGATION_MODEL.md](/Users/anand/Projects/nexus/docs/abarva-source/build-pack/05_ROUTE_AND_NAVIGATION_MODEL.md)
7. [06_DATA_MODEL_AND_ERD.md](/Users/anand/Projects/nexus/docs/abarva-source/build-pack/06_DATA_MODEL_AND_ERD.md)
8. [07_WORKFLOW_AND_STATE_MACHINE.md](/Users/anand/Projects/nexus/docs/abarva-source/build-pack/07_WORKFLOW_AND_STATE_MACHINE.md)
9. [08_AGENT_DESIGN_AND_HANDOFFS.md](/Users/anand/Projects/nexus/docs/abarva-source/build-pack/08_AGENT_DESIGN_AND_HANDOFFS.md)
10. [09_PATTERN_PACK_ARCHITECTURE.md](/Users/anand/Projects/nexus/docs/abarva-source/build-pack/09_PATTERN_PACK_ARCHITECTURE.md)
11. [10_ARTIFACT_AND_RFP_GENERATION_MODEL.md](/Users/anand/Projects/nexus/docs/abarva-source/build-pack/10_ARTIFACT_AND_RFP_GENERATION_MODEL.md)
12. [11_SCORECARD_GOVERNANCE.md](/Users/anand/Projects/nexus/docs/abarva-source/build-pack/11_SCORECARD_GOVERNANCE.md)
13. [12_VALUE_LEDGER_MODEL.md](/Users/anand/Projects/nexus/docs/abarva-source/build-pack/12_VALUE_LEDGER_MODEL.md)
14. [13_EVENT_LIFECYCLE_AND_ALERTS.md](/Users/anand/Projects/nexus/docs/abarva-source/build-pack/13_EVENT_LIFECYCLE_AND_ALERTS.md)
15. [14_IMPLEMENTATION_SEQUENCE.md](/Users/anand/Projects/nexus/docs/abarva-source/build-pack/14_IMPLEMENTATION_SEQUENCE.md)
16. [15_ACCEPTANCE_CRITERIA.md](/Users/anand/Projects/nexus/docs/abarva-source/build-pack/15_ACCEPTANCE_CRITERIA.md)
17. [16_AGENT_PER_TURN_CONTRACT.md](/Users/anand/Projects/nexus/docs/abarva-source/build-pack/16_AGENT_PER_TURN_CONTRACT.md)
18. [17_CRAWLER_PERSONA_VERIFICATION.md](/Users/anand/Projects/nexus/docs/abarva-source/build-pack/17_CRAWLER_PERSONA_VERIFICATION.md)
19. [18_FAILURE_MODE_CATALOG.md](/Users/anand/Projects/nexus/docs/abarva-source/build-pack/18_FAILURE_MODE_CATALOG.md)
20. [19_CROSS_PRODUCT_ARCHITECTURE.md](/Users/anand/Projects/nexus/docs/abarva-source/build-pack/19_CROSS_PRODUCT_ARCHITECTURE.md)
21. [20_COMMERCIAL_MODEL.md](/Users/anand/Projects/nexus/docs/abarva-source/build-pack/20_COMMERCIAL_MODEL.md)
22. [21_PATTERN_PACK_CONTENT_DEPTH_STANDARD.md](/Users/anand/Projects/nexus/docs/abarva-source/build-pack/21_PATTERN_PACK_CONTENT_DEPTH_STANDARD.md)
23. [22_AGENT_CONTEXT_AWARENESS.md](/Users/anand/Projects/nexus/docs/abarva-source/build-pack/22_AGENT_CONTEXT_AWARENESS.md)
24. [23_CHAT_EXPERIENCE_AND_INPUT_MODEL.md](/Users/anand/Projects/nexus/docs/abarva-source/build-pack/23_CHAT_EXPERIENCE_AND_INPUT_MODEL.md)
25. [24_CONTEXT_VALIDATION_HARNESS.md](/Users/anand/Projects/nexus/docs/abarva-source/build-pack/24_CONTEXT_VALIDATION_HARNESS.md)
26. [25_WORKFLOW_RICHNESS_AND_DOCUMENT_COLLABORATION.md](/Users/anand/Projects/nexus/docs/abarva-source/build-pack/25_WORKFLOW_RICHNESS_AND_DOCUMENT_COLLABORATION.md)
27. [26_ARTIFACT_REVIEW_AND_APPROVAL_MODEL.md](/Users/anand/Projects/nexus/docs/abarva-source/build-pack/26_ARTIFACT_REVIEW_AND_APPROVAL_MODEL.md)
28. [27_WORKFLOW_VALIDATION_HARNESS.md](/Users/anand/Projects/nexus/docs/abarva-source/build-pack/27_WORKFLOW_VALIDATION_HARNESS.md)
29. [32_SOURCE_DATA_READINESS_AND_ADMIN_SETUP_INTEGRATION.md](/Users/anand/Projects/nexus/docs/abarva-source/build-pack/32_SOURCE_DATA_READINESS_AND_ADMIN_SETUP_INTEGRATION.md)
30. [33_PRICING_AND_NEGOTIATION_INTELLIGENCE_STANDARD.md](/Users/anand/Projects/nexus/docs/abarva-source/build-pack/33_PRICING_AND_NEGOTIATION_INTELLIGENCE_STANDARD.md)
31. relevant `wireframes/*.md`
32. relevant `components/*.md`

## Source Of Truth Map

- Product vision: [01_PRODUCT_VISION_AND_POSITIONING.md](/Users/anand/Projects/nexus/docs/abarva-source/build-pack/01_PRODUCT_VISION_AND_POSITIONING.md)
- Users and journeys: [02_USER_PERSONAS_AND_JOURNEYS.md](/Users/anand/Projects/nexus/docs/abarva-source/build-pack/02_USER_PERSONAS_AND_JOURNEYS.md)
- UX and information architecture: [03_INFORMATION_ARCHITECTURE.md](/Users/anand/Projects/nexus/docs/abarva-source/build-pack/03_INFORMATION_ARCHITECTURE.md)
- Visual design: [04_VISUAL_EXPERIENCE_AND_DESIGN_SYSTEM.md](/Users/anand/Projects/nexus/docs/abarva-source/build-pack/04_VISUAL_EXPERIENCE_AND_DESIGN_SYSTEM.md)
- Routes and navigation: [05_ROUTE_AND_NAVIGATION_MODEL.md](/Users/anand/Projects/nexus/docs/abarva-source/build-pack/05_ROUTE_AND_NAVIGATION_MODEL.md)
- Data model and architecture: [06_DATA_MODEL_AND_ERD.md](/Users/anand/Projects/nexus/docs/abarva-source/build-pack/06_DATA_MODEL_AND_ERD.md)
- Workflow and lifecycle: [07_WORKFLOW_AND_STATE_MACHINE.md](/Users/anand/Projects/nexus/docs/abarva-source/build-pack/07_WORKFLOW_AND_STATE_MACHINE.md) and [13_EVENT_LIFECYCLE_AND_ALERTS.md](/Users/anand/Projects/nexus/docs/abarva-source/build-pack/13_EVENT_LIFECYCLE_AND_ALERTS.md)
- Agent model: [08_AGENT_DESIGN_AND_HANDOFFS.md](/Users/anand/Projects/nexus/docs/abarva-source/build-pack/08_AGENT_DESIGN_AND_HANDOFFS.md)
- Agent per-turn contract: [16_AGENT_PER_TURN_CONTRACT.md](/Users/anand/Projects/nexus/docs/abarva-source/build-pack/16_AGENT_PER_TURN_CONTRACT.md)
- Agent context awareness: [22_AGENT_CONTEXT_AWARENESS.md](/Users/anand/Projects/nexus/docs/abarva-source/build-pack/22_AGENT_CONTEXT_AWARENESS.md)
- Chat/input model: [23_CHAT_EXPERIENCE_AND_INPUT_MODEL.md](/Users/anand/Projects/nexus/docs/abarva-source/build-pack/23_CHAT_EXPERIENCE_AND_INPUT_MODEL.md)
- Context validation harness: [24_CONTEXT_VALIDATION_HARNESS.md](/Users/anand/Projects/nexus/docs/abarva-source/build-pack/24_CONTEXT_VALIDATION_HARNESS.md)
- Pattern packs: [09_PATTERN_PACK_ARCHITECTURE.md](/Users/anand/Projects/nexus/docs/abarva-source/build-pack/09_PATTERN_PACK_ARCHITECTURE.md) and [21_PATTERN_PACK_CONTENT_DEPTH_STANDARD.md](/Users/anand/Projects/nexus/docs/abarva-source/build-pack/21_PATTERN_PACK_CONTENT_DEPTH_STANDARD.md)
- Artifacts and RFP generation: [10_ARTIFACT_AND_RFP_GENERATION_MODEL.md](/Users/anand/Projects/nexus/docs/abarva-source/build-pack/10_ARTIFACT_AND_RFP_GENERATION_MODEL.md)
- Scorecard governance: [11_SCORECARD_GOVERNANCE.md](/Users/anand/Projects/nexus/docs/abarva-source/build-pack/11_SCORECARD_GOVERNANCE.md)
- Value ledger: [12_VALUE_LEDGER_MODEL.md](/Users/anand/Projects/nexus/docs/abarva-source/build-pack/12_VALUE_LEDGER_MODEL.md)
- Workflow richness and document collaboration: [25_WORKFLOW_RICHNESS_AND_DOCUMENT_COLLABORATION.md](/Users/anand/Projects/nexus/docs/abarva-source/build-pack/25_WORKFLOW_RICHNESS_AND_DOCUMENT_COLLABORATION.md)
- Artifact review and approval model: [26_ARTIFACT_REVIEW_AND_APPROVAL_MODEL.md](/Users/anand/Projects/nexus/docs/abarva-source/build-pack/26_ARTIFACT_REVIEW_AND_APPROVAL_MODEL.md)
- Workflow validation harness: [27_WORKFLOW_VALIDATION_HARNESS.md](/Users/anand/Projects/nexus/docs/abarva-source/build-pack/27_WORKFLOW_VALIDATION_HARNESS.md)
- Source data readiness and Admin/Setup integration: [32_SOURCE_DATA_READINESS_AND_ADMIN_SETUP_INTEGRATION.md](/Users/anand/Projects/nexus/docs/abarva-source/build-pack/32_SOURCE_DATA_READINESS_AND_ADMIN_SETUP_INTEGRATION.md)
- Pricing and negotiation intelligence: [33_PRICING_AND_NEGOTIATION_INTELLIGENCE_STANDARD.md](/Users/anand/Projects/nexus/docs/abarva-source/build-pack/33_PRICING_AND_NEGOTIATION_INTELLIGENCE_STANDARD.md)
- Persona crawler verification: [17_CRAWLER_PERSONA_VERIFICATION.md](/Users/anand/Projects/nexus/docs/abarva-source/build-pack/17_CRAWLER_PERSONA_VERIFICATION.md)
- Sourcing failure modes: [18_FAILURE_MODE_CATALOG.md](/Users/anand/Projects/nexus/docs/abarva-source/build-pack/18_FAILURE_MODE_CATALOG.md)
- Cross-product architecture: [19_CROSS_PRODUCT_ARCHITECTURE.md](/Users/anand/Projects/nexus/docs/abarva-source/build-pack/19_CROSS_PRODUCT_ARCHITECTURE.md)
- Commercial model: [20_COMMERCIAL_MODEL.md](/Users/anand/Projects/nexus/docs/abarva-source/build-pack/20_COMMERCIAL_MODEL.md)
- Implementation sequence: [14_IMPLEMENTATION_SEQUENCE.md](/Users/anand/Projects/nexus/docs/abarva-source/build-pack/14_IMPLEMENTATION_SEQUENCE.md)
- Acceptance criteria: [15_ACCEPTANCE_CRITERIA.md](/Users/anand/Projects/nexus/docs/abarva-source/build-pack/15_ACCEPTANCE_CRITERIA.md)
- Operating state: [CYCLE_STATE.md](/Users/anand/Projects/nexus/CYCLE_STATE.md)

## Build Discipline

Implementation must follow this sequence:

1. Build Pack file exists.
2. Component spec exists.
3. Wireframe exists.
4. Product/design review happens.
5. Codex implements only the approved component or slice.
6. Visual/design review happens.
7. Refinement happens.
8. Only then move to the next component.

## Approval Boundary

Codex should not implement any component unless all of the following are true:

1. the component has a dedicated spec file
2. the wireframe exists
3. the data dependencies are clear
4. the visual behavior is defined
5. the acceptance criteria are listed
6. the implementation slice has been explicitly approved
7. any agent/chat behavior has an approved Context Bundle contract and validation harness criteria
8. any artifact/review/approval behavior has an approved workflow validation scenario and gate behavior

The current dashboard implementation is **prototype v0 only**. It is not final design authority and must not be extended until the dashboard spec and wireframe are reviewed.

No agent UI is complete until:

- it assembles responses from a Source Agent Context Bundle
- it exposes context used and confidence
- it offers contextual suggested actions where appropriate
- it passes vanilla-response detection
- it avoids model-generated claims that bypass event state, gates, evidence, or citations

No workflow or artifact collaboration UI is complete until:

- artifact lifecycle states are explicit
- export/edit/re-upload behavior is defined
- artifact versions are preserved
- review and approval routes are auditable
- locked/reopened behavior is enforced
- stage gates use artifact, review, approval, and waiver state
- workflow validation scenarios pass for unsafe stage movement and document actions

## Prohibited Until Reviewed

Do not build:

- event canvas
- scorecard page
- artifact drawer
- value ledger
- vendor response flow
- AI generation
- document export/import
- approval routing UI
- artifact versioning UI

Do not touch:

- [src/app/programs](/Users/anand/Projects/nexus/src/app/programs)
- [src/app/(maestro)/preview](/Users/anand/Projects/nexus/src/app/(maestro)/preview)
- [src/app/demo](/Users/anand/Projects/nexus/src/app/demo)
- [src/components/programs/ProgramSurface.tsx](/Users/anand/Projects/nexus/src/components/programs/ProgramSurface.tsx)
- [src/lib/programs/mock.ts](/Users/anand/Projects/nexus/src/lib/programs/mock.ts)

## Quality Bar

The product should make a CIO, CTO, CFO, procurement leader, or transformation executive say:

> This is how technology sourcing should have always worked.

## Design Principles

- agent-led, not form-led
- workflow-first, not page-first
- evidence-backed, not opinion-only
- executive-grade, not operational clutter
- calm, premium, and decision-oriented
- progressive disclosure: show enough to act, not everything at once
- persistent context: the user always knows where they are, what is missing, what is at risk, and what Nexus recommends
- governance-native: every stage, scorecard, artifact, and decision has traceability
- pattern-powered: the UI exposes structured intelligence from the Pattern Fabric, not static templates
- value-linked: every sourcing event connects to value, risk, and measurable outcome

## Anti-Patterns

- generic dashboard full of disconnected cards
- chatbot panel with no workflow authority
- decorative journey tracker with no state logic
- static templates pretending to be AI-generated artifacts
- scorecards with no authored defaults
- mock data leaking into product architecture
- multiple duplicate shells
- too many colors and badges
- hiding the next action
- making users guess what stage they are in
- making users fill long forms before seeing value
- hard-coding AMS-only language
- building a vendor portal too early
- wiring full AI generation before artifact structure is stable
- extending legacy `/programs`, `/preview`, `/demo`, `ProgramSurface`, or `src/lib/programs/mock.ts`

## Future Task Instruction

Every future Source implementation task should reference:

- this anchor
- the relevant product/architecture file
- the relevant wireframe file
- the relevant component spec
- the implementation sequence
- the acceptance criteria

Absent explicit approval for a named slice, implementation stops at documentation and structure.
