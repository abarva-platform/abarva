#!/usr/bin/env tsx
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { Client } from "pg";

import { postgresClientOptions } from "../../src/scripts/postgres-client-options";

const APPROVED_TENANTS = new Set(["meridian-health", "skyharbor-air"]);
const DEFAULT_TENANTS = ["meridian-health", "skyharbor-air"];
const CONTRACT_VERSION = "enterprise-intelligence-template-pack-v6-runtime-baseline";
const DEFAULT_OUT_DIR = "reports/runtime-layer-refresh/readback-latest";
const TABLES = [
  "business_records",
  "relationship_edges",
  "graph_nodes",
  "graph_edges",
  "graph_quality_reports",
] as const;

type TableName = (typeof TABLES)[number];

type Args = {
  tenants: string[];
  outDir: string;
  buildVersion: string;
  inputSourceVersion: string;
  idempotencyKey: string;
  expected: {
    businessRecords?: number;
    relationshipEdges?: number;
    graphNodes?: number;
    graphEdges?: number;
    graphQualityReports?: number;
    quarantinedRelationships?: number;
  };
  emitProofBundle: boolean;
};

type CountRow = {
  table: string;
  count: number;
  expected?: number;
  status: "pass" | "warn" | "fail";
};

type RlsRow = {
  tenant: string;
  table: string;
  visibleTenantRows: number;
  expectedTenantRows: number;
  visibleOtherTenantRows: number;
  exercisedRole: "authenticated";
  status: "pass" | "fail";
};

const TRUE_VALUES = new Set(["1", "true", "yes"]);

function parseArgs(argv: readonly string[]): Args {
  const tenants: string[] = [];
  const get = (name: string): string | undefined => {
    const index = argv.indexOf(name);
    if (index === -1) return undefined;
    const value = argv[index + 1];
    return value && !value.startsWith("--") ? value : undefined;
  };
  const envValue = (name: string): string | undefined => {
    const value = process.env[name]?.trim();
    return value ? value : undefined;
  };
  const envList = (name: string): string[] =>
    String(process.env[name] ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
  const envFlag = (name: string): boolean =>
    TRUE_VALUES.has(String(process.env[name] ?? "").trim().toLowerCase());
  const envNumber = (name: string): number | undefined => {
    const raw = envValue(name);
    if (!raw) return undefined;
    const value = Number(raw);
    if (!Number.isInteger(value) || value < 0) throw new Error(`${name} must be a non-negative integer.`);
    return value;
  };
  const argNumber = (name: string): number | undefined => {
    const raw = get(name);
    if (!raw) return undefined;
    const value = Number(raw);
    if (!Number.isInteger(value) || value < 0) throw new Error(`${name} must be a non-negative integer.`);
    return value;
  };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--tenant") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error("--tenant requires a value");
      tenants.push(value);
      index += 1;
    }
  }
  const envTenants = envList("RUNTIME_LAYER_REFRESH_TENANTS");
  return {
    tenants: tenants.length > 0 ? tenants : envTenants.length > 0 ? envTenants : DEFAULT_TENANTS,
    outDir:
      get("--out-dir") ??
      envValue("RUNTIME_LAYER_REFRESH_READBACK_OUT_DIR") ??
      envValue("RUNTIME_LAYER_REFRESH_OUT_DIR") ??
      DEFAULT_OUT_DIR,
    buildVersion:
      get("--build-version") ??
      envValue("RUNTIME_LAYER_REFRESH_BUILD_VERSION") ??
      required("RUNTIME_LAYER_REFRESH_BUILD_VERSION or --build-version"),
    inputSourceVersion:
      get("--input-source-version") ??
      envValue("RUNTIME_LAYER_REFRESH_INPUT_SOURCE_VERSION") ??
      required("RUNTIME_LAYER_REFRESH_INPUT_SOURCE_VERSION or --input-source-version"),
    idempotencyKey:
      get("--idempotency-key") ??
      envValue("RUNTIME_LAYER_REFRESH_IDEMPOTENCY_KEY") ??
      required("RUNTIME_LAYER_REFRESH_IDEMPOTENCY_KEY or --idempotency-key"),
    expected: {
      businessRecords: argNumber("--expected-business-records") ?? envNumber("RUNTIME_LAYER_REFRESH_EXPECTED_BUSINESS_RECORDS"),
      relationshipEdges:
        argNumber("--expected-relationship-edges") ?? envNumber("RUNTIME_LAYER_REFRESH_EXPECTED_RELATIONSHIP_EDGES"),
      graphNodes: argNumber("--expected-graph-nodes") ?? envNumber("RUNTIME_LAYER_REFRESH_EXPECTED_GRAPH_NODES"),
      graphEdges: argNumber("--expected-graph-edges") ?? envNumber("RUNTIME_LAYER_REFRESH_EXPECTED_GRAPH_EDGES"),
      graphQualityReports:
        argNumber("--expected-graph-quality-reports") ?? envNumber("RUNTIME_LAYER_REFRESH_EXPECTED_GRAPH_QUALITY_REPORTS"),
      quarantinedRelationships:
        argNumber("--expected-quarantined-relationships") ??
        envNumber("RUNTIME_LAYER_REFRESH_EXPECTED_QUARANTINED_RELATIONSHIPS"),
    },
    emitProofBundle:
      argv.includes("--emit-proof-bundle") || envFlag("RUNTIME_LAYER_REFRESH_EMIT_PROOF_BUNDLE"),
  };
}

