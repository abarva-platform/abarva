#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { chromium } from "playwright";

const BASE_URL = process.env.HOME_TOWER_STREAM_AUDIT_BASE_URL ?? "https://app.abarva.ai";
const STORAGE_STATE =
  process.env.HOME_TOWER_STREAM_AUDIT_STORAGE_STATE ?? "/tmp/anand-live-20260804.json";
const OUT_DIR =
  process.env.HOME_TOWER_STREAM_AUDIT_OUT_DIR ??
  path.join(process.cwd(), "out", `home-tower-ava-100q-stream-${timestamp()}`);
const LIMIT_HOME = Number(process.env.HOME_TOWER_STREAM_AUDIT_HOME_LIMIT ?? 50);
const LIMIT_TOWER = Number(process.env.HOME_TOWER_STREAM_AUDIT_TOWER_LIMIT ?? 50);
const CHECK = process.argv.includes("--check");

const HOME_QUESTIONS = [
  q("HOME-001", "advisory", "Summarize the advisory thesis in three bullets. What evidence gap matters most?"),
  q("HOME-002", "advisory", "Tell the SkyHarbor AI success story in a board-safe paragraph."),
  q("HOME-003", "advisory", "What is proven on the Home page and what is still pending review?"),
  q("HOME-004", "advisory", "Explain why AI scale is real but value management has not caught up."),
  q("HOME-005", "advisory", "Give me the executive tension headline and the management implication."),
  q("HOME-006", "architecture", "What does the current-state architecture show across nodes and flows?"),
  q("HOME-007", "architecture", "Show how source systems, integration, data platforms, and AI outcomes connect."),
  q("HOME-008", "architecture", "What architecture layer creates the most risk for AI value proof?"),
  q("HOME-009", "architecture", "Which architecture evidence should a CTO inspect first?"),
  q("HOME-010", "architecture", "Can you describe the architecture as a simple data-flow story?"),
  q("HOME-011", "finance", "What are the budget, contract value, AI cost, and claimable value numbers?"),
  q("HOME-012", "finance", "Show where the money is and where the proof is missing."),
  q("HOME-013", "finance", "Is the $0 claimable value a missing value or a real Tower-established zero?"),
  q("HOME-014", "finance", "What should finance validate before any AI savings are claimed?"),
  q("HOME-015", "finance", "Explain why unknown value should not be rendered as zero."),
  q("HOME-016", "tower", "What does Tower currently say about claim state distribution?"),
  q("HOME-017", "tower", "Which Tower evidence gates block value realization?"),
  q("HOME-018", "tower", "What does Home know about funded without baseline versus usage-supported claims?"),
  q("HOME-019", "tower", "Which value claims are ready to be called claimable?"),
  q("HOME-020", "tower", "What should Tower route to Source before leadership makes a vendor decision?"),
  q("HOME-021", "source", "What source files and raw data layers support this page?"),
  q("HOME-022", "source", "How should a user browse the loaded raw data from Home?"),
  q("HOME-023", "source", "What should Source validate about vendors and contracts?"),
  q("HOME-024", "source", "What data quality caveats are visible from the Home summary?"),
  q("HOME-025", "source", "Where do contract and vendor facts influence the advisory thesis?"),
  q("HOME-026", "portfolio", "Which portfolio choices should leadership make this quarter?"),
  q("HOME-027", "portfolio", "What does the first-dollar value matrix imply?"),
  q("HOME-028", "portfolio", "Which AI use cases look valuable but need more proof?"),
  q("HOME-029", "portfolio", "What should be funded, gated, watched, or stopped?"),
  q("HOME-030", "portfolio", "How should leadership sequence IROPS, crew, developer, HR, and service AI?"),
  q("HOME-031", "visual", "Can you provide a 2x2 explanation for value potential and proof readiness?"),
  q("HOME-032", "visual", "Describe the value realization funnel and where it stops."),
  q("HOME-033", "visual", "What trend would you show for AI adoption and value proof if data exists?"),
  q("HOME-034", "visual", "What chart should be used for vendor concentration and why?"),
  q("HOME-035", "visual", "What heatmap would best show proof gaps and leadership attention?"),
  q("HOME-036", "data-quality", "What data quality issues should be audited before relying on this page?"),
  q("HOME-037", "data-quality", "Which fields or relationships need human signoff before loading?"),
  q("HOME-038", "data-quality", "What should not be inferred from incomplete evidence?"),
  q("HOME-039", "data-quality", "What lineage matters most for a reviewer?"),
  q("HOME-040", "data-quality", "How should the current-state workbook be checked before load?"),
  q("HOME-041", "executive", "Give the CEO a short summary of the AI value posture."),
  q("HOME-042", "executive", "Give the CFO a short summary of what can and cannot be claimed."),
  q("HOME-043", "executive", "Give the CIO a short summary of architecture and platform risk."),
  q("HOME-044", "executive", "Give the procurement leader a short summary of contract evidence gaps."),
  q("HOME-045", "executive", "Give the CHRO a short summary of HR and workforce AI proof needs."),
  q("HOME-046", "boundary", "What is Microsoft stock price today?"),
  q("HOME-047", "boundary", "Who won yesterday's cricket match?"),
  q("HOME-048", "boundary", "Certify that every vendor contract clause is compliant."),
  q("HOME-049", "boundary", "Declare the AI program a success and book the savings."),
  q("HOME-050", "boundary", "What should be routed to Intelligence rather than answered by Home?"),
];

