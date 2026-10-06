import {
  SOURCE_WORKSPACE_PERFORMANCE_BUDGETS,
  SOURCE_WORKSPACE_PERFORMANCE_ROUTES,
  evaluateSourceWorkspacePerformanceRun,
  summarizeSourceWorkspacePerformance,
  type SourceWorkspacePerformanceRun,
} from "@/lib/source/qa/workspace-performance-contract";

function passingRun(
  overrides: Partial<SourceWorkspacePerformanceRun> = {},
): SourceWorkspacePerformanceRun {
  return {
    routeId: "command",
    requestedPath: "/source",
    finalPath: "/source",
    authenticated: true,
    httpStatus: 200,
    cold: true,
    domContentLoadedMs: 900,
    shellReadyMs: 1200,
    evidenceReadyMs: 2200,
    interactionReadyMs: 2300,
    sourceApiRequestCount: 2,
    totalRequestCount: 28,
    encodedBodyBytes: 420_000,
    transferBytes: 190_000,
    chartReadiness: {
      required: true,
      ready: true,
      visibleChartCount: 1,
      visibleMarkCount: 5,
    },
    interactionReadiness: {
      ready: true,
      visibleTabCount: 5,
      enabledTabCount: 5,
    },
    slowestDependency: {
      url: "https://example.test/api/source/workspace/portfolio",
      durationMs: 650,
      resourceType: "fetch",
      status: 200,
    },
    serverTiming: [{ name: "app", durationMs: 35, description: null }],
    errors: [],
    ...overrides,
  };
}

describe("Source workspace signed-in performance contract", () => {
  it("defines only canonical /source states, not compatibility aliases", () => {
    expect(
      SOURCE_WORKSPACE_PERFORMANCE_ROUTES.map((route) => route.id),
    ).toEqual(["command", "contracts", "levers", "evidence", "coverage"]);
    expect(
      SOURCE_WORKSPACE_PERFORMANCE_ROUTES.every((route) =>
        route.path.startsWith("/source"),
      ),
    ).toBe(true);
    expect(
      SOURCE_WORKSPACE_PERFORMANCE_ROUTES.some((route) =>
        /preview|workspace|portfolio|360/.test(
          new URL(route.path, "https://example.test").pathname,
        ),
      ),
    ).toBe(false);
  });

  it("fails closed when authentication was not proven", () => {
    const result = evaluateSourceWorkspacePerformanceRun(
      passingRun({ authenticated: false, finalPath: "/sign-in" }),
    );

    expect(result.passed).toBe(false);
    expect(result.failures).toContain("authenticated_session_not_proven");
  });

  it("fails when the shell, evidence, charts, or interactions miss readiness", () => {
    const result = evaluateSourceWorkspacePerformanceRun(
      passingRun({
        shellReadyMs: SOURCE_WORKSPACE_PERFORMANCE_BUDGETS.shellReadyMs + 1,
        evidenceReadyMs:
          SOURCE_WORKSPACE_PERFORMANCE_BUDGETS.evidenceReadyMs + 1,
        chartReadiness: {
          required: true,
          ready: false,
          visibleChartCount: 1,
          visibleMarkCount: 0,
        },
        interactionReadiness: {
          ready: false,
          visibleTabCount: 5,
          enabledTabCount: 4,
        },
      }),
    );

    expect(result.passed).toBe(false);
    expect(result.failures).toEqual(
      expect.arrayContaining([
        "shell_ready_budget_exceeded",
        "evidence_ready_budget_exceeded",
        "chart_not_ready",
        "interaction_not_ready",
      ]),
    );
  });

  it("reports API request count honestly instead of calling it a DB query count", () => {
    const result = evaluateSourceWorkspacePerformanceRun(passingRun());

    expect(result.passed).toBe(true);
    expect(result.measurementBasis.queryCount).toBe("source_api_requests");
    expect(result.measurementBasis.databaseQueryCount).toBe("not_exposed");
  });

  it("summarizes cold and warm results and names the slowest dependency", () => {
    const cold = evaluateSourceWorkspacePerformanceRun(passingRun());
    const warm = evaluateSourceWorkspacePerformanceRun(
      passingRun({
        cold: false,
        shellReadyMs: 620,
        evidenceReadyMs: 1100,
        slowestDependency: {
          url: "https://example.test/api/source/workspace/impact",
          durationMs: 410,
          resourceType: "fetch",
          status: 200,
        },
      }),
    );

    const summary = summarizeSourceWorkspacePerformance([cold, warm]);

    expect(summary).toMatchObject({
      passed: true,
      routeCount: 1,
      runCount: 2,
      coldRunCount: 1,
      warmRunCount: 1,
      slowestDependency: {
        url: "https://example.test/api/source/workspace/portfolio",
        durationMs: 650,
      },
    });
  });
});
