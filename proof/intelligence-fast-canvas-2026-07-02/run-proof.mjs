import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import { createClerkClient } from "@clerk/backend";

const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:3210";
const outDir = path.resolve("proof/intelligence-fast-canvas-2026-07-02");
const screenshotsDir = path.join(outDir, "screenshots");

const accounts = {
  skyharbor: { email: "cto@skyharbor-air.example.com", activeClient: "skyharbor" },
  industrial: { email: "cfo@lakeshore-holdings.example.com", activeClient: "lakeshore" },
};

const scenarios = [
  {
    id: "industrial-broad",
    account: "industrial",
    question:
      "Across HR, Legal, Treasury, Finance, and Shared Services, where should we prioritize AI investment in the next 90 days?",
    expected: ["Treasury / Kyriba", "Finance semantic layer", "Legal AI"],
    finalAnswer:
      "Prioritize Treasury/Kyriba first, certify Finance and Shared Services next, and keep HR and Legal in readiness until the proof boundary is stronger.",
  },
  {
    id: "industrial-treasury",
    account: "industrial",
    question:
      "Is Kyriba ready to scale, and what control proof does the CFO need first?",
    expected: ["Treasury / Kyriba", "proof", "Decision required"],
    finalAnswer:
      "Kyriba is the cleanest scale lane, but the CFO still needs bank, signer, SAP feed, and SOX control evidence locked before calling it board-ready.",
  },
  {
    id: "industrial-hr-legal-shared-services",
    account: "industrial",
    question:
      "How should the CIO sequence HR AI, Legal AI, and Shared Services automation without over-ranking weak proof?",
    expected: ["Shared Services AI agent", "HR AI", "Legal AI"],
    finalAnswer:
      "Shared Services is the lighthouse candidate, while HR and Legal need readiness work before scale because the evidence boundary is thinner.",
  },
  {
    id: "skyharbor-portfolio",
    account: "skyharbor",
    question:
      "Where should SkyHarbor fund AI next across IROPS, predictive maintenance, crew recovery, loyalty, and customer disruption recovery?",
    expected: ["Loyalty AI", "Crew Recovery", "IROPS"],
    finalAnswer:
      "Scale Loyalty AI first, certify Crew Recovery and Predictive Maintenance, and fund IROPS readiness before any autonomous expansion.",
  },
  {
    id: "skyharbor-irops-readiness",
    account: "skyharbor",
    question:
      "For SkyHarbor IROPS, why fund readiness before scale, and what gate has to happen first?",
    expected: ["IROPS", "Fund readiness", "Decision required"],
    finalAnswer:
      "IROPS is the largest value pool, but it should get readiness funding first because operational data, controls, and dependencies are not certified for scale.",
  },
];

await fs.mkdir(screenshotsDir, { recursive: true });

if (!process.env.CLERK_SECRET_KEY) {
  throw new Error("CLERK_SECRET_KEY is required for signed-in local proof.");
}

const browser = await chromium.launch({ headless: true });
const results = [];

