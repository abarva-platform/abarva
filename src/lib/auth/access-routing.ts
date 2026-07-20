import {
  DEFAULT_CLIENT_KEY,
  inferClientKeyFromEmail,
  isClientKey,
  isKnownAgentClientLoginEmail,
  type ClientKey,
} from "@/lib/client-config";
import { getStaticLaunchAccessProfile } from "@/lib/auth/launch-access";

export type AppSessionRole =
  | "admin"
  | "investor"
  | "maestro"
  | "client"
  | "external"
  | string
  | null
  | undefined;

interface ResolveClientInput {
  clientId?: string | null;
  defaultClientId?: string | null;
  email?: string | null;
  /**
   * Tower-as-landing signal (Tower audit §5.1 + §7). When `true`, a
   * portfolio-bearing tenant is routed straight to `/tower` instead of
   * `/home` so a CIO with an actual portfolio lands on their Control
   * Tower on sign-in. When `false` or undefined, the path falls back
   * to `/home` (the historical default). The caller — typically the
   * post-signin redirect resolver — pre-computes this signal against
   * the tenant's portfolio substrate.
   */
  hasTowerPortfolio?: boolean;
}

function normalizeEmail(email: string | null | undefined): string {
  return email?.trim().toLowerCase() ?? "";
}

// Real external pilot users (tenant mapping lives in
// PILOT_EXACT_EMAIL_TO_CLIENT_KEY, client-config.ts). Listing them here pins
// their session to their client and gives them the locked `client` role — the
// same access the production pilot already grants. NOT admins: Source/admin
// rights still flow from their Clerk role, not from this list. Every entry is
// an explicit access grant — review on change.
const PILOT_ACCESS_EMAILS: ReadonlySet<string> = new Set([
  "kmysore@gmail.com",
  "surekha.durvasula@gmail.com",
  "anandshp@gmail.com",
  "admin@abarva.ai",
  "anand@abarva.ai",
  "mreddy@republicebank.com",
]);

function isPilotAccessEmail(normalizedEmail: string): boolean {
  return PILOT_ACCESS_EMAILS.has(normalizedEmail);
}

export function hasExplicitTenantAlias(
  email: string | null | undefined,
): boolean {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;
  const launchProfile = getStaticLaunchAccessProfile(normalized);
  if (launchProfile?.clientKey) return true;
  return (
    normalized.endsWith("@meridian-health.example.com") ||
    normalized.endsWith("@apex-retail.example.com") ||
    normalized.endsWith("@firstcapital.example.com") ||
    normalized.endsWith("@northstar-clinical.example.com") ||
    normalized.endsWith("@skyharbor-air.example.com") ||
    normalized.endsWith("@lakeshore-industries.example.com") ||
    normalized.endsWith("@lakeshore-holdings.example.com") ||
    normalized.includes("+apex@abarva.com") ||
    normalized.includes("+meridian@abarva.com") ||
    normalized.includes("+firstcapital@abarva.com") ||
    normalized.includes("+northstar@abarva.com") ||
    normalized.includes("+skyharbor@abarva.com") ||
    normalized.includes("+lakeshore@abarva.com") ||
    isKnownAgentClientLoginEmail(normalized) ||
    isPilotAccessEmail(normalized)
  );
}

export function isNewClientSetupEmail(
  email: string | null | undefined,
): boolean {
  void email;
  return false;
}

export function inferSessionRoleFromEmail(
  email: string | null | undefined,
): AppSessionRole {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;
  const launchProfile = getStaticLaunchAccessProfile(normalized);
  if (launchProfile) return launchProfile.role;
  if (isPilotAccessEmail(normalized)) return "client";

  if (
    normalized.endsWith("@meridian-health.example.com") ||
    normalized.endsWith("@apex-retail.example.com") ||
    normalized.endsWith("@firstcapital.example.com") ||
    normalized.endsWith("@northstar-clinical.example.com") ||
    normalized.endsWith("@skyharbor-air.example.com") ||
    normalized.endsWith("@lakeshore-industries.example.com") ||
    normalized.includes("+apex@abarva.com") ||
    normalized.includes("+meridian@abarva.com") ||
    normalized.includes("+firstcapital@abarva.com") ||
    normalized.includes("+northstar@abarva.com") ||
    normalized.includes("+skyharbor@abarva.com")
  ) {
    return "client";
  }

  return null;
}

export function resolveSessionRole(
  role: AppSessionRole,
  email: string | null | undefined,
): AppSessionRole {
  return role ?? inferSessionRoleFromEmail(email);
}

export function isLockedTenantRole(
  role: AppSessionRole,
  email: string | null | undefined,
): boolean {
  const resolvedRole = resolveSessionRole(role, email);
  return resolvedRole === "client" || resolvedRole === "maestro";
}

