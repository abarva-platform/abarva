# Benchmarks and Industry Data Architecture · Specification

**The architecture for how AbarVa ingests, manages, and leverages industry benchmarks, peer data, regulatory information, and external research to produce reasoning that goes beyond what any single client knows about themselves.**

This spec exists because one of AbarVa's core differentiators is that its agents know more than the client has told them. When Nexus says "your inventory turns at 5.4 vs peer average 6.2 vs leaders at 7.8," the specificity of that comparison is what separates "smart AI tool" from "credible advisor." Producing that specificity at scale, keeping it current, and defending it under scrutiny requires a deliberate architecture for benchmark and industry data.

This spec defines that architecture: the data sources, ingestion patterns, classification, refresh cadence, quality controls, access model, and consumption patterns that turn scattered public data into a continuously-current intelligence layer.

Reads alongside:
- `docs/specs/platform/administration-architecture.md` — Track C (Dataset Lifecycle) for classification and governance patterns that also apply to benchmark data
- `docs/specs/platform/data-ingestion-integration.md` — core ingestion patterns that this architecture extends
- `docs/specs/platform/data-layer-future-state.md` — the knowledge graph this data flows into
- `docs/specs/_meta/seed-data/apex-retail-group-comprehensive-seed.md` — example consumption of benchmark data

---

## Part 1 · Strategic Intent

### 1.1 · Why benchmarks matter

Enterprise decisions are almost always made against a benchmark, explicit or implicit. When a CFO decides whether to accept an operating margin of 5.3%, they are comparing it to an internal target, to last year, to peer companies, or to industry expectations. When a CIO evaluates AI investment adequacy, they compare to what competitors are spending. When a Chief Supply Chain Officer evaluates inventory efficiency, they compare to peer inventory turns.

Without benchmark data, AbarVa's reasoning is confined to the client's own history and stated goals — useful, but missing the comparative dimension that makes strategic advice actionable. With benchmark data, agent output becomes specific, defensible, and actionable in a way that pure internal analysis cannot match.

The architectural challenge is that benchmark data is scattered across hundreds of sources with varying update cadences, methodologies, and reliability. Building a benchmark capability is not a one-time data purchase; it is an ongoing intelligence pipeline that must balance coverage, currency, and cost.

### 1.2 · The category differentiator

AbarVa's benchmark layer differentiates the platform in three ways:

**Breadth.** AbarVa tracks benchmarks across financial, operational, customer, workforce, technology, and industry-specific dimensions. Most competing tools specialize in one or two benchmark categories. AbarVa's breadth means a single Program can pull comparative context from multiple angles without the user stitching together data from multiple tools.

**Currency.** Benchmark data decays fast. Peer company financials from two quarters ago are stale for competitive analysis. AbarVa's architecture refreshes benchmark data at cadences appropriate to each data type — daily for market data, quarterly for filings, monthly for industry trend data, continuous for public statement indexing.

**Provenance transparency.** Every benchmark AbarVa cites traces to its source. No benchmark is a black-box number. When Nexus references "peer leaders at 7.8 inventory turns," users can click through to see the specific peer set, the methodology, the data vintage, and the sources. This transparency is a trust foundation.

### 1.3 · What this architecture is NOT

It is not a data vendor replacement. AbarVa does not compete with Bloomberg, FactSet, S&P Capital IQ, or similar data providers. Where licensed data is needed, AbarVa partners with or licenses from those providers. This architecture handles public, publicly-inferrable, and AbarVa-proprietary cohort data — not proprietary licensed data.

It is not a cohort data leak. Cross-client cohort data is handled with rigorous privacy controls (aggregation, minimum n thresholds, anonymization). The benchmark architecture consumes cohort data through a privacy-preserving interface, not by accessing raw client-private data from other tenants.

---

## Part 2 · Data Source Taxonomy

Benchmark and industry data flows into AbarVa from six source categories, each with distinct characteristics and handling.

### 2.1 · Public filings and financial data

**Sources:** SEC EDGAR filings (10-K, 10-Q, 8-K, proxy, S-1, registration statements), analogous international filings (Canadian SEDAR, European national regulators, etc.)

**Coverage:** All publicly-traded US companies; selected international companies based on vertical relevance.

