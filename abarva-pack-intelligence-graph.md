# AbarVa Build Pack · Intelligence Graph

**Date:** April 19, 2026
**Scope:** Unified reasoning graph that ties every knowledge source, every client, every engagement, every pattern, every vendor, every regulation into one traversable structure. Nexus gains reasoning chains on top of retrieval.
**Effort:** ~3-4 days. Depends on Industry Knowledge Layer Phase 1 (migration) and at least Phase 2 (one data tier loaded).
**Why it matters:** Pinecone gives retrieval. Neo4j gives reasoning. The combination is what makes Nexus sound like an advisor, not a chatbot. This pack builds the reasoning layer.

---

## The reasoning graph

Today's Neo4j has 4 node types: `GenomePattern`, `Engagement`, `Client`, `Person`. After this pack, the graph has 14 types with 20+ edge types. Every knowledge source, every client use case, every pattern, every vendor becomes a node that participates in reasoning traversals.

### Node types (14)

```
Industry              — HEALTHCARE_IDN, FINSERV, RETAIL, GENERAL
Regulation            — HIPAA, EU AI Act, SEC Regulation S-P, CCPA
RegulationSection     — HIPAA § 164.308, HIPAA § 164.312, EU AI Act Art. 6
Framework             — NIST AI RMF, NIST CSF 2.0, ISO 42001, SOC 2
FrameworkControl      — AI RMF GOVERN 1.1, MEASURE 2.3, CSF PR.AC-1
Benchmark             — CMS 30-day readmission HF, HFMA denial median
Vendor                — Anthropic, OpenAI, Microsoft, Salesforce, ServiceNow
Product               — Claude Enterprise, Copilot Clinical, Einstein Trust
VendorPosture         — {data_residency, training_opt_out, HIPAA BAA, SOC 2}
Technology            — LLM, RAG, vector DB, embedding model
Topic                 — ai_governance, phi_handling, cost_takeout, ROI_attribution
UseCase               — Meridian's Copilot Clinical Documentation
GenomePattern         — F008 AI ROI, F007 CDO vacancy (existing, extended)
Client / Engagement / Person — existing, unchanged
```

### Edge types (key ones)

```
(Regulation) -[:APPLIES_TO]-> (Industry)
(Regulation) -[:HAS_SECTION]-> (RegulationSection)
(Regulation) -[:GOVERNS]-> (Topic)
(Framework) -[:HAS_CONTROL]-> (FrameworkControl)
(FrameworkControl) -[:ADDRESSES]-> (Topic)
(Benchmark) -[:MEASURES_IN]-> (Industry)
(Benchmark) -[:TRACKS]-> (Metric)
(Vendor) -[:OFFERS]-> (Product)
(Vendor) -[:HAS_POSTURE]-> (VendorPosture)
(Vendor) -[:COMPLIES_WITH]-> (Framework)
(Product) -[:USES]-> (Technology)
(UseCase) -[:USES_PRODUCT]-> (Product)
(UseCase) -[:SUBJECT_TO]-> (Regulation)
(UseCase) -[:TRIGGERS]-> (GenomePattern)
(UseCase) -[:BENCHMARKED_AGAINST]-> (Benchmark)
(GenomePattern) -[:VIOLATES]-> (FrameworkControl)
(GenomePattern) -[:RELATES_TO]-> (Regulation)
(Engagement) -[:SURFACED]-> (GenomePattern)
(Engagement) -[:ADDRESSES]-> (UseCase)
(Client) -[:IN_INDUSTRY]-> (Industry)
(Client) -[:HAS_USE_CASE]-> (UseCase)
```

Every edge has properties where useful: `VIOLATES` carries confidence score, `BENCHMARKED_AGAINST` carries comparison direction, `SURFACED` carries trigger timestamp.

---

## Phase A · Schema migration

### File: `db/graph/migrations/005_reasoning_graph.cypher`

