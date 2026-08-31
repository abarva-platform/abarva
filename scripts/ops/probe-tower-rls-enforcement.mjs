#!/usr/bin/env node
/**
 * Read-only enforcement probe for Tower serving views.
 *
 * This proves the policy is exercised, not just declared. The probe runs as the configured
 * database connection, SET LOCAL ROLEs into the Tower runtime reader, and checks that serving views
 * expose no rows without an app.tenant_key GUC and only one tenant with it. It prints counts and
 * role state only; it does not print tenant names or row payloads.
 */

import process from "node:process";

const ROLE = process.env.TOWER_RUNTIME_READ_ROLE?.trim() || "tower_projection_reader";
const VIEWS = [
  "tower_command_center",
  "tower_value_proof",
  "tower_decision_lanes",
  "tower_evidence",
  "tower_recommended_actions",
  "tower_ai_portfolio",
  "tower_cost_lens",
  "tower_risk_lens",
  "tower_adoption_lens",
];

function quoteIdent(value) {
  const clean = String(value ?? "").trim();
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(clean)) {
    throw new Error(`invalid_role_identifier:${value}`);
  }
  return `"${clean}"`;
}

function line(label, value) {
  console.log(`${label}\t${typeof value === "string" ? value : JSON.stringify(value)}`);
}

async function tx(client, fn) {
  await client.query("BEGIN READ ONLY");
  try {
    const out = await fn();
    await client.query("COMMIT");
    return out;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  }
}

async function roleSnapshot(client, label) {
  const { rows } = await client.query(
    `select current_user as current_user,
            session_user as session_user,
            r.rolsuper as superuser,
            r.rolbypassrls as bypassrls
       from pg_roles r
      where r.rolname = current_user`,
  );
  line(label, rows[0] ?? {});
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required");
  const { default: pg } = await import("pg");
  const client = new pg.Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  try {
    await roleSnapshot(client, "before_role");

    const viewOptions = await client.query(
      `select c.relname as view_name,
              coalesce(c.reloptions::text, '{}') as reloptions
         from pg_class c
         join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'serving'
          and c.relname = any($1::text[])
        order by c.relname`,
      [VIEWS],
    );
    for (const row of viewOptions.rows) {
      line("view", {
        name: row.view_name,
        security_invoker: String(row.reloptions).includes("security_invoker=true"),
      });
    }

    const candidates = await client.query(
      `select tenant_key
         from serving.tower_command_center
        group by tenant_key
        having count(*) > 0
        order by count(*) desc, tenant_key
        limit 1`,
    );
    const tenantKey = candidates.rows[0]?.tenant_key;
    if (!tenantKey) throw new Error("no_active_tower_tenant_found");

    await tx(client, async () => {
      await client.query(`SET LOCAL ROLE ${quoteIdent(ROLE)}`);
      await roleSnapshot(client, "after_set_role_no_tenant");
      const noTenant = await client.query(
        `select count(*)::int as rows from serving.tower_command_center`,
      );
      line("no_tenant_guc", { rows: noTenant.rows[0]?.rows ?? null });
    });

    await tx(client, async () => {
      await client.query(`SET LOCAL ROLE ${quoteIdent(ROLE)}`);
      await client.query("select set_config('app.tenant_key', $1, true)", [
        tenantKey,
      ]);
      await roleSnapshot(client, "after_set_role_with_tenant");
      for (const view of VIEWS) {
        const result = await client.query(
          `select count(*)::int as rows,
                  count(distinct tenant_key)::int as tenant_count,
                  count(*) filter (where tenant_key <> $1)::int as cross_tenant_rows
             from serving.${quoteIdent(view)}`,
          [tenantKey],
        );
        line("view_read", { view, ...result.rows[0] });
      }
    });

    console.log("TOWER_RLS_ENFORCEMENT_PROBE_OK");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.log(`TOWER_RLS_ENFORCEMENT_PROBE_ERR\t${error.message}`);
  process.exit(1);
});
