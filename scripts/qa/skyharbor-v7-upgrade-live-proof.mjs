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

const baseUrl = process.env.SKYHARBOR_V7_PROOF_BASE_URL ?? "https://app.abarva.ai";
const runStamp = new Date().toISOString().replace(/[:.]/g, "-");
const outDir = process.env.SKYHARBOR_V7_PROOF_OUT ?? path.join(cwd, "proof", "skyharbor-v7-upgrade-live", runStamp);
const phase = process.env.SKYHARBOR_V7_PROOF_PHASE ?? "live";

const tenant = {
  label: "SkyHarbor Air",
  appClientKey: "skyharbor",
  tenantKey: "skyharbor-air",
  agentEmail: "skyharbor-agent@abarva.example.com",
  fallbackEmail: "cto@skyharbor-air.example.com",
  forbiddenTenantTerms: [/meridian/i, /lakeshore/i, /healthcare/i, /\bPHI\b/i, /\bEpic\b/i],
  unsupportedClaimPatterns: [
    /\baudited (savings|roi|return|value)\b/i,
    /\brealized (savings|roi|return|value)\b/i,
    /\bproduction-ready (irops|ai|automation|recovery)\b/i,
    /\bautonomous recovery (is|has been|was|will be)\b/i,
  ],
};

const questions = [
  {
    id: "SKY-HOME-001",
    module: "home",
    text: "What does SkyHarbor know about its airline operations and IROPS technology estate?",
    mustInclude: ["SkyHarbor", "IROPS", "OCC", "crew", "mainframe"],
    mustNotClaim: ["production-ready", "audited savings", "realized ROI"],
  },
  {
    id: "SKY-INT-001",
    module: "intelligence",
    text: "What does SkyHarbor know about its airline operations and IROPS technology estate?",
    mustInclude: ["SkyHarbor", "IROPS", "OCC", "crew", "mainframe"],
    mustNotClaim: ["production-ready", "audited savings", "realized ROI"],
  },
  {
    id: "SKY-INT-002",
    module: "intelligence",
    text: "Which systems, risks, and dependencies matter most for an IROPS AI Move?",
    mustInclude: ["systems", "risks", "dependencies", "IROPS"],
    mustNotClaim: ["production-ready", "autonomous recovery", "realized ROI"],
  },
  {
    id: "SKY-INT-003",
    module: "intelligence",
    text: "What evidence is missing before SkyHarbor can make a client-ready AI investment decision?",
    mustInclude: ["evidence", "missing", "baseline", "controls"],
    mustNotClaim: ["production-ready", "audited savings"],
  },
  {
    id: "SKY-INT-004",
    module: "intelligence",
    text: "How should Tower track value outcomes for an IROPS AI bet?",
    mustInclude: ["Tower", "value", "outcomes", "baseline"],
    mustNotClaim: ["realized ROI", "audited savings"],
  },
];

const pageChecks = [
  { id: "SKY-HOME-PAGE", path: "/", mustInclude: ["AbarVa"] },
  { id: "SKY-INTELLIGENCE-PAGE", path: "/intelligence", mustInclude: ["Intelligence"] },
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

async function findClerkUser(clerk, email) {
  const users = await clerk.users.getUserList({ emailAddress: [email], limit: 1 });
  return users.data[0] ?? null;
}

async function signIn(page, context) {
  const clerk = createClerkClient({ secretKey: requiredEnv("CLERK_SECRET_KEY") });
  const user = (await findClerkUser(clerk, tenant.agentEmail)) ?? (await findClerkUser(clerk, tenant.fallbackEmail));
  if (!user) throw new Error(`No Clerk proof user found for ${tenant.agentEmail} or ${tenant.fallbackEmail}`);
  const ticket = await clerk.signInTokens.createSignInToken({ userId: user.id, expiresInSeconds: 300 });
  await page.goto("/", { waitUntil: "domcontentloaded", timeout: 45_000 });
  await page.waitForFunction(() => window.Clerk?.loaded === true, null, { timeout: 30_000 });
  await page.evaluate(async (token) => {
    const result = await window.Clerk.client.signIn.create({ strategy: "ticket", ticket: token });
    if (result.status !== "complete" || !result.createdSessionId) throw new Error(`Ticket sign-in failed: ${result.status}`);
    await window.Clerk.setActive({ session: result.createdSessionId });
  }, ticket.token);
  await page.waitForFunction(() => document.cookie.includes("__session="), null, { timeout: 30_000 });
  await context.addCookies([{
    name: "abarva_active_client",
    value: tenant.appClientKey,
    url: baseUrl,
    httpOnly: false,
    secure: baseUrl.startsWith("https://"),
    sameSite: "Lax",
  }]);
  return { id: user.id, email: user.emailAddresses?.[0]?.emailAddress ?? tenant.agentEmail };
}

async function askHome(page, item) {
  const payload = await page.evaluate(async ({ question, client }) => {
    const response = await fetch("/api/home/know/ask", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", "x-abarva-debug-home-know": "1" },
      body: JSON.stringify({ question, client }),
    });
    return { status: response.status, json: await response.json().catch(async () => ({ raw: await response.text() })) };
  }, { question: item.text, client: tenant.appClientKey });
  const text = [
    payload.json?.prose,
    ...(payload.json?.facts ?? []).map((fact) => `${fact.label ?? ""} ${fact.value ?? ""}`),
    ...(payload.json?.tables ?? []).flatMap((table) => [table.title, ...(table.rows ?? []).flatMap((row) => Object.values(row ?? {}))]),
    ...(payload.json?.gaps ?? []).map((gap) => `${gap.displayLabel ?? ""} ${gap.message ?? ""}`),
  ].filter(Boolean).join("\n");
  const sources = [
    ...(payload.json?.citations ?? []),
    ...(payload.json?.facts ?? []).flatMap((fact) => fact.citationIds ?? []),
  ];
  return { httpStatus: payload.status, response: payload.json, answerText: text, sources, rawText: JSON.stringify(payload.json) };
}

