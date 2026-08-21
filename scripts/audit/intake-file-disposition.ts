#!/usr/bin/env tsx
import fs from "node:fs";
import path from "node:path";

import { buildCanonicalTenantDataReport } from "../../src/lib/enterprise-data/canonical-build/canonical-tenant-data-build";

type IntakeFileRole =
  | "canonical_entity"
  | "canonical_relationship"
  | "metric_observation"
  | "evidence_only"
  | "reference_configuration"
  | "non_ingestible_guide"
  | "quarantine";

type Args = {
  outDir: string;
  strict: boolean;
  pilotGate: boolean;
};

type Registry = {
  activeTenants: Array<{
    tenantKey: string;
    canonicalInputRoot: string;
  }>;
};

type FileDisposition = {
  tenantKey: string;
  file: string;
  role: IntakeFileRole;
  canonicalDisposition: string;
  rowCount: number;
  blockedRowDisposition:
    | "not_blocked"
    | "intentionally_excluded_support"
    | "evidence_only_pending_adapter"
    | "pending_mapping"
    | "quarantine";
  productGateImpact: "none" | "pilot_scope_gap" | "support_only";
  rationale: string;
};

const TRUE_VALUES = new Set(["1", "true", "yes"]);
const REGISTRY_PATH = "datasets/tenant-inputs/tenant-input-registry.json";

function parseArgs(argv: readonly string[]): Args {
  const value = (name: string): string | undefined => {
    const index = argv.indexOf(name);
    const next = argv[index + 1];
    return index === -1 || !next || next.startsWith("--") ? undefined : next;
  };
  return {
    outDir: value("--out-dir") ?? "reports/intake-file-disposition/latest",
    strict: argv.includes("--strict") || TRUE_VALUES.has(String(process.env.INTAKE_FILE_DISPOSITION_STRICT ?? "").toLowerCase()),
    pilotGate:
      argv.includes("--pilot-gate") ||
      TRUE_VALUES.has(String(process.env.INTAKE_FILE_DISPOSITION_PILOT_GATE ?? "").toLowerCase()),
  };
}

function parseCsvRowCount(filePath: string): number {
  const text = fs.readFileSync(filePath, "utf8");
  let rows = 0;
  let hasValue = false;
  let inQuotes = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && inQuotes && next === '"') {
      index += 1;
      hasValue = true;
      continue;
    }
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      if (hasValue) rows += 1;
      hasValue = false;
      continue;
    }
    if (char.trim()) hasValue = true;
  }
  if (hasValue) rows += 1;
  return Math.max(0, rows - 1);
}

function walkCsvFiles(root: string): string[] {
  const files: string[] = [];
  const visit = (dir: string): void => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) visit(fullPath);
      else if (entry.isFile() && entry.name.endsWith(".csv")) files.push(fullPath);
    }
  };
  visit(root);
  return files.sort();
}

function classifyFile(relativePath: string): { role: IntakeFileRole; rationale: string } {
  const file = relativePath.replace(/\\/g, "/");
  const base = path.basename(file);
  if (base.startsWith("00_GUIDE_")) {
    return {
      role: "non_ingestible_guide",
      rationale: "Operator/user guidance; it should not become canonical product context.",
    };
  }
  if (file.startsWith("extracts/")) {
    return {
      role: "metric_observation",
      rationale: "Raw system extract; promote through an adapter into metric or operational observations.",
    };
  }
  if (base === "01b_business_segments.csv") {
    return {
      role: "canonical_entity",
      rationale: "Business segments are structural enterprise entities or crosswalk anchors.",
    };
  }
  if (base === "05_data_assets_integrations.csv" || base === "12_relationships.csv") {
    return {
      role: "canonical_relationship",
      rationale: "Relationship-bearing source used to materialize topology and graph edges.",
    };
  }
  if (base === "12b_interview_initiative_metric_crosswalk.csv") {
    return {
      role: "canonical_relationship",
      rationale: "Explicit interview-to-initiative/metric crosswalk.",
    };
  }
  if (base === "13_evidence_sources.csv") {
    return {
      role: "evidence_only",
      rationale: "Evidence registry; supports lineage and citations rather than product-owned facts.",
    };
  }
  if (
    base === "14_metrics_outcomes.csv" ||
    base === "19_data_analytics_platform_maturity.csv" ||
    base === "20_itsm_ticket_sla_performance.csv" ||
    base.startsWith("SA08_") ||
    base.startsWith("SA09_") ||
    base.startsWith("SA11_")
  ) {
    return {
      role: "metric_observation",
      rationale: "Observed metric, usage, maturity, or operational outcome feed.",
    };
  }
  if (base.startsWith("SA10_")) {
    return {
      role: "evidence_only",
      rationale: "Stakeholder interview evidence; downstream interpretation belongs in approved overlays.",
    };
  }
  if (base === "15_industry_context_patterns.csv" || base === "16_expert_lenses.csv") {
    return {
      role: "reference_configuration",
      rationale: "Reference context/lens used to guide interpretation, not a client-recorded transaction.",
    };
  }
  if (/^(00_enterprise_profile|01_business_functions|02_org_ownership|03_workforce_roles|04_applications_systems|06_infrastructure_platforms|07_vendors_contracts|08_spend_value|09_programs_initiatives|10_ai_automation_use_cases|11_risks_controls|17_service_scope_managed_services|18_operational_process_evidence)\.csv$/.test(base)) {
    return {
      role: "canonical_entity",
      rationale: "Declared source table for canonical enterprise entities or facts.",
    };
  }
  return {
    role: "quarantine",
    rationale: "No declared intake role matched this file.",
  };
}

