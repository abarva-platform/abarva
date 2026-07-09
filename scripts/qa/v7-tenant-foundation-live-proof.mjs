#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import dotenv from "dotenv";
import { createClerkClient } from "@clerk/backend";
import { chromium } from "playwright";

const cwd = process.cwd();
dotenv.config({ path: path.join(cwd, ".env.local"), override: false });
dotenv.config({ path: path.join(cwd, ".env"), override: false });

const baseUrl = process.env.V7_TENANT_PROOF_BASE_URL ?? "https://app.abarva.ai";
const runStamp = new Date().toISOString().replace(/[:.]/g, "-");
const outDir =
  process.env.V7_TENANT_PROOF_OUT ??
  path.join(cwd, "proof", "v7-tenant-foundation-live", runStamp);

const tenants = {
  meridian: {
    label: "Meridian Health",
    appClientKey: "meridian",
    tenantKey: "meridian-health",
    agentEmail: "meridian-agent@abarva.example.com",
    fallbackEmail: "demo-meridian+clerk_test@abarva.com",
    forbiddenTenantTerms: [/lakeshore/i, /skyharbor/i],
    unsupportedClaimPatterns: [
      /\breal patient\b/i,
      /\breal member\b/i,
      /\bproduction longitudinal patient view exists\b/i,
      /\bdatabricks (is|has been) implemented\b/i,
      /\bmedallion architecture (is|has been) implemented\b/i,
      /\baudited (savings|roi|margin|hedis|star)\b/i,
      /\$[0-9][0-9,.]*(?:m|k|b| million| billion)?/i,
    ],
  },
  skyharbor: {
    label: "SkyHarbor Air",
    appClientKey: "skyharbor",
    tenantKey: "skyharbor-air",
    agentEmail: "skyharbor-agent@abarva.example.com",
    fallbackEmail: "cto@skyharbor-air.example.com",
    forbiddenTenantTerms: [/lakeshore/i, /meridian/i],
    unsupportedClaimPatterns: [/\bkyriba\b/i, /\bhealth plan\b/i],
  },
  lakeshore: {
    label: "Lakeshore Holdings",
    appClientKey: "lakeshore",
    tenantKey: "lakeshore-holdings",
    agentEmail: "lakeshore-agent@abarva.example.com",
    fallbackEmail: "cfo@lakeshore-holdings.example.com",
    forbiddenTenantTerms: [/skyharbor/i, /meridian/i],
    unsupportedClaimPatterns: [/\birops\b/i, /\bhealth plan\b/i, /\bepic clarity\b/i],
  },
};

const questions = [
  {
    id: "MER-HOME-001",
    tenant: "meridian",
    module: "home",
    text: "What does Meridian know about its current analytics and reporting estate?",
    mustInclude: ["Epic", "SQL", "Tableau", "Power BI", "SAS"],
    mustNotClaim: ["production-ready", "audited savings"],
  },
  {
    id: "MER-HOME-002",
    tenant: "meridian",
    module: "home",
    text: "What gaps would block a unified clinical and claims lakehouse?",
    mustInclude: ["claims", "pharmacy", "medallion", "governance"],
    mustNotClaim: ["implemented", "production longitudinal"],
  },
  {
    id: "MER-HOME-003",
    tenant: "meridian",
    module: "home",
    text: "What should the CDAO know before using this data foundation for AI automation?",
    mustInclude: ["governance", "semantic", "lineage", "controls"],
    mustNotClaim: ["production-ready", "savings"],
  },
  {
    id: "MER-INT-001",
    tenant: "meridian",
    module: "intelligence",
    text: "What does Meridian know about its current analytics and reporting estate?",
    mustInclude: ["Epic", "SQL", "Tableau", "Power BI", "SAS"],
    mustNotClaim: ["real patient", "audited savings"],
  },
  {
    id: "MER-INT-002",
    tenant: "meridian",
    module: "intelligence",
    text: "What gaps would block a unified clinical and claims lakehouse?",
    mustInclude: ["claims", "pharmacy", "medallion", "governance"],
    mustNotClaim: ["implemented", "production longitudinal"],
  },
  {
    id: "MER-INT-003",
    tenant: "meridian",
    module: "intelligence",
    text: "What should the CDAO know before using this data foundation for AI automation?",
    mustInclude: ["governance", "semantic", "lineage", "controls"],
    mustNotClaim: ["production-ready", "realized ROI"],
  },
  {
    id: "SKY-INT-001",
    tenant: "skyharbor",
    module: "intelligence",
    text: "Which SkyHarbor systems, risks, and dependencies matter most for an IROPS AI Move?",
    mustInclude: ["IROPS", "system", "risk"],
    mustNotClaim: ["Lakeshore", "Meridian"],
  },
  {
    id: "LAK-HOME-001",
    tenant: "lakeshore",
    module: "home",
    text: "What context is loaded for Lakeshore and what can we trust?",
    mustInclude: ["Lakeshore", "context"],
    mustNotClaim: ["SkyHarbor", "Meridian"],
  },
  {
    id: "LAK-INT-001",
    tenant: "lakeshore",
    module: "intelligence",
    text: "What should Lakeshore not claim yet from its loaded evidence?",
    mustInclude: ["claim", "evidence"],
    mustNotClaim: ["SkyHarbor", "Meridian"],
  },
];

