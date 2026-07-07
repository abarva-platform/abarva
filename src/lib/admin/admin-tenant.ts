/**
 * admin-tenant — canonical tenant resolution for the Setup section.
 *
 * Setup Fix Package PR 2: replaces ad-hoc `tenantSlug = 'apex-retail'`
 * defaults scattered across page-view builders. Every Setup page
 * server component should call `resolveAdminTenant()` and pass the
 * resulting slug into its page-view builder + the resulting tenant
 * name into `AdminCanonShellV2`.
 *
 * The mapping mirrors the one previously inlined in
 * `src/app/(maestro)/admin/users-access/page.tsx` so consumers get
 * the same slug ('first-capital' for Arcturus, etc.).
 *
 * 2026-05-30 (PR-A · P0 Apex-leak elimination):
 *   The historic Apex fallback was removed. This function now THROWS
 *   `AdminTenantUnresolvedError` whenever the active tenant cannot be
 *   resolved — replacing the silent `apexretail` master-switch that
 *   was routing every failed resolution into Apex-branded content.
 *   Callers must either pre-resolve via direct mock (tests) or rely
 *   on the `/admin/error.tsx` boundary to render the unresolved state.
 */

import {
  canonicalClientDisplayName,
  isClientKey,
  type ClientKey,
} from "@/lib/client-config";
import { getActiveClientRow } from "@/lib/active-client";

const ADMIN_TENANT_SLUG_BY_CLIENT_KEY: Record<ClientKey, string> = {
  apexretail: "apex-retail",
  meridian: "meridian",
  arcturus: "first-capital",
  northstar: "northstar-clinical",
  skyharbor: "skyharbor-air",
  lakeshore: "lakeshore-holdings",
};

export interface AdminTenantContext {
  /** Canonical `clients.id` value used by RLS-backed control-plane tables. */
  clientId: string;
  /** App-side ClientKey (e.g. 'arcturus'). */
  clientKey: ClientKey;
  /** Slug used by Setup page-view builders + agent context broker (e.g. 'first-capital'). */
  tenantSlug: string;
  /** Canonical display name for top-bar / context-bar / agent rail (e.g. 'First Capital Financial'). */
  tenantName: string;
}

/**
 * Thrown when the admin surface cannot resolve an active tenant.
 *
 * Caught by `src/app/(maestro)/admin/error.tsx` to render an explicit
 * "no active tenant" recovery panel instead of silently routing the
 * user into Apex-branded content (the prior fallback behavior).
 */
export class AdminTenantUnresolvedError extends Error {
  constructor(reason: string) {
    super(`No active tenant resolved for admin surface: ${reason}`);
    this.name = "AdminTenantUnresolvedError";
  }
}

export async function resolveAdminTenant(): Promise<AdminTenantContext> {
  let row: Awaited<ReturnType<typeof getActiveClientRow>>;
  try {
    row = await getActiveClientRow();
  } catch (e) {
    throw new AdminTenantUnresolvedError(
      `getActiveClientRow failed: ${(e as Error).message}`,
    );
  }
  if (!row) {
    throw new AdminTenantUnresolvedError("no active client row");
  }
  if (!isClientKey(row.key)) {
    throw new AdminTenantUnresolvedError(
      `unknown client key: ${row.key ?? "<undefined>"}`,
    );
  }
  const clientKey: ClientKey = row.key;
  const tenantSlug = ADMIN_TENANT_SLUG_BY_CLIENT_KEY[clientKey];
  if (!tenantSlug) {
    throw new AdminTenantUnresolvedError(`no slug mapping for ${clientKey}`);
  }
  const tenantName = canonicalClientDisplayName({
    key: row.key,
    name: row.name,
  });
  if (!tenantName) {
    throw new AdminTenantUnresolvedError(`no canonical name for ${clientKey}`);
  }
  return { clientId: row.id, clientKey, tenantSlug, tenantName };
}