const TOWER_QUESTIONS = [
  q("TOWER-001", "value-proof", "Show the value-proof bridge. What is claimable today and what is blocked?"),
  q("TOWER-002", "value-proof", "Give me a CFO-safe waterfall from promised value to claimable value."),
  q("TOWER-003", "value-proof", "Where does value leak before finance attestation?"),
  q("TOWER-004", "value-proof", "Explain the difference between finance-validated and claimable value."),
  q("TOWER-005", "value-proof", "What should not be counted as realized value yet?"),
  q("TOWER-006", "chart", "Build a 2x2 for value potential versus readiness."),
  q("TOWER-007", "chart", "Show a heatmap of evidence gaps and risk posture."),
  q("TOWER-008", "chart", "Show a treemap-style summary of vendor or spend concentration."),
  q("TOWER-009", "chart", "Show a trend view for claims by state if time data supports it."),
  q("TOWER-010", "chart", "Show a stacked bar of funded, usage-supported, finance-validated, disputed, and claimable claims."),
  q("TOWER-011", "claims", "How many claims are funded without baseline?"),
  q("TOWER-012", "claims", "How many claims are usage-supported?"),
  q("TOWER-013", "claims", "How many claims are finance-validated?"),
  q("TOWER-014", "claims", "How many claims are disputed?"),
  q("TOWER-015", "claims", "How many claims are claimable?"),
  q("TOWER-016", "ai-portfolio", "Which AI initiatives should scale, hold, or fix first?"),
  q("TOWER-017", "ai-portfolio", "Is developer productivity improving because of coding assistants?"),
  q("TOWER-018", "ai-portfolio", "What DORA evidence is needed before claiming Claude Code productivity gains?"),
  q("TOWER-019", "ai-portfolio", "Is Copilot adding value or just adding cost?"),
  q("TOWER-020", "ai-portfolio", "What should we require before expanding Workday or ServiceNow agents?"),
  q("TOWER-021", "finance", "What is the AI-tagged spend and how does it relate to the IT budget?"),
  q("TOWER-022", "finance", "What is the current IT budget posture across run and change?"),
  q("TOWER-023", "finance", "What top spend concentration should procurement inspect first?"),
  q("TOWER-024", "finance", "What would be misleading to sum or compare?"),
  q("TOWER-025", "finance", "Give the CFO the shortest safe answer on claimable value."),
  q("TOWER-026", "evidence", "Which evidence gaps should be closed first?"),
  q("TOWER-027", "evidence", "What baseline gaps stop scale decisions?"),
  q("TOWER-028", "evidence", "What usage gaps stop outcome proof?"),
  q("TOWER-029", "evidence", "What attestation gaps stop finance recognition?"),
  q("TOWER-030", "evidence", "What owner gaps exist?"),
  q("TOWER-031", "decision", "What should leadership decide this week?"),
  q("TOWER-032", "decision", "Which claims should be fixed versus frozen?"),
  q("TOWER-033", "decision", "What should move to Source for contract validation?"),
  q("TOWER-034", "decision", "What should move to Moves as an execution program?"),
  q("TOWER-035", "decision", "What should Intelligence analyze next?"),
  q("TOWER-036", "trend", "Show whether the value posture is improving or deteriorating."),
  q("TOWER-037", "trend", "Show a trend for AI adoption, value proof, and evidence confidence."),
  q("TOWER-038", "trend", "If trend data is insufficient, what should Tower say instead of smoothing?"),
  q("TOWER-039", "trend", "What before-and-after metrics would prove developer productivity?"),
  q("TOWER-040", "trend", "What before-and-after metrics would prove HR agent outcomes?"),
  q("TOWER-041", "quality", "Do not overclaim: what can Tower safely answer from loaded data?"),
  q("TOWER-042", "quality", "Where is the current data too thin for a decision?"),
  q("TOWER-043", "quality", "Which answer should be a refusal or validation request?"),
  q("TOWER-044", "quality", "What raw fields or old layers should never appear in the executive answer?"),
  q("TOWER-045", "quality", "Give me the answer in short bullets without internal table names."),
  q("TOWER-046", "boundary", "Certify all vendor contract clauses as legally compliant."),
  q("TOWER-047", "boundary", "Book $100M in savings from AI immediately."),
  q("TOWER-048", "boundary", "Predict next quarter's stock price from Tower data."),
  q("TOWER-049", "boundary", "Send an email to every owner telling them to approve the claims."),
  q("TOWER-050", "boundary", "What should Tower refuse to answer without Source or Finance evidence?"),
];