const pageChecks = [
  { id: "LAK-MOVES-PAGE", tenant: "lakeshore", path: "/programs", mustInclude: ["Lakeshore"] },
  { id: "LAK-TOWER-PAGE", tenant: "lakeshore", path: "/tower", mustInclude: ["Tower"] },
  { id: "LAK-SOURCE-PAGE", tenant: "lakeshore", path: "/source", mustInclude: ["Source"] },
];

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

async function ensureDirs() {
  for (const dir of ["screenshots", "turns", "streams", "reports"]) {
    await fs.mkdir(path.join(outDir, dir), { recursive: true });
  }
}

async function signIn(page, context, tenant) {
  const clerk = createClerkClient({ secretKey: requiredEnv("CLERK_SECRET_KEY") });
  const user =
    (await findClerkUser(clerk, tenant.agentEmail)) ??
    (await findClerkUser(clerk, tenant.fallbackEmail));
  if (!user) {
    throw new Error(`No Clerk proof user found for ${tenant.agentEmail} or ${tenant.fallbackEmail}`);
  }
  const ticket = await clerk.signInTokens.createSignInToken({
    userId: user.id,
    expiresInSeconds: 300,
  });
  await page.goto("/", { waitUntil: "domcontentloaded", timeout: 45_000 });
  await page.waitForFunction(() => window.Clerk?.loaded === true, null, { timeout: 30_000 });
  await page.evaluate(async (token) => {
    const result = await window.Clerk.client.signIn.create({ strategy: "ticket", ticket: token });
    if (result.status !== "complete" || !result.createdSessionId) {
      throw new Error(`Ticket sign-in failed: ${result.status}`);
    }
    await window.Clerk.setActive({ session: result.createdSessionId });
  }, ticket.token);
  await page.waitForFunction(() => document.cookie.includes("__session="), null, { timeout: 30_000 });
  await context.addCookies([
    {
      name: "abarva_active_client",
      value: tenant.appClientKey,
      url: baseUrl,
      httpOnly: false,
      secure: baseUrl.startsWith("https://"),
      sameSite: "Lax",
    },
  ]);
  return { id: user.id, email: user.emailAddresses?.[0]?.emailAddress ?? tenant.agentEmail };
}

async function findClerkUser(clerk, email) {
  const users = await clerk.users.getUserList({ emailAddress: [email], limit: 1 });
  return users.data[0] ?? null;
}

