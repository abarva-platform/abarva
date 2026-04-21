# Graph Intelligence Architecture · Specification

**The connective tissue that turns AbarVa's data assets — client-specific seed data, benchmark and industry data, evidence chains, and cohort intelligence — into reasoning capability, through a knowledge graph that agents traverse to produce contextualized, defensible output.**

This spec exists because data alone is not intelligence. A pile of org charts, financial filings, patterns, and benchmarks becomes useful only when the relationships between them can be navigated, reasoned over, and cited. The knowledge graph is the layer that makes this navigation possible — and the graph is what separates AbarVa's reasoning from retrieval-based AI tools that can only answer questions by pulling documents.

The graph's value compounds over time. Every Program, every Intelligence research thread, every Atlas rollup adds edges. Every new pattern links to evidence. Every evidence item links to source. Every source links to the entity it describes. After one year, the graph is a measurable intellectual asset; after three years, it is a moat.

This spec defines the graph's entity model, edge semantics, traversal patterns, agent consumption model, provenance architecture, cross-tenant isolation, and operating characteristics.

Reads alongside:
- `docs/specs/platform/agent-architecture.md` — how agents query the graph
- `docs/specs/platform/administration-architecture.md` — Track C (Dataset Lifecycle) and Track E (Org Structure as Intelligence Input)
- `docs/specs/platform/benchmarks-industry-data-architecture.md` — the benchmark data layer the graph integrates
- `docs/specs/platform/data-layer-future-state.md` — the broader data platform context
- `docs/specs/_meta/seed-data/apex-retail-group-comprehensive-seed.md` — example entities and relationships

---

## Part 1 · Strategic Intent

### 1.1 · Why a knowledge graph

AbarVa faces a specific intelligence challenge: the platform must produce reasoning that is simultaneously (a) grounded in client-specific context, (b) enriched with industry and peer comparison, (c) traceable to source evidence, (d) consistent across conversations and surfaces, and (e) compounding over time as more Programs execute.

No single data structure handles all five requirements well. Relational databases handle (a) and (e) but struggle with the flexible cross-category relationships needed for (b) and (c). Document stores handle (c) but not (a) or (e) at scale. Vector stores support semantic retrieval but lack the structured reasoning needed for (a). A knowledge graph — specifically, a property graph with rich entity types and typed edges — addresses all five simultaneously.

The graph is where "this CFO says the AI investment is measurable" connects to "the CFO is new, joined in Q2" which connects to "the prior CFO was interim" which connects to "earnings calls reference the CFO transition" which connects to "analyst concerns noted in February" which connects to "peer companies are also facing measurability pressure on AI." No single query against a flat database produces this web of context. Graph traversal does.

### 1.2 · The positioning difference

Competing AI tools fall into three categories relative to graph intelligence:

- **Retrieval-based tools.** Pull documents based on semantic similarity. Cannot reason over relationships between entities.
- **LLM-only tools.** Rely on the model's parametric knowledge. No client-specific grounding.
- **Point-solution tools.** Have narrow graphs for specific domains (e.g., security tooling) but cannot cross-reference across strategic dimensions.

AbarVa's architectural differentiation is a cross-domain knowledge graph that spans clients, industries, people, initiatives, patterns, evidence, and time. The graph is the platform's reasoning substrate.

### 1.3 · What this architecture unlocks

Once the graph is in production:

- **Precise citation chains.** Every agent statement traces through the graph to source evidence. Users click through to audit.
- **Cross-client pattern detection (privacy-preserved).** Patterns that emerge across similar clients surface as signal without exposing any individual client's data.
- **Temporal reasoning.** "What changed in this organization's context in the last six months?" becomes a graph query rather than a document search.
- **Relationship-aware recommendations.** "Who needs to be involved in this decision?" resolves through the graph, not through prompting the LLM to guess.
- **Compound intelligence growth.** Each Program adds edges. The platform gets smarter with use.

---

## Part 2 · Entity Model

### 2.1 · Primary entity types

The graph organizes information into ten primary entity types, each with a defined schema, stable identifiers, and lifecycle management.