```cypher
// Constraints for uniqueness
CREATE CONSTRAINT industry_code IF NOT EXISTS
  FOR (i:Industry) REQUIRE i.code IS UNIQUE;
CREATE CONSTRAINT regulation_code IF NOT EXISTS
  FOR (r:Regulation) REQUIRE r.code IS UNIQUE;
CREATE CONSTRAINT regsection_id IF NOT EXISTS
  FOR (rs:RegulationSection) REQUIRE rs.id IS UNIQUE;
CREATE CONSTRAINT framework_code IF NOT EXISTS
  FOR (f:Framework) REQUIRE f.code IS UNIQUE;
CREATE CONSTRAINT fcontrol_id IF NOT EXISTS
  FOR (fc:FrameworkControl) REQUIRE fc.id IS UNIQUE;
CREATE CONSTRAINT benchmark_key IF NOT EXISTS
  FOR (b:Benchmark) REQUIRE b.key IS UNIQUE;
CREATE CONSTRAINT vendor_name IF NOT EXISTS
  FOR (v:Vendor) REQUIRE v.name IS UNIQUE;
CREATE CONSTRAINT product_id IF NOT EXISTS
  FOR (p:Product) REQUIRE p.id IS UNIQUE;
CREATE CONSTRAINT topic_key IF NOT EXISTS
  FOR (t:Topic) REQUIRE t.key IS UNIQUE;
CREATE CONSTRAINT technology_key IF NOT EXISTS
  FOR (tech:Technology) REQUIRE tech.key IS UNIQUE;
CREATE CONSTRAINT usecase_id IF NOT EXISTS
  FOR (uc:UseCase) REQUIRE uc.id IS UNIQUE;

// Indexes for common traversal entry points
CREATE INDEX regulation_jurisdiction IF NOT EXISTS
  FOR (r:Regulation) ON (r.jurisdiction);
CREATE INDEX benchmark_metric IF NOT EXISTS
  FOR (b:Benchmark) ON (b.metric_name);
CREATE INDEX usecase_client IF NOT EXISTS
  FOR (uc:UseCase) ON (uc.client_id);

// Seed core Industry nodes (idempotent)
MERGE (:Industry {code: 'HEALTHCARE_IDN', name: 'Healthcare Integrated Delivery Network'});
MERGE (:Industry {code: 'FINSERV', name: 'Financial Services'});
MERGE (:Industry {code: 'RETAIL', name: 'Retail'});
MERGE (:Industry {code: 'GENERAL', name: 'Cross-industry'});

// Seed core Topic nodes
MERGE (:Topic {key: 'ai_governance', name: 'AI Governance'});
MERGE (:Topic {key: 'phi_handling', name: 'PHI Handling'});
MERGE (:Topic {key: 'privacy', name: 'Privacy & Data Protection'});
MERGE (:Topic {key: 'vendor_management', name: 'Vendor Management'});
MERGE (:Topic {key: 'monitoring', name: 'Continuous Monitoring'});
MERGE (:Topic {key: 'roi_attribution', name: 'ROI Attribution'});
MERGE (:Topic {key: 'cost_management', name: 'Cost Management'});
MERGE (:Topic {key: 'risk_management', name: 'Risk Management'});
MERGE (:Topic {key: 'security', name: 'Cybersecurity'});
```

### Commit

```
feat(graph): migration 005 — reasoning graph schema (14 node types, 20+ edge types)
```

---

## Phase B · Extraction pipelines (one per source type)

**Intent:** Each knowledge source's ingestion script gets a sidecar extractor that writes typed nodes + edges into Neo4j alongside the Pinecone chunks. Extraction happens at ingestion time, not as a separate pass.

### File: `src/scripts/knowledge/graph_extract/regulation.ts`

