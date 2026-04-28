# 00 · Agent-Centric Master Anchor

**Document:** Platform-wide master anchor for AbarVa's agent-centric product design
**Status:** GPT-REFINED-DRAFT · pending founder/Claude review
**Authored:** April 24, 2026
**Author:** Anand Sundaram + Claude (co-authored under AbarVa Agent-Centric Product Design Framework)
**Framework source:** `/framework/AbarVa_Agent_Centric_Product_Design_Framework.md`

This is the platform-design master anchor for AbarVa. Read this file first before reading any other file in `docs/platform-design/`. Read the framework document before reading this file.

## What this document is

A read-order contract, approval boundary statement, and source-of-truth map for the eight platform-design documents that operationalize AbarVa's Agent-Centric Product Design Framework. This document itself is operational, not aspirational — it tells Claude, Codex, and future engineers the specific sequence in which to read materials and the specific gates that must be passed before any implementation proceeds.

This document is not a vision document. The vision lives in document 01 (Platform North Star). This document is not a design system. The design system lives in document 04. This document is the operating manual that governs how the other seven documents compose into buildable specification.

## What AbarVa is (canonical single-sentence statement)

AbarVa is an agent-centric enterprise intelligence platform that makes every high-stakes technology decision — AI transformation programs, IT sourcing engagements, intelligence research, portfolio oversight — feel like a premium expert agent is actively guiding the user with full awareness of their context, evidence, risks, and next action.

AbarVa is not a workflow tool. Not a dashboard product. Not a chat application. Not a consulting template library. The architecture is agents plus context plus evidence plus workflow plus value, composed into decision environments.

## Platform surfaces governed by this anchor

Five canonical surfaces. All governed by this platform-design canon. All agent-led. All context-aware. All governed by shared primitives.

**Programs** — AI transformation programs workspace. Agent owner: Nexus + Steward.

**Source** — IT sourcing workbench. Agent owner: Nexus + Sentinel + Steward.

**Intelligence** — Pattern library and research environment. Agent owner: Sentinel.

**Control Tower** — Executive portfolio oversight across Programs and Source. Agent owner: Atlas.

**Setup/Admin** — Platform administration, connectors, configuration, pattern library management. Agent owner: Steward.

Surfaces share Pattern Fabric, Agent Fabric, Artifact Studio, Control Tower logic, and Value Ledger mechanics. Surfaces do not share page-specific domain models or interaction patterns — Programs is different from Source is different from Intelligence. The shared primitives are architectural. The surface-level behavior is domain-specific.

## Read order

Read the eight platform-design documents in this exact sequence. Each builds on the ones that precede it.

**Required prerequisite read:** `AbarVa_Agent_Centric_Product_Design_Framework.md` (the source framework)

Then:

1. **`00_AGENT_CENTRIC_MASTER_ANCHOR.md`** — this document
2. **`01_PLATFORM_NORTH_STAR.md`** — the canonical vision, principles, and ideal user reactions per surface
3. **`02_CONTEXT_BUNDLE_STANDARD.md`** — the single most load-bearing specification in the canon: what every agent must know before speaking
4. **`03_PAGE_LEVEL_AGENT_CONTRACTS.md`** — per-surface agent behavior contracts, response modes, and handoff rules
5. **`04_VISUAL_AND_INTERACTION_SYSTEM.md`** — design tokens, layout zones, component behaviors, anti-patterns
6. **`05_CHAT_INPUT_AND_ATTACHMENT_STANDARD.md`** — the three-choices-plus-custom pattern, file upload as context ingestion, typo tolerance rules
7. **`06_VALIDATION_AND_CRAWLER_PERSONAS.md`** — golden prompts, persona crawlers, context quality scoring harness
8. **`07_FAILURE_MODE_CATALOG.md`** — the failure modes AbarVa exists to prevent, with the product capabilities that prevent each
9. **`08_BUILD_GOVERNANCE.md`** — implementation gates, approval discipline, Codex operating rules

After these nine documents (master anchor plus eight core documents), the following existing AbarVa canon documents apply in descending priority:

- `docs/design-canon/08-agent-fabric-per-turn-contract-backlog.md` (runtime per-turn contract — governs agent implementation)
- `docs/design-canon/09-per-surface-ui-pattern-backlog.md` (per-surface UI specifications, now subordinate to this platform canon)
- `docs/design-canon/10-component-design-system-backlog.md` (component specifications)
- `docs/pattern-library/00-vision-catalog-template-first-pattern.md` (pattern library vision and M1)
- `docs/pattern-library/01-meta-patterns-m2-m6.md` (M2 through M6 meta-patterns)
- Remaining design canon files (01-07) as contextual reference

