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
    .eq('tenant_key', 'northstar-clinical')
    .limit(1)
    .maybeSingle();
  if (clientError) throw new Error(`Northstar client lookup failed: ${clientError.message}`);
  assert.ok(client, 'Expected Northstar Clinical Technologies client row');

  const summary = await getTenantContextSummary(client.id as string);
  assert.ok(summary.chunksCount >= 878, 'Northstar context layer should expose the 720 base chunks plus 8 demo facts and 150 named-entity facts');
  assert.ok(summary.chunksEmbedded >= 878, 'Northstar context layer should expose the embedded Packet 27 substrate floor');
  assert.equal(summary.chunksFailed, 0, 'Northstar context layer should have no failed chunks');
  assert.ok(summary.embeddingModels.length > 0, 'Expected at least one embedding model in live summary');

  const { count: demoFactCount, error: demoFactError } = await supabase
    .from('enterprise_context_chunks')
    .select('id', { count: 'exact', head: true })
    .eq('client_id', client.id)
    .like('chunk_id', 'NST-DEMO-FACT-%');
  if (demoFactError) throw new Error(`Northstar demo fact lookup failed: ${demoFactError.message}`);
  assert.equal(demoFactCount, 8, 'Northstar demo-critical fact overlay should expose 8 named-fact chunks');

  const { count: namedFactCount, error: namedFactError } = await supabase
    .from('enterprise_context_chunks')
    .select('id', { count: 'exact', head: true })
    .eq('client_id', client.id)
    .like('chunk_id', 'NST-FACT-%');
  if (namedFactError) throw new Error(`Northstar named fact lookup failed: ${namedFactError.message}`);
  assert.equal(namedFactCount, 150, 'Northstar Packet 27 named-entity fact layer should expose 150 chunks');

  console.log('northstar-context-layer-live-data smoke passed');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
