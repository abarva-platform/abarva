import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const workflow = readFileSync(
  path.join(root, ".github/workflows/programs-governance-integration.yml"),
  "utf8",
);
const triage = JSON.parse(
  readFileSync(
    path.join(
      root,
      "docs/architecture/programs-governance-integration-triage.json",
    ),
    "utf8",
  ),
) as {
  selectedGate: { suites: string[]; suiteCount: number; testCount: number };
  excludedFailures: Array<{ suite: string; classification: string }>;
};

describe("Programs governance integration CI", () => {
  it("runs every selected governed suite through the dedicated PR workflow", () => {
    expect(triage.selectedGate.suiteCount).toBe(15);
    expect(triage.selectedGate.testCount).toBe(305);
    for (const suite of triage.selectedGate.suites) {
      expect(workflow).toContain(suite);
    }
    expect(workflow).toContain("--runTestsByPath");
    expect(workflow).toContain("--runInBand");
  });

  it("does not conceal the known-red directory behind a broad invocation", () => {
    expect(workflow).not.toMatch(
      /npx jest\s+src\/__tests__\/integration\/programs(?:\s|$)/,
    );
    expect(triage.excludedFailures).toHaveLength(11);
    expect(
      triage.excludedFailures.every((entry) => entry.classification.length > 0),
    ).toBe(true);
  });

  it("keeps selected and excluded suites disjoint", () => {
    const selected = new Set(triage.selectedGate.suites);
    for (const entry of triage.excludedFailures) {
      expect(selected.has(entry.suite)).toBe(false);
    }
  });
});
