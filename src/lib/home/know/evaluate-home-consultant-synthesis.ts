import { buildHomeKnowDimensionDossier } from "@/lib/home/know/build-universal-dimension-dossier";
import { buildHomeKnowResponseFromDossier } from "@/lib/home/know/compose-dossier-answer";
import {
  buildHomeConsultantDossierPromptPacket,
  synthesizeHomeConsultantDossier,
  type HomeConsultantDossierPromptPacket,
  type HomeConsultantDossierSynthesisOutput,
} from "@/lib/home/know/home-consultant-dossier-synthesis";
import { validateHomeKnowResponse } from "@/lib/home/know/home-know-engine";
import type { HomeKnowResponse } from "@/lib/home/know/home-know-contract";
import { validateHomeKnowAnswer } from "@/lib/home/know/home-answer-quality-gate";

export interface HomeConsultantSynthesisEvaluationCase {
  id: string;
  tenantKey: string;
  question: string;
}

export interface HomeConsultantSynthesisEvaluationResult {
  id: string;
  tenantKey: string;
  question: string;
  dossierSummary: {
    primaryDimension: string;
    relatedDimensions: string[];
    sectionCount: number;
    citationCount: number;
    gapCount: number;
  };
  promptPacket: HomeConsultantDossierPromptPacket;
  deterministicOutput: string;
  claudeOutput: HomeConsultantDossierSynthesisOutput | null;
  finalRenderedAnswer: string;
  qualityGate: ReturnType<typeof validateHomeKnowAnswer>;
  differenceAnalysis: string;
  recommendation: "use_claude" | "fallback" | "needs_fix";
}

export async function evaluateHomeConsultantSynthesisCase(
  item: HomeConsultantSynthesisEvaluationCase,
): Promise<HomeConsultantSynthesisEvaluationResult> {
  const { dossier } = buildHomeKnowDimensionDossier({
    tenantKey: item.tenantKey,
    question: item.question,
    requestedSurface: "home",
  });
  const deterministicResponse = validateHomeKnowResponse(
    buildHomeKnowResponseFromDossier({
      tenantKey: item.tenantKey,
      question: item.question,
      dossier,
    }),
  );
  const promptPacket = buildHomeConsultantDossierPromptPacket({
    dossier,
    response: deterministicResponse,
  });
  const synthesis = await synthesizeHomeConsultantDossier({
    dossier,
    deterministicResponse,
  });
  const finalRenderedAnswer = synthesis
    ? [
        synthesis.output.directAnswer,
        synthesis.output.currentStateSynthesis,
        synthesis.output.businessImplication,
      ]
        .filter(Boolean)
        .join("\n\n")
    : deterministicResponse.prose;
  const qualityGate = validateHomeKnowAnswer({
    answer: {
      directAnswer: finalRenderedAnswer,
      composerPacket: dossier.composerPacket,
      artifactPlan: dossier.route.artifactPlan,
      citations: dossier.citations,
      gaps: dossier.gaps,
      quality: { passed: true, issues: [] },
    },
    dossier,
  });
  return {
    id: item.id,
    tenantKey: item.tenantKey,
    question: item.question,
    dossierSummary: {
      primaryDimension: dossier.route.primaryDimension,
      relatedDimensions: dossier.route.relatedDimensions,
      sectionCount: dossier.sections.length,
      citationCount: dossier.citations.length,
      gapCount: dossier.gaps.length,
    },
    promptPacket,
    deterministicOutput: deterministicResponse.prose,
    claudeOutput: synthesis?.output ?? null,
    finalRenderedAnswer,
    qualityGate,
    differenceAnalysis: compareOutputs(deterministicResponse, synthesis?.output ?? null),
    recommendation: recommendationFor(qualityGate, deterministicResponse, synthesis?.output ?? null),
  };
}

export async function evaluateHomeConsultantSynthesisCases(
  cases: HomeConsultantSynthesisEvaluationCase[],
): Promise<HomeConsultantSynthesisEvaluationResult[]> {
  const results: HomeConsultantSynthesisEvaluationResult[] = [];
  for (const item of cases) {
    results.push(await evaluateHomeConsultantSynthesisCase(item));
  }
  return results;
}

function compareOutputs(
  deterministic: HomeKnowResponse,
  claude: HomeConsultantDossierSynthesisOutput | null,
): string {
  if (!claude) {
    return "Claude synthesis was not used; deterministic dossier output remains the final answer.";
  }
  const deterministicLength = deterministic.prose.length;
  const claudeLength =
    claude.directAnswer.length +
    claude.currentStateSynthesis.length +
    claude.businessImplication.length;
  const implication = claude.businessImplication.trim().length > 0
    ? "Claude added a business implication section."
    : "Claude did not add a business implication section.";
  return `Deterministic prose length ${deterministicLength}; Claude synthesis length ${claudeLength}. ${implication}`;
}

function recommendationFor(
  gate: ReturnType<typeof validateHomeKnowAnswer>,
  deterministic: HomeKnowResponse,
  claude: HomeConsultantDossierSynthesisOutput | null,
): HomeConsultantSynthesisEvaluationResult["recommendation"] {
  if (gate.critical) return "needs_fix";
  if (!claude) return "fallback";
  const claudeLength =
    claude.directAnswer.length +
    claude.currentStateSynthesis.length +
    claude.businessImplication.length;
  return claudeLength > deterministic.prose.length ? "use_claude" : "fallback";
}
