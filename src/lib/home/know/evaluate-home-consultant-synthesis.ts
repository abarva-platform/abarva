import { buildHomeKnowDimensionDossier } from "@/lib/home/know/build-universal-dimension-dossier";
import { buildHomeKnowResponseFromDossier } from "@/lib/home/know/compose-dossier-answer";
import {
  buildHomeConsultantTextPromptPacket,
  isHomeConsultantTextSynthesisResult,
  synthesizeHomeConsultantText,
  type HomeConsultantTextPromptPacket,
} from "@/lib/home/know/home-consultant-text-synthesis";
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
  promptPacket: HomeConsultantTextPromptPacket;
  deterministicOutput: string;
  claudeOutput: string | null;
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
  const promptPacket = buildHomeConsultantTextPromptPacket({
    dossier,
    response: deterministicResponse,
  });
  const synthesis = await synthesizeHomeConsultantText({
    dossier,
    deterministicResponse,
  });
  const successfulSynthesis = isHomeConsultantTextSynthesisResult(synthesis)
    ? synthesis
    : null;
  const finalRenderedAnswer = successfulSynthesis ? successfulSynthesis.text : deterministicResponse.prose;
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
    claudeOutput: successfulSynthesis?.text ?? null,
    finalRenderedAnswer,
    qualityGate,
    differenceAnalysis: compareOutputs(deterministicResponse, successfulSynthesis?.text ?? null),
    recommendation: recommendationFor(
      qualityGate,
      deterministicResponse,
      successfulSynthesis?.text ?? null,
    ),
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
  claude: string | null,
): string {
  if (!claude) {
    return "Claude synthesis was not used; deterministic dossier output remains the final answer.";
  }
  const deterministicLength = deterministic.prose.length;
  return `Deterministic prose length ${deterministicLength}; Claude text synthesis length ${claude.length}.`;
}

function recommendationFor(
  gate: ReturnType<typeof validateHomeKnowAnswer>,
  deterministic: HomeKnowResponse,
  claude: string | null,
): HomeConsultantSynthesisEvaluationResult["recommendation"] {
  if (gate.critical) return "needs_fix";
  if (!claude) return "fallback";
  return claude.length >= deterministic.prose.length * 0.8 ? "use_claude" : "fallback";
}
