// GET  /api/v1/programs/:programId/design/intake  → scoped design questions
// POST /api/v1/programs/:programId/design/intake  → record an ATTESTED answer
// P3 Design intake: scoped by the approved Discovery (diagnose answers) so it
// never re-asks; captured as governed attested intake. Feeds the Solution
// Approach & Architecture deliverable.

import { NextRequest } from "next/server";
import { requireTenancy, tenancyErrorResponse } from "../../../_auth";
import {
  buildDesignQuestions,
  recordDesignAnswer,
  resolveDesignIntake,
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
    const diagnose = await resolveDiagnoseIntake(ctx, programId);
    const answered = await resolveDesignIntake(ctx, programId);
    const questions = buildDesignQuestions(diagnose, answered);
    return Response.json({
      ok: true,
      phase: "design",
      diagnoseGrounded: Object.keys(diagnose).length,
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
    const { evidenceId } = await recordDesignAnswer(ctx, {
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
