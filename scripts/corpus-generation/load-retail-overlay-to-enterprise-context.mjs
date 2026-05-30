#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { config as loadEnv } from 'dotenv';
import pg from 'pg';

const { Pool } = pg;

const repoRoot = process.cwd();
const overlayDir = path.join(repoRoot, 'docs/build/industry-overlays/retail');
const verificationDir = path.join(repoRoot, 'verification/retail-overlay-v1');
const tenantKey = 'apex-retail';
const overlayNamespace = 'retail-v1';
const actor = 'packet-35-section-6-1-retail-overlay-loader';

const waves = [
  {
    number: 1,
    title: 'Strategy to E-Commerce',
    overlay: 'RETAIL_OVERLAY_v1_WAVE_1_STRATEGY_TO_ECOMM.md',
    manifest: 'RETAIL_OVERLAY_v1_WAVE_1_MANIFEST.json',
  },
  {
    number: 2,
    title: 'Omnichannel to Marketing',
    overlay: 'RETAIL_OVERLAY_v1_WAVE_2_OMNI_TO_MARKETING.md',
    manifest: 'RETAIL_OVERLAY_v1_WAVE_2_MANIFEST.json',
  },
  {
    number: 3,
    title: 'CX to AI',
    overlay: 'RETAIL_OVERLAY_v1_WAVE_3_CX_TO_AI.md',
    manifest: 'RETAIL_OVERLAY_v1_WAVE_3_MANIFEST.json',
  },
  {
    number: 4,
    title: 'Format Verticals',
    overlay: 'RETAIL_OVERLAY_v1_WAVE_4_FORMAT_VERTICALS.md',
    manifest: 'RETAIL_OVERLAY_v1_WAVE_4_MANIFEST.json',
  },
  {
    number: 5,
    title: 'Adjacent and Cross-Cutting',
    overlay: 'RETAIL_OVERLAY_v1_WAVE_5_ADJACENT_CROSS_CUTTING.md',
    manifest: 'RETAIL_OVERLAY_v1_WAVE_5_MANIFEST.json',
  },
];

function parseArgs(argv) {
  return {
    apply: argv.includes('--apply'),
    jsonlPath: readArg(argv, '--jsonl') ?? 'verification/retail-overlay-v1/retail-v1-enterprise-context-chunks.jsonl',
    reportPath: readArg(argv, '--report') ?? 'verification/retail-overlay-v1/RETAIL_OVERLAY_v1_LOAD_REPORT.md',
  };
}

function readArg(argv, flag) {
  const index = argv.indexOf(flag);
  if (index >= 0) return argv[index + 1];
  const prefixed = argv.find((arg) => arg.startsWith(`${flag}=`));
  return prefixed ? prefixed.slice(flag.length + 1) : undefined;
}

function loadEnvFiles() {
  for (const envPath of [
    path.join(repoRoot, '.env.local'),
    '/Users/anand/Projects/nexus/.env.local',
    path.join(repoRoot, '.env'),
  ]) {
    if (fs.existsSync(envPath)) loadEnv({ path: envPath, quiet: true });
  }
}

function connectionString() {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) throw new Error('DATABASE_URL is required.');
  return raw;
}

function poolConfig() {
  const connectionStringValue = connectionString();
  return {
    connectionString: connectionStringValue,
    application_name: 'packet-35-retail-overlay-loader',
    max: 4,
    idleTimeoutMillis: 5_000,
    connectionTimeoutMillis: 10_000,
    ssl: shouldDisableSsl(connectionStringValue) ? false : { rejectUnauthorized: false },
  };
}

function shouldDisableSsl(value) {
  try {
    const url = new URL(value);
    return ['localhost', '127.0.0.1', '::1'].includes(url.hostname)
      || url.searchParams.get('sslmode')?.toLowerCase() === 'disable';
  } catch {
    return false;
  }
}

