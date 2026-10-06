import { getActiveClientRow } from "@/lib/active-client";
import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import { loadUserSourceAccessPolicy } from "@/lib/auth/source-access-policy";
import { canonicalTenantKey } from "@/lib/tenant/aliases";
import { createSourceNdaEsignRuntime } from "@/lib/source/esign/runtime";
import { readSyntheticNdaOperatorStatus } from "@/lib/source/esign/operator-status";

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
  const clientKey = canonicalTenantKey(activeClient.key);
  const runtime = createSourceNdaEsignRuntime(clientKey);
  if (clientKey !== "meridian-health") {
    return Response.json({ available: false, fallback: runtime.fallback }, {
      headers: { "Cache-Control": "private, no-store" },
    });
  }
  const suppliers = await readSyntheticNdaOperatorStatus({ clientKey, eventId }).catch(() => null);
  if (suppliers === null) {
    return Response.json({ error: "authority_unavailable" }, {
      status: 503, headers: { "Cache-Control": "private, no-store" },
    });
  }
  return Response.json({ available: runtime.provider !== null, fallback: runtime.fallback, suppliers }, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
