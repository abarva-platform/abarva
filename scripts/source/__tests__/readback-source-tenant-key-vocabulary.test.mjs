import assert from "node:assert/strict";
import { test } from "node:test";

import {
  databaseClientOptions,
  readTenantKeyVocabulary,
  TENANT_KEY_TARGETS,
} from "../readback-source-tenant-key-vocabulary.mjs";

const descriptions = {
  "public.clients": {
    relationName: "clients",
    relationKind: "r",
    columnPresent: true,
  },
  "public.source_events": {
    relationName: "source_events",
    relationKind: "r",
    columnPresent: true,
  },
  "public.source_artifact_generation_jobs": {
    relationName: null,
    relationKind: null,
    columnPresent: false,
  },
  "public.source_event_activity": {
    relationName: "source_event_activity",
    relationKind: "r",
    columnPresent: false,
  },
  "public.source_event_participants": {
    relationName: "source_event_participants",
    relationKind: "p",
    columnPresent: true,
  },
};

const storedValues = {
  "public.clients": [
    { stored_key: "tenant-z", row_count: "2" },
    { stored_key: null, row_count: "1" },
    { stored_key: "tenant-a", row_count: "3" },
  ],
  "public.source_events": [{ stored_key: "tenant-a", row_count: "4" }],
  "public.source_event_participants": [
    { stored_key: "tenant-z", row_count: "5" },
  ],
};

function fakeClient({
  readOnly = "on",
  overrides = {},
  valueQueryFailure = null,
  rollbackFailure = false,
} = {}) {
  const calls = [];
  return {
    calls,
    async query(sql, values = []) {
      calls.push({ sql, values });
      if (sql === "BEGIN READ ONLY") return { rows: [] };
      if (sql === "SHOW transaction_read_only") {
        return { rows: [{ transaction_read_only: readOnly }] };
      }
      if (sql === "ROLLBACK") {
        if (rollbackFailure) throw new Error("rollback unavailable");
        return { rows: [] };
      }
      if (sql.includes("WITH target_relation")) {
        const description = overrides[values[0]] ?? descriptions[values[0]];
        return {
          rows: [
            {
              relation_name: description?.relationName ?? null,
              relation_kind: description?.relationKind ?? null,
              column_present: description?.columnPresent ?? false,
            },
          ],
        };
      }

      const relation = Object.keys(storedValues).find((candidate) => {
        const [schema, table] = candidate.split(".");
        return sql.includes(`FROM "${schema}"."${table}"`);
      });
      if (relation === valueQueryFailure)
        throw new Error("fixture read failed");
      if (relation) return { rows: storedValues[relation] };
      throw new Error(`unexpected query: ${sql}`);
    },
  };
}

test("enumerates exact stored keys in one read-only transaction and always rolls back", async () => {
  const client = fakeClient();
  const result = await readTenantKeyVocabulary(client);

  assert.equal(client.calls[0].sql, "BEGIN READ ONLY");
  assert.equal(client.calls[1].sql, "SHOW transaction_read_only");
  assert.equal(client.calls.at(-1).sql, "ROLLBACK");
  assert.equal(
    client.calls.some(({ sql }) => sql === "COMMIT"),
    false,
  );
  assert.equal(result.status, "complete");
  assert.deepEqual(result.transaction, {
    requestedMode: "read_only",
    transactionReadOnly: "on",
    rolledBack: true,
  });
  assert.deepEqual(result.targets[0].values, [
    { storedKey: null, rowCount: "1" },
    { storedKey: "tenant-a", rowCount: "3" },
    { storedKey: "tenant-z", rowCount: "2" },
  ]);
  assert.deepEqual(
    result.targets.map(({ location, status }) => ({ location, status })),
    [
      { location: "public.clients.tenant_key", status: "present" },
      { location: "public.source_events.client_key", status: "present" },
      {
        location: "public.source_artifact_generation_jobs.client_key",
        status: "absent_relation",
      },
      {
        location: "public.source_event_activity.client_key",
        status: "absent_column",
      },
      {
        location: "public.source_event_participants.client_key",
        status: "present",
      },
    ],
  );
  assert.equal(result.targets[4].relationKind, "partitioned_table");
  assert.equal(
    client.calls.filter(({ sql }) => sql.includes("WITH target_relation"))
      .length,
    5,
  );
  assert.equal(
    client.calls.filter(({ sql }) => sql.includes("GROUP BY")).length,
    3,
  );
  assert.ok(
    client.calls.every(
      ({ sql }) =>
        !/^\s*(INSERT|UPDATE|DELETE|ALTER|CREATE|DROP|COMMIT)\b/i.test(sql),
    ),
  );
});

test("fails closed before catalog reads when PostgreSQL does not confirm read-only state", async () => {
  const client = fakeClient({ readOnly: "off" });
  await assert.rejects(readTenantKeyVocabulary(client), (error) => {
    assert.match(error.message, /read_only_transaction_not_active:off/);
    assert.equal(error.report.transaction.rolledBack, true);
    assert.deepEqual(error.report.targets, []);
    return true;
  });
  assert.deepEqual(
    client.calls.map(({ sql }) => sql),
    ["BEGIN READ ONLY", "SHOW transaction_read_only", "ROLLBACK"],
  );
});

test("fails closed when the required clients tenant-key anchor is unavailable", async () => {
  const client = fakeClient({
    overrides: {
      "public.clients": {
        relationName: "clients",
        relationKind: "r",
        columnPresent: false,
      },
    },
  });
  await assert.rejects(readTenantKeyVocabulary(client), (error) => {
    assert.match(
      error.message,
      /required_target_unavailable:public\.clients\.tenant_key:absent_column/,
    );
    assert.equal(error.report.targets[0].status, "absent_column");
    assert.equal(error.report.transaction.rolledBack, true);
    return true;
  });
  assert.equal(client.calls.at(-1).sql, "ROLLBACK");
});

test("rolls back and emits no successful report when a value read fails", async () => {
  const client = fakeClient({ valueQueryFailure: "public.source_events" });
  await assert.rejects(readTenantKeyVocabulary(client), (error) => {
    assert.match(error.message, /fixture read failed/);
    assert.equal(error.report.status, "failed");
    assert.equal(error.report.transaction.rolledBack, true);
    return true;
  });
  assert.equal(client.calls.at(-1).sql, "ROLLBACK");
});

test("treats rollback failure as a failed diagnostic", async () => {
  const client = fakeClient({ rollbackFailure: true });
  await assert.rejects(readTenantKeyVocabulary(client), (error) => {
    assert.match(error.message, /rollback_failed:rollback unavailable/);
    assert.equal(error.report.transaction.rolledBack, false);
    return true;
  });
});

test("keeps the diagnostic target list fixed and marks Source targets optional", () => {
  assert.deepEqual(
    TENANT_KEY_TARGETS.map(({ table, required }) => ({ table, required })),
    [
      { table: "clients", required: true },
      { table: "source_events", required: false },
      { table: "source_artifact_generation_jobs", required: false },
      { table: "source_event_activity", required: false },
      { table: "source_event_participants", required: false },
    ],
  );
});

test("honors connection-string TLS policy without weakening certificate checks", () => {
  const connectionString =
    "postgresql://reader:secret@database.example.test/app?sslmode=verify-full";

  assert.deepEqual(databaseClientOptions(connectionString), {
    connectionString,
  });
});
