# File 03 · Knowledge Layer Architecture Backlog

**Version:** 1.0 · April 23, 2026
**Owners:** Codex primary, Claude Code secondary (client-side integration points)
**References:** File 01 failure modes, File 02 pattern library architecture

**Status convention:** `BUILT` · `PARTIAL` · `MISSING` · `NEW-WORK`.

**Applies:** Agent Autonomy Charter. Pre-decided items in File 01 Section 15 and File 02 Section 13.

---

## Section 1 · Architectural premise

The knowledge layer is the substrate every agent reads from on every turn. Four stores coordinate: registry (metadata and routing), graph (relationships), vector (semantic search), Postgres (structured data and program state). Retrieval on every agent call is non-negotiable. The layer supports current-scale operation (four composite tenants, 33 demo-critical patterns) and is architected to scale to hundreds of tenants and thousands of patterns without fundamental redesign.

The knowledge layer is also the substrate that enables the flywheel. Every user interaction produces structured data. Over time, high-volume patterns accumulate enough interaction data to train specialized small language models. This file specifies both the current-scale implementation and the architectural commitments that preserve future-state optionality.

This file is primarily Codex's build. Claude Code's responsibility is integration points — how the client-side product reads from the knowledge layer and writes back to it.

---

## Section 2 · The four stores

### 2.1 · Registry

**Purpose:** Source of truth for pattern identity, metadata, versioning, and routing rules. Registry is the "table of contents" for the knowledge layer.

**Content stored:**
- Pattern identity (id, slug, tier, version, authored date)
- Pattern classification (phase, capability, vertical, use case, workflow type)
- Pattern activation triggers (phase match, deliverable match, keyword match)
- Pattern routing rules (if this pattern matches, route to which workflow)
- Pattern provenance (synthesis sources, validation tenants, curation approvals)
- Current production status (staged, production, deprecated)

**Implementation:**
- Postgres table `patterns_registry` as authoritative source
- JSON manifest exported on deploy (for fast read access and CDN distribution)
- Write-through cache for low-latency reads

**Queries supported:**
- Get pattern by id, slug
- List patterns by tier, phase, capability, vertical, use case
- List patterns activated by specific trigger conditions
- Get pattern version history

**Indexing:**
- Primary: `pattern_id`
- Secondary: `tier + phase`, `tier + capability`, `tier + vertical + use_case`
- Full-text: `name`, `description`

### 2.2 · Graph

**Purpose:** Stores relationships between patterns, programs, tenants, deliverables, decisions. Graph traversal enables "what else is related to this" queries that drive cross-linking, bidirectional tracing, and context expansion.

**Node types:**
- Pattern (links to registry)
- Program (specific program instance per tenant)
- Tenant
- Deliverable (specific deliverable instance per program)
- Decision (specific decision point)
- Evidence (specific evidence source)
- Stakeholder (per tenant)

**Edge types:**
- `SOURCED_FROM` — deliverable sources from pattern
- `APPLIED_IN` — pattern applied in program
- `RELATED_TO` — pattern related to pattern (bidirectional)
- `APPLICABLE_TO_TENANT` — pattern applicable to tenant (given profile)
- `PREREQUISITE_OF` — deliverable prerequisite for deliverable
- `DOWNSTREAM_OF` — deliverable downstream of deliverable
- `DECIDED_IN` — decision made in deliverable
- `EVIDENCED_BY` — claim evidenced by evidence source
- `ASSIGNED_TO` — deliverable assigned to stakeholder
- `CONTRIBUTED_BY` — observation contributed by program back to pattern

**Implementation:**
- Postgres with Apache AGE extension OR dedicated graph store (Neo4j)
- Current-scale: Postgres+AGE is sufficient; scales to several million edges
- Future-scale: consider Neo4j or similar if query latency degrades

**Queries supported:**
- Get all programs applying this pattern
- Get all patterns applied in this program
- Get related patterns N hops away
- Get all deliverables sourced from this pattern
- Get bidirectional traversal (pattern → program → pattern → related patterns)

