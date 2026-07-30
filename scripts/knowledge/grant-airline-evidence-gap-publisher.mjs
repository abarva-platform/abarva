#!/usr/bin/env node
import pg from 'pg';

import { dbConnectionConfig } from './build-review-decision-ledger.mjs';

const EXPECTED_DATABASE =
  process.env.PGDATABASE || process.env.ABARVA_HCDN_DATABASE || 'abarva_airline_demo_new_knowledge_lab';
const PUBLISHER_ROLE = process.env.ABARVA_AIRLINE_PUBLISHER_ROLE || 'airline_demo_new_publisher';

const client = new pg.Client(await dbConnectionConfig(process.env));

await client.connect();

try {
  await client.query('BEGIN');

  const db = await client.query('SELECT current_database() AS db, current_user AS usr');
  const currentDatabase = db.rows[0]?.db;
  if (currentDatabase !== EXPECTED_DATABASE) {
    throw new Error(`wrong database target: expected ${EXPECTED_DATABASE}, got ${currentDatabase}`);
  }

  await client.query(`GRANT USAGE ON SCHEMA governance TO ${PUBLISHER_ROLE}`);
  await client.query(
    `GRANT SELECT, INSERT, UPDATE ON TABLE governance.evidence_gap TO ${PUBLISHER_ROLE}`,
  );

  const verify = await client.query(
    `
      SELECT
        has_schema_privilege($1, 'governance', 'USAGE') AS schema_usage,
        has_table_privilege($1, 'governance.evidence_gap', 'SELECT') AS can_select,
        has_table_privilege($1, 'governance.evidence_gap', 'INSERT') AS can_insert,
        has_table_privilege($1, 'governance.evidence_gap', 'UPDATE') AS can_update
    `,
    [PUBLISHER_ROLE],
  );
  const grant = verify.rows[0];
  if (!grant?.schema_usage || !grant.can_select || !grant.can_insert || !grant.can_update) {
    throw new Error(`grant verification failed: ${JSON.stringify(grant)}`);
  }

  await client.query('COMMIT');
  console.log(
    JSON.stringify(
      {
        status: 'passed',
        database: currentDatabase,
        user: db.rows[0]?.usr,
        publisherRole: PUBLISHER_ROLE,
        grant,
      },
      null,
      2,
    ),
  );
} catch (error) {
  await client.query('ROLLBACK').catch(() => {});
  throw error;
} finally {
  await client.end();
}
