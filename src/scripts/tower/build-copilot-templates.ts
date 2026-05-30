// Tower ingest · GitHub Copilot · template build script.
//
// Writes the empty template.xlsx and the synthetic sample-filled.xlsx to
// public/templates/tower/copilot/. Idempotent — re-running overwrites.
//
// Usage:
//   npx tsx src/scripts/tower/build-copilot-templates.ts [--out=<dir>]

import { mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import {
  buildEmptyTemplateWorkbook,
  buildSampleFilledWorkbook,
} from '@/lib/tower/ingest/copilot/template-builder';
import { generateNorthwindCopilotRows } from '@/lib/tower/ingest/copilot/synthetic';

function parseArgs(): { outDir: string } {
  const args = process.argv.slice(2);
  let outDir = resolve(process.cwd(), 'public/templates/tower/copilot');
  for (const a of args) {
    if (a.startsWith('--out=')) outDir = resolve(a.slice('--out='.length));
  }
  return { outDir };
}

async function main() {
  const { outDir } = parseArgs();
  mkdirSync(outDir, { recursive: true });

  const empty = buildEmptyTemplateWorkbook();
  const emptyPath = join(outDir, 'template.xlsx');
  await empty.xlsx.writeFile(emptyPath);
  process.stdout.write(`wrote ${emptyPath}\n`);

  const rows = generateNorthwindCopilotRows();
  const sample = buildSampleFilledWorkbook(rows);
  const samplePath = join(outDir, 'sample-filled.xlsx');
  await sample.xlsx.writeFile(samplePath);
  process.stdout.write(`wrote ${samplePath} (${rows.length} rows)\n`);
}

main().catch((err) => {
  process.stderr.write(`ERROR: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
