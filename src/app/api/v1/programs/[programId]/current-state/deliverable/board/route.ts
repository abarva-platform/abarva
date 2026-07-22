// GET /api/v1/programs/:programId/current-state/deliverable/board?key=program_charter&format=json|docx|html&download=1
// The board-grade deliverable factory: governed evidence → clean Source Register
// → Claude (citation-hygienic, structured, tabled) → quality gate → DOCX/HTML.
// format=json (default) returns the quality report + markdown + html preview;
// format=docx/html returns the rendered artifact (attachment when download=1).

import { NextRequest } from "next/server";
import { requireTenancy, tenancyErrorResponse } from "../../../../_auth";
import {
  inferMoveProfile,
  resolveCurrentStateReadiness,
} from "@/lib/programs/current-state-readiness";
import { buildCurrentStateRecommendation } from "@/lib/programs/current-state-maturity";
import { buildCurrentStatePlan } from "@/lib/programs/current-state-plan";
import { generateDeliverable } from "@/lib/programs/deliverable-refinement";
import { getStrategicMoveById } from "@/lib/programs/queries";
import { resolveMoveArchetypeForProgram } from "@/lib/programs/move-archetype-resolution";
import { getDeliverableContract } from "@/lib/programs/deliverables/contracts";
import {
  generateBoardDeliverable,
  tenantDisplayName,
} from "@/lib/programs/deliverables/board-deliverable";
import {
  renderDeliverableDocx,
  renderDeliverableHtml,
} from "@/lib/programs/deliverables/render";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CONTRACT_BY_KEY: Record<string, string> = {
  program_charter: "program_charter",
};

function isoDate(): string {
  // Date.now/new Date are available in the Node route runtime.
  return new Date().toISOString().slice(0, 10);
}

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

    const contract = getDeliverableContract(CONTRACT_BY_KEY[key] ?? key);
    if (!contract) {
      return Response.json({ error: "unknown_deliverable" }, { status: 404 });
    }

    // Resolve the Move row first (best-effort) so the archetype comes from the
    // Move's own data, not a hardcoded default.
    let moveName = tenantDisplayName(ctx.clientKey ?? "") + " initiative";
    try {
      const move = await getStrategicMoveById(ctx, programId);
      if (move?.name) moveName = move.name;
    } catch {
      /* moveName is best-effort */
    }
    const archetype = await resolveMoveArchetypeForProgram(ctx, programId);

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

    // Map the archetype's charter deliverable spec → grounded base.
    const spec =
      archetype.deliverablePack.find((d) => d.key === "program_charter") ??
      archetype.deliverablePack[0];
    const base = generateDeliverable(spec, {
      tenant: ctx.clientKey ?? ctx.clientId,
      moveId: programId,
      readiness,
      recommendation,
      plan,
    });

    const { result, quality } = await generateBoardDeliverable({
      contract,
      base,
      clientKey: ctx.clientKey ?? ctx.clientId,
      tenantId: ctx.clientId,
      moveId: programId,
      moveName,
      date: isoDate(),
      userId: ctx.userId,
    });

    const safeName = `${result.clientName}_${contract.label}`.replace(
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
        },
      });
    }

    if (format === "html") {
      const html = renderDeliverableHtml(result);
      return new Response(html, {
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

    // default: json (report + content for inspection / preview)
    return Response.json({
      ok: true,
      generatedByClaude: result.generatedByClaude,
      model: result.model,
      clientName: result.clientName,
      moveName: result.moveName,
      version: result.version,
      date: result.date,
      quality,
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
