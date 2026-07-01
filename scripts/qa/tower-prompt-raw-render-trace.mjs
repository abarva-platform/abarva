#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { chromium } from "playwright";

const BASE_URL = process.env.TOWER_TRACE_BASE_URL ?? "https://app.abarva.ai";
const STORAGE_STATE =
  process.env.TOWER_TRACE_STORAGE_STATE ??
  "/Users/anand/Projects/nexus/.auth/agent-skyharbor-cto.json";
const OUT_DIR =
  process.env.TOWER_TRACE_OUT_DIR ??
  path.join(
    "/Users/anand/Downloads",
    `tower-prompt-raw-render-trace-${timestamp()}`,
  );

const DEFAULT_QUESTIONS = [
  {
    id: "top-10-it-programs",
    type: "deterministic",
    question: "give me the list of top 10 IT programs",
  },
  {
    id: "largest-value-gap",
    type: "deterministic",
    question: "Which initiatives have the largest value gap?",
  },
  {
    id: "weak-value-evidence",
    type: "deterministic",
    question: "Which programs have weak value evidence?",
  },
  {
    id: "inspect-this-week",
    type: "deterministic",
    question: "What should I inspect this week?",
  },
  {
    id: "top-5-ai-programs",
    type: "deterministic",
    question: "give me the list of top 5 AI programs by spend and value",
  },
  {
    id: "total-it-spend",
    type: "deterministic",
    question: "what is my IT spend?",
  },
  {
    id: "advisory-posture",
    type: "claude",
    question:
      "Which investment posture should the CIO take on Engineering Productivity AI, and why?",
  },
];

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeFile(file, body) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, body);
}

function asText(value) {
  if (value === null || value === undefined) return "";
  return typeof value === "string" ? value : JSON.stringify(value, null, 2);
}

