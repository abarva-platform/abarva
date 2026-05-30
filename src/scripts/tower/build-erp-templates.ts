#!/usr/bin/env -S npx tsx
// Tower · ERP ingest · template builder.
//
// Writes public/templates/tower/erp/template.xlsx (blank) and
// public/templates/tower/erp/sample-northwind.xlsx (synthetic sample).
// Run via:  npx tsx src/scripts/tower/build-erp-templates.ts

import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { buildErpWorkbook } from '@/lib/tower/ingest/erp/template-builder';
import { buildSyntheticNorthwindDataset } from '@/lib/tower/ingest/erp/sample-data';

async function main(): Promise<void> {
  const outDir = join(process.cwd(), 'public', 'templates', 'tower', 'erp');
  await mkdir(outDir, { recursive: true });

  const blank = await buildErpWorkbook();
  await writeFile(join(outDir, 'template.xlsx'), blank);
  console.log(`wrote ${join(outDir, 'template.xlsx')} (${blank.length} bytes)`);

  const ds = buildSyntheticNorthwindDataset();
  const sample = await buildErpWorkbook({
    filled: { financials: ds.financials, vendors: ds.vendors },
  });
  await writeFile(join(outDir, 'sample-northwind.xlsx'), sample);
  console.log(
    `wrote ${join(outDir, 'sample-northwind.xlsx')} (${sample.length} bytes, ${ds.financials.length} financial rows, ${ds.vendors.length} vendors)`,
  );
}

main().catch((err) => {
  console.error('build-erp-templates failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
