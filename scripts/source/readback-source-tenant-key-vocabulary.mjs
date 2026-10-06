#!/usr/bin/env node

/**
 * Read the stored tenant/client-key vocabulary used by Source workflow tables.
 *
 * This diagnostic is deliberately narrower than the general tenant-key audit:
 * it reports exact stored values and counts for a fixed allowlist of identity
 * columns. It never canonicalizes values and has no write mode.
 */

import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

export const TENANT_KEY_TARGETS = Object.freeze([
  Object.freeze({
    schema: "public",
    table: "clients",
    column: "tenant_key",
    required: true,
  }),
  Object.freeze({
    schema: "public",
    table: "source_events",
    column: "client_key",
    required: false,
  }),
  Object.freeze({
    schema: "public",
    table: "source_artifact_generation_jobs",
    column: "client_key",
    required: false,
  }),
  Object.freeze({
    schema: "public",
    table: "source_event_activity",
    column: "client_key",
    required: false,
  }),
  Object.freeze({
    schema: "public",
    table: "source_event_participants",
    column: "client_key",
    required: false,
  }),
]);

export function databaseClientOptions(databaseUrl) {
  return { connectionString: databaseUrl };
}

const RELATION_KIND = Object.freeze({ r: "table", p: "partitioned_table" });

function fail(code, report) {
  const error = new Error(code);
  error.code = code;
  if (report) error.report = report;
  return error;
}

function quoteIdentifier(value) {
  if (!/^[a-z_][a-z0-9_]*$/.test(value))
    throw fail("invalid_catalog_identifier");
  return `"${value}"`;
}

function location(target) {
  return `${target.schema}.${target.table}.${target.column}`;
}

function sortValues(rows) {
  return rows
    .map((row) => ({
      storedKey: row.stored_key === null ? null : String(row.stored_key),
      rowCount: String(row.row_count),
    }))
    .sort((left, right) => {
      if (left.storedKey === null) return right.storedKey === null ? 0 : -1;
      if (right.storedKey === null) return 1;
      return left.storedKey < right.storedKey
        ? -1
        : left.storedKey > right.storedKey
          ? 1
          : 0;
    });
}

async function inspectTarget(client, target) {
  const relation = `${target.schema}.${target.table}`;
  const catalog = await client.query(
    `WITH target_relation AS (
       SELECT to_regclass($1) AS oid
     )
     SELECT target_relation.oid::regclass::text AS relation_name,
            relation.relkind::text AS relation_kind,
            EXISTS (
              SELECT 1
                FROM pg_catalog.pg_attribute attribute
               WHERE attribute.attrelid = target_relation.oid
                 AND attribute.attname = $2
                 AND attribute.attnum > 0
                 AND NOT attribute.attisdropped
            ) AS column_present
       FROM target_relation
       LEFT JOIN pg_catalog.pg_class relation
         ON relation.oid = target_relation.oid`,
    [relation, target.column],
  );
  const row = catalog.rows[0] ?? {};
  const base = { location: location(target), required: target.required };

  if (!row.relation_name) return { ...base, status: "absent_relation" };
  if (!Object.hasOwn(RELATION_KIND, row.relation_kind)) {
    return {
      ...base,
      status: "unsupported_relation_kind",
      relationKind: row.relation_kind ?? null,
    };
  }
  if (!row.column_present) {
    return {
      ...base,
      status: "absent_column",
      relationKind: RELATION_KIND[row.relation_kind],
    };
  }

  const schema = quoteIdentifier(target.schema);
  const table = quoteIdentifier(target.table);
  const column = quoteIdentifier(target.column);
  const values = await client.query(
    `SELECT ${column}::text AS stored_key,
            count(*)::bigint::text AS row_count
       FROM ${schema}.${table}
      GROUP BY ${column}
      ORDER BY ${column} NULLS FIRST`,
  );

  return {
    ...base,
    status: "present",
    relationKind: RELATION_KIND[row.relation_kind],
    values: sortValues(values.rows),
  };
}

function report({ status, transactionReadOnly, rolledBack, targets }) {
  return {
    schemaVersion: 1,
    diagnostic: "source_tenant_key_vocabulary",
    status,
    transaction: {
      requestedMode: "read_only",
      transactionReadOnly,
      rolledBack,
    },
    targets,
  };
}

export async function readTenantKeyVocabulary(client) {
  let transactionStarted = false;
  let transactionReadOnly = null;
  let rolledBack = false;
  let primaryError = null;
  let rollbackError = null;
  const targets = [];

  try {
    await client.query("BEGIN READ ONLY");
    transactionStarted = true;

    const state = await client.query("SHOW transaction_read_only");
    transactionReadOnly = String(
      state.rows[0]?.transaction_read_only ?? "",
    ).toLowerCase();
    if (transactionReadOnly !== "on") {
      throw fail(
        `read_only_transaction_not_active:${transactionReadOnly || "unknown"}`,
      );
    }

    for (const target of TENANT_KEY_TARGETS) {
      const inspected = await inspectTarget(client, target);
      targets.push(inspected);
      if (target.required && inspected.status !== "present") {
        throw fail(
          `required_target_unavailable:${inspected.location}:${inspected.status}`,
        );
      }
    }
  } catch (error) {
    primaryError = error instanceof Error ? error : fail(String(error));
  } finally {
    if (transactionStarted) {
      try {
        await client.query("ROLLBACK");
        rolledBack = true;
      } catch (error) {
        rollbackError = error instanceof Error ? error : fail(String(error));
      }
    }
  }

  if (rollbackError) {
    throw fail(
      `rollback_failed:${rollbackError.message}`,
      report({ status: "failed", transactionReadOnly, rolledBack, targets }),
    );
  }
  if (primaryError) {
    primaryError.report = report({
      status: "failed",
      transactionReadOnly,
      rolledBack,
      targets,
    });
    throw primaryError;
  }

  return report({
    status: "complete",
    transactionReadOnly,
    rolledBack,
    targets,
  });
}

export async function main({
  databaseUrl = process.env.DATABASE_URL,
  stdout = process.stdout,
  stderr = process.stderr,
} = {}) {
  if (!databaseUrl?.trim()) {
    stderr.write("source-tenant-key-readback: DATABASE_URL is required\n");
    return 2;
  }

  const { default: pg } = await import("pg");
  const client = new pg.Client(databaseClientOptions(databaseUrl));

  try {
    await client.connect();
    const result = await readTenantKeyVocabulary(client);
    stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return 0;
  } catch (error) {
    if (error?.report)
      stdout.write(`${JSON.stringify(error.report, null, 2)}\n`);
    stderr.write(
      `source-tenant-key-readback: ${error instanceof Error ? error.message : String(error)}\n`,
    );
    return 1;
  } finally {
    await client.end().catch(() => undefined);
  }
}

const invokedAsScript =
  Boolean(process.argv[1]) &&
  pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;

if (invokedAsScript) {
  main().then((code) => {
    process.exitCode = code;
  });
}
