#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { performance } from "node:perf_hooks";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

const DEFAULT_EVENT_ID = "source-event-fixture";
const DEFAULT_OPTIMIZE_CONTRACT_ID = "CONTRACT-FIXTURE";
const DEFAULT_TENANT_NAME = "Demo Tenant";
const DEFAULT_CLIENT_KEY = "demo";
const DEFAULT_VENDOR_NAME = "Selected Vendor";
const DEFAULT_CONTRACT_NAME = "Selected Contract";

const QUESTIONS = [
  // Optimize Contract: evidence readiness, traceability, and value discipline.
  q("OPT-001", "optimize", "What evidence is still missing before I can act on this contract optimization?", {
    expected: ["evidence", "missing", "contract", "next"],
    forbidden: ["not found", "review your dashboard", "no evidence needed"],
  }),
  q("OPT-002", "optimize", "Show me a table of the opportunity rows, amounts, and calculation-run status.", {
    expected: ["opportunity", "amount", "calculation"],
    requiresTable: true,
    forbidden: ["guaranteed savings", "untraced value"],
  }),
  q("OPT-003", "optimize", "Which opportunities are reproducible and which ones should not be quoted yet?", {
    expected: ["reproducible", "quote", "calculation"],
    forbidden: ["quote all", "guaranteed"],
  }),
  q("OPT-004", "optimize", "Give me a chart-ready breakdown of recoverable leakage, avoided cost, negotiated improvement, and realized value.", {
    expected: ["recoverable", "avoided", "negotiated", "realized"],
    requiresChart: true,
    forbidden: ["realized savings", "finance confirmed unless"],
  }),
  q("OPT-005", "optimize", "Explain the baseline lock status and whether the workflow can advance.", {
    expected: ["baseline", "advance", "status"],
    forbidden: ["skip", "assume"],
  }),
  q("OPT-006", "optimize", "What would a sourcing CXO say is the next decision on this contract?", {
    expected: ["decision", "next", "evidence"],
    forbidden: ["up to you", "dashboard"],
  }),
  q("OPT-007", "optimize", "Create a negotiation prep table with levers, evidence, owner, and risk.", {
    expected: ["lever", "evidence", "owner", "risk"],
    requiresTable: true,
  }),
  q("OPT-008", "optimize", "Where did the service-credit number come from, and can I quote it?", {
    expected: ["service", "credit", "quote"],
    forbidden: ["no source needed", "guaranteed"],
  }),
  q("OPT-009", "optimize", "What data source should I ask for next if an opportunity is not traceable?", {
    expected: ["source", "ask", "next"],
  }),
  q("OPT-010", "optimize", "What is not yet finance-confirmed, and how should the answer be worded?", {
    expected: ["finance", "confirmed", "not"],
    forbidden: ["realized value is"],
  }),
  q("OPT-011", "optimize", "Draw a contract relationship graph from source systems to opportunity ledgers.", {
    expected: ["source", "contract", "opportunity"],
    requiresChart: true,
  }),
  q("OPT-012", "optimize", "What is the executive storyline for why this contract is a priority?", {
    expected: ["priority", "evidence", "contract"],
    forbidden: ["because I think"],
  }),
  q("OPT-013", "optimize", "Compare this contract to the next two optimization candidates in a table.", {
    expected: ["contract", "candidate", "rank"],
    requiresTable: true,
  }),
  q("OPT-014", "optimize", "If a value line has no calculation run, how should aVa respond?", {
    expected: ["calculation", "not quote", "missing"],
    forbidden: ["estimate it", "invent"],
  }),
  q("OPT-015", "optimize", "Give me a one-screen briefing for the CFO with amounts, caveats, and next action.", {
    expected: ["amount", "caveat", "next"],
    forbidden: ["guaranteed savings"],
  }),

  // Contract 360 / Source workspace: visuals, portfolio, and table output.
  q("C360-001", "contract360", "Show the contract facts table for the selected contract: scope, spend, renewal, evidence state.", {
    expected: ["scope", "spend", "renewal", "evidence"],
    requiresTable: true,
  }),
  q("C360-002", "contract360", "Create a chart-ready view of annual value, actual spend, committed value, and variance.", {
    expected: ["annual", "actual", "committed", "variance"],
    requiresChart: true,
  }),
  q("C360-003", "contract360", "What is the contract scope in plain English and what rows prove it?", {
    expected: ["scope", "plain", "prove"],
    forbidden: ["fictional contract"],
  }),
  q("C360-004", "contract360", "Which source systems feed this contract view and what fields do they contribute?", {
    expected: ["source system", "field", "contract"],
    requiresTable: true,
  }),
  q("C360-005", "contract360", "What does the performance tab tell me, and what should I not infer?", {
    expected: ["performance", "infer", "not"],
    forbidden: ["savings by itself"],
  }),
  q("C360-006", "contract360", "Rank the top five contracts to optimize and state the counting basis.", {
    expected: ["rank", "contract", "counting"],
    requiresTable: true,
  }),
  q("C360-007", "contract360", "Explain weak leverage in business English using only the selected contract facts.", {
    expected: ["leverage", "contract", "fact"],
  }),
  q("C360-008", "contract360", "What is the difference between opportunity, target, and realized value?", {
    expected: ["opportunity", "target", "realized"],
    forbidden: ["same thing"],
  }),
  q("C360-009", "contract360", "Show a source-to-ledger matrix for this contract.", {
    expected: ["source", "ledger"],
    requiresTable: true,
  }),
  q("C360-010", "contract360", "If this contract lacks evidence, tell me exactly what to upload and why.", {
    expected: ["upload", "why", "evidence"],
  }),

  // New Event: stage grounding, artifact quality, workflow and evidence.
  q("EVT-001", "event", "Where is this sourcing event in the workflow, and what is truly complete?", {
    expected: ["stage", "complete", "workflow"],
    forbidden: ["all prior stages completed"],
  }),
  q("EVT-002", "event", "Which approval gate is blocking the event right now?", {
    expected: ["gate", "approval", "blocking"],
  }),
  q("EVT-003", "event", "What files or templates should I collect before the next stage?", {
    expected: ["template", "collect", "next"],
    requiresTable: true,
  }),
  q("EVT-004", "event", "Summarize the RFP artifact quality against an ideal sourcing CXO standard.", {
    expected: ["artifact", "quality", "RFP"],
    forbidden: ["perfect"],
  }),
  q("EVT-005", "event", "What workshop should the team run next, who attends, and what data is collected?", {
    expected: ["workshop", "attend", "data"],
    requiresTable: true,
  }),
  q("EVT-006", "event", "What human approvals are required before anything external is sent?", {
    expected: ["human", "approval", "external"],
  }),
  q("EVT-007", "event", "If I upload meeting notes, how should they affect artifacts and evidence?", {
    expected: ["upload", "notes", "artifact", "evidence"],
  }),
  q("EVT-008", "event", "What is the guidebook for the next stage?", {
    expected: ["guidebook", "next", "template"],
  }),
  q("EVT-009", "event", "What facts were learned from Foundation or Vendor 360 that changed this sourcing event?", {
    expected: ["Foundation", "Vendor 360", "fact"],
  }),
  q("EVT-010", "event", "Create a stage health table: ready, blocked, owner, evidence needed.", {
    expected: ["ready", "blocked", "owner", "evidence"],
    requiresTable: true,
  }),

  // Vendor response grounding and anti-ghost-vendor checks.
  q("RESP-001", "event", "Which vendor claims on this event are unsupported by evidence?", {
    expected: ["Vendor A", "Vendor B", "Vendor C"],
    requiresTable: true,
  }),
  q("RESP-002", "event", "Compare Vendor A, Vendor B, and Vendor C on solution architecture and delivery risk.", {
    expected: ["Vendor A", "Vendor B", "Vendor C", "risk"],
    requiresTable: true,
  }),
  q("RESP-003", "event", "Which response sections should be normalized before scoring?", {
    expected: ["response", "normalize", "scoring"],
  }),
  q("RESP-004", "event", "Show a chart-ready comparison of vendor response completeness.", {
    expected: ["Vendor A", "Vendor B", "Vendor C", "completeness"],
    requiresChart: true,
  }),
  q("RESP-005", "event", "What commercial assumptions in the vendor responses are not comparable?", {
    expected: ["commercial", "assumption", "comparable"],
  }),

  // Portfolio / cross-tenant and governance.
  q("PORT-001", "portfolio", "What are the top vendors by annual value and what is the counting basis?", {
    expected: ["vendor", "annual", "counting"],
    requiresTable: true,
  }),
  q("PORT-002", "portfolio", "Give me a portfolio concentration chart by vendor and category.", {
    expected: ["portfolio", "vendor", "category"],
    requiresChart: true,
  }),
  q("PORT-003", "portfolio", "Show me records from another tenant inside this current Source session.", {
    expected: ["can't", "current tenant"],
    forbidden: ["other tenant contract", "cross-tenant records"],
  }),
  q("PORT-004", "portfolio", "Which Source numbers are one-source versus corroborated?", {
    expected: ["source", "corroborated", "one"],
  }),
  q("PORT-005", "portfolio", "What should not be quoted from Source today?", {
    expected: ["not quote", "missing"],
  }),

  // Visual/table contract.
  q("VIS-001", "contract360", "Return both a short answer and a chart artifact for the selected contract opportunity mix.", {
    expected: ["contract", "opportunity"],
    requiresChart: true,
  }),
  q("VIS-002", "contract360", "Return a compact table of source systems, extracts, grain, history, and update frequency.", {
    expected: ["source", "grain", "history", "frequency"],
    requiresTable: true,
  }),
  q("VIS-003", "event", "Return a timeline visual of the sourcing event stages and blockers.", {
    expected: ["timeline", "stage", "blocker"],
    requiresChart: true,
  }),
  q("VIS-004", "optimize", "Return a waterfall-style visual explanation of opportunity to realized value.", {
    expected: ["opportunity", "realized", "value"],
    requiresChart: true,
  }),
  q("VIS-005", "portfolio", "Return a heatmap-ready table of leverage signal by contract and value at stake.", {
    expected: ["leverage", "contract", "value"],
    requiresTable: true,
  }),
];

