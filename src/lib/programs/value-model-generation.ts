/** Move-scoped, read-only value-model evaluation for P4 generation enqueue. */
import "server-only";
import { createHash } from "node:crypto";

import { getModuleState } from "./queries";
import { listAssumptions } from "./assumption-register/store";
import { phaseCaptureModuleKey } from "./phase-capture-contract";
import { readValueModel } from "./value-model-capture";
import { evaluateValueCase } from "./value-engine";
import { buildRegisterInputs, registerInputRefs } from "./value-engine/register-inputs";
import { loadCostBasis, withCostBasis } from "./value-engine/cost-basis";
import { blockedInputs } from "./value-engine/value-case-view";
import { isRomApprovalCurrent, parseRomEstimate } from "./rom-estimate";
import {
  valueGenerationSnapshot,
  valueModelReviewDetail,
  type ValueGenerationSnapshot,
} from "./value-model-capture-evidence";

type Context = Parameters<typeof getModuleState>[0];
type Modules = Awaited<ReturnType<typeof getModuleState>>;

function captureValue(modules: Modules, key: string, phase = 4): string {
  const state = modules.find((row) => row.moduleKey === phaseCaptureModuleKey(phase, key))?.state;
  return typeof state?.value === "string" ? state.value : "";
}

export type ValueGenerationRead =
  | { kind: "legacy" }
  | { kind: "review_required"; detail: string }
  | { kind: "ready"; snapshot: ValueGenerationSnapshot };

/** The caller must first enforce tenant and Move access, then check the flag. */
export async function loadValueGenerationForMove(
  ctx: Context,
  moveId: string,
  modules?: Modules,
): Promise<ValueGenerationRead> {
  const rows = modules ?? (await getModuleState(ctx, moveId));
  const read = readValueModel(captureValue(rows, "value_plan"));
  if (read.kind === "legacy_text") return { kind: "legacy" };
  if (read.kind === "invalid") {
    return {
      kind: "review_required",
      detail: `The structured value model is invalid: ${read.issues.join("; ")}. Review it before building P4 documents.`,
    };
  }
  const model = read.model.case;
  const romCapture = captureValue(rows, "rom_estimate", 3);
  const rom = parseRomEstimate(romCapture);
  if (romCapture.trim() && !rom) {
    return { kind: "review_required", detail: "The P3 ROM estimate cannot be read. Review its saved record before building P4 documents." };
  }
  if (rom && !rom.approval) {
    return { kind: "review_required", detail: "The P3 ROM estimate has no approved snapshot. Approve its current estimate before building P4 documents." };
  }
  const referencedIds = [...new Set(registerInputRefs(model).map((ref) => ref.registerId))].sort();
  const registerRows = referencedIds.length || rom?.approval ? await listAssumptions(ctx, moveId) : [];
  if (rom?.approval && !isRomApprovalCurrent(rom, registerRows)) {
    return { kind: "review_required", detail: "The approved P3 ROM estimate is stale against its saved inputs or register rows. Reapprove the estimate before building P4 documents." };
  }
  const referencedRows = referencedIds.map((id) => {
    const row = registerRows.find((candidate) => candidate.registerId === id);
    return row ? { id, revision: row.revision, row } : { id, row: null };
  });
  const registerInputs = buildRegisterInputs(model, registerRows);
  const estimateCapture = captureValue(rows, "estimates_capacity");
  const romApproval = rom?.approval ?? null;
  const costBasis = await loadCostBasis({
    estimateCapture,
    deliveryModel: read.model.deliveryModel ?? null,
    ...(romApproval ? { loadApprovedRomSnapshot: async () => ({
      snapshotId: `p3-rom:v${romApproval.version}:${romApproval.inputsFingerprint}`,
      currency: "USD",
      lowCents: romApproval.combined.lowCents,
      baseCents: romApproval.combined.planCents,
      highCents: romApproval.combined.highCents,
    }) } : {}),
  });
  const inputHash = createHash("sha256")
    .update(JSON.stringify({
      valueCapture: captureValue(rows, "value_plan"),
      estimateCapture,
      romCapture,
      referencedRows,
      costBasis,
    }))
    .digest("hex");
  const result = evaluateValueCase(withCostBasis(model, costBasis), {
    resolver: registerInputs.resolver,
  });
  const blocked = blockedInputs(result, registerInputs.resolutions, costBasis);
  const detail = valueModelReviewDetail(result, blocked, costBasis);
  return detail
    ? { kind: "review_required", detail }
    : { kind: "ready", snapshot: valueGenerationSnapshot(result, costBasis, blocked, inputHash) };
}