```typescript
import { getNeo4j } from '@/lib/neo4j/client';
import { classifyTopics } from './topic_classifier';

interface RegulationInput {
  code: string;                // 'HIPAA'
  name: string;                // 'Health Insurance Portability and Accountability Act'
  jurisdiction: string;        // 'US'
  publishedDate: string;       // '1996-08-21'
  applicableIndustries: string[]; // ['HEALTHCARE_IDN']
  sections: Array<{
    sectionCode: string;       // '164.308'
    sectionTitle: string;      // 'Administrative safeguards'
    sectionText: string;
  }>;
}

export async function extractRegulation(input: RegulationInput) {
  const driver = getNeo4j();
  const session = driver.session();

  try {
    // Regulation node
    await session.run(
      `MERGE (r:Regulation {code: $code})
       SET r.name = $name,
           r.jurisdiction = $jurisdiction,
           r.published_date = date($publishedDate)`,
      { code: input.code, name: input.name, jurisdiction: input.jurisdiction, publishedDate: input.publishedDate }
    );

    // Applies-to industries
    for (const industryCode of input.applicableIndustries) {
      await session.run(
        `MATCH (r:Regulation {code: $regCode})
         MATCH (i:Industry {code: $industryCode})
         MERGE (r)-[:APPLIES_TO]->(i)`,
        { regCode: input.code, industryCode }
      );
    }

    // Sections + topics (topic classifier runs once per section via Haiku)
    for (const section of input.sections) {
      const sectionId = `${input.code}:${section.sectionCode}`;
      await session.run(
        `MATCH (r:Regulation {code: $regCode})
         MERGE (rs:RegulationSection {id: $sectionId})
         SET rs.code = $sectionCode,
             rs.title = $sectionTitle
         MERGE (r)-[:HAS_SECTION]->(rs)`,
        { regCode: input.code, sectionId, sectionCode: section.sectionCode, sectionTitle: section.sectionTitle }
      );

      const topics = await classifyTopics(section.sectionText);  // returns ['phi_handling', 'monitoring']
      for (const topic of topics) {
        await session.run(
          `MATCH (rs:RegulationSection {id: $sectionId})
           MATCH (t:Topic {key: $topicKey})
           MERGE (rs)-[:GOVERNS]->(t)`,
          { sectionId, topicKey: topic }
        );
      }
    }
  } finally {
    await session.close();
  }
}
```

### File: `src/scripts/knowledge/graph_extract/framework.ts`

Same pattern for Framework + FrameworkControl nodes. For NIST AI RMF: `GOVERN`, `MAP`, `MEASURE`, `MANAGE` functions → FrameworkControl nodes with codes like `AI_RMF_GOVERN_1_1`.

### File: `src/scripts/knowledge/graph_extract/benchmark.ts`

Benchmarks come from structured data (CMS API, FDIC API, BLS API). Each gets a typed node:

```typescript
interface BenchmarkInput {
  key: string;                 // 'cms_30day_readmission_hf'
  metricName: string;          // '30-day readmission rate — heart failure'
  industry: string;            // 'HEALTHCARE_IDN'
  source: string;              // 'CMS Hospital Compare'
  unit: string;                // '%'
  nationalMedian: number;      // 21.8
  p25?: number;
  p75?: number;
  p90?: number;
  sampleSize?: number;
  asOfDate: string;
}

export async function extractBenchmark(input: BenchmarkInput) {
  const session = getNeo4j().session();
  try {
    await session.run(
      `MERGE (b:Benchmark {key: $key})
       SET b.metric_name = $metricName,
           b.source = $source,
           b.unit = $unit,
           b.national_median = $nationalMedian,
           b.p25 = $p25, b.p75 = $p75, b.p90 = $p90,
           b.sample_size = $sampleSize,
           b.as_of_date = date($asOfDate)
       WITH b
       MATCH (i:Industry {code: $industry})
       MERGE (b)-[:MEASURES_IN]->(i)`,
      input
    );
  } finally {
    await session.close();
  }
}
```

### File: `src/scripts/knowledge/graph_extract/vendor.ts`

Vendors + products + postures from Tier 3 ingestion:

