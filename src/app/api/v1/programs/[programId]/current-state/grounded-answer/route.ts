// GET  /api/v1/programs/:programId/current-state/grounded-answer
//   → the 6 canonical CXO questions answered grounded from the archetype bundle.
// POST /api/v1/programs/:programId/current-state/grounded-answer { question }
//   → one grounded answer. Every answer cites committed evidence or names the
//     missing evidence — unsupportedClaims is always []. Tenant-scoped.

import { NextRequest } from "next/server";
import { requireTenancy, tenancyErrorResponse } from "../../../_auth";
import {
  buildArchetypeContextBundle,
  answerGrounded,
  CANONICAL_QUESTIONS,
} from "@/lib/programs/archetype-context-bundle";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ programId: string }> },
) {
  try {
    const { programId } = await params;
    const ctx = await requireTenancy();
    const bundle = await buildArchetypeContextBundle(ctx, programId, 1);
    const answers = CANONICAL_QUESTIONS.map((q) => answerGrounded(bundle, q));
    return Response.json({
      tenant: bundle.tenant,
      archetype: bundle.archetype,
      phase: bundle.phase,
      answers,
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
    const body = (await req.json().catch(() => ({}))) as { question?: string };
    if (!body.question) {
      return Response.json({ error: "question_required" }, { status: 400 });
    }
    const bundle = await buildArchetypeContextBundle(ctx, programId, 1);
    return Response.json(answerGrounded(bundle, body.question));
  } catch (err) {
    return tenancyErrorResponse(err);
  }
}
