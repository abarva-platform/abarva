import OpenAI from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';

let _openai: OpenAI | null = null;
let _pinecone: Pinecone | null = null;

function getOpenAI(): OpenAI {
  if (_openai) return _openai;
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY required for embeddings');
  _openai = new OpenAI({ apiKey: key });
  return _openai;
}

function getPinecone(): Pinecone {
  if (_pinecone) return _pinecone;
  const key = process.env.PINECONE_API_KEY;
  if (!key) throw new Error('PINECONE_API_KEY required');
  _pinecone = new Pinecone({ apiKey: key });
  return _pinecone;
}

const EMBED_MODEL = 'text-embedding-3-large';
const EMBED_DIMS = 3072;
const BATCH = 64;

export async function embedBatch(texts: string[]): Promise<number[][]> {
  const vectors: number[][] = [];
  const openai = getOpenAI();
  for (let i = 0; i < texts.length; i += BATCH) {
    const batch = texts.slice(i, i + BATCH);
    const response = await openai.embeddings.create({
      model: EMBED_MODEL,
      input: batch,
      dimensions: EMBED_DIMS,
    });
    for (const item of response.data) {
      vectors.push(item.embedding);
    }
  }
  return vectors;
}

export interface PineconeUpsertItem {
  id: string;
  values: number[];
  metadata: Record<string, string | number | boolean | string[]>;
}

export async function pineconeUpsert(
  namespace: string,
  items: PineconeUpsertItem[],
  indexName: string = process.env.PINECONE_INDEX ?? 'nexus-knowledge',
): Promise<void> {
  if (items.length === 0) return;
  const pc = getPinecone();
  const index = pc.index(indexName).namespace(namespace);
  const BATCH_UP = 100;
  for (let i = 0; i < items.length; i += BATCH_UP) {
    await index.upsert({ records: items.slice(i, i + BATCH_UP) });
  }
}

export async function pineconeDeleteBySource(
  namespace: string,
  sourceKey: string,
  indexName: string = process.env.PINECONE_INDEX ?? 'nexus-knowledge',
): Promise<void> {
  const pc = getPinecone();
  const index = pc.index(indexName).namespace(namespace);
  await index.deleteMany({ filter: { source_key: { $eq: sourceKey } } });
}

export { EMBED_MODEL, EMBED_DIMS };
