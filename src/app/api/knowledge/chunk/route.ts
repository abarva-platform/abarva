import { NextRequest, NextResponse } from 'next/server';
import { azureRead } from '@/lib/data-plane/azureRead';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type KnowledgeSourceRow = {
  id: string;
  source_key: string;
  title: string;
  publisher: string;
  source_url: string | null;
  license_class: string;
};

type KnowledgeChunkRow = {
  pinecone_id: string | null;
  chunk_text: string;
  section: string | null;
  page_number: number | null;
  chunk_metadata: Record<string, unknown> | null;
};

type KnowledgeChunkWithSourceRow = KnowledgeChunkRow & {
  source_key: string | null;
  title: string | null;
  publisher: string | null;
  source_url: string | null;
  license_class: string | null;
};

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const sourceKey = url.searchParams.get('source_key');
  const section = url.searchParams.get('section');
  const pageStr = url.searchParams.get('page');
  const pineconeId = url.searchParams.get('pinecone_id');

  if (!sourceKey && !pineconeId) {
    return NextResponse.json({ error: 'source_key or pinecone_id required' }, { status: 400 });
  }

  if (pineconeId) {
    try {
      const rows = await azureRead.query<KnowledgeChunkWithSourceRow>(
        `
          SELECT
            kc.pinecone_id,
            kc.chunk_text,
            kc.section,
            kc.page_number,
            kc.chunk_metadata,
            ks.source_key,
            ks.title,
            ks.publisher,
            ks.source_url,
            ks.license_class
          FROM knowledge_chunks kc
          LEFT JOIN knowledge_sources ks ON ks.id = kc.source_id
          WHERE kc.pinecone_id = $1
          LIMIT 1
        `,
        [pineconeId],
      );
      return NextResponse.json({ chunk: shapeChunk(rows[0] ?? null) });
    } catch (err) {
      return NextResponse.json({ error: err instanceof Error ? err.message : 'db_error' }, { status: 500 });
    }
  }

  let source: KnowledgeSourceRow | null;
  try {
    source = await azureRead.maybeSingle<KnowledgeSourceRow>({
      table: 'knowledge_sources',
      columns: ['id', 'source_key', 'title', 'publisher', 'source_url', 'license_class'],
      where: { source_key: sourceKey! },
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'db_error' }, { status: 500 });
  }
  if (!source) return NextResponse.json({ chunk: null });

  const chunkWhere: Record<string, string | number> = { source_id: source.id };
  if (section) chunkWhere.section = section;
  const page = pageStr ? parseInt(pageStr, 10) : null;
  if (page !== null && Number.isFinite(page)) {
    chunkWhere.page_number = page;
  }

  let chunks: KnowledgeChunkRow[];
  try {
    chunks = await azureRead.select<KnowledgeChunkRow>({
      table: 'knowledge_chunks',
      columns: ['pinecone_id', 'chunk_text', 'section', 'page_number', 'chunk_metadata'],
      where: chunkWhere,
      limit: 1,
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'db_error' }, { status: 500 });
  }
  if (!chunks || chunks.length === 0) {
    return NextResponse.json({
      chunk: {
        source_key: source.source_key,
        title: source.title,
        publisher: source.publisher,
        source_url: source.source_url,
        license_class: source.license_class,
        section,
        page_number: page,
        chunk_text: '(Source metadata available; chunk text not yet ingested. Upstream ingestion pipeline populates chunks.)',
        attribution: null,
      },
    });
  }

  const chunk = chunks[0] as Record<string, unknown>;
  const md = (chunk.chunk_metadata ?? {}) as Record<string, unknown>;
  return NextResponse.json({
    chunk: {
      source_key: source.source_key,
      title: source.title,
      publisher: source.publisher,
      source_url: source.source_url,
      license_class: source.license_class,
      section: chunk.section as string | null,
      page_number: chunk.page_number as number | null,
      chunk_text: chunk.chunk_text as string,
      attribution: (md.attribution as string | undefined) ?? null,
    },
  });
}

function shapeChunk(data: unknown): unknown {
  if (!data) return null;
  const d = data as Record<string, unknown>;
  const md = (d.chunk_metadata ?? {}) as Record<string, unknown>;
  return {
    source_key: d.source_key ?? '',
    title: d.title ?? '',
    publisher: d.publisher ?? '',
    source_url: (d.source_url as string | null) ?? null,
    license_class: d.license_class ?? '',
    section: d.section ?? null,
    page_number: d.page_number ?? null,
    chunk_text: d.chunk_text ?? '',
    attribution: (md.attribution as string | undefined) ?? null,
  };
}