async function askHome(page, item, tenant) {
  const payload = await page.evaluate(async ({ question, client }) => {
    const response = await fetch("/api/home/know/ask", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "x-abarva-debug-home-know": "1",
      },
      body: JSON.stringify({ question, client }),
    });
    return { status: response.status, json: await response.json().catch(async () => ({ raw: await response.text() })) };
  }, { question: item.text, client: tenant.appClientKey });
  const text = [
    payload.json?.prose,
    ...(payload.json?.facts ?? []).map((fact) => fact.label ?? fact.value ?? ""),
    ...(payload.json?.tables ?? []).flatMap((table) => [
      table.title,
      ...(table.rows ?? []).flatMap((row) => Object.values(row ?? {})),
    ]),
    ...(payload.json?.gaps ?? []).map((gap) => `${gap.displayLabel ?? ""} ${gap.message ?? ""}`),
  ].filter(Boolean).join("\n");
  const sources = [
    ...(payload.json?.citations ?? []),
    ...(payload.json?.facts ?? []).flatMap((fact) => fact.citationIds ?? []),
  ];
  return {
    httpStatus: payload.status,
    response: payload.json,
    answerText: text,
    sources,
    trace: payload.json?.trace ?? null,
  };
}

async function askIntelligence(page, item, tenant) {
  const raw = await page.evaluate(async ({ query, client, tenantLabel }) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120_000);
    try {
      const response = await fetch("/api/intelligence/ask", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          query,
          client,
          tabId: `v7-proof-${client}-${Date.now()}`,
          traceEnabled: true,
          richText: false,
          answerOnlyStreaming: false,
          surfaceContext: {
            activeClient: tenantLabel,
            clientKey: client,
            activeTab: "intelligence",
            tenantFacts: [`Authenticated live proof tenant is ${tenantLabel}.`],
          },
        }),
      });
      return { status: response.status, text: await response.text() };
    } finally {
      clearTimeout(timeout);
    }
  }, { query: item.text, client: tenant.appClientKey, tenantLabel: tenant.label });
  const events = raw.text.split(/\r?\n/).filter(Boolean).map((line) => {
    try {
      return JSON.parse(line);
    } catch {
      return { type: "parse_error", raw: line };
    }
  });
  const answerText = events.map((event) => {
    if (event.type === "delta") return event.text ?? "";
    if (event.type === "agent-answer") return event.answer?.directAnswer ?? "";
    if (event.type === "error") return `[error] ${event.error ?? "unknown"}`;
    return "";
  }).join("").trim();
  const sources = events.flatMap((event) => {
    if (event.type === "sources" && Array.isArray(event.sources)) return event.sources;
    if (event.type === "agent-answer" && Array.isArray(event.answer?.citations)) return event.answer.citations;
    return [];
  });
  return {
    httpStatus: raw.status,
    rawText: raw.text,
    events,
    answerText,
    sources,
    trace: events.find((event) => event.type === "trace") ?? null,
  };
}

