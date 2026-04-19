import { createHash } from 'node:crypto';

export interface Chunk {
  text: string;
  section?: string;
  pageNumber?: number;
  tokenCount: number;
}

const APPROX_TOKENS_PER_CHAR = 1 / 4;

export function approxTokenCount(text: string): number {
  return Math.round(text.length * APPROX_TOKENS_PER_CHAR);
}

export function hashContent(text: string): string {
  return createHash('sha256').update(text).digest('hex').slice(0, 32);
}

interface ChunkOpts {
  targetTokens?: number;
  overlapTokens?: number;
  minChunkTokens?: number;
}

export function chunkText(text: string, opts: ChunkOpts = {}): Chunk[] {
  const target = opts.targetTokens ?? 800;
  const overlap = opts.overlapTokens ?? 100;
  const minLen = (opts.minChunkTokens ?? 50) / APPROX_TOKENS_PER_CHAR;

  const targetLen = target / APPROX_TOKENS_PER_CHAR;
  const overlapLen = overlap / APPROX_TOKENS_PER_CHAR;

  const cleaned = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  if (cleaned.length <= targetLen) {
    return cleaned.length >= minLen
      ? [{ text: cleaned, tokenCount: approxTokenCount(cleaned) }]
      : [];
  }

  const chunks: Chunk[] = [];
  let start = 0;
  while (start < cleaned.length) {
    const end = Math.min(start + targetLen, cleaned.length);
    let splitAt = end;
    if (end < cleaned.length) {
      const paragraphBoundary = cleaned.lastIndexOf('\n\n', end);
      const sentenceBoundary = cleaned.lastIndexOf('. ', end);
      if (paragraphBoundary > start + targetLen * 0.5) splitAt = paragraphBoundary;
      else if (sentenceBoundary > start + targetLen * 0.5) splitAt = sentenceBoundary + 1;
    }
    const slice = cleaned.slice(start, splitAt).trim();
    if (slice.length >= minLen) {
      chunks.push({ text: slice, tokenCount: approxTokenCount(slice) });
    }
    if (splitAt >= cleaned.length) break;
    start = Math.max(splitAt - overlapLen, splitAt);
  }
  return chunks;
}

export interface SectionedInput {
  section: string;
  text: string;
  pageNumber?: number;
}

export function chunkBySection(sections: SectionedInput[], opts: ChunkOpts = {}): Chunk[] {
  const out: Chunk[] = [];
  for (const s of sections) {
    const sub = chunkText(s.text, opts);
    for (const c of sub) {
      out.push({
        text: c.text,
        section: s.section,
        pageNumber: s.pageNumber,
        tokenCount: c.tokenCount,
      });
    }
  }
  return out;
}
