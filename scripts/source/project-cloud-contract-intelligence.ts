import fs from "node:fs";
import path from "node:path";

import {
  buildCloudContractIntelligenceRecords,
  type CloudContractIntelligencePackageInput,
} from "../../src/lib/source/contract-intelligence/cloud-adapter";
import type { CsvRecord } from "../../src/lib/source/contract-depth-package/projection";

function argument(name: string, fallback: string): string {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length) ?? fallback;
}

function parseCsv(content: string): CsvRecord[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];
    const next = content[index + 1];
    if (quoted) {
      if (char === '"' && next === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (char !== "\r") {
      cell += char;
    }
  }
  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }
  const headers = rows[0] ?? [];
  return rows.slice(1).filter((candidate) => candidate.some(Boolean)).map((values, index) => {
    if (values.length !== headers.length) {
      throw new Error(`Malformed CSV at row ${index + 2}: expected ${headers.length} fields, got ${values.length}`);
    }
    return Object.fromEntries(headers.map((header, headerIndex) => [header, values[headerIndex] ?? ""]));
  });
}

function readCsv(sourceDir: string, fileName: string): CsvRecord[] {
  const filePath = path.join(sourceDir, fileName);
  return fs.existsSync(filePath) ? parseCsv(fs.readFileSync(filePath, "utf8")) : [];
}

function main(): void {
  const packageDir = argument(
    "package-dir",
    "datasets/source/cloud-consumption/meridian-databricks-consumption-commit-v1-20260908",
  );
  const sourceDir = path.join(packageDir, "source-files");
  const outDir = argument("out-dir", path.join(packageDir, "qa", "contract-intelligence"));
  const input: CloudContractIntelligencePackageInput = {
    contracts: readCsv(sourceDir, "cloud_contract_register.csv"),
    applicationScope: readCsv(sourceDir, "cmdb_application_scope.csv"),
    contractClauses: readCsv(sourceDir, "contract_clauses.csv"),
    evidenceManifest: readCsv(sourceDir, "evidence_manifest.csv"),
    monthlySpend: readCsv(sourceDir, "monthly_spend.csv"),
    serviceUsage: readCsv(sourceDir, "cloud_service_usage_monthly.csv"),
    commitmentCoverage: readCsv(sourceDir, "cloud_commitment_coverage_monthly.csv"),
    apReconciliation: readCsv(sourceDir, "cloud_ap_invoice_reconciliation.csv"),
    resourceInventory: readCsv(sourceDir, "cloud_resource_inventory.csv"),
    optimizationOpportunities: readCsv(sourceDir, "optimization_opportunities.csv"),
  };
  const records = buildCloudContractIntelligenceRecords(input);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "contract-intelligence.json"), `${JSON.stringify(records, null, 2)}\n`);
  fs.writeFileSync(path.join(outDir, "summary.json"), `${JSON.stringify({
    status: "PASS",
    contracts: records.length,
    records: records.map((record) => ({
      contractId: record.contractId,
      reviewStatus: record.review.status,
      archetype: record.contract.archetypeLabel,
      purpose: record.story.purpose,
      scope: record.story.scope,
      levers: record.levers.length,
      evidenceLanes: record.evidenceLanes.map((lane) => ({ key: lane.key, state: lane.state, rows: lane.rowCount })),
      sourceRefs: record.provenance.sourceRefs.length,
    })),
  }, null, 2)}\n`);
}

main();
