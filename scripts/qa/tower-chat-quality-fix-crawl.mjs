#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { chromium } from "playwright";

const BASE_URL = process.env.TOWER_CHAT_FIX_BASE_URL ?? "https://app.abarva.ai";
const STORAGE_STATE =
  process.env.TOWER_CHAT_FIX_STORAGE_STATE ??
  "/Users/anand/Projects/nexus/.auth/agent-lakeshore-cio.json";
const OUT_ROOT =
  process.env.TOWER_CHAT_FIX_OUT_DIR ??
  path.join("/Users/anand/Downloads", `tower-chat-quality-fix-${timestamp()}`);

const QUESTIONS = [
  {
    id: "q01-total-budget",
    text: "What is the total IT budget loaded in Tower?",
    checks: ["noDupes", "cleanAssembly", "notAtlas"],
  },
  {
    id: "q02-budget-by-company",
    text: "Break down the IT budget by portfolio company.",
    checks: ["noDupes", "cleanAssembly", "notAtlas"],
  },
  {
    id: "q03-northline-budget",
    text: "How much is Northline's IT budget?",
    checks: ["noDupes", "cleanAssembly", "notAtlas"],
  },
  {
    id: "q04-northline-warehouse-budget",
    text: "What is the budget for the Northline warehouse automation analytics initiative?",
    checks: ["noDupes", "cleanAssembly", "northlineWarehouseMatches"],
  },
  {
    id: "q05-top-vendors",
    text: "Who are the top 5 vendors by contract value?",
    checks: ["noDupes", "cleanAssembly", "topVendorsMatch"],
  },
  {
    id: "q06-measured-value-a",
    text: "What is the total measured value across all initiatives?",
    repeatKey: "measuredValue",
    checks: ["noDupes", "cleanAssembly", "stable"],
  },
  {
    id: "q06-measured-value-b",
    text: "What is the total measured value across all initiatives?",
    repeatKey: "measuredValue",
    checks: ["noDupes", "cleanAssembly", "stable"],
  },
  {
    id: "q07-pressure-flags-a",
    text: "How many active pressure flags are there?",
    repeatKey: "pressureFlags",
    checks: ["noDupes", "cleanAssembly", "stable"],
  },
  {
    id: "q07-pressure-flags-b",
    text: "How many active pressure flags are there?",
    repeatKey: "pressureFlags",
    checks: ["noDupes", "cleanAssembly", "stable"],
  },
  {
    id: "q08-not-healthy-a",
    text: "How many programs are not marked healthy?",
    repeatKey: "notHealthy",
    checks: ["noDupes", "cleanAssembly", "stable"],
  },
  {
    id: "q08-not-healthy-b",
    text: "How many programs are not marked healthy?",
    repeatKey: "notHealthy",
    checks: ["noDupes", "cleanAssembly", "stable"],
  },
  {
    id: "q09-portfolio-roi",
    text: "What is the portfolio ROI?",
    checks: ["noDupes", "cleanAssembly", "honestRoi"],
  },
  {
    id: "q10-adoption-rate",
    text: "What is the current adoption rate for scaled initiatives?",
    checks: ["noDupes", "cleanAssembly", "honestAdoption"],
  },
];

const RAW_ID_RE =
  /\b(?:[A-Z]{2,}(?:-[A-Z0-9]+)+-\d{2,}|[A-Z]{2,}-[A-Z0-9]+-\d{3,}|signal:[a-z0-9:_-]{6,}|TWR-[A-Z0-9-]+|[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\b/gi;
const STALE_BRAND_RE = /\b(?:Atlas|Sentinel|Nexus)\b/g;
const ASSEMBLY_ARTIFACT_RE =
  /Breakdown:\s*;|Next:\s*Next|supporting supporting|\s;\s[-–—]|\b(?:before|with|and|or|to)\.(?:\s|$)/i;

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function write(file, body) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, body);
}

