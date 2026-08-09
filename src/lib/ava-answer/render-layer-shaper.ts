import type {
  AnswerCitation,
  AnswerGraph,
  AnswerTable,
  AvaAnswerPacket,
} from "@/lib/ava-answer/contract";

const RAW_ID_RE =
  /\b(?:[A-Z]{2,16}-[A-Z0-9]{2,24}-\d{2,8}|[A-Z]{2,12}-\d{3,6})\b|\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi;
const RAW_ID_TEST_RE =
  /\b(?:[A-Z]{2,16}-[A-Z0-9]{2,24}-\d{2,8}|[A-Z]{2,12}-\d{3,6})\b|\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i;
const PUBLIC_SOURCE_CONTRACT_ID_RE = /\bCTR-\d{3,6}\b/;
const SNAKE_CASE_RE = /\b[a-z]+(?:_[a-z0-9]+){1,}\b/g;
const SNAKE_CASE_TEST_RE = /\b[a-z]+(?:_[a-z0-9]+){1,}\b/;
const INTERNAL_PHRASE_RE =
  /\b(tenant excerpt|source support|supporting material|source-supported|business objects|Entity|Source reference|source rows?|edge rows?|relationship paths?|relationship maps?|semantic packet|composer packet|quality gate|answer boundary|fragment lookup|binder|dossier|no blocking gap)\b/i;

const BUSINESS_LABELS: Record<string, string> = {
  applications_core_systems: "Applications & Core Systems",
  application_systems: "Applications & Core Systems",
  ai_automation_footprint: "AI & Automation",
  benefits_realization: "Benefits Realization",
  business_operating_model: "Business Operating Model",
  business_org_functions: "Business Functions",
  data_analytics_estate: "Data & Analytics Estate",
  dimension_coverage: "Context Coverage",
  gap_register: "Known Gaps",
  home_read_model: "Home Context View",
  infrastructure_cloud: "Infrastructure & Cloud",
  integrations_interfaces: "Integrations & Interfaces",
  initiatives_roadmap: "Initiatives & Roadmap",
  it_budget_financials: "IT Budget & Financials",
  it_org_ownership: "IT Organization & Ownership",
  organization_leadership: "Organization & Leadership",
  operations_process: "Operations & Process",
  relationship_graph: "Operating Connections",
  security_compliance: "Security & Compliance",
  vendors_contracts: "Vendors & Contracts",
  workforce_personas: "Workforce & Personas",
};

const INTERNAL_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bThe supporting supporting material is that\s+/gi, ""],
  [/\bThe supporting evidence is that\s+/gi, ""],
  [/\bThe evidence is that\s+/gi, ""],
  [/\bThat means The\b/g, "That means the"],
  [/\btenant excerpt\b/gi, ""],
  [/\bsource support\b/gi, "business context"],
  [/\bsupporting material\b/gi, "business context"],
  [/\bsource-supported\b/gi, "business-context-backed"],
  [/\bbusiness objects\b/gi, "business areas"],
  [/\bSource reference\b/gi, "Source"],
  [/\bsource rows?\b/gi, "source records"],
  [/\bedge rows?\b/gi, "connection records"],
  [/\brelationship paths?\b/gi, "operating connections"],
  [/\brelationship maps?\b/gi, "operating connections"],
  [/\bfragment lookup\b/gi, "narrow lookup"],
  [/\bno blocking gap\b/gi, "no specific gap"],
  [/\bdossier\b/gi, "context file"],
  [/\bbinder\b/gi, "context file"],
  [/\bsemantic packet\b/gi, "answer packet"],
  [/\bcomposer packet\b/gi, "answer packet"],
  [/\bquality gate\b/gi, "quality check"],
  [/\banswer boundary\b/gi, "answer scope"],
];

const EVIDENCE_BOUNDARY_PARAGRAPH_RE =
  /^\s*Evidence boundary:\s*.+(?:\n(?!\s*$).*)*$/gim;

function replaceRawIds(value: string, replacement: string): string {
  return value.replace(RAW_ID_RE, (match) =>
    PUBLIC_SOURCE_CONTRACT_ID_RE.test(match) ? match : replacement,
  );
}