```typescript
interface VendorInput {
  name: string;                // 'Anthropic'
  headquartersCountry: string; // 'US'
  products: Array<{
    id: string;                // 'anthropic_claude_enterprise'
    name: string;              // 'Claude Enterprise'
    technologies: string[];    // ['LLM']
  }>;
  posture: {
    dataResidencyOptions: string[];
    trainingOptOutDefault: boolean;
    soc2Type2: boolean;
    hipaaBaaAvailable: boolean;
    subprocessors: string[];
  };
  complies: string[];          // Framework codes: ['SOC2', 'ISO42001']
}

// Writes (:Vendor), (:Product), (:VendorPosture), edges COMPLIES_WITH, OFFERS, HAS_POSTURE, USES
```

### File: `src/scripts/knowledge/graph_extract/usecase.ts`

Runs on every Tower use case (from Phase 10). When a use case is created/updated, this extractor creates the `UseCase` node and all its outgoing edges:

```typescript
export async function syncUseCaseToGraph(useCaseId: string) {
  // 1. Read use case from Postgres (name, client_id, industry, vendor, data_classes)
  // 2. MERGE UseCase node with properties
  // 3. Link to Client → HAS_USE_CASE edge
  // 4. Link to Product (if vendor identified) → USES_PRODUCT edge
  // 5. Identify applicable regulations from client.industry + use_case.data_classes
  //    Create SUBJECT_TO edges
  // 6. Identify relevant benchmarks from metric_name overlap
  //    Create BENCHMARKED_AGAINST edges (if metric matches)
  // 7. Link to active GenomePattern triggers
  //    Create TRIGGERS edges
}
```

This runs as a **trigger** on `use_cases` table writes — Postgres NOTIFY → background worker → `syncUseCaseToGraph()`.

### File: `src/scripts/knowledge/graph_extract/pattern_linker.ts`

One-time pass over all `GenomePattern` nodes. For each pattern, Haiku classifies which framework controls it violates and which regulations it relates to:

```typescript
const PATTERN_LINKING_PROMPT = (pattern, allFrameworks) => `
This Genome pattern describes an enterprise transformation failure mode:

PATTERN: ${pattern.code} — ${pattern.name}
DESCRIPTION: ${pattern.description}
HISTORICAL FAILURE RATE: ${pattern.failure_rate_pct}%

Which of these framework controls would this pattern VIOLATE if it manifests
in a client engagement? Return a JSON array of control codes.

FRAMEWORKS AVAILABLE:
${allFrameworks.map(f => `- ${f.code}: ${f.controls.map(c => `${c.code} (${c.name})`).join(', ')}`).join('\n')}

Return ONLY a JSON array, no prose. Example: ["AI_RMF_MEASURE_2_3", "AI_RMF_GOVERN_1_1"]
`;
```

Output becomes `VIOLATES` edges.

### Commit

```
feat(graph): extractors for regulation, framework, benchmark, vendor, use-case, pattern linker
```

---

## Phase C · Six primary reasoning queries

**Intent:** Six Cypher queries that run during Nexus turns. Each answers a distinct reasoning question. Wrapped as TypeScript functions that the retrieval pipeline calls.

### File: `src/lib/graph/reasoning.ts`

#### 1. Use-case reasoning chain — the complete picture

```typescript
export async function getUseCaseReasoning(useCaseId: string) {
  const session = getNeo4j().session();
  try {
    const result = await session.run(`
      MATCH (uc:UseCase {id: $useCaseId})
      OPTIONAL MATCH (uc)-[:USES_PRODUCT]->(p:Product)<-[:OFFERS]-(v:Vendor)
      OPTIONAL MATCH (v)-[:HAS_POSTURE]->(posture:VendorPosture)
      OPTIONAL MATCH (uc)-[:SUBJECT_TO]->(r:Regulation)-[:HAS_SECTION]->(rs:RegulationSection)
      OPTIONAL MATCH (uc)-[:TRIGGERS]->(gp:GenomePattern)-[:VIOLATES]->(fc:FrameworkControl)
      OPTIONAL MATCH (uc)-[:BENCHMARKED_AGAINST]->(b:Benchmark)
      OPTIONAL MATCH (uc)<-[:ADDRESSES]-(eng:Engagement)
      OPTIONAL MATCH (gp)<-[:SURFACED]-(peer:Engagement)
        WHERE peer.id <> eng.id
          AND peer.industry_code = uc.industry_code
      RETURN
        uc,
        collect(DISTINCT {vendor: v, product: p, posture: posture}) AS vendor_stack,
        collect(DISTINCT {regulation: r, section: rs}) AS regulations,
        collect(DISTINCT {pattern: gp, violates: fc}) AS patterns,
        collect(DISTINCT b) AS benchmarks,
        count(DISTINCT peer) AS peer_engagements_same_pattern
    `, { useCaseId });
    return parseUseCaseReasoning(result.records[0]);
  } finally { await session.close(); }
}
```

