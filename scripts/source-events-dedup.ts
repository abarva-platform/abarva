// scripts/source-events-dedup.ts
//
// Audits and (optionally) cleans up duplicate (client_key, event_code) rows
// in public.source_events so the
// 20260602100000_source_events_idempotency.sql migration can install the
// UNIQUE constraint.
//
// Run:
//   npx tsx scripts/source-events-dedup.ts            # read-only audit (default)
//   npx tsx scripts/source-events-dedup.ts --apply    # keeps oldest row,
//                                                     # soft-archives the rest
//
// Soft-archive policy:
//   - Within each duplicate group, the row with the EARLIEST created_at is
//     kept as-is.
//   - Every other row in the group is updated to
//     lifecycle_state = 'archived', event_code = <original>__ARCHIVED__<id>,
//     and updated_at = now().
//   - No rows are physically deleted; downstream FKs (substrate, value-proof,
//     audit log) stay intact.
//
// Requires DATABASE_URL in .env.local (Postgres connection string).

import { Client } from 'pg';
import { config as loadEnv } from 'dotenv';
import path from 'node:path';

loadEnv({ path: path.resolve(process.cwd(), '.env.local'), quiet: true });
loadEnv({ path: path.resolve(process.cwd(), '.env'), quiet: true });

type DuplicateRow = {
  id: string;
  client_key: string;
  event_code: string;
  created_at: string;
  lifecycle_state: string;
};

type DuplicateGroup = {
  client_key: string;
  event_code: string;
  rows: DuplicateRow[];
};

function parseArgs() {
  const args = new Set(process.argv.slice(2));
  return {
    apply: args.has('--apply'),
  };
}

function requireDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error(
      'source-events-dedup: DATABASE_URL is not set. Add it to .env.local before running.',
    );
    process.exit(1);
  }
  return url;
}

async function loadDuplicateGroups(client: Client): Promise<DuplicateGroup[]> {
  // Pull every row that participates in a duplicate group, ordered so the
  // oldest row of each group is first.
  const { rows } = await client.query<DuplicateRow>(`
    SELECT
      se.id::text          AS id,
      se.client_key        AS client_key,
      se.event_code        AS event_code,
      se.created_at::text  AS created_at,
      se.lifecycle_state   AS lifecycle_state
    FROM source_events se
    JOIN (
      SELECT client_key, event_code
      FROM source_events
      GROUP BY client_key, event_code
      HAVING COUNT(*) > 1
    ) dup
      ON dup.client_key = se.client_key
     AND dup.event_code = se.event_code
    ORDER BY se.client_key, se.event_code, se.created_at ASC, se.id ASC
  `);

  const byKey = new Map<string, DuplicateGroup>();
  for (const row of rows) {
    const key = `${row.client_key}::${row.event_code}`;
    let group = byKey.get(key);
    if (!group) {
      group = { client_key: row.client_key, event_code: row.event_code, rows: [] };
      byKey.set(key, group);
    }
    group.rows.push(row);
  }
  return [...byKey.values()];
}

function printGroups(groups: DuplicateGroup[]): void {
  if (groups.length === 0) {
    console.log('source-events-dedup: no duplicate (client_key, event_code) groups found. Safe to run the idempotency migration.');
    return;
  }
  console.log(`source-events-dedup: found ${groups.length} duplicate group(s):`);
  for (const group of groups) {
    console.log(`\n  client_key=${group.client_key} event_code=${group.event_code} count=${group.rows.length}`);
    for (const [index, row] of group.rows.entries()) {
      const marker = index === 0 ? 'KEEP   ' : 'ARCHIVE';
      console.log(`    ${marker}  id=${row.id}  created_at=${row.created_at}  lifecycle_state=${row.lifecycle_state}`);
    }
  }
}

async function applyArchive(client: Client, groups: DuplicateGroup[]): Promise<void> {
  let archived = 0;
  await client.query('BEGIN');
  try {
    for (const group of groups) {
      const [keep, ...toArchive] = group.rows;
      for (const row of toArchive) {
        const before = row.lifecycle_state;
        const archivedEventCode = archivedCode(row.event_code, row.id);
        await client.query(
          `UPDATE source_events
             SET lifecycle_state = 'archived',
                 event_code = $2,
                 updated_at = now()
           WHERE id = $1::uuid`,
          [row.id, archivedEventCode],
        );
        archived += 1;
        console.log(
          `  archived id=${row.id} client_key=${group.client_key} event_code=${group.event_code} -> ${archivedEventCode} ${before} -> archived (kept id=${keep.id})`,
        );
      }
    }
    await client.query('COMMIT');
    console.log(`\nsource-events-dedup: --apply complete. soft-archived ${archived} row(s) across ${groups.length} group(s).`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  }
}

function archivedCode(eventCode: string, id: string): string {
  const suffix = `__ARCHIVED__${id.slice(0, 8)}`;
  if (eventCode.endsWith(suffix)) return eventCode;
  return `${eventCode}${suffix}`;
}

async function main(): Promise<void> {
  const { apply } = parseArgs();
  const databaseUrl = requireDatabaseUrl();

  const client = new Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    const groups = await loadDuplicateGroups(client);
    printGroups(groups);

    if (!apply) {
      if (groups.length > 0) {
        console.log('\nsource-events-dedup: read-only audit (pass --apply to soft-archive the non-oldest rows).');
      }
      return;
    }

    if (groups.length === 0) {
      return;
    }

    await applyArchive(client, groups);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('source-events-dedup: failed', err instanceof Error ? err.message : err);
  process.exit(1);
});
