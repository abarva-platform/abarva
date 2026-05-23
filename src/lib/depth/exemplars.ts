import fs from 'node:fs/promises';
import path from 'node:path';

import type { DepthRubricType } from './types';
import { assertRubricType } from './rubrics/shared';

export interface DepthExemplar {
  artifact_id: string;
  rubric_type: DepthRubricType;
  title: string;
  filePath: string;
  content: string;
}

const EXEMPLAR_DIR = path.join(process.cwd(), 'docs', 'standards', 'exemplars');

function readFrontmatter(content: string): Record<string, string> {
  if (!content.startsWith('---')) return {};
  const end = content.indexOf('\n---', 3);
  if (end === -1) return {};
  const body = content.slice(3, end).trim();
  const fields: Record<string, string> = {};
  for (const line of body.split('\n')) {
    const [key, ...rest] = line.split(':');
    if (!key || rest.length === 0) continue;
    fields[key.trim()] = rest.join(':').trim().replace(/^"|"$/g, '');
  }
  return fields;
}

export async function loadDepthExemplars(): Promise<DepthExemplar[]> {
  const entries = await fs.readdir(EXEMPLAR_DIR, { withFileTypes: true });
  const exemplars: DepthExemplar[] = [];

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
    const filePath = path.join(EXEMPLAR_DIR, entry.name);
    const content = await fs.readFile(filePath, 'utf8');
    const frontmatter = readFrontmatter(content);
    if (!frontmatter.rubric_type || !frontmatter.artifact_id) continue;
    exemplars.push({
      artifact_id: frontmatter.artifact_id,
      rubric_type: assertRubricType(frontmatter.rubric_type),
      title: frontmatter.title ?? entry.name.replace(/\.md$/, ''),
      filePath,
      content,
    });
  }

  return exemplars.sort((a, b) => a.rubric_type.localeCompare(b.rubric_type));
}
