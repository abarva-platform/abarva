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
 */

import { canonicalClientDisplayName, type ClientKey } from '@/lib/client-config';
import { getActiveClientRow } from '@/lib/active-client';

const ADMIN_TENANT_SLUG_BY_CLIENT_KEY: Record<ClientKey, string> = {
  apexretail: 'apex-retail',
  meridian: 'meridian',
  arcturus: 'first-capital',
  keystone: 'keystone',
};

const FALLBACK_CLIENT_KEY: ClientKey = 'apexretail';
const FALLBACK_TENANT_NAME = 'Apex Retail Group';

export interface AdminTenantContext {
  /** App-side ClientKey (e.g. 'arcturus'). */
  clientKey: ClientKey;
  /** Slug used by Setup page-view builders + agent context broker (e.g. 'first-capital'). */
  tenantSlug: string;
  /** Canonical display name for top-bar / context-bar / agent rail (e.g. 'First Capital Financial'). */
  tenantName: string;
}

export async function resolveAdminTenant(): Promise<AdminTenantContext> {
  const row = await getActiveClientRow().catch(() => null);
  if (!row) {
    return {
      clientKey: FALLBACK_CLIENT_KEY,
      tenantSlug: ADMIN_TENANT_SLUG_BY_CLIENT_KEY[FALLBACK_CLIENT_KEY],
      tenantName: FALLBACK_TENANT_NAME,
    };
  }
  const clientKey = (row.key as ClientKey | undefined) ?? FALLBACK_CLIENT_KEY;
  const tenantSlug = ADMIN_TENANT_SLUG_BY_CLIENT_KEY[clientKey] ?? ADMIN_TENANT_SLUG_BY_CLIENT_KEY[FALLBACK_CLIENT_KEY];
  const tenantName =
    canonicalClientDisplayName({ key: row.key, name: row.name }) ?? FALLBACK_TENANT_NAME;
  return { clientKey, tenantSlug, tenantName };
}
