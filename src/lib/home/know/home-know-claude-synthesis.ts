import { createHash } from "node:crypto";

import { assertVisibleAnswerContract } from "@/lib/agent/visible-answer-contract";
import { getAuditedAnthropicClient } from "@/lib/agent/stream";
import { scrubPublicAvaAnswerText } from "@/lib/ava-answer/public-answer-scrub";
import type {
  HomeKnowResponse,
  HomeKnowSafety,
} from "@/lib/home/know/home-know-contract";

const PROMPT_VERSION = "home-know-claude-answer-v1";
const DEFAULT_MODEL = "claude-sonnet-4-6";
const DEFAULT_MAX_TOKENS = 1200;
const DEFAULT_TIMEOUT_MS = 45_000;

export function isHomeKnowClaudeSynthesisEnabled(): boolean {
  const raw = process.env.HOME_KNOW_CLAUDE_SYNTHESIS_ENABLED?.trim().toLowerCase();
  if (raw === "false" || raw === "0" || raw === "off") return false;
  return true;
}

export async function applyHomeKnowClaudeSynthesis(args: {
  response: HomeKnowResponse;
  tenantKey: string;
  tenantDisplayName?: string | null;
  userId?: string | null;
  includeTrace?: boolean;
}): Promise<HomeKnowResponse> {
  if (!isHomeKnowClaudeSynthesisEnabled()) return args.response;

  const model = process.env.HOME_KNOW_CLAUDE_SYNTHESIS_MODEL || DEFAULT_MODEL;
  const maxTokens = numberFromEnv(
    "HOME_KNOW_CLAUDE_SYNTHESIS_MAX_TOKENS",
    DEFAULT_MAX_TOKENS,
  );
  const timeoutMs = numberFromEnv(
    "HOME_KNOW_CLAUDE_SYNTHESIS_TIMEOUT_MS",
    DEFAULT_TIMEOUT_MS,
  );
  const system = HOME_KNOW_CLAUDE_SYSTEM_PROMPT;
  const user = renderUserPrompt(args.response, args.tenantDisplayName);
  const requestPayload = {
    model,
    max_tokens: maxTokens,
    temperature: 0.2,
    system,
    messages: [{ role: "user" as const, content: user }],
  };
  const finalPrompt = buildPromptTrace(requestPayload, system, user);

  try {
    const { client, auditId } = await getAuditedAnthropicClient({
      tenantId: args.tenantKey,
      userId: args.userId ?? undefined,
      workflow: "home-know-claude-answer",
      model,
      dataClass: "confidential",
      prompt: finalPrompt.full,
      metadata: {
        promptVersion: PROMPT_VERSION,
        surface: "home",
        dimensionsUsed: args.response.dimensionsUsed,
        answerStatus: args.response.answerStatus,
      },
    });
    const message = await withTimeout(
      client.messages.create(requestPayload),
      timeoutMs,
    );
    const rawText = extractMessageText(message).trim();
    const visibleText = scrubPublicAvaAnswerText(rawText)
      .replace(/\bV7\b/gi, "governed")
      .replace(/\bV6\b/gi, "governed")
      .replace(/\bdataset\b/gi, "source-backed context")
      .replace(/\brows?\b/gi, "records")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    const contract = assertVisibleAnswerContract(visibleText);
    if (!visibleText || !contract.passed) {
      return applyFailureTrace(args.response, {
        reason: visibleText ? "visible_contract_failed" : "empty_model_answer",
        model,
        maxTokens,
        timeoutMs,
        finalPrompt,
        auditId,
        rawText,
      });
    }

    return {
      ...args.response,
      prose: visibleText,
      safety: {
        ...args.response.safety,
        composerTrace: withClaudeTrace(args.response.safety.composerTrace, {
          used: true,
          reason: `answerSource=claude_text; claudeInvoked=true; claudeSelected=true; fallbackUsed=false; promptVersion=${PROMPT_VERSION}; model=${model}; auditId=${auditId}`,
          model,
          maxTokens,
          timeoutMs,
          finalPrompt,
          rawText: args.includeTrace ? rawText : null,
        }),
      },
    };
  } catch (error) {
    return applyFailureTrace(args.response, {
      reason: error instanceof Error ? error.message : String(error),
      model,
      maxTokens,
      timeoutMs,
      finalPrompt,
      rawText: null,
    });
  }
}

export const HOME_KNOW_CLAUDE_SYSTEM_PROMPT = `You are aVa, AbarVa's Home advisor.

Answer the user's Home question in the same advisor voice and rendering discipline as Intelligence, but use only the grounded Home packet below.

Rules:
- Claude writes the visible answer. AbarVa supplies context, guardrails, artifacts, citations, and renderer structure.
- Use only facts, tables, gaps, citations, and handoff boundaries supplied in the packet.
- Do not invent leaders, systems, vendors, dates, dollar amounts, outcomes, savings, or product capabilities.
- Preserve measurement units exactly: employee/headcount values are counts, not currency; never render employees as dollars.
- Do not expose raw implementation language: no V4, V6, V7, dataset, record row, source row, values_json, debug, semantic packet, read-model, or internal route language.
- If evidence is thin, say what can be trusted and what still needs proof.
- If the user asks for strategy, recommendations, use-case choices, sourcing action, execution sequencing, or value realization, answer the boundary clearly and route to Intelligence, Source, Moves, or Tower.
- Keep the answer concise: 2-4 short paragraphs or 4-6 bullets if the user asks for a list.
- The user-facing identity is aVa. Never mention Claude as a separate product or tell the user to ask Claude.
- Return only the visible answer text.`;

