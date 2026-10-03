import { revalidatePath } from "next/cache";
import { getActiveClientRow } from "@/lib/active-client";
import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import { getCurrentUser } from "@/lib/auth/current-user";
import { loadUserSourceAccessPolicy } from "@/lib/auth/source-access-policy";
import { canonicalTenantKey } from "@/lib/tenant/aliases";
import { publishSyntheticTemplate } from "@/lib/source/nda/publish-synthetic-template";

type RouteContext = { params: Promise<{ eventId: string }> };

function text(form: FormData, key: string): string {
  const value = form.get(key);
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
    getActiveClientRow(),
    getCurrentUser().catch(() => null),
  ]);
  if (!activeClient || canonicalTenantKey(activeClient.key) !== canonicalTenantKey(tenancy.clientKey) ||
      canonicalTenantKey(activeClient.key) !== "meridian-health") {
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

  const result = await publishSyntheticTemplate({
    clientKey: canonicalTenantKey(activeClient.key),
    eventId,
    artifactId: text(form, "artifactId"),
    templateVersion: text(form, "templateVersion"),
    displayName: text(form, "displayName"),
    actorUserId,
    actorName,
    rationale: text(form, "rationale"),
    acknowledged: form.get("acknowledged") === "on",
  });
  if (!result.ok) {
    return Response.json({ ok: false, error: result.code }, {
      status: result.code === "authority_unavailable" ? 503 : 409,
    });
  }
  revalidatePath(`/source/new/${eventId}`);
  return Response.json({ ok: true, id: result.id }, { status: 201 });
}
