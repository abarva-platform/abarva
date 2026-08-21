#!/usr/bin/env tsx
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

import { buildCanonicalTenantDataReport } from "../../src/lib/enterprise-data/canonical-build/canonical-tenant-data-build";
import type { CanonicalIngestionRecord } from "../../src/lib/enterprise-data/contracts/canonical-ingestion";

type ProductKey = "home" | "source" | "tower" | "moves" | "intelligence";
type Args = {
  outDir: string;
  tenants: string[];
  buildVersion: string;
  inputSourceVersion: string;
  writeRequested: boolean;
};

const PRODUCT_OBJECTS: Record<ProductKey, string[]> = {
  home: [
    "tenant_profile",
    "business_function",
    "org_owner",
    "workforce_role",
    "person_or_role",
    "application_system",
    "data_asset_or_integration",
    "data_domain",
    "infrastructure_platform",
    "vendor_contract",
    "spend_value_fact",
    "program_initiative",
    "ai_automation_use_case",
    "risk_or_control",
    "metric_outcome",
    "platform_maturity_assessment",
    "service_performance_observation",
  ],
  source: [
    "vendor_contract",
    "managed_service_scope",
    "application_system",
    "data_domain",
    "service_performance_observation",
    "operational_process_evidence",
  ],
  tower: [
    "spend_value_fact",
    "program_initiative",
    "ai_automation_use_case",
    "metric_outcome",
    "ai_value_realization_signal",
    "ai_tool_usage_observation",
    "ai_kpi_outcome_observation",
    "platform_maturity_assessment",
    "service_performance_observation",
  ],
  moves: [
    "program_initiative",
    "operational_process_evidence",
    "person_or_role",
    "risk_or_control",
    "relationship_source_row",
    "metric_outcome",
    "ai_automation_use_case",
  ],
  intelligence: [
    "evidence_source",
    "industry_context_pattern",
    "expert_lens",
    "semantic_crosswalk_evidence",
    "ai_value_interview_evidence",
    "data_domain",
    "person_or_role",
    "relationship_source_row",
  ],
};

function parseArgs(argv: string[]): Args {
  const tenants: string[] = [];
  const values = new Map<string, string>();
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--tenant") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error("--tenant requires a value");
      tenants.push(value);
      index += 1;
      continue;
    }
    if (!arg.startsWith("--")) continue;
    const [key, inlineValue] = arg.slice(2).split("=", 2);
    if (inlineValue !== undefined) values.set(key, inlineValue);
    else {
      const next = argv[index + 1];
      if (next && !next.startsWith("--")) {
        values.set(key, next);
        index += 1;
      } else {
        values.set(key, "true");
      }
    }
  }
  const git = gitSha();
  return {
    outDir: path.resolve(process.cwd(), values.get("out-dir") ?? "reports/product-fanout/latest"),
    tenants,
    buildVersion: values.get("build-version") ?? `product-fanout-${git.slice(0, 9)}`,
    inputSourceVersion: values.get("input-source-version") ?? git,
    writeRequested: values.has("write"),
  };
}

function gitSha(): string {
  const result = spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" });
  return result.status === 0 ? result.stdout.trim() : "unknown";
}

function attr(record: CanonicalIngestionRecord, name: string): unknown {
  return record.attributes[name]?.value;
}

function displayName(record: CanonicalIngestionRecord): string {
  return String(attr(record, "displayName") ?? record.canonicalObjectKey ?? record.sourceObjectId);
}

function recordsForProduct(records: CanonicalIngestionRecord[], product: ProductKey): CanonicalIngestionRecord[] {
  const types = new Set(PRODUCT_OBJECTS[product]);
  return records.filter((record) => record.qualityStatus !== "quarantined" && types.has(record.objectType));
}

function productsForRecord(record: CanonicalIngestionRecord): ProductKey[] {
  return (Object.keys(PRODUCT_OBJECTS) as ProductKey[]).filter((product) =>
    PRODUCT_OBJECTS[product].includes(record.objectType),
  );
}

function buildProductRows(records: CanonicalIngestionRecord[], product: ProductKey) {
  return recordsForProduct(records, product).map((record) => ({
    tenantKey: record.tenantKey,
    product,
    objectType: record.objectType,
    sourceObjectId: record.sourceObjectId,
    canonicalObjectKey: record.canonicalObjectKey,
    displayName: displayName(record),
    sourcePath: attr(record, "sourcePath"),
    sourceRowNumber: attr(record, "sourceRowNumber"),
    evidenceCount: record.evidenceReferences.length,
    relationshipCount: record.relationships.length,
    qualityStatus: record.qualityStatus,
  }));
}

