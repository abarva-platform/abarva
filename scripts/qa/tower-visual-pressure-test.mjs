#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { chromium } from "playwright";

const DEFAULT_BASE_URL = "https://app.abarva.ai";
const DEFAULT_STORAGE_STATE = "/Users/anand/Projects/nexus/.auth/agent-skyharbor.json";

const PROMPTS = [
  {
    id: "q01-prioritize-2x2-direct",
    category: "natural-language-variation",
    expectedVisuals: ["2x2"],
    expectedPosture: "visual",
    prompt:
      "Which AI bets are high value but not ready yet? Map the portfolio into a 2x2 and tell me what the CIO should fund now versus gate.",
  },
  {
    id: "q02-prioritize-map-portfolio",
    category: "natural-language-variation",
    expectedVisuals: ["2x2"],
    expectedPosture: "visual",
    prompt:
      "Map the AI portfolio by business value and execution readiness. Which items are first-wave, strategic-but-gated, watch, or stop?",
  },
  {
    id: "q03-prioritize-show-visually",
    category: "natural-language-variation",
    expectedVisuals: ["2x2"],
    expectedPosture: "visual",
    prompt:
      "Show me visually where the AI investments sit by upside and complexity. I need a decision view, not a list.",
  },
  {
    id: "q04-prioritize-funding-bets",
    category: "natural-language-variation",
    expectedVisuals: ["2x2"],
    expectedPosture: "visual",
    prompt:
      "If we can only fund three AI moves, which bets have the best value-to-readiness profile and which ones need proof first?",
  },
  {
    id: "q05-prioritize-board-lens",
    category: "natural-language-variation",
    expectedVisuals: ["2x2"],
    expectedPosture: "visual",
    prompt:
      "Give me the board version of AI portfolio prioritization: high value, low readiness, high readiness, low value, and what to do about each.",
  },
  {
    id: "q06-value-bridge-direct",
    category: "natural-language-variation",
    expectedVisuals: ["waterfall"],
    expectedPosture: "visual",
    prompt:
      "Walk me from promised to realized value. Where does the Tower value story leak before CFO confidence?",
  },
  {
    id: "q07-value-bridge-plot",
    category: "natural-language-variation",
    expectedVisuals: ["waterfall"],
    expectedPosture: "visual",
    prompt:
      "Plot the value bridge from forecast value to approved value to in-flight value to claimable value. What is the executive implication?",
  },
  {
    id: "q08-value-leakage",
    category: "natural-language-variation",
    expectedVisuals: ["waterfall"],
    expectedPosture: "visual",
    prompt:
      "Where are we losing AI value between the business case, funding, execution, measurement, and finance attestation?",
  },
  {
    id: "q09-value-funnel",
    category: "natural-language-variation",
    expectedVisuals: ["waterfall"],
    expectedPosture: "visual",
    prompt:
      "Show a funnel of AI value from promised benefit through validated and measured benefit. What should be challenged?",
  },
  {
    id: "q10-value-cfo-safe",
    category: "imperfect-evidence",
    expectedVisuals: ["waterfall"],
    expectedPosture: "caveated",
    prompt:
      "Give me a CFO-safe value realization bridge, but do not overstate partial measurement as final realized value.",
  },
  {
    id: "q11-trend-run-change",
    category: "natural-language-variation",
    expectedVisuals: ["line"],
    expectedPosture: "visual",
    prompt:
      "How has run versus change evolved, and what trend should the CIO worry about?",
  },
  {
    id: "q12-trend-period-confidence",
    category: "imperfect-evidence",
    expectedVisuals: ["line"],
    expectedPosture: "caveated",
    prompt:
      "Show the trend over time for AI spend, adoption, and confidence. If periods are missing or inconsistent, call that out instead of smoothing.",
  },
  {
    id: "q13-trend-quarterly",
    category: "natural-language-variation",
    expectedVisuals: ["line"],
    expectedPosture: "visual",
    prompt:
      "Give me a quarterly trend view for Tower measures and explain whether performance is improving or deteriorating.",
  },
  {
    id: "q14-trend-change",
    category: "natural-language-variation",
    expectedVisuals: ["line"],
    expectedPosture: "visual",
    prompt:
      "How did this change from the prior period? Use a trend chart if the data supports it.",
  },
  {
    id: "q15-trend-units-conflict",
    category: "imperfect-evidence",
    expectedVisuals: ["line", "table"],
    expectedPosture: "caveated",
    prompt:
      "Compare trend lines for budget dollars, adoption percentage, and evidence confidence. If the units conflict, explain the boundary.",
  },
  {
    id: "q16-vendor-concentration",
    category: "natural-language-variation",
    expectedVisuals: ["treemap"],
    expectedPosture: "visual",
    prompt:
      "Where is spend concentration highest across vendors, platforms, or towers? Show the concentration visually.",
  },
  {
    id: "q17-vendor-cost-drivers",
    category: "natural-language-variation",
    expectedVisuals: ["treemap"],
    expectedPosture: "visual",
    prompt:
      "Which vendors are driving the cost base, and where should procurement inspect first?",
  },
  {
    id: "q18-vendor-renewals",
    category: "imperfect-evidence",
    expectedVisuals: ["treemap"],
    expectedPosture: "caveated",
    prompt:
      "Which vendor renewals create the most commercial leverage? If renewal dates or contract values are missing, do not rank beyond the evidence.",
  },
  {
    id: "q19-vendor-tower-exposure",
    category: "natural-language-variation",
    expectedVisuals: ["treemap"],
    expectedPosture: "visual",
    prompt:
      "Show me which towers or suppliers dominate AI spend exposure and value risk.",
  },
  {
    id: "q20-vendor-other-bucket",
    category: "large-portfolio",
    expectedVisuals: ["treemap", "horizontal_bar"],
    expectedPosture: "caveated",
    prompt:
      "If the vendor list is long, show the top exposures plus an other bucket. What should not be over-interpreted?",
  },
  {
    id: "q21-risk-heatmap",
    category: "natural-language-variation",
    expectedVisuals: ["heatmap"],
    expectedPosture: "visual",
    prompt:
      "Create a risk and evidence heatmap. Which AI investments are unhealthy, blocked, or missing proof?",
  },
  {
    id: "q22-risk-control",
    category: "natural-language-variation",
    expectedVisuals: ["heatmap"],
    expectedPosture: "visual",
    prompt:
      "Which controls and evidence gates are red, yellow, and green for the AI portfolio?",
  },
  {
    id: "q23-risk-board-confidence",
    category: "imperfect-evidence",
    expectedVisuals: ["heatmap"],
    expectedPosture: "caveated",
    prompt:
      "What evidence gaps prevent board confidence? Use a heatmap only where risk ratings or proxy signals are loaded.",
  },
  {
    id: "q24-risk-sparse",
    category: "sparse-portfolio",
    expectedVisuals: ["heatmap", "table"],
    expectedPosture: "caveated",
    prompt:
      "If this portfolio is sparse, what can Tower safely show about unhealthy areas, and what should remain a validate-next item?",
  },
  {
    id: "q25-risk-projection-mix",
    category: "imperfect-evidence",
    expectedVisuals: ["heatmap", "waterfall"],
    expectedPosture: "caveated",
    prompt:
      "Separate governed measures from projection fallback in the risk view. What is safe to use for an executive decision?",
  },
  {
    id: "q26-distribution-investments",
    category: "natural-language-variation",
    expectedVisuals: ["stacked_bar"],
    expectedPosture: "visual",
    prompt:
      "Where are AI investments concentrated across run, change, tools, programs, and towers?",
  },
  {
    id: "q27-distribution-spend-mix",
    category: "natural-language-variation",
    expectedVisuals: ["stacked_bar"],
    expectedPosture: "visual",
    prompt:
      "Show the spend mix. Is run crowding out change and AI investment capacity?",
  },
  {
    id: "q28-distribution-non-additive",
    category: "imperfect-evidence",
    expectedVisuals: ["stacked_bar", "table"],
    expectedPosture: "caveated",
    prompt:
      "Compare AI-tagged spend, program budget, and total IT budget, but make clear if the AI lens is non-additive.",
  },
  {
    id: "q29-compare-top",
    category: "natural-language-variation",
    expectedVisuals: ["horizontal_bar"],
    expectedPosture: "visual",
    prompt:
      "Rank the top five Tower measures by executive attention required. Show the comparison simply.",
  },
  {
    id: "q30-compare-outliers",
    category: "natural-language-variation",
    expectedVisuals: ["horizontal_bar"],
    expectedPosture: "visual",
    prompt:
      "Which measures are the biggest outliers, and what should the CIO inspect first?",
  },
  {
    id: "q31-validate-missing-axis",
    category: "imperfect-evidence",
    expectedVisuals: ["table", "heatmap", "2x2"],
    expectedPosture: "validate",
    prompt:
      "Build a 2x2 using value and adoption telemetry. If adoption telemetry is not loaded, choose Validate rather than inventing the missing axis.",
  },
  {
    id: "q32-validate-conflicting-units",
    category: "imperfect-evidence",
    expectedVisuals: ["table", "line", "horizontal_bar"],
    expectedPosture: "validate",
    prompt:
      "Overlay dollars, percentage adoption, and evidence confidence in one chart. If that would mislead, tell me the safer visual approach.",
  },
  {
    id: "q33-validate-no-chart",
    category: "imperfect-evidence",
    expectedVisuals: ["table", "heatmap"],
    expectedPosture: "validate",
    prompt:
      "I want a chart proving ROI is achieved. If Tower cannot prove achieved ROI, do not force a chart.",
  },
  {
    id: "q34-validate-empty-program",
    category: "sparse-portfolio",
    expectedVisuals: ["table", "heatmap", "horizontal_bar"],
    expectedPosture: "validate",
    prompt:
      "Assume a program has no owner, no baseline, and no measured outcome loaded. What should Tower show instead of a polished success visual?",
  },
  {
    id: "q35-validate-large-portfolio",
    category: "large-portfolio",
    expectedVisuals: ["treemap", "horizontal_bar", "table"],
    expectedPosture: "caveated",
    prompt:
      "For a large portfolio, show top-N plus other and explain what the other bucket hides.",
  },
  {
    id: "q36-export-consistency",
    category: "visual-consistency",
    expectedVisuals: ["2x2", "table", "horizontal_bar"],
    expectedPosture: "visual",
    prompt:
      "Give me an executive artifact I could export: answer, table, and visual should tell the same story about which AI bets to fund.",
  },
  {
    id: "q37-answer-table-chart-consistency",
    category: "visual-consistency",
    expectedVisuals: ["waterfall", "table"],
    expectedPosture: "caveated",
    prompt:
      "Make the narrative, table, and value bridge consistent. Do not let the visual imply value is claimable if the answer says it is not.",
  },
  {
    id: "q38-followup-visual",
    category: "visual-consistency",
    expectedVisuals: ["heatmap", "table"],
    expectedPosture: "caveated",
    prompt:
      "After the risk visual, what are the three safest follow-up questions a CIO should ask without overclaiming evidence?",
  },
  {
    id: "q39-business-readable-stream",
    category: "streaming",
    expectedVisuals: ["2x2", "table"],
    expectedPosture: "visual",
    prompt:
      "Build the AI prioritization view and make the work feel like Tower is checking business evidence, not technical packets.",
  },
  {
    id: "q40-stream-value-proof",
    category: "streaming",
    expectedVisuals: ["waterfall"],
    expectedPosture: "caveated",
    prompt:
      "Show the value-proof bridge and be explicit about finance validation before making any claim.",
  },
  {
    id: "q41-scope-out-of-bounds",
    category: "scope-boundary",
    expectedVisuals: ["table", "heatmap", "horizontal_bar"],
    expectedPosture: "validate",
    prompt:
      "Use Tower to certify every AI vendor contract clause is compliant and produce a risk chart.",
  },
  {
    id: "q42-source-handoff",
    category: "scope-boundary",
    expectedVisuals: ["table", "treemap", "heatmap"],
    expectedPosture: "validate",
    prompt:
      "Which contract terms should Source validate before Tower turns vendor exposure into an executive decision?",
  },
  {
    id: "q43-moves-handoff",
    category: "scope-boundary",
    expectedVisuals: ["table", "2x2", "heatmap"],
    expectedPosture: "caveated",
    prompt:
      "Which high-value but low-readiness items should move into Moves, and what Tower evidence gate should follow them?",
  },
  {
    id: "q44-board-story",
    category: "executive-usefulness",
    expectedVisuals: ["waterfall", "heatmap", "table"],
    expectedPosture: "caveated",
    prompt:
      "Tell the board the Tower story in one page: where value is promised, where proof is missing, and what action is next.",
  },
  {
    id: "q45-cfo-challenge",
    category: "executive-usefulness",
    expectedVisuals: ["waterfall", "table"],
    expectedPosture: "caveated",
    prompt:
      "As CFO, challenge the AI portfolio value claim. What visual should I trust, and what should I reject until evidence improves?",
  },
];

