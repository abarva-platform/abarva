#!/usr/bin/env node

import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { chromium } from "playwright";
import { createClerkClient } from "@clerk/backend";

const execFileAsync = promisify(execFile);

const DEFAULT_BASE_URL = "https://app.abarva.ai";
const DEFAULT_ACA_APP = "ca-abarva-web-lab-eastus";
const DEFAULT_ACA_RG = "rg-abarva-controlplane-lab-eastus";
const LEAK_PATTERNS = [
  { label: "tab-marker", re: /<<<TAB:/i },
  { label: "grounding-marker", re: /\bgrounding\s*:/i },
  { label: "tab-close-marker", re: />>>/ },
  { label: "canvas-json", re: /\bcanvasType\b/ },
  { label: "canvas-fence", re: /\babarva-canvas\b/i },
  { label: "prompt-trace", re: /\bprompt trace\b/i },
  { label: "raw-claude", re: /\braw claude\b/i },
];

const CATEGORY_TARGETS = [
  ["ai_investment_prioritization", 10, 10],
  ["scale_certify_readiness_hold", 8, 8],
  ["governance_decision_gates", 8, 8],
  ["roadmap_execution", 8, 6],
  ["evidence_proof_boundary", 6, 6],
  ["risk_controls_compliance", 5, 5],
  ["followup_drilldown", 5, 5],
  ["ambiguous_adversarial", 1, 1],
];

const INDUSTRIAL_QUESTIONS = {
  ai_investment_prioritization: [
    "Across HR, Legal, Treasury, Finance, and Shared Services, where should we prioritize AI investment in the next 90 days?",
    "Which back-office AI investment should the CIO fund first if the goal is visible value without increasing control risk?",
    "How should the Innovation Office sequence Treasury, Finance, HR, Legal, and Shared Services for a first wave of AI automation?",
    "Where should Lakeshore Holdings place the next dollar of AI funding across Treasury, FP&A, close, HR service delivery, Legal intake, and shared services?",
    "What is the strongest lighthouse use case for the Industrial demo if the CIO wants proof fast but not a generic Copilot story?",
    "Which AI bets should be treated as enterprise transformation versus tactical automation?",
    "How should the CIO balance value, readiness, and proof quality across Treasury, Finance, HR, Legal, and Shared Services?",
    "Where is the highest-value back-office opportunity being blocked by weak data or process ownership?",
    "Which function should receive AI investment now if the CFO demands measurable working-capital or cycle-time impact?",
    "What should the CIO tell the VP Innovation to fund first, second, and not yet?",
  ],
  scale_certify_readiness_hold: [
    "Which back-office AI opportunities should scale now, certify first, fund readiness, or hold?",
    "Where is Treasury ready to scale, and where should it still be gated by control proof?",
    "Which finance AI use cases should be certified before scale funding is released?",
    "Which HR AI ideas should be held until policy ownership, case taxonomy, and employee controls are clearer?",
    "Which Legal AI opportunities are ready for pilot versus still discovery-only?",
    "How should M365 Copilot scale be gated by value measurement rather than seat deployment?",
    "Which shared-services automation should become the scale candidate, and which should wait for process baselines?",
    "If we had to pause two back-office AI efforts today, which ones should be held and why?",
  ],
  governance_decision_gates: [
    "What governance model should the CIO use for AI capital release across back-office functions?",
    "What control evidence must the CFO see before Treasury AI scales?",
    "Who should own the gate between the Innovation Office, function leaders, IT, risk, and finance?",
    "What decision rights should sit with the CIO versus CFO versus General Counsel for back-office AI?",
    "What must be true before an AI assistant can write, approve, or submit anything in finance, HR, or legal workflows?",
    "What are the minimum gates for moving from AI pilot to scaled operating model?",
    "How should Lakeshore Holdings avoid funding AI pilots that never change the way shared services operates?",
    "What should be escalated to the CFO versus handled by the value office?",
  ],
  roadmap_execution: [
    "What should the 90-day roadmap look like if we want to prove value without overcommitting capital?",
    "Give me the first 30, 60, and 90 days for Treasury, Finance, HR, Legal, and Shared Services AI.",
    "What has to happen first before shared-services AI can be scaled responsibly?",
    "How should the CIO run a value-office sprint that turns AI ideas into funded operating changes?",
    "What is the shortest credible path from Kyriba control evidence to a board-ready Treasury AI scale decision?",
    "What execution sequence would prove Finance close AI is real without disrupting month-end close?",
    "What should the Industrial demo show as the operating cadence for AI transformation?",
    "What work should be done before the next executive steering committee?",
  ],
  evidence_proof_boundary: [
    "What proof is missing before Legal AI can move from discovery to pilot?",
    "Where are we relying on assumptions instead of client-signed facts across HR, Finance, Treasury, Legal, and Shared Services?",
    "Which back-office AI claims are board-ready, and which still need evidence?",
    "What evidence would make Treasury AI defensible to a CFO and audit committee?",
    "What proof boundary should be shown to the CIO before approving the first AI lighthouse?",
    "Where does the current evidence support action, and where should AbarVa ask the client for assumptions or values?",
  ],
  risk_controls_compliance: [
    "What are the biggest risk and control issues in scaling AI across Finance, HR, Legal, Treasury, and Shared Services?",
    "Where could AI automation create SOX, privacy, approval, or segregation-of-duties risk?",
    "What controls should exist before Legal AI summarizes, drafts, or routes contract exceptions?",
    "How should HR AI handle employee-facing policies without creating compliance exposure?",
    "Which back-office process is most dangerous to automate before the control model is proven?",
  ],
  followup_drilldown: [
    "Drill into the Treasury/Kyriba scale case and show the decision gate, proof needed, and owner.",
    "Drill into why Legal AI should not be over-ranked just because it sounds high value.",
    "Show the next questions a CIO should ask after seeing the back-office AI prioritization.",
    "If the CFO challenges the value case, what should the value office show next?",
    "If the VP Innovation wants one demo story, which follow-up path should they take?",
  ],
  ambiguous_adversarial: [
    "Just tell me which AI thing to buy and do not overcomplicate it.",
  ],
};

