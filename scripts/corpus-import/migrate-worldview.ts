import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { config as loadEnv } from 'dotenv';
import { withCorpusTransaction } from '@/lib/corpus/db';
import { embedPatternText } from '@/lib/corpus/embedding';
import { uploadCorpusSearchDocument } from '@/lib/corpus/azure-search';
import type { CorpusPatternRecord } from '@/lib/corpus/types';

loadEnv({ path: path.resolve(process.cwd(), '.env.local') });
loadEnv();

type WorldviewChunk = {
  chunk_id: string;
  thesis_id?: string;
  thesis_title?: string;
  chunk_title?: string;
  chunk_type?: string;
  chunk_text: string;
  claim_summary?: string;
  implication_summary?: string;
  abarva_framing_summary?: string;
  citations?: unknown[];
  keywords?: string[];
};

type ChunkFile = {
  thesis_id: string;
  thesis_title: string;
  validation_status?: string;
  chunks: WorldviewChunk[];
};

function sourceRoot(): string {
  const explicit = process.env.CORPUS_WORLDVIEW_SOURCE_DIR?.trim();
  if (explicit) return path.resolve(process.cwd(), explicit);
  const live = path.resolve(process.cwd(), 'worldview');
  const archived = path.resolve(process.cwd(), '.archive/worldview');
  try {
    readdirSync(live);
    return live;
  } catch {
    return archived;
  }
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function readChunkFiles(root: string): WorldviewChunk[] {
  const chunksDir = path.join(root, 'chunks');
  const files = readdirSync(chunksDir)
    .filter((file) => /^W\d+_chunks\.json$/.test(file))
    .sort();
  const chunks: WorldviewChunk[] = [];
  for (const file of files) {
    const parsed = JSON.parse(readFileSync(path.join(chunksDir, file), 'utf-8')) as ChunkFile;
    for (const chunk of parsed.chunks ?? []) {
      chunks.push({
        thesis_id: chunk.thesis_id ?? parsed.thesis_id,
        thesis_title: chunk.thesis_title ?? parsed.thesis_title,
        ...chunk,
      });
    }
  }
  return chunks;
}

async function resolveImportClientId(): Promise<string> {
  const explicit = process.env.CORPUS_IMPORT_CLIENT_ID?.trim();
  if (explicit) return explicit;
  return withCorpusTransaction(async (client) => {
    const { rows } = await client.query<{ id: string }>(
      `
        SELECT id
        FROM public.clients
        WHERE tenant_key IN ('apex-retail', 'apexretail')
           OR lower(name) LIKE 'apex retail%'
        ORDER BY created_at NULLS LAST
        LIMIT 1
      `,
    );
    const id = rows[0]?.id;
    if (!id) throw new Error('No import client found. Set CORPUS_IMPORT_CLIENT_ID.');
    return id;
  });
}

function toPatternRecord(row: Record<string, unknown>, chunk: WorldviewChunk): CorpusPatternRecord {
  return {
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title),
    category: String(row.category),
    status: 'published',
    confidence: Number(row.confidence ?? 0.8),
    version: Number(row.version ?? 1),
    parentVersionId: null,
    primaryAuthorId: typeof row.primary_author_id === 'string' ? row.primary_author_id : null,
    approvedById: typeof row.approved_by_id === 'string' ? row.approved_by_id : null,
    publishedAt: String(row.published_at ?? new Date().toISOString()),
    retiredAt: null,
    searchDocId: typeof row.search_doc_id === 'string' ? row.search_doc_id : null,
    depthScore: Number(row.depth_score ?? 10),
    verticalOverlays: [],
    regionOverlays: [],
    applicableHorizons: ['enterprise-ai'],
    markdownBody: chunk.chunk_text,
    claims: chunk.claim_summary ? [{ summary: chunk.claim_summary }] : [],
    evidence: Array.isArray(chunk.citations) ? chunk.citations : [],
    counterarguments: [],
    synthesis: {
      thesisId: chunk.thesis_id,
      thesisTitle: chunk.thesis_title,
      chunkId: chunk.chunk_id,
      chunkType: chunk.chunk_type,
      implication: chunk.implication_summary,
      abarvaFraming: chunk.abarva_framing_summary,
      keywords: Array.isArray(chunk.keywords) ? chunk.keywords : [],
    },
    createdAt: String(row.created_at ?? new Date().toISOString()),
    updatedAt: String(row.updated_at ?? new Date().toISOString()),
  };
}

