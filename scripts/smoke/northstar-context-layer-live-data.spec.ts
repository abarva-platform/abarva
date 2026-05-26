import assert from 'node:assert/strict';
import path from 'node:path';

import { createClient } from '@supabase/supabase-js';
import { config as loadEnv } from 'dotenv';

import { getTenantContextSummary } from '../../src/lib/context-ingestion/tenant-context-read-model';

loadEnv({ path: path.resolve(process.cwd(), '.env.local') });
loadEnv({ path: '/Users/anand/Projects/nexus/.env.local' });
loadEnv();

async function main(): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
  }

  const supabase = createClient(url.trim(), key.trim(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('id,name,tenant_key')
    .eq('tenant_key', 'northstar-medtech')
    .limit(1)
    .maybeSingle();
  if (clientError) throw new Error(`Northstar client lookup failed: ${clientError.message}`);
  assert.ok(client, 'Expected Northstar MedTech client row');

  const summary = await getTenantContextSummary(client.id as string);
  assert.equal(summary.chunksCount, 720, 'Northstar context layer should expose 720 live substrate chunks');
  assert.equal(summary.chunksEmbedded, 720, 'Northstar context layer should expose 720 embedded chunks');
  assert.equal(summary.chunksPending, 0, 'Northstar context layer should have no pending chunks');
  assert.equal(summary.chunksFailed, 0, 'Northstar context layer should have no failed chunks');
  assert.ok(summary.embeddingModels.length > 0, 'Expected at least one embedding model in live summary');

  console.log('northstar-context-layer-live-data smoke passed');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
