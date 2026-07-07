import type { FeatureFlagKey } from "@/lib/features/registry";
import { getFeatureFlagDefinition } from "@/lib/features/registry";
import {
  runGoldenEval,
  type GoldenEvalReport,
} from "@/lib/intelligence/answer/evals/golden-eval";
import { GOLDEN_QUESTIONS } from "@/lib/intelligence/answer/evals/golden-questions";
import { EXPERT_PACKS } from "@/lib/intelligence/expert-pack/registry";
import { validateExpertPackForStore } from "@/lib/intelligence/expert-pack/store";

export const SHARED_ENGINE_SURFACE_FLAGS = [
  "scb_shared_engine_home",
  "scb_shared_engine_intelligence",
  "scb_shared_engine_tower",
  "scb_shared_engine_source",
  "scb_shared_engine_moves",
] as const satisfies readonly FeatureFlagKey[];

export type SharedEngineSurfaceFlag =
  (typeof SHARED_ENGINE_SURFACE_FLAGS)[number];

export interface SharedEngineFlagPolicyIssue {
  flagKey: SharedEngineSurfaceFlag;
  message: string;
}

export interface ExpertPackReadiness {
  packId: string;
  expertName: string;
  gatePass: boolean;
  goldenEvalPass: boolean;
  exposable: boolean;
  reasons: string[];
}

export interface ExpertPackReadinessReport {
  schemaVersion: "scb-expert-pack-readiness/v1";
  total: number;
  exposableCount: number;
  rows: ExpertPackReadiness[];
}

export interface SharedEngineParityGateReport {
  schemaVersion: "scb-shared-engine-parity/v1";
  pass: boolean;
  total: number;
  passCount: number;
  passRate: number;
  minimumPassRate: number;
  incumbentPassRate: number;
  blockedCount: number;
  reasons: string[];
}

export interface AgentAnswerEvalReportLike {
  total: number;
  passCount: number;
  results?: ReadonlyArray<{
    answer?: {
      status?: string;
    };
  }>;
}

export interface SharedEngineParityGateOptions {
  minimumPassRate?: number;
  incumbentPassRate?: number;
  requireNoCrossTenantBlocks?: boolean;
}

export function getSharedEngineFlagPolicyIssues(): SharedEngineFlagPolicyIssue[] {
  const issues: SharedEngineFlagPolicyIssue[] = [];

  for (const flagKey of SHARED_ENGINE_SURFACE_FLAGS) {
    const definition = getFeatureFlagDefinition(flagKey);
    if (!definition) {
      issues.push({ flagKey, message: "missing feature flag definition" });
      continue;
    }
    if (definition.policy !== "tenant") {
      issues.push({
        flagKey,
        message:
          "shared-engine surface flags must be tenant-policy/default-off",
      });
    }
    if ((definition.includeTenants ?? []).length > 0) {
      issues.push({
        flagKey,
        message: "shared-engine surface flags must not pre-enroll tenants",
      });
    }
  }

  return issues;
}

export function buildExpertPackReadinessReport(
  golden: GoldenEvalReport = runGoldenEval(),
): ExpertPackReadinessReport {
  const goldenByExpert = new Map<string, boolean[]>();
  const expectedExpertByQuestion = new Map(
    GOLDEN_QUESTIONS.map(
      (question) => [question.id, question.expectedExpertId] as const,
    ),
  );
  for (const result of golden.results) {
    const expectedExpertId = expectedExpertByQuestion.get(result.id);
    if (!expectedExpertId) continue;
    const existing = goldenByExpert.get(expectedExpertId);
    if (existing) {
      existing.push(result.pass);
    } else {
      goldenByExpert.set(expectedExpertId, [result.pass]);
    }
  }

  const rows = EXPERT_PACKS.map((pack): ExpertPackReadiness => {
    const validation = validateExpertPackForStore(pack);
    const goldenResults = goldenByExpert.get(pack.identity.id) ?? [];
    const gatePass = validation.pass;
    const goldenEvalPass =
      goldenResults.length > 0 && goldenResults.every(Boolean);
    const reasons: string[] = [];

    if (!gatePass) reasons.push("expert_pack_gate_failed");
    if (goldenResults.length === 0) reasons.push("missing_golden_eval");
    if (goldenResults.length > 0 && !goldenEvalPass)
      reasons.push("golden_eval_failed");

    return {
      packId: pack.identity.id,
      expertName: pack.identity.expertName,
      gatePass,
      goldenEvalPass,
      exposable: gatePass && goldenEvalPass,
      reasons,
    };
  });

  return {
    schemaVersion: "scb-expert-pack-readiness/v1",
    total: rows.length,
    exposableCount: rows.filter((row) => row.exposable).length,
    rows,
  };
}

export function buildSharedEngineParityGateReport(
  report: AgentAnswerEvalReportLike,
  options: SharedEngineParityGateOptions = {},
): SharedEngineParityGateReport {
  const minimumPassRate = options.minimumPassRate ?? 1;
  const incumbentPassRate = options.incumbentPassRate ?? 0.99;
  const requireNoCrossTenantBlocks = options.requireNoCrossTenantBlocks ?? true;
  const passRate = report.total > 0 ? report.passCount / report.total : 0;
  const blockedCount =
    report.results?.filter((result) => result.answer?.status === "blocked")
      .length ?? 0;
  const reasons: string[] = [];

  if (report.total <= 0) reasons.push("no_eval_cases");
  if (passRate < minimumPassRate) reasons.push("below_minimum_pass_rate");
  if (passRate <= incumbentPassRate) reasons.push("does_not_beat_incumbent");
  if (requireNoCrossTenantBlocks && blockedCount > 0)
    reasons.push("cross_tenant_blocks_present");

  return {
    schemaVersion: "scb-shared-engine-parity/v1",
    pass: reasons.length === 0,
    total: report.total,
    passCount: report.passCount,
    passRate,
    minimumPassRate,
    incumbentPassRate,
    blockedCount,
    reasons,
  };
}