function required(label: string): never {
  throw new Error(`Missing ${label}`);
}

function assertScope(tenants: readonly string[]): void {
  const unique = new Set(tenants);
  if (unique.size !== tenants.length) throw new Error(`Duplicate tenant in scope: ${tenants.join(", ")}`);
  for (const tenant of tenants) {
    if (!APPROVED_TENANTS.has(tenant)) {
      throw new Error(`Out-of-scope tenant refused: ${tenant}`);
    }
  }
}

function databaseUrl(): string {
  const value =
    process.env.ABARVA_AZURE_DATABASE_URL?.trim() ||
    process.env.AZURE_DATABASE_URL?.trim() ||
    process.env.DATABASE_URL?.trim();
  if (!value) {
    throw new Error("Missing ABARVA_AZURE_DATABASE_URL, AZURE_DATABASE_URL, or DATABASE_URL");
  }
  return value;
}

function gitSha(): string {
  const operatorCommit = process.env.ABARVA_OPERATOR_BRANCH_COMMIT?.trim();
  if (operatorCommit) return operatorCommit;
  const result = spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" });
  return result.status === 0 ? result.stdout.trim() : "unknown";
}

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

async function count(client: Client, sql: string, params: unknown[]): Promise<number> {
  const result = await client.query<{ count: string }>(sql, params);
  return Number(result.rows[0]?.count ?? 0);
}

async function setTenantContext(client: Client, tenant: string): Promise<void> {
  await client.query("SELECT set_config('app.tenant_key', $1, true)", [tenant]);
  await client.query("SELECT set_config('app.client_key', $1, true)", [tenant]);
  await client.query("SELECT set_config('request.jwt.claims', $1, true)", [
    JSON.stringify({ tenant_key: tenant, role: "observer", sub: "runtime-layer-refresh-readback" }),
  ]);
}

function tableBuildPredicate(table: TableName): string {
  if (table === "business_records" || table === "relationship_edges") {
    return "build_version=$2 AND input_source_version=$3 AND idempotency_key=$4";
  }
  if (table === "graph_quality_reports") {
    return "metadata->>'buildVersion'=$2 AND metadata->>'inputSourceVersion'=$3";
  }
  return "metadata->>'buildVersion'=$2";
}

function tableParams(table: TableName, tenant: string | string[], args: Args): unknown[] {
  if (table === "business_records" || table === "relationship_edges") {
    return [tenant, args.buildVersion, args.inputSourceVersion, args.idempotencyKey];
  }
  if (table === "graph_quality_reports") {
    return [tenant, args.buildVersion, args.inputSourceVersion];
  }
  return [tenant, args.buildVersion];
}

async function tableCount(client: Client, table: TableName, tenants: string[], args: Args): Promise<number> {
  return count(
    client,
    `SELECT count(*) FROM intelligence_v6.${table}
      WHERE tenant_key = ANY($1::text[]) AND contract_version=$${tableParams(table, tenants, args).length + 1}
        AND ${tableBuildPredicate(table)}`,
    [...tableParams(table, tenants, args), CONTRACT_VERSION],
  );
}

