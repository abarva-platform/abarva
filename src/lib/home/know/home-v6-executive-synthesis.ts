import { createHash } from "node:crypto";

import { assertVisibleAnswerContract } from "@/lib/agent/visible-answer-contract";
import { getAuditedAnthropicClient } from "@/lib/agent/stream";
import type {
  HomeKnowResponse,
  HomeKnowSafety,
} from "@/lib/home/know/home-know-contract";
import type { V6HomeAskResult } from "@/lib/home/know/v6-home-ask";
import { scrubPublicAvaAnswerText } from "@/lib/ava-answer/public-answer-scrub";

const PROMPT_VERSION = "home-v6-executive-answer-v3";
const DEFAULT_MODEL = "claude-sonnet-4-6";
const DEFAULT_MAX_TOKENS = 850;
const DEFAULT_TIMEOUT_MS = 45_000;

const TECHNICAL_LANGUAGE_RE =
  /\b(V6|dataset|contract pack|usable evidence items?|governed evidence areas?|selected rows?|rows?|raw|raw source|source file|source row|directRaw|composer|fallback|semantic|dossier|implementation-facing|debug|answerSource|home_v6|home-v6|csv|\.csv|SHA-|APP-|[A-Z]{2,}-IT-\d+)\b/i;

const EXECUTIVE_SIGNALS_RE =
  /\b(means|matters|risk|decision|owner|ownership|ready|readiness|not yet|confidence|prove|proven|evidence|recommendation|prioritization|options|leadership|change|operate|value|caveat|should not)\b/i;
const SOURCE_COMMERCIAL_QUESTION_RE =
  /\b(vendor|vendors|contract|contracts|supplier|suppliers|renewal|renewals|sourcing|rfp)\b/i;
const UNSAFE_HOME_COMMERCIAL_ACTION_RE =
  /\b(first\s+(?:contract|vendor|supplier)\s+to\s+(?:reopen|renegotiate|renew|cancel|terminate)|(?:should|must|need(?:s)?\s+to)\s+(?:reopen|renegotiate|renew|cancel|terminate)|(?:reopen|renegotiate|renew|cancel|terminate)\s+(?:the\s+)?(?:contract|vendor|supplier)|(?:contract|vendor|supplier)\s+should\s+be\s+(?:reopened|renegotiated|renewed|cancelled|terminated))\b/i;

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

type HomeVisualArtifactStatus = NonNullable<HomeKnowResponse["artifactStatus"]>;

export function isHomeV6ExecutiveSynthesisEnabled(): boolean {
  const raw =
    process.env.HOME_V6_EXECUTIVE_SYNTHESIS_ENABLED?.trim().toLowerCase();
  if (raw === "false" || raw === "0" || raw === "off") return false;
  if (raw === "true" || raw === "1" || raw === "on") return true;
  return process.env.NODE_ENV === "production";
}

