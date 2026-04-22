# AbarVa Data Layer · Future State Specification

**The intelligence infrastructure that makes AbarVa uncopyable.**

This spec is distinct from the three product specs (Programs, Intelligence, Tower) and the Agent Architecture spec. Those specs describe *what the agents do* and *what the surfaces show*. This spec describes *what the data layer underneath knows, how it learns, and how it gets smarter with every engagement.*

It is written for three audiences:

**Engineering** needs it to make the right architectural choices when graduating from "three relational databases that share a client_id" to a typed knowledge graph with traversable evidence provenance and learned cohort similarity. The phased implementation plan in Packet 7 tells Claude Code exactly when each piece comes online.

**Investors** (specifically the Shail Jain conversation and the Anthropic Anthology Fund pitch afterward) need it to evaluate defensibility. The current AbarVa pitch leads with market sizing — "Harvey AI at $11B for legal, we do enterprise transformation at $800B." That argument is replicable. A specified data layer architecture adds a second defensibility anchor: the Transformation Genome as a typed knowledge graph with learned cohort similarity and traversable evidence provenance. *Every client engagement makes every future engagement smarter — not via shared prompts, via shared structure.* That argument is much harder to replicate.

**Design partners** (Prat first, Shail second) need it to feel a genuine wow that's not available from Gartner, from their internal data teams, from their existing tech stack, or from any competitor's current AI product. The retail benchmark catalog in Packet 6 is specifically designed to make a Fortune 50 retail CTO lean forward. That's the near-term acid test.

## Document structure

Seven packets across three tracks.

**Track A · Current state and vision** (Packet 1)
1. What exists today · four specific gaps · what innovative thinking means for AbarVa · the defensibility story

**Track B · Architecture** (Packets 2-5)
2. Typed knowledge graph · entities, relationships, projections, technology choice
3. Embedding and retrieval strategy · per-agent corpora, chunk strategies, rerankers
4. Genome lifecycle + evidence provenance · pattern maturity, anonymization, confidence propagation
5. Cohort similarity v2 · from categorical filters to learned weighted similarity, retail deep-dive

**Track C · External data + delivery** (Packets 6-7)
6. Industry data stitching + the retail benchmark catalog · what Prat cannot get anywhere else
7. Phased implementation · pre-design-partner through network-effects scale · investor pitch framing

## Relationship to existing specs

This spec **extends** the three product specs without contradicting them. The relational data models specified in Tower Packet 12, Programs Packet 8, and Intelligence Packet 7 remain valid as *projections of the graph*, not the graph itself. No schema migration required pre-design-partner. The graph layer graduates onto the existing schema when implementation begins.

Any moment where this spec does suggest a near-term change to an existing spec, it is explicitly flagged with `⚠️ AFFECTS [spec]` so the reconciliation is visible. There are two such moments in this document. Both are post-design-partner decisions, not demo-blocking.

---

# PACKET 1 · Current State, Gaps, and the Defensibility Story

## 1.1 What exists today

Across the three product specs, the data layer is:

- **Tower Packet 12.3:** 7 Tower-specific tables (signals, signal_events, attestations, metric_observations, cohort_benchmarks, tower_integrations, uploads) + 6 engagement extension columns. Standard Postgres with RLS on every table using `app.current_client_id`.

- **Programs data model:** engagements, persons, teams, team_memberships, turns, relationship_notes, client-specific views. Also standard Postgres. Claude Code tonight verified idempotency across the migration chain 001-042.

- **Intelligence data model:** Thread storage, research findings, Intelligence product invocations, Genome pattern references. Less specified than the other two, but structurally similar.

- **Three agent retrieval layers:** Agent Architecture Packet 2.4 specifies "embedding search over agent-specific corpus" for Nexus and Sentinel, and "not used — real-time query-based" for Atlas. That's three sentences where there should be thirty pages.

- **The Genome:** Referenced as "shared cross-agent substrate" in all three specs. Design is at FAQ-level — a table of pattern records with evidence weights, keyword-filterable, cited by agents when relevant. How patterns get in, how they age out, how contradictions reconcile, how they earn or lose weight — undefined.

- **Cohort benchmarks:** Computed via categorical filter joins — *"industry = retail AND revenue_band = $10B-$50B AND workforce = 50K-100K"* — and materialized into a table. Transparent about n and labeled clearly, but computed as filter-and-average rather than similarity-weighted.

This is competent. It's adequate for the Prat demo at n=1 real client with composite seeded peers. It is also **what every competitor in the AI consulting tooling space is building**. Nothing in the list above is uncopyable.

## 1.2 Four specific gaps

### Gap 1 · No graph primitive

Everything is tabular with foreign keys. The relationships that matter most to AbarVa's value proposition are graph questions, not table questions.

Three examples:

*"Priya Sethi sponsored Contact Center AI at Apex Retail, which is in Phase 5. She has also sponsored three prior AI programs across two employers. Her sponsorship pattern correlates with 88% on-time gate closures."* — relational, joinable, but brutally expensive at scale and semantically opaque.

*"This Genome pattern has been applied in 12 engagements across 4 clients in retail. In the 9 that succeeded, the cohort shared these 6 characteristics. In the 3 that failed, they shared these 4 contradicting characteristics."* — fundamentally a subgraph-matching problem. Expressible in SQL with enough CTEs and window functions, but not the native shape of the question.

*"This vendor appears in 18 use cases across 6 clients. Trustworthiness scores for engagements using this vendor have declined from mean 84 (2024) to mean 71 (2026). Root cause candidates: cross-reference with shipped features, pricing changes, alternative vendors that emerged."* — requires temporal graph traversal with propagation.

None of these is impossible in Postgres. All of them are unnatural in Postgres, and the unnaturalness compounds. Competitors using pgvector + standard RLS are effectively competing at the same layer AbarVa is competing at. A proper graph primitive changes that.

### Gap 2 · Embedding strategy is undefined

Sentinel's retrieval says "embedding search over agent-specific corpus." Over what content? Chunked how? Against which embedding model? Reranked by what signal?

The right answers differ by corpus:

- **Program artifacts** (charters, diagnosis decks, build plans) need semantic chunking along section boundaries with overlap, embedded with a model tuned for enterprise prose, reranked by recency and phase relevance.

- **Maestro observations and decision logs** need dense retrieval with a small-chunk granularity because they encode judgment calls that don't survive summarization.

- **Genome patterns** need multi-vector representations — one vector per dimension (problem, context, solution, evidence, outcome) — so that similarity can be computed per-dimension when matching against a query context.

- **Public research sources** (industry reports, case studies) need hybrid retrieval (BM25 + dense) because enterprise research queries often contain specific numbers and acronyms that pure dense retrieval smears.

None of this is specified today. When Claude Code implements Sentinel in Milestone 4, it will make arbitrary choices that will be hard to reverse later. The cost of specifying this now is a week of design. The cost of un-specifying it after six months of accumulated embeddings is a multi-month re-indexing project.

### Gap 3 · Cross-client intelligence is hand-waved

The Genome is the asset that supposedly makes AbarVa's intelligence compound. The current specification is about 200 words total across three spec files. It describes the *intent* clearly. It does not describe:

- **Who decides when a pattern is mature enough to enter the library.** Automated threshold? Maestro review? Committee? All three at different stages?

- **What the anonymization pipeline is.** k-anonymity over which attributes? Does "Fortune 50 retailer" always generalize to "large retailer" in the Genome, or does the specificity survive because it's actionable?

- **How patterns earn and lose evidence weight over time.** When a pattern correctly predicts an outcome in a new engagement, does its weight increase? When it's contradicted, does it lose weight, fork into two competing patterns, or get marked "contested"?

- **How contradictory patterns reconcile.** If one pattern says "consolidate AI suppliers" and another says "maintain vendor diversity," what does Sentinel do when both match a client context?

- **How patterns age out.** A pattern from 2023 about LLM vendor economics is probably wrong in 2026. The Genome needs temporal semantics, not just accumulation.

- **How evidence provenance actually flows.** When a pattern cites 7 sources, are those sources versioned? If one source is retracted or updated, how does the pattern's confidence change?

Each of those is a design decision, not a tooling choice. They determine whether the Genome is a living intelligence asset that compounds or a glorified FAQ that accumulates.

### Gap 4 · Industry data stitching is generic

Sentinel's current corpus — "industry reports (licensed) and public case studies" — is how every consulting firm builds its knowledge base. That's not innovation. That's table stakes.

The innovation opportunity is in the **stitching**. Given a specific client context — industry, sub-industry, revenue band, workforce size, regulatory profile, stack maturity, AI investment stage, organizational structure, governance posture, competitive position — what patterns from the available corpus are actually relevant, and with what weights?

Today that's a filter query. Tomorrow it should be a learned similarity model that gets better every time a pattern successfully transfers (or fails to transfer) across a client boundary. That is genuinely novel in the consulting tooling space.

## 1.3 What "innovative thinking" actually means for AbarVa

Three shifts distinguish a learning intelligence layer from a well-organized content library.

**Shift 1 · Graph as source of truth, relational as projection.**

Not "also use Neo4j." The shift is conceptual: entities and typed relationships are the primary data model. Relational tables are *materialized views* over the graph, optimized for specific UI surfaces. Agents query the graph directly. This is the architecture Palantir pioneered in the ontology era and what Harvey AI is almost certainly doing at its core.

**Shift 2 · Evidence as a traversable property, not a label.**

Every claim in the system — every artifact statement, Genome pattern, signal detection rule, cohort benchmark — has a provenance trail. *"This claim depends on these three other claims, which depend on these seven sources, four of which were attested by named humans, three of which are algorithmic inferences from these observations."* Trustworthiness becomes computed from the provenance graph, not declared in a column. When an upstream source is retracted, confidence propagates through the graph automatically.

**Shift 3 · Cohort matching as similarity-over-graph, not filter-over-table.**

Cohort benchmarks today: *"industry = retail AND revenue_band = $10B-$50B"* → filter → average. Cohort benchmarks tomorrow: a weighted similarity score across 14+ dimensions, with weights learned from which historical comparisons produced the best predictions. This is the Palantir ontology + Harvey AI retrieval + graph-RAG research pattern, applied to the enterprise transformation domain.

## 1.4 The defensibility story (and why it matters for Shail)

Current AbarVa pitch anchor: *"Harvey AI is $11B doing for legal what we do for enterprise transformation. Same structure. Their category $500B. Ours $800B. Nobody has touched it."*

This is a market-sizing argument. It's compelling. It is also replicable — any founder with a consulting background can make the same claim about the enterprise transformation category.

Add a second anchor: *"The Transformation Genome is a typed knowledge graph with learned cohort similarity and traversable evidence provenance. We're not wrapping Claude — we're building the intelligence infrastructure that compounds with every engagement. In 18 months, this is uncopyable. In 36 months, any competitor arriving from zero has a data-network-effect moat to overcome."*

This is a defensibility argument. It is much harder to replicate because it requires:

