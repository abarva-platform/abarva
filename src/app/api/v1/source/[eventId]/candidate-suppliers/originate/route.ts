import { revalidatePath } from "next/cache";
import { getActiveClientRow } from "@/lib/active-client";
import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import { getCurrentUser } from "@/lib/auth/current-user";
import { loadUserSourceAccessPolicy } from "@/lib/auth/source-access-policy";
import { originateProspectiveSupplier } from "@/lib/source/candidate-suppliers/originate-prospective-supplier";
import { canonicalTenantKey } from "@/lib/tenant/aliases";

type RouteContext = { params: Promise<{ eventId: string }> };

function formText(form: FormData, key: string): string {
  const value = form.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request, { params }: RouteContext) {
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
  if (
    !activeClient ||
    canonicalTenantKey(activeClient.key) !== canonicalTenantKey(tenancy.clientKey)
  ) {
    return Response.json({ ok: false, error: "forbidden" }, { status: 403 });
  }
  const policy = await loadUserSourceAccessPolicy(tenancy, {
    activeClientKey: activeClient.key,
    sourceEventId: eventId,
  }).catch(() => null);
  if (!policy?.canApproveSourceStages) {
    return Response.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const approvedByUserId = user?.personId?.trim() ?? "";
  const approvedByName = user?.name?.trim() ?? "";
  if (!approvedByUserId || !approvedByName) {
    return Response.json(
      { ok: false, error: "reviewer_identity_required" },
      { status: 409 },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ ok: false, error: "invalid_form" }, { status: 400 });
  }
  const result = await originateProspectiveSupplier({
    clientKey: activeClient.key,
    eventId,
    expectedEventVersionId: formText(form, "eventVersionId"),
    legalName: formText(form, "legalName"),
    contactName: formText(form, "contactName"),
    contactEmail: formText(form, "contactEmail"),
    contactPermissionConfirmed: form.get("contactPermissionConfirmed") === "on",
    approvedByUserId,
    approvedByName,
    rationale: formText(form, "rationale"),
  });
  if (!result.ok) {
    return Response.json(
      { ok: false, error: result.code, detail: result.detail },
      { status: result.code === "write_failed" ? 500 : 409 },
    );
  }

  const path = `/source/new/${encodeURIComponent(eventId)}`;
  revalidatePath(path);
  if (request.headers.get("accept")?.includes("application/json")) {
    return Response.json(result, { status: 201 });
  }
  return new Response(null, { status: 303, headers: { Location: path } });
}
