#!/usr/bin/env npx tsx
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import { chromium, type Page, type Request } from "playwright";

import {
  SOURCE_WORKSPACE_PERFORMANCE_ROUTES,
  SOURCE_WORKSPACE_PERFORMANCE_VERSION,
  evaluateSourceWorkspacePerformanceRun,
  summarizeSourceWorkspacePerformance,
  type SourceWorkspaceDependencyTiming,
  type SourceWorkspacePerformanceRun,
  type SourceWorkspaceServerTiming,
} from "../../src/lib/source/qa/workspace-performance-contract";

type CliOptions = {
  readonly baseUrl: string;
  readonly storageState: string;
  readonly outDir: string;
  readonly routeIds: readonly string[];
  readonly headed: boolean;
};

const DEFAULT_BASE_URL = "https://app.abarva.ai";
const DEFAULT_TIMEOUT_MS = 30_000;

function parseArgs(argv: readonly string[]): CliOptions {
  const values = new Map<string, string>();
  const flags = new Set<string>();
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (!value.startsWith("--")) continue;
    const [key, inline] = value.split("=", 2);
    if (inline != null) values.set(key, inline);
    else if (argv[index + 1] && !argv[index + 1].startsWith("--")) {
      values.set(key, argv[index + 1]);
      index += 1;
    } else flags.add(key);
  }

  if (flags.has("--help")) {
    process.stdout.write(
      `Usage:\n  npm run qa:source-workspace-performance -- --storage-state <path> [options]\n\nOptions:\n  --base-url <url>       Signed-in product origin (default: ${DEFAULT_BASE_URL})\n  --storage-state <path> Playwright storageState containing a live Clerk session\n  --out-dir <path>       Proof output directory\n  --route <id,id>        Subset of command,contracts,levers,evidence,coverage\n  --headed               Show Chromium while measuring\n`,
    );
    process.exit(0);
  }

  const storageState =
    values.get("--storage-state") ??
    process.env.SOURCE_PERF_STORAGE_STATE?.trim() ??
    "";
  if (!storageState) {
    throw new Error(
      "Missing signed-in storage state. Set SOURCE_PERF_STORAGE_STATE or pass --storage-state; unauthenticated timing is not Source performance proof.",
    );
  }
  const timestamp = new Date().toISOString().replaceAll(/[:.]/g, "-");
  return {
    baseUrl: (
      values.get("--base-url") ??
      process.env.SOURCE_PERF_BASE_URL?.trim() ??
      DEFAULT_BASE_URL
    ).replace(/\/$/, ""),
    storageState: path.resolve(storageState),
    outDir: path.resolve(
      values.get("--out-dir") ??
        process.env.SOURCE_PERF_OUT_DIR?.trim() ??
        `proof/source-workspace-performance-${timestamp}`,
    ),
    routeIds: (values.get("--route") ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
    headed: flags.has("--headed"),
  };
}

function assertFreshSignedInStorageState(storageStatePath: string): void {
  if (!fs.existsSync(storageStatePath)) {
    throw new Error(
      `Signed-in storage state does not exist: ${storageStatePath}`,
    );
  }
  const parsed = JSON.parse(fs.readFileSync(storageStatePath, "utf8")) as {
    cookies?: Array<{ name?: string; value?: string; expires?: number }>;
  };
  const session = parsed.cookies?.find(
    (cookie) => cookie.name === "__session" && Boolean(cookie.value),
  );
  if (!session) {
    throw new Error(
      `Storage state ${storageStatePath} has no Clerk __session cookie; refusing unauthenticated proof.`,
    );
  }
  if (
    typeof session.expires === "number" &&
    session.expires > 0 &&
    session.expires <= Date.now() / 1000
  ) {
    throw new Error(
      `Storage state ${storageStatePath} contains an expired Clerk session. Refresh it before measuring.`,
    );
  }
}

function serverTimingFromHeader(
  value: string | undefined,
): SourceWorkspaceServerTiming[] {
  if (!value) return [];
  return value.split(",").flatMap((metric) => {
    const [rawName, ...parameters] = metric.trim().split(";");
    const name = rawName?.trim();
    if (!name) return [];
    let durationMs: number | null = null;
    let description: string | null = null;
    for (const parameter of parameters) {
      const [rawKey, rawValue = ""] = parameter.trim().split("=", 2);
      const key = rawKey.toLowerCase();
      const valuePart = rawValue.trim().replace(/^"|"$/g, "");
      if (key === "dur") {
        const parsed = Number(valuePart);
        durationMs = Number.isFinite(parsed) ? parsed : null;
      }
      if (key === "desc") description = valuePart || null;
    }
    return [{ name, durationMs, description }];
  });
}

