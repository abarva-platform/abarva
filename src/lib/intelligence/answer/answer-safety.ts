import type {
  AgentAnswer,
  AnswerCitation,
  AnswerGraph,
  AnswerTable,
} from "@/lib/intelligence/answer/agent-answer";

const RAW_RECORD_ID_RE = /\b[A-Z]{2,8}-[A-Z0-9]{2,12}-\d{2,5}\b/g;
const RAW_RECORD_ID_TEST_RE = /\b[A-Z]{2,8}-[A-Z0-9]{2,12}-\d{2,5}\b/;
const UUID_RE =
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi;
const UUID_TEST_RE =
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i;
const BRACKET_RECORD_RE = /\b[a-z_][a-z0-9_:-]*\[[^\]\s]{8,}\]/gi;
const BRACKET_RECORD_TEST_RE = /\b[a-z_][a-z0-9_:-]*\[[^\]\s]{8,}\]/i;
const INTERNAL_FIELD_RE =
  /\b(?:tenant_id|client_id|person_id|graph_node_id|record_id|source_id|raw_[a-z0-9_]+)\b/gi;
const INTERNAL_FIELD_TEST_RE =
  /\b(?:tenant_id|client_id|person_id|graph_node_id|record_id|source_id|raw_[a-z0-9_]+)\b/i;
const CONSULTANT_LABEL_RE =
  /\b(Read|Evidence|Implication|Next move|Recommendation|Decision|Owner|Action):\s*(?:\1:\s*)+/gi;

function fallbackCitationLabel(citation: AnswerCitation): string {
  switch (citation.sourceClass) {
    case "tenant-fact":
      return "Loaded tenant evidence";
    case "tenant-chunk":
      return "Loaded context excerpt";
    case "graph":
      return "Enterprise relationship graph";
    case "corpus-pattern":
      return "Industry corpus pattern";
    case "worldview":
      return "Worldview corpus";
    case "expert-pack":
      return "Consilium expert pack";
    default:
      return "Cited evidence";
  }
}

export function containsUnsafePublicText(value: string): boolean {
  return (
    RAW_RECORD_ID_TEST_RE.test(value) ||
    UUID_TEST_RE.test(value) ||
    BRACKET_RECORD_TEST_RE.test(value) ||
    INTERNAL_FIELD_TEST_RE.test(value)
  );
}

export function dedupeConsultantLabels(value: string): string {
  return value.replace(CONSULTANT_LABEL_RE, (_match, label: string) => `${label}: `);
}

export function sanitizePublicText(value: string, fallback = "loaded evidence"): string {
  const cleaned = dedupeConsultantLabels(value)
    .replace(BRACKET_RECORD_RE, fallback)
    .replace(UUID_RE, fallback)
    .replace(RAW_RECORD_ID_RE, "the cited record")
    .replace(INTERNAL_FIELD_RE, "source field")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
  return cleaned || fallback;
}

function sanitizeCitation(citation: AnswerCitation): AnswerCitation {
  const fallback = fallbackCitationLabel(citation);
  const rawLabel = citation.label || fallback;
  return {
    ...citation,
    label: containsUnsafePublicText(rawLabel)
      ? fallback
      : sanitizePublicText(rawLabel, fallback),
    excerpt: citation.excerpt
      ? sanitizePublicText(citation.excerpt, fallback)
      : citation.excerpt,
  };
}

function sanitizeCell(value: string | number | null): string | number | null {
  if (typeof value !== "string") return value;
  return sanitizePublicText(value, "loaded tenant evidence");
}

function sanitizeTable(table: AnswerTable): AnswerTable {
  return {
    ...table,
    title: table.title
      ? sanitizePublicText(table.title, "Answer table")
      : table.title,
    note: table.note
      ? sanitizePublicText(table.note, "Evidence-backed table")
      : table.note,
    columns: table.columns.map((column) => ({
      ...column,
      label: sanitizePublicText(column.label, "Column"),
    })),
    rows: table.rows.map((row) =>
      Object.fromEntries(
        Object.entries(row).map(([key, value]) => [key, sanitizeCell(value)]),
      ),
    ),
  };
}

function sanitizeGraph(graph: AnswerGraph): AnswerGraph {
  return {
    ...graph,
    title: graph.title
      ? sanitizePublicText(graph.title, "Relationship graph")
      : graph.title,
    nodes: graph.nodes.map((node) => ({
      ...node,
      label: sanitizePublicText(node.label, "Entity"),
    })),
    edges: graph.edges.map((edge) => ({
      ...edge,
      label: edge.label
        ? sanitizePublicText(edge.label, "Relationship")
        : edge.label,
    })),
  };
}

export function sanitizeAgentAnswerForRender(answer: AgentAnswer): AgentAnswer {
  return {
    ...answer,
    prose: sanitizePublicText(answer.prose, ""),
    contributingExperts: answer.contributingExperts.map((expert) => ({
      ...expert,
      name: sanitizePublicText(expert.name, "Consilium expert"),
    })),
    citations: answer.citations.map(sanitizeCitation),
    tables: answer.tables.map(sanitizeTable),
    charts: answer.charts.map((chart) => ({
      ...chart,
      title: chart.title
        ? sanitizePublicText(chart.title, "Answer chart")
        : chart.title,
    })),
    graphs: answer.graphs.map(sanitizeGraph),
    gaps: answer.gaps.map((gap) => sanitizePublicText(gap, "Evidence gap")),
    recommendedActions: answer.recommendedActions.map((action) => ({
      ...action,
      label: sanitizePublicText(action.label, "Recommended action"),
      rationale: action.rationale
        ? sanitizePublicText(action.rationale, "Action rationale")
        : action.rationale,
    })),
    limits: answer.limits.map((limit) => sanitizePublicText(limit, "Answer limit")),
  };
}