export function resolvePinnedSessionClientKey(
  input: ResolveClientInput,
): ClientKey | null {
  const inferredClientKey = inferClientKeyFromEmail(input.email);
  if (hasExplicitTenantAlias(input.email) && inferredClientKey) {
    return inferredClientKey;
  }

  const resolved = [
    input.clientId,
    input.defaultClientId,
    inferClientKeyFromEmail(input.email),
  ].find((candidate) => isClientKey(candidate));
  return resolved ?? null;
}

export function resolveSessionClientKey(input: ResolveClientInput): ClientKey {
  return resolvePinnedSessionClientKey(input) ?? DEFAULT_CLIENT_KEY;
}

export function shouldStripUnauthorizedClientParam(
  role: AppSessionRole,
  input: ResolveClientInput,
  requestedClientId: string | null | undefined,
): boolean {
  if (!requestedClientId) return false;
  if (!isLockedTenantRole(role, input.email)) return false;
  const pinnedClientId = resolvePinnedSessionClientKey(input);
  if (!pinnedClientId) return false;
  return requestedClientId !== pinnedClientId;
}

const SOURCE_EVENT_TENANT_HINTS: ReadonlyArray<readonly [RegExp, ClientKey]> = [
  [/\b(?:apex-retail|apexretail|src-apx|apx-src)\b/i, "apexretail"],
  [/\b(?:meridian-health|meridian|src-mer|mer-src)\b/i, "meridian"],
  [
    /\b(?:firstcapital|first-capital|arcturus|src-fc|fc-src|src-arc|arc-src)\b/i,
    "arcturus",
  ],
  [/\b(?:northstar-clinical|northstar|src-ns|ns-src)\b/i, "northstar"],
  [/\b(?:skyharbor-air|skyharbor|src-sh|sh-src)\b/i, "skyharbor"],
  [/\b(?:lakeshore-holdings|lakeshore|src-lsh|lsh-src)\b/i, "lakeshore"],
];

export function inferSourceEventClientKeyFromSlug(
  eventSlug: string | null | undefined,
): ClientKey | null {
  const normalized = eventSlug?.trim() ?? "";
  if (!normalized) return null;
  for (const [pattern, clientKey] of SOURCE_EVENT_TENANT_HINTS) {
    if (pattern.test(normalized)) return clientKey;
  }
  return null;
}

export function shouldDenySourceEventSlugForPinnedClient(
  role: AppSessionRole,
  input: ResolveClientInput,
  eventSlug: string | null | undefined,
): boolean {
  if (!isLockedTenantRole(role, input.email)) return false;
  const pinnedClientId = resolvePinnedSessionClientKey(input);
  if (!pinnedClientId) return false;
  const eventClientKey = inferSourceEventClientKeyFromSlug(eventSlug);
  if (!eventClientKey) return false;
  return eventClientKey !== pinnedClientId;
}

export function shouldDenySourceEventSlugForActiveClient(
  activeClientId: string | null | undefined,
  eventSlug: string | null | undefined,
): boolean {
  if (!isClientKey(activeClientId)) return false;
  const eventClientKey = inferSourceEventClientKeyFromSlug(eventSlug);
  if (!eventClientKey) return false;
  return eventClientKey !== activeClientId;
}

export function isExternalOnlyRole(role: AppSessionRole): role is "external" {
  return role === "external";
}

export function resolvePostSignInPath(
  role: AppSessionRole,
  input: ResolveClientInput = {},
): string {
  const resolvedRole = resolveSessionRole(role, input.email);
  const pinnedClientId = resolvePinnedSessionClientKey(input);
  const resolvedClientId = resolveSessionClientKey(input);

  if (isNewClientSetupEmail(input.email)) {
    return "/tower";
  }

  if (isExternalOnlyRole(resolvedRole)) {
    return "/";
  }

  if (resolvedRole === "investor") {
    return `/investor?client=${resolvedClientId}`;
  }

  // Tower-as-landing for portfolio-bearing tenants (Tower audit §5.1).
  // When the caller has resolved that the tenant has a non-empty portfolio
  // substrate, Tower becomes the landing page so a CIO sees their Control
  // Tower the moment they sign in. Empty-portfolio users continue to
  // `/home` as before. Investors and externals are intentionally excluded.
  if (input.hasTowerPortfolio === true) {
    if (resolvedRole === "client" || resolvedRole === "maestro") {
      return pinnedClientId ? `/tower?client=${pinnedClientId}` : "/tower";
    }
    if (resolvedRole === "admin") {
      return `/tower?client=${resolvedClientId}`;
    }
    return `/tower?client=${resolvedClientId}`;
  }

  if (resolvedRole === "admin") {
    return `/home?client=${resolvedClientId}`;
  }

  if (resolvedRole === "client" || resolvedRole === "maestro") {
    if (pinnedClientId) {
      return `/home?client=${pinnedClientId}`;
    }
    return "/home";
  }

  return `/home?client=${resolvedClientId}`;
}
