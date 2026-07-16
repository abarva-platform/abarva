import { createHash } from "node:crypto";

import { getAuditedAnthropicClient } from "@/lib/agent/stream";
import type { TowerContextPack } from "@/lib/enterprise-knowledge/contracts";
import type {
  TowerCxoStory,
  TowerCxoStoryCard,
  TowerCxoStoryTab,
  TowerCxoVisualSpec,
  TowerCxoVisualType,
  TowerV3DefaultTabKey,
  TowerV3RuntimeViewModel,
} from "@/lib/tower/tower-v3-runtime-view";

const PROMPT_VERSION = "tower-cxo-claude-story-v1";
const DEFAULT_MODEL = "claude-sonnet-4-6";
const DEFAULT_MAX_TOKENS = 2_400;
const DEFAULT_TIMEOUT_MS = 45_000;

const TAB_KEYS: TowerV3DefaultTabKey[] = [
  "overview",
  "value",
  "budget",
  "portfolio",
  "benchmark",
  "evidence",
  "insights",
];

const VISUAL_TYPES: TowerCxoVisualType[] = [
  "executive_brief",
  "value_waterfall",
  "budget_mix",
  "portfolio_lanes",
  "benchmark_blockers",
  "evidence_checklist",
  "role_decision_cards",
];

const BANNED_INTERNAL_RE =
  /\b(?:TowerContextPack|v3|v4|v6|v7|metric records?|value records?|claim gates?|bridge diagnostics?|evidence refs?|context gaps?|sourcePosture|sourceClassification|raw json|debug|read model|read-model|cio_tower|packet|route|tenant-inputs|source rows?|field facts?|graph nodes?|graph edges?)\b/i;

const BANNED_TENANT_RE = /\bHealthcare Demo\b/i;

const BANNED_OUTCOME_RE =
  /\b(?:realized value|proven value|delivered value|harvested savings|achieved ROI|value captured|measured savings|measured outcome|certified performance|certified financial outcome)\b/i;

export interface TowerCxoClaudePromptTrace {
  promptVersion: string;
  requestJson: string;
  fullPrompt: string;
  promptSha256: string;
  promptByteLength: number;
}

export interface TowerCxoClaudeStorySuccess {
  used: true;
  view: TowerV3RuntimeViewModel;
  auditId: string;
  model: string;
  rawText: string;
  promptTrace: TowerCxoClaudePromptTrace;
}

export interface TowerCxoClaudeStoryFailure {
  used: false;
  view: TowerV3RuntimeViewModel;
  model?: string;
  auditId?: string;
  rawText?: string;
  promptTrace?: TowerCxoClaudePromptTrace;
  issues: string[];
}

export type TowerCxoClaudeStoryResult =
  | TowerCxoClaudeStorySuccess
  | TowerCxoClaudeStoryFailure;

interface TowerCxoClaudePayload {
  story: TowerCxoStory;
  visualSpecs: Record<TowerV3DefaultTabKey, TowerCxoVisualSpec>;
}

