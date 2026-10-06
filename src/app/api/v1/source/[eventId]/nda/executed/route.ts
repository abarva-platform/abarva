import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { getActiveClientRow } from "@/lib/active-client";
import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import { getCurrentUser } from "@/lib/auth/current-user";
import { loadUserSourceAccessPolicy } from "@/lib/auth/source-access-policy";
import { canonicalTenantKey } from "@/lib/tenant/aliases";
import { recordExecutedNda } from "@/lib/source/nda/record-executed-nda";
import type { NdaSignatureMethod } from "@/lib/source/nda/executed-document-evidence";

type RouteContext = { params: Promise<{ eventId: string }> };

function formText(form: FormData, key: string): string {
  const value = form.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function nullable(value: string): string | null {
  return value || null;
}

export async function POST(request: Request, { params }: RouteContext): Promise<Response> {
  const { eventId } = await params;
  let tenancy;
  try {
    tenancy = await requireTenancy();
  } catch (error) {
    return tenancyErrorResponse(error);
  }

  const [activeClient, user] = await Promise.all([
    getActiveClientRow(),
    getCurrentUser().catch(() => null),
  ]);
  if (!activeClient || canonicalTenantKey(activeClient.key) !== canonicalTenantKey(tenancy.clientKey)) {
    return Response.json({ ok: false, error: "forbidden" }, { status: 403 });
  }
  const policy = await loadUserSourceAccessPolicy(tenancy, {
    activeClientKey: activeClient.key,
    sourceEventId: eventId,
  }).catch(() => null);
  if (!policy?.canApproveSourceStages) {
    return Response.json({ ok: false, error: "forbidden" }, { status: 403 });
  }
  const reviewerId = user?.personId?.trim();
  const reviewerName = user?.name?.trim();
  if (!reviewerId || !reviewerName) {
    return Response.json({ ok: false, error: "reviewer_identity_required" }, { status: 409 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ ok: false, error: "invalid_form" }, { status: 400 });
  }
  const signatureMethod = formText(form, "signatureMethod");
  const evidenceReference = formText(form, "evidenceReference");
  if (!(["wet_ink", "e_signature_out_of_band"] as string[]).includes(signatureMethod) ||
    evidenceReference.length < 12) {
    return Response.json({ ok: false, error: "signature_review_required" }, { status: 409 });
  }

  const result = await recordExecutedNda({
    clientKey: activeClient.key,
    eventId,
    vendorId: formText(form, "vendorId"),
    ndaId: randomUUID(),
    artifactId: formText(form, "artifactId"),
    templateVersion: formText(form, "templateVersion"),
    scopeLevel: "event_only",
    coveredAffiliateEntityIds: [],
    effectiveFrom: formText(form, "effectiveFrom"),
    effectiveTo: nullable(formText(form, "effectiveTo")),
    executedAt: formText(form, "executedAt"),
    recordedByUserId: reviewerId,
    evidenceReference,
    signatureMethod: signatureMethod as NdaSignatureMethod,
    supplierSignatoryName: formText(form, "supplierSignatoryName"),
    buyerSignatoryName: formText(form, "buyerSignatoryName"),
    certificateSha256: nullable(formText(form, "certificateSha256")),
    privateEvidenceRef: nullable(formText(form, "privateEvidenceRef")),
  });
  if (!result.ok) {
    return Response.json({ ok: false, error: result.code }, {
      status: result.code === "authority_unavailable" ? 503 : 409,
    });
  }

  revalidatePath(`/source/new/${eventId}`);
  return Response.json({ ok: true, id: result.id }, { status: 201 });
}