function dependencyTiming(
  request: Request,
): SourceWorkspaceDependencyTiming | null {
  const timing = request.timing();
  const end = timing.responseEnd;
  if (end < 0 || timing.startTime < 0) return null;
  return {
    url: request.url(),
    durationMs: Math.max(0, Math.round(end - timing.startTime)),
    resourceType: request.resourceType(),
    status: null,
  };
}

async function visibleChartReadiness(page: Page, required: boolean) {
  if (required) {
    await page
      .waitForFunction(
        () => {
          const wrappers = Array.from(
            document.querySelectorAll<HTMLElement>(".recharts-wrapper"),
          ).filter((node) => {
            const rect = node.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0;
          });
          return wrappers.some(
            (node) =>
              node.querySelectorAll(
                "svg path, svg rect, svg circle, svg line, svg polygon",
              ).length > 0,
          );
        },
        undefined,
        { timeout: DEFAULT_TIMEOUT_MS },
      )
      .catch(() => null);
  }

  return page.evaluate((chartRequired) => {
    const wrappers = Array.from(
      document.querySelectorAll<HTMLElement>(".recharts-wrapper"),
    ).filter((node) => {
      const rect = node.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });
    const visibleMarkCount = wrappers.reduce(
      (sum, node) =>
        sum +
        node.querySelectorAll(
          "svg path, svg rect, svg circle, svg line, svg polygon",
        ).length,
      0,
    );
    return {
      required: chartRequired,
      ready: !chartRequired || (wrappers.length > 0 && visibleMarkCount > 0),
      visibleChartCount: wrappers.length,
      visibleMarkCount,
    };
  }, required);
}

async function interactionReadiness(page: Page, expectedPageLabel: string) {
  return page.evaluate((expectedLabel) => {
    const nav = document.querySelector(
      'nav[aria-label="Source workspace navigation"]',
    );
    const buttons = nav
      ? Array.from(nav.querySelectorAll<HTMLButtonElement>("button"))
      : [];
    const visible = buttons.filter((button) => {
      const rect = button.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });
    const enabled = visible.filter((button) => !button.disabled);
    const active = visible.find(
      (button) => button.getAttribute("aria-pressed") === "true",
    );
    return {
      ready:
        visible.length === 5 &&
        enabled.length === 5 &&
        active?.textContent?.trim() === expectedLabel,
      visibleTabCount: visible.length,
      enabledTabCount: enabled.length,
    };
  }, expectedPageLabel);
}

async function browserResourceTotals(page: Page) {
  return page.evaluate(() => {
    const entries = performance.getEntriesByType(
      "resource",
    ) as PerformanceResourceTiming[];
    const navigation = performance.getEntriesByType("navigation")[0] as
      | PerformanceNavigationTiming
      | undefined;
    const all = navigation ? [navigation, ...entries] : entries;
    return {
      encodedBodyBytes: all.reduce(
        (sum, entry) => sum + (entry.encodedBodySize || 0),
        0,
      ),
      transferBytes: all.reduce(
        (sum, entry) => sum + (entry.transferSize || 0),
        0,
      ),
      domContentLoadedMs: Math.round(navigation?.domContentLoadedEventEnd ?? 0),
      performanceServerTiming:
        navigation?.serverTiming.map((entry) => ({
          name: entry.name,
          durationMs: Number.isFinite(entry.duration) ? entry.duration : null,
          description: entry.description || null,
        })) ?? [],
    };
  });
}

