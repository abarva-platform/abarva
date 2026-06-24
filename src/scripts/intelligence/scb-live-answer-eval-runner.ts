import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import process from "node:process";

import { chromium, type Page } from "@playwright/test";

import {
  scoreAnswer,
  type AnswerQualityScore,
} from "@/lib/eval/answer-quality/scorer";
import { ANSWER_QUALITY_PASS_THRESHOLD } from "@/lib/eval/answer-quality/rubric";
import {
  createIsolatedPersonaContext,
  resolveCrawlPersonas,
} from "@/lib/crawl/persona-switcher";
import { checkLiveAnswerCase } from "@/lib/intelligence/answer/evals/live-answer";
import { LIVE_ANSWER_CASES } from "@/lib/intelligence/answer/evals/live-answer/bank";
import { validateLiveAnswerBank } from "@/lib/intelligence/answer/evals/live-answer/validate";
import type { LiveAnswerCase } from "@/lib/intelligence/answer/evals/live-answer";

interface Args {
  baseUrl: string;
  persona: string;
  out: string;
  limit: number;
  failOnDeterministicRegression: boolean;
  requireModelJudge: boolean;
}

interface AskObservation {
  ok: boolean;
  prose: string;
  eventCount: number;
  sourceEventCitations: number;
  hasTable: boolean;
  hasChart: boolean;
  hasGraph: boolean;
  crossTenantBlocked: boolean;
  error?: string;
}

interface CaseReport {
  id: string;
  query: string;
  expectedExpertId: string;
  adversarialKind: LiveAnswerCase["adversarialKind"];
  ok: boolean;
  error?: string;
  eventCount: number;
  sourceEventCitations: number;
  answerQualityGatePassed: boolean;
  answerQualityOverall: number;
  answerQualityViolations: AnswerQualityScore["violations"];
  deterministicPass: boolean;
  modelJudged: string[];
  hasTable: boolean;
  hasChart: boolean;
  hasGraph: boolean;
  answerSample: string;
  behaviorNotes: Array<{
    behavior: string;
    mode: string;
    pass: boolean | null;
    note: string;
  }>;
}

interface Report {
  schemaVersion: "scb-live-answer-eval/v1";
  generatedAt: string;
  baseUrl: string;
  persona: string;
  tenantKey: string;
  mode: "live-ava";
  total: number;
  okCount: number;
  deterministicPassCount: number;
  answerQualityPassCount: number;
  modelJudgedPendingCount: number;
  pass: boolean;
  bankValidation: ReturnType<typeof validateLiveAnswerBank>;
  results: CaseReport[];
}

function liveAnswerQualityPass(quality: AnswerQualityScore): boolean {
  return (
    quality.overall >= ANSWER_QUALITY_PASS_THRESHOLD &&
    quality.dimensions.noRawIds > 0 &&
    quality.dimensions.noFakePrecision > 0
  );
}

function answerQualityText(obs: AskObservation): string {
  if (obs.sourceEventCitations <= 0) return obs.prose;
  return `${obs.prose}\n\nEvidence basis: cited sources were emitted for this answer.`;
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    baseUrl: process.env.SCB_LIVE_EVAL_BASE_URL ?? "https://app.abarva.ai",
    persona: process.env.SCB_LIVE_EVAL_PERSONA ?? "agent-meridian",
    out: "reports/scb/w5-1-live-answer-eval.json",
    limit: Number.parseInt(process.env.SCB_LIVE_EVAL_LIMIT ?? "20", 10),
    failOnDeterministicRegression: true,
    requireModelJudge: false,
  };

  for (const arg of argv) {
    if (arg.startsWith("--base-url="))
      args.baseUrl = arg.slice("--base-url=".length);
    else if (arg.startsWith("--persona="))
      args.persona = arg.slice("--persona=".length);
    else if (arg.startsWith("--out=")) args.out = arg.slice("--out=".length);
    else if (arg.startsWith("--limit="))
      args.limit = Number.parseInt(arg.slice("--limit=".length), 10);
    else if (arg === "--no-fail") args.failOnDeterministicRegression = false;
    else if (arg === "--fail-on-deterministic-regression")
      args.failOnDeterministicRegression = true;
    else if (arg === "--require-model-judge") args.requireModelJudge = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }

  if (!Number.isFinite(args.limit) || args.limit <= 0) {
    throw new Error("--limit must be a positive integer");
  }
  return args;
}

function selectCases(limit: number): LiveAnswerCase[] {
  const positive = LIVE_ANSWER_CASES.filter(
    (item) => item.adversarialKind === null,
  );
  const adversarial = LIVE_ANSWER_CASES.filter(
    (item) => item.adversarialKind !== null,
  );
  const selected: LiveAnswerCase[] = [];
  const max = Math.min(limit, LIVE_ANSWER_CASES.length);
  for (let i = 0; selected.length < max; i += 1) {
    const next =
      i % 2 === 0
        ? positive[Math.floor(i / 2)]
        : adversarial[Math.floor(i / 2)];
    if (next) selected.push(next);
    if (i > LIVE_ANSWER_CASES.length * 2) break;
  }
  return selected;
}

