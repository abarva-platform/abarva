// Inline markdown parser for editorial content.
// Does NOT use remark/unified/gray-matter — simple split approach.
// Reads files from src/content/editorial/*.md at build time.

import fs from 'fs';
import path from 'path';

export interface EditorialFrontmatter {
  slug: string;
  title: string;
  publishedAt: string;
  summary: string;
  readingTime: number;
}

export interface EditorialEntry extends EditorialFrontmatter {
  body: string;
}

const CONTENT_DIR = path.join(process.cwd(), 'src', 'content', 'editorial');

// Known slugs in reverse-chronological order (newest first)
export const EDITORIAL_SLUGS = [
  '10-reasons-ai-initiatives-fail',
  'why-we-publish-our-contradictions',
  'the-cost-of-ai-program-drift',
] as const;

export type EditorialSlug = (typeof EDITORIAL_SLUGS)[number];

function parseYamlValue(value: string): string | number {
  const trimmed = value.trim();
  // Remove surrounding quotes
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  // Parse numbers
  const num = Number(trimmed);
  if (!isNaN(num) && trimmed !== '') return num;
  return trimmed;
}

function parseFrontmatter(raw: string): { frontmatter: Record<string, string | number>; body: string } {
  const parts = raw.split(/^---\s*$/m);
  // parts[0] = '' (before first ---), parts[1] = YAML, parts[2]+ = body
  if (parts.length < 3) {
    return { frontmatter: {}, body: raw };
  }

  const yamlBlock = parts[1];
  const body = parts.slice(2).join('---').trim();

  const frontmatter: Record<string, string | number> = {};
  for (const line of yamlBlock.split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    const val = line.slice(colonIdx + 1).trim();
    if (key) {
      frontmatter[key] = parseYamlValue(val);
    }
  }

  return { frontmatter, body };
}

function loadEditorialEntry(slug: string): EditorialEntry {
  const filePath = path.join(CONTENT_DIR, `${slug}.md`);
  const raw = fs.readFileSync(filePath, 'utf-8');
  const { frontmatter, body } = parseFrontmatter(raw);

  return {
    slug: String(frontmatter.slug ?? slug),
    title: String(frontmatter.title ?? ''),
    publishedAt: String(frontmatter.publishedAt ?? ''),
    summary: String(frontmatter.summary ?? ''),
    readingTime: Number(frontmatter.readingTime ?? 5),
    body,
  };
}

export function getAllEditorialPieces(): EditorialEntry[] {
  return EDITORIAL_SLUGS.map((slug) => loadEditorialEntry(slug));
}

export function getEditorialPiece(slug: string): EditorialEntry | null {
  if (!(EDITORIAL_SLUGS as readonly string[]).includes(slug)) return null;
  try {
    return loadEditorialEntry(slug);
  } catch {
    return null;
  }
}
