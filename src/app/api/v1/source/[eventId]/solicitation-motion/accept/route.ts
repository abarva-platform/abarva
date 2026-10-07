import { revalidatePath } from "next/cache";
import { getActiveClientRow } from "@/lib/active-client";
import { loadUserSourceAccessPolicy } from "@/lib/auth/source-access-policy";
import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import { acceptSolicitationMotion } from "@/lib/source/new-workspace/accept-solicitation-motion";
import { canonicalTenantKey } from "@/lib/tenant/aliases";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ eventId: string }> };

export async function POST(request: Request, { params }: Context) {
  let tenancy;
  try {
    tenancy = await requireTenancy();
  } catch (error) {
    return tenancyErrorResponse(error);
  }
  const { eventId } = await params;
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      eventId,
    )
  ) {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }
  const body = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  if (
    body?.confirmed !== true ||
    (body.motion !== "rfi" && body.motion !== "rfp")
  ) {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }

  const client = await getActiveClientRow().catch(() => null);
  if (
    !client?.key ||
    canonicalTenantKey(client.key) !== canonicalTenantKey(tenancy.clientKey)
  ) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }
  const access = await loadUserSourceAccessPolicy(tenancy, {
    activeClientKey: client.key,
    sourceEventId: eventId,
  }).catch(() => null);
  if (!access?.canApproveSourceStages) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }
  const result = await acceptSolicitationMotion({
    eventId,
    clientKey: client.key,
    actorUserId: tenancy.userId,
    isClientAdmin: access.accessLevel === "client_admin",
    motion: body.motion,
  });
  if (!result.ok) {
    const status =
      result.code === "not_found"
        ? 404
        : result.code === "forbidden"
          ? 403
          : result.code === "authority_unavailable"
            ? 503
            : 409;
    return Response.json({ error: result.code }, { status });
  }
  revalidatePath(`/source/new/${eventId}`);
  return Response.json(result, { status: 201 });
}