async function upsertChunk(chunk: WorldviewChunk, importClientId: string, dryRun: boolean): Promise<{ pattern: CorpusPatternRecord; inserted: boolean }> {
  const slug = slugify(chunk.chunk_id);
  const title = chunk.chunk_title || `${chunk.thesis_id ?? 'Worldview'} ${chunk.chunk_id}`;
  const now = new Date().toISOString();
  if (dryRun) {
    return {
      inserted: false,
      pattern: {
        id: slug,
        slug,
        title,
        category: 'worldview',
        status: 'published',
        confidence: 0.8,
        version: 1,
        parentVersionId: null,
        primaryAuthorId: 'corpus-import',
        approvedById: 'corpus-import',
        publishedAt: now,
        retiredAt: null,
        searchDocId: null,
        depthScore: 10,
        verticalOverlays: [],
        regionOverlays: [],
        applicableHorizons: ['enterprise-ai'],
        markdownBody: chunk.chunk_text,
        claims: chunk.claim_summary ? [{ summary: chunk.claim_summary }] : [],
        evidence: Array.isArray(chunk.citations) ? chunk.citations : [],
        counterarguments: [],
        synthesis: {},
        createdAt: now,
        updatedAt: now,
      },
    };
  }

  return withCorpusTransaction(async (client) => {
    const { rows } = await client.query<Record<string, unknown>>(
      `
        INSERT INTO public.corpus_patterns(
          slug, title, category, status, confidence, version,
          primary_author_id, approved_by_id, published_at, depth_score,
          applicable_horizons
        )
        VALUES ($1, $2, 'worldview', 'published', 0.8, 1, 'corpus-import', 'corpus-import', now(), 10, ARRAY['enterprise-ai']::text[])
        ON CONFLICT (slug)
        DO UPDATE SET
          title = EXCLUDED.title,
          category = EXCLUDED.category,
          status = 'published',
          confidence = EXCLUDED.confidence,
          version = 1,
          approved_by_id = EXCLUDED.approved_by_id,
          published_at = coalesce(public.corpus_patterns.published_at, now()),
          depth_score = EXCLUDED.depth_score,
          applicable_horizons = EXCLUDED.applicable_horizons
        RETURNING *
      `,
      [slug, title],
    );
    const row = rows[0];
    await client.query(
      `
        INSERT INTO public.corpus_pattern_content(
          pattern_id, version, markdown_body, claims_jsonb, evidence_jsonb, counterarguments_jsonb, synthesis_jsonb
        )
        VALUES ($1, 1, $2, $3::jsonb, $4::jsonb, '[]'::jsonb, $5::jsonb)
        ON CONFLICT (pattern_id)
        DO UPDATE SET
          version = 1,
          markdown_body = EXCLUDED.markdown_body,
          claims_jsonb = EXCLUDED.claims_jsonb,
          evidence_jsonb = EXCLUDED.evidence_jsonb,
          counterarguments_jsonb = EXCLUDED.counterarguments_jsonb,
          synthesis_jsonb = EXCLUDED.synthesis_jsonb
      `,
      [
        row.id,
        chunk.chunk_text,
        JSON.stringify(chunk.claim_summary ? [{ summary: chunk.claim_summary }] : []),
        JSON.stringify(Array.isArray(chunk.citations) ? chunk.citations : []),
        JSON.stringify({
          thesisId: chunk.thesis_id,
          thesisTitle: chunk.thesis_title,
          chunkId: chunk.chunk_id,
          chunkType: chunk.chunk_type,
          implication: chunk.implication_summary,
          abarvaFraming: chunk.abarva_framing_summary,
          keywords: Array.isArray(chunk.keywords) ? chunk.keywords : [],
        }),
      ],
    );
    await client.query(
      `
        INSERT INTO public.corpus_pattern_versions(pattern_id, version, status, snapshot_jsonb, created_by_id)
        VALUES ($1, 1, 'published', $2::jsonb, 'corpus-import')
        ON CONFLICT (pattern_id, version)
        DO UPDATE SET snapshot_jsonb = EXCLUDED.snapshot_jsonb, status = 'published'
      `,
      [row.id, JSON.stringify({ source: 'worldview', chunk })],
    );
    await client.query(
      `
        INSERT INTO public.corpus_telemetry(event_type, context_jsonb, client_id, actor_id, pattern_id)
        VALUES ('worldview_import_upserted', $1::jsonb, $2, 'corpus-import', $3)
      `,
      [JSON.stringify({ chunkId: chunk.chunk_id, slug }), importClientId, row.id],
    );
    return { pattern: toPatternRecord(row, chunk), inserted: true };
  });
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const skipAzure = process.argv.includes('--skip-azure');
  const root = sourceRoot();
  const chunks = readChunkFiles(root);
  const importClientId = dryRun ? 'dry-run-client' : await resolveImportClientId();
  let indexed = 0;

  for (const chunk of chunks) {
    const { pattern } = await upsertChunk(chunk, importClientId, dryRun);
    if (!dryRun && !skipAzure) {
      const embedding = await embedPatternText({
        text: `${pattern.title}\n\n${pattern.markdownBody}`,
        clientId: importClientId,
        userId: 'corpus-import',
        patternId: pattern.id,
      });
      const searchDocId = await uploadCorpusSearchDocument({
        pattern,
        embedding: embedding.embedding,
      });
      await withCorpusTransaction((client) =>
        client.query('UPDATE public.corpus_patterns SET search_doc_id = $2 WHERE id = $1', [pattern.id, searchDocId]).then(() => undefined),
      );
      indexed += 1;
    }
  }

  console.log(JSON.stringify({
    ok: true,
    sourceRoot: path.relative(process.cwd(), root),
    chunks: chunks.length,
    indexed,
    dryRun,
    skipAzure,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