export async function applyTowerCxoClaudeStory(args: {
  view: TowerV3RuntimeViewModel;
  contextPack: TowerContextPack;
  tenantName: string;
  userId?: string | null;
}): Promise<TowerCxoClaudeStoryResult> {
  const model = process.env.TOWER_CXO_CLAUDE_STORY_MODEL || DEFAULT_MODEL;
  const maxTokens = numberFromEnv(
    "TOWER_CXO_CLAUDE_STORY_MAX_TOKENS",
    DEFAULT_MAX_TOKENS,
  );
  const timeoutMs = numberFromEnv(
    "TOWER_CXO_CLAUDE_STORY_TIMEOUT_MS",
    DEFAULT_TIMEOUT_MS,
  );
  const request = buildTowerCxoClaudeRequest({
    view: args.view,
    contextPack: args.contextPack,
    tenantName: args.tenantName,
    model,
    maxTokens,
  });

  try {
    const { client, auditId } = await getAuditedAnthropicClient({
      tenantId: args.contextPack.tenantKey,
      userId: args.userId ?? undefined,
      workflow: "tower-cxo-claude-story",
      model,
      dataClass: "confidential",
      prompt: request.promptTrace.fullPrompt,
      artifactType: "tower_cxo_story_block",
      metadata: {
        promptVersion: PROMPT_VERSION,
        surface: "tower",
        contextPackId: args.view.contextPackId,
        metricCount: args.view.metricCount,
        valueRecordCount: args.view.valueRecordCount,
        valueClaimCount: args.view.valueClaimCount,
      },
    });
    const message = await withTimeout(client.messages.create(request.payload), timeoutMs);
    const rawText = extractMessageText(message).trim();
    const parsed = parseClaudePayload(rawText);
    const validation = parsed
      ? validateTowerCxoClaudePayload(parsed, args.view)
      : { passed: false, issues: ["Claude response was not valid JSON."] };

    if (!parsed || !validation.passed) {
      return {
        used: false,
        view: {
          ...args.view,
          cxoStorySource: "claude_fallback",
          cxoStoryAuditId: auditId,
          cxoStoryModel: model,
          cxoStoryValidation: {
            attempted: true,
            passed: false,
            issues: validation.issues,
          },
        },
        model,
        auditId,
        rawText,
        promptTrace: request.promptTrace,
        issues: validation.issues,
      };
    }

    return {
      used: true,
      view: {
        ...args.view,
        cxoStory: parsed.story,
        cxoVisualSpecs: parsed.visualSpecs,
        cxoStorySource: "claude_validated",
        cxoStoryAuditId: auditId,
        cxoStoryModel: model,
        cxoStoryValidation: { attempted: true, passed: true, issues: [] },
      },
      auditId,
      model,
      rawText,
      promptTrace: request.promptTrace,
    };
  } catch (error) {
    return {
      used: false,
      view: {
        ...args.view,
        cxoStorySource: "claude_fallback",
        cxoStoryModel: model,
        cxoStoryValidation: {
          attempted: true,
          passed: false,
          issues: [error instanceof Error ? error.message : String(error)],
        },
      },
      model,
      promptTrace: request.promptTrace,
      issues: [error instanceof Error ? error.message : String(error)],
    };
  }
}

export function buildTowerCxoClaudeRequest(args: {
  view: TowerV3RuntimeViewModel;
  contextPack: TowerContextPack;
  tenantName: string;
  model?: string;
  maxTokens?: number;
}): {
  payload: {
    model: string;
    max_tokens: number;
    system: string;
    messages: Array<{ role: "user"; content: string }>;
  };
  promptTrace: TowerCxoClaudePromptTrace;
} {
  const model = args.model || DEFAULT_MODEL;
  const maxTokens = args.maxTokens ?? DEFAULT_MAX_TOKENS;
  const user = JSON.stringify(buildTowerCxoClaudePacket(args), null, 2);
  const payload = {
    model,
    max_tokens: maxTokens,
    system: TOWER_CXO_CLAUDE_SYSTEM_PROMPT,
    messages: [{ role: "user" as const, content: user }],
  };
  const requestJson = JSON.stringify(payload);
  const fullPrompt = [TOWER_CXO_CLAUDE_SYSTEM_PROMPT, user].join("\n\n");
  return {
    payload,
    promptTrace: {
      promptVersion: PROMPT_VERSION,
      requestJson,
      fullPrompt,
      promptSha256: createHash("sha256").update(requestJson).digest("hex"),
      promptByteLength: Buffer.byteLength(requestJson, "utf8"),
    },
  };
}

