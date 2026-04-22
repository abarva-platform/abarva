import { join } from 'node:path';
import { generateCsvTemplates } from './generate-csv';
import { generateXlsxBundle } from './generate-xlsx';
import { generateJsonBundle } from './generate-json';

async function main() {
  const outDir = join(process.cwd(), 'public', 'templates', 'tower');

  const csvPaths = generateCsvTemplates(outDir);
  for (const p of csvPaths) console.log(`  ✓ ${p}`);

  const xlsxPath = await generateXlsxBundle(outDir);
  console.log(`  ✓ ${xlsxPath}`);

  const jsonPath = generateJsonBundle(outDir);
  console.log(`  ✓ ${jsonPath}`);

  console.log(`\nWrote ${csvPaths.length + 2} files to ${outDir}`);
}

main().catch((err) => {
  console.error('FAILED:', err);
  process.exit(1);
});