const SKYHARBOR_QUESTIONS = {
  ai_investment_prioritization: [
    "Where should SkyHarbor fund AI next across IROPS, predictive maintenance, crew recovery, loyalty, and customer disruption recovery?",
    "Which airline AI investment should the CTO fund first if the board wants value without safety or operational risk?",
    "How should the CTO sequence Loyalty, Crew Recovery, Predictive Maintenance, IROPS, and Customer Disruption Recovery?",
    "Which AI initiatives have the best value/readiness balance for SkyHarbor right now?",
    "Where is the biggest airline AI value pool, and why should it not automatically get scale funding first?",
    "What should SkyHarbor scale now versus fund as operational data readiness?",
    "Which airline AI bet would make the strongest CTO demo story without overclaiming operational readiness?",
    "Where should SkyHarbor place the next dollar of AI funding across commercial, operations, customer, and TechOps?",
    "What is the strongest AI investment case for airline resilience next year?",
    "If the CTO has only one funding tranche, which airline AI initiative should win and why?",
  ],
  scale_certify_readiness_hold: [
    "Which airline AI initiatives should scale now, certify first, fund readiness, or hold?",
    "What must be true before IROPS AI can safely scale?",
    "Should Crew Recovery move to scale now, or should it certify human-in-loop controls first?",
    "Should Predictive Maintenance scale now, or is the maintenance lineage proof still too weak?",
    "Should Customer Disruption Recovery be funded for readiness or scaled as a customer experience program?",
    "Which AI initiative should be held despite attractive value potential?",
    "Where is high value being blocked by low data readiness?",
    "What would make IROPS move from fund readiness to certify then scale?",
  ],
  governance_decision_gates: [
    "What gate should the CDAO own before AI capital is released?",
    "Who should have decision rights for IROPS AI scale: CTO, COO, CDAO, or AI governance?",
    "What model-risk gate should exist before airline AI crosses into operational recommendations?",
    "What evidence should the CTO require before Crew Recovery is allowed beyond advisory mode?",
    "What governance model prevents Loyalty AI from scaling faster than operational AI simply because the data is cleaner?",
    "How should SkyHarbor separate commercial AI governance from regulated operational AI governance?",
    "What should the executive steering committee approve before autonomous disruption recovery expands?",
    "What should be escalated to the COO versus handled by data and technology leaders?",
  ],
  roadmap_execution: [
    "What is the 90-day roadmap for safely scaling airline AI?",
    "What should happen in the first 30 days to make IROPS AI board-ready?",
    "What should SkyHarbor do over 30, 60, and 90 days across Loyalty, Crew, Predictive Maintenance, IROPS, and Disruption Recovery?",
    "What has to happen first before Customer Disruption Recovery can move from readiness to pilot?",
    "How should the CTO run a readiness sprint for operational data products?",
    "What execution plan would prove Crew Recovery value without creating safety or crew-legality risk?",
  ],
  evidence_proof_boundary: [
    "What proof is missing for Customer Disruption Recovery AI?",
    "What proof boundary should the CTO show the board before funding IROPS?",
    "Where are SkyHarbor AI claims supported by tenant evidence, and where are we relying on industry assumptions?",
    "Which airline AI value claims are board-ready, and which need signed operational baselines?",
    "What evidence would move Predictive Maintenance from certify to scale?",
    "What data-product evidence must be certified before operational AI capital is released?",
  ],
  risk_controls_compliance: [
    "What are the biggest risk and control issues in scaling airline AI across operations and customer recovery?",
    "Where could IROPS AI create safety, regulatory, crew-legality, or customer-impact risk?",
    "What controls should exist before Crew Recovery recommendations influence real operations?",
    "What is the compliance risk of using customer disruption AI before PNR and consent quality are certified?",
    "Which airline AI process is most dangerous to automate before data lineage is proven?",
  ],
  followup_drilldown: [
    "Drill into the IROPS readiness case and show the gate, owner, value pool, and proof needed.",
    "Drill into why Loyalty AI can scale sooner than IROPS even if IROPS has higher value.",
    "Show the next questions a CTO should ask after seeing the airline AI prioritization.",
    "If the COO challenges the IROPS readiness gate, what should the CTO show next?",
    "If the board wants one airline AI story, which follow-up path should we take?",
  ],
  ambiguous_adversarial: [
    "Stop hedging and just tell me which airline AI product to scale now.",
  ],
};

const args = parseArgs(process.argv.slice(2));
const baseUrl = args.baseUrl ?? process.env.BASE_URL ?? DEFAULT_BASE_URL;
const dryRun = Boolean(args.dryRun);
const limit = args.limit ? Number(args.limit) : null;
const headless = !args.headful;
const screenshotsEnabled = !args.noScreenshots;
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const outDir = path.resolve(
  args.outDir ?? path.join("reports", `intelligence-100q-pressure-${timestamp}`),
);
const screenshotDir = path.join(outDir, "screenshots");

const questionBank = buildQuestionBank();
const selectedQuestions = limit ? questionBank.slice(0, limit) : questionBank;

await fs.mkdir(outDir, { recursive: true });
await fs.mkdir(screenshotDir, { recursive: true });
await fs.writeFile(
  path.join(outDir, "question-bank.json"),
  `${JSON.stringify(questionBank, null, 2)}\n`,
);

if (dryRun) {
  const metadata = await captureDeploymentMetadata(baseUrl);
  const dryReport = {
    status: "dry_run",
    baseUrl,
    questionCount: questionBank.length,
    selectedCount: selectedQuestions.length,
    categoryTargets: CATEGORY_TARGETS.map(([category, industrial, skyharbor]) => ({
      category,
      industrial,
      skyharbor,
      total: industrial + skyharbor,
    })),
    deploymentMetadata: metadata,
  };
  await fs.writeFile(
    path.join(outDir, "results.json"),
    `${JSON.stringify({ metadata: dryReport, results: [] }, null, 2)}\n`,
  );
  await fs.writeFile(path.join(outDir, "REPORT.md"), renderDryRunReport(dryReport));
  console.log(JSON.stringify(dryReport, null, 2));
  process.exit(0);
}

if (selectedQuestions.length !== 100 && !limit) {
  throw new Error(`Expected 100 questions, got ${selectedQuestions.length}`);
}

const browser = await chromium.launch({ headless });
const deploymentMetadata = await captureDeploymentMetadata(baseUrl);
const results = [];

try {
  for (const [index, question] of selectedQuestions.entries()) {
    const result = await runQuestion(browser, question, index + 1);
    results.push(result);
    await writeQuestionArtifacts(result);
    console.log(
      `${index + 1}/${selectedQuestions.length} ${question.id} ${result.classification} fast=${result.timings.fastCanvasMs ?? "n/a"}ms final=${result.timings.finalSettleMs ?? "n/a"}ms`,
    );
  }
} finally {
  await browser.close();
}

