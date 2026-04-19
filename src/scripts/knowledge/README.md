# Industry Knowledge Layer — ingestion scaffolding

**Status: scaffolding only.** Schema is live (Supabase migration 024 + Neo4j
migration 005), but no external sources have been ingested yet. This directory
holds the shape for incremental ingestion work.

## Why this is operational, not a one-shot build

The pack spec lists 39 external sources across regulators, research firms,
vendor docs, and news feeds. Each source has its own:

- Terms of service (some forbid automated crawl; some require API keys)
- Rate limits (SEC EDGAR: 10 req/s; Fed RSS: polite crawl; paywalled reports: manual)
- Update cadence (regs change annually; vendor docs monthly; news hourly)
- License class (public domain → fair-use excerpt → licensed only)

Shipping all 39 in one PR would either (a) hit rate limits and fail mid-run,
(b) silently scrape content we don't have rights to ingest, or (c) produce
stale snapshots that decay within weeks. The right shape is one source at a
time, with a human gate between "scraped" and "indexed".

## Directory layout

```
src/scripts/knowledge/
├── README.md                       ← you are here
├── sources/                        ← one file per external source
│   └── (e.g., frb-sr-11-7.ts)      ← each file declares metadata + fetcher
├── ingest/                         ← per-source ingestion runners
│   └── (e.g., ingest-frb.ts)
├── chunking.ts                     ← shared: split raw text into chunks
├── embedding.ts                    ← shared: Voyage/Anthropic embeddings → Pinecone
└── run-source.ts                   ← CLI: npx tsx run-source.ts <source_key>
```

## How to add one source

1. **Check the license.** Is it public domain (SEC filings), attribution-required
   (Fed speeches), fair-use-excerpt (paywalled reports — store title + excerpt
   + link only, never full text), or licensed (skip until we have a contract)?

2. **Write the source declaration** in `sources/<slug>.ts`:

   ```ts
   export const source = {
     source_key: 'frb-sr-11-7-2024',
     title: 'SR 11-7: Guidance on Model Risk Management',
     publisher: 'Federal Reserve Board',
     publisher_url: 'https://federalreserve.gov',
     source_url: 'https://www.federalreserve.gov/supervisionreg/srletters/sr1107.htm',
     content_type: 'regulation',
     license_class: 'public_domain',
     industry_tags: ['finserv', 'banking'],
     topic_tags: ['model_risk', 'ai_governance'],
     half_life_days: 730,
     pinecone_namespace: 'finserv-regulation',
   };

   export async function fetchRaw(): Promise<string> {
     // polite fetch, respect robots.txt, cache locally
   }
   ```

3. **Upsert the row** via `knowledge_sources` (status='pending').

4. **Run the ingest script**: fetches → chunks (~800 tokens w/ 100 overlap) →
   embeds → writes to Pinecone under the declared namespace → records each
   chunk in `knowledge_chunks` → flips source status to 'active' + sets
   content_hash + last_ingested_at.

5. **For graph-queryable entities** (regulations, frameworks, benchmarks,
   vendor postures), also write a `(:Regulation|...)` node to Neo4j with
   `SOURCED_FROM` edge to `(:KnowledgeSource {id})`. See
   `db/graph/migrations/005_industry_knowledge.cypher` for the vocabulary.

## What to NOT automate

- **Paywalled research** (Gartner, Forrester, McKinsey PDFs). Manual excerpt
  entry only, under fair-use excerpt license class. Never ingest full PDFs
  you don't own the license for.
- **Vendor marketing pages**. Prefer their docs, SOC 2 summaries, and
  published pricing. Marketing copy is noise.
- **Anything without a stable URL**. If the source is "a slack message
  from a friend at McKinsey", that's a Genome pattern, not a knowledge source.

## Refresh cadence

The `half_life_days` column drives `status='stale'` flipping. A separate
job (not built yet) runs nightly and marks sources as stale once
`last_ingested_at + half_life_days < now()`. Stale sources stay retrievable
but get a freshness-penalty in retrieval ranking.

## Current state

- Schema: ✅ migration 024 + cypher 005
- Citation rule in conversation principles: ✅
- First source ingested: ❌ none yet
- Ingestion helpers (chunking, embedding, run-source): ❌ not built

Add sources one at a time as engagements surface the need. Don't batch-build
39 sources up front — they'll be stale before the first engagement uses them.
