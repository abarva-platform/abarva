#!/usr/bin/env npx tsx
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { chromium } from "playwright";
import type { APIRequestContext, Page } from "playwright";
import {
  buildTowerQuestionBank,
  type TowerQuestionBankItem,
  type TowerQuestionCategory,
} from "../../src/lib/tower/tower-question-bank";
import {
  getTowerDatasetReadiness,
  TOWER_DATASET_READINESS,
  type TowerDatasetReadiness,
} from "../../src/lib/tower/tower-question-readiness";

interface ApiResponse {
  response?: string;
  routeType?: string;
  intent?: string;
  atlasMode?: string;
  toolsUsed?: string[];
  toolResults?: unknown;
  debugTrace?: {
    finalPrompt?: string;
    rawModelResponse?: unknown;
    renderedResponse?: string;
    routing?: unknown;
  };
  [key: string]: unknown;
}

interface ScoreResult {
  pass: boolean;
  checks: Record<string, boolean | "na">;
  findings: Record<string, unknown>;
}

interface ScoredQuestion {
  item: TowerQuestionBankItem;
  readiness: TowerDatasetReadiness;
  status: number;
  latencyMs: number;
  responseText: string;
  response: ApiResponse;
  score: ScoreResult;
}

interface DashboardSnapshot {
  text: string;
  moneyValues: number[];
  capturedAt: string;
}

const BASE_URL = process.env.TOWER_SCORER_BASE_URL ?? "https://app.abarva.ai";
const STORAGE_STATE =
  process.env.TOWER_SCORER_STORAGE_STATE ??
  "/Users/anand/Projects/nexus/.auth/agent-lakeshore-cio.json";
const LIMIT = Number(process.env.TOWER_SCORER_LIMIT ?? flagValue("--limit") ?? 400);
const CONCURRENCY = Math.max(
  1,
  Number(process.env.TOWER_SCORER_CONCURRENCY ?? flagValue("--concurrency") ?? 4),
);
const DRY_RUN = process.argv.includes("--dry-run");
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, "-");
const OUT_DIR =
  process.env.TOWER_SCORER_OUT_DIR ??
  path.join(process.cwd(), "out", `tower-live-scorer-${TIMESTAMP}`);
const DOWNLOADS_DIR = path.join(
  "/Users/anand/Downloads",
  `tower-live-scorer-${TIMESTAMP}`,
);

