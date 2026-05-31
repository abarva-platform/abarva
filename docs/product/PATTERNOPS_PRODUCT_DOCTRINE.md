# PatternOps Product Doctrine

PatternOps is AbarVa's quiet knowledge operating layer. It should not make users feel they are training an AI model. It should make the product feel like every Move, artifact, workshop, evidence record, and verified outcome can improve future guidance with governance and human approval.

The product loop is:

Use the product -> generate artifacts -> capture evidence -> verify outcomes -> promote useful patterns -> agents get smarter.

## Product Principle

PatternOps exists so Nexus, Sentinel, Atlas, Source, and Tower can advise from trusted context instead of generic model priors.

Every agent should be able to answer:

- What does AbarVa know about this industry, function, use case, phase, and failure mode?
- What client evidence did the agent use?
- What patterns are trusted enough to influence advice?
- What evidence is missing?
- What artifact or gate should the user complete next?

PatternOps is not a standalone destination first. It starts as a control layer surfaced through Intelligence, Moves, Source, Tower, and Setup/Admin.

## V1 Product Capabilities

### Pattern Library / Knowledge Control Plane

Surface under Intelligence or Setup/Admin. It shows what AbarVa knows by:

- Industry and vertical
- Enterprise area: front office, middle office, back office, enterprise
- Function and process area
- Use case and AI/agentic architecture pattern
- KPIs, value levers, and data requirements
- Human-in-the-loop controls
- Failure modes and guardrails
- Required artifacts and workshops
- Strategic Move phases
- Source basis, confidence, and last review status

The user experience should answer: what does AbarVa know, where is coverage strong, where are gaps, and which patterns are trusted enough for agents to use?

### Pattern Readiness / Coverage Map

PatternOps should make corpus strength visible. A CXO or Maestro should see a simple coverage map across industry, enterprise area, function, process area, and use case.

Coverage should be honest:

- Strong: enough trusted patterns to guide recommendations with confidence
- Moderate: useful patterns exist but gaps or stale areas remain
- Weak: preliminary guidance only; steward review or external research needed

This transparency builds trust. AbarVa should never pretend to know a domain deeply when the corpus is thin.

### Pattern Promotion Workflow

Every completed Move, artifact, decision, workshop output, or verified outcome can become a reusable pattern only through review.

Promotion states:

1. Draft pattern
2. Reviewed pattern
3. Trusted pattern
4. Retired pattern
5. Superseded pattern

Promotion captures:

- Problem solved
- Client context
- AI / agentic design pattern
- Data required
- Workflow change
- Human and agent roles
- KPIs improved
- Failure modes avoided
- Artifacts used
- Evidence and source basis
- Confidence level
- Applicable industries, functions, use cases, and phases

No automated pattern creation should be trusted without review.

### Agent Grounding Panel

Agent answers should have a small basis drawer behind "Why is Nexus saying this?" or the equivalent for each module.

The drawer should show:

- Client facts used
- Industry patterns used
- Prior Move patterns used
- Benchmarks or external sources used
- Evidence artifacts used
- Confidence
- Missing inputs

This is the trust layer for executive users. It should be available without cluttering the main answer.

### Missing Pattern / Gap Detection

When AbarVa lacks enough trusted patterns, the agent should say so and guide the next step.

Allowed actions:

- Request upload
- Ask for SME review
- Suggest external research
- Mark a corpus gap
- Create a pattern-building task

The agent should say, for example: "Financial Services back-office model-risk governance patterns are incomplete. I can provide a preliminary structure, but this should be reviewed before it is used as decision guidance."

## Architecture Layers

### Layer 1 — Canonical Pattern Model

All pattern sources map into a canonical contract:

- Industry
- Enterprise area
- Function
- Process area
- Use case
- AI / agentic architecture pattern
- Human role
- Agent role
- Data requirements
- KPIs
- Value levers
- Failure modes
- Guardrails
- Artifacts
- Workshops
- Applicable phase
- Source basis
- Confidence
- Last reviewed
- Owner
- Lifecycle status

This is the core data model.

### Layer 2 — Pattern Crosswalk

Current assets include TypeScript seeds, manifests, genome patterns, canonical patterns, corpus patterns, knowledge docs, tenant facts, and Move artifacts. PatternOps must crosswalk them instead of duplicating them blindly.

The crosswalk tracks:

- Existing pattern ID
- Canonical pattern ID
- Source type and path
- Duplicate risk
- Confidence
- Owner

This prevents corpus sprawl.

### Layer 3 — Retrieval Discipline

Before an agent answers, retrieval follows this order:

1. Move context
2. Client facts and evidence
3. Phase pack
4. Industry / function / use-case patterns
5. Cross-industry analogs
6. Architecture patterns
7. Failure modes and anti-patterns
8. Required artifact templates
9. Missing inputs and confidence

This order belongs in code, not only in prompt wording.

### Layer 4 — Feedback and Learning Loop

After every Move or artifact, PatternOps should capture:

- Was the output accepted?
- Was it edited heavily?
- Did the Move advance?
- Did the value materialize?
- Did a pattern help?
- Was a recommendation wrong?
- Did the user upload better evidence?

Feedback can update pattern confidence, create review tasks, or retire weak patterns.

## UI Placement

Start small:

- Intelligence: Knowledge Coverage, Pattern Explorer, Sentinel Brief
- Moves: Pattern Basis drawer, required patterns for the phase, Promote to Pattern
- Source: sourcing pattern basis, vendor diligence gaps, contract clause pattern basis
- Tower: value and outcome pattern reuse, realized-vs-projected pattern feedback
- Setup/Admin: Corpus Health and Review Queue

Avoid a heavy knowledge-admin product in v1.

## What Not To Build Yet

Do not start with:

- Pattern marketplace
- Complex ontology editor
- Heavy manual tagging UI
- Automated trusted pattern creation without review
- Large admin workflow

## V1 Build Sequence

1. Canonical Pattern Contract
2. Pattern Coverage Dashboard
3. Pattern-first Retrieval
4. Pattern Basis Drawer
5. Pattern Promotion Workflow
6. Corpus Health / Review Queue

## Highest Principle

Every Move should make the platform smarter. Every recommendation should be grounded. Every pattern should be traceable. Every gap should be visible.

PatternOps turns the knowledge layer into a living product asset.