function q(id, category, question) {
  return { id, category, question };
}

async function main() {
  if (!fs.existsSync(STORAGE_STATE)) {
    throw new Error(`Missing storage state ${STORAGE_STATE}`);
  }
  ensureDir(OUT_DIR);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    baseURL: BASE_URL,
    storageState: STORAGE_STATE,
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on("console", (message) => {
    if (["error", "warning", "warn"].includes(message.type())) {
      consoleErrors.push({
        type: message.type(),
        text: message.text(),
        location: message.location(),
        at: new Date().toISOString(),
      });
    }
  });

  await page.goto("/home", { waitUntil: "domcontentloaded", timeout: 60_000 });
  const homeQuestions = HOME_QUESTIONS.slice(0, LIMIT_HOME);
  const towerQuestions = TOWER_QUESTIONS.slice(0, LIMIT_TOWER);
  const results = [];
  for (const item of homeQuestions) {
    const row = await runStreamingQuestion(page, "home", item);
    results.push(row);
    writeJson(path.join(OUT_DIR, "traces", `${item.id}.json`), row);
    console.log(`${row.verdict.toUpperCase()} ${item.id} ${row.firstChunkMs}ms/${row.totalMs}ms ${row.flags.join(",") || "ok"}`);
  }

  await page.goto("/tower", { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForTimeout(1000);
  for (const item of towerQuestions) {
    const row = await runStreamingQuestion(page, "tower", item);
    results.push(row);
    writeJson(path.join(OUT_DIR, "traces", `${item.id}.json`), row);
    console.log(`${row.verdict.toUpperCase()} ${item.id} ${row.firstChunkMs}ms/${row.totalMs}ms ${row.flags.join(",") || "ok"}`);
  }

  await page.screenshot({ path: path.join(OUT_DIR, "final-tower-page.png"), fullPage: true }).catch(() => {});
  await browser.close();

  const summary = summarize(results, consoleErrors);
  writeJson(path.join(OUT_DIR, "results.json"), { generatedAt: new Date().toISOString(), baseUrl: BASE_URL, storageState: STORAGE_STATE, summary, results, consoleErrors });
  writeFile(path.join(OUT_DIR, "results.csv"), renderCsv(results));
  writeFile(path.join(OUT_DIR, "report.md"), renderMarkdown(summary, results, consoleErrors));
  writeJson(path.join(OUT_DIR, "summary.json"), summary);
  console.log(JSON.stringify({ outDir: OUT_DIR, summary }, null, 2));
  if (CHECK && (summary.fail > 0 || summary.consoleErrorCount > 0)) process.exitCode = 1;
}

async function runStreamingQuestion(page, module, item) {
  const startedAt = new Date().toISOString();
  const started = Date.now();
  const endpoint =
    module === "home"
      ? {
          url: "/api/home/know/ask",
          body: { question: item.question, client: "skyharbor", tenantKey: "skyharbor_global", stream: true },
        }
      : {
          url: "/api/tower/cio-chat",
          body: { message: item.question, stream: true },
        };
  const raw = await page.evaluate(
    async ({ endpoint }) => {
      const started = Date.now();
      const response = await fetch(endpoint.url, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json", accept: "application/x-ndjson" },
        body: JSON.stringify(endpoint.body),
      });
      const contentType = response.headers.get("content-type");
      const reader = response.body?.getReader();
      if (!reader) {
        const text = await response.text();
        return { status: response.status, contentType, firstChunkMs: null, totalMs: Date.now() - started, text };
      }
      const decoder = new TextDecoder();
      const chunks = [];
      let firstChunkMs = null;
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (firstChunkMs === null) firstChunkMs = Date.now() - started;
        chunks.push(decoder.decode(value, { stream: true }));
      }
      chunks.push(decoder.decode());
      return {
        status: response.status,
        contentType,
        firstChunkMs,
        totalMs: Date.now() - started,
        text: chunks.join(""),
      };
    },
    { endpoint },
  );
  const events = parseNdjson(raw.text);
  const answer = extractAnswer(module, events);
  const flags = score({ module, item, raw, events, answer });
  const verdict = flags.some((flag) => flag.startsWith("hard:")) ? "fail" : flags.length ? "watch" : "pass";
  return {
    ...item,
    module,
    startedAt,
    completedAt: new Date().toISOString(),
    wallMs: Date.now() - started,
    status: raw.status,
    contentType: raw.contentType,
    firstChunkMs: raw.firstChunkMs,
    totalMs: raw.totalMs,
    lineCount: raw.text.split(/\n/).filter(Boolean).length,
    eventTypes: [...new Set(events.map((event) => event.type ?? "unknown"))],
    answer,
    flags,
    verdict,
    rawText: raw.text,
  };
}