async function measureRun(input: {
  readonly page: Page;
  readonly baseUrl: string;
  readonly route: (typeof SOURCE_WORKSPACE_PERFORMANCE_ROUTES)[number];
  readonly cold: boolean;
  readonly screenshotPath: string;
}): Promise<SourceWorkspacePerformanceRun> {
  const { page, baseUrl, route, cold, screenshotPath } = input;
  const startedAt = Date.now();
  const dependencies: SourceWorkspaceDependencyTiming[] = [];
  const dependencyStatuses = new Map<string, number>();
  const responseTimingReads: Array<Promise<SourceWorkspaceServerTiming[]>> = [];
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  let sourceApiRequestCount = 0;
  let totalRequestCount = 0;

  const onRequest = (request: Request) => {
    totalRequestCount += 1;
    const requestUrl = new URL(request.url());
    if (
      requestUrl.origin === new URL(baseUrl).origin &&
      requestUrl.pathname.startsWith("/api/source/")
    ) {
      sourceApiRequestCount += 1;
    }
  };
  const onFinished = (request: Request) => {
    const timing = dependencyTiming(request);
    if (timing) {
      dependencies.push({
        ...timing,
        status: dependencyStatuses.get(request.url()) ?? null,
      });
    }
  };
  const onResponse = (browserResponse: import("playwright").Response) => {
    dependencyStatuses.set(browserResponse.url(), browserResponse.status());
    if (!new URL(browserResponse.url()).pathname.startsWith("/api/source/")) {
      return;
    }
    responseTimingReads.push(
      browserResponse
        .headerValue("server-timing")
        .then((header) =>
          serverTimingFromHeader(header ?? undefined).map((entry) => ({
            ...entry,
            name: `source-api:${entry.name}`,
          })),
        )
        .catch(() => []),
    );
  };
  const onConsole = (message: { type(): string; text(): string }) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  };
  const onPageError = (error: Error) => pageErrors.push(error.message);
  page.on("request", onRequest);
  page.on("requestfinished", onFinished);
  page.on("response", onResponse);
  page.on("console", onConsole);
  page.on("pageerror", onPageError);

  let response;
  try {
    response = await page.goto(`${baseUrl}${route.path}`, {
      waitUntil: "domcontentloaded",
      timeout: DEFAULT_TIMEOUT_MS,
    });
    await page
      .locator('main[aria-label="Source workspace"]')
      .waitFor({ state: "visible", timeout: DEFAULT_TIMEOUT_MS });
    const shellReadyMs = Date.now() - startedAt;
    await page
      .locator(".sw-v2-impact-load-badge.is-ready")
      .waitFor({ state: "visible", timeout: DEFAULT_TIMEOUT_MS });
    const evidenceReadyMs = Date.now() - startedAt;
    const interactions = await interactionReadiness(page, route.pageLabel);
    const interactionReadyMs = Date.now() - startedAt;
    const charts = await visibleChartReadiness(page, route.chartRequired);
    const totals = await browserResourceTotals(page);
    const responseHeaderTiming = serverTimingFromHeader(
      response
        ? ((await response.headerValue("server-timing")) ?? undefined)
        : undefined,
    );
    const apiServerTiming = (await Promise.all(responseTimingReads)).flat();
    const finalUrl = new URL(page.url());
    const authenticated =
      finalUrl.origin === new URL(baseUrl).origin &&
      finalUrl.pathname.startsWith("/source") &&
      !finalUrl.pathname.startsWith("/sign-in");
    const slowestDependency =
      dependencies.sort(
        (left, right) => right.durationMs - left.durationMs,
      )[0] ?? null;

    await page.screenshot({ path: screenshotPath, fullPage: false });

    return {
      routeId: route.id,
      requestedPath: route.path,
      finalPath: `${finalUrl.pathname}${finalUrl.search}`,
      authenticated,
      httpStatus: response?.status() ?? null,
      cold,
      domContentLoadedMs: totals.domContentLoadedMs,
      shellReadyMs,
      evidenceReadyMs,
      interactionReadyMs,
      sourceApiRequestCount,
      totalRequestCount,
      encodedBodyBytes: totals.encodedBodyBytes,
      transferBytes: totals.transferBytes,
      chartReadiness: charts,
      interactionReadiness: interactions,
      slowestDependency,
      serverTiming: [
        ...responseHeaderTiming,
        ...apiServerTiming,
        ...totals.performanceServerTiming,
      ],
      errors: [...consoleErrors, ...pageErrors],
    };
  } finally {
    page.off("request", onRequest);
    page.off("requestfinished", onFinished);
    page.off("response", onResponse);
    page.off("console", onConsole);
    page.off("pageerror", onPageError);
  }
}

function gitSha(): string | null {
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], {
      encoding: "utf8",
    }).trim();
  } catch {
    return null;
  }
}

