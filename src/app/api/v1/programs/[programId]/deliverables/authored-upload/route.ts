import { requireTenancy, tenancyErrorResponse } from "../../../_auth";
import { loadUserProgramAccessPolicy } from "@/lib/auth/program-access-policy";
import { sanitizeRestrictedFinancialText } from "@/lib/agent/restricted-output-policy";
import { isFeatureEnabled } from "@/lib/features/is-feature-enabled";
import { getProgramById } from "@/lib/programs/queries";
import { AUTHORED_P1_UPLOAD_FLAG, AuthoredUploadRefusal, admitAuthoredP1Draft } from "@/lib/programs/authored-deliverable-upload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(req: Request, { params }: { params: Promise<{ programId: string }> }) {
  try {
    const ctx = await requireTenancy();
    if (!isFeatureEnabled(ctx, AUTHORED_P1_UPLOAD_FLAG)) return Response.json({ error: "not_found" }, { status: 404 });
    const { programId } = await params;
    if (!await getProgramById(ctx, programId)) return Response.json({ error: "move_not_readable" }, { status: 404 });
    const policy = await loadUserProgramAccessPolicy(ctx, { programId });
    if (!policy.canUploadArtifacts || !policy.canGenerateDeliverables ||
      (Array.isArray(policy.programIdsAllowed) && !policy.programIdsAllowed.includes(programId)))
      return Response.json({ error: "forbidden", detail: "Move upload and document-author permissions are required." }, { status: 403 });
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) return Response.json({ error: "file_required" }, { status: 400 });
    if (file.size > 20 * 1024 * 1024) return Response.json({ error: "file_too_large" }, { status: 413 });
    const field = (name: string) => typeof form.get(name) === "string" ? String(form.get(name)) : "";
    const result = await admitAuthoredP1Draft(ctx, { moveId: programId, key: field("deliverableTypeKey"),
      requestId: field("requestId"), expectedState: field("expectedState"), expectedFileSha256: field("expectedFileSha256"),
      delegatedReviewReference: field("delegatedReviewReference"), fileName: file.name, mimeType: file.type,
      body: Buffer.from(await file.arrayBuffer()), canStoreText: text => sanitizeRestrictedFinancialText(text, policy) === text });
    return Response.json({ ok: true, ...result }, { status: result.replayed ? 200 : 201 });
  } catch (error) {
    if (error instanceof AuthoredUploadRefusal) return Response.json({ error: error.code, detail: error.message,
      storedArtifactId: error.storedArtifactId, admissionConfirmed: false }, { status: error.status });
    try { return tenancyErrorResponse(error); } catch { /* Unknown reads fail closed. */ }
    return Response.json({ error: "authored_admission_unavailable", detail: "The admission request could not be verified. Check the current document before retrying." }, { status: 503 });
  }
}