**Use:** any time Nexus is discussing a specific use case. Gives the complete context in one call.

#### 2. Vendor risk check

```typescript
export async function getVendorRiskProfile(vendorName: string, clientIndustry: string, dataClasses: string[]) {
  const result = await session.run(`
    MATCH (v:Vendor {name: $vendorName})-[:HAS_POSTURE]->(posture:VendorPosture)
    MATCH (v)-[:COMPLIES_WITH]->(f:Framework)
    OPTIONAL MATCH (i:Industry {code: $clientIndustry})<-[:APPLIES_TO]-(r:Regulation)
      WHERE ANY(topic IN $dataClasses WHERE (r)-[:GOVERNS]->(:Topic {key: topic}))
    RETURN
      v, posture,
      collect(DISTINCT f.code) AS complies_with,
      collect(DISTINCT r.code) AS applicable_regulations
  `, { vendorName, clientIndustry, dataClasses });
  return parseVendorRisk(result.records[0]);
}
```

**Use:** Tower Risk dimension. When a use case is flagged with PHI, call this with vendor + industry + [PHI, financial] to get fit assessment.

#### 3. Peer benchmark lookup

```typescript
export async function getPeerBenchmark(metricName: string, industry: string, clientValue: number) {
  const result = await session.run(`
    MATCH (b:Benchmark)-[:MEASURES_IN]->(:Industry {code: $industry})
    WHERE b.metric_name CONTAINS $metricName
    RETURN b
    ORDER BY b.as_of_date DESC
    LIMIT 1
  `, { metricName, industry });

  const benchmark = result.records[0]?.get('b').properties;
  if (!benchmark) return null;

  const percentile = computePercentile(clientValue, benchmark);
  return { benchmark, clientValue, percentile };
}
```

**Use:** Tower Value dimension. *"Meridian HF readmission = 15.2%. Benchmark median = 21.8%. Client is in the top 15%."*

#### 4. Pattern history traversal

```typescript
export async function getPatternHistory(patternCode: string, industry?: string) {
  const result = await session.run(`
    MATCH (gp:GenomePattern {code: $patternCode})<-[:SURFACED]-(eng:Engagement)
    ${industry ? `WHERE eng.industry_code = $industry` : ''}
    OPTIONAL MATCH (eng)-[:FOR]->(c:Client)
    RETURN
      gp.failure_rate_pct AS failure_rate,
      count(DISTINCT eng) AS total_engagements,
      count(DISTINCT CASE WHEN eng.outcome = 'succeeded' THEN eng END) AS succeeded,
      count(DISTINCT CASE WHEN eng.outcome = 'failed' THEN eng END) AS failed,
      collect(DISTINCT {engagement: eng.id, client: c.name, outcome: eng.outcome})[0..5] AS recent
  `, { patternCode, industry });
  return parsePatternHistory(result.records[0]);
}
```

**Use:** when Nexus mentions a pattern triggering, it can cite actual history: *"F008 has triggered in 12 prior healthcare engagements; 8 of 12 failed to verify ROI."*

#### 5. Regulatory applicability