### 2.3 · Vector store

**Purpose:** Semantic search over unstructured content. When a user describes a problem in natural language, the vector store matches it against pattern descriptions, prior programs, and evidence sources to surface semantic matches that the registry's structured routing might miss.

**Content indexed:**
- Pattern descriptions (full text of each pattern)
- Pattern observation cards (composite scenarios and learnings)
- Deliverable content (for similarity search across prior work)
- Evidence source abstracts
- Intake conversation history (for "have we heard this problem before" matching)

**Implementation:**
- Pinecone (current commitment per technical stack)
- Embeddings model: OpenAI text-embedding-3-large or similar; configurable
- Namespace strategy: separate namespaces per tier for performance (patterns/tier-1, patterns/tier-2, patterns/tier-3, deliverables, evidence)

**Queries supported:**
- Semantic match of user input to patterns (top-k with relevance scores)
- Semantic match of user input to prior similar programs
- Semantic match of deliverable draft to prior deliverables (for pattern-suggest and similarity flagging)

**Scale considerations:**
- Current: thousands of embeddings
- Seed scale: tens of thousands
- Series A scale: hundreds of thousands (with selective shard strategy)

### 2.4 · Postgres (program and tenant state)

**Purpose:** Authoritative structured data for tenants, programs, phases, deliverables, decisions, timeline, evidence, user state. This is the transactional store — where all state changes happen. Registry is a specific schema within Postgres; graph can also live in Postgres with AGE.

**Core schemas:**

**Tenant schema:**
- `tenants` — tenant identity and metadata
- `tenant_profiles` — AI maturity, data readiness, organizational profile
- `tenant_users` — users per tenant with roles and permissions

**Program schema:**
- `programs` — program instances with current phase, archetype, sponsor
- `program_phases` — phase-specific state and advancement timestamps
- `program_state_log` — append-only log of state changes
- `program_approvals` — approval records with audit trail
- `program_timeline` — chronology of decisions and events

**Deliverable schema:**
- `deliverables` — deliverable instances with tier (Rich/Outline/Stub)
- `deliverable_content` — structured content per deliverable
- `deliverable_approvals` — approval state and history
- `deliverable_cross_references` — links to patterns, evidence, prerequisites, downstream

**Evidence schema:**
- `evidence_sources` — evidence items with provenance
- `evidence_citations` — citation instances linking deliverables to evidence
- `counterfactual_registry` — pre-registered counterfactual methodologies

**Pattern interaction schema:**
- `pattern_interactions` — user interactions with pattern-driven content
- `pattern_feedback` — categorized feedback for pattern refinement
- `pattern_outcomes` — outcome data from programs that used patterns (Phase 5)

**Control Tower schema:**
- `pressures` — active pressure cards
- `pressure_actions` — actions taken on pressures
- `portfolio_health` — aggregated state across programs
- `stall_detection` — detected stalls per program

---

## Section 3 · Retrieval pipeline

The retrieval pipeline is the architecture's heart. It runs on every agent turn. It assembles context from the four stores into the LLM's input.

### 3.1 · Trigger

Every agent method that generates a user-facing response triggers retrieval. Includes:
- Opening prompt generation (user lands on a page, agent composes the opening)
- Response to user input (user types or clicks a guided choice)
- Proactive prompt surfacing (agent notices idle state, surfaces a suggestion)
- Deliverable generation (agent produces a Rich deliverable)
- Cross-agent handoff (agent hands conversation to another agent with context)

### 3.2 · Pipeline stages

**Stage 1 — Context identification.**

Read current state from Postgres:
- Which tenant, which user, which program, which phase, which deliverable
- What the user just did (the attention event or input)
- What the conversation history in this surface shows

Output: a structured context descriptor.

**Stage 2 — Registry routing.**

Query the registry for patterns activated by current context:
- Tier 1 patterns for current phase and activity type
- Tier 2 patterns for current capability context
- Tier 3 pattern for current program's use case