**Organizations.** Legal entities — companies, health systems, financial institutions, government bodies, regulators, vendors. Distinguished by canonical identifiers (ticker, EIN, CIK, NPI as applicable). Properties include industry classification, scale indicators, geography, corporate structure (parent/subsidiary relationships are edges, not properties).

**People.** Individuals associated with organizations. Distinguished by canonical identifiers where available (LinkedIn URI preferred when permitted, internal employee ID within a tenant, resolved entity ID across sources). Properties include role, tenure, background, VIP status, known statements, communication style attributes.

**Organizational Units.** Divisions, departments, business segments, regions within organizations. Distinguished by organization + unit name + type. Form the hierarchical backbone that people attach to.

**Roles.** Abstract role types (CFO, COO, Chief Medical Officer). Separate from specific role instances (the CFO of Apex on specific date). The Role entity enables cross-organization comparison ("what are Fortune 500 CFOs publicly saying about AI?") while specific instances hold person-specific data.

**Strategic Priorities.** Named strategic commitments, initiatives, plans. Can be organization-level ("Apex's three-pillar plan"), priority-level ("Pillar Two · Own More"), or initiative-level ("Owned Brand Portfolio Rationalization").

**Programs.** AbarVa engagement instances. Distinguished by tenant + program ID. Connect to sponsors, outcomes, deliverables, patterns, and Programs follow a phase lifecycle.

**Patterns.** Observable patterns detected or monitored in data. Can be client-specific ("the Apex Shadow AI $2.3M pattern"), cross-client ("the decision-latency-under-misaligned-KPI pattern"), or industry-general ("AI governance gap pattern in post-announcement banks"). Each pattern has severity, confidence, evidence chain.

**Evidence.** Specific claims or data points supporting patterns, assertions, or reasoning chains. Every evidence item traces to a Source.

**Sources.** Original data artifacts — filings, reports, documents, transcripts, emails, datasets, observations. Stable references to where information came from. Provenance foundation.

**Events.** Significant events at specific times — leadership changes, earnings releases, regulatory actions, market events, Program phase transitions. Events anchor temporal reasoning.

### 2.2 · Secondary entity types

Additional entity types supporting richer reasoning:

**Topics and Themes.** Abstract concepts the graph reasons about — "AI governance," "value-based care," "working capital." Topics provide a layer of abstraction that patterns and strategic priorities attach to.

**Geographies.** Geographic markets — states, metros, countries. Patterns and strategic priorities can be geography-scoped.

**Vendors and Products.** Technology vendors, products, services — linked to organizations through adoption relationships.

**Regulations and Frameworks.** Specific regulations, standards, and frameworks — SEC rules, CMS programs, industry standards.

**Benchmarks.** Named benchmark metrics with methodology and source.

**Research Items.** Research reports, analyst notes, academic papers, trade publication articles.

### 2.3 · Entity identity and merging

Entities must have stable, resolvable identity. The resolution layer:

- Uses canonical identifiers where available (tickers, CIKs, etc.)
- Uses normalized name matching with context for entities without canonical IDs
- Handles alternate names, translations, abbreviations, historical names
- Merges duplicate entities when identified (with full lineage preserved)
- Splits entities when discovered to be incorrectly merged (with full lineage preserved)

Entity resolution is not a one-time process. The resolution layer handles ongoing identity maintenance as new data arrives.

---

## Part 3 · Edge Model

### 3.1 · Edge design principles

Edges (relationships) are first-class objects, not just connections. Every edge has:

- Source entity and target entity
- Edge type (the nature of the relationship)
- Temporal scope (when does this relationship hold)
- Provenance (how we know this relationship)
- Confidence (how certain are we)
- Properties specific to the edge type

Edges can be directional or bidirectional depending on semantics. Most edges are directional.

### 3.2 · Core edge types

**Organizational edges:**
- OWNS (Organization → Organization) — parent/subsidiary
- INCLUDES (Organization → OrgUnit) — unit is part of organization
- IS_PART_OF (OrgUnit → OrgUnit) — hierarchical containment
- REPORTS_TO (Person → Person) — direct reporting
- WORKS_IN (Person → OrgUnit) — person is in unit
- HOLDS (Person → Role) — person holds role (temporal scope)

