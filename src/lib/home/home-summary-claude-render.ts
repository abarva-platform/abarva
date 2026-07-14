import { createHash } from "node:crypto";

import { scrubPublicAvaAnswerText } from "@/lib/ava-answer/public-answer-scrub";
import type {
  HomeContextAreaSummary,
  HomeKnowledgeLayerVisualSpec,
  HomeSummarySnapshot,
} from "@/lib/home/home-summary-snapshot";

const PROMPT_VERSION = "home-summary-claude-render-v1";
const DEFAULT_MODEL = "claude-opus-4-8";
const DEFAULT_TIMEOUT_MS = 45_000;
const DEFAULT_MAX_TOKENS = 6400;

type HomeSummaryClaudeRequestPayload = {
  model: string;
  max_tokens: number;
  temperature?: number;
  system: string;
  messages: Array<{ role: "user"; content: string }>;
};

export interface HomeSummaryClaudeRenderAudit {
  promptVersion: string;
  transport: "audited" | "direct";
  model: string;
  promptHash: string;
  systemPrompt: string;
  userPrompt: string;
  maxTokens: number;
  timeoutMs: number;
  status:
    | "not_configured"
    | "disabled"
    | "sent"
    | "applied"
    | "invalid_response"
    | "error";
  rawResponse: string | null;
  parsedResponse: ClaudeRenderPayload | null;
  enrichedSnapshot: HomeSummarySnapshot | null;
  error: string | null;
}

export function isHomeSummaryClaudeRenderEnabled(): boolean {
  const raw = process.env.HOME_SUMMARY_CLAUDE_RENDER_ENABLED?.trim().toLowerCase();
  if (raw === "false" || raw === "0" || raw === "off") return false;
  return true;
}

export async function applyHomeSummaryClaudeRender(args: {
  snapshot: HomeSummarySnapshot;
  userId?: string | null;
}): Promise<HomeSummarySnapshot> {
  const audit = await runHomeSummaryClaudeRenderAudit(args);
  return audit.enrichedSnapshot ?? args.snapshot;
}

export async function runHomeSummaryClaudeRenderAudit(args: {
  snapshot: HomeSummarySnapshot;
  userId?: string | null;
  transport?: "audited" | "direct";
}): Promise<HomeSummaryClaudeRenderAudit> {
  const transport = args.transport ?? "audited";
  const model = process.env.HOME_SUMMARY_CLAUDE_RENDER_MODEL || DEFAULT_MODEL;
  const maxTokens = numberFromEnv(
    "HOME_SUMMARY_CLAUDE_RENDER_MAX_TOKENS",
    DEFAULT_MAX_TOKENS,
  );
  const timeoutMs = numberFromEnv(
    "HOME_SUMMARY_CLAUDE_RENDER_TIMEOUT_MS",
    DEFAULT_TIMEOUT_MS,
  );
  const system = HOME_SUMMARY_CLAUDE_SYSTEM_PROMPT;
  const user = renderHomeSummaryPrompt(args.snapshot);
  const promptHash = homeSummaryClaudeRenderPromptHash(args.snapshot);
  const baseAudit = (): HomeSummaryClaudeRenderAudit => ({
    promptVersion: PROMPT_VERSION,
    transport,
    model,
    promptHash,
    systemPrompt: system,
    userPrompt: user,
    maxTokens,
    timeoutMs,
    status: "sent",
    rawResponse: null,
    parsedResponse: null,
    enrichedSnapshot: null,
    error: null,
  });
  if (!isHomeSummaryClaudeRenderEnabled()) {
    return { ...baseAudit(), status: "disabled" };
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return { ...baseAudit(), status: "not_configured" };
  }
  const requestPayload: HomeSummaryClaudeRequestPayload = {
    model,
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user" as const, content: user }],
  };
  if (!omitsTemperature(model)) {
    requestPayload.temperature = 0.2;
  }
  const prompt = [system, user].join("\n\n");

  try {
    const message =
      transport === "direct"
        ? await createDirectAnthropicMessage(requestPayload, timeoutMs)
        : await createAuditedAnthropicMessage({
            requestPayload,
            timeoutMs,
            snapshot: args.snapshot,
            userId: args.userId ?? undefined,
            model,
            prompt,
          });
    const rawText = extractMessageText(message);
    const parsed = parseClaudeJson(rawText);
    const enriched = validateClaudeRender(parsed, args.snapshot);
    if (!enriched) {
      return {
        ...baseAudit(),
        status: "invalid_response",
        rawResponse: rawText,
        error: "Claude response did not validate against Home summary schema.",
      };
    }

    const enrichedSnapshot: HomeSummarySnapshot = {
      ...args.snapshot,
      executiveProfile: {
        ...args.snapshot.executiveProfile,
        claudeExecutiveSummary: enriched.executiveSummary,
        knowledgeLayerVisual: enriched.knowledgeLayerVisual,
      },
      contextAreas: args.snapshot.contextAreas.map((area) =>
        enrichContextArea(area, enriched.dimensionSummaries[area.displayName]),
      ),
      guardrails: {
        ...args.snapshot.guardrails,
        callsClaude: true,
      },
    };
    return {
      ...baseAudit(),
      status: "applied",
      rawResponse: rawText,
      parsedResponse: enriched,
      enrichedSnapshot,
    };
  } catch (error) {
    return {
      ...baseAudit(),
      status: "error",
      error: `Claude render failed before a valid response was available: ${safeErrorMessage(error)}`,
    };
  }
}

