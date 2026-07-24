import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "@jest/globals";

const MIGRATIONS_DIR = path.resolve(__dirname, "..", "..", "..", "..", "supabase", "migrations");
const ESTIMATES_FILE = "20260724010000_pricing_estimates_moves_workflow_v1.sql";

function readMigration(fileName: string): string {
  return fs.readFileSync(path.join(MIGRATIONS_DIR, fileName), "utf8");
}

const sql = readMigration(ESTIMATES_FILE);

const NEW_TABLES = ["pricing_estimates", "pricing_estimate_inputs", "pricing_estimate_line_items"];

describe("PR5 estimates migration exists and is well-formed", () => {
  it("the migration file exists under supabase/migrations/ with a timestamp after the latest PR4 migration", () => {
    expect(fs.existsSync(path.join(MIGRATIONS_DIR, ESTIMATES_FILE))).toBe(true);
    const files = fs.readdirSync(MIGRATIONS_DIR).sort();
    const idx = files.indexOf(ESTIMATES_FILE);
    expect(idx).toBeGreaterThan(-1);
    // NOT asserted to be the globally-last migration file: PR6 adds
    // 20260724020000_pricing_estimate_snapshots_pr6_estimate_link.sql after
    // this one (see that migration's header). This assertion only needs
    // "after the latest PR4 migration", which idx > -1 relative to a sorted
    // list already proves given the filename's own timestamp prefix.
    expect(files[idx]).toBe(ESTIMATES_FILE);
    expect(files[idx] > "20260723235500_pricing_effort_engine_v1.sql").toBe(true);
  });

  it.each(NEW_TABLES)("creates table %s with CREATE TABLE IF NOT EXISTS", (table) => {
    expect(sql).toMatch(new RegExp(`CREATE TABLE IF NOT EXISTS ${table}\\s*\\(`));
  });

  it.each(NEW_TABLES)("enables RLS + a permissive service_role_full_access policy on %s", (table) => {
    expect(sql).toMatch(new RegExp(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`));
    expect(sql).toMatch(new RegExp(`DROP POLICY IF EXISTS "service_role_full_access" ON ${table}`));
    expect(sql).toMatch(new RegExp(`CREATE POLICY "service_role_full_access" ON ${table}`));
  });

  it("does NOT create a pricing_estimate_scenarios or pricing_estimate_approvals table (brief §8.3 judgment call / PR6 scope)", () => {
    expect(sql).not.toMatch(/CREATE TABLE[^;]*\bpricing_estimate_scenarios\b/);
    expect(sql).not.toMatch(/CREATE TABLE[^;]*\bpricing_estimate_approvals\b/);
  });

  it("every CREATE TABLE uses IF NOT EXISTS", () => {
    const bad = sql.match(/CREATE TABLE\s+(?!IF NOT EXISTS)/gi) ?? [];
    expect(bad).toEqual([]);
  });

  it("every CREATE [UNIQUE] INDEX uses IF NOT EXISTS", () => {
    const bad = sql.match(/CREATE\s+(UNIQUE\s+)?INDEX\s+(?!IF NOT EXISTS)/gi) ?? [];
    expect(bad).toEqual([]);
  });

  it("every CREATE POLICY is preceded by a matching DROP POLICY IF EXISTS", () => {
    const created = (sql.match(/CREATE POLICY\s+/gi) ?? []).length;
    const dropped = (sql.match(/DROP POLICY IF EXISTS\s+/gi) ?? []).length;
    expect(created).toBe(dropped);
  });
});

describe("pricing_estimates — draft workflow header row", () => {
  it("carries tenant_key NOT NULL and a soft move_id reference (no FK), matching pricing_rate_cards' convention", () => {
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS pricing_estimates[\s\S]*?tenant_key\s+TEXT NOT NULL,/);
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS pricing_estimates[\s\S]*?move_id\s+UUID NOT NULL,/);
    expect(sql).not.toMatch(/move_id\s+UUID NOT NULL REFERENCES engagements/);
  });

  it("status CHECK includes draft/ready_for_review/approved/superseded/stale_for_current_scope (PR6 forward-compat)", () => {
    expect(sql).toMatch(
      /status\s+TEXT NOT NULL DEFAULT 'draft' CHECK \(status IN \(\s*'draft', 'ready_for_review', 'approved', 'superseded', 'stale_for_current_scope'\s*\)\)/,
    );
  });

  it("scenario_key CHECK matches the effort-engine ScenarioKey union", () => {
    expect(sql).toMatch(
      /scenario_key\s+TEXT NOT NULL DEFAULT 'traditional' CHECK \(scenario_key IN \(\s*'traditional', 'ai_accelerated', 'vendor_led', 'client_led', 'custom'\s*\)\)/,
    );
  });

  it("has a scenario_group_id column with a unique (scenario_group_id, scenario_name) index", () => {
    expect(sql).toMatch(/scenario_group_id\s+UUID NOT NULL DEFAULT gen_random_uuid\(\)/);
    expect(sql).toMatch(
      /CREATE UNIQUE INDEX IF NOT EXISTS uq_pricing_estimates_group_scenario_name\s+ON pricing_estimates \(scenario_group_id, scenario_name\)/,
    );
  });

  it("model_version is NOT NULL and FKs to pricing_model_versions", () => {
    expect(sql).toMatch(/model_version\s+INTEGER NOT NULL REFERENCES pricing_model_versions \(version\)/);
  });
});

describe("pricing_estimate_inputs — brief §6.4/§8.4 exact field list", () => {
  const requiredColumns = [
    "input_key",
    "value",
    "unit",
    "required",
    "source_type",
    "source_ref",
    "confidence",
    "confirmed_by",
    "confirmed_at",
    "override_reason",
    "model_version",
  ];

  it.each(requiredColumns)("has column %s", (column) => {
    expect(sql).toMatch(new RegExp(`CREATE TABLE IF NOT EXISTS pricing_estimate_inputs[\\s\\S]*?\\b${column}\\s`));
  });

  it("source_type CHECK matches move_context/client_profile/global_default/client_input/override", () => {
    expect(sql).toMatch(
      /source_type\s+TEXT NOT NULL CHECK \(source_type IN \(\s*'move_context', 'client_profile', 'global_default', 'client_input', 'override'\s*\)\)/,
    );
  });

  it("has the (estimate_id, input_key) unique upsert key", () => {
    expect(sql).toMatch(
      /CREATE UNIQUE INDEX IF NOT EXISTS uq_pricing_estimate_inputs_estimate_key\s+ON pricing_estimate_inputs \(estimate_id, input_key\)/,
    );
  });
});

describe("pricing_estimate_line_items — replace-on-rerun (no version/is_current column)", () => {
  it("has a run_id column to tag which /run call produced each row", () => {
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS pricing_estimate_line_items[\s\S]*?run_id\s+UUID NOT NULL,/);
  });

  it("carries formula-provenance fields (rule_code, driver_code, role_code, rate_resolved_from_scope, formula_trace)", () => {
    for (const column of ["rule_code", "driver_code", "role_code", "rate_resolved_from_scope", "formula_trace"]) {
      expect(sql).toMatch(new RegExp(`CREATE TABLE IF NOT EXISTS pricing_estimate_line_items[\\s\\S]*?\\b${column}\\s`));
    }
  });

  it("does NOT have an is_current or version column (replace-on-rerun, not append-only)", () => {
    const tableMatch = sql.match(/CREATE TABLE IF NOT EXISTS pricing_estimate_line_items\s*\(([\s\S]*?)\);/);
    expect(tableMatch).not.toBeNull();
    const body = tableMatch![1];
    expect(body).not.toMatch(/\bis_current\b/);
    expect(body).not.toMatch(/\bversion\s+INTEGER/);
  });

  it("has an (estimate_id, run_id) index for the replace-on-rerun read path", () => {
    expect(sql).toMatch(
      /CREATE INDEX IF NOT EXISTS idx_pricing_estimate_line_items_run\s+ON pricing_estimate_line_items \(estimate_id, run_id\)/,
    );
  });
});