**Strategic edges:**
- COMMITS_TO (Organization → StrategicPriority) — organization has committed
- INCLUDES (StrategicPriority → StrategicPriority) — hierarchical priorities
- SPONSORS (Person → StrategicPriority) — person sponsors priority
- PARTICIPATES_IN (Person → Program) — person is involved in program
- ADDRESSES (Program → StrategicPriority) — program addresses priority
- ADDRESSES (Program → Pattern) — program responds to pattern

**Evidence edges:**
- SUPPORTS (Evidence → Assertion) — evidence supports claim
- CONTRADICTS (Evidence → Evidence) — evidence items disagree
- DERIVES_FROM (Evidence → Source) — evidence extracted from source
- CITES (Assertion → Evidence) — assertion cites evidence

**Pattern edges:**
- MANIFESTS_IN (Pattern → Organization) — organization exhibits pattern
- SIMILAR_TO (Pattern → Pattern) — patterns share characteristics
- CAUSED_BY (Pattern → Condition) — causal relationships
- OBSERVED_AT (Pattern → Event) — pattern observed at event

**Temporal edges:**
- HAPPENED_AT (Event → Time) — event timestamp
- PRECEDES (Event → Event) — temporal ordering
- CHANGED_FROM (State → State) — transition relationships

**Benchmark edges:**
- COMPARABLE_TO (Organization → Organization) — peer relationship
- MEMBER_OF (Organization → PeerSet) — organization in peer set
- RANKS_AGAINST (Organization → Benchmark) — performance relative to benchmark

**Cohort intelligence edges:**
- SHARES_PATTERN_WITH (CohortPattern → Organization) — aggregate cohort pattern (privacy-controlled)

### 3.3 · Temporal edges as primary data

Most edges have temporal scope. "Vincent Okafor is CEO of Apex" is a time-scoped assertion — true from October 2023 forward. The graph stores temporal scope on edges, enabling queries like "who was CEO of Apex in 2022?" to return the predecessor.

This temporal architecture is critical for:
- Historical analysis of transformations
- Tracking executive transitions
- Evaluating strategic plan evolution
- Understanding pattern emergence over time

---

## Part 4 · Traversal Patterns

### 4.1 · Common agent traversal patterns

Agents query the graph through reusable traversal patterns. Common patterns:

**Neighborhood expansion.** "Given entity X, return all entities within N hops satisfying condition Y." Used for context assembly — "given Program Z, return all sponsors, participants, evidence, patterns addressed."

**Shortest path.** "From entity A to entity B, what is the shortest meaningful path?" Used for relationship explanation — "how is this person connected to this initiative?"

**Pattern matching.** "Find subgraphs matching this structural pattern." Used for cross-client pattern detection — "find all organizations where a newly-appointed CFO is sponsoring an AI investment with publicly-committed measurability."

**Temporal traversal.** "Given entity X, show its state at time T, or the transitions between T1 and T2." Used for historical analysis and change detection.

**Evidence chain traversal.** "Given assertion A, walk up the evidence chain to all supporting sources." Used for citation generation.

**Cohort comparison traversal.** "Given pattern P in organization X, find similar patterns in other organizations in the same peer set." Used for benchmark reasoning (privacy-preserved).

### 4.2 · Query API

Agents access the graph through a query API that abstracts the underlying graph database. The API:

- Exposes traversal patterns as named queries with typed parameters
- Returns results with full provenance metadata
- Enforces tenant isolation and access controls
- Supports both single-query and multi-query operations
- Includes query cost hints for agent efficiency

Typical agent query flow:

1. Agent determines reasoning need (e.g., "understand the context around this executive")
2. Agent invokes traversal pattern with relevant entity
3. Query API returns graph subgraph with provenance
4. Agent synthesizes response using subgraph as structured context
5. Agent includes citations back to specific evidence nodes

### 4.3 · Query performance

Graph queries must return within reasonable latency to support interactive agent reasoning. Performance architecture:

