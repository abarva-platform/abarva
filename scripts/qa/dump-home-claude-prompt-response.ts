import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { buildHomeKnowDimensionDossier } from "@/lib/home/know/build-universal-dimension-dossier";
import { buildHomeKnowResponseFromDossier } from "@/lib/home/know/compose-dossier-answer";
import {
  HOME_CONSULTANT_TEXT_SYSTEM_PROMPT,
  buildHomeConsultantTextPromptPacket,
  isHomeConsultantTextSynthesisResult,
  renderHomeConsultantTextUserPrompt,
  synthesizeHomeConsultantText,
} from "@/lib/home/know/home-consultant-text-synthesis";
import { validateHomeKnowResponse } from "@/lib/home/know/home-know-engine";
import type { HomeKnowResponse } from "@/lib/home/know/home-know-contract";

type PromptDumpCase = {
  id: string;
  tenantKey: string;
  question: string;
};

type LiveApiResult = {
  ok: boolean;
  status: number;
  response: HomeKnowResponse | null;
  error?: string;
};

const CASES: PromptDumpCase[] = [
  {
    id: "skyharbor-org-leaders",
    tenantKey: "skyharbor",
    question:
      "how is our IT and business organized today? who are our technology leaders under our CIO?",
  },
  {
    id: "skyharbor-data-analytics",
    tenantKey: "skyharbor",
    question: "what kind of technologies are used in data and analytics today?",
  },
  {
    id: "skyharbor-application-graph",
    tenantKey: "skyharbor",
    question: "show a graph of systems, integrations, vendors, and owners for operations technology",
  },
  {
    id: "lakeshore-vendors",
    tenantKey: "lakeshore",
    question: "which vendors are most important to our operating model and why?",
  },
];

async function main() {
  const outDir =
    process.env.HOME_KNOW_PROMPT_DUMP_DIR?.trim() ||
    path.join(os.homedir(), "Downloads");
  fs.mkdirSync(outDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const liveClient = await createLiveApiClient();
  const results = [];

  for (const item of CASES) {
    const { dossier } = buildHomeKnowDimensionDossier({
      tenantKey: item.tenantKey,
      question: item.question,
      requestedSurface: "home",
    });
    const deterministicResponse = validateHomeKnowResponse(
      buildHomeKnowResponseFromDossier({
        tenantKey: item.tenantKey,
        question: item.question,
        dossier,
      }),
    );
    const promptPacket = buildHomeConsultantTextPromptPacket({
      dossier,
      response: deterministicResponse,
    });
    const userPrompt = renderHomeConsultantTextUserPrompt(promptPacket);
    const fullPrompt = [HOME_CONSULTANT_TEXT_SYSTEM_PROMPT, userPrompt].join(
      "\n\n",
    );
    const synthesis = await synthesizeHomeConsultantText({
      dossier,
      deterministicResponse,
    });
    const liveApi = liveClient ? await liveClient(item) : null;
    const claudeOutput = isHomeConsultantTextSynthesisResult(synthesis)
      ? synthesis.text
      : null;
    const claudeTrace = synthesis
      ? isHomeConsultantTextSynthesisResult(synthesis)
        ? synthesis.trace
        : synthesis
      : null;

    results.push({
      ...item,
      route: dossier.route,
      promptPacket,
      systemPrompt: HOME_CONSULTANT_TEXT_SYSTEM_PROMPT,
      userPrompt,
      fullPrompt,
      deterministicResponse: {
        prose: deterministicResponse.prose,
        intent: deterministicResponse.intent,
        answerStatus: deterministicResponse.answerStatus,
        dimensionsUsed: deterministicResponse.dimensionsUsed,
        tables: deterministicResponse.tables.map((table) => ({
          id: table.id,
          title: table.title,
          rowCount: table.rows.length,
        })),
        charts: deterministicResponse.charts.map((chart) => ({
          id: chart.id,
          title: chart.title,
          pointCount: chart.data.length,
        })),
        graphs: deterministicResponse.graphs.map((graph) => ({
          id: graph.id,
          title: graph.title,
          nodeCount: graph.nodes.length,
          edgeCount: graph.edges.length,
        })),
        gaps: deterministicResponse.gaps.map((gap) => gap.displayLabel),
      },
      claudeOutput,
      claudeTrace,
      liveApi,
    });
  }

  if (liveClient?.close) await liveClient.close();

  const jsonPath = path.join(
    outDir,
    `home-claude-prompt-response-dump-${stamp}.json`,
  );
  const htmlPath = path.join(
    outDir,
    `home-claude-prompt-response-dump-${stamp}.html`,
  );
  fs.writeFileSync(jsonPath, JSON.stringify({ generatedAt: stamp, results }, null, 2));
  fs.writeFileSync(htmlPath, renderHtml(stamp, results));
  console.log(JSON.stringify({ htmlPath, jsonPath, cases: results.length }, null, 2));
}

async function createLiveApiClient(): Promise<
  | (((item: PromptDumpCase) => Promise<LiveApiResult>) & { close?: () => Promise<void> })
  | null
> {
  const baseUrl = process.env.BASE_URL?.trim();
  const storageState = process.env.HOME_KNOW_STORAGE_STATE?.trim();
  if (!baseUrl || !storageState) return null;
  const { chromium } = await import("playwright");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState });
  const page = await context.newPage();
  await page.goto(`${baseUrl.replace(/\/$/, "")}/home`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  const client = (async (item: PromptDumpCase) => {
    return page.evaluate(
      async ({ question, tenantKey }) => {
        const response = await fetch("/api/home/know/ask", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ question, tenantKey, client: tenantKey }),
        });
        const text = await response.text();
        try {
          return {
            ok: response.ok,
            status: response.status,
            response: JSON.parse(text),
          };
        } catch {
          return {
            ok: response.ok,
            status: response.status,
            response: null,
            error: text.slice(0, 500),
          };
        }
      },
      { question: item.question, tenantKey: item.tenantKey },
    ) as Promise<LiveApiResult>;
  }) as ((item: PromptDumpCase) => Promise<LiveApiResult>) & {
    close?: () => Promise<void>;
  };
  client.close = async () => {
    await browser.close();
  };
  return client;
}

