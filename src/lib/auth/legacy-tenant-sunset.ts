import { CANONICAL_CLIENT_ADMIN_EMAILS } from "@/lib/auth/canonical-auth-roster";
import { FOUNDATION_PROOF_LOGINS } from "@/lib/auth/foundation-proof-logins";
import { canonicalTenantKey } from "@/lib/tenant/aliases";
import { isFoundationTenantKey } from "@/lib/tenant/foundation-tenants";

type MetadataRecord = Record<string, unknown>;

export interface LegacyTenantLoginCandidate {
  email: string | null;
  publicMetadata?: unknown;
}

export interface LegacyTenantLoginDecision {
  shouldDisable: boolean;
  reason: string;
  tenantKey: string | null;
}

const ADMIN_EMAILS = new Set(
  CANONICAL_CLIENT_ADMIN_EMAILS.map((email) => email.toLowerCase()),
);

const FOUNDATION_PROOF_EMAILS = new Set(
  FOUNDATION_PROOF_LOGINS.map((login) => login.email.toLowerCase()),
);

const LEGACY_TENANT_KEYS = new Set([
  "apex-retail",
  "first-capital",
  "lakeshore-holdings",
  "lakeshore-industries",
  "meridian-health",
  "northstar-clinical",
  "skyharbor-air",
]);

const LEGACY_EMAIL_PATTERNS: readonly RegExp[] = [
  /@apex-retail\.example\.com$/i,
  /@firstcapital\.example\.com$/i,
  /@lakeshore-(?:holdings|industries)\.example\.com$/i,
  /@meridian-health\.example\.com$/i,
  /@northstar-clinical\.example\.com$/i,
  /@skyharbor-air\.example\.com$/i,
  /\+(?:apex|firstcapital|lakeshore|meridian|northstar|skyharbor)@abarva\.com$/i,
];

function isRecord(value: unknown): value is MetadataRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function metadataString(metadata: MetadataRecord, key: string): string | null {
  const value = metadata[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizedEmail(email: string | null | undefined): string {
  return email?.trim().toLowerCase() ?? "";
}

function resolveMetadataTenantKey(publicMetadata: unknown): string | null {
  if (!isRecord(publicMetadata)) return null;
  for (const key of [
    "foundationTenantKey",
    "tenantKey",
    "clientId",
    "defaultClientId",
  ]) {
    const tenantKey = canonicalTenantKey(metadataString(publicMetadata, key) ?? "");
    if (tenantKey) return tenantKey;
  }
  return null;
}

export function classifyLegacyTenantLogin(
  candidate: LegacyTenantLoginCandidate,
): LegacyTenantLoginDecision {
  const email = normalizedEmail(candidate.email);
  if (email && (ADMIN_EMAILS.has(email) || FOUNDATION_PROOF_EMAILS.has(email))) {
    return {
      shouldDisable: false,
      reason: "protected_identity",
      tenantKey: null,
    };
  }

  const tenantKey = resolveMetadataTenantKey(candidate.publicMetadata);
  if (tenantKey && isFoundationTenantKey(tenantKey)) {
    return {
      shouldDisable: false,
      reason: "foundation_tenant_identity",
      tenantKey,
    };
  }
  if (tenantKey && LEGACY_TENANT_KEYS.has(tenantKey)) {
    return {
      shouldDisable: true,
      reason: "legacy_tenant_metadata",
      tenantKey,
    };
  }

  if (email && LEGACY_EMAIL_PATTERNS.some((pattern) => pattern.test(email))) {
    return {
      shouldDisable: true,
      reason: "legacy_tenant_email",
      tenantKey: tenantKey ?? null,
    };
  }

  return {
    shouldDisable: false,
    reason: "not_legacy_tenant_login",
    tenantKey: tenantKey ?? null,
  };
}
