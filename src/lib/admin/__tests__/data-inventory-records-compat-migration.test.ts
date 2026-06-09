import { readFileSync } from "node:fs";
import path from "node:path";

import { scanForDestructivePatterns } from "@/scripts/run-migrations";

const MIGRATION = "20260609165000_data_inventory_records_compatibility.sql";
const migrationPath = path.join(
  process.cwd(),
  "supabase/migrations",
  MIGRATION,
);
const migrationSql = readFileSync(migrationPath, "utf8");

const DATA_INVENTORY_SEGMENTS = [
  "enterprise_profile",
  "org_structure",
  "it_landscape",
  "it_financials",
  "kpi_dictionary",
  "program_inventory",
  "sourcing_artifacts",
  "program_deliverables",
  "evidence_ledger",
  "operating_telemetry",
  "vendor_contracts",
  "compliance",
  "industry_context",
  "cross_program_signals",
  "kpi_history",
  "stakeholder_notes",
  "peer_benchmarks",
  "financial_model",
  "decision_traces",
  "scenario_library",
  "vendor_intelligence",
  "graph_relationships",
  "ai_transformation",
] as const;

describe("data inventory records compatibility migration", () => {
  it("does not trip the destructive migration guard", () => {
    expect(scanForDestructivePatterns(MIGRATION, migrationSql)).toEqual([]);
  });

  it("creates the setup/current-state substrate expected by runtime lookups", () => {
    expect(migrationSql).toContain(
      "CREATE TABLE IF NOT EXISTS public.data_inventory_segments",
    );
    expect(migrationSql).toContain(
      "CREATE TABLE IF NOT EXISTS public.tenant_expected_baselines",
    );
    expect(migrationSql).toContain(
      "CREATE TABLE IF NOT EXISTS public.data_inventory_records",
    );
    expect(migrationSql).toContain("PARTITION BY LIST (segment_id)");
  });

  it("covers all 23 canonical data-inventory segment partitions", () => {
    for (const segment of DATA_INVENTORY_SEGMENTS) {
      expect(migrationSql).toContain(`FOR VALUES IN ('${segment}')`);
    }
    expect(migrationSql).toContain("CHECK (family_number BETWEEN 1 AND 23)");
  });

  it("keeps new rows tenant-neutral instead of leaking an Apex default", () => {
    expect(migrationSql).toContain(
      "uploaded_by TEXT NOT NULL DEFAULT 'system_import'",
    );
    expect(migrationSql).toContain(
      "ALTER COLUMN uploaded_by SET DEFAULT 'system_import'",
    );
    expect(migrationSql).not.toContain(
      "DEFAULT 'Apex synthetic dataset import'",
    );
  });

  it("enables RLS and service-role policies for the compatibility tables", () => {
    for (const table of [
      "data_inventory_segments",
      "tenant_expected_baselines",
      "data_inventory_records",
    ]) {
      expect(migrationSql).toContain(
        `ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`,
      );
      expect(migrationSql).toContain(`service_role_all_${table}`);
    }
  });
});
