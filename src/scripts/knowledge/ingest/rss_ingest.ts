import Parser from 'rss-parser';
import { politeFetch } from './fetch';
import { hashContent, approxTokenCount, type Chunk } from '../chunking';

const WORD_CAP = 300;

function truncateToWords(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text.trim();
  return words.slice(0, maxWords).join(' ') + '…';
}

export interface RssIngestResult {
  chunks: Chunk[];
  contentHash: string;
  itemsSeen: number;
}

export interface RssFeedOpts {
  maxItems?: number;
  attribution: string;
}

export async function ingestRssFeed(url: string, opts: RssFeedOpts): Promise<RssIngestResult> {
  const res = await politeFetch(url);
  const xml = await res.text();
  const parser = new Parser();
  const parsed = await parser.parseString(xml);

  const items = (parsed.items ?? []).slice(0, opts.maxItems ?? 50);
  const chunks: Chunk[] = [];
  const seen = new Set<string>();

  for (const item of items) {
    const title = (item.title ?? '').trim();
    if (!title) continue;
    const dateKey = item.isoDate ?? item.pubDate ?? '';
    const hashKey = hashContent(`${title}|${dateKey}`);
    if (seen.has(hashKey)) continue;
    seen.add(hashKey);

    const snippet = item.contentSnippet ?? item.content ?? item.summary ?? '';
    const excerpt = truncateToWords(String(snippet), WORD_CAP);

    const body = [
      title,
      item.pubDate ? `Published: ${item.pubDate}` : '',
      item.creator ? `Author: ${item.creator}` : '',
      '',
      excerpt,
      '',
      `Attribution: ${opts.attribution}`,
      item.link ? `Full article: ${item.link}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    chunks.push({
      text: body,
      section: title,
      tokenCount: approxTokenCount(body),
    });
  }

  const contentHash = hashContent(chunks.map((c) => c.section ?? '').join('\n'));
  return { chunks, contentHash, itemsSeen: items.length };
}