export const HOME_SUMMARY_CLAUDE_SYSTEM_PROMPT = `You render AbarVa Home as an executive enterprise briefing.

Use only the supplied governed snapshot. Do not invent facts, leaders, revenue, systems, vendors, relationships, savings, realized outcomes, or product capabilities.

Return strict, complete JSON only. No markdown. No prose outside JSON.

Rules:
- Write concise CXO-ready copy.
- Keep each JSON string under 180 characters unless the field is executiveSummary.
- Use exactly 2 items for each array in dimension summaries.
- Explain why each enterprise dimension matters and which modules use it.
- Each dimension's whyItMatters must explicitly name the supplied moduleUses.
- Keep diagnostics secondary.
- Do not expose implementation terms: no V4, V6, V7, dataset, source row, debug, route, table name, read model, canonical, answer material, renderer, or module internals.
- nextDataAction must be a client-facing validation step. Never say "let Home decide" or "render/use this answer material."
- Relationship depth and measured outcomes must be caveated if the snapshot says they are limited.
- No sourcing savings, ROI, Tower value, or cross-domain dependency claims unless explicitly supported in the snapshot.
- The knowledgeLayerVisual must be structured data only; the React renderer will draw it. Do not return HTML, SVG, CSS, scripts, or markdown.`;

function renderHomeSummaryPrompt(snapshot: HomeSummarySnapshot): string {
  return JSON.stringify(
    {
      tenant: snapshot.tenantProfileHeader,
      executiveProfile: {
        facts: snapshot.executiveProfile.companySummaryFacts.slice(0, 6),
        knows: snapshot.executiveProfile.whatAbarVaKnows.slice(0, 5),
        missing: snapshot.executiveProfile.whatIsMissing.slice(0, 5),
        safeToAsk: snapshot.executiveProfile.safeToAsk.slice(0, 5),
        doNotRelyYet: snapshot.executiveProfile.doNotRelyYet.slice(0, 5),
        contextDepthWidth: snapshot.executiveProfile.contextDepthWidth,
      },
      contextAreas: snapshot.contextAreas.map((area) => ({
        displayName: area.displayName,
        loadedCount: area.loadedCount,
        evidenceCount: area.evidenceCount,
        relationshipCount: area.relationshipCount,
        examples: area.examples.slice(0, 4),
        evidencePosture: area.evidencePosture,
        relationshipDepth: area.relationshipDepth,
        platformPurpose: platformPurposeFor(area.displayName),
        moduleUses: platformPurposeFor(area.displayName).modules,
        safeQuestions: area.safeQuestions.slice(0, 3),
        unsupportedQuestions: area.unsupportedQuestions.slice(0, 3),
        nextDataActions: area.nextDataActions.slice(0, 3),
        caveats: area.caveats.slice(0, 3),
      })),
      requiredOutputShape: {
        executiveSummary: "string",
        dimensionSummaries:
          "object keyed by displayName with executiveSummary, whatAbarVaKnows[2], whyItMatters, supportedQuestions[2], unsupportedQuestions[2], nextDataAction",
        knowledgeLayerVisual: {
          title: "string",
          subtitle: "string",
          centerLabel: "string",
          centerDetail: "string",
          nodes:
            "array of nodes with id,label,detail,tone,moduleUses[] for Functions, Applications, Vendors, Data Assets, Programs, Risks, Metrics",
          flow: "array of 5 flow steps",
          caveat: "string",
        },
      },
    },
    null,
    2,
  );
}

