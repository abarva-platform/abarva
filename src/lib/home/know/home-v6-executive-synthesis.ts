import { createHash } from "node:crypto";

import { assertVisibleAnswerContract } from "@/lib/agent/visible-answer-contract";
import { getAuditedAnthropicClient } from "@/lib/agent/stream";
import type {
  HomeKnowResponse,
  HomeKnowSafety,
} from "@/lib/home/know/home-know-contract";
import type { V6HomeAskResult } from "@/lib/home/know/v6-home-ask";

const PROMPT_VERSION = "home-v6-executive-answer-v1";
const DEFAULT_MODEL = "claude-opus-4-8";
const DEFAULT_MAX_TOKENS = 1800;
const DEFAULT_TIMEOUT_MS = 45_000;

const TECHNICAL_LANGUAGE_RE =
  /\b(V6|dataset|contract pack|usable evidence items?|governed evidence areas?|selected rows?|rows?|raw source|source file|source row|directRaw|composer|fallback|semantic|dossier|implementation-facing|debug|answerSource|home_v6|home-v6|csv|\.csv|SHA-|APP-|[A-Z]{2,}-IT-\d+)\b/i;

const EXECUTIVE_SIGNALS_RE =
  /\b(means|matters|risk|decision|owner|ownership|ready|not yet|confidence|prove|proven|change|operate|value|caveat|should not)\b/i;

export interface HomeV6ExecutiveSynthesisResult {
  response: HomeKnowResponse;
  trace: {
    attempted: boolean;
    used: boolean;
    reason: string;
    validationIssues: string[];
    model?: string;
    promptVersion: string;
  };
}

export function isHomeV6ExecutiveSynthesisEnabled(): boolean {
  const raw = process.env.HOME_V6_EXECUTIVE_SYNTHESIS_ENABLED
    ?.trim()
    .toLowerCase();
  if (raw === "false" || raw === "0" || raw === "off") return false;
  if (raw === "true" || raw === "1" || raw === "on") return true;
  return process.env.NODE_ENV === "production";
}

export function isHomeV6ExecutiveSynthesisRequired(): boolean {
  const raw = process.env.HOME_V6_EXECUTIVE_SYNTHESIS_REQUIRED
    ?.trim()
    .toLowerCase();
  if (raw === "false" || raw === "0" || raw === "off") return false;
  if (raw === "true" || raw === "1" || raw === "on") return true;
  return process.env.NODE_ENV === "production";
}