Where conflicts arise between this platform canon and prior design canon, this platform canon wins. Existing design canon documents that contradict the framework require revision or retirement.

## Source of truth map

- **Vision, principles, surface ideal reactions:** `01_PLATFORM_NORTH_STAR.md`
- **Context Bundle structure, quality scoring, composition rules:** `02_CONTEXT_BUNDLE_STANDARD.md`
- **Per-surface agent contracts, response modes, handoff rules:** `03_PAGE_LEVEL_AGENT_CONTRACTS.md`
- **Design tokens, layout zones, component behaviors:** `04_VISUAL_AND_INTERACTION_SYSTEM.md`
- **Chat input patterns, file attachment, typo handling:** `05_CHAT_INPUT_AND_ATTACHMENT_STANDARD.md`
- **Persona crawlers, golden prompts, validation scripts:** `06_VALIDATION_AND_CRAWLER_PERSONAS.md`
- **Failure mode catalog, prevention mechanisms:** `07_FAILURE_MODE_CATALOG.md`
- **Build gates, approval discipline, Codex operating rules:** `08_BUILD_GOVERNANCE.md`
- **Agent runtime per-turn contract:** `docs/design-canon/08-agent-fabric-per-turn-contract-backlog.md`
- **Component specifications (subordinate to `04_VISUAL_AND_INTERACTION_SYSTEM.md`):** `docs/design-canon/10-component-design-system-backlog.md`

## Mental model

The mental model for AbarVa's architecture. Read before touching any surface.

**One platform, five agent-led surfaces, shared fabric.**

The fabric is the intelligence substrate — patterns, agents, context, evidence, value. The surfaces are the workflow expressions — where users come in, what work they do, what decisions they make. A surface without fabric is a dashboard. Fabric without surfaces is infrastructure. AbarVa is specifically the intersection.

**Four agents with distinct voices and overlapping scopes.**

Nexus leads workflow (Programs, Source). Sentinel validates evidence and holds the pattern library (Intelligence, supports others). Atlas synthesizes executively (Control Tower, supports handoffs). Steward enforces operational integrity (Setup/Admin, supports gate enforcement). Agents do not have hard zone locks — they have primary zones and secondary participation rights per the handoff model in document 03.

**Context Bundle is the core primitive.**

Every agent response is grounded in a Context Bundle. Every Context Bundle is scored for completeness, evidence coverage, workflow awareness, and vanilla-response risk. Responses from low-completeness bundles declare their limitations. Responses from high-completeness bundles cite specifics. The Context Bundle is what prevents AbarVa from becoming generic AI.

**Three choices plus custom after every agent turn.**

Chat is not a blank prompt. After every substantive agent response, three contextually-generated suggested actions plus a custom option. Generated from context, not static filler. Moves the conversation forward. Prevents the "now what do I type" dead-end that kills enterprise chat adoption.

**File attachment is context ingestion, not message attachment.**

Uploaded files classify, attach to work objects, parse, extract structured context, become evidence with citation metadata. Agents do not cite a file until it has been parsed with confidence. The UI shows "context used" whenever a file influences a response.

**Failure modes drive product strategy.**

Every AbarVa capability exists to prevent a specific failure mode. Generic AI answers (Context Bundle prevents). Unclear next action (agent rail plus suggested actions prevent). Workflow premature advance (Steward gates prevent). Deliverable with missing facts (artifact tiering and Sentinel validation prevent). The failure mode catalog in document 07 is not documentation — it is product specification rendered as anti-outcomes.

## Build discipline

Implementation follows this sequence. No exceptions without explicit approval.

1. Platform design document exists (this canon)
2. Component specification exists (in `docs/design-canon/10-component-design-system-backlog.md` or equivalent)
3. Wireframe exists (in `docs/platform-design/wireframes/` or component spec inline)
4. Context Bundle definition exists for the surface (references `02_CONTEXT_BUNDLE_STANDARD.md`)
5. Agent behavior contract exists (references `03_PAGE_LEVEL_AGENT_CONTRACTS.md`)
6. Validation criteria exist (references `06_VALIDATION_AND_CRAWLER_PERSONAS.md`)
7. Anti-patterns named (references `07_FAILURE_MODE_CATALOG.md`)
8. Founder (Anand) approves the slice explicitly
9. Codex or Code implements the approved slice only
10. Visual and behavior review happens against acceptance criteria
11. Crawler persona validation passes
12. Refinement happens if persona validation surfaces issues
13. Slice ships to main
14. Only then move to the next slice

