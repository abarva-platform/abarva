import {
  scoreAnswer,
  type AnswerQualityScore,
} from "@/lib/eval/answer-quality/scorer";
import { routeQuestion } from "@/lib/intelligence/answer/router";
import { assembleAgentAnswer } from "@/lib/intelligence/answer/engine";
import type { AvaAnswerPacket } from "@/lib/ava-answer/contract";
import {
  buildExpertPackReadinessReport,
  buildSharedEngineParityGateReport,
  type ExpertPackReadinessReport,
  type SharedEngineParityGateOptions,
  type SharedEngineParityGateReport,
} from "@/lib/intelligence/exposure/shared-engine-policy";
import type { ContextBundle } from "@/lib/knowledge/context-broker/types";
import { GOLDEN_QUESTIONS, type GoldenQuestion } from "./golden-questions";
import {
  runGoldenEval,
  type GoldenEvalReport,
  type GoldenResult,
} from "./golden-eval";

export type AgentAnswerEvalMode = "deterministic";

export interface AgentAnswerEvalCaseResult {
  id: string;
  query: string;
  industry?: string;
  expectedExpertId: string;
  routedTo: string | null;
  golden: GoldenResult;
  answer: AvaAnswerPacket;
  answerQuality: AnswerQualityScore;
  pass: boolean;
  notes: string[];
}

export interface AgentAnswerEvalReport {
  schemaVersion: "scb-agent-answer-eval/v1";
  runId: string;
  generatedAt: string;
  mode: AgentAnswerEvalMode;
  total: number;
  passCount: number;
  goldenPassCount: number;
  answerQualityPassCount: number;
  golden: GoldenEvalReport;
  packReadiness: ExpertPackReadinessReport;
  parityGate: SharedEngineParityGateReport;
  results: AgentAnswerEvalCaseResult[];
}

export interface AgentAnswerEvalHarnessOptions {
  generatedAt?: string;
  runId?: string;
  parityGate?: SharedEngineParityGateOptions;
  answerRunner?: (question: GoldenQuestion) => Promise<AvaAnswerPacket>;
}

function makeRunId(generatedAt: string): string {
  return `scb-agent-answer-eval-${generatedAt.replace(/[:.]/g, "-")}`;
}

function emptyBundle(
  question: GoldenQuestion,
  generatedAt: string,
): ContextBundle {
  return {
    query: question.query,
    mode: "corpus",
    tenantKey: null,
    facts: [],
    graphPaths: [],
    semanticChunks: [],
    corpusPatterns: [],
    worldviewChunks: [],
    provenance: [
      {
        sourceClass: "pattern_catalog",
        sourceId: question.expectedExpertId,
        sourceDoc: "Consilium expert pack",
        confidence: 1,
        classification: "internal",
      },
    ],
    assembledAt: generatedAt,
    warnings: [],
    infoTags: [
      "Deterministic W5.1 eval bundle; no live tenant data or model call.",
    ],
  };
}

async function deterministicAnswer(
  question: GoldenQuestion,
  generatedAt: string,
): Promise<AvaAnswerPacket> {
  const routing = routeQuestion({
    query: question.query,
    industry: question.industry,
  });
  return assembleAgentAnswer({
    surface: "intelligence",
    routing,
    bundle: emptyBundle(question, generatedAt),
    prose:
      "Ava has enough authored Consilium grounding for this golden question. " +
      "Source basis: the expected expert pack was selected and its benchmarks and hedges were present. " +
      "Recommended next step: validate the same answer against tenant evidence before any client rollout.",
    recommendedActions: [
      {
        id: `${question.id}-validate`,
        label: "Validate against tenant evidence",
        rationale:
          "Golden eval answers prove the deterministic path before any tenant-facing rollout.",
      },
    ],
  });
}

export async function runAgentAnswerEvalHarness(
  options: AgentAnswerEvalHarnessOptions = {},
): Promise<AgentAnswerEvalReport> {
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const runId = options.runId ?? makeRunId(generatedAt);
  const answerRunner =
    options.answerRunner ??
    ((question) => deterministicAnswer(question, generatedAt));
  const golden = runGoldenEval();
  const goldenById = new Map(
    golden.results.map((result) => [result.id, result]),
  );

  const results = await Promise.all(
    GOLDEN_QUESTIONS.map(async (question) => {
      const answer = await answerRunner(question);
      const answerQuality = scoreAnswer(answer.directAnswer, {
        questionId: question.id,
        tenantKey: "eval",
        surface: answer.surface,
      });
      const goldenResult = goldenById.get(question.id);
      if (!goldenResult)
        throw new Error(`Missing golden result for ${question.id}`);
      const notes = [
        ...goldenResult.notes,
        ...answerQuality.violations.map(
          (violation) => `${violation.dimension}: ${violation.remediation}`,
        ),
      ];
      return {
        id: question.id,
        query: question.query,
        industry: question.industry,
        expectedExpertId: question.expectedExpertId,
        routedTo: answer.expertsUsed?.[0]?.id ?? null,
        golden: goldenResult,
        answer,
        answerQuality,
        pass:
          goldenResult.pass &&
          answerQuality.gatePassed &&
          answer.status !== "blocked",
        notes,
      };
    }),
  );

  const reportWithoutGates = {
    schemaVersion: "scb-agent-answer-eval/v1",
    runId,
    generatedAt,
    mode: "deterministic",
    total: results.length,
    passCount: results.filter((result) => result.pass).length,
    goldenPassCount: golden.passCount,
    answerQualityPassCount: results.filter(
      (result) => result.answerQuality.gatePassed,
    ).length,
    golden,
    results,
  } satisfies Omit<AgentAnswerEvalReport, "packReadiness" | "parityGate">;

  return {
    ...reportWithoutGates,
    packReadiness: buildExpertPackReadinessReport(golden),
    parityGate: buildSharedEngineParityGateReport(
      reportWithoutGates,
      options.parityGate,
    ),
  };
}