export const TOWER_CXO_CLAUDE_SYSTEM_PROMPT = `You are aVa, AbarVa's Tower advisor for CIO/CFO executive value governance.

You are writing the executive story and choosing the visual exhibit contract for a Tower page.
AbarVa supplies deterministic numbers, evidence posture, value-claim gates, and rendering components. You supply the business judgment and wording.

Use only the supplied packet. Do not invent tenants, dates, budgets, values, ROI, savings, outcomes, leaders, vendors, or systems.

Critical language rules:
- Use the executive name "Meridian" for Healthcare Demo / Meridian inputs.
- Do not expose implementation language: no TowerContextPack, v3, metric records, value records, claim gates, bridge diagnostics, evidence refs, source rows, read models, raw JSON, debug, route, or packet language.
- Do not claim realized, proven, delivered, achieved, captured, measured, or certified value unless the packet says outcome language is allowed. In this packet it is blocked, so talk about planned value, hypotheses, measurement readiness, and proof required.
- Preserve locked card values exactly. You may improve labels and captions, but never change the values.
- Keep the executive brief concise, specific, and consultant-grade. Write like a senior partner briefing a CIO and CFO.
- Every tab must have a point of view: what it means, why it matters, what decision it drives, and what happens next.
- Return JSON only. No Markdown. No code fences.

Return this exact JSON shape:
{
  "story": {
    "tenantDisplayName": "Meridian",
    "eyebrow": "Tower · CIO/CFO value cockpit",
    "headline": "...",
    "executiveBrief": "...",
    "cards": [
      {"label":"...", "value":"LOCKED_VALUE", "caption":"..."}
    ],
    "tabs": {
      "overview": {"key":"overview", "headline":"...", "summary":"...", "decisionImplication":"...", "nextAction":"...", "visualType":"executive_brief"},
      "value": {"key":"value", "headline":"...", "summary":"...", "decisionImplication":"...", "nextAction":"...", "visualType":"value_waterfall"},
      "budget": {"key":"budget", "headline":"...", "summary":"...", "decisionImplication":"...", "nextAction":"...", "visualType":"budget_mix"},
      "portfolio": {"key":"portfolio", "headline":"...", "summary":"...", "decisionImplication":"...", "nextAction":"...", "visualType":"portfolio_lanes"},
      "benchmark": {"key":"benchmark", "headline":"...", "summary":"...", "decisionImplication":"...", "nextAction":"...", "visualType":"benchmark_blockers"},
      "evidence": {"key":"evidence", "headline":"...", "summary":"...", "decisionImplication":"...", "nextAction":"...", "visualType":"evidence_checklist"},
      "insights": {"key":"insights", "headline":"...", "summary":"...", "decisionImplication":"...", "nextAction":"...", "visualType":"role_decision_cards"}
    }
  },
  "visualSpecs": {
    "overview": {"key":"overview", "visualType":"executive_brief", "title":"...", "insight":"...", "dataRefs":["..."], "caveat":"..."},
    "value": {"key":"value", "visualType":"value_waterfall", "title":"...", "insight":"...", "dataRefs":["..."], "caveat":"..."},
    "budget": {"key":"budget", "visualType":"budget_mix", "title":"...", "insight":"...", "dataRefs":["..."], "caveat":"..."},
    "portfolio": {"key":"portfolio", "visualType":"portfolio_lanes", "title":"...", "insight":"...", "dataRefs":["..."], "caveat":"..."},
    "benchmark": {"key":"benchmark", "visualType":"benchmark_blockers", "title":"...", "insight":"...", "dataRefs":["..."], "caveat":"..."},
    "evidence": {"key":"evidence", "visualType":"evidence_checklist", "title":"...", "insight":"...", "dataRefs":["..."], "caveat":"..."},
    "insights": {"key":"insights", "visualType":"role_decision_cards", "title":"...", "insight":"...", "dataRefs":["..."], "caveat":"..."}
  }
}`;

