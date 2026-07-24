// GET  /api/v1/programs/:programId/playbook?phase=3
//   → the facilitated-session playbook for the phase (sessions, discussion
//     guides, frameworks, capture templates, homework, gates).
// POST /api/v1/programs/:programId/playbook?phase=3
//   → renders the Design Session Pack and stores it in the Artifact Vault.

import { NextRequest } from "next/server";
import { requireTenancy, tenancyErrorResponse } from "../../_auth";
import { getStrategicMoveById } from "@/lib/programs/queries";
import {
  getMovePhasePlaybook,
  type MovePhase,
} from "@/lib/programs/playbook/move-phase-playbook";
import { AI_PDLC_SESSION_OVERRIDES } from "@/lib/programs/playbook/ai-pdlc-design-sessions";
import { generateDesignSessionPack } from "@/lib/programs/playbook/design-session-pack";
import { resolveMoveArchetypeForProgram } from "@/lib/programs/move-archetype-resolution";
import { AI_PRODUCT_DEVELOPMENT_LIFECYCLE } from "@/lib/programs/archetypes/registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

async function resolve(req: NextRequest, programId: string) {
  const ctx = await requireTenancy();
  let phase: number | null = null;
  let moveName = "Strategic Move";
  let isAiPdlc = false;
  try {
    const move = await getStrategicMoveById(ctx, programId);
    phase = move?.currentPhase ?? null;
    if (move?.name) moveName = move.name;
    // Canonical archetype resolution (same registry every other archetype-aware
    // route uses), not a free-text regex over the coarse UI-label `archetype`
    // field — that field is a 5-value display category
    // (`strategic_transformation` etc.), not the fine-grained framework
    // archetype id, and never reliably contains "pdlc"/"sdlc" substrings.
    const archetype = await resolveMoveArchetypeForProgram(ctx, programId);
    isAiPdlc = archetype.id === AI_PRODUCT_DEVELOPMENT_LIFECYCLE.id;
  } catch {
    /* best-effort */
  }
  const qp = req.nextUrl.searchParams.get("phase");
  if (qp !== null && qp !== "") phase = Number(qp);
  const overrides = isAiPdlc
    ? (AI_PDLC_SESSION_OVERRIDES as Partial<
        Record<MovePhase, (typeof AI_PDLC_SESSION_OVERRIDES)[3]>
      >)
    : undefined;
  const playbook = getMovePhasePlaybook(phase, overrides);
  return { ctx, phase, moveName, isAiPdlc, playbook };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ programId: string }> },
) {
  try {
    const { programId } = await params;
    const { phase, moveName, isAiPdlc, playbook } = await resolve(
      req,
      programId,
    );
    if (!playbook)
      return Response.json(
        { ok: true, phase, playbook: null, detail: "no playbook for phase" },
        { status: 200 },
      );
    return Response.json({ ok: true, phase, moveName, isAiPdlc, playbook });
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
    const { ctx, moveName, playbook } = await resolve(req, programId);
    if (!playbook)
      return Response.json({ error: "no_playbook_for_phase" }, { status: 404 });
    const saved = await generateDesignSessionPack(ctx, {
      moveId: programId,
      moveName,
      playbook,
    });
    return Response.json({
      ok: true,
      phase: playbook.phase,
      sessionCount: playbook.sessions.length,
      artifactId: saved.artifactId,
      blobStored: saved.blobStored,
      downloadUrl: `/api/v1/programs/${programId}/artifacts/${saved.artifactId}/download`,
    });
  } catch (err) {
    return tenancyErrorResponse(err);
  }
}
