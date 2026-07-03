import type {
  HomeKnowAnswerStatus,
  HomeKnowCitation,
  HomeKnowFact,
  HomeKnowGap,
  HomeKnowHandoff,
  HomeKnowIntent,
  HomeKnowResponse,
  HomeKnowSafety,
  HomeKnowTable,
} from "@/lib/home/know/home-know-contract";
import type { answerHomeKnowFromV7 } from "@/lib/home/know/v7-home-ask";

type V7HomeAskResult = Awaited<ReturnType<typeof answerHomeKnowFromV7>>;

const CLIENT_FRIENDLY_NAME_BY_TENANT: Record<string, string> = {
  "apex-retail": "Apex Retail Group",
  "first-capital": "First Capital Financial",
  "first-capital-financial": "First Capital Financial",
  "lakeshore-holdings": "Lakeshore Holdings",
  "lakeshore-industries": "Lakeshore Holdings",
  "meridian-health": "Meridian Health",
  "skyharbor-air": "SkyHarbor Air Group",
};

export function toHomeKnowResponseFromV7(
  result: V7HomeAskResult,
  input?: { question?: string | null },
): HomeKnowResponse {
  const answer = result.answer;
  const trace = traceFor(result);
  const table = toHomeKnowTable(result);
  const citations = answer.citations.map(toHomeKnowCitation);
  const citationIds = citations.map((citation) => citation.id);
  const gaps = toHomeKnowGaps(result, citationIds);
  const facts = toHomeKnowFacts(result, citationIds);
  const answerStatus = answerStatusFor(result);
  const intent = intentFor(result, answerStatus, table, gaps);

  return {
    mode: "KNOW",
    tenantKey: result.tenant.canonicalKey,
    question: input?.question ?? trace?.session.question ?? "",
    intent,
    answerStatus,
    artifactStatus: artifactStatusFor({
      question: input?.question ?? trace?.session.question ?? "",
      intent,
      table,
      gaps,
    }),
    prose: clientFriendlyProse(answer.directAnswer, result.tenant.canonicalKey),
    dimensionsUsed: [
      publicDimensionId(answer.primaryDimension),
      ...answer.relatedDimensions
        .filter((dimension) => dimension !== answer.primaryDimension)
        .map(publicDimensionId),
    ],
    facts,
    tables: table ? [table] : [],
    charts: [],
    graphs: [],
    gaps,
    conflicts: [],
    citations,
    handoff: toHomeKnowHandoff(result),
    answerability: answer.answerBoundary.handoffTarget
      ? `requires_${answer.answerBoundary.handoffTarget}` as HomeKnowResponse["answerability"]
      : gaps.length
        ? "answerable_with_caveat"
        : "answerable_from_loaded_context",
    safety: toHomeKnowSafety(result, {
      answerStatus,
      factsBound: facts.length,
      tablesBound: table ? 1 : 0,
      citationsBound: citations.length,
      gapsBound: gaps.length,
    }),
  };
}

function artifactStatusFor(input: {
  question: string;
  intent: HomeKnowIntent;
  table: HomeKnowTable | null;
  gaps: HomeKnowGap[];
}): NonNullable<HomeKnowResponse["artifactStatus"]> {
  const visualRequested =
    input.intent === "table" ||
    input.intent === "chart" ||
    /\b(table|chart|graph|visual|visuali[sz]e|plot|diagram)\b/i.test(
      input.question,
    );
  if (!visualRequested) return "not_requested";
  if (input.table && input.table.rows.length > 0) return "rendered";
  if (input.gaps.length > 0) return "unavailable_named_gap";
  return "recommended_not_rendered";
}

function answerStatusFor(result: V7HomeAskResult): HomeKnowAnswerStatus {
  if (!result.proof.qualityGate.passed) return "blocked";
  if (result.answer.answerBoundary.handoffTarget) return "handoff";
  if (result.answer.gaps.length > 0) return "partial";
  return "answered";
}

