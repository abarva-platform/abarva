import { revalidatePath } from "next/cache";
import { getActiveClientRow } from "@/lib/active-client";
import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import { getCurrentUser } from "@/lib/auth/current-user";
import { loadUserSourceAccessPolicy } from "@/lib/auth/source-access-policy";
import { canonicalTenantKey } from "@/lib/tenant/aliases";
import { originateProspectiveSupplier } from "@/lib/source/candidate-suppliers/originate-prospective-supplier";

function formText(form: FormData, key: string): string {
  const value = form.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request): Promise<Response> {
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
  }).catch(() => null);
  if (!policy?.canApproveSourceStages) {
    return Response.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  // Origination records that a named person decided this supplier is worth
  // approaching. An unnamed session cannot do that, so the originator comes
  // from the signed-in user and never from the submitted form.
  const originatorId = user?.personId?.trim();
  if (!originatorId) {
    return Response.json({ ok: false, error: "originator_identity_required" }, { status: 409 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ ok: false, error: "invalid_form" }, { status: 400 });
  }

  const result = await originateProspectiveSupplier({
    clientKey: activeClient.key,
    legalName: formText(form, "legalName"),
    originatedByUserId: originatorId,
    originationEvidence: formText(form, "originationEvidence"),
    country: formText(form, "country") || undefined,
    supplierCategory: formText(form, "supplierCategory") || undefined,
  });
  if (!result.ok) {
    return Response.json(
      { ok: false, error: result.code },
      { status: result.code === "origination_unavailable" ? 503 : 409 },
    );
  }

  revalidatePath("/source/new");
  return Response.json(
    {
      ok: true,
      vendorId: result.vendorId,
      created: result.created,
      // Said back explicitly, because it is the point: this supplier can be
      // qualified, sign an NDA and compete, and cannot be paid.
      payable: false,
    },
    { status: result.created ? 201 : 200 },
  );
}
