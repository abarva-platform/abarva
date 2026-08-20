// Generic orchestrated Move deliverable runner.
//
// This is the DG-PR-G adapter: existing per-module Moves routes keep their URL
// and response shape, but when `moves_orchestrated_deliverables` is enabled for
// a tenant they can delegate authoring to the shared multi-pass Deliverable
// Intelligence Orchestrator. The deterministic renderers remain the flag-off
// and honest-fallback path.

import type { MoveBusinessCaseInput } from "../../move-business-case";
import { assertDeliverablePolicy } from "@/lib/ai/document-generation-policy";
import { runDeliverableOrchestration } from "@/lib/deliverables/orchestrator/orchestrator";
import type {
  ModelCaller,
  OrchestrationResult,
} from "@/lib/deliverables/orchestrator/orchestrator";
import type { RenderableDeliverable } from "@/lib/deliverables/orchestrator/types";
import { createAuditedModelCaller } from "@/lib/deliverables/orchestrator/model-caller";
import {
  buildMoveDeliverableRequest,
  type BuildMoveDeliverableRequestInput,
} from "./build-request";
import { renderDeliverableHtml } from "./render-html";

export interface RunOrchestratedMoveDeliverableInput extends BuildMoveDeliverableRequestInput {
  moveInput: MoveBusinessCaseInput;
  moveId: string;
  tenantId: string;
  userId?: string;
  generatedOn: string;
  modelCaller?: ModelCaller;
  minEvidence?: number;
}

export interface RunOrchestratedMoveDeliverableResult {
  ok: boolean;
  html?: string;
  document?: RenderableDeliverable;
  blockedReason?: string;
  evidenceCount: number;
  citedInputIds: string[];
  quality?: OrchestrationResult["quality"];
  passTrace?: OrchestrationResult["passTrace"];
}

export async function runOrchestratedMoveDeliverable(
  input: RunOrchestratedMoveDeliverableInput,
): Promise<RunOrchestratedMoveDeliverableResult> {
  assertDeliverablePolicy(input.deliverableType);
  const { request, evidenceCount, citedInputIds } = buildMoveDeliverableRequest(
    input.moveInput,
    input,
  );

  const minEvidence = input.minEvidence ?? 1;
  if (evidenceCount < minEvidence) {
    return {
      ok: false,
      evidenceCount,
      citedInputIds,
      blockedReason: `move has ${evidenceCount} recorded evidence item(s); minimum ${minEvidence} required to author a grounded ${input.deliverableType}`,
    };
  }

  const modelCaller =
    input.modelCaller ??
    createAuditedModelCaller({
      tenantId: input.tenantId,
      ...(input.userId !== undefined ? { userId: input.userId } : {}),
      metadata: {
        moveId: input.moveId,
        deliverableType: input.deliverableType,
      },
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
      citedInputIds,
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
      citedInputIds,
      blockedReason:
        result.blockedReason ?? "orchestration produced no document",
      quality: result.quality,
      passTrace: result.passTrace,
    };
  }

  return {
    ok: true,
    html: renderDeliverableHtml(result.document, input.generatedOn),
    document: result.document,
    evidenceCount,
    citedInputIds,
    quality: result.quality,
    passTrace: result.passTrace,
  };
}
