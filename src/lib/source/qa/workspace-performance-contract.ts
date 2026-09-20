export const SOURCE_WORKSPACE_PERFORMANCE_VERSION =
  "source-workspace-performance-v1" as const;

export const SOURCE_WORKSPACE_PERFORMANCE_ROUTES = [
  {
    id: "command",
    pageLabel: "Command",
    path: "/source",
    chartRequired: true,
  },
  {
    id: "contracts",
    pageLabel: "Contracts",
    path: "/source?workspaceTab=contracts",
    chartRequired: false,
  },
  {
    id: "levers",
    pageLabel: "Levers",
    path: "/source?workspaceTab=levers",
    chartRequired: true,
  },
  {
    id: "evidence",
    pageLabel: "Evidence",
    path: "/source?workspaceTab=evidence",
    chartRequired: false,
  },
  {
    id: "coverage",
    pageLabel: "Coverage",
    path: "/source?workspaceTab=coverage",
    chartRequired: false,
  },
] as const;

export const SOURCE_WORKSPACE_PERFORMANCE_BUDGETS = {
  shellReadyMs: 5_000,
  warmShellReadyMs: 2_500,
  evidenceReadyMs: 10_000,
  warmEvidenceReadyMs: 5_000,
  interactionReadyMs: 10_000,
  warmInteractionReadyMs: 5_000,
  sourceApiRequestCount: 6,
  encodedBodyBytes: 3_000_000,
  slowestDependencyMs: 6_000,
} as const;

export type SourceWorkspacePerformanceRouteId =
  (typeof SOURCE_WORKSPACE_PERFORMANCE_ROUTES)[number]["id"];

export type SourceWorkspaceServerTiming = {
  readonly name: string;
  readonly durationMs: number | null;
  readonly description: string | null;
};

export type SourceWorkspaceDependencyTiming = {
  readonly url: string;
  readonly durationMs: number;
  readonly resourceType: string;
  readonly status: number | null;
};

export type SourceWorkspacePerformanceRun = {
  readonly routeId: SourceWorkspacePerformanceRouteId;
  readonly requestedPath: string;
  readonly finalPath: string;
  readonly authenticated: boolean;
  readonly httpStatus: number | null;
  readonly cold: boolean;
  readonly domContentLoadedMs: number;
  readonly shellReadyMs: number;
  readonly evidenceReadyMs: number;
  readonly interactionReadyMs: number;
  readonly sourceApiRequestCount: number;
  readonly totalRequestCount: number;
  readonly encodedBodyBytes: number;
  readonly transferBytes: number;
  readonly chartReadiness: {
    readonly required: boolean;
    readonly ready: boolean;
    readonly visibleChartCount: number;
    readonly visibleMarkCount: number;
  };
  readonly interactionReadiness: {
    readonly ready: boolean;
    readonly visibleTabCount: number;
    readonly enabledTabCount: number;
  };
  readonly slowestDependency: SourceWorkspaceDependencyTiming | null;
  readonly serverTiming: readonly SourceWorkspaceServerTiming[];
  readonly errors: readonly string[];
};

export type EvaluatedSourceWorkspacePerformanceRun =
  SourceWorkspacePerformanceRun & {
    readonly passed: boolean;
    readonly failures: readonly string[];
    readonly budgets: {
      readonly shellReadyMs: number;
      readonly evidenceReadyMs: number;
      readonly interactionReadyMs: number;
      readonly sourceApiRequestCount: number;
      readonly encodedBodyBytes: number;
      readonly slowestDependencyMs: number;
    };
    readonly measurementBasis: {
      readonly queryCount: "source_api_requests";
      readonly databaseQueryCount: "not_exposed" | "server_timing";
      readonly serverTimingAvailable: boolean;
    };
  };

