import { fetchText } from './fetch';
import { chunkText, chunkBySection, hashContent, type Chunk, type SectionedInput } from '../chunking';

export interface HtmlIngestResult {
  chunks: Chunk[];
  contentHash: string;
}

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export async function ingestHtml(url: string): Promise<HtmlIngestResult> {
  const html = await fetchText(url);
  const text = stripTags(html);
  const chunks = chunkText(text);
  return { chunks, contentHash: hashContent(text) };
}

const SECTION_HEADER_RE = /<h([1-3])[^>]*>([\s\S]*?)<\/h\1>/gi;

export async function ingestHtmlBySections(url: string): Promise<HtmlIngestResult> {
  const html = await fetchText(url);
  const sections: SectionedInput[] = [];
  let lastIndex = 0;
  let lastHeading: string | undefined;
  let match: RegExpExecArray | null;
  const copy = html;
  while ((match = SECTION_HEADER_RE.exec(copy)) !== null) {
    if (lastHeading !== undefined) {
      const body = copy.slice(lastIndex, match.index);
      sections.push({ section: lastHeading, text: stripTags(body) });
    }
    lastHeading = stripTags(match[2]);
    lastIndex = SECTION_HEADER_RE.lastIndex;
  }
  if (lastHeading !== undefined) {
    sections.push({ section: lastHeading, text: stripTags(copy.slice(lastIndex)) });
  }
  if (sections.length === 0) {
    return ingestHtml(url);
  }
  const chunks = chunkBySection(sections);
  const contentHash = hashContent(sections.map((s) => `${s.section}\n${s.text}`).join('\n\n'));
  return { chunks, contentHash };
}
