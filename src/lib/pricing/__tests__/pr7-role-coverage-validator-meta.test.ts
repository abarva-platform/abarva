/**
 * Nexus Pricing Engine — PR7 hardening: brief §12's taxonomy meta-test.
 *
 * "Every PR1 role maps to a canonical role or a documented exception" is
 * already fully covered by PR1's own `validate-pricing-role-coverage.ts` +
 * its 12-test suite (`scripts/pricing/__tests__/validate-pricing-role-coverage.test.ts`)
 * — re-deriving that logic here would be exactly the kind of duplicated,
 * drift-prone re-testing this PR7 hardening pass is supposed to avoid. Per
 * this PR7 prompt's explicit instruction, this is ONE meta-test that runs
 * `npm run validate:pricing-role-coverage` as a real subprocess (the actual
 * CLI entry point an operator or CI job would run) and asserts it exits
 * clean against the real, committed reference pack — proving the CLI wiring
 * itself (not just the underlying pure function) still works end-to-end.
 */
import { execFileSync } from "node:child_process";
import path from "node:path";

const REPO_ROOT = path.resolve(__dirname, "..", "..", "..", "..");

describe("PR7 meta-test — validate:pricing-role-coverage CLI", () => {
  it("exits clean (code 0) against the real, committed reference pack and prints the coverage summary", () => {
    const output = execFileSync(
      "npx",
      ["tsx", "scripts/pricing/validate-pricing-role-coverage.ts"],
      { cwd: REPO_ROOT, encoding: "utf8" },
    );

    expect(output).toContain("PASSED");
    expect(output).toContain("Coverage summary:");
    expect(output).toMatch(/Roles:\s+\d+/);
    expect(output).not.toContain("FAILED");
  }, 30_000);
});
