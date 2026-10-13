import { requireTenancy, tenancyErrorResponse } from "../../../_auth";
import { loadUserProgramAccessPolicy } from "@/lib/auth/program-access-policy";
import { sanitizeRestrictedFinancialText } from "@/lib/agent/restricted-output-policy";
import { isFeatureEnabled } from "@/lib/features/is-feature-enabled";
import { getProgramById } from "@/lib/programs/queries";
import { AUTHORED_P1_UPLOAD_FLAG, AUTHORED_P2_UPLOAD_FLAG, authoredUploadFlag, AuthoredUploadRefusal, admitAuthoredDraft, admitAuthoredP1Draft } from "@/lib/programs/authored-deliverable-upload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(req: Request, { params }: { params: Promise<{ programId: string }> }) {
  try {
    const ctx = await requireTenancy();
    if (!isFeatureEnabled(ctx, AUTHORED_P1_UPLOAD_FLAG) && !isFeatureEnabled(ctx, AUTHORED_P2_UPLOAD_FLAG))
      return Response.json({ error: "not_found" }, { status: 404 });
    const form = await req.formData();
    const field = (name: string) => typeof form.get(name) === "string" ? String(form.get(name)) : "";
    const declaredPhase = field("phase");
    if (declaredPhase && declaredPhase !== "1" && declaredPhase !== "2")
      return Response.json({ error: "authored_phase_invalid" }, { status: 400 });
    const phase = declaredPhase === "2" ? 2 : 1;
    if (!isFeatureEnabled(ctx, authoredUploadFlag(phase))) return Response.json({ error: "not_found" }, { status: 404 });
    const { programId } = await params;
    const program = await getProgramById(ctx, programId);
    if (!program) return Response.json({ error: "move_not_readable" }, { status: 404 });
    const policy = await loadUserProgramAccessPolicy(ctx, { programId });
    if (!policy.canUploadArtifacts || !policy.canGenerateDeliverables ||
      (Array.isArray(policy.programIdsAllowed) && !policy.programIdsAllowed.includes(programId)))
      return Response.json({ error: "forbidden", detail: "Move upload and document-author permissions are required." }, { status: 403 });
    if (phase === 2 && program.currentPhase !== 2) return Response.json({ error: "authored_phase_not_current",
      detail: "Initial P2 authored documents require the current P2 phase." }, { status: 409 });
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) return Response.json({ error: "file_required" }, { status: 400 });
    if (file.size > 20 * 1024 * 1024) return Response.json({ error: "file_too_large" }, { status: 413 });
    const companion = form.get("companionFile");
    if (companion !== null && !(companion instanceof File)) return Response.json({ error: "companion_file_invalid" }, { status: 400 });
    if (companion instanceof File && companion.size > 20 * 1024 * 1024) return Response.json({ error: "file_too_large" }, { status: 413 });
    const input = { phase, moveId: programId, key: field("deliverableTypeKey"),
      requestId: field("requestId"), expectedState: field("expectedState"), expectedFileSha256: field("expectedFileSha256"),
      delegatedReviewReference: field("delegatedReviewReference"), fileName: file.name, mimeType: file.type,
      body: Buffer.from(await file.arrayBuffer()), canStoreText: (text: string) => sanitizeRestrictedFinancialText(text, policy) === text,
      ...(companion instanceof File ? { companionFile: { fileName: companion.name, mimeType: companion.type,
        body: Buffer.from(await companion.arrayBuffer()), expectedFileSha256: field("companionFileSha256") } } : {}) };
    const result = phase === 1 ? await admitAuthoredP1Draft(ctx, input) : await admitAuthoredDraft(ctx, { ...input, phase });
    return Response.json({ ok: true, ...result }, { status: result.replayed ? 200 : 201 });
  } catch (error) {
    if (error instanceof AuthoredUploadRefusal) return Response.json({ error: error.code, detail: error.message,
      storedArtifactId: error.storedArtifactId, admissionConfirmed: false,
      ...(error.retainedOriginals ? { retainedOriginals: error.retainedOriginals } : {}) }, { status: error.status });
    try { return tenancyErrorResponse(error); } catch { /* Unknown reads fail closed. */ }
    return Response.json({ error: "authored_admission_unavailable", detail: "The admission request could not be verified. Check the current document before retrying." }, { status: 503 });
  }
}
