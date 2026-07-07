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
import { resolveProgramArchetype } from "@/lib/programs/archetypes/registry";
import { getStrategicMoveById } from "@/lib/programs/queries";
import type { StrategicMoveArchetype } from "@/lib/programs/archetypes/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function buildInputs(programId: string): Promise<{
  inputs: DeliverableInputs;
  archetype: StrategicMoveArchetype;
}> {
  const ctx = await requireTenancy();
  // Archetype resolved from the Move's own row (best-effort) — never a
  // hardcoded default for a Move we can read.
  let moveName = programId;
  let archetype = resolveProgramArchetype({});
  try {
    const move = await getStrategicMoveById(ctx, programId);
    if (move?.name) moveName = move.name;
    if (move) {
      archetype = resolveProgramArchetype({
        archetype: move.archetype,
        classification: (move.charter as { classification?: string } | null)
          ?.classification,
        name: move.name,
      });
    }
  } catch {
    /* best-effort */
  }
  const profile = await inferMoveProfile(ctx);
  const readiness = await resolveCurrentStateReadiness(
    ctx,
    archetype,
    profile,
    1,
    programId,
  );
  const recommendation = await buildCurrentStateRecommendation(ctx, profile);
  const plan = buildCurrentStatePlan(recommendation, { moveName });
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
    const { inputs, archetype } = await buildInputs(programId);
    const spec = archetype.deliverablePack.find((d) => d.key === key);
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
    const { inputs, archetype } = await buildInputs(programId);
    const spec = archetype.deliverablePack.find((d) => d.key === key);
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