function buildTowerCxoClaudePacket(args: {
  view: TowerV3RuntimeViewModel;
  contextPack: TowerContextPack;
  tenantName: string;
}): Record<string, unknown> {
  const { view, contextPack } = args;
  return {
    promptVersion: PROMPT_VERSION,
    instruction:
      "Create the executive Tower story and visual specs from this bounded packet only.",
    tenant: {
      suppliedName: args.tenantName,
      executiveDisplayName: view.cxoStory.tenantDisplayName,
      tenantKey: contextPack.tenantKey,
    },
    hardBoundaries: {
      outcomeLanguageAllowed: view.gateCounts.allowed > 0,
      measurementLanguageAllowed: view.measurementLanguageAllowed,
      blockedOutcomeProof: view.blockedOutcomeProof,
      allowedPosture:
        "measurement readiness, planned value, value hypotheses, evidence blockers, CIO/CFO decisions",
      forbiddenPosture:
        "realized value, proven savings, delivered ROI, certified financial outcome, internal implementation proof",
    },
    lockedCards: view.cxoStory.cards.map((card) => ({
      label: card.label,
      value: card.value,
      deterministicCaption: toBusinessSafePromptText(card.caption),
    })),
    currentStory: sanitizeStoryForPrompt(view.cxoStory),
    deterministicFacts: {
      metricCount: view.metricCount,
      valueRecordCount: view.valueRecordCount,
      valueClaimCount: view.valueClaimCount,
      gateCounts: view.gateCounts,
      plannedValueAreas: view.valueHypotheses.map((item) => ({
        label: item.label,
        value: item.value,
        basis: item.claimBasis,
        posture: item.gateStatus,
      })),
      metricFamilies: view.metricFamilies.slice(0, 10).map((item) => ({
        label: item.label,
        baselineStatus: item.baselineStatus,
        targetStatus: item.targetStatus,
        evidenceStatus: item.evidenceStatus,
      })),
      blockerThemes: view.gapThemes.map((theme) => ({
        title: theme.title,
        whyItMatters: theme.whyItMatters,
        affectedRecordCount: theme.affectedRecordCount,
        requiredEvidence: theme.requiredEvidence,
        handoff: theme.moduleHandoff,
      })),
      executiveInsights: view.executiveInsights.map((insight) => ({
        role: insight.role,
        title: insight.insightTitle,
        summary: insight.insightSummary,
        decisionImplication: insight.decisionImplication,
        nextAction: insight.nextAction,
        strength: insight.claimStrength,
      })),
      nextMeasurementActions: view.nextMeasurementActions,
    },
    visualContract: {
      requiredTabs: TAB_KEYS,
      allowedVisualTypes: VISUAL_TYPES,
      rendererOwns:
        "AbarVa renders the visual components. Claude chooses the type and executive insight, not HTML.",
    },
  };
}

function sanitizeStoryForPrompt(story: TowerCxoStory): TowerCxoStory {
  return {
    ...story,
    eyebrow: toBusinessSafePromptText(story.eyebrow),
    headline: toBusinessSafePromptText(story.headline),
    executiveBrief: toBusinessSafePromptText(story.executiveBrief),
    cards: story.cards.map((card) => ({
      ...card,
      label: toBusinessSafePromptText(card.label),
      caption: toBusinessSafePromptText(card.caption),
    })),
    tabs: Object.fromEntries(
      Object.entries(story.tabs).map(([key, tab]) => [
        key,
        {
          ...tab,
          headline: toBusinessSafePromptText(tab.headline),
          summary: toBusinessSafePromptText(tab.summary),
          decisionImplication: toBusinessSafePromptText(tab.decisionImplication),
          nextAction: toBusinessSafePromptText(tab.nextAction),
        },
      ]),
    ) as Record<TowerV3DefaultTabKey, TowerCxoStoryTab>,
  };
}

function toBusinessSafePromptText(value: string): string {
  return value
    .replace(/\bTowerContextPack\b/g, "governed Tower packet")
    .replace(/\bTowerValueClaim gate\b/gi, "finance evidence gate")
    .replace(/\bv[467]\b/gi, "governed")
    .replace(/\bmetric records?\b/gi, "metrics")
    .replace(/\bvalue records?\b/gi, "value areas")
    .replace(/\bclaim gates?\b/gi, "evidence gates")
    .replace(/\bevidence refs?\b/gi, "evidence")
    .replace(/\bcontext gaps?\b/gi, "evidence gaps")
    .replace(/\bcertified financial outcome\b/gi, "board-ready proof")
    .replace(/\bcertified performance\b/gi, "board-ready proof")
    .replace(/\bbridge diagnostics?\b/gi, "fallback diagnostics");
}

