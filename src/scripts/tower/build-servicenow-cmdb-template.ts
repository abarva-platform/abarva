/**
 * Build the ServiceNow CMDB ingest template + sample workbooks and write
 * them to public/templates/tower/servicenow-cmdb/. Idempotent — re-running
 * regenerates identical files (the template builder uses a fixed
 * `workbook.created` timestamp so the binary output is deterministic).
 *
 * Usage:
 *   npx tsx src/scripts/tower/build-servicenow-cmdb-template.ts
 */

import path from 'node:path';
import { mkdirSync } from 'node:fs';

import { writeServiceNowCmdbWorkbook } from '@/lib/tower/ingest/servicenow-cmdb/template';

async function main(): Promise<void> {
  const outDir = path.join(process.cwd(), 'public/templates/tower/servicenow-cmdb');
  mkdirSync(outDir, { recursive: true });

  const templatePath = path.join(outDir, 'template.xlsx');
  const samplePath = path.join(outDir, 'sample.xlsx');

  await writeServiceNowCmdbWorkbook(templatePath, { filled: false });
   
  console.log(`wrote ${templatePath}`);

  await writeServiceNowCmdbWorkbook(samplePath, { filled: true });
   
  console.log(`wrote ${samplePath}`);
}

main().catch((err) => {
   
  console.error(err);
  process.exit(1);
});
