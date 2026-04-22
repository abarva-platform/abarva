import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { ALL_TEMPLATES, TEMPLATE_VERSION } from './schema';

export function generateJsonBundle(outDir: string): string {
  mkdirSync(outDir, { recursive: true });
  const bundle: Record<string, unknown> = {
    template_version: TEMPLATE_VERSION,
    client_reference: null,
    as_of_date: null,
    notes: 'Populate client_reference (your internal slug) and as_of_date (YYYY-MM-DD). Each array below mirrors the matching CSV template. POST the completed JSON to /api/tower/ingest.',
  };

  for (const t of ALL_TEMPLATES) {
    bundle[t.dimension] = [t.exampleRow];
  }

  const path = join(outDir, 'tower-bundle.json');
  writeFileSync(path, JSON.stringify(bundle, null, 2), 'utf8');
  return path;
}