**Cadence:** Filings are event-driven. AbarVa monitors EDGAR (and equivalents) continuously and ingests new filings within 24 hours of publication. Historical filings are available from the platform's inception; multi-year lookback is standard.

**Data extracted:**
- Financial statements (income, balance sheet, cash flow, equity)
- Segment reporting where available
- Management discussion and analysis
- Risk factor disclosures
- Material agreements
- Executive compensation data
- Governance structure
- Litigation disclosures

**Processing:**
- Structured extraction for tables and financial statements
- Semantic extraction for narrative sections
- Entity resolution (tagging to companies, people, topics in the knowledge graph)
- Change detection (flagging material changes vs prior filing)

**Quality:** Highest. Filings are legally-required documents with audit trails.

**Currency:** Quarterly for 10-Qs and 10-Ks; event-driven for 8-Ks; standard for other filings.

### 2.2 · Earnings and investor communications

**Sources:** Earnings call transcripts, investor day presentations, analyst day materials, pre-announcement press releases, investor relations web content.

**Coverage:** All publicly-traded companies with earnings calls; selected private companies that conduct investor-style communications.

**Cadence:** Quarterly for earnings; event-driven for investor day, analyst day, and pre-announcements.

**Data extracted:**
- Structured quotes attributed to specific executives
- Strategic priorities and commitments mentioned
- Financial guidance given
- Operational metrics discussed
- Q&A content
- Forward-looking statements
- Industry and competitive commentary

**Processing:**
- Speaker attribution and timestamp
- Topic tagging
- Sentiment analysis (with caveats)
- Comparison to prior quarters (consistency, contradictions)
- Cross-reference to public commitments

**Quality:** High. Earnings communications are high-stakes; companies are careful with accuracy. However, selective framing is common.

### 2.3 · Analyst research and sell-side reports

**Sources:** Equity research from major investment banks (Goldman, Morgan Stanley, JPMorgan, Bank of America, Wells Fargo, Jefferies, Evercore, UBS, Bernstein, etc.); boutique research where available; credit research; industry-specific research houses.

**Coverage:** Sell-side coverage is available for most large-cap companies. Availability depends on AbarVa's subscriptions and license agreements.

**Cadence:** Continuous, with volume spiking around earnings.

**Data extracted:**
- Analyst ratings and price targets
- Consensus estimates (revenue, earnings, specific operational metrics)
- Thesis summaries
- Risk/concern summaries
- Industry view commentary

**Processing:**
- Consensus aggregation across analysts
- Thesis divergence detection
- Rating change tracking
- Industry view synthesis

**Quality:** Varies. Analyst research is informed but inherently opinionated. Platform treats analyst views as signal rather than ground truth and always attributes sources.

### 2.4 · Regulatory and government data

**Sources:**

*Financial regulatory:* Federal Reserve (FedViews, Beige Book, Y-9C bank data), OCC, FDIC (call reports), SEC (enforcement actions, corp fin interpretations), CFPB, state banking regulators.

*Healthcare regulatory:* CMS (Hospital Compare, MA Star Ratings, ACO performance, enforcement actions), FDA (drug approvals, device approvals, safety communications), OIG work plans, state health departments.

*Retail and consumer:* FTC (enforcement, rulemakings), Consumer Product Safety Commission, USDA (food safety), state attorneys general consumer protection actions.

*Cross-cutting:* Department of Labor (BLS employment, wage data, occupational projections), Census Bureau (retail trade, Economic Census), Treasury (tariff data, sanctions), regulatory agencies' enforcement actions across sectors.

**Coverage:** Comprehensive for US regulated sectors. Selected international for cross-border relevance.

**Cadence:** Varies from real-time (enforcement actions) to monthly (BLS) to quarterly (call reports) to annual (major rulemakings).

**Data extracted:**
- Regulatory actions and penalties
- Rulemakings and public commentary
- Statistical data
- Policy signals from regulator communications
- Cross-sector regulatory trend signals

**Processing:**
- Structured extraction from regulatory publications
- Relevance tagging to specific client industries and sub-industries
- Historical context matching

**Quality:** Highest for structured data; high for rulemaking communications; variable for interpretive content.

### 2.5 · Trade publications and industry research

**Sources:**

*Retail:* Retail Dive, Modern Retail, Chain Store Age, Women's Wear Daily, Glossy, NRF research, RIS News, National Retail Federation publications.

