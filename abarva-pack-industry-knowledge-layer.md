# AbarVa Build Pack · Industry Knowledge Layer

**Date:** April 19, 2026
**Scope:** Global industry knowledge layer — government data, regulatory frameworks, research, vendor documentation, curated news feeds. Merged with client-specific knowledge at retrieval time. Nexus cites sources explicitly.
**Effort:** ~5-7 days across 7 phases. Each phase ships value independently.
**Slots in:** after Pack 10 (Tower) and Pack · Nexus Depth. Can run in parallel with Tier 1 API integrations.

---

## Why this pack

Today's Nexus knows about:
- The client's uploaded documents (Pinecone `client:<id>` namespace)
- Genome patterns in Neo4j
- Turn history

It doesn't know about:
- HIPAA, GDPR, SEC, NIST AI RMF, EU AI Act
- How the client's metrics compare to the industry median
- What the FTC just enforced against a peer
- What Anthropic's DPA actually says vs. OpenAI's
- What Stanford HAI published last week

Without an industry knowledge layer, Nexus is confident about the client and mute about the world. That's the wrong posture for a CIO-facing product. This pack fixes it.

The layer serves three uses:
1. **Nexus retrieval** — every Phase 1 Diagnose or Phase 2 Design conversation pulls relevant industry context alongside client context
2. **Tower reference data** — benchmarks for value dimension, vendor postures for risk dimension, regulations for compliance
3. **Citation** — Nexus names its sources. *"HFMA's 2024 benchmark puts denial rate median at 8.4%. Meridian is at 11%."*

---

## Prerequisites

- Packs 1-10 shipped, Tower live
- Pinecone account with `nexus-knowledge` index (already exists, used for client namespace today)
- Budget for Pinecone: adding ~500K additional vectors = ~$5/month on current tier, or an upgrade depending on namespace sharding

---

## How to use this document

Seven phases. Each lands commits and is independently shippable. Recommend sequence: 1 → 2 → 6 (retrieval wiring with initial data) → 3 → 4 → 5 → 7.

---

## Phase 1 · Data model + retrieval architecture

**Intent:** Extend Pinecone + Neo4j + Postgres schemas to support global knowledge with source metadata, freshness, and licensing class. Two new Postgres tables track what's been ingested.

### Migration 024 — knowledge source tracking

**`db/migrations/024_knowledge_sources.sql`**

