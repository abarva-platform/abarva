import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "@jest/globals";

const MIGRATIONS_DIR = path.resolve(__dirname, "..", "..", "..", "..", "supabase", "migrations");
const REFERENCE_SCHEMA_FILE = "20260723233000_pricing_reference_schema_v1.sql";
const RATE_CARD_FILE = "20260723234500_pricing_rate_cards_client_profiles_v1.sql";

function readMigration(fileName: string): string {
  return fs.readFileSync(path.join(MIGRATIONS_DIR, fileName), "utf8");
}

const referenceSchemaSql = readMigration(REFERENCE_SCHEMA_FILE);
const rateCardSql = readMigration(RATE_CARD_FILE);

const NEW_TABLES = [
  "pricing_taxonomy_versions",
  "pricing_model_versions",
  "pricing_towers",
  "pricing_capabilities",
  "pricing_role_families",
  "pricing_seniority_levels",
  "pricing_roles",
  "pricing_role_aliases",
  "pricing_provider_level_aliases",
  "pricing_rate_bands",
  "pricing_provider_classes",
  "pricing_providers",
  "pricing_delivery_locations",
  "pricing_rate_cards",
  "pricing_rate_card_lines",
  "pricing_client_profiles",
  "pricing_client_profile_values",
  "pricing_technology_cost_defaults",
  "pricing_estimate_snapshots",
];

const PR4_SCOPE_TABLES = [
  "pricing_archetypes",
  "pricing_activity_packs",
  "pricing_effort_drivers",
  "pricing_effort_rules",
  "pricing_activity_role_mix",
  "pricing_archetype_activity_map",
  "pricing_range_policies",
  "pricing_agent_costs",
];

const PR6_SCOPE_TABLES = [
  "pricing_estimates",
  "pricing_estimate_scenarios",
  "pricing_estimate_inputs",
  "pricing_estimate_line_items",
  "pricing_estimate_approvals",
];