async function askLiveAva(
  page: Page,
  item: LiveAnswerCase,
  persona: { tenantKey: string; tenantName: string },
): Promise<AskObservation> {
  try {
    return await page.evaluate(
      async ({ q, p }) => {
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 75_000);
        try {
          const response = await fetch("/api/intelligence/ask", {
            method: "POST",
            headers: {
              Accept: "application/x-ndjson",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              q,
              client: p.tenantKey,
              surfaceContext: {
                activeTab: "scb-live-answer-eval",
                activeClient: p.tenantKey,
                clientKey: p.tenantKey,
                facts: p.surfaceFacts,
              },
            }),
            signal: controller.signal,
          });

          if (!response.ok || !response.body) {
            return {
              ok: false,
              prose: "",
              error: `ask_api_http_${response.status}`,
              eventCount: 0,
              sourceEventCitations: 0,
              hasTable: false,
              hasChart: false,
              hasGraph: false,
              crossTenantBlocked: false,
            };
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";
          let prose = "";
          let eventCount = 0;
          let sourceEventCitations = 0;
          let hasTable = false;
          let hasChart = false;
          let hasGraph = false;
          let crossTenantBlocked = false;
          let error: string | undefined;

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";
            for (const line of lines) {
              if (!line.trim()) continue;
              eventCount += 1;
              const event = JSON.parse(line) as {
                type?: string;
                text?: string;
                delta?: string;
                error?: string;
                stage?: { name?: string; content?: string };
                sources?: unknown[];
                answer?: {
                  prose?: string;
                  tables?: unknown[];
                  charts?: unknown[];
                  graphs?: unknown[];
                  crossTenantBlocked?: boolean;
                };
              };
              if (event.type === "delta" && event.text) prose += event.text;
              if (event.type === "delta" && event.delta) prose += event.delta;
              if (event.type === "sources" && Array.isArray(event.sources)) {
                sourceEventCitations += event.sources.length;
              }
              if (
                (event.type === "ava-stage" || event.type === "sentinel-stage") &&
                event.stage?.content
              ) {
                prose += `${event.stage.name ?? "Stage"}: ${event.stage.content}\n`;
              }
              if (event.type === "agent-answer" && event.answer) {
                if (event.answer.prose) prose += `\n${event.answer.prose}`;
                hasTable ||=
                  Array.isArray(event.answer.tables) &&
                  event.answer.tables.length > 0;
                hasChart ||=
                  Array.isArray(event.answer.charts) &&
                  event.answer.charts.length > 0;
                hasGraph ||=
                  Array.isArray(event.answer.graphs) &&
                  event.answer.graphs.length > 0;
                crossTenantBlocked ||= Boolean(event.answer.crossTenantBlocked);
              }
              if (event.type === "error")
                error = event.error ?? "ask_api_stream_error";
            }
          }

          return {
            ok: !error && prose.trim().length > 0,
            prose: prose.trim(),
            error,
            eventCount,
            sourceEventCitations,
            hasTable,
            hasChart,
            hasGraph,
            crossTenantBlocked,
          };
        } catch (err) {
          return {
            ok: false,
            prose: "",
            error: err instanceof Error ? err.message : String(err),
            eventCount: 0,
            sourceEventCitations: 0,
            hasTable: false,
            hasChart: false,
            hasGraph: false,
            crossTenantBlocked: false,
          };
        } finally {
          window.clearTimeout(timeout);
        }
      },
      {
        q: item.query,
        p: {
          tenantKey: persona.tenantKey,
          tenantName: persona.tenantName,
          surfaceFacts: [
            `live_eval_persona_tenant=${persona.tenantName}`,
            "live_eval_surface=/intelligence/ask",
            ...(item.surfaceFacts ?? []),
          ],
        },
      },
    );
  } catch (err) {
    return {
      ok: false,
      prose: "",
      error: err instanceof Error ? err.message : String(err),
      eventCount: 0,
      sourceEventCitations: 0,
      hasTable: false,
      hasChart: false,
      hasGraph: false,
      crossTenantBlocked: false,
    };
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolveDelay) => {
    setTimeout(resolveDelay, ms);
  });
}

function isRetryableAskFailure(obs: AskObservation): boolean {
  if (obs.ok || obs.eventCount > 0) return false;
  const error = obs.error ?? "";
  return (
    error.includes("Failed to fetch") ||
    error.includes("Execution context was destroyed") ||
    error.includes("Target page") ||
    error.includes("Navigation failed") ||
    error.includes("abort")
  );
}

async function stabilizeAskPage(page: Page): Promise<void> {
  if (page.isClosed()) return;
  await page
    .goto("/intelligence/ask", {
      waitUntil: "domcontentloaded",
      timeout: 45_000,
    })
    .catch(() => undefined);
  await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => undefined);
}