```typescript
export async function getApplicableRegulations(industryCode: string, topicKeys?: string[]) {
  const result = await session.run(`
    MATCH (i:Industry {code: $industryCode})<-[:APPLIES_TO]-(r:Regulation)
    ${topicKeys ? `
      WHERE EXISTS {
        MATCH (r)-[:HAS_SECTION]->(:RegulationSection)-[:GOVERNS]->(t:Topic)
        WHERE t.key IN $topicKeys
      }
    ` : ''}
    OPTIONAL MATCH (r)-[:HAS_SECTION]->(rs:RegulationSection)
      WHERE ${topicKeys ? '(rs)-[:GOVERNS]->(:Topic) AND ' : ''} true
    RETURN
      r.code AS code, r.name AS name, r.jurisdiction AS jurisdiction,
      collect(DISTINCT {code: rs.code, title: rs.title}) AS relevant_sections
  `, { industryCode, topicKeys });
  return parseRegulations(result.records);
}
```

**Use:** scoping any engagement in Phase 0. Pulls every applicable regulation + the relevant sections for the topics at play.

#### 6. Cross-client learning

```typescript
export async function getCrossClientLearning(currentEngagementId: string, patternCode: string) {
  const result = await session.run(`
    MATCH (currentEng:Engagement {id: $currentEngagementId})-[:FOR]->(currentClient:Client)
    MATCH (currentClient)-[:IN_INDUSTRY]->(i:Industry)
    MATCH (gp:GenomePattern {code: $patternCode})<-[:SURFACED]-(peerEng:Engagement)
      WHERE peerEng.id <> currentEng.id
    MATCH (peerEng)-[:FOR]->(peerClient:Client)-[:IN_INDUSTRY]->(i)
    OPTIONAL MATCH (peerEng)-[:ADDRESSES]->(peerUc:UseCase)
    OPTIONAL MATCH (peerEng)-[:SURFACED]->(otherGp:GenomePattern)
      WHERE otherGp <> gp
    RETURN
      peerEng.id AS engagement_id,
      peerEng.outcome AS outcome,
      peerEng.lesson_learned AS lesson,
      collect(DISTINCT otherGp.code) AS co_triggered_patterns,
      collect(DISTINCT peerUc.name) AS use_cases
    ORDER BY peerEng.completed_at DESC
    LIMIT 5
  `, { currentEngagementId, patternCode });
  return parseCrossClient(result.records);
}
```

**Use:** delight moments. *"Interesting — the only two healthcare IDN engagements where F008 triggered AND the engagement succeeded also had F003 (CFO in governance) triggered. You've scoped Sarah as sponsor, not the CFO."*

### Commit

```
feat(graph): six reasoning queries — use-case chain, vendor risk, peer benchmark, pattern history, regulatory applicability, cross-client learning
```

---

## Phase D · Retrieval integration

**Intent:** The retrieval pipeline (Industry Knowledge Layer Phase 6) gets extended to include graph reasoning alongside vector chunks. Agent system prompts get a `GRAPH REASONING` block.

### File: `src/lib/agent/retrieval.ts` (extended)

```typescript
export async function assembleRetrievalContext(args: RetrievalArgs) {
  const [clientChunks, industryChunks, topicChunks, graphReasoning] = await Promise.all([
    queryPinecone(queryVector, `client:${args.clientId}`, { topK: 5 }),
    queryPinecone(queryVector, `global:${industryKey(args.industry)}`, { topK: 3 }),
    queryPinecone(queryVector, 'global:ai_governance', { topK: 2 }),
    assembleGraphReasoning(args),    // NEW
  ]);

  return { clientChunks, industryChunks, topicChunks, graphReasoning };
}

async function assembleGraphReasoning(args: RetrievalArgs) {
  const reasoning: any = {};

  // Always pull: applicable regulations for the industry
  if (args.industry) {
    reasoning.regulations = await getApplicableRegulations(args.industry);
  }

  // If an engagement is active: pull its use cases + pattern history
  if (args.engagementId) {
    const activePatterns = await getActivePatterns(args.engagementId);
    reasoning.patterns = await Promise.all(
      activePatterns.map(p => getPatternHistory(p.code, args.industry))
    );
  }

  // If the user's turn mentions a specific use case: pull its full reasoning chain
  const mentionedUseCase = await detectUseCaseReference(args.userQuery, args.clientId);
  if (mentionedUseCase) {
    reasoning.useCase = await getUseCaseReasoning(mentionedUseCase.id);
  }

  return reasoning;
}
```