*Healthcare:* Modern Healthcare, Becker's Hospital Review, Fierce Healthcare, Health Affairs, Advisory Board research, HFMA publications, AHA publications.

*Financial services:* American Banker, The Banker, Financial Brand, Digital Banking Report, BankDirector, ABA publications.

*Cross-industry:* Wall Street Journal, Financial Times, The Economist, Harvard Business Review, MIT Sloan Management Review, McKinsey Insights, BCG Perspectives, Bain Insights.

**Coverage:** Broad for major industries; continuously expanding.

**Cadence:** Continuous for online publications; event-driven for research reports.

**Data extracted:**
- Industry trends and themes
- Named company coverage
- Expert commentary
- Best practice patterns
- Failure and cautionary cases
- Regulatory and competitive dynamics

**Processing:**
- Natural language processing for entity tagging
- Topic modeling
- Sentiment and stance analysis
- Cross-source corroboration

**Quality:** Variable. Trade publications range from rigorous to promotional. Quality scoring applied per source; weight adjusted accordingly.

### 2.6 · AbarVa cohort intelligence

**Sources:** Aggregated patterns from AbarVa's own client base, with strict privacy controls.

**Coverage:** Grows as AbarVa's client base grows.

**Cadence:** Continuous as Programs execute and data accumulates.

**Data extracted:**

Patterns that emerge across multiple client engagements, aggregated to prevent re-identification:
- Transformation velocity patterns
- Common organizational friction patterns
- Common pattern library across industries
- Program outcome correlations with organizational characteristics
- Common failure modes in specific transformation types

**Processing:**
- Minimum n=3 for any aggregated pattern
- Value-bucketing and rounding to prevent re-identification
- Anonymization review by privacy-focused pipeline

**Quality:** Highest trust — this is AbarVa's proprietary intelligence.

**Privacy architecture:** Raw tenant data never crosses tenant boundaries. Cohort intelligence is produced by a privacy-preserving aggregation pipeline that operates on abstractions and derived patterns, never raw content.

---

## Part 3 · Ingestion Architecture

### 3.1 · Pipeline structure

The benchmark and industry data pipeline consists of five stages:

**Stage 1 · Acquisition.** Data is acquired from source via APIs, scrapers, licensed feeds, or direct ingestion. Each source has dedicated acquisition logic appropriate to the source characteristics.

**Stage 2 · Raw storage.** Acquired data lands in a raw storage layer with full provenance metadata (source, URL, timestamp, access method, content hash). Raw data is never modified; all processing produces derived artifacts.

**Stage 3 · Extraction and parsing.** Structured extraction pipelines convert raw data into structured artifacts. Different extractors for different content types (tabular extraction from filings, semantic extraction from narrative, etc.).

**Stage 4 · Normalization and entity resolution.** Extracted data is normalized (consistent units, consistent formats, consistent date representations) and entities are resolved against the knowledge graph (which company, which person, which topic).

**Stage 5 · Indexing and availability.** Normalized data is indexed for agent query and made available through the query API. Index maintenance handles updates, deletions, and supersession.

### 3.2 · Acquisition patterns

Different source types use different acquisition patterns:

**Direct API.** For sources with stable APIs (SEC EDGAR, BLS data portal, CMS APIs), direct API calls on scheduled cadence. Most reliable.

**Licensed feed.** For licensed data sources, scheduled feed consumption.

**Scraping (where permitted).** For some trade publications and public research, scraping with respect to robots.txt and source rate limits. Lower reliability; requires active maintenance.

**Document ingestion.** For PDFs, presentations, and similar artifact documents, specialized ingestion that handles multiple formats.

**Event-triggered.** For regulatory filings and earnings events, continuous monitoring triggers immediate ingestion when new material is available.

**Batch catch-up.** For historical data and backfill scenarios, batch ingestion pipelines.

### 3.3 · Quality controls at ingestion

Every ingestion includes:

- **Content validation.** Does the acquired content match expectations for the source type?
- **Provenance capture.** Source URL, access timestamp, acquisition method, content hash
- **Duplicate detection.** Is this content already in the raw store?
- **Freshness tracking.** When was the source last updated vs when we last acquired?

Failures at this stage generate alerts but do not block the pipeline — partial data is available.

---

## Part 4 · Classification and Sensitivity

