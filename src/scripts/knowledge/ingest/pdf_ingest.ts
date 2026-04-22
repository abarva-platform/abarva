import { fetchBuffer } from './fetch';
import { chunkText, hashContent, type Chunk } from '../chunking';

export interface PdfIngestResult {
  chunks: Chunk[];
  pageCount: number;
  contentHash: string;
}

export async function ingestPdf(url: string): Promise<PdfIngestResult> {
  const buf = await fetchBuffer(url);
  // pdf-parse ships no types; require at runtime to sidestep TS module resolution.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require('pdf-parse') as (b: Buffer) => Promise<{ text: string; numpages: number }>;
  const parsed = await pdfParse(buf);
  const text = parsed.text;
  const chunks = chunkText(text);
  return { chunks, pageCount: parsed.numpages, contentHash: hashContent(text) };
}