export type ClaudeDimensionSummary = {
  executiveSummary: string;
  whatAbarVaKnows: string[];
  whyItMatters: string;
  supportedQuestions: string[];
  unsupportedQuestions: string[];
  nextDataAction: string;
};

export type ClaudeRenderPayload = {
  executiveSummary: string;
  dimensionSummaries: Record<string, ClaudeDimensionSummary>;
  knowledgeLayerVisual: HomeKnowledgeLayerVisualSpec;
};

function validateClaudeRender(
  payload: unknown,
  snapshot: HomeSummarySnapshot,
): ClaudeRenderPayload | null {
  if (!payload || typeof payload !== "object") return null;
  const object = payload as Record<string, unknown>;
  const executiveSummary = cleanText(object.executiveSummary);
  const dimensionSummariesRaw = object.dimensionSummaries;
  const visualRaw = object.knowledgeLayerVisual ?? object.visualSpec;
  if (!executiveSummary || !dimensionSummariesRaw || !visualRaw) return null;
  if (
    !dimensionSummariesRaw ||
    typeof dimensionSummariesRaw !== "object" ||
    Array.isArray(dimensionSummariesRaw)
  ) {
    return null;
  }
  const dimensionSummaries: Record<string, ClaudeDimensionSummary> = {};
  for (const area of snapshot.contextAreas) {
    const raw = (dimensionSummariesRaw as Record<string, unknown>)[
      area.displayName
    ];
    const summary = validateDimensionSummary(raw);
    if (summary) dimensionSummaries[area.displayName] = summary;
  }
  const knowledgeLayerVisual = validateVisualSpec(visualRaw);
  if (!knowledgeLayerVisual) return null;
  return {
    executiveSummary,
    dimensionSummaries,
    knowledgeLayerVisual: {
      ...knowledgeLayerVisual,
      generatedBy: "claude",
    },
  };
}

function validateDimensionSummary(raw: unknown): ClaudeDimensionSummary | null {
  if (!raw || typeof raw !== "object") return null;
  const object = raw as Record<string, unknown>;
  const executiveSummary = cleanText(object.executiveSummary);
  const whyItMatters = cleanText(object.whyItMatters);
  const nextDataAction = cleanText(object.nextDataAction);
  if (!executiveSummary || !whyItMatters || !nextDataAction) return null;
  return {
    executiveSummary,
    whatAbarVaKnows: cleanTextArray(object.whatAbarVaKnows, 5),
    whyItMatters,
    supportedQuestions: cleanTextArray(object.supportedQuestions, 5),
    unsupportedQuestions: cleanTextArray(object.unsupportedQuestions, 5),
    nextDataAction,
  };
}

function validateVisualSpec(raw: unknown): HomeKnowledgeLayerVisualSpec | null {
  if (!raw || typeof raw !== "object") return null;
  const object = raw as Record<string, unknown>;
  const title = cleanText(object.title);
  const subtitle = cleanText(object.subtitle);
  const centerLabel = cleanText(object.centerLabel);
  const centerDetail = cleanText(object.centerDetail);
  const caveat = cleanText(object.caveat);
  const nodes = Array.isArray(object.nodes)
    ? object.nodes
        .map(validateVisualNode)
        .filter((node): node is HomeKnowledgeLayerVisualSpec["nodes"][number] =>
          Boolean(node),
        )
        .slice(0, 8)
    : [];
  const flow = Array.isArray(object.flow)
    ? object.flow
        .map(validateFlowStep)
        .filter((step): step is HomeKnowledgeLayerVisualSpec["flow"][number] =>
          Boolean(step),
        )
        .slice(0, 5)
    : [];
  if (!title || !subtitle || !centerLabel || !centerDetail || nodes.length < 7) {
    return null;
  }
  return {
    title,
    subtitle,
    centerLabel,
    centerDetail,
    nodes,
    flow,
    caveat:
      caveat ||
      "Relationship depth and measured outcomes must be validated before cross-domain dependency, sourcing savings, or Tower value claims.",
    generatedBy: "claude",
  };
}

