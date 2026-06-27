export const VISIBLE_ANSWER_CONTRACT_VERSION =
  "visible-answer-contract-2026-06-27";

export const VISIBLE_ANSWER_CONTRACT_PROMPT = [
  "You are a senior CXO advisor for AbarVa.",
  "",
  "Claude owns the answer. AbarVa owns context, safety, routing, artifacts, and rendering.",
  "",
  "Lead with the actual answer, recommendation, or judgment. Do not open with filler, a summary of the question, or a template.",
  "Use the client context provided to you, but do not describe internal retrieval, evidence, data-plane, or product machinery.",
  "",
  "Before sending, self-scrub the visible answer:",
  "- No raw record IDs, artifact IDs, UUIDs, source keys, table names, JSON, debug terms, or internal field names.",
  '- No visible scaffolding labels such as "Read:", "Evidence:", "Implication:", or "Next move:".',
  '- No implementation phrases such as "loaded evidence", "tenant evidence", "evidence ledger", "source signals", "semantic packet", "rows", or "retrieved context".',
  "- No repeated stock closing line.",
  "",
  "End naturally based on the question:",
  "- If the answer is a decision, end with the decision.",
  "- If action is required, end with the action.",
  "- If risk is the point, end with the risk or owner.",
  "- If more depth is genuinely useful, ask one specific follow-up question.",
  '- Do not append generic choices like "evidence, risks, or next actions."',
  "",
  "Write like a human senior advisor: direct, concise, specific, and willing to disagree. Avoid report prose, compliance language, and product terminology.",
].join("\n");

export interface VisibleAnswerViolation {
  id: string;
  excerpt: string;
}

const VISIBLE_ANSWER_BANNED_PATTERNS: Array<{ id: string; pattern: RegExp }> = [
  { id: "blank_answer", pattern: /^\s*$/ },
  {
    id: "raw_uuid",
    pattern:
      /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i,
  },
  {
    id: "raw_record_id",
    pattern:
      /\b(?:APX|APEX|FC|FCS|LAK|LKS|MER|MHS|SHA|SKY|SRC|TWR|INIT|PRG|SYS|APP|VEN)-[A-Z0-9][A-Z0-9_-]{2,}\b/,
  },
  { id: "source_key", pattern: /\bF\d{2}_[a-z0-9_]+\b/i },
  {
    id: "json_or_table_name",
    pattern:
      /\b(?:JSON|json|enterprise_context_[a-z0-9_]+|semantic_[a-z0-9_]+|mv_[a-z0-9_]+|home_know|tower_[a-z0-9_]+)\b/,
  },
  {
    id: "debug_or_path",
    pattern:
      /\b(?:debug|localhost|\.env|\/Users\/|src\/|route used|stack trace)\b/i,
  },
  { id: "scaffolding_label_read", pattern: /(^|\n)\s*Read\s*:/i },
  { id: "scaffolding_label_evidence", pattern: /(^|\n)\s*Evidence\s*:/i },
  { id: "scaffolding_label_implication", pattern: /(^|\n)\s*Implication\s*:/i },
  { id: "scaffolding_label_next", pattern: /(^|\n)\s*Next\s*:/i },
  { id: "scaffolding_label_next_move", pattern: /(^|\n)\s*Next move\s*:/i },
  { id: "implementation_loaded_evidence", pattern: /\bloaded evidence\b/i },
  { id: "implementation_tenant_evidence", pattern: /\btenant evidence\b/i },
  { id: "implementation_evidence_ledger", pattern: /\bevidence ledger\b/i },
  { id: "implementation_source_signals", pattern: /\bsource signals\b/i },
  { id: "implementation_semantic_packet", pattern: /\bsemantic packet\b/i },
  { id: "implementation_retrieved_context", pattern: /\bretrieved context\b/i },
  { id: "implementation_rows", pattern: /\brows?\b/i },
  {
    id: "internal_dossier_terms",
    pattern:
      /\b(?:binder|dossier|packet|read[- ]model|source key|record type|dimension key|artifact id|citation id)\b/i,
  },
  {
    id: "stock_generic_closing",
    pattern:
      /(?:evidence,\s*risks?,\s*or\s*next actions?|supporting (?:material|evidence),\s*compare options,\s*or shape|ask (?:me|aVa) to inspect .*?(?:compare options|shape this|shape the next))/i,
  },
  { id: "atlas_branding", pattern: /\bAtlas\b/ },
];

function excerptFor(text: string, match: RegExpMatchArray): string {
  const index = typeof match.index === "number" ? match.index : 0;
  return text
    .slice(
      Math.max(0, index - 32),
      Math.min(text.length, index + match[0].length + 32),
    )
    .trim();
}

export function assertVisibleAnswerContract(text: string): {
  passed: boolean;
  version: string;
  violations: VisibleAnswerViolation[];
} {
  const violations: VisibleAnswerViolation[] = [];
  for (const check of VISIBLE_ANSWER_BANNED_PATTERNS) {
    const pattern = new RegExp(check.pattern.source, check.pattern.flags);
    const match = text.match(pattern);
    if (match)
      violations.push({ id: check.id, excerpt: excerptFor(text, match) });
  }
  return {
    passed: violations.length === 0,
    version: VISIBLE_ANSWER_CONTRACT_VERSION,
    violations,
  };
}

export function visibleAnswerIssueIds(text: string): string[] {
  return assertVisibleAnswerContract(text).violations.map(
    (violation) => violation.id,
  );
}
