// GET /api/v1/programs/:programId/current-state/readiness?phase=N
// Infers the Move's estate profile and resolves current-state readiness (which
// instruments are required for this estate at this phase, committed vs missing),
// scoped to the active tenant. Read-only.

import { NextRequest } from "next/server";
import { requireTenancy, tenancyErrorResponse } from "../../../_auth";
import {
  inferMoveProfile,
  resolveCurrentStateReadiness,
} from "@/lib/programs/current-state-readiness";
import { resolveProgramArchetype } from "@/lib/programs/archetypes/registry";
import { getProgramById } from "@/lib/programs/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function textFromUnknown(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (!value || typeof value !== "object") return null;

  const record = value as Record<string, unknown>;
  const parts = [
    record.archetype,
    record.classification,
    record.label,
    record.name,
    record.title,
    record.summary,
  ].filter(
    (part): part is string =>
      typeof part === "string" && part.trim().length > 0,
  );

  return parts.length ? parts.join(" ") : null;
}

function scaffoldText(
  charter: Record<string, unknown> | null,
  key: string,
): string | null {
  if (!charter) return null;
  const direct = textFromUnknown(charter[key]);
  if (direct) return direct;
  const scaffold = charter.scaffold;
  if (!scaffold || typeof scaffold !== "object") return null;
  return textFromUnknown((scaffold as Record<string, unknown>)[key]);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ programId: string }> },
) {
  try {
    const { programId } = await params;
    const ctx = await requireTenancy();

    const phaseParam = req.nextUrl.searchParams.get("phase");
    const phase = Number(phaseParam ?? "1");
    if (!Number.isFinite(phase) || phase < 0 || phase > 5) {
      return Response.json({ error: "invalid_phase" }, { status: 400 });
    }

    // Archetype resolved from the raw Move row/charter (best-effort). Do not
    // use the display view model here; readiness gates need the P0 scaffold
    // classification exactly as captured.
    let archetype = resolveProgramArchetype({});
    try {
      const program = await getProgramById(ctx, programId);
      if (program) {
        const charter = program.charter ?? null;
        const classification = [
          scaffoldText(charter, "archetype"),
          scaffoldText(charter, "classification"),
          scaffoldText(charter, "resolved_program_archetype"),
          scaffoldText(charter, "problem_statement"),
          scaffoldText(charter, "scope_boundary"),
          scaffoldText(charter, "evidence_family"),
        ]
          .filter((part): part is string => Boolean(part))
          .join(" ");

        archetype = resolveProgramArchetype({
          archetype: program.archetype,
          classification,
          name: program.name,
        });
      }
    } catch {
      /* best-effort */
    }
    const profile = await inferMoveProfile(ctx);
    const report = await resolveCurrentStateReadiness(
      ctx,
      archetype,
      profile,
      phase,
      programId,
    );
    return Response.json(report);
  } catch (err) {
    return tenancyErrorResponse(err);
  }
}