function intentFor(
  result: V7HomeAskResult,
  answerStatus: HomeKnowAnswerStatus,
  table: HomeKnowTable | null,
  gaps: HomeKnowGap[],
): HomeKnowIntent {
  if (answerStatus === "handoff") return "decision_handoff";
  if (table) return "table";
  if (gaps.length > 0) return "gap";
  const trace = traceFor(result);
  if (/available|loaded|context|show/i.test(trace?.session.question ?? "")) {
    return "browse";
  }
  return "lookup";
}

function toHomeKnowCitation(
  citation: V7HomeAskResult["answer"]["citations"][number],
  index: number,
): HomeKnowCitation {
  const label = businessEvidenceLabel(citation.label);
  return {
    id: citationId(index),
    label,
    sourceClass: "tenant-source-file",
    sourceFile: citation.label,
    sourceRowNumber: null,
    recordId: null,
    excerpt: `${citation.count} source evidence item${
      citation.count === 1 ? "" : "s"
    } selected from ${label.toLowerCase()}.`,
    confidence: "high",
  };
}

function toHomeKnowTable(result: V7HomeAskResult): HomeKnowTable | null {
  const table = result.answer.table;
  if (!table) return null;
  const citationIds = result.answer.citations.map((_citation, index) =>
    citationId(index),
  );
  return {
    id: `home-v7-${slug(result.answer.primaryDimension)}-table`,
    title: `${humanize(result.answer.primaryDimension)} loaded facts`,
    dimensionId: publicDimensionId(result.answer.primaryDimension),
    columns: table.headers.map((header, index) => ({
      key: `c${index}`,
      label: header,
      align: "left",
      format: "text",
    })),
    rows: table.rows.map((row) =>
      Object.fromEntries(row.map((cell, index) => [`c${index}`, cell])),
    ),
    citationIds,
    note: "Current governed source evidence. Evidence gaps stay visible instead of becoming confidence scores.",
  };
}

function toHomeKnowFacts(
  result: V7HomeAskResult,
  citationIds: string[],
): HomeKnowFact[] {
  const table = result.answer.table;
  if (!table) return [];
  const facts: HomeKnowFact[] = [];
  for (const [rowIndex, row] of table.rows.entries()) {
    for (const [cellIndex, value] of row.entries()) {
      if (!value || value === "Needs evidence") continue;
      facts.push({
        id: `home-v7-fact-${rowIndex + 1}-${cellIndex + 1}`,
        dimensionId: publicDimensionId(result.answer.primaryDimension),
        label: table.headers[cellIndex] ?? `Column ${cellIndex + 1}`,
        value,
        citationIds,
      });
      if (facts.length >= 24) return facts;
    }
  }
  return facts;
}

function toHomeKnowGaps(
  result: V7HomeAskResult,
  citationIds: string[],
): HomeKnowGap[] {
  return result.answer.gaps.map((gap, index) => ({
    id: `home-v7-gap-${index + 1}`,
    dimensionId: publicDimensionId(result.answer.primaryDimension),
    objectType: "source_evidence_gap",
    expectedField: slug(gap.label),
    displayLabel: gap.label,
    severity: index === 0 ? "high" : "medium",
    message: [gap.impact, gap.remediation].filter(Boolean).join(" "),
    citationIds,
  }));
}

function toHomeKnowHandoff(result: V7HomeAskResult): HomeKnowHandoff | null {
  const target = result.answer.answerBoundary.handoffTarget;
  if (!target) return null;
  const supported = isSupportedHandoffTarget(target) ? target : null;
  return {
    target: supported,
    label: supported ? `Open ${surfaceName(supported)}` : `Use ${surfaceName(target)}`,
    reason:
      result.answer.answerBoundary.handoffReason ??
      `${surfaceName(target)} owns the next decision step.`,
  };
}

