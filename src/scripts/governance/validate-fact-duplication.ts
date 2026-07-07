// validate:fact-duplication (Workstream B)
//
// Fails if any logical fact has more than one ACTIVE row in
// enterprise_context_facts — the duplication the WS-B supersede model prevents.
//
// Lab/CI mode: when no real Azure/Postgres URL is configured, this SKIPS (exit
// 0) rather than failing or fabricating a result — the authoritative check runs
// on Azure Container Apps where the private DB is reachable.

import { Client } from 'pg';
import { config as loadEnv } from 'dotenv';
import { postgresClientOptions } from '../postgres-client-options';

loadEnv({ path: '.env.local' });
loadEnv();

const PLACEHOLDER = /placeholder|example\.com|your-?db|changeme/i;

function resolveUrl(): string | null {
  const url =
    process.env.ABARVA_AZURE_DATABASE_URL ??
    process.env.AZURE_DATABASE_URL ??
    process.env.DATABASE_URL ??
    null;
  if (!url || PLACEHOLDER.test(url)) return null;
  return url;
}

async function main(): Promise<void> {
  const url = resolveUrl();
  if (!url) {
    console.log(
      '↷ [fact-duplication] skipped — no live Azure/Postgres URL configured (run on Azure Container Apps for the authoritative check).',
    );
    process.exit(0);
  }

  const client = new Client(postgresClientOptions(url, 'validate-fact-duplication'));
  await client.connect();
  try {
    const { rows } = await client.query<{
      tenant_key: string;
      record_id: string;
      fact_key: string;
      active_count: string;
    }>(
      `SELECT tenant_key, record_id::text AS record_id, fact_key, COUNT(*)::text AS active_count
         FROM enterprise_context_facts
        WHERE lifecycle_state = 'active'
        GROUP BY tenant_key, record_id, fact_key
       HAVING COUNT(*) > 1
        ORDER BY COUNT(*) DESC
        LIMIT 50`,
    );
    if (rows.length === 0) {
      console.log('✓ [fact-duplication] no duplicate active facts.');
      process.exit(0);
    }
    console.error(
      `✗ [fact-duplication] ${rows.length} logical fact(s) have >1 active row (showing up to 50):`,
    );
    for (const r of rows) {
      console.error(`  ${r.tenant_key} · ${r.fact_key} · ${r.active_count} active rows`);
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('✗ [fact-duplication] error:', err instanceof Error ? err.message : err);
  process.exit(1);
});
