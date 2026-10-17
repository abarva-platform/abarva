/**
 * GET /api/v1/programs/<moveId>/financial-model — the P4 value case as a
 * live-formula workbook (`value-engine/financial-model-workbook.ts`).
 *
 * The case is read through the value-case route itself, so its access rule,
 * figure withholding, cost basis and refusals are exactly the ones P4 shows.
 * The lever timing comes from the same saved value model; the builder refuses
 * when the two no longer reproduce each other. Nothing is stored.
 */
import "server-only";

import { NextRequest } from "next/server";
import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import { isFeatureEnabled } from "@/lib/features/is-feature-enabled";
import { getModuleState, getProgramById } from "@/lib/programs/queries";
import { getProgramsRouteSupabase } from "@/lib/programs/programs-auth-mode-server";
import { loadUserProgramAccessPolicy } from "@/lib/auth/program-access-policy";
import { moveUnreadableRefusalBody } from "@/lib/programs/move-unreadable-refusal";
import { tenancyOrNamedErrorResponse } from "@/lib/programs/tenancy-catch-response";
import { phaseCaptureModuleKey, VALUE_MODEL_SECTION_KEY } from "@/lib/programs/phase-capture-contract";
import { readValueModel } from "@/lib/programs/value-model-capture";
import { VALUE_ENGINE_FLAG, valueCaseRefusalResponse } from "@/lib/programs/value-engine/value-case-view";
import type { CaseEconomics, ValueCaseResult } from "@/lib/programs/value-engine/types";
import { GET as readValueCaseRoute } from "@/app/api/v1/programs/[programId]/value-case/route";
import {
  FINANCIAL_MODEL_CONTENT_TYPE,
  FinancialModelMismatch,
  financialModelBuffer,
} from "@/lib/programs/value-engine/financial-model-workbook";
import { FINANCIAL_MODEL_REFUSAL, type FinancialModelRefusal } from "@/lib/programs/value-engine/financial-model-refusals";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function refuse(code: FinancialModelRefusal): Response {
  const { status, detail } = FINANCIAL_MODEL_REFUSAL[code];
  return Response.json({ error: code, detail }, { status });
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** The cost basis in words, from the value-case read's own record of it. */
function costBasisWords(basis: unknown): string {
  if (!isObject(basis) || basis.status !== "resolved") return "the value case's cost basis";
  const source = typeof basis.source === "string" ? basis.source : "";
  if (basis.basis === "rom_snapshot") return `the approved delivery estimate (${source.replace(/^rom:/, "")})`;
  return `the P4 estimate model (${source.replace(/^estimate_model:/, "")} delivery)`;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ programId: string }> },
) {
  try {
    const { programId } = await params;
    const ctx = await requireTenancy();
    if (isFeatureEnabled({ clientKey: ctx.clientKey, clientId: ctx.clientId }, VALUE_ENGINE_FLAG) !== true)
      return valueCaseRefusalResponse("value_engine_not_enabled");
    const { supabase } = await getProgramsRouteSupabase("program_read");
    const program = await getProgramById(ctx, programId, { supabase });
    if (!program) return Response.json(moveUnreadableRefusalBody(), { status: 404 });
    const policy = await loadUserProgramAccessPolicy(ctx, { programId });
    if (policy.accessLevel === "no_program_access"
      || (Array.isArray(policy.programIdsAllowed) && !policy.programIdsAllowed.includes(programId)))
      return refuse("forbidden");

    const delivery = req.nextUrl.searchParams.get("delivery");
    const read = await readValueCaseRoute(
      new NextRequest(`http://internal.invalid/api/v1/programs/${encodeURIComponent(programId)}/value-case${delivery ? `?delivery=${encodeURIComponent(delivery)}` : ""}`),
      { params: Promise.resolve({ programId }) },
    );
    const body: unknown = await read.json();
    // The value case's own refusals pass through unchanged, sentence and all.
    if (!read.ok || !isObject(body) || body.ok !== true)
      return Response.json(body, { status: read.ok ? 500 : read.status });
    if (body.figuresRedacted !== false) return refuse("figures_withheld");
    const result = body.case as ValueCaseResult;
    if (result.status !== "evaluated") return refuse("case_blocked");

    const modules = await getModuleState(ctx, programId, { supabase });
    const raw = modules.find((entry) => entry.moduleKey === phaseCaptureModuleKey(4, VALUE_MODEL_SECTION_KEY))?.state?.value;
    const saved = typeof raw === "string" ? readValueModel(raw) : null;
    if (!saved || saved.kind !== "model") return refuse("model_unreadable");

    // The AI-assisted scenario, when the value case evaluated one beside the funded case.
    const scenario = isObject(body.aiAssisted) && body.aiAssisted.fundingBasis === false
      && body.aiAssisted.status === "evaluated" && isObject(body.aiAssisted.economics)
      ? { label: typeof body.aiAssisted.label === "string" && body.aiAssisted.label ? body.aiAssisted.label : "AI-assisted scenario",
        economics: body.aiAssisted.economics as unknown as CaseEconomics }
      : null;
    let bytes: Buffer;
    try {
      bytes = await financialModelBuffer({
        moveName: program.name,
        model: saved.model.case,
        result,
        costBasis: costBasisWords(body.costBasis),
        aiScenario: scenario,
      });
    } catch (err) {
      if (err instanceof FinancialModelMismatch) return refuse("model_changed");
      console.error("[GET /api/v1/programs/:programId/financial-model] build", err);
      return refuse("model_failed");
    }
    return new Response(Uint8Array.from(bytes), {
      headers: {
        "Content-Type": FINANCIAL_MODEL_CONTENT_TYPE,
        "Content-Disposition": 'attachment; filename="move-financial-model.xlsx"',
        "Cache-Control": "private, no-store, max-age=0",
      },
    });
  } catch (err) {
    return tenancyOrNamedErrorResponse(err, tenancyErrorResponse, {
      code: "model_failed",
      detail: FINANCIAL_MODEL_REFUSAL.model_failed.detail,
    });
  }
}
