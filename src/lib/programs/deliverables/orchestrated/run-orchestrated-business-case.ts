// Run the orchestrated (multi-pass, governed) Costed Business-Case for a Move.
//
// Glue: Move recorded data → DeliverableIntelligenceRequest → multi-pass
// orchestration (audited Anthropic egress by default; injectable stub for tests)
// → quality gate → self-contained HTML. The quality/plan gates are ENFORCED:
// when the orchestrator blocks (thin evidence, unsupported claims, leaked tags),
// this returns `{ ok: false, blockedReason }` and renders NOTHING — the caller
// falls back to the deterministic deck. We never emit fabricated board content.

import type { MoveBusinessCaseInput } from "../../move-business-case";
import type {
  ModelCaller,
  OrchestrationResult,
} from "@/lib/deliverables/orchestrator/orchestrator";
import { runOrchestratedMoveDeliverable } from "./run-orchestrated-move-deliverable";

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
  citedInputIds: string[];
  quality?: OrchestrationResult["quality"];
  passTrace?: OrchestrationResult["passTrace"];
}

export async function runOrchestratedBusinessCase(
  input: RunOrchestratedBusinessCaseInput,
): Promise<RunOrchestratedBusinessCaseResult> {
  return runOrchestratedMoveDeliverable({
    ...input,
    deliverableType: "business_case",
    phaseOrStage: "P4_business_case",
    artifactStandard: "moves.board_grade.costed_business_case",
    audience: ["board", "cfo", "cio", "steering_committee"],
    decisionContext: `Fund / shape / kill decision for "${input.moveInput.name ?? "Strategic Move"}". The board must see the value case, the cost and timeline, the risks, and an explicit recommendation grounded in the recorded evidence.`,
    outputFormats: ["html"],
  });
}
