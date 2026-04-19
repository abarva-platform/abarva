import { config } from 'dotenv';
config({ path: '.env.local' });

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { getGraphDriver, closeGraphDriver } from '../lib/graph/driver';

async function main() {
  const dir = join(process.cwd(), 'db/graph/migrations');
  const files = readdirSync(dir).filter(f => f.endsWith('.cypher')).sort();
  const driver = getGraphDriver();
  const session = driver.session();
  try {
    for (const file of files) {
      const content = readFileSync(join(dir, file), 'utf8');
      const statements = content.split(';').map(s => s.trim()).filter(Boolean);
      console.log(`\n--- ${file} (${statements.length} statements) ---`);
      for (const stmt of statements) {
        await session.run(stmt);
        console.log(`  ✓ ${stmt.split('\n')[0].slice(0, 80)}...`);
      }
    }
    const verify = await session.run(
      'MATCH (n) RETURN labels(n)[0] AS type, count(*) AS count ORDER BY count DESC'
    );
    console.log('\n=== Verification ===');
    verify.records.forEach(r => console.log(`  ${r.get('type')}: ${r.get('count')}`));
  } finally {
    await session.close();
    await closeGraphDriver();
  }
}

main().catch(e => { console.error(e); process.exit(1); });
