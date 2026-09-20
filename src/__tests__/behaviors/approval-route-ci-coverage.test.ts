import { readFileSync } from "node:fs";
import path from "node:path";

import {
  expandWorkflowCommands,
  extractWorkflowRunCommands,
} from "../../../scripts/quality/check-integration-ci-visibility.mjs";

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
  "src/app/api/v1/programs/[programId]/phase-gate-approval/__tests__/route.test.ts",
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

  it("owns all nineteen routes in one exact-path Jest command", () => {
    expect(governedRouteCommand).toBeDefined();
  });

  it("runs exact files so bracketed route segments are not treated as patterns", () => {
    expect(governedRouteCommand).toContain("npx jest --runTestsByPath");
    expect(REQUIRED_GATE_SUITES).toHaveLength(19);
  });
});
