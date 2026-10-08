import { readFileSync } from "node:fs";
import path from "node:path";

import {
  expandWorkflowCommands,
  extractWorkflowRunCommands,
} from "../../../scripts/quality/check-integration-ci-visibility.mjs";

/**
 * Two route suites are deliberately NOT in this list any more. The
 * phase-gate-approval suite left when the required AI surface control catalog
 * began sweeping its directory (slice 17); the current-state evidence approval
 * suite left for the same reason at slice 18. A suite a required job runs must
 * be NAMED inside a required job, or the quotable line in a log belongs to the
 * run that cannot block a merge
 * (scripts/quality/check-named-suite-requiredness.mjs, T-595). The cases at the
 * bottom hold that separation per directory, so the count below cannot be
 * restored to nineteen by putting either name back.
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

  it("owns all seventeen remaining routes in one exact-path Jest command", () => {
    expect(governedRouteCommand).toBeDefined();
  });

  it("runs exact files so bracketed route segments are not treated as patterns", () => {
    expect(governedRouteCommand).toContain("npx jest --runTestsByPath");
    expect(REQUIRED_GATE_SUITES).toHaveLength(17);
  });

  /**
   * One case per directory that left this list, each paired with the required
   * sweep that took it, rather than a bare count change: a name put back here
   * would be legal-looking and would re-open the defect T-595 exists to refuse.
   *
   * `escapedPattern` is how the catalog must spell the directory. A Jest
   * positional argument is a regex, so an unescaped `[programId]` is a
   * character class that selects nothing — a step that looks like it owns the
   * directory while owning none of it.
   */
  const MOVED_TO_REQUIRED_SWEEP = [
    {
      label: "phase-gate-approval",
      directory:
        "src/app/api/v1/programs/[programId]/phase-gate-approval/__tests__",
      escapedPattern:
        "src/app/api/v1/programs/\\[programId\\]/phase-gate-approval/__tests__",
    },
    {
      label: "current-state evidence approval",
      directory:
        "src/app/api/v1/programs/[programId]/current-state/evidence/[evidenceId]/approve/__tests__",
      escapedPattern:
        "src/app/api/v1/programs/\\[programId\\]/current-state/evidence/\\[evidenceId\\]/approve/__tests__",
    },
  ] as const;

  it.each(MOVED_TO_REQUIRED_SWEEP)(
    "leaves the $label suite to the required job that sweeps it",
    ({ directory, escapedPattern }) => {
      expect(governedRouteCommand).not.toContain(`${directory}/`);

      const catalog = readFileSync(
        path.join(repoRoot, ".github/workflows/ai-surface-control-catalog.yml"),
        "utf8",
      );
      expect(catalog).toContain(escapedPattern);
    },
  );
});
