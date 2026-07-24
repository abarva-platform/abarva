// PATCH /api/v1/programs/:programId/pricing/estimates/:estimateId/inputs
//
// Draft save-after-each-step (brief §9.3): upserts one or more estimate
// inputs by (estimate_id, input_key). Also accepts a `header` patch for the
// step-1 fields that live on `pricing_estimates` itself (scenarioName,
// archetypeCode, currency, targetStartDate, targetDurationWeeks,
// selectedRateCardId) so the wizard can save a whole step with one call.

import { NextRequest } from "next/server";
import { requireTenancy, tenancyErrorResponse } from "@/app/api/v1/programs/_auth";
import { getEstimate, updateEstimateHeader, upsertEstimateInputs } from "@/lib/pricing/moves-workflow";
import type { PricingEstimateInputConfidence, PricingEstimateInputSourceType } from "@/lib/pricing/types";
import { estimateToJson, inputToJson, requireOwnedEstimate, requireOwnedMove } from "../../../_shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_SOURCE_TYPES: PricingEstimateInputSourceType[] = [
  "move_context",
  "client_profile",
  "global_default",
  "client_input",
  "override",
];
const VALID_CONFIDENCE: PricingEstimateInputConfidence[] = ["low", "medium", "high"];

interface InputPatch {
  inputKey?: unknown;
  value?: unknown;
  unit?: unknown;
  required?: unknown;
  sourceType?: unknown;
  sourceRef?: unknown;
  confidence?: unknown;
  /**
   * `true` to confirm this value NOW, `false` to explicitly un-confirm it.
   * Deliberately a boolean, not a client-supplied identity string — WHO
   * confirmed it is always resolved server-side from the authenticated
   * session (`ctx.userId`/`ctx.clientKey`), never trusted from the request
   * body (a client could otherwise impersonate any confirmedBy value).
   */
  confirm?: unknown;
  overrideReason?: unknown;
  modelVersion?: unknown;
}

interface PatchBody {
  inputs?: InputPatch[];
  header?: Record<string, unknown>;
}

function badRequest(detail: string) {
  return Response.json({ error: "bad_request", detail }, { status: 400 });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ programId: string; estimateId: string }> },
) {
  try {
    const ctx = await requireTenancy();
    const { programId, estimateId } = await params;

    const move = await requireOwnedMove(ctx, programId);
    if (!move) return Response.json({ error: "not_found" }, { status: 404 });

    const owned = await requireOwnedEstimate(ctx, programId, estimateId);
    if (!owned.ok) return Response.json({ error: owned.error, detail: owned.detail }, { status: owned.status });

    const body = (await req.json().catch(() => ({}))) as PatchBody;
    const inputPatches = Array.isArray(body.inputs) ? body.inputs : [];

    for (const [i, patch] of inputPatches.entries()) {
      if (typeof patch.inputKey !== "string" || patch.inputKey.trim().length === 0) {
        return badRequest(`inputs[${i}].inputKey is required`);
      }
      if (typeof patch.sourceType !== "string" || !VALID_SOURCE_TYPES.includes(patch.sourceType as PricingEstimateInputSourceType)) {
        return badRequest(`inputs[${i}].sourceType must be one of ${VALID_SOURCE_TYPES.join(", ")}`);
      }
      if (patch.confidence !== undefined && patch.confidence !== null && !VALID_CONFIDENCE.includes(patch.confidence as PricingEstimateInputConfidence)) {
        return badRequest(`inputs[${i}].confidence must be one of ${VALID_CONFIDENCE.join(", ")}`);
      }
    }

    const confirmedByIdentity = ctx.userId ?? ctx.clientKey ?? "unknown_session";

    let updatedInputs = null;
    if (inputPatches.length > 0) {
      updatedInputs = await upsertEstimateInputs(
        estimateId,
        inputPatches.map((patch) => ({
          inputKey: patch.inputKey as string,
          value: patch.value,
          unit: typeof patch.unit === "string" ? patch.unit : null,
          required: typeof patch.required === "boolean" ? patch.required : undefined,
          sourceType: patch.sourceType as PricingEstimateInputSourceType,
          sourceRef: typeof patch.sourceRef === "string" ? patch.sourceRef : null,
          confidence: (patch.confidence as PricingEstimateInputConfidence | null | undefined) ?? undefined,
          confirmedBy: patch.confirm === true ? confirmedByIdentity : patch.confirm === false ? null : undefined,
          overrideReason: typeof patch.overrideReason === "string" ? patch.overrideReason : null,
          modelVersion: typeof patch.modelVersion === "number" ? patch.modelVersion : undefined,
        })),
      );
    }

    let currentEstimate = owned.estimate;
    if (body.header && typeof body.header === "object") {
      const h = body.header;
      await updateEstimateHeader(estimateId, {
        scenarioName: typeof h.scenarioName === "string" ? h.scenarioName : undefined,
        scenarioKey: typeof h.scenarioKey === "string" ? h.scenarioKey : undefined,
        archetypeCode: typeof h.archetypeCode === "string" ? h.archetypeCode : undefined,
        currency: typeof h.currency === "string" ? h.currency : undefined,
        targetStartDate: h.targetStartDate === null ? null : typeof h.targetStartDate === "string" ? h.targetStartDate : undefined,
        targetDurationWeeks:
          h.targetDurationWeeks === null ? null : typeof h.targetDurationWeeks === "number" ? h.targetDurationWeeks : undefined,
        selectedRateCardId:
          h.selectedRateCardId === null ? null : typeof h.selectedRateCardId === "string" ? h.selectedRateCardId : undefined,
      });
      currentEstimate = (await getEstimate(estimateId)) ?? owned.estimate;
    }

    return Response.json({
      ok: true,
      estimate: estimateToJson(currentEstimate),
      updatedInputs: updatedInputs ? updatedInputs.map(inputToJson) : null,
    });
  } catch (err) {
    try {
      return tenancyErrorResponse(err);
    } catch {
      /* not a tenancy error */
    }
    console.error("[PATCH /api/v1/programs/:programId/pricing/estimates/:estimateId/inputs]", err);
    return Response.json({ error: "internal_error" }, { status: 500 });
  }
}
