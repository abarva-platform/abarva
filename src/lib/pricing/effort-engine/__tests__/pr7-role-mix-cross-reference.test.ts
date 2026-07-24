/**
 * Nexus Pricing Engine — PR7 hardening: brief §12's taxonomy cross-reference
 * ask, "does anything confirm EVERY PR4 activity-role-mix role_code exists
 * in PR1's pricing_roles.csv?"
 *
 * The PR4 generator script (`scripts/pricing/generate-pr4-effort-pack.ts`)
 * has its own build-time cross-reference check against real role codes
 * (confirmed by reading that script's header) — but that check only runs
 * when the generator is RE-RUN; nothing re-verifies the COMMITTED
 * `pricing_activity_role_mix.csv` against the COMMITTED `pricing_roles.csv`
 * afterward (e.g. if either CSV were ever hand-edited without re-running the
 * generator). This is a genuine gap no prior PR's test suite covers — this
 * file closes it by reading both real, checked-in CSVs directly off disk and
 * asserting every referenced role_code resolves, on every test run (CI
 * catches drift the moment it happens, not only at generation time).
 */
import fs from "node:fs";
import path from "node:path";
import Papa from "papaparse";

const PACK_DIR = path.resolve(__dirname, "..", "..", "..", "..", "..", "datasets", "reference", "pricing-engine-v1");

function readCsv(fileName: string): Record<string, string>[] {
  const raw = fs.readFileSync(path.join(PACK_DIR, fileName), "utf8");
  return Papa.parse<Record<string, string>>(raw, { header: true, skipEmptyLines: true }).data;
}

describe("PR7 cross-reference — pricing_activity_role_mix.csv role_code vs pricing_roles.csv", () => {
  it("every role_code referenced by the real committed role-mix CSV exists as an active-or-known role_code in the real committed roles CSV", () => {
    const roleMixRows = readCsv("pricing_activity_role_mix.csv");
    const roleRows = readCsv("pricing_roles.csv");
    expect(roleMixRows.length).toBeGreaterThan(0);
    expect(roleRows.length).toBeGreaterThan(0);

    const knownRoleCodes = new Set(roleRows.map((r) => r.role_code));
    const danglingReferences = roleMixRows
      .map((row, i) => ({ rowNumber: i + 1, activityPackCode: row.activity_pack_code, roleCode: row.role_code }))
      .filter((ref) => !knownRoleCodes.has(ref.roleCode));

    expect(danglingReferences).toEqual([]);
  });

  it("every role_code referenced resolves to a role whose own status is not retired/superseded/deprecated (a dangling reference to a RETIRED role is still a real gap, distinct from a nonexistent code)", () => {
    const roleMixRows = readCsv("pricing_activity_role_mix.csv");
    const roleRows = readCsv("pricing_roles.csv");
    const statusByRoleCode = new Map(roleRows.map((r) => [r.role_code, r.status]));
    const RETIRED = new Set(["retired", "superseded", "deprecated"]);

    const referencesToRetiredRoles = roleMixRows
      .map((row, i) => ({ rowNumber: i + 1, activityPackCode: row.activity_pack_code, roleCode: row.role_code, status: statusByRoleCode.get(row.role_code) }))
      .filter((ref) => ref.status !== undefined && RETIRED.has(ref.status));

    expect(referencesToRetiredRoles).toEqual([]);
  });

  it("real row-count sanity (catches an accidental empty-file regression silently passing the two checks above)", () => {
    const roleMixRows = readCsv("pricing_activity_role_mix.csv");
    // PR4's release record pins 126 role-mix rows; assert a real, non-trivial
    // count rather than only "greater than 0" so an accidental truncation is
    // still caught even if it left a handful of valid-looking rows.
    expect(roleMixRows.length).toBeGreaterThanOrEqual(100);
  });
});
