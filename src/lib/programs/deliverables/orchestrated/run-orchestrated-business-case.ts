// Run the orchestrated (multi-pass, governed) Costed Business-Case for a Move.
//
// Glue: Move recorded data → DeliverableIntelligenceRequest → multi-pass
// orchestration (audited Anthropic egress by default; injectable stub for tests)
// → quality gate → self-contained HTML. The quality/plan gates are ENFORCED:
// when the orchestrator blocks (thin evidence, unsupported claims, leaked tags),
// this returns `{ ok: false, blockedReason }` and renders NOTHING — the caller
// falls back to the deterministic deck. We never emit fabricated board content.

import type { MoveBusinessCaseInput } from "../../move-business-case";
import { runDeliverableOrchestration } from "@/lib/deliverables/orchestrator/orchestrator";
import type {
  ModelCaller,
  OrchestrationResult,
} from "@/lib/deliverables/orchestrator/orchestrator";
import { createAuditedModelCaller } from "@/lib/deliverables/orchestrator/model-caller";
import { buildBusinessCaseRequest } from "./build-request";
import { renderDeliverableHtml } from "./render-html";

export interface RunOrchestratedBusinessCaseInput {
  moveInput: MoveBusinessCaseInput;
  moveId: string;
  tenantId: string;
  userId?: string;
  generatedOn: string;
  /** Inject a stub ModelCaller in tests; production uses the audited egress. */
  modelCaller?: ModelCaller;
  /** Minimum recorded evidence items required before we even call the model. */
  minEvidence?: number;
}

export interface RunOrchestratedBusinessCaseResult {
  ok: boolean;
  html?: string;
  blockedReason?: string;
  evidenceCount: number;
  quality?: OrchestrationResult["quality"];
  passTrace?: OrchestrationResult["passTrace"];
}

export async function runOrchestratedBusinessCase(
  input: RunOrchestratedBusinessCaseInput,
): Promise<RunOrchestratedBusinessCaseResult> {
  const { request, evidenceCount } = buildBusinessCaseRequest(input.moveInput);

  // Pre-flight: no recorded facts → don't burn LLM passes; fall back honestly.
  const minEvidence = input.minEvidence ?? 1;
  if (evidenceCount < minEvidence) {
    return {
      ok: false,
      evidenceCount,
      blockedReason: `move has ${evidenceCount} recorded evidence item(s); minimum ${minEvidence} required to author a grounded business case`,
    };
  }

  const modelCaller =
    input.modelCaller ??
    createAuditedModelCaller({
      tenantId: input.tenantId,
      ...(input.userId !== undefined ? { userId: input.userId } : {}),
      metadata: { moveId: input.moveId },
    });

  let result: OrchestrationResult;
  try {
    result = await runDeliverableOrchestration(request, modelCaller, {
      enforcePlanGate: true,
      enforceQualityGate: true,
    });
  } catch (err) {
    return {
      ok: false,
      evidenceCount,
      blockedReason:
        err instanceof Error
          ? `orchestration error: ${err.message}`
          : "orchestration error",
    };
  }

  if (!result.ok || !result.document) {
    return {
      ok: false,
      evidenceCount,
      blockedReason:
        result.blockedReason ?? "orchestration produced no document",
      quality: result.quality,
      passTrace: result.passTrace,
    };
  }

  const html = renderDeliverableHtml(result.document, input.generatedOn);
  return {
    ok: true,
    html,
    evidenceCount,
    quality: result.quality,
    passTrace: result.passTrace,
  };
}