Any shortcut around this sequence is a violation of build discipline.

## Approval boundary

Codex and Code do not implement components unless all of the following are true:

1. The component has a dedicated spec in the design canon
2. The wireframe exists
3. The Context Bundle definition for the relevant surface is complete
4. The agent behavior contract for the relevant surface is complete
5. The data dependencies are clear and reachable
6. The visual behavior is defined
7. The interaction behavior is defined
8. The acceptance criteria are listed
9. The anti-patterns are named
10. The implementation slice has been explicitly approved by Anand

Absence of any of these items is a build blocker. The appropriate response is to author the missing specification, not to implement without it.

## Prohibited until reviewed

The following items MUST NOT be implemented, modified, or extended without explicit founder approval:

**Surfaces:**
- Context Bundle ingestion pipeline (document 02 must be locked first)
- Four-agent runtime with context-aware responses (document 03 must be locked first)
- File upload-to-context-ingestion flow (document 05 must be locked first)
- Chat three-choices-plus-custom input pattern (document 05 must be locked first)

**Files:**
- `src/app/programs/*` — legacy programs surface (extend only per approved slice)
- `src/app/(maestro)/preview/*` — preview routes (do not extend without preview review)
- `src/app/demo/*` — demo surface (do not extend without demo review)
- `src/components/programs/ProgramSurface.tsx` — legacy shell (do not extend)
- `src/lib/programs/mock.ts` — mock data (do not extend as architectural layer)

**Behaviors:**
- Any free-form agent generation without Context Bundle grounding
- Any chat UI without the three-choices-plus-custom suggested-action model
- Any file upload without parse-to-evidence flow
- Any surface that shows agent as rail-only without agent editorial lead

## Quality bar

The product must make a CIO, CTO, CFO, procurement leader, or transformation executive say:

> This already understands my business context, the work in motion, the decision I need to make, and what is missing before I can move forward.

If a surface cannot produce this reaction in a three-minute crawler walk from a persona-matched user, the surface is not shipping. See document 06 for the specific persona crawler protocol that verifies this quality bar.

## Anti-patterns (platform-level)

These are platform-wide anti-patterns. Every surface must avoid these. Per-surface anti-patterns live in document 07.

**The agent-as-rail anti-pattern.** Rendering agent content in a right rail while the main surface renders metrics and grids. This makes the surface feature-bolted rather than agent-centric. Agent editorial must lead the surface, not decorate it.

**The generic-chat anti-pattern.** Free-form chat box with no suggested actions, no context-used display, no confidence disclosure. Makes AbarVa feel like ChatGPT attached to an enterprise product.

**The blank-prompt anti-pattern.** User arrives at a surface and must type their own prompt to get value. Agent should lead with context-aware synthesis before user prompts.

**The disconnected-surfaces anti-pattern.** Programs feels like one product, Source feels like another, Intelligence feels like a third, with no shared voice, shared fabric visibility, or shared context. Five surfaces must feel like one platform.

**The dashboard-graveyard anti-pattern.** Pages filled with metrics that do not synthesize into decisions. Atlas must compose editorial on top of metrics; metrics without editorial are noise.

**The template-library anti-pattern.** Deliverables, RFPs, artifacts rendered from static templates with fill-in-the-blank content. AbarVa artifacts must be generated from authored pattern content with client-specific synthesis, not template fills.

**The missing-evidence anti-pattern.** Agent responses that make claims without citation. Every substantive claim carries provenance. If evidence is thin, the agent says so.

**The silent-failure anti-pattern.** Agent response that does not disclose what it didn't have. If the Context Bundle is incomplete, the agent must say so and distinguish pattern-level guidance from event-specific guidance.

## Design principles (reinforced from framework section 3)

- Context-first, not prompt-first
- Agent-led, not form-led
- Workflow-first, not page-first
- Evidence-backed, not opinion-only
- Progressive disclosure (surface the decision, tuck detail into drawers)
- Governance-native (audit, approval, gates, rationale as product primitives)
- Pattern-powered (reusable IP drives behavior)
- Value-linked (every surface connects to the Value Ledger)

