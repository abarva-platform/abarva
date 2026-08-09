import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { Client } from "pg";

import { postgresClientOptions } from "../../src/scripts/postgres-client-options";

type Row = Record<string, unknown>;

const DEFAULT_TENANT_KEY = "skyharbor_global";
const RAW_SCHEMA = "raw_enterprise_it";
const RAW_TABLE = "vendors_contracts";
const REPAIR_ID = "skyharbor-deloitte-workday-scope-20260809";

interface Args {
  apply: boolean;
  emitProofBundle: boolean;
  outDir: string;
  tenantKey: string;
}

function parseArgs(): Args {
  const args = process.argv.slice(2);
  const value = (flag: string): string | undefined => {
    const index = args.indexOf(flag);
    if (index >= 0) return args[index + 1];
    const prefixed = args.find((arg) => arg.startsWith(`${flag}=`));
    return prefixed?.slice(flag.length + 1);
  };
  return {
    apply:
      args.includes("--apply") ||
      process.env.SOURCE_SKYHARBOR_DELOITTE_REPAIR_APPLY === "true",
    emitProofBundle:
      args.includes("--emit-proof-bundle") ||
      process.env.SOURCE_SKYHARBOR_DELOITTE_REPAIR_EMIT_PROOF_BUNDLE === "true",
    outDir:
      value("--out-dir") ??
      process.env.SOURCE_SKYHARBOR_DELOITTE_REPAIR_OUT_DIR ??
      path.join(os.tmpdir(), REPAIR_ID),
    tenantKey:
      value("--tenant-key") ??
      process.env.SKYHARBOR_TENANT_KEY ??
      process.env.TENANT_KEY ??
      DEFAULT_TENANT_KEY,
  };
}

function databaseUrl(): string {
  const url =
    process.env.ABARVA_AZURE_DATABASE_URL ||
    process.env.AZURE_DATABASE_URL ||
    process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "Missing ABARVA_AZURE_DATABASE_URL, AZURE_DATABASE_URL, or DATABASE_URL.",
    );
  }
  return url;
}

