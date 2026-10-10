import "server-only";

import { isFeatureEnabled } from "@/lib/features/is-feature-enabled";
import type { TenancyCtx } from "@/lib/programs/types.db";
import { tenantAliasesFor } from "@/lib/tenant/aliases";

import { listApprovedPublicSources } from "./repository";
import { PUBLIC_RESEARCH_FLAG, type PublicSource } from "./types";

export const PUBLIC_SOURCES_UNAVAILABLE_DETAIL =
  "Approved public sources could not be read for this Move. Retry the build after the source read succeeds.";

export function publicResearchGovernsGeneration(
  ctx: Pick<TenancyCtx, "clientKey"> | null | undefined,
): boolean {
  return isFeatureEnabled(ctx ?? null, PUBLIC_RESEARCH_FLAG);
}

/** Called only after the Move passed the authenticated tenancy check. */
export async function loadPublicSourcesForGeneration(
  ctx: TenancyCtx,
  programId: string,
  tenantKey: string,
): Promise<PublicSource[] | null> {
  if (!publicResearchGovernsGeneration(ctx)) return null;
  const result = await listApprovedPublicSources({ tenantKey, programId });
  if (!result.ok) throw new Error(PUBLIC_SOURCES_UNAVAILABLE_DETAIL);
  const allowedTenantKeys = new Set(tenantAliasesFor(tenantKey));
  return result.sources.filter(
    (source) =>
      source.kind === "public_source" &&
      source.sourceClass === "public_source" &&
      source.decision === "approved" &&
      source.programId === programId &&
      allowedTenantKeys.has(source.tenantKey),
  );
}