Benchmark and industry data uses the same four-tier sensitivity classification as the rest of the platform (Public, Internal, Restricted, Confidential) per the Platform Administration Architecture spec Track C. For benchmark data:

### 4.1 · Public tier (most benchmark data)

Data acquired from publicly-available sources — SEC filings, public regulatory data, trade publications, earnings transcripts, analyst research purchased through public-market channels. Available to all users across all tenants.

### 4.2 · Internal tier (AbarVa-processed enrichment)

Data that has been enriched by AbarVa processing — entity resolution, topic tagging, relationship graph construction — beyond what the raw source provides. Still publicly-sourceable, but the enrichment itself is AbarVa-proprietary.

### 4.3 · Restricted tier (licensed data)

Data acquired under license from specific providers where the license restricts use or redistribution. Access controlled per licensing terms.

### 4.4 · Confidential tier (cohort intelligence)

Cross-client aggregated patterns that require additional handling to prevent re-identification. Access controlled with extra governance; inference controls prevent agents from combining cohort patterns with other data in ways that could re-identify.

---

## Part 5 · Refresh Cadence and Freshness Management

### 5.1 · Cadence targets by source type

- **Market data (prices, rates):** Real-time or near-real-time
- **Earnings and investor communications:** Same-day of release
- **Regulatory filings:** Within 24 hours of filing
- **Analyst research:** Within 24 hours of publication
- **Trade publications:** Daily sweep of major sources
- **BLS, Census, other government statistics:** Per their publication cadence
- **Cohort patterns:** Continuous as new Programs complete

### 5.2 · Freshness tracking in the knowledge layer

Every data artifact carries a `last_verified_at` timestamp and a `source_publish_date`. Two timestamps because the gap between source publication and AbarVa acquisition matters (especially for event-driven sources).

Agents use freshness in reasoning:
- Data verified within threshold: cited without caveat
- Data approaching staleness threshold: cited with freshness note
- Stale data: cited with explicit caveat and/or excluded from reasoning
- Very stale data: flagged for refresh; excluded from active reasoning

Thresholds are per data category; market data staleness threshold is minutes, filing staleness is quarters.

### 5.3 · Refresh automation

Most refresh is automated and continuous. Maestro-initiated or admin-initiated refresh is available for:
- Specific pages or reports that need verification
- Urgent updates following significant events
- Backfill for historical data needed for a new Program

### 5.4 · Cost management

Acquisition has cost — licensing, infrastructure, processing. The architecture includes cost monitoring and intelligent refresh scheduling:
- High-value data refreshed at high cadence
- Long-tail data refreshed on lower cadence with on-demand overrides
- Access patterns inform refresh priority (heavily-queried data gets fresher refresh)

---

## Part 6 · Entity Resolution and the Knowledge Graph

### 6.1 · Why entity resolution matters

Benchmark data is valuable only if it can be connected correctly to the right entities — right company, right executive, right industry. Incorrect entity resolution cascades through the platform as misattributed insight.

### 6.2 · Entity types resolved

Primary entities:
- Companies (by ticker, legal name, trade name, subsidiaries)
- People (executives, analysts, researchers, regulators)
- Topics and themes
- Geographic markets
- Regulatory bodies
- Products and services
- Industries and sub-industries

### 6.3 · Resolution methodology

Multi-signal entity resolution:
- Exact match on canonical identifiers (tickers, LinkedIn URLs, GRID IDs)
- Normalized name matching with context
- Graph-based disambiguation using relationships
- Human review for ambiguous cases via Steward-assisted workflow

### 6.4 · Knowledge graph integration

Resolved entities populate the knowledge graph specified in the Graph Intelligence Architecture spec. Every benchmark data point is connected through the graph to relevant client context, enabling agents to produce comparative reasoning through graph traversal.

---

## Part 7 · Consumption Patterns by Agent

### 7.1 · Nexus consumption

Nexus (Programs) uses benchmark data for:
- Grounding recommendations against peer benchmarks
- Validating directional targets against industry norms
- Providing context for pattern surfacing
- Referencing specific named peers in conversation

Typical access pattern: per-turn query scoped to the current client's industry, scale class, and the topic being discussed. Benchmarks flow into Nexus reasoning as context alongside client-specific data.

### 7.2 · Sentinel consumption