function renderUserPrompt(
  response: HomeKnowResponse,
  tenantDisplayName?: string | null,
): string {
  const table = response.tables[0];
  return JSON.stringify(
    {
      question: response.question,
      tenant: tenantDisplayName ?? response.tenantKey,
      answerStatus: response.answerStatus,
      intent: response.intent,
      answerability: response.answerability ?? null,
      deterministicAnswer: response.prose,
      facts: response.facts.slice(0, 24).map((fact) => ({
        label: fact.label,
        value: fact.value,
      })),
      table: table
        ? {
            title: table.title,
            columns: table.columns.map((column) => column.label),
            rows: table.rows.slice(0, 8),
            note: table.note,
          }
        : null,
      gaps: response.gaps.slice(0, 10).map((gap) => ({
        label: gap.displayLabel,
        severity: gap.severity,
        message: gap.message,
      })),
      citations: response.citations.slice(0, 8).map((citation) => ({
        label: citation.label,
        excerpt: citation.excerpt,
        confidence: citation.confidence,
      })),
      handoff: response.handoff,
      safety: {
        blockedDecisionFrames: response.safety.blockedDecisionFrames,
        usableEvidence: response.safety.usableEvidence,
        evidenceChannels: response.safety.evidenceChannels,
      },
    },
    null,
    2,
  );
}

function applyFailureTrace(
  response: HomeKnowResponse,
  args: {
    reason: string;
    model: string;
    maxTokens: number;
    timeoutMs: number;
    finalPrompt: NonNullable<
      NonNullable<HomeKnowSafety["composerTrace"]>["anthropicTrace"]
    >["finalPrompt"];
    auditId?: string;
    rawText: string | null;
  },
): HomeKnowResponse {
  return {
    ...response,
    safety: {
      ...response.safety,
      composerTrace: withClaudeTrace(response.safety.composerTrace, {
        used: false,
        reason: `answerSource=deterministic_fallback; claudeInvoked=true; claudeSelected=false; fallbackUsed=true; fallbackReason=${args.reason}; promptVersion=${PROMPT_VERSION}; model=${args.model}; auditId=${args.auditId ?? "none"}`,
        model: args.model,
        maxTokens: args.maxTokens,
        timeoutMs: args.timeoutMs,
        finalPrompt: args.finalPrompt,
        rawText: args.rawText,
      }),
    },
  };
}

function withClaudeTrace(
  existing: HomeKnowSafety["composerTrace"],
  args: {
    used: boolean;
    reason: string;
    model: string;
    maxTokens: number;
    timeoutMs: number;
    finalPrompt: NonNullable<
      NonNullable<HomeKnowSafety["composerTrace"]>["anthropicTrace"]
    >["finalPrompt"];
    rawText: string | null;
  },
): HomeKnowSafety["composerTrace"] {
  if (!existing) return existing;
  return {
    ...existing,
    composer: args.used ? "claude_text_synthesis" : existing.composer,
    goldenComposerAttempted: true,
    goldenComposerUsed: args.used,
    fallbackUsed: !args.used,
    reason: `${args.reason}; ${existing.reason ?? ""}`.trim(),
    promptSnapshot: {
      system: HOME_KNOW_CLAUDE_SYSTEM_PROMPT,
      user: args.finalPrompt.messages.map((message) => String(message.content)).join("\n\n"),
      full: args.finalPrompt.full,
    },
    anthropicTrace: {
      finalPrompt: args.finalPrompt,
      model: args.model,
      params: {
        max_tokens: args.maxTokens,
        temperature: 0.2,
        timeoutMs: args.timeoutMs,
      },
      claudeRaw: {
        events: [],
        message: null,
        text: args.rawText ?? "",
      },
    },
  };
}

function buildPromptTrace(
  requestPayload: unknown,
  system: string,
  user: string,
): NonNullable<
  NonNullable<HomeKnowSafety["composerTrace"]>["anthropicTrace"]
>["finalPrompt"] {
  const requestJson = JSON.stringify(requestPayload);
  return {
    request: requestPayload,
    requestJson,
    system,
    messages: [{ role: "user", content: user }],
    full: [system, user].join("\n\n"),
    promptByteLength: Buffer.byteLength(requestJson, "utf8"),
    promptSha256: createHash("sha256").update(requestJson).digest("hex"),
  };
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_resolve, reject) => {
        timeout = setTimeout(() => reject(new Error("home_know_claude_timeout")), timeoutMs);
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
