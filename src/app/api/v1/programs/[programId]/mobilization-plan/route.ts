/**
 * GET /api/v1/programs/<moveId>/mobilization-plan — the P5 mobilization and
 * execution plan as a live-formula workbook (`mobilization-plan/workbook.ts`).
 *
 * It needs an approved, current estimate: the approval is recomputed on the
 * rates it was approved on and must reproduce its approved figures, exactly as
 * the estimate workbook download requires. Every other part (P4 milestones,
 * P3 owners, open register rows, P5 readiness and open items) is read through
 * the Move's own read paths; a part that cannot be read is named in the
 * workbook, never filled in. Nothing is stored.
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
import { phaseCaptureModuleKey } from "@/lib/programs/phase-capture-contract";
import { GET as readRegisterRoute } from "@/app/api/v1/programs/[programId]/assumptions/route";
import { GET as readCaptureRoute } from "@/app/api/v1/programs/[programId]/phase-capture/route";
import {
  previewMatchesApproval,
  readApprovedRomSnapshot,
} from "@/lib/pricing/moves-workflow/approved-rom-snapshot";
import { computeRom } from "@/lib/pricing/moves-workflow/rom-service";
import { approvedRomLoaders } from "@/lib/deliverables/orchestrator/reference-deck-workbook";
import { canonicalTenantKey } from "@/lib/tenant/aliases";
import { P4_ROADMAP_PLAN_KEY, parseP4RoadmapPlan } from "@/lib/programs/p4-roadmap-plan";
import { parseOperatingAdoption } from "@/lib/programs/operating-adoption";
import { MOBILIZATION_PLAN_REFUSAL, type MobilizationPlanRefusal } from "@/lib/programs/mobilization-plan/refusals";
import {
  MOBILIZATION_PLAN_CONTENT_TYPE,
  mobilizationPlanBuffer,
  type MobilizationOpenAssumption,
  type MobilizationPlanInputs,
  type PlanRead,
} from "@/lib/programs/mobilization-plan/workbook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function refuse(code: MobilizationPlanRefusal): Response {
  const { status, detail } = MOBILIZATION_PLAN_REFUSAL[code];
  return Response.json({ error: code, detail }, { status });
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function routeRead(moveId: string) {
  const params = { params: Promise.resolve({ programId: moveId }) };
  return async (input: RequestInfo | URL): Promise<Response> => {
    const path = String(input);
    const request = new NextRequest(`http://internal.invalid${path}`);
    return path.includes("/assumptions") ? readRegisterRoute(request, params) : readCaptureRoute(request, params);
  };
}

async function openAssumptions(moveId: string): Promise<PlanRead<MobilizationOpenAssumption[]>> {
  try {
    const response = await routeRead(moveId)(`/api/v1/programs/${encodeURIComponent(moveId)}/assumptions`);
    const body: unknown = await response.json();
    if (!response.ok || !isObject(body) || !Array.isArray(body.assumptions))
      return { status: "gap", detail: "The assumptions register could not be read." };
    return {
      status: "ready",
      value: body.assumptions.filter(isObject).filter((row) => row.status === "open").map((row) => ({
        id: String(row.id ?? ""),
        statement: String(row.statement ?? ""),
        ownerRole: typeof row.ownerRole === "string" && row.ownerRole ? row.ownerRole : null,
        source: typeof row.source === "string" && row.source ? row.source : null,
      })),
    };
  } catch {
    return { status: "gap", detail: "The assumptions register could not be read." };
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ programId: string }> },
) {
  try {
    const { programId } = await params;
    const ctx = await requireTenancy();
    if (isFeatureEnabled({ clientKey: ctx.clientKey, clientId: ctx.clientId }, "moves_rom_engine_v1") !== true)
      return refuse("not_enabled");
    const { supabase } = await getProgramsRouteSupabase("program_read");
    const program = await getProgramById(ctx, programId, { supabase });
    if (!program) return Response.json(moveUnreadableRefusalBody(), { status: 404 });
    const policy = await loadUserProgramAccessPolicy(ctx, { programId });
    if (policy.accessLevel === "no_program_access"
      || (Array.isArray(policy.programIdsAllowed) && !policy.programIdsAllowed.includes(programId)))
      return refuse("forbidden");

    const approval = await readApprovedRomSnapshot(programId, routeRead(programId) as typeof fetch);
    if (approval.status === "missing") return refuse("estimate_not_approved");
    if (approval.status === "stale") return refuse("estimate_stale");
    if (approval.status === "failed") return refuse("estimate_unreadable");
    const snapshot = approval.snapshot;
    let result;
    try {
      const loaders = await approvedRomLoaders(canonicalTenantKey(ctx.clientKey ?? "") ?? "", snapshot.workbookStructure.rateCard);
      result = computeRom(snapshot.workbookStructure, loaders);
    } catch {
      return refuse("estimate_mismatch");
    }
    if (!result.ok || !previewMatchesApproval(result, snapshot.result)) return refuse("estimate_mismatch");

    const modules = await getModuleState(ctx, programId, { supabase });
    const capture = (phase: number, key: string): string => {
      const value = modules.find((entry) => entry.moduleKey === phaseCaptureModuleKey(phase, key))?.state?.value;
      return typeof value === "string" ? value : "";
    };
    const roadmapRaw = capture(4, P4_ROADMAP_PLAN_KEY);
    const roadmap = roadmapRaw.trim() ? parseP4RoadmapPlan(roadmapRaw) : null;
    const adoptionRaw = capture(3, "operating_adoption");
    const adoption = adoptionRaw.trim() ? parseOperatingAdoption(adoptionRaw) : null;
    const pin = snapshot.workbookStructure.rateCard;
    const input: MobilizationPlanInputs = {
      moveName: program.name,
      estimate: {
        id: snapshot.id,
        approvedAt: snapshot.approvedAt,
        result,
        rateCard: pin?.mode === "client" ? "the workspace's client rate card, version locked at approval" : "reference rates",
      },
      milestones: roadmap ? { status: "ready", value: roadmap.milestones }
        : { status: "gap", detail: roadmapRaw.trim() ? "The P4 milestone plan could not be read." : "No P4 milestone plan has been saved." },
      owners: adoption ? { status: "ready", value: { acceptedAt: adoption.ownersAcceptedAt ?? null, rows: adoption.rows } }
        : { status: "gap", detail: adoptionRaw.trim() ? "The P3 operating model could not be read." : "No P3 owners have been recorded." },
      openAssumptions: await openAssumptions(programId),
      p5: { status: "ready", value: Object.fromEntries(["launch_readiness", "mobilization_plan", "risks_open_items"].map((key) => [key, capture(5, key)])) },
    };
    let bytes: Buffer;
    try {
      bytes = await mobilizationPlanBuffer(input);
    } catch (err) {
      console.error("[GET /api/v1/programs/:programId/mobilization-plan] build", err);
      return refuse("plan_failed");
    }
    return new Response(Uint8Array.from(bytes), {
      headers: {
        "Content-Type": MOBILIZATION_PLAN_CONTENT_TYPE,
        "Content-Disposition": 'attachment; filename="move-mobilization-plan.xlsx"',
        "Cache-Control": "private, no-store, max-age=0",
      },
    });
  } catch (err) {
    return tenancyOrNamedErrorResponse(err, tenancyErrorResponse, {
      code: "plan_failed",
      detail: MOBILIZATION_PLAN_REFUSAL.plan_failed.detail,
    });
  }
}
