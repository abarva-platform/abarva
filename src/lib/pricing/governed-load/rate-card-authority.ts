/**
 * Who may load or approve a workspace's rate card.
 *
 * A rate card sets the rates every Moves estimate in the workspace prices on,
 * so loading or approving one is an admin act, not something any signed-in
 * member can do. The rule matches the Setup area that hosts the screen:
 * a tenant admin for this workspace (an explicit `tenant_admin` role, with a
 * platform admin as the super-set) or a user whose program access policy lets
 * them administer users. Anything that cannot be confirmed — including a
 * failed role lookup — is a refusal.
 */
import "server-only";

import { hasTenantAdminAccess } from "@/lib/admin/tenant-admin-access";
import { requireTenantAdmin } from "@/lib/auth/tenant-roles";

export const RATE_CARD_ADMIN_REQUIRED = {
  error: "rate_card_admin_required",
  detail:
    "Only a workspace admin can load or approve this workspace's rate card. Ask your workspace admin to do it in Setup → Rate cards.",
} as const;

export async function canManageRateCards(tenancy: {
  clientKey?: string | null;
  clerkUserId?: string | null;
}): Promise<boolean> {
  if (tenancy.clientKey && tenancy.clerkUserId) {
    try {
      await requireTenantAdmin({ userId: tenancy.clerkUserId, tenantKey: tenancy.clientKey });
      return true;
    } catch {
      // Not an explicit tenant admin (or the lookup failed): try the policy.
    }
  }
  try {
    return (await hasTenantAdminAccess()) === true;
  } catch {
    return false;
  }
}