Sentinel (Intelligence) uses benchmark and industry data as primary input:
- Industry trend analysis
- Competitive intelligence research
- Regulatory environment monitoring
- Cross-company pattern detection

Typical access pattern: deep queries against the benchmark and industry data layer, with full provenance returned.

### 7.3 · Atlas consumption

Atlas (Tower) uses aggregated benchmark and industry data for portfolio-level reasoning:
- Cross-client position relative to industry
- Portfolio pattern detection
- Strategic environment summaries

### 7.4 · Steward consumption

Steward uses benchmark data metadata for admin tasks:
- "What benchmark data do we have on this topic?"
- "How fresh is our peer data?"
- "What sources are we missing?"

---

## Part 8 · Data Ground Truth Integration

The Benchmarks and External tab in the Data Ground Truth surface (specified separately) is the primary user-facing presentation of this architecture. It shows:

- What benchmarks are available
- Peer set composition
- Source attribution
- Freshness status
- Methodology details

This transparency is important because agent statements like "peer leaders at 7.8 inventory turns" require defensible support, and the Data Ground Truth view provides that support.

---

## Part 9 · Privacy and Governance

### 9.1 · Public data governance

Public data flows per normal platform governance. The architecture respects:
- Source terms of service
- Licensing restrictions
- Rate limits and acceptable use
- Attribution requirements

### 9.2 · Cohort intelligence governance

Cross-client cohort data is the most sensitive category. Controls include:
- Minimum n=3 for any aggregated pattern
- Value bucketing and rounding
- No raw client data exposure
- Separate pipeline with privacy-preservation reviews
- Audit trail for cohort queries
- Tenant isolation preserved at the access layer

### 9.3 · Analyst research terms

Licensed analyst research often has redistribution restrictions. The architecture respects these:
- Clearly attributed sources
- No verbatim reproduction beyond fair use
- Quotation counts enforced (per licensing terms)
- Internal-only vs client-shareable flags

### 9.4 · Audit and compliance

All benchmark data access is audited per the Platform Administration Architecture Track D governance model. Unusual access patterns are flagged for review.

---

## Part 10 · Build and Operation

### 10.1 · Phased rollout

**Phase 1 (demo-launch):** 
- Filings ingestion for primary peer sets of the three seed composites (Apex, Meridian, First Capital)
- Earnings call transcript ingestion for peer sets
- Basic BLS and CMS government data
- Simple trade publication ingestion
- Selected cohort patterns

**Phase 2 (30-60 days post-launch):**
- Expanded analyst research ingestion
- Full trade publication coverage
- International filings where relevant
- More sophisticated cohort intelligence

**Phase 3 (ongoing):**
- Continuous coverage expansion
- Specialized sources per client engagement needs
- Performance optimization

### 10.2 · Operating costs

Benchmark and industry data has operating cost:
- Licensing costs for some sources
- Infrastructure costs for ingestion and storage
- Maintenance costs for scrapers and extractors
- Human curation costs for quality

Architecture optimizes these through:
- Cache-aware access patterns
- Intelligent refresh scheduling
- Licensed data consolidation
- Scraper stability investment

### 10.3 · Observability

Pipeline health monitoring tracks:
- Ingestion success rates by source
- Extraction quality metrics
- Freshness against targets
- Access patterns and query latencies
- Cost per data type

---

## Part 11 · Summary

**What this architecture is:** The pipeline, data model, and governance for ingesting, classifying, refreshing, and serving industry benchmark, peer, regulatory, trade publication, and cohort data to AbarVa agents.

**What it unlocks:**
- Specific comparative reasoning in Nexus conversations
- Rich research capability in Sentinel
- Portfolio-level pattern detection in Atlas
- Credible external context across all surfaces

**Why it matters for the demo:**
Prat will evaluate AbarVa against competing AI tools. Most competitors know only what the client tells them. AbarVa, backed by this architecture, knows the client's peers, their industry, their regulatory environment, and what similar companies are experiencing. That knowledge depth — and its visible provenance — is a primary differentiator.

**Companion specs:**
- Graph Intelligence Architecture (next in wave) — the connection layer between benchmark data and client-specific reasoning
- Data Ground Truth Surface (complete) — the user-facing presentation
- Agent Architecture (complete) — how agents consume this data

---

**END OF DOCUMENT · BENCHMARKS AND INDUSTRY DATA ARCHITECTURE SPECIFICATION**
