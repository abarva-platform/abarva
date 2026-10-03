import assert from "node:assert/strict";
import pg from "pg";
import {
  assertWorkflowTriggersCover,
  disposableDatabaseUrl,
} from "./synthetic_enterprise_gate_fixtures";

/**
 * What the Home declarations migration promises, checked against the
 * disposable admission database once the workflow has applied the migration:
 * one active declaration per tenant, a retirement time exactly when a
 * declaration is retired, row security on, and a read policy that shows a
 * tenant its own declarations.
 *
 * Every statement runs in one transaction that is rolled back, so the table is
 * left as it was found.
 */

const table = "ecl_projection.home_active_assessment";
const tenantA = "fixture-tenant-a";
const tenantB = "fixture-tenant-b";
const reader = "ecl_declaration_reader_fixture";

async function main(): Promise<void> {
  const db = new pg.Client({ connectionString: disposableDatabaseUrl() });
  await db.connect();
  let checks = 0;
  try {
    const manifests = await db.query<{ id: string }>(
      "select id::text from ecl_projection.projection_manifest order by id limit 1",
    );
    assert.equal(
      manifests.rows.length,
      1,
      "the projection test must have written a projection manifest first",
    );
    const manifestId = manifests.rows[0].id;
    const before = await db.query(`select * from ${table} order by 1, 2`);

    await db.query("begin");
    const insert = (
      tenant: string,
      assessment: string,
      state: string,
      retiredAt: string | null,
      manifest = manifestId,
    ) =>
      db.query(
        `insert into ${table}
           (tenant_key, assessment_id, projection_manifest_id, source_set_hash,
            projection_hash, projection_proof_uri, state, retired_at)
         values ($1, $2, $3, 'fixture-source-set', 'fixture-projection',
            'https://fixture.invalid/proof.json', $4, $5::timestamptz)
         returning activated_at`,
        [tenant, assessment, manifest, state, retiredAt],
      );
    /** The statement is refused with this SQLSTATE and, when named, this constraint. */
    const refused = async (
      work: () => Promise<unknown>,
      code: string,
      constraint?: string,
    ) => {
      await db.query("savepoint attempt");
      await assert.rejects(
        work,
        (error: { code?: string; constraint?: string }) => {
          assert.equal(error.code, code);
          if (constraint) assert.equal(error.constraint, constraint);
          return true;
        },
      );
      await db.query("rollback to savepoint attempt");
      checks += 1;
    };

    // A declaration is active from the moment it is written, and not retired.
    const first = await insert(tenantA, "assessment-1", "active", null);
    assert.ok(first.rows[0].activated_at instanceof Date);
    checks += 1;

    // One active declaration per tenant.
    await refused(
      () => insert(tenantA, "assessment-2", "active", null),
      "23505",
      "home_active_assessment_one_active",
    );
    // Retired declarations do not count towards it, and other tenants have their own.
    await insert(tenantA, "assessment-2", "retired", "2026-01-01T00:00:00Z");
    await insert(tenantA, "assessment-3", "retired", "2026-01-02T00:00:00Z");
    await insert(tenantB, "assessment-1", "active", null);
    await refused(
      () =>
        db.query(
          `update ${table} set state = 'active', retired_at = null
           where tenant_key = $1 and assessment_id = 'assessment-2'`,
          [tenantA],
        ),
      "23505",
      "home_active_assessment_one_active",
    );
    // One declaration per tenant and assessment.
    await refused(
      () => insert(tenantA, "assessment-2", "retired", "2026-01-03T00:00:00Z"),
      "23505",
      "home_active_assessment_pkey",
    );

    // A retirement time exactly when the declaration is retired.
    await refused(
      () => insert(tenantA, "assessment-4", "retired", null),
      "23514",
      "home_active_assessment_retired_at_check",
    );
    await refused(
      () => insert(tenantB, "assessment-4", "active", "2026-01-01T00:00:00Z"),
      "23514",
      "home_active_assessment_retired_at_check",
    );
    await refused(
      () =>
        db.query(
          `update ${table} set state = 'retired'
           where tenant_key = $1 and assessment_id = 'assessment-1'`,
          [tenantA],
        ),
      "23514",
      "home_active_assessment_retired_at_check",
    );
    // No state but the two.
    await refused(
      () => insert(tenantA, "assessment-5", "paused", null),
      "23514",
      "home_active_assessment_state_check",
    );
    // Only a projection manifest that exists can be declared.
    await refused(
      () =>
        insert(
          tenantA,
          "assessment-6",
          "retired",
          "2026-01-01T00:00:00Z",
          "00000000-0000-4000-8000-00000000dead",
        ),
      "23503",
      "home_active_assessment_projection_manifest_id_fkey",
    );

    // Row security is on, and the one policy is the tenant's read policy.
    const security = await db.query<{ enabled: boolean }>(
      `select relrowsecurity as enabled from pg_class where oid = '${table}'::regclass`,
    );
    assert.equal(security.rows[0].enabled, true);
    const policies = await db.query<{
      policyname: string;
      permissive: string;
      roles: string;
      cmd: string;
      qual: string;
      with_check: string | null;
    }>(
      `select policyname, permissive, roles::text, cmd, qual, with_check
       from pg_policies
       where schemaname = 'ecl_projection' and tablename = 'home_active_assessment'`,
    );
    assert.equal(policies.rows.length, 1);
    const policy = policies.rows[0];
    assert.deepEqual(
      {
        policyname: policy.policyname,
        permissive: policy.permissive,
        roles: policy.roles,
        cmd: policy.cmd,
        with_check: policy.with_check,
      },
      {
        policyname: "home_active_assessment_tenant_select",
        permissive: "PERMISSIVE",
        roles: "{public}",
        cmd: "SELECT",
        with_check: null,
      },
    );
    checks += 2;

    // What the policy does, as a role that does not own the table.
    await db.query(`create role ${reader}`);
    await db.query(`grant usage on schema ecl_projection to ${reader}`);
    await db.query(
      `grant select, insert, update, delete on ${table} to ${reader}`,
    );
    await db.query(`set local role ${reader}`);
    const visible = async (settings: Record<string, string>) => {
      for (const name of ["app.tenant_key", "app.client_key"]) {
        await db.query("select set_config($1, $2, true)", [
          name,
          settings[name] ?? "",
        ]);
      }
      const seen = await db.query<{
        tenant_key: string;
        assessment_id: string;
      }>(
        `select tenant_key, assessment_id from ${table}
         where tenant_key in ($1, $2) order by 1, 2`,
        [tenantA, tenantB],
      );
      checks += 1;
      return seen.rows.map((row) => `${row.tenant_key}/${row.assessment_id}`);
    };
    const ofA = [1, 2, 3].map((n) => `${tenantA}/assessment-${n}`);
    const ofB = [`${tenantB}/assessment-1`];
    // No tenant stated: nothing.
    assert.deepEqual(await visible({}), []);
    // A tenant sees its own declarations, by either setting, and no one else's.
    assert.deepEqual(await visible({ "app.tenant_key": tenantA }), ofA);
    assert.deepEqual(await visible({ "app.client_key": tenantA }), ofA);
    assert.deepEqual(await visible({ "app.tenant_key": tenantB }), ofB);
    assert.deepEqual(await visible({ "app.client_key": tenantB }), ofB);
    assert.deepEqual(await visible({ "app.tenant_key": "another-tenant" }), []);
    assert.deepEqual(
      await visible({ "app.tenant_key": tenantA, "app.client_key": tenantB }),
      [...ofA, ...ofB],
    );
    // The internal administrator sees every tenant's.
    assert.deepEqual(await visible({ "app.tenant_key": "internal-admin" }), [
      ...ofA,
      ...ofB,
    ]);
    assert.deepEqual(await visible({ "app.client_key": "internal-admin" }), [
      ...ofA,
      ...ofB,
    ]);
    // The policy is for reading. Even with the table privileges, and even as
    // the tenant, such a role writes nothing.
    await visible({ "app.tenant_key": tenantA });
    await refused(
      () => insert(tenantA, "assessment-7", "retired", "2026-01-01T00:00:00Z"),
      "42501",
    );
    const updated = await db.query(
      `update ${table} set projection_hash = 'changed' where tenant_key = $1`,
      [tenantA],
    );
    assert.equal(updated.rowCount, 0);
    const deleted = await db.query(
      `delete from ${table} where tenant_key = $1`,
      [tenantA],
    );
    assert.equal(deleted.rowCount, 0);
    checks += 2;
    await db.query("reset role");
    assert.equal(
      Number(
        (
          await db.query<{ n: string }>(
            `select count(*) as n from ${table} where tenant_key = $1`,
            [tenantA],
          )
        ).rows[0].n,
      ),
      3,
    );

    await db.query("rollback");
    assert.deepEqual(
      (await db.query(`select * from ${table} order by 1, 2`)).rows,
      before.rows,
      "the table is left as it was found",
    );
    assert.equal(
      (await db.query("select 1 from pg_roles where rolname = $1", [reader]))
        .rows.length,
      0,
    );

    assertWorkflowTriggersCover([
      "supabase/migrations/20261002013000_home_active_assessment.sql",
    ]);
    console.log(JSON.stringify({ status: "passed", checks }));
  } catch (error) {
    await db.query("rollback").catch(() => undefined);
    throw error;
  } finally {
    await db.end();
  }
}

main().then(
  () => process.exit(0),
  (error) => {
    console.error(error);
    process.exit(1);
  },
);
