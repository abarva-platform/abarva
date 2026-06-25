import type {
  AvaAnswerPacket,
  AvaAnswerStatus,
  AvaArtifact,
  AvaCaveat,
  AvaCitation,
  AvaFactRef,
  AvaGap,
  AvaMetricRef,
  AvaMode,
  AvaNextStep,
  AvaRelationshipRef,
  AvaRetrievalSummary,
  AvaSurface,
  AvaCorpusRef,
  AvaExpertRef,
} from "@/lib/ava-answer/contract";
import { validateAvaAnswerPacket } from "@/lib/ava-answer/validateAvaAnswerPacket";

export interface ComposeAvaAnswerInput {
  surface: AvaSurface;
  mode: AvaMode;
  tenantKey: string;
  question: string;
  intent: string;
  status: AvaAnswerStatus;
  directAnswer?: string;
  interpretation?: string;
  businessImplication?: string;
  recommendation?: string;
  decisionFrame?: unknown;
  factsUsed?: AvaFactRef[];
  metricsUsed?: AvaMetricRef[];
  relationshipsUsed?: AvaRelationshipRef[];
  corpusUsed?: AvaCorpusRef[];
  expertsUsed?: AvaExpertRef[];
  artifacts?: AvaArtifact[];
  citations?: AvaCitation[];
  gaps?: AvaGap[];
  caveats?: AvaCaveat[];
  nextSteps?: AvaNextStep[];
  retrievalSummary?: AvaRetrievalSummary;
}

export function composeAvaAnswer(
  input: ComposeAvaAnswerInput,
): AvaAnswerPacket {
  const directAnswer =
    input.directAnswer?.trim() ||
    defaultDirectAnswer(input.status, input.surface);
  const interpretation =
    input.interpretation?.trim() ||
    defaultInterpretation({
      surface: input.surface,
      status: input.status,
      gaps: input.gaps ?? [],
      artifacts: input.artifacts ?? [],
      retrievalSummary: input.retrievalSummary,
    });
  const quality = qualityFrom(input);
  const artifacts = input.artifacts ?? [];
  const tables = artifacts
    .filter((artifact) => artifact.artifact === "table")
    .map((artifact) => {
      const { artifact: _artifact, ...table } = artifact;
      void _artifact;
      return table;
    });
  const charts = artifacts
    .filter((artifact) => artifact.artifact === "chart")
    .map((artifact) => {
      const { artifact: _artifact, ...chart } = artifact;
      void _artifact;
      return chart;
    });
  const graphs = artifacts
    .filter((artifact) => artifact.artifact === "graph")
    .map((artifact) => {
      const { artifact: _artifact, ...graph } = artifact;
      void _artifact;
      return graph;
    });
  const packet: AvaAnswerPacket = {
    surface: input.surface,
    mode: input.mode,
    tenantKey: input.tenantKey,
    question: input.question,
    intent: input.intent,
    status: input.status,
    directAnswer,
    prose: directAnswer,
    interpretation,
    businessImplication: input.businessImplication,
    recommendation: input.surface === "home" ? undefined : input.recommendation,
    decisionFrame: input.surface === "home" ? undefined : input.decisionFrame,
    factsUsed: input.factsUsed ?? [],
    metricsUsed: input.metricsUsed ?? [],
    relationshipsUsed: input.relationshipsUsed ?? [],
    corpusUsed: input.corpusUsed ?? [],
    expertsUsed: input.surface === "home" ? [] : (input.expertsUsed ?? []),
    contributingExperts:
      input.surface === "home" ? [] : (input.expertsUsed ?? []),
    tables,
    charts,
    graphs,
    artifacts,
    citations: input.citations ?? [],
    gaps: input.gaps ?? [],
    caveats: input.caveats ?? [],
    nextSteps: input.nextSteps ?? [],
    quality,
    safety: {
      tenantFencePassed: true,
      rawIdsSuppressed: true,
      forbiddenLanguagePassed: true,
      unsupportedClaimsBlocked: true,
    },
  };
  return validateAvaAnswerPacket(packet).packet;
}

function defaultDirectAnswer(
  status: AvaAnswerStatus,
  surface: AvaSurface,
): string {
  if (status === "blocked") return "";
  if (status === "handoff") {
    return surface === "home"
      ? "That question needs interpretation or prioritization beyond Home."
      : "This question needs a guided next step.";
  }
  if (status === "no_data") {
    return "I do not see enough loaded context to answer that cleanly.";
  }
  if (status === "partial") {
    return "The loaded context answers part of the question, with specific gaps still open.";
  }
  return "The loaded context supports a direct answer.";
}

function defaultInterpretation(input: {
  surface: AvaSurface;
  status: AvaAnswerStatus;
  gaps: AvaGap[];
  artifacts: AvaArtifact[];
  retrievalSummary?: AvaRetrievalSummary;
}): string | undefined {
  if (input.status === "blocked") return undefined;
  if (input.surface !== "home") return undefined;
  if (input.status === "no_data") {
    return "The safest answer is to show the missing source path instead of filling the gap with assumptions.";
  }
  if (input.status === "partial" && input.gaps.length > 0) {
    return "The available context is useful for direction, but the missing fields limit how precise the answer can be.";
  }
  if (input.artifacts.length > 0) {
    return "The supporting table, chart, or graph carries the detail; the lead answer stays focused on what it means.";
  }
  if (input.retrievalSummary?.hasTenantFacts) {
    return "The answer is grounded in tenant context and source-backed fields.";
  }
  return "The answer stays within the loaded Home context.";
}

function qualityFrom(input: ComposeAvaAnswerInput): AvaAnswerPacket["quality"] {
  const citationCount = input.citations?.length ?? 0;
  const gapCount = input.gaps?.length ?? 0;
  const hasTenantFacts =
    input.retrievalSummary?.hasTenantFacts ?? citationCount > 0;
  const confidence =
    input.status === "answered" && citationCount > 0
      ? "high"
      : input.status === "no_data" || gapCount > 0
        ? "low"
        : "medium";
  return {
    confidence,
    evidenceStrength:
      citationCount >= 4 ? "strong" : citationCount > 0 ? "partial" : "thin",
    tenantGrounding: hasTenantFacts
      ? gapCount > 0
        ? "partial"
        : "complete"
      : "missing",
    answerCompleteness:
      input.status === "answered"
        ? "complete"
        : input.status === "blocked"
          ? "blocked"
          : "partial",
  };
}
