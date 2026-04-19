import { config as loadEnv } from 'dotenv';
import path from 'node:path';
import { getSeedClient, seedClient } from './_shared/upsert';
import { MERIDIAN_ENTERPRISE } from './meridian-enterprise';
import { FIRSTCAPITAL_ENTERPRISE } from './firstcapital-enterprise';
import { APEX_ENTERPRISE } from './apex-enterprise';
import type { ClientSeed } from './_shared/types';

loadEnv({ path: path.resolve(process.cwd(), '.env.local') });
loadEnv();

const ALL: Record<string, ClientSeed> = {
  meridian: MERIDIAN_ENTERPRISE,
  firstcapital: FIRSTCAPITAL_ENTERPRISE,
  apex: APEX_ENTERPRISE,
};

function parseClients(argv: string[]): string[] {
  const idx = argv.findIndex((a) => a === '--clients');
  if (idx < 0) return Object.keys(ALL);
  const val = argv[idx + 1];
  if (!val) return Object.keys(ALL);
  return val.split(',').map((s) => s.trim().toLowerCase());
}

async function main() {
  const clients = parseClients(process.argv);
  const sb = getSeedClient();

  for (const key of clients) {
    const seed = ALL[key];
    if (!seed) {
      console.error(`Unknown client key "${key}". Available: ${Object.keys(ALL).join(', ')}`);
      continue;
    }
    console.log(`\n▸ ${seed.name} · ${seed.useCases.length} use cases`);
    const { clientId, inserted, skippedVendors } = await seedClient(sb, seed);
    if (!clientId) {
      console.error(`  ✗ client "${seed.name}" not found in clients table — apply migration 020 + 022 first`);
      continue;
    }
    console.log(`  ✓ ${inserted}/${seed.useCases.length} inserted · client_id=${clientId}`);
    if (skippedVendors.length > 0) {
      console.warn(`  ⚠ skipped ${skippedVendors.length} use cases with unlisted vendor: ${[...new Set(skippedVendors)].join(', ')}`);
    }
  }
}

main().catch((err) => {
  console.error('FAILED:', err);
  process.exit(1);
});