const report = buildRunReport({ baseUrl, deploymentMetadata, results });
await fs.writeFile(
  path.join(outDir, "results.json"),
  `${JSON.stringify({ metadata: report.metadata, summary: report.summary, results }, null, 2)}\n`,
);
await fs.writeFile(path.join(outDir, "results.csv"), renderResultsCsv(results));
await fs.writeFile(
  path.join(outDir, "latency-summary.json"),
  `${JSON.stringify(report.latencySummary, null, 2)}\n`,
);
await fs.writeFile(
  path.join(outDir, "quality-summary.json"),
  `${JSON.stringify(report.qualitySummary, null, 2)}\n`,
);
await fs.writeFile(path.join(outDir, "REPORT.md"), renderReport(report));
await createZip(outDir);

console.log(JSON.stringify(report.summary, null, 2));

async function runQuestion(browser, question, ordinal) {
  const qStart = Date.now();
  const questionDir = path.join(outDir, "questions", question.id);
  await fs.mkdir(questionDir, { recursive: true });
  const context = await createContext(browser, question.tenant);
  const page = await context.newPage();
  const consoleLog = [];
  const pageErrors = [];
  const networkEvents = [];
  const apiCaptures = [];

  page.on("console", (message) => {
    consoleLog.push({
      type: message.type(),
      text: message.text(),
      timestamp: new Date().toISOString(),
    });
  });
  page.on("pageerror", (error) => {
    pageErrors.push({ message: error.message, timestamp: new Date().toISOString() });
  });
  page.on("request", (request) => {
    if (request.url().includes("/api/intelligence/ask")) {
      networkEvents.push({
        kind: "request",
        url: request.url(),
        method: request.method(),
        timestamp: Date.now(),
        postData: safeJsonParse(request.postData() ?? ""),
      });
    }
  });
  page.on("response", (response) => {
    if (response.url().includes("/api/intelligence/ask")) {
      networkEvents.push({
        kind: "response-start",
        url: response.url(),
        status: response.status(),
        timestamp: Date.now(),
      });
      apiCaptures.push(captureApiResponse(response));
    }
  });

  const timings = {
    startAt: qStart,
    submitAt: null,
    fastCanvasVisibleAt: null,
    firstModelTokenAt: null,
    primaryClaudeCompleteAt: null,
    finalTabsVisibleAt: null,
    finalCanvasVisibleAt: null,
    finalSettleAt: null,
    fastCanvasMs: null,
    firstModelTokenMs: null,
    primaryClaudeCompleteMs: null,
    finalTabsVisibleMs: null,
    finalCanvasVisibleMs: null,
    finalSettleMs: null,
  };

  let screenshot = null;
  let fastCanvasSnapshot = null;
  let finalText = "";
  let visibleLeaks = [];
  let finalAnswer = "";
  let companionTabs = [];
  let nativeCanvasPayloads = [];
  let repairCallsAttempted = 0;

  try {
    await page.goto(`${baseUrl}/intelligence`, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });
    await acceptResponsibleAiIfPresent(page);
    await setActiveClientCookie(context, question.tenant);
    await page.goto(`${baseUrl}/intelligence`, {
      waitUntil: "networkidle",
      timeout: 45_000,
    });
    await acceptResponsibleAiIfPresent(page);

    const input = page.getByTestId("agent-dock-input");
    await input.waitFor({ timeout: 20_000 });
    await input.fill(question.text);
    timings.submitAt = Date.now();
    await page.getByTestId("agent-dock-send").click();

    const fastCanvasLocator = page.locator('[data-testid^="executive-canvas"]').first();
    await fastCanvasLocator.waitFor({ state: "visible", timeout: 10_000 });
    timings.fastCanvasVisibleAt = Date.now();
    timings.fastCanvasMs = timings.fastCanvasVisibleAt - timings.submitAt;
    fastCanvasSnapshot = await page.locator("body").innerText({ timeout: 5_000 });

    await waitForApiStart(networkEvents, timings, 15_000);
    await waitForResponseCaptures(apiCaptures, 90_000);
    timings.primaryClaudeCompleteAt = Date.now();
    timings.primaryClaudeCompleteMs = timings.primaryClaudeCompleteAt - timings.submitAt;

    await page.waitForTimeout(1200);
    timings.finalSettleAt = Date.now();
    timings.finalSettleMs = timings.finalSettleAt - timings.submitAt;
    finalText = await page.locator("body").innerText({ timeout: 10_000 });

    timings.finalTabsVisibleAt = finalText.includes("Decision canvas")
      ? timings.finalSettleAt
      : null;
    timings.finalTabsVisibleMs = timings.finalTabsVisibleAt
      ? timings.finalTabsVisibleAt - timings.submitAt
      : null;
    timings.finalCanvasVisibleAt = (await page.locator('[data-testid^="executive-canvas"]').count())
      ? timings.finalSettleAt
      : null;
    timings.finalCanvasVisibleMs = timings.finalCanvasVisibleAt
      ? timings.finalCanvasVisibleAt - timings.submitAt
      : null;

    const responseBodies = await Promise.allSettled(apiCaptures);
    const parsedResponses = responseBodies
      .filter((entry) => entry.status === "fulfilled")
      .flatMap((entry) => entry.value.events);
    finalAnswer = extractFinalAnswer(parsedResponses, finalText);
    companionTabs = extractCompanionTabs(parsedResponses, finalText);
    nativeCanvasPayloads = extractCanvasPayloads(parsedResponses);
    repairCallsAttempted = networkEvents.filter((event) =>
      String(event.url ?? "").includes("repair"),
    ).length;

    if (screenshotsEnabled) {
      screenshot = path.join("screenshots", `${String(ordinal).padStart(3, "0")}-${question.id}.png`);
      await page.screenshot({
        path: path.join(outDir, screenshot),
        fullPage: true,
      });
    }

    visibleLeaks = findLeaks(finalText);
  } catch (error) {
    finalText = await page.locator("body").innerText({ timeout: 3000 }).catch(() => "");
    visibleLeaks = findLeaks(finalText);
    if (screenshotsEnabled) {
      screenshot = path.join("screenshots", `${String(ordinal).padStart(3, "0")}-${question.id}-error.png`);
      await page.screenshot({
        path: path.join(outDir, screenshot),
        fullPage: true,
      }).catch(() => undefined);
    }
    pageErrors.push({ message: error.message, timestamp: new Date().toISOString() });
  } finally {
    await context.close().catch(() => undefined);
  }

  const score = scoreResult({
    question,
    finalText,
    finalAnswer,
    companionTabs,
    nativeCanvasPayloads,
    visibleLeaks,
    consoleLog,
    pageErrors,
    timings,
    fastCanvasSnapshot,
    repairCallsAttempted,
  });

  return {
    id: question.id,
    ordinal,
    tenant: question.tenant,
    category: question.category,
    question: question.text,
    expectedThemes: question.expectedThemes,
    timestamps: {
      startedAt: new Date(qStart).toISOString(),
      submittedAt: timings.submitAt ? new Date(timings.submitAt).toISOString() : null,
      finishedAt: new Date().toISOString(),
    },
    timings,
    finalAnswer,
    companionTabs,
    nativeCanvasPayloads,
    fastCanvasSnapshot,
    visibleLeaks,
    consoleErrors: consoleLog.filter((entry) => entry.type === "error"),
    consoleWarnings: consoleLog.filter((entry) => entry.type === "warning"),
    pageErrors,
    networkEvents,
    repairCallsAttempted,
    analyticsClaudeAlignment: classifyAnalyticsClaudeAlignment({
      question,
      fastCanvasSnapshot,
      finalAnswer,
    }),
    score,
    classification: classifyResult(score, {
      visibleLeaks,
      pageErrors,
      timings,
      companionTabs,
      repairCallsAttempted,
    }),
    screenshot,
  };
}