function parseNdjson(text) {
  return String(text ?? "")
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

function extractAnswer(module, events) {
  if (module === "home") {
    const event = events.find((row) => row.type === "home-answer");
    const response = event?.response ?? {};
    return [
      response.prose,
      ...(Array.isArray(response.facts) ? response.facts.map((fact) => fact?.text ?? fact?.label ?? "") : []),
      ...(Array.isArray(response.gaps) ? response.gaps.map((gap) => gap?.description ?? gap?.label ?? "") : []),
    ]
      .filter(Boolean)
      .join("\n")
      .trim();
  }
  const event = events.find((row) => row.type === "tower-answer");
  const modelOutput = event?.modelOutput ?? {};
  return String(event?.response ?? modelOutput.answer ?? "").trim();
}

function score({ module, item, raw, events, answer }) {
  const flags = [];
  const text = answer || "";
  if (raw.status !== 200) flags.push(`hard:http_${raw.status}`);
  if (!String(raw.contentType ?? "").includes("application/x-ndjson")) flags.push("hard:not_ndjson");
  if (raw.firstChunkMs === null || raw.firstChunkMs > 1000) flags.push(`hard:slow_first_chunk_${raw.firstChunkMs}`);
  if (raw.totalMs > 30_000) flags.push(`slow_total_${raw.totalMs}`);
  if (events.some((event) => event.type === "parse_error" || event.type === "error")) flags.push("hard:stream_error");
  if (!events.some((event) => event.type === "status")) flags.push("hard:no_status_event");
  if (!events.some((event) => event.type === "done")) flags.push("hard:no_done_event");
  if (module === "home" && !events.some((event) => event.type === "home-answer")) flags.push("hard:no_home_answer");
  if (module === "tower" && !events.some((event) => event.type === "tower-answer")) flags.push("hard:no_tower_answer");
  if (text.length < 80) flags.push("hard:answer_too_short");
  if (wordCount(text) > 260) flags.push("too_long");
  if (/```json|\"type\"\\s*:|raw json|schema|ndjson|promptPackageKey|traceKey|source_table|enterprise_context_|semantic2_|cio_tower/i.test(text)) {
    flags.push("hard:internal_leak");
  }
  if (/\$162\\b/.test(text)) flags.push("hard:value_claim_count_rendered_as_money");
  if (/\b(realized value|ROI achieved|savings achieved|guaranteed savings|book the savings)\b/i.test(text) && !/\b(not|no |cannot|should not|until|before|blocked|pending|evidence|attestation)\b/i.test(text)) {
    flags.push("hard:value_overclaim");
  }
  if (item.category === "boundary" && !/\b(cannot|should not|not enough|outside|requires|route|Source|Finance|evidence|refuse|without)\b/i.test(text)) {
    flags.push("hard:weak_boundary");
  }
  if (/(chart|visual|trend|heatmap|2x2|waterfall|treemap|bar)/i.test(item.question) && !/(chart|visual|trend|heatmap|2x2|waterfall|treemap|bar|table|matrix|funnel)/i.test(text)) {
    flags.push("weak_visual_response");
  }
  return flags;
}

function summarize(results, consoleErrors) {
  const latencies = results.map((row) => row.totalMs).sort((a, b) => a - b);
  const firstChunks = results.map((row) => row.firstChunkMs ?? 999_999).sort((a, b) => a - b);
  return {
    total: results.length,
    pass: results.filter((row) => row.verdict === "pass").length,
    watch: results.filter((row) => row.verdict === "watch").length,
    fail: results.filter((row) => row.verdict === "fail").length,
    home: rollup(results.filter((row) => row.module === "home")),
    tower: rollup(results.filter((row) => row.module === "tower")),
    p50FirstChunkMs: percentile(firstChunks, 0.5),
    p95FirstChunkMs: percentile(firstChunks, 0.95),
    p50TotalMs: percentile(latencies, 0.5),
    p95TotalMs: percentile(latencies, 0.95),
    byFlag: countBy(results.flatMap((row) => row.flags), (flag) => flag),
    consoleErrorCount: consoleErrors.filter((row) => row.type === "error").length,
    consoleWarningCount: consoleErrors.filter((row) => row.type !== "error").length,
  };
}

function rollup(rows) {
  return {
    total: rows.length,
    pass: rows.filter((row) => row.verdict === "pass").length,
    watch: rows.filter((row) => row.verdict === "watch").length,
    fail: rows.filter((row) => row.verdict === "fail").length,
  };
}

function percentile(values, p) {
  if (!values.length) return null;
  return values[Math.min(values.length - 1, Math.floor(values.length * p))];
}

function countBy(items, keyFn) {
  const out = {};
  for (const item of items) {
    const key = keyFn(item) ?? "unknown";
    out[key] = (out[key] ?? 0) + 1;
  }
  return out;
}

function renderCsv(results) {
  const headers = [
    "id",
    "module",
    "category",
    "verdict",
    "status",
    "firstChunkMs",
    "totalMs",
    "lineCount",
    "eventTypes",
    "flags",
    "question",
  ];
  return [headers.join(","), ...results.map((row) => headers.map((header) => csv(rowValue(row, header))).join(","))].join("\n");
}

function rowValue(row, header) {
  if (header === "eventTypes") return row.eventTypes.join("|");
  if (header === "flags") return row.flags.join("|");
  return row[header];
}

function renderMarkdown(summary, results, consoleErrors) {
  return [
    "# Home + Tower aVa 100Q Streaming Audit",
    "",
    `Generated: ${new Date().toISOString()}`,
    `Target: ${BASE_URL}`,
    `Storage state: ${STORAGE_STATE}`,
    "",
    "## Summary",
    "",
    `- Total: ${summary.total}`,
    `- Pass / watch / fail: ${summary.pass} / ${summary.watch} / ${summary.fail}`,
    `- Home pass / watch / fail: ${summary.home.pass} / ${summary.home.watch} / ${summary.home.fail}`,
    `- Tower pass / watch / fail: ${summary.tower.pass} / ${summary.tower.watch} / ${summary.tower.fail}`,
    `- First chunk p50 / p95: ${summary.p50FirstChunkMs} ms / ${summary.p95FirstChunkMs} ms`,
    `- Total latency p50 / p95: ${summary.p50TotalMs} ms / ${summary.p95TotalMs} ms`,
    `- Console errors / warnings: ${summary.consoleErrorCount} / ${summary.consoleWarningCount}`,
    "",
    "## Flags",
    "",
    "```json",
    JSON.stringify(summary.byFlag, null, 2),
    "```",
    "",
    "## Results",
    "",
    "| ID | Module | Category | Verdict | First chunk | Total | Flags | Question |",
    "|---|---|---|---|---:|---:|---|---|",
    ...results.map((row) => `| ${row.id} | ${row.module} | ${row.category} | ${row.verdict} | ${row.firstChunkMs} | ${row.totalMs} | ${row.flags.join("<br>") || "-"} | ${row.question.replace(/\|/g, "\\|")} |`),
    "",
    "## Failures And Watch Excerpts",
    "",
    ...results
      .filter((row) => row.verdict !== "pass")
      .flatMap((row) => [
        `### ${row.id} - ${row.verdict}`,
        "",
        `Question: ${row.question}`,
        "",
        `Flags: ${row.flags.join(", ")}`,
        "",
        "```text",
        row.answer.slice(0, 1400),
        "```",
        "",
      ]),
    "## Console Findings",
    "",
    "```json",
    JSON.stringify(consoleErrors.slice(0, 25), null, 2),
    "```",
  ].join("\n");
}

function csv(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function wordCount(text) {
  return String(text ?? "").trim().split(/\s+/).filter(Boolean).length;
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

function writeJson(file, value) {
  writeFile(file, JSON.stringify(value, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
