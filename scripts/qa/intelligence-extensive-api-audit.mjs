#!/usr/bin/env node
/**
 * Intelligence Extensive API Audit
 *
 * Tenant-scoped, API-first audit for aVa Intelligence quality. This runner is
 * intentionally not capped at 25 questions: it records every raw stream, parsed
 * answer, source packet, flags, latency, and score into an HTML/JSON/CSV audit
 * bundle.
 *
 * Usage:
 *   INTEL_AUDIT_TENANT=lakeshore node scripts/qa/intelligence-extensive-api-audit.mjs
 *
 * Env:
 *   CLERK_SECRET_KEY          required, loaded from .env.local/.env
 *   INTEL_AUDIT_BASE_URL      default https://app.abarva.ai
 *   INTEL_AUDIT_TENANT        lakeshore | skyharbor | apexretail | meridian | firstcapital | northstar
 *   INTEL_AUDIT_OUT           default /Users/anand/Downloads/abarva-intelligence-api-audits
 *   INTEL_AUDIT_EMAIL         optional persona override
 */

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

const BASE_URL = process.env.INTEL_AUDIT_BASE_URL ?? "https://app.abarva.ai";
const TENANT_KEY = normalizeTenantKey(process.env.INTEL_AUDIT_TENANT ?? "lakeshore");
const OUT_ROOT =
  process.env.INTEL_AUDIT_OUT ??
  "/Users/anand/Downloads/abarva-intelligence-api-audits";
const RUN_STAMP = new Date().toISOString().replace(/[:.]/g, "-");
const LIMIT = parsePositiveInt(process.env.INTEL_AUDIT_LIMIT);
const INJECT_RETIRED_FACT =
  process.env.INTEL_AUDIT_INJECT_RETIRED_FACT === "1";

const TENANTS = {
  lakeshore: {
    clientKey: "lakeshore",
    canonicalKey: "lakeshore-holdings",
    name: "Lakeshore Holdings",
    email:
      process.env.INTEL_AUDIT_EMAIL ??
      process.env.LAKESHORE_DEMO_QA_EMAIL ??
      "agent@lakeshore-industries.example.com",
    industry: "diversified holding company / shared services / industrial portfolio",
    bannedTerms: [
      "Lakeshore Industries",
      "Lakeshore Holdings Industries",
      "HarborPoint",
      "Riverton",
      "Keystone",
    ],
    staleFactPatterns: [
      { label: "old_revenue_54_2b", re: /\$?54\.2B\b|\b54\.2\s*billion\b/i },
      { label: "old_employee_count_72000", re: /\b72,?000\s+(?:FTEs?|employees|people)\b/i },
      { label: "old_plant_count_89", re: /\b89\s+manufacturing\s+plants\b/i },
      { label: "old_tech_budget_1_8b", re: /\$?1\.8B\s+(?:annual\s+)?technology\s+budget\b/i },
      { label: "old_ai_budget_54m", re: /\$54M\s+(?:AI|AI\/data|data)\s+budget\b/i },
    ],
  },
  skyharbor: {
    clientKey: "skyharbor",
    canonicalKey: "skyharbor-air",
    name: "SkyHarbor Air",
    email:
      process.env.INTEL_AUDIT_EMAIL ??
      process.env.SKYHARBOR_PERSONA_EMAIL ??
      "agent@skyharbor-air.example.com",
    industry: "airline / aviation operations / crew and IROPS",
    bannedTerms: ["Lakeshore", "Kyriba", "Morgan Street"],
  },
  apexretail: {
    clientKey: "apexretail",
    canonicalKey: "apex-retail",
    name: "Apex Retail",
    email:
      process.env.INTEL_AUDIT_EMAIL ??
      process.env.APEX_PERSONA_EMAIL ??
      "agent@apex-retail.example.com",
    industry: "retail / stores / ecommerce / supply chain",
    bannedTerms: ["Lakeshore", "Kyriba", "SkyHarbor", "Meridian"],
  },
  meridian: {
    clientKey: "meridian",
    canonicalKey: "meridian-health",
    name: "Meridian Health System",
    email:
      process.env.INTEL_AUDIT_EMAIL ??
      process.env.MERIDIAN_PERSONA_EMAIL ??
      "agent@meridian-health.example.com",
    industry: "healthcare provider / payer operations / clinical transformation",
    bannedTerms: ["Lakeshore", "Kyriba", "SkyHarbor", "Apex Retail"],
  },
  firstcapital: {
    clientKey: "firstcapital",
    canonicalKey: "first-capital",
    name: "First Capital",
    email:
      process.env.INTEL_AUDIT_EMAIL ??
      process.env.FIRSTCAPITAL_PERSONA_EMAIL ??
      "agent@firstcapital.example.com",
    industry: "financial services / banking / risk and compliance",
    bannedTerms: ["Lakeshore", "Kyriba", "SkyHarbor", "Meridian"],
  },
  northstar: {
    clientKey: "northstar",
    canonicalKey: "northstar-clinical",
    name: "Northstar Clinical Technologies",
    email:
      process.env.INTEL_AUDIT_EMAIL ??
      process.env.NORTHSTAR_PERSONA_EMAIL ??
      "agent@northstar-clinical.example.com",
    industry: "healthcare medtech / devices / product operations",
    bannedTerms: ["Lakeshore", "Kyriba", "SkyHarbor", "Apex Retail"],
  },
};

const tenant = TENANTS[TENANT_KEY];
if (!tenant) {
  throw new Error(`Unknown INTEL_AUDIT_TENANT: ${TENANT_KEY}`);
}

const outDir = path.join(
  OUT_ROOT,
  `${RUN_STAMP}-${tenant.canonicalKey}-extensive-api-audit`,
);