function dedupeEvidenceBoundaryParagraphs(text: string): string {
  const seen = new Set<string>();
  return text
    .replace(EVIDENCE_BOUNDARY_PARAGRAPH_RE, (paragraph) => {
      const key = paragraph.replace(/\s+/g, " ").trim().toLowerCase();
      if (seen.has(key)) return "";
      seen.add(key);
      return paragraph.trim();
    })
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function businessLabel(value: unknown, fallback = "Business context"): string {
  const raw = String(value ?? "").trim();
  if (!raw) return fallback;
  const known = BUSINESS_LABELS[raw.toLowerCase()];
  if (known) return known;
  const cleaned = replaceRawIds(raw, "source")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return fallback;
  return cleaned
    .split(" ")
    .map((part) =>
      /^(AI|API|BI|CIO|CMDB|ERP|GL|HR|IT|KPI|ML|SOX)$/i.test(part)
        ? part.toUpperCase()
        : part.charAt(0).toUpperCase() + part.slice(1),
    )
    .join(" ");
}

export function shapePublicText(value: unknown, fallback = ""): string {
  let text = String(value ?? "").trim();
  if (!text) return fallback;
  for (const [pattern, replacement] of INTERNAL_REPLACEMENTS) {
    text = text.replace(pattern, replacement);
  }
  text = replaceRawIds(text, "source")
    .replace(SNAKE_CASE_RE, (match) => businessLabel(match))
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  text = dedupeEvidenceBoundaryParagraphs(text);
  return text || fallback;
}

export function sourceClassDisplayLabel(
  sourceClass: AnswerCitation["sourceClass"] | string | undefined,
): string {
  switch (sourceClass) {
    case "tenant-fact":
      return "Tenant evidence";
    case "tenant-chunk":
      return "";
    case "graph":
      return "Operating connection";
    case "corpus-pattern":
      return "Industry pattern";
    case "worldview":
      return "Strategic pattern";
    case "expert-pack":
      return "Advisory pattern";
    default:
      return "Source";
  }
}

export function shapeCitationLabel(citation: AnswerCitation): string {
  const shaped = shapePublicText(citation.label, "");
  if (!shaped || /^source$/i.test(shaped) || /^supporting source$/i.test(shaped)) {
    return sourceClassDisplayLabel(citation.sourceClass) || "Tenant evidence";
  }
  const words = shaped.split(/\s+/).filter(Boolean);
  if (words.length <= 5 && shaped === shaped.toLowerCase()) {
    return businessLabel(shaped);
  }
  return shaped;
}

export function compactCitations<T extends AnswerCitation>(
  citations: readonly T[],
  max = 6,
): T[] {
  const seen = new Set<string>();
  const compact: T[] = [];
  for (const citation of citations) {
    const label = shapeCitationLabel(citation);
    const key = `${label}:${citation.sourceClass}`;
    if (!label || seen.has(key)) continue;
    seen.add(key);
    compact.push({
      ...citation,
      label,
      excerpt: citation.excerpt ? shapePublicText(citation.excerpt, "") : citation.excerpt,
    });
    if (compact.length >= max) break;
  }
  return compact;
}

export function shouldDropZeroCoverageRow(row: Record<string, unknown>): boolean {
  const values = Object.entries(row);
  const hasCoverageKey = values.some(([key]) =>
    /record|count|source|citation|relationship|fact|gap/i.test(key),
  );
  if (!hasCoverageKey) return false;
  const numericValues = values
    .filter(([key]) => /record|count|source|citation|relationship|fact/i.test(key))
    .map(([, value]) => Number(value))
    .filter((value) => Number.isFinite(value));
  return numericValues.length > 0 && numericValues.every((value) => value === 0);
}

function shapeTable<T extends AnswerTable>(table: T): T {
  return {
    ...table,
    title: shapePublicText(table.title, "Answer table"),
    note: table.note ? shapePublicText(table.note, "") : table.note,
    columns: table.columns.map((column) => ({
      ...column,
      key: column.key,
      label: businessLabel(column.label, "Column"),
    })),
    rows: table.rows
      .filter((row) => !shouldDropZeroCoverageRow(row))
      .map((row) =>
        Object.fromEntries(
          Object.entries(row).map(([key, value]) => [
            key,
            typeof value === "string" ? shapePublicText(value, "") : value,
          ]),
        ),
      ),
  };
}

function shapeGraph<T extends AnswerGraph>(graph: T): T {
  const idMap = new Map(graph.nodes.map((node, index) => [node.id, `node-${index + 1}`]));
  return {
    ...graph,
    title: shapePublicText(graph.title, "Relationship graph"),
    nodes: graph.nodes.map((node, index) => ({
      ...node,
      id: `node-${index + 1}`,
      label: shapePublicText(node.label, "Business area"),
      kind: node.kind ? businessLabel(node.kind) : node.kind,
    })),
    edges: graph.edges.map((edge) => ({
      ...edge,
      from: idMap.get(edge.from) ?? "node-1",
      to: idMap.get(edge.to) ?? "node-1",
      label: edge.label ? shapePublicText(edge.label, "connects to") : edge.label,
      kind: edge.kind ? businessLabel(edge.kind) : edge.kind,
    })),
  };
}

function withoutArtifact<T extends { artifact: string }>(
  artifact: T,
): Omit<T, "artifact"> {
  const copy = { ...artifact } as Partial<T>;
  delete copy.artifact;
  return copy as Omit<T, "artifact">;
}

export function shapeAvaAnswerPacket(answer: AvaAnswerPacket): AvaAnswerPacket {
  const artifacts = answer.artifacts.map((artifact) => {
    if (artifact.artifact === "table") return shapeTable(artifact);
    if (artifact.artifact === "graph") return shapeGraph(artifact);
    return {
      ...artifact,
      title: artifact.title ? shapePublicText(artifact.title, "Answer chart") : artifact.title,
    };
  });
  const citations = compactCitations(answer.citations);
  return {
    ...answer,
    directAnswer: shapePublicText(answer.directAnswer, ""),
    prose: answer.prose ? shapePublicText(answer.prose, "") : answer.prose,
    interpretation: answer.interpretation
      ? shapePublicText(answer.interpretation, "")
      : answer.interpretation,
    businessImplication: answer.businessImplication
      ? shapePublicText(answer.businessImplication, "")
      : answer.businessImplication,
    recommendation: answer.recommendation
      ? shapePublicText(answer.recommendation, "")
      : answer.recommendation,
    artifacts,
    tables: artifacts
      .filter((artifact) => artifact.artifact === "table")
      .map(withoutArtifact),
    charts: artifacts
      .filter((artifact) => artifact.artifact === "chart")
      .map(withoutArtifact),
    graphs: artifacts
      .filter((artifact) => artifact.artifact === "graph")
      .map(withoutArtifact),
    citations,
    gaps: answer.gaps.map((gap) => ({
      ...gap,
      label: shapePublicText(gap.label, "Gap"),
      detail: shapePublicText(gap.detail, "Gap detail"),
    })),
    caveats: answer.caveats.map((caveat) => ({
      ...caveat,
      label: shapePublicText(caveat.label, "Caveat"),
      detail: shapePublicText(caveat.detail, "Caveat detail"),
    })),
    nextSteps: answer.nextSteps.map((step) => ({
      ...step,
      label: shapePublicText(step.label, "Next step"),
      rationale: step.rationale ? shapePublicText(step.rationale, "") : step.rationale,
    })),
  };
}

export function renderedLayerLeakIssues(text: string): string[] {
  const issues: string[] = [];
  if (/tenant excerpt/i.test(text)) issues.push("tenant_excerpt");
  if (RAW_ID_TEST_RE.test(text)) issues.push("raw_id");
  if (SNAKE_CASE_TEST_RE.test(text)) issues.push("snake_case");
  if (INTERNAL_PHRASE_RE.test(text)) issues.push("machine_vocab");
  return [...new Set(issues)];
}
