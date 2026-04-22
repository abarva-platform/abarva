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
      const raw = readFileSync(join(dir, file), 'utf8');
      // Strip // line comments BEFORE splitting on ';' so semicolons inside
      // comments (e.g., "// foo; bar") don't falsely terminate statements.
      const stripped = raw
        .split('\n')
        .map(line => {
          const commentIdx = line.indexOf('//');
          return commentIdx >= 0 ? line.slice(0, commentIdx) : line;
        })
        .join('\n');
      const statements = stripped
        .split(';')
        .map(s => s.trim())
        .filter(Boolean);
      console.log(`\n--- ${file} (${statements.length} statements) ---`);
      for (const stmt of statements) {
        await session.run(stmt);
        const firstLine = stmt.split('\n')[0];
        console.log(`  ✓ ${firstLine.slice(0, 80)}${firstLine.length > 80 ? '...' : ''}`);
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
