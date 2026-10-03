import { revalidatePath } from "next/cache";
import { getActiveClientRow } from "@/lib/active-client";
import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import { getCurrentUser } from "@/lib/auth/current-user";
import { loadUserSourceAccessPolicy } from "@/lib/auth/source-access-policy";
import { canonicalTenantKey } from "@/lib/tenant/aliases";
import { getObjectStorageAdapter } from "@/lib/data-plane/objectStorage";
import { extractSourceUploadText } from "@/lib/source/artifact-registry/upload-text-extraction";
import { resolveSourceNdaEsignConfig } from "@/lib/source/esign/config";
import { createNdaDraftRepository } from "@/lib/source/esign/draft-repository";
import { createSourceNdaEsignRuntime } from "@/lib/source/esign/runtime";
import {
  readSyntheticNdaSigningAuthority,
  sendSyntheticNdaForSignature,
} from "@/lib/source/esign/send-nda";

type RouteContext = { params: Promise<{ eventId: string }> };

function field(form: FormData, name: string): string {
  const value = form.get(name);
  return typeof value === "string" ? value.trim() : "";
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
    getActiveClientRow(), getCurrentUser().catch(() => null),
  ]);
  const clientKey = activeClient ? canonicalTenantKey(activeClient.key) : "";
  if (!activeClient || clientKey !== canonicalTenantKey(tenancy.clientKey) ||
      clientKey !== "meridian-health") {
    return Response.json({ ok: false, error: "forbidden" }, { status: 403 });
  }
  const policy = await loadUserSourceAccessPolicy(tenancy, {
    activeClientKey: activeClient.key,
    sourceEventId: eventId,
  }).catch(() => null);
  if (!policy?.canApproveSourceStages) {
    return Response.json({ ok: false, error: "forbidden" }, { status: 403 });
  }
  const actorUserId = user?.personId?.trim();
  const actorName = user?.name?.trim();
  if (!actorUserId || !actorName) {
    return Response.json({ ok: false, error: "reviewer_identity_required" }, { status: 409 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ ok: false, error: "invalid_form" }, { status: 400 });
  }
  if (form.get("acknowledged") !== "on") {
    return Response.json({ ok: false, error: "send_confirmation_required" }, { status: 409 });
  }

  const config = resolveSourceNdaEsignConfig(clientKey);
  const runtime = createSourceNdaEsignRuntime(clientKey);
  const draft = createNdaDraftRepository();
  const result = await sendSyntheticNdaForSignature({
    clientKey, eventId,
    vendorId: field(form, "vendorId"),
    contactAuthorityId: field(form, "contactAuthorityId"),
    templateVersion: field(form, "templateVersion"),
    actorUserId, actorName, acknowledged: true,
  }, {
    config,
    provider: runtime.provider,
    loadAuthority: readSyntheticNdaSigningAuthority,
    download: (container, path) => getObjectStorageAdapter().download(container, path),
    extractText: async (bytes) => {
      const result = await extractSourceUploadText({
        buffer: Buffer.from(bytes), mimeType: "application/pdf",
      });
      return result.text;
    },
    recordDraft: draft.recordDraft,
    sendAndMark: draft.sendAndMark,
  });
  if (!result.ok) {
    const status = result.code === "provider_unavailable" ||
      result.code === "draft_not_recorded" || result.code === "send_not_confirmed"
      ? 503 : 409;
    return Response.json({ ok: false, error: result.code }, { status });
  }
  revalidatePath(`/source/new/${eventId}`);
  return Response.json({ ok: true, envelopeId: result.envelopeId }, { status: 201 });
}