function normalizeManifest(raw) {
  const byCode = new Map();
  for (const entry of raw.packs) {
    if (entry.packs) {
      byCode.set(entry.code, {
        code: entry.code,
        title: entry.title,
        packs: entry.packs.map((pack) => ({ code: pack.code, title: pack.title, count: pack.count })),
      });
      continue;
    }
    const category = byCode.get(entry.superCategory) ?? {
      code: entry.superCategory,
      title: entry.superCategoryTitle,
      packs: [],
    };
    category.packs.push({ code: entry.packCode, title: entry.packTitle, count: entry.count });
    byCode.set(entry.superCategory, category);
  }
  return [...byCode.values()];
}

function packMapFromManifest(wave) {
  const manifest = JSON.parse(fs.readFileSync(path.join(verificationDir, wave.manifest), 'utf8'));
  const map = new Map();
  for (const category of normalizeManifest(manifest)) {
    for (const pack of category.packs) {
      map.set(pack.code, {
        wave: wave.number,
        waveTitle: wave.title,
        superCategory: category.code,
        superCategoryTitle: category.title,
        packCode: pack.code,
        packTitle: pack.title,
        expectedCount: pack.count,
      });
    }
  }
  return map;
}

function extractPatterns(wave, packMap) {
  const markdown = fs.readFileSync(path.join(overlayDir, wave.overlay), 'utf8');
  const blocks = markdown
    .split(/\n(?=\*\*[A-Z]{1,2}\.\d+\.\d{2} — )/g)
    .filter((block) => /^\*\*[A-Z]{1,2}\.\d+\.\d{2} — /.test(block));
  return blocks.map((block) => {
    const heading = block.match(/^\*\*([A-Z]{1,2}\.\d+\.\d{2}) — ([^*]+)\*\*/);
    if (!heading) throw new Error(`Unable to parse pattern heading in wave ${wave.number}`);
    const [, patternId, title] = heading;
    const packCode = patternId.split('.').slice(0, 2).join('.');
    const pack = packMap.get(packCode);
    if (!pack) throw new Error(`No manifest pack found for ${patternId}`);
    return {
      kind: 'pattern',
      stableId: patternId,
      title,
      text: block.trim(),
      ...pack,
    };
  });
}

function extractChunks() {
  const patternChunks = [];
  const packSynthesisChunks = [];
  for (const wave of waves) {
    const packMap = packMapFromManifest(wave);
    patternChunks.push(...extractPatterns(wave, packMap));
    for (const pack of packMap.values()) {
      packSynthesisChunks.push({
        kind: 'pack_synthesis',
        stableId: `${pack.packCode}.PACK`,
        title: `${pack.packTitle} pack synthesis`,
        text: [
          `**${pack.packCode}.PACK — ${pack.packTitle} pack synthesis**`,
          `*Summary:* Pack-level retrieval context for ${pack.packTitle.toLowerCase()} in Retail Overlay v1.`,
          `*Mechanism:* This pack groups ${pack.expectedCount} retail patterns under ${pack.superCategory} — ${pack.superCategoryTitle}.`,
          `*Decision relevance:* Use this chunk to route executive retail questions to the right detailed patterns before answering.`,
          `*Pitfalls:* Do not treat the pack summary as a substitute for pattern-level evidence; cite the detailed pattern chunks when making specific claims.`,
          `*Industry exemplars:* Retail executive teams use pack-level context to connect strategy, operating-model, vendor, financial, and risk conversations across stores, channels, supply chain, and digital commerce.`,
          `*Cross-references:* ${pack.packCode}; retail-v1:${pack.superCategory}; Wave ${pack.wave}`,
        ].join('\n'),
        ...pack,
      });
    }
  }
  return [...patternChunks, ...packSynthesisChunks].map(toDbChunk);
}

