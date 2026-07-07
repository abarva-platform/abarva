// GET  /api/v1/programs/:programId/diagnose/intake  → scoped diagnose questions
// POST /api/v1/programs/:programId/diagnose/intake  → record an ATTESTED answer
// The real "drive a response" for P2 Diagnose: scoped to what we don't already
// know (references the committed maturity/gap analysis), captured as governed,
// attested intake — never invented.

import { NextRequest } from "next/server";
import { requireTenancy, tenancyErrorResponse } from "../../../_auth";
import {
  inferMoveProfile,
  resolveCurrentStateReadiness,
} from "@/lib/programs/current-state-readiness";
import { buildCurrentStateRecommendation } from "@/lib/programs/current-state-maturity";
import { resolveProgramArchetype } from "@/lib/programs/archetypes/registry";
import { getStrategicMoveById } from "@/lib/programs/queries";
import {
  buildDiagnoseQuestions,
  recordDiagnoseAnswer,
  resolveDiagnoseIntake,
} from "@/lib/programs/deliverables/diagnose-intake";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ programId: string }> },
) {
  try {
    const { programId } = await params;
    const ctx = await requireTenancy();
    // Archetype resolved from the Move's own row (best-effort) — never a
    // hardcoded default for a Move we can read.
    let archetype = resolveProgramArchetype({});
    try {
      const move = await getStrategicMoveById(ctx, programId);
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
      2,
      programId,
    );
    const recommendation = await buildCurrentStateRecommendation(ctx, profile);
    const answered = await resolveDiagnoseIntake(ctx, programId);
    const questions = buildDiagnoseQuestions(
      readiness,
      recommendation,
      answered,
    );
    return Response.json({
      ok: true,
      phase: "diagnose",
      answeredCount: Object.keys(answered).length,
      total: questions.length,
      questions,
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
    const body = (await req.json().catch(() => ({}))) as {
      questionId?: string;
      prompt?: string;
      answer?: string;
      attestation?: string;
    };
    if (!body.questionId || !body.answer || body.answer.trim().length < 3) {
      return Response.json(
        {
          error: "answer_required",
          detail: "questionId + answer (≥3 chars) required",
        },
        { status: 400 },
      );
    }
    const attestation =
      body.attestation === "client_attested" ||
      body.attestation === "sme_attested" ||
      body.attestation === "representative_attested"
        ? body.attestation
        : "sme_attested";
    const { evidenceId } = await recordDiagnoseAnswer(ctx, {
      moveId: programId,
      questionId: body.questionId,
      prompt: body.prompt ?? body.questionId,
      answer: body.answer.trim(),
      attestation,
    });
    return Response.json({ ok: true, evidenceId, attestation });
  } catch (err) {
    return tenancyErrorResponse(err);
  }
}