function normalize(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[,$]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function moneyValues(text) {
  return [...String(text).matchAll(/\$[0-9]+(?:\.[0-9]+)?[MBK]?/g)].map(
    (match) => match[0],
  );
}

function duplicateMoneyRows(text) {
  const seen = new Set();
  const dupes = [];
  for (const line of String(text).split(/\n|;/)) {
    if (!/\$[0-9]/.test(line)) continue;
    const key = normalize(
      line
        .replace(/^[-·]\s*/, "")
        .replace(/^(?:breakdown|evidence|read|implication):\s*/i, "")
        .replace(/[—–-]/g, " "),
    );
    if (!key) continue;
    if (seen.has(key)) dupes.push(line.trim());
    seen.add(key);
  }
  return dupes;
}

function extractDashboardSnapshot(text) {
  const snapshot = {
    bodyChars: text.length,
    northlineWarehouseBudget: null,
    vendorValues: {},
    totalBudgetCandidates: moneyValues(text).slice(0, 20),
  };

  const northline = text.match(
    /Northline warehouse automation analytics[\s\S]{0,260}?(\$[0-9]+(?:\.[0-9]+)?M)/i,
  );
  snapshot.northlineWarehouseBudget = northline?.[1] ?? null;

  for (const vendor of ["SAP", "AWS", "Salesforce", "Azure"]) {
    const match = text.match(
      new RegExp(`${vendor}[\\s\\S]{0,120}?(\\$[0-9]+(?:\\.[0-9]+)?M)`, "i"),
    );
    if (match?.[1]) snapshot.vendorValues[vendor] = match[1];
  }

  return snapshot;
}

function scoreAnswer({ question, text, dashboard, repeats }) {
  const failures = [];
  const duplicateRows = duplicateMoneyRows(text);
  if (question.checks.includes("noDupes") && duplicateRows.length > 0) {
    failures.push(`duplicated rows: ${duplicateRows.slice(0, 3).join(" | ")}`);
  }
  if (question.checks.includes("cleanAssembly") && ASSEMBLY_ARTIFACT_RE.test(text)) {
    failures.push("assembly artifact");
  }
  if (RAW_ID_RE.test(text)) failures.push("raw id leak");
  if (question.checks.includes("notAtlas") && STALE_BRAND_RE.test(text)) {
    failures.push("stale brand leak");
  }
  if (
    question.checks.includes("northlineWarehouseMatches") &&
    dashboard.northlineWarehouseBudget &&
    !text.includes(dashboard.northlineWarehouseBudget)
  ) {
    failures.push(
      `Northline warehouse budget mismatch; dashboard=${dashboard.northlineWarehouseBudget}; answer=${moneyValues(text).join(", ")}`,
    );
  }
  if (question.checks.includes("topVendorsMatch")) {
    for (const vendor of ["Salesforce", "Azure"]) {
      const expected = dashboard.vendorValues[vendor];
      if (expected && !text.includes(expected)) {
        failures.push(`${vendor} dashboard value ${expected} missing from answer`);
      }
    }
  }
  if (question.checks.includes("honestRoi") && !/cannot|gap|missing|not board-grade|not enough/i.test(text)) {
    failures.push("ROI answer not honest about loaded-evidence limits");
  }
  if (
    question.checks.includes("honestAdoption") &&
    !/proxy|active-user|telemetry|would be invented|low-confidence/i.test(text)
  ) {
    failures.push("adoption answer not honest about proxy/telemetry limits");
  }
  if (question.repeatKey) {
    const prior = repeats.get(question.repeatKey);
    if (prior && normalize(prior) !== normalize(text)) {
      failures.push(`repeat instability for ${question.repeatKey}`);
    }
    repeats.set(question.repeatKey, text);
  }
  return {
    pass: failures.length === 0,
    failures,
    money: moneyValues(text),
    chars: text.length,
  };
}

async function submitQuestion(page, question, index) {
  const agentTurns = page.getByTestId("agent-dock-turn-agent");
  const beforeCount = await agentTurns.count().catch(() => 0);
  const input = page.getByTestId("agent-dock-input");
  await input.click();
  await input.press(process.platform === "darwin" ? "Meta+A" : "Control+A");
  await input.pressSequentially(question.text, { delay: 2 });
  await page.waitForFunction(
    () => !document.querySelector('[data-testid="agent-dock-send"]')?.disabled,
    null,
    { timeout: 10_000 },
  );
  await page.getByTestId("agent-dock-send").click();
  await page.waitForFunction(
    ({ before }) => {
      const turns = Array.from(
        document.querySelectorAll('[data-testid="agent-dock-turn-agent"]'),
      );
      if (turns.length <= before) return false;
      const text = turns[turns.length - 1]?.textContent ?? "";
      return text.length > 80 && !/thinking/i.test(text);
    },
    { before: beforeCount },
    { timeout: 90_000 },
  );
  const afterTurns = await agentTurns.allInnerTexts();
  const rendered = afterTurns[afterTurns.length - 1] ?? "";
  const qdir = path.join(OUT_ROOT, "rendered-crawl", question.id);
  write(path.join(qdir, "question.txt"), question.text);
  write(path.join(qdir, "rendered-answer.txt"), rendered);
  await page.screenshot({
    path: path.join(qdir, "screenshot.png"),
    fullPage: true,
  });
  console.log(`${String(index + 1).padStart(2, "0")} ${question.id}: ${rendered.length} chars`);
  return rendered;
}

function markdownTable(rows) {
  return [
    "| Question | Pass | Failures | Chars | Money values |",
    "|---|---|---|---:|---|",
    ...rows.map((row) =>
      `| ${row.id} | ${row.score.pass ? "PASS" : "FAIL"} | ${row.score.failures.join("<br>") || "—"} | ${row.score.chars} | ${row.score.money.join(", ") || "—"} |`,
    ),
  ].join("\n");
}

function writeReports(rows, dashboard) {
  const passed = rows.filter((row) => row.score.pass).length;
  write(
    path.join(OUT_ROOT, "FINDINGS.md"),
    [
      "# Tower Chat Quality Fix Findings",
      "",
      `Target: ${BASE_URL}/tower`,
      `Result: ${passed}/${rows.length}`,
      "",
      "The crawl was browser-rendered through the Tower aVa dock. It checks duplicate assembly, factual stability, stale branding, raw IDs, and chat/dashboard value reconciliation.",
    ].join("\n"),
  );
  write(
    path.join(OUT_ROOT, "BEFORE_AFTER.md"),
    [
      "# Before / After",
      "",
      "Before: live capture showed duplicated budget rows, broken delimiters, truncated Next lines, and chat/dashboard mismatches for Northline budget plus Salesforce/Azure vendor exposure.",
      "",
      "After: inspect `rendered-crawl/q01-total-budget/rendered-answer.txt` and `rendered-crawl/q04-northline-warehouse-budget/rendered-answer.txt` from this package.",
    ].join("\n"),
  );
  write(
    path.join(OUT_ROOT, "CONSISTENCY_REPORT.md"),
    [
      "# Tower Chat / Dashboard Consistency Report",
      "",
      "## Dashboard Snapshot",
      "",
      "```json",
      JSON.stringify(dashboard, null, 2),
      "```",
      "",
      "## Answer Scores",
      "",
      markdownTable(rows),
    ].join("\n"),
  );
  write(
    path.join(OUT_ROOT, "audit-matrix.md"),
    [
      "# Audit Matrix",
      "",
      markdownTable(rows),
      "",
      "Required invariant: no duplicated rows, no delimiter artifacts, stable repeated factual questions, no raw IDs, no stale Atlas/Sentinel/Nexus branding, and honest insufficiency on ROI/adoption.",
    ].join("\n"),
  );
  write(
    path.join(OUT_ROOT, "release-record.md"),
    [
      "# Release Record Evidence",
      "",
      "- Lane: global-control-lane / runtime-app-lane.",
      "- Proof type: signed-in rendered Tower browser crawl.",
      "- Rollback: redeploy prior approved ACA digest.",
    ].join("\n"),
  );
  write(
    path.join(OUT_ROOT, "tower-chat-quality-fix.json"),
    JSON.stringify({ generatedAt: new Date().toISOString(), dashboard, rows }, null, 2),
  );
}

async function main() {
  ensureDir(OUT_ROOT);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: STORAGE_STATE });
  const page = await context.newPage();
  await page.goto(`${BASE_URL}/tower`, {
    waitUntil: "domcontentloaded",
    timeout: 90_000,
  });
  await page.getByTestId("agent-dock-input").waitFor({ timeout: 60_000 });

  const dashboardText = await page.locator("body").innerText({ timeout: 30_000 });
  const dashboard = extractDashboardSnapshot(dashboardText);
  write(path.join(OUT_ROOT, "dashboard-snapshot.txt"), dashboardText);
  write(path.join(OUT_ROOT, "dashboard-snapshot.json"), JSON.stringify(dashboard, null, 2));

  const repeats = new Map();
  const rows = [];
  for (let index = 0; index < QUESTIONS.length; index += 1) {
    const question = QUESTIONS[index];
    const rendered = await submitQuestion(page, question, index);
    const score = scoreAnswer({ question, text: rendered, dashboard, repeats });
    rows.push({ id: question.id, question: question.text, rendered, score });
  }

  await browser.close();
  writeReports(rows, dashboard);

  const zipPath = `${OUT_ROOT}.zip`;
  spawnSync("zip", ["-qr", zipPath, path.basename(OUT_ROOT)], {
    cwd: path.dirname(OUT_ROOT),
    stdio: "inherit",
  });
  console.log(`\nReport: ${OUT_ROOT}`);
  console.log(`Zip: ${zipPath}`);

  const failed = rows.filter((row) => !row.score.pass);
  if (failed.length > 0) {
    console.error(`Failures: ${failed.map((row) => row.id).join(", ")}`);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