try {
  for (const scenario of scenarios) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await context.newPage();
    const consoleErrors = [];
    const pageErrors = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => pageErrors.push(error.message));

    const account = accounts[scenario.account];
    await signInWithServerTicket(page, account.email);
    await context.addCookies([
      {
        name: "abarva_active_client",
        value: account.activeClient,
        domain: new URL(baseUrl).hostname,
        path: "/",
        sameSite: "Lax",
        secure: baseUrl.startsWith("https://"),
      },
    ]);

    let apiFulfilledAt = null;
    await page.route("**/api/intelligence/ask**", async (route) => {
      await delay(2500);
      apiFulfilledAt = Date.now();
      await route.fulfill({
        status: 200,
        contentType: "application/x-ndjson; charset=utf-8",
        body: mockModelStream(scenario.finalAnswer),
      });
    });

    await page.goto(`${baseUrl}/intelligence`, { waitUntil: "networkidle" });
    await page.screenshot({
      path: path.join(screenshotsDir, `${scenario.id}-00-initial.png`),
      fullPage: true,
    });

    const submitAt = Date.now();
    await page.getByTestId("agent-dock-input").fill(scenario.question);
    await page.getByTestId("agent-dock-send").click();

    await page.getByText("Decision canvas").waitFor({ timeout: 10000 });
    await page.locator('[data-testid^="executive-canvas"]').first().waitFor({
      timeout: 10000,
    });
    const fastCanvasAt = Date.now();
    await page.screenshot({
      path: path.join(screenshotsDir, `${scenario.id}-01-fast-canvas.png`),
      fullPage: true,
    });

    for (const text of scenario.expected) {
      await page.getByText(text, { exact: false }).first().waitFor({ timeout: 10000 });
    }

    await page.getByText(scenario.finalAnswer, { exact: false }).waitFor({
      timeout: 15000,
    });
    const finalAt = Date.now();
    await page.screenshot({
      path: path.join(screenshotsDir, `${scenario.id}-02-final.png`),
      fullPage: true,
    });

    const visibleText = await page.locator("body").innerText();
    const leakTerms = ["<<<TAB:", "grounding:", "abarva-canvas", "canvasType"];
    const leaks = leakTerms.filter((term) => visibleText.includes(term));

    results.push({
      id: scenario.id,
      tenant: scenario.account,
      question: scenario.question,
      submitAt,
      fastCanvasAt,
      apiFulfilledAt,
      finalAt,
      fastCanvasMs: fastCanvasAt - submitAt,
      apiFulfilledMs: apiFulfilledAt ? apiFulfilledAt - submitAt : null,
      finalMs: finalAt - submitAt,
      expectedVisible: scenario.expected,
      leaks,
      consoleErrors,
      pageErrors,
      screenshots: {
        initial: path.join(screenshotsDir, `${scenario.id}-00-initial.png`),
        fastCanvas: path.join(screenshotsDir, `${scenario.id}-01-fast-canvas.png`),
        final: path.join(screenshotsDir, `${scenario.id}-02-final.png`),
      },
      passed:
        leaks.length === 0 &&
        consoleErrors.length === 0 &&
        pageErrors.length === 0 &&
        fastCanvasAt - submitAt < 500,
    });

    await context.close();
  }
} finally {
  await browser.close();
}

const report = {
  baseUrl,
  createdAt: new Date().toISOString(),
  thresholds: {
    fastCanvasMs: 500,
    leakTerms: ["<<<TAB:", "grounding:", "abarva-canvas", "canvasType"],
  },
  summary: {
    scenarios: results.length,
    passed: results.filter((result) => result.passed).length,
    failed: results.filter((result) => !result.passed).length,
    maxFastCanvasMs: Math.max(...results.map((result) => result.fastCanvasMs)),
    maxFinalMs: Math.max(...results.map((result) => result.finalMs)),
  },
  results,
};

await fs.writeFile(
  path.join(outDir, "browser-proof-report.json"),
  `${JSON.stringify(report, null, 2)}\n`,
);
console.log(JSON.stringify(report.summary, null, 2));

async function signInWithServerTicket(page, email) {
  const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
  const users = await clerk.users.getUserList({ emailAddress: [email], limit: 1 });
  const user = users.data[0];
  if (!user) throw new Error(`No Clerk user found for ${email}`);
  const signInToken = await clerk.signInTokens.createSignInToken({
    userId: user.id,
    expiresInSeconds: 300,
  });

  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.Clerk?.loaded === true, null, {
    timeout: 20000,
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
    timeout: 20000,
  });
}

function mockModelStream(answer) {
  const modelCanvas = {
    canvasType: "proof-boundary-card",
    title: "Model-grounded proof boundary",
    proofBoundary: {
      known: ["The final advisor answer has arrived."],
      missing: ["Production tenant evidence proof must be captured after deploy."],
      assumed: ["This local proof uses a mocked model stream to isolate renderer timing."],
      decisionRequired: "Use signed-in production proof before claiming live.",
    },
  };
  const agentAnswer = {
    surface: "intelligence",
    mode: "ANALYZE",
    status: "answered",
    directAnswer: answer,
    prose: answer,
    factsUsed: [],
    metricsUsed: [],
    relationshipsUsed: [],
    expertsUsed: [],
    artifacts: [],
    citations: [],
    decisionFrame: {
      intelligenceTabs: [
        {
          id: "decision",
          label: "Decision",
          grounding: "tenant-evidence",
          content: answer,
        },
        {
          id: "chart",
          label: "Chart",
          grounding: "mixed",
          content: [
            "Final model-grounded proof boundary.",
            "",
            "```abarva-canvas",
            JSON.stringify(modelCanvas),
            "```",
          ].join("\n"),
        },
      ],
    },
  };
  return [
    JSON.stringify({ type: "delta", text: answer }),
    JSON.stringify({ type: "agent-answer", answer: agentAnswer }),
    JSON.stringify({ type: "done" }),
    "",
  ].join("\n");
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