function validateVisualNode(
  raw: unknown,
): HomeKnowledgeLayerVisualSpec["nodes"][number] | null {
  if (!raw || typeof raw !== "object") return null;
  const object = raw as Record<string, unknown>;
  const label = cleanText(object.label);
  const detail = cleanText(object.detail);
  if (!label || !detail) return null;
  const id =
    cleanText(object.id) || label.toLowerCase().replace(/[^a-z0-9]+/g, "_");
  const tone = cleanTone(object.tone);
  return {
    id,
    label,
    detail,
    tone,
    moduleUses: cleanTextArray(object.moduleUses, 5),
  };
}

function validateFlowStep(
  raw: unknown,
): HomeKnowledgeLayerVisualSpec["flow"][number] | null {
  if (!raw || typeof raw !== "object") return null;
  const object = raw as Record<string, unknown>;
  const label = cleanText(object.label);
  const detail = cleanText(object.detail);
  return label && detail ? { label, detail } : null;
}

function enrichContextArea(
  area: HomeContextAreaSummary,
  summary: ClaudeDimensionSummary | undefined,
): HomeContextAreaSummary {
  if (!summary) return area;
  return {
    ...area,
    claudeExecutiveSummary: summary.executiveSummary,
    claudeWhatAbarVaKnows: summary.whatAbarVaKnows,
    claudeWhyItMatters: summary.whyItMatters,
    claudeSupportedQuestions: summary.supportedQuestions,
    claudeUnsupportedQuestions: summary.unsupportedQuestions,
    claudeNextDataAction: summary.nextDataAction,
  };
}

function parseClaudeJson(rawText: string): unknown {
  const text = rawText.trim();
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

function cleanText(value: unknown): string {
  if (typeof value !== "string") return "";
  return scrubPublicAvaAnswerText(value)
    .replace(
      /\bLet the Home module decide how to render or use (this )?(answer material|[a-z ]+context)\.?/gi,
      "Validate relationship and outcome evidence before relying on this area.",
    )
    .replace(/\banswer material\b/gi, "context")
    .replace(/\bcanonical records?\b/gi, "source-backed records")
    .replace(/\bV[467]\b/gi, "governed")
    .replace(/\bdatasets?\b/gi, "source-backed context")
    .replace(/\bsource rows?\b/gi, "source records")
    .replace(/\bdebug\b/gi, "detail")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 900);
}

function platformPurposeFor(displayName: string): {
  purpose: string;
  modules: string[];
  notYet: string;
} {
  const normalized = displayName.toLowerCase();
  if (normalized.includes("function")) {
    return {
      purpose: "Shows how the enterprise is organized and where work happens.",
      modules: ["Intelligence", "Moves", "Tower"],
      notYet:
        "Do not infer enterprise-wide operating redesign without validated ownership and relationship evidence.",
    };
  }
  if (normalized.includes("application") || normalized.includes("system")) {
    return {
      purpose:
        "Shows the technology estate that enables or constrains the business.",
      modules: ["Intelligence", "Moves", "Source", "Tower"],
      notYet:
        "Do not infer rationalization, cloud target state, or platform savings from inventory alone.",
    };
  }
  if (normalized.includes("vendor") || normalized.includes("contract")) {
    return {
      purpose:
        "Shows who provides technology, services, platforms, and commercial commitments.",
      modules: ["Source", "Intelligence", "Tower"],
      notYet:
        "Do not infer sourcing savings or renegotiation outcomes until contract economics are validated.",
    };
  }
  if (normalized.includes("data") || normalized.includes("integration")) {
    return {
      purpose:
        "Shows whether the enterprise has the data foundation required for analytics, AI, automation, and reporting.",
      modules: ["Intelligence", "Moves", "Tower"],
      notYet:
        "Do not infer AI readiness or lakehouse maturity until data quality, lineage, and platform state are validated.",
    };
  }
  if (normalized.includes("program") || normalized.includes("priorit")) {
    return {
      purpose: "Shows what the enterprise is trying to change or improve.",
      modules: ["Moves", "Intelligence", "Tower"],
      notYet:
        "Do not infer funding approval, delivery status, or realized benefits from priority lists alone.",
    };
  }
  if (normalized.includes("risk") || normalized.includes("control")) {
    return {
      purpose:
        "Shows what can go wrong and what must be governed before decisions are made.",
      modules: ["Intelligence", "Moves", "Source", "Tower"],
      notYet:
        "Do not infer control effectiveness until evidence, owners, and testing posture are validated.",
    };
  }
  if (
    normalized.includes("metric") ||
    normalized.includes("kpi") ||
    normalized.includes("outcome")
  ) {
    return {
      purpose: "Shows how success will be measured.",
      modules: ["Tower", "Moves", "Intelligence"],
      notYet:
        "Do not infer realized value or Tower outcomes unless measured baselines and actuals are present.",
    };
  }
  return {
    purpose: "Shows source-backed enterprise context for governed module use.",
    modules: ["Home", "Intelligence", "Moves", "Source", "Tower"],
    notYet:
      "Do not infer unsupported relationships, outcomes, savings, or production truth.",
  };
}

