import { composeRuntimeOutputDisciplineBlock } from "@/lib/agent/output-discipline/prompt-contract";
import { preflightAnthropicDirectClient } from "@/lib/integrations/ai-egress";
import { SOURCE_STAGE_LABELS } from "./constants";
import type { SourceLiveTenantContextSnapshot } from "./agent-context";
import type { SourceNexusApiStubResponse } from "./nexus-api";
import type { SourceAnswerEvidenceCitation } from "./source-answer-engine";
import type { SourcingEventDetail } from "./types";

export const SOURCE_SENTINEL_CHAT_DEFAULT_MODEL = "claude-sonnet-4-6";
const MAX_EVIDENCE_ITEMS = 12;
const MAX_TOKENS = 900;
const CITATION_RE = /\[E(\d{1,2})\]/gi;
const FALSE_VALUES = new Set(["0", "false", "no", "off"]);

export interface SourceSentinelChatLlmInput {
  fallbackResponse: SourceNexusApiStubResponse;
  tenantId: string;
  userId: string;
  prompt: string;
  event?: SourcingEventDetail;
  liveTenantContext?: SourceLiveTenantContextSnapshot;
  env?: NodeJS.ProcessEnv;
}

interface PromptEvidenceItem {
  label: string;
  citation: SourceAnswerEvidenceCitation;
}

export function shouldUseSourceSentinelChatLlm(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  const configured = env.SENTINEL_CHAT_USE_LLM?.trim().toLowerCase();
  if (!configured) return false;
  return !FALSE_VALUES.has(configured);
}

export async function maybeCreateSourceSentinelChatLlmResponse(
  input: SourceSentinelChatLlmInput,
): Promise<SourceNexusApiStubResponse> {
  const env = input.env ?? process.env;
  if (!shouldUseSourceSentinelChatLlm(env)) {
    return input.fallbackResponse;
  }
  if (!env.ANTHROPIC_API_KEY) {
    return withLlmFallbackWarning(
      input.fallbackResponse,
      "Sentinel chat LLM is enabled but ANTHROPIC_API_KEY is not configured; returned deterministic fallback.",
    );
  }
  if (!input.event || !input.liveTenantContext) {
    return withLlmFallbackWarning(
      input.fallbackResponse,
      "Sentinel chat LLM needs an event and live tenant context; returned deterministic fallback.",
    );
  }

  const promptEvidence = buildPromptEvidence(input.liveTenantContext);
  const systemPrompt = buildSourceSentinelChatSystemPrompt({
    event: input.event,
    tenantName:
      input.event.accountName ??
      input.fallbackResponse.sourceIntelligence?.evidenceBasis[0],
    liveTenantContext: input.liveTenantContext,
    promptEvidence,
    fallbackResponse: input.fallbackResponse,
  });
  const model =
    env.SENTINEL_CHAT_MODEL?.trim() || SOURCE_SENTINEL_CHAT_DEFAULT_MODEL;

  try {
    const preflight = await preflightAnthropicDirectClient({
      tenantId: input.tenantId,
      userId: input.userId,
      workflow: "source-sentinel-chat",
      model,
      prompt: [systemPrompt, input.prompt].join("\n\nUser question:\n"),
      dataClass: "confidential",
      artifactType: "source-sentinel-chat",
      artifactId: input.event.id,
      metadata: {
        eventId: input.event.id,
        eventCode: input.event.code,
        route: "/api/v1/source/[eventId]/nexus/ask",
      },
    });
    if (!preflight.ok) {
      return withLlmFallbackWarning(
        input.fallbackResponse,
        `Sentinel chat LLM egress denied: ${preflight.reason}; returned deterministic fallback.`,
      );
    }

    const response = await preflight.client.messages.create({
      model,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages: [{ role: "user", content: input.prompt }],
    });
    const answerText = response.content
      .map((block) => (block.type === "text" ? block.text : ""))
      .join("")
      .trim();

    if (!answerText) {
      return withLlmFallbackWarning(
        input.fallbackResponse,
        "Sentinel chat LLM returned an empty answer; returned deterministic fallback.",
      );
    }

    return buildLlmBackedResponse({
      fallbackResponse: input.fallbackResponse,
      answerText,
      promptEvidence,
      model: response.model ?? model,
      inputTokens: response.usage?.input_tokens ?? null,
      outputTokens: response.usage?.output_tokens ?? null,
    });
  } catch (error) {
    return withLlmFallbackWarning(
      input.fallbackResponse,
      `Sentinel chat LLM failed: ${error instanceof Error ? error.message : "unknown error"}; returned deterministic fallback.`,
    );
  }
}