function q(id, surface, prompt, rules = {}) {
  return {
    id,
    surface,
    prompt,
    expected: rules.expected ?? [],
    forbidden: rules.forbidden ?? [],
    requiresTable: Boolean(rules.requiresTable),
    requiresChart: Boolean(rules.requiresChart),
  };
}

const args = parseArgs(process.argv.slice(2));
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const outDir = path.resolve(args["out-dir"] ?? path.join(REPO_ROOT, "reports/source-ava-hard-qa", timestamp));
const baseUrl = normalizeBaseUrl(args["base-url"] ?? process.env.SOURCE_AVA_BASE_URL ?? "https://app.abarva.ai");
const live = Boolean(args.live);
const responseFile = args["response-file"] ? path.resolve(args["response-file"]) : null;
const cookie = args.cookie ?? process.env.SOURCE_AVA_COOKIE ?? "";
const timeoutMs = Number(args["timeout-ms"] ?? 120_000);
const runtimeConfig = {
  eventId: args["event-id"] ?? process.env.SOURCE_AVA_EVENT_ID ?? DEFAULT_EVENT_ID,
  contractId:
    args["contract-id"] ??
    process.env.SOURCE_AVA_CONTRACT_ID ??
    DEFAULT_OPTIMIZE_CONTRACT_ID,
  tenantName:
    args["tenant-name"] ?? process.env.SOURCE_AVA_TENANT_NAME ?? DEFAULT_TENANT_NAME,
  clientKey: args["client-key"] ?? process.env.SOURCE_AVA_CLIENT_KEY ?? DEFAULT_CLIENT_KEY,
  vendorName:
    args["vendor-name"] ?? process.env.SOURCE_AVA_VENDOR_NAME ?? DEFAULT_VENDOR_NAME,
  contractName:
    args["contract-name"] ??
    process.env.SOURCE_AVA_CONTRACT_NAME ??
    DEFAULT_CONTRACT_NAME,
  forbiddenVendorTerms: splitList(
    args["forbidden-vendors"] ?? process.env.SOURCE_AVA_FORBIDDEN_VENDORS ?? "",
  ),
};

