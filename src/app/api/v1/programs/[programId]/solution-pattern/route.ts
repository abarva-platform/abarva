// GET/POST /api/v1/programs/:programId/solution-pattern
// Tenant-gated by `moves_solution_pattern_gate_v1` (default off). Persists
// the 5-pattern platform-fit classification into engagements.charter (same
// isolated seam as risk-assessment and p0-extended-intake-fields).
//
// The option set is per-DECLARED-archetype (solution-pattern-catalog.ts), so
// this route is the authority on which five a Move may be asked and may record
// — the panel renders the set this route returns. Resolution is exact-match on
// the declared id with the shipped set as the fallback, so a Move that declares
// nothing is served and validated exactly as before.

import { NextRequest } from "next/server";
import { requireTenancy, tenancyErrorResponse } from "../../_auth";
import { getProgramById } from "@/lib/programs/queries";
import { getProgramsRouteSupabase } from "@/lib/programs/programs-auth-mode-server";
import { isFeatureEnabled } from "@/lib/features/is-feature-enabled";
import {
  applySolutionPatternIfEnabled,
  readSolutionPatternFromCharter,
  type SolutionPatternFields,
} from "@/lib/programs/solution-pattern";
import {
  isSolutionPatternAllowedFor,
  solutionPatternOptionsFor,
} from "@/lib/programs/solution-pattern-catalog";
import { resolveDeclaredProgramArchetypeId } from "@/lib/programs/discovery/evidence-readiness";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Write validation is scoped to the set this Move's DECLARED archetype is
 * asked, not to every pattern the catalog knows. A classification that
 * misdescribes the declared kind of work is refused rather than written to the
 * charter as a named owner's judgement.
 */
function parseFields(
  body: unknown,
  declaredArchetypeId: string | null,
): SolutionPatternFields | null {
  if (typeof body !== "object" || body === null) return null;
  const record = body as Record<string, unknown>;
  if (!isSolutionPatternAllowedFor(declaredArchetypeId, record.pattern))
    return null;
  if (typeof record.rationale !== "string" || !record.rationale.trim())
    return null;
  return {
    pattern: record.pattern as SolutionPatternFields["pattern"],
    rationale: record.rationale.trim(),
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ programId: string }> },
) {
  try {
    const { programId } = await params;
    const ctx = await requireTenancy();
    const { supabase } = await getProgramsRouteSupabase("program_read");

    if (!isFeatureEnabled(ctx, "moves_solution_pattern_gate_v1")) {
      return Response.json({ error: "not_enabled" }, { status: 404 });
    }

    const program = await getProgramById(ctx, programId, { supabase });
    if (!program) return Response.json({ error: "not_found" }, { status: 404 });

    const fields = readSolutionPatternFromCharter(
      program.charter as Record<string, unknown> | null,
    );
    return Response.json({
      ok: true,
      fields,
      options: solutionPatternOptionsFor(
        resolveDeclaredProgramArchetypeId(program),
      ),
    });
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
    const ctx = await requireTenancy();
    const { supabase } = await getProgramsRouteSupabase("mutation");

    if (!isFeatureEnabled(ctx, "moves_solution_pattern_gate_v1")) {
      return Response.json({ error: "not_enabled" }, { status: 404 });
    }

    const program = await getProgramById(ctx, programId, { supabase });
    if (!program) return Response.json({ error: "not_found" }, { status: 404 });

    const body = (await req.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;
    const fields = parseFields(
      body,
      resolveDeclaredProgramArchetypeId(program),
    );
    if (!fields) {
      return Response.json(
        {
          error: "bad_request",
          detail:
            "A pattern this Move is offered and a non-empty rationale are both required",
        },
        { status: 400 },
      );
    }

    const currentCharter = (program.charter ?? {}) as Record<string, unknown>;
    const merged = applySolutionPatternIfEnabled(currentCharter, fields, true);

    const { error: chErr } = await supabase
      .from("engagements")
      .update({ charter: merged })
      .eq("id", programId);
    if (chErr) {
      return Response.json(
        { error: "charter_write_failed", detail: chErr.message },
        { status: 500 },
      );
    }

    return Response.json({ ok: true, fields });
  } catch (err) {
    return tenancyErrorResponse(err);
  }
}