async function createContext(browser, tenant) {
  const storageState = storageStateForTenant(tenant);
  const contextOptions = {
    viewport: { width: 1440, height: 1000 },
    ...(storageState ? { storageState } : {}),
  };
  const context = await browser.newContext(contextOptions);
  if (!storageState) {
    const page = await context.newPage();
    await signInWithServerTicket(page, tenant);
    await page.close();
  }
  await setActiveClientCookie(context, tenant);
  return context;
}

async function signInWithServerTicket(page, tenant) {
  const secret = process.env.CLERK_SECRET_KEY;
  if (!secret) {
    throw new Error(
      `No storageState provided for ${tenant}, and CLERK_SECRET_KEY is missing.`,
    );
  }
  const account = accountForTenant(tenant);
  const clerk = createClerkClient({ secretKey: secret });
  const users = await clerk.users.getUserList({
    emailAddress: [account.email],
    limit: 1,
  });
  const user = users.data[0];
  if (!user) throw new Error(`No Clerk user found for ${account.email}`);
  const signInToken = await clerk.signInTokens.createSignInToken({
    userId: user.id,
    expiresInSeconds: 300,
  });
  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 45_000 });
  await page.waitForFunction(() => window.Clerk?.loaded === true, null, {
    timeout: 30_000,
  });
  await page.evaluate(async (ticket) => {
    const result = await window.Clerk.client.signIn.create({
      strategy: "ticket",
      ticket,
    });
    if (result.status !== "complete" || !result.createdSessionId) {
      throw new Error(`Ticket sign-in failed with status ${result.status}`);
    }
    await window.Clerk.setActive({ session: result.createdSessionId });
  }, signInToken.token);
  await page.waitForFunction(() => Boolean(window.Clerk?.user), null, {
    timeout: 30_000,
  });
}

function storageStateForTenant(tenant) {
  const specific =
    tenant === "skyharbor"
      ? process.env.INTELLIGENCE_PRESSURE_STORAGE_STATE_SKYHARBOR
      : process.env.INTELLIGENCE_PRESSURE_STORAGE_STATE_INDUSTRIAL;
  const fallback = process.env.INTELLIGENCE_PRESSURE_STORAGE_STATE;
  const value = specific || fallback;
  return value && existsSync(value) ? value : undefined;
}

function accountForTenant(tenant) {
  if (tenant === "skyharbor") {
    return {
      email: process.env.INTELLIGENCE_PRESSURE_SKYHARBOR_EMAIL ?? "cto@skyharbor-air.example.com",
      activeClient: process.env.INTELLIGENCE_PRESSURE_SKYHARBOR_CLIENT ?? "skyharbor",
    };
  }
  return {
    email: process.env.INTELLIGENCE_PRESSURE_INDUSTRIAL_EMAIL ?? "cfo@lakeshore-holdings.example.com",
    activeClient: process.env.INTELLIGENCE_PRESSURE_INDUSTRIAL_CLIENT ?? "lakeshore",
  };
}

async function setActiveClientCookie(context, tenant) {
  const account = accountForTenant(tenant);
  const url = new URL(baseUrl);
  await context.addCookies([
    {
      name: "abarva_active_client",
      value: account.activeClient,
      domain: url.hostname,
      path: "/",
      sameSite: "Lax",
      secure: url.protocol === "https:",
    },
  ]);
}

async function acceptResponsibleAiIfPresent(page) {
  const labels = [
    /accept/i,
    /agree/i,
    /acknowledge/i,
    /i understand/i,
    /continue/i,
  ];
  for (const label of labels) {
    const button = page.getByRole("button", { name: label }).first();
    if (await button.count().catch(() => 0)) {
      const text = await page.locator("body").innerText().catch(() => "");
      if (/responsible ai|ai may produce|acknowledge/i.test(text)) {
        await button.click().catch(() => undefined);
        await page.waitForTimeout(300);
        return;
      }
    }
  }
}

async function captureApiResponse(response) {
  const startedAt = Date.now();
  let body = "";
  let error = null;
  try {
    await Promise.race([
      response.finished().catch(() => undefined),
      sleep(90_000),
    ]);
    body = await Promise.race([response.text(), sleep(10_000).then(() => "")]);
  } catch (err) {
    error = err.message;
  }
  return {
    url: response.url(),
    status: response.status(),
    startedAt,
    completedAt: Date.now(),
    raw: body,
    error,
    events: parseNdjson(body),
  };
}

async function waitForApiStart(networkEvents, timings, timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const responseStart = networkEvents.find((event) => event.kind === "response-start");
    if (responseStart) {
      timings.firstModelTokenAt = responseStart.timestamp;
      timings.firstModelTokenMs = responseStart.timestamp - timings.submitAt;
      return;
    }
    await sleep(100);
  }
}

async function waitForResponseCaptures(apiCaptures, timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (apiCaptures.length === 0) {
      await sleep(250);
      continue;
    }
    const settled = await Promise.race([
      Promise.allSettled(apiCaptures),
      sleep(250).then(() => null),
    ]);
    if (settled && settled.every((entry) => entry.status === "fulfilled")) {
      return settled;
    }
  }
}

function parseNdjson(raw) {
  return raw
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => safeJsonParse(line))
    .filter(Boolean);
}

function extractFinalAnswer(events, finalText) {
  const agentAnswer = [...events].reverse().find((event) => event.type === "agent-answer" && event.answer);
  const fromPacket =
    agentAnswer?.answer?.prose ??
    agentAnswer?.answer?.directAnswer ??
    agentAnswer?.answer?.recommendation;
  if (typeof fromPacket === "string" && fromPacket.trim()) return fromPacket.trim();
  const deltas = events
    .filter((event) => event.type === "delta" && typeof event.text === "string")
    .map((event) => event.text)
    .join("");
  if (deltas.trim()) return deltas.trim();
  return finalText.slice(0, 3000);
}

