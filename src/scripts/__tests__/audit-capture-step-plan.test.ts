import { execFileSync } from "node:child_process";
import path from "node:path";

// The audit module's own suite proves the invariants. This proves the GATE:
// that the entry point the workflow runs actually sweeps something, reports it,
// and exits non-zero when it does not. A gate wired to a script that silently
// audits nothing would pass every run.
const SCRIPT = path.join(
  __dirname,
  "..",
  "audit",
  "audit-capture-step-plan.ts",
);

function runAudit(): { status: number; output: string } {
  try {
    const output = execFileSync("npx", ["tsx", SCRIPT], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { status: 0, output };
  } catch (error) {
    const failure = error as { status?: number; stdout?: string; stderr?: string };
    return {
      status: failure.status ?? 1,
      output: `${failure.stdout ?? ""}${failure.stderr ?? ""}`,
    };
  }
}

describe("audit-capture-step-plan — the gate the workflow runs", () => {
  let result: { status: number; output: string };

  beforeAll(() => {
    result = runAudit();
  }, 60_000);

  it("passes on the shipped declarations", () => {
    expect(result.output).toContain("No capture step-plan defects");
    expect(result.status).toBe(0);
  });

  // The headline is printed BEFORE the result for this reason: a sweep that
  // visited no phase, or no route configuration, would also report no defect.
  it("states what it swept, so a clean result cannot be a vacuous one", () => {
    expect(result.output).toMatch(/6 phase\(s\) \[0, 1, 2, 3, 4, 5\]/);
    expect(result.output).toMatch(/x 37 route configuration\(s\)/);
    expect(result.output).toContain("against a 3-step flow");
  });

  it("refuses rather than passing when there is nothing to audit", () => {
    const source = require("node:fs").readFileSync(SCRIPT, "utf8") as string;
    // The empty-input refusal and the defect refusal are separate exits; both
    // must be non-zero, or "nothing to audit" would read as "nothing wrong".
    expect(source).toContain("phases.length === 0 || configurations.length === 0");
    expect(source.match(/process\.exit\(1\)/g) ?? []).toHaveLength(2);
  });
});