function renderHtml(stamp: string, results: unknown[]): string {
  const rows = results
    .map((raw) => {
      const item = raw as {
        id: string;
        tenantKey: string;
        question: string;
        route: { primaryDimension: string; relatedDimensions: string[] };
        promptPacket: unknown;
        systemPrompt: string;
        userPrompt: string;
        fullPrompt: string;
        deterministicResponse: { prose: string };
        claudeOutput: string | null;
        claudeTrace: unknown;
        liveApi: LiveApiResult | null;
      };
      const liveProse = item.liveApi?.response?.prose ?? null;
      const responseLabel = item.claudeOutput
        ? "Direct Claude synthesis"
        : liveProse
          ? "Live API final prose"
          : "No model/live response captured";
      const responseText =
        item.claudeOutput ||
        liveProse ||
        "No Anthropic key was available locally and no signed-in live API state was provided.";
      return `<section class="case">
        <div class="case-head">
          <div>
            <p class="ey">${escapeHtml(item.tenantKey)} · ${escapeHtml(item.id)}</p>
            <h2>${escapeHtml(item.question)}</h2>
          </div>
          <div class="route">Primary: ${escapeHtml(item.route.primaryDimension)}<br/>Related: ${escapeHtml(item.route.relatedDimensions.join(", ") || "none")}</div>
        </div>
        <div class="grid">
          <article>
            <h3>Prompt Sent To Claude</h3>
            <h4>System</h4>
            <pre>${escapeHtml(item.systemPrompt)}</pre>
            <h4>User / Dossier Prompt</h4>
            <pre>${escapeHtml(item.userPrompt)}</pre>
          </article>
          <article>
            <h3>Response Received</h3>
            <p class="label">${escapeHtml(responseLabel)}</p>
            <pre>${escapeHtml(responseText)}</pre>
            <h4>Deterministic fallback prose</h4>
            <pre>${escapeHtml(item.deterministicResponse.prose)}</pre>
            <h4>Composer trace</h4>
            <pre>${escapeHtml(JSON.stringify(item.liveApi?.response?.safety?.composerTrace ?? item.claudeTrace ?? null, null, 2))}</pre>
          </article>
        </div>
        <details>
          <summary>Structured prompt packet</summary>
          <pre>${escapeHtml(JSON.stringify(item.promptPacket, null, 2))}</pre>
        </details>
      </section>`;
    })
    .join("\n");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Home Claude Prompt / Response Dump</title>
<style>
body{margin:0;background:#f7f5ef;color:#171713;font-family:Inter,system-ui,sans-serif}
header{padding:34px 42px;background:#fff;border-bottom:1px solid #e6e0d4}
h1{font-family:Georgia,serif;font-size:30px;margin:0 0 8px}
p{line-height:1.55}
.wrap{padding:28px 42px;display:grid;gap:24px}
.case{background:#fff;border:1px solid #e6e0d4;border-radius:10px;padding:22px;display:grid;gap:18px}
.case-head{display:flex;justify-content:space-between;gap:24px;border-bottom:1px solid #ece7dc;padding-bottom:14px}
.ey,.route,.label,h4{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;color:#666156}
h2{font-family:Georgia,serif;font-size:22px;margin:4px 0 0}
h3{margin:0 0 12px;font-size:16px}
h4{margin:16px 0 6px;text-transform:uppercase;letter-spacing:.08em}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:18px}
article,details{min-width:0}
pre{white-space:pre-wrap;word-break:break-word;background:#fbfaf6;border:1px solid #eee8dc;border-radius:8px;padding:14px;line-height:1.45;font-size:12px;max-height:680px;overflow:auto}
summary{cursor:pointer;font-weight:700}
@media(max-width:1000px){.grid,.case-head{display:grid}.wrap,header{padding-left:20px;padding-right:20px}}
</style>
</head>
<body>
<header>
  <h1>Home/aVa Claude Prompt and Response Dump</h1>
  <p>Generated ${escapeHtml(stamp)}. This report shows the exact Home consultant synthesis prompt builder output, the structured dossier packet, and either the direct Claude synthesis result or the signed-in live API final prose when local Claude credentials are not present.</p>
</header>
<main class="wrap">${rows}</main>
</body>
</html>`;
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
