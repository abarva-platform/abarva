// GET/POST /api/v1/programs/:programId/current-state/deliverable/narrative?key=program_charter
// Board-grade, Claude-GENERATED deliverable, grounded in the move's committed
// evidence bundle. Falls back to the deterministic grounded draft (markdown) if
// Claude egress is unavailable/denied — never fabricates, never hard-fails.

import { NextRequest } from "next/server";
import { requireTenancy, tenancyErrorResponse } from "../../../../_auth";
import {
  inferMoveProfile,
  resolveCurrentStateReadiness,
} from "@/lib/programs/current-state-readiness";
import { buildCurrentStateRecommendation } from "@/lib/programs/current-state-maturity";
import { buildCurrentStatePlan } from "@/lib/programs/current-state-plan";
import { generateDeliverable } from "@/lib/programs/deliverable-refinement";
import { generateNarrativeDeliverable } from "@/lib/programs/deliverable-narrative";
import {
  resolveSourceLabel,
  scrubInternalSourceTags,
} from "@/lib/programs/deliverables/source-labels";
import { resolveProgramArchetype } from "@/lib/programs/archetypes/registry";
import { getStrategicMoveById } from "@/lib/programs/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Deterministic grounded draft → markdown (the fallback when Claude is unavailable).
function renderBaseMarkdown(
  base: ReturnType<typeof generateDeliverable>,
): string {
  const lines: string[] = [`# ${base.label}`, ""];
  for (const s of base.sections) {
    lines.push(`## ${s.heading}`);
    for (const c of s.claims) {
      lines.push(
        c.missingEvidence
          ? `- **[MISSING EVIDENCE]** ${c.text.replace(/^\[MISSING EVIDENCE\]\s*/, "")}`
          : `- ${c.text} _(source: ${resolveSourceLabel(c.citation ?? "").title})_`,
      );
    }
    lines.push("");
  }
  return scrubInternalSourceTags(lines.join("\n"));
}

async function handle(req: NextRequest, programId: string) {
  const ctx = await requireTenancy();
  const key =
    req.nextUrl.searchParams.get("key") ??
    ((await req.json().catch(() => ({}))) as { key?: string }).key ??
    "program_charter";

  // Resolve the Move row first (best-effort) so the archetype comes from the
  // Move's own data, not a hardcoded default.
  let moveName = key;
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
    /* name/archetype are best-effort */
  }

  const spec = archetype.deliverablePack.find((d) => d.key === key);
  if (!spec) {
    return Response.json({ error: "unknown_deliverable" }, { status: 404 });
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

  const base = generateDeliverable(spec, {
    tenant: ctx.clientKey ?? ctx.clientId,
    moveId: programId,
    readiness,
    recommendation,
    plan,
  });

  // Try the Claude-grounded narrative; on any egress failure, fall back to the
  // deterministic grounded draft so the caller always gets a usable, honest doc.
  try {
    const narrative = await generateNarrativeDeliverable({
      spec,
      base,
      tenant: ctx.clientKey ?? ctx.clientId,
      tenantId: ctx.clientId,
      moveId: programId,
      moveName,
      userId: ctx.userId,
    });
    return Response.json({
      ok: true,
      generatedByClaude: true,
      model: narrative.model,
      label: narrative.label,
      markdown: narrative.markdown,
      envelope: narrative.envelope,
      evidenceFactCount: narrative.evidenceFactCount,
      openGapCount: narrative.openGapCount,
    });
  } catch (err) {
    return Response.json({
      ok: true,
      generatedByClaude: false,
      fallbackReason: err instanceof Error ? err.message : String(err),
      label: base.label,
      markdown: renderBaseMarkdown(base),
      envelope: base.envelope,
    });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ programId: string }> },
) {
  try {
    const { programId } = await params;
    return await handle(req, programId);
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
    return await handle(req, programId);
  } catch (err) {
    return tenancyErrorResponse(err);
  }
}