These principles are not aspirational. They are filters applied to every design decision. A surface that violates any of these principles fails the platform canon and must be reworked.

## Five-question test for every page

Every surface in AbarVa must answer these five questions within three seconds of landing:

1. Where am I?
2. What matters right now?
3. What is blocked or at risk?
4. What does the agent recommend?
5. What should I do next?

A surface that does not answer any of these questions within three seconds is a design failure. Surfaces that answer only some of them are partial failures. The design target is all five, answered by agent editorial plus supporting evidence.

## Future task instruction

Every future platform implementation task should reference:

- This master anchor
- The relevant platform-design document (01-08)
- The relevant wireframe (if exists)
- The relevant component spec (in design canon file 10)
- The implementation gate (document 08)
- The acceptance criteria (document 06)

Absent explicit approval for a named slice, implementation stops at documentation and review.

## Versioning

- **Version 1.0** — April 24, 2026 — Initial authoring against the Agent-Centric Product Design Framework
- Future revisions via PR with change log entries here


## GPT refinement addendum · Anchor hardening

This canon should be treated as a **product operating system**, not only a documentation set. The most important refinement is to make the anchor explicitly govern *runtime behavior*, *design quality*, and *implementation sequencing* across all surfaces.

### Non-negotiable platform requirements

Every AbarVa surface must satisfy these requirements before it is considered product-ready:

1. **Context-first agent behavior** — no agent may answer a work-object-specific question from raw prompt text alone.
2. **Visible grounding** — users must be able to see what context the agent used: work object, stage, pattern, artifact, uploaded file, evidence, value ledger, or governance state.
3. **Actionable next step** — every agent response must identify the next useful action unless the user explicitly asks for pure explanation.
4. **Confidence with reason** — confidence labels must be backed by context completeness, evidence coverage, and workflow readiness.
5. **Workflow-state awareness** — the same user prompt must produce different guidance depending on stage, gate, status, and missing inputs.
6. **No silent handoffs** — Sentinel, Atlas, Steward, and Nexus handoffs must be visible in response metadata or UI affordance.
7. **No fake completeness** — artifacts, scorecards, RFPs, roadmaps, and executive summaries must identify missing inputs and tier status.
8. **No generic dashboard pages** — every page must have an agent owner, work-object context, and explicit decision/action model.

### Operating distinction between design canon and Build Pack

Use this platform-design canon to define **shared rules across AbarVa**. Use product-specific Build Packs, such as AbarVa Source, to define **surface-specific implementation details**.

The relationship is:

```text
Platform canon = shared product operating principles
Product Build Pack = surface-specific UX, data model, workflow, and component specs
CYCLE_STATE.md = live operating state and committed queue
Implementation review packet = evidence that a slice followed the canon
```

If a product-specific Build Pack conflicts with this platform canon, the conflict must be called out and resolved before implementation. Product-specific exceptions are allowed only when documented in the product Build Pack and approved as deliberate deviations.

### Claude / Codex / GPT collaboration rule

When multiple agents or tools contribute to the product, they must follow this division of labor:

- **Product strategist / design reviewer** defines North Star, product bar, failure modes, and acceptance criteria.
- **Codex / implementation agent** executes approved slices only after specs and wireframes exist.
- **Claude / critique agent** may propose gaps, but proposals must be translated into the platform canon or product Build Pack before coding.
- **Crawler personas** verify product quality from the user perspective.

No coding agent should treat another model's critique as implementation approval. Critique becomes buildable only after it is converted into an approved spec, acceptance criteria, or CYCLE_STATE item.

### Canon readiness gate

A canon document is not complete because it is well-written. It is complete only when it answers:

- What behavior does this document enforce?
- What implementation mistake does it prevent?
- Which surface or agent consumes it?
- What test or crawler verifies it?
- What changes if the document is ignored?

Any canon file that cannot answer these questions should be revised before implementation proceeds.

## Status

AUTHORED-DRAFT. Pending founder review. Promotion to AUTHORED-LOCKED requires:

1. Founder review and mark-up
2. Revisions based on mark-up
3. Cross-check against all seven companion documents for consistency
4. Explicit founder sign-off
5. Version increment to 1.0-LOCKED

No implementation proceeds against this canon until it reaches AUTHORED-LOCKED.
