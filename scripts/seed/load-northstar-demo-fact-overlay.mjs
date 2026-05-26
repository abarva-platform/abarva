import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const localEnv = path.join(repoRoot, '.env.local');
const defaultEnv = '/Users/anand/Projects/nexus/.env.local';
loadEnv({ path: fs.existsSync(localEnv) ? localEnv : defaultEnv });

const CLIENT_ID = '2702b525-4c6a-4fbe-973d-99a8480d8318';
const TENANT_KEY = 'northstar-medtech';
const INPUT = path.join(
  repoRoot,
  'datasets/northstar-clinical-tech-synthetic-v1/16-market-corpus/demo-critical-facts.jsonl',
);

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function deterministicEmbedding(text) {
  const hash = crypto.createHash('sha256').update(text).digest();
  return Array.from({ length: 1536 }, (_, i) => {
    const byte = hash[i % hash.length];
    return (byte / 255) * 2 - 1;
  });
}

function stableUuid(input) {
  const hash = crypto.createHash('sha1').update(input).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}

const sb = createClient(
  required('NEXT_PUBLIC_SUPABASE_URL'),
  required('SUPABASE_SERVICE_ROLE_KEY'),
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const rows = fs.readFileSync(INPUT, 'utf8')
  .split('\n')
  .map((line) => line.trim())
  .filter(Boolean)
  .map((line) => JSON.parse(line));

const now = new Date().toISOString();
const chunkRows = rows.map((row, index) => ({
  id: stableUuid(`${CLIENT_ID}:${row.chunk_id}`),
  client_id: CLIENT_ID,
  tenant_key: TENANT_KEY,
  chunk_id: row.chunk_id,
  source_segment_id: row.source_segment_id,
  source_record_id: row.source_record_id,
  source_doc: row.source_doc,
  source_path: `datasets/northstar-clinical-tech-synthetic-v1/16-market-corpus/${row.source_doc}`,
  chunk_index: 9000 + index,
  chunk_text: row.text,
  token_count: Math.ceil(row.text.length / 4),
  embedding_status: 'embedded',
  embedding_model: 'deterministic-local-demo-overlay',
  embedded_at: now,
  provenance: {
    source_basis: 'Northstar demo-critical named fact overlay',
    data_classification: 'confidential',
    loaded_via: 'load-northstar-demo-fact-overlay.mjs',
  },
  chunk_metadata: {
    demo_critical: true,
    qa_target: true,
  },
  embedding: deterministicEmbedding(row.text),
  embedding_dim: 1536,
  embedding_error: null,
  created_at: now,
  updated_at: now,
}));

console.log(`Loading ${chunkRows.length} Northstar demo-critical fact chunks...`);
const { error: deleteError } = await sb
  .from('enterprise_context_chunks')
  .delete()
  .eq('client_id', CLIENT_ID)
  .like('chunk_id', 'NST-DEMO-FACT-%');
if (deleteError) throw deleteError;

const { error } = await sb
  .from('enterprise_context_chunks')
  .insert(chunkRows);
if (error) throw error;

console.log(`Loaded ${chunkRows.length} Northstar demo-critical fact chunks.`);
