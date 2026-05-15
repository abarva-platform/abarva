#!/usr/bin/env -S npx tsx
// Smoke test for the Azure AI Search `tenant-context-v1` retriever.
//
// Runs a sample query for each canonical tenant in the roster and prints
// the top-3 hits as a JSON line per tenant. Useful to verify the
// retrieval lane locally before flipping `retrieval_azure_search` on for
// a tenant.
//
// Env (mirrors `src/scripts/azure-ai-search-backfill.ts`):
//
//   AZURE_SEARCH_ENDPOINT or AZURE_SEARCH_SERVICE_NAME
//   AZURE_SEARCH_ADMIN_KEY (lab admin key — RBAC AAD path lights up later)
//   AZURE_SEARCH_API_VERSION (defaults to '2024-07-01')
//
// Usage:
//
//   AZURE_SEARCH_ENDPOINT=https://srch-abarva-context-lab-eastus.search.windows.net \
//   AZURE_SEARCH_ADMIN_KEY=<from az search admin-key show> \
//   npx tsx src/scripts/azure-search-retriever-smoke.ts
//
// Optional: pass a custom query via the first positional argument, e.g.
//   npx tsx src/scripts/azure-search-retriever-smoke.ts "supply chain risk"

import { queryTenantContext } from '@/lib/azure-search/tenant-context-retriever';

const TENANTS: ReadonlyArray<string> = [
  'apex-retail',
  'meridian-health',
  'first-capital',
];

const DEFAULT_QUERY =
  'How is contact center AI improving customer experience and operating cost?';

async function main(): Promise<void> {
  const query = process.argv[2]?.trim() || DEFAULT_QUERY;
  const topK = 3;

  if (!process.env.AZURE_SEARCH_ADMIN_KEY && !process.env.AZURE_CLIENT_ID) {
    console.error(JSON.stringify({
      event: 'azure_search_retriever_smoke_env_missing',
      message: 'Set AZURE_SEARCH_ADMIN_KEY (lab admin key) or AZURE_CLIENT_ID (managed identity).',
    }));
    process.exit(1);
  }

  for (const tenantClientKey of TENANTS) {
    try {
      const hits = await queryTenantContext({
        tenantClientKey,
        query,
        topK,
      });
      console.log(JSON.stringify({
        event: 'azure_search_retriever_smoke_ok',
        tenant: tenantClientKey,
        query,
        topK,
        results: hits.map((hit) => ({
          chunkId: hit.chunkId,
          score: hit.vectorScore,
          sourceSegmentId: hit.sourceSegmentId,
          sourceDoc: hit.sourceDoc,
          excerpt: hit.text.slice(0, 160),
        })),
      }));
    } catch (err) {
      console.error(JSON.stringify({
        event: 'azure_search_retriever_smoke_failed',
        tenant: tenantClientKey,
        error: err instanceof Error ? err.message : String(err),
      }));
    }
  }
}

main().catch((err) => {
  console.error(JSON.stringify({
    event: 'azure_search_retriever_smoke_fatal',
    error: err instanceof Error ? err.message : String(err),
  }));
  process.exit(1);
});
