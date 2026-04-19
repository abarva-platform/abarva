import { config } from 'dotenv';
config({ path: '.env.local' });

import { readFileSync } from 'node:fs';
import { getGraphDriver, closeGraphDriver } from '../lib/graph/driver';

async function main() {
  const arg = process.argv[2];
  if (!arg) {
    console.error('usage: tsx src/scripts/query-graph.ts <cypher-file | "--" for stdin>');
    process.exit(2);
  }
  const cypher = arg === '--'
    ? readFileSync(0, 'utf8')
    : readFileSync(arg, 'utf8');

  const driver = getGraphDriver();
  const session = driver.session();
  try {
    const res = await session.run(cypher);
    const rows = res.records.map(r => Object.fromEntries(r.keys.map(k => [k, r.get(k)])));
    console.log(JSON.stringify(rows, (_k, v) =>
      typeof v === 'bigint' ? v.toString() :
      v && typeof v === 'object' && 'low' in v && 'high' in v ? (v as { toNumber: () => number }).toNumber?.() ?? v :
      v,
    2));
  } finally {
    await session.close();
    await closeGraphDriver();
  }
}

main().catch(e => { console.error(e); process.exit(1); });
