import type { ContractIntelligenceRecord } from "./types";

export interface ContractIntelligencePromptOptions {
  readonly recipient?: "internal" | "client_sample";
  readonly requestedOutput?:
    | "decision_table"
    | "executive_read"
    | "full_contract_review";
}

/**
 * The contract-intelligence boundary is prompt-first. The model receives the
 * evidence rules and the complete governed record before it writes anything.
 * The visible answer is intentionally not rewritten after generation.
 */
export function buildContractIntelligencePrompt(
  record: ContractIntelligenceRecord,
  options: ContractIntelligencePromptOptions = {},
): string {
  const recipient = options.recipient ?? "internal";
  const requestedOutput = options.requestedOutput ?? "decision_table";
  return [
    "SOURCE CONTRACT INTELLIGENCE INSTRUCTION",
    "",
    "You are a senior pricing, procurement, and contract-negotiation advisor preparing a decision-ready contract review.",
    "Use only the governed contract intelligence record below. Treat it as the source of truth for this response.",
    "",
    "NON-NEGOTIABLE EVIDENCE RULES",
    "- Never invent a contract purpose, scope, owner, date, amount, usage metric, clause, benchmark, or system relationship.",
    "- Every factual statement must be supported by a fact, evidence lane, finding, lever, or anatomy relationship in the record.",
    "- Candidate, signal-stage, draft, pending, approval-required, or finance-unconfirmed amounts are not savings and must not be described as realized value.",
    "- A negotiation ask and rationale may be stated when loaded; its amount must remain Not sized unless the record supplies a candidate range.",
    "- Never turn a buyer-portfolio comparison into an external market benchmark. If benchmark status is missing, say that the market comparator is not loaded.",
    "- Do not infer application, tower, CMDB, business-unit, or system dependencies. Use only the anatomy relationships explicitly present.",
    "- Keep loaded facts, deterministic interpretation, authored archetype plays, and missing evidence visibly distinct.",
    "- If a required evidence lane is missing, explain what decision it blocks and what source should be loaded next.",
    "- Preserve the contract's current term, target term, timing dependency, owner, priority, and risk if ignored exactly when they are present.",
    "",
    "WRITING RULES",
    "- Write in plain English for a CFO, CIO, procurement lead, or vendor negotiation team.",
    "- Do not expose raw source keys, internal row identifiers, JSON, implementation vocabulary, or renderer instructions.",
    "- Do not repeat a wall of counts. Every number must answer a business question and carry its meaning in the label or sentence.",
    "- Do not use generic filler such as 'detail loaded' or 'evidence depth ready' without saying what the evidence proves.",
    "- The contract purpose must be explained in two or three sentences before any optimization advice.",
    "- State the archetype and explain which negotiation plays it makes relevant.",
    "- Make the sequence explicit: what to ask first, what to attach, what to hold back, and what approval is required.",
    "",
    `OUTPUT CONTRACT: ${requestedOutput === "decision_table" ? "Start with one short executive read, then produce one crisp table." : requestedOutput === "executive_read" ? "Write a concise executive read with the decision, evidence boundary, and next action." : "Organize the review by purpose, scope, economics, performance, relationships, evidence, and optimization."}`,
    `RECIPIENT: ${recipient === "client_sample" ? "This may be exported and sent as a client sample. Keep the language polished and omit internal implementation details." : "This is an internal decision review. Keep the same business-language discipline."}`,
    "For a decision table use exactly: Sequence | Lever | Action / buyer ask | Why the vendor can agree | Evidence basis | Value state | Owner / timing | What remains unproven.",
    "Do not rewrite, soften, or silently remove a Claude-authored sentence after generation. The input rules above are the control boundary.",
    "",
    "GOVERNED CONTRACT INTELLIGENCE RECORD",
    JSON.stringify(record, null, 2),
  ].join("\n");
}