export function validateTowerCxoClaudePayload(
  payload: TowerCxoClaudePayload,
  deterministicView: TowerV3RuntimeViewModel,
): { passed: boolean; issues: string[] } {
  const issues: string[] = [];
  const story = payload.story;
  if (!story || typeof story !== "object") issues.push("Missing story object.");
  if (!payload.visualSpecs || typeof payload.visualSpecs !== "object") {
    issues.push("Missing visualSpecs object.");
  }

  if (story) {
    if (story.tenantDisplayName !== deterministicView.cxoStory.tenantDisplayName) {
      issues.push("Story changed tenant display name.");
    }
    validateCards(story.cards, deterministicView.cxoStory.cards, issues);
    for (const key of TAB_KEYS) {
      const tab = story.tabs?.[key];
      if (!tab) {
        issues.push(`Missing story tab: ${key}.`);
        continue;
      }
      validateStoryTab(key, tab, issues);
    }
    const text = collectStoryText(story);
    if (BANNED_INTERNAL_RE.test(text)) issues.push("Story leaks internal implementation language.");
    if (BANNED_TENANT_RE.test(text)) issues.push("Story uses Healthcare Demo instead of Meridian.");
    if (BANNED_OUTCOME_RE.test(text)) issues.push("Story makes unsupported outcome-proof claims.");
  }

  for (const key of TAB_KEYS) {
    const spec = payload.visualSpecs?.[key];
    if (!spec) {
      issues.push(`Missing visual spec: ${key}.`);
      continue;
    }
    if (spec.key !== key) issues.push(`Visual spec key mismatch: ${key}.`);
    if (!VISUAL_TYPES.includes(spec.visualType)) {
      issues.push(`Invalid visual type for ${key}.`);
    }
    for (const field of ["title", "insight", "caveat"] as const) {
      if (!spec[field] || typeof spec[field] !== "string") {
        issues.push(`Visual spec ${key} missing ${field}.`);
      }
    }
    if (!Array.isArray(spec.dataRefs)) issues.push(`Visual spec ${key} dataRefs must be an array.`);
    const text = `${spec.title} ${spec.insight} ${spec.caveat}`;
    if (BANNED_INTERNAL_RE.test(text)) issues.push(`Visual spec ${key} leaks internal language.`);
    if (BANNED_OUTCOME_RE.test(text)) issues.push(`Visual spec ${key} makes unsupported outcome claim.`);
  }

  return { passed: issues.length === 0, issues };
}

function validateCards(
  cards: TowerCxoStoryCard[] | undefined,
  lockedCards: TowerCxoStoryCard[],
  issues: string[],
) {
  if (!Array.isArray(cards)) {
    issues.push("Story cards must be an array.");
    return;
  }
  if (cards.length !== lockedCards.length) {
    issues.push("Story card count does not match locked card count.");
    return;
  }
  cards.forEach((card, index) => {
    const locked = lockedCards[index];
    if (card.value !== locked.value) {
      issues.push(`Story card ${index + 1} changed locked value.`);
    }
    if (!card.label || !card.caption) {
      issues.push(`Story card ${index + 1} is missing label or caption.`);
    }
  });
}

function validateStoryTab(
  key: TowerV3DefaultTabKey,
  tab: TowerCxoStoryTab,
  issues: string[],
) {
  if (tab.key !== key) issues.push(`Story tab key mismatch: ${key}.`);
  if (!VISUAL_TYPES.includes(tab.visualType)) issues.push(`Story tab ${key} invalid visual type.`);
  for (const field of ["headline", "summary", "decisionImplication", "nextAction"] as const) {
    if (!tab[field] || typeof tab[field] !== "string") {
      issues.push(`Story tab ${key} missing ${field}.`);
    }
  }
}

function collectStoryText(story: TowerCxoStory): string {
  return [
    story.tenantDisplayName,
    story.eyebrow,
    story.headline,
    story.executiveBrief,
    ...story.cards.map((card) => `${card.label} ${card.value} ${card.caption}`),
    ...Object.values(story.tabs).map(
      (tab) =>
        `${tab.headline} ${tab.summary} ${tab.decisionImplication} ${tab.nextAction} ${tab.visualType}`,
    ),
  ].join(" ");
}

function parseClaudePayload(rawText: string): TowerCxoClaudePayload | null {
  const trimmed = rawText
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  try {
    return JSON.parse(trimmed) as TowerCxoClaudePayload;
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start < 0 || end <= start) return null;
    try {
      return JSON.parse(trimmed.slice(start, end + 1)) as TowerCxoClaudePayload;
    } catch {
      return null;
    }
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

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_resolve, reject) => {
        timeout = setTimeout(() => reject(new Error("tower_cxo_claude_story_timeout")), timeoutMs);
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

function numberFromEnv(key: string, fallback: number): number {
  const parsed = Number(process.env[key]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