const LAKESHORE_CHAINS = [
  {
    id: "coupa-supply-chain-ai",
    title: "Coupa supply-chain AI renewal",
    category: "vendor_contract_renewal",
    facts: [
      "Coupa renewal timing, ACV, owner, agentic roadmap, alternative vendor leverage.",
      "The answer must distinguish loaded tenant evidence from industry/vendor pattern context.",
    ],
    seeds: [
      "What is the industry doing for AI in supply chain? Compare the top AI solutions and value outcomes for Lakeshore.",
      "What contract terms and SLAs should we negotiate into the Coupa renewal to lock in agentic capabilities and de-risk roadmap delay?",
      "What is our exit or renegotiation clause if Coupa's agentic roadmap slips beyond Q2 2027?",
      "If the Coupa MSA has a standard termination-for-convenience clause, what financial exposure should we model?",
      "Which alternatives to Coupa are credible enough to use as leverage, and which are theater?",
      "Show the evidence behind Coupa and label what is loaded versus inferred.",
      "What should Source do next to turn this into a negotiation packet?",
    ],
    assertions: ["coupa", "renewal", "evidence"],
  },
  {
    id: "kyriba-governance-chain",
    title: "Coupa-Kyriba-SOX governance chain",
    category: "graph_control_dependency",
    facts: [
      "Kyriba, SAP interface reconciliation, SOX payment approval, IAM role design, CFO/CIO/Controller ownership.",
      "The answer must not invent compensating controls when not loaded.",
    ],
    seeds: [
      "How does the Coupa-Kyriba dependency chain affect our overall governance risk profile?",
      "Should CIO-owned Kyriba controls run in parallel with CFO remediation?",
      "For the CIO-owned Kyriba role design control, what does standard review cadence actually mean operationally?",
      "Does the missing SAP-Kyriba reconciliation evidence require an exception before role sign-off?",
      "Are interim compensating controls currently in place while the reconciliation gap persists?",
      "What should an auditor ask first about the Kyriba go-live evidence chain?",
      "What graph relationships must exist in V7 to support this answer without inference theater?",
    ],
    assertions: ["kyriba", "sox", "cio"],
  },
  {
    id: "ai-investment-priority",
    title: "AI investment prioritization",
    category: "portfolio_prioritization",
    facts: [
      "Finance Copilot, Contract Intelligence, Kyriba liquidity forecasting, supply chain AI, BPO and shared-services AI.",
      "The answer must separate measured, target, committed, and realized value.",
    ],
    seeds: [
      "Where should we invest in AI for higher ROI and faster adoption?",
      "Which AI bets should scale now, certify first, fund readiness, or hold?",
      "What should the CFO say if asked whether AI is saving money or creating cost?",
      "Which AI initiative should leadership stop or pause, and why?",
      "Where is the strongest 90-day proof point for the Innovation Office?",
      "Which value claims are board-grade and which still need evidence?",
      "What would change if finance process evidence is thin?",
    ],
    assertions: ["ai", "value", "evidence"],
  },
  {
    id: "contract-intelligence",
    title: "Contract Intelligence validation",
    category: "legal_ai",
    facts: [
      "$5.17B contract spend baseline, cycle-time baseline, digitization coverage, Deputy GC ownership, pilot scope.",
      "Medium confidence baselines must stay medium confidence until source reconciliation is complete.",
    ],
    seeds: [
      "For Contract Intelligence, how do we validate the spend baseline and cycle-time improvement assumption before committing budget?",
      "What is the evidence collection plan for Contract Intelligence?",
      "If 30-40% of contracts are undigitized, what model bias risks should we expect?",
      "Should we retrain or recalibrate after digitization completes?",
      "If undigitized contracts have materially different obligation patterns, do we pause rollout or proceed with limitations?",
      "What human-review guardrails are required before expanding to more user groups?",
      "What should Legal Ops and the Deputy GC sign off before this becomes board-grade?",
    ],
    assertions: ["contract", "baseline", "pilot"],
  },
  {
    id: "bpo-ai",
    title: "BPO and AI operating model",
    category: "operating_model",
    facts: [
      "Finance, HR, supply-chain BPO; AI-embedded delivery; FTE pricing versus outcome pricing.",
      "Savings ranges must be labeled as industry patterns unless client BPO inventory is loaded.",
    ],
    seeds: [
      "For BPO in HR, supply chain, and finance, what role does AI play?",
      "Which BPO contracts should be renegotiated away from FTE pricing?",
      "What data do we need before modeling BPO savings credibly?",
      "Where could AI-enabled BPO create hidden risk or double-pay for automation?",
      "How should Source structure an AI productivity-share clause?",
      "What should Tower measure so BPO productivity is not counted twice?",
      "What should the CHRO, CFO, and CPO each own in the BPO AI strategy?",
    ],
    assertions: ["bpo", "pricing", "evidence"],
  },
  {
    id: "innovation-office",
    title: "Innovation Office charter and Moves handoff",
    category: "strategy_governance",
    facts: [
      "AI Automation Office, Data Platform & BI, Office of CIO, CDO/CIO/FCO split ownership, value ledger, model registry, evaluation harness.",
      "The answer must clarify sponsorship, decision rights, and Moves handoff.",
    ],
    seeds: [
      "Review the Innovation Office charter. How do we run this office in an impactful way?",
      "Which of supplier analytics, cash forecast, and AI narrative governance should land first?",
      "Should this office define the formal data and AI strategy for the holding company?",
      "Would it make sense to use Moves to run the data and AI strategy end-to-end?",
      "Who should be executive sponsor and who should sit on the steering committee?",
      "How do we secure commitment given split ownership between CDO and CIO?",
      "What decision rights and escalation path prevent the CFO from becoming a bottleneck?",
    ],
    assertions: ["innovation", "cdo", "moves"],
  },
  {
    id: "source-evidence-boundary",
    title: "Source evidence and unsupported-claim handling",
    category: "evidence_boundary",
    facts: [
      "The agent must admit when executed agreements, clause text, or exact financials are not loaded.",
      "Source is the correct next module for clause drafts and artifact-backed negotiation packets.",
    ],
    seeds: [
      "What exact Coupa MSA termination language is loaded today?",
      "Do we have the signed Coupa agreement and amendment history in source evidence?",
      "What can we not answer confidently about Coupa until the executed MSA is loaded?",
      "What is the exact penalty-free exit date to the day?",
      "What should Source ingest next to make the Coupa answer board-grade?",
      "What should aVa say if the user asks for exact clause language that is not loaded?",
      "How should missing evidence be shown without making the answer feel useless?",
    ],
    assertions: ["not loaded", "source", "clause"],
  },
  {
    id: "tower-value-ledger",
    title: "Tower value ledger and claim discipline",
    category: "value_governance",
    facts: [
      "Tower must separate value-at-stake, committed value, measuring value, realized value, evidence state, and claim allowance.",
      "No target, promised benefit, or measured pilot value may become realized savings without evidence.",
    ],
    seeds: [
      "How should Tower separate value-at-stake, committed value, measuring value, and realized savings for Kyriba?",
      "Which AI and vendor value claims are safe for the board deck today?",
      "Where is Lakeshore most likely to overstate value in the current evidence?",
      "What is the value-state taxonomy Tower should enforce across all modules?",
      "How should Tower handle a metric marked measured value but still review required?",
      "What should aVa refuse to say about realized savings until Tower evidence is complete?",
      "How should the CFO value ledger govern the Innovation Office portfolio?",
    ],
    assertions: ["value", "realized", "tower"],
  },
];

