import { TenancyError, tenancyErrorResponse } from "@/app/api/v1/_intel-auth";
import { requireTenancy } from "@/lib/auth/tenancy";
import type { AtlasTenancyCtx } from "@/lib/atlas/types";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function atlasPersonId(userId: string | null | undefined): string | null {
  return userId && UUID_PATTERN.test(userId) ? userId : null;
}

export async function requireAtlasTenancy(
  clientId?: string | null,
): Promise<AtlasTenancyCtx> {
  const tenancy = await requireTenancy().catch((err) => {
    if (
      err instanceof Error &&
      (err.message === "unauthenticated" || err.message === "no_client")
    ) {
      throw new TenancyError(err.message as "unauthenticated" | "no_client");
    }
    throw err;
  });
  const requestedClientId = clientId?.trim() || null;
  if (
    requestedClientId &&
    requestedClientId !== tenancy.clientId &&
    requestedClientId !== tenancy.clientKey
  ) {
    throw new TenancyError("no_client");
  }

  return {
    clientId: tenancy.clientId,
    clientKey: tenancy.clientKey ?? null,
    userId: atlasPersonId(tenancy.userId),
  };
}

export { tenancyErrorResponse };
