// GET  /api/v1/programs/:programId/current-state/deliverable?key=program_charter
//   → grounded deliverable draft (every claim cited or [MISSING EVIDENCE]).
// POST /api/v1/programs/:programId/current-state/deliverable
//   body { key?, prompt, scope, intent } → generate + apply a refinement prompt;
//   the grounding guard is enforced (no fact added beyond the evidence).
// Tenant-scoped; read-only (no writes — deliverables are drafts until governed).

import { NextRequest } from "next/server";
import { requireTenancy, tenancyErrorResponse } from "../../../_auth";
import {
  inferMoveProfile,
  resolveCurrentStateReadiness,
} from "@/lib/programs/current-state-readiness";
import { buildCurrentStateRecommendation } from "@/lib/programs/current-state-maturity";
import { buildCurrentStatePlan } from "@/lib/programs/current-state-plan";
import {
  generateDeliverable,
  refineDeliverable,
  type DeliverableInputs,
  type RefineRequest,
} from "@/lib/programs/deliverable-refinement";
import {
  getArchetype,
  DEFAULT_ARCHETYPE_ID,
} from "@/lib/programs/archetypes/registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function buildInputs(
  programId: string,
  archetypeId: string,
): Promise<{
  inputs: DeliverableInputs;
  archetype: ReturnType<typeof getArchetype>;
}> {
  const ctx = await requireTenancy();
  const archetype =
    getArchetype(archetypeId) ?? getArchetype(DEFAULT_ARCHETYPE_ID)!;
  const profile = await inferMoveProfile(ctx);
  const readiness = await resolveCurrentStateReadiness(
    ctx,
    archetype,
    profile,
    1,
    programId,
  );
  const recommendation = await buildCurrentStateRecommendation(ctx, profile);
  const plan = buildCurrentStatePlan(recommendation, { moveName: programId });
  return {
    inputs: {
      tenant: ctx.clientKey ?? ctx.clientId,
      moveId: programId,
      readiness,
      recommendation,
      plan,
    },
    archetype,
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ programId: string }> },
) {
  try {
    const { programId } = await params;
    const key = req.nextUrl.searchParams.get("key") ?? "program_charter";
    const { inputs, archetype } = await buildInputs(
      programId,
      DEFAULT_ARCHETYPE_ID,
    );
    const spec = archetype!.deliverablePack.find((d) => d.key === key);
    if (!spec)
      return Response.json({ error: "unknown_deliverable" }, { status: 404 });
    return Response.json(generateDeliverable(spec, inputs));
  } catch (err) {
    return tenancyErrorResponse(err);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ programId: string }> },
) {
  try {
    const { programId } = await params;
    const body = (await req.json().catch(() => ({}))) as {
      key?: string;
      prompt?: string;
      scope?: RefineRequest["scope"];
      intent?: RefineRequest["intent"];
      sectionHeading?: string;
    };
    const key = body.key ?? "program_charter";
    const { inputs, archetype } = await buildInputs(
      programId,
      DEFAULT_ARCHETYPE_ID,
    );
    const spec = archetype!.deliverablePack.find((d) => d.key === key);
    if (!spec)
      return Response.json({ error: "unknown_deliverable" }, { status: 404 });

    const base = generateDeliverable(spec, inputs);
    if (!body.prompt) return Response.json(base);

    const refined = refineDeliverable(base, {
      prompt: body.prompt,
      scope: body.scope ?? "whole",
      intent: body.intent ?? "quality",
      sectionHeading: body.sectionHeading,
    });
    return Response.json(refined);
  } catch (err) {
    return tenancyErrorResponse(err);
  }
}