- Hot cache for recent queries (agent conversations frequently revisit same entities)
- Pre-computed neighborhoods for popular entities (top executives, major initiatives)
- Efficient indexing on canonical identifiers
- Query cost estimation to prevent runaway traversals
- Result streaming for large subgraphs

Target: 95th percentile query latency under 200ms for common patterns.

---

## Part 5 · Provenance Architecture

### 5.1 · Every claim traces to source

The graph's provenance architecture ensures every assertion surfaced by agents can trace back to specific source evidence. The structure:

- Agent produces assertion
- Assertion cites evidence (graph edge)
- Evidence derives from source (graph edge)
- Source is a specific artifact with stable identifier (URL, document hash, API response snapshot)

Users can walk this chain from any agent statement to underlying source. In the Data Ground Truth surface, clicking any agent statement opens the provenance chain.

### 5.2 · Provenance for derived assertions

Many assertions are derived rather than directly cited. "Apex's inventory turn velocity is below peer average" is derived from:
- Apex's inventory turn data (evidence from internal dataset)
- Peer turn data (evidence from public filings)
- Peer set definition (rule, not evidence)
- Comparison methodology (rule, not evidence)

The graph represents derived assertions with chains of supporting evidence plus rules. Users can examine both the data inputs and the reasoning logic.

### 5.3 · Provenance versioning

Source data changes over time. Provenance must be versioned:
- Sources have revision history
- Evidence cites specific source version
- Assertions cite evidence with timestamp
- Re-running a query at different time may produce different assertions with different provenance

This versioning supports:
- Auditability of past claims ("why did Nexus say X in January?")
- Change detection ("has the evidence for this pattern changed?")
- Confidence degradation ("the evidence is now three months old; is the pattern still valid?")

### 5.4 · Contradicting evidence

When evidence items contradict, the graph represents both and flags the contradiction. Agents reasoning over contradictory evidence:

- Acknowledge the contradiction explicitly in output
- Weigh evidence by source reliability
- Propose resolution paths (refresh data, verify with Maestro, flag for investigation)

This honesty architecture is core to platform trust. Agents do not collapse contradictions silently; they surface them.

---

## Part 6 · Cross-Tenant Isolation

### 6.1 · Tenant data boundaries

Client-private data is strictly isolated at the tenant boundary:

- Apex tenant sees Apex-specific data
- Meridian tenant sees Meridian-specific data
- First Capital tenant sees First Capital-specific data
- No query from Apex tenant can traverse into Meridian-specific subgraphs

The graph architecture enforces this through tenant-scoped query contexts. Queries include the tenant identifier as a mandatory parameter; the query engine enforces that results contain only entities accessible to that tenant.

### 6.2 · Shared public data

Public data (peer filings, industry research, regulatory information) is shared across tenants:

- One physical representation of a 10-K filing; multiple tenants reference it
- Shared benchmark data and industry patterns
- Shared regulatory and market events

This sharing is explicit — data classified Public is designed to be shared; data classified Internal/Restricted/Confidential is not.

### 6.3 · Cohort intelligence as privacy-preserving abstraction

Cross-client pattern intelligence flows through a privacy-preserving abstraction layer:

- Raw tenant data never traverses tenant boundaries
- Aggregate patterns are computed in a separate pipeline with access to multiple tenant graphs
- Aggregate outputs are abstractions (bucket counts, typical ranges, directional trends) not individual values
- Minimum aggregation threshold (n=3 contributing tenants) enforced
- Value bucketing and rounding prevents re-identification
- Audit controls track cohort pattern access

A Nexus in Apex tenant can reference a cohort pattern like "retail organizations at this scale typically see 15-20% of announced AI investment flow to shadow tools within 12 months" — an aggregate statement derived from multiple clients but exposing no individual client data.

### 6.4 · Access control within tenant

Within a tenant, graph access is governed by the access control model from the Platform Administration Architecture:

- Users see entities consistent with their access grants
- Restricted and Confidential data requires appropriate grants
- Audit trails track access to sensitive entities

---

## Part 7 · Agent-Specific Consumption

### 7.1 · Nexus (Programs) consumption

Nexus queries the graph during conversation turns:

