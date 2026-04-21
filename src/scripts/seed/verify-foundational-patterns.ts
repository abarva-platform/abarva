import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createSeedClient, loadSeedEnv } from './seed-wave-lib';

async function count(table: string): Promise<number> {
  const sb = createSeedClient();
  const { count: rowCount, error } = await sb.from(table).select('id', { count: 'exact', head: true });
  if (error) throw error;
  return rowCount ?? 0;
}

async function main() {
  loadSeedEnv();
  const [packCount, variantCount] = await Promise.all([
    count('foundational_pattern_packs'),
    count('foundational_pattern_variants'),
  ]);

  const checks = [
    { label: 'foundational packs = 1', passed: packCount === 1, actual: packCount },
    { label: 'foundational variants = 4', passed: variantCount === 4, actual: variantCount },
  ];

  console.log('\nFoundational patterns verification');
  for (const check of checks) {
    console.log(`  ${check.passed ? 'PASS' : 'FAIL'} · ${check.label} · ${check.actual}`);
  }

  const failed = checks.filter((check) => !check.passed);
  if (failed.length > 0) {
    throw new Error(`Verification failed: ${failed.map((item) => item.label).join('; ')}`);
  }
}

const isMain = process.argv[1]
  ? import.meta.url === pathToFileURL(process.argv[1]).href
  : false;

if (isMain) {
  main().catch((err) => {
    console.error('FAILED:', err);
    process.exit(1);
  });
}
