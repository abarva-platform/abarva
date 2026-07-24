#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { Client } from "pg";

const TENANT = {
  id: "830de810-0020-4c9e-8f59-000000000201",
  tenantKey: "lakeshore-industries",
  slug: "lakeshore-industries",
  name: "Lakeshore Industries",
  legalName: "Lakeshore Industries LLC",
  industryCode: "INDUSTRIAL_MANUFACTURING",
  parentTenantKey: "lakeshore-holdings",
};

function parseArgs(argv) {
  const args = {
    write: false,
    planOnly: false,
    emitProofBundle: false,
    outDir: path.join(os.tmpdir(), "tower-lakeshore-industries-client-seed"),
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--write") args.write = true;
    else if (arg === "--dry-run") args.write = false;
    else if (arg === "--plan-only") args.planOnly = true;
    else if (arg === "--emit-proof-bundle") args.emitProofBundle = true;
    else if (arg === "--out-dir") {
      i += 1;
      if (i >= argv.length) throw new Error("--out-dir requires a value");
      args.outDir = argv[i];
    } else if (arg === "--help" || arg === "-h") {
      console.log(`Usage: node scripts/tower/ensure-lakeshore-industries-client.mjs [--dry-run|--write] [--emit-proof-bundle] [--out-dir <path>]`);
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return args;
}

function databaseUrl() {
  const url = process.env.DATABASE_URL || "";
  if (!url.trim()) throw new Error("DATABASE_URL is required.");
  return url.trim();
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function redactRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    legal_name: row.legal_name,
    industry_code: row.industry_code,
    tenant_key: row.tenant_key,
    slug: row.slug,
    holding_group_id: row.holding_group_id,
    parent_client_id: row.parent_client_id,
    holding_group_role: row.holding_group_role,
    aggregate_visibility_level: row.aggregate_visibility_level,
  };
}

async function tableColumns(client) {
  const res = await client.query(
    `SELECT column_name
       FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'clients'`,
  );
  return new Set(res.rows.map((row) => row.column_name));
}

function requireColumns(columns, required) {
  const missing = required.filter((column) => !columns.has(column));
  if (missing.length) {
    throw new Error(`public.clients missing required column(s): ${missing.join(", ")}`);
  }
}

async function loadIdentityRows(client, columns) {
  const selectColumns = [
    "id",
    "name",
    "legal_name",
    "industry_code",
    "tenant_key",
    columns.has("slug") ? "slug" : "NULL::text AS slug",
    columns.has("holding_group_id") ? "holding_group_id" : "NULL::uuid AS holding_group_id",
    columns.has("parent_client_id") ? "parent_client_id" : "NULL::uuid AS parent_client_id",
    columns.has("holding_group_role") ? "holding_group_role" : "NULL::text AS holding_group_role",
    columns.has("aggregate_visibility_level")
      ? "aggregate_visibility_level"
      : "NULL::text AS aggregate_visibility_level",
  ];
  const res = await client.query(
    `SELECT ${selectColumns.join(", ")}
       FROM public.clients
      WHERE id = $3::uuid
         OR tenant_key = $1
         OR ${columns.has("slug") ? "slug = $1" : "false"}
         OR lower(name) = lower($2)
      ORDER BY
        CASE
          WHEN tenant_key = $1 THEN 0
          WHEN id = $3::uuid THEN 1
          WHEN ${columns.has("slug") ? "slug = $1" : "false"} THEN 2
          ELSE 3
        END`,
    [TENANT.tenantKey, TENANT.name, TENANT.id],
  );
  return res.rows;
}

function assertNoConflictingIdentity(rows) {
  const exact = rows.filter((row) => row.tenant_key === TENANT.tenantKey);
  if (exact.length > 1) {
    throw new Error(`Multiple public.clients rows already use tenant_key=${TENANT.tenantKey}`);
  }
  const conflicts = rows.filter((row) => {
    if (row.tenant_key === TENANT.tenantKey) return false;
    if (row.tenant_key == null && row.slug == null) return false;
    return row.id === TENANT.id || row.slug === TENANT.slug || row.name?.toLowerCase() === TENANT.name.toLowerCase();
  });
  if (conflicts.length) {
    throw new Error(
      `Refusing to claim an existing non-exact client identity for ${TENANT.tenantKey}: ` +
        JSON.stringify(conflicts.map(redactRow)),
    );
  }
}

async function resolveParent(client) {
  const res = await client.query(
    `SELECT id
       FROM public.clients
      WHERE tenant_key = $1
      ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST
      LIMIT 1`,
    [TENANT.parentTenantKey],
  );
  return res.rows[0]?.id ?? null;
}

function buildColumnPlan(columns, parentId) {
  const row = {
    id: TENANT.id,
    name: TENANT.name,
    legal_name: TENANT.legalName,
    industry_code: TENANT.industryCode,
    tenant_key: TENANT.tenantKey,
  };
  if (columns.has("slug")) row.slug = TENANT.slug;
  if (columns.has("holding_group_id")) row.holding_group_id = parentId;
  if (columns.has("parent_client_id")) row.parent_client_id = parentId;
  if (columns.has("holding_group_role")) row.holding_group_role = parentId ? "l2_portco" : "standalone";
  if (columns.has("aggregate_visibility_level")) row.aggregate_visibility_level = "own_client";
  return row;
}

async function upsertTenant(client, columns, parentId) {
  const row = buildColumnPlan(columns, parentId);
  const names = Object.keys(row);
  const values = Object.values(row);
  const setNames = names.filter((name) => name !== "id");
  const exact = await client.query(`SELECT id FROM public.clients WHERE tenant_key = $1 LIMIT 1`, [
    TENANT.tenantKey,
  ]);
  if (exact.rows[0]) {
    await client.query(
      `UPDATE public.clients
          SET ${setNames.map((name, index) => `${name} = $${index + 2}`).join(", ")},
              updated_at = now()
        WHERE id = $1::uuid`,
      [exact.rows[0].id, ...setNames.map((name) => row[name])],
    );
    return "updated";
  }
  await client.query(
    `INSERT INTO public.clients (${names.join(", ")})
     VALUES (${names.map((_, index) => `$${index + 1}`).join(", ")})`,
    values,
  );
  return "inserted";
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  fs.mkdirSync(args.outDir, { recursive: true });

  const plan = {
    tenant: TENANT,
    mode: args.planOnly ? "plan_only" : args.write ? "write" : "dry_run",
    generated_at: new Date().toISOString(),
  };
  writeJson(path.join(args.outDir, "plan.json"), plan);

  if (args.planOnly) {
    console.log(JSON.stringify(plan, null, 2));
    return;
  }

  const client = new Client({ connectionString: databaseUrl(), ssl: { rejectUnauthorized: true } });
  await client.connect();
  try {
    await client.query("BEGIN");
    const columns = await tableColumns(client);
    requireColumns(columns, ["id", "name", "legal_name", "industry_code", "tenant_key"]);
    const beforeRows = await loadIdentityRows(client, columns);
    assertNoConflictingIdentity(beforeRows);
    const parentId = await resolveParent(client);
    const action = await upsertTenant(client, columns, parentId);
    const afterRows = await loadIdentityRows(client, columns);
    const exactAfter = afterRows.find((row) => row.tenant_key === TENANT.tenantKey);
    if (!exactAfter) throw new Error(`Seed did not produce tenant_key=${TENANT.tenantKey}`);

    const summary = {
      status: args.write ? "applied" : "dry_run",
      action,
      tenant_key: TENANT.tenantKey,
      client_id: exactAfter.id,
      parent_tenant_key: TENANT.parentTenantKey,
      parent_client_id: parentId,
      before_rows: beforeRows.map(redactRow),
      after_row: redactRow(exactAfter),
      checksum: crypto.createHash("sha256").update(JSON.stringify(redactRow(exactAfter))).digest("hex"),
      generated_at: new Date().toISOString(),
    };
    writeJson(path.join(args.outDir, "summary.json"), summary);
    console.log(JSON.stringify(summary, null, 2));
    if (args.write) await client.query("COMMIT");
    else await client.query("ROLLBACK");
    if (args.emitProofBundle) emitProofBundle(args.outDir);
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    await client.end();
  }
}

function emitProofBundle(outDir) {
  const tarPath = path.join(os.tmpdir(), `lakeshore-industries-client-seed-${Date.now()}.tgz`);
  const result = spawnSync("tar", ["-czf", tarPath, "-C", path.dirname(outDir), path.basename(outDir)], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.status !== 0) throw new Error(result.stderr || "proof bundle tar failed");
  console.log("__SEMANTIC2_PROOF_TGZ_BEGIN__");
  console.log(fs.readFileSync(tarPath).toString("base64"));
  console.log("__SEMANTIC2_PROOF_TGZ_END__");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