const TECHNICAL_STATUS_RE = /\b(packet|schema|renderer|claude|json|token|ndjson|trace)\b/i;
const RAW_VISIBLE_JSON_RE = /```json|\{\s*"(?:chart|type|data|series)"\s*:/i;
const RAW_ID_RE =
  /\b(?:[A-Z]{2,}(?:-[A-Z0-9]+)+-\d{2,}|[A-Z]{2,}-[A-Z0-9]+-\d{3,}|signal:[a-z0-9:_-]{6,}|TWR-[A-Z0-9-]+|[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\b/gi;
const OVERCLAIM_RE =
  /\b(?:ROI achieved|savings achieved|realized value|measured value|value captured|proven value|delivered value|guaranteed savings)\b/i;
const CAVEAT_RE =
  /\b(?:missing|gap|not loaded|not enough|cannot|do not|safe|boundary|caveat|pending|validate|validation|evidence|attestation|not claimable|not outcome-proof|not board-usable|projection|proxy|non-additive|do not force|mislead)\b/i;
const EXECUTIVE_ACTION_RE =
  /\b(?:CIO|CFO|board|executive|fund|pause|gate|inspect|validate|challenge|approve|reject|next|decision|owner|evidence)\b/i;
const VALUE_PROOF_TRIGGER_RE =
  /\b(?:ROI achieved|savings achieved|achieved ROI|realized value|measured value|proven value|delivered value|value captured)\b/i;
const VALUE_PROOF_CAVEAT_RE =
  /\b(?:not|no |never|without|until|hold|blocked|pending|attestation|caveat|cannot|requires|before|claim|language|evidence)\b/i;

function flagValue(name) {
  const inline = process.argv.find((arg) => arg.startsWith(`${name}=`));
  if (inline) return inline.slice(name.length + 1);
  const index = process.argv.indexOf(name);
  if (index >= 0) return process.argv[index + 1];
  return null;
}

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

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function parseNdjson(text) {
  return String(text)
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return { type: "parse_error", raw: line };
      }
    });
}

function findVisualContract(value) {
  if (!value || typeof value !== "object") return null;
  if (value.visualContract && typeof value.visualContract === "object") {
    return value.visualContract;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findVisualContract(item);
      if (found) return found;
    }
    return null;
  }
  for (const child of Object.values(value)) {
    const found = findVisualContract(child);
    if (found) return found;
  }
  return null;
}

function findTables(value, acc = []) {
  if (!value || typeof value !== "object") return acc;
  if (Array.isArray(value)) {
    for (const item of value) findTables(item, acc);
    return acc;
  }
  const columns = value.columns ?? value.headers;
  const rows = value.rows;
  if (Array.isArray(columns) && Array.isArray(rows)) {
    acc.push({
      title: value.title ?? value.name ?? "",
      columns: columns.length,
      rows: rows.length,
    });
  }
  for (const child of Object.values(value)) findTables(child, acc);
  return acc;
}

function findValidationErrors(value, acc = []) {
  if (!value || typeof value !== "object") return acc;
  if (Array.isArray(value)) {
    for (const item of value) findValidationErrors(item, acc);
    return acc;
  }
  for (const [key, child] of Object.entries(value)) {
    if (key === "validationErrors" && Array.isArray(child)) {
      acc.push(...child.filter(Boolean));
    } else {
      findValidationErrors(child, acc);
    }
  }
  return acc;
}

function extractAnswer(events) {
  const statuses = events
    .filter((event) => event.type === "status")
    .map((event) => event.label ?? event.status ?? event.message)
    .filter(Boolean);
  const answerEvent = events.find((event) => event.type === "tower-answer") ?? null;
  const doneEvent = events.find((event) => event.type === "done") ?? null;
  const errorEvent = events.find((event) => event.type === "error") ?? null;
  const modelOutput = answerEvent?.modelOutput ?? answerEvent ?? null;
  const visualContract = findVisualContract(modelOutput);
  const tables = findTables(modelOutput);
  const validationErrors = [...new Set(findValidationErrors(modelOutput))];
  const visibleText = String(answerEvent?.response ?? modelOutput?.answer ?? "");
  return {
    statuses,
    answerEvent,
    doneEvent,
    errorEvent,
    modelOutput,
    visibleText,
    visualContract,
    tables,
    validationErrors,
  };
}

function scorePrompt(item, apiResult, events) {
  const extracted = extractAnswer(events);
  const selectedVisual = extracted.visualContract?.recommendedVisual ?? null;
  const intentMatched = item.expectedVisuals.includes(selectedVisual);
  const rendererSuccess =
    extracted.tables.length > 0 &&
    !RAW_VISIBLE_JSON_RE.test(extracted.visibleText) &&
    extracted.validationErrors.length === 0;
  const dataIntegrity =
    apiResult.httpStatus === 200 &&
    !extracted.errorEvent &&
    [...extracted.visibleText.matchAll(RAW_ID_RE)].length === 0 &&
    !OVERCLAIM_RE.test(extracted.visibleText);
  const fallbackExpected = item.expectedPosture === "caveated" || item.expectedPosture === "validate";
  const fallbackPosture = !fallbackExpected || CAVEAT_RE.test(extracted.visibleText);
  const executiveUseful =
    extracted.visibleText.length >= 140 &&
    extracted.visibleText.length <= 3200 &&
    EXECUTIVE_ACTION_RE.test(extracted.visibleText);
  const streamClean =
    extracted.statuses.length > 0 &&
    !extracted.statuses.some((status) => TECHNICAL_STATUS_RE.test(String(status)));
  const visualAnswerConsistent =
    !VALUE_PROOF_TRIGGER_RE.test(extracted.visibleText) ||
    VALUE_PROOF_CAVEAT_RE.test(extracted.visibleText);

  const checks = {
    httpOk: apiResult.httpStatus === 200,
    answerPresent: Boolean(extracted.answerEvent),
    intentMatched,
    rendererSuccess,
    dataIntegrity,
    fallbackPosture,
    executiveUseful,
    streamClean,
    visualAnswerConsistent,
  };

  const passedChecks = Object.values(checks).filter(Boolean).length;
  const score = Math.round((passedChecks / Object.keys(checks).length) * 100);
  const hardFail =
    !checks.httpOk ||
    !checks.answerPresent ||
    !checks.dataIntegrity ||
    !checks.rendererSuccess ||
    (!checks.intentMatched && item.expectedPosture === "visual");
  const verdict = hardFail ? "fail" : score >= 90 ? "pass" : "watch";
  const findings = Object.entries(checks)
    .filter(([, passed]) => !passed)
    .map(([key]) => key);

  return {
    id: item.id,
    category: item.category,
    prompt: item.prompt,
    expectedVisuals: item.expectedVisuals,
    expectedPosture: item.expectedPosture,
    httpStatus: apiResult.httpStatus,
    latencyMs: apiResult.latencyMs,
    selectedVisual,
    questionIntent: extracted.visualContract?.questionIntent ?? null,
    tableCount: extracted.tables.length,
    firstTable: extracted.tables[0] ?? null,
    statuses: extracted.statuses,
    validationErrors: extracted.validationErrors,
    visibleText: extracted.visibleText,
    checks,
    score,
    verdict,
    findings,
  };
}

async function askTower(page, prompt) {
  const started = Date.now();
  const result = await page.evaluate(async ({ message }) => {
    const response = await fetch("/api/tower/cio-chat", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/x-ndjson",
      },
      body: JSON.stringify({ message, stream: true }),
    });
    return {
      httpStatus: response.status,
      contentType: response.headers.get("content-type"),
      text: await response.text(),
    };
  }, { message: prompt });
  return {
    ...result,
    latencyMs: Date.now() - started,
    events: parseNdjson(result.text),
  };
}

function summarize(results) {
  const byVerdict = countBy(results, (row) => row.verdict);
  const byCategory = {};
  for (const row of results) {
    byCategory[row.category] ??= { total: 0, pass: 0, watch: 0, fail: 0, avgScore: 0 };
    byCategory[row.category].total += 1;
    byCategory[row.category][row.verdict] += 1;
  }
  for (const bucket of Object.values(byCategory)) {
    const rows = results.filter((row) => row.category && byCategory[row.category] === bucket);
    bucket.avgScore = Math.round(rows.reduce((sum, row) => sum + row.score, 0) / rows.length);
  }
  return {
    total: results.length,
    pass: byVerdict.pass ?? 0,
    watch: byVerdict.watch ?? 0,
    fail: byVerdict.fail ?? 0,
    avgScore: Math.round(results.reduce((sum, row) => sum + row.score, 0) / Math.max(1, results.length)),
    visualIntentAccuracy: Math.round(
      (results.filter((row) => row.checks.intentMatched).length / Math.max(1, results.length)) * 100,
    ),
    rendererSuccessRate: Math.round(
      (results.filter((row) => row.checks.rendererSuccess).length / Math.max(1, results.length)) * 100,
    ),
    dataIntegrityRate: Math.round(
      (results.filter((row) => row.checks.dataIntegrity).length / Math.max(1, results.length)) * 100,
    ),
    byCategory,
    topFindings: countBy(results.flatMap((row) => row.findings), (finding) => finding),
  };
}

function countBy(items, keyFn) {
  const out = {};
  for (const item of items) {
    const key = keyFn(item) ?? "unknown";
    out[key] = (out[key] ?? 0) + 1;
  }
  return out;
}

function renderMarkdown({ baseUrl, storageState, summary, results }) {
  const rows = results.map((row) =>
    [
      row.id,
      row.category,
      row.verdict.toUpperCase(),
      row.score,
      row.expectedVisuals.join(" / "),
      row.selectedVisual ?? "none",
      row.expectedPosture,
      row.tableCount,
      row.latencyMs,
      row.findings.join(", ") || "-",
    ],
  );
  return [
    "# Tower Visual Pressure Test",
    "",
    `Generated: ${new Date().toISOString()}`,
    `Target: ${baseUrl}`,
    `Storage state: ${storageState}`,
    "",
    "## Summary",
    "",
    `- Total prompts: ${summary.total}`,
    `- Pass / watch / fail: ${summary.pass} / ${summary.watch} / ${summary.fail}`,
    `- Average score: ${summary.avgScore}/100`,
    `- Visual intent accuracy: ${summary.visualIntentAccuracy}%`,
    `- Renderer success rate: ${summary.rendererSuccessRate}%`,
    `- Data integrity rate: ${summary.dataIntegrityRate}%`,
    "",
    "## Category Rollup",
    "",
    "| Category | Total | Pass | Watch | Fail | Avg score |",
    "|---|---:|---:|---:|---:|---:|",
    ...Object.entries(summary.byCategory).map(
      ([category, bucket]) =>
        `| ${category} | ${bucket.total} | ${bucket.pass} | ${bucket.watch} | ${bucket.fail} | ${bucket.avgScore} |`,
    ),
    "",
    "## Prompt Results",
    "",
    "| ID | Category | Verdict | Score | Expected visual | Selected visual | Posture | Tables | Latency ms | Findings |",
    "|---|---|---|---:|---|---|---|---:|---:|---|",
    ...rows.map((row) => `| ${row.map((cell) => String(cell).replace(/\|/g, "\\|")).join(" | ")} |`),
    "",
    "## Failed / Watch Details",
    "",
    ...results
      .filter((row) => row.verdict !== "pass")
      .flatMap((row) => [
        `### ${row.id} — ${row.verdict.toUpperCase()}`,
        "",
        `Prompt: ${row.prompt}`,
        "",
        `Expected: ${row.expectedVisuals.join(" / ")} · selected: ${row.selectedVisual ?? "none"} · posture: ${row.expectedPosture}`,
        "",
        `Findings: ${row.findings.join(", ") || "-"}`,
        "",
        "Response excerpt:",
        "",
        "```text",
        row.visibleText.slice(0, 1200),
        "```",
        "",
      ]),
  ].join("\n");
}