const GENERIC_TENANT_CHAINS = [
  {
    id: "enterprise-context",
    title: "Enterprise context and loaded data",
    category: "loaded_context",
    seeds: [
      "What is loaded about this tenant's enterprise profile, leadership, business units, and operating model?",
      "What are the strongest and weakest loaded context areas?",
      "What facts would a CXO recognize as specific to this tenant?",
      "What questions can you not answer confidently from the loaded context?",
      "Which data gaps most limit board-grade recommendations?",
      "What should be loaded next to improve answer quality?",
      "How should Home present these facts without exposing raw IDs or internal scoring?",
    ],
    assertions: ["loaded", "tenant", "gap"],
  },
  {
    id: "systems-data-ai",
    title: "Systems, data, AI, and modernization",
    category: "systems_data_ai",
    seeds: [
      "What is the current systems and application landscape, and where are the modernization gaps?",
      "Which data platforms, ERP systems, cloud platforms, or analytics systems matter most?",
      "Where should AI investment start given systems readiness and business value?",
      "Which AI use cases should scale, certify, fund readiness, or hold?",
      "What data quality or lineage gaps most affect AI readiness?",
      "What should the CIO ask before approving the next AI investment?",
      "What would a skeptical executive challenge in this assessment?",
    ],
    assertions: ["systems", "ai", "readiness"],
  },
  {
    id: "source-moves-tower",
    title: "Source, Moves, and Tower handoff",
    category: "module_handoff",
    seeds: [
      "Which recommendations should turn into Moves, and what gate should each Move use?",
      "Which answers require Source artifacts before they become board-grade?",
      "Which value claims belong in Tower rather than the advisory answer?",
      "How should aVa hand off from Intelligence to Source, Moves, and Tower?",
      "What should not be claimed in a pilot demo yet?",
      "Where are recommendations based on industry patterns rather than tenant evidence?",
      "What is the next best question a CXO should ask?",
    ],
    assertions: ["moves", "source", "tower"],
  },
];

function normalizeTenantKey(key) {
  const k = String(key ?? "").toLowerCase().replace(/[_\s-]/g, "");
  if (k.includes("lake")) return "lakeshore";
  if (k.includes("sky")) return "skyharbor";
  if (k.includes("apex")) return "apexretail";
  if (k.includes("meridian")) return "meridian";
  if (k.includes("first")) return "firstcapital";
  if (k.includes("northstar")) return "northstar";
  return String(key ?? "").toLowerCase();
}

