// GET /api/v1/programs/:programId/current-state/deliverable/orchestrate?key=program_charter&format=json|docx|html&download=1
// The Deliverable Intelligence Orchestrator: artifact brief + expert latitude +
// multi-pass (architect → draft → red-team rewrite), governed evidence only for
// client facts, quality-gated, rendered to DOCX/HTML. Higher quality than the
// single-pass board route; slower (3 Claude passes).

import { NextRequest } from "next/server";
import { requireTenancy, tenancyErrorResponse } from "../../../../_auth";
import {
  inferMoveProfile,
  resolveCurrentStateReadiness,
} from "@/lib/programs/current-state-readiness";
import { buildCurrentStateRecommendation } from "@/lib/programs/current-state-maturity";
import { buildCurrentStatePlan } from "@/lib/programs/current-state-plan";
import { generateDeliverable } from "@/lib/programs/deliverable-refinement";
import {
  getArchetype,
  DEFAULT_ARCHETYPE_ID,
} from "@/lib/programs/archetypes/registry";
import { getStrategicMoveById } from "@/lib/programs/queries";
import { orchestrateDeliverable } from "@/lib/programs/deliverables/orchestrator";
import { tenantDisplayName } from "@/lib/programs/deliverables/board-deliverable";
import {
  renderDeliverableDocx,
  renderDeliverableHtml,
} from "@/lib/programs/deliverables/render";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ programId: string }> },
) {
  try {
    const { programId } = await params;
    const ctx = await requireTenancy();
    const key = req.nextUrl.searchParams.get("key") ?? "program_charter";
    const format = (
      req.nextUrl.searchParams.get("format") ?? "json"
    ).toLowerCase();
    const download = req.nextUrl.searchParams.get("download") === "1";

    const archetype = getArchetype(DEFAULT_ARCHETYPE_ID)!;
    const spec =
      archetype.deliverablePack.find((d) => d.key === key) ??
      archetype.deliverablePack.find((d) => d.key === "program_charter") ??
      archetype.deliverablePack[0];
    if (!spec)
      return Response.json({ error: "unknown_deliverable" }, { status: 404 });

    const profile = await inferMoveProfile(ctx);
    const readiness = await resolveCurrentStateReadiness(
      ctx,
      archetype,
      profile,
      1,
      programId,
    );
    const recommendation = await buildCurrentStateRecommendation(ctx, profile);

    let moveName = tenantDisplayName(ctx.clientKey ?? "") + " initiative";
    try {
      const move = await getStrategicMoveById(ctx, programId);
      if (move?.name) moveName = move.name;
    } catch {
      /* best-effort */
    }
    const plan = buildCurrentStatePlan(recommendation, { moveName });
    const base = generateDeliverable(spec, {
      tenant: ctx.clientKey ?? ctx.clientId,
      moveId: programId,
      readiness,
      recommendation,
      plan,
    });

    const {
      result,
      quality,
      plan: outline,
      critique,
      passes,
      model,
    } = await orchestrateDeliverable({
      base,
      archetypeId: archetype.id,
      deliverableType: spec.key,
      clientKey: ctx.clientKey ?? ctx.clientId,
      tenantId: ctx.clientId,
      moveId: programId,
      moveName,
      date: new Date().toISOString().slice(0, 10),
      userId: ctx.userId,
    });

    const safeName = `${result.clientName}_${result.label}`.replace(
      /[^A-Za-z0-9]+/g,
      "_",
    );

    if (format === "docx") {
      if (!quality.pass) {
        return Response.json(
          { error: "quality_gate_failed", quality },
          { status: 422 },
        );
      }
      const buf = await renderDeliverableDocx(result);
      return new Response(new Uint8Array(buf), {
        status: 200,
        headers: {
          "content-type":
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "content-disposition": `${download ? "attachment" : "inline"}; filename="${safeName}.docx"`,
          "x-quality-pass": String(quality.pass),
          "x-quality-score": String(quality.qualityScore),
          "x-passes": String(passes),
        },
      });
    }
    if (format === "html") {
      return new Response(renderDeliverableHtml(result), {
        status: 200,
        headers: {
          "content-type": "text/html; charset=utf-8",
          ...(download
            ? {
                "content-disposition": `attachment; filename="${safeName}.html"`,
              }
            : {}),
          "x-quality-pass": String(quality.pass),
        },
      });
    }

    return Response.json({
      ok: true,
      model,
      passes,
      clientName: result.clientName,
      moveName: result.moveName,
      quality,
      plan: outline,
      critique,
      markdown: result.bodyMarkdown,
      html: renderDeliverableHtml(result),
      sourceRegister: result.sourceRegister,
      openItems: result.openItems,
      unsupportedClaims: result.unsupportedClaims,
    });
  } catch (err) {
    return tenancyErrorResponse(err);
  }
}