describe("PR2 migrations exist and are well-formed", () => {
  it("both migration files exist under supabase/migrations/ with a timestamp after the latest pre-existing migration", () => {
    expect(fs.existsSync(path.join(MIGRATIONS_DIR, REFERENCE_SCHEMA_FILE))).toBe(true);
    expect(fs.existsSync(path.join(MIGRATIONS_DIR, RATE_CARD_FILE))).toBe(true);
  });

  const combinedSql = `${referenceSchemaSql}\n${rateCardSql}`;

  it.each(NEW_TABLES)("creates table %s with CREATE TABLE IF NOT EXISTS", (table) => {
    expect(combinedSql).toMatch(new RegExp(`CREATE TABLE IF NOT EXISTS ${table}\\s*\\(`));
  });

  it.each(NEW_TABLES)("enables RLS + a permissive service_role_full_access policy on %s", (table) => {
    expect(combinedSql).toMatch(new RegExp(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`));
    expect(combinedSql).toMatch(new RegExp(`DROP POLICY IF EXISTS "service_role_full_access" ON ${table}`));
    expect(combinedSql).toMatch(new RegExp(`CREATE POLICY "service_role_full_access" ON ${table}`));
  });

  it("does NOT create any PR4-scope table", () => {
    const combined = `${referenceSchemaSql}\n${rateCardSql}`;
    for (const table of PR4_SCOPE_TABLES) {
      expect(combined).not.toMatch(new RegExp(`CREATE TABLE[^;]*\\b${table}\\b`));
    }
  });

  it("does NOT create any PR6-scope estimate-workflow table", () => {
    const combined = `${referenceSchemaSql}\n${rateCardSql}`;
    for (const table of PR6_SCOPE_TABLES) {
      expect(combined).not.toMatch(new RegExp(`CREATE TABLE[^;]*\\b${table}\\b`));
    }
  });
});

describe("PR2 idempotency-key unique constraints (brief §6.4) exist in SQL", () => {
  it("role: UNIQUE (taxonomy_version, role_code)", () => {
    expect(referenceSchemaSql).toMatch(
      /CREATE UNIQUE INDEX IF NOT EXISTS uq_pricing_roles_taxonomy_version_role_code\s+ON pricing_roles \(taxonomy_version, role_code\)/,
    );
  });

  it("role alias: UNIQUE (tenant_key, normalized_alias, provider_scope), COALESCE'd for global scope", () => {
    expect(referenceSchemaSql).toMatch(/normalized_alias\s+TEXT GENERATED ALWAYS AS \(lower\(trim\(alias_label\)\)\) STORED/);
    expect(referenceSchemaSql).toMatch(
      /CREATE UNIQUE INDEX IF NOT EXISTS uq_pricing_role_aliases_scoped_label[\s\S]*?COALESCE\(tenant_key, '__global__'\)[\s\S]*?normalized_alias[\s\S]*?COALESCE\(provider_scope, '__any_provider__'\)/,
    );
  });

  it("rate card: UNIQUE (scope_type, tenant_key, card_code, version), tenant_key COALESCE'd for global scope", () => {
    expect(rateCardSql).toMatch(
      /CREATE UNIQUE INDEX IF NOT EXISTS uq_pricing_rate_cards_scope_code_version[\s\S]*?ON pricing_rate_cards \(scope_type, COALESCE\(tenant_key, '__global__'\), card_code, version\)/,
    );
  });

  it("rate line: UNIQUE (card_version_id, role_or_band_ref, level, provider_ref, location_ref, rate_basis, unit, valid_from)", () => {
    expect(rateCardSql).toMatch(
      /CREATE UNIQUE INDEX IF NOT EXISTS uq_pricing_rate_card_lines_identity[\s\S]*?card_version_id,[\s\S]*?role_or_band_ref,[\s\S]*?COALESCE\(level, '__any_level__'\),[\s\S]*?COALESCE\(provider_ref, '__any_provider__'\),[\s\S]*?COALESCE\(location_ref, '__any_location__'\),[\s\S]*?rate_basis,[\s\S]*?unit,[\s\S]*?valid_from/,
    );
  });

  it("client profile assumption: UNIQUE (tenant_key, profile_version, assumption_key)", () => {
    expect(rateCardSql).toMatch(
      /CREATE UNIQUE INDEX IF NOT EXISTS uq_pricing_client_profile_values_key\s+ON pricing_client_profile_values \(tenant_key, profile_version, assumption_key\)/,
    );
  });
});

describe("pricing_rate_cards scope_type inheritance model (brief §5.1)", () => {
  it("uses one table with a scope_type enum + self-referencing parent_rate_card_id, not a rigid 4-table hierarchy", () => {
    expect(rateCardSql).toMatch(/scope_type\s+TEXT NOT NULL CHECK \(scope_type IN \('global', 'client', 'move_exception'\)\)/);
    expect(rateCardSql).toMatch(/parent_rate_card_id\s+UUID NULL REFERENCES pricing_rate_cards \(id\)/);
  });

  it("has only one is_current row per scope/tenant/card_code (partial unique index)", () => {
    expect(rateCardSql).toMatch(/CREATE UNIQUE INDEX IF NOT EXISTS uq_pricing_rate_cards_one_current[\s\S]*?WHERE is_current/);
  });
});

describe("pricing_estimate_snapshots — immutable skeleton (brief §8.3)", () => {
  it("has no UPDATE statement anywhere in the migration (append-only)", () => {
    expect(rateCardSql).not.toMatch(/UPDATE\s+pricing_estimate_snapshots/i);
  });

  it("status enum includes stale_for_current_scope", () => {
    expect(rateCardSql).toMatch(
      /status\s+TEXT NOT NULL DEFAULT 'draft'\s+CHECK \(status IN \(\s*'draft', 'approved', 'superseded', 'stale_for_current_scope'\s*\)\)/,
    );
  });

  it("has no FK to a pricing_estimates table (that table does not exist yet)", () => {
    expect(rateCardSql).not.toMatch(/REFERENCES pricing_estimates/);
  });

  it("references the owning move/tenant directly via tenant_key + move_id", () => {
    expect(rateCardSql).toMatch(/tenant_key\s+TEXT NOT NULL,/);
    expect(rateCardSql).toMatch(/move_id\s+UUID NOT NULL,/);
  });

  it("has the (move_id, created_at DESC) hot-path index", () => {
    expect(rateCardSql).toMatch(
      /CREATE INDEX IF NOT EXISTS idx_pricing_estimate_snapshots_move\s+ON pricing_estimate_snapshots \(move_id, created_at DESC\)/,
    );
  });
});

describe("no bare CREATE TABLE / CREATE INDEX (migration-idempotency audit convention)", () => {
  it("every CREATE TABLE uses IF NOT EXISTS", () => {
    for (const sql of [referenceSchemaSql, rateCardSql]) {
      const badTables = sql.match(/CREATE TABLE\s+(?!IF NOT EXISTS)/gi) ?? [];
      expect(badTables).toEqual([]);
    }
  });

  it("every CREATE [UNIQUE] INDEX uses IF NOT EXISTS", () => {
    for (const sql of [referenceSchemaSql, rateCardSql]) {
      const badIndexes = sql.match(/CREATE\s+(UNIQUE\s+)?INDEX\s+(?!IF NOT EXISTS)/gi) ?? [];
      expect(badIndexes).toEqual([]);
    }
  });

  it("every CREATE POLICY is preceded by a DROP POLICY IF EXISTS for the same table", () => {
    for (const sql of [referenceSchemaSql, rateCardSql]) {
      const created = (sql.match(/CREATE POLICY\s+/gi) ?? []).length;
      const dropped = (sql.match(/DROP POLICY IF EXISTS\s+/gi) ?? []).length;
      expect(created).toBe(dropped);
    }
  });
});