- At conversation start: neighborhood of sponsor + engagement topic + client context
- During reasoning turns: specific entity lookups, traversal for context, evidence retrieval
- At Phase transitions: comprehensive graph snapshot for Phase deliverable generation

Nexus consumes graph output as structured context in LLM prompts, typically serialized as a subgraph JSON plus summary narrative.

### 7.2 · Sentinel (Intelligence) consumption

Sentinel does deeper graph research:

- External entity exploration (peer companies, analyst commentary, regulatory context)
- Pattern discovery queries across large subgraphs
- Temporal analysis of evolving situations
- Cross-reference traversal for fact-checking

Sentinel's queries tend to be broader and deeper than Nexus's, often spanning multiple hops and multiple entity types.

### 7.3 · Atlas (Tower) consumption

Atlas aggregates across the portfolio:

- Portfolio-level graph snapshots
- Cross-client cohort traversals (privacy-preserved)
- Strategic environment queries
- Transformation velocity benchmarking

Atlas queries tend to be aggregate rather than specific-entity queries.

### 7.4 · Steward consumption

Steward uses the graph for administration:

- Entity existence checks
- Relationship audits
- Data completeness assessment
- Access pattern analysis

Steward's queries are metadata-heavy rather than content-heavy.

### 7.5 · Query budget per agent interaction

Graph queries have cost (compute, cache, latency). Agents have query budgets per interaction:

- Nexus turn: low budget, optimized for speed
- Nexus Phase deliverable generation: higher budget, more comprehensive context
- Sentinel research: high budget, broader traversal
- Atlas aggregate: highest budget, cross-tenant aggregates (when privacy-preserving)

Budget management prevents runaway queries and ensures consistent response times.

---

## Part 8 · Compounding Intelligence

### 8.1 · Graph growth dynamics

The graph grows along multiple dimensions:

- **Client addition.** New client tenant adds a new subgraph.
- **Program execution.** Each Program adds nodes (initiatives, patterns, evidence) and edges.
- **External data ingestion.** Continuous additions from filings, research, news.
- **Pattern discovery.** Agent-detected patterns create new pattern nodes linking existing entities.
- **User input.** Maestros add VIP profiles, initiative context, sponsor intel.
- **Temporal progression.** Events create new temporal nodes; relationships evolve.

### 8.2 · Measuring graph value

Graph value is measurable:

- Entity count (breadth of coverage)
- Edge density (relationship richness)
- Evidence coverage (percentage of assertions with citations)
- Cross-tenant pattern library size
- Temporal depth (how far back meaningful data extends)
- Freshness (how current is the graph)

These metrics are surfaced in the Atlas Tower view as indicators of the platform's compounding intelligence.

### 8.3 · The moat

After one year, the graph contains client-specific data from a growing portfolio, cross-client patterns, external context integration, and evidence trails from Programs. Competing tools starting from zero cannot replicate this in less than years of equivalent engagement history.

The graph becomes the intellectual asset that separates AbarVa from any tool that begins with the same LLM capabilities.

---

## Part 9 · Technical Architecture

### 9.1 · Graph database choice

Selected graph database should support:

- Property graph model (entities and edges both have properties)
- Efficient traversal queries with Cypher or similar query language
- Horizontal scalability for growing graph size
- ACID transactions for reliable writes
- Temporal query patterns (possibly with custom extensions)
- Integration with broader data platform (Snowflake, Databricks, vector stores)

Primary options: Neo4j, Amazon Neptune, TigerGraph, or cloud-managed equivalents.

### 9.2 · Graph construction pipeline

Graph is constructed from multiple sources through a pipeline:

- **Direct ingestion.** Structured data (org charts, filings) directly converted to graph elements
- **Extraction pipeline.** Unstructured data (documents, transcripts) parsed and extracted into entities and edges
- **Agent-generated updates.** Patterns and evidence identified by agents during Programs
- **Maestro authoring.** User-contributed additions through Steward-assisted workflows
- **Entity resolution layer.** Continuous maintenance of entity identity

### 9.3 · Read vs write separation

Read-heavy workload (agent queries) separated from write-heavy workload (ingestion and updates):

- Read replicas for query-serving
- Write pipeline for ingestion and updates
- Consistency considerations managed through eventual consistency with freshness tracking