function extractCompanionTabs(events, finalText) {
  const agentAnswer = [...events].reverse().find((event) => event.type === "agent-answer" && event.answer);
  const tabs = agentAnswer?.answer?.decisionFrame?.intelligenceTabs;
  if (Array.isArray(tabs)) return tabs;
  const visibleTabs = [];
  for (const label of ["Decision", "Industry Signal", "Opportunity Map", "Decision Table", "Proof Boundary"]) {
    if (finalText.includes(label)) visibleTabs.push({ label, source: "visible-dom" });
  }
  return visibleTabs;
}

function extractCanvasPayloads(events) {
  const payloads = [];
  for (const event of events) {
    const text = typeof event.text === "string" ? event.text : JSON.stringify(event);
    for (const match of text.matchAll(/```(?:abarva-canvas|json\s+abarva-canvas)\s*\n([\s\S]*?)```/gim)) {
      const parsed = safeJsonParse(match[1] ?? "");
      if (parsed) payloads.push(parsed);
    }
  }
  return payloads;
}

function scoreResult({
  question,
  finalText,
  finalAnswer,
  companionTabs,
  nativeCanvasPayloads,
  visibleLeaks,
  consoleLog,
  pageErrors,
  timings,
  fastCanvasSnapshot,
  repairCallsAttempted,
}) {
  const answer = `${finalAnswer}\n${finalText}`;
  const scores = {
    executiveClarity: scoreExecutiveClarity(finalAnswer),
    advisoryJudgment: scoreContains(answer, [
      /recommend|prioriti[sz]e|scale|certify|fund|hold|sequence|should/i,
    ]),
    evidenceGrounding: scoreContains(answer, [
      /evidence|proof|baseline|data|readiness|source|known|missing/i,
    ]),
    decisionUsefulness: scoreContains(answer, [
      /scale now|certify|fund readiness|hold|decision required|gate/i,
    ]),
    riskControlAwareness: scoreContains(answer, [
      /risk|control|governance|owner|CFO|CTO|CDAO|COO|legal|SOX|compliance|gate/i,
    ]),
    canvasUsefulness: scoreCanvas({
      fastCanvasSnapshot,
      nativeCanvasPayloads,
      companionTabs,
    }),
    followUpQuality: scoreContains(finalText, [
      /suggested questions|next question|what proof|what gate|90-day|roadmap|\?/i,
    ]),
    noLeakHygiene: visibleLeaks.length === 0 ? 5 : 1,
    tenantSpecificity: scoreContains(answer, question.expectedThemes.map((theme) => new RegExp(escapeRegex(theme), "i"))),
  };
  const average =
    Object.values(scores).reduce((total, score) => total + score, 0) /
    Object.values(scores).length;
  return {
    ...scores,
    average: round(average, 2),
    technical: {
      visibleLeaks,
      consoleErrorCount: consoleLog.filter((entry) => entry.type === "error").length,
      consoleWarningCount: consoleLog.filter((entry) => entry.type === "warning").length,
      pageErrorCount: pageErrors.length,
      repairCallsAttempted,
      fiveTabPresence: companionTabs.length >= 5,
      nativeCanvasPresent: nativeCanvasPayloads.length > 0 || /executive-canvas|Opportunity Map|Decision Table/.test(finalText),
      noUsefulProgress: !timings.fastCanvasVisibleAt && !timings.firstModelTokenAt,
    },
  };
}

function classifyResult(score, { visibleLeaks, pageErrors, timings, companionTabs, repairCallsAttempted }) {
  if (
    visibleLeaks.length > 0 ||
    pageErrors.length > 0 ||
    companionTabs.length < 5 ||
    repairCallsAttempted > 0
  ) {
    return "technical_fail";
  }
  if (
    !timings.fastCanvasMs ||
    timings.fastCanvasMs > 2000 ||
    !timings.finalSettleMs ||
    timings.finalSettleMs > 75_000 ||
    (!timings.fastCanvasVisibleAt && (!timings.firstModelTokenMs || timings.firstModelTokenMs > 10_000))
  ) {
    return "latency_fail";
  }
  if (score.average < 3) return "quality_fail";
  if (score.average < 4 || timings.fastCanvasMs > 500 || timings.finalSettleMs > 45_000) {
    return "soft_pass";
  }
  return "hard_pass";
}

function classifyAnalyticsClaudeAlignment({ question, fastCanvasSnapshot, finalAnswer }) {
  if (!fastCanvasSnapshot || !finalAnswer) return "unclear";
  const lowerFast = fastCanvasSnapshot.toLowerCase();
  const lowerFinal = finalAnswer.toLowerCase();
  const positiveTerms = question.expectedThemes.filter((theme) =>
    lowerFast.includes(theme.toLowerCase()) && lowerFinal.includes(theme.toLowerCase()),
  );
  const contradictionTerms = [
    [/scale now/i, /do not scale|should not scale|hold/i],
    [/fund readiness/i, /scale now|immediately scale/i],
    [/hold/i, /scale now/i],
  ];
  if (
    contradictionTerms.some(
      ([fastRe, finalRe]) => fastRe.test(fastCanvasSnapshot) && finalRe.test(finalAnswer),
    )
  ) {
    return "contradicted";
  }
  if (positiveTerms.length >= 2) return "aligned";
  if (positiveTerms.length === 1) return "refined";
  return "unclear";
}

function findLeaks(text) {
  return LEAK_PATTERNS.filter((pattern) => pattern.re.test(text)).map(
    (pattern) => pattern.label,
  );
}

function scoreExecutiveClarity(answer) {
  const trimmed = answer.trim();
  if (!trimmed) return 1;
  if (trimmed.length < 80) return 3;
  if (trimmed.length > 2500) return 2;
  if (/^I (think|believe)|as an ai/i.test(trimmed)) return 2;
  return 5;
}

function scoreContains(text, patterns) {
  const hits = patterns.filter((pattern) => pattern.test(text)).length;
  if (hits >= 2) return 5;
  if (hits === 1) return 4;
  return 2;
}

function scoreCanvas({ fastCanvasSnapshot, nativeCanvasPayloads, companionTabs }) {
  if (nativeCanvasPayloads.length > 0 && companionTabs.length >= 5) return 5;
  if (fastCanvasSnapshot && /Decision canvas|Opportunity Map|Scale now|Fund readiness/i.test(fastCanvasSnapshot)) return 4;
  if (companionTabs.length > 0) return 3;
  return 1;
}