function finiteNonNegative(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

export function evaluateSourceWorkspacePerformanceRun(
  run: SourceWorkspacePerformanceRun,
): EvaluatedSourceWorkspacePerformanceRun {
  const budgets = {
    shellReadyMs: run.cold
      ? SOURCE_WORKSPACE_PERFORMANCE_BUDGETS.shellReadyMs
      : SOURCE_WORKSPACE_PERFORMANCE_BUDGETS.warmShellReadyMs,
    evidenceReadyMs: run.cold
      ? SOURCE_WORKSPACE_PERFORMANCE_BUDGETS.evidenceReadyMs
      : SOURCE_WORKSPACE_PERFORMANCE_BUDGETS.warmEvidenceReadyMs,
    interactionReadyMs: run.cold
      ? SOURCE_WORKSPACE_PERFORMANCE_BUDGETS.interactionReadyMs
      : SOURCE_WORKSPACE_PERFORMANCE_BUDGETS.warmInteractionReadyMs,
    sourceApiRequestCount:
      SOURCE_WORKSPACE_PERFORMANCE_BUDGETS.sourceApiRequestCount,
    encodedBodyBytes: SOURCE_WORKSPACE_PERFORMANCE_BUDGETS.encodedBodyBytes,
    slowestDependencyMs:
      SOURCE_WORKSPACE_PERFORMANCE_BUDGETS.slowestDependencyMs,
  } as const;
  const failures: string[] = [];

  if (!run.authenticated || run.finalPath.startsWith("/sign-in")) {
    failures.push("authenticated_session_not_proven");
  }
  if (run.httpStatus == null || run.httpStatus >= 400) {
    failures.push("navigation_http_error");
  }
  if (!run.finalPath.startsWith("/source")) {
    failures.push("canonical_source_route_not_reached");
  }
  if (
    !finiteNonNegative(run.shellReadyMs) ||
    run.shellReadyMs > budgets.shellReadyMs
  ) {
    failures.push("shell_ready_budget_exceeded");
  }
  if (
    !finiteNonNegative(run.evidenceReadyMs) ||
    run.evidenceReadyMs > budgets.evidenceReadyMs
  ) {
    failures.push("evidence_ready_budget_exceeded");
  }
  if (
    !finiteNonNegative(run.interactionReadyMs) ||
    run.interactionReadyMs > budgets.interactionReadyMs
  ) {
    failures.push("interaction_ready_budget_exceeded");
  }
  if (run.sourceApiRequestCount > budgets.sourceApiRequestCount) {
    failures.push("source_api_request_budget_exceeded");
  }
  if (run.encodedBodyBytes > budgets.encodedBodyBytes) {
    failures.push("payload_budget_exceeded");
  }
  if (
    run.slowestDependency &&
    run.slowestDependency.durationMs > budgets.slowestDependencyMs
  ) {
    failures.push("slowest_dependency_budget_exceeded");
  }
  if (
    run.chartReadiness.required &&
    (!run.chartReadiness.ready || run.chartReadiness.visibleMarkCount < 1)
  ) {
    failures.push("chart_not_ready");
  }
  if (!run.interactionReadiness.ready) {
    failures.push("interaction_not_ready");
  }
  if (run.errors.length > 0) {
    failures.push("browser_errors_recorded");
  }

  return {
    ...run,
    passed: failures.length === 0,
    failures,
    budgets,
    measurementBasis: {
      queryCount: "source_api_requests",
      databaseQueryCount: run.serverTiming.some((entry) =>
        /(?:db|query)/i.test(entry.name),
      )
        ? "server_timing"
        : "not_exposed",
      serverTimingAvailable: run.serverTiming.length > 0,
    },
  };
}

export function summarizeSourceWorkspacePerformance(
  runs: readonly EvaluatedSourceWorkspacePerformanceRun[],
) {
  const routeIds = new Set(runs.map((run) => run.routeId));
  const slowestDependency =
    runs
      .map((run) => run.slowestDependency)
      .filter(
        (entry): entry is SourceWorkspaceDependencyTiming => entry != null,
      )
      .sort((left, right) => right.durationMs - left.durationMs)[0] ?? null;

  return {
    passed: runs.length > 0 && runs.every((run) => run.passed),
    routeCount: routeIds.size,
    runCount: runs.length,
    coldRunCount: runs.filter((run) => run.cold).length,
    warmRunCount: runs.filter((run) => !run.cold).length,
    failureCount: runs.reduce((sum, run) => sum + run.failures.length, 0),
    slowestDependency,
  };
}