function quoteIdent(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function sha256(value: string | Buffer): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function writeJson(file: string, value: unknown): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function normalizeRows(rows: Row[]): Row[] {
  return rows.map((row) =>
    Object.fromEntries(
      Object.entries(row).map(([key, value]) => [
        key,
        value == null ? null : String(value),
      ]),
    ),
  );
}

async function readColumns(client: Client): Promise<Set<string>> {
  const result = await client.query<{ column_name: string }>(
    `
      select column_name
        from information_schema.columns
       where table_schema = $1
         and table_name = $2
    `,
    [RAW_SCHEMA, RAW_TABLE],
  );
  return new Set(result.rows.map((row) => row.column_name));
}

function candidateColumns(columns: Set<string>): string[] {
  return [
    "contract_name",
    "scope_summary",
    "supported_applications",
    "supported_systems",
    "supported_functions",
  ].filter((column) => columns.has(column));
}

function whereClause(columns: string[]): string {
  const workdayChecks = columns
    .map((column) => `${quoteIdent(column)} ilike '%Workday%'`)
    .join(" or ");
  const functionCheck = columns.includes("supported_functions")
    ? ` or ${quoteIdent("supported_functions")} ilike '%Human Resources%'`
    : "";
  return `
    _tenant_key = $1
    and vendor_name ilike '%Deloitte%'
    and (${workdayChecks || "false"}${functionCheck})
  `;
}

async function readRawRows(client: Client, tenantKey: string, columns: Set<string>) {
  const selected = [
    "_tenant_key",
    "contract_id",
    "vendor_id",
    "vendor_name",
    ...candidateColumns(columns),
  ].filter((column) => columns.has(column));
  const result = await client.query(
    `
      select ${selected.map(quoteIdent).join(", ")}
        from ${quoteIdent(RAW_SCHEMA)}.${quoteIdent(RAW_TABLE)}
       where ${whereClause(candidateColumns(columns))}
       order by contract_id nulls last, vendor_id nulls last
    `,
    [tenantKey],
  );
  return normalizeRows(result.rows);
}

async function readSourceRows(client: Client, tenantKey: string): Promise<Row[]> {
  try {
    const result = await client.query(
      `
        select tenant_key, contract_id, vendor_ref, vendor_name, contract_name,
               scope_summary, annual_value
          from source.contract_360
         where tenant_key = $1
           and vendor_name ilike '%Deloitte%'
         order by annual_value desc nulls last
         limit 20
      `,
      [tenantKey],
    );
    return normalizeRows(result.rows);
  } catch (error) {
    return [{ error: error instanceof Error ? error.message : String(error) }];
  }
}

function updateAssignments(columns: Set<string>): string[] {
  const assignments: string[] = [];
  if (columns.has("contract_name")) {
    assignments.push(
      `${quoteIdent("contract_name")} = regexp_replace(${quoteIdent(
        "contract_name",
      )}, '\\s*&\\s*Workday Managed Services', '', 'gi')`,
    );
  }
  if (columns.has("scope_summary")) {
    assignments.push(
      `${quoteIdent(
        "scope_summary",
      )} = 'Direct Booking Web Platform managed-services support only; HCM managed-services support is represented by internal workforce roles.'`,
    );
  }
  if (columns.has("supported_applications")) {
    assignments.push(
      `${quoteIdent("supported_applications")} = 'Direct Booking Web Platform'`,
    );
  }
  if (columns.has("supported_systems")) {
    assignments.push(
      `${quoteIdent("supported_systems")} = 'Direct Booking Web Platform'`,
    );
  }
  if (columns.has("supported_functions")) {
    assignments.push(
      `${quoteIdent("supported_functions")} = 'Distribution, Sales & E-Commerce'`,
    );
  }
  return assignments;
}

async function applyRepair(
  client: Client,
  tenantKey: string,
  columns: Set<string>,
): Promise<Row[]> {
  const assignments = updateAssignments(columns);
  if (assignments.length === 0) {
    throw new Error("No supported raw columns found for Deloitte scope repair.");
  }
  const result = await client.query(
    `
      update ${quoteIdent(RAW_SCHEMA)}.${quoteIdent(RAW_TABLE)}
         set ${assignments.join(", ")}
       where ${whereClause(candidateColumns(columns))}
       returning _tenant_key, contract_id, vendor_id, vendor_name,
                 ${candidateColumns(columns).map(quoteIdent).join(", ")}
    `,
    [tenantKey],
  );
  return normalizeRows(result.rows);
}

function emitProofBundle(outDir: string): void {
  const result = spawnSync("tar", ["-czf", "-", "-C", outDir, "."], {
    encoding: "buffer",
  });
  if (result.status !== 0) {
    throw new Error(
      `Failed to create proof bundle: ${result.stderr.toString("utf8")}`,
    );
  }
  console.log("__SEMANTIC2_PROOF_TGZ_BEGIN__");
  console.log(result.stdout.toString("base64"));
  console.log("__SEMANTIC2_PROOF_TGZ_END__");
}

async function main() {
  const args = parseArgs();
  fs.mkdirSync(args.outDir, { recursive: true });

  const client = new Client(
    postgresClientOptions(databaseUrl(), "source-deloitte-scope-repair"),
  );
  await client.connect();
  try {
    await client.query("begin");
    await client.query("select set_config('app.tenant_key', $1, false)", [
      args.tenantKey,
    ]);
    const columns = await readColumns(client);
    const beforeRaw = await readRawRows(client, args.tenantKey, columns);
    const beforeSource = await readSourceRows(client, args.tenantKey);
    if (beforeRaw.length === 0) {
      throw new Error(
        "No tenant-scoped Deloitte raw row with Workday/HCM overlap was found; no mutation performed.",
      );
    }

    const updatedRaw = args.apply
      ? await applyRepair(client, args.tenantKey, columns)
      : [];
    const afterRaw = args.apply
      ? await readRawRows(client, args.tenantKey, columns)
      : beforeRaw;
    const afterSource = args.apply
      ? await readSourceRows(client, args.tenantKey)
      : beforeSource;

    const residualWorkdayRaw = afterRaw.filter((row) =>
      JSON.stringify(row).toLowerCase().includes("workday"),
    );
    const residualHumanResourcesRaw = afterRaw.filter((row) =>
      String(row.supported_functions ?? "")
        .toLowerCase()
        .includes("human resources"),
    );
    const passed =
      args.apply &&
      updatedRaw.length > 0 &&
      residualWorkdayRaw.length === 0 &&
      residualHumanResourcesRaw.length === 0;

    const proof = {
      event: "source_deloitte_workday_scope_repair",
      repairId: REPAIR_ID,
      tenantKey: args.tenantKey,
      apply: args.apply,
      rawTable: `${RAW_SCHEMA}.${RAW_TABLE}`,
      changedRows: updatedRaw.length,
      beforeRaw,
      updatedRaw,
      afterRaw,
      beforeSource,
      afterSource,
      residualWorkdayRaw,
      residualHumanResourcesRaw,
      passed,
      proofSha256: "",
    };
    proof.proofSha256 = sha256(JSON.stringify(proof));
    writeJson(path.join(args.outDir, "proof.json"), proof);
    writeJson(path.join(args.outDir, "request.json"), {
      repairId: REPAIR_ID,
      tenantKey: args.tenantKey,
      apply: args.apply,
      outDir: args.outDir,
    });

    await client.query(args.apply ? "commit" : "rollback");
    console.log(JSON.stringify(proof, null, 2));
    if (!passed) process.exitCode = 1;
    if (args.emitProofBundle) emitProofBundle(args.outDir);
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
