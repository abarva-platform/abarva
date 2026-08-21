#!/usr/bin/env tsx
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { Client } from "pg";

import {
  buildCanonicalTenantDataReport,
  writeCanonicalTenantDataReport,
  type CanonicalDataBuildReport,
} from "../../src/lib/enterprise-data/canonical-build/canonical-tenant-data-build";
import type { CanonicalIngestionRecord } from "../../src/lib/enterprise-data/contracts/canonical-ingestion";
import { RELATIONSHIP_TYPE_DICTIONARY } from "../../src/lib/enterprise-data/contracts/layer3-validation";
import { postgresClientOptions } from "../../src/scripts/postgres-client-options";

const APPROVED_TENANTS = new Set(["meridian-health", "skyharbor-air"]);
const DEFAULT_TENANTS = ["meridian-health", "skyharbor-air"];
const CONTRACT_VERSION = "enterprise-intelligence-template-pack-v6-runtime-baseline";
const DEFAULT_OUT_DIR = "reports/runtime-layer-refresh/latest";
const TRUE_VALUES = new Set(["1", "true", "yes"]);

type CsvRow = Record<string, string>;

type Args = {
  tenants: string[];
  outDir: string;
  buildVersion: string;
  inputSourceVersion: string;
  idempotencyKey: string;
  write: boolean;
  emitProofBundle: boolean;
};

