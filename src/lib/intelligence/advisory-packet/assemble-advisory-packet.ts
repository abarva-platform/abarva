import { createHash } from "node:crypto";
import {
  cleanIntelligenceModelInput,
  findRawModelInputLeaks,
} from "@/lib/intelligence/model-input-cleaner";
import {
  buildIntelligenceDossier,
  routeIntelligenceQuestion,
  type IntelligenceDossier,
  type IntelligenceDimension,
} from "@/lib/intelligence/dossiers";
import type { AskSource } from "@/lib/intelligence/ask/types";
import type {
  AdvisoryCorpusRole,
  AdvisoryEntity,
  AdvisoryExpertLens,
  AdvisoryExpertLensName,
  AdvisoryExpertLensRole,
  AdvisoryFact,
  AdvisoryGap,
  AdvisoryMetric,
  AdvisoryPacket,
  AdvisoryRelationship,
  AdvisoryScore,
  AdvisorySourceRef,
  AdvisoryTransformation,
  AssembleAdvisoryPacketInput,
  RawLeakageScan,
} from "./types";

const RAW_LEAK_PATTERNS: Array<[string, RegExp]> = [
  ["csv_file", /\.csv\b/i],
  ["row_label", /\bRow\s*:/i],
  ["sha_cap", /\bSHA-CAP\b/i],
  ["sha_bf", /\bSHA-BF\b/i],
  ["app_id", /\bAPP-[A-Z0-9-]+\b/i],
  ["datasets_path", /\bdatasets\//i],
  ["enterprise_reads", /\benterprise-reads\.json\b/i],
  ["raw_file_path", /(?:\/Users\/|\/private\/|[A-Za-z]:\\)/i],
  ["raw_ai_maturity", /\bai_maturity\s*:/i],
];

const LENS_ORDER: AdvisoryExpertLensName[] = [
  "CIO",
  "CFO",
  "COO",
  "CDAO",
  "CISO / risk",
  "sourcing / vendor",
  "board advisor",
  "transformation lead",
];

function compact(text: string, max = 320): string {
  const value = text.replace(/\s+/g, " ").trim();
  return value.length > max ? `${value.slice(0, max - 1).trimEnd()}…` : value;
}

function stableId(prefix: string, value: string): string {
  const hash = createHash("sha1").update(value).digest("hex").slice(0, 10);
  return `${prefix}-${hash}`;
}

function sourceCounts(sources: AskSource[]): Record<string, number> {
  return sources.reduce<Record<string, number>>((acc, source) => {
    acc[source.type] = (acc[source.type] ?? 0) + 1;
    return acc;
  }, {});
}

function sourceRefs(sources: AskSource[]): AdvisorySourceRef[] {
  return sources.map((source, index) => ({
    id: `source-${index + 1}`,
    label: source.name || source.type,
    sourceType: source.type,
    sourceId: source.id,
    confidence: source.confidence ?? null,
    modelVisibleLabel: source.name || businessSourceLabel(source.type),
  }));
}

function sourceRefIdForIndex(index: number): string[] {
  return [`source-${index + 1}`];
}

function businessSourceLabel(sourceType: AskSource["type"]): string {
  switch (sourceType) {
    case "SURFACE":
      return "Current workspace context";
    case "TENANT":
      return "Tenant enterprise evidence";
    case "GRAPH":
      return "Tenant relationship evidence";
    case "PATTERN":
      return "Industry pattern context";
    case "BENCHMARK":
      return "Benchmark context";
    case "WORLDVIEW":
      return "Advisor context";
    default:
      return `${sourceType.toLowerCase()} context`;
  }
}

function confidenceFor(
  source: AskSource | undefined,
): "high" | "medium" | "low" {
  const confidence = source?.confidence ?? 0;
  if (confidence >= 0.82) return "high";
  if (confidence >= 0.62) return "medium";
  return "low";
}

function tenantSources(sources: AskSource[]): Array<[AskSource, number]> {
  return sources
    .map((source, index): [AskSource, number] => [source, index])
    .filter(([source]) => ["SURFACE", "TENANT", "GRAPH"].includes(source.type));
}

function extractFacts(
  dossier: IntelligenceDossier,
  sources: AskSource[],
): AdvisoryFact[] {
  const sourceBySummary = tenantSources(sources);
  const facts = dossier.evidenceBoundary.tenantFacts
    .filter(Boolean)
    .slice(0, 12)
    .map((statement, index): AdvisoryFact => {
      const [, sourceIndex] = sourceBySummary[index] ??
        sourceBySummary[0] ?? [undefined, 0];
      return {
        id: `fact-${index + 1}`,
        statement: compact(statement),
        sourceRefIds: sourceRefIdForIndex(sourceIndex),
        confidence: confidenceFor(
          sourceBySummary[index]?.[0] ?? sourceBySummary[0]?.[0],
        ),
      };
    });
  return facts;
}

function entityKind(name: string): AdvisoryEntity["kind"] {
  if (
    /\b(vendor|contract|supplier|aws|ibm|sabre|sap|workday|servicenow|salesforce)\b/i.test(
      name,
    )
  )
    return "vendor";
  if (
    /\b(system|hub|service|mainframe|teradata|vantage|platform|application)\b/i.test(
      name,
    )
  )
    return "system";
  if (/\b(initiative|cockpit|program|portfolio|ai)\b/i.test(name))
    return "initiative";
  if (/\b(data|lineage|freshness|domain|product)\b/i.test(name))
    return "data-product";
  if (/\b(owner|evp|svp|cfo|cio|coo|cdao|function|operations)\b/i.test(name))
    return "function";
  if (/\b(irops|mro|dispatch|turn|recovery|planning)\b/i.test(name))
    return "capability";
  return "other";
}

function extractCandidateEntities(text: string): string[] {
  const candidates = new Set<string>();
  const properNouns =
    text.match(/\b[A-Z][A-Za-z0-9/&.-]*(?:\s+[A-Z][A-Za-z0-9/&.-]*){0,4}\b/g) ??
    [];
  for (const noun of properNouns) {
    const clean = noun.replace(/\s+/g, " ").trim();
    if (
      clean.length >= 3 &&
      !/^(The|This|That|Use|Do|No|AI|IT|ROI|KPI|CFO|CIO|COO|CDAO|Row|Raw|Loaded|Business|Current|Which AI|The Intelligence|The SkyHarbor Intelligence|CXO-readable)$/i.test(
        clean,
      )
    ) {
      candidates.add(clean);
    }
  }
  for (const phrase of [
    "IROPS recovery decisioning",
    "MRO predictive maintenance",
    "Flight planning and dispatch",
    "Airport turn management",
    "IROPS Agentic Recovery Cockpit",
    "real-time operations data",
    "Weight-SAP-Hub",
    "Slot-Sabre-Service",
    "IBM Z / mainframe operational feeds",
    "Teradata Vantage on AWS",
  ]) {
    if (text.toLowerCase().includes(phrase.toLowerCase()))
      candidates.add(phrase);
  }
  return Array.from(candidates);
}

function extractEntities(
  dossier: IntelligenceDossier,
  sources: AskSource[],
): AdvisoryEntity[] {
  const text = [
    ...dossier.evidenceBoundary.tenantFacts,
    ...dossier.tenantEvidenceDossier.sections.map((section) => section.label),
    ...dossier.tenantEvidenceDossier.metrics.map((metric) => metric.label),
  ].join("\n");
  return extractCandidateEntities(text)
    .slice(0, 18)
    .map((name, index) => ({
      id: stableId("entity", name),
      name,
      kind: entityKind(name),
      sourceRefIds: sourceRefIdForIndex(
        tenantSources(sources)[
          index % Math.max(tenantSources(sources).length, 1)
        ]?.[1] ?? 0,
      ),
    }));
}

function extractRelationships(
  dossier: IntelligenceDossier,
): AdvisoryRelationship[] {
  return dossier.tenantEvidenceDossier.relationshipPaths
    .slice(0, 10)
    .map((path, index) => ({
      id: `relationship-${index + 1}`,
      from: path.from,
      relationship: path.relationship,
      to: path.to,
      implication: compact(path.label),
      sourceRefIds: path.citationIds,
      confidence: path.confidence,
    }));
}

function extractMetrics(dossier: IntelligenceDossier): AdvisoryMetric[] {
  return dossier.tenantEvidenceDossier.metrics
    .slice(0, 10)
    .map((metric, index) => ({
      id: `metric-${index + 1}`,
      label: metric.label,
      value: metric.value,
      basis: metric.basis,
      sourceRefIds: metric.citationIds,
    }));
}

function inferredGapFromText(text: string, index: number): AdvisoryGap | null {
  const sentence =
    text
      .split(/(?<=[.!?])\s+/)
      .find((part) =>
        /\b(gap|missing|not shown|not loaded|not available|depends on|blocked by|requires|needs|without|no single accountable|does not show)\b/i.test(
          part,
        ),
      ) ?? text;
  const normalized = compact(sentence, 360);
  if (
    !/\b(gap|missing|not shown|not loaded|not available|depends on|blocked by|requires|needs|without)\b/i.test(
      normalized,
    )
  ) {
    return null;
  }
  let severity: AdvisoryGap["severity"] = "medium";
  if (
    /\b(blocked|without|critical|not available|not shown|not loaded)\b/i.test(
      normalized,
    )
  )
    severity = "high";
  if (
    /\b(no accountable|no owner|no baseline|no lineage|cannot|do not)\b/i.test(
      normalized,
    )
  )
    severity = "critical";
  return {
    id: `inferred-gap-${index + 1}`,
    statement: normalized,
    severity,
    decisionImplication:
      "Treat this as a gating caveat before approving scale, funding, or board-level claims.",
    sourceRefIds: [],
  };
}

function extractGaps(dossier: IntelligenceDossier): AdvisoryGap[] {
  const explicitGaps = dossier.tenantEvidenceDossier.gaps.map(
    (gap, index): AdvisoryGap => ({
      id: gap.id || `gap-${index + 1}`,
      statement: gap.detail || gap.label,
      severity: gap.severity,
      decisionImplication:
        gap.severity === "critical"
          ? "Do not treat the answer as tenant-proven until this gap is closed."
          : "Use as a decision caveat and validation action before scale.",
      sourceRefIds: [],
    }),
  );
  const boundaryGaps = dossier.evidenceBoundary.missingTenantEvidence
    .filter(
      (gap) =>
        !explicitGaps.some((existing) => existing.statement.includes(gap)),
    )
    .map((gap, index): AdvisoryGap => ({
      id: `boundary-gap-${index + 1}`,
      statement: gap,
      severity: "medium",
      decisionImplication:
        "Confirm this input before using the answer in a board or funding decision.",
      sourceRefIds: [],
    }));
  const factGaps = dossier.evidenceBoundary.tenantFacts
    .map(inferredGapFromText)
    .filter((gap): gap is AdvisoryGap => Boolean(gap))
    .filter(
      (gap) =>
        !explicitGaps.some(
          (existing) => existing.statement === gap.statement,
        ) &&
        !boundaryGaps.some((existing) => existing.statement === gap.statement),
    );
  return [...explicitGaps, ...boundaryGaps, ...factGaps].slice(0, 12);
}

export function classifyCorpusRole(
  question: string,
  dossier: IntelligenceDossier,
): AdvisoryCorpusRole {
  const normalized = question.toLowerCase();
  if (
    /\b(who owns|actual fy|current budget|exact headcount|our contract|renewal date)\b/.test(
      normalized,
    )
  )
    return "NONE_NEEDED";
  if (
    /\b(peer|benchmark|industry|market|case stud|pattern|maturity)\b/.test(
      normalized,
    )
  ) {
    return dossier.corpusPatternDossier.patternsIncluded.length > 0
      ? "CRITICAL"
      : "MISSING";
  }
  if (
    /\b(irops|investment|prioriti|governance|risk|vendor|sourcing|data readiness|scale|hold|kill)\b/.test(
      normalized,
    )
  ) {
    return dossier.corpusPatternDossier.patternsIncluded.length > 0
      ? "HELPFUL"
      : "MISSING";
  }
  return dossier.corpusPatternDossier.patternsIncluded.length > 0
    ? "HELPFUL"
    : "NONE_NEEDED";
}

function corpusContext(
  dossier: IntelligenceDossier,
  role: AdvisoryCorpusRole,
): AdvisoryPacket["modelVisiblePacket"]["corpusContext"] {
  return dossier.corpusPatternDossier.patternsIncluded
    .flatMap((family) =>
      family.patterns.map((pattern) => ({
        id: pattern.patternId,
        label: pattern.title,
        summary: `${pattern.summary} This is industry/pattern context, not a tenant fact.`,
        role,
        tenantBoundary: "industry_context_not_tenant_fact" as const,
        sourceRefIds: pattern.citationIds,
      })),
    )
    .slice(0, 8);
}

function expertDemandForQuestion(
  question: string,
): Record<AdvisoryExpertLensName, AdvisoryExpertLensRole> {
  const q = question.toLowerCase();
  const demand = Object.fromEntries(
    LENS_ORDER.map((lens) => [lens, "NOT_NEEDED"]),
  ) as Record<AdvisoryExpertLensName, AdvisoryExpertLensRole>;
  if (/\b(fund|funding|roi|value|budget|cost|savings|tco|npv)\b/.test(q))
    demand.CFO = "REQUIRED";
  if (/\b(data|lineage|quality|readiness|analytics|ai)\b/.test(q))
    demand.CDAO = demand.CDAO === "REQUIRED" ? "REQUIRED" : "HELPFUL";
  if (
    /\b(system|architecture|integration|application|mainframe|platform|technology)\b/.test(
      q,
    )
  )
    demand.CIO = "REQUIRED";
  if (
    /\b(operation|irops|mro|crew|dispatch|airport|workflow|process)\b/.test(q)
  )
    demand.COO = "REQUIRED";
  if (
    /\b(risk|governance|control|compliance|security|audit|legal|regulatory)\b/.test(
      q,
    )
  )
    demand["CISO / risk"] = "REQUIRED";
  if (/\b(vendor|sourcing|rfp|contract|supplier|commercial|bafo)\b/.test(q))
    demand["sourcing / vendor"] = "REQUIRED";
  if (/\b(board|executive|cxo|ceo|memo|readout)\b/.test(q))
    demand["board advisor"] = "REQUIRED";
  if (/\b(transform|roadmap|sequence|change|operating model)\b/.test(q))
    demand["transformation lead"] = "REQUIRED";
  for (const lens of LENS_ORDER) {
    if (
      demand[lens] === "NOT_NEEDED" &&
      /\b(invest|prioriti|scale|hold|kill|strategy)\b/.test(q)
    ) {
      if (["CIO", "CFO", "COO", "CDAO"].includes(lens))
        demand[lens] = "HELPFUL";
    }
  }
  return demand;
}

function expertLenses(
  question: string,
  dossier: IntelligenceDossier,
): AdvisoryExpertLens[] {
  const demand = expertDemandForQuestion(question);
  const selected = LENS_ORDER.filter(
    (lens) => demand[lens] === "REQUIRED" || demand[lens] === "HELPFUL",
  );
  const selectedOrRoute =
    selected.length > 0
      ? selected
      : dossier.relatedDimensions.includes("risk_compliance")
        ? (["CIO", "CISO / risk"] as AdvisoryExpertLensName[])
        : (["CIO", "CFO"] as AdvisoryExpertLensName[]);
  return selectedOrRoute.slice(0, 7).map((lens) => ({
    id: stableId("lens", `${lens}:${question}`),
    lens,
    role: demand[lens] === "NOT_NEEDED" ? "HELPFUL" : demand[lens],
    whySelected: whyLensSelected(lens),
    pressureTest: pressureTestForLens(lens),
  }));
}

function whyLensSelected(lens: AdvisoryExpertLensName): string {
  switch (lens) {
    case "CFO":
      return "Pressure-test value, funding source, benefit proof, and unsupported ROI.";
    case "COO":
      return "Pressure-test operating workflow, adoption, service impact, and accountable execution.";
    case "CDAO":
      return "Pressure-test data readiness, lineage, ownership, freshness, and AI substrate gates.";
    case "CISO / risk":
      return "Pressure-test controls, auditability, compliance, and risk caveats.";
    case "sourcing / vendor":
      return "Pressure-test vendor leverage, contract evidence, renewal, and sourcing implications.";
    case "board advisor":
      return "Pressure-test executive clarity, decision required, and board-safe caveats.";
    case "transformation lead":
      return "Pressure-test sequencing, ownership, change load, and delivery risks.";
    case "CIO":
    default:
      return "Pressure-test architecture, system dependencies, integration, and technology feasibility.";
  }
}

function pressureTestForLens(lens: AdvisoryExpertLensName): string {
  switch (lens) {
    case "CFO":
      return "What measured baseline, target, and value-capture method support the recommendation?";
    case "COO":
      return "Which operating owner and workflow control must change before scale?";
    case "CDAO":
      return "Which governed data products, freshness SLAs, and lineage controls are proven versus missing?";
    case "CISO / risk":
      return "What control, audit, compliance, or human-approval gate prevents unsafe automation?";
    case "sourcing / vendor":
      return "What commercial leverage, dependency, or vendor evidence changes the decision?";
    case "board advisor":
      return "What decision is required now, and what caveat would matter in a board paper?";
    case "transformation lead":
      return "What sequence, owner, and dependency path lowers execution risk?";
    case "CIO":
    default:
      return "Which systems, integrations, and lifecycle constraints govern feasibility?";
  }
}

function benchmarkContext(
  dossier: IntelligenceDossier,
): AdvisoryPacket["modelVisiblePacket"]["benchmarkContext"] {
  return dossier.benchmarkDossier.benchmarkSources
    .slice(0, 6)
    .map((source, index) => ({
      id: source.id || `benchmark-${index + 1}`,
      claim: source.claim,
      basis: source.source,
      caveat: source.caveat,
      sourceRefIds: source.citationIds,
    }));
}

function outputInstructions(question: string): string[] {
  const instructions = [
    "Start with the direct executive answer.",
    "Use tenant facts first; distinguish corpus or benchmark context from tenant facts.",
    "Put caveats and missing evidence after the useful answer.",
    "Do not expose raw IDs, storage names, file names, table names, route names, or debug labels.",
    "Do not fabricate ROI, dates, dollars, vendors, owners, or commercial terms.",
  ];
  if (
    /\b(table|chart|graph|visual|rank|compare|breakdown|show me)\b/i.test(
      question,
    )
  ) {
    instructions.push(
      "Include one compact Markdown table or chart-ready table when the packet contains enough rows.",
    );
  }
  if (/\b(evidence|source|proof|trace)\b/i.test(question)) {
    instructions.push(
      "Include human-readable evidence context; do not expose raw lineage.",
    );
  }
  return instructions;
}

function transformations(): AdvisoryTransformation[] {
  return [
    {
      id: "dossier-to-model-visible",
      description:
        "Converted IntelligenceDossier sections into business-language model-visible packet sections.",
      inputRefIds: ["source-dossier"],
      outputSection: "tenantFacts",
    },
    {
      id: "raw-lineage-separated",
      description:
        "Preserved raw source references in auditLineage while excluding them from modelVisiblePacket.",
      inputRefIds: ["source-refs"],
      outputSection: "outputInstructions",
    },
  ];
}

function scanRawLeakage(value: unknown): RawLeakageScan {
  const serialized =
    typeof value === "string" ? value : JSON.stringify(value, null, 2);
  const hits = RAW_LEAK_PATTERNS.flatMap(([kind, pattern]) => {
    const match = serialized.match(pattern);
    return match ? [{ kind, value: match[0] ?? kind }] : [];
  });
  for (const kind of findRawModelInputLeaks(serialized)) {
    if (!hits.some((hit) => hit.kind === kind))
      hits.push({ kind, value: kind });
  }
  return { passed: hits.length === 0, hits };
}

function scoreRichness(
  packet: Pick<AdvisoryPacket, "modelVisiblePacket">,
): AdvisoryScore {
  const model = packet.modelVisiblePacket;
  const hasFacts = model.tenantFacts.length > 0;
  const hasEntities = model.entities.length > 0;
  const hasRelationships = model.relationships.length > 0;
  const hasGaps = model.gaps.length > 0;
  const hasMetrics = model.metrics.length > 0;
  const hasCorpus = model.corpusContext.length > 0;
  const hasLenses = model.expertLenses.length > 0;
  if (
    hasFacts &&
    hasEntities &&
    hasRelationships &&
    hasMetrics &&
    hasCorpus &&
    hasLenses &&
    hasGaps
  )
    return 5;
  if (hasFacts && hasEntities && hasRelationships && hasGaps) return 4;
  if (hasFacts && hasEntities) return 3;
  if (hasFacts) return 2;
  return 1;
}

function scoreEvidenceIntegrity(input: {
  modelVisiblePacket: AdvisoryPacket["modelVisiblePacket"];
  auditLineage: AdvisoryPacket["auditLineage"];
  rawLeakageScan: RawLeakageScan;
}): AdvisoryScore {
  if (!input.rawLeakageScan.passed) return 2;
  const hasLineage = input.auditLineage.sourceRefs.length > 0;
  const hasFacts = input.modelVisiblePacket.tenantFacts.length > 0;
  const hasGaps = input.modelVisiblePacket.gaps.length > 0;
  const hasMetricsOrRelationships =
    input.modelVisiblePacket.metrics.length > 0 ||
    input.modelVisiblePacket.relationships.length > 0;
  if (hasLineage && hasFacts && hasGaps && hasMetricsOrRelationships) return 5;
  if (hasLineage && hasFacts && hasGaps) return 4;
  if (hasFacts && hasGaps) return 3;
  if (hasFacts) return 2;
  return 1;
}

function dimensionsCovered(
  dossier: IntelligenceDossier,
): IntelligenceDimension[] {
  return Array.from(
    new Set([dossier.primaryDimension, ...dossier.relatedDimensions]),
  );
}

function dimensionsMissing(dossier: IntelligenceDossier): string[] {
  const covered = new Set(dimensionsCovered(dossier));
  return dossier.relatedDimensions.filter(
    (dimension) => !covered.has(dimension),
  );
}

function recommendedImprovementFor(
  score: AdvisoryScore,
  role: AdvisoryCorpusRole,
): string {
  if (score >= 4)
    return "Ready for live answer regression; verify model output and renderer preservation.";
  if (role === "MISSING")
    return "Add corpus/pattern context or classify the question as tenant-only before live use.";
  return "Add specific tenant facts, relationships, metrics, and named gaps before treating this as V1-ready.";
}

export function assembleAdvisoryPacket(
  input: AssembleAdvisoryPacketInput,
): AdvisoryPacket {
  const tenantKey = input.tenantKey ?? "unknown-tenant";
  const tenantName = input.tenantName ?? tenantKey;
  const normalizedQuestion = input.question.replace(/\s+/g, " ").trim();
  const dossier = buildIntelligenceDossier({
    tenantKey,
    tenantName,
    question: normalizedQuestion,
    classification: input.classification,
    sources: input.sources,
  });
  const route = routeIntelligenceQuestion({
    tenantKey,
    question: normalizedQuestion,
  });
  const refs = sourceRefs(input.sources);
  const corpusRole = classifyCorpusRole(normalizedQuestion, dossier);
  const modelVisiblePacket = cleanIntelligenceModelInput({
    tenantFacts: extractFacts(dossier, input.sources),
    entities: extractEntities(dossier, input.sources),
    relationships: extractRelationships(dossier),
    metrics: extractMetrics(dossier),
    gaps: extractGaps(dossier),
    corpusContext: corpusContext(dossier, corpusRole),
    expertLenses: expertLenses(normalizedQuestion, dossier),
    benchmarkContext: benchmarkContext(dossier),
    outputInstructions: outputInstructions(normalizedQuestion),
  });
  const sanitizedModelVisiblePacket = cleanIntelligenceModelInput(
    JSON.parse(
      JSON.stringify(modelVisiblePacket).replace(
        /\bdatasets\/(?:source file)?/gi,
        "source material",
      ),
    ) as AdvisoryPacket["modelVisiblePacket"],
  );
  const auditLineage = {
    sourceRefs: refs,
    hiddenRawRefs: input.sources.map((source) => ({
      type: source.type,
      id: source.id,
      name: source.name,
      confidence: source.confidence,
    })),
    transformations: transformations(),
    sourceDossier: dossier,
  };
  const rawLeakageScan = scanRawLeakage(sanitizedModelVisiblePacket);
  const richnessScore = scoreRichness({
    modelVisiblePacket: sanitizedModelVisiblePacket,
  });
  const evidenceIntegrityScore = scoreEvidenceIntegrity({
    modelVisiblePacket: sanitizedModelVisiblePacket,
    auditLineage,
    rawLeakageScan,
  });
  const expertLensDemand = expertDemandForQuestion(normalizedQuestion);

  return {
    packetId: stableId(
      "advisory-packet",
      `${tenantKey}:${normalizedQuestion}:${input.createdAt ?? ""}`,
    ),
    createdAt: input.createdAt ?? new Date().toISOString(),
    tenantIdentity: {
      tenantKey,
      tenantName,
      industry: input.industry ?? undefined,
      vertical: input.vertical ?? undefined,
      aliases: input.aliases ?? [],
    },
    questionIntent: {
      originalQuestion: input.question,
      normalizedQuestion,
      intent: dossier.intelligenceIntent,
      category: input.category ?? route.intelligenceIntent,
      selectedDimensions: dimensionsCovered(dossier),
      selectedLenses: expertLenses(normalizedQuestion, dossier).map(
        (lens) => lens.lens,
      ),
    },
    modelVisiblePacket: sanitizedModelVisiblePacket,
    auditLineage,
    retrievalDiagnostics: {
      retrievalMode: "advisory-packet-v1",
      sourceCounts: sourceCounts(input.sources),
      dimensionsCovered: dimensionsCovered(dossier),
      dimensionsMissing: dimensionsMissing(dossier),
      rawLeakageScan,
      richnessScore,
      evidenceIntegrityScore,
      corpusRole,
      expertLensDemand,
      genericContextFlag: richnessScore <= 3,
      biggestMissingInput:
        sanitizedModelVisiblePacket.gaps[0]?.statement ??
        (corpusRole === "MISSING"
          ? "Required corpus context was not available."
          : undefined),
      recommendedImprovement: recommendedImprovementFor(
        richnessScore,
        corpusRole,
      ),
      notes: dossier.qualityFlags,
    },
  };
}

export function advisoryPacketModelVisibleJson(packet: AdvisoryPacket): string {
  return JSON.stringify(packet.modelVisiblePacket, null, 2);
}

export function advisoryPacketForClientEvent(
  packet: AdvisoryPacket,
  includeAuditLineage = false,
): AdvisoryPacket {
  if (includeAuditLineage) return packet;
  return {
    ...packet,
    auditLineage: {
      sourceRefs: packet.auditLineage.sourceRefs,
      transformations: packet.auditLineage.transformations,
    },
  };
}