async function writeQuestionArtifacts(result) {
  const qDir = path.join(outDir, "questions", result.id);
  await fs.mkdir(qDir, { recursive: true });
  const requestBody =
    result.networkEvents.find((event) => event.kind === "request")?.postData ?? null;
  await fs.writeFile(
    path.join(qDir, "request-body.json"),
    `${JSON.stringify(requestBody, null, 2)}\n`,
  );
  await fs.writeFile(
    path.join(qDir, "score.json"),
    `${JSON.stringify(result.score, null, 2)}\n`,
  );
  await fs.writeFile(
    path.join(qDir, "parsed-direct-answer.txt"),
    `${result.finalAnswer}\n`,
  );
  await fs.writeFile(
    path.join(qDir, "parsed-companion-tabs.json"),
    `${JSON.stringify(result.companionTabs, null, 2)}\n`,
  );
  await fs.writeFile(
    path.join(qDir, "parsed-native-canvas.json"),
    `${JSON.stringify(result.nativeCanvasPayloads, null, 2)}\n`,
  );
  await fs.writeFile(
    path.join(qDir, "fast-analytics-canvas-snapshot.txt"),
    `${result.fastCanvasSnapshot ?? ""}\n`,
  );
  await fs.writeFile(
    path.join(qDir, "console-log.json"),
    `${JSON.stringify(
      {
        consoleErrors: result.consoleErrors,
        consoleWarnings: result.consoleWarnings,
        pageErrors: result.pageErrors,
        networkEvents: result.networkEvents,
      },
      null,
      2,
    )}\n`,
  );
}

function buildRunReport({ baseUrl, deploymentMetadata, results }) {
  const latencySummary = summarizeLatency(results);
  const qualitySummary = summarizeQuality(results);
  const summary = {
    baseUrl,
    total: results.length,
    hardPass: countWhere(results, "classification", "hard_pass"),
    softPass: countWhere(results, "classification", "soft_pass"),
    qualityFail: countWhere(results, "classification", "quality_fail"),
    technicalFail: countWhere(results, "classification", "technical_fail"),
    latencyFail: countWhere(results, "classification", "latency_fail"),
    leakCount: results.filter((result) => result.visibleLeaks.length > 0).length,
    consoleErrorCount: results.reduce((total, result) => total + result.consoleErrors.length, 0),
    fiveTabPresenceRate: rate(results, (result) => result.companionTabs.length >= 5),
    nativeCanvasPresenceRate: rate(results, (result) => result.score.technical.nativeCanvasPresent),
    fallbackCanvasUsageRate: rate(results, (result) => !result.nativeCanvasPayloads.length && result.score.technical.nativeCanvasPresent),
    alignmentCounts: countBy(results, "analyticsClaudeAlignment"),
  };
  return {
    metadata: {
      baseUrl,
      generatedAt: new Date().toISOString(),
      deploymentMetadata,
      thresholds: {
        fastCanvasTargetMs: 500,
        fastCanvasFailMs: 2000,
        firstModelTokenTargetMs: 3000,
        firstModelTokenFailMs: 10000,
        primaryAnswerTargetMs: 35000,
        primaryAnswerFailMs: 60000,
        finalSettleTargetMs: 45000,
        finalSettleFailMs: 75000,
      },
    },
    summary,
    latencySummary,
    qualitySummary,
    cxoDemoVerdict: buildCxoDemoVerdict({
      summary,
      latencySummary,
      qualitySummary,
      results,
    }),
    results,
  };
}

function summarizeLatency(results) {
  const metrics = [
    "fastCanvasMs",
    "firstModelTokenMs",
    "primaryClaudeCompleteMs",
    "finalSettleMs",
  ];
  return Object.fromEntries(
    metrics.map((metric) => {
      const values = results
        .map((result) => result.timings[metric])
        .filter((value) => Number.isFinite(value))
        .sort((a, b) => a - b);
      return [metric, percentileSummary(values)];
    }),
  );
}

function summarizeQuality(results) {
  const dimensions = [
    "executiveClarity",
    "advisoryJudgment",
    "evidenceGrounding",
    "decisionUsefulness",
    "riskControlAwareness",
    "canvasUsefulness",
    "followUpQuality",
    "noLeakHygiene",
    "tenantSpecificity",
    "average",
  ];
  return Object.fromEntries(
    dimensions.map((dimension) => [
      dimension,
      round(
        results.reduce((total, result) => total + (result.score[dimension] ?? 0), 0) /
          Math.max(1, results.length),
        2,
      ),
    ]),
  );
}

function percentileSummary(values) {
  if (!values.length) return { count: 0, p50: null, p90: null, p95: null, max: null };
  return {
    count: values.length,
    p50: percentile(values, 0.5),
    p90: percentile(values, 0.9),
    p95: percentile(values, 0.95),
    max: values.at(-1),
  };
}

function percentile(values, p) {
  const index = Math.min(values.length - 1, Math.ceil(values.length * p) - 1);
  return values[index];
}

function renderReport(report) {
  const byTenant = countBy(report.results, "tenant");
  const byCategory = countBy(report.results, "category");
  const byClassification = countBy(report.results, "classification");
  const slowest = [...report.results]
    .sort((a, b) => (b.timings.finalSettleMs ?? 0) - (a.timings.finalSettleMs ?? 0))
    .slice(0, 10);
  const weakest = [...report.results]
    .sort((a, b) => a.score.average - b.score.average)
    .slice(0, 10);
  return [
    "# Intelligence 100Q Pressure Test Report",
    "",
    "## Executive Summary",
    "",
    `- Base URL: ${report.metadata.baseUrl}`,
    `- Questions executed: ${report.summary.total}`,
    `- Hard pass: ${report.summary.hardPass}`,
    `- Soft pass: ${report.summary.softPass}`,
    `- Quality fail: ${report.summary.qualityFail}`,
    `- Technical fail: ${report.summary.technicalFail}`,
    `- Latency fail: ${report.summary.latencyFail}`,
    `- Leak count: ${report.summary.leakCount}`,
    `- Console error count: ${report.summary.consoleErrorCount}`,
    "",
    "## CXO Demo Verdict",
    "",
    `- Live demo ready: ${report.cxoDemoVerdict.liveDemoReady}`,
    `- Polished video ready: ${report.cxoDemoVerdict.polishedVideoReady}`,
    `- Technical diligence ready: ${report.cxoDemoVerdict.technicalDiligenceReady}`,
    `- Main blockers: ${report.cxoDemoVerdict.mainBlockers.length ? report.cxoDemoVerdict.mainBlockers.join("; ") : "None detected by automated gate"}`,
    `- Recommended demo storyline: ${report.cxoDemoVerdict.recommendedDemoStoryline}`,
    "",
    "## Deployment Metadata",
    "",
    "```json",
    JSON.stringify(report.metadata.deploymentMetadata, null, 2),
    "```",
    "",
    "## Pass / Fail By Tenant",
    "",
    markdownJson(byTenant),
    "",
    "## Pass / Fail By Category",
    "",
    markdownJson(byCategory),
    "",
    "## Classification Counts",
    "",
    markdownJson(byClassification),
    "",
    "## Latency Summary",
    "",
    markdownJson(report.latencySummary),
    "",
    "## Quality Summary",
    "",
    markdownJson(report.qualitySummary),
    "",
    "## Analytics vs Claude Alignment",
    "",
    markdownJson(report.summary.alignmentCounts),
    "",
    "## Canvas / Tab Rates",
    "",
    `- Five-tab presence rate: ${report.summary.fiveTabPresenceRate}`,
    `- Native canvas presence rate: ${report.summary.nativeCanvasPresenceRate}`,
    `- Fallback canvas usage rate: ${report.summary.fallbackCanvasUsageRate}`,
    "",
    "## Top 10 Slowest Questions",
    "",
    renderQuestionList(slowest, "finalSettleMs"),
    "",
    "## Top 10 Weakest Answers",
    "",
    renderQuestionList(weakest, "quality"),
    "",
    "## Recurring Failure Patterns",
    "",
    recurringFailurePatterns(report.results),
    "",
    "## Recommended Fixes",
    "",
    recommendedFixes(report.results),
    "",
  ].join("\n");
}

