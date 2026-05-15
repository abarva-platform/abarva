import { config } from 'dotenv';
config({ path: '.env.local' });

import { readFileSync } from 'node:fs';
import { getGraphDriverIfEnabled, closeGraphDriver } from '../lib/graph/driver';
import { setNeo4jEnabledOverride } from '../lib/graph/neo4j-gate';

async function main() {
  const arg = process.argv[2];
  if (!arg) {
    console.error('usage: tsx src/scripts/query-graph.ts <cypher-file | "--" for stdin>');
    process.exit(2);
  }
  const cypher = arg === '--'
    ? readFileSync(0, 'utf8')
    : readFileSync(arg, 'utf8');

  // Operator-run Cypher script — force the gate on for this process.
  setNeo4jEnabledOverride(true);
  const driver = await getGraphDriverIfEnabled();
  if (!driver) {
    console.error('graph_neo4j_enabled override did not take effect; aborting.');
    process.exit(2);
  }
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