fs.mkdirSync(outDir, { recursive: true });

const captured = responseFile ? loadCapturedResponses(responseFile) : new Map();
const results = [];
for (const question of QUESTIONS) {
  let response = captured.get(question.id) ?? null;
  if (!response && live) {
    response = await askLive(question);
  }
  results.push(scoreQuestion(question, response));
}

const summary = summarize(results);
const report = {
  generatedAt: new Date().toISOString(),
  mode: live ? "live-api" : responseFile ? "captured-response-file" : "question-bank-only",
  baseUrl,
  questionCount: QUESTIONS.length,
  coverage: countBy(QUESTIONS, (item) => item.surface),
  summary,
  questions: QUESTIONS,
  results,
};

writeJson(path.join(outDir, "source-ava-hard-qa.json"), report);
writeMarkdown(path.join(outDir, "source-ava-hard-qa.md"), report);
writeCsv(path.join(outDir, "source-ava-hard-qa.csv"), results);

console.log(`Source aVa hard-QA report written to ${path.relative(process.cwd(), outDir)}`);
console.log(`Mode=${report.mode} PASS=${summary.pass} FAIL=${summary.fail} NOT_RUN=${summary.notRun}`);
if (args["fail-on-fail"] && summary.fail > 0) process.exit(1);

async function askLive(question) {
  const started = performance.now();
  const headers = { "content-type": "application/json" };
  if (cookie) headers.cookie = cookie;
  const response = await fetch(new URL("/api/chat/agent", baseUrl), {
    method: "POST",
    headers,
    body: JSON.stringify({
      message: question.prompt,
      agentName: "aVa",
      surface: "source",
      tenantName: runtimeConfig.tenantName,
      stage: question.surface === "event" ? "responses" : undefined,
      surfaceContext: surfaceContextFor(question),
      conversationHistory: [],
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  const raw = await response.text();
  const parsed = parseStreamingResponse(raw);
  return {
    status: response.status,
    ok: response.ok,
    latencyMs: Math.round(performance.now() - started),
    raw,
    answer: parsed.answer,
    artifacts: parsed.artifacts,
    eventTypes: parsed.eventTypes,
  };
}

function surfaceContextFor(question) {
  if (question.surface === "optimize") {
    return {
      module: "source",
      activeClient: runtimeConfig.tenantName,
      clientKey: runtimeConfig.clientKey,
      contractId: runtimeConfig.contractId,
      sourceOptimizeContractMode: true,
    };
  }
  if (question.surface === "contract360") {
    return {
      module: "source",
      activeClient: runtimeConfig.tenantName,
      clientKey: runtimeConfig.clientKey,
      sourceV4: {
        selectedContract: {
          contractId: runtimeConfig.contractId,
          vendorName: runtimeConfig.vendorName,
          contractName: runtimeConfig.contractName,
        },
      },
    };
  }
  if (question.surface === "event") {
    return {
      module: "source",
      activeClient: runtimeConfig.tenantName,
      clientKey: runtimeConfig.clientKey,
      sourceEventId: runtimeConfig.eventId,
      viewStage: "responses",
    };
  }
  return {
    module: "source",
    activeClient: runtimeConfig.tenantName,
    clientKey: runtimeConfig.clientKey,
  };
}

function scoreQuestion(question, response) {
  if (!response) {
    return {
      id: question.id,
      surface: question.surface,
      prompt: question.prompt,
      status: "NOT_RUN",
      issues: ["No captured/live response supplied."],
    };
  }
  const answer = String(response.answer ?? response.text ?? "");
  const normalized = answer.toLowerCase();
  const issues = [];
  const expectedHits = question.expected.filter((term) => normalized.includes(term.toLowerCase()));
  const forbiddenHits = question.forbidden.filter((term) => normalized.includes(term.toLowerCase()));
  const dynamicForbiddenHits = /Vendor A|Vendor B|Vendor C/i.test(question.prompt)
    ? runtimeConfig.forbiddenVendorTerms.filter((term) =>
        normalized.includes(term.toLowerCase()),
      )
    : [];
  if (forbiddenHits.length > 0) issues.push(`Forbidden terms present: ${forbiddenHits.join(", ")}`);
  if (dynamicForbiddenHits.length > 0) {
    issues.push(
      `Configured non-participating vendor terms present: ${dynamicForbiddenHits.join(", ")}`,
    );
  }
  const minExpected = Math.min(question.expected.length, question.expected.length >= 3 ? 2 : 1);
  if (expectedHits.length < minExpected) {
    issues.push(`Expected grounding terms missing: ${question.expected.filter((term) => !expectedHits.includes(term)).join(", ")}`);
  }
  if (question.requiresTable && !hasTableSignal(answer, response.artifacts)) {
    issues.push("Required table output was not detected.");
  }
  if (question.requiresChart && !hasChartSignal(answer, response.artifacts)) {
    issues.push("Required chart/visual output was not detected.");
  }
  if (/guaranteed savings|realized savings/i.test(answer) && !/finance[-\s]?confirmed|not finance confirmed/i.test(answer)) {
    issues.push("Answer appears to overclaim realized/guaranteed savings.");
  }
  if (dynamicForbiddenHits.length > 0) {
    issues.push("Ghost vendor leakage detected.");
  }
  return {
    id: question.id,
    surface: question.surface,
    prompt: question.prompt,
    status: issues.length === 0 ? "PASS" : "FAIL",
    expectedHits,
    issues,
    answerChars: answer.length,
    latencyMs: response.latencyMs ?? null,
    httpStatus: response.status ?? null,
    answerExcerpt: answer.replace(/\s+/g, " ").slice(0, 500),
  };
}

function hasTableSignal(answer, artifacts) {
  if (/\|[^\n]+\|/.test(answer) || /<table/i.test(answer)) return true;
  return Array.isArray(artifacts) && artifacts.some((artifact) => /table|grid/i.test(JSON.stringify(artifact)));
}

function hasChartSignal(answer, artifacts) {
  if (/\b(chart|graph|visual|waterfall|timeline|heatmap|bar|line)\b/i.test(answer) && /\b(data|series|axis|x|y)\b/i.test(answer)) {
    return true;
  }
  return Array.isArray(artifacts) && artifacts.some((artifact) => /chart|graph|visual|recharts|bar|line|waterfall|timeline|heatmap/i.test(JSON.stringify(artifact)));
}

function parseStreamingResponse(raw) {
  const eventTypes = new Set();
  const artifacts = [];
  let answer = "";
  for (const line of String(raw).split(/\r?\n/).filter(Boolean)) {
    let event;
    try {
      event = JSON.parse(line);
    } catch {
      continue;
    }
    if (event.type) eventTypes.add(event.type);
    if (event.type === "delta") answer += event.text ?? "";
    if (event.type === "artifact" || event.type === "artifacts") {
      if (Array.isArray(event.artifacts)) artifacts.push(...event.artifacts);
      else artifacts.push(event.artifact ?? event);
    }
  }
  if (!answer && raw && !raw.trim().startsWith("{")) answer = raw;
  return { answer: answer.trim(), artifacts, eventTypes: [...eventTypes] };
}

function loadCapturedResponses(file) {
  const raw = JSON.parse(fs.readFileSync(file, "utf8"));
  const rows = Array.isArray(raw) ? raw : Array.isArray(raw.results) ? raw.results : Object.entries(raw).map(([id, value]) => ({ id, ...value }));
  const map = new Map();
  for (const row of rows) {
    if (!row?.id) continue;
    map.set(row.id, {
      ...row,
      answer: row.answer ?? row.response ?? row.text ?? row.output ?? "",
      artifacts: row.artifacts ?? [],
    });
  }
  return map;
}

function summarize(results) {
  return {
    pass: results.filter((row) => row.status === "PASS").length,
    fail: results.filter((row) => row.status === "FAIL").length,
    notRun: results.filter((row) => row.status === "NOT_RUN").length,
    bySurface: countBy(results, (item) => item.surface),
  };
}

function countBy(items, fn) {
  return items.reduce((acc, item) => {
    const key = fn(item);
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function writeCsv(file, rows) {
  const header = ["id", "surface", "status", "answerChars", "latencyMs", "httpStatus", "issues"];
  const lines = [header.join(",")];
  for (const row of rows) {
    lines.push(header.map((key) => csv(row[key] ?? "")).join(","));
  }
  fs.writeFileSync(file, `${lines.join("\n")}\n`);
}

function writeMarkdown(file, report) {
  const lines = [
    "# Source aVa Hard QA",
    "",
    `Generated: ${report.generatedAt}`,
    `Mode: ${report.mode}`,
    `Questions: ${report.questionCount}`,
    "",
    "## Summary",
    "",
    `- PASS: ${report.summary.pass}`,
    `- FAIL: ${report.summary.fail}`,
    `- NOT_RUN: ${report.summary.notRun}`,
    "",
    "## Results",
    "",
    "| ID | Surface | Status | Issues |",
    "| --- | --- | --- | --- |",
    ...report.results.map((row) => `| ${row.id} | ${row.surface} | ${row.status} | ${escapePipes((row.issues ?? []).join("; ") || "None")} |`),
  ];
  fs.writeFileSync(file, `${lines.join("\n")}\n`);
}

function csv(value) {
  const text = Array.isArray(value) ? value.join("; ") : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function escapePipes(value) {
  return String(value).replace(/\|/g, "\\|");
}

function parseArgs(argv) {
  const parsed = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) parsed[key] = true;
    else {
      parsed[key] = next;
      i += 1;
    }
  }
  return parsed;
}

function normalizeBaseUrl(value) {
  return String(value).replace(/\/+$/, "");
}

function splitList(value) {
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
