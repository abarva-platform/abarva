import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getActiveClientRow } from "@/lib/active-client";
import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import { getCurrentUser } from "@/lib/auth/current-user";
import { loadUserSourceAccessPolicy } from "@/lib/auth/source-access-policy";
import { acceptEventCandidateSupplier } from "@/lib/source/candidate-suppliers/event-candidate-acceptance-repository";
import { canonicalTenantKey } from "@/lib/tenant/aliases";

type RouteContext = {
  params: Promise<{ eventId: string }>;
};

function formText(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function namedReviewerName(
  user: Awaited<ReturnType<typeof getCurrentUser>>,
): string {
  return user?.name?.trim() ?? "";
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
  if (!activeClient) {
    return Response.json({ ok: false, error: "no_client" }, { status: 403 });
  }
  if (
    canonicalTenantKey(activeClient.key) !==
    canonicalTenantKey(tenancy.clientKey)
  ) {
    return Response.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const accessPolicy = await loadUserSourceAccessPolicy(tenancy, {
    activeClientKey: activeClient.key,
    sourceEventId: eventId,
  }).catch(() => null);
  if (!accessPolicy?.canApproveSourceStages) {
    return Response.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const formData = await request.formData();
  const acceptedByName = namedReviewerName(user);
  const result = await acceptEventCandidateSupplier({
    clientKey: activeClient.key,
    eventId,
    supplierId: formText(formData, "supplierId"),
    expectedCategoryId: formText(formData, "categoryId"),
    expectedArchetypeId: formText(formData, "archetypeId"),
    expectedSourceReference: formText(formData, "sourceReference"),
    acceptedByUserId: tenancy.userId,
    acceptedByName,
    rationale: formText(formData, "rationale"),
  });

  if (!result.ok) {
    return Response.json(
      { ok: false, error: result.code, detail: result.detail },
      { status: result.code === "write_failed" ? 500 : 409 },
    );
  }

  const path = `/source/new/${encodeURIComponent(eventId)}`;
  revalidatePath(path);
  return NextResponse.redirect(new URL(path, request.url), 303);
}
