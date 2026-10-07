import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import Papa from "papaparse";
import {
  formatGovernedPerformanceActual,
  governedPercentPerformanceValue,
  performanceMeasureFromSource,
  selectGovernedPercentTrend,
} from "../../../src/lib/source/contract-intelligence/performance-units";

describe("Source contract depth package loader", () => {
  it("keeps time and backlog measures out of the percentage scale", () => {
    expect(performanceMeasureFromSource("critical_incident_response_minutes", "35", "30")).toEqual({
      unit: "minutes",
      actual: 35,
      target: 30,
      actualText: "35 min",
      targetText: "30 min",
    });
    expect(performanceMeasureFromSource("p1_p2_resolution_hours", "0.8", "8")).toMatchObject({
      unit: "hours",
      actual: 0.8,
      actualText: "0.8 hr",
    });
    expect(performanceMeasureFromSource("problem_backlog_older_30_days", "12", "12")).toMatchObject({
      unit: "count",
      actual: 12,
      actualText: "12",
    });
    expect(performanceMeasureFromSource("batch_completion_by_7am_pct", "0.98", "98")).toMatchObject({
      unit: "%",
      actual: 98,
      actualText: "98.0%",
    });
  });

  it("refuses unknown or contradictory source units", () => {
    expect(() => performanceMeasureFromSource("unknown_sla", "4", "5")).toThrow(/unit/i);
    expect(() => performanceMeasureFromSource("critical_incident_response_minutes", "35", "30", "%"))
      .toThrow(/unit/i);
  });

  it("does not relabel previously misloaded canonical rows as time or count", () => {
    expect(formatGovernedPerformanceActual({
      metricName: "critical_incident_response_minutes",
      unit: "%",
      actualValue: "35.0%",
      valueNum: 35,
    })).toBe("Unit needs review");
    expect(formatGovernedPerformanceActual({
      metricName: "critical_incident_response_minutes",
      unit: "minutes",
      actualValue: "35 min",
      valueNum: 35,
    })).toBe("35 min");
  });

  it("admits only valid percent observations to a percent trend", () => {
    expect(governedPercentPerformanceValue({
      metricName: "batch_completion_by_7am_pct",
      unit: "%",
      actualValue: "98.0%",
      valueNum: 98,
    })).toBe(98);
    expect(governedPercentPerformanceValue({
      metricName: "batch_completion_by_7am_pct",
      unit: "%",
      actualValue: "0.98",
      valueNum: 0.98,
    })).toBe(98);
    expect(governedPercentPerformanceValue({
      metricName: "critical_incident_response_minutes",
      unit: "%",
      actualValue: "35.0%",
      valueNum: 35,
    })).toBeNull();
    expect(governedPercentPerformanceValue({
      metricName: "critical_incident_response_minutes",
      unit: "minutes",
      actualValue: "35 min",
      valueNum: 35,
    })).toBeNull();
  });

  it("charts one named metric across periods, never a mixture of SLA units", () => {
    const rows = [
      { metric_name: "critical_incident_response_minutes", unit: "%", actual_value: "35.0%", value_num: 35, period_start: "2026-07-01" },
      { metric_name: "batch_completion_by_7am_pct", unit: "%", actual_value: "98.0%", value_num: 98, period_start: "2026-07-01" },
      { metric_name: "change_success_rate_pct", unit: "%", actual_value: "95.0%", value_num: 95, period_start: "2026-07-01" },
      { metric_name: "batch_completion_by_7am_pct", unit: "%", actual_value: "99.0%", value_num: 99, period_start: "2026-08-01" },
    ];
    const trend = selectGovernedPercentTrend(rows);
    expect(trend?.metricName).toBe("batch_completion_by_7am_pct");
    expect(trend?.points.map((point) => point.actual)).toEqual([98, 99]);
    expect(trend?.points.map((point) => point.row.period_start)).toEqual(["2026-07-01", "2026-08-01"]);
    expect(selectGovernedPercentTrend(rows.slice(0, 3))).toBeNull();
  });

  it("persists the resolved unit and repairs it on a separately authorized reload", () => {
    const loader = fs.readFileSync(
      path.resolve(__dirname, "../load-contract-depth-package.ts"),
      "utf8",
    );
    const start = loader.indexOf("async function upsertPerformance(");
    const upsert = loader.slice(start, loader.indexOf("async function upsert", start + 1));
    expect(upsert).toContain("performanceMeasureFromSource(");
    expect(upsert).toContain("measure.unit,");
    expect(upsert).toContain("unit = EXCLUDED.unit");
    expect(upsert).not.toContain("$10, '%'");
  });

  it("validates performance units during preflight, before a layer can be applied", () => {
    const loader = fs.readFileSync(
      path.resolve(__dirname, "../load-contract-depth-package.ts"),
      "utf8",
    );
    const main = loader.slice(loader.indexOf("async function main():"));
    const validation = main.indexOf("for (const row of sourceFiles.slaPerformance)");
    expect(validation).toBeGreaterThan(0);
    expect(main.slice(validation)).toContain("performanceMeasureFromSource(");
    expect(validation).toBeLessThan(main.indexOf("if (args.mode === \"plan\")"));
    expect(validation).toBeLessThan(main.indexOf("const result = await withClient("));
  });

  it("resolves every performance fixture with this loader's source columns", () => {
    const packages = path.resolve(__dirname, "../../../datasets/source/contract-depth");
    let checked = 0;
    for (const packageName of fs.readdirSync(packages)) {
      const file = path.join(packages, packageName, "source-files/sla_performance.csv");
      if (!fs.existsSync(file)) continue;
      const parsed = Papa.parse<Record<string, string>>(fs.readFileSync(file, "utf8"), {
        header: true,
        skipEmptyLines: true,
      });
      expect(parsed.errors).toEqual([]);
      if (!parsed.meta.fields?.includes("metric_name")) continue;
      for (const row of parsed.data) {
        expect(() => performanceMeasureFromSource(
          row.metric_name,
          row.actual_result_pct,
          row.committed_threshold_pct,
          row.unit,
        )).not.toThrow();
        checked += 1;
      }
    }
    expect(checked).toBeGreaterThan(0);
  });

  it("preserves explicit performance and ticket periods before month fallback", () => {
    const repoRoot = path.resolve(__dirname, "../../..");
    const loader = fs.readFileSync(
      path.join(repoRoot, "scripts/source/load-contract-depth-package.ts"),
      "utf8",
    );

    const normalizedLoader = loader.replace(/\s+/g, " ");

    expect(normalizedLoader).toContain(
      'stringValue(row, "period_start") || monthStart(stringValue(row, "month"))',
    );
    expect(normalizedLoader).toContain(
      'stringValue(row, "period_end") || monthEnd(stringValue(row, "month"))',
    );
  });

  it("preserves dense spend fields and supports the legacy spend aliases", () => {
    const repoRoot = path.resolve(__dirname, "../../..");
    const loader = fs.readFileSync(
      path.join(repoRoot, "scripts/source/load-contract-depth-package.ts"),
      "utf8",
    );

    expect(loader).toContain(
      'stringValue(row, "actual_spend_usd") || stringValue(row, "spend_usd")',
    );
    expect(loader).toContain(
      'stringValue(row, "invoice_amount_usd") || stringValue(row, "spend_usd")',
    );
    expect(loader).toContain(
      'stringValue(row, "committed_base_amount_usd") ||',
    );
  });

  it("preserves dense opportunity fields and supports legacy opportunity aliases", () => {
    const repoRoot = path.resolve(__dirname, "../../..");
    const loader = fs.readFileSync(
      path.join(repoRoot, "scripts/source/load-contract-depth-package.ts"),
      "utf8",
    );

    expect(loader).toContain(
      'stringValue(row, "opportunity_type") || stringValue(row, "value_type")',
    );
    expect(loader).toContain('stringValue(row, "annual_value_usd") ||');
    expect(loader).toContain(
      'stringValue(row, "evidence_family") || stringValue(row, "value_type")',
    );
    expect(loader.replace(/\s+/g, " ")).toContain(
      'stringValue(row, "recommended_action") || stringValue(row, "next_action")',
    );
    expect(loader.replace(/\s+/g, " ")).toContain(
      'vendor_concession: stringValue(opportunity, "vendor_concession") || stringValue(opportunity, "vendor_give")',
    );
  });

  it("preserves explicit SLA credit and change-order fields before legacy fallbacks", () => {
    const repoRoot = path.resolve(__dirname, "../../..");
    const loader = fs.readFileSync(
      path.join(repoRoot, "scripts/source/load-contract-depth-package.ts"),
      "utf8",
    );

    expect(loader).toContain(
      'stringValue(row, "credit_owed_usd") ||\n        stringValue(row, "credit_amount_usd") ||',
    );
    expect(loader).toContain('stringValue(row, "recurring") || "false"');
    expect(loader).toContain(
      'stringValue(row, "annualized_spend_usd") ||\n          stringValue(row, "value_impact_usd")',
    );
    expect(loader).not.toContain('credit_owed_usd: "0"');
    expect(loader).not.toContain('recurring: "false"');
  });

  it("reconciles package-owned canonical facts before rebuilding Layer 3", () => {
    const repoRoot = path.resolve(__dirname, "../../..");
    const loader = fs.readFileSync(
      path.join(repoRoot, "scripts/source/load-contract-depth-package.ts"),
      "utf8",
    );

    expect(loader).toContain("reconcileCanonicalFactsForPackage");
    expect(loader).toContain("source_system = $3");
    expect(loader).toContain("contract_id = ANY($4::text[])");
  });

  it("preserves explicit pricing bridge fields and supports legacy aliases", () => {
    const repoRoot = path.resolve(__dirname, "../../..");
    const loader = fs.readFileSync(
      path.join(repoRoot, "scripts/source/load-contract-depth-package.ts"),
      "utf8",
    );

    expect(loader).toContain(
      'stringValue(row, "bridge_component") || stringValue(row, "scenario")',
    );
    expect(loader).toContain('stringValue(row, "amount_usd") ||');
  });

  it("reuses one package load run across Layer 2 and Layer 3 phases", () => {
    const repoRoot = path.resolve(__dirname, "../../..");
    const loader = fs.readFileSync(
      path.join(repoRoot, "scripts/source/load-contract-depth-package.ts"),
      "utf8",
    );
    const migration = fs.readFileSync(
      path.join(
        repoRoot,
        "supabase/migrations/20260828184000_source_contract_depth_package_layer2.sql",
      ),
      "utf8",
    );

    expect(migration).toContain(
      "UNIQUE (tenant_key, dataset_version, load_run_id)",
    );
    expect(loader).toContain(
      "ON CONFLICT (tenant_key, dataset_version, load_run_id)",
    );
    expect(loader).not.toContain(
      "ON CONFLICT (tenant_key, dataset_version, idempotency_key, mode)",
    );
  });

  it("keeps unassessed market alternatives out of Layer 3 readback", () => {
    const repoRoot = path.resolve(__dirname, "../../..");
    const loader = fs.readFileSync(
      path.join(repoRoot, "scripts/source/load-contract-depth-package.ts"),
      "utf8",
    );

    expect(loader).toContain("alternatives_available: null");
    expect(loader).toContain("contracts_with_assessed_alternatives");
    expect(loader).toContain("contracts_with_assessed_alternatives: 0");
    expect(loader).not.toContain(
      'alternatives_available: stringValue(contract, "archetype") === "ehr_platform" ? "limited" : "available"',
    );
  });

  it("requires document page text and change-order depth through adapter and Layer 3 readback", () => {
    const repoRoot = path.resolve(__dirname, "../../..");
    const loader = fs.readFileSync(
      path.join(repoRoot, "scripts/source/load-contract-depth-package.ts"),
      "utf8",
    );

    expect(loader).toContain("change_order_adapter");
    expect(loader).toContain("contract_page_text_adapter");
    expect(loader).toContain("change_orders.csv");
    expect(loader).toContain("contract_page_text.csv");
    expect(loader).toContain("upsertChangeOrderFacts");
    expect(loader).toContain("upsertPageTextFacts");
    expect(loader).toContain("annual_change_order_spend");
    expect(loader).toContain("document.page_text_char_count");
    expect(loader).toContain("opportunity_evidence: opportunityEvidenceRows");
    expect(loader).toContain("opportunity_claim");
    expect(loader).toContain(
      "calculation_output: ownedOpportunities.length * 2",
    );
  });

  it("promotes the contract purpose into a governed canonical fact", () => {
    const repoRoot = path.resolve(__dirname, "../../..");
    const loader = fs.readFileSync(
      path.join(repoRoot, "scripts/source/load-contract-depth-package.ts"),
      "utf8",
    );
    const contracts = fs.readFileSync(
      path.join(
        repoRoot,
        "datasets/source/contract-depth/meridian-databricks-enterprise-agreement-v1-20260908/source-files/contracts.csv",
      ),
      "utf8",
    );

    expect(contracts).toContain("contract_purpose_summary");
    expect(loader).toContain("contract.purpose_summary");
    expect(loader).toContain("system_extracted_synthetic_demo");
    expect(loader).toContain("upsertContractContextFacts");
  });

  it("counts one canonical context fact for each populated contract purpose", () => {
    const repoRoot = path.resolve(__dirname, "../../..");
    const loader = fs.readFileSync(
      path.join(repoRoot, "scripts/source/load-contract-depth-package.ts"),
      "utf8",
    );

    expect(loader).toContain(
      "const contractContextFactCount = sourceFiles.contracts.filter",
    );
    expect(loader).toContain("contractContextFactCount +");
  });

  it("refreshes spend observation identity fields when a package row is reloaded", () => {
    const repoRoot = path.resolve(__dirname, "../../..");
    const loader = fs.readFileSync(
      path.join(repoRoot, "scripts/source/load-contract-depth-package.ts"),
      "utf8",
    );

    const spendUpsert = loader.slice(
      loader.indexOf("async function upsertSpend"),
      loader.indexOf("async function upsertPerformance"),
    );

    expect(spendUpsert).toContain("cost_center = EXCLUDED.cost_center");
    expect(spendUpsert).toContain("business_unit = EXCLUDED.business_unit");
    expect(spendUpsert).toContain("currency = EXCLUDED.currency");
    expect(spendUpsert).toContain("source_system = EXCLUDED.source_system");
    expect(spendUpsert).toContain("quality_state = EXCLUDED.quality_state");
  });

  it("does not use an invalid case_opportunity conflict target", () => {
    const repoRoot = path.resolve(__dirname, "../../..");
    const loader = fs.readFileSync(
      path.join(repoRoot, "scripts/source/load-contract-depth-package.ts"),
      "utf8",
    );

    expect(loader).toContain("DELETE FROM source.case_opportunity");
    expect(loader).not.toContain(
      "ON CONFLICT (tenant_key, dataset_version, optimization_case_id, opportunity_id)",
    );
  });

  it("deletes only the requested opportunity version on a rerun", () => {
    const repoRoot = path.resolve(__dirname, "../../..");
    const loader = fs.readFileSync(
      path.join(repoRoot, "scripts/source/load-contract-depth-package.ts"),
      "utf8",
    );
    const match = loader.match(
      /`(DELETE FROM source\.optimization_opportunity[\s\S]*?)`,\s*\[([^\]]+)\]/,
    );
    expect(match).not.toBeNull();
    const deleteSql = match![1];
    expect(deleteSql.replace(/\s+/g, " ").trim()).toBe(
      "DELETE FROM source.optimization_opportunity WHERE tenant_key = $1 AND dataset_version = $2 AND opportunity_id = ANY($3::text[])",
    );
    expect(match![2].replace(/\s+/g, " ").trim()).toBe(
      "args.tenantKey, args.datasetVersion, opportunityIds",
    );

    if (
      ["initdb", "pg_ctl", "psql"].some(
        (command) => spawnSync("which", [command]).status !== 0,
      )
    )
      return;

    const tempDir = fs.mkdtempSync(
      path.join(os.tmpdir(), "source-opportunity-delete-"),
    );
    const dataDir = path.join(tempDir, "data");
    const run = (command: string, args: string[]) => {
      const result = spawnSync(command, args, { encoding: "utf8" });
      if (result.status !== 0)
        throw new Error(`${command}: ${result.stderr || result.stdout}`);
      return result.stdout.trim();
    };
    try {
      run("initdb", ["-D", dataDir, "-A", "trust", "--no-instructions"]);
      run("pg_ctl", [
        "-D",
        dataDir,
        "-l",
        path.join(tempDir, "postgres.log"),
        "-o",
        `-c listen_addresses='' -c unix_socket_directories=${tempDir}`,
        "-w",
        "start",
      ]);
      const sql = (statement: string) =>
        run("psql", [
          "-h",
          tempDir,
          "-d",
          "postgres",
          "-At",
          "-v",
          "ON_ERROR_STOP=1",
          "-c",
          statement,
        ]);
      sql(
        "CREATE SCHEMA source; CREATE TABLE source.optimization_opportunity (tenant_key text, dataset_version text, opportunity_id text);",
      );
      sql(
        "INSERT INTO source.optimization_opportunity VALUES ('tenant-a', 'v1', 'shared-id'), ('tenant-a', 'v2', 'shared-id'), ('tenant-b', 'v1', 'shared-id');",
      );
      sql(
        `PREPARE scoped_delete(text, text, text[]) AS ${deleteSql}; EXECUTE scoped_delete('tenant-a', 'v1', ARRAY['shared-id']);`,
      );
      expect(
        sql(
          "SELECT tenant_key || ':' || dataset_version FROM source.optimization_opportunity ORDER BY 1",
        ),
      ).toBe("tenant-a:v2\ntenant-b:v1");
      sql(
        "INSERT INTO source.optimization_opportunity VALUES ('tenant-a', 'v1', 'shared-id');",
      );
      sql(
        `PREPARE scoped_delete(text, text, text[]) AS ${deleteSql}; EXECUTE scoped_delete('tenant-a', 'v1', ARRAY['shared-id']);`,
      );
      expect(
        sql(
          "SELECT tenant_key || ':' || dataset_version FROM source.optimization_opportunity ORDER BY 1",
        ),
      ).toBe("tenant-a:v2\ntenant-b:v1");
    } finally {
      spawnSync("pg_ctl", ["-D", dataDir, "-m", "immediate", "-w", "stop"], {
        encoding: "utf8",
      });
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("requires apply approval only for mutating Layer 2 and Layer 3 modes", () => {
    const repoRoot = path.resolve(__dirname, "../../..");
    const loader = fs.readFileSync(
      path.join(repoRoot, "scripts/source/load-contract-depth-package.ts"),
      "utf8",
    );

    expect(loader).toContain(
      'if (args.mode === "apply-layer2") {\n      requireApplyApproval(args);',
    );
    expect(loader).toContain(
      'if (args.mode === "apply-layer3") {\n      requireApplyApproval(args);',
    );
    expect(loader).toContain(
      'event: "source_contract_depth_package_layer23_verified"',
    );
  });

  it("validates the dataset version declared by each package instead of one hard-coded package", () => {
    const repoRoot = path.resolve(__dirname, "../../..");
    const adapter = fs.readFileSync(
      path.join(repoRoot, "src/lib/source/contract-depth-package/adapter.ts"),
      "utf8",
    );

    expect(adapter).toContain("singleDeclaredValue");
    expect(adapter).toContain("const datasetVersion = singleDeclaredValue");
    expect(adapter).toContain("datasetVersion,");
    expect(adapter).not.toContain("const EXPECTED_DATASET_VERSION");
  });

  it("normalizes alternate contract-depth source column names without dropping evidence links", () => {
    const repoRoot = path.resolve(__dirname, "../../..");
    const loader = fs.readFileSync(
      path.join(repoRoot, "scripts/source/load-contract-depth-package.ts"),
      "utf8",
    );

    expect(loader).toContain('stringValue(row, "application_ref")');
    expect(loader).toContain('stringValue(row, "extraction_id")');
    expect(loader).toContain('stringValue(row, "source_file_id") ||');
    expect(loader).toContain("datasetVersion.length > 0");
  });

  it("keeps optimization opportunity value types inside the canonical enum", () => {
    const repoRoot = path.resolve(__dirname, "../../..");
    const loader = fs.readFileSync(
      path.join(repoRoot, "scripts/source/load-contract-depth-package.ts"),
      "utf8",
    );
    const opportunities = fs.readFileSync(
      path.join(
        repoRoot,
        "datasets/source/contract-depth/meridian-databricks-enterprise-agreement-v1-20260908/source-files/optimization_opportunities.csv",
      ),
      "utf8",
    );

    expect(opportunities).not.toContain("negotiable_improvement");
    expect(opportunities).toContain("negotiated_improvement");
    expect(loader).toContain(
      "Unsupported canonical optimization opportunity value_type",
    );
  });

  it("counts only populated QBR facts in the Layer 3 readback contract", () => {
    const repoRoot = path.resolve(__dirname, "../../..");
    const loader = fs.readFileSync(
      path.join(repoRoot, "scripts/source/load-contract-depth-package.ts"),
      "utf8",
    );

    expect(loader).toContain('pctValue(row, "run_percent")');
    expect(loader).toContain('numberValue(row, "client_satisfaction_score")');
    expect(loader).not.toContain(
      "const qbrFactCount = sourceFiles.qbrScorecards.length * 5",
    );
  });

  it("keeps positive service-credit assertions conditional on package evidence", () => {
    const repoRoot = path.resolve(__dirname, "../../..");
    const layer4 = fs.readFileSync(
      path.join(
        repoRoot,
        "scripts/source/project-contract-depth-package-layer4.ts",
      ),
      "utf8",
    );

    expect(layer4).toContain("packageHasServiceCreditEvidence");
    expect(layer4).toContain("expectedLayer3.source_contract_service_credit");
  });
});