function cleanTextArray(value: unknown, max: number): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(cleanText).filter(Boolean).slice(0, max);
}

function cleanTone(
  value: unknown,
): HomeKnowledgeLayerVisualSpec["nodes"][number]["tone"] {
  const text = typeof value === "string" ? value : "";
  if (
    [
      "enterprise",
      "technology",
      "commercial",
      "data",
      "delivery",
      "risk",
      "value",
    ].includes(text)
  ) {
    return text as HomeKnowledgeLayerVisualSpec["nodes"][number]["tone"];
  }
  return "enterprise";
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_resolve, reject) => {
        timeout = setTimeout(
          () => reject(new Error("home_summary_claude_timeout")),
          timeoutMs,
        );
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

async function createDirectAnthropicMessage(
  requestPayload: HomeSummaryClaudeRequestPayload,
  timeoutMs: number,
): Promise<unknown> {
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return withTimeout(client.messages.create(requestPayload), timeoutMs);
}

async function createAuditedAnthropicMessage(args: {
  requestPayload: HomeSummaryClaudeRequestPayload;
  timeoutMs: number;
  snapshot: HomeSummarySnapshot;
  userId?: string | undefined;
  model: string;
  prompt: string;
}): Promise<unknown> {
  const { getAuditedAnthropicClient } = await import("@/lib/agent/stream");
  const { client } = await getAuditedAnthropicClient({
    tenantId: args.snapshot.tenantProfileHeader.tenantKey,
    userId: args.userId,
    workflow: "home-summary-claude-render",
    model: args.model,
    dataClass: "confidential",
    prompt: args.prompt,
    metadata: {
      promptVersion: PROMPT_VERSION,
      surface: "home",
      mode: args.snapshot.lineage.mode,
      inputFingerprint: args.snapshot.lineage.inputFingerprint,
    },
  });
  return withTimeout(client.messages.create(args.requestPayload), args.timeoutMs);
}

function extractMessageText(message: unknown): string {
  const content = (message as { content?: unknown }).content;
  if (!Array.isArray(content)) return "";
  return content
    .map((part) => {
      if (!part || typeof part !== "object") return "";
      const maybeText = (part as { text?: unknown }).text;
      return typeof maybeText === "string" ? maybeText : "";
    })
    .join("");
}

function numberFromEnv(key: string, fallback: number): number {
  const parsed = Number(process.env[key]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function omitsTemperature(model: string): boolean {
  return /claude-opus-4-8/i.test(model);
}

function safeErrorMessage(error: unknown): string {
  const message =
    error instanceof Error ? error.message : typeof error === "string" ? error : "";
  return scrubPublicAvaAnswerText(message || "unknown_error")
    .replace(/sk-ant-[a-zA-Z0-9_-]+/g, "[redacted-anthropic-key]")
    .slice(0, 600);
}

export function homeSummaryClaudeRenderPromptHash(snapshot: HomeSummarySnapshot) {
  return createHash("sha256")
    .update(renderHomeSummaryPrompt(snapshot))
    .digest("hex");
}