```sql
BEGIN;

CREATE TYPE knowledge_license_class AS ENUM (
  'public_domain',        -- government data, open standards — freely redistributable
  'attribution',          -- free with attribution (most academic, many non-profits)
  'registration',         -- free behind registration
  'fair_use_excerpt',     -- licensed content, short excerpts with attribution only
  'licensed'              -- paid license, full ingestion
);

CREATE TYPE knowledge_content_type AS ENUM (
  'regulation',           -- HIPAA, SEC rules, EU AI Act
  'framework',            -- NIST AI RMF, NIST CSF, ISO 42001
  'benchmark',            -- CMS Hospital Compare, FDIC Call Reports, HFMA benchmarks
  'research_report',      -- Stanford HAI, Pew, academic papers
  'vendor_doc',           -- Anthropic docs, Copilot docs
  'vendor_posture',       -- SOC 2, DPA, subprocessors
  'news_article',         -- curated news
  'case_study',           -- peer transformations (public)
  'enforcement_action'    -- FTC, HHS, SEC enforcement
);

CREATE TABLE knowledge_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_key TEXT UNIQUE NOT NULL,        -- stable key like 'nist_ai_rmf_1_0'
  title TEXT NOT NULL,
  publisher TEXT NOT NULL,
  publisher_url TEXT,
  source_url TEXT NOT NULL,               -- canonical URL of this document/resource
  content_type knowledge_content_type NOT NULL,
  license_class knowledge_license_class NOT NULL,
  license_notes TEXT,
  industry_tags TEXT[] DEFAULT '{}',      -- ['HEALTHCARE_IDN', 'FINSERV', 'GENERAL']
  topic_tags TEXT[] DEFAULT '{}',         -- ['ai_governance', 'privacy', 'copilot']
  published_at DATE,
  half_life_days INT DEFAULT 365,         -- how fast this content decays in relevance
  chunk_count INT DEFAULT 0,
  pinecone_namespace TEXT NOT NULL,       -- 'global:healthcare_idn', 'global:ai_governance'
  last_ingested_at TIMESTAMPTZ,
  last_refresh_check_at TIMESTAMPTZ,
  content_hash TEXT,                      -- for change detection
  status TEXT CHECK (status IN ('pending', 'ingesting', 'active', 'stale', 'failed', 'licensed_hold')),
  ingestion_notes JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_knowledge_sources_industry ON knowledge_sources USING GIN(industry_tags);
CREATE INDEX idx_knowledge_sources_topics ON knowledge_sources USING GIN(topic_tags);
CREATE INDEX idx_knowledge_sources_status ON knowledge_sources(status);

-- Per-chunk metadata (Pinecone stores the vector + minimal metadata, this is the fuller record)
CREATE TABLE knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES knowledge_sources(id) ON DELETE CASCADE,
  pinecone_id TEXT NOT NULL UNIQUE,       -- ID used in Pinecone upsert
  chunk_text TEXT NOT NULL,
  section TEXT,                           -- e.g., 'NIST AI RMF § 3.2.1', 'HIPAA § 164.308'
  page_number INT,
  token_count INT,
  chunk_metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_knowledge_chunks_source ON knowledge_chunks(source_id);

-- RLS: service role only (knowledge is shared across all clients)
ALTER TABLE knowledge_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_knowledge_sources" ON knowledge_sources
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_knowledge_chunks" ON knowledge_chunks
  FOR ALL TO service_role USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';

COMMIT;
```

### Neo4j schema additions

Add to `db/graph/migrations/004_industry_knowledge.cypher`:

```cypher
// New node types for graph-queryable knowledge entities
CREATE CONSTRAINT regulation_code IF NOT EXISTS FOR (r:Regulation) REQUIRE r.code IS UNIQUE;
CREATE CONSTRAINT framework_code IF NOT EXISTS FOR (f:Framework) REQUIRE f.code IS UNIQUE;
CREATE CONSTRAINT benchmark_key IF NOT EXISTS FOR (b:Benchmark) REQUIRE b.key IS UNIQUE;
CREATE CONSTRAINT vendor_name IF NOT EXISTS FOR (v:Vendor) REQUIRE v.name IS UNIQUE;

CREATE INDEX regulation_industry IF NOT EXISTS FOR (r:Regulation) ON (r.industry_code);
CREATE INDEX benchmark_metric IF NOT EXISTS FOR (b:Benchmark) ON (b.metric_name);

// Example relationships to be populated during ingestion
// (:Regulation)-[:APPLIES_TO]->(:Industry)
// (:Framework)-[:COVERS_TOPIC]->(:Topic)
// (:Benchmark)-[:MEASURES]->(:Metric) MEASURES {unit, median, p25, p75}
// (:Vendor)-[:OFFERS]->(:Product)
// (:Vendor)-[:HAS_POSTURE]->(:VendorPosture) HAS_POSTURE {data_residency, training_opt_out}
// (:GenomePattern)-[:RELATES_TO]->(:Regulation) — how failure patterns map to compliance
```

### Directory structure for ingestion scripts

