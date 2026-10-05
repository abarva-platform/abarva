import { revalidatePath } from "next/cache";
import { getActiveClientRow } from "@/lib/active-client";
import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import { getCurrentUser } from "@/lib/auth/current-user";
import { loadUserSourceAccessPolicy } from "@/lib/auth/source-access-policy";
import { canonicalTenantKey } from "@/lib/tenant/aliases";
import { recordSourceEventAward } from "@/lib/source/award/write-award-decision";

type RouteContext = { params: Promise<{ eventId: string }> };

function formText(form: FormData, key: string): string {
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

  // The award records that a named person chose a supplier. An unnamed session
  // cannot produce one, so the approver comes from the signed-in user and never
  // from the submitted form.
  const approverId = user?.personId?.trim();
  const approverName = user?.name?.trim();
  if (!approverId || !approverName) {
    return Response.json({ ok: false, error: "approver_identity_required" }, { status: 409 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ ok: false, error: "invalid_form" }, { status: 400 });
  }

  const result = await recordSourceEventAward({
    clientKey: activeClient.key,
    eventId,
    vendorId: formText(form, "vendorId"),
    approvedByUserId: approverId,
    approvedByName: approverName,
    contractName: formText(form, "contractName"),
    awardRationale: formText(form, "awardRationale"),
    evidenceReference: formText(form, "evidenceReference"),
    currency: formText(form, "currency") || undefined,
  });
  if (!result.ok) {
    return Response.json(
      { ok: false, error: result.code, refusals: result.refusals ?? [] },
      { status: result.code === "award_unavailable" ? 503 : 409 },
    );
  }

  revalidatePath(`/source/new/${eventId}`);
  return Response.json(
    { ok: true, awardId: result.awardId, contractId: result.contractId },
    { status: 201 },
  );
}
