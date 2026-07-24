import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "@jest/globals";

const MIGRATIONS_DIR = path.resolve(__dirname, "..", "..", "..", "..", "supabase", "migrations");
const LINK_FILE = "20260724020000_pricing_estimate_snapshots_pr6_estimate_link.sql";
const ESTIMATES_FILE = "20260724010000_pricing_estimates_moves_workflow_v1.sql";

function readMigration(fileName: string): string {
  return fs.readFileSync(path.join(MIGRATIONS_DIR, fileName), "utf8");
}

const sql = readMigration(LINK_FILE);

describe("PR6 pricing_estimate_snapshots.estimate_id link migration", () => {
  it("exists under supabase/migrations/ sorted after the PR5 estimates migration", () => {
    expect(fs.existsSync(path.join(MIGRATIONS_DIR, LINK_FILE))).toBe(true);
    const files = fs.readdirSync(MIGRATIONS_DIR).sort();
    expect(files.indexOf(LINK_FILE)).toBeGreaterThan(files.indexOf(ESTIMATES_FILE));
  });

  it("adds a nullable estimate_id column with IF NOT EXISTS (additive, no backfill)", () => {
    expect(sql).toMatch(/ALTER TABLE pricing_estimate_snapshots\s+ADD COLUMN IF NOT EXISTS estimate_id\s+UUID NULL/);
  });

  it("references pricing_estimates (same-schema FK, unlike the soft move_id reference)", () => {
    expect(sql).toMatch(/estimate_id\s+UUID NULL REFERENCES pricing_estimates \(id\)/);
  });

  it("adds the (estimate_id, created_at DESC) hot-path index", () => {
    expect(sql).toMatch(
      /CREATE INDEX IF NOT EXISTS idx_pricing_estimate_snapshots_estimate\s+ON pricing_estimate_snapshots \(estimate_id, created_at DESC\)/,
    );
  });

  it("does not UPDATE or DELETE any existing row (additive ALTER only)", () => {
    expect(sql).not.toMatch(/\bUPDATE\s+pricing_estimate_snapshots\b/i);
    expect(sql).not.toMatch(/\bDELETE\s+FROM\s+pricing_estimate_snapshots\b/i);
  });
});