Output: list of pattern identifiers with activation rationale.

**Stage 3 — Graph expansion.**

Traverse the graph from the identified patterns:
- Related patterns (RELATED_TO edges)
- Prior programs that applied these patterns (APPLIED_IN edges)
- Cross-tenant observations (CONTRIBUTED_BY edges, anonymized)

Output: expanded pattern list plus relational context.

**Stage 4 — Vector match.**

If the user's input is natural language, vector-search for semantically similar content:
- Similar problem descriptions (for pattern-suggest)
- Similar prior deliverable content (for cross-program similarity)
- Similar evidence sources

Output: semantic matches with relevance scores.

**Stage 5 — Tenant data pull.**

Query Postgres for tenant-specific context:
- Tenant profile and readiness indicators
- Tenant's current program portfolio
- Tenant's historical pattern usage
- Tenant's stakeholder roster

Output: tenant context block.

**Stage 6 — Program state pull.**

Query Postgres for program-specific context:
- Current program state (phase, gate status, open decisions)
- Recent activity (last 5 significant events)
- Pending items (deliverables awaiting approval, tasks assigned)
- Risk register state
- Decision log recent entries

Output: program state block.

**Stage 7 — Composition.**

Combine outputs from stages 1-6 into LLM context:
- System prompt (agent's voice contract per File 04)
- Pattern intelligence (structured data from identified patterns)
- Graph context (related patterns and prior programs, anonymized where cross-tenant)
- Semantic matches (prior similar content)
- Tenant context
- Program state
- Conversation history (bounded — last N turns)
- User's current input

Output: fully assembled context window.

**Stage 8 — Generation.**

Call the LLM with the assembled context. Model selection per operation type:
- High-stakes generation (Phase 3 decision memo, business case): frontier model (Claude Opus 4.7 or equivalent)
- Conversational prompts: frontier model
- Routine completion: frontier model (for now; could shift to SLM post-scale)
- Bulk draft generation (Outline deliverables): potentially smaller/faster model

Output: generated response.

**Stage 9 — Citation injection.**

Post-process the response to inject visible citations:
- Pattern citations where claims rely on pattern priors
- Evidence citations where claims rely on evidence sources
- Cross-program citations where claims reference comparable prior work

Output: response with structured citations.

**Stage 10 — Delivery and logging.**

Deliver response to user. Simultaneously:
- Log the pattern IDs used (for usage tracking and feedback association)
- Log the query context (for debugging and learning)
- Start tracking the user's subsequent interaction for feedback capture

### 3.3 · Latency budget

The retrieval pipeline must be fast enough that users don't experience drag.

- Stages 1-6 (data retrieval): target <200ms total
- Stage 7 (composition): <50ms
- Stage 8 (LLM call): 2-8 seconds depending on generation length
- Stages 9-10 (post-processing): <100ms

Total user-visible latency: 2-8 seconds for most interactions, dominated by the LLM call. Retrieval infrastructure is not the bottleneck.

Caching strategy:
- Pattern content cached aggressively (patterns update rarely)
- Tenant data cached per-session (updates invalidate)
- Program state pulled fresh (high change rate)
- Graph expansion cached per-pattern-combination

### 3.4 · Failure modes and handling

**Pattern registry unavailable:** agent operates with cached patterns, flags degraded mode.

**Graph query timeout:** agent proceeds without graph expansion, logs for retry.

**Vector store unavailable:** agent falls back to registry-only routing; semantic matching degraded.

**Postgres unavailable:** agent cannot proceed; return graceful error to user.

**LLM unavailable:** agent falls back to secondary model provider or returns graceful error.

Health monitoring per store with alerting on degradation.

---

## Section 4 · Feedback capture pipeline

When users interact with agent-generated content, the interactions flow back to the knowledge layer as structured feedback. This is the flywheel mechanism.

### 4.1 · What gets captured

**Explicit feedback:**
- User accepts a recommendation (positive signal)
- User rejects a recommendation (negative signal with optional reason)
- User modifies a recommendation (refinement signal)
- User rates a pattern suggestion (thumbs up/down or qualitative)

**Implicit feedback:**
- User spends significant time reading a specific section (attention signal)
- User re-asks the same question differently (dissatisfaction signal)
- User escalates to different agent or human help (complexity signal)
- User skips a proactive prompt (irrelevance signal)

**Outcome feedback:**
- Program reaches Phase 5 with outcome data (value signal)
- Program stalls at specific phase (friction signal)
- Deliverable is revised after approval (quality signal)

### 4.2 · Feedback routing

Each feedback event is captured with:
- Pattern ID(s) involved
- User (anonymized to role where appropriate)
- Tenant (anonymized in cross-tenant flow)
- Context (phase, deliverable, specific moment)
- Feedback type
- Feedback content
- Timestamp

Routed to:
- Pattern's feedback queue (for curator review)
- Analytics store (for aggregate pattern performance)
- Pattern refinement queue (when signal strength crosses threshold)

### 4.3 · Curator review workflow

The human curator (initially Anand) reviews accumulated feedback per pattern. Workflow:

- Daily / weekly digest of pattern feedback by pattern
- Per feedback item: accept (flows to refinement), reject (noise), needs-investigation
- Accepted feedback batched into pattern version updates
- Pattern version update triggers re-validation before production deployment

### 4.4 · Anonymization layer

Cross-tenant flow requires anonymization. Specific rules:

- Tenant names redacted or composited ("a composite integrated delivery network with MA-heavy payer mix" rather than "Meridian Health")
- Individual stakeholder names redacted
- Specific dollar amounts generalized (ranges or percentiles rather than specifics)
- Specific vendor references checked for sensitivity (named vendor feedback requires explicit tenant approval)
- Client-specific data never leaves the tenant boundary; only pattern-level observations do

Anonymization enforced at the pattern refinement step before deployment.

### 4.5 · Anti-patterns to prevent

**Pattern rot:** patterns become outdated because feedback isn't incorporated. Prevent with cadence: every pattern reviewed at minimum quarterly.

**Feedback bias:** loud users dominate signal. Prevent with user diversity weighting in feedback aggregation.

**Overfitting:** patterns become too specific to a few tenants' experience. Prevent with cross-tenant diversity requirement for high-confidence claims.

**Silent drift:** patterns change without version tracking. Prevent with strict versioning and provenance chain.

---

## Section 5 · Provenance chain

Every claim in every pattern traces to its source. Every response from the agent traces to the patterns it used. Every pattern version traces to the feedback and evidence that produced it.

Provenance enables:
- Defensibility: a CFO questioning a recommendation can see what evidence underlies it
- Debugging: a wrong answer can be traced to the flawed source
- Learning: patterns that accumulate strong provenance become defensible as category-leading intelligence
- Audit: regulatory or customer audit can verify the basis of claims

### 5.1 · What gets tracked

**Pattern claims:** every claim in a pattern (diagnostic prior, decision prior, failure mode, intervention success rate) links to source evidence. Sources can be:
- Published research (academic paper, industry report)
- Composite program observation (from which composite tenants, at what scale)
- Real program outcome (anonymized, with tenant consent)
- LLM synthesis (with explicit flagging)
- Expert curation (with named curator)

**Pattern versions:** each version change tracks what feedback drove it, what evidence was added, what curator approved it.

**Agent responses:** each response logs the patterns it used, the specific priors it cited, the evidence sources cited.

**Deliverable content:** each piece of deliverable content tracks the patterns that shaped it and the evidence base it draws from.

### 5.2 · Provenance storage

- Source evidence stored in Postgres with stable IDs
- Pattern claim-to-evidence mapping stored with pattern content
- Agent response-to-pattern mapping stored with conversation log
- Deliverable-to-pattern-and-evidence stored with deliverable

### 5.3 · Provenance rendering

Users see provenance when it matters:
- Evidence citation chips (E1, E2) in deliverables link to underlying evidence
- Pattern citations in agent responses link to pattern detail
- Pattern versions surface on pattern detail pages
- Agent can be asked "why do you think that?" and produces the provenance chain

Provenance is not decorative. It's the mechanism by which the product's credibility is auditable.

---

## Section 6 · Cross-tenant learning architecture

This is the flywheel at the architecture level. How emergent intelligence flows from one tenant's completed programs to refinements in patterns available to all tenants.

### 6.1 · The flow

1. Tenant A's program completes Phase 5 with attested outcomes
2. The program's Phase 5 deliverables include extracted learnings
3. Learnings are categorized: confirms existing pattern priors, contradicts existing priors, surfaces new pattern-worthy observation
4. Confirmations update the pattern's confidence level (more evidence = higher confidence)
5. Contradictions flag for curator review (is the prior wrong, or is this tenant an outlier?)
6. New observations create candidate patterns or new contextual amplifiers
7. Anonymization layer processes outgoing contributions
8. Pattern version increments; provenance chain extends
9. Updated pattern flows to all tenants using it
10. Tenant B, using the same pattern, benefits from Tenant A's experience

### 6.2 · Trust gradient

Not all contributions have equal weight. The trust gradient:

- **Curated real observations:** highest trust. Real program outcomes with pre-registered counterfactuals, attested, reconciled.
- **Composite observations:** medium trust. Patterns built from composite scenarios informed by real-world data but not attested outcomes.
- **LLM-synthesized from published sources:** medium trust with explicit flagging. Useful for bootstrapping; not defensible alone.
- **User-modified in-session:** low trust until corroborated. A single user's modification doesn't update pattern priors; requires multiple corroborations.
- **Unvalidated LLM outputs:** not trusted. Flagged for review; doesn't enter production without curator approval.

Trust level stored per claim. Agent responses include trust level implicitly (high-trust claims stated with confidence; lower-trust claims qualified).

### 6.3 · Anonymization in cross-tenant flow

Specific rules for what crosses tenant boundaries:

**Flows across tenants:**
- Pattern prior updates (numeric values, frequency distributions)
- Observation abstractions ("programs of type X with characteristics Y showed outcome Z")
- Contextual amplifier discoveries ("this pattern is more effective when tenant has characteristic W")

**Never crosses tenants:**
- Specific tenant identity
- Specific individual stakeholder names
- Specific dollar amounts or proprietary metrics (without explicit consent)
- Specific vendor names attached to specific tenant experiences
- Any data the tenant has marked as confidential

**Requires explicit consent:**
- Named tenant references in pattern case studies
- Specific outcome numbers (usually generalized)
- Specific stakeholder quotes

Anonymization enforced at the curator review step. Patterns with potentially-tenant-identifying content are flagged before deployment.

### 6.4 · Tenant consent model

Tenants consent at program start to:
- Pattern library usage (they use it)
- Anonymous aggregated learning (their patterns contribute back)
- Composite-level case study participation (optional)
- Named case study participation (opt-in with explicit approval per case)

Consent stored at tenant level and per-program level. Cross-tenant flow respects the consent boundary.

---

## Section 7 · Path to SLMs

The future-state that makes the flywheel the moat that compounds toward $10B+ valuation. Not required for demo or seed. Specified here to preserve architectural optionality.

### 7.1 · The progression

**Phase A (current):** All agent generation uses frontier LLMs (Claude Opus 4.7, GPT-5-class). Patterns provide retrieved context, but the generation itself is generalist.

**Phase B (post-Seed, at volume):** High-volume patterns have accumulated thousands of structured interactions. Pattern-specific fine-tuning of smaller models becomes economically viable. Specialized models trained on pattern-specific domains — owned-brand margin recovery, ambient clinical workflows, AMS vendor optimization. Each specialized model runs cheaper and faster than the generalist and produces output that's measurably better in the specific domain.

**Phase C (Series A+):** Multiple specialized SLMs cover the high-volume pattern domains. Agent routing logic determines which model to use based on the pattern context. Specialized models for the bulk of work; frontier models reserved for cross-domain composition, high-stakes synthesis, novel situations. Cost economics improve dramatically; response quality improves in specific domains.

**Phase D (at scale):** Model partnership with Anthropic or OpenAI or equivalent. AbarVa's structured interaction data (properly curated, anonymized, governed) becomes training data for partnership models that neither party could produce alone. This is the valuation driver.

### 7.2 · Architectural commitments that preserve this optionality

**Structured data at every interaction.** Every user interaction produces structured data in the pattern interaction schema. Over time this data volume grows; the structure means it's training-ready when volume supports it.

**Pattern-scoped data segmentation.** Interaction data is segmented by pattern. When a pattern becomes training-candidate, its data is isolable without cross-pattern contamination.

**Provenance and curation infrastructure.** Provenance tracks what data is trustworthy for training. Curation pipeline can filter training data by trust level.

**Model-agnostic generation interface.** The generation layer is behind an interface that accepts any model. Frontier LLMs today; SLMs later; hybrid routing future. No hardcoded model dependencies.

**Anonymization layer production-grade.** The anonymization that enables cross-tenant learning is the same anonymization that enables partnership training. Building it right for the cross-tenant flow prepares for the partnership future.

### 7.3 · What not to build now

Avoid overbuilding for the SLM future before it's needed.

Do not build:
- Local training infrastructure
- Custom model hosting
- SLM-specific deployment pipelines
- Pattern-model mapping at the agent routing level

Build instead:
- Infrastructure that preserves optionality (data structure, provenance, anonymization, model-agnostic interface)
- The flywheel mechanics that generate the training data
- The curation discipline that keeps data training-ready

When SLM training becomes economically viable (probably 18-24 months out), the infrastructure to build on will be there.

---

## Section 8 · Current state and gaps

**Registry:** Partial. Pattern registry exists per PR history. Schema may not fully match the specified metadata (File 02 Section 7). Status: **PARTIAL**.

**Graph:** Partial. Bidirectional tracing exists per PR #108. Broader graph query support unclear. AGE extension usage status unclear. Status: **PARTIAL**.

**Vector store:** Unclear current status. Pinecone integration planned per technical stack. Status: **MISSING** likely.

**Postgres schemas:** Partial. Core program and tenant schemas likely exist. Pattern interaction schema likely missing. Counterfactual registry likely missing. Status: **PARTIAL**.

**Retrieval pipeline:** Partial. Some retrieval happens; uniform retrieval-on-every-turn likely not implemented. Status: **PARTIAL**.

**Feedback capture pipeline:** Missing. No user interaction feedback routing. Status: **MISSING**.

**Provenance chain:** Partial. Evidence citations exist in D17 as visual pattern; systematic provenance tracking across patterns and responses likely missing. Status: **PARTIAL**.

**Cross-tenant learning:** Missing. No contribution flow. Status: **MISSING**.

**Anonymization layer:** Missing. No structured anonymization discipline in the data flow. Status: **MISSING**.

**Path to SLMs:** Architectural commitments partially in place but not comprehensive. Status: **NEW-WORK**.

---

## Section 9 · Priority sequencing

### P0 — Demo-critical

- Retrieval pipeline uniformly implemented for every agent turn
- Registry fully matching metadata schema
- Graph supporting all edge types required for bidirectional tracing
- Vector store operational with pattern content indexed
- Postgres schemas for program, tenant, deliverable, evidence, pattern-interaction
- Provenance chain visible in agent responses via citations
- Basic feedback capture (at minimum: pattern usage logged per response)

### P1 — Seed-critical

- Feedback capture pipeline complete with curator review workflow
- Cross-tenant learning architecture implemented with anonymization
- Counterfactual registry for Phase 5 attestation integrity
- Stall detection logic feeding Tower pressures
- Pattern versioning with provenance chain

### P2 — Series A

- Performance optimization for scale (caching strategy, query optimization)
- Cross-tenant learning at higher volumes
- Automated pattern refinement from aggregated feedback (with curator approval)
- Enhanced observability (per-pattern performance metrics)

### P3 — Post-Series A

- SLM training pipeline infrastructure
- Model-agnostic routing for specialized vs. frontier generation
- Partnership training data preparation
- Advanced anonymization techniques (differential privacy, federated learning)

---

## Section 10 · Implementation discipline

### 10.1 · Codex ownership

- All four stores and their schemas
- Retrieval pipeline infrastructure
- Feedback capture pipeline
- Provenance chain infrastructure
- Cross-tenant learning flow
- Anonymization layer
- Model-agnostic generation interface

### 10.2 · Claude Code ownership

- Integration points from UI (how pages call the knowledge layer)
- Pattern citation rendering in deliverables and agent responses
- Attention event emission from UI components to feedback capture
- User-facing feedback affordances (thumbs up/down, "tell us more")

### 10.3 · Shared discipline

- Every agent method that produces user-facing content goes through retrieval pipeline
- Every UI component that could provide feedback emits structured feedback events
- Every PR on knowledge-layer code references the failure modes it addresses and patterns it touches
- Schema changes require explicit migration scripts with rollback support

### 10.4 · Performance discipline

- Retrieval pipeline latency monitored; degradation triggers investigation
- LLM costs tracked per pattern usage; high-cost patterns flagged for optimization
- Cache hit rates tracked; sub-optimal caches re-tuned
- Database query performance monitored; slow queries indexed or restructured

### 10.5 · Integrity discipline

- Every pattern content change goes through curator review
- Every cross-tenant contribution goes through anonymization check
- Every production deployment goes through validation on composite tenant data
- No direct writes to production knowledge layer without approval workflow

---

## Section 11 · Acceptance criteria

**For retrieval pipeline:**
- Every agent turn across all four agents executes retrieval
- Retrieval latency <300ms at p95 for non-LLM stages
- Patterns cited in at least 80% of substantive responses
- Crawler comparison test shows substantive difference vs. default Claude

**For feedback capture:**
- Every user interaction with agent-generated content is captured as structured feedback
- Feedback flows to pattern-specific queues
- Curator review workflow produces weekly pattern refinement batch

**For provenance:**
- Every claim in every deliverable traces to specific evidence
- Every pattern version has complete provenance chain
- Users can query "why do you think that?" and receive provenance answer

**For cross-tenant learning:**
- Completed programs contribute observations back with anonymization
- Pattern priors update based on accumulated observations (quarterly cadence minimum)
- No cross-tenant data leakage detected in integrity tests

**For SLM path:**
- Structured data accumulation in pattern-scoped form
- Model-agnostic generation interface in place
- Clear documentation of what would change to introduce specialized models

---

## Section 12 · Pre-decided items

- Postgres as authoritative store
- Apache AGE for graph (current-scale) with option to migrate to Neo4j at higher scale
- Pinecone for vector store
- OpenAI embeddings for current vector indexing (configurable)
- Frontier LLMs via API for current generation (Claude Opus 4.7 primary)
- Registry schema mirrors metadata schema from File 02 Section 7 exactly
- Every agent turn executes retrieval — no exceptions
- Anonymization enforced at curator review step before production deployment
- No direct writes to production knowledge layer without curator approval
- Cross-tenant consent respected per tenant setting
- Provenance chain non-negotiable

---

## Section 13 · One-line handoff

> Four stores (registry, graph, vector, Postgres) coordinate. Retrieval on every agent turn is non-negotiable. Ten-stage pipeline from context identification through delivery with logging. Feedback capture from every user interaction. Provenance chain for every claim. Cross-tenant learning with anonymization. SLM-path architectural optionality preserved. P0 demo-critical scope specified. Apply autonomy charter.

---

*End of File 03 · Knowledge Layer Architecture Backlog.*