async function tenantTableCount(client: Client, table: TableName, tenant: string, args: Args): Promise<number> {
  return count(
    client,
    `SELECT count(*) FROM intelligence_v6.${table}
      WHERE tenant_key = $1 AND contract_version=$${tableParams(table, tenant, args).length + 1}
        AND ${tableBuildPredicate(table)}`,
    [...tableParams(table, tenant, args), CONTRACT_VERSION],
  );
}

async function tenantOtherTableCount(client: Client, table: TableName, tenants: string[], args: Args): Promise<number> {
  return count(
    client,
    `SELECT count(*) FROM intelligence_v6.${table}
      WHERE tenant_key = ANY($1::text[]) AND contract_version=$${tableParams(table, tenants, args).length + 1}
        AND ${tableBuildPredicate(table)}`,
    [...tableParams(table, tenants, args), CONTRACT_VERSION],
  );
}

async function runReadback(args: Args): Promise<{
  runRows: CountRow[];
  tableRows: CountRow[];
  rlsRows: RlsRow[];
  failures: number;
}> {
  const client = new Client({
    ...postgresClientOptions(databaseUrl(), "abarva-runtime-layer-refresh-readback"),
  });
  const expectedGraphQualityReports = args.expected.graphQualityReports ?? args.tenants.length;
  const expectedByTable: Record<TableName, number | undefined> = {
    business_records: args.expected.businessRecords,
    relationship_edges: args.expected.relationshipEdges,
    graph_nodes: args.expected.graphNodes,
    graph_edges: args.expected.graphEdges,
    graph_quality_reports: expectedGraphQualityReports,
  };
  const runKey = `runtime-layer-refresh:${sha256(args.idempotencyKey)}`;

  try {
    await client.connect();
    await client.query("BEGIN READ ONLY");
    await setTenantContext(client, "internal-admin");
    const runCount = await count(
      client,
      `SELECT count(*) FROM intelligence_v6.layer_refresh_runs
        WHERE run_key=$1 AND build_version=$2 AND input_source_version=$3 AND idempotency_key=$4
          AND status='succeeded' AND tenant_scope @> $5::text[]`,
      [runKey, args.buildVersion, args.inputSourceVersion, args.idempotencyKey, args.tenants],
    );
    const quarantineCount = await count(
      client,
      `SELECT coalesce(sum(orphan_edge_count), 0)::int AS count
        FROM intelligence_v6.graph_quality_reports
        WHERE tenant_key = ANY($1::text[]) AND contract_version=$4
          AND metadata->>'buildVersion'=$2 AND metadata->>'inputSourceVersion'=$3`,
      [args.tenants, args.buildVersion, args.inputSourceVersion, CONTRACT_VERSION],
    );
    const runRows: CountRow[] = [
      row("layer_refresh_runs.succeeded", runCount, 1),
      row("graph_quality_reports.orphan_edge_count", quarantineCount, args.expected.quarantinedRelationships ?? 0),
    ];
    const tableRows: CountRow[] = [];
    for (const table of TABLES) {
      const value = await tableCount(client, table, args.tenants, args);
      tableRows.push(row(`intelligence_v6.${table}`, value, expectedByTable[table]));
    }

    const rlsRows: RlsRow[] = [];
    for (const tenant of args.tenants) {
      const otherTenants = args.tenants.filter((item) => item !== tenant);
      for (const table of TABLES) {
        await client.query("RESET ROLE");
        await setTenantContext(client, "internal-admin");
        const expectedTenantRows = await tenantTableCount(client, table, tenant, args);
        await setTenantContext(client, tenant);
        await client.query("SET LOCAL ROLE authenticated");
        const visibleTenantRows = await tenantTableCount(client, table, tenant, args);
        const visibleOtherTenantRows = await tenantOtherTableCount(client, table, otherTenants, args);
        rlsRows.push({
          tenant,
          table: `intelligence_v6.${table}`,
          visibleTenantRows,
          expectedTenantRows,
          visibleOtherTenantRows,
          exercisedRole: "authenticated",
          status: visibleTenantRows === expectedTenantRows && visibleOtherTenantRows === 0 ? "pass" : "fail",
        });
      }
    }
    await client.query("RESET ROLE");
    await client.query("ROLLBACK");
    const failures = [
      ...runRows.map((item) => item.status),
      ...tableRows.map((item) => item.status),
      ...rlsRows.map((item) => item.status),
    ].filter((status) => status === "fail").length;
    return { runRows, tableRows, rlsRows, failures };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    await client.end().catch(() => undefined);
  }
}

