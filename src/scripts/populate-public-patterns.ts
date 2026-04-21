// Populate Pinecone public-patterns namespace from engagement_topics.
//
// Why: the classifier (spec §2.3) does vector match against the
// public-patterns namespace as Stage 2. Without vectors, Beat 4 of the
// demo returns empty matches even when the pattern exists in the catalog.
// This script embeds each pattern's title + tagline + canonical shape
// using OpenAI text-embedding-3-large (3072d) and upserts into Pinecone.
//
// Idempotent via vector id = topic_key. Re-runs replace existing vectors.
//
// Usage:  npx tsx src/scripts/populate-public-patterns.ts

import { createClient } from '@supabase/supabase-js';
import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';
import fs from 'node:fs';
import path from 'node:path';

// Load .env.local
try {
  const env = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf-8');
  for (const line of env.split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch { /* env missing — rely on shell */ }

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PINECONE_KEY = process.env.PINECONE_API_KEY;
const OPENAI_KEY = process.env.OPENAI_API_KEY;
const INDEX_NAME = process.env.PINECONE_INDEX ?? 'nexus-knowledge';
const NAMESPACE = 'public-patterns';
const EMBED_MODEL = 'text-embedding-3-large';
const EMBED_DIMS = 1024;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase creds'); process.exit(1);
}
if (!PINECONE_KEY) { console.error('Missing PINECONE_API_KEY'); process.exit(1); }
if (!OPENAI_KEY) { console.error('Missing OPENAI_API_KEY'); process.exit(1); }

const sb = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const pc = new Pinecone({ apiKey: PINECONE_KEY });
const openai = new OpenAI({ apiKey: OPENAI_KEY });

interface TopicRow {
  topic_key: string;
  title: string;
  tagline: string | null;
  industries: string[] | null;
  key_patterns: string[] | null;
  canonical_shape_json: Record<string, unknown> | null;
  promotion_state: string | null;
  deployment_count: number | null;
  successful_deployment_count: number | null;
}

function buildText(t: TopicRow): string {
  const shape = (t.canonical_shape_json ?? {}) as Record<string, unknown>;
  const archetype = (shape.archetype as string | undefined) ?? 'unspecified';
  const modules = Array.isArray(shape.modules)
    ? (shape.modules as Array<{ name: string; phase: number }>).map((m) => m.name).join(', ')
    : '';
  return [
    t.title,
    t.tagline ?? '',
    `archetype: ${archetype}`,
    `industries: ${(t.industries ?? []).join(', ')}`,
    `patterns: ${(t.key_patterns ?? []).join(', ')}`,
    modules ? `modules: ${modules}` : '',
    `deployed ${t.deployment_count ?? 0} times · ${t.successful_deployment_count ?? 0} successful`,
  ].filter(Boolean).join(' · ');
}

async function embed(text: string): Promise<number[]> {
  const res = await openai.embeddings.create({ model: EMBED_MODEL, input: text, dimensions: EMBED_DIMS });
  return res.data[0]!.embedding;
}

async function main() {
  console.log('─── Populate Pinecone public-patterns ───');

  const { data, error } = await sb
    .from('engagement_topics')
    .select('topic_key, title, tagline, industries, key_patterns, canonical_shape_json, promotion_state, deployment_count, successful_deployment_count');
  if (error) throw error;
  const rows = (data as TopicRow[] | null) ?? [];
  console.log(`✓ ${rows.length} topics to embed`);

  const index = pc.index(INDEX_NAME).namespace(NAMESPACE);
  const vectors: Array<{ id: string; values: number[]; metadata: Record<string, string | number | boolean | string[]>; sparseValues?: undefined }> = [];
  let embedded = 0;

  for (const row of rows) {
    const text = buildText(row);
    const values = await embed(text);
    vectors.push({
      id: row.topic_key,
      values,
      metadata: {
        pattern_key: row.topic_key,
        title: row.title,
        tagline: row.tagline ?? '',
        archetype: ((row.canonical_shape_json as Record<string, unknown> | null)?.archetype as string | undefined) ?? 'unspecified',
        industries: row.industries ?? [],
        promotion_state: row.promotion_state ?? 'draft',
        deployment_count: row.deployment_count ?? 0,
        successful_deployment_count: row.successful_deployment_count ?? 0,
        text: text.slice(0, 1000),
      },
    });
    embedded += 1;
    if (embedded % 10 === 0) console.log(`  embedded ${embedded}/${rows.length}`);
  }

  console.log(`✓ ${vectors.length} vectors generated · upserting to Pinecone`);

  // Upsert · Pinecone SDK v7 signature matches the pattern in
  // scripts/knowledge/embedding.ts: index.upsert({ records: [...] })
  // where each record is { id, values, metadata }.
  for (let i = 0; i < vectors.length; i += 50) {
    const batch = vectors.slice(i, i + 50);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (index as any).upsert({ records: batch });
    console.log(`  batch ${Math.floor(i / 50) + 1} · ${batch.length} vectors`);
  }

  // Verify
  const stats = await pc.index(INDEX_NAME).describeIndexStats();
  const nsCount = stats.namespaces?.[NAMESPACE]?.recordCount ?? 0;
  console.log(`✓ namespace ${NAMESPACE} now has ${nsCount} vectors`);
  console.log(`─── Done ───`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