export async function applyHomeV6ExecutiveSynthesis(args: {
  response: HomeKnowResponse;
  v6Result: V6HomeAskResult;
  question: string;
  tenantKey: string;
  userId?: string | null;
  includeTrace?: boolean;
}): Promise<HomeV6ExecutiveSynthesisResult> {
  if (!isHomeV6ExecutiveSynthesisEnabled()) {
    return {
      response: args.response,
      trace: {
        attempted: false,
        used: false,
        reason: "env_disabled",
        validationIssues: [],
        promptVersion: PROMPT_VERSION,
      },
    };
  }

  const model = process.env.HOME_V6_EXECUTIVE_SYNTHESIS_MODEL || DEFAULT_MODEL;
  const maxTokens = numberFromEnv(
    "HOME_V6_EXECUTIVE_SYNTHESIS_MAX_TOKENS",
    DEFAULT_MAX_TOKENS,
  );
  const timeoutMs = numberFromEnv(
    "HOME_V6_EXECUTIVE_SYNTHESIS_TIMEOUT_MS",
    DEFAULT_TIMEOUT_MS,
  );
  const packet = buildExecutivePacket(args.response, args.v6Result);
  const system = HOME_V6_EXECUTIVE_SYSTEM_PROMPT;
  const user = renderExecutiveUserPrompt(packet);
  const requestPayload = {
    model,
    max_tokens: maxTokens,
    temperature: 0.2,
    system,
    messages: [{ role: "user" as const, content: user }],
  };
  const promptBoundary = buildPromptBoundary({
    requestPayload,
    system,
    user,
  });

  try {
    const { client, auditId } = await getAuditedAnthropicClient({
      tenantId: args.tenantKey,
      userId: args.userId ?? undefined,
      workflow: "home-v6-executive-answer",
      model,
      dataClass: "confidential",
      prompt: promptBoundary.finalPrompt.full,
      metadata: {
        promptVersion: PROMPT_VERSION,
        surface: "home",
        primaryDimension: args.v6Result.answer.primaryDimension,
        answerStatus: args.response.answerStatus,
        selectedRows: args.v6Result.proof.selectedRows,
        selectedFacts: args.v6Result.proof.selectedFacts,
      },
    });
    const stream = client.messages.stream(requestPayload);
    const collected = await withTimeout(
      collectAnthropicStream(stream),
      timeoutMs,
    );
    const rawText = collected.text.trim();
    const executiveText = normalizeExecutiveText(rawText);
    const validationIssues = validateExecutiveText({
      text: executiveText,
      response: args.response,
    });
    const anthropicTrace = args.includeTrace
      ? {
          finalPrompt: promptBoundary.finalPrompt,
          model,
          params: {
            max_tokens: maxTokens,
            temperature: 0.2,
            timeoutMs,
          },
          claudeRaw: {
            events: collected.events,
            message: collected.message,
            text: rawText,
          },
        }
      : undefined;

    if (validationIssues.length > 0) {
      return {
        response: applyExecutiveFailureTrace(args.response, {
          reason: "validation_failed",
          validationIssues,
          model,
          promptBoundary,
          anthropicTrace,
          auditId,
          maxTokens,
          timeoutMs,
        }),
        trace: {
          attempted: true,
          used: false,
          reason: "validation_failed",
          validationIssues,
          model,
          promptVersion: PROMPT_VERSION,
        },
      };
    }

    return {
      response: applyExecutiveSuccess(args.response, {
        text: executiveText,
        model,
        auditId,
        promptBoundary,
        anthropicTrace,
        maxTokens,
        timeoutMs,
      }),
      trace: {
        attempted: true,
        used: true,
        reason: "claude_selected",
        validationIssues: [],
        model,
        promptVersion: PROMPT_VERSION,
      },
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return {
        response: applyExecutiveFailureTrace(args.response, {
        reason,
        validationIssues: [],
        model,
        promptBoundary,
        maxTokens,
        timeoutMs,
      }),
      trace: {
        attempted: true,
        used: false,
        reason,
        validationIssues: [],
        model,
        promptVersion: PROMPT_VERSION,
      },
    };
  }
}

export const HOME_V6_EXECUTIVE_SYSTEM_PROMPT = `You are aVa, AbarVa's executive Home advisor.

Your job is to answer the user's Home question in board-ready business language using only the provided V6 evidence packet.

Rules:
- Produce the final user-visible answer. Do not describe the packet, dataset, rows, source files, routes, debug fields, IDs, or implementation.
- Write for a CIO, CFO, COO, CDAO, or transformation leader. Calm, precise, direct.
- Start with the business meaning, not counts.
- Use tenant-safe demo names exactly as provided.
- Use named systems, vendors, programs, owners, and metrics only when they are in the packet.
- If evidence is incomplete, say exactly what is not proven and why it matters.
- If the question belongs in Intelligence, Moves, Source, or Tower, explain the boundary naturally and name the surface that should own the next step.
- Do not make recommendations, ROI claims, named-person claims, or audited value claims unless the packet supports them.
- Do not use markdown headings. Keep the answer to 2-4 short paragraphs. Use bullets only when the user asks for a list.
- Never use these visible phrases: V6, dataset, contract pack, usable evidence items, governed evidence areas, rows, source file, semantic, dossier, raw, debug, implementation.

Return only the final answer text.`;

interface ExecutivePacket {
  question: string;
  tenantName: string;
  answerStatus: string;
  intent: string;
  primaryDimension: string;
  relatedDimensions: string[];
  deterministicAnswer: string;
  facts: Array<{ label: string; value: unknown }>;
  table: {
    title: string;
    columns: string[];
    rows: Array<Record<string, unknown>>;
  } | null;
  gaps: Array<{ label: string; detail: string; severity: string }>;
  handoff: { label: string; reason: string; target: string | null } | null;
  citations: Array<{ label: string; excerpt?: string | null }>;
  proof: {
    selectedRows: number;
    selectedFacts: number;
    oldSemanticLayersSunset: boolean;
  };
}

function buildExecutivePacket(
  response: HomeKnowResponse,
  v6Result: V6HomeAskResult,
): ExecutivePacket {
  return {
    question: response.question,
    tenantName: v6Result.tenant.displayName,
    answerStatus: response.answerStatus,
    intent: response.intent,
    primaryDimension: response.dimensionsUsed[0] ?? "home",
    relatedDimensions: response.dimensionsUsed.slice(1),
    deterministicAnswer: response.prose,
    facts: response.facts.slice(0, 24).map((fact) => ({
      label: fact.label,
      value: fact.value,
    })),
    table: response.tables[0]
      ? {
          title: response.tables[0].title,
          columns: response.tables[0].columns.map((column) => column.label),
          rows: response.tables[0].rows.slice(0, 8),
        }
      : null,
    gaps: response.gaps.slice(0, 8).map((gap) => ({
      label: gap.displayLabel,
      detail: gap.message,
      severity: gap.severity,
    })),
    handoff: response.handoff
      ? {
          label: response.handoff.label,
          reason: response.handoff.reason,
          target: response.handoff.target,
        }
      : null,
    citations: response.citations.slice(0, 8).map((citation) => ({
      label: citation.label,
      excerpt: citation.excerpt,
    })),
    proof: {
      selectedRows: v6Result.proof.selectedRows,
      selectedFacts: v6Result.proof.selectedFacts,
      oldSemanticLayersSunset: v6Result.proof.oldSemanticLayersSunset,
    },
  };
}

function renderExecutiveUserPrompt(packet: ExecutivePacket): string {
  return `Question:
${packet.question}

Tenant-safe name:
${packet.tenantName}

Answer status:
${packet.answerStatus}

Intent:
${packet.intent}

Primary business area:
${packet.primaryDimension}

Related business areas:
${packet.relatedDimensions.join(", ") || "none"}

Current deterministic answer to improve:
${packet.deterministicAnswer}

Structured facts available:
${packet.facts.map((fact) => `- ${fact.label}: ${String(fact.value)}`).join("\n") || "None"}

Table evidence available:
${packet.table ? JSON.stringify(packet.table, null, 2) : "None"}

Known gaps:
${packet.gaps.map((gap) => `- ${gap.label}: ${gap.detail} (${gap.severity})`).join("\n") || "None"}

Handoff boundary:
${packet.handoff ? `${packet.handoff.label}: ${packet.handoff.reason}` : "None"}

Citation support:
${packet.citations.map((citation) => `- ${citation.label}: ${citation.excerpt ?? ""}`).join("\n") || "None"}

Evidence packet controls:
- Selected rows: ${packet.proof.selectedRows}
- Selected facts: ${packet.proof.selectedFacts}
- Retired context layers are not available.

Write the final executive answer now.`;
}

function validateExecutiveText(args: {
  text: string;
  response: HomeKnowResponse;
}): string[] {
  const issues: string[] = [];
  const text = args.text.trim();
  if (!text) issues.push("empty_text");
  if (TECHNICAL_LANGUAGE_RE.test(text)) issues.push("technical_language");
  if (!EXECUTIVE_SIGNALS_RE.test(text)) issues.push("not_executive_friendly");
  if (!text.includes(displayTenantName(args.response))) {
    issues.push("missing_tenant_name");
  }
  const visible = assertVisibleAnswerContract(text);
  if (!visible.passed) {
    issues.push(
      ...visible.violations.map((violation) => `visible:${violation}`),
    );
  }
  if (
    args.response.answerStatus !== "handoff" &&
    /\b(we recommend|you should invest|scale this|kill this)\b/i.test(text)
  ) {
    issues.push("unsupported_recommendation");
  }
  return [...new Set(issues)];
}

function displayTenantName(response: HomeKnowResponse): string {
  const firstFact = response.facts.find((fact) => fact.label === "Record");
  if (typeof firstFact?.value === "string" && firstFact.value.trim()) {
    return firstFact.value.trim();
  }
  const proseMatch = response.prose.match(
    /\b(Retail Demo|Healthcare Demo|Financial Services Demo|Industrial Demo|Airline Demo)\b/,
  );
  return proseMatch?.[1] ?? "";
}

function applyExecutiveSuccess(
  response: HomeKnowResponse,
  args: {
    text: string;
    model: string;
    auditId: string;
    promptBoundary: ReturnType<typeof buildPromptBoundary>;
    anthropicTrace?: NonNullable<HomeKnowSafety["composerTrace"]>["anthropicTrace"];
    maxTokens: number;
    timeoutMs: number;
  },
): HomeKnowResponse {
  return {
    ...response,
    prose: args.text,
    safety: {
      ...response.safety,
      composerTrace: response.safety.composerTrace
        ? {
            ...response.safety.composerTrace,
            composer: "claude_text_synthesis",
            goldenComposerAttempted: true,
            goldenComposerUsed: true,
            fallbackUsed: false,
            reason:
              `answerSource=sanitized_claude; claudeInvoked=true; claudeSelected=true; rawClaudePreserved=${String(Boolean(args.anthropicTrace))}; promptVersion=${PROMPT_VERSION}; model=${args.model}; auditId=${args.auditId}; ` +
              response.safety.composerTrace.reason,
            promptSnapshot: {
              system: HOME_V6_EXECUTIVE_SYSTEM_PROMPT,
              user: args.promptBoundary.finalPrompt.messages
                .map((message) => String(message.content))
                .join("\n\n"),
              full: args.promptBoundary.finalPrompt.full,
            },
            anthropicTrace: args.anthropicTrace,
          }
        : response.safety.composerTrace,
    },
  };
}

function applyExecutiveFailureTrace(
  response: HomeKnowResponse,
  args: {
    reason: string;
    validationIssues: string[];
    model: string;
    promptBoundary: ReturnType<typeof buildPromptBoundary>;
    anthropicTrace?: NonNullable<HomeKnowSafety["composerTrace"]>["anthropicTrace"];
    auditId?: string;
    maxTokens: number;
    timeoutMs: number;
  },
): HomeKnowResponse {
  const required = isHomeV6ExecutiveSynthesisRequired();
  return {
    ...response,
    answerStatus: required ? "blocked" : response.answerStatus,
    prose: required
      ? "I could not safely finalize this Home answer in executive language, so I am not showing a lower-quality fallback. Please try again in a moment."
      : response.prose,
    safety: {
      ...response.safety,
      frontendTripwireShouldFire: required,
      composerTrace: response.safety.composerTrace
        ? {
            ...response.safety.composerTrace,
            composer: required
              ? "home_know_blocked"
              : response.safety.composerTrace.composer,
            fallbackUsed: true,
            reason:
              `answerSource=v6_dataset_contract; claudeInvoked=true; claudeSelected=false; fallbackUsed=true; fallbackReason=${args.reason}; validationIssues=${args.validationIssues.join("|") || "none"}; promptVersion=${PROMPT_VERSION}; model=${args.model}; auditId=${args.auditId ?? "none"}; ` +
              response.safety.composerTrace.reason,
            promptSnapshot: {
              system: HOME_V6_EXECUTIVE_SYSTEM_PROMPT,
              user: args.promptBoundary.finalPrompt.messages
                .map((message) => String(message.content))
                .join("\n\n"),
              full: args.promptBoundary.finalPrompt.full,
            },
            answerStatus: required
              ? "blocked"
              : response.safety.composerTrace.answerStatus,
            anthropicTrace: args.anthropicTrace,
          }
        : response.safety.composerTrace,
    },
  };
}

function normalizeExecutiveText(text: string): string {
  return text
    .replace(/^\s*#{1,6}\s+/gm, "")
    .replace(/\*\*/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function numberFromEnv(key: string, fallback: number): number {
  const value = Number(process.env[key]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function buildPromptBoundary(args: {
  requestPayload: {
    model: string;
    max_tokens: number;
    temperature: number;
    system: string;
    messages: ReadonlyArray<{ role: "user"; content: string }>;
  };
  system: string;
  user: string;
}): Pick<
  NonNullable<NonNullable<HomeKnowSafety["composerTrace"]>["anthropicTrace"]>,
  "finalPrompt"
> {
  const requestJson = JSON.stringify(args.requestPayload);
  return {
    finalPrompt: {
      request: args.requestPayload,
      requestJson,
      system: args.system,
      messages: args.requestPayload.messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
      full: [args.system, args.user].join("\n\n"),
      promptByteLength: Buffer.byteLength(requestJson, "utf8"),
      promptSha256: createHash("sha256").update(requestJson).digest("hex"),
    },
  };
}

async function collectAnthropicStream(
  stream: unknown,
): Promise<{ events: unknown[]; message: unknown; text: string }> {
  const events: unknown[] = [];
  let text = "";
  if (isAsyncIterable(stream)) {
    for await (const event of stream) {
      events.push(event);
      text += extractTextDelta(event);
    }
    const message = await readFinalMessage(stream).catch(() => null);
    if (!text.trim()) text = extractMessageText(message);
    return { events, message, text };
  }
  const message = await readFinalMessage(stream);
  return {
    events: [{ type: "final_message_only", message }],
    message,
    text: extractMessageText(message),
  };
}

function isAsyncIterable(value: unknown): value is AsyncIterable<unknown> {
  return Boolean(
    value &&
      typeof value === "object" &&
      Symbol.asyncIterator in value &&
      typeof (value as AsyncIterable<unknown>)[Symbol.asyncIterator] ===
        "function",
  );
}

async function readFinalMessage(stream: unknown): Promise<unknown> {
  const maybe = stream as { finalMessage?: unknown };
  if (typeof maybe.finalMessage === "function") {
    return await maybe.finalMessage();
  }
  return null;
}

function extractTextDelta(event: unknown): string {
  if (!event || typeof event !== "object") return "";
  const record = event as Record<string, unknown>;
  if (record.type !== "content_block_delta") return "";
  const delta = record.delta;
  if (!delta || typeof delta !== "object") return "";
  const deltaRecord = delta as Record<string, unknown>;
  return deltaRecord.type === "text_delta" &&
    typeof deltaRecord.text === "string"
    ? deltaRecord.text
    : "";
}

function extractMessageText(message: unknown): string {
  if (!message || typeof message !== "object") return "";
  const content = (message as { content?: unknown }).content;
  if (!Array.isArray(content)) return "";
  return content
    .map((item) => {
      if (!item || typeof item !== "object") return "";
      const record = item as Record<string, unknown>;
      return record.type === "text" && typeof record.text === "string"
        ? record.text
        : "";
    })
    .filter(Boolean)
    .join("\n");
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("timeout")), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
