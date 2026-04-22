import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createSeedClient, loadSeedEnv } from './seed-wave-lib';

async function count(table: string, column = 'id'): Promise<number> {
  const sb = createSeedClient();
  const { count: rowCount, error } = await sb.from(table).select(column, { count: 'exact', head: true });
  if (error) throw error;
  return rowCount ?? 0;
}

async function main() {
  loadSeedEnv();
  const [prefs, briefings, sections, items, compositions] = await Promise.all([
    count('user_briefing_preferences'),
    count('briefings'),
    count('briefing_sections'),
    count('briefing_items'),
    count('briefing_compositions', 'briefing_id'),
  ]);

  const checks = [
    { label: 'preferences >= 4', passed: prefs >= 4, actual: prefs },
    { label: 'briefings = 4', passed: briefings === 4, actual: briefings },
    { label: 'sections >= 13', passed: sections >= 13, actual: sections },
    { label: 'items >= 13', passed: items >= 13, actual: items },
    { label: 'compositions = 4', passed: compositions === 4, actual: compositions },
  ];

  console.log('\nBriefings verification');
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