function buildCxoDemoVerdict({ summary, latencySummary, qualitySummary, results }) {
  const hardSoftPass = summary.hardPass + summary.softPass;
  const contradictionCount = summary.alignmentCounts.contradicted ?? 0;
  const finalP90 = latencySummary.finalSettleMs?.p90 ?? null;
  const finalMax = latencySummary.finalSettleMs?.max ?? null;
  const mainBlockers = [];

  if (hardSoftPass < 90) mainBlockers.push(`Hard+soft pass below 90/100 (${hardSoftPass})`);
  if (summary.hardPass < 75) mainBlockers.push(`Hard pass below 75/100 (${summary.hardPass})`);
  if (summary.technicalFail > 0) mainBlockers.push(`${summary.technicalFail} technical failures`);
  if (summary.leakCount > 0) mainBlockers.push(`${summary.leakCount} visible leak failures`);
  if (summary.fiveTabPresenceRate < 0.95) {
    mainBlockers.push(`Five-tab presence below 95% (${summary.fiveTabPresenceRate})`);
  }
  if (contradictionCount > 5) {
    mainBlockers.push(`Analytics-vs-Claude contradictions above threshold (${contradictionCount})`);
  }
  if (finalP90 !== null && finalP90 >= 75_000) {
    mainBlockers.push(`Final settle p90 above 75s (${finalP90}ms)`);
  }
  if (qualitySummary.average < 4) {
    mainBlockers.push(`Average quality below 4.0 (${qualitySummary.average})`);
  }

  const liveDemoReady = mainBlockers.length === 0 ? "Yes" : "No";
  const polishedVideoReady =
    summary.technicalFail === 0 &&
    summary.leakCount === 0 &&
    qualitySummary.average >= 3.8
      ? "Yes"
      : "No";
  const technicalDiligenceReady =
    summary.technicalFail === 0 &&
    summary.leakCount === 0 &&
    summary.fiveTabPresenceRate >= 0.95
      ? "Yes"
      : "No";
  const recommendedDemoStoryline = chooseRecommendedDemoStoryline(results);

  return {
    liveDemoReady,
    polishedVideoReady,
    technicalDiligenceReady,
    mainBlockers,
    thresholds: {
      hardSoftPassTarget: ">= 90/100",
      hardPassTarget: ">= 75/100",
      technicalFailuresTarget: 0,
      leakFailuresTarget: 0,
      fiveTabPresenceTarget: ">= 95%",
      contradictionTarget: "<= 5/100",
      finalSettleP90TargetMs: 75_000,
      averageQualityTarget: ">= 4.0/5",
      finalSettleMaxSoftCeilingMs: 110_000,
    },
    observed: {
      hardSoftPass,
      hardPass: summary.hardPass,
      technicalFailures: summary.technicalFail,
      leakFailures: summary.leakCount,
      fiveTabPresenceRate: summary.fiveTabPresenceRate,
      contradictionCount,
      finalSettleP90Ms: finalP90,
      finalSettleMaxMs: finalMax,
      averageQuality: qualitySummary.average,
    },
    recommendedDemoStoryline,
  };
}

function chooseRecommendedDemoStoryline(results) {
  const industrialPass = results.find(
    (result) =>
      result.tenant === "industrial" &&
      ["hard_pass", "soft_pass"].includes(result.classification) &&
      /prioriti|treasury|kyriba|shared/i.test(result.question),
  );
  const skyharborPass = results.find(
    (result) =>
      result.tenant === "skyharbor" &&
      ["hard_pass", "soft_pass"].includes(result.classification) &&
      /irops|portfolio|loyalty|crew/i.test(result.question),
  );
  if (industrialPass && skyharborPass) {
    return "Lead with Lakeshore Holdings value-office prioritization, then show SkyHarbor airline AI portfolio as the cross-industry proof of the same decision engine.";
  }
  if (skyharborPass) {
    return "Lead with SkyHarbor airline AI portfolio: scale Loyalty, certify Crew/Predictive, and fund IROPS readiness before scale.";
  }
  if (industrialPass) {
    return "Lead with Lakeshore Holdings back-office AI: scale Treasury/Kyriba, certify Finance and Shared Services, and gate HR/Legal by proof quality.";
  }
  return "Do not select a live demo storyline from this run until failures are reviewed.";
}

function renderDryRunReport(dryReport) {
  return [
    "# Intelligence 100Q Pressure Test - Dry Run",
    "",
    `- Base URL: ${dryReport.baseUrl}`,
    `- Question bank count: ${dryReport.questionCount}`,
    `- Selected count: ${dryReport.selectedCount}`,
    "",
    "Dry run generated the question bank and deployment metadata only. It did not execute signed-in browser questions.",
    "",
    "## Deployment Metadata",
    "",
    "```json",
    JSON.stringify(dryReport.deploymentMetadata, null, 2),
    "```",
    "",
  ].join("\n");
}

function renderResultsCsv(results) {
  const headers = [
    "id",
    "tenant",
    "category",
    "classification",
    "alignment",
    "qualityAverage",
    "fastCanvasMs",
    "firstModelTokenMs",
    "finalSettleMs",
    "leaks",
    "consoleErrors",
    "question",
  ];
  return [
    headers.join(","),
    ...results.map((result) =>
      [
        result.id,
        result.tenant,
        result.category,
        result.classification,
        result.analyticsClaudeAlignment,
        result.score.average,
        result.timings.fastCanvasMs ?? "",
        result.timings.firstModelTokenMs ?? "",
        result.timings.finalSettleMs ?? "",
        result.visibleLeaks.join("|"),
        result.consoleErrors.length,
        result.question,
      ]
        .map(csvCell)
        .join(","),
    ),
    "",
  ].join("\n");
}