### 9.4 · Vector and graph integration

Semantic retrieval (vector search) and graph traversal work together:

- Vector search for "find documents similar to this concept"
- Graph traversal for "find entities related to this entity in specific ways"
- Hybrid queries combining both

Typical pattern: vector search to identify relevant entities, graph traversal to expand context around them, then LLM synthesis using both.

---

## Part 10 · Phased Build

### 10.1 · Phase 1 · Demo-minimum (shipping for Prat demo)

Sufficient graph to support rich agent reasoning on the three composite clients:

- Core entity types (Organization, Person, OrgUnit, Role, StrategicPriority, Program, Pattern, Evidence, Source, Event)
- Core edge types (reporting, sponsorship, participation, evidence-support, pattern-manifestation)
- Three composite client subgraphs populated from seed data
- Basic traversal API for agent queries
- Provenance chains for demo-relevant assertions
- Entity resolution for seed data entities

Approximately 6-10 weeks of engineering.

### 10.2 · Phase 2 · Post-launch expansion (60-120 days)

- Extended entity types (Topic, Benchmark, Vendor, Regulation)
- Temporal edge architecture
- Cohort intelligence privacy-preserving pipeline
- Advanced traversal patterns
- Performance optimization
- Vector-graph hybrid queries

### 10.3 · Phase 3 · Ongoing compounding

- Continuous entity coverage expansion
- Pattern library growth
- Cross-tenant cohort intelligence refinement
- Graph quality metrics and active curation
- User-facing graph exploration capabilities

---

## Part 11 · Operational Considerations

### 11.1 · Monitoring

Graph health monitoring includes:

- Entity and edge count trends
- Query latency percentiles
- Resolution quality metrics (duplicate detection, merge accuracy)
- Data freshness by entity type
- Cohort pattern coverage

### 11.2 · Maintenance

Ongoing graph maintenance:

- Entity merges and splits as resolution improves
- Edge archival for outdated relationships
- Evidence refresh as sources update
- Pattern re-evaluation as data evolves
- Schema evolution as reasoning needs grow

### 11.3 · Backup and recovery

Graph is mission-critical intellectual property. Backup architecture:

- Continuous incremental backups
- Point-in-time recovery capability
- Cross-region replication
- Regular restoration testing

### 11.4 · Access observability

Graph queries are logged per tenant for:

- Access pattern analysis
- Security monitoring
- Performance optimization
- Audit trail support

---

## Part 12 · Summary

**What this architecture is:** The knowledge graph that connects AbarVa's data assets — client-specific seed data, benchmark and industry data, evidence chains, patterns, and cohort intelligence — into a reasoning substrate that agents traverse to produce contextualized, defensible output.

**What it unlocks:**
- Cross-domain reasoning that no flat database or retrieval system can match
- Precise provenance chains for every agent assertion
- Privacy-preserving cross-client pattern intelligence
- Temporal reasoning over organizational evolution
- Compounding intellectual property as the platform matures

**Why it matters for Prat:**
When Prat asks "how do you actually reason about my company?" the answer is: through a graph that connects your people to your initiatives to your patterns to your evidence to industry peers to regulatory context to time — and that graph gets smarter every time a Program runs. Competing AI tools don't have this. The graph is AbarVa's moat.

**What it enables in the demo:**
- Nexus's specificity about Apex's executives, initiatives, and patterns
- Sentinel's ability to research deeply and cite specifically
- Atlas's portfolio-level transformation velocity analysis
- Data Ground Truth surface's entity and relationship visualizations
- Provenance chains that let Prat audit any claim Nexus makes

**Companion specs:**
- Platform Administration Architecture (complete) — governance foundation the graph operates within
- Benchmarks and Industry Data Architecture (complete) — data source architecture the graph integrates
- Agent Architecture (complete) — how agents consume graph output
- Three composite seed data specs (complete) — the initial content that populates the graph
- Data Ground Truth Surface (complete) — user-facing view into the graph

---

**END OF DOCUMENT · GRAPH INTELLIGENCE ARCHITECTURE SPECIFICATION**