```
src/scripts/knowledge/
  ├── sources/
  │   ├── tier1_government.ts           (Phase 2)
  │   ├── tier2_frameworks.ts           (Phase 3)
  │   ├── tier3_academic_vendor.ts      (Phase 4)
  │   └── tier4_news_rss.ts             (Phase 5)
  ├── ingest/
  │   ├── pdf_ingest.ts                 (chunk PDFs with page tracking)
  │   ├── html_ingest.ts                (scrape + clean HTML docs)
  │   ├── rss_ingest.ts                 (parse RSS feeds, dedupe by hash)
  │   ├── api_ingest.ts                 (structured data via APIs)
  │   └── graph_extract.ts              (pull structured entities into Neo4j)
  ├── chunking.ts                       (section-aware chunking with token budget)
  ├── embedding.ts                      (Voyage-3 or OpenAI text-embedding-3-large)
  └── run-all.ts                        (orchestrator for scheduled refresh)
```

### Commit

```
feat(knowledge): migration 024 — knowledge sources + chunks tables + Neo4j schema extensions
```

---

## Phase 2 · Tier 1 · Government data (public domain, zero friction)

**Intent:** Download and ingest the 8 highest-signal government datasets. All public domain, no license issues, stable URLs.

### Sources (8)

| # | Key | Source | Format | Namespace |
|---|---|---|---|---|
| 1 | `nist_ai_rmf_1_0` | NIST AI Risk Management Framework 1.0 + Generative AI Profile | PDF | `global:ai_governance` |
| 2 | `nist_csf_2_0` | NIST Cybersecurity Framework 2.0 | PDF | `global:cybersecurity` |
| 3 | `hhs_hipaa_privacy_rule` | HHS HIPAA Privacy Rule (45 CFR Parts 160 + 164) | HTML | `global:healthcare_idn` |
| 4 | `hhs_hipaa_security_rule` | HHS HIPAA Security Rule | HTML | `global:healthcare_idn` |
| 5 | `cms_hospital_compare` | CMS Hospital Compare benchmark data | CSV (API) | `global:healthcare_idn` |
| 6 | `fdic_quarterly_banking` | FDIC Quarterly Banking Profile | CSV (API) | `global:finserv` |
| 7 | `sec_edgar_10k_index` | SEC EDGAR 10-K filings index (full-text via API on demand) | API | `global:finserv` |
| 8 | `fred_economic_data` | FRED key macro series (10-year rates, CPI, unemployment, industry production) | CSV (API) | `global:general_macro` |

### Ingestion script: `src/scripts/knowledge/sources/tier1_government.ts`

Implementation sketch (full working code with retries, chunking, deduplication):

```typescript
import { chunkPdf, chunkHtml, ingestApi } from '../ingest';
import { upsertSource } from '../db';

const TIER1_SOURCES = [
  {
    key: 'nist_ai_rmf_1_0',
    title: 'NIST AI Risk Management Framework 1.0',
    publisher: 'NIST',
    source_url: 'https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.100-1.pdf',
    content_type: 'framework',
    license_class: 'public_domain',
    industry_tags: ['GENERAL'],
    topic_tags: ['ai_governance', 'risk', 'ai_rmf'],
    pinecone_namespace: 'global:ai_governance',
    published_at: '2023-01-26',
    half_life_days: 1095, // 3 years — foundational doc
    ingest: async (sourceId) => chunkPdf(sourceId, /* chunk options */),
  },
  // ... rest of the 8
];

export async function ingestTier1() {
  for (const source of TIER1_SOURCES) {
    await upsertSource(source);
    await source.ingest(source.id);
  }
}
```

### Chunking strategy for tier 1

- **Regulations** (HIPAA): chunk by section (§ 164.308, § 164.312, etc.). Each chunk gets `section` metadata. Token budget 512-1024 per chunk.
- **Frameworks** (NIST AI RMF, CSF): chunk by function/category (GOVERN, MAP, MEASURE, MANAGE for AI RMF). Section metadata included.
- **Benchmarks** (CMS, FDIC): structured CSV data. Chunk by metric+geographic rollup. Index in Postgres as structured rows too (both searchable via SQL and retrievable via Pinecone).
- **10-K filings**: lazy — don't ingest on schedule, fetch on demand when a specific company is referenced.
- **FRED**: chunk one series = one "document" with narrative description.