function summarizeProjectedRows(rows: Array<{ objectType: string }>): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const row of rows) counts[row.objectType] = (counts[row.objectType] ?? 0) + 1;
  return Object.fromEntries(Object.entries(counts).sort(([left], [right]) => left.localeCompare(right)));
}

function writeJson(filePath: string, value: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function writeMarkdown(filePath: string, summary: Record<string, unknown>): void {
  const productSummaries = summary.productSummaries as Array<{
    product: ProductKey;
    rows: number;
    byObjectType: Record<string, number>;
  }>;
  const lines = [
    "# Product Fanout From Canonical Dry Run",
    "",
    `- Status: ${summary.status}`,
    `- Mode: ${summary.mode}`,
    `- Git SHA: \`${summary.gitSha}\``,
    `- Build version: \`${summary.buildVersion}\``,
    `- Input source version: \`${summary.inputSourceVersion}\``,
    `- Canonical records read: ${summary.canonicalRecordsRead}`,
    `- Canonical records projected to at least one product: ${summary.canonicalRecordsProjected}`,
    `- Unprojected canonical records: ${summary.unprojectedCanonicalRecords}`,
    `- Writes performed: ${summary.writesPerformed}`,
    "",
    "| Product | Projected rows | Object types |",
    "| --- | ---: | --- |",
    ...productSummaries.map(
      (item) =>
        `| ${item.product} | ${item.rows.toLocaleString()} | ${Object.entries(item.byObjectType)
          .map(([type, count]) => `${type}:${count}`)
          .join(", ")} |`,
    ),
    "",
    "## Canonical Coverage",
    "",
    `- Status: ${summary.unprojectedCanonicalRecords === 0 ? "all canonical records have a product route" : "canonical records missing product routes"}`,
    `- Unprojected by object type: ${Object.entries(summary.unprojectedByObjectType as Record<string, number>)
      .map(([type, count]) => `${type}:${count}`)
      .join(", ") || "none"}`,
    "",
    "## Boundary",
    "",
    "- Dry-run product projection only.",
    "- No product read-model writes.",
    "- No cube refresh/readback.",
    "- No retrieval indexing.",
    "",
  ];
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${lines.join("\n")}\n`);
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  if (args.writeRequested) throw new Error("Product fanout dry-run refuses direct writes.");
  fs.rmSync(args.outDir, { recursive: true, force: true });
  fs.mkdirSync(args.outDir, { recursive: true });
  const canonical = await buildCanonicalTenantDataReport({
    repoRoot: process.cwd(),
    outputDir: path.join(args.outDir, "canonical-build"),
    tenantKeys: args.tenants.length > 0 ? args.tenants : undefined,
  });
  const records = canonical.canonicalRecords.filter((record) => record.qualityStatus !== "quarantined");
  const productSummaries = (Object.keys(PRODUCT_OBJECTS) as ProductKey[]).map((product) => {
    const rows = buildProductRows(records, product);
    writeJson(path.join(args.outDir, `${product}-projection.json`), rows);
    return {
      product,
      rows: rows.length,
      byObjectType: summarizeProjectedRows(rows),
    };
  });
  const productRouteCounts = records.map((record) => ({ record, products: productsForRecord(record) }));
  const unprojectedRecords = productRouteCounts
    .filter((item) => item.products.length === 0)
    .map((item) => item.record);
  const summary = {
    generatedAt: new Date().toISOString(),
    status: unprojectedRecords.length === 0 ? "pass" : "fail",
    mode: "dry-run",
    gitSha: gitSha(),
    buildVersion: args.buildVersion,
    inputSourceVersion: args.inputSourceVersion,
    tenantScope: canonical.tenants.map((tenant) => tenant.tenantKey),
    canonicalRecordsRead: records.length,
    canonicalRecordsProjected: records.length - unprojectedRecords.length,
    unprojectedCanonicalRecords: unprojectedRecords.length,
    unprojectedByObjectType: summarizeProjectedRows(unprojectedRecords),
    productSummaries,
    writesPerformed: false,
    productReadModelsUpdated: false,
    cubeViewsVerified: false,
  };
  writeJson(path.join(args.outDir, "summary.json"), summary);
  writeMarkdown(path.join(args.outDir, "summary.md"), summary);
  console.log(JSON.stringify(summary, null, 2));
  if (unprojectedRecords.length > 0) {
    throw new Error(
      `Product fanout missing routes for ${unprojectedRecords.length} canonical records. See ${path.join(
        args.outDir,
        "summary.json",
      )}.`,
    );
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exitCode = 1;
});