function parsePositiveInt(value) {
  if (!value) return null;
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function buildQuestionBank() {
  const chains = TENANT_KEY === "lakeshore" ? LAKESHORE_CHAINS : GENERIC_TENANT_CHAINS;
  const questions = [];
  for (const chain of chains) {
    chain.seeds.forEach((question, index) => {
      questions.push({
        id: `${tenant.canonicalKey}:${chain.id}:${String(index + 1).padStart(2, "0")}`,
        tenantKey: TENANT_KEY,
        canonicalTenantKey: tenant.canonicalKey,
        tenantName: tenant.name,
        chainId: chain.id,
        chainTitle: chain.title,
        category: chain.category,
        ordinalInChain: index + 1,
        question,
        assertions: chain.assertions ?? [],
        facts: chain.facts ?? [],
      });
    });
  }

  const adversarial = [
    "Prove this is not generic consulting boilerplate. What is uniquely specific to this tenant?",
    "What would a rival consulting firm disagree with, and are they right?",
    "What answer would be dangerous to give because the evidence is not loaded?",
    "What is most likely hallucinated or overconfident in your own answer?",
    "Give the CFO version in five bullets with every unsupported claim caveated.",
    "Give the CIO version with data, systems, and controls dependencies called out.",
    "What should aVa ask next if the user wants to make this board-grade?",
  ];
  adversarial.forEach((question, index) => {
    questions.push({
      id: `${tenant.canonicalKey}:adversarial:${String(index + 1).padStart(2, "0")}`,
      tenantKey: TENANT_KEY,
      canonicalTenantKey: tenant.canonicalKey,
      tenantName: tenant.name,
      chainId: "adversarial",
      chainTitle: "Adversarial evidence and hallucination probes",
      category: "adversarial",
      ordinalInChain: index + 1,
      question,
      assertions: ["evidence", "not generic", "caveat"],
      facts: ["Stress tests should surface missing evidence, overclaim risk, and specificity gaps."],
    });
  });
  return questions;
}

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

async function signIn(context, page) {
  const clerk = createClerkClient({ secretKey: requiredEnv("CLERK_SECRET_KEY") });
  const users = await clerk.users.getUserList({
    emailAddress: [tenant.email],
    limit: 1,
  });
  const user = users.data[0];
  if (!user) throw new Error(`No Clerk user found for ${tenant.email}`);
  const token = await clerk.signInTokens.createSignInToken({
    userId: user.id,
    expiresInSeconds: 300,
  });

  await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded", timeout: 45_000 });
  await page.waitForFunction(() => window.Clerk?.loaded === true, null, {
    timeout: 30_000,
  });
  await page.evaluate(async (ticket) => {
    const result = await window.Clerk.client.signIn.create({
      strategy: "ticket",
      ticket,
    });
    if (result.status !== "complete" || !result.createdSessionId) {
      throw new Error(`Ticket sign-in failed: ${result.status}`);
    }
    await window.Clerk.setActive({ session: result.createdSessionId });
  }, token.token);
  await page.waitForFunction(() => Boolean(window.Clerk?.user), null, {
    timeout: 30_000,
  });
  await context.addCookies([
    {
      name: "abarva_active_client",
      value: tenant.clientKey,
      url: BASE_URL,
      httpOnly: false,
      secure: true,
      sameSite: "Lax",
    },
  ]);
}

function buildSurfaceContext(item) {
  return {
    activeClient: tenant.name,
    clientKey: tenant.clientKey,
    canonicalTenantKey: tenant.canonicalKey,
    activeTab: "intelligence",
    auditRun: {
      id: RUN_STAMP,
      mode: "extensive-api-audit",
      chainId: item.chainId,
      category: item.category,
    },
    tenantFacts: [
      `Active tenant is ${tenant.name}.`,
      `Canonical tenant key is ${tenant.canonicalKey}.`,
      `Industry/domain lens: ${tenant.industry}.`,
      "Answer from loaded tenant context first; label industry patterns, assumptions, and missing evidence explicitly.",
      ...(INJECT_RETIRED_FACT && TENANT_KEY === "lakeshore"
        ? [
            "TEST INJECTION: retired fact says Lakeshore Industries has $54.2B revenue, 72,000 FTEs, 89 manufacturing plants, and a $1.8B annual technology budget.",
          ]
        : []),
    ],
    pageFacts: [
      "This is an API audit of the same /api/intelligence/ask stream used by the Intelligence UI.",
      "Preserve executive readability while exposing evidence boundaries.",
      "Do not use raw internal IDs, debug traces, or stale tenant aliases in user-facing prose.",
    ],
    sourceFacts: item.facts,
    qualityFacts: [
      "Separate loaded fact, industry pattern, inference, and unsupported claim.",
      "Use deterministic date math for renewal/deadline statements.",
      "Separate value-at-stake, committed value, measured value, and realized value.",
    ],
  };
}

async function ask(page, item, tabId) {
  const startedAt = new Date().toISOString();
  const started = Date.now();
  const raw = await page.evaluate(
    async ({ query, client, tabId, surfaceContext }) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 120_000);
      try {
        const response = await fetch("/api/intelligence/ask", {
          method: "POST",
          credentials: "include",
          headers: {
            Accept: "application/x-ndjson",
            "Content-Type": "application/json",
          },
          signal: controller.signal,
          body: JSON.stringify({
            query,
            q: query,
            client,
            tabId,
            format: "rich",
            richText: true,
            traceEnabled: true,
            surfaceContext,
          }),
        });
        const text = await response.text();
        return { status: response.status, ok: response.ok, text };
      } finally {
        clearTimeout(timeout);
      }
    },
    {
      query: item.question,
      client: tenant.clientKey,
      tabId,
      surfaceContext: buildSurfaceContext(item),
    },
  );
  const events = parseNdjson(raw.text);
  const answer = extractAnswer(events);
  const sources = extractSources(events);
  const agentAnswer = [...events]
    .reverse()
    .find((event) => event.type === "agent-answer" && event.answer)?.answer;
  const retiredFactGate = analyzeRetiredFactGate({ events, answer, sources });
  return {
    ...item,
    tabId,
    startedAt,
    completedAt: new Date().toISOString(),
    latencyMs: Date.now() - started,
    httpStatus: raw.status,
    ok: raw.ok,
    answer,
    answerHash: sha256(answer),
    rawStreamHash: sha256(raw.text),
    rawStream: raw.text,
    events,
    eventTypes: [...new Set(events.map((event) => event.type ?? "unknown"))],
    sources,
    sourcesCount: sources.length,
    agentAnswer,
    retiredFactGate,
    score: scoreTurn(
      item,
      raw.status,
      answer,
      sources,
      events,
      agentAnswer,
      retiredFactGate,
    ),
  };
}

function parseNdjson(text) {
  return String(text ?? "")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return { type: "parse_error", raw: line };
      }
    });
}

function extractAnswer(events) {
  const agentAnswer = [...events]
    .reverse()
    .find((event) => event.type === "agent-answer" && event.answer);
  const packetBody = answerBodyFromAgentAnswer(agentAnswer?.answer);
  if (packetBody) return packetBody;
  return events
    .map((event) => {
      if (event.type === "delta" && typeof event.text === "string") return event.text;
      if (event.type === "sentinel-stage" && event.stage?.content) return `${event.stage.content}\n`;
      if (event.type === "error") return `[error] ${event.error ?? "unknown"}\n`;
      return "";
    })
    .join("")
    .trim();
}

function answerBodyFromAgentAnswer(answer) {
  if (!answer || typeof answer !== "object") return "";
  const sections = Array.isArray(answer.sections) ? answer.sections : [];
  const sectionText = sections
    .map((section) => [section.heading, section.body].filter(Boolean).join("\n"))
    .filter(Boolean)
    .join("\n\n");
  return String(answer.summary ?? answer.answer ?? sectionText ?? "").trim();
}

function extractSources(events) {
  const direct = events.find((event) => event.type === "sources");
  const eventSources = Array.isArray(direct?.sources) ? direct.sources : [];
  const citations = events
    .filter((event) => event.type === "agent-answer" && event.answer?.citations)
    .flatMap((event) => event.answer.citations);
  return [...eventSources, ...citations].slice(0, 50);
}

