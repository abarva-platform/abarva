#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function arg(name) {
  const index = process.argv.indexOf(name);
  return index < 0 ? null : process.argv[index + 1];
}

async function main() {
  const tenantKey = arg("--tenant-key");
  if (!tenantKey || !process.env.DATABASE_URL) throw new Error("--tenant-key and DATABASE_URL are required");
  const registry = JSON.parse(fs.readFileSync(path.join(ROOT, "datasets/tenant-inputs/tenant-input-registry.json"), "utf8"));
  if (!registry.activeTenants?.some((tenant) => tenant.tenantKey === tenantKey)) {
    throw new Error("Tenant is not active in the input registry");
  }
  const { default: pg } = await import("pg");
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    await client.query("begin read only");
    await client.query("select set_config('app.tenant_key', $1, true)", [tenantKey]);
    const lifecycleExists = await client.query("select to_regclass('ecl_projection.tower_assessment_lifecycle') is not null as present");
    if (lifecycleExists.rows[0]?.present !== true) throw new Error("Tower lifecycle table is absent");
    const lifecycle = await client.query(
      "select assessment_id, projection_version, state from ecl_projection.tower_assessment_lifecycle where tenant_key = $1 and state = 'active'",
      [tenantKey],
    );
    if (lifecycle.rows.length !== 1) throw new Error(`Expected one declared active lifecycle row for tenant; found ${lifecycle.rows.length}`);
    const selected = await client.query(
      "select assessment_id, projection_version from serving.tower_active_assessment_keys() where tenant_key = $1",
      [tenantKey],
    );
    if (selected.rows.length !== 1 ||
        selected.rows[0].assessment_id !== lifecycle.rows[0].assessment_id ||
        Number(selected.rows[0].projection_version) !== Number(lifecycle.rows[0].projection_version)) {
      throw new Error("Serving selector does not match the declared active lifecycle row");
    }
    console.log(`LIFECYCLE_PREFLIGHT_OK\t${JSON.stringify({ tenant_key: tenantKey, active_assessment_id: lifecycle.rows[0].assessment_id, projection_version: lifecycle.rows[0].projection_version })}`);
    await client.query("rollback");
  } catch (error) {
    await client.query("rollback").catch(() => {});
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(`LIFECYCLE_PREFLIGHT_FAIL\t${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