export function buildSourceSentinelChatSystemPrompt(args: {
  event: SourcingEventDetail;
  tenantName?: string;
  liveTenantContext: SourceLiveTenantContextSnapshot;
  promptEvidence: PromptEvidenceItem[];
  fallbackResponse: SourceNexusApiStubResponse;
}): string {
  const event = args.event;
  const stageLabel =
    SOURCE_STAGE_LABELS[event.currentStageKey] ?? event.currentStageKey;
  const evidenceLines = args.promptEvidence.length
    ? args.promptEvidence.map(formatPromptEvidenceLine)
    : [
        "No event evidence chunks are currently loaded. Say exactly what evidence is missing before making material claims.",
      ];
  const openGates = [
    ...args.fallbackResponse.context.missingInputs,
    ...args.fallbackResponse.context.blockers,
  ];

  return [
    `You are Ava, AbarVa's sourcing analyst, assisting a senior IT sourcing executive at ${args.tenantName ?? event.accountName ?? "the client"}.`,
    "",
    "You are answering inside one specific sourcing event. Do not answer from the tenant's global sourcing portfolio unless the user explicitly asks for portfolio context.",
    `Event: ${event.name} (id: ${event.id}; code: ${event.code})`,
    `Client: ${event.accountName ?? args.tenantName ?? "not recorded"}`,
    `Stage: ${stageLabel} (key: ${event.currentStageKey})`,
    `Archetype: ${event.archetype}`,
    `Rigor: ${event.rigor}`,
    `Value at stake: ${formatUsd(event.valueAtStakeUsd)}`,
    `Decision owner: ${event.scorecard.decisionOwner || event.owner || "not recorded"}`,
    "",
    "Active evidence chunks loaded for this event:",
    ...evidenceLines,
    "",
    "Open gate criteria or missing inputs:",
    ...(openGates.length
      ? openGates.map((item) => `- ${item}`)
      : ["- None recorded in the current event context."]),
    "",
    "Required posture:",
    "1. Every material claim about vendors, numbers, dates, scope, risks, or recommendations MUST cite a loaded evidence ID like [E1].",
    "2. If the loaded evidence cannot answer the question, say what evidence is missing. Do not fall back to a generic sourcing checklist.",
    "3. Never fabricate vendor names, numbers, contract dates, owners, savings, or tool names.",
    "4. Be brief and executive-readable: answer first, then evidence, then next action.",
    "5. Keep any draft output clearly marked as a draft requiring human review before use.",
    "",
    composeRuntimeOutputDisciplineBlock("Source"),
  ].join("\n");
}

function buildPromptEvidence(
  liveTenantContext: SourceLiveTenantContextSnapshot,
): PromptEvidenceItem[] {
  return liveTenantContext.retrievedEvidence
    .slice()
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_EVIDENCE_ITEMS)
    .map((item, index) => ({
      label: `E${index + 1}`,
      citation: {
        id: `E${index + 1}`,
        label: `[E${index + 1}] ${item.title}`,
        segmentId: item.segmentId,
        recordId: item.recordId,
        sourceDoc: item.sourceDoc,
        sourcePath: item.sourcePath,
        excerpt: item.excerpt,
        confidence: item.confidence,
      },
    }));
}

function formatPromptEvidenceLine(item: PromptEvidenceItem): string {
  const source = item.citation.sourceDoc
    ? ` · source: ${item.citation.sourceDoc}`
    : "";
  return `[${item.label}] ${item.citation.label}${source} · confidence: ${item.citation.confidence}\n${item.citation.excerpt}`;
}