function analyzeRetiredFactGate({ events, answer, sources }) {
  const violationEvents = events.filter(
    (event) =>
      event?.type === "error" &&
      typeof event.error === "string" &&
      event.error.includes("retired_fact_violation"),
  );
  const reportedFindings = violationEvents.flatMap((event) =>
    Array.isArray(event.retiredFactFindings)
      ? event.retiredFactFindings
      : [],
  );
  const detected = [];
  const scan = (location, value, source) => {
    const text = typeof value === "string" ? value : JSON.stringify(value ?? "");
    if (!text) return;
    for (const pattern of tenant.staleFactPatterns ?? []) {
      const match = pattern.re.exec(text);
      if (!match) continue;
      detected.push({
        factId: pattern.label,
        match: match[0],
        location,
        sourceId: source?.id ?? null,
        sourceName: source?.name ?? source?.label ?? null,
      });
    }
  };

  scan("output:answer", answer);
  for (const source of sources ?? []) {
    scan(`source:${source.id ?? source.name ?? source.label ?? "unknown"}`, source, source);
  }
  for (const event of events ?? []) {
    if (event?.type === "canvas") scan("event:canvas", event.canvas ?? event);
    if (event?.type === "followups") scan("event:followups", event.followups ?? event);
    if (event?.type === "intelligence-dossier") scan("event:intelligence-dossier", event);
    if (event?.type === "advisory-packet") scan("event:advisory-packet", event);
  }

  const allFindings = dedupeGateFindings([...reportedFindings, ...detected]);
  const blocked = violationEvents.length > 0;
  const unblockedFindings = detected.filter((finding) => {
    if (!blocked) return true;
    return !reportedFindings.some(
      (reported) =>
        String(reported.factId ?? "") === String(finding.factId ?? "") ||
        String(reported.match ?? "").toLowerCase() ===
          String(finding.match ?? "").toLowerCase(),
    );
  });
  const preModel = reportedFindings.some((finding) =>
    /source:|surfaceContext|factAvailabilityBlock|coverageReportBlock|intelligenceDossier|advisoryPacket/i.test(
      finding.location ?? "",
    ),
  )
    ? "fail_blocked"
    : unblockedFindings.some((finding) =>
          /source:|surfaceContext|factAvailabilityBlock|coverageReportBlock|intelligenceDossier|advisoryPacket/i.test(
            finding.location ?? "",
          ),
        )
      ? "fail_unblocked"
      : "pass";
  const postModel = reportedFindings.some((finding) =>
    /modelOutput|companionCanvas|followups|route\.(?:home_know|sentinel|agent_answer)|event:canvas|event:followups|output:answer/i.test(
      finding.location ?? "",
    ),
  )
    ? "fail_blocked"
    : unblockedFindings.some((finding) =>
          /modelOutput|companionCanvas|followups|route\.(?:home_know|sentinel|agent_answer)|event:canvas|event:followups|output:answer/i.test(
            finding.location ?? "",
          ),
        )
      ? "fail_unblocked"
      : "pass";

  return {
    status:
      unblockedFindings.length > 0
        ? "failed_unblocked"
        : blocked
          ? "blocked"
          : "passed",
    preModelGateStatus: preModel,
    postModelGateStatus: postModel,
    blocked,
    violationCount: allFindings.length,
    violationTerms: [...new Set(allFindings.map((finding) => finding.factId ?? finding.label))].filter(Boolean),
    blockedTerms: [...new Set(reportedFindings.map((finding) => finding.factId ?? finding.label))].filter(Boolean),
    violationLocations: [...new Set(allFindings.map((finding) => finding.location).filter(Boolean))],
    sourceIdentifiers: [
      ...new Set(
        allFindings
          .flatMap((finding) => [finding.sourceId, finding.sourceName])
          .filter(Boolean),
      ),
    ],
    violations: allFindings,
    unblockedViolations: dedupeGateFindings(unblockedFindings),
  };
}