function parseArgs(argv: readonly string[]): Args {
  const tenants: string[] = [];
  const envList = (name: string): string[] =>
    String(process.env[name] ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
  const envValue = (name: string): string | undefined => {
    const value = process.env[name]?.trim();
    return value ? value : undefined;
  };
  const envFlag = (name: string): boolean =>
    TRUE_VALUES.has(String(process.env[name] ?? "").trim().toLowerCase());
  const get = (name: string): string | undefined => {
    const index = argv.indexOf(name);
    if (index === -1) return undefined;
    const value = argv[index + 1];
    return value && !value.startsWith("--") ? value : undefined;
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
    outDir: get("--out-dir") ?? envValue("RUNTIME_LAYER_REFRESH_OUT_DIR") ?? DEFAULT_OUT_DIR,
    buildVersion:
      get("--build-version") ??
      envValue("RUNTIME_LAYER_REFRESH_BUILD_VERSION") ??
      `runtime-layer-refresh-${new Date().toISOString().slice(0, 10)}`,
    inputSourceVersion:
      get("--input-source-version") ?? envValue("RUNTIME_LAYER_REFRESH_INPUT_SOURCE_VERSION") ?? gitSha(),
    idempotencyKey:
      get("--idempotency-key") ??
      envValue("RUNTIME_LAYER_REFRESH_IDEMPOTENCY_KEY") ??
      `runtime-layer-refresh:${gitSha()}:${Date.now()}`,
    write: argv.includes("--write") || envFlag("RUNTIME_LAYER_REFRESH_WRITE"),
    emitProofBundle: argv.includes("--emit-proof-bundle") || envFlag("RUNTIME_LAYER_REFRESH_EMIT_PROOF_BUNDLE"),
  };
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

function gitSha(): string {
  const operatorCommit = process.env.ABARVA_OPERATOR_BRANCH_COMMIT?.trim();
  if (operatorCommit) return operatorCommit;
  const result = spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" });
  return result.status === 0 ? result.stdout.trim() : "unknown";
}

function parseCsv(text: string): CsvRow[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (quoted) {
      if (char === '"' && next === '"') {
        value += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        value += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(value);
      value = "";
    } else if (char === "\n") {
      row.push(value);
      rows.push(row);
      row = [];
      value = "";
    } else if (char !== "\r") {
      value += char;
    }
  }
  if (value.length > 0 || row.length > 0) {
    row.push(value);
    rows.push(row);
  }
  const header = rows.shift() ?? [];
  return rows
    .filter((item) => item.some((cell) => cell.trim()))
    .map((item) => Object.fromEntries(header.map((field, index) => [field, item[index] ?? ""])));
}

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function recordKey(record: CanonicalIngestionRecord): string {
  return `v6br:${sha256([CONTRACT_VERSION, record.tenantKey, record.objectType, record.sourceObjectId].join("|"))}`;
}

function nodeKey(nodeId: string): string {
  return `v6node:${sha256(`${CONTRACT_VERSION}|${nodeId}`)}`;
}

function edgeKey(row: CsvRow): string {
  return `v6edge:${sha256([CONTRACT_VERSION, row.tenantKey, row.relationshipId, row.sourceRowNumber].join("|"))}`;
}

function sourceFile(record: CanonicalIngestionRecord): string {
  return String(record.attributes.sourcePath?.value ?? "");
}

function sourceRow(record: CanonicalIngestionRecord): number | null {
  const raw = Number(record.attributes.sourceRowNumber?.value ?? 0);
  return Number.isFinite(raw) && raw > 0 ? raw : null;
}

function displayName(record: CanonicalIngestionRecord): string {
  return String(record.attributes.displayName?.value ?? record.canonicalObjectKey ?? record.sourceObjectId);
}

function factStatus(record: CanonicalIngestionRecord): "active" | "blocked_conflict" | "quarantined" {
  if (record.qualityStatus === "quarantined") return "quarantined";
  const attributeNames = Object.keys(record.attributes).map((name) => name.toLowerCase());
  return attributeNames.includes("promisedvalueusd") || attributeNames.includes("promised_value_usd")
    ? "blocked_conflict"
    : "active";
}

function confidence(raw: string | undefined): string {
  const value = String(raw ?? "").trim().toLowerCase();
  if (["high", "medium", "low"].includes(value)) return value;
  return "unknown";
}

const relationshipDictionaryByType = new Map(
  RELATIONSHIP_TYPE_DICTIONARY.map((entry) => [entry.relationshipType, entry]),
);

function relationshipDictionaryRows(): unknown[][] {
  return RELATIONSHIP_TYPE_DICTIONARY.map((entry) => [
    entry.relationshipType,
    entry.canonicalLabel,
    entry.inverseLabel,
    entry.category,
    entry.directed ? "directed" : "bidirectional",
    entry.executiveSafe,
    entry.allowedSourceFamilies,
    entry.allowedTargetFamilies,
    entry.description,
  ]);
}

function relationshipCategory(type: string): string {
  return relationshipDictionaryByType.get(type)?.category ?? "dependency";
}

function assertRelationshipTypesCovered(edges: readonly CsvRow[]): void {
  const missing = Array.from(
    new Set(
      edges
        .map((edge) => edge.normalizedRelationshipType)
        .filter((relationshipType) => !relationshipDictionaryByType.has(relationshipType)),
    ),
  ).sort();
  if (missing.length > 0) {
    throw new Error(`Runtime relationship dictionary missing type(s): ${missing.join(", ")}`);
  }
}

function uniqueRowsBy<T>(rows: T[], keyFn: (row: T) => string): T[] {
  return [...new Map(rows.map((row) => [keyFn(row), row])).values()];
}

function tablePath(outDir: string, file: string): string {
  return path.join(outDir, "graph-reconciliation", file);
}

function quarantineRatio(candidates: number, quarantined: number): number {
  const total = candidates + quarantined;
  return total === 0 ? 0 : Number((quarantined / total).toFixed(4));
}

function writeJson(filePath: string, value: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function writeMarkdown(filePath: string, summary: Record<string, unknown>): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(
    filePath,
    [
      "# Runtime Layer Refresh Proof",
      "",
      `- Status: ${summary.status}`,
      `- Mode: ${summary.mode}`,
      `- Git SHA: ${summary.gitSha}`,
      `- Build version: ${summary.buildVersion}`,
      `- Input source version: ${summary.inputSourceVersion}`,
      `- Tenant scope: ${(summary.tenantScope as string[]).join(", ")}`,
      `- Canonical objects written: ${summary.canonicalObjectsWritten}`,
      `- Raw relationship edges written: ${summary.rawRelationshipEdgesWritten}`,
      `- Graph nodes written: ${summary.graphNodesWritten}`,
      `- Graph edges written: ${summary.graphEdgesWritten}`,
      `- Quarantined relationships held out: ${summary.quarantinedRelationships}`,
      `- Graph tables written: ${summary.graphTablesWritten}`,
      `- Product read models updated: ${summary.productReadModelsUpdated}`,
      "",
    ].join("\n"),
  );
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

async function runGraphReconciliation(args: Args, repoRoot: string): Promise<void> {
  const graphDir = path.resolve(repoRoot, args.outDir, "graph-reconciliation");
  const graphArgs = [
    "scripts/audit/tenant-graph-reconciliation.mjs",
    ...args.tenants.flatMap((tenant) => ["--tenant", tenant]),
    "--out",
    graphDir,
  ];
  const result = spawnSync(process.execPath, graphArgs, { cwd: repoRoot, encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout || "Graph reconciliation failed");
}

async function buildInputs(args: Args, repoRoot: string): Promise<{
  canonical: CanonicalDataBuildReport;
  nodes: CsvRow[];
  edges: CsvRow[];
  quarantine: CsvRow[];
}> {
  const canonical = await buildCanonicalTenantDataReport({
    repoRoot,
    tenantKeys: args.tenants,
  });
  await writeCanonicalTenantDataReport(repoRoot, path.join(args.outDir, "canonical-build"), canonical);
  await runGraphReconciliation(args, repoRoot);
  return {
    canonical,
    nodes: parseCsv(fs.readFileSync(tablePath(path.resolve(repoRoot, args.outDir), "graph-node-index.csv"), "utf8")),
    edges: parseCsv(fs.readFileSync(tablePath(path.resolve(repoRoot, args.outDir), "graph-edge-candidates.csv"), "utf8")),
    quarantine: parseCsv(fs.readFileSync(tablePath(path.resolve(repoRoot, args.outDir), "graph-quarantine.csv"), "utf8")),
  };
}

async function insertRows(
  client: Client,
  table: string,
  columns: string[],
  rows: unknown[][],
  conflict: string,
): Promise<void> {
  if (rows.length === 0) return;
  const batchSize = 250;
  for (let offset = 0; offset < rows.length; offset += batchSize) {
    const batch = rows.slice(offset, offset + batchSize);
    const values: unknown[] = [];
    const placeholders = batch
      .map((row, rowIndex) => {
        const cells = row.map((value, columnIndex) => {
          values.push(value);
          return `$${rowIndex * columns.length + columnIndex + 1}`;
        });
        return `(${cells.join(",")})`;
      })
      .join(",");
    await client.query(
      `INSERT INTO ${table} (${columns.join(",")}) VALUES ${placeholders} ${conflict}`,
      values,
    );
  }
}

async function writeToDatabase(args: Args, input: Awaited<ReturnType<typeof buildInputs>>): Promise<Record<string, number>> {
  if (process.env.RUNTIME_LAYER_REFRESH_WRITE_APPROVED !== "true") {
    throw new Error("Refusing write: set RUNTIME_LAYER_REFRESH_WRITE_APPROVED=true in the governed ACA job.");
  }
  const client = new Client({
    ...postgresClientOptions(databaseUrl(), "abarva-runtime-layer-refresh"),
  });
  const ratio = quarantineRatio(input.edges.length, input.quarantine.length);
  const runKey = `runtime-layer-refresh:${sha256(args.idempotencyKey)}`;
  const acceptedRecords = input.canonical.canonicalRecords.filter((record) => record.qualityStatus !== "quarantined");
  const nodeIdsUsed = new Set(input.edges.flatMap((edge) => [edge.fromNodeId, edge.toNodeId]).filter(Boolean));
  const materializedNodes = uniqueRowsBy(
    input.nodes.filter((node) => nodeIdsUsed.has(node.nodeId)),
    (node) => node.nodeId,
  );
  const startedAt = new Date().toISOString();

  try {
    await client.connect();
    await client.query("BEGIN");
    await client.query(
      `INSERT INTO intelligence_v6.layer_refresh_runs
        (run_key, tenant_scope, build_version, input_source_version, idempotency_key, git_sha, image_digest, status, started_at, progress, release_record)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'running',$8,$9::jsonb,$10)
       ON CONFLICT (run_key) DO UPDATE SET status='running', updated_at=now(), progress=excluded.progress`,
      [
        runKey,
        args.tenants,
        args.buildVersion,
        args.inputSourceVersion,
        args.idempotencyKey,
        gitSha(),
        process.env.ABARVA_OPERATOR_IMAGE_DIGEST ?? "",
        startedAt,
        JSON.stringify({ stage: "starting", tenants: args.tenants }),
        "docs/releases/records/2026-08-15-runtime-layer-refresh.md",
      ],
    );

    await insertRows(
      client,
      "intelligence_v6.relationship_types",
      [
        "relationship_type",
        "canonical_label",
        "inverse_relationship_type",
        "relationship_category",
        "directionality",
        "executive_safe",
        "allowed_from_object_families",
        "allowed_to_object_families",
        "description",
      ],
      relationshipDictionaryRows(),
      `ON CONFLICT (relationship_type) DO UPDATE SET
       canonical_label=excluded.canonical_label,
       inverse_relationship_type=excluded.inverse_relationship_type,
       relationship_category=excluded.relationship_category,
       directionality=excluded.directionality,
       executive_safe=excluded.executive_safe,
       allowed_from_object_families=excluded.allowed_from_object_families,
       allowed_to_object_families=excluded.allowed_to_object_families,
       description=excluded.description,
       active=true,
       updated_at=now()`,
    );

    await insertRows(
      client,
      "intelligence_v6.business_records",
      [
        "record_key",
        "tenant_key",
        "contract_version",
        "build_version",
        "input_source_version",
        "idempotency_key",
        "domain",
        "object_type",
        "source_object_id",
        "canonical_object_key",
        "display_name",
        "source_file",
        "source_row_number",
        "source_evidence_refs",
        "attributes",
        "relationships",
        "source_authority",
        "lineage",
        "sensitivity",
        "data_status",
        "quality_status",
        "fact_status",
        "blocked_claims",
        "quarantine_ratio",
        "metadata",
      ],
      acceptedRecords.map((record) => [
        recordKey(record),
        record.tenantKey,
        CONTRACT_VERSION,
        args.buildVersion,
        args.inputSourceVersion,
        args.idempotencyKey,
        record.domain,
        record.objectType,
        record.sourceObjectId,
        record.canonicalObjectKey ?? null,
        displayName(record),
        sourceFile(record),
        sourceRow(record),
        JSON.stringify(record.evidenceReferences),
        JSON.stringify(record.attributes),
        JSON.stringify(record.relationships),
        JSON.stringify(record.sourceAuthority),
        JSON.stringify(record.lineage),
        record.sensitivity,
        record.dataStatus,
        record.qualityStatus,
        factStatus(record),
        factStatus(record) === "blocked_conflict" ? ["promised_value_usd"] : [],
        ratio,
        JSON.stringify({ validationFindings: record.validationFindings ?? [] }),
      ]),
      `ON CONFLICT (tenant_key, contract_version, object_type, source_object_id)
       DO UPDATE SET build_version=excluded.build_version, input_source_version=excluded.input_source_version,
         idempotency_key=excluded.idempotency_key,
         attributes=excluded.attributes, relationships=excluded.relationships, source_evidence_refs=excluded.source_evidence_refs,
         quality_status=excluded.quality_status, fact_status=excluded.fact_status, blocked_claims=excluded.blocked_claims,
         quarantine_ratio=excluded.quarantine_ratio, metadata=excluded.metadata, updated_at=now()`,
    );

    await insertRows(
      client,
      "intelligence_v6.graph_nodes",
      [
        "node_key",
        "tenant_key",
        "contract_version",
        "node_id",
        "object_family",
        "business_display_name",
        "canonical_name",
        "source_file",
        "source_row_number",
        "source_evidence_refs",
        "confidence",
        "materialized_from",
        "metadata",
      ],
      materializedNodes.map((node) => [
        nodeKey(node.nodeId),
        node.tenantKey,
        CONTRACT_VERSION,
        node.nodeId,
        node.objectFamily,
        node.displayName,
        node.displayName.trim().toLowerCase(),
        node.sourceFile,
        Number(node.sourceRowNumber) || null,
        JSON.stringify([]),
        "medium",
        "v6_business_record",
        JSON.stringify({ mappingProfile: node.mappingProfile, buildVersion: args.buildVersion, quarantineRatio: ratio }),
      ]),
      `ON CONFLICT (node_key) DO UPDATE SET business_display_name=excluded.business_display_name,
       canonical_name=excluded.canonical_name, metadata=excluded.metadata, updated_at=now()`,
    );

    await insertRows(
      client,
      "intelligence_v6.relationship_edges",
      [
        "edge_key",
        "tenant_key",
        "contract_version",
        "build_version",
        "input_source_version",
        "idempotency_key",
        "relationship_id",
        "source_object_type",
        "source_object_name",
        "target_object_type",
        "target_object_name",
        "relationship_type",
        "relationship_confidence",
        "evidence_basis",
        "source_file",
        "source_row_number",
        "source_evidence_refs",
        "node_resolution_state",
        "quarantine_ratio",
        "metadata",
      ],
      input.edges.map((edge) => [
        edgeKey(edge),
        edge.tenantKey,
        CONTRACT_VERSION,
        args.buildVersion,
        args.inputSourceVersion,
        args.idempotencyKey,
        edge.relationshipId,
        edge.fromObjectType,
        edge.fromObjectName,
        edge.toObjectType,
        edge.toObjectName,
        edge.normalizedRelationshipType,
        confidence(edge.confidence),
        edge.evidenceBasis,
        `${edge.tenantKey}/current/12_relationships.csv`,
        Number(edge.sourceRowNumber) || null,
        JSON.stringify([edge.evidenceBasis].filter(Boolean)),
        "resolved",
        ratio,
        JSON.stringify({ fromNodeId: edge.fromNodeId, toNodeId: edge.toNodeId, rawRelationshipType: edge.rawRelationshipType }),
      ]),
      `ON CONFLICT (tenant_key, contract_version, relationship_id, source_file, source_row_number)
       DO UPDATE SET build_version=excluded.build_version, input_source_version=excluded.input_source_version,
       idempotency_key=excluded.idempotency_key,
       relationship_type=excluded.relationship_type, evidence_basis=excluded.evidence_basis,
       node_resolution_state=excluded.node_resolution_state, quarantine_ratio=excluded.quarantine_ratio,
       metadata=excluded.metadata, updated_at=now()`,
    );

    await insertRows(
      client,
      "intelligence_v6.graph_edges",
      [
        "edge_key",
        "tenant_key",
        "contract_version",
        "relationship_id",
        "from_node_id",
        "to_node_id",
        "from_node_key",
        "to_node_key",
        "from_object_family",
        "to_object_family",
        "relationship_type",
        "relationship_category",
        "relationship_confidence",
        "evidence_basis",
        "raw_relationship_type",
        "source_relationship_key",
        "source_file",
        "source_row_number",
        "source_evidence_refs",
        "node_resolution_state",
        "metadata",
      ],
      input.edges.map((edge) => [
        edgeKey(edge),
        edge.tenantKey,
        CONTRACT_VERSION,
        edge.relationshipId,
        edge.fromNodeId,
        edge.toNodeId,
        nodeKey(edge.fromNodeId),
        nodeKey(edge.toNodeId),
        edge.fromObjectType,
        edge.toObjectType,
        edge.normalizedRelationshipType,
        relationshipCategory(edge.normalizedRelationshipType),
        confidence(edge.confidence),
        edge.evidenceBasis,
        edge.rawRelationshipType,
        edge.relationshipId,
        `${edge.tenantKey}/current/12_relationships.csv`,
        Number(edge.sourceRowNumber) || null,
        JSON.stringify([edge.evidenceBasis].filter(Boolean)),
        "resolved",
        JSON.stringify({ buildVersion: args.buildVersion, quarantineRatio: ratio, knownGaps: edge.knownGaps }),
      ]),
      `ON CONFLICT (tenant_key, contract_version, relationship_id, source_file, source_row_number)
       DO UPDATE SET relationship_type=excluded.relationship_type, evidence_basis=excluded.evidence_basis,
       node_resolution_state=excluded.node_resolution_state, metadata=excluded.metadata, updated_at=now()`,
    );

    for (const tenant of args.tenants) {
      const tenantEdges = input.edges.filter((edge) => edge.tenantKey === tenant).length;
      const tenantQuarantine = input.quarantine.filter((edge) => edge.tenantKey === tenant).length;
      await client.query(
        `INSERT INTO intelligence_v6.graph_quality_reports
          (report_key, tenant_key, contract_version, graph_version, run_key, total_nodes, total_edges,
           explicit_node_count, inferred_node_count, orphan_edge_count, orphan_edge_rate,
           normalized_relationship_type_count, normalized_relationship_type_rate, evidence_coverage_rate,
           executive_readiness_score, quality_status, summary, findings, metadata)
         VALUES ($1,$2,$3,'v6-canonical-graph-v1',$4,$5,$6,$5,0,$7,$8,$9,1,1,$10,$11,$12,$13::jsonb,$14::jsonb)`,
        [
          `v6quality:${sha256([runKey, tenant].join("|"))}`,
          tenant,
          CONTRACT_VERSION,
          runKey,
          materializedNodes.filter((node) => node.tenantKey === tenant).length,
          tenantEdges,
          tenantQuarantine,
          quarantineRatio(tenantEdges, tenantQuarantine),
          new Set(input.edges.filter((edge) => edge.tenantKey === tenant).map((edge) => edge.normalizedRelationshipType)).size,
          tenantQuarantine === 0 ? 95 : 80,
          tenantQuarantine === 0 ? "exploratory" : "data_thin",
          `${tenantEdges} resolved graph edges materialized; ${tenantQuarantine} quarantined rows held out.`,
          JSON.stringify({ quarantinedRelationships: tenantQuarantine, quarantineRatio: quarantineRatio(tenantEdges, tenantQuarantine) }),
          JSON.stringify({ buildVersion: args.buildVersion, inputSourceVersion: args.inputSourceVersion }),
        ],
      );
    }

    const validation = await readback(client, args, {
      canonicalObjects: acceptedRecords.length,
      graphNodes: materializedNodes.length,
      graphEdges: input.edges.length,
    });
    await client.query(
      `UPDATE intelligence_v6.layer_refresh_runs
          SET status='succeeded', finished_at=now(), progress=$2::jsonb, validation=$3::jsonb,
              quality_gate=$4::jsonb, proof_bundle_uri=$5, updated_at=now()
        WHERE run_key=$1`,
      [
        runKey,
        JSON.stringify({ stage: "complete", canonicalObjects: acceptedRecords.length, graphEdges: input.edges.length }),
        JSON.stringify(validation),
        JSON.stringify({ graphTablesWritten: true, productReadModelsUpdated: false, quarantineRatio: ratio }),
        process.env.RUNTIME_LAYER_REFRESH_PROOF_BUNDLE_URI ?? args.outDir,
      ],
    );
    await client.query("COMMIT");
    return {
      canonicalObjectsWritten: acceptedRecords.length,
      rawRelationshipEdgesWritten: input.edges.length,
      graphNodesWritten: materializedNodes.length,
      graphEdgesWritten: input.edges.length,
      quarantinedRelationships: input.quarantine.length,
      validationFailures: validation.failures,
    };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    await client.end().catch(() => undefined);
  }
}

async function readback(
  client: Client,
  args: Args,
  expected: { canonicalObjects: number; graphNodes: number; graphEdges: number },
): Promise<{ counts: Record<string, number>; rls: Array<Record<string, unknown>>; failures: number }> {
  const count = async (sql: string, params: unknown[]): Promise<number> => {
    const result = await client.query<{ count: string }>(sql, params);
    return Number(result.rows[0]?.count ?? 0);
  };
  const counts = {
    businessRecords: await count(
      `SELECT count(*) FROM intelligence_v6.business_records
        WHERE tenant_key = ANY($1::text[])
          AND contract_version=$2
          AND build_version=$3
          AND input_source_version=$4
          AND idempotency_key=$5`,
      [args.tenants, CONTRACT_VERSION, args.buildVersion, args.inputSourceVersion, args.idempotencyKey],
    ),
    relationshipEdges: await count(
      `SELECT count(*) FROM intelligence_v6.relationship_edges
        WHERE tenant_key = ANY($1::text[])
          AND contract_version=$2
          AND build_version=$3
          AND input_source_version=$4
          AND idempotency_key=$5`,
      [args.tenants, CONTRACT_VERSION, args.buildVersion, args.inputSourceVersion, args.idempotencyKey],
    ),
    graphNodes: await count(
      `SELECT count(*) FROM intelligence_v6.graph_nodes
        WHERE tenant_key = ANY($1::text[])
          AND contract_version=$2
          AND metadata->>'buildVersion'=$3`,
      [args.tenants, CONTRACT_VERSION, args.buildVersion],
    ),
    graphEdges: await count(
      `SELECT count(*) FROM intelligence_v6.graph_edges
        WHERE tenant_key = ANY($1::text[])
          AND contract_version=$2
          AND metadata->>'buildVersion'=$3`,
      [args.tenants, CONTRACT_VERSION, args.buildVersion],
    ),
  };
  const rls = [];
  try {
    for (const tenant of args.tenants) {
      const otherTenants = args.tenants.filter((item) => item !== tenant);
      await client.query("RESET ROLE");
      const expectedTenantEdges = await count(
        `SELECT count(*) FROM intelligence_v6.graph_edges
          WHERE tenant_key = $1
            AND contract_version=$2
            AND metadata->>'buildVersion'=$3`,
        [tenant, CONTRACT_VERSION, args.buildVersion],
      );
      await client.query("SELECT set_config('app.tenant_key', $1, true)", [tenant]);
      await client.query("SELECT set_config('app.client_key', $1, true)", [tenant]);
      await client.query("SELECT set_config('request.jwt.claims', $1, true)", [
        JSON.stringify({ tenant_key: tenant, role: "observer", sub: "runtime-layer-refresh-readback" }),
      ]);
      await client.query("SET LOCAL ROLE authenticated");
      const visibleTenant = await count(
        `SELECT count(*) FROM intelligence_v6.graph_edges
          WHERE tenant_key = $1
            AND contract_version=$2
            AND metadata->>'buildVersion'=$3`,
        [tenant, CONTRACT_VERSION, args.buildVersion],
      );
      const visibleOther = await count(
        `SELECT count(*) FROM intelligence_v6.graph_edges
          WHERE tenant_key = ANY($1::text[])
            AND contract_version=$2
            AND metadata->>'buildVersion'=$3`,
        [otherTenants, CONTRACT_VERSION, args.buildVersion],
      );
      rls.push({
        tenant,
        visibleTenantRows: visibleTenant,
        expectedTenantRows: expectedTenantEdges,
        visibleOtherTenantRows: visibleOther,
        exercisedRole: "authenticated",
        status: visibleTenant === expectedTenantEdges && visibleOther === 0 ? "pass" : "fail",
      });
    }
  } finally {
    await client.query("RESET ROLE").catch(() => undefined);
  }
  const failures = [
    counts.businessRecords === expected.canonicalObjects,
    counts.relationshipEdges === expected.graphEdges,
    counts.graphNodes === expected.graphNodes,
    counts.graphEdges === expected.graphEdges,
    rls.every((row) => row.status === "pass"),
  ].filter((passed) => !passed).length;
  if (failures > 0) throw new Error(`Readback validation failed: ${JSON.stringify({ counts, expected, rls })}`);
  return { counts, rls, failures };
}

async function main(): Promise<void> {
  const repoRoot = path.resolve(__dirname, "../..");
  const args = parseArgs(process.argv.slice(2));
  assertScope(args.tenants);
  const absoluteOutDir = path.resolve(repoRoot, args.outDir);
  fs.rmSync(absoluteOutDir, { recursive: true, force: true });
  fs.mkdirSync(absoluteOutDir, { recursive: true });
  const input = await buildInputs(args, repoRoot);
  assertRelationshipTypesCovered(input.edges);
  const ratio = quarantineRatio(input.edges.length, input.quarantine.length);
  const planned = {
    canonicalObjectsWritten: input.canonical.canonicalRecords.filter((record) => record.qualityStatus !== "quarantined").length,
    rawRelationshipEdgesWritten: input.edges.length,
    graphNodesWritten: uniqueRowsBy(
      input.nodes.filter((node) =>
        new Set(input.edges.flatMap((edge) => [edge.fromNodeId, edge.toNodeId]).filter(Boolean)).has(node.nodeId),
      ),
      (node) => node.nodeId,
    ).length,
    graphEdgesWritten: input.edges.length,
    quarantinedRelationships: input.quarantine.length,
    validationFailures: 0,
  };
  const written = args.write ? await writeToDatabase(args, input) : planned;
  const summary = {
    generatedAt: new Date().toISOString(),
    status: "pass",
    mode: args.write ? "write" : "dry-run",
    gitSha: gitSha(),
    buildVersion: args.buildVersion,
    inputSourceVersion: args.inputSourceVersion,
    idempotencyKey: args.idempotencyKey,
    tenantScope: args.tenants,
    approvedScopeOnly: true,
    canonicalObjectsWritten: args.write ? written.canonicalObjectsWritten : 0,
    canonicalObjectsPlanned: planned.canonicalObjectsWritten,
    rawRelationshipEdgesWritten: args.write ? written.rawRelationshipEdgesWritten : 0,
    rawRelationshipEdgesPlanned: planned.rawRelationshipEdgesWritten,
    graphNodesWritten: args.write ? written.graphNodesWritten : 0,
    graphNodesPlanned: planned.graphNodesWritten,
    graphEdgesWritten: args.write ? written.graphEdgesWritten : 0,
    graphEdgesPlanned: planned.graphEdgesWritten,
    quarantinedRelationships: input.quarantine.length,
    quarantineRatio: ratio,
    graphTablesWritten: args.write,
    productReadModelsUpdated: false,
    note:
      "Layer 3 canonical and graph materialization only. Layer 4 projections, retrieval indexing, and runtime answers are separate steps.",
  };
  writeJson(path.join(absoluteOutDir, "summary.json"), summary);
  writeMarkdown(path.join(absoluteOutDir, "summary.md"), summary);
  if (args.emitProofBundle) emitProofBundle(absoluteOutDir);
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exitCode = 1;
});