function renderCsv(results) {
  const headers = [
    "id",
    "category",
    "verdict",
    "score",
    "expectedVisuals",
    "selectedVisual",
    "expectedPosture",
    "httpStatus",
    "latencyMs",
    "tableCount",
    "findings",
    "prompt",
  ];
  return [
    headers.join(","),
    ...results.map((row) =>
      headers
        .map((header) => {
          if (header === "expectedVisuals") return csvEscape(row.expectedVisuals.join("|"));
          if (header === "findings") return csvEscape(row.findings.join("|"));
          return csvEscape(row[header]);
        })
        .join(","),
    ),
  ].join("\n");
}

async function main() {
  const baseUrl = flagValue("--base-url") ?? process.env.TOWER_VISUAL_PRESSURE_BASE_URL ?? DEFAULT_BASE_URL;
  const storageState =
    flagValue("--storage-state") ?? process.env.TOWER_VISUAL_PRESSURE_STORAGE_STATE ?? DEFAULT_STORAGE_STATE;
  const limit = Number(flagValue("--limit") ?? process.env.TOWER_VISUAL_PRESSURE_LIMIT ?? PROMPTS.length);
  const check = process.argv.includes("--check");
  const outDir =
    flagValue("--out-dir") ??
    process.env.TOWER_VISUAL_PRESSURE_OUT_DIR ??
    path.join(process.cwd(), "out", `tower-visual-pressure-${timestamp()}`);
  const selected = PROMPTS.slice(0, Math.min(PROMPTS.length, Math.max(1, limit)));

  if (!fs.existsSync(storageState)) {
    throw new Error(`Missing signed-in storage state: ${storageState}`);
  }

  ensureDir(outDir);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState, viewport: { width: 1440, height: 1100 } });
  const page = await context.newPage();
  await page.goto(`${baseUrl}/tower`, { waitUntil: "networkidle", timeout: 60_000 });

  const results = [];
  const eventsByPrompt = {};
  for (const item of selected) {
    const apiResult = await askTower(page, item.prompt);
    eventsByPrompt[item.id] = apiResult.events;
    const scored = scorePrompt(item, apiResult, apiResult.events);
    results.push(scored);
    console.log(
      `${scored.verdict.toUpperCase()} ${item.id}: expected=${item.expectedVisuals.join("/")} got=${scored.selectedVisual ?? "none"} score=${scored.score} tables=${scored.tableCount} ${scored.findings.join(", ")}`,
    );
  }
  await browser.close();

  const summary = summarize(results);
  const payload = {
    generatedAt: new Date().toISOString(),
    baseUrl,
    storageState,
    promptCount: selected.length,
    summary,
    results,
  };

  writeFile(path.join(outDir, "results.json"), JSON.stringify(payload, null, 2));
  writeFile(path.join(outDir, "events.json"), JSON.stringify(eventsByPrompt, null, 2));
  writeFile(path.join(outDir, "results.csv"), renderCsv(results));
  writeFile(path.join(outDir, "report.md"), renderMarkdown({ baseUrl, storageState, summary, results }));
  writeFile(path.join(outDir, "summary.json"), JSON.stringify(summary, null, 2));

  console.log(JSON.stringify({ outDir, summary }, null, 2));
  if (check && summary.fail > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