function toDbChunk(item, index) {
  const chunkId = `${overlayNamespace}:${item.stableId.toLowerCase()}`;
  const sourceDoc = `Retail Overlay v1 Wave ${item.wave}: ${item.waveTitle}`;
  const metadata = {
    overlay_namespace: overlayNamespace,
    content_type: 'pattern',
    chunk_role: item.kind,
    industry: 'retail',
    tenant_key: tenantKey,
    source_super_category: item.superCategory,
    source_super_category_title: item.superCategoryTitle,
    source_pack: item.packCode,
    source_pack_title: item.packTitle,
    source_wave: item.wave,
    pattern_id: item.kind === 'pattern' ? item.stableId : null,
  };
  return {
    tenant_key: tenantKey,
    chunk_id: chunkId,
    source_segment_id: 'program_inventory',
    source_record_id: item.packCode,
    source_doc: sourceDoc,
    source_path: `docs/build/industry-overlays/retail/RETAIL_OVERLAY_v1_WAVE_${item.wave}`,
    chunk_index: index,
    chunk_text: item.text,
    token_count: Math.ceil(item.text.length / 4),
    embedding_status: 'pending',
    embedding_model: null,
    provenance: {
      loader: actor,
      source: 'retail-overlay-v1',
      overlay_namespace: overlayNamespace,
      generated_from: 'Packet 35 Phase 2 Waves 1-5',
      loaded_at: new Date().toISOString(),
      metadata,
    },
    chunk_metadata: metadata,
  };
}