function escapeHtml(value) {
  return asText(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function readQuestions() {
  const json = process.env.TOWER_TRACE_QUESTIONS_JSON;
  if (!json) return DEFAULT_QUESTIONS;
  const parsed = JSON.parse(json);
  if (!Array.isArray(parsed)) throw new Error("TOWER_TRACE_QUESTIONS_JSON must be an array");
  return parsed.map((item, index) => ({
    id: String(item.id ?? `question-${index + 1}`),
    type: item.type === "claude" ? "claude" : "deterministic",
    question: String(item.question ?? ""),
  })).filter((item) => item.question.trim());
}

function score(row) {
  const trace = row.json.debugTrace ?? null;
  const finalPrompt = trace?.finalPrompt ?? null;
  const rawModelResponse = trace?.rawModelResponse ?? null;
  const rendered = trace?.renderedResponse || row.json.response || "";
  const toolsUsed = Array.isArray(row.json.toolsUsed) ? row.json.toolsUsed : [];
  const deterministicNoClaude =
    row.type === "deterministic" &&
    finalPrompt === null &&
    /^DETERMINISTIC_TOWER_FACTUAL_SPINE\b/.test(asText(rawModelResponse));
  const governedTowerToolTrace =
    row.type === "deterministic" &&
    toolsUsed.includes("answer_cio_tower_question") &&
    typeof finalPrompt === "string" &&
    finalPrompt.trim().length > 0 &&
    typeof rawModelResponse === "string" &&
    rawModelResponse.trim().length > 0;
  const claudeTrace =
    row.type === "claude" &&
    typeof finalPrompt === "string" &&
    finalPrompt.trim().length > 0 &&
    typeof rawModelResponse === "string" &&
    rawModelResponse.trim().length > 0;
  return {
    statusOk: row.status >= 200 && row.status < 300,
    expectedPathOk: row.type === "deterministic" ? deterministicNoClaude || governedTowerToolTrace : claudeTrace,
    renderedNonEmpty: asText(rendered).trim().length > 0,
    renderedEqualsResponse: asText(rendered).trim() === asText(row.json.response).trim(),
  };
}

function buildHtml(rows) {
  const cards = rows
    .map((row) => {
      const trace = row.json.debugTrace ?? {};
      const checks = row.score;
      const badge = Object.values(checks).every(Boolean) ? "pass" : "fail";
      return `
        <section class="card">
          <div class="card-head">
            <div>
              <p class="eyebrow">${escapeHtml(row.type)} · ${escapeHtml(row.id)}</p>
              <h2>${escapeHtml(row.question)}</h2>
            </div>
            <span class="${badge}">${badge.toUpperCase()}</span>
          </div>
          <div class="meta">
            <span>HTTP ${row.status}</span>
            <span>${row.latencyMs} ms</span>
            <span>route ${escapeHtml(row.json.routeType)}</span>
            <span>tools ${escapeHtml((row.json.toolsUsed ?? []).join(", "))}</span>
          </div>
          <div class="checks">
            ${Object.entries(checks)
              .map(([key, value]) => `<span class="${value ? "ok" : "bad"}">${escapeHtml(key)}: ${value ? "yes" : "no"}</span>`)
              .join("")}
          </div>
          <div class="grid">
            <div>
              <h3>Final prompt sent to Claude</h3>
              <pre>${escapeHtml(trace.finalPrompt ?? "NO CLAUDE CALL: deterministic Tower factual-spine path")}</pre>
            </div>
            <div>
              <h3>Raw model response</h3>
              <pre>${escapeHtml(trace.rawModelResponse ?? "NO CLAUDE RESPONSE: deterministic Tower factual-spine path")}</pre>
            </div>
            <div>
              <h3>Rendered response</h3>
              <pre>${escapeHtml(trace.renderedResponse || row.json.response || "")}</pre>
            </div>
          </div>
          <details>
            <summary>Full JSON</summary>
            <pre>${escapeHtml(JSON.stringify(row.json, null, 2))}</pre>
          </details>
        </section>`;
    })
    .join("\n");
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Tower prompt/raw/render trace</title>
  <style>
    body { font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 32px; color: #07142d; background: #f8f6f1; }
    h1 { font-family: Georgia, serif; font-size: 40px; margin: 0 0 8px; }
    h2 { font-size: 20px; margin: 4px 0 0; }
    h3 { font-size: 13px; text-transform: uppercase; letter-spacing: .12em; color: #617089; }
    .summary { color: #526174; margin-bottom: 28px; }
    .card { background: #fff; border: 1px solid #ded8ce; border-radius: 8px; padding: 20px; margin: 0 0 22px; box-shadow: 0 8px 28px rgba(7, 20, 45, .06); }
    .card-head { display: flex; justify-content: space-between; gap: 24px; align-items: flex-start; }
    .eyebrow { margin: 0; text-transform: uppercase; letter-spacing: .16em; color: #087245; font-size: 11px; font-weight: 800; }
    .pass, .fail { border-radius: 999px; padding: 8px 12px; font-size: 12px; font-weight: 800; }
    .pass { color: #07592f; background: #e5f7ed; }
    .fail { color: #8f1f1f; background: #fde8e8; }
    .meta, .checks { display: flex; flex-wrap: wrap; gap: 8px; margin: 14px 0; }
    .meta span, .checks span { border: 1px solid #e1ddd4; border-radius: 999px; padding: 5px 9px; font-size: 12px; background: #fbfaf7; }
    .checks .ok { color: #07592f; border-color: #bee8cd; background: #eefaf3; }
    .checks .bad { color: #8f1f1f; border-color: #f4c3c3; background: #fff2f2; }
    .grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
    pre { white-space: pre-wrap; word-break: break-word; background: #101828; color: #f5f7fb; border-radius: 6px; padding: 14px; font-size: 12px; line-height: 1.45; max-height: 520px; overflow: auto; }
    details pre { max-height: 420px; }
    @media (max-width: 1100px) { .grid { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <h1>Tower prompt/raw/render trace</h1>
  <p class="summary">Target: ${escapeHtml(BASE_URL)} · storage state: ${escapeHtml(STORAGE_STATE)} · generated: ${escapeHtml(new Date().toISOString())}</p>
  ${cards}
</body>
</html>`;
}

async function main() {
  const questions = readQuestions();
  ensureDir(OUT_DIR);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: STORAGE_STATE });
  const page = await context.newPage();
  await page.goto(`${BASE_URL}/tower`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });

  const rows = [];
  for (const item of questions) {
    const started = Date.now();
    const response = await page.request.post(`${BASE_URL}/api/v1/atlas/chat`, {
      data: {
        message: item.question,
        surfaceContext: {
          auditTrace: true,
          traceMode: true,
          auditName: "tower-prompt-raw-render-trace",
          activeTowerDashboardView: "portfolio",
          tenantName: "SkyHarbor Air",
        },
      },
      timeout: 90_000,
    });
    const status = response.status();
    const json = await response
      .json()
      .catch(async () => ({ raw: await response.text().catch(() => "") }));
    const row = {
      ...item,
      status,
      latencyMs: Date.now() - started,
      json,
      score: null,
    };
    row.score = score(row);
    rows.push(row);

    const qdir = path.join(OUT_DIR, "questions", item.id);
    writeFile(path.join(qdir, "01-question.json"), JSON.stringify(item, null, 2));
    writeFile(path.join(qdir, "02-final-prompt.txt"), asText(json.debugTrace?.finalPrompt ?? "NO CLAUDE CALL: deterministic Tower factual-spine path"));
    writeFile(path.join(qdir, "03-raw-model-response.txt"), asText(json.debugTrace?.rawModelResponse ?? "NO CLAUDE RESPONSE: deterministic Tower factual-spine path"));
    writeFile(path.join(qdir, "04-rendered-response.txt"), asText(json.debugTrace?.renderedResponse || json.response || ""));
    writeFile(path.join(qdir, "05-response.json"), JSON.stringify(row, null, 2));
    console.log(`${Object.values(row.score).every(Boolean) ? "PASS" : "FAIL"} ${item.id}: ${item.question}`);
  }

  writeFile(path.join(OUT_DIR, "trace-results.json"), JSON.stringify(rows, null, 2));
  writeFile(path.join(OUT_DIR, "report.html"), buildHtml(rows));
  await browser.close();

  console.log(`Trace written to ${OUT_DIR}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