### Prompt block format

In the system prompt, after `RETRIEVED CONTEXT`:

```
GRAPH REASONING

APPLICABLE REGULATIONS (this client's industry)
- HIPAA (US) — relevant sections: § 164.308, § 164.312
- HHS HIPAA Security Rule (US) — PHI handling, monitoring
- NIST AI RMF (US, federal guidance) — not mandatory, strongly recommended

ACTIVE PATTERN HISTORY
- F008 · AI investment without verified ROI (91% failure rate)
  Triggered in 12 prior healthcare IDN engagements; 8 of 12 failed to verify ROI,
  4 succeeded (all 4 had F003 CFO-in-governance co-triggered).
- F007 · CDO vacancy through transition (79%)
  Triggered in 9 prior; 6 failed, 3 succeeded.

CURRENT USE CASE (Copilot Clinical Documentation)
- Vendor: Microsoft Copilot Clinical
  Posture: HIPAA BAA ✓, SOC 2 Type II ✓, US-only data residency ✓
- Subject to: HIPAA § 164.308, HIPAA § 164.312, state AI disclosure laws
- Benchmarks: no direct benchmark matched (metric name too specific)
- Patterns triggering: F008 · AI investment without verified ROI
  This pattern VIOLATES NIST AI RMF MEASURE 2.3 (continuous monitoring).
```

### Commit

```
feat(graph): retrieval integration — GRAPH REASONING block in agent system prompts
```

---

## Phase E · Graph visualization endpoint

**Intent:** Debug + demo tool. `/admin/graph?engagementId=X` renders the graph traversed for a given engagement as an interactive force-directed visualization.

### File: `src/app/admin/graph/page.tsx`

Uses `react-force-graph-2d` or similar. Fetches graph subgraph via `/api/admin/graph/[engagementId]` which runs:

```cypher
MATCH (eng:Engagement {id: $engagementId})
CALL apoc.path.subgraphAll(eng, {
  relationshipFilter: 'FOR|ADDRESSES|SURFACED|USES_PRODUCT|SUBJECT_TO|TRIGGERS|VIOLATES|BENCHMARKED_AGAINST|HAS_POSTURE|APPLIES_TO',
  maxLevel: 4
}) YIELD nodes, relationships
RETURN nodes, relationships
```

(If APOC isn't available in your Aura tier, replace with manual multi-hop query.)

Nodes colored by type: teal for GenomePattern, orange for Regulation, gold for Vendor, white for Client/UseCase. Click a node to see properties. Click an edge to see relationship properties.

**Investor demo value:** this is the "show me the reasoning graph" moment. Makes the moat visible.

### Commit

```
feat(graph): admin graph visualization endpoint for debug + demo
```

---

## What this pack ships

- 14-node reasoning graph populated automatically as knowledge sources ingest
- 6 Cypher reasoning queries available to every Nexus turn
- Agent system prompts carry graph-derived facts (applicable regulations, pattern history with real counts, use case chains, cross-client precedents) alongside vector chunks
- Admin visualization endpoint to see the graph for any engagement

**Impact:** Nexus reasons in chains, not just facts.

Before: *"HIPAA applies here. That pattern is risky."*
After: *"Copilot Clinical Documentation is subject to HIPAA § 164.308. It's triggering F008 — which has fired in 12 prior healthcare engagements, 8 of which failed to verify ROI. All 4 that succeeded had the CFO in governance; you've scoped Sarah alone. Worth reconsidering governance structure."*

That second sentence is the moat.
