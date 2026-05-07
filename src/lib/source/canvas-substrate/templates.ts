// Source artifact template loader
//
// Reads canonical artifact body templates from src/content/source-templates/
// keyed by artifact code. Used by:
//
//   - The canvas Document panel — when a `tier: 'stub'` artifact has no
//     uploaded content, render the canonical template so the user sees
//     what's expected at this stage.
//   - The agent — when scaffolding a new artifact (tier promotion stub →
//     outline), the template is the starting body.
//
// Server-only because it uses fs.readFileSync. UI components consume via API
// route or server-component prop, not direct import.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { specByCode, type SourceArtifactSpec } from '../canonical-specs';

const TEMPLATES_DIR_REL = 'src/content/source-templates';

export interface ArtifactTemplate {
  code: string;
  stage: string;
  /** Markdown body — section structure, placeholders, ownership notes. */
  body: string;
}

/**
 * Load the canonical template body for an artifact code. Returns null if no
 * template file exists (which is a substrate gap — every canonical spec
 * should have a template).
 */
export function loadArtifactTemplate(code: string): ArtifactTemplate | null {
  const spec = specByCode(code);
  if (!spec) return null;
  const path = join(process.cwd(), TEMPLATES_DIR_REL, spec.stage, `${code}.md`);
  try {
    const body = readFileSync(path, 'utf8');
    return { code, stage: spec.stage, body };
  } catch {
    return null;
  }
}

/**
 * Verify every canonical spec has a corresponding template file. Used by
 * tests and CI to catch drift between catalog and content.
 */
export function findMissingTemplates(specs: readonly SourceArtifactSpec[]): string[] {
  const missing: string[] = [];
  for (const spec of specs) {
    const template = loadArtifactTemplate(spec.code);
    if (!template) missing.push(spec.code);
  }
  return missing;
}
