import {
  upsertSource,
  markSourceStatus,
  setChunkCount,
  insertChunks,
  deleteChunksForSource,
  type SourceInput,
} from './db';
import { embedBatch, pineconeUpsert, pineconeDeleteBySource } from './embedding';
import type { Chunk } from './chunking';

export interface IngestResult {
  chunks: Chunk[];
  contentHash: string;
}

export interface SourceDeclaration extends SourceInput {
  attribution?: string;
  ingest: () => Promise<IngestResult>;
}

export async function runSource(decl: SourceDeclaration): Promise<{
  sourceId: string;
  chunksWritten: number;
  skipped: boolean;
  reason?: string;
}> {
  const { id: sourceId } = await upsertSource(decl);
  await markSourceStatus(sourceId, 'ingesting');

  let result: IngestResult;
  try {
    result = await decl.ingest();
  } catch (err) {
    await markSourceStatus(sourceId, 'failed', {
      error: err instanceof Error ? err.message : String(err),
      at: new Date().toISOString(),
    });
    throw err;
  }

  if (result.chunks.length === 0) {
    await markSourceStatus(sourceId, 'failed', { reason: 'no chunks extracted' });
    return { sourceId, chunksWritten: 0, skipped: true, reason: 'no chunks extracted' };
  }

  await deleteChunksForSource(sourceId);
  await pineconeDeleteBySource(decl.pinecone_namespace, decl.source_key);

  const vectors = await embedBatch(result.chunks.map((c) => c.text));
  const pineconeItems = result.chunks.map((c, idx) => ({
    id: `${decl.source_key}:${idx}`,
    values: vectors[idx],
    metadata: {
      source_key: decl.source_key,
      source_id: sourceId,
      section: c.section ?? '',
      page_number: c.pageNumber ?? 0,
      license_class: decl.license_class,
      content_type: decl.content_type,
      publisher: decl.publisher,
      attribution: decl.attribution ?? '',
      industry_tags: decl.industry_tags ?? [],
      topic_tags: decl.topic_tags ?? [],
    },
  }));

  await pineconeUpsert(decl.pinecone_namespace, pineconeItems);

  await insertChunks(
    result.chunks.map((c, idx) => ({
      source_id: sourceId,
      pinecone_id: `${decl.source_key}:${idx}`,
      chunk_text: c.text,
      section: c.section,
      page_number: c.pageNumber,
      token_count: c.tokenCount,
      chunk_metadata: {
        license_class: decl.license_class,
        attribution: decl.attribution ?? '',
      },
    })),
  );

  await setChunkCount(sourceId, result.chunks.length, result.contentHash);
  await markSourceStatus(sourceId, 'active', {
    ingested_at: new Date().toISOString(),
    chunk_count: result.chunks.length,
  });

  return { sourceId, chunksWritten: result.chunks.length, skipped: false };
}
