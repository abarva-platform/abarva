import { Pinecone } from '@pinecone-database/pinecone';

// Matches scripts/ingest-knowledge.ts conventions
const EMBED_MODEL = 'multilingual-e5-large';
const CHUNK_SIZE = 800; // words
const CHUNK_OVERLAP = 100; // words
const EMBED_BATCH = 48;
const UPSERT_BATCH = 100;

let pc: Pinecone | null = null;
function getPinecone(): Pinecone {
  if (pc) return pc;
  const apiKey = process.env.PINECONE_API_KEY;
  if (!apiKey) throw new Error('Missing PINECONE_API_KEY');
  pc = new Pinecone({ apiKey });
  return pc;
}

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

async function embedBatch(texts: string[]): Promise<number[][]> {
  const res = await getPinecone().inference.embed({
    model: EMBED_MODEL,
    inputs: texts,
    parameters: { inputType: 'passage', truncate: 'END' },
  });
  return (res.data as Array<{ values: number[] }>).map((r) => r.values);
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

export async function ingestClientFile(args: {
  clientId: string;
  filename: string;
  bytes: Uint8Array;
}): Promise<IngestResult> {
  const { clientId, filename, bytes } = args;
  const namespace = `client_${clientId}`;
  const indexName = process.env.PINECONE_INDEX ?? 'nexus-knowledge';

  const text = await parseFileToText(filename, bytes);
  const chunks = chunkText(text);
  if (chunks.length === 0) {
    return { filename, chunks: 0, namespace };
  }

  const embeddings: number[][] = [];
  for (let b = 0; b < chunks.length; b += EMBED_BATCH) {
    const slice = chunks.slice(b, b + EMBED_BATCH);
    const out = await embedBatch(slice);
    embeddings.push(...out);
    if (b + EMBED_BATCH < chunks.length) {
      await new Promise((r) => setTimeout(r, 80));
    }
  }

  const uploadedAt = new Date().toISOString();
  const idx = getPinecone().index(indexName).namespace(namespace);
  const vectors = chunks.map((chunk, i) => ({
    id: `client_${clientId}__${filename}__${i}`,
    values: embeddings[i],
    metadata: {
      layer: 'client',
      client_id: clientId,
      filename,
      chunk_index: i,
      total_chunks: chunks.length,
      uploaded_at: uploadedAt,
      text: chunk.substring(0, 1200),
    },
  }));
  for (let u = 0; u < vectors.length; u += UPSERT_BATCH) {
    await idx.upsert({ records: vectors.slice(u, u + UPSERT_BATCH) });
  }

  return { filename, chunks: chunks.length, namespace };
}