const RAW_ID_RE =
  /\b(?:[A-Z]{2,}(?:-[A-Z0-9]+)+-\d{2,}|[A-Z]{2,}-[A-Z0-9]+-\d{3,}|signal:[a-z0-9:_-]{6,}|TWR-[A-Z0-9-]+|[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\b/gi;
const BANNED_BRAND_RE = /\b(?:Atlas|Sentinel|Nexus)\b/g;
const MACHINE_RE =
  /\b(?:source_key|sourceKey|source_table|source_tables|enterprise_context_|tower_[a-z_]+_view|tower_[a-z_]+_read_model|semantic2_|family-\d+-|\.csv|\.json|\.jsonl)\b/i;
const PRECISE_GAP_RE =
  /\b(?:missing|gap|pending|not ready|not loaded|insufficient|not available|not authoritative|needs|requires)\b/i;
const BROAD_HEDGE_RE =
  /\b(?:not loaded|no data|not available)\b/i;
const MONEY_RE = /\$ ?(\d+(?:\.\d+)?)\s*([KMB])?\b/gi;

async function main() {
  ensureDir(OUT_DIR);

  const bank = buildTowerQuestionBank();
  const sample = stratifiedSample(bank, LIMIT);
  const readinessMap = TOWER_DATASET_READINESS;

  writeJson(path.join(OUT_DIR, "readiness-map.json"), readinessMap);
  writeJson(path.join(OUT_DIR, "sample-plan.json"), {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    requestedLimit: LIMIT,
    selected: sample.length,
    dryRun: DRY_RUN,
    byCategory: countBy(sample, (item) => item.category),
    byDataset: countBy(sample, (item) => item.dataset),
  });

  if (DRY_RUN) {
    await finish(sample.map((item) => dryResult(item)));
    return;
  }

  if (!fs.existsSync(STORAGE_STATE)) {
    throw new Error(
      `Missing signed-in storage state: ${STORAGE_STATE}. Set TOWER_SCORER_STORAGE_STATE to a valid Clerk-authenticated state file.`,
    );
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: STORAGE_STATE });
  const page = await context.newPage();

  await page.goto(`${BASE_URL}/tower`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  const dashboardSnapshot = await captureDashboardSnapshot(page);
  writeFile(path.join(OUT_DIR, "dashboard-snapshot.txt"), dashboardSnapshot.text);
  writeJson(path.join(OUT_DIR, "dashboard-snapshot.json"), dashboardSnapshot);

  const results = await runWithConcurrency(sample, CONCURRENCY, async (item, index) => {
    const result = await scoreLiveQuestion(page.request, item, dashboardSnapshot);
    console.log(
      `${result.score.pass ? "PASS" : "FAIL"} ${index + 1}/${sample.length} ${item.id} ${item.category}/${item.dataset} ${result.latencyMs}ms`,
    );
    return result;
  });

  await browser.close();
  await finish(results);
}

async function scoreLiveQuestion(
  request: APIRequestContext,
  item: TowerQuestionBankItem,
  dashboardSnapshot: DashboardSnapshot,
): Promise<ScoredQuestion> {
  const traceDir = path.join(OUT_DIR, "traces", item.id);
  const started = Date.now();
  let status = 0;
  let response: ApiResponse = {};

  try {
    const apiResponse = await request.post(`${BASE_URL}/api/v1/atlas/chat`, {
      data: {
        message: item.question,
        surfaceContext: {
          auditTrace: true,
          traceMode: true,
          auditName: "tower-live-scorer",
          questionBankId: item.id,
          expectedRoute: item.route,
          expectedArtifact: item.artifact,
          expectedReadModels: item.requiredReadModels,
        },
      },
      timeout: 75_000,
    });
    status = apiResponse.status();
    response = await apiResponse
      .json()
      .catch(async () => ({ response: await apiResponse.text().catch(() => "") }));
  } catch (error) {
    response = { response: error instanceof Error ? error.message : String(error) };
  }

  const latencyMs = Date.now() - started;
  const responseText = renderedText(response);
  const readiness = getTowerDatasetReadiness(item.dataset);
  const score = scoreQuestion(
    item,
    readiness,
    status,
    latencyMs,
    responseText,
    response,
    dashboardSnapshot,
  );
  const result = {
    item,
    readiness,
    status,
    latencyMs,
    responseText,
    response,
    score,
  };

  writeJson(path.join(traceDir, "01-question.json"), item);
  writeJson(path.join(traceDir, "02-readiness.json"), readiness);
  writeJson(path.join(traceDir, "03-raw-response.json"), response);
  writeFile(path.join(traceDir, "04-rendered-response.txt"), responseText);
  writeJson(path.join(traceDir, "05-score.json"), {
    status,
    latencyMs,
    score,
  });

  return result;
}

function stratifiedSample(
  bank: ReadonlyArray<TowerQuestionBankItem>,
  limit: number,
): TowerQuestionBankItem[] {
  const selected: TowerQuestionBankItem[] = [];
  const seen = new Set<string>();
  const add = (items: TowerQuestionBankItem[], max = items.length) => {
    for (const item of items.slice(0, max)) {
      if (!seen.has(item.id)) {
        selected.push(item);
        seen.add(item.id);
      }
    }
  };

  add(bank.filter((item) => item.category === "safety"));
  add(bank.filter((item) => item.category === "handoff"));
  add(bank.filter((item) => item.dataset === "organization_leadership"));

  for (const category of [
    "metric",
    "dataset",
    "cross_dimension",
    "gap",
    "advisory",
  ] satisfies TowerQuestionCategory[]) {
    const byDataset = groupBy(
      bank.filter((item) => item.category === category),
      (item) => item.dataset,
    );
    for (const items of byDataset.values()) {
      add(items, 2);
    }
  }

  for (const item of bank) {
    if (selected.length >= limit) break;
    add([item]);
  }

  return selected.slice(0, limit);
}

async function runWithConcurrency<T, R>(
  items: ReadonlyArray<T>,
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;
  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await worker(items[index], index);
    }
  });
  await Promise.all(runners);
  return results;
}

function dryResult(item: TowerQuestionBankItem): ScoredQuestion {
  const readiness = getTowerDatasetReadiness(item.dataset);
  return {
    item,
    readiness,
    status: 0,
    latencyMs: 0,
    responseText: "",
    response: {},
    score: {
      pass: true,
      checks: {
        sampleSelected: true,
      },
      findings: {},
    },
  };
}

