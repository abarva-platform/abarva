// Admin Loader — live "Ask Steward" scoped conversation (the escalation path).
//
// When deterministic + agent validation leaves something open-ended, the
// operator opens a side dock pinned to ONE preserved file and asks Steward a
// plain-language question about how that file was mapped/interpreted. This
// module builds the bounded prompt, wraps an injected model seam, and provides
// the production audited-egress model — mirroring `steward-reviewer.ts`.
//
// The model is INJECTED via `StewardChatModel` so tests never touch a live
// model. Production wraps the audited Anthropic egress path via
// `auditedStewardChatModel`.
//
// The chat NEVER throws: a model error returns a calm fallback string so the
// dock stays usable and the preserved file/proposal are never lost.

import {
  type MappingProposal,
  type StewardFinding,
} from "@/lib/context-ingestion/loader/contract";
import { getAuditedAnthropicClient } from "@/lib/agent/stream";

/** Anthropic model used for the scoped Steward chat. */
const STEWARD_CHAT_MODEL = "claude-sonnet-4-6";

/** Calm fallback returned when the reasoning service can't be reached. */
const STEWARD_CHAT_FALLBACK =
  "I couldn't reach the reasoning service just now — your file and proposal are preserved; try again.";

/** A single prior turn in the scoped conversation. */
export interface StewardChatTurn {
  author: "operator" | "steward";
  body: string;
}

/**
 * Injectable model seam. `reply` receives the fully-built prompt and returns
 * the model's plain-text answer. Tests pass a stub; production wraps the audited
 * Anthropic client via `auditedStewardChatModel`.
 */
export interface StewardChatModel {
  reply(prompt: string): Promise<string>;
}

/** Arguments for building a scoped Steward chat prompt / asking a question. */
export interface StewardChatArgs {
  proposal: MappingProposal;
  findings?: StewardFinding[];
  history: StewardChatTurn[];
  question: string;
}

/** Truncate long blobs so the prompt stays bounded. */
function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max)}…[truncated ${value.length - max} chars]`;
}

/** A compact, prompt-friendly view of the field mappings. */
function formatFieldMappings(proposal: MappingProposal): string {
  if (proposal.fieldMappings.length === 0) return "(none proposed)";
  return proposal.fieldMappings
    .map(
      (fm) =>
        `- "${fm.sourceColumn}" → ${fm.canonicalField} (confidence ${fm.confidence.toFixed(2)}${fm.citation ? `, ${fm.citation}` : ""})`,
    )
    .join("\n");
}

/** A compact, prompt-friendly view of the open findings. */
function formatFindings(findings: StewardFinding[]): string {
  if (findings.length === 0) return "(no open findings)";
  return findings
    .map(
      (f) =>
        `- [${f.severity}/${f.kind}] ${f.message}${f.rowRef ? ` (${f.rowRef})` : ""}${f.suggestedAction ? ` — suggested: ${f.suggestedAction}` : ""}`,
    )
    .join("\n");
}

/** Keep the most recent turns; older turns drop off to stay bounded. */
const MAX_HISTORY_TURNS = 16;

/** A compact, prompt-friendly view of the prior conversation. */
function formatHistory(history: StewardChatTurn[]): string {
  if (history.length === 0) return "(no prior messages)";
  const recent = history.slice(-MAX_HISTORY_TURNS);
  return recent
    .map((turn) => {
      const who = turn.author === "operator" ? "Operator" : "Ava";
      return `${who}: ${truncate(turn.body, 1500)}`;
    })
    .join("\n");
}

/**
 * Compose the bounded prompt sent to the model. System framing pins Steward to
 * THIS file's mapping/interpretation only and forbids inventing data. Includes
 * the proposal's dimension + field mappings + findings + prior turns + the new
 * question. Long parts are truncated.
 */
export function buildStewardChatPrompt(args: StewardChatArgs): string {
  const { proposal, findings = [], history, question } = args;

  const sampleRowsBlock = truncate(
    JSON.stringify(proposal.sampleRows ?? [], null, 0),
    2500,
  );

  return [
    `You are Ava, a calm data-mapping assistant. Answer ONLY about how to map/interpret THIS file; never invent data; if asked for data you don't have, say so.`,
    "",
    `You are helping an operator review how one preserved file was mapped to AbarVa's canonical context schema for tenant "${proposal.source.tenantKey}".`,
    `Preserved source file: ${proposal.source.filename} (objectKey: ${proposal.source.objectKey}).`,
    "",
    `Proposed dimension: ${proposal.dimension} (confidence ${proposal.dimensionConfidence.toFixed(2)}).`,
    `Proposed field mappings:`,
    formatFieldMappings(proposal),
    "",
    `Open findings from validation:`,
    formatFindings(findings),
    "",
    `Sample rows: ${sampleRowsBlock}`,
    "",
    `Prior conversation:`,
    formatHistory(history),
    "",
    `Operator's new question: ${truncate(question.trim(), 2000)}`,
    "",
    `Answer in plain language a business reviewer can act on. Stay scoped to this file's mapping and interpretation. If the answer requires data not present here, say you don't have it.`,
  ].join("\n");
}

/**
 * Wrap an injected `StewardChatModel` into an async chat function. Builds the
 * prompt and calls the model. A thrown model error (or any other failure)
 * yields the calm fallback string — the chat never throws.
 */
export function makeStewardChat(model: StewardChatModel) {
  return async (args: StewardChatArgs): Promise<string> => {
    try {
      const reply = await model.reply(buildStewardChatPrompt(args));
      const trimmed = typeof reply === "string" ? reply.trim() : "";
      return trimmed || STEWARD_CHAT_FALLBACK;
    } catch {
      // Never throw — the dock must stay usable; the file/proposal are preserved.
      return STEWARD_CHAT_FALLBACK;
    }
  };
}

/**
 * Production StewardChatModel backed by the audited Anthropic egress path.
 * Anthropic-only (claude-sonnet-4-6). Each `reply` call is independently
 * audited via `getAuditedAnthropicClient`, mirroring `auditedStewardModel`.
 */
export function auditedStewardChatModel(args: {
  tenantId: string;
  userId?: string;
}): StewardChatModel {
  return {
    async reply(prompt: string): Promise<string> {
      const { client } = await getAuditedAnthropicClient({
        tenantId: args.tenantId,
        ...(args.userId !== undefined ? { userId: args.userId } : {}),
        workflow: "admin-loader-steward-chat",
        model: STEWARD_CHAT_MODEL,
        prompt,
        dataClass: "confidential",
        metadata: { stage: "steward-chat" },
      });

      const message = await client.messages.create({
        model: STEWARD_CHAT_MODEL,
        max_tokens: 800,
        messages: [{ role: "user", content: prompt }],
      });

      return message.content
        .map((block) => (block.type === "text" ? block.text : ""))
        .join("")
        .trim();
    },
  };
}