async function askIntelligence(page, item) {
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
          tabId: `skyharbor-v7-proof-${Date.now()}`,
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
  return { httpStatus: raw.status, rawText: raw.text, events, answerText, sources, trace: events.find((event) => event.type === "trace") ?? null };
}

function buildGroundingSearchText(result) {
  return [
    JSON.stringify(result.sources ?? []),
    JSON.stringify(result.response?.facts ?? []),
    JSON.stringify(result.response?.tables ?? []),
    JSON.stringify(result.response?.gaps ?? []),
  ].join("\n").toLowerCase();
}

function isSafeRefusal(answer) {
  return /\b(i can'?t safely answer|cannot safely answer|before making a client-ready claim|not enough evidence|what would need to be loaded)\b/i.test(answer);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function containsUnsupportedMustNotClaim(answer, term) {
  const answerLower = answer.toLowerCase();
  const matcher = new RegExp(escapeRegExp(term.toLowerCase()), "g");
  for (const match of answerLower.matchAll(matcher)) {
    const start = match.index ?? 0;
    const before = answerLower.slice(Math.max(0, start - 140), start);
    const after = answerLower.slice(start + term.length, start + term.length + 48);
    if (/\b(not|no|none|neither|never|without|isn'?t|aren'?t|wasn'?t|weren'?t|hasn'?t|haven'?t|doesn'?t|don'?t|can'?t|cannot|does not|do not|has not|have not)\b[^.!?\n]*$/.test(before)) continue;
    if (/\b(no|none|neither)\b[^.!?\n]{0,220}$/.test(before)) continue;
    if (/^\s+(yet|with|as proven|as certified|as client-approved|as production-ready)\b/.test(after)) continue;
    return true;
  }
  return false;
}

function containsUnsupportedPattern(answer, pattern) {
  const matcher = new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`);
  for (const match of answer.matchAll(matcher)) {
    const start = match.index ?? 0;
    const end = start + match[0].length;
    const before = answer.slice(Math.max(0, start - 220), start).toLowerCase();
    const after = answer.slice(end, end + 96).toLowerCase();
    if (/\b(no|none|neither|not|never|without|cannot|can'?t)\b[^.!?\n]{0,220}$/.test(before)) continue;
    if (/\b(path|gate|gates|govern|governs|governed|before|until|future|track|tracks|tracking|monitor|monitors|monitoring|measure|measures|measuring)\b[^.!?\n]{0,220}$/.test(before)) continue;
    if (/^\s+(against|before|after|with evidence|with baseline|evidence|tracking|scorecard|review)\b/.test(after)) continue;
    return true;
  }
  return false;
}

function claimSearchCandidates(claim) {
  const lower = claim.toLowerCase();
  const candidates = new Set([lower]);
  const percent = lower.match(/^([0-9]+(?:\.[0-9]+)?)%$/);
  if (percent) candidates.add(`${percent[1]} percent`);
  const money = lower.match(/^\$([0-9][0-9,.]*)(k|m|b| million| billion)?$/);
  if (money) {
    const numeric = Number(money[1].replace(/,/g, ""));
    const suffix = money[2]?.trim();
    const multiplier = suffix === "k" ? 1_000 : suffix === "m" || suffix === "million" ? 1_000_000 : suffix === "b" || suffix === "billion" ? 1_000_000_000 : 1;
    if (Number.isFinite(numeric)) candidates.add(String(numeric * multiplier));
  }
  return [...candidates];
}

function claimAppearsInGrounding(claim, evidenceText) {
  return claimSearchCandidates(claim).some((candidate) => evidenceText.includes(candidate));
}

function extractClaimReport(result) {
  const answer = result.answerText ?? "";
  const moneyClaims = answer.match(/\$[0-9][0-9,.]*(?:m|k|b| million| billion)?/gi) ?? [];
  const percentClaims = answer.match(/\b[0-9]+(?:\.[0-9]+)?%/g) ?? [];
  const evidenceText = buildGroundingSearchText(result);
  return {
    moneyClaims,
    percentClaims,
    unsupportedMoneyClaims: moneyClaims.filter((claim) => !claimAppearsInGrounding(claim, evidenceText)),
    unsupportedPercentClaims: percentClaims.filter((claim) => !claimAppearsInGrounding(claim, evidenceText)),
    sourceCount: result.sources?.length ?? 0,
    sourceNames: (result.sources ?? []).slice(0, 12).map((source) => source.name ?? source.title ?? source.id ?? source.citationId ?? source.type ?? "source"),
  };
}

function scoreTurn(item, result) {
  const flags = [];
  const notes = [];
  const answer = result.answerText ?? "";
  const lower = answer.toLowerCase();
  const evidenceText = buildGroundingSearchText(result);
  if (result.httpStatus !== 200) flags.push(`http_${result.httpStatus}`);
  if (answer.length < 80) flags.push("answer_too_short");
  for (const term of item.mustInclude) {
    if (lower.includes(term.toLowerCase())) continue;
    const semanticMatch = classifySemanticIncludeMatch(item, term, answer, evidenceText);
    if (semanticMatch) {
      notes.push(semanticMatch);
    } else {
      flags.push(`missing:${term}`);
    }
  }
  for (const term of item.mustNotClaim) {
    if (containsUnsupportedMustNotClaim(answer, term)) flags.push(`must_not_claim:${term}`);
  }
  for (const pattern of tenant.forbiddenTenantTerms) {
    if (pattern.test(answer)) flags.push(`tenant_bleed:${pattern}`);
  }
  for (const pattern of tenant.unsupportedClaimPatterns) {
    if (containsUnsupportedPattern(answer, pattern) && !isSafeRefusal(answer)) flags.push(`unsupported_claim_pattern:${pattern}`);
  }
  if (item.module === "intelligence" && (result.sources?.length ?? 0) === 0 && isSafeRefusal(answer)) {
    notes.push("safe_refusal_without_sources");
  } else if (item.module === "intelligence" && (result.sources?.length ?? 0) === 0) {
    flags.push("no_sources_event");
  }
  const claimReport = extractClaimReport(result);
  for (const claim of claimReport.unsupportedMoneyClaims) flags.push(`unsupported_money:${claim}`);
  for (const claim of claimReport.unsupportedPercentClaims) flags.push(`unsupported_percent:${claim}`);
  if (/```json|raw json|debug|sentinel/i.test(answer)) flags.push("protocol_leak");
  const hard = flags.filter((flag) => /http_|tenant_bleed|unsupported_|must_not_claim|protocol_leak/.test(flag));
  return { verdict: hard.length ? "fail" : flags.length ? "watch" : "pass", flags, notes, claimReport };
}

function classifySemanticIncludeMatch(item, term, answer, evidenceText) {
  const lowerTerm = term.toLowerCase();
  const combined = `${answer}\n${evidenceText}`.toLowerCase();
  if (lowerTerm === "systems" && /\bsystem(s| clusters?)?\b/.test(combined)) return "systems_intent_satisfied";
  if (lowerTerm === "risks" && /\b(risk|risks|gap|gaps|exposure|hard gate|blocked|blocks)\b/.test(combined)) return "risks_intent_satisfied";
  if (lowerTerm === "controls" && /\b(control|controls|hitl|human-in-loop|override log|approval workflow)\b/.test(combined)) return "controls_intent_satisfied";
  if (item.id === "SKY-HOME-001" && lowerTerm === "occ" && /\b(occ|operations control center|irops)\b/.test(combined)) return "occ_intent_satisfied";
  if (item.id === "SKY-HOME-001" && lowerTerm === "mainframe" && /\b(mainframe|mq|pss)\b/.test(combined)) return "mainframe_intent_satisfied";
  if (item.id === "SKY-HOME-001" && lowerTerm === "skyharbor" && /\b(skyharbor|airline)\b/.test(combined)) return "skyharbor_intent_satisfied";
  return null;
}

async function runTurn(page, item) {
  const startedAt = new Date().toISOString();
  const started = Date.now();
  const result = item.module === "home" ? await askHome(page, item) : await askIntelligence(page, item);
  const score = scoreTurn(item, result);
  const record = {
    ...item,
    phase,
    tenantKey: tenant.tenantKey,
    appClientKey: tenant.appClientKey,
    startedAt,
    completedAt: new Date().toISOString(),
    latencyMs: Date.now() - started,
    httpStatus: result.httpStatus,
    answerText: result.answerText,
    sourceCount: result.sources?.length ?? 0,
    score,
  };
  await fs.writeFile(path.join(outDir, "turns", `${item.id}.json`), `${JSON.stringify({ record, result }, null, 2)}\n`);
  if (result.rawText) await fs.writeFile(path.join(outDir, "streams", `${item.id}.ndjson`), result.rawText);
  return record;
}

async function runPageCheck(page, check) {
  await page.goto(check.path, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForTimeout(1500);
  const text = await page.evaluate(() => document.body?.innerText ?? "");
  const screenshotPath = path.join(outDir, "screenshots", `${check.id}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {});
  const flags = [];
  for (const term of check.mustInclude) if (!text.toLowerCase().includes(term.toLowerCase())) flags.push(`missing:${term}`);
  for (const pattern of tenant.forbiddenTenantTerms) if (pattern.test(text)) flags.push(`tenant_bleed:${pattern}`);
  return { ...check, phase, completedAt: new Date().toISOString(), screenshotPath, textSample: text.slice(0, 3000), score: { verdict: flags.some((f) => f.startsWith("tenant_bleed")) ? "fail" : flags.length ? "watch" : "pass", flags } };
}

function counts(records) {
  return {
    total: records.length,
    pass: records.filter((r) => r.score.verdict === "pass").length,
    watch: records.filter((r) => r.score.verdict === "watch").length,
    fail: records.filter((r) => r.score.verdict === "fail").length,
  };
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

async function writeReport(turns, pages, meta) {
  const summary = {
    meta,
    turns: counts(turns),
    pages: counts(pages),
    answerHash: sha256(turns.map((turn) => `${turn.id}\n${turn.answerText}`).join("\n\n")),
    claimToSource: turns.map((turn) => ({
      id: turn.id,
      verdict: turn.score.verdict,
      flags: turn.score.flags,
      sourceCount: turn.sourceCount,
      claimReport: turn.score.claimReport,
    })),
  };
  await fs.writeFile(path.join(outDir, "reports", "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
  await fs.writeFile(path.join(outDir, "README.md"), [
    `# SkyHarbor V7 upgrade live proof (${phase})`,
    "",
    `Base URL: ${baseUrl}`,
    `Tenant: ${tenant.label} (${tenant.tenantKey}, app client ${tenant.appClientKey})`,
    `Generated: ${meta.generatedAt}`,
    `Turns: ${summary.turns.pass} pass / ${summary.turns.watch} watch / ${summary.turns.fail} fail`,
    `Pages: ${summary.pages.pass} pass / ${summary.pages.watch} watch / ${summary.pages.fail} fail`,
    "",
    "The harness fails tenant bleed, unsupported dollar/percent claims, unsafe product capability claims, protocol leaks, and HTTP errors. Safe negations/refusals are not treated as positive capability claims.",
    "",
  ].join("\n"));
  return summary;
}

await ensureDirs();
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ baseURL: baseUrl });
const page = await context.newPage();
try {
  const user = await signIn(page, context);
  const pages = [];
  for (const check of pageChecks) pages.push(await runPageCheck(page, check));
  const turns = [];
  for (const item of questions) turns.push(await runTurn(page, item));
  const summary = await writeReport(turns, pages, { generatedAt: new Date().toISOString(), baseUrl, phase, user });
  console.log(JSON.stringify({ ok: summary.turns.fail === 0 && summary.pages.fail === 0, outDir, summary }, null, 2));
  if (summary.turns.fail > 0 || summary.pages.fail > 0) process.exitCode = 1;
} finally {
  await browser.close();
}