function blockedDisposition(role: IntakeFileRole, canonicalDisposition: string): FileDisposition["blockedRowDisposition"] {
  if (canonicalDisposition === "integrated" || canonicalDisposition === "no_rows") return "not_blocked";
  if (role === "non_ingestible_guide" || role === "reference_configuration") return "intentionally_excluded_support";
  if (role === "evidence_only") return "evidence_only_pending_adapter";
  if (role === "quarantine") return "quarantine";
  return "pending_mapping";
}

function productGateImpact(disposition: FileDisposition["blockedRowDisposition"]): FileDisposition["productGateImpact"] {
  if (disposition === "not_blocked" || disposition === "intentionally_excluded_support") return "none";
  if (disposition === "evidence_only_pending_adapter") return "support_only";
  return "pilot_scope_gap";
}

function writeJson(filePath: string, value: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function writeMarkdown(
  filePath: string,
  summary: Record<string, unknown>,
  rows: readonly FileDisposition[],
): void {
  const lines = [
    "# Intake File Disposition Audit",
    "",
    `- Role-disposition status: ${summary.roleDispositionStatus}`,
    `- Pilot-gate status: ${summary.pilotGateStatus}`,
    `- Active files: ${summary.activeFiles}`,
    `- Source rows: ${summary.sourceRows}`,
    `- Unclassified files: ${summary.unclassifiedFiles}`,
    `- Blocked rows: ${summary.blockedRows}`,
    `- Pilot-scope blocked rows: ${summary.pilotScopeBlockedRows}`,
    "",
    "| Tenant | File | Role | Rows | Canonical disposition | Blocked-row disposition | Gate impact |",
    "| --- | --- | ---: | ---: | --- | --- | --- |",
    ...rows.map(
      (row) =>
        `| ${row.tenantKey} | ${row.file} | ${row.role} | ${row.rowCount} | ${row.canonicalDisposition} | ${row.blockedRowDisposition} | ${row.productGateImpact} |`,
    ),
    "",
  ];
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${lines.join("\n")}\n`);
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf8")) as Registry;
  const canonical = await buildCanonicalTenantDataReport({ repoRoot: process.cwd() });
  const coverageByPath = new Map(
    canonical.sourceIntegrationCoverage.map((row) => [row.sourcePath, row]),
  );
  const rows: FileDisposition[] = [];

  for (const tenant of registry.activeTenants) {
    const files = walkCsvFiles(tenant.canonicalInputRoot);
    for (const filePath of files) {
      const relativePath = path.relative(tenant.canonicalInputRoot, filePath).replace(/\\/g, "/");
      const repoPath = path.relative(process.cwd(), filePath).replace(/\\/g, "/");
      const classification = classifyFile(relativePath);
      const coverage = coverageByPath.get(repoPath);
      const rowCount = coverage?.sourceRows ?? parseCsvRowCount(filePath);
      const canonicalDisposition = coverage?.disposition ?? "not_seen_by_canonical_build";
      const blockedRowDisposition = blockedDisposition(classification.role, canonicalDisposition);
      rows.push({
        tenantKey: tenant.tenantKey,
        file: relativePath,
        role: classification.role,
        canonicalDisposition,
        rowCount,
        blockedRowDisposition,
        productGateImpact: productGateImpact(blockedRowDisposition),
        rationale: classification.rationale,
      });
    }
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    roleDispositionStatus: rows.every((row) => row.role !== "quarantine") ? "pass" : "fail",
    activeFiles: rows.length,
    sourceRows: rows.reduce((sum, row) => sum + row.rowCount, 0),
    unclassifiedFiles: rows.filter((row) => row.role === "quarantine").length,
    blockedRows: rows
      .filter((row) => row.blockedRowDisposition !== "not_blocked")
      .reduce((sum, row) => sum + row.rowCount, 0),
    blockedRowsByDisposition: rows.reduce<Record<string, number>>((acc, row) => {
      if (row.blockedRowDisposition !== "not_blocked") {
        acc[row.blockedRowDisposition] = (acc[row.blockedRowDisposition] ?? 0) + row.rowCount;
      }
      return acc;
    }, {}),
    pilotScopeBlockedRows: rows
      .filter((row) => row.productGateImpact === "pilot_scope_gap")
      .reduce((sum, row) => sum + row.rowCount, 0),
    roleCounts: rows.reduce<Record<string, number>>((acc, row) => {
      acc[row.role] = (acc[row.role] ?? 0) + 1;
      return acc;
    }, {}),
  };
  const summaryWithGate = {
    ...summary,
    pilotGateStatus:
      summary.unclassifiedFiles > 0
        ? "blocked_unclassified_files"
        : summary.pilotScopeBlockedRows > 0
          ? "blocked_pending_mapping"
          : "pass",
  };

  writeJson(path.join(args.outDir, "summary.json"), summaryWithGate);
  writeJson(path.join(args.outDir, "file-dispositions.json"), rows);
  writeMarkdown(path.join(args.outDir, "README.md"), summaryWithGate, rows);
  console.log(JSON.stringify(summaryWithGate, null, 2));

  if (args.strict && summary.unclassifiedFiles > 0) {
    throw new Error(`Unclassified intake files: ${summary.unclassifiedFiles}`);
  }
  if (args.pilotGate && summary.pilotScopeBlockedRows > 0) {
    throw new Error(`Pilot-scope blocked rows remain: ${summary.pilotScopeBlockedRows}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exitCode = 1;
});