export function isHomeV6ExecutiveSynthesisRequired(): boolean {
  const raw =
    process.env.HOME_V6_EXECUTIVE_SYNTHESIS_REQUIRED?.trim().toLowerCase();
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
    const normalizedText = normalizeExecutiveText(rawText);
    const executiveText = ensureTenantOpening(
      normalizedText,
      packet.tenantName,
    );
    const rawClaudePreserved = preservesClaudeVisibleText(
      rawText,
      executiveText,
    );
    const artifactStatus = determineArtifactStatus({
      text: executiveText,
      response: args.response,
    });
    const validation = validateExecutiveText({
      text: executiveText,
      response: args.response,
      artifactStatus,
    });
    const validationIssues = validation.hardIssues;
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
        artifactStatus,
        softValidationWarnings: validation.softWarnings,
        model,
        auditId,
        promptBoundary,
        anthropicTrace,
        rawClaudePreserved,
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

Your job is to answer the user's Home question in board-ready business language using only the provided evidence brief.

Rules:
- Produce the final user-visible answer. Do not describe the packet, dataset, rows, source files, routes, debug fields, IDs, or implementation.
- Write for a CIO, CFO, COO, CDAO, or transformation leader. Calm, precise, direct.
- Start with the business meaning, not counts.
- Use tenant-safe demo names exactly as provided.
- Open the first sentence with the tenant-safe name, such as "For Retail Demo,". This is required even when the question says "this tenant".
- Use named systems, vendors, programs, owners, and metrics only when they are in the packet.
- If evidence is incomplete, say exactly what is not proven and why it matters.
- If the question belongs in Intelligence, Moves, Source, or Tower, explain the boundary naturally and name the surface that should own the next step.
- If the user asks what is blocking, what tradeoff matters, whether to scale or hold, or what leadership option to take, name Intelligence for advisory options and tradeoffs; also name Tower, Moves, or Source when the next step is spend/value, execution sequencing, or vendor action.
- Use answerability and context quality as decision controls: if the answer is planning-grade, data-thin, or module-owned, say that plainly in executive language and route the next step. Do not expose the words "answerability", "context quality", "score", or the raw classification labels.
- For vendor, contract, renewal, sourcing, RFP, or partner questions asking what to renegotiate, renew, cancel, source, or negotiate first, Home must not issue the final commercial action. Home may identify Source-validation candidates from the provided evidence, but must phrase them as candidates for Source to validate. State that Source owns the commercial decision before any renegotiation, renewal, cancellation, RFP, or partner action.
- Do not write final-action phrases such as "the first contract to reopen is", "should renegotiate", "should renew", "should cancel", "reopen this contract", "renegotiate this vendor", or equivalent commercial action language as Home's answer.
- For Home answers, phrase follow-up as "the next evidence to validate" rather than "we recommend" unless the user explicitly asks for a recommendation.
- Translate data-architecture and evidence-packet terms into executive language: say "data asset", "shared business definition", "source collection", "business context areas", or "business facts"; do not say dataset, semantic model, semantic layer, corpus, governed evidence areas, business records, or table unless the user asks for a table.
- When the user asks for a table, chart, graph, or visual explanation, use the available evidence to either provide the executive table/chart/graph content if a structured artifact is available, or explain which table/chart/graph would best represent the evidence and what it would show. Do not invent numbers. If the artifact cannot be rendered from current evidence, say what evidence is missing and recommend the right visual structure.
- Do not use markdown headings. Keep the answer compact.
- For Industrial Demo specifically, make answers 25-35% shorter than normal: open with exactly three executive bullets, put caveats after the headline bullets, then offer branch choices instead of a long explanation.
- The three Industrial Demo bullets should still tell a short executive story. Give Claude discretion to frame an interesting point of view, but structure the story around: what this means, why it matters, and where the executive should branch next.
- Branch choices mean: Tower for spend, value, and decisions; Source for vendors, contracts, and renewals; Intelligence for advisory options and tradeoffs; Moves for sequencing and execution.
- For non-Industrial tenants, keep the answer to 2-4 short paragraphs unless the user asks for a table or list.
- Never use these visible phrases: V6, dataset, contract pack, usable evidence items, governed evidence areas, rows, source file, semantic, dossier, raw, debug, implementation.
- Safe commercial wording example: "Source should validate Microsoft first as a renewal-risk candidate before any renegotiation decision." Unsafe wording example: "The first contract to reopen is Microsoft."
- Be concise. Prefer 140-220 words for normal answers and 90-160 words for simple gap answers.

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
  answerability: string;
  contextQuality: {
    overall: string;
    summary: string;
    strongDimensions: string[];
    mediumDimensions: string[];
    thinDimensions: string[];
  } | null;
  styleContract: string;
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
    deterministicAnswer: toPromptSafeText(response.prose, 900),
    facts: uniquePromptFacts(response.facts),
    table: response.tables[0]
      ? {
          title: response.tables[0].title,
          columns: response.tables[0].columns.map((column) => column.label),
          rows: response.tables[0].rows.slice(0, 4),
        }
      : null,
    gaps: response.gaps.slice(0, 5).map((gap) => ({
      label: gap.displayLabel,
      detail: toPromptSafeText(gap.message, 220),
      severity: gap.severity,
    })),
    handoff: response.handoff
      ? {
          label: response.handoff.label,
          reason: response.handoff.reason,
          target: response.handoff.target,
        }
      : null,
    answerability: response.answerability ?? "answerable_with_caveat",
    contextQuality: response.contextQuality
      ? {
          overall: response.contextQuality.overall,
          summary: response.contextQuality.summary,
          strongDimensions: response.contextQuality.strongDimensions,
          mediumDimensions: response.contextQuality.mediumDimensions,
          thinDimensions: response.contextQuality.thinDimensions,
        }
      : null,
    styleContract: buildStyleContract(v6Result.tenant.displayName),
    citations: response.citations.slice(0, 4).map((citation) => ({
      label: toPromptSafeText(citation.label, 120),
      excerpt: citation.excerpt
        ? toPromptSafeText(citation.excerpt, 180)
        : citation.excerpt,
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

Current answer brief to improve:
${packet.deterministicAnswer}

Structured facts available:
${packet.facts.map((fact) => `- ${fact.label}: ${String(fact.value)}`).join("\n") || "None"}

Table evidence available:
${packet.table ? JSON.stringify(packet.table, null, 2) : "None"}

Known gaps:
${packet.gaps.map((gap) => `- ${gap.label}: ${gap.detail} (${gap.severity})`).join("\n") || "None"}

Handoff boundary:
${packet.handoff ? `${packet.handoff.label}: ${packet.handoff.reason}` : "None"}

Answerability:
${packet.answerability}

Context quality:
${packet.contextQuality ? JSON.stringify(packet.contextQuality, null, 2) : "None"}

Required answer shape:
${packet.styleContract}

Evidence support:
${packet.citations.map((citation) => `- ${citation.label}: ${citation.excerpt ?? ""}`).join("\n") || "None"}

Write the final executive answer now.`;
}

function buildStyleContract(tenantName: string): string {
  if (tenantName === "Industrial Demo") {
    return [
      "Industrial Demo compact format is required.",
      "Target 120-170 words unless a table is explicitly requested.",
      "Start with exactly three bullets immediately after the tenant-safe opening.",
      "Make the three bullets feel like a concise executive story, not a mechanical list.",
      "Use the story arc: what this means, why it matters, and where the executive should branch next.",
      "Each bullet should carry an interesting point of view and stay brief.",
      "Put caveats after the three bullets, not before them.",
      "End with branch choices instead of a long explanation:",
      "- Tower: spend, value, decisions.",
      "- Source: vendor/contracts/renewals.",
      "- Intelligence: advisory options/tradeoffs.",
      "- Moves: sequencing and execution.",
    ].join("\n");
  }
  return [
    "Use compact executive prose.",
    "Keep the answer to 2-4 short paragraphs unless the user asks for a table or list.",
    "If handing off, name the branch naturally: Tower for spend, value, and decisions; Source for vendors, contracts, and renewals; Intelligence for advisory options and tradeoffs; Moves for sequencing and execution.",
  ].join("\n");
}

function uniquePromptFacts(
  facts: HomeKnowResponse["facts"],
): Array<{ label: string; value: unknown }> {
  const seen = new Set<string>();
  const promptFacts: Array<{ label: string; value: unknown }> = [];
  for (const fact of facts) {
    const label = toPromptSafeText(fact.label, 100);
    const value =
      typeof fact.value === "string"
        ? toPromptSafeText(fact.value, 180)
        : fact.value;
    const signature = `${label}:${String(value)}`.toLowerCase();
    if (seen.has(signature)) continue;
    seen.add(signature);
    promptFacts.push({ label, value });
    if (promptFacts.length >= 10) break;
  }
  return promptFacts;
}

function toPromptSafeText(value: unknown, maxLength: number): string {
  const text = normalizeExecutiveText(String(value ?? ""))
    .replace(/\busable\s+data asset\s+evidence items?\b/gi, "business facts")
    .replace(/\bevidence items?\b/gi, "business facts")
    .replace(/\bdata asset\s+contract\b/gi, "business context")
    .replace(/\bdata asset\s+evidence\b/gi, "business evidence")
    .replace(/\bsource evidence register\b/gi, "source register")
    .trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

function validateExecutiveText(args: {
  text: string;
  response: HomeKnowResponse;
  artifactStatus: HomeVisualArtifactStatus;
}): { hardIssues: string[]; softWarnings: string[] } {
  const hardIssues: string[] = [];
  const softWarnings: string[] = [];
  const text = args.text.trim();
  if (!text) hardIssues.push("empty_text");
  if (TECHNICAL_LANGUAGE_RE.test(text)) hardIssues.push("technical_language");
  if (!EXECUTIVE_SIGNALS_RE.test(text))
    hardIssues.push("not_executive_friendly");
  if (!hasTenantOpening(text, displayTenantName(args.response))) {
    softWarnings.push("missing_tenant_name");
  }
  const visible = assertVisibleAnswerContract(text);
  if (!visible.passed) {
    hardIssues.push(
      ...visible.violations.map((violation) => `visible:${violation.id}`),
    );
  }
  if (
    args.artifactStatus === "recommended_not_rendered" &&
    /\b(rendered|shown below|displayed below)\b/i.test(text) &&
    !hasRenderableArtifact(args.response)
  ) {
    hardIssues.push("claimed_unavailable_visual_artifact");
  }
  if (
    args.response.answerStatus !== "handoff" &&
    /\b(we recommend|you should invest|scale this|kill this)\b/i.test(text)
  ) {
    hardIssues.push("unsupported_recommendation");
  }
  if (
    SOURCE_COMMERCIAL_QUESTION_RE.test(args.response.question) &&
    UNSAFE_HOME_COMMERCIAL_ACTION_RE.test(text)
  ) {
    hardIssues.push("unsafe_home_commercial_action");
  }
  return {
    hardIssues: [...new Set(hardIssues)],
    softWarnings: [...new Set(softWarnings)],
  };
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

function ensureTenantOpening(text: string, tenantName: string): string {
  const trimmed = text.trim();
  const name = tenantName.trim();
  if (!trimmed || !name) return trimmed;
  const normalized = collapseDuplicateTenantOpening(trimmed, name);
  if (hasTenantOpening(normalized, name)) return normalized;
  return collapseDuplicateTenantOpening(
    `For ${name}, ${sentenceCaseAfterComma(normalized)}`,
    name,
  );
}

function hasTenantOpening(text: string, tenantName: string): boolean {
  const name = tenantName.trim();
  if (!text.trim() || !name) return false;
  const opening = text.trim().slice(0, 160);
  return opening.toLowerCase().includes(name.toLowerCase());
}

function collapseDuplicateTenantOpening(text: string, tenantName: string): string {
  const name = tenantName.trim();
  const trimmed = text.trim();
  if (!trimmed) return trimmed;
  const genericallyCollapsed = trimmed.replace(
    /\bFor\s+([^,\n]+),\s+For\s+\1,\s*/gi,
    (_match, repeatedName: string) => `For ${repeatedName.trim()}, `,
  );
  if (!name) return genericallyCollapsed;
  const escapedName = escapeRegExp(name);
  const duplicateOpening = new RegExp(
    `^(For\\s+${escapedName},\\s*){2,}`,
    "i",
  );
  return genericallyCollapsed.replace(duplicateOpening, `For ${name}, `);
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function sentenceCaseAfterComma(text: string): string {
  return text.replace(/^(The|This|Your|Available)\b/, (match) =>
    match.toLowerCase(),
  );
}

function applyExecutiveSuccess(
  response: HomeKnowResponse,
  args: {
    text: string;
    artifactStatus: HomeVisualArtifactStatus;
    softValidationWarnings: string[];
    model: string;
    auditId: string;
    promptBoundary: ReturnType<typeof buildPromptBoundary>;
    anthropicTrace?: NonNullable<
      HomeKnowSafety["composerTrace"]
    >["anthropicTrace"];
    rawClaudePreserved: boolean;
    maxTokens: number;
    timeoutMs: number;
  },
): HomeKnowResponse {
  return {
    ...response,
    artifactStatus: args.artifactStatus,
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
              `answerSource=${args.rawClaudePreserved ? "claude_text" : "sanitized_claude"}; claudeInvoked=true; claudeSelected=true; rawClaudePreserved=${String(args.rawClaudePreserved)}; traceRawClaudeExposed=${String(Boolean(args.anthropicTrace))}; artifactStatus=${args.artifactStatus}; softWarnings=${args.softValidationWarnings.join("|") || "none"}; promptVersion=${PROMPT_VERSION}; model=${args.model}; auditId=${args.auditId}; ` +
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
    anthropicTrace?: NonNullable<
      HomeKnowSafety["composerTrace"]
    >["anthropicTrace"];
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
  return scrubExecutiveTextPreservingMarkdownEmphasis(text)
    .replace(/^\s*#{1,6}\s+/gm, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\bsemantic\s+(model|layer|definition[s]?)\b/gi, (match) =>
      /layer/i.test(match)
        ? "shared business definition layer"
        : "shared business definition",
    )
    .replace(/\bgoverned evidence areas?\b/gi, "business context areas")
    .replace(/\bbusiness records?\b/gi, "business facts")
    .replace(/\bsource signals?\b/gi, "source evidence")
    .replace(/\bsource-owner record\b/gi, "source ownership")
    .replace(/\bsource-owner\b/gi, "source ownership")
    .replace(/\braw asset list\b/gi, "unqualified asset list")
    .replace(/\braw\b/gi, "unqualified")
    .replace(/\brows?\b/gi, "lines")
    .replace(/\bdatasets?\b/gi, "data asset")
    .replace(/\bcorpus\b/gi, "source collection")
    .replace(
      /\bWe recommend validating\b/gi,
      "The next evidence to validate is",
    )
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const MARKDOWN_EMPHASIS_SENTINEL = "__ABARVA_MARKDOWN_EMPHASIS__";

function scrubExecutiveTextPreservingMarkdownEmphasis(text: string): string {
  return scrubPublicAvaAnswerText(
    text.replace(/\*\*/g, MARKDOWN_EMPHASIS_SENTINEL),
  ).replaceAll(MARKDOWN_EMPHASIS_SENTINEL, "**");
}

function preservesClaudeVisibleText(
  rawText: string,
  visibleText: string,
): boolean {
  return (
    normalizePreservationText(rawText) ===
    normalizePreservationText(visibleText)
  );
}

function normalizePreservationText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function determineArtifactStatus(args: {
  text: string;
  response: HomeKnowResponse;
}): HomeVisualArtifactStatus {
  if (!isVisualAsk(args.response.question, args.response.intent)) {
    return "not_requested";
  }
  if (hasRenderableArtifact(args.response)) return "rendered";
  if (args.response.gaps.length > 0 && namesMissingVisualEvidence(args.text)) {
    return "unavailable_named_gap";
  }
  return "recommended_not_rendered";
}

function isVisualAsk(question: string, intent: string): boolean {
  return (
    intent === "table" ||
    intent === "chart" ||
    /\b(table|chart|graph|visual|visuali[sz]e|plot|diagram)\b/i.test(question)
  );
}

function hasRenderableArtifact(response: HomeKnowResponse): boolean {
  return (
    response.tables.some((table) => table.rows.length > 0) ||
    response.charts.some((chart) => chart.data.length > 0) ||
    response.graphs.some(
      (graph) => graph.nodes.length > 0 || graph.edges.length > 0,
    )
  );
}

function namesMissingVisualEvidence(text: string): boolean {
  return /\b(cannot|can't|not enough|missing|unavailable|not available|not yet)\b/i.test(
    text,
  );
}

function numberFromEnv(key: string, fallback: number): number {
  const value = Number(process.env[key]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function buildPromptBoundary(args: {
  requestPayload: {
    model: string;
    max_tokens: number;
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
