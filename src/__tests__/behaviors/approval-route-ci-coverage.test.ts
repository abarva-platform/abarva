import { readFileSync } from "node:fs";
import path from "node:path";

import {
  expandWorkflowCommands,
  extractWorkflowRunCommands,
} from "../../../scripts/quality/check-integration-ci-visibility.mjs";

/**
 * The phase-gate-approval route suite is deliberately NOT in this list any
 * more. Its directory is swept by the required AI surface control catalog
 * (slice 17), and a suite a required job runs must be NAMED inside a required
 * job, or the quotable line in a log belongs to the run that cannot block a
 * merge (scripts/quality/check-named-suite-requiredness.mjs, T-595). The case
 * at the bottom holds that separation, so the count below cannot be restored to
 * nineteen by putting the name back.
 */
const REQUIRED_GATE_SUITES = [
  "src/app/api/v1/programs/[programId]/pricing/__tests__/approve-route.test.ts",
  "src/app/api/v1/programs/[programId]/pricing/__tests__/estimates-route.test.ts",
  "src/app/api/v1/programs/[programId]/pricing/__tests__/config-route.test.ts",
  "src/app/api/v1/programs/[programId]/pricing/__tests__/estimate-detail-routes.test.ts",
  "src/app/(maestro)/admin/__tests__/page-source.test.ts",
  "src/app/(maestro)/admin/__tests__/cached-helpers-log-errors.test.ts",
  "src/app/(maestro)/admin/__tests__/layout-access.test.ts",
  "src/app/api/admin/programs/approvals/__tests__/_auth.test.ts",
  "src/app/api/admin/programs/approvals/__tests__/route.test.ts",
  "src/app/api/admin/pricing/rate-cards/[id]/approve/__tests__/route.test.ts",
  "src/app/api/admin/programs/approvals/export/__tests__/route.test.ts",
  "src/app/api/v1/programs/[programId]/artifacts/[artifactId]/client-approval/__tests__/route.test.ts",
  "src/app/api/v1/programs/[programId]/current-state/evidence/[evidenceId]/approve/__tests__/route.test.ts",
  "src/app/api/v1/programs/[programId]/solution-options/approve/__tests__/route.test.ts",
  "src/app/api/v1/source/[eventId]/stage/__tests__/route.test.ts",
  "src/app/api/v1/source/[eventId]/vendor-proposals/facts/[factId]/reject/__tests__/route.test.ts",
  "src/app/api/v1/source/events/[eventId]/approve/__tests__/route.test.ts",
  "src/app/api/v1/source/events/[eventId]/request-approval/__tests__/route.test.ts",
] as const;

describe("governed approval route CI ownership", () => {
  const repoRoot = path.resolve(__dirname, "../../..");
  const workflow = readFileSync(
    path.join(repoRoot, ".github/workflows/unit-suites.yml"),
    "utf8",
  );
  const scripts = JSON.parse(
    readFileSync(path.join(repoRoot, "package.json"), "utf8"),
  ).scripts as Record<string, string>;
  const commands = expandWorkflowCommands(
    extractWorkflowRunCommands(workflow),
    scripts,
  ).filter((command) => /\b(?:npx\s+)?jest\b/.test(command));
  const governedRouteCommand = commands.find(
    (command) =>
      command.includes("--runTestsByPath") &&
      REQUIRED_GATE_SUITES.every((suite) => command.includes(suite)),
  );

  it("owns all eighteen routes in one exact-path Jest command", () => {
    expect(governedRouteCommand).toBeDefined();
  });

  it("runs exact files so bracketed route segments are not treated as patterns", () => {
    expect(governedRouteCommand).toContain("npx jest --runTestsByPath");
    expect(REQUIRED_GATE_SUITES).toHaveLength(18);
  });

  it("leaves the phase-gate-approval suite to the required job that sweeps it", () => {
    // Paired with the removal above rather than left as a bare count change: a
    // name put back here would be legal-looking and would re-open the defect
    // T-595 exists to refuse.
    expect(governedRouteCommand).not.toContain(
      "src/app/api/v1/programs/[programId]/phase-gate-approval/__tests__/",
    );

    const catalog = readFileSync(
      path.join(repoRoot, ".github/workflows/ai-surface-control-catalog.yml"),
      "utf8",
    );
    // The escaped spelling, because a Jest positional argument is a regex and
    // an unescaped `[programId]` is a character class that selects nothing.
    expect(catalog).toContain(
      "src/app/api/v1/programs/\\[programId\\]/phase-gate-approval/__tests__",
    );
  });
});
