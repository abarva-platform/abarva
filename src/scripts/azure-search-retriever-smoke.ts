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
//   AZURE_SEARCH_ADMIN_KEY (lab admin key) or Azure RBAC via DefaultAzureCredential
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
//   npx tsx src/scripts/azure-search-retriever-smoke.ts --require-results
//   npx tsx src/scripts/azure-search-retriever-smoke.ts --tenant apex-retail --top-k 5

import { queryTenantContext } from '@/lib/azure-search/tenant-context-retriever';

const TENANTS: ReadonlyArray<string> = [
  'apex-retail',
  'meridian-health',
  'first-capital',
];

const DEFAULT_QUERY =
  'How is contact center AI improving customer experience and operating cost?';

interface CliArgs {
  query: string;
  topK: number;
  tenants: ReadonlyArray<string>;
  requireResults: boolean;
}

interface TenantSmokeResult {
  tenant: string;
  hitCount: number;
  ok: boolean;
  error?: string;
}

function parseArgs(argv: ReadonlyArray<string>): CliArgs {
  const tenants: string[] = [];
  let query = '';
  let topK = 3;
  let requireResults = false;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--require-results') {
      requireResults = true;
      continue;
    }
    if (arg === '--tenant') {
      const value = argv[i + 1]?.trim();
      if (!value) throw new Error('--tenant requires a value.');
      tenants.push(value);
      i += 1;
      continue;
    }
    if (arg === '--top-k') {
      const value = Number.parseInt(argv[i + 1] ?? '', 10);
      if (!Number.isFinite(value) || value < 1) {
        throw new Error('--top-k requires a positive integer.');
      }
      topK = value;
      i += 1;
      continue;
    }
    if (arg.startsWith('--')) {
      throw new Error(`Unknown argument: ${arg}`);
    }
    query = query ? `${query} ${arg}` : arg;
  }

  return {
    query: query.trim() || DEFAULT_QUERY,
    topK,
    tenants: tenants.length > 0 ? tenants : TENANTS,
    requireResults,
  };
}

async function main(): Promise<void> {
  const { query, topK, tenants, requireResults } = parseArgs(process.argv.slice(2));

  if (!process.env.AZURE_SEARCH_ADMIN_KEY && !process.env.AZURE_CLIENT_ID) {
    console.warn(JSON.stringify({
      event: 'azure_search_retriever_smoke_using_default_credential',
      message: 'AZURE_SEARCH_ADMIN_KEY/AZURE_CLIENT_ID not set; attempting DefaultAzureCredential.',
    }));
  }

  const results: TenantSmokeResult[] = [];

  for (const tenantClientKey of tenants) {
    try {
      const hits = await queryTenantContext({
        tenantClientKey,
        query,
        topK,
      });
      const ok = !requireResults || hits.length > 0;
      results.push({ tenant: tenantClientKey, hitCount: hits.length, ok });
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
      results.push({
        tenant: tenantClientKey,
        hitCount: 0,
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      });
      console.error(JSON.stringify({
        event: 'azure_search_retriever_smoke_failed',
        tenant: tenantClientKey,
        error: err instanceof Error ? err.message : String(err),
      }));
    }
  }

  const failed = results.filter((result) => !result.ok);
  console.log(JSON.stringify({
    event: failed.length === 0
      ? 'azure_search_retriever_smoke_passed'
      : 'azure_search_retriever_smoke_failed_summary',
    index: 'tenant-context-v1',
    query,
    topK,
    requireResults,
    tenants: results,
  }));

  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(JSON.stringify({
    event: 'azure_search_retriever_smoke_fatal',
    error: err instanceof Error ? err.message : String(err),
  }));
  process.exit(1);
});
