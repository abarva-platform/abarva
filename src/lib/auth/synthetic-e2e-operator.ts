import { isFeatureEnabled } from "@/lib/features/is-feature-enabled";
import { canonicalTenantKey } from "@/lib/tenant-keys";

const APP_CLIENT_KEY = "meridian";
const CANONICAL_KEY = canonicalTenantKey(APP_CLIENT_KEY);

/** Produced only after the server profile and authenticated Clerk actor agree. */
export interface SyntheticE2eOperatorAuthority {
  source: "authenticated_clerk_profile";
  clerkUserId: string;
  email: string;
  approvalRef: string;
  profileSha256: string;
}

export interface SyntheticE2eOperatorMetadata {
  accountType?: unknown;
  automated?: unknown;
  approvalRef?: unknown;
  person_id?: unknown;
  role?: unknown;
  clientId?: unknown;
  defaultClientId?: unknown;
  clientLocked?: unknown;
  moduleAccess?: unknown;
  programScope?: unknown;
  programCapabilities?: unknown;
  tenantRoles?: unknown;
  allowedClientKeys?: unknown;
  visibleClientKeys?: unknown;
}

/** Only an exact server-verified Clerk profile can request this narrow lane. */
export function isSyntheticE2eOperatorProfile(
  metadata: SyntheticE2eOperatorMetadata | null | undefined,
): boolean {
  if (!metadata || metadata.accountType !== "synthetic_e2e_operator") return false;
  if (!isFeatureEnabled({ clientKey: APP_CLIENT_KEY }, "moves_synthetic_e2e_operator_v1")) return false;
  if (
    metadata.automated !== true ||
    typeof metadata.approvalRef !== "string" || !metadata.approvalRef.trim() ||
    metadata.person_id !== undefined ||
    metadata.role !== "client" ||
    metadata.clientId !== APP_CLIENT_KEY ||
    metadata.defaultClientId !== APP_CLIENT_KEY ||
    metadata.clientLocked !== true ||
    metadata.programScope !== "assigned_programs_only" ||
    JSON.stringify(metadata.moduleAccess) !== JSON.stringify(["programs"])
  ) return false;
  const capabilities = metadata.programCapabilities;
  if (!capabilities || typeof capabilities !== "object" || Array.isArray(capabilities)) return false;
  const c = capabilities as Record<string, unknown>;
  if (Object.keys(c).sort().join("|") !== [
    "accessLevel", "canAdminUsers", "canApproveGates", "canCreatePrograms",
    "canGenerateDeliverables", "canPublishDeliverables", "canUploadArtifacts",
    "financialVisibility",
  ].sort().join("|") || c.accessLevel !== "program_member" ||
    c.canAdminUsers !== false || c.canApproveGates !== true ||
    c.canCreatePrograms !== true || c.canGenerateDeliverables !== true ||
    c.canPublishDeliverables !== true || c.canUploadArtifacts !== true ||
    c.financialVisibility !== true) return false;
  for (const key of ["allowedClientKeys", "visibleClientKeys"] as const) {
    const list = metadata[key];
    if (list !== undefined && JSON.stringify(list) !== JSON.stringify([APP_CLIENT_KEY])) return false;
  }
  const roles = metadata.tenantRoles;
  if (roles !== undefined) {
    if (!roles || typeof roles !== "object" || Array.isArray(roles)) return false;
    for (const [key, role] of Object.entries(roles)) {
      if (canonicalTenantKey(key) !== CANONICAL_KEY || role !== "viewer") return false;
    }
  }
  return true;
}

export function isSyntheticE2eOperatorTenant(clientKey: string): boolean {
  return canonicalTenantKey(clientKey) === CANONICAL_KEY;
}