async function captureDeploymentMetadata(base) {
  const metadata = {
    baseUrl: base,
    capturedAt: new Date().toISOString(),
    health: await fetchHealth(base),
    gitSha: await localGitSha(),
    aca: {
      app: process.env.ACA_CONTAINER_APP_NAME ?? DEFAULT_ACA_APP,
      resourceGroup: process.env.ACA_RESOURCE_GROUP ?? DEFAULT_ACA_RG,
      show: null,
      traffic: null,
      error: null,
    },
  };
  try {
    metadata.aca.show = await azJson([
      "containerapp",
      "show",
      "-n",
      metadata.aca.app,
      "-g",
      metadata.aca.resourceGroup,
    ]);
    metadata.aca.traffic = await azJson([
      "containerapp",
      "ingress",
      "traffic",
      "show",
      "-n",
      metadata.aca.app,
      "-g",
      metadata.aca.resourceGroup,
    ]);
  } catch (error) {
    metadata.aca.error = error.message;
  }
  return metadata;
}

async function fetchHealth(base) {
  try {
    const response = await fetch(`${base}/api/health`, { signal: AbortSignal.timeout(10_000) });
    const text = await response.text();
    return { status: response.status, body: safeJsonParse(text) ?? text.slice(0, 500) };
  } catch (error) {
    return { error: error.message };
  }
}

async function localGitSha() {
  try {
    const { stdout } = await execFileAsync("git", ["rev-parse", "HEAD"], { timeout: 5000 });
    return stdout.trim();
  } catch {
    return null;
  }
}

async function azJson(args) {
  const { stdout } = await execFileAsync("az", [...args, "-o", "json"], {
    timeout: 20_000,
    maxBuffer: 1024 * 1024 * 8,
  });
  return JSON.parse(stdout);
}

async function createZip(directory) {
  const zipPath = `${directory}.zip`;
  try {
    await execFileAsync("zip", ["-qr", zipPath, path.basename(directory)], {
      cwd: path.dirname(directory),
      timeout: 120_000,
    });
  } catch (error) {
    await fs.writeFile(
      path.join(directory, "ZIP_CREATION_FAILED.txt"),
      `${error.message}\n`,
    );
  }
}

function buildQuestionBank() {
  const rows = [];
  for (const [category, industrialCount, skyharborCount] of CATEGORY_TARGETS) {
    rows.push(...questionsFor("industrial", category, INDUSTRIAL_QUESTIONS[category], industrialCount));
    rows.push(...questionsFor("skyharbor", category, SKYHARBOR_QUESTIONS[category], skyharborCount));
  }
  return rows.map((question, index) => ({
    ...question,
    ordinal: index + 1,
  }));
}

function questionsFor(tenant, category, questions, count) {
  if (!questions || questions.length !== count) {
    throw new Error(`${tenant}/${category} expected ${count}, got ${questions?.length ?? 0}`);
  }
  return questions.map((text, index) => ({
    id: `${tenant}-${category}-${String(index + 1).padStart(2, "0")}`,
    tenant,
    category,
    text,
    expectedThemes: tenant === "skyharbor"
      ? ["SkyHarbor", "IROPS", "Loyalty", "Crew", "Predictive", "readiness", "gate"]
      : ["Treasury", "Kyriba", "Finance", "HR", "Legal", "Shared Services", "proof"],
  }));
}

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--dry-run") parsed.dryRun = true;
    else if (arg === "--headful") parsed.headful = true;
    else if (arg === "--no-screenshots") parsed.noScreenshots = true;
    else if (arg === "--base-url") parsed.baseUrl = argv[++index];
    else if (arg === "--out-dir") parsed.outDir = argv[++index];
    else if (arg === "--limit") parsed.limit = argv[++index];
  }
  return parsed;
}

function safeJsonParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function countWhere(rows, key, value) {
  return rows.filter((row) => row[key] === value).length;
}

function countBy(rows, key) {
  return rows.reduce((accumulator, row) => {
    const value = row[key] ?? "unknown";
    accumulator[value] = (accumulator[value] ?? 0) + 1;
    return accumulator;
  }, {});
}

function rate(rows, predicate) {
  if (!rows.length) return 0;
  return round(rows.filter(predicate).length / rows.length, 3);
}

function csvCell(value) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function markdownJson(value) {
  return ["```json", JSON.stringify(value, null, 2), "```"].join("\n");
}

function renderQuestionList(rows, metric) {
  if (!rows.length) return "- None";
  return rows
    .map((row, index) => {
      const value = metric === "quality" ? row.score.average : row.timings[metric];
      return `${index + 1}. ${row.id} - ${value ?? "n/a"} - ${row.question}`;
    })
    .join("\n");
}

function recurringFailurePatterns(results) {
  const patterns = [];
  if (results.some((result) => result.visibleLeaks.length > 0)) {
    patterns.push("- Visible protocol or JSON leakage detected.");
  }
  if (results.some((result) => result.analyticsClaudeAlignment === "contradicted")) {
    patterns.push("- Claude contradicted the deterministic analytics frame on at least one question.");
  }
  if (results.some((result) => (result.timings.finalSettleMs ?? 0) > 75_000)) {
    patterns.push("- Final UI settle exceeded the hard latency threshold.");
  }
  if (results.some((result) => result.companionTabs.length < 5)) {
    patterns.push("- Five-tab companion structure was missing on at least one question.");
  }
  return patterns.length ? patterns.join("\n") : "- None detected by the automated rubric.";
}

function recommendedFixes(results) {
  const fixes = [];
  if (results.some((result) => result.classification === "latency_fail")) {
    fixes.push("- Split left answer and right canvas generation more aggressively; keep final canvas async.");
  }
  if (results.some((result) => result.classification === "quality_fail")) {
    fixes.push("- Review weak-answer prompts and tighten the advisor instruction for direct POV, gates, and decisions.");
  }
  if (results.some((result) => result.analyticsClaudeAlignment === "contradicted")) {
    fixes.push("- Add explicit model instruction to explain any refinement from deterministic analytics rather than silently contradicting it.");
  }
  if (results.some((result) => result.visibleLeaks.length > 0)) {
    fixes.push("- Harden renderer sanitation for markers, canvas payloads, and trace text during stream and settle.");
  }
  return fixes.length ? fixes.join("\n") : "- No automated fixes recommended beyond manual review of screenshots and slowest questions.";
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
