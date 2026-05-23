# Worldview Retrieval Infrastructure Decision

Status: active coordination decision after INT-WV-2 and the parallel multi-index client work.

## Decision

Leave the current duplication in place for now.

The active founder-visible worldview retrieval path is:

- `src/lib/knowledge/context-broker/worldview-retrieval.ts`
- `ContextBundle.worldviewChunks: WorldviewChunkHit[]`
- corpus and full modes populate `worldviewChunks`
- Pinecone index: `abarva-worldview-prod`
- namespace: `worldview`
- embedding model: `text-embedding-3-large`
- embedding dimension: `3072`

The parallel infrastructure helpers are present but not the canonical worldview retrieval path today:

- `src/lib/knowledge/context-broker/pinecone-client.ts` includes worldview index configuration helpers.
- `src/lib/knowledge/context-broker/embedding-client.ts` includes `EMBEDDING_MODEL_WORLDVIEW` support.

These helpers are acceptable to leave because they are typed and tested, but future work should not refactor the active `worldview-retrieval.ts` path just to remove duplication unless there is a concrete quality, safety, or maintenance driver.

## Why Not Refactor Now

Refactoring the active retrieval path would be a refactor of shipped green work. The product behavior is already correct: corpus mode and full mode can return real worldview hits. A refactor now would add regression risk during a critical integration path without producing visible founder value.

The duplication is small and non-load-bearing. The risk of destabilizing working retrieval is higher than the cost of carrying the duplicate helper path for a short period.

## What Is Canonical Right Now

| Concern | Canonical For Now |
|---|---|
| Bundle field | `worldviewChunks: WorldviewChunkHit[]` |
| Active retrieval module | `src/lib/knowledge/context-broker/worldview-retrieval.ts` |
| Worldview Pinecone index | `abarva-worldview-prod` |
| Worldview namespace | `worldview` |
| Worldview embedding model | `text-embedding-3-large` |
| Worldview embedding dimension | `3072` |
| Tenant context index | `abarva-tenant-context-prod` |
| Tenant context embedding model | `text-embedding-3-small` |
| Tenant context embedding dimension | `1536` |
| Response lane | keep worldview chunks separate from tenant facts, graph paths, and pattern hits |

## What Future Agents Should Do

Future worldview, corpus, retrieval, context-broker, Pinecone, and embedding slices must start with a collision check.

Run:

```bash
gh pr list --state open --search "INT- OR CB- OR worldview OR context-broker OR Pinecone OR retrieval" --json number,title,headRefName,mergeStateStatus,url
```

Then inspect relevant merged work:

```bash
git fetch origin --prune
git log --oneline --decorate -20 origin/main -- worldview src/lib/knowledge/context-broker
rg -n "worldviewChunks|worldview-retrieval|PINECONE_INDEX_WORLDVIEW|EMBEDDING_MODEL_WORLDVIEW|abarva-worldview-prod" src docs worldview
```

Do not spawn or implement adjacent retrieval work until that check is complete.

## When To Reconcile

A cleanup/refactor slice is justified only if at least one condition becomes true:

1. `worldview-retrieval.ts` and the shared Pinecone client start diverging in behavior or env handling.
2. A second retrieval corpus needs the same 3072-dimensional path and duplication becomes recurring.
3. Tests begin failing because two modules encode inconsistent index or namespace assumptions.
4. Observability, retries, rate limits, or error handling need to be centralized.
5. The broker adds a formal multi-index registry and worldview retrieval can migrate without changing product behavior.

Until then, prefer stability over cleanup.

## Manual Setup Checklist

The platform setup path must provision and verify these items before claiming worldview retrieval is fully operational.

### Pinecone

- Create or verify `abarva-worldview-prod`.
- Confirm dimension is `3072`.
- Confirm metric matches the ingestion/query expectation.
- Confirm namespace `worldview` is used for W1-W5 chunks.
- Keep tenant context separate in `abarva-tenant-context-prod` at `1536` dimensions.
- Do not mix tenant and worldview vectors in one index.

### Embeddings

- Worldview chunks use `text-embedding-3-large`.
- Tenant context chunks use `text-embedding-3-small`.
- Do not re-embed tenant context into `text-embedding-3-large` unless a separate quality decision is made.
- Ingestion should validate vector length before upsert.

### Worldview Corpus

- Ingest `worldview/pinecone-ready/W1_pinecone.json` through `W5_pinecone.json`.
- Expected thesis count: `5`.
- Expected chunk count: `82`.
- Preserve metadata fields required by retrieval filters: `thesis_id`, `chunk_type`, `audience_tags`, `primary_audience`, `industry_examples_used`, `confidence`, `is_forecast`, `last_validated`.
- Keep citation metadata attached for Context Assembled rendering.

### Broker And UI

- Corpus mode should return worldview hits in `worldviewChunks`.
- Full mode should merge worldview hits with tenant facts, graph paths, and pattern results as separate lanes.
- Context Assembled should label worldview chunks by thesis and chunk id.
- Sentinel and Nexus should use worldview as strategic framing, not as tenant fact.
- Operational Source gates, approvals, artifact states, and evidence rules override worldview language.

### Verification

- Query corpus mode with: "What is the binding layer?"
- Expected: `worldviewChunks` includes W1 chunks.
- Query corpus mode with: "What happens to consulting?"
- Expected: `worldviewChunks` includes W4 or W5 chunks.
- Query full mode with a tenant-specific strategic question.
- Expected: tenant facts and worldview chunks appear in separate lanes.
- Query tenant mode with "Who is the CIO?"
- Expected: no worldview retrieval required.

## What Not To Do Yet

- Do not refactor `worldview-retrieval.ts` to use the shared Pinecone client solely for aesthetic cleanup.
- Do not collapse `worldviewChunks` into `corpusPatterns`.
- Do not use worldview chunks as evidence for tenant-specific facts.
- Do not re-embed tenant chunks into 3072 dimensions.
- Do not claim public thought-leadership publication readiness until citation-audit human review flags are cleared.

## Coordination Rule

Before any future work in retrieval or corpus territory, the owning agent must report:

1. open adjacent PRs checked,
2. active canonical module identified,
3. bundle field shape confirmed,
4. index and embedding dimensions confirmed,
5. whether the slice is product behavior, infrastructure refactor, or docs-only.

This is small discipline, but it prevents two correct agents from shipping overlapping architecture in parallel.
