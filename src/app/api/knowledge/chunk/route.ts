import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const sourceKey = url.searchParams.get('source_key');
  const section = url.searchParams.get('section');
  const pageStr = url.searchParams.get('page');
  const pineconeId = url.searchParams.get('pinecone_id');

  if (!sourceKey && !pineconeId) {
    return NextResponse.json({ error: 'source_key or pinecone_id required' }, { status: 400 });
  }

  const sb = getServerSupabase();

  if (pineconeId) {
    const { data, error } = await sb
      .from('knowledge_chunks')
      .select('pinecone_id, chunk_text, section, page_number, chunk_metadata, source:knowledge_sources(source_key, title, publisher, source_url, license_class)')
      .eq('pinecone_id', pineconeId)
      .maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ chunk: shapeChunk(data) });
  }

  const { data: source, error: srcErr } = await sb
    .from('knowledge_sources')
    .select('id, source_key, title, publisher, source_url, license_class')
    .eq('source_key', sourceKey!)
    .maybeSingle();
  if (srcErr) return NextResponse.json({ error: srcErr.message }, { status: 500 });
  if (!source) return NextResponse.json({ chunk: null });

  let query = sb
    .from('knowledge_chunks')
    .select('pinecone_id, chunk_text, section, page_number, chunk_metadata')
    .eq('source_id', (source as { id: string }).id);

  if (section) query = query.eq('section', section);
  if (pageStr) {
    const page = parseInt(pageStr, 10);
    if (Number.isFinite(page)) query = query.eq('page_number', page);
  }

  const { data: chunks, error: chErr } = await query.limit(1);
  if (chErr) return NextResponse.json({ error: chErr.message }, { status: 500 });
  if (!chunks || chunks.length === 0) {
    return NextResponse.json({
      chunk: {
        source_key: (source as { source_key: string }).source_key,
        title: (source as { title: string }).title,
        publisher: (source as { publisher: string }).publisher,
        source_url: (source as { source_url: string | null }).source_url,
        license_class: (source as { license_class: string }).license_class,
        section,
        page_number: pageStr ? parseInt(pageStr, 10) : null,
        chunk_text: '(Source metadata available; chunk text not yet ingested. Upstream ingestion pipeline populates chunks.)',
        attribution: null,
      },
    });
  }

  const chunk = chunks[0] as Record<string, unknown>;
  const md = (chunk.chunk_metadata ?? {}) as Record<string, unknown>;
  return NextResponse.json({
    chunk: {
      source_key: (source as { source_key: string }).source_key,
      title: (source as { title: string }).title,
      publisher: (source as { publisher: string }).publisher,
      source_url: (source as { source_url: string | null }).source_url,
      license_class: (source as { license_class: string }).license_class,
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
  const source = d.source as Record<string, unknown> | null;
  const md = (d.chunk_metadata ?? {}) as Record<string, unknown>;
  return {
    source_key: source?.source_key ?? '',
    title: source?.title ?? '',
    publisher: source?.publisher ?? '',
    source_url: (source?.source_url as string | null) ?? null,
    license_class: source?.license_class ?? '',
    section: d.section ?? null,
    page_number: d.page_number ?? null,
    chunk_text: d.chunk_text ?? '',
    attribution: (md.attribution as string | undefined) ?? null,
  };
}
