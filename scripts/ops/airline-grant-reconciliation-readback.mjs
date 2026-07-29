#!/usr/bin/env node

import { Client } from "pg";
import { dbConnectionConfig } from "../knowledge/build-review-decision-ledger.mjs";

const TENANT_KEY = "airline-demo-new";
const DATABASE_NAME = "abarva_airline_demo_new_knowledge_lab";
const EVALUATOR_ROLE = "airline_demo_new_evaluator";
const ACK = "GRANT_AIRLINE_RECONCILIATION_READBACK";

const READ_SCHEMAS = [
  "source_registry",
  "evidence",
  "working",
  "governance",
  "knowledge",
  "metrics",
  "publication",
  "consumption",
  "audit",
  "operations",
];

function requireExact(value, expected, label) {
  if (value !== expected) {
    throw new Error(`${label}_mismatch: expected=${expected} actual=${value || "<empty>"}`);
  }
}

function quoteIdent(value) {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value)) {
    throw new Error(`unsafe_identifier:${value}`);
  }
  return `"${value.replaceAll('"', '""')}"`;
}

async function main() {
  requireExact(process.env.ABARVA_TENANT_KEY, TENANT_KEY, "tenant");
  requireExact(process.env.PGDATABASE, DATABASE_NAME, "database_env");
  requireExact(process.env.ABARVA_GRANT_RECONCILIATION_READBACK_ACK, ACK, "ack");

  const client = new Client(await dbConnectionConfig(process.env));
  await client.connect();

  try {
    const identity = await client.query(`
      SELECT current_database() AS database_name,
        current_user AS current_user,
        session_user AS session_user,
        inet_server_addr()::text AS server_addr
    `);
    const dbName = identity.rows[0]?.database_name;
    requireExact(dbName, DATABASE_NAME, "database_live");

    await client.query("BEGIN");
    await client.query("SET LOCAL lock_timeout = '5s'");
    await client.query("SET LOCAL statement_timeout = '120s'");

    const grantSchemas = READ_SCHEMAS.map(quoteIdent).join(", ");
    await client.query(`GRANT USAGE ON SCHEMA ${grantSchemas} TO ${quoteIdent(EVALUATOR_ROLE)}`);

    for (const schema of READ_SCHEMAS) {
      const qSchema = quoteIdent(schema);
      await client.query(`GRANT SELECT ON ALL TABLES IN SCHEMA ${qSchema} TO ${quoteIdent(EVALUATOR_ROLE)}`);
      await client.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA ${qSchema} GRANT SELECT ON TABLES TO ${quoteIdent(EVALUATOR_ROLE)}`);
    }

    const privilegeRows = [];
    for (const schema of READ_SCHEMAS) {
      const schemaPrivilege = await client.query(
        `SELECT has_schema_privilege($1, $2, 'USAGE') AS has_usage`,
        [EVALUATOR_ROLE, schema],
      );
      const tablePrivileges = await client.query(
        `
          SELECT table_schema,
            table_name,
            has_table_privilege($1, format('%I.%I', table_schema, table_name), 'SELECT') AS has_select
          FROM information_schema.tables
          WHERE table_schema = $2
            AND table_type = 'BASE TABLE'
          ORDER BY table_schema, table_name
        `,
        [EVALUATOR_ROLE, schema],
      );

      const missingSelect = tablePrivileges.rows
        .filter((row) => !row.has_select)
        .map((row) => `${row.table_schema}.${row.table_name}`);

      privilegeRows.push({
        schema,
        hasUsage: Boolean(schemaPrivilege.rows[0]?.has_usage),
        tableCount: tablePrivileges.rowCount,
        missingSelect,
      });
    }

    const failed = privilegeRows.filter((row) => !row.hasUsage || row.missingSelect.length > 0);
    if (failed.length > 0) {
      throw new Error(`grant_verification_failed:${JSON.stringify(failed)}`);
    }

    await client.query("COMMIT");

    console.log(JSON.stringify({
      status: "pass",
      tenantKey: TENANT_KEY,
      database: DATABASE_NAME,
      evaluatorRole: EVALUATOR_ROLE,
      connection: identity.rows[0],
      grantedSchemas: privilegeRows,
      mutationBoundary: "read_only_privilege_grant_only_no_foundation_data_mutation",
    }, null, 2));
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
