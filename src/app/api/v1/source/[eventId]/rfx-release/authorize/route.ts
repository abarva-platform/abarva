import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getActiveClientRow } from "@/lib/active-client";
import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import { getCurrentUser } from "@/lib/auth/current-user";
import { loadUserSourceAccessPolicy } from "@/lib/auth/source-access-policy";
import { canonicalTenantKey } from "@/lib/tenant/aliases";
import { authorizePreparedRfxPackageVersion } from "@/lib/source/rfx-delivery/authorize-prepared-package-version";
import { readRfxReleaseAuthorization } from "@/lib/source/rfx-delivery/release-authorization-repository";

type RouteContext = { params: Promise<{ eventId: string }> };

const authorizationRequest = z.object({
  packageVersionId: z.string().trim().min(1).max(500),
  snapshotSha256: z.string().regex(/^[0-9a-f]{64}$/),
  releaseEvidenceReference: z.string().trim().min(12).max(1000),
  confirmAuthorize: z.literal("AUTHORIZE_RFX_RELEASE"),
});

export async function GET(
  request: Request,
  { params }: RouteContext,
): Promise<Response> {
  const { eventId } = await params;
  let tenancy;
  try {
    tenancy = await requireTenancy();
  } catch (error) {
    return tenancyErrorResponse(error);
  }
  const activeClient = await getActiveClientRow().catch(() => null);
  if (
    !activeClient ||
    canonicalTenantKey(activeClient.key) !==
      canonicalTenantKey(tenancy.clientKey)
  ) {
    return Response.json({ ok: false, error: "forbidden" }, { status: 403 });
  }
  const access = await loadUserSourceAccessPolicy(tenancy, {
    activeClientKey: activeClient.key,
    sourceEventId: eventId,
  }).catch(() => null);
  if (
    !access?.canApproveSourceStages ||
    (access.sourceEventIdsAllowed !== null &&
      !access.sourceEventIdsAllowed?.includes(eventId))
  ) {
    return Response.json({ ok: false, error: "forbidden" }, { status: 403 });
  }
  const version = authorizationRequest.shape.packageVersionId.safeParse(
    new URL(request.url).searchParams.get("packageVersionId"),
  );
  if (!version.success) {
    return Response.json(
      { ok: false, error: "invalid_package_version" },
      { status: 400 },
    );
  }
  const state = await readRfxReleaseAuthorization({
    clientKey: activeClient.key,
    eventId,
    packageVersionId: version.data,
  });
  if (state.state === "unavailable") {
    return Response.json(
      { ok: false, error: "authorization_unavailable" },
      { status: 503 },
    );
  }
  return Response.json({ ok: true, ...state, delivered: false });
}

export async function POST(
  request: Request,
  { params }: RouteContext,
): Promise<Response> {
  const { eventId } = await params;
  let tenancy;
  try {
    tenancy = await requireTenancy();
  } catch (error) {
    return tenancyErrorResponse(error);
  }

  const [activeClient, user] = await Promise.all([
    getActiveClientRow().catch(() => null),
    getCurrentUser().catch(() => null),
  ]);
  if (
    !activeClient ||
    canonicalTenantKey(activeClient.key) !==
      canonicalTenantKey(tenancy.clientKey)
  ) {
    return Response.json({ ok: false, error: "forbidden" }, { status: 403 });
  }
  const access = await loadUserSourceAccessPolicy(tenancy, {
    activeClientKey: activeClient.key,
    sourceEventId: eventId,
  }).catch(() => null);
  if (
    !access?.canApproveSourceStages ||
    (access.sourceEventIdsAllowed !== null &&
      !access.sourceEventIdsAllowed?.includes(eventId))
  ) {
    return Response.json({ ok: false, error: "forbidden" }, { status: 403 });
  }
  const authorizedByUserId = user?.personId?.trim();
  if (!authorizedByUserId || !user?.name?.trim()) {
    return Response.json(
      { ok: false, error: "reviewer_identity_required" },
      { status: 409 },
    );
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = authorizationRequest.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: "invalid_authorization_request" },
      { status: 400 },
    );
  }

  const result = await authorizePreparedRfxPackageVersion({
    clientKey: activeClient.key,
    eventId,
    packageVersionId: parsed.data.packageVersionId,
    snapshotSha256: parsed.data.snapshotSha256,
    authorizedByUserId,
    releaseEvidenceReference: parsed.data.releaseEvidenceReference,
  });
  if (!result.ok) {
    return Response.json(
      { ok: false, error: result.code },
      {
        status:
          result.code === "authority_unavailable"
            ? 503
            : result.code === "invalid_record"
              ? 400
              : 409,
      },
    );
  }
  revalidatePath(`/source/new/${eventId}`);
  return Response.json(
    {
      ok: true,
      authorizationId: result.authorizationId,
      snapshotSha256: result.snapshotSha256,
      releaseAuthorized: true,
      delivered: false,
    },
    { status: 201 },
  );
}