function scoreQuestion(
  item: TowerQuestionBankItem,
  readiness: TowerDatasetReadiness,
  status: number,
  latencyMs: number,
  responseText: string,
  response: ApiResponse,
  dashboardSnapshot: DashboardSnapshot = {
    text: "",
    moneyValues: [],
    capturedAt: new Date(0).toISOString(),
  },
): ScoreResult {
  const rawIds = uniqueMatches(responseText, RAW_ID_RE);
  const brands = uniqueMatches(responseText, BANNED_BRAND_RE);
  const internalTerms = MACHINE_RE.test(responseText);
  const artifactPresent = hasExpectedArtifact(item, response, responseText);
  const routeOk = scoreRoute(item, response);
  const latencyOk = latencyMs <= Math.max(item.latencyTargetMs * 2, 5_000);
  const readinessOk = scoreReadiness(readiness, responseText);
  const handoffOk = item.route !== "handoff" || scoreHandoff(item, responseText);
  const safetyOk =
    item.category !== "safety" ||
    (rawIds.length === 0 &&
      brands.length === 0 &&
      /cannot|can't|must|not|missing|gap|loaded|cite|tenant/i.test(responseText));
  const consistency = scoreConsistency(item, responseText, response, dashboardSnapshot);
  const realism = scoreRealism(item, response, dashboardSnapshot);
  const broadHedge =
    !readiness.readyForAuthoritativeAnswer &&
    BROAD_HEDGE_RE.test(responseText) &&
    !readiness.missingFields.some((field) => responseText.includes(field));

  const checks: Record<string, boolean | "na"> = {
    httpOk: status >= 200 && status < 300,
    nonEmpty: responseText.trim().length > 0,
    latencyOk,
    noRawIds: rawIds.length === 0,
    noStaleBranding: brands.length === 0,
    noInternalKeys: !internalTerms,
    routeOk,
    readinessOk,
    artifactPresent,
    handoffOk,
    safetyOk,
    consistencyOk: consistency.pass,
    realismOk: realism.pass,
    noBroadHedge: !broadHedge,
  };

  return {
    pass: Object.values(checks).every((value) => value === true || value === "na"),
    checks,
    findings: {
      rawIds,
      brands,
      internalTerms,
      consistency,
      realism,
      broadHedge,
      routeType: response.routeType,
      intent: response.intent,
      toolsUsed: response.toolsUsed ?? [],
      moneyValues: extractMoneyValues(responseText),
    },
  };
}

function scoreRoute(item: TowerQuestionBankItem, response: ApiResponse): boolean {
  const routeType = String(response.routeType ?? "");
  const tools = (response.toolsUsed ?? []).map(String);
  if (item.route === "handoff") {
    return !tools.some((tool) => /llm|claude/i.test(tool));
  }
  if (item.route === "deterministic") {
    return !/llm/i.test(routeType) && !tools.some((tool) => /llm|claude/i.test(tool));
  }
  return response.response !== undefined;
}

function scoreReadiness(
  readiness: TowerDatasetReadiness,
  responseText: string,
): boolean {
  if (readiness.readyForAuthoritativeAnswer) {
    return responseText.length >= 80 && !/not ready|pending readiness/i.test(responseText);
  }
  return (
    PRECISE_GAP_RE.test(responseText) ||
    readiness.missingFields.some((field) =>
      responseText.toLowerCase().includes(field.replaceAll("_", " ").toLowerCase()),
    )
  );
}

function hasExpectedArtifact(
  item: TowerQuestionBankItem,
  response: ApiResponse,
  responseText: string,
): boolean {
  if (item.artifact === "prose" || item.artifact === "card") {
    return responseText.trim().length > 0;
  }
  const lowered = responseText.toLowerCase();
  if (item.artifact === "table") {
    return (
      lowered.includes("|") ||
      lowered.includes("table") ||
      deepIncludesKey(response, "tables")
    );
  }
  if (item.artifact === "chart") {
    return lowered.includes("chart") || deepIncludesKey(response, "charts");
  }
  if (item.artifact === "graph") {
    return lowered.includes("graph") || deepIncludesKey(response, "graphs");
  }
  return true;
}

function scoreHandoff(item: TowerQuestionBankItem, responseText: string): boolean {
  const target = item.dataset.replace("handoff_", "");
  if (!target || target === item.dataset) {
    return /cannot|can't|not tower|loaded|tenant|cite/i.test(responseText);
  }
  return responseText.toLowerCase().includes(target);
}

function scoreConsistency(
  item: TowerQuestionBankItem,
  responseText: string,
  response: ApiResponse,
  dashboardSnapshot: DashboardSnapshot,
): { pass: boolean | "na"; expectedValues: number[]; observedValues: number[] } {
  const expectedValues = [
    ...deriveExpectedValues(item, response),
    ...deriveDashboardExpectedValues(item, dashboardSnapshot),
  ];
  const observedValues = extractMoneyValues(responseText);
  if (expectedValues.length === 0) {
    return { pass: "na", expectedValues, observedValues };
  }

  const pass = expectedValues.some((expected) =>
    observedValues.some((observed) => withinTolerance(expected, observed)),
  );
  return { pass, expectedValues, observedValues };
}

function scoreRealism(
  item: TowerQuestionBankItem,
  response: ApiResponse,
  dashboardSnapshot: DashboardSnapshot,
): { pass: boolean | "na"; reason: string } {
  const expectedValues = [
    ...deriveExpectedValues(item, response),
    ...deriveDashboardExpectedValues(item, dashboardSnapshot),
  ];
  if (expectedValues.length === 0) {
    return { pass: "na", reason: "No numeric oracle for realism." };
  }
  const unrealistic = expectedValues.find((value) => value > 500_000_000);
  if (unrealistic !== undefined) {
    return {
      pass: false,
      reason:
        "Read-model amount exceeds current demo realism threshold; keep separate from chat consistency.",
    };
  }
  return { pass: true, reason: "Read-model value is inside scorer realism threshold." };
}

function deriveExpectedValues(
  item: TowerQuestionBankItem,
  response: ApiResponse,
): number[] {
  const text = JSON.stringify(response.toolResults ?? response.debugTrace ?? {});
  const values: number[] = [];
  const likelyKeys =
    item.requiredMetrics.includes("loaded_it_budget") ||
    item.requiredMetrics.includes("portfolio_company_it_budget")
      ? [
          "totalItBudgetUsd",
          "itBudgetUsd",
          "committedAnnualUsd",
          "committedBudgetUsd",
        ]
      : item.requiredMetrics.includes("loaded_program_budget")
        ? ["committedAnnualUsd", "budgetUsd", "committedBudgetUsd"]
        : item.requiredMetrics.includes("vendor_exposure")
          ? ["contractAnnualUsd", "exposureUsd", "annualValueUsd"]
          : item.requiredMetrics.includes("ai_spend")
            ? ["aiSpendUsd", "committedAnnualUsd", "budgetUsd"]
            : [];

  for (const key of likelyKeys) {
    const regex = new RegExp(`"${key}"\\s*:\\s*(\\d+(?:\\.\\d+)?)`, "g");
    for (const match of text.matchAll(regex)) {
      values.push(Number(match[1]));
    }
  }

  return [...new Set(values)].filter((value) => Number.isFinite(value) && value > 0);
}

function deriveDashboardExpectedValues(
  item: TowerQuestionBankItem,
  dashboardSnapshot: DashboardSnapshot,
): number[] {
  if (dashboardSnapshot.moneyValues.length === 0) return [];
  const text = dashboardSnapshot.text.toLowerCase();
  if (
    item.requiredMetrics.some((metric) =>
      [
        "loaded_it_budget",
        "portfolio_company_it_budget",
        "loaded_program_budget",
        "spend_at_risk",
        "vendor_exposure",
        "renewal_exposure",
        "ai_spend",
        "shared_services_allocation",
        "function_spend",
      ].includes(metric),
    )
  ) {
    return dashboardSnapshot.moneyValues;
  }
  if (item.question.toLowerCase().includes("budget") && text.includes("budget")) {
    return dashboardSnapshot.moneyValues;
  }
  if (item.question.toLowerCase().includes("vendor") && text.includes("vendor")) {
    return dashboardSnapshot.moneyValues;
  }
  return [];
}

async function captureDashboardSnapshot(page: Page): Promise<DashboardSnapshot> {
  const text = await page.locator("body").innerText({ timeout: 30_000 }).catch(() => "");
  return {
    text,
    moneyValues: extractMoneyValues(text),
    capturedAt: new Date().toISOString(),
  };
}

function renderedText(response: ApiResponse): string {
  return String(
    response.debugTrace?.renderedResponse ??
      response.response ??
      response.debugTrace?.rawModelResponse ??
      "",
  );
}

function uniqueMatches(text: string, regex: RegExp): string[] {
  return [...new Set([...text.matchAll(regex)].map((match) => match[0]))];
}

function extractMoneyValues(text: string): number[] {
  const values: number[] = [];
  for (const match of text.matchAll(MONEY_RE)) {
    const base = Number(match[1]);
    const unit = match[2]?.toUpperCase();
    const multiplier = unit === "B" ? 1_000_000_000 : unit === "M" ? 1_000_000 : unit === "K" ? 1_000 : 1;
    values.push(base * multiplier);
  }
  return values;
}

function withinTolerance(expected: number, observed: number): boolean {
  const tolerance = Math.max(expected * 0.03, 100_000);
  return Math.abs(expected - observed) <= tolerance;
}

function deepIncludesKey(value: unknown, key: string): boolean {
  if (value === null || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some((entry) => deepIncludesKey(entry, key));
  return (
    Object.prototype.hasOwnProperty.call(value, key) ||
    Object.values(value as Record<string, unknown>).some((entry) =>
      deepIncludesKey(entry, key),
    )
  );
}

async function finish(results: ScoredQuestion[]) {
  const aggregate = aggregateResults(results);
  writeJson(path.join(OUT_DIR, "aggregate-report.json"), aggregate);
  writeFile(path.join(OUT_DIR, "SCORER_REPORT.md"), renderMarkdownReport(results, aggregate));
  writeFile(path.join(OUT_DIR, "report.html"), renderHtmlReport(results, aggregate));

  fs.rmSync(DOWNLOADS_DIR, { recursive: true, force: true });
  fs.cpSync(OUT_DIR, DOWNLOADS_DIR, { recursive: true });
  try {
    execFileSync("zip", ["-qr", `${DOWNLOADS_DIR}.zip`, path.basename(DOWNLOADS_DIR)], {
      cwd: path.dirname(DOWNLOADS_DIR),
    });
  } catch {
    // The directory is still the primary deliverable if the host lacks zip.
  }

  console.log(`\nTower scorer output: ${DOWNLOADS_DIR}`);
  console.log(`Tower scorer zip: ${DOWNLOADS_DIR}.zip`);
  console.log(`Overall: ${aggregate.overall.passed}/${aggregate.overall.total}`);
}

function aggregateResults(results: ScoredQuestion[]) {
  const byCategory: Record<string, { passed: number; total: number }> = {};
  const byDataset: Record<string, { passed: number; total: number }> = {};
  const checks: Record<string, { passed: number; failed: number; na: number }> = {};

  for (const result of results) {
    incrementGroup(byCategory, result.item.category, result.score.pass);
    incrementGroup(byDataset, result.item.dataset, result.score.pass);
    for (const [check, value] of Object.entries(result.score.checks)) {
      checks[check] ??= { passed: 0, failed: 0, na: 0 };
      if (value === "na") checks[check].na += 1;
      else if (value) checks[check].passed += 1;
      else checks[check].failed += 1;
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    storageState: STORAGE_STATE,
    dryRun: DRY_RUN,
    overall: {
      passed: results.filter((result) => result.score.pass).length,
      total: results.length,
    },
    byCategory,
    byDataset,
    checks,
    topFailures: topFailures(results),
  };
}

function renderMarkdownReport(
  results: ScoredQuestion[],
  aggregate: ReturnType<typeof aggregateResults>,
): string {
  return [
    "# Tower Live Scorer Report",
    "",
    `Target: ${BASE_URL}/tower`,
    `Generated: ${aggregate.generatedAt}`,
    `Overall: ${aggregate.overall.passed}/${aggregate.overall.total}`,
    "",
    "## Category Scores",
    "",
    table(
      ["Category", "Passed", "Total"],
      Object.entries(aggregate.byCategory).map(([category, value]) => [
        category,
        String(value.passed),
        String(value.total),
      ]),
    ),
    "",
    "## Check Scores",
    "",
    table(
      ["Check", "Passed", "Failed", "N/A"],
      Object.entries(aggregate.checks).map(([check, value]) => [
        check,
        String(value.passed),
        String(value.failed),
        String(value.na),
      ]),
    ),
    "",
    "## Top Failures",
    "",
    ...aggregate.topFailures.map(
      (failure) =>
        `- ${failure.item.id} ${failure.item.category}/${failure.item.dataset}: ${failure.failedChecks.join(", ")}`,
    ),
    "",
    "## Question Results",
    "",
    table(
      ["ID", "Category", "Dataset", "Readiness", "Latency", "Pass", "Question"],
      results.map((result) => [
        result.item.id,
        result.item.category,
        result.item.dataset,
        result.readiness.state,
        `${result.latencyMs}ms`,
        result.score.pass ? "PASS" : "FAIL",
        result.item.question.replaceAll("|", "\\|"),
      ]),
    ),
    "",
  ].join("\n");
}

function renderHtmlReport(
  results: ScoredQuestion[],
  aggregate: ReturnType<typeof aggregateResults>,
): string {
  const rows = results
    .map(
      (result) => `<tr class="${result.score.pass ? "pass" : "fail"}">
<td>${escapeHtml(result.item.id)}</td>
<td>${escapeHtml(result.item.category)}</td>
<td>${escapeHtml(result.item.dataset)}</td>
<td>${escapeHtml(result.readiness.state)}</td>
<td>${result.latencyMs}ms</td>
<td>${result.score.pass ? "PASS" : "FAIL"}</td>
<td>${escapeHtml(result.item.question)}</td>
<td><pre>${escapeHtml(result.responseText.slice(0, 2500))}</pre></td>
</tr>`,
    )
    .join("\n");

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Tower Live Scorer</title>
  <style>
    body { font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 32px; color: #111827; }
    h1 { margin-bottom: 4px; }
    .summary { display: flex; gap: 16px; margin: 24px 0; }
    .card { border: 1px solid #d1d5db; border-radius: 8px; padding: 16px; min-width: 160px; }
    .metric { font-size: 32px; font-weight: 700; }
    table { border-collapse: collapse; width: 100%; margin-top: 24px; }
    th, td { border: 1px solid #e5e7eb; padding: 10px; vertical-align: top; text-align: left; }
    th { background: #f9fafb; font-size: 12px; text-transform: uppercase; letter-spacing: .08em; color: #6b7280; }
    tr.pass { background: #f0fdf4; }
    tr.fail { background: #fff1f2; }
    pre { white-space: pre-wrap; margin: 0; font-size: 12px; }
  </style>
</head>
<body>
  <h1>Tower Live Scorer</h1>
  <p>${escapeHtml(BASE_URL)}/tower · ${escapeHtml(aggregate.generatedAt)}</p>
  <div class="summary">
    <div class="card"><div>Overall</div><div class="metric">${aggregate.overall.passed}/${aggregate.overall.total}</div></div>
    <div class="card"><div>Consistency failures</div><div class="metric">${aggregate.checks.consistencyOk?.failed ?? 0}</div></div>
    <div class="card"><div>Realism failures</div><div class="metric">${aggregate.checks.realismOk?.failed ?? 0}</div></div>
    <div class="card"><div>Safety failures</div><div class="metric">${aggregate.checks.safetyOk?.failed ?? 0}</div></div>
  </div>
  <table>
    <thead><tr><th>ID</th><th>Category</th><th>Dataset</th><th>Readiness</th><th>Latency</th><th>Pass</th><th>Question</th><th>Answer</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`;
}

function topFailures(results: ScoredQuestion[]) {
  return results
    .filter((result) => !result.score.pass)
    .slice(0, 25)
    .map((result) => ({
      item: result.item,
      failedChecks: Object.entries(result.score.checks)
        .filter(([, value]) => value === false)
        .map(([key]) => key),
    }));
}

function incrementGroup(
  group: Record<string, { passed: number; total: number }>,
  key: string,
  passed: boolean,
) {
  group[key] ??= { passed: 0, total: 0 };
  group[key].total += 1;
  if (passed) group[key].passed += 1;
}

function groupBy<T, K>(items: ReadonlyArray<T>, pick: (item: T) => K): Map<K, T[]> {
  const grouped = new Map<K, T[]>();
  for (const item of items) {
    const key = pick(item);
    grouped.set(key, [...(grouped.get(key) ?? []), item]);
  }
  return grouped;
}

function countBy<T>(items: ReadonlyArray<T>, pick: (item: T) => string) {
  const counts: Record<string, number> = {};
  for (const item of items) {
    const key = pick(item);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

function table(headers: string[], rows: string[][]): string {
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.join(" | ")} |`),
  ].join("\n");
}

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeJson(file: string, body: unknown) {
  writeFile(file, JSON.stringify(body, null, 2));
}

function writeFile(file: string, body: string) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, body);
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function flagValue(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
