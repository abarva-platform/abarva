// GET /api/v1/programs/:programId/value-case — the Move's value case,
// evaluated by the deterministic value engine. Read-only: nothing is written.
//
// Flagged by `moves_value_engine_v1`. The ladder, in order:
//   1. the flag. It is tenant-scoped, so the caller's tenancy is resolved
//      first (`requireTenancy`, which also refuses an unsigned caller) and
//      the flag is checked before any Move is read — a workspace without the
//      engine learns nothing about any Move;
//   2. the Move. `getProgramById` applies the tenant fence and per-Move RBAC;
//      a null is the shared cause-blind 404, so an absent Move, another
//      tenant's Move and a Move outside the caller's grants are identical;
//   3. the program grants. The per-Move access policy decides what the viewer
//      SEES: anyone who can change the register, or with financial
//      visibility, gets every figure; a read-only viewer without financial
//      visibility gets the case's shape with every figure withheld
//      (`seesRegisterFigures`, the register's own rule).
//
// Then the saved P4 `value_plan` (a structured value model) is evaluated with
// its register inputs (`register-inputs.ts`) against its cost basis
// (`cost-basis.ts`: an approved ROM snapshot when a loader exists — none is
// wired yet — else the reviewed P4 estimate for `?delivery=internal|vendor`,
// else blocked). An input that does not resolve blocks with a sentence naming
// the row and its status, never a number.
//
// Every refusal carries an authored `detail`. The catch answers with a NAMED
// refusal instead of letting the shared tenancy responder re-throw into an
// unbodied 500.

import "server-only";

import { NextRequest } from "next/server";
import { requireTenancy, tenancyErrorResponse } from "../../_auth";
import { isFeatureEnabled } from "@/lib/features/is-feature-enabled";
import { getModuleState, getProgramById } from "@/lib/programs/queries";
import { getProgramsRouteSupabase } from "@/lib/programs/programs-auth-mode-server";
import { loadUserProgramAccessPolicy } from "@/lib/auth/program-access-policy";
import { moveUnreadableRefusalBody } from "@/lib/programs/move-unreadable-refusal";
import { tenancyOrNamedErrorResponse } from "@/lib/programs/tenancy-catch-response";
import { listAssumptions } from "@/lib/programs/assumption-register/store";
import { seesRegisterFigures } from "@/lib/programs/assumption-register/register-route-access";
import {
  VALUE_MODEL_SECTION_KEY,
  phaseCaptureModuleKey,
} from "@/lib/programs/phase-capture-contract";
import { readValueModel } from "@/lib/programs/value-model-capture";
import { evaluateValueCase } from "@/lib/programs/value-engine";
import { loadRegisterInputs } from "@/lib/programs/value-engine/register-inputs";
import {
  loadCostBasis,
  withCostBasis,
} from "@/lib/programs/value-engine/cost-basis";
import {
  VALUE_CASE_DELIVERY_PARAM,
  VALUE_CASE_REFUSAL,
  VALUE_ENGINE_FLAG,
  valueCaseForViewer,
  valueCaseRefusalResponse,
} from "@/lib/programs/value-engine/value-case-view";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** P4 holds both the value plan and the estimate model. */
const VALUE_PHASE = 4;
const ESTIMATE_SECTION_KEY = "estimates_capacity";

function captureValue(
  modules: Awaited<ReturnType<typeof getModuleState>>,
  sectionKey: string,
): string {
  const row = modules.find(
    (entry) =>
      entry.moduleKey === phaseCaptureModuleKey(VALUE_PHASE, sectionKey),
  );
  const value = row?.state?.value;
  return typeof value === "string" ? value : "";
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ programId: string }> },
) {
  try {
    const { programId } = await params;
    const ctx = await requireTenancy();
    if (
      isFeatureEnabled(
        { clientKey: ctx.clientKey, clientId: ctx.clientId },
        VALUE_ENGINE_FLAG,
      ) !== true
    ) {
      return valueCaseRefusalResponse("value_engine_not_enabled");
    }
    const { supabase } = await getProgramsRouteSupabase("program_read");
    const program = await getProgramById(ctx, programId, { supabase });
    if (!program) {
      return Response.json(moveUnreadableRefusalBody(), { status: 404 });
    }
    const policy = await loadUserProgramAccessPolicy(ctx, { programId });

    const delivery = req.nextUrl.searchParams.get(VALUE_CASE_DELIVERY_PARAM);
    if (delivery !== null && delivery !== "internal" && delivery !== "vendor") {
      return valueCaseRefusalResponse("bad_delivery_model");
    }

    const modules = await getModuleState(ctx, programId, { supabase });
    const valuePlan = captureValue(modules, VALUE_MODEL_SECTION_KEY);
    if (valuePlan.trim() === "") {
      return valueCaseRefusalResponse("value_model_absent");
    }
    const read = readValueModel(valuePlan);
    if (read.kind === "legacy_text") {
      return valueCaseRefusalResponse("value_model_not_structured");
    }
    if (read.kind === "invalid") {
      return valueCaseRefusalResponse("value_model_invalid", {
        issues: read.issues,
      });
    }

    const model = read.model.case;
    const registerInputs = await loadRegisterInputs(model, {
      ctx,
      programId,
      listAssumptions,
    });
    const costBasis = await loadCostBasis({
      estimateCapture: captureValue(modules, ESTIMATE_SECTION_KEY),
      deliveryModel: delivery,
    });
    const result = evaluateValueCase(withCostBasis(model, costBasis), {
      resolver: registerInputs.resolver,
    });
    return Response.json(
      valueCaseForViewer(
        {
          programId,
          result,
          costBasis,
          registerInputs: registerInputs.resolutions,
        },
        { seesFigures: seesRegisterFigures(policy, programId) },
      ),
    );
  } catch (err) {
    return tenancyOrNamedErrorResponse(err, tenancyErrorResponse, {
      code: "value_case_read_failed",
      detail: VALUE_CASE_REFUSAL.value_case_read_failed.detail,
    });
  }
}