function buildLlmBackedResponse(args: {
  fallbackResponse: SourceNexusApiStubResponse;
  answerText: string;
  promptEvidence: PromptEvidenceItem[];
  model: string;
  inputTokens: number | null;
  outputTokens: number | null;
}): SourceNexusApiStubResponse {
  const evidenceCitations = extractEvidenceCitations(
    args.answerText,
    args.promptEvidence,
  );
  const warnings = [
    ...args.fallbackResponse.warnings,
    ...createLlmWarnings(args.answerText, evidenceCitations),
  ];
  const fallbackAnswer = args.fallbackResponse.sourceAnswer;
  const sourceAnswer = fallbackAnswer
    ? {
        ...fallbackAnswer,
        answerText: args.answerText,
        title: fallbackAnswer.title || "Sentinel event answer",
        evidenceCitations,
        confidence:
          evidenceCitations.length >= 2
            ? ("high" as const)
            : ("medium" as const),
        limits: [
          ...fallbackAnswer.limits.filter(
            (limit) => !/deterministic/i.test(limit),
          ),
          `Generated by ${args.model}; human review required before external use.`,
          args.inputTokens !== null || args.outputTokens !== null
            ? `Model usage: ${args.inputTokens ?? "unknown"} input tokens, ${args.outputTokens ?? "unknown"} output tokens.`
            : "Model usage was not returned by the provider.",
        ],
      }
    : null;

  return {
    ...args.fallbackResponse,
    noModel: false,
    sourceAnswer,
    answerQuality: undefined,
    answer: args.answerText,
    summary: args.answerText,
    nexusSummary: args.fallbackResponse.nexusSummary
      ? {
          ...args.fallbackResponse.nexusSummary,
          title:
            sourceAnswer?.title ?? args.fallbackResponse.nexusSummary.title,
          summary: args.answerText,
          primaryFinding: firstSentence(args.answerText),
          recommendedNextAction:
            sourceAnswer?.recommendedNextAction ??
            args.fallbackResponse.nexusSummary.recommendedNextAction,
          confidence:
            sourceAnswer?.confidence ??
            args.fallbackResponse.nexusSummary.confidence,
        }
      : null,
    warnings,
  };
}

function extractEvidenceCitations(
  answerText: string,
  promptEvidence: PromptEvidenceItem[],
): SourceAnswerEvidenceCitation[] {
  const byIndex = new Map<number, SourceAnswerEvidenceCitation>();
  for (const match of answerText.matchAll(CITATION_RE)) {
    const index = Number(match[1]) - 1;
    const evidence = promptEvidence[index]?.citation;
    if (evidence) byIndex.set(index, evidence);
  }
  return [...byIndex.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, citation]) => citation);
}

function createLlmWarnings(
  answerText: string,
  evidenceCitations: SourceAnswerEvidenceCitation[],
): string[] {
  const warnings: string[] = [];
  if (evidenceCitations.length === 0) {
    warnings.push(
      "Citation gap: Sentinel used the LLM path but returned no event evidence citations. Treat as non-decision-grade until cited.",
    );
  }
  if (
    /as a sourcing best practice|generally speaking|in most sourcing events/i.test(
      answerText,
    )
  ) {
    warnings.push(
      "Response drift warning: Sentinel used generic sourcing language; verify against event evidence before acting.",
    );
  }
  return warnings;
}

function withLlmFallbackWarning(
  response: SourceNexusApiStubResponse,
  warning: string,
): SourceNexusApiStubResponse {
  return {
    ...response,
    noModel: true,
    warnings: [...response.warnings, warning],
  };
}

function firstSentence(text: string): string {
  return text.split(/(?<=[.!?])\s+/)[0]?.trim() || text.slice(0, 180);
}

function formatUsd(value?: number): string {
  if (typeof value !== "number" || !Number.isFinite(value))
    return "not recorded";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}