function renderMarkdown(report: ReturnType<typeof buildReport>): string {
  const lines = [
    "# Source workspace signed-in performance proof",
    "",
    `- Contract: \`${report.contractVersion}\``,
    `- Generated: ${report.generatedAt}`,
    `- Base URL: ${report.baseUrl}`,
    `- Git SHA: ${report.gitSha ?? "not recorded"}`,
    `- Overall: **${report.summary.passed ? "PASS" : "FAIL"}**`,
    `- Query-count basis: Source API requests; database query count is reported only when Server-Timing exposes it.`,
    "",
    "| Route | Cache | Shell | Evidence | API requests | Payload | Charts | Interaction | Result |",
    "|---|---:|---:|---:|---:|---:|---:|---:|---|",
    ...report.runs.map(
      (run) =>
        `| ${run.routeId} | ${run.cold ? "cold" : "warm"} | ${run.shellReadyMs}ms | ${run.evidenceReadyMs}ms | ${run.sourceApiRequestCount} | ${Math.round(run.encodedBodyBytes / 1024)}KB | ${run.chartReadiness.visibleChartCount}/${run.chartReadiness.visibleMarkCount} | ${run.interactionReadiness.enabledTabCount}/5 | ${run.passed ? "PASS" : `FAIL: ${run.failures.join(", ")}`} |`,
    ),
    "",
    "## Slowest dependency",
    "",
    report.summary.slowestDependency
      ? `\`${report.summary.slowestDependency.url}\` — ${report.summary.slowestDependency.durationMs}ms`
      : "No dependency timing was captured.",
    "",
    "## Evidence boundary",
    "",
    "This report proves browser-visible readiness only for the supplied signed-in session and deployment. It does not infer database query count when the server does not expose query timing, and it is not product acceptance for any other tenant or revision.",
    "",
  ];
  return lines.join("\n");
}

function buildReport(input: {
  readonly baseUrl: string;
  readonly runs: ReturnType<typeof evaluateSourceWorkspacePerformanceRun>[];
}) {
  return {
    contractVersion: SOURCE_WORKSPACE_PERFORMANCE_VERSION,
    generatedAt: new Date().toISOString(),
    baseUrl: input.baseUrl,
    gitSha: gitSha(),
    deployment: {
      revision: process.env.SOURCE_PERF_ACA_REVISION?.trim() || null,
      imageDigest: process.env.SOURCE_PERF_IMAGE_DIGEST?.trim() || null,
      datasetVersion: process.env.SOURCE_PERF_DATASET_VERSION?.trim() || null,
    },
    summary: summarizeSourceWorkspacePerformance(input.runs),
    runs: input.runs,
  };
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  assertFreshSignedInStorageState(options.storageState);
  const routes = options.routeIds.length
    ? SOURCE_WORKSPACE_PERFORMANCE_ROUTES.filter((route) =>
        options.routeIds.includes(route.id),
      )
    : SOURCE_WORKSPACE_PERFORMANCE_ROUTES;
  if (
    routes.length === 0 ||
    routes.length !== (options.routeIds.length || routes.length)
  ) {
    throw new Error(
      `Unknown route id. Allowed: ${SOURCE_WORKSPACE_PERFORMANCE_ROUTES.map((route) => route.id).join(", ")}`,
    );
  }

  fs.mkdirSync(options.outDir, { recursive: true });
  const browser = await chromium.launch({ headless: !options.headed });
  const results: ReturnType<typeof evaluateSourceWorkspacePerformanceRun>[] =
    [];
  try {
    for (const route of routes) {
      const context = await browser.newContext({
        storageState: options.storageState,
        viewport: { width: 1440, height: 1000 },
      });
      const page = await context.newPage();
      const cdp = await context.newCDPSession(page);
      await cdp.send("Network.enable");
      await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
      const cold = await measureRun({
        page,
        baseUrl: options.baseUrl,
        route,
        cold: true,
        screenshotPath: path.join(options.outDir, `${route.id}-cold.png`),
      });
      results.push(evaluateSourceWorkspacePerformanceRun(cold));

      await cdp.send("Network.setCacheDisabled", { cacheDisabled: false });
      const warm = await measureRun({
        page,
        baseUrl: options.baseUrl,
        route,
        cold: false,
        screenshotPath: path.join(options.outDir, `${route.id}-warm.png`),
      });
      results.push(evaluateSourceWorkspacePerformanceRun(warm));
      await context.close();
    }
  } finally {
    await browser.close();
  }

  const report = buildReport({ baseUrl: options.baseUrl, runs: results });
  fs.writeFileSync(
    path.join(options.outDir, "summary.json"),
    `${JSON.stringify(report, null, 2)}\n`,
  );
  fs.writeFileSync(
    path.join(options.outDir, "report.md"),
    renderMarkdown(report),
  );
  process.stdout.write(
    `${report.summary.passed ? "PASS" : "FAIL"} ${options.outDir}\n`,
  );
  if (!report.summary.passed) process.exitCode = 1;
}

main().catch((error) => {
  process.stderr.write(
    `${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exitCode = 1;
});
