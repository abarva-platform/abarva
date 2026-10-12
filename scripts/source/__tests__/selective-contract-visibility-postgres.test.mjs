import assert from "node:assert/strict";
import { test } from "node:test";
import pg from "pg";
import {
  runSelectiveVisibilityTransaction,
  selectiveVisibilityHash,
} from "../selective-contract-visibility-transaction.mjs";

test("existing-row visibility transaction and conditional restore", async (t) => {
  const uri = process.env.SOURCE_VISIBILITY_TEST_DATABASE_URL;
  assert.ok(
    uri,
    "Disposable Postgres is required; this suite cannot silently skip",
  );
  const fixtureUrl = new URL(uri);
  assert.ok(
    ["127.0.0.1", "localhost"].includes(fixtureUrl.hostname) &&
      fixtureUrl.pathname === "/origin_repair_fixture",
    "Destructive fixtures are limited to the named disposable localhost database",
  );
  const db = new pg.Client({ connectionString: uri });
  await db.connect();
  const tenant = "fixture-tenant";
  let plan;
  let applied;
  const snapshot = async () => {
    const result = {};
    for (const table of [
      "contract",
      "contract_scope",
      "observation",
      "l4_cube_active_load_run",
      "l4_cube_active_load_run_overlay",
    ])
      result[table] = (
        await db.query(
          `SELECT to_jsonb(t) AS row FROM source.${table} t ORDER BY to_jsonb(t)::text`,
        )
      ).rows.map((r) => r.row);
    return result;
  };
  const seed = async () => {
    await db.query(`DROP SCHEMA IF EXISTS source CASCADE; CREATE SCHEMA source;
      CREATE FUNCTION source.can_read_sourcing_tenant(t text) RETURNS boolean LANGUAGE sql AS 'SELECT t = current_setting(''app.tenant_key'',true)';
      CREATE TABLE source.contract(id text PRIMARY KEY,tenant_key text NOT NULL,contract_id text NOT NULL,load_run_id text NOT NULL,auto_renew boolean,annual_value numeric,raw_payload jsonb);
      CREATE TABLE source.contract_scope(id text PRIMARY KEY,tenant_key text NOT NULL,contract_id text NOT NULL,contract_scope_id text NOT NULL,scope_type text,scope_ref text,load_run_id text NOT NULL,service_id text,raw_payload jsonb);
      CREATE TABLE source.observation(tenant_key text,contract_id text,load_run_id text,amount numeric);
      CREATE TABLE source.l4_cube_active_load_run(tenant_key text PRIMARY KEY,load_run_id text);
      CREATE TABLE source.l4_cube_active_load_run_overlay(tenant_key text NOT NULL,load_run_id text NOT NULL,dataset_version text NOT NULL,input_source_version text NOT NULL,idempotency_key text NOT NULL,overlay_role text NOT NULL,activated_at timestamptz NOT NULL DEFAULT now(),raw_payload jsonb NOT NULL DEFAULT '{}',PRIMARY KEY(tenant_key,load_run_id,dataset_version));
      CREATE VIEW source.contract_360 AS SELECT c.* FROM source.contract c JOIN source.l4_cube_active_load_run_overlay o ON o.tenant_key=c.tenant_key AND o.load_run_id=c.load_run_id WHERE source.can_read_sourcing_tenant(c.tenant_key);
      CREATE VIEW source.contract_application_scope AS SELECT s.tenant_key,s.contract_id,s.scope_ref AS application_ref,s.load_run_id FROM source.contract_scope s JOIN source.contract_360 c ON c.tenant_key=s.tenant_key AND c.contract_id=s.contract_id AND c.load_run_id=s.load_run_id;
      INSERT INTO source.contract VALUES('contract-uuid','fixture-tenant','CONTRACT-fixture','old-run',false,100,'{"original":"retained"}'),('other-uuid','other-tenant','CONTRACT-fixture','old-run',true,200,'{}');
      INSERT INTO source.contract_scope VALUES('scope-uuid','fixture-tenant','CONTRACT-fixture','SCOPE-fixture','application','APP-fixture','old-run',NULL,'{}');
      INSERT INTO source.observation VALUES('fixture-tenant','CONTRACT-fixture','old-run',5);
      INSERT INTO source.l4_cube_active_load_run VALUES('fixture-tenant','base-run'),('other-tenant','other-run');
      INSERT INTO source.l4_cube_active_load_run_overlay(tenant_key,load_run_id,dataset_version,input_source_version,idempotency_key,overlay_role) VALUES('fixture-tenant','existing-run','existing-version','existing-input','existing-key','existing');`);
    const before = await snapshot();
    plan = {
      contractVersion: "source-selective-visibility-review-plan/v1",
      executionEnabled: false,
      tenantKey: tenant,
      contractId: "CONTRACT-fixture",
      sourceProofSha256: "a".repeat(64),
      targets: [
        {
          table: "source.contract",
          key: { tenant_key: tenant, contract_id: "CONTRACT-fixture" },
          before: before.contract.find((r) => r.tenant_key === tenant),
        },
        {
          table: "source.contract_scope",
          key: { tenant_key: tenant, contract_scope_id: "SCOPE-fixture" },
          before: before.contract_scope[0],
        },
      ],
      selectorBaseline: {
        base: before.l4_cube_active_load_run.filter(
          (r) => r.tenant_key === tenant,
        ),
        overlays: before.l4_cube_active_load_run_overlay,
      },
      overlay: {
        tenant_key: tenant,
        load_run_id: "new-run",
        dataset_version: "new-version",
        input_source_version: "a".repeat(64),
        idempotency_key: "fixture-repair",
        overlay_role: "selective_canonical_visibility",
        raw_payload: {},
      },
    };
    for (const target of plan.targets) {
      target.allowedColumns = ["load_run_id"];
      target.beforeSha256 = selectiveVisibilityHash(target.before);
      target.after = {
        ...target.before,
        load_run_id: plan.overlay.load_run_id,
      };
    }
    plan.selectorBaselineSha256 = selectiveVisibilityHash(
      plan.selectorBaseline,
    );
  };
  const execute = (
    mode = "apply",
    save = async (p) => ({
      uri: "private://immutable-proof",
      sha256: selectiveVisibilityHash(p),
    }),
  ) =>
    runSelectiveVisibilityTransaction(
      db,
      {
        plan,
        mode,
        applied,
        runId: "fixture-repair-run",
        planSha256: selectiveVisibilityHash(plan),
      },
      save,
    );
  const auditedFixture = async () => {
    await seed();
    await db.query(`ALTER TABLE source.contract ADD COLUMN updated_at timestamptz NOT NULL DEFAULT '2026-01-01T00:00:00Z';
      ALTER TABLE source.contract_scope ADD COLUMN updated_at timestamptz NOT NULL DEFAULT '2026-01-01T00:00:00Z';
      CREATE FUNCTION source.touch_updated_at() RETURNS trigger LANGUAGE plpgsql AS 'BEGIN NEW.updated_at=now(); RETURN NEW; END';
      CREATE TRIGGER source_contract_touch_updated_at BEFORE UPDATE ON source.contract FOR EACH ROW EXECUTE FUNCTION source.touch_updated_at();
      CREATE TRIGGER source_contract_scope_touch_updated_at BEFORE UPDATE ON source.contract_scope FOR EACH ROW EXECUTE FUNCTION source.touch_updated_at();`);
    const before = await snapshot();
    for (const [i, t] of plan.targets.entries()) {
      t.before =
        i === 0
          ? before.contract.find((r) => r.tenant_key === tenant)
          : before.contract_scope[0];
      t.beforeSha256 = selectiveVisibilityHash(t.before);
      t.after = { ...t.before, load_run_id: plan.overlay.load_run_id };
    }
    return before;
  };
  try {
    await t.test("preflight performs no writes", async () => {
      await seed();
      const before = await snapshot();
      const result = await execute("preflight");
      assert.equal(result.committed, false);
      assert.equal(result.transactionReadOnly, "on");
      assert.deepEqual(await snapshot(), before);
    });
    await t.test(
      "two lineage references plus one overlay; restore preserves every business field",
      async () => {
        await seed();
        const before = await snapshot();
        const saved = [];
        applied = await execute("apply", async (p) => {
          if (p.stage === "before_first_write")
            assert.deepEqual(await snapshot(), before);
          saved.push(p);
          return {
            uri: "private://immutable-proof",
            sha256: selectiveVisibilityHash(p),
          };
        });
        assert.equal(applied.committed, true);
        assert.equal(applied.updatedRows, 2);
        assert.equal(applied.overlayRows, 1);
        assert.equal(saved[0].stage, "before_first_write");
        assert.equal(saved[1].stage, "before_commit");
        assert.equal(applied.selectedContract.length, 1);
        assert.equal(applied.selectedScope[0].application_ref, "APP-fixture");
        const after = await snapshot();
        assert.deepEqual(after.observation, before.observation);
        assert.deepEqual(
          after.l4_cube_active_load_run,
          before.l4_cube_active_load_run,
        );
        assert.equal(
          after.contract.find((r) => r.tenant_key === tenant).auto_renew,
          false,
        );
        const restored = await execute("restore");
        assert.equal(restored.committed, true);
        assert.deepEqual(await snapshot(), before);
      },
    );
    await t.test("cannot replay a committed apply", async () => {
      await seed();
      await execute();
      const before = await snapshot();
      await assert.rejects(execute(), /before-image|collision/);
      assert.deepEqual(await snapshot(), before);
    });
    await t.test("stale full before-image refuses before writing", async () => {
      await seed();
      await db.query(
        "UPDATE source.contract SET annual_value=101 WHERE id='contract-uuid'",
      );
      const before = await snapshot();
      await assert.rejects(execute(), /before-image/);
      assert.deepEqual(await snapshot(), before);
    });
    await t.test("selector drift refuses", async () => {
      await seed();
      await db.query(
        "UPDATE source.l4_cube_active_load_run SET load_run_id='changed-base' WHERE tenant_key=$1",
        [tenant],
      );
      const before = await snapshot();
      await assert.rejects(execute(), /selector/);
      assert.deepEqual(await snapshot(), before);
    });
    await t.test(
      "new run present in a different canonical table refuses",
      async () => {
        await seed();
        await db.query(
          "INSERT INTO source.observation VALUES($1,'OTHER','new-run',1)",
          [tenant],
        );
        const before = await snapshot();
        await assert.rejects(execute(), /collision/);
        assert.deepEqual(await snapshot(), before);
      },
    );
    await t.test("failed immutable backup writes nothing", async () => {
      await seed();
      const before = await snapshot();
      await assert.rejects(
        execute("apply", async () => {
          throw new Error("Blob backup unavailable");
        }),
        /backup unavailable/,
      );
      assert.deepEqual(await snapshot(), before);
    });
    await t.test("bad backup acknowledgement writes nothing", async () => {
      await seed();
      const before = await snapshot();
      await assert.rejects(
        execute("apply", async () => ({
          uri: "private://proof",
          sha256: "b".repeat(64),
        })),
        /Immutable proof/,
      );
      assert.deepEqual(await snapshot(), before);
    });
    await t.test("unreviewed business column in plan refuses", async () => {
      await seed();
      plan.targets[0].after.auto_renew = true;
      const before = await snapshot();
      await assert.rejects(execute(), /lineage-only/);
      assert.deepEqual(await snapshot(), before);
    });
    await t.test("trigger mutation is rolled back", async () => {
      await seed();
      await db.query(
        `CREATE FUNCTION source.bad_trigger() RETURNS trigger LANGUAGE plpgsql AS 'BEGIN NEW.auto_renew=true; RETURN NEW; END'; CREATE TRIGGER bad BEFORE UPDATE ON source.contract FOR EACH ROW EXECUTE FUNCTION source.bad_trigger()`,
      );
      const before = await snapshot();
      await assert.rejects(execute(), /after-image/);
      assert.deepEqual(await snapshot(), before);
    });
    await t.test("collateral trigger write is rolled back", async () => {
      await seed();
      await db.query(
        `CREATE FUNCTION source.collateral() RETURNS trigger LANGUAGE plpgsql AS 'BEGIN UPDATE source.observation SET amount=999; RETURN NEW; END'; CREATE TRIGGER collateral AFTER UPDATE ON source.contract FOR EACH ROW EXECUTE FUNCTION source.collateral()`,
      );
      const before = await snapshot();
      await assert.rejects(execute(), /Collateral/);
      assert.deepEqual(await snapshot(), before);
    });
    await t.test("missing selected view readback rolls back", async () => {
      await seed();
      await db.query(
        "CREATE OR REPLACE VIEW source.contract_360 AS SELECT c.* FROM source.contract c WHERE false",
      );
      const before = await snapshot();
      await assert.rejects(execute(), /selected contract/);
      assert.deepEqual(await snapshot(), before);
    });
    await t.test("restore refuses a newer business edit", async () => {
      await seed();
      applied = await execute();
      await db.query(
        "UPDATE source.contract SET annual_value=111 WHERE id='contract-uuid'",
      );
      const before = await snapshot();
      await assert.rejects(execute("restore"), /after-image/);
      assert.deepEqual(await snapshot(), before);
    });
    await t.test("restore refuses a changed owned overlay", async () => {
      await seed();
      applied = await execute();
      await db.query(
        "UPDATE source.l4_cube_active_load_run_overlay SET raw_payload='{\"newer\":true}' WHERE load_run_id='new-run'",
      );
      const before = await snapshot();
      await assert.rejects(execute("restore"), /overlay/);
      assert.deepEqual(await snapshot(), before);
    });
    await t.test(
      "postcommit proof failure is reported as committed, not rolled back",
      async () => {
        await seed();
        let n = 0;
        const result = await execute("apply", async (p) => {
          if (++n === 3) throw new Error("final proof unavailable");
          return {
            uri: "private://immutable-proof",
            sha256: selectiveVisibilityHash(p),
          };
        });
        assert.equal(result.committed, true);
        assert.match(result.postCommitProofError, /final proof unavailable/);
        assert.equal(
          (await snapshot()).contract.find((r) => r.tenant_key === tenant)
            .load_run_id,
          "new-run",
        );
      },
    );
    await t.test("restore refuses unrelated selector changes", async () => {
      await seed();
      applied = await execute();
      await db.query(
        "UPDATE source.l4_cube_active_load_run_overlay SET dataset_version='newer-existing-version' WHERE load_run_id='existing-run'",
      );
      const before = await snapshot();
      await assert.rejects(execute("restore"), /selector drift/);
      assert.deepEqual(await snapshot(), before);
    });
    await t.test(
      "failed precommit proof rolls back both updates and overlay",
      async () => {
        await seed();
        const before = await snapshot();
        let n = 0;
        await assert.rejects(
          execute("apply", async (p) => {
            if (++n === 2) throw new Error("precommit proof unavailable");
            return {
              uri: "private://proof",
              sha256: selectiveVisibilityHash(p),
            };
          }),
          /precommit proof unavailable/,
        );
        assert.deepEqual(await snapshot(), before);
      },
    );
    await t.test("missing application readback rolls back", async () => {
      await seed();
      await db.query(
        "CREATE OR REPLACE VIEW source.contract_application_scope AS SELECT s.tenant_key,s.contract_id,s.scope_ref AS application_ref,s.load_run_id FROM source.contract_scope s WHERE false",
      );
      const before = await snapshot();
      await assert.rejects(execute(), /application scope/);
      assert.deepEqual(await snapshot(), before);
    });
    await t.test("unrelated access control must be false", async () => {
      await seed();
      await db.query(
        "CREATE OR REPLACE FUNCTION source.can_read_sourcing_tenant(t text) RETURNS boolean LANGUAGE sql AS 'SELECT true'",
      );
      const before = await snapshot();
      await assert.rejects(execute(), /tenant access/);
      assert.deepEqual(await snapshot(), before);
    });
    await t.test("wrong sealed plan hash refuses", async () => {
      await seed();
      const before = await snapshot();
      await assert.rejects(
        runSelectiveVisibilityTransaction(
          db,
          { plan, mode: "apply", runId: "fixture", planSha256: "b".repeat(64) },
          async () => {},
        ),
        /plan hash/,
      );
      assert.deepEqual(await snapshot(), before);
    });
    await t.test(
      "canonical audit timestamp triggers currently refuse instead of silently widening the plan",
      async () => {
        const before = await auditedFixture();
        await assert.rejects(execute(), /after-image/);
        assert.deepEqual(await snapshot(), before);
      },
    );
    await t.test(
      "explicit audit policy supports canonical triggers and conditional business restore",
      async () => {
        const before = await auditedFixture();
        plan.auditTimestampPolicy = "database_transaction_timestamp";
        for (const t of plan.targets)
          t.allowedColumns = ["load_run_id", "updated_at"];
        applied = await execute();
        assert.equal(applied.committed, true);
        assert.ok(
          applied.afterRows.every(
            (r) => r.updated_at === applied.transactionTimestamp,
          ),
        );
        assert.equal(applied.afterRows[0].auto_renew, false);
        assert.equal(applied.afterRows[0].annual_value, 100);
        const restored = await execute("restore");
        assert.equal(restored.committed, true);
        assert.ok(
          restored.afterRows.every(
            (r) => r.updated_at === restored.transactionTimestamp,
          ),
        );
        const after = await snapshot();
        const strip = (row) => {
          const rest = { ...row };
          delete rest.updated_at;
          return rest;
        };
        assert.deepEqual(after.contract.map(strip), before.contract.map(strip));
        assert.deepEqual(
          after.contract_scope.map(strip),
          before.contract_scope.map(strip),
        );
        assert.deepEqual(after.observation, before.observation);
        assert.deepEqual(
          after.l4_cube_active_load_run_overlay,
          before.l4_cube_active_load_run_overlay,
        );
      },
    );
    await t.test(
      "audit policy never permits a business-field trigger change",
      async () => {
        const before = await auditedFixture();
        plan.auditTimestampPolicy = "database_transaction_timestamp";
        for (const t of plan.targets)
          t.allowedColumns = ["load_run_id", "updated_at"];
        await db.query(
          `CREATE FUNCTION source.bad_trigger() RETURNS trigger LANGUAGE plpgsql AS 'BEGIN NEW.auto_renew=true; RETURN NEW; END'; CREATE TRIGGER bad BEFORE UPDATE ON source.contract FOR EACH ROW EXECUTE FUNCTION source.bad_trigger()`,
        );
        await assert.rejects(execute(), /after-image/);
        assert.deepEqual(await snapshot(), before);
      },
    );
    await t.test(
      "audit-policy restore refuses even timestamp-only after-image drift",
      async () => {
        await auditedFixture();
        plan.auditTimestampPolicy = "database_transaction_timestamp";
        for (const t of plan.targets)
          t.allowedColumns = ["load_run_id", "updated_at"];
        applied = await execute();
        await db.query(
          "UPDATE source.contract SET updated_at=now() WHERE id='contract-uuid'",
        );
        const before = await snapshot();
        await assert.rejects(execute("restore"), /after-image/);
        assert.deepEqual(await snapshot(), before);
      },
    );
    await t.test(
      "audit policy refuses an arbitrary trigger-generated timestamp",
      async () => {
        const before = await auditedFixture();
        plan.auditTimestampPolicy = "database_transaction_timestamp";
        for (const target of plan.targets)
          target.allowedColumns = ["load_run_id", "updated_at"];
        await db.query(
          "CREATE OR REPLACE FUNCTION source.touch_updated_at() RETURNS trigger LANGUAGE plpgsql AS 'BEGIN NEW.updated_at=now()+interval ''1 hour''; RETURN NEW; END'",
        );
        await assert.rejects(execute(), /after-image/);
        assert.deepEqual(await snapshot(), before);
      },
    );
    await t.test(
      "apply holds the target write lock before the first immutable backup",
      async () => {
        await seed();
        const other = new pg.Client({ connectionString: uri });
        await other.connect();
        try {
          await other.query("SET lock_timeout='100ms'");
          const result = await execute("apply", async (p) => {
            if (p.stage === "before_first_write")
              await assert.rejects(
                other.query(
                  "UPDATE source.contract SET annual_value=999 WHERE id='contract-uuid'",
                ),
                (e) => e.code === "55P03",
              );
            return {
              uri: "private://immutable-proof",
              sha256: selectiveVisibilityHash(p),
            };
          });
          assert.equal(result.committed, true);
          assert.equal(result.afterRows[0].annual_value, 100);
        } finally {
          await other.end();
        }
      },
    );
    await t.test(
      "lost COMMIT acknowledgement is unknown even when Postgres committed",
      async () => {
        await seed();
        const query = db.query.bind(db);
        let rollbackCalls = 0;
        const saved = [];
        const transport = {
          query: async (sql, params) => {
            if (sql === "COMMIT") {
              await query(sql, params);
              const error = new Error("Simulated lost COMMIT acknowledgement");
              error.code = "ECONNRESET";
              throw error;
            }
            if (sql === "ROLLBACK") rollbackCalls++;
            return query(sql, params);
          },
        };
        let failure;
        await assert.rejects(
          runSelectiveVisibilityTransaction(
            transport,
            {
              plan,
              mode: "apply",
              runId: "lost-ack-fixture",
              planSha256: selectiveVisibilityHash(plan),
            },
            async (p) => {
              saved.push(p);
              return {
                uri: "private://immutable-proof",
                sha256: selectiveVisibilityHash(p),
              };
            },
          ),
          (error) => {
            failure = error.visibilityProof;
            assert.equal(failure.committed, null);
            assert.equal(failure.commitAttempted, true);
            assert.equal(failure.commitOutcome, "unknown");
            assert.equal(failure.recoveryRequired, true);
            assert.equal(failure.retryAllowed, false);
            return true;
          },
        );
        assert.equal(rollbackCalls, 0);
        assert.equal(
          (await snapshot()).contract.find((r) => r.tenant_key === tenant)
            .load_run_id,
          "new-run",
        );
        assert.equal(saved.at(-1).stage, "commit_outcome_unknown");
        assert.equal(failure.attemptedRows, 2);
        assert.equal(failure.updatedRows, null);
        const reader = new pg.Client({ connectionString: uri });
        await reader.connect();
        try {
          await reader.query("BEGIN READ ONLY");
          const recovered = (
            await reader.query(
              "SELECT to_jsonb(t) AS row FROM source.contract t WHERE tenant_key=$1 AND id='contract-uuid'",
              [tenant],
            )
          ).rows[0].row;
          assert.deepEqual(recovered, failure.afterRows[0]);
          await reader.query("ROLLBACK");
        } finally {
          await reader.end();
        }
        assert.equal(failure.committed, null);
      },
    );
    await t.test(
      "unknown COMMIT cannot be inferred committed when its request never reached Postgres",
      async () => {
        await seed();
        const before = await snapshot();
        const connection = new pg.Client({ connectionString: uri });
        await connection.connect();
        let rollbackCalls = 0;
        const transport = {
          query: async (sql, params) => {
            if (sql === "COMMIT") {
              await connection.end();
              const error = new Error("Lost transport before COMMIT delivery");
              error.code = "ECONNRESET";
              throw error;
            }
            if (sql === "ROLLBACK") rollbackCalls++;
            return connection.query(sql, params);
          },
        };
        await assert.rejects(
          runSelectiveVisibilityTransaction(
            transport,
            {
              plan,
              mode: "apply",
              runId: "undelivered-commit-fixture",
              planSha256: selectiveVisibilityHash(plan),
            },
            async (p) => ({
              uri: "private://proof",
              sha256: selectiveVisibilityHash(p),
            }),
          ),
          (error) =>
            error.visibilityProof.committed === null &&
            error.visibilityProof.commitOutcome === "unknown" &&
            error.visibilityProof.recoveryRequired === true,
        );
        assert.equal(rollbackCalls, 0);
        assert.deepEqual(await snapshot(), before);
      },
    );
  } finally {
    await db.query("DROP SCHEMA IF EXISTS source CASCADE");
    await db.end();
  }
});