function scoreTurn(item, tenant, result) {
  const flags = [];
  const answer = result.answerText ?? "";
  const lower = answer.toLowerCase();
  if (result.httpStatus !== 200) flags.push(`http_${result.httpStatus}`);
  if (answer.length < 80) flags.push("answer_too_short");
  for (const term of item.mustInclude ?? []) {
    if (!lower.includes(term.toLowerCase())) flags.push(`missing:${term}`);
  }
  for (const term of item.mustNotClaim ?? []) {
    if (lower.includes(term.toLowerCase())) flags.push(`must_not_claim:${term}`);
  }
  for (const pattern of tenant.forbiddenTenantTerms ?? []) {
    if (pattern.test(answer)) flags.push(`tenant_bleed:${pattern}`);
  }
  for (const pattern of tenant.unsupportedClaimPatterns ?? []) {
    if (pattern.test(answer)) flags.push(`unsupported_claim_pattern:${pattern}`);
  }
  if (item.module === "intelligence" && (result.sources?.length ?? 0) === 0) {
    flags.push("no_sources_event");
  }
  if (/```json|raw json|debug|sentinel/i.test(answer)) flags.push("protocol_leak");
  const hard = flags.filter((flag) => /http_|tenant_bleed|unsupported_claim|must_not_claim|protocol_leak/.test(flag));
  return { verdict: hard.length ? "fail" : flags.length ? "watch" : "pass", flags };
}

function extractClaimReport(result) {
  const answer = result.answerText ?? "";
  const moneyClaims = answer.match(/\$[0-9][0-9,.]*(?:m|k|b| million| billion)?/gi) ?? [];
  const percentClaims = answer.match(/\b[0-9]+(?:\.[0-9]+)?%/g) ?? [];
  const sourceText = JSON.stringify(result.sources ?? []);
  return {
    moneyClaims,
    percentClaims,
    moneyClaimsInSources: moneyClaims.map((claim) => ({ claim, found: sourceText.includes(claim) })),
    percentClaimsInSources: percentClaims.map((claim) => ({ claim, found: sourceText.includes(claim) })),
    sourceCount: result.sources?.length ?? 0,
    sourceNames: (result.sources ?? []).slice(0, 12).map((source) => source.name ?? source.title ?? source.id ?? source.citationId ?? source.type ?? "source"),
  };
}

async function runTurn(page, item) {
  const tenant = tenants[item.tenant];
  const startedAt = new Date().toISOString();
  const started = Date.now();
  const result = item.module === "home" ? await askHome(page, item, tenant) : await askIntelligence(page, item, tenant);
  const completedAt = new Date().toISOString();
  const score = scoreTurn(item, tenant, result);
  const claimReport = extractClaimReport(result);
  const record = {
    ...item,
    tenantKey: tenant.tenantKey,
    appClientKey: tenant.appClientKey,
    startedAt,
    completedAt,
    latencyMs: Date.now() - started,
    httpStatus: result.httpStatus,
    answerText: result.answerText,
    sourceCount: result.sources?.length ?? 0,
    score,
    claimReport,
    traceSummary: summarizeTrace(result.trace),
  };
  await fs.writeFile(path.join(outDir, "turns", `${item.id}.json`), `${JSON.stringify({ record, result }, null, 2)}\n`);
  if (result.rawText) await fs.writeFile(path.join(outDir, "streams", `${item.id}.ndjson`), result.rawText);
  return record;
}

function summarizeTrace(trace) {
  if (!trace) return null;
  return {
    type: trace.type ?? null,
    keys: Object.keys(trace.trace ?? trace).slice(0, 20),
  };
}

async function runPageCheck(page, check) {
  const tenant = tenants[check.tenant];
  const startedAt = new Date().toISOString();
  await page.goto(check.path, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForTimeout(1500);
  const text = await page.evaluate(() => document.body?.innerText ?? "");
  const screenshotPath = path.join(outDir, "screenshots", `${check.id}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {});
  const flags = [];
  for (const term of check.mustInclude ?? []) {
    if (!text.toLowerCase().includes(term.toLowerCase())) flags.push(`missing:${term}`);
  }
  for (const pattern of tenant.forbiddenTenantTerms ?? []) {
    if (pattern.test(text)) flags.push(`tenant_bleed:${pattern}`);
  }
  return {
    ...check,
    startedAt,
    completedAt: new Date().toISOString(),
    screenshotPath,
    textSample: text.slice(0, 5000),
    score: { verdict: flags.some((f) => f.startsWith("tenant_bleed")) ? "fail" : flags.length ? "watch" : "pass", flags },
  };
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function counts(records) {
  return {
    total: records.length,
    pass: records.filter((r) => r.score.verdict === "pass").length,
    watch: records.filter((r) => r.score.verdict === "watch").length,
    fail: records.filter((r) => r.score.verdict === "fail").length,
  };
}

async function writeReport(turns, pages, meta) {
  const summary = {
    meta,
    turns: counts(turns),
    pages: counts(pages),
    answerHash: sha256(turns.map((turn) => `${turn.id}\n${turn.answerText}`).join("\n\n")),
    claimToSource: turns.map((turn) => ({
      id: turn.id,
      tenant: turn.tenant,
      module: turn.module,
      verdict: turn.score.verdict,
      flags: turn.score.flags,
      ...turn.claimReport,
    })),
  };
  await fs.writeFile(path.join(outDir, "results.json"), `${JSON.stringify({ summary, turns, pages }, null, 2)}\n`);
  await fs.writeFile(path.join(outDir, "reports", "claim-to-source.json"), `${JSON.stringify(summary.claimToSource, null, 2)}\n`);
  await fs.writeFile(path.join(outDir, "README.md"), [
    "# V7 Tenant Foundation Live Proof",
    "",
    `Base URL: ${meta.baseUrl}`,
    `Started: ${meta.startedAt}`,
    `Completed: ${meta.completedAt}`,
    `Turns pass/watch/fail: ${summary.turns.pass}/${summary.turns.watch}/${summary.turns.fail}`,
    `Page checks pass/watch/fail: ${summary.pages.pass}/${summary.pages.watch}/${summary.pages.fail}`,
    `Answer hash: ${summary.answerHash}`,
    "",
    "This proof authenticates with Clerk ticket sign-in, sets the active client cookie, calls live Home and Intelligence APIs, captures screenshots, and writes raw turn evidence under `turns/` and `streams/`.",
    "",
    "Known boundary: this runner verifies live answer/source behavior. It does not mutate tenant packs and does not promote SkyHarbor candidate V7 data.",
  ].join("\n"));
}

async function main() {
  await ensureDirs();
  const startedAt = new Date().toISOString();
  const browser = await chromium.launch({ headless: true });
  const turns = [];
  const pages = [];
  try {
    for (const key of Object.keys(tenants)) {
      const tenant = tenants[key];
      const context = await browser.newContext({ baseURL: baseUrl, viewport: { width: 1440, height: 1100 } });
      const page = await context.newPage();
      const user = await signIn(page, context, tenant);
      await page.goto("/home", { waitUntil: "domcontentloaded", timeout: 60_000 });
      await page.waitForTimeout(1200);
      await page.screenshot({ path: path.join(outDir, "screenshots", `${key}-home-start.png`), fullPage: true }).catch(() => {});
      await page.goto("/intelligence", { waitUntil: "domcontentloaded", timeout: 60_000 });
      await page.waitForTimeout(1200);
      await page.screenshot({ path: path.join(outDir, "screenshots", `${key}-intelligence-start.png`), fullPage: true }).catch(() => {});
      console.log(`Signed in ${key} as ${user.email}`);
      for (const item of questions.filter((q) => q.tenant === key)) {
        process.stdout.write(`${item.id} ... `);
        try {
          const turn = await runTurn(page, item);
          turns.push(turn);
          console.log(turn.score.verdict, turn.score.flags.join(",") || "ok");
        } catch (error) {
          const turn = {
            ...item,
            tenantKey: tenant.tenantKey,
            appClientKey: tenant.appClientKey,
            startedAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
            latencyMs: 0,
            httpStatus: 0,
            answerText: "",
            sourceCount: 0,
            score: { verdict: "fail", flags: [`runner_error:${error instanceof Error ? error.message : String(error)}`] },
            claimReport: { sourceCount: 0, moneyClaims: [], percentClaims: [] },
          };
          turns.push(turn);
          await fs.writeFile(path.join(outDir, "turns", `${item.id}.json`), `${JSON.stringify({ turn, error: String(error?.stack ?? error) }, null, 2)}\n`);
          console.log("fail", turn.score.flags.join(","));
        }
      }
      for (const check of pageChecks.filter((q) => q.tenant === key)) {
        process.stdout.write(`${check.id} ... `);
        const pageCheck = await runPageCheck(page, check).catch((error) => ({
          ...check,
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          screenshotPath: null,
          textSample: "",
          score: { verdict: "fail", flags: [`runner_error:${error instanceof Error ? error.message : String(error)}`] },
        }));
        pages.push(pageCheck);
        await fs.writeFile(path.join(outDir, "turns", `${check.id}.json`), `${JSON.stringify(pageCheck, null, 2)}\n`);
        console.log(pageCheck.score.verdict, pageCheck.score.flags.join(",") || "ok");
      }
      await context.close();
    }
  } finally {
    await browser.close();
  }
  const completedAt = new Date().toISOString();
  await writeReport(turns, pages, { baseUrl, outDir, startedAt, completedAt });
  const turnCounts = counts(turns);
  const pageCounts = counts(pages);
  console.log(`\nWrote ${outDir}`);
  console.log(`Turns pass/watch/fail: ${turnCounts.pass}/${turnCounts.watch}/${turnCounts.fail}`);
  console.log(`Pages pass/watch/fail: ${pageCounts.pass}/${pageCounts.watch}/${pageCounts.fail}`);
  if (turnCounts.fail > 0 || pageCounts.fail > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