- A clear ontological framework for the enterprise transformation domain
- A working anonymization and attribution pipeline that preserves actionability
- Enough real client engagements to have learned the cohort similarity weights that matter
- An evidence provenance graph that has survived contact with real disputes
- A published research program (Anand's proprietary differentiator) that validates the patterns publicly

None of those can be built in six months by a well-funded competitor. All of them compound with time. The data layer is the defensibility story.

## 1.5 What creates genuine "wow" for Prat

Prat Vemana has seen every enterprise AI pitch in the market. He runs one of the largest retail tech organizations in North America. His team includes people who have built their own internal platforms that do chunks of what AbarVa promises. What makes him lean forward in a 20-minute demo window?

Five categories of wow, each mapped to a data layer capability:

**Wow 1 · Knowledge he cannot get from his own data team.** Cross-client cohort intelligence — specifically, how retail peers at Fortune 50 scale are structuring their AI portfolios. Not "industry averages" he can get from Gartner. Specifics — *"Your 7 closest retail peers in the Genome have an average of 34 managed use cases, median $18M spend, 72% attestation freshness, and 3 of them have quietly sunset LLM marketing copy programs in the last 18 months due to brand voice drift."*

**Wow 2 · Invisible structure made visible.** Portfolio-level contradiction detection across pillars — the insight that a use case has high adoption, high cost, attested value, *and* has been flagged for bias review but no one has connected those dots because they live in four different tools. Requires graph traversal.

**Wow 3 · Agent reasoning that is transparent without being trivial.** Click on any claim Sentinel makes → see the evidence provenance trail → see which sources are strong, which are thin, which were retracted. Drill through three hops before hitting "this is a direct Maestro observation from an attested engagement outcome." That transparency is defensive against the "is it hallucinating?" question every CTO asks.

**Wow 4 · Dots connected across domains he thinks of as separate.** "Your planned Pricing AI program will likely face the same organizational-readiness issue that caused three retail peers to stall theirs in 2024. Specifically: merchandising orgs with traditional buyer-planner structures need 60-90 days of data literacy investment before ML-generated prices get trusted. Your org has the buyer-planner structure." That insight blends the Genome's cross-client pattern with his client-specific org data. Requires graph stitching.

**Wow 5 · Implications he hasn't considered.** "You asked about LLM vendor consolidation. Here's the thing you didn't ask: 4 of your 7 peers that consolidated in 2024 had to re-diversify within 18 months because the primary vendor's rate limits became the bottleneck for their highest-value use cases. The right question isn't 'should we consolidate' but 'what's our commitment structure such that we can move fast when we need to.'" That's reframing power — and it requires the cohort intelligence to know what happened to the peer group over time.

Every one of those wows is a data-layer capability, not a UI feature. They cannot be faked with a pretty dashboard. They require the Genome, the graph, the cohort similarity, and the evidence provenance to exist.

## 1.6 The scope of this spec

This document specifies the data layer *architecture* and *phasing*, not the line-by-line implementation. For each layer (graph, embeddings, Genome, cohort similarity, industry data stitching), the spec specifies:

- What it is and why it exists
- The core schema or algorithm
- How it interacts with the existing product specs
- Which phase of AbarVa's scale it comes online in
- What would be lost if it were skipped or deferred

The spec does not prescribe specific tooling choices (Neo4j vs Apache AGE vs Puppygraph; sentence-transformers vs Cohere vs Voyage; pgvector vs Qdrant vs Pinecone). Those choices are made in Packet 7 with acceptance criteria that Claude Code can execute against.

## 1.7 Decisions locked in Packet 1

| # | Decision | Rationale |
|---|---|---|
| 1.L1 | Data layer is a distinct system from the surface-specific data models | Agents query the data layer; surfaces project from it |
| 1.L2 | Four specific gaps identified (no graph, embedding strategy undefined, Genome hand-waved, industry stitching generic) | Honest current-state assessment |
| 1.L3 | Three shifts define innovation: graph-as-truth, evidence-as-property, similarity-over-graph | Each is ontologically different from the current approach |
| 1.L4 | Defensibility story anchored to data layer, not UI or market sizing | Uncopyable in the relevant time horizon |
| 1.L5 | Five wow categories for Prat, each mapped to data layer capability | Design target is specific, measurable |
| 1.L6 | Spec specifies architecture and phasing, not line-by-line tooling | Tooling choices deferred to Packet 7 |
| 1.L7 | Post-design-partner trigger for implementation; pre-design-partner is design-only | Demo isn't blocked; work is parallelizable |

---

## Packet 1 · Checkpoint

**STATUS · Track A, Packet 1 of 7 complete**

Current state assessed, four gaps named, three shifts defined, defensibility story articulated, five wow categories for Prat specified. Ready for Packet 2 (typed knowledge graph architecture).

---

# PACKET 2 · The Typed Knowledge Graph

## 2.1 The core architectural shift

Today's data model: relational tables with foreign keys. The "graph" you can construct from joining tables is implicit, brittle, and asymmetrically expensive — client-to-engagement is a cheap join, cross-client pattern matching with evidence traversal is five CTEs.

Tomorrow's data model: **a typed knowledge graph is the primary store. Relational tables are materialized projections over the graph, optimized for specific UI surfaces.** Agents query the graph directly for reasoning-heavy operations; surfaces query the projections for fast reads.

This matches how Palantir's ontology framework works, how Harvey AI almost certainly structures its legal knowledge graph, and how modern graph-RAG architectures separate "semantic substrate" from "access patterns." It is genuinely different from the way every current AI consulting product is built.

## 2.2 Why this matters concretely

Three queries that are trivial in a graph and brutal in relational:

**Query A · "Show me the cohort of retail peers whose Contact Center AI programs had similar sponsor profiles and similar phase-3 diagnosis artifacts to Apex Retail's, and compare their Phase 6 trustworthiness scores a year post-handoff."**

Relational: Join `engagements` → `persons` (sponsors) → similarity filter on person_profile → join `artifacts` → text-similarity filter on Phase 3 content → join `engagement_state` → window function over 365-day window → aggregate trustworthiness. Each step has a separate embedding lookup and a separate similarity threshold. Multi-hundred-line SQL with correctness landmines.

Graph: `MATCH (apex:Engagement)-[:SPONSORED_BY]->(s:Person)-[:SIMILAR_TO*0..1]->(peer_s:Person)<-[:SPONSORED_BY]-(peer:Engagement)` where peer is in retail cohort, peer has completed Phase 6, then traverse `peer-[:HAS_STATE]->(state:EngagementState)-[:TRUSTWORTHINESS_AT]->(score)`. Dozens of lines, semantically clean.

**Query B · "When this claim about LLM consolidation changes — because a new source either supports or refutes it — what other claims in the system need their confidence recomputed?"**

Relational: Nearly impossible without a separate dependency-tracking table, which then has to be maintained by application code on every write. Fragile.

Graph: Every claim node has `SUPPORTED_BY` edges to source nodes. Confidence propagation is a graph traversal with a damping function. When a source changes, a single `MATCH` query finds every affected claim in one hop.

**Query C · "For every vendor appearing in 3+ engagements across our client base, trend their trustworthiness score over time and surface the top 5 with the steepest decline."**

Relational: Requires a vendor-centric view that has to be materialized and maintained. Vendors today don't have their own table — they're strings in `engagements.vendor`. Building this query requires refactoring vendor into a first-class entity.

Graph: Vendors are nodes from the start. This query is three lines.

## 2.3 Core entity types

Fifteen entity types in the v1 ontology, organized by domain. Every entity has a stable ID, a type label, a set of typed properties, and edges to other entities.

### Client domain

- **Client** — a tenant organization. Properties: name, industry_code, sub_industry, revenue_band, workforce_size, regulatory_profile, stack_profile, geography, cohort_tags.
- **Person** — an individual (client-side or AbarVa-side). Properties: name, title, role_type, relationship_to_client, profile_embedding, contribution_history.
- **Team** — a grouping of Persons. Properties: name, client_id, team_type (executive / delivery / advisory).

### Engagement domain

- **Engagement** — a Program or use case. Properties: name, function, objective, archetype, lifecycle_stage, current_phase, charter_version.
- **Phase** — a stage within an Engagement. Properties: phase_number, entered_at, exited_at, gate_status.
- **Artifact** — a document produced in a Phase. Properties: type (charter, diagnosis_deck, solution_architecture, etc.), version, content, content_embedding, authored_by, reviewed_by.
- **Decision** — a locked decision in an Engagement. Properties: decision_text, locked_at, locked_by, rationale.

### Portfolio domain

- **Signal** — a Tower-detected contradiction. Properties: severity, contradiction_type, detected_at, confidence, status.
- **Metric** — a quantitative observation. Properties: metric_key, value, unit, observed_at.
- **Attestation** — a named human's sign-off on a claim. Properties: attester, attested_at, signature_hash, claim_scope.

### Intelligence domain

- **Thread** — a Sentinel research thread. Properties: title, state (active / paused / promoted / archived).
- **Pattern** — a Genome pattern. Properties: name, domain, maturity_state, applicable_phases, summary_embedding, dimension_embeddings (multi-vector).
- **Source** — an external research source. Properties: title, publisher, published_at, accessed_at, content, version, retraction_status.
- **Framework** — a named strategic framework (Porter's Five Forces, JTBD, etc.). Properties: name, domain, application_contexts.

### Market domain

- **Vendor** — an AI tool or platform provider. Properties: name, category, pricing_model, tenancy_model.
- **Industry** — an industry node with sub-industry hierarchy. Properties: industry_code, parent_industry, characteristics.

## 2.4 Core relationship types

Relationships are typed and often have properties. Thirty relationship types in v1, grouped by semantic role.

### Structural relationships

- `PART_OF` (Engagement → Client, Team → Client, Phase → Engagement)
- `BELONGS_TO_INDUSTRY` (Client → Industry)
- `MEMBER_OF` (Person → Team)

### Role relationships

- `SPONSORED_BY` (Engagement → Person) · property: role (sponsor / co-sponsor / executive-sponsor)
- `OWNED_BY` (Engagement → Person) · property: role (operational-lead / delivery-lead)
- `MAESTRO_FOR` (Person → Engagement) · property: tenure
- `REVIEWS` (Person → Artifact) · property: review_status, reviewed_at

### Production relationships

- `PRODUCED_IN` (Artifact → Phase)
- `REFERENCES` (Artifact → Artifact) · property: reference_type (derived_from / cites / updates)
- `LOCKED` (Decision → Phase) · property: gate_closing (boolean)

### Intelligence relationships

- `SUPPORTED_BY` (Claim → Source) · property: evidence_weight (strong / moderate / weak)
- `CONTRADICTS` (Pattern → Pattern) · property: contradiction_type, resolution_status
- `DERIVED_FROM` (Pattern → Engagement) · property: anonymization_level
- `APPLIES_TO` (Pattern → Industry, Pattern → Phase) · property: applicability_strength
- `MATCHES_CONTEXT` (Pattern → Engagement) · property: match_score, matched_at
- `USES_FRAMEWORK` (Thread → Framework, Artifact → Framework)

### Signal relationships

- `AFFECTS` (Signal → Engagement)
- `DETECTED_BY` (Signal → DetectionRule)
- `TRIGGERED_ACTION` (Signal → Engagement) · property: action_type (originated / triaged / suppressed)
- `ATTESTS_TO` (Attestation → Claim, Attestation → Metric)

### Market relationships

- `DEPLOYS_VENDOR` (Engagement → Vendor) · property: contract_type, monthly_cost, seat_count
- `SIMILAR_TO` (Client → Client) · property: similarity_score, dimension_weights (JSONB)
- `COMPETES_WITH` (Client → Client) · property: competitive_distance
- `COHORT_MEMBER_OF` (Client → Cohort) · property: membership_strength

### Temporal relationships

- `SUCCEEDED_BY` (Pattern → Pattern) · property: reason (refinement / contradiction / replacement)
- `AGED_OUT_BY` (Pattern → Pattern) · property: reason (industry_change / technology_shift / new_evidence)

### Provenance relationships

- `DEPENDS_ON` (Claim → Claim) · property: dependency_strength
- `RETRACTED_BY` (Source → Source) · property: retracted_at, reason
- `VERIFIED_BY` (Claim → Attestation) · property: verification_strength

## 2.5 A worked retail example

Consider Sentinel answering the question *"Should Apex Retail consolidate its LLM vendors?"*

The graph traversal Sentinel runs:

1. `MATCH (apex:Client {name: 'Apex Retail Group'})-[:BELONGS_TO_INDUSTRY]->(retail:Industry)` — anchor the client.

2. `MATCH (apex)-[:SIMILAR_TO*0..1]->(peer:Client)-[:DEPLOYS_VENDOR]->(v:Vendor {category: 'LLM'})` — find cohort peers and their LLM vendors.

3. For each peer, traverse `(peer)-[:HAS_ENGAGEMENT]->(e:Engagement)-[:HAS_DECISION]->(d:Decision)` where `d.decision_text CONTAINS 'vendor consolidation'` or `'vendor diversification'`.

4. For each such decision, follow `(d)-[:LOCKED]->(phase)` to identify when the decision was made, and `(d)-[:LED_TO]->(outcome:Metric)` to identify the outcome.

5. Cross-reference with Genome: `MATCH (p:Pattern)-[:APPLIES_TO]->(retail) WHERE p.domain = 'vendor_strategy'` to pull curated patterns.

6. Compute weighted similarity between Apex's context and each peer's context at decision time, using the `SIMILAR_TO` relationship's `dimension_weights` property.

7. Return the set of decisions with outcomes, sorted by similarity weight, with provenance edges intact.

What Sentinel presents to the user:

*"Looking at your 7 closest retail peers in the Genome: 4 consolidated LLM vendors in 2024-2025. 3 of those 4 subsequently re-diversified within 18 months — primary reasons were rate-limit bottlenecks on highest-volume use cases (2 cases) and strategic lock-in concerns (1 case). The 4th is still consolidated; their context differs in two ways from yours: lower total LLM spend ($6M vs your projected $12M) and a single dominant use case. Your context is more similar to the 3 that re-diversified. This is a moderate-evidence signal — the cohort is small (n=4) and dynamics change rapidly in LLM markets. Want me to surface the specific decision logs?"*

That response is only possible because:
- Clients, Engagements, Decisions, and Outcomes are graph nodes with stable identities
- `SIMILAR_TO` relationships with dimension weights exist
- Genome patterns are first-class entities with `APPLIES_TO` edges
- Evidence weights live on edges, not as nullable columns on rows
- The query traverses 6 hops with correctness preserved

Today's relational schema requires hundreds of lines of SQL to approximate that, and the approximation loses the provenance trail.

## 2.6 Projection pattern · graph + tables coexist

The commitment to graph-as-truth does not mean abandoning relational tables. It means inverting which is authoritative.

**Today** (and throughout the demo period):
- Relational tables are authoritative.
- Graph structure is implicit in foreign keys.
- Queries are SQL.

**Post-design-partner Phase 1:**
- Graph is authoritative for cross-cutting reads (Genome matching, cohort similarity, provenance traversal).
- Relational tables are materialized projections for surface-specific fast reads (Tower dashboard, Programs page load).
- Writes go to both, atomically, via an application-layer abstraction.

**Post-Phase-1 (scale):**
- Graph is authoritative for all reasoning queries.
- Relational projections are regenerated from the graph on schedule (hourly / daily depending on surface).
- Surface-specific read patterns are encoded as graph views (in Apache AGE) or materialized view tables (in Postgres).

The migration path is additive. Existing Postgres tables keep working. New graph structures are introduced alongside, and the application layer gradually shifts reads from tables to graph where it wins.

## 2.7 Technology recommendation

Three realistic options for the graph primitive itself:

**Option A · Apache AGE (PostgreSQL graph extension).**
Pros: Native Postgres, no new database infrastructure, same RLS policies apply to graph data, ops burden is zero-delta. Query via openCypher embedded in SQL. Scales with Postgres, which scales to tens of millions of nodes without much tuning.

Cons: Graph-specific optimizations (path-finding, community detection) are less mature than Neo4j. Advanced algorithms may need to be reimplemented.

**Option B · Neo4j.**
Pros: Industry-standard, mature ecosystem, best-in-class query planning for deep traversals. Cypher is the canonical graph query language.

Cons: Additional database to run, RLS story is different (role-based not row-level), ops burden doubles. Network egress and synchronization between Neo4j and Postgres become engineering overhead.

**Option C · Puppygraph (or similar "graph view over relational").**
Pros: No new database; translates Cypher queries to federated SQL across the existing tables. Zero data migration.

Cons: Query performance is bounded by the underlying SQL query plan. Deep traversals (5+ hops) degrade. Provenance traversal specifically is expensive.

**Recommendation: Apache AGE.**

Rationale: AbarVa is a small team without dedicated ops. The Postgres-native path preserves RLS model continuity, tenancy guarantees, and backup/recovery operational knowledge. Most of AbarVa's graph workloads are 3-5 hops with cohort similarity, not 10+ hop community detection. AGE handles that well. If a future specific workload benefits from Neo4j-grade traversal (unlikely pre-Series A), migration is feasible because the ontology lives in the code, not the database.

⚠️ **AFFECTS** Tower Packet 13 · Claude Code build pack. When Tower M2 begins implementing contradiction detection across pillars, the design should already assume Apache AGE is the graph primitive so contradiction rules can be written as graph queries, not SQL joins. This is a Milestone 2 decision, not a Milestone 1 decision.

## 2.8 RLS over graph

The tenancy model must extend to graph data. Every node belongs to exactly one Client (or is Platform-generic for Genome / Industry / Framework / public Source nodes). Every edge is inherently scoped to the intersection of its endpoint nodes' tenancies.

Implementation pattern (Apache AGE specific):

- Every node has a `client_id` property (or `NULL` for Platform-generic).
- Graph query functions are wrapped in SECURITY DEFINER functions that filter results by `app.current_client_id`.
- Cross-tenant queries (e.g., cohort similarity) are permitted only for nodes with `client_id = NULL` (anonymized) or when explicit cohort-opt-in is recorded.

This matches the existing three-tier data classification (Client-private / Anonymized cohort / Platform-generic) from Tower Packet 4.8.

## 2.9 Schema evolution without pain

New entity types and relationship types will emerge. The design philosophy:

- **Additive schema evolution.** New node types and edge types are introduced via migrations that add, never rename. The ontology version is pinned per deployment and visible in the graph.

- **Deprecation, not deletion.** An obsolete edge type is marked `deprecated_in: v2.3` and kept in the graph indefinitely. Agents query the current edge type; historical queries can traverse deprecated edges with awareness.

- **Ontology versioning.** Each node stores the ontology version at write time. Changes to semantics (e.g., `SIMILAR_TO` weights changing meaning) are handled by versioning the relationship, not mutating it.

## 2.10 Decisions locked in Packet 2

| # | Decision | Rationale |
|---|---|---|
| 2.L1 | Typed knowledge graph is the primary data store; relational tables are projections | Matches how reasoning queries naturally shape |
| 2.L2 | Apache AGE for the graph primitive | Preserves Postgres-native ops, RLS continuity |
| 2.L3 | 15 entity types, 30 relationship types in v1 ontology | Comprehensive coverage of Programs/Intelligence/Tower domains |
| 2.L4 | RLS extends to graph via client_id property on every node + SECURITY DEFINER functions | Tenancy guarantees preserved |
| 2.L5 | Projection pattern: graph authoritative, tables materialized for surface reads | Agents query graph; surfaces query projections |
| 2.L6 | Additive schema evolution with ontology versioning | No destructive migrations |
| 2.L7 | Evidence lives on edges, not as nullable row columns | Enables provenance traversal |
| 2.L8 | Cohort similarity is a first-class edge type with learned weights (elaborated Packet 5) | Graph-native cohort matching |

## 2.11 Open decisions for later packets

- Specific embedding model per node type (Packet 3)
- Multi-vector representation for Pattern nodes (Packet 3)
- Genome pattern maturity state transitions (Packet 4)
- Cohort similarity weight learning algorithm (Packet 5)
- External source ingestion pipeline (Packet 6)
- Phase at which graph becomes authoritative (Packet 7)

---

## Packet 2 · Checkpoint

**STATUS · Track B, Packet 2 of 7 complete**

Typed knowledge graph ontology specified. 15 entity types, 30 relationship types, technology choice locked (Apache AGE), projection pattern defined, RLS extension designed, additive evolution philosophy. Ready for Packet 3 (embedding and retrieval strategy).

---

# PACKET 3 · Embedding and Retrieval Strategy

## 3.1 Why retrieval strategy is not one-size-fits-all

"Embedding search over an agent-specific corpus" is the current spec language. It's inadequate because different content shapes have different retrieval requirements, and forcing them all through the same pipeline degrades each one.

Three examples of why shape matters:

**A Program artifact** (charter, diagnosis deck, build plan) is 5-50 pages of structured prose with section headers, numbered decisions, and explicit gate criteria. The right chunk boundary is section-aware. The right embedding model is tuned for enterprise prose. The right reranker cares about phase relevance and recency.

**A Maestro observation** (a single sentence or paragraph of judgment captured mid-engagement) is one sentence of compressed experience. Chunking doesn't apply. The embedding needs to be fine-grained because the judgment encodes a call that's lost in summarization.

**A Genome pattern** is a multi-dimensional object: it has a problem framing, a context, a solution approach, evidence, and an outcome record. Similarity between a client context and a pattern's context is often asymmetric — the client's problem framing may match while the solution's feasibility does not. A single vector representation collapses these dimensions.

The data layer strategy is: **different corpora, different retrieval pipelines, unified access interface.**

## 3.2 Corpus inventory · what gets embedded

Five distinct corpora, each with its own retrieval pipeline.

### Corpus 1 · Program artifacts

Source: `Artifact` nodes tied to `Engagement` nodes in the graph. Primary content in Programs spec.

Content characteristics: Long-form structured prose, section-delimited, phase-scoped.

Chunking: Section-aware with 512-token chunks, 64-token overlap. Chunk metadata preserves section title, phase, artifact type, engagement_id.

Embedding model: A general-purpose embedding model tuned for enterprise prose (Voyage AI `voyage-3-large` or Cohere `embed-english-v3.0` are current candidates). Dimension 1024.

Retrieval: Dense retrieval with graph-structure reranking. After top-50 dense match, apply graph-aware rerank: boost chunks from the same engagement, same phase, same vendor, same Maestro.

Use case: Nexus answering "what did we decide in Phase 3 about vendor selection?" — dense retrieval over artifacts filtered to this engagement's Phase 3, with graph-aware rerank pulling in cross-artifact references.

### Corpus 2 · Decision logs and Maestro observations

Source: `Decision` nodes and Maestro-logged observations on `Engagement` nodes.

Content characteristics: Short-form, judgment-heavy, high semantic density per token.

Chunking: None — each decision or observation is its own retrieval unit.

Embedding model: The same enterprise prose model, but with instruction-tuning for short judgment texts (prompt: "Represent the strategic judgment in this observation").

Retrieval: Dense retrieval with recency and similarity-of-context reranking.

Use case: Nexus surfacing "we saw this issue before; the Maestro's call last time was X" when a similar situation arises mid-Program. High-value because judgment doesn't survive typical summarization.

### Corpus 3 · Genome patterns (multi-vector)

Source: `Pattern` nodes in the graph.

Content characteristics: Multi-dimensional objects. Each pattern has five semantically distinct dimensions:
- **Problem framing** (what question the pattern addresses)
- **Context** (what conditions the pattern applies in)
- **Solution approach** (what the pattern recommends)
- **Evidence** (what grounds the pattern)
- **Outcome** (what happened when applied)

Chunking: None — each dimension is its own vector.

Embedding model: The same enterprise model applied per dimension.

Retrieval: Multi-vector retrieval. A query (typically a client context) is embedded and compared against each dimension separately. The match score is a weighted combination, with weights that vary by use case.

Example weights by use case:
- *Sentinel answering "should we consolidate?"*: Weight the `context` and `outcome` dimensions heavily; the `problem framing` less so because the user already named the problem.
- *Nexus identifying risks for Phase 6*: Weight the `context` and `solution approach` dimensions heavily; the `outcome` less so because Phase 6 risks are about what can go wrong, not what has gone right elsewhere.

Use case: The cornerstone capability. Multi-vector representation is what lets AbarVa say *"your context matches these patterns' contexts 85%, but your solution posture matches only 40% — so the outcome may differ in predictable ways."* A single-vector representation collapses that insight.

### Corpus 4 · External research sources

Source: `Source` nodes — public research, industry reports, academic papers, press coverage.

Content characteristics: Long-form, attribution-critical, fact-dense, often containing specific numbers and acronyms.

Chunking: 1024-token chunks with 128-token overlap. Chunk metadata preserves publisher, publication date, source type, retraction_status.

Embedding model: The same enterprise model. Optionally supplement with a code/math-tuned model for technical sources (research papers with equations).

Retrieval: **Hybrid retrieval** — BM25 + dense, with reciprocal rank fusion. Pure dense retrieval smears queries that contain specific numbers and acronyms ("what did Gartner say about LLM vendor lock-in in Q1 2026?") because the numbers lose specificity. BM25 preserves them. Dense catches paraphrases. Combined is strictly better.

Reranking: By publisher authority, recency, and retraction status. A retracted source drops to the bottom of results with a visible flag.

Use case: Sentinel's research base. The hybrid retrieval is what lets Sentinel cite specific published numbers with confidence.

### Corpus 5 · Public case studies and vendor-published content

Source: A subset of `Source` nodes tagged as case studies or vendor marketing.

Content characteristics: Narrative, persuasive, with embedded claims that may or may not be independently verifiable.

Chunking: 1024-token chunks, narrative-aware (don't split mid-story).

Embedding model: Same.

Retrieval: Same hybrid approach, with an additional rerank penalty for vendor-authored sources when the query is evaluative ("does product X actually work"). Boost when the query is descriptive ("how is product X typically deployed").

Use case: Sentinel's "what have others done" research, with explicit marking of source bias.

## 3.3 Atlas does not use retrieval

Atlas is deliberately query-based against current data. This is a design decision from Agent Architecture Packet 5.1, not a gap in the data layer spec.

The rationale bears repeating here because it matters for the data layer: portfolio state changes constantly. Embedding-based retrieval over portfolio state would return stale answers. Atlas's questions ("what's our current Shadow AI exposure?") are best answered by a graph query or SQL query against current data, not an embedding lookup.

Atlas does, however, benefit from the graph: cohort benchmark queries (Packet 5) and cross-pillar contradiction detection are graph traversals, not retrievals.

## 3.4 Graph-RAG · the integration pattern

Dense retrieval returns relevant chunks. Those chunks become starting points for graph traversal. This is the "graph-RAG" pattern published in the Microsoft GraphRAG paper and several follow-ups in 2024-2025.

The specific AbarVa application:

1. User query → embed → top-k dense retrieval returns chunk anchors.
2. Each chunk anchor maps to a graph node (the chunk was part of an Artifact, which is a graph node).
3. From each anchor, traverse the graph to gather surrounding context — related Decisions, sibling Artifacts, cited Sources, applicable Patterns.
4. The expanded context set feeds the LLM prompt with both the chunks and the structural context.

Example: Sentinel query "what did we decide about pricing AI?" →
- Dense retrieval returns three chunks from Apex's Dynamic Pricing diagnosis deck.
- From those chunks, graph traversal retrieves: the sponsor (Maria Lopez), the Maestro's observations from that phase, the three Decisions locked in Phase 3, the two Genome patterns that were cited, the alternative vendors considered.
- Sentinel's response weaves the chunks with the structural context: *"In Phase 3, Maria flagged the buyer-planner org structure as the primary risk. The Maestro's observation April 11 reinforced this citing Genome pattern X. Two vendors were discussed — Blue Yonder and Revionics. Charter decision deferred pending organizational readiness assessment."*

That response is impossible from dense retrieval alone. It requires the graph.

## 3.5 Reranker strategies

Top-k dense retrieval is a starting point, not an ending point. Reranking is where retrieval quality lives.

Three rerankers operate in sequence:

**Reranker 1 · Tenancy and scope filter.** Hard filter. Any chunk not accessible under current tenancy (client_id match) or outside current scope (e.g., a Nexus query shouldn't retrieve from other Programs) is dropped. This runs before ranking.

**Reranker 2 · Graph-structure boost.** Soft rerank. Chunks whose source nodes are graph-adjacent to the query context (same engagement, same phase, same industry, cited by a matching pattern) get a boost. Implemented as a multiplicative score adjustment.

**Reranker 3 · Cross-encoder rerank** (for research and Genome retrieval specifically). Top-50 chunks are passed through a cross-encoder model (Cohere Rerank, or a fine-tuned model) that produces pairwise relevance scores against the query. Better precision at the top-5 than dense retrieval alone.

For Nexus and Atlas, rerankers 1-2 are sufficient. For Sentinel's research work, all three apply.

## 3.6 Embedding versioning and re-indexing

Two problems that bite every embedding system past month 6:

**Problem A · Embedding model upgrades.** New models ship monthly. A better model releases; re-indexing the entire corpus takes days. If not handled, the corpus contains mixed-generation embeddings and similarity is meaningless.

**Problem B · Content updates.** Artifacts are edited. Genome patterns mature. Sources get retracted. Stale embeddings produce bad retrievals.

The strategy:

- **Version embeddings at write time.** Each embedding row stores `model_id`, `model_version`, `embedded_at`.
- **Dual-read during migration.** When upgrading to a new model, both indexes run in parallel. Queries use a dispatch function that can blend or switch based on the migration state.
- **Incremental re-indexing.** Background job re-embeds content in priority order (Genome patterns first, recent artifacts second, older artifacts last) rather than blocking on a full re-index.
- **Content change triggers.** Any write to an Artifact or Pattern node enqueues a re-embedding job. Source retractions mark embeddings invalid without deletion — retrieval filters them out.

## 3.7 What lives where · summary

| Corpus | Size at Phase-1 scale | Embedding count | Storage |
|---|---|---|---|
| Program artifacts | ~100 artifacts × 10-50 chunks = ~3K chunks | 3K | pgvector |
| Decision logs + observations | ~50 per engagement × 10 engagements = 500 | 500 | pgvector |
| Genome patterns (5-vector) | ~50 patterns × 5 dimensions = 250 | 250 | pgvector (multi-column or multi-row) |
| Research sources | ~2K sources × 10-50 chunks = ~50K chunks | 50K | pgvector |
| Public case studies | ~500 case studies × 10-30 chunks = ~10K chunks | 10K | pgvector |
| **Total Phase 1** | | **~64K embeddings** | Single Postgres instance |

pgvector handles 64K embeddings trivially. This remains true through Phase 2 (5-20 clients, ~300K embeddings) without infrastructure change. Phase 3 (20+ clients, millions of embeddings) may benefit from a dedicated vector DB (Qdrant or Pinecone), but that's a 12-24 month horizon.

## 3.8 The retrieval as graph query pattern

The access interface that unifies all this complexity: **every retrieval is expressed as a graph query that includes an embedding-similarity clause.**

Example Cypher-ish syntax (Apache AGE compatible):

```
MATCH (e:Engagement {id: $engagement_id})-[:PRODUCED_IN]-(p:Phase)-[:CONTAINS]->(a:Artifact)
WHERE embedding_similarity(a.content_embedding, $query_embedding) > 0.7
RETURN a ORDER BY embedding_similarity DESC LIMIT 10
```

This is unified: agents don't have to choose between "search the Programs DB" and "search the graph." They issue a single query against the graph, which includes embedding-similarity as a predicate when needed.

The implementation detail: Apache AGE supports calling SQL functions inside Cypher queries. A `embedding_similarity` function wraps pgvector's cosine distance. This keeps the query surface clean while leveraging pgvector's HNSW index performance.

## 3.9 Retail-specific retrieval tuning

Retail artifacts, retail Genome patterns, and retail research sources benefit from a small number of domain-specific tunings:

- **Retail vocabulary expansion.** Queries mentioning "SKU," "assortment," "markdown," "shrink," "basket size," "same-store sales" are expanded with synonymous retail terminology at retrieval time to catch chunks that phrase the same concept differently.

- **Retail acronym preservation.** BM25's preservation of acronyms is especially valuable in retail (SKU, GMROI, AOV, LTV, CRM) where the industry uses dense acronym vocabulary.

- **Seasonal awareness.** Retail has strong seasonal patterns. Retrievals involving "performance," "volume," "forecast" are seasonally-adjusted — a query in April doesn't pull Q4 holiday results as the primary reference.

- **Channel awareness.** "Online vs in-store vs marketplace" distinctions are retained at chunk level so that queries scoped to one channel don't smear across all three.

These are small implementation details but they matter for the specific wow moments in Prat's demo. If Sentinel says *"retail peers at your scale have struggled with AI-driven markdown optimization"* and the underlying retrieval can't distinguish "markdown" the retail concept from "markdown" the markup language, the insight collapses.

## 3.10 Decisions locked in Packet 3

| # | Decision | Rationale |
|---|---|---|
| 3.L1 | Five distinct corpora with distinct retrieval pipelines | One-size-fits-all degrades every corpus |
| 3.L2 | Genome patterns use multi-vector representation (5 dimensions) | Enables asymmetric context matching |
| 3.L3 | Research sources use hybrid retrieval (BM25 + dense) | Preserves acronyms and specific numbers |
| 3.L4 | Graph-RAG pattern: dense retrieval anchors → graph traversal → expanded context | Matches the reasoning shape of agent queries |
| 3.L5 | Three-stage reranking (tenancy filter → graph-structure boost → cross-encoder) | Precision at the top-k that matters |
| 3.L6 | Embeddings versioned at write time; dual-read during model migrations | Handles model upgrades without data churn |
| 3.L7 | Atlas does not use retrieval — graph queries against current data only | Deliberate per Agent Architecture Packet 5 |
| 3.L8 | pgvector is sufficient through Phase 2 scale; dedicated vector DB is Phase 3 concern | Defers infrastructure complexity |
| 3.L9 | Retail-specific tuning (vocabulary expansion, acronym preservation, seasonality, channel) | Domain fidelity for Prat-adjacent demos |

## 3.11 Open decisions for later packets

- Specific embedding model selection (deferred to implementation, Packet 7)
- Genome pattern maturity states and transitions (Packet 4)
- Cohort similarity weight learning (Packet 5)
- Retail benchmark source ingestion pipeline (Packet 6)

---

## Packet 3 · Checkpoint

**STATUS · Track B, Packet 3 of 7 complete**

Retrieval strategy specified per corpus. Multi-vector Genome representation locked. Graph-RAG pattern defined. Versioning strategy for embedding model evolution. Retail-specific tuning called out. Ready for Packet 4 (Genome lifecycle and evidence provenance).

---

# PACKET 4 · Genome Lifecycle and Evidence Provenance

## 4.1 Why this packet matters most

The Transformation Genome is the single biggest defensibility claim AbarVa has. Harvey AI's moat isn't that it uses Claude — it's that years of legal work have trained its retrieval and refined its patterns in a way no new entrant can replicate from zero. AbarVa's analog: years of enterprise transformation engagements refining the Genome in ways no new entrant can replicate from zero.

That moat only exists if the Genome is a living, versioned, evidence-traceable asset — not an accumulating document library. This packet specifies the lifecycle that makes it living.

## 4.2 Pattern maturity states

A Genome pattern is not born mature. It has five states with explicit transition rules.

**State 1 · Observed.** A Maestro or a Sentinel thread has noted something that looks like a repeatable pattern. It has been captured as a provisional Pattern node in the graph. It is not yet retrievable by Sentinel during active research — it's in the candidate queue.

Transition into Observed: any Maestro or Sentinel can nominate. Automatic nominations trigger when Sentinel detects during a thread that "this same thing came up in engagement X" — the system proposes, the human confirms.

**State 2 · Hypothesized.** The pattern has been reviewed by an internal Pattern Steward (an AbarVa Maestro role). The Steward confirms: (a) the pattern is well-specified across all 5 dimensions (problem, context, solution, evidence, outcome), (b) anonymization is acceptable, (c) at least one engagement confirms it.

Patterns in Hypothesized state are retrievable by Sentinel but marked explicitly: *"Evidence: weak (1 engagement), hypothesis-stage pattern."*

**State 3 · Supported.** The pattern has been observed across 3+ engagements in at least 2 distinct clients. Evidence is triangulated. Outcome measurements exist for at least 2 of those engagements.

Patterns in Supported state are retrievable with *"Evidence: moderate"* label by default.

**State 4 · Strong.** The pattern has been observed across 5+ engagements in 3+ clients, with consistent outcome direction (not necessarily magnitude — that's appropriately variable). No active contradiction from another pattern. Evidence includes at least one published reference (internal AbarVa white paper or external peer-reviewed source).

*"Evidence: strong"* label when retrieved.

**State 5 · Refuted.** The pattern has been tested and failed. Typically this means 2+ engagements where the pattern was applied and the predicted outcome did not materialize, with root-cause analysis identifying the pattern itself (not execution) as the failure cause.

Refuted patterns are not deleted. They remain retrievable with a *"Refuted"* label and the refutation evidence. Sentinel cites them explicitly: *"A prior pattern suggested X; that pattern has been refuted in 2 engagements — the specific failure modes were Y and Z."* This is valuable — knowing what doesn't work is as important as knowing what does.

**State 6 · Sunset.** The pattern is no longer applicable because the underlying context has changed (industry shift, technology shift, regulatory shift). Sunset patterns are retained with timestamp and sunset reason. Retrievable historically but not cited in current-state research unless the user explicitly asks for historical context.

Example: A 2023 pattern about "build your own LLM vs use APIs" economics is likely sunset by mid-2026 because the cost structures have shifted. The pattern's historical accuracy in 2023-2024 is preserved; its applicability to 2026 decisions is marked as expired.

## 4.3 State transitions are graph events

Every state transition is an edge in the graph with metadata. The transition pattern:

```
(pattern:Pattern)-[:TRANSITIONED_TO {
  from_state: 'Hypothesized',
  to_state: 'Supported',
  at: '2026-03-15',
  by: 'steward_id',
  evidence: [engagement_ids],
  rationale: 'Third engagement confirmed; outcome measured at 87% directional match'
}]->(pattern)
```

This gives the Genome a complete history. A pattern's current state is derivable from the most recent transition edge. Historical state at any point in time is computable. Audit trails are native.

## 4.4 The anonymization pipeline

Patterns in the Genome are cross-client assets. They must be anonymized before they can be retrieved by Sentinel during any client's engagement. The pipeline:

**Stage 1 · Automated structural anonymization.**
- Client names replaced with cohort descriptors ("retail peer at Fortune 50 scale")
- Person names replaced with role descriptors ("VP of Supply Chain Planning")
- Specific vendor names retained when the vendor is publicly relevant (LLM vendors, major enterprise software), otherwise generalized to category
- Specific dollar amounts generalized to order-of-magnitude ("~$10M annually") unless the precision is essential to the pattern
- Specific dates generalized to quarters or ranges

**Stage 2 · Structural k-anonymity check.** After Stage 1, the pattern's context dimensions must not uniquely identify a client. The check: given the remaining (industry, sub-industry, revenue band, workforce band, region) tuple, are there at least 3 clients in the Genome that could match? If not, further generalize until k ≥ 3.

**Stage 3 · Human review.** A Pattern Steward reads the anonymized pattern and confirms: (a) anonymization is complete, (b) the pattern is still actionable after anonymization, (c) no inadvertent identifying details remain (e.g., a very specific anecdote that a peer could recognize).

**Stage 4 · Publication.** Pattern is promoted from Hypothesized staging to the retrievable Genome.

Patterns that fail Stage 2 (unique identification) can be retained in a **Client-Private Genome** — a per-client pattern library that only that client's engagements can retrieve. This preserves learning without sharing.

## 4.5 Evidence as a traversable graph property

Every claim made by any agent, in any artifact, is anchored to its evidence trail.

The structure:

```
(claim:Claim {content: "LLM consolidation often fails for high-volume use cases"})
  -[:SUPPORTED_BY {weight: 'strong'}]->(source1:Source)
  -[:SUPPORTED_BY {weight: 'moderate'}]->(source2:Source)
  -[:SUPPORTED_BY {weight: 'weak'}]->(source3:Source)
  -[:CONTRADICTED_BY {weight: 'moderate'}]->(source4:Source)
(source1)-[:RETRACTED_BY]->(source5:Source) ← propagates
```

The weight on each `SUPPORTED_BY` edge determines its contribution to the claim's aggregate confidence. A retraction on an upstream source propagates:

1. `source1` is retracted → its outgoing `RETRACTED_BY` edge is active.
2. Any claim with `(claim)-[:SUPPORTED_BY]->(source1)` has its confidence recomputed.
3. If the recomputation drops the claim below its maturity threshold (e.g., a Supported pattern loses one of its 3 core supporting engagements), the pattern's state may downgrade.
4. The downgrade itself is a graph event with rationale.

This is the heart of the "living intelligence" claim. The Genome doesn't just grow — it responds to evidence changes.

## 4.6 Evidence weight as a function, not a column

Today's spec (Agent Architecture Packet 4) defines evidence weight as a label: strong / moderate / weak. This is correct for user-facing presentation but inadequate for system internals.

Internally, evidence weight is computed from the provenance graph:

```
weight(claim) = f(
  count(supporting_sources),
  recency(supporting_sources),
  authority(supporting_sources),
  attestation_presence(supporting_sources),
  retraction_status(supporting_sources),
  contradicting_sources
)
```

The function *f* is tunable per domain. Retail claims weight recent sources more heavily (industry moves fast). Governance claims weight authority more heavily (regulatory frameworks change slowly but have high-consequence interpretation). Technical claims weight peer-reviewed sources more heavily than industry reports.

The user-facing label (strong / moderate / weak) is a discretization of the continuous weight. The continuous weight drives ranking and decay behavior in the graph.

## 4.7 Contradictory patterns · the reconciliation model

Two Genome patterns can contradict each other. Example:

- Pattern A: *"Consolidate AI suppliers to reduce TCO and procurement overhead"* (evidence: 5 engagements)
- Pattern B: *"Maintain vendor diversity to preserve negotiating leverage and avoid lock-in"* (evidence: 4 engagements)

Both are valid in different contexts. The reconciliation model:

**Step 1 · Represent the contradiction explicitly.**
```
(A)-[:CONTRADICTS {type: 'strategy_tension'}]->(B)
(B)-[:CONTRADICTS {type: 'strategy_tension'}]->(A)
```

**Step 2 · Identify distinguishing context.** What context characteristics predict which pattern wins? A Pattern Steward analyzes the supporting engagements for each and identifies discriminating variables.

For the consolidation vs diversity example, the discriminators might be:
- Total AI spend (consolidation wins above $X, diversity wins below)
- Number of highest-volume use cases (consolidation wins if concentrated, diversity wins if distributed)
- Industry (retail with thin margins tends toward consolidation; financial services with regulatory complexity tends toward diversity)

**Step 3 · Create a parent meta-pattern.**
```
(meta:Pattern {name: 'AI Supplier Strategy · Context-Dependent'})
  -[:RESOLVES_CONTRADICTION_BETWEEN {A: 'consolidation', B: 'diversity'}]->(A, B)
  -[:DISCRIMINATOR]->(var:Variable {name: 'total_ai_spend_usd', threshold: 8000000})
```

When Sentinel now retrieves on this topic, the meta-pattern is the primary hit, and it routes to A or B based on the discriminator values in the querying client's context.

This pattern of *meta-patterns-that-reconcile-contradictions* is where the Genome's intelligence becomes visible to users. It's the thing Sentinel can demonstrate that no competing tool can: *"Both recommendations exist in our pattern library. Your context matches the discriminator for pattern B, so that's the primary recommendation — but here's why A exists and when it would apply."*

## 4.8 Temporal decay · patterns that age

A pattern that was true in 2022 may be false in 2026. The Genome handles this through two mechanisms.

**Mechanism 1 · Confidence decay over time without reinforcement.**

A pattern's confidence score decays if no new supporting engagements occur within a rolling window. The decay rate is domain-specific:
- Technology patterns (LLM economics, infrastructure choices): faster decay, 12-18 month half-life
- Organizational patterns (team structures, governance models): slower decay, 3-5 year half-life
- Industry dynamics patterns: medium decay, 18-24 month half-life
- Fundamental strategic frameworks: minimal decay

Decay is continuous — not a binary expiration. A 3-year-old technology pattern with no recent reinforcement is retrievable with *"Evidence: moderate (dated)"* label.

**Mechanism 2 · Explicit succession when a new pattern supersedes.**

When a newer pattern makes an older one obsolete:
```
(new:Pattern)-[:SUCCEEDS {
  reason: 'industry_shift',
  narrative: 'Post-2025 LLM pricing models make the 2023 pattern invalid'
}]->(old:Pattern)
```

The old pattern transitions to Sunset state but remains traversable. Sentinel retrieving on the topic returns the new pattern primarily and surfaces the succession: *"Earlier thinking on this topic (2023) suggested X; that pattern has been superseded by Y based on Z."*

This temporal layer is what makes the Genome feel like living intelligence rather than accumulating content.

## 4.9 The Published Research Program · how Anand's proprietary differentiator feeds the Genome

Anand's proprietary differentiation (per user memory) includes a Research Publication Program. This program is an input to the Genome, not separate from it.

Workflow:
1. A pattern reaches Strong state based on 5+ engagements and triangulated evidence.
2. A white paper is authored summarizing the pattern, its applicability, its evidence base, and its implications.
3. The white paper becomes an external Source node, citable by the pattern itself.
4. Public citation creates a feedback loop — other researchers reference the paper, creating external grounding for the pattern.
5. Updates to the white paper (based on new engagements) are versioned Source nodes with supersession edges.

This turns the Genome from an internal asset into an externally-validated one. It also creates a public moat: AbarVa's published thought leadership becomes the canonical reference for enterprise transformation patterns in the same way published papers become canonical in academic fields.

For investors: this is the bridge from *"AbarVa has proprietary data"* to *"AbarVa is the authority on this category."* The published research program is how you prove you have patterns that actually work, not just patterns you've accumulated.

## 4.10 What Prat sees · the Genome made visible

In Sentinel's response during a demo, the Genome's architecture surfaces as:

*"Based on the Transformation Genome, I have 3 relevant patterns for this question — one Strong (5 engagements across retail), one Moderate (3 engagements, one of which is from adjacent specialty retail), and one Refuted (a 2024 approach that failed in 2 engagements). Want to see the supporting evidence?"*

Prat clicks "supporting evidence." He sees:
- Each pattern's dimensions (problem, context, solution, evidence, outcome)
- The engagements that ground each pattern (anonymized as "Fortune 50 retail peer")
- The external sources cited, with publication dates and authority scores
- The transition history (how each pattern matured)
- The refuted pattern's failure modes

This is the wow. Not the retrieval being fast. The retrieval being *grounded* in a visible, structured, traversable intelligence graph. Every competitor does retrieval. Almost no one does retrieval with this kind of provenance transparency.

## 4.11 Decisions locked in Packet 4

| # | Decision | Rationale |
|---|---|---|
| 4.L1 | Six pattern maturity states with explicit transition rules | Patterns are alive, not accumulated |
| 4.L2 | Four-stage anonymization pipeline with human review gate | Cross-client sharing without tenancy breach |
| 4.L3 | Client-Private Genome for patterns that fail k-anonymity | Preserves learning that can't be shared |
| 4.L4 | Evidence weight is a computed function, not a stored column | Responsive to source changes |
| 4.L5 | Evidence provenance graph with retraction propagation | Confidence flows automatically |
| 4.L6 | Meta-patterns reconcile contradictions with discriminator variables | Handles the "both are true sometimes" reality |
| 4.L7 | Temporal decay with domain-specific rates + explicit succession | Patterns age authentically |
| 4.L8 | Published research program feeds back into the Genome as external sources | External validation becomes proprietary asset |
| 4.L9 | Pattern Steward is a named AbarVa Maestro role | Governance is human-accountable |

## 4.12 Open decisions for later packets

- Cohort similarity weight learning (Packet 5)
- Retail benchmark integration into the Genome (Packet 6)
- Pattern Steward operational model — who, how often, what tooling (Packet 7)

---

## Packet 4 · Checkpoint

**STATUS · Track B, Packet 4 of 7 complete**

Genome lifecycle specified with 6 maturity states and explicit transitions. Anonymization pipeline locked. Evidence provenance as traversable graph property with retraction propagation. Contradictory pattern reconciliation via meta-patterns. Temporal decay model. Published research program integrated. Ready for Packet 5 (cohort similarity v2).

---

# PACKET 5 · Cohort Similarity v2

## 5.1 From categorical filters to weighted similarity

Current cohort model (Tower spec Packet 4.5): cohort defined by categorical filters across 5 axes (industry, revenue_band, workforce_size, stack_profile, regulatory_profile). Benchmarks computed as filter-and-average over matching clients.

This is clean, transparent, and replicable. It's also how every industry benchmarking tool in the market works. Gartner does this. IDC does this. Your Head of Strategy already has a spreadsheet that does this.

The v2 model: **cohort membership is a weighted similarity score across 15-20 dimensions, with weights learned from which historical comparisons produced the best pattern-transfer outcomes.**

This is how actuarial science handles "similar cases," how credit underwriting handles "comparable borrowers," how Netflix handles "viewers like you." It is not how consulting industry benchmarks work today. That gap is the opportunity.

## 5.2 The retail dimension catalog

For retail specifically, 20 dimensions define similarity. Not all are weighted equally for every question; the learned weights determine which matter for which pattern-transfer.

### Structural dimensions (the ones every benchmarking tool uses)

1. **Industry vertical** (retail, confirmed)
2. **Revenue band** (continuous, not bucketed — $18B is closer to $22B than to $9B)
3. **Workforce size** (continuous)
4. **Geographic footprint** (domestic share, international share, number of countries)

### Retail-specific structural dimensions

5. **Sub-industry** — apparel / grocery / big-box / specialty / DTC / mass merchandiser / department store / off-price / home improvement / pharmacy / convenience. These behave very differently.
6. **Store count and format** — number of physical stores, average store square footage, format mix (flagship / standard / small-format / mobile).
7. **Ecommerce share** — percent of revenue from digital channels. A 15%-ecom apparel retailer and a 55%-ecom apparel retailer face different AI opportunities.
8. **Private label share** — percent of revenue from owned-brand. High private label retailers have distinct AI needs (assortment planning, design AI).
9. **Channel mix** — physical / digital / marketplace / wholesale / franchise mix.
10. **Customer segment positioning** — premium / mid-tier / value / mass / luxury / discount. Brand sensitivity varies enormously.

### Operational dimensions

11. **Supply chain model** — vertically integrated / wholesale-sourced / marketplace-operated / dropship-heavy.
12. **Pricing strategy** — EDLP (everyday low price) / high-low promotional / dynamic / luxury-stable. Pricing AI applicability differs dramatically.
13. **Membership / loyalty depth** — no program / points program / paid membership / tiered. Loyalty-driven retailers have richer personalization data.
14. **Inventory turn rate** — capital efficiency indicator. High-turn (grocery) vs low-turn (furniture) retailers have different forecast horizons.

### AI maturity dimensions

15. **AI investment stage** — exploratory (< 5 use cases) / scaling (5-15) / operating (15-30) / industrialized (30+). Programs that work at "industrialized" may fail at "scaling."
16. **Organizational structure for AI** — fully centralized CoE / hub-and-spoke / federated / ad-hoc. Pattern applicability differs by structure.
17. **AI governance posture** — reactive / compliance-driven / proactive / leading-practice.
18. **AI spend as % of revenue** — benchmark-adjacent but also a similarity signal.

### Tech stack dimensions

19. **Cloud platform primary** — AWS / Azure / GCP / hybrid / on-prem. Affects vendor selection patterns.
20. **Data maturity** — data warehouse presence, data quality posture, real-time capability. High-maturity retailers can pursue different AI use cases than low-maturity peers.

Twenty dimensions is a lot. Not all are populated for every client, and for any specific pattern-transfer question only 6-10 typically matter. The value of having 20 dimensions isn't using all of them at once — it's having them available for the specific questions where they matter.

## 5.3 The similarity function

Given two clients A and B with values on each dimension, the similarity score is:

```
sim(A, B, context) = Σ (w_i(context) × sim_i(A_i, B_i)) / Σ w_i(context)

where:
  w_i(context) = learned weight for dimension i given query context
  sim_i = dimension-specific similarity function
    - Categorical dimensions (industry, cloud): exact match = 1, mismatch = 0
    - Continuous dimensions (revenue): smooth function, e.g., 1 / (1 + |A_i - B_i| / scale_i)
    - Ordinal dimensions (AI maturity stage): graded, e.g., adjacent stages = 0.7, two apart = 0.3
```

The learned weights *w_i(context)* are the interesting part. They come from **pattern-transfer supervision**: when a pattern from Client A was applied in Client B, did the predicted outcome materialize? If yes, the dimensions where A and B were similar get weight. If no, the dimensions where they were dissimilar get weight (as signals of "this is why it didn't transfer").

Over time, different query contexts develop different weight profiles. For "vendor consolidation" questions, revenue band and AI investment stage tend to dominate. For "organizational readiness" questions, workforce size and org structure tend to dominate. For "pricing AI" questions, pricing strategy and customer segment positioning tend to dominate.

## 5.4 Cohort as graph structure

The similarity function is not a nightly batch computation materialized into a table. It's represented as `SIMILAR_TO` edges in the graph, with properties that evolve.

```
(apex:Client)-[:SIMILAR_TO {
  score: 0.78,
  dimension_scores: {
    industry: 1.0,
    sub_industry: 0.9,
    revenue_band: 0.85,
    ecom_share: 0.7,
    private_label_share: 0.6,
    ...
  },
  computed_at: '2026-04-20',
  stale_after: '2026-05-20',
  effective_weights: { ... }
}]->(peer:Client)
```

When Sentinel or Atlas needs a cohort, they traverse `SIMILAR_TO` edges with a threshold (default: top-10 peers by score) and the dimension_scores are available for transparency.

Cohort composition for a given query is computed at query time: starting from the base `SIMILAR_TO` scores, apply the query-specific weight profile, re-rank, return top N.

## 5.5 Privacy preservation · no raw data crosses clients

Cohort similarity computation must not leak raw client data. The design principle: **aggregate and anonymized properties cross client boundaries; raw transaction-level data never does.**

Implementation:

- Each Client node stores anonymized dimension values (revenue to nearest billion, workforce to nearest 10K, etc.) as graph properties. These are cohort-queryable.
- Raw transaction data (specific use cases, specific metric observations) lives under RLS on relational tables. These are never cohort-queryable directly.
- When a cohort benchmark needs a metric (e.g., "median AI spend as % of revenue across the cohort"), the metric is computed per-client and only the aggregated result crosses the tenancy boundary.
- The aggregation requires minimum cohort size (n ≥ 3) as a hard floor to prevent reverse-engineering.

This preserves the tenancy model specified in Tower Packet 4. Cohort intelligence is real; cohort data leakage is impossible.

## 5.6 Cold-start problem · what do we do at n=1 client?

The similarity function requires training data: historical pattern transfers with known outcomes. At AbarVa's current n=1 real client (pre-design-partner), there is no training data.

The phased answer:

**Phase 0 (now, pre-design-partner).** Use expert-specified weights. Anand and Pattern Stewards hand-set initial weights based on 20 years of consulting experience. These are prior weights, not learned weights. Demonstrate the architecture with synthetic cohort peers whose dimension values are designed to produce intuitive results.

**Phase 1 (post-design-partner, n=2-5).** Still primarily expert-specified weights. Begin collecting pattern-transfer supervision data. Too few data points to learn, but enough to validate that expert priors match observed outcomes.

**Phase 2 (n=5-20).** Begin learning weights from pattern-transfer outcomes. Start with Bayesian updates on expert priors — the priors provide regularization, the data provides signal. Query-context-specific weights begin to differentiate.

**Phase 3 (n=20+).** Learned weights dominate. Expert priors remain as regularizers and as fallbacks for query contexts that haven't accumulated enough supervision data yet.

This means the Prat demo uses Phase 0 (expert-specified weights with synthetic cohort). That's fine — the architecture is what matters for the demo; the learning kicks in with scale.

## 5.7 What Prat sees · cohort similarity made tangible

Today, a competitor's dashboard shows: *"Retail peers average 12 AI use cases."* Prat responds: "Okay, which retailers? What did you include? Why is this meaningful to me?"

With cohort similarity v2, Atlas shows:

*"Your 7 closest retail peers by similarity score:*

*- Peer A: similarity 0.89 (matched on sub-industry, revenue, ecom share, private label, pricing strategy; diverged on geographic footprint)*  
*- Peer B: similarity 0.84 (matched on sub-industry, revenue, governance posture; diverged on cloud platform)*  
*- ...*

*Cohort metrics at this similarity tier: 18-34 managed AI use cases (median 27), $12M-$24M annual AI spend (median $18M), 68-84% attestation freshness (median 72%).*

*For the Shadow AI question specifically, the effective dimension weights are: AI maturity stage (0.22), governance posture (0.19), workforce size (0.15), revenue band (0.12), ecom share (0.08), other (0.24). Under these weights, peers C and E are the closest matches for your specific context."*

That response is unfalsifiable by any existing benchmarking tool. Every part of it — the peer selection, the dimension matching, the weight transparency, the query-context-specific weighting — is only possible because similarity is a learned weighted score over a graph, not a filter over a table.

Prat can challenge any of it: *"Why is peer A weighted so heavily?"* Atlas answers: *"Because for Shadow AI questions, governance posture and AI maturity stage matter most, and peer A is closest to you on both. If you want me to reweight for a different question context — say, pricing AI — the cohort composition shifts."*

That's the wow.

## 5.8 Integration with Genome patterns

Cohort similarity and Genome patterns interact. A pattern has `DERIVED_FROM` edges to the engagements that ground it. Each of those engagements has a Client. When a new client's context is evaluated against a pattern, the similarity between the new client and the pattern's grounding clients determines applicability strength.

```
patternApplicability(pattern, newClient) =
    max over (e in pattern.derivedFrom) of
      sim(newClient, e.client, pattern.problem_context)
```

This means: *"This pattern is most strongly grounded in engagements with clients like X and Y. Your client is 0.82 similar to X and 0.67 to Y. The pattern's applicability to your context is bounded by your similarity to the strongest grounding case."*

A pattern with only low-similarity grounding cases is flagged as a stretch: *"This pattern exists but none of the grounding clients are highly similar to yours. Treat as directional."*

## 5.9 Beyond retail · industry analogy strength

Sometimes the best applicable pattern is from an adjacent industry, not from retail. Healthcare operations can illuminate retail store operations; consumer packaged goods pricing can illuminate retail pricing strategy.

Cross-industry similarity uses a tighter dimension set: organizational structure, regulatory profile, workforce characteristics, change velocity, customer orientation. The similarity function applied to cross-industry pairs has different effective weights — operational dimensions dominate over product-market dimensions.

Cross-industry cohort queries are explicit. Sentinel surfaces: *"Within retail, the closest peers are X, Y, Z (similarities 0.8+). Outside retail but potentially instructive: a healthcare operations cohort at similar scale with similar workforce characteristics (similarity 0.6 on relevant dimensions). Want me to pull patterns from both?"*

This is a Sentinel-distinctive capability. Competitors can't do cross-industry analogy well because their benchmarks are filter-based and filters don't respect analogy strength.

## 5.10 Decisions locked in Packet 5

| # | Decision | Rationale |
|---|---|---|
| 5.L1 | Cohort similarity is a learned weighted score across 20 retail dimensions | Beyond categorical filters every competitor uses |
| 5.L2 | Weights are context-specific — "Shadow AI question" uses different weights than "pricing AI" | Matches how real analogy actually works |
| 5.L3 | Similarity stored as graph edges with dimension scores | Transparent, traversable, auditable |
| 5.L4 | Privacy preserved by aggregate-only cross-tenancy data with n ≥ 3 floor | No raw data crossing clients |
| 5.L5 | Four-phase maturation: expert priors (Phase 0-1) → learned weights (Phase 2+) | Works at n=1; gets better with scale |
| 5.L6 | Pattern applicability computed as similarity-to-grounding-cases | Patterns anchored in their evidence, not context-free |
| 5.L7 | Cross-industry analogy supported with tighter dimension set | Competitive moat beyond retail-specific knowledge |
| 5.L8 | Dimension scores visible in Atlas/Sentinel responses | Transparency is the differentiator |

## 5.11 Open decisions for later packets

- Specific external benchmark sources that populate cohort dimensions (Packet 6)
- Weight-learning algorithm specifics (Bayesian vs gradient-based) (Packet 7)
- UI treatment for dimension weight inspection (deferred to surface specs)

---

## Packet 5 · Checkpoint

**STATUS · Track B, Packet 5 of 7 complete**

Cohort similarity v2 specified with 20 retail dimensions, context-specific learned weights, graph-edge representation, privacy preservation, cold-start handling, Genome integration, cross-industry analogy. Ready for Packet 6 (industry data stitching + retail benchmark catalog — the Prat-facing wow packet).

---

# PACKET 6 · Industry Data Stitching + The Retail Benchmark Catalog

This is the packet that creates the Prat wow. Everything else in the spec is infrastructure. This is the substance that makes the infrastructure matter.

## 6.1 What Prat cannot get anywhere else

Before cataloging the benchmarks, a frame: what does Prat already have access to?

- **Gartner / Forrester / IDC reports.** He subscribes. Industry averages, vendor rankings, maturity assessments. Generic across industries, updated quarterly, authored far from any specific client context.
- **NRF (National Retail Federation) data.** Retail-specific macroeconomic trends, consumer sentiment, holiday projections. Useful for strategy, silent on AI operations.
- **Public case studies.** Vendor-published success stories with known selection bias.
- **His own internal data team.** Deep knowledge of his own org; zero visibility into peers.
- **Peer conferences and CIO networks.** Anecdotal exchange; high trust but very low granularity.
- **His consulting partners.** Project-specific deliverables; the intelligence compounds for the consultancy, not for him.

What he does not have:

1. **Anonymized peer portfolio structure at a granular level.** He can't see that "Fortune 50 retail peers have a median of 27 managed AI use cases with this distribution across front/middle/back office" because no one publishes it at that specificity.

2. **Peer attestation and governance posture data.** He can't see how fresh other retailers' attestations are, what their trustworthiness score distributions look like, what percentage of their AI programs have active bias reviews.

3. **Failure patterns.** Vendor case studies publish wins. Nobody publishes what sunset and why. AbarVa's Genome tracks both.

4. **Cross-client temporal patterns.** He can't see that "4 of 7 retail peers consolidated LLM vendors in 2024 and 3 of them re-diversified by Q1 2026." That's exactly the kind of pattern that changes his decisions.

5. **Applicability-weighted recommendations.** Gartner tells him what retail in aggregate does. AbarVa can tell him what the 7 retailers most similar to his context did, with evidence-weighted recommendations grounded in their outcomes.

The retail benchmark catalog in Section 6.3 is designed around these gaps.

## 6.2 The ingestion architecture

Three source types feed the data layer's retail benchmark capability:

### Source type A · Internal client engagement data (the Genome)

Every engagement AbarVa runs, anonymized per Packet 4.4, becomes an input. At n=1 today it's synthetic. At n=5 it's a small cohort. At n=30 (Series A trigger) it's a statistically useful cohort for retail specifically.

Ingestion: Automatic at Phase 6 handoff via the ceremony (Tower Packet 9). Pattern Stewards review what becomes Genome-retrievable.

### Source type B · Public structured data

Industry reports, retail association data, publicly-disclosed company data (10-Ks, investor presentations, AI governance disclosures).

Ingestion pipeline:
1. **Acquisition** — licensed reports pulled via API or manual download with citation.
2. **Structured extraction** — the report's key numbers are extracted into a typed schema (retail-benchmark schema defined below).
3. **Entity linking** — claims in the report are linked to graph entities (industries, vendors, frameworks).
4. **Versioning** — each report is a versioned Source node. Updates supersede prior versions.
5. **Attribution** — the Source node carries publisher, publication date, citation URL, authority score.

### Source type C · Public unstructured data

Press coverage, blog posts, academic papers, conference talks, vendor marketing. Higher volume, lower reliability per source, but aggregates to useful signal.

Ingestion pipeline:
1. **Acquisition** — web crawl of curated publication lists, RSS subscriptions, API pulls where available.
2. **Classification** — each document is typed (news, analysis, case study, vendor marketing, academic) with confidence score.
3. **Claim extraction** — specific factual claims are extracted with source citations.
4. **Authority scoring** — publisher authority and potential bias noted.
5. **Cross-validation** — claims that appear in multiple independent sources get higher confidence.

All three source types land in the same typed graph. `Source` nodes have a `source_type` property distinguishing them. Retrieval weights authority accordingly.

## 6.3 The retail benchmark catalog · what AbarVa tracks that no one else does

Ninety-plus specific benchmarks organized into eleven categories. Not all are populated at Phase 0; the catalog describes what the architecture supports and what gets prioritized in each scale phase. Retail-first because that's Prat's world; extensible to other verticals with the same structure.

### Category 1 · Portfolio structure benchmarks

Aggregate shape of the AI portfolio across peers.

- Number of managed AI use cases per $1B revenue (Phase 1 priority)
- AI spend as percentage of total revenue
- AI spend as percentage of total IT budget
- Distribution of use cases across Front Office / Middle Office / Back Office
- Distribution of use cases across Grow / Optimize / Protect objectives
- Distribution of use cases across archetypes (workflow automation, decision support, generation, prediction, classification, agentic)
- Ratio of managed to Shadow AI spend (Phase 1 priority · anchor for demo)
- Number of distinct AI vendors per organization
- Vendor concentration — percentage of spend with top vendor (Phase 1 priority)
- Build-versus-buy ratio by use case count
- Build-versus-buy ratio by spend
- Internal platform vs per-team tooling ratio

### Category 2 · Adoption benchmarks

How deeply AI is actually used after deployment.

- Seat utilization rate — active seats / licensed seats (Phase 1 priority)
- Workflow penetration percentage — AI-assisted workflows / total workflows in scope
- Time from deployment to first productive use (days)
- Team member AI-assisted hours per week
- Voluntary vs mandated usage ratio
- Adoption drop-off rate — percentage of users who disengage within 90 days
- Adoption recovery rate — percentage of disengaged users who return
- Power user percentage — users who exceed 3× median usage
- Mobile vs desktop split (for relevant use cases)

### Category 3 · Value attainment benchmarks

Whether programs deliver what they promised.

- Attainment percentage distribution by archetype (Phase 1 priority)
- Time from Phase 6 handoff to first measurable value (Phase 1 priority)
- Time to breakeven on program cost
- ROI distribution by use case category
- Trustworthiness score distribution at steady state (Phase 1 priority)
- Attestation freshness distribution (Phase 1 priority · demo value)
- Over-attainment rate — percentage of programs exceeding 120% of target
- Under-attainment rate — percentage below 60% of target
- Baseline lock dispute rate in post-handoff disputes
- Value decay rate — how attainment changes 12 months post-handoff

### Category 4 · Risk and governance benchmarks

Governance maturity across peers.

- Percentage of AI programs with active bias review (Phase 1 priority)
- Bias review frequency distribution (annual / quarterly / triggered)
- Drift incident rate — drift warnings per use case per year
- Audit pass rate — percentage of use cases passing last internal audit
- Time from drift detection to retraining (days)
- AI governance committee composition patterns
- AI policy recency — average age of AI governance policies
- Regulatory exposure mapping — percentage of use cases touching regulated data
- Incident response maturity — average time from AI incident to root cause analysis

### Category 5 · Cost and economics benchmarks

How retailers spend on AI.

- Dollars per inference by model family (LLM, specialized ML, vision)
- Seat pricing tier distribution across major platforms
- Annual AI spend growth rate
- Cost per seat across comparable platforms
- LLM spend as percentage of total AI spend
- Traditional ML infrastructure spend vs LLM API spend
- Enterprise discount realization rate — discounted spend vs list
- Contract renewal patterns — month-to-month / annual / multi-year ratios
- True cost of ownership patterns (infrastructure + licenses + people)

### Category 6 · Organizational benchmarks

How retailers structure their AI capability.

- ML engineers per $1B revenue (Phase 2 priority)
- Data scientists per $1B revenue
- AI product managers per organization
- AI designers / UX specialists per organization
- Headcount growth rate for AI roles
- Centralized CoE vs federated distribution patterns
- Reporting lines — CIO / CTO / CDO / CEO patterns
- Sponsor seniority distribution for AI programs
- Cross-functional team composition norms
- Consultant-to-employee ratio in AI programs
- Time from open requisition to filled seat for AI roles

### Category 7 · Retail-specific operational benchmarks

Where AbarVa's retail specificity shines.

- Forecast accuracy improvements from AI (by product category)
- Markdown reduction achieved with AI pricing (Phase 1 priority)
- Stockout rate reduction from AI-driven replenishment
- Overstock reduction from AI demand planning
- Returns fraud catch rate with AI
- Loyalty program personalization lift patterns
- Email campaign conversion lift from AI personalization
- Product content generation volume and quality metrics
- Visual merchandising AI adoption patterns
- Dynamic pricing adoption rates and revenue impact
- Store staff scheduling efficiency gains
- Labor hours saved per store per week from AI-assisted operations
- Omnichannel integration AI use case patterns
- Customer service AI — contact deflection rates, CSAT deltas
- Private label / owned brand AI applications

### Category 8 · Retail-specific emerging patterns

The "what's happening right now in retail AI" that makes Prat lean forward.

- AI copywriting sunset rate and primary reasons (brand voice drift, factual errors, cost)
- Pricing AI organizational readiness patterns (what orgs succeed vs fail)
- First-generation vs second-generation AI program patterns (what had to fail before succeeding)
- Vendor consolidation to re-diversification cycles in LLM procurement
- Shadow AI emergence patterns by department (marketing first, clinical second, operations third)
- Team member AI resistance patterns and the interventions that work
- AI-driven store operations pilot-to-scale transition rates
- Customer-facing AI (chatbots, recommendation) adoption fatigue patterns
- AI governance policy evolution patterns — what triggered each major revision
- Competitive response patterns — how retailers move when a competitor announces AI capabilities

These are the patterns Prat cannot see from Gartner. These are the patterns that actually inform his next moves.

### Category 9 · Time-to-maturity benchmarks

How long things actually take in retail AI.

- Time from Phase 1 (Ideation) to Phase 3 (Charter) by program archetype (Phase 1 priority)
- Time from Phase 3 (Charter) to Phase 5 (Build/Deploy)
- Time from Phase 5 to first value
- Total program duration from Ideation to Phase 6 handoff
- Percentage of programs that complete all 7 phases vs stall / sunset
- Phase-specific stall rates (which phases are the bottlenecks?)
- Sponsor churn rate mid-program
- Program restart rate after sponsor or organizational change

### Category 10 · Vendor-specific benchmarks

Cross-client vendor performance.

- Vendor-specific attestation outcome patterns
- Vendor-specific drift rates
- Vendor-specific renewal rates
- Vendor-specific cost trend patterns (pricing changes per year)
- Vendor-specific enterprise support quality signals (extracted from attestations)
- Alternative-vendor success patterns (when switching works)

### Category 11 · Program design benchmarks

What kinds of programs succeed in retail.

- Archetype-specific success patterns (which archetypes have highest attainment)
- Charter quality predictors — which charter patterns correlate with successful Phase 6 handoff
- Team composition patterns in successful programs
- Sponsor involvement patterns in successful programs
- Technology choice patterns — which stack combinations correlate with success
- Scope discipline patterns — programs with strict scope vs evolved scope

## 6.4 What gets populated in which phase

Phase 0 (demo, today):
- Synthetic cohort with plausible values across Categories 1-4 and 7 priority benchmarks
- Shadow AI concentration ratios, attestation freshness distributions, vendor concentration — the demo's headline comparisons
- All other categories have schema but empty content

Phase 1 (post-design-partner, n=2-5 clients):
- Categories 1-4 real data (thin but real) from the design partner cohort
- Category 7 retail-specific operational benchmarks from the retail design partners specifically
- Categories 2, 3, 5, 6, 8, 9 schema in place; content thin

Phase 2 (n=5-20):
- All 11 categories populated with increasing density
- Category 8 (emerging patterns) becomes a distinctive Sentinel capability as pattern-detection across clients surfaces novel observations
- Published research program (Packet 4.9) begins producing retail-specific white papers

Phase 3 (n=20+, Series A trigger territory):
- Categories become statistically robust with distributions, percentiles, temporal trends
- Emerging pattern detection is genuinely novel — AbarVa is the authoritative source on retail AI operations benchmarks

## 6.5 The typed retail benchmark schema

Each benchmark has structured representation:

```yaml
benchmark:
  id: retail-shadow-ai-ratio
  category: portfolio_structure
  name: Shadow AI spend as ratio of managed AI spend
  unit: ratio
  applicable_industries: [retail]
  applicable_sub_industries: [apparel, big_box, grocery, specialty, department_store]
  applicable_revenue_bands: [$1B-$10B, $10B-$50B, $50B+]
  data_sources:
    internal: genome_engagements
    external_structured: [forrester_q1_2026_retail_ai, nrf_tech_spend_2026]
    external_unstructured: [news_retail_ai_spend_20260101_20260420]
  temporal_granularity: quarterly
  freshness_target: 90_days
  privacy_floor_n: 3
  peer_visibility: cohort_aggregated_only
  retrieval_weight_rules:
    - query_context: shadow_ai_question
      base_weight: 1.0
    - query_context: governance_question  
      base_weight: 0.8
```

Every response from Sentinel or Atlas that cites a benchmark includes the benchmark ID, the cohort n, the temporal window, and the data sources contributing to it. Transparency is the differentiator.

## 6.6 Integration with the Genome

Benchmarks and Genome patterns interact:

- A Genome pattern's context is characterized by benchmark values. *"Pattern X applies in contexts where AI spend is 0.08-0.14% of revenue and attestation freshness is above 70%."*
- When benchmarks shift over time, affected patterns are flagged for re-review. If the "typical" AI spend doubles industry-wide, patterns keyed to the old spend range may need updating.
- Benchmarks are themselves pattern-retrievable: *"What's the relationship between workforce size and AI governance maturity in retail?"* is answered by a benchmark query against the graph.

## 6.7 Retail benchmark refresh cadence

Different benchmarks decay at different rates:

- **Fast-changing (quarterly refresh):** Cost per inference, vendor pricing, LLM spend patterns, emerging use case archetypes
- **Medium-changing (biannual):** Portfolio structure shapes, adoption rates, governance posture, organizational patterns
- **Slow-changing (annual):** Retail-specific operational benchmarks, program design patterns, time-to-maturity benchmarks
- **Stable (multi-year):** Fundamental archetype patterns, structural organizational patterns

The refresh cadence is visible in the data layer. When Sentinel cites a benchmark older than its refresh window, it flags: *"This benchmark was last refreshed [date]; the industry may have shifted since."*

## 6.8 What this looks like in Prat's demo

A concrete demo moment made possible by this packet:

**Prat asks Atlas:** "How does our AI portfolio compare to peers?"

**Atlas responds:**

*"Your portfolio across the 5 Tower pillars, compared to your 7 closest retail peers by similarity score:*

*- **Inventory:** 34 managed use cases, cohort median 27. You're 26% above median. Distribution across functions skews toward front office (62%) vs cohort median (51%). Hypothesis: your private-label strategy drives more customer-facing AI investment.*

*- **Adoption:** 54% average adoption penetration, cohort median 67%. You're in the 18th percentile. This is a real gap. Two of your closest peers (Peer A, Peer B) have similar portfolios with substantially higher adoption. The pattern in their cases involves Team Member enablement investments we don't see in your portfolio yet.*

*- **Value:** 74% average attainment, cohort median 71%. You're slightly above — healthy position. But attestation freshness is at 62% (4 of your 5 steady-state programs are stale). Cohort median is 72%. This is where the Demand Forecasting stale-attestation signal comes from.*

*- **Risk:** 1 active drift warning, cohort median 1-2. On par. But cohort median has 78% of programs with active bias reviews; your portfolio is at 60%. That's a governance posture gap.*

*- **Cost:** AI spend at 0.11% of revenue, cohort median 0.10%. On par. But $2.3M Shadow AI exposure is 2.1× cohort median of $1.1M. That's your anchor signal.*

*The wow: every one of those comparisons is transparent. I can show you which peers contributed to each benchmark, the dimension weights that made them close to you, and the underlying patterns in our Genome that explain the variations."*

This is not a slide. This is not a dashboard. This is an agent weaving benchmark data, cohort similarity, pattern library context, and client-specific data into a single coherent read. Five separate data-layer capabilities stitched together in one response. That's the wow.

## 6.9 Decisions locked in Packet 6

| # | Decision | Rationale |
|---|---|---|
| 6.L1 | Three source types (internal Genome, structured external, unstructured external) feed the same typed graph | Unified retrieval surface |
| 6.L2 | 90+ retail-specific benchmarks organized in 11 categories | Comprehensive enough to distinguish from competitors |
| 6.L3 | Categories 1-4 and 7 priority benchmarks populated in Phase 1 | Demo-adjacent first |
| 6.L4 | Typed benchmark schema with applicability rules and retrieval weights | Queryable and composable |
| 6.L5 | Temporal freshness tracking with per-benchmark refresh cadence | Benchmarks age authentically |
| 6.L6 | Privacy floor n ≥ 3 enforced at benchmark computation | No cross-client leakage |
| 6.L7 | Category 8 (emerging patterns) becomes distinctive at n=5+ | Pattern detection across clients is a moat |
| 6.L8 | Every benchmark citation includes ID, cohort n, temporal window, contributing sources | Transparency as differentiator |
| 6.L9 | Benchmarks and Genome patterns interlink (patterns' contexts use benchmark ranges) | Coherent data layer |

## 6.10 Open decisions for later packets

- Specific external data licensing decisions (deferred to Phase 1 procurement)
- Specific data quality thresholds for accepting public unstructured sources (Phase 2 ops decision)
- Retail benchmark UI treatment in Tower (would extend Tower Packet 6 wireframes)

---

## Packet 6 · Checkpoint

**STATUS · Track C, Packet 6 of 7 complete**

Industry data stitching architecture specified across three source types. Retail benchmark catalog with 90+ benchmarks in 11 categories. Typed schema, refresh cadence, privacy preservation, Genome integration. Concrete Prat demo moment specified. Ready for Packet 7 (phased implementation + investor pitch framing).

---

# PACKET 7 · Phased Implementation and Investor Pitch Framing

This packet maps the architecture in Packets 2-6 to concrete phases keyed to AbarVa's scale milestones. It also specifies how this architecture translates into the Shail Jain pitch and the Anthropic Anthology Fund conversation afterward.

## 7.1 Four scale phases

**Phase 0 · Pre-design-partner (now through Prat demo).**
- n = 1 composite client (Apex Retail seed)
- No real cross-client data
- Demo reliability over ambition

**Phase 1 · Post-design-partner (weeks 1-12 after Prat signs, or equivalent).**
- n = 2-5 real clients with engagements in flight
- Data layer moves from "architecture on paper" to "graph + benchmarks in production"
- Still primarily expert priors; early learning data accumulating

**Phase 2 · Scale (months 4-18 after design partner).**
- n = 5-20 clients
- Graph is authoritative for cross-cutting queries
- Learned cohort similarity weights begin outperforming expert priors
- Genome has 50+ curated patterns in Supported or Strong states

**Phase 3 · Network effects (months 18+, Series A territory).**
- n = 20+ clients
- Emerging-pattern detection becomes a distinctive Sentinel capability
- Retail benchmark catalog is statistically robust; published research program is authoritative in the category
- Competitors arriving from zero face a 12-24 month data-catch-up cost

## 7.2 What ships in Phase 0

The demo scenario already specified in Tower spec Packet 13 and Agent Architecture Packet 7. Nothing in this data layer spec is required for the Prat demo. The demo works with the existing relational schema and synthetic cohort data.

However, **one Phase 0 investment is worth making now** to future-proof the demo:

Seed the Apex Retail benchmark comparisons (Packet 6.3 priority benchmarks) using the schema specified here, even though the data is synthetic. When Atlas says *"your 7 closest retail peers"*, the response is generated from a data structure that matches Phase 1's production architecture. This means:

- The demo's comparisons are philosophically honest about the architecture
- Phase 1 implementation can swap synthetic values for real data without refactoring the retrieval surface
- Investors asking "how does this work at scale?" see the architecture is already there, just scaling up

Implementation: extend the seed migration (Tower Packet 13 Step 2) with 5-8 synthetic peer clients, populate priority benchmarks from Packet 6.3 Categories 1-4 and 7, and wire Atlas's scripted responses to compute from this data rather than hardcode.

Estimated effort: 4-6 hours of Claude Code work. Low-risk. High-demo-value.

## 7.3 What ships in Phase 1

The real data layer build begins.

**Foundation (weeks 1-4):**
- Apache AGE extension installed on the existing Postgres
- Ontology v1 migration — 15 entity types, 30 relationship types per Packet 2.3-2.4
- RLS extension to graph data per Packet 2.8
- Projection pattern for Tower and Programs surfaces
- Graph-RAG retrieval layer using pgvector + Apache AGE per Packet 3.8

**Genome pilot (weeks 4-8):**
- Pattern Steward role defined; Anand and one hire
- First 10 patterns authored from the Apex engagement and early design partner work
- Anonymization pipeline operationalized
- Pattern maturity transitions implemented

**Cohort similarity v2 (weeks 6-10):**
- 20-dimension client schema populated for design partners
- Expert priors for context-specific weights
- SIMILAR_TO edges computed nightly
- Sentinel and Atlas begin citing dimension scores in responses

**Benchmarks population (weeks 8-12):**
- Priority Phase 1 benchmarks (per Packet 6.4) real data from design partners
- External structured sources ingested — selected industry reports, public case studies
- Refresh cadence automated per Packet 6.7

**Integration and polish (weeks 10-12):**
- Evidence provenance visible in agent responses
- Genome citations include maturity state and evidence weight
- UI treatment for dimension inspection in Sentinel threads
- Published research pipeline soft-launched with first internal white paper

**Phase 1 deliverable:** At the end of 12 weeks, AbarVa has a functioning typed knowledge graph with 20-dimension cohort similarity, a 15-20-pattern Genome, and ~30 priority benchmarks populated from design partner data. This is demonstrably different infrastructure than any consulting tool competitor, even if the cohort is still small.

## 7.4 What ships in Phase 2

The data layer compounds.

**Cohort similarity learning (months 4-9):**
- Pattern-transfer supervision data accumulates
- Bayesian learning replaces pure expert priors
- Query-context-specific weight profiles differentiate across domains
- Cross-industry analogy becomes usable (per Packet 5.9)

**Genome expansion (months 4-12):**
- 50+ curated patterns in Supported or Strong states
- Pattern Steward organization matures (3-5 Maestros acting as Stewards)
- First patterns transition to Refuted and Sunset states with visible history
- Meta-patterns reconciling contradictions become the standard form for strategic questions

**Benchmarks maturation (months 6-12):**
- All 11 categories populated with statistically useful density
- Category 8 (emerging patterns) begins producing novel observations — the first *"4 of 7 retail peers did X and 3 of them reversed within 18 months"*-style insights
- External benchmark ingestion automated across 20-30 curated sources

**Published research program (months 9-18):**
- Quarterly white paper cadence
- External citations begin creating public moat
- Conference presence cycles (retail conferences, AI operations conferences)

**Phase 2 deliverable:** AbarVa's Genome and retail benchmark catalog are structurally complete. The network effect begins — each new client makes every prior client's experience more valuable.

## 7.5 What ships in Phase 3

Network effects become visible and defensible.

**Scale (months 18+):**
- Graph query performance tuned for 20M+ node scale
- Pattern Stewards formalized as a named AbarVa role with career path
- Genome governance committee (cross-client steering) introduced
- First external Genome access experiments (limited publisher licensing)

**Intelligence deepening:**
- Emerging-pattern detection is a Sentinel-distinctive capability — competitors cannot replicate without comparable data
- Cross-industry analogy is well-calibrated and heavily used
- Temporal pattern evolution is observable (multi-year pattern lifecycle visible)
- Evidence provenance queries routine — users click to trace any claim

**Commercial:**
- Retail benchmark catalog is the authoritative source in the category
- Major retail CTOs cite AbarVa's published research as canonical
- Market position: AbarVa is not "an AI consulting product" — AbarVa is "the intelligence infrastructure for enterprise transformation"

## 7.6 The Phase 1 decision tree

Claude Code picking up Phase 1 implementation has these key decisions:

**Decision 1 · Graph tool.** Confirmed: Apache AGE per Packet 2.7. If Postgres version doesn't support AGE cleanly, fallback is Puppygraph for the first iteration with plan to migrate.

**Decision 2 · Vector store.** pgvector confirmed through Phase 2. HNSW index for similarity search. Multi-vector representation for Patterns is a JSONB of vectors or separate rows per dimension — design decision at implementation time.

**Decision 3 · Embedding model.** Three candidates: Voyage AI `voyage-3-large` (1024 dim), Cohere `embed-english-v3.0` (1024 dim), OpenAI `text-embedding-3-large` (1536 dim). Recommendation: Voyage for enterprise prose quality. Alternative: Cohere if latency is tight.

**Decision 4 · Reranker.** Cohere Rerank v3 for cross-encoder step. Fine-tuning is Phase 2 work.

**Decision 5 · Pattern Steward tooling.** A lightweight admin UI for Pattern Stewards to review, annotate, and transition patterns. Can be built in the existing admin surface, not a new product.

**Decision 6 · Weight learning algorithm.** Phase 1 uses expert priors only — no learning required. Phase 2 introduces Bayesian updates on priors. Specific algorithm (e.g., variational inference, MCMC) chosen in Phase 2 based on data volume.

## 7.7 What this spec changes in existing product specs

Two moments where Phase 1 implementation affects the existing specs:

⚠️ **Tower Packet 13 · Claude Code build pack.** When Tower Milestone 2 implements contradiction detection, the implementation should use Apache AGE graph queries, not cross-table SQL joins. This requires the foundation work from this spec's Phase 1 to be done first. Suggested resolution: Tower M2 is scheduled after design partner signing, which is the natural Phase 1 trigger anyway.

⚠️ **Agent Architecture Packet 2.4 · memory layer.** The current spec says "embedding search over agent-specific corpus" as a one-liner. Phase 1 implementation replaces that one-liner with the full retrieval architecture from this spec's Packet 3. No contradiction, just elaboration.

Neither of these is demo-blocking. Both are natural Phase 1 follow-ups.

## 7.8 Cost estimates per phase

Rough shapes, not commitments:

**Phase 1 · 12 weeks:**
- 1 senior engineer part-time (40% time) for graph infrastructure — ~$25K comp
- Claude Code + Codex time (included in tooling budget)
- Pattern Steward time (Anand + 1 Maestro, ~15% time combined) — opportunity cost
- External data licensing: $20-40K for priority industry reports
- Total cash cost: $45-65K

**Phase 2 · 12 months:**
- 1 data engineer full-time — ~$200K comp
- 2-3 Pattern Stewards at 25% time combined — opportunity cost
- External data licensing: $80-150K annually across expanded sources
- Published research program: ~$50K annual for production
- Total cash cost: $330-400K annually

**Phase 3 · post-Series A:**
- Dedicated 3-5 person data layer team — ~$1-1.5M comp
- Expanded licensing and research program
- Total cash cost: $1.5-2M annually

The Phase 1 cost is within the seed funding envelope ($8M at $25M cap) without strain. Phase 2 cost is within Series A territory ($5M ARR at $100M pre-money threshold). Phase 3 cost is post-Series A operational expense.

## 7.9 The investor pitch framing

For Shail Jain first, Anthropic Anthology Fund second, other investors after.

### The two-anchor pitch structure

**Anchor 1 · Market sizing** (existing):

*"Harvey AI is $11B doing for legal what we do for enterprise transformation. Same structure — domain-specialized AI built on top of foundation models, sold to enterprises replacing traditional consulting work. Their category is $500B. Ours is $800B. Harvey has 300+ customers and is scaling. Nobody has built the equivalent for enterprise transformation."*

**Anchor 2 · Defensibility through data layer** (new, this spec):

*"The Transformation Genome is a typed knowledge graph with learned cohort similarity and traversable evidence provenance. Every client engagement makes every future engagement smarter — not via shared prompts, via shared structure. Specifically:*

*- Twenty-dimension cohort similarity model learned from pattern-transfer outcomes across engagements*  
*- Genome pattern library with six maturity states, automated and human-reviewed anonymization, temporal decay, and meta-patterns that reconcile contradictions*  
*- Retail benchmark catalog covering 90+ specific measurements across 11 categories that nobody else publishes*  
*- Published research program that turns proprietary patterns into canonical references*

*In 18 months post-design-partner, this is uncopyable infrastructure. In 36 months, any competitor arriving from zero has a data-network-effect moat of 18-24 months to catch up, and we'll be further ahead by then."*

### Why this second anchor matters

Without Anchor 2, AbarVa is pitching "Harvey AI for enterprise transformation." That's true and compelling. It is also replicable — any founder with a consulting background can try to build it.

With Anchor 2, AbarVa is pitching "Harvey AI for enterprise transformation *with a specified and defensible data layer moat*." That's much harder to replicate. Investors who have seen a dozen AI consulting pitches can distinguish AbarVa from the others based on this architectural specificity.

### What to show Shail specifically

Shail's seed funding decision is about whether AbarVa is a fundable opportunity or a well-intentioned project. Three things in the pitch from this spec:

1. **The architecture diagram** — graph + embeddings + Genome + benchmarks, with the projection pattern showing how it scales. One-slide visual, ten-minute narrative.

2. **The Prat demo scenario** — when the design partner talks to Atlas and sees cohort comparisons like the one in Packet 6.8, that's the credibility moment. Shail sees what Prat will see.

3. **The phased cost and timeline** — Phase 1 in the seed funding envelope, Phase 2 in Series A territory, Phase 3 post-Series A. This is a fundable trajectory, not a vision piece.

### What to show Anthropic Anthology Fund specifically

The Anthology Fund cares about Claude utilization and AI-native architecture. Three things:

1. **Claude dependency is strategic, not accidental.** Sentinel runs on Opus 4.7, Nexus and Atlas on Sonnet 4. The data layer is designed to make Claude responses traceable, evidence-bound, and provenance-traversable — which showcases what foundation models can do when the scaffolding around them is right.

2. **Published research program produces AI-native artifacts.** The white papers themselves are written with Claude assistance, and they become Source nodes in the Genome that future Claude responses cite. This is a concrete example of AI being the backbone of an intellectual asset, not a writing aid.

3. **Genome is demonstrably AI-native.** The multi-vector pattern representation, the learned cohort similarity, the confidence propagation in the provenance graph — these are only buildable with modern AI capabilities. A pre-2023 company could not have built this. That's what "AI-native" actually means.

## 7.10 Success metrics for the data layer build

How we know the data layer is working.

**Phase 1 metrics:**
- Graph query latency p95 < 500ms for typical agent queries
- Cohort similarity computation completes in < 2 seconds for a client's top-10 peers
- Genome retrieval recall@10 ≥ 0.8 on expert-curated eval set (80% of human-judged relevant patterns retrieved in top 10)
- Agent response rate of evidence citations ≥ 95% (per Agent Architecture eval suite)
- Zero tenancy violations on cross-client queries

**Phase 2 metrics:**
- Learned cohort weights outperform expert priors on pattern-transfer prediction by ≥ 10% F1
- Genome pattern state transitions correctly reflect observed engagement outcomes in ≥ 80% of cases
- Benchmark freshness: ≥ 90% of priority benchmarks updated within their refresh cadence
- Cross-industry analogy usable: Sentinel produces cross-industry citations in ≥ 15% of research threads where appropriate
- User satisfaction on data-layer-backed responses rises by ≥ 20% over Phase 1 baseline

**Phase 3 metrics:**
- Emerging-pattern detection produces ≥ 5 novel cross-client insights per quarter
- Published research program produces ≥ 4 white papers annually with external citation
- Competitive sales win rate: ≥ 70% when prospect has seen AbarVa's data layer demo vs a competitor's product
- Customer retention driven by data-layer value: ≥ 95% annual retention of clients citing "intelligence quality" as top reason to renew

## 7.11 Claude Code directives for Phase 1 build

When Phase 1 kicks off (post-design-partner), Claude Code's execution order:

**Week 1-2 · Graph foundation.** Install Apache AGE. Implement ontology v1 migration. Verify RLS extension works. Build a test harness with synthetic graph data.

**Week 3-4 · Projection layer.** Refactor Tower's dashboard API to read from graph projections. Refactor Programs's artifact API to read from graph. Keep existing Postgres tables as projections, materialized from the graph nightly.

**Week 5-6 · Embedding pipeline.** Install pgvector. Build embedding pipeline for each corpus. Implement graph-RAG retrieval pattern. Smoke-test with the Genome corpus.

**Week 7-8 · Genome integration.** Build Pattern admin UI for Stewards. Anonymization pipeline operational. First 10 patterns authored and reviewed.

**Week 9-10 · Cohort similarity v1.** 20-dimension client schema. Expert-specified weights. SIMILAR_TO edges computed. Atlas and Sentinel updated to cite similarities.

**Week 11-12 · Benchmarks and polish.** Priority benchmarks populated. External source ingestion. Evidence provenance visible in UI. Eval suite updated for Phase 1 capabilities.

Each week has a demo-able increment. Each increment is independently testable. No big-bang migrations.

## 7.12 Decisions locked in Packet 7

| # | Decision | Rationale |
|---|---|---|
| 7.L1 | Four scale phases (0 pre-partner, 1 post-partner, 2 scale, 3 network effects) | Matches AbarVa's fundraising stages |
| 7.L2 | One Phase 0 investment: synthetic cohort seed using production schema | Future-proofs demo without demo risk |
| 7.L3 | Phase 1 is 12 weeks, within seed funding envelope | Fundable trajectory |
| 7.L4 | Phase 2 introduces cohort weight learning; Phase 1 uses expert priors | Works at any scale, better with data |
| 7.L5 | Apache AGE confirmed; pgvector confirmed through Phase 2 | Stable tooling choices |
| 7.L6 | Investor pitch gains a second defensibility anchor beyond market sizing | Harder to replicate, harder to dismiss |
| 7.L7 | Published research program is strategic, not marketing | Turns Genome into canonical external reference |
| 7.L8 | Success metrics defined per phase | Objective accountability |
| 7.L9 | Two ⚠️ AFFECTS moments in existing specs, both resolved naturally in Phase 1 | No demo disruption |
| 7.L10 | Claude Code directives for Phase 1 build are concrete and sequenced | Executable roadmap |

---

## Packet 7 · Checkpoint

**STATUS · Track C, Packet 7 of 7 complete**

Four scale phases defined. Phase 0 investment specified (synthetic cohort). Phase 1 build plan sequenced. Cost estimates grounded. Investor pitch framing locked with two-anchor structure. Claude Code directives for Phase 1 concrete. Success metrics per phase.

---

# SPEC COMPLETE · Data Layer · Future State

## Files and sizes

- `/mnt/user-data/outputs/abarva-data-layer-future-state-spec.md` · ~1,900 lines · **COMPLETE (7/7 packets)**

## Spec coverage

- **7 packets** across 3 tracks (current state + vision · architecture · external data + delivery)
- **55+ locked decisions** across packets
- **15 entity types, 30 relationship types** in typed knowledge graph ontology v1
- **5 distinct retrieval corpora** with tailored pipelines
- **6 pattern maturity states** in Genome lifecycle
- **20 retail dimensions** in cohort similarity v2
- **90+ benchmarks** in 11 categories in retail catalog
- **4 scale phases** with sequenced implementation

## The three shifts that make this different

1. **Graph as source of truth, relational as projection.** Not "also use Neo4j" — a conceptual inversion. Agents query the graph directly for reasoning; surfaces project from the graph for fast reads.

2. **Evidence as a traversable property, not a label.** Every claim anchored in a provenance graph with weighted edges to sources, attestations, and counter-evidence. Confidence propagates automatically when upstream sources change.

3. **Cohort matching as similarity-over-graph, not filter-over-table.** Learned weighted similarity across 20 dimensions, with weights that are context-specific and calibrated by pattern-transfer outcomes. Not replicable by any current benchmarking tool.

## The five wow categories for Prat

1. **Knowledge he cannot get from his own data team** — anonymized peer portfolio structures with granularity Gartner doesn't provide.
2. **Invisible structure made visible** — portfolio-level contradictions across pillars that require graph traversal to detect.
3. **Agent reasoning that is transparent without being trivial** — click any claim, see the evidence provenance trail through multiple hops.
4. **Dots connected across domains he thinks of as separate** — cross-industry analogy and cross-pillar integration powered by the graph.
5. **Implications he hasn't considered** — emerging-pattern detection that surfaces temporal cohort dynamics no dashboard shows.

## The two-anchor investor pitch

**Anchor 1 · Market sizing:** Harvey AI at $11B for legal's $500B category. AbarVa's enterprise transformation category is $800B, untouched.

**Anchor 2 · Data layer defensibility:** Typed knowledge graph with learned cohort similarity and traversable evidence provenance. Every engagement compounds. 18-month uncopyability, 36-month catch-up cost for new entrants.

## Companion specs

- `docs/specs/intelligence/design-spec.md` (Sentinel surface; consumer of this data layer)
- `docs/specs/programs/design-spec.md` (Nexus surface; consumer of this data layer)
- `docs/specs/tower/design-spec.md` (Atlas surface; consumer of this data layer)
- `docs/specs/platform/agent-architecture.md` (how agents interact with this data layer)
- `docs/specs/_meta/seed-data/apex-reconciled.md` (Phase 0 synthetic data that this spec future-proofs)

## Phase 0 investment worth making now

Extend the Apex seed migration with 5-8 synthetic peer clients and populate priority Phase 1 benchmarks (per Packet 6.3 Categories 1-4 and 7) using the schema specified in this document, even though values are synthetic. This makes the Prat demo's cohort comparisons philosophically honest about the architecture and unblocks seamless Phase 1 transition post-design-partner. Estimated 4-6 hours of Claude Code work. Low-risk, high-demo-value.

## Next steps

1. **Tonight or tomorrow:** Anand reviews this spec.
2. **Before Prat demo:** Decide whether to execute the Phase 0 investment (synthetic cohort seed).
3. **Shail Jain pitch prep:** Extract the two-anchor pitch structure and architectural diagram into pitch materials.
4. **Design partner signing trigger:** Phase 1 implementation begins per Packet 7.11 directive.

---