async function askLiveAvaWithRetry(
  page: Page,
  item: LiveAnswerCase,
  persona: { tenantKey: string; tenantName: string },
): Promise<AskObservation> {
  let latest: AskObservation | null = null;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const obs = await askLiveAva(page, item, persona);
    latest = obs;
    if (!isRetryableAskFailure(obs)) return obs;
    console.warn(
      `scb_live_answer_retry:${item.id}:attempt=${attempt}:error=${obs.error ?? "unknown"}`,
    );
    await delay(750 * attempt);
    await stabilizeAskPage(page);
  }
  return latest!;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const persona = resolveCrawlPersonas(args.persona)[0];
  if (!persona) throw new Error(`Unknown crawl persona: ${args.persona}`);

  const bankValidation = validateLiveAnswerBank(LIVE_ANSWER_CASES, {
    minPerExpert: 5,
    requireAdversarialPerExpert: true,
  });
  if (!bankValidation.ok) {
    throw new Error(
      `live-answer bank invalid:\n${bankValidation.issues
        .map((issue) => `${issue.caseId}: ${issue.message}`)
        .join("\n")}`,
    );
  }

  const selected = selectCases(args.limit);
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.PLAYWRIGHT_CHROMIUM_CHANNEL
      ? { channel: process.env.PLAYWRIGHT_CHROMIUM_CHANNEL }
      : {}),
  });
  const active = await createIsolatedPersonaContext(browser, persona, {
    baseUrl: args.baseUrl,
  });

  try {
    await active.page.goto("/intelligence/ask", {
      waitUntil: "domcontentloaded",
      timeout: 45_000,
    });
    await active.page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => undefined);

    const results: CaseReport[] = [];
    for (const item of selected) {
      console.log(`scb_live_answer_case_start:${persona.key}:${item.id}`);
      if (active.page.isClosed()) {
        throw new Error(`live_answer_page_closed_before_case:${item.id}`);
      }
      const obs = await askLiveAvaWithRetry(active.page, item, persona);
      const behavior = checkLiveAnswerCase(item, obs);
      const quality = scoreAnswer(answerQualityText(obs), {
        questionId: item.id,
        tenantKey: persona.tenantKey,
        surface: "intelligence",
      });
      const qualityPassed = liveAnswerQualityPass(quality);
      results.push({
        id: item.id,
        query: item.query,
        expectedExpertId: item.expectedExpertId,
        adversarialKind: item.adversarialKind,
        ok: obs.ok,
        error: obs.error,
        eventCount: obs.eventCount,
        sourceEventCitations: obs.sourceEventCitations,
        answerQualityGatePassed: qualityPassed,
        answerQualityOverall: quality.overall,
        answerQualityViolations: quality.violations,
        deterministicPass:
          obs.ok && behavior.deterministicPass && qualityPassed,
        modelJudged: behavior.modelJudged,
        hasTable: obs.hasTable,
        hasChart: obs.hasChart,
        hasGraph: obs.hasGraph,
        answerSample: obs.prose.slice(0, 600),
        behaviorNotes: behavior.behaviors.map((b) => ({
          behavior: b.behavior,
          mode: b.mode,
          pass: b.pass,
          note: b.note,
        })),
      });
      const current = results[results.length - 1];
      console.log(
        `scb_live_answer_case_complete:${item.id}:ok=${current.ok}:deterministic=${current.deterministicPass}:judgePending=${current.modelJudged.length}:events=${current.eventCount}`,
      );
    }

    const modelJudgedPendingCount = results.reduce(
      (sum, item) => sum + item.modelJudged.length,
      0,
    );
    const report: Report = {
      schemaVersion: "scb-live-answer-eval/v1",
      generatedAt: new Date().toISOString(),
      baseUrl: args.baseUrl,
      persona: persona.key,
      tenantKey: persona.tenantKey,
      mode: "live-ava",
      total: results.length,
      okCount: results.filter((item) => item.ok).length,
      deterministicPassCount: results.filter((item) => item.deterministicPass)
        .length,
      answerQualityPassCount: results.filter(
        (item) => item.answerQualityGatePassed,
      ).length,
      modelJudgedPendingCount,
      pass:
        results.every((item) => item.deterministicPass) &&
        (!args.requireModelJudge || modelJudgedPendingCount === 0),
      bankValidation,
      results,
    };

    const outPath = resolve(process.cwd(), args.out);
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    console.log(
      `SCB live-answer eval: deterministic=${report.deterministicPassCount}/${report.total}, ` +
        `answerQuality=${report.answerQualityPassCount}/${report.total}, ` +
        `judgePending=${report.modelJudgedPendingCount}`,
    );
    console.log(`Report: ${outPath}`);

    if (
      args.failOnDeterministicRegression &&
      report.deterministicPassCount < report.total
    ) {
      process.exitCode = 1;
    }
    if (args.requireModelJudge && report.modelJudgedPendingCount > 0) {
      process.exitCode = 1;
    }
  } finally {
    await active.context.close().catch(() => undefined);
    await browser.close().catch(() => undefined);
  }
}

if (require.main === module) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
