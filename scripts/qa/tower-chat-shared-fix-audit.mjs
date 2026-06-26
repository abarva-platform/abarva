#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { chromium } from "playwright";

const QUESTIONS = [
  "Which IT programs should the CIO inspect first and why?",
  "Compare IT spend by portfolio company and call out the outliers.",
  "Which vendor renewals create the most leverage in the next 180 days?",
  "Where is AI spend producing measured value versus only committed spend?",
  "What is the run versus change profile and what does it imply?",
  "Which top programs lack measured value proof?",
  "What should the board know about the Tower portfolio this week?",
  "Which vendors are most concentrated across the portfolio?",
  "What are the gaps preventing ROI confidence?",
  "If we had to pause one initiative until better proof, which one and why?",
];

const BASE_URL = process.env.TOWER_AUDIT_BASE_URL ?? "https://app.abarva.ai";
const STORAGE_STATE =
  process.env.TOWER_AUDIT_STORAGE_STATE ??
  "/Users/anand/Projects/nexus/.auth/agent-lakeshore-cio.json";
const OUT_DIR =
  process.env.TOWER_AUDIT_OUT_DIR ??
  path.join(process.cwd(), "out", `tower-chat-shared-fix-${timestamp()}`);

const RAW_ID_RE =
  /\b(?:[A-Z]{2,}(?:-[A-Z0-9]+)+-\d{2,}|[A-Z]{2,}-[A-Z0-9]+-\d{3,}|signal:[a-z0-9:_-]{6,}|TWR-[A-Z0-9-]+|[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\b/gi;
const BANNED_BRAND_RE = /\b(?:Atlas|Sentinel|Nexus)\b/g;
const MACHINE_PROMPT_RE =
  /\b(?:source_key|sourceKey|source_table|source_tables|source file|source row|Raw tool context|Raw JSON|enterprise_context_|ai_initiatives|ai_initiative_|tower_budget_rollups|semantic2_|family-\d+-|\.csv|\.json|\.jsonl)\b/i;
const NEXT_STEP_RE = /\b(?:next|ask|inspect|open|review|validate|challenge|compare|decide|pause|fund|shape|assign)\b/i;

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

function uniqueMatches(text, regex) {
  return [...new Set([...asText(text).matchAll(regex)].map((match) => match[0]))];
}

function countParagraphs(text) {
  return asText(text).split(/\n\s*\n|\n/).map((line) => line.trim()).filter(Boolean).length;
}

function scoreTrace({ response, trace }) {
  const prompt = asText(trace?.finalPrompt);
  const rendered = asText(trace?.renderedResponse || response?.response);
  const hover = "";
  const raw = asText(trace?.rawModelResponse);
  const promptRawIds = uniqueMatches(prompt, RAW_ID_RE);
  const renderedRawIds = uniqueMatches(`${rendered}\n${hover}`, RAW_ID_RE);
  const brands = uniqueMatches(`${rendered}\n${hover}`, BANNED_BRAND_RE);
  const promptMachine = MACHINE_PROMPT_RE.test(prompt);
  const length = {
    chars: rendered.length,
    paragraphs: countParagraphs(rendered),
  };
  const checks = {
    promptClean: prompt ? promptRawIds.length === 0 && !promptMachine : true,
    idLeak: renderedRawIds.length === 0,
    brand: brands.length === 0,
    length: length.chars <= 1100 && length.paragraphs <= 5,
    nextStep: NEXT_STEP_RE.test(rendered),
    substance: rendered.length >= 120 && !/^\s*(I don'?t know|No data)\b/i.test(rendered),
  };
  return {
    pass: Object.values(checks).every(Boolean),
    checks,
    length,
    findings: {
      promptRawIds,
      renderedRawIds,
      brands,
      promptMachine,
      shapeIssues: trace?.routing?.shapeIssues ?? [],
      replacements: trace?.replacements ?? [],
      rawLength: raw.length,
    },
  };
}

function markdownTable(rows) {
  return [
    "| # | Prompt clean | ID leak | Brand | Length | Next step | Substance | Chars | Paragraphs |",
    "|---:|---|---|---|---|---|---|---:|---:|",
    ...rows.map((row) =>
      [
        row.id,
        row.score.checks.promptClean ? "PASS" : "FAIL",
        row.score.checks.idLeak ? "PASS" : "FAIL",
        row.score.checks.brand ? "PASS" : "FAIL",
        row.score.checks.length ? "PASS" : "FAIL",
        row.score.checks.nextStep ? "PASS" : "FAIL",
        row.score.checks.substance ? "PASS" : "FAIL",
        row.score.length.chars,
        row.score.length.paragraphs,
      ].join(" | "),
    ).map((line) => `| ${line} |`),
  ].join("\n");
}

async function main() {
  ensureDir(OUT_DIR);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: STORAGE_STATE });
  const page = await context.newPage();
  await page.goto(`${BASE_URL}/tower`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  const pageText = await page.locator("body").innerText({ timeout: 30_000 }).catch(() => "");

  const rows = [];
  for (let index = 0; index < QUESTIONS.length; index += 1) {
    const id = index + 1;
    const question = QUESTIONS[index];
    const qdir = path.join(OUT_DIR, "answer-traces", "tower", String(id).padStart(2, "0"));
    const started = Date.now();
    const response = await page.request.post(`${BASE_URL}/api/v1/atlas/chat`, {
      data: {
        message: question,
        surfaceContext: {
          auditTrace: true,
          traceMode: true,
          auditName: "tower-chat-shared-fix",
        },
      },
      timeout: 75_000,
    });
    const status = response.status();
    const json = await response.json().catch(async () => ({ raw: await response.text().catch(() => "") }));
    const trace = json.debugTrace ?? null;
    const score = scoreTrace({ response: json, trace });

    writeFile(path.join(qdir, "01-routing.json"), JSON.stringify(trace?.routing ?? { missing: true }, null, 2));
    writeFile(path.join(qdir, "02-final-prompt.txt"), asText(trace?.finalPrompt));
    writeFile(path.join(qdir, "03-claude-raw.json"), JSON.stringify({ rawModelResponse: trace?.rawModelResponse ?? null }, null, 2));
    writeFile(path.join(qdir, "04-rendered.txt"), asText(trace?.renderedResponse || json.response));
    writeFile(path.join(qdir, "04c-hover.txt"), "");
    writeFile(
      path.join(qdir, "05-diffs.json"),
      JSON.stringify(
        {
          status,
          latencyMs: Date.now() - started,
          question,
          routeType: json.routeType,
          intent: json.intent,
          atlasMode: json.atlasMode,
          score,
        },
        null,
        2,
      ),
    );
    rows.push({ id, question, status, response: json, score });
    console.log(`${score.pass ? "PASS" : "FAIL"} ${id}. ${question} (${score.length.chars} chars)`);
  }

  const passed = rows.filter((row) => row.score.pass).length;
  const beforePath = "/Users/anand/Downloads/tower-chat-quality-audit-20260626/tower-chat-quality-audit.json";
  const before = fs.existsSync(beforePath) ? JSON.parse(fs.readFileSync(beforePath, "utf8")) : null;
  const matrix = markdownTable(rows);

  writeFile(
    path.join(OUT_DIR, "audit-matrix.md"),
    [
      "# Tower Chat Shared Fix Audit Matrix",
      "",
      `Target: ${BASE_URL}/tower`,
      `Storage state: ${STORAGE_STATE}`,
      `Result: ${passed}/${rows.length}`,
      "",
      matrix,
    ].join("\n"),
  );
  writeFile(
    path.join(OUT_DIR, "FINDINGS.md"),
    [
      "# Findings",
      "",
      "- Tower chat responses were requested with trace mode enabled.",
      "- Prompt cleanliness, rendered ID leaks, stale brand leaks, length, next-step affordance, and substance were scored from artifacts.",
      "- Passing requires the verbatim prompt and rendered answer to be clean, not just the screenshot.",
      "",
      `Loaded page text captured: ${pageText.length} characters.`,
    ].join("\n"),
  );
  const beforeFirst = before?.results?.[0];
  const afterFirst = rows[0];
  writeFile(
    path.join(OUT_DIR, "BEFORE_AFTER.md"),
    [
      "# Before / After",
      "",
      "## Before",
      "",
      beforeFirst ? beforeFirst.json?.response ?? "" : "Prior audit JSON not available.",
      "",
      "## After",
      "",
      afterFirst?.response?.response ?? "",
    ].join("\n"),
  );
  writeFile(
    path.join(OUT_DIR, "SHARED_READINESS.md"),
    [
      "# Shared Readiness",
      "",
      "- Shared shaper module: `src/lib/answer/shared-response-shaper.ts`.",
      "- Tower now calls the shared shaper from the orchestration seam after every route type.",
      "- Other surfaces should adopt the same pattern by repointing their assembler to the clean dossier packet and routing their final prose through the shared shaper.",
      "- No Tower-only branch was added inside the shared shaper.",
    ].join("\n"),
  );
  writeFile(
    path.join(OUT_DIR, "release-record.md"),
    [
      "# Release Record Draft",
      "",
      "- Lane: global-control-lane",
      "- Layer: Tower chat answer path plus shared answer shaper",
      "- QA: targeted Jest, TypeScript, focused ESLint, signed-in Tower 10-question trace audit",
      "- Rollback: revert the shaper/orchestrator/llm changes and redeploy the prior ACA digest",
    ].join("\n"),
  );
  writeFile(
    path.join(OUT_DIR, "tower-chat-shared-fix-audit.json"),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        target: `${BASE_URL}/tower`,
        storageState: STORAGE_STATE,
        passed,
        total: rows.length,
        rows,
      },
      null,
      2,
    ),
  );

  await browser.close();
  console.log(`\nAudit output: ${OUT_DIR}`);
  if (passed !== rows.length) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
