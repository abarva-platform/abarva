import { createHash } from 'node:crypto';
import { azureRead } from '@/lib/data-plane/azureRead';
import { getAzureWriteFluentClient } from '@/lib/data-plane/postgresCompat';

const CHUNK_SIZE = 800; // words
const CHUNK_OVERLAP = 100; // words
const UPSERT_BATCH = 100;

function chunkText(text: string): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks: string[] = [];
  let i = 0;
  while (i < words.length) {
    const c = words.slice(i, i + CHUNK_SIZE).join(' ').trim();
    if (c.length > 80) chunks.push(c);
    i += CHUNK_SIZE - CHUNK_OVERLAP;
  }
  return chunks;
}

async function parseFileToText(
  filename: string,
  bytes: Uint8Array,
): Promise<string> {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.txt') || lower.endsWith('.md')) {
    return new TextDecoder('utf-8').decode(bytes);
  }
  if (lower.endsWith('.pdf')) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mod: any = await import('pdf-parse');
    const pdfParse: (buf: Buffer) => Promise<{ text: string }> = mod.default ?? mod;
    const out = await pdfParse(Buffer.from(bytes));
    return out.text;
  }
  if (lower.endsWith('.docx')) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mammoth: any = await import('mammoth');
    const m = mammoth.default ?? mammoth;
    const out = await m.extractRawText({ buffer: Buffer.from(bytes) });
    return out.value as string;
  }
  throw new Error(`Unsupported file type: ${filename}`);
}

export interface IngestResult {
  filename: string;
  chunks: number;
  namespace: string;
}

async function resolveTenantKey(clientId: string): Promise<string> {
  const row = await azureRead.maybeSingle<{ tenant_key: string | null; slug: string | null }>({
    table: 'clients',
    columns: ['tenant_key', 'slug'],
    where: { id: clientId },
    missingTable: 'empty',
  }).catch(() => null);
  return row?.tenant_key ?? row?.slug ?? clientId;
}

function stableChunkId(clientId: string, filename: string, index: number, text: string): string {
  const digest = createHash('sha256')
    .update(clientId)
    .update('\n')
    .update(filename)
    .update('\n')
    .update(String(index))
    .update('\n')
    .update(text)
    .digest('hex')
    .slice(0, 24);
  return `upload-${digest}`;
}

export async function ingestClientFile(args: {
  clientId: string;
  filename: string;
  bytes: Uint8Array;
}): Promise<IngestResult> {
  const { clientId, filename, bytes } = args;
  const tenantKey = await resolveTenantKey(clientId);
  const namespace = `enterprise_context_chunks:${tenantKey}`;

  const text = await parseFileToText(filename, bytes);
  const chunks = chunkText(text);
  if (chunks.length === 0) {
    return { filename, chunks: 0, namespace };
  }

  const uploadedAt = new Date().toISOString();
  const rows = chunks.map((chunk, i) => ({
    client_id: clientId,
    tenant_key: tenantKey,
    chunk_id: stableChunkId(clientId, filename, i, chunk),
    source_segment_id: 'uploaded_document',
    source_doc: filename,
    source_path: `upload://${tenantKey}/${filename}`,
    chunk_index: i,
    chunk_text: chunk,
    token_count: chunk.split(/\s+/).filter(Boolean).length,
    embedding_status: 'pending',
    embedding_model: null,
    embedded_at: null,
    embedding: null,
    embedding_dim: null,
    embedding_error: null,
    provenance: {
      source: 'user_upload',
      filename,
      uploaded_at: uploadedAt,
    },
    chunk_metadata: {
      layer: 'client',
      filename,
      total_chunks: chunks.length,
      uploaded_at: uploadedAt,
      storage: 'azure_postgres_enterprise_context_chunks',
    },
  }));

  const db = getAzureWriteFluentClient();
  for (let u = 0; u < rows.length; u += UPSERT_BATCH) {
    const { error } = await db
      .from('enterprise_context_chunks')
      .upsert(rows.slice(u, u + UPSERT_BATCH), { onConflict: 'tenant_key,chunk_id' });
    if (error) throw new Error(`enterprise_context_chunks upload failed: ${error.message}`);
  }

  return { filename, chunks: chunks.length, namespace };
}
