import { getActiveClientRow } from "@/lib/active-client";
import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import { getCurrentUser } from "@/lib/auth/current-user";
import { loadUserSourceAccessPolicy } from "@/lib/auth/source-access-policy";
import { canonicalTenantKey } from "@/lib/tenant/aliases";
import { resolveSourceNdaEsignConfig } from "@/lib/source/esign/config";
import {
  createSyntheticNdaEmbeddedLink,
  readSyntheticNdaEmbeddedEnvelope,
} from "@/lib/source/esign/embedded-link";
import { createSourceNdaEsignRuntime } from "@/lib/source/esign/runtime";
import { readSyntheticNdaSigningAuthority } from "@/lib/source/esign/send-nda";

type RouteContext = { params: Promise<{ eventId: string }> };

function field(form: FormData, name: string): string {
  const value = form.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function reply(body: object, status: number): Response {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
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
    return reply({ ok: false, error: "forbidden" }, 403);
  }
  const policy = await loadUserSourceAccessPolicy(tenancy, {
    activeClientKey: activeClient.key,
    sourceEventId: eventId,
  }).catch(() => null);
  if (!policy?.canApproveSourceStages) {
    return reply({ ok: false, error: "forbidden" }, 403);
  }
  const actorUserId = user?.personId?.trim();
  const actorName = user?.name?.trim();
  if (!actorUserId || !actorName) {
    return reply({ ok: false, error: "reviewer_identity_required" }, 409);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return reply({ ok: false, error: "invalid_form" }, 400);
  }
  if (form.get("acknowledged") !== "on") {
    return reply({ ok: false, error: "signing_confirmation_required" }, 409);
  }
  const role = field(form, "role");
  if (role !== "supplier" && role !== "buyer") {
    return reply({ ok: false, error: "invalid_signer_role" }, 400);
  }

  const config = resolveSourceNdaEsignConfig(clientKey);
  const runtime = createSourceNdaEsignRuntime(clientKey);
  const result = await createSyntheticNdaEmbeddedLink({
    clientKey, eventId,
    vendorId: field(form, "vendorId"),
    contactAuthorityId: field(form, "contactAuthorityId"),
    templateVersion: field(form, "templateVersion"),
    envelopeId: field(form, "envelopeId"),
    actorUserId, actorName, role, deliveryMode: "embedded",
  }, {
    config,
    provider: runtime.provider,
    loadAuthority: readSyntheticNdaSigningAuthority,
    loadEnvelope: readSyntheticNdaEmbeddedEnvelope,
  });
  if (!result.ok) {
    const status = result.code === "provider_unavailable" ||
      result.code === "signing_link_unavailable" ? 503 : 409;
    return reply({ ok: false, error: result.code }, status);
  }
  return reply({ ok: true, url: result.url }, 200);
}