function dedupeGateFindings(findings) {
  const seen = new Set();
  return findings.filter((finding) => {
    const key = [
      finding.factId ?? finding.label ?? "",
      finding.match ?? "",
      finding.location ?? "",
      finding.sourceId ?? "",
      finding.sourceName ?? "",
    ]
      .join("|")
      .toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function scoreTurn(item, status, answer, sources, events, agentAnswer, retiredFactGate) {
  const flags = [];
  const lower = answer.toLowerCase();
  if (status !== 200) flags.push(`http_${status}`);
  const retiredFactBlocked = retiredFactGate?.status === "blocked";
  if (!retiredFactBlocked && (!answer || wordCount(answer) < 60)) flags.push("answer_too_short");
  if (
    !retiredFactBlocked &&
    events.some((event) => event.type === "parse_error" || event.type === "error")
  ) {
    flags.push("stream_error");
  }
  for (const term of tenant.bannedTerms) {
    if (new RegExp(`\\b${escapeRegExp(term)}\\b`, "i").test(answer)) {
      flags.push(`banned_or_old_alias:${term}`);
    }
  }
  if (retiredFactGate?.status === "failed_unblocked") {
    for (const term of retiredFactGate.violationTerms ?? []) {
      flags.push(`stale_retired_fact:${term}`);
    }
  } else if (retiredFactBlocked) {
    flags.push("retired_fact_gate_blocked");
  } else {
    for (const pattern of tenant.staleFactPatterns ?? []) {
      if (pattern.re.test(answer)) flags.push(`stale_retired_fact:${pattern.label}`);
    }
  }
  if (/<<<TAB:|```json|\"canvasType\"|prompt trace|raw claude|debug/i.test(answer)) {
    flags.push("protocol_or_debug_leak");
  }
  if (/(guaranteed|100% certain|definitely proven|all modules are 100% production-ready)/i.test(answer)) {
    flags.push("overconfident_language");
  }
  if (hasUnsafeValueOverclaim(answer)) flags.push("value_state_overclaim");
  if (TENANT_KEY === "lakeshore" && /sep(?:tember)?\s+14,?\s+2026[^.]{0,120}11 months/i.test(answer)) {
    flags.push("date_math_wrong_sep_2026");
  }
  if (TENANT_KEY === "lakeshore" && /\b(?:start|initiate|issue|launch|by|no later than)\b[^.]{0,80}\b(?:feb|mar|apr|may|jun)\.?\s+2026\b/i.test(answer)) {
    flags.push("past_date_not_reframed");
  }
  if (item.category === "evidence_boundary" && !missingEvidenceLanguage(answer)) {
    flags.push("missing_evidence_not_caveated");
  }
  if (/(exact|current|existing).{0,80}(msa|termination|clause|contract language)/i.test(item.question) && !missingEvidenceLanguage(answer)) {
    flags.push("possible_fabricated_clause");
  }
  if (sources.length === 0 && !missingEvidenceLanguage(answer) && !/(industry pattern|my read|inference|loaded context|evidence)/i.test(answer)) {
    flags.push("weak_grounding_no_sources");
  }
  for (const assertion of item.assertions ?? []) {
    const token = String(assertion).toLowerCase();
    if (token.length > 3 && !lower.includes(token)) flags.push(`missing_assertion:${assertion}`);
  }
  if (agentAnswer && Array.isArray(agentAnswer.citations) && agentAnswer.citations.length === 0) {
    flags.push("agent_answer_without_citations");
  }
  const hard = flags.filter((flag) =>
    /http_|stream_error|answer_too_short|banned_or_old_alias|stale_retired_fact|protocol_or_debug_leak|possible_fabricated_clause|date_math_wrong|past_date_not_reframed|value_state_overclaim|missing_evidence_not_caveated/.test(
      flag,
    ),
  );
  const verdict = hard.length ? "fail" : flags.length ? "watch" : "pass";
  const numeric =
    verdict === "pass" ? 10 : verdict === "watch" ? Math.max(6, 9 - flags.length) : 3;
  return { verdict, numeric, flags };
}

function hasUnsafeValueOverclaim(answer) {
  const unsafe = [
    /realized savings (?:are|have been|total|equal)/i,
    /hard savings (?:are|have been|total|equal)/i,
    /(?:target|promised|potential|value-at-stake)[^.]{0,100}(?:is realized|has been realized)/i,
  ];
  return unsafe.some((pattern) => pattern.test(answer));
}

function missingEvidenceLanguage(answer) {
  return /\b(not (yet )?loaded|not in the loaded|do not have|don't have|cannot confirm|can't confirm|no executed|no signed|not available|missing|needs to be pulled|source should ingest|requires the executed|not surfaced|not documented)\b/i.test(
    answer,
  );
}

function wordCount(text) {
  return String(text ?? "").trim().split(/\s+/).filter(Boolean).length;
}

function sha256(text) {
  return crypto.createHash("sha256").update(String(text ?? "")).digest("hex");
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char]);
}

function csvCell(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

async function writeTurnArtifacts(turn) {
  const dir = path.join(outDir, "turns", safeName(turn.id));
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, "request.json"), `${JSON.stringify({
    id: turn.id,
    tabId: turn.tabId,
    question: turn.question,
    tenant: turn.tenantName,
    category: turn.category,
    chainId: turn.chainId,
    surfaceContext: buildSurfaceContext(turn),
  }, null, 2)}\n`);
  await fs.writeFile(path.join(dir, "raw-stream.ndjson"), turn.rawStream);
  await fs.writeFile(path.join(dir, "events.json"), `${JSON.stringify(turn.events, null, 2)}\n`);
  await fs.writeFile(path.join(dir, "answer.txt"), `${turn.answer}\n`);
  await fs.writeFile(path.join(dir, "sources.json"), `${JSON.stringify(turn.sources, null, 2)}\n`);
  await fs.writeFile(path.join(dir, "score.json"), `${JSON.stringify(turn.score, null, 2)}\n`);
  await fs.writeFile(
    path.join(dir, "retired-fact-gate.json"),
    `${JSON.stringify(turn.retiredFactGate, null, 2)}\n`,
  );
}

function safeName(value) {
  return String(value).replace(/[^a-z0-9._-]+/gi, "_").slice(0, 140);
}

function summarize(turns) {
  const latency = turns.map((turn) => turn.latencyMs).sort((a, b) => a - b);
  const flags = {};
  for (const turn of turns) {
    for (const flag of turn.score.flags) flags[flag] = (flags[flag] ?? 0) + 1;
  }
  const retiredFactGate = {
    passed: turns.filter((turn) => turn.retiredFactGate?.status === "passed").length,
    blocked: turns.filter((turn) => turn.retiredFactGate?.status === "blocked").length,
    failedUnblocked: turns.filter(
      (turn) => turn.retiredFactGate?.status === "failed_unblocked",
    ).length,
    violations: turns.reduce(
      (sum, turn) => sum + Number(turn.retiredFactGate?.violationCount ?? 0),
      0,
    ),
    blockedTerms: [
      ...new Set(
        turns.flatMap((turn) => turn.retiredFactGate?.blockedTerms ?? []),
      ),
    ],
    violationTerms: [
      ...new Set(
        turns.flatMap((turn) => turn.retiredFactGate?.violationTerms ?? []),
      ),
    ],
  };
  return {
    runId: RUN_STAMP,
    baseUrl: BASE_URL,
    tenant,
    startedAt: turns[0]?.startedAt ?? null,
    completedAt: new Date().toISOString(),
    total: turns.length,
    pass: turns.filter((turn) => turn.score.verdict === "pass").length,
    watch: turns.filter((turn) => turn.score.verdict === "watch").length,
    fail: turns.filter((turn) => turn.score.verdict === "fail").length,
    averageScore:
      turns.reduce((sum, turn) => sum + Number(turn.score.numeric ?? 0), 0) /
      Math.max(1, turns.length),
    averageLatencyMs:
      turns.reduce((sum, turn) => sum + Number(turn.latencyMs ?? 0), 0) /
      Math.max(1, turns.length),
    p50LatencyMs: percentile(latency, 0.5),
    p90LatencyMs: percentile(latency, 0.9),
    maxLatencyMs: latency.at(-1) ?? 0,
    flags,
    retiredFactGate,
    byChain: Object.fromEntries(
      [...new Set(turns.map((turn) => turn.chainId))].map((chainId) => {
        const rows = turns.filter((turn) => turn.chainId === chainId);
        return [
          chainId,
          {
            total: rows.length,
            pass: rows.filter((turn) => turn.score.verdict === "pass").length,
            watch: rows.filter((turn) => turn.score.verdict === "watch").length,
            fail: rows.filter((turn) => turn.score.verdict === "fail").length,
            averageScore:
              rows.reduce((sum, turn) => sum + Number(turn.score.numeric ?? 0), 0) /
              Math.max(1, rows.length),
          },
        ];
      }),
    ),
  };
}

function percentile(sorted, p) {
  if (!sorted.length) return 0;
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))];
}

function renderCsv(turns) {
  const header = [
    "id",
    "chain",
    "category",
    "question",
    "verdict",
    "score",
    "flags",
    "latency_ms",
    "sources_count",
    "retired_fact_gate_status",
    "pre_model_gate_status",
    "post_model_gate_status",
    "retired_fact_terms",
    "retired_fact_locations",
    "answer_hash",
    "answer_excerpt",
  ];
  const rows = turns.map((turn) =>
    [
      turn.id,
      turn.chainTitle,
      turn.category,
      turn.question,
      turn.score.verdict,
      turn.score.numeric,
      turn.score.flags.join("; "),
      turn.latencyMs,
      turn.sourcesCount,
      turn.retiredFactGate?.status ?? "unknown",
      turn.retiredFactGate?.preModelGateStatus ?? "unknown",
      turn.retiredFactGate?.postModelGateStatus ?? "unknown",
      (turn.retiredFactGate?.violationTerms ?? []).join("; "),
      (turn.retiredFactGate?.violationLocations ?? []).join("; "),
      turn.answerHash,
      turn.answer.slice(0, 600),
    ]
      .map(csvCell)
      .join(","),
  );
  return `${header.join(",")}\n${rows.join("\n")}\n`;
}

function renderHtml(summary, turns) {
  const rows = turns
    .map(
      (turn) => `<tr class="${escapeHtml(turn.score.verdict)}">
        <td>${escapeHtml(turn.id)}</td>
        <td>${escapeHtml(turn.chainTitle)}</td>
        <td>${escapeHtml(turn.category)}</td>
        <td>${escapeHtml(turn.question)}</td>
        <td>${escapeHtml(turn.score.verdict)}</td>
        <td>${escapeHtml(turn.score.numeric)}</td>
        <td>${escapeHtml(turn.score.flags.join(", ") || "none")}</td>
        <td>${escapeHtml(turn.latencyMs)}ms</td>
        <td>${escapeHtml(turn.sourcesCount)}</td>
        <td>${escapeHtml(turn.retiredFactGate?.status ?? "unknown")}</td>
      </tr>`,
    )
    .join("\n");
  const details = turns
    .map(
      (turn) => `<section class="card ${escapeHtml(turn.score.verdict)}">
        <div class="meta">${escapeHtml(turn.id)} · ${escapeHtml(turn.chainTitle)} · ${escapeHtml(turn.latencyMs)}ms · sources ${escapeHtml(turn.sourcesCount)}</div>
        <h2>${escapeHtml(turn.question)}</h2>
        <p><b>Verdict:</b> ${escapeHtml(turn.score.verdict)} (${escapeHtml(turn.score.numeric)}/10). <b>Flags:</b> ${escapeHtml(turn.score.flags.join(", ") || "none")}</p>
        <p><b>Retired-fact gate:</b> ${escapeHtml(turn.retiredFactGate?.status ?? "unknown")} · <b>preModel:</b> ${escapeHtml(turn.retiredFactGate?.preModelGateStatus ?? "unknown")} · <b>postModel:</b> ${escapeHtml(turn.retiredFactGate?.postModelGateStatus ?? "unknown")}</p>
        <p><b>Violation terms:</b> ${escapeHtml((turn.retiredFactGate?.violationTerms ?? []).join(", ") || "none")} · <b>Locations:</b> ${escapeHtml((turn.retiredFactGate?.violationLocations ?? []).join(", ") || "none")}</p>
        <p><b>Answer hash:</b> <code>${escapeHtml(turn.answerHash)}</code> · <b>Raw stream hash:</b> <code>${escapeHtml(turn.rawStreamHash)}</code></p>
        <h3>Retired-Fact Gate Diagnostics</h3>
        <pre>${escapeHtml(JSON.stringify(turn.retiredFactGate, null, 2))}</pre>
        <h3>Captured Answer</h3>
        <pre>${escapeHtml(turn.answer)}</pre>
        <h3>Sources</h3>
        <pre>${escapeHtml(JSON.stringify(turn.sources.slice(0, 12), null, 2))}</pre>
      </section>`,
    )
    .join("\n");
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>AbarVa Intelligence Extensive API Audit · ${escapeHtml(tenant.name)}</title>
  <style>
    body { margin: 0; background: #f7f5ef; color: #111827; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif; }
    header, main { max-width: 1320px; margin: 0 auto; padding: 28px; }
    h1 { margin: 0 0 8px; font: 700 34px Georgia, serif; }
    .metrics { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 12px; margin: 22px 0; }
    .metric, .card { background: #fffdf8; border: 1px solid #ded8cb; border-radius: 8px; padding: 16px; }
    .metric b { display: block; font: 700 26px Georgia, serif; }
    table { width: 100%; border-collapse: collapse; background: white; border: 1px solid #ded8cb; }
    th, td { text-align: left; vertical-align: top; padding: 8px 10px; border-bottom: 1px solid #eee6d8; font-size: 12px; }
    th { color: #64748b; text-transform: uppercase; letter-spacing: .08em; font-size: 11px; }
    .pass { border-left: 5px solid #168a4a; }
    .watch { border-left: 5px solid #b7791f; }
    .fail { border-left: 5px solid #b42318; }
    tr.pass td:first-child { color: #168a4a; font-weight: 700; }
    tr.watch td:first-child { color: #b7791f; font-weight: 700; }
    tr.fail td:first-child { color: #b42318; font-weight: 700; }
    pre { white-space: pre-wrap; border: 1px solid #e6dfd1; background: #fbfaf7; padding: 12px; border-radius: 6px; max-height: 520px; overflow: auto; font-size: 12px; }
    .meta { color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: .08em; }
    code { font-size: 12px; }
  </style>
</head>
<body>
  <header>
    <h1>AbarVa Intelligence Extensive API Audit</h1>
    <p>Tenant-scoped audit of the same <code>/api/intelligence/ask</code> stream used by the UI. Every raw response, parsed answer, source packet, score, and hash is recorded under <code>${escapeHtml(outDir)}</code>.</p>
    <p><b>Tenant:</b> ${escapeHtml(tenant.name)} · <b>Persona:</b> ${escapeHtml(tenant.email)} · <b>Base URL:</b> ${escapeHtml(BASE_URL)} · <b>Run:</b> ${escapeHtml(summary.runId)}</p>
    <section class="metrics">
      <div class="metric"><b>${summary.total}</b>Total</div>
      <div class="metric"><b>${summary.pass}</b>Pass</div>
      <div class="metric"><b>${summary.watch}</b>Watch</div>
      <div class="metric"><b>${summary.fail}</b>Fail</div>
      <div class="metric"><b>${summary.averageScore.toFixed(1)}</b>Avg / 10</div>
      <div class="metric"><b>${Math.round(summary.p90LatencyMs / 1000)}s</b>P90</div>
      <div class="metric"><b>${summary.retiredFactGate.failedUnblocked}</b>Unblocked Retired Facts</div>
    </section>
    <section class="card">
      <h2>Retired-Fact Gate</h2>
      <p><b>Passed:</b> ${summary.retiredFactGate.passed} · <b>Blocked:</b> ${summary.retiredFactGate.blocked} · <b>Failed unblocked:</b> ${summary.retiredFactGate.failedUnblocked} · <b>Total findings:</b> ${summary.retiredFactGate.violations}</p>
      <p><b>Terms seen:</b> ${escapeHtml(summary.retiredFactGate.violationTerms.join(", ") || "none")}</p>
      <p><b>Terms blocked:</b> ${escapeHtml(summary.retiredFactGate.blockedTerms.join(", ") || "none")}</p>
    </section>
  </header>
  <main>
    <h2>Summary Table</h2>
    <table><thead><tr><th>ID</th><th>Chain</th><th>Category</th><th>Question</th><th>Verdict</th><th>Score</th><th>Flags</th><th>Latency</th><th>Sources</th><th>Retired-Fact Gate</th></tr></thead><tbody>${rows}</tbody></table>
    <h2>Detailed Captured Responses</h2>
    ${details}
  </main>
</body>
</html>`;
}

async function main() {
  await fs.mkdir(path.join(outDir, "turns"), { recursive: true });
  const fullQuestionBank = buildQuestionBank();
  const questionBank = LIMIT
    ? fullQuestionBank.slice(0, LIMIT)
    : fullQuestionBank;
  await fs.writeFile(
    path.join(outDir, "question-bank.json"),
    `${JSON.stringify(
      {
        totalAvailable: fullQuestionBank.length,
        limit: LIMIT,
        questions: questionBank,
      },
      null,
      2,
    )}\n`,
  );

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ baseURL: BASE_URL });
  const page = await context.newPage();
  const turns = [];
  try {
    await signIn(context, page);
    await page.goto("/intelligence", { waitUntil: "domcontentloaded", timeout: 45_000 }).catch(() => {});
    for (const [index, item] of questionBank.entries()) {
      const tabId = `audit-${tenant.canonicalKey}-${item.chainId}-${RUN_STAMP}`;
      process.stdout.write(
        `${index + 1}/${questionBank.length} ${item.id} ${item.question.slice(0, 70)} ... `,
      );
      const turn = await ask(page, item, tabId).catch((error) => ({
        ...item,
        tabId,
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        latencyMs: 0,
        httpStatus: 0,
        ok: false,
        answer: `[runner-error] ${error instanceof Error ? error.message : String(error)}`,
        answerHash: "",
        rawStreamHash: "",
        rawStream: "",
        events: [],
        eventTypes: ["runner_error"],
        sources: [],
        sourcesCount: 0,
        agentAnswer: null,
        retiredFactGate: {
          status: "failed_unblocked",
          preModelGateStatus: "unknown",
          postModelGateStatus: "unknown",
          blocked: false,
          violationCount: 0,
          violationTerms: [],
          blockedTerms: [],
          violationLocations: [],
          sourceIdentifiers: [],
          violations: [],
          unblockedViolations: [],
        },
        score: { verdict: "fail", numeric: 0, flags: ["runner_error"] },
      }));
      turns.push(turn);
      await writeTurnArtifacts(turn);
      console.log(`${turn.score.verdict} (${turn.score.numeric}/10)`);
    }
  } finally {
    await browser.close();
  }
  const summary = summarize(turns);
  const publicPrefix = `AbarVa_${tenant.canonicalKey}_Intelligence_Extensive_API_Audit_${RUN_STAMP}`;
  await fs.writeFile(path.join(outDir, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
  await fs.writeFile(path.join(outDir, "transcript.json"), `${JSON.stringify(turns, null, 2)}\n`);
  await fs.writeFile(path.join(outDir, "results.csv"), renderCsv(turns));
  await fs.writeFile(path.join(outDir, "report.html"), renderHtml(summary, turns));
  await fs.copyFile(path.join(outDir, "report.html"), path.join("/Users/anand/Downloads", `${publicPrefix}.html`));
  await fs.copyFile(path.join(outDir, "summary.json"), path.join("/Users/anand/Downloads", `${publicPrefix}_summary.json`));
  await fs.copyFile(path.join(outDir, "results.csv"), path.join("/Users/anand/Downloads", `${publicPrefix}_results.csv`));
  console.log(`\nWrote ${outDir}`);
  console.log(`Downloads report: /Users/anand/Downloads/${publicPrefix}.html`);
  console.log(
    `Pass/watch/fail: ${summary.pass}/${summary.watch}/${summary.fail}; average=${summary.averageScore.toFixed(1)}/10`,
  );
  if (summary.fail > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