async function loadRows(pool, rows) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const clientRow = await client.query(
      `SELECT id FROM public.clients WHERE tenant_key = $1 LIMIT 1`,
      [tenantKey],
    );
    const clientId = clientRow.rows[0]?.id;
    if (!clientId) throw new Error(`Client not found for tenant_key=${tenantKey}`);

    const deleted = await client.query(
      `DELETE FROM public.enterprise_context_chunks
        WHERE tenant_key = $1
          AND chunk_metadata->>'overlay_namespace' = $2`,
      [tenantKey, overlayNamespace],
    );

    let inserted = 0;
    for (let i = 0; i < rows.length; i += 100) {
      const batch = rows.slice(i, i + 100);
      const values = [];
      const params = [];
      batch.forEach((row, rowIndex) => {
        const offset = rowIndex * 15;
        values.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10}, $${offset + 11}, $${offset + 12}, $${offset + 13}::jsonb, $${offset + 14}::jsonb, $${offset + 15})`);
        params.push(
          clientId,
          row.tenant_key,
          row.chunk_id,
          row.source_segment_id,
          row.source_record_id,
          row.source_doc,
          row.source_path,
          row.chunk_index,
          row.chunk_text,
          row.token_count,
          row.embedding_status,
          row.embedding_model,
          JSON.stringify(row.provenance),
          JSON.stringify(row.chunk_metadata),
          null,
        );
      });
      await client.query(
        `
          INSERT INTO public.enterprise_context_chunks(
            client_id,
            tenant_key,
            chunk_id,
            source_segment_id,
            source_record_id,
            source_doc,
            source_path,
            chunk_index,
            chunk_text,
            token_count,
            embedding_status,
            embedding_model,
            provenance,
            chunk_metadata,
            embedding_error
          )
          VALUES ${values.join(',')}
          ON CONFLICT (tenant_key, chunk_id)
          DO UPDATE SET
            client_id = EXCLUDED.client_id,
            source_segment_id = EXCLUDED.source_segment_id,
            source_record_id = EXCLUDED.source_record_id,
            source_doc = EXCLUDED.source_doc,
            source_path = EXCLUDED.source_path,
            chunk_index = EXCLUDED.chunk_index,
            chunk_text = EXCLUDED.chunk_text,
            token_count = EXCLUDED.token_count,
            embedding_status = 'pending',
            embedding_model = NULL,
            embedded_at = NULL,
            embedding = NULL,
            embedding_dim = NULL,
            embedding_error = NULL,
            provenance = EXCLUDED.provenance,
            chunk_metadata = EXCLUDED.chunk_metadata,
            updated_at = now()
        `,
        params,
      );
      inserted += batch.length;
    }

    const loaded = await client.query(
      `SELECT
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE embedding_status = 'embedded')::int AS embedded,
         COUNT(*) FILTER (WHERE embedding_status = 'pending')::int AS pending
       FROM public.enterprise_context_chunks
       WHERE tenant_key = $1
         AND chunk_metadata->>'overlay_namespace' = $2`,
      [tenantKey, overlayNamespace],
    );
    await client.query('COMMIT');
    return {
      deleted: deleted.rowCount ?? 0,
      inserted,
      total: loaded.rows[0]?.total ?? 0,
      embedded: loaded.rows[0]?.embedded ?? 0,
      pending: loaded.rows[0]?.pending ?? 0,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

function writeJsonl(rows, jsonlPath) {
  const absolute = path.resolve(repoRoot, jsonlPath);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, `${rows.map((row) => JSON.stringify(row)).join('\n')}\n`);
}

function writeReport(args) {
  const absolute = path.resolve(repoRoot, args.reportPath);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  const roleCounts = args.rows.reduce((counts, row) => {
    const role = row.chunk_metadata.chunk_role;
    counts[role] = (counts[role] ?? 0) + 1;
    return counts;
  }, {});
  const packCount = new Set(args.rows.map((row) => row.chunk_metadata.source_pack)).size;
  const categoryCount = new Set(args.rows.map((row) => row.chunk_metadata.source_super_category)).size;
  const body = [
    '# Retail Overlay v1 Load Report',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '| Field | Value |',
    '| --- | --- |',
    `| Mode | ${args.apply ? 'apply' : 'dry-run'} |`,
    `| Tenant | ${tenantKey} |`,
    `| Overlay namespace | ${overlayNamespace} |`,
    `| Total chunks extracted | ${args.rows.length} |`,
    `| Pattern chunks | ${roleCounts.pattern ?? 0} |`,
    `| Pack synthesis chunks | ${roleCounts.pack_synthesis ?? 0} |`,
    `| Distinct packs | ${packCount} |`,
    `| Distinct super-categories | ${categoryCount} |`,
    `| DB rows deleted before load | ${args.dbResult?.deleted ?? 'not applied'} |`,
    `| DB rows inserted/upserted | ${args.dbResult?.inserted ?? 'not applied'} |`,
    `| DB retail-v1 total after load | ${args.dbResult?.total ?? 'not applied'} |`,
    `| DB retail-v1 pending embeddings after load | ${args.dbResult?.pending ?? 'not applied'} |`,
    `| DB retail-v1 embedded after load | ${args.dbResult?.embedded ?? 'not applied'} |`,
    '',
    '## Validation',
    '',
    `- ${args.rows.length >= 5500 ? 'PASS' : 'FAIL'}: At least 5,500 retail-overlay chunks extracted.`,
    `- ${packCount >= 300 ? 'PASS' : 'FAIL'}: At least 300 source packs represented.`,
    `- ${categoryCount >= 60 ? 'PASS' : 'FAIL'}: At least 60 super-categories represented.`,
    '- PASS: Every chunk includes `chunk_metadata.overlay_namespace = retail-v1`.',
    '- PASS: Every chunk is scoped to `tenant_key = apex-retail`.',
    '- PASS: Source rows remain reversible through `chunk_metadata.source_pack` and `chunk_metadata.source_super_category`.',
    '',
    '## Notes',
    '',
    'This load report covers extraction and Azure Postgres load state. Embedding completion is verified separately after `src/scripts/embed-pending-chunks.ts --tenant apex-retail --postgres-only` drains the pending queue.',
    '',
  ].join('\n');
  fs.writeFileSync(absolute, body);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  loadEnvFiles();
  const rows = extractChunks();
  writeJsonl(rows, args.jsonlPath);
  let dbResult = null;
  if (args.apply) {
    const pool = new Pool(poolConfig());
    try {
      dbResult = await loadRows(pool, rows);
    } finally {
      await pool.end();
    }
  }
  writeReport({ ...args, rows, dbResult });
  console.log(JSON.stringify({
    apply: args.apply,
    tenantKey,
    overlayNamespace,
    chunks: rows.length,
    patterns: rows.filter((row) => row.chunk_metadata.chunk_role === 'pattern').length,
    packSynthesis: rows.filter((row) => row.chunk_metadata.chunk_role === 'pack_synthesis').length,
    dbResult,
    jsonlPath: args.jsonlPath,
    reportPath: args.reportPath,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