function row(table: string, countValue: number, expected?: number): CountRow {
  if (expected === undefined) return { table, count: countValue, status: "warn" };
  return { table, count: countValue, expected, status: countValue === expected ? "pass" : "fail" };
}

function writeJson(filePath: string, value: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function writeMarkdown(
  filePath: string,
  args: Args,
  result: Awaited<ReturnType<typeof runReadback>>,
): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const lines = [
    "# Runtime Layer Refresh Readback Proof",
    "",
    `- Status: ${result.failures === 0 ? "pass" : "fail"}`,
    `- Mode: read-only`,
    `- Git SHA: ${gitSha()}`,
    `- Build version: ${args.buildVersion}`,
    `- Input source version: ${args.inputSourceVersion}`,
    `- Idempotency key: ${args.idempotencyKey}`,
    `- Tenant scope: ${args.tenants.join(", ")}`,
    "",
    "## Counts",
    "",
    "| Check | Count | Expected | Status |",
    "| --- | ---: | ---: | --- |",
    ...[...result.runRows, ...result.tableRows].map(
      (item) => `| ${item.table} | ${item.count} | ${item.expected ?? "n/a"} | ${item.status} |`,
    ),
    "",
    "## Authenticated RLS",
    "",
    "| Tenant | Table | Visible own rows | Expected own rows | Visible other tenant rows | Status |",
    "| --- | --- | ---: | ---: | ---: | --- |",
    ...result.rlsRows.map(
      (item) =>
        `| ${item.tenant} | ${item.table} | ${item.visibleTenantRows} | ${item.expectedTenantRows} | ${item.visibleOtherTenantRows} | ${item.status} |`,
    ),
    "",
  ];
  fs.writeFileSync(filePath, `${lines.join("\n")}\n`);
}

function emitProofBundle(outDir: string): void {
  const tarPath = path.join(path.dirname(outDir), `${path.basename(outDir)}.tgz`);
  const tar = spawnSync("tar", ["-czf", tarPath, "-C", path.dirname(outDir), path.basename(outDir)], {
    encoding: "utf8",
  });
  if (tar.status !== 0) throw new Error(tar.stderr || "Proof bundle tar failed");
  console.log("__SEMANTIC2_PROOF_TGZ_BEGIN__");
  console.log(fs.readFileSync(tarPath).toString("base64"));
  console.log("__SEMANTIC2_PROOF_TGZ_END__");
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  assertScope(args.tenants);
  const absoluteOutDir = path.resolve(process.cwd(), args.outDir);
  fs.rmSync(absoluteOutDir, { recursive: true, force: true });
  fs.mkdirSync(absoluteOutDir, { recursive: true });
  const result = await runReadback(args);
  const summary = {
    generatedAt: new Date().toISOString(),
    status: result.failures === 0 ? "pass" : "fail",
    mode: "read-only",
    gitSha: gitSha(),
    buildVersion: args.buildVersion,
    inputSourceVersion: args.inputSourceVersion,
    idempotencyKey: args.idempotencyKey,
    tenantScope: args.tenants,
    approvedScopeOnly: true,
    runRows: result.runRows,
    tableRows: result.tableRows,
    rlsRows: result.rlsRows,
    failures: result.failures,
    graphTablesRead: true,
    graphTablesWritten: false,
    productReadModelsUpdated: false,
    note: "Independent committed-state readback only. No canonical, graph, Layer 4, retrieval, or tenant-source writes are performed.",
  };
  writeJson(path.join(absoluteOutDir, "summary.json"), summary);
  writeMarkdown(path.join(absoluteOutDir, "summary.md"), args, result);
  if (args.emitProofBundle) emitProofBundle(absoluteOutDir);
  console.log(JSON.stringify(summary, null, 2));
  if (result.failures > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exitCode = 1;
});
