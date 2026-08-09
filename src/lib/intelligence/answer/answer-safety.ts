import type {
  AnswerCitation,
  AnswerGraph,
  AnswerTable,
  AvaAnswerPacket,
} from "@/lib/ava-answer/contract";
import {
  scrubPublicAvaAnswerText,
  scrubPublicAvaSourceText,
} from "@/lib/ava-answer/public-answer-scrub";
import {
  shapeAvaAnswerPacket,
  shapePublicText,
} from "@/lib/ava-answer/render-layer-shaper";
import { stripGovernedArtifactPayloadsFromText } from "@/lib/intelligence/answer/structured-fence-stream-filter";

const RAW_RECORD_ID_RE =
  /\b(?:[A-Z]{2,12}-[A-Z0-9]{2,12}-\d{2,6}|[A-Z]{2,12}-\d{3,6})\b/g;
const RAW_RECORD_ID_TEST_RE =
  /\b(?:[A-Z]{2,12}-[A-Z0-9]{2,12}-\d{2,6}|[A-Z]{2,12}-\d{3,6})\b/;
const PUBLIC_SOURCE_CONTRACT_ID_RE = /\bCTR-\d{3,6}\b/g;
const PUBLIC_SOURCE_CONTRACT_ID_TEST_RE = /\bCTR-\d{3,6}\b/;
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
  const withoutPublicBusinessIds = value.replace(
    PUBLIC_SOURCE_CONTRACT_ID_RE,
    "",
  );
  return (
    RAW_RECORD_ID_TEST_RE.test(withoutPublicBusinessIds) ||
    UUID_TEST_RE.test(withoutPublicBusinessIds) ||
    BRACKET_RECORD_TEST_RE.test(withoutPublicBusinessIds) ||
    INTERNAL_FIELD_TEST_RE.test(withoutPublicBusinessIds)
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
    .replace(RAW_RECORD_ID_RE, (match) =>
      PUBLIC_SOURCE_CONTRACT_ID_TEST_RE.test(match) ? match : fallback,
    )
    .replace(INTERNAL_FIELD_RE, "source field");
  const cleaned = shapePublicText(
    scrubPublicAvaAnswerText(withoutUnsafeIds),
    fallback,
  )
    .replace(/[ \t]{2,}/g, " ")
    .trim();
  return cleaned || fallback;
}

function sanitizePublicSourceText(
  value: string,
  fallback = "evidence",
): string {
  const withoutUnsafeIds = dedupeConsultantLabels(value)
    .replace(BRACKET_RECORD_RE, fallback)
    .replace(UUID_RE, fallback)
    .replace(RAW_RECORD_ID_RE, (match) =>
      PUBLIC_SOURCE_CONTRACT_ID_TEST_RE.test(match) ? match : fallback,
    )
    .replace(INTERNAL_FIELD_RE, "source field");
  const cleaned = shapePublicText(
    scrubPublicAvaSourceText(withoutUnsafeIds),
    fallback,
  )
    .replace(/[ \t]{2,}/g, " ")
    .trim();
  return cleaned || fallback;
}

function sanitizeUnknownForRender(value: unknown): unknown {
  if (typeof value === "string") return sanitizePublicSourceText(value);
  if (Array.isArray(value)) return value.map(sanitizeUnknownForRender);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key,
      sanitizeUnknownForRender(entry),
    ]),
  );
}

function sanitizeCitation(citation: AnswerCitation): AnswerCitation {
  const fallback = fallbackCitationLabel(citation);
  const rawLabel = citation.label || fallback;
  const publicCitation = { ...citation };
  delete publicCitation.recordId;
  return {
    ...publicCitation,
    label: containsUnsafePublicText(rawLabel)
      ? fallback
      : sanitizePublicSourceText(rawLabel, fallback),
    excerpt: citation.excerpt
      ? sanitizePublicSourceText(citation.excerpt, fallback)
      : citation.excerpt,
  };
}

function sanitizeCell(value: string | number | null): string | number | null {
  if (typeof value !== "string") return value;
  return sanitizePublicSourceText(value, "evidence");
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
  const sanitizeAnswerText = (value: string, fallback = "") =>
    stripGovernedArtifactPayloadsFromText(sanitizePublicText(value, fallback));

  return shapeAvaAnswerPacket({
    ...answer,
    directAnswer: sanitizeAnswerText(answer.directAnswer),
    interpretation: answer.interpretation
      ? sanitizeAnswerText(answer.interpretation)
      : answer.interpretation,
    businessImplication: answer.businessImplication
      ? sanitizeAnswerText(answer.businessImplication)
      : answer.businessImplication,
    recommendation: answer.recommendation
      ? sanitizeAnswerText(answer.recommendation)
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
        subtitle: artifact.subtitle
          ? sanitizePublicText(artifact.subtitle, "Answer chart")
          : artifact.subtitle,
        sourceNote: artifact.sourceNote
          ? sanitizePublicSourceText(artifact.sourceNote, "Source note")
          : artifact.sourceNote,
        data: sanitizeUnknownForRender(artifact.data),
      };
    }),
    prose: answer.prose ? sanitizeAnswerText(answer.prose) : answer.prose,
    factsUsed: answer.factsUsed.map((fact) => ({
      ...fact,
      id: sanitizePublicSourceText(fact.id, "fact"),
      label: sanitizePublicText(fact.label, "Fact"),
      value:
        typeof fact.value === "string"
          ? sanitizePublicSourceText(fact.value, "Fact")
          : fact.value,
    })),
    metricsUsed: answer.metricsUsed.map((metric) => ({
      ...metric,
      id: sanitizePublicSourceText(metric.id, "metric"),
      label: sanitizePublicText(metric.label, "Metric"),
      unit: metric.unit ? sanitizePublicText(metric.unit, "") : metric.unit,
    })),
    relationshipsUsed: answer.relationshipsUsed.map((relationship) => ({
      ...relationship,
      id: sanitizePublicSourceText(relationship.id, "relationship"),
      label: sanitizePublicText(relationship.label, "Relationship"),
      fromLabel: relationship.fromLabel
        ? sanitizePublicText(relationship.fromLabel, "Entity")
        : relationship.fromLabel,
      toLabel: relationship.toLabel
        ? sanitizePublicText(relationship.toLabel, "Entity")
        : relationship.toLabel,
      relationshipType: relationship.relationshipType
        ? sanitizePublicText(relationship.relationshipType, "relationship")
        : relationship.relationshipType,
    })),
    corpusUsed: answer.corpusUsed?.map((corpus) => ({
      ...corpus,
      id: sanitizePublicSourceText(corpus.id, "corpus"),
      label: sanitizePublicText(corpus.label, "Corpus support"),
      corpusType: corpus.corpusType
        ? sanitizePublicText(corpus.corpusType, "corpus")
        : corpus.corpusType,
    })),
    decisionFrame: sanitizeUnknownForRender(answer.decisionFrame),
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
