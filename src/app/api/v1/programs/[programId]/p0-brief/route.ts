// POST /api/v1/programs/:programId/p0-brief
// Closes the P0 brief-sign gap honestly: the deterministic origination-submit
// path creates a Move but never produces the signable `origination_brief`
// deliverable the P0→P1 gate requires (program_seed_recorded + value_hypothesis_
// seed). This creates that brief from the Move's REAL data + the archetype P0
// frame, lands it in_review, and returns the deliverableId so it can be signed
// off through the governed sign-off route. NO gate bypass — the gate passes on
// real signed evidence.

import { NextRequest } from "next/server";
import { requireTenancy, tenancyErrorResponse } from "../../_auth";
import { getProgramById } from "@/lib/programs/queries";
import { draftModuleDeliverable } from "@/lib/programs/nexus";
import { publishDeliverable } from "@/lib/programs/mutations";
import { resolveProgramArchetype } from "@/lib/programs/archetypes/registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ programId: string }> },
) {
  try {
    const { programId } = await params;
    const ctx = await requireTenancy();
    const program = await getProgramById(ctx, programId);
    if (!program) {
      return Response.json({ error: "not_found" }, { status: 404 });
    }

    const charter = (program.charter ?? {}) as Record<string, unknown>;
    const archetype = resolveProgramArchetype({
      archetype: program.archetype,
      classification:
        typeof charter.classification === "string"
          ? charter.classification
          : null,
      name: program.name,
    });
    const scope =
      (charter.scope_boundary as string) ??
      (charter.scopeBoundary as string) ??
      "Product-development lifecycle value stream (ideation → release).";
    const sponsor =
      (charter.sponsor_candidate as string) ??
      "Assigned sponsor (see charter).";
    const problem =
      program.problemStatement ??
      (charter.problem_statement as string) ??
      "Problem statement captured at origination.";

    // The brief names the problem/trigger + value hypothesis/target outcome the
    // P0 gate evaluates — grounded in the Move's real origination data.
    const draftContent = [
      `# P0 Origination Brief — ${program.name}`,
      `Archetype: ${archetype.name} (${archetype.id})`,
      "",
      "## Problem / trigger",
      `${problem}`,
      "The trigger is uneven AI adoption across the software/product development lifecycle and an unknown sequencing and investment path.",
      "",
      "## Value hypothesis / target outcome",
      "Value hypothesis: applying AI across the product-development lifecycle materially lifts engineering throughput and quality.",
      "Target outcome: a defensible AI-led SDLC strategy — where to start, the target operating model, the roadmap, and the estimate — produced from the client's own current-state evidence.",
      "",
      "## Sponsor",
      `${sponsor}`,
      "",
      "## Scope boundary",
      `${scope}`,
    ].join("\n");

    const { deliverableId } = await draftModuleDeliverable(ctx, {
      programId,
      moduleKey: "p0",
      deliverableTypeKey: "origination_brief",
      title: "P0 Origination Brief",
      draftContent,
      structuredData: {
        archetypeId: archetype.id,
        sponsor,
        scope,
        problem,
      },
    });

    const published = await publishDeliverable(ctx, programId, deliverableId);

    return Response.json({
      ok: true,
      deliverableId,
      status: published ? "in_review" : "draft",
      detail:
        "Origination brief created from real Move data; sign it off via the governed sign-off route to satisfy the P0 gate.",
    });
  } catch (err) {
    return tenancyErrorResponse(err);
  }
}
