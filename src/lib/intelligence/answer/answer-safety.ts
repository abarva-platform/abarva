import type {
  AnswerCitation,
  AnswerGraph,
  AnswerTable,
  AvaAnswerPacket,
} from "@/lib/ava-answer/contract";
import { scrubPublicAvaAnswerText } from "@/lib/ava-answer/public-answer-scrub";
import {
  shapeAvaAnswerPacket,
  shapePublicText,
} from "@/lib/ava-answer/render-layer-shaper";

const RAW_RECORD_ID_RE =
  /\b(?:[A-Z]{2,12}-[A-Z0-9]{2,12}-\d{2,6}|[A-Z]{2,12}-\d{3,6})\b/g;
const RAW_RECORD_ID_TEST_RE =
  /\b(?:[A-Z]{2,12}-[A-Z0-9]{2,12}-\d{2,6}|[A-Z]{2,12}-\d{3,6})\b/;
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
      return "Tenant evidence";
    case "tenant-chunk":
      return "Tenant evidence";
    case "graph":
      return "Enterprise connection";
    case "corpus-pattern":
      return "Industry corpus pattern";
    case "worldview":
      return "Strategic pattern";
    case "expert-pack":
      return "Advisor pattern";
    default:
      return "Source";
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
  return value.replace(
    CONSULTANT_LABEL_RE,
    (_match, label: string) => `${label}: `,
  );
}

export function sanitizePublicText(
  value: string,
  fallback = "evidence",
): string {
  const withoutUnsafeIds = dedupeConsultantLabels(value)
    .replace(BRACKET_RECORD_RE, fallback)
    .replace(UUID_RE, fallback)
    .replace(RAW_RECORD_ID_RE, fallback)
    .replace(INTERNAL_FIELD_RE, "source field");
  const cleaned = shapePublicText(scrubPublicAvaAnswerText(withoutUnsafeIds), fallback)
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
  return sanitizePublicText(value, "evidence");
}

function sanitizeTable<T extends AnswerTable>(table: T): T {
  return {
    ...table,
    title: table.title
      ? sanitizePublicText(table.title, "Answer table")
      : table.title,
    note: table.note
      ? sanitizePublicText(table.note, "Source-supported table")
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

function sanitizeGraph<T extends AnswerGraph>(graph: T): T {
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

export function sanitizeAvaAnswerForRender(
  answer: AvaAnswerPacket,
): AvaAnswerPacket {
  return shapeAvaAnswerPacket({
    ...answer,
    directAnswer: sanitizePublicText(answer.directAnswer, ""),
    interpretation: answer.interpretation
      ? sanitizePublicText(answer.interpretation, "")
      : answer.interpretation,
    businessImplication: answer.businessImplication
      ? sanitizePublicText(answer.businessImplication, "")
      : answer.businessImplication,
    recommendation: answer.recommendation
      ? sanitizePublicText(answer.recommendation, "")
      : answer.recommendation,
    expertsUsed: (answer.expertsUsed ?? []).map((expert) => ({
      ...expert,
      name: sanitizePublicText(expert.name, "Advisor"),
    })),
    citations: answer.citations.map(sanitizeCitation),
    artifacts: answer.artifacts.map((artifact) => {
      if (artifact.artifact === "table") return sanitizeTable(artifact);
      if (artifact.artifact === "graph") return sanitizeGraph(artifact);
      return {
        ...artifact,
        title: artifact.title
          ? sanitizePublicText(artifact.title, "Answer chart")
          : artifact.title,
      };
    }),
    gaps: answer.gaps.map((gap) => ({
      ...gap,
      label: sanitizePublicText(gap.label, "Source gap"),
      detail: sanitizePublicText(gap.detail, "Source gap"),
    })),
    caveats: answer.caveats.map((caveat) => ({
      ...caveat,
      label: sanitizePublicText(caveat.label, "Caveat"),
      detail: sanitizePublicText(caveat.detail, "Caveat"),
    })),
    nextSteps: answer.nextSteps.map((action) => ({
      ...action,
      label: sanitizePublicText(action.label, "Next step"),
      rationale: action.rationale
        ? sanitizePublicText(action.rationale, "Next step rationale")
        : action.rationale,
    })),
  });
}

export const sanitizeAgentAnswerForRender = sanitizeAvaAnswerForRender;
