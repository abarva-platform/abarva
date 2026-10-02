import { getActiveClientRow } from "@/lib/active-client";
import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import { loadUserSourceAccessPolicy } from "@/lib/auth/source-access-policy";
import { canonicalTenantKey } from "@/lib/tenant/aliases";
import { resolveSourceNdaEsignConfig } from "@/lib/source/esign/config";

type RouteContext = { params: Promise<{ eventId: string }> };

export async function GET(_request: Request, { params }: RouteContext): Promise<Response> {
  const { eventId } = await params;
  let tenancy;
  try {
    tenancy = await requireTenancy();
  } catch (error) {
    return tenancyErrorResponse(error);
  }
  const activeClient = await getActiveClientRow();
  if (!activeClient || canonicalTenantKey(activeClient.key) !== canonicalTenantKey(tenancy.clientKey)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }
  const policy = await loadUserSourceAccessPolicy(tenancy, {
    activeClientKey: activeClient.key,
    sourceEventId: eventId,
  }).catch(() => null);
  if (!policy?.canApproveSourceStages) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }
  const config = resolveSourceNdaEsignConfig(canonicalTenantKey(activeClient.key));
  return Response.json({ available: config.state === "configured", fallback: "upload" }, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