### Neo4j extraction

After chunking, extract entities into Neo4j:

```typescript
// For HIPAA: create (:Regulation {code: 'HIPAA', name: 'HIPAA', jurisdiction: 'US'})
//            and (:Regulation)-[:HAS_SECTION]->(:RegulationSection {code: '164.308'})
//            and (:Regulation)-[:APPLIES_TO]->(:Industry {code: 'HEALTHCARE_IDN'})

// For CMS Hospital Compare: (:Benchmark {key: 'cms_30day_readmission_hf', metric: '30-day readmission — heart failure', industry: 'HEALTHCARE_IDN'})
//                           with properties {national_median, p25, p75, n_hospitals, source: 'CMS'}
```

This makes benchmarks *queryable*: `MATCH (b:Benchmark {key: 'cms_30day_readmission_hf'}) RETURN b.national_median`.

### Commit

```
feat(knowledge): Tier 1 ingest — 8 government sources (NIST, HIPAA, CMS, FDIC, SEC, FRED)
```

---

## Phase 3 · Tier 2 · Frameworks + research (attribution-free)

**Intent:** 10 sources. Free with attribution. Mainly research + industry frameworks. Enables Nexus to cite *"Stanford HAI AI Index 2026 shows..."* with specificity.

### Sources (10)

| # | Key | Source | License | Namespace |
|---|---|---|---|---|
| 9 | `stanford_hai_ai_index_2026` | Stanford HAI AI Index 2026 (full report + data tables) | attribution | `global:ai_governance` |
| 10 | `pew_ai_surveys_latest` | Pew Research Center AI surveys (2024-2026) | attribution | `global:ai_governance` |
| 11 | `eu_ai_act_text` | EU AI Act official text + implementation Q&A | public_domain | `global:ai_governance` |
| 12 | `iso_42001_summary` | ISO/IEC 42001 AI Management Systems — abstract + TOC (full is licensed, don't ingest) | fair_use_excerpt | `global:ai_governance` |
| 13 | `ahrq_healthcare_quality` | AHRQ National Healthcare Quality & Disparities Report | public_domain | `global:healthcare_idn` |
| 14 | `ffiec_call_reports` | FFIEC Call Reports aggregated data | public_domain | `global:finserv` |
| 15 | `nrf_retail_economic_impact` | NRF annual retail industry report | attribution | `global:retail` |
| 16 | `bls_labor_cost_data` | BLS OES + Labor Productivity data | public_domain | `global:general_macro` |
| 17 | `ftc_ai_enforcement` | FTC AI enforcement actions (all public) | public_domain | `global:ai_governance` |
| 18 | `hhs_ocr_enforcement` | HHS OCR (Office for Civil Rights) HIPAA enforcement actions | public_domain | `global:healthcare_idn` |

### Ingestion script: `src/scripts/knowledge/sources/tier2_frameworks.ts`

Same pattern as Tier 1. Key addition: **attribution text preserved in every chunk's metadata**.

Every chunk gets `chunk_metadata.attribution` populated with the required citation string:

```typescript
// Stanford HAI example
{
  attribution: 'Stanford HAI, "AI Index Report 2026," published April 2026.',
  source_url: 'https://aiindex.stanford.edu/report/',
  license_class: 'attribution',
}
```

At retrieval time, when Nexus cites this chunk in a response, the UI renders the attribution line automatically.

### Commit

```
feat(knowledge): Tier 2 ingest — 10 research + framework sources (Stanford HAI, Pew, EU AI Act, etc.)
```

---

## Phase 4 · Tier 3 · Academic + vendor documentation

**Intent:** arXiv + major vendor docs + vendor security postures. Enables Nexus to reason about technical papers and compare vendors' data practices.

### Sources (9)

| # | Key | Source | License | Namespace |
|---|---|---|---|---|
| 19 | `arxiv_ai_recent_2y` | arXiv cs.AI, cs.CL, cs.LG — past 2 years abstracts + selected full papers | attribution (CC-BY) | `global:academic_ai` |
| 20 | `anthropic_docs` | docs.anthropic.com — full product docs | attribution | `global:vendor_anthropic` |
| 21 | `openai_docs` | platform.openai.com/docs | attribution | `global:vendor_openai` |
| 22 | `microsoft_copilot_docs` | learn.microsoft.com/copilot | attribution | `global:vendor_microsoft` |
| 23 | `salesforce_einstein_docs` | help.salesforce.com/einstein | attribution | `global:vendor_salesforce` |
| 24 | `servicenow_ai_docs` | docs.servicenow.com/ai | attribution | `global:vendor_servicenow` |
| 25 | `vendor_security_postures` | SOC 2 summary + DPA + subprocessor lists from 6 major vendors | attribution | `global:vendor_postures` |
| 26 | `aws_trust_center` | AWS Trust Center content | attribution | `global:cloud_posture` |
| 27 | `azure_trust_center` | Microsoft Trust Center content | attribution | `global:cloud_posture` |

### Ingestion approach

**arXiv:** use arXiv API (bulk-metadata OAI-PMH feed). Ingest all abstracts in cs.AI/CL/LG. Full-text ingestion for top-200 papers by citation count only (keeps volume manageable).

**Vendor docs:** most have sitemaps. Crawl + scrape + clean HTML. Respect robots.txt. Rate-limit politely (1 request/sec, user-agent identifies AbarVa). Cache aggressively.

**Vendor security postures:** these are usually published as PDFs with stable URLs. Ingest full PDFs. Focus on DPA clauses, subprocessor lists, data residency commitments, training opt-out language.

### Neo4j extraction — Vendor nodes

After ingesting Tier 3:

```cypher
CREATE (v:Vendor {name: 'Anthropic'})
  SET v.headquarters_country = 'US',
      v.training_opt_out_default = true,
      v.data_residency_options = ['US', 'EU'],
      v.soc2_type2 = true,
      v.hipaa_baa_available = true;

CREATE (v:Vendor {name: 'OpenAI'})
  SET v.headquarters_country = 'US',
      v.training_opt_out_default = true,  // for Enterprise
      v.data_residency_options = ['US'],
      v.soc2_type2 = true,
      v.hipaa_baa_available = true;

// ... Microsoft, Google, Salesforce, ServiceNow
```

These become referenceable in Tower's Risk dimension. *"Meridian's claims triage uses Anthropic Claude Enterprise. Anthropic's DPA commits to no training on customer data. Posture: aligned with PHI handling requirements."*

### Commit

```
feat(knowledge): Tier 3 ingest — arXiv + 5 vendor docs + vendor security postures + Neo4j Vendor nodes
```

---

## Phase 5 · Tier 4 · Curated news & RSS (licensing-aware)

**Intent:** Subscribe to ~12 high-signal RSS feeds. Ingest as freshness-decayed chunks. Dedupe by content hash. **Licensing: fair-use excerpts only — never full articles.**

### Sources (12)

| # | Key | Source | Feed | License posture |
|---|---|---|---|---|
| 28 | `nist_pubs_rss` | NIST publications | RSS | public_domain |
| 29 | `hhs_press_rss` | HHS press releases | RSS | public_domain |
| 30 | `sec_press_rss` | SEC press releases | RSS | public_domain |
| 31 | `ftc_press_rss` | FTC press releases | RSS | public_domain |
| 32 | `stanford_hai_blog` | Stanford HAI blog | RSS | attribution |
| 33 | `iapp_ai_governance_news` | IAPP AI Governance Center news | RSS (free tier) | fair_use_excerpt |
| 34 | `mit_tech_review_ai` | MIT Tech Review AI section | RSS | fair_use_excerpt |
| 35 | `brookings_ai_policy` | Brookings AI Policy | RSS | attribution |
| 36 | `bruegel_ai_policy` | Bruegel AI Policy | RSS | attribution |
| 37 | `oecd_ai_observatory` | OECD AI Observatory updates | RSS | public_domain |
| 38 | `eu_ai_office_updates` | EU AI Office announcements | RSS | public_domain |
| 39 | `nhs_ai_digital_blog` | NHS AI digital blog (UK healthcare reference) | RSS | attribution |

### Ingestion approach

Scheduled cron (daily):

```typescript
// src/scripts/knowledge/sources/tier4_news_rss.ts
import Parser from 'rss-parser';
import { hashContent } from '../chunking';

const parser = new Parser();

for (const feed of RSS_FEEDS) {
  const parsed = await parser.parseURL(feed.url);
  for (const item of parsed.items) {
    const hash = hashContent(item.title + item.pubDate);
    const exists = await checkChunkExists(hash);
    if (exists) continue;

    // Fair-use excerpt: first 300 words + attribution + link
    const excerpt = truncate(item.contentSnippet ?? item.content ?? '', 300);
    const chunkText = `${item.title}\n\n${excerpt}\n\n[Full article: ${item.link}]`;
    const metadata = {
      source_key: feed.key,
      published_at: item.pubDate,
      author: item.creator,
      url: item.link,
      attribution: feed.attribution_template,
    };

    await ingestChunk({ ... });
  }
}
```

### Freshness decay at retrieval

News chunks get a faster half-life (30-90 days) than regulatory docs. At retrieval, scores are decayed by age:

```typescript
const ageScore = Math.exp(-Math.log(2) * ageInDays / halfLifeDays);
const finalScore = vectorScore * ageScore;
```

Old news stops surfacing. Fresh news ranks high. Nexus naturally references recent developments.

### License hard limits

Fair-use excerpts: 300-word cap per article. **Never reproduce full articles.** Every chunk ends with a "[Full article: URL]" link. If asked to reproduce full content, Nexus refuses and links to the source.

### Commit

```
feat(knowledge): Tier 4 ingest — 12 RSS feeds with freshness decay and fair-use excerpt limits
```

---

## Phase 6 · Retrieval merge + citation format

**Intent:** Extend the existing retrieval pipeline so every Nexus turn pulls from global + client namespaces in parallel. Agent's system prompt gets labeled source blocks. Agent cites explicitly in responses.

### Updated retrieval flow

In `src/lib/agent/retrieval.ts`, extend the existing function:

```typescript
export async function assembleRetrievalContext(args: {
  engagementId?: string;
  clientId?: string;
  industry?: string;
  currentPhase?: number;
  userQuery: string;
  turnHistory: Turn[];
}): Promise<RetrievalContext> {
  // Compose the embedding query from user text + recent context
  const embeddingText = composeRetrievalQuery(args.userQuery, args.turnHistory);
  const queryVector = await embed(embeddingText);

  // Parallel fan-out across namespaces
  const [clientChunks, industryChunks, topicChunks, activePatterns, benchmarks, regulations] = await Promise.all([
    // Client-specific
    args.clientId
      ? queryPinecone(queryVector, `client:${args.clientId}`, { topK: 5 })
      : Promise.resolve([]),

    // Industry knowledge
    args.industry
      ? queryPinecone(queryVector, `global:${industryKey(args.industry)}`, { topK: 3 })
      : Promise.resolve([]),

    // AI governance + relevant cross-cutting topics
    queryPinecone(queryVector, 'global:ai_governance', { topK: 2 }),

    // Neo4j: triggered Genome patterns
    getActivePatterns(args.engagementId),

    // Neo4j: relevant benchmarks
    args.industry ? getBenchmarksForIndustry(args.industry) : Promise.resolve([]),

    // Neo4j: applicable regulations
    args.industry ? getRegulationsForIndustry(args.industry) : Promise.resolve([]),
  ]);

  // Age-decay news chunks
  const decayedIndustryChunks = applyFreshnessDecay(industryChunks);
  const decayedTopicChunks = applyFreshnessDecay(topicChunks);

  return {
    clientChunks,
    industryChunks: decayedIndustryChunks,
    topicChunks: decayedTopicChunks,
    activePatterns,
    benchmarks,
    regulations,
  };
}
```

### Updated system prompt composition

In `src/lib/agent/prompts/engagement.ts`, replace the existing retrieval block with labeled sources:

```typescript
function formatRetrievedContext(ctx: RetrievalContext): string {
  const lines: string[] = ['RETRIEVED CONTEXT', ''];

  if (ctx.regulations.length > 0) {
    lines.push('APPLICABLE REGULATIONS');
    for (const r of ctx.regulations) {
      lines.push(`- ${r.code} — ${r.name} (${r.jurisdiction})`);
    }
    lines.push('');
  }

  if (ctx.benchmarks.length > 0) {
    lines.push('INDUSTRY BENCHMARKS');
    for (const b of ctx.benchmarks) {
      lines.push(`- ${b.metric_name}: median ${b.national_median}${b.unit} [${b.source}]`);
    }
    lines.push('');
  }

  if (ctx.industryChunks.length > 0) {
    lines.push(`INDUSTRY KNOWLEDGE (${ctx.industry})`);
    for (const c of ctx.industryChunks) {
      lines.push(`[${c.source_key}${c.section ? ', ' + c.section : ''}]`);
      lines.push(c.text);
      lines.push('');
    }
  }

  if (ctx.topicChunks.length > 0) {
    lines.push('CROSS-CUTTING KNOWLEDGE');
    for (const c of ctx.topicChunks) {
      lines.push(`[${c.source_key}${c.section ? ', ' + c.section : ''}]`);
      lines.push(c.text);
      lines.push('');
    }
  }

  if (ctx.clientChunks.length > 0) {
    lines.push('CLIENT CONTEXT');
    for (const c of ctx.clientChunks) {
      lines.push(`[${c.document_name}${c.page ? ', page ' + c.page : ''}]`);
      lines.push(c.text);
      lines.push('');
    }
  }

  if (ctx.activePatterns.length > 0) {
    lines.push('ACTIVE GENOME PATTERNS');
    for (const p of ctx.activePatterns) {
      lines.push(`- ${p.code} · ${p.name} (${p.failure_rate}% historical failure rate, triggered)`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
```

### Citation instruction in system prompts

Add to all three Nexus modes' system prompts:

```
CITATION

When you reference something from the retrieved context, cite the source inline
in brackets. Format: [source_key § section] or [source_key, page N].

Examples:
- "NIST AI RMF [nist_ai_rmf_1_0 § 3.2.1] requires continuous monitoring..."
- "CMS data [cms_hospital_compare] shows national median readmission at 21.8%."
- "HIPAA § 164.308 [hhs_hipaa_security_rule] requires..."

Don't invent citations. If something isn't in your retrieved context, don't
cite it. You can still discuss it — just don't fabricate a source.

Keep citations tight and non-disruptive. Don't interrupt flow for every
sentence; cite once when a source is the basis for a claim.
```

### UI rendering of citations

In the turn bubble renderer, detect citation patterns and render as clickable tags that expand to show the source + link:

```tsx
// Parse [source_key § section] patterns in agent text
// Replace with <CitationTag sourceKey="..." section="..." />
// CitationTag renders as small inline teal pill; click shows tooltip with title + URL + attribution
```

### Commit

```
feat(knowledge): retrieval merge — parallel global + client namespaces, labeled sources, citation format
```

---

## Phase 7 · Refresh + maintenance

**Intent:** Knowledge gets stale. Automated refresh checks keep it current without manual intervention.

### Scheduled refresh worker

**`src/scripts/knowledge/refresh.ts`** — runs via Vercel Cron (daily at 3am UTC):

```typescript
// For each source where last_refresh_check_at > 7 days ago (or never):
//   1. Fetch current URL
//   2. Compute content hash
//   3. If hash differs from stored content_hash:
//      - Re-chunk + re-embed + upsert to Pinecone (updates existing pinecone_id, or creates new chunks)
//      - Update content_hash + last_ingested_at
//   4. Update last_refresh_check_at regardless

// For RSS feeds (Tier 4): every 24 hours
// For frameworks + regulations (Tier 1-2): every 30 days
// For research reports (annual): every 90 days
// For vendor docs (frequently updated): every 7 days
```

### Stale detection

Sources where `last_refresh_check_at > 90 days` and status='active' get flagged `status='stale'`. A dashboard panel (`/admin/knowledge`) surfaces these for manual review.

### Legal/IP review queue

Quarterly, review license classes:
- Has any Tier 4 publisher updated their terms?
- Any takedown requests received?
- Any vendor that was `attribution` now requires licensing?

Sources marked `status='licensed_hold'` stop retrieving until reviewed.

### Monitoring

Add a small widget on `/admin/knowledge`:
- Total sources: N
- Active / stale / failed: breakdown
- Total chunks: N
- Last refresh cycle: timestamp
- Recent failures (per source, last 5)

### Commit

```
feat(knowledge): automated refresh worker + stale detection + legal/IP review queue + admin dashboard
```

---

## Legal & IP considerations

This pack touches copyright carefully. Five principles:

1. **Public domain is free.** Government data (NIST, HHS, CMS, SEC, FDIC, BLS, FRED, FTC, EU AI Office). Ingest fully, no restrictions.

2. **Attribution-required content — attribute.** Stanford HAI, Pew, Brookings, Bruegel, OECD, NHS, vendor docs. Every chunk carries attribution metadata, rendered alongside any response that cites it.

3. **Fair-use excerpts — hard-limit length.** News articles, IAPP content, ISO/IEC summaries. 300-word cap. Full article link always included. If asked to reproduce more, Nexus refuses.

4. **Licensed content — cite, don't ingest.** Gartner, Forrester, IDC, paid journals. When referenced, Nexus links to source and quotes only within fair-use limits. Full reports never enter Pinecone.

5. **Vendor security postures — respect confidentiality markers.** If a vendor's DPA is marked "confidential to customers," don't ingest the confidential version. Use the publicly published version.

One practical note: **review Terms of Service before ingestion of any web-scraped content.** Some publishers explicitly prohibit AI training or ingestion. Automated ingestion violating ToS is a legal risk worth avoiding, especially as AbarVa scales to paying customers.

---

## Post-pack open items

| Item | When |
|---|---|
| Paid analyst data (Gartner, Forrester, IDC) | Post-seed, budget item |
| Automated shadow AI discovery via web research | Pack 12 (Control Tower intelligence) |
| Cross-client pattern aggregation (anonymized) | Post-seed, privacy-reviewed |
| Real-time web search during conversations | After Nexus Depth stabilizes |
| Industry-specific deeper sources (HFMA full library, AHIMA) | Per-industry pack |
| Non-English source coverage | Year 2 |

---

## What this pack ships

- 39 data sources ingested across 4 tiers
- Industry + governance knowledge merged with client knowledge at every Nexus turn
- Every cited claim traceable to a source with attribution
- Freshness decay on time-sensitive content
- Automated refresh keeping content current
- Legal posture sound for demo phase, scalable to licensed production

**Impact:** Nexus stops sounding like it only knows what the client told it. Starts sounding like a senior advisor who's read everything relevant and can cite chapter and verse. That's the difference between "impressive chatbot" and "hire this system."

The demo walkthrough adds a scene: in Sarah's engagement, Nexus references HIPAA § 164.308, compares Meridian's Star Rating to CMS national median, and cites NIST AI RMF when discussing governance. Not because it memorized these — because the retrieval layer carries them in every turn.

That's the shift this pack ships.