function toHomeKnowSafety(
  result: V7HomeAskResult,
  counts: {
    answerStatus: HomeKnowAnswerStatus;
    factsBound: number;
    tablesBound: number;
    citationsBound: number;
    gapsBound: number;
  },
): HomeKnowSafety {
  const trace = traceFor(result);
  const evidenceChannels: NonNullable<HomeKnowSafety["evidenceChannels"]> = {
    facts: counts.factsBound,
    tables: counts.tablesBound,
    charts: 0,
    graphs: 0,
    citations: counts.citationsBound,
    sourceCoverage: result.answer.sourceFamiliesIncluded.length,
    sections: 0,
    rollups: 0,
    relationshipPaths: 0,
    metrics: 0,
    gaps: counts.gapsBound,
  };

  return {
    serverValidated: true,
    blockedExperts: true,
    blockedDecisionFrames: true,
    blockedInternalCodes: true,
    unsupportedClaimsRemoved: 0,
    frontendTripwireShouldFire: !result.proof.qualityGate.passed,
    usableEvidence: result.proof.selectedRows > 0,
    evidenceStatus:
      result.proof.selectedRows > 0 ? "usable_dossier" : "empty_dossier",
    evidenceReason: `V7 Azure schema ${result.tenant.datasetDir}; old semantic layers bypassed.`,
    evidenceChannels,
    composerTrace: {
      route: "/api/home/know/ask",
      composer: "home_v7_dataset_contract",
      goldenComposerAttempted: false,
      goldenComposerUsed: false,
      fallbackUsed: false,
      dimensionsUsed: [
        publicDimensionId(result.answer.primaryDimension),
        ...result.answer.relatedDimensions.map(publicDimensionId),
      ],
      factsBound: counts.factsBound,
      tablesBound: counts.tablesBound,
      chartsBound: 0,
      graphsBound: 0,
      citationsBound: counts.citationsBound,
      sourceCoverageBound: result.answer.sourceFamiliesIncluded.length,
      sectionsBound: 0,
      rollupsBound: 0,
      relationshipPathsBound: 0,
      metricsBound: 0,
      gapsBound: counts.gapsBound,
      usableEvidence: result.proof.selectedRows > 0,
      evidenceChannels,
      answerStatus: counts.answerStatus,
      reason: `answerSource=v7_dataset_contract; source=${result.proof.source}; datasetDir=${result.tenant.datasetDir}; selectedRows=${result.proof.selectedRows}; selectedFacts=${result.proof.selectedFacts}; qualityGate=${result.proof.qualityGate.passed ? "passed" : "failed"}`,
      promptSnapshot: trace
        ? {
            system:
              "Home KNOW answers must use the selected V7 Azure schema only.",
            user: trace.modelCall.finalPrompt,
            full: trace.modelCall.finalPrompt,
          }
        : undefined,
    },
  };
}

function traceFor(result: V7HomeAskResult) {
  return "trace" in result ? result.trace : undefined;
}

function citationId(index = 0): string {
  return `home-v7-source-${index + 1}`;
}

function businessEvidenceLabel(value: string): string {
  const fileName = value.split("/").pop() ?? value;
  return `${humanize(fileName)} source file`;
}

function clientFriendlyProse(value: string, tenantKey: string): string {
  const clientName = CLIENT_FRIENDLY_NAME_BY_TENANT[tenantKey];
  if (!clientName) return value;
  const possessive = clientName.endsWith("s") ? `${clientName}'` : `${clientName}'s`;
  return value
    .replace(/^(Airline|Retail|Financial Services|Healthcare|Industrial) Demo's\b/i, possessive)
    .replace(/\b(Airline|Retail|Financial Services|Healthcare|Industrial) Demo\b/g, clientName);
}

function publicDimensionId(value: string): string {
  return slug(humanize(value));
}

function humanize(value: string): string {
  return value
    .replace(/^v7_\d+_/i, "")
    .replace(/\.csv$/i, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function isSupportedHandoffTarget(
  value: string,
): value is NonNullable<HomeKnowHandoff["target"]> {
  return ["intelligence", "tower", "source", "moves"].includes(value);
}

function surfaceName(value: string): string {
  if (value === "source") return "Source";
  if (value === "tower") return "Tower";
  if (value === "moves") return "Moves";
  if (value === "intelligence") return "Intelligence";
  return value;
}
