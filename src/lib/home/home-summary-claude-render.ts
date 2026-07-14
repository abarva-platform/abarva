import { createHash } from "node:crypto";

import { getAuditedAnthropicClient } from "@/lib/agent/stream";
import { scrubPublicAvaAnswerText } from "@/lib/ava-answer/public-answer-scrub";
import type {
  HomeContextAreaSummary,
  HomeKnowledgeLayerVisualSpec,
  HomeSummarySnapshot,
} from "@/lib/home/home-summary-snapshot";

const PROMPT_VERSION = "home-summary-claude-render-v1";
const DEFAULT_MODEL = "claude-sonnet-4-6";
const DEFAULT_TIMEOUT_MS = 45_000;
const DEFAULT_MAX_TOKENS = 2400;

export function isHomeSummaryClaudeRenderEnabled(): boolean {
  const raw = process.env.HOME_SUMMARY_CLAUDE_RENDER_ENABLED?.trim().toLowerCase();
  if (raw === "false" || raw === "0" || raw === "off") return false;
  return true;
}

export async function applyHomeSummaryClaudeRender(args: {
  snapshot: HomeSummarySnapshot;
  userId?: string | null;
}): Promise<HomeSummarySnapshot> {
  if (!isHomeSummaryClaudeRenderEnabled()) return args.snapshot;
  if (!process.env.ANTHROPIC_API_KEY) return args.snapshot;

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
  const requestPayload = {
    model,
    max_tokens: maxTokens,
    temperature: 0.2,
    system,
    messages: [{ role: "user" as const, content: user }],
  };
  const prompt = [system, user].join("\n\n");

  try {
    const { client } = await getAuditedAnthropicClient({
      tenantId: args.snapshot.tenantProfileHeader.tenantKey,
      userId: args.userId ?? undefined,
      workflow: "home-summary-claude-render",
      model,
      dataClass: "confidential",
      prompt,
      metadata: {
        promptVersion: PROMPT_VERSION,
        surface: "home",
        mode: args.snapshot.lineage.mode,
        inputFingerprint: args.snapshot.lineage.inputFingerprint,
      },
    });
    const message = await withTimeout(
      client.messages.create(requestPayload),
      timeoutMs,
    );
    const rawText = extractMessageText(message);
    const parsed = parseClaudeJson(rawText);
    const enriched = validateClaudeRender(parsed, args.snapshot);
    if (!enriched) return args.snapshot;

    return {
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
  } catch {
    return args.snapshot;
  }
}

export const HOME_SUMMARY_CLAUDE_SYSTEM_PROMPT = `You render AbarVa Home as an executive enterprise briefing.

Use only the supplied governed snapshot. Do not invent facts, leaders, revenue, systems, vendors, relationships, savings, realized outcomes, or product capabilities.

Return strict JSON only. No markdown. No prose outside JSON.

Rules:
- Write concise CXO-ready copy.
- Explain why each enterprise dimension matters and which modules use it.
- Keep diagnostics secondary.
- Do not expose implementation terms: no V4, V6, V7, dataset, source row, debug, route, table name, read model, or canonical table.
- Relationship depth and measured outcomes must be caveated if the snapshot says they are limited.
- No sourcing savings, ROI, Tower value, or cross-domain dependency claims unless explicitly supported in the snapshot.
- The visualSpec must be structured data only; the React renderer will draw it. Do not return HTML, SVG, CSS, scripts, or markdown.`;

function renderHomeSummaryPrompt(snapshot: HomeSummarySnapshot): string {
  return JSON.stringify(
    {
      tenant: snapshot.tenantProfileHeader,
      executiveProfile: {
        facts: snapshot.executiveProfile.companySummaryFacts,
        knows: snapshot.executiveProfile.whatAbarVaKnows,
        missing: snapshot.executiveProfile.whatIsMissing,
        safeToAsk: snapshot.executiveProfile.safeToAsk,
        doNotRelyYet: snapshot.executiveProfile.doNotRelyYet,
        contextDepthWidth: snapshot.executiveProfile.contextDepthWidth,
      },
      contextAreas: snapshot.contextAreas.map((area) => ({
        displayName: area.displayName,
        loadedCount: area.loadedCount,
        evidenceCount: area.evidenceCount,
        relationshipCount: area.relationshipCount,
        examples: area.examples.slice(0, 6),
        evidencePosture: area.evidencePosture,
        relationshipDepth: area.relationshipDepth,
        safeQuestions: area.safeQuestions,
        unsupportedQuestions: area.unsupportedQuestions,
        nextDataActions: area.nextDataActions,
        caveats: area.caveats,
      })),
      requiredOutputShape: {
        executiveSummary: "string",
        dimensionSummaries:
          "object keyed by displayName with executiveSummary, whatAbarVaKnows[], whyItMatters, supportedQuestions[], unsupportedQuestions[], nextDataAction",
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

type ClaudeDimensionSummary = {
  executiveSummary: string;
  whatAbarVaKnows: string[];
  whyItMatters: string;
  supportedQuestions: string[];
  unsupportedQuestions: string[];
  nextDataAction: string;
};

type ClaudeRenderPayload = {
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
  const visualRaw = object.knowledgeLayerVisual;
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
    .replace(/\bV[467]\b/gi, "governed")
    .replace(/\bdatasets?\b/gi, "source-backed context")
    .replace(/\bsource rows?\b/gi, "source records")
    .replace(/\bdebug\b/gi, "detail")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 900);
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

export function homeSummaryClaudeRenderPromptHash(snapshot: HomeSummarySnapshot) {
  return createHash("sha256")
    .update(renderHomeSummaryPrompt(snapshot))
    .digest("hex");
}
