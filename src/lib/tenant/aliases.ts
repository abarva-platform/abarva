import {
  ALL_CLIENTS,
  CLIENT_KEY_TO_INDUSTRY_CODE,
  DEFAULT_CLIENT_KEY,
  canonicalClientDisplayName,
  getClientOption,
  isClientKey,
  type ClientKey,
} from "@/lib/client-config";

export interface TenantAliasProfile {
  appClientKey: ClientKey;
  canonicalKey: string;
  brokerKey: string;
  displayName: string;
  industryCode: string;
  aliases: readonly string[];
}

const TENANT_ALIAS_PROFILES: readonly TenantAliasProfile[] = [
  {
    appClientKey: "apexretail",
    canonicalKey: "apex-retail",
    brokerKey: "apex-retail",
    displayName: getClientOption("apexretail").name,
    industryCode: CLIENT_KEY_TO_INDUSTRY_CODE.apexretail,
    aliases: [
      "apexretail",
      "apex-retail",
      "apex",
      "apex retail",
      "apex retail group",
      "retail demo",
    ],
  },
  {
    appClientKey: "meridian",
    canonicalKey: "meridian-health",
    brokerKey: "meridian",
    displayName: getClientOption("meridian").name,
    industryCode: CLIENT_KEY_TO_INDUSTRY_CODE.meridian,
    aliases: [
      "meridian",
      "meridian-health",
      "meridian health",
      "meridian health system",
      "meridian_health_global",
      "heliara",
      "heliara health",
      "healthcare demo",
    ],
  },
  {
    appClientKey: "arcturus",
    canonicalKey: "first-capital",
    brokerKey: "first-capital",
    displayName: getClientOption("arcturus").name,
    industryCode: CLIENT_KEY_TO_INDUSTRY_CODE.arcturus,
    aliases: [
      "arcturus",
      "firstcapital",
      "first-capital",
      "first-capital-financial",
      "first capital",
      "first capital financial",
      "financial services demo",
    ],
  },
  {
    appClientKey: "northstar",
    canonicalKey: "northstar-clinical",
    brokerKey: "northstar-clinical",
    displayName: getClientOption("northstar").name,
    industryCode: CLIENT_KEY_TO_INDUSTRY_CODE.northstar,
    aliases: [
      "northstar",
      "northstar-clinical",
      "northstar clinical technologies",
      "clinical technology demo",
    ],
  },
  {
    appClientKey: "skyharbor",
    canonicalKey: "skyharbor-air",
    brokerKey: "skyharbor-air",
    displayName: getClientOption("skyharbor").name,
    industryCode: CLIENT_KEY_TO_INDUSTRY_CODE.skyharbor,
    aliases: [
      "skyharbor",
      "skyharbor-air",
      "skyharbor-global",
      "skyharbor_global",
      "skyharbor air",
      "skyharbor global",
      "skyharbor global airlines group",
      "skyharbor airlines",
      "airline demo",
    ],
  },
  {
    appClientKey: "lakeshore",
    canonicalKey: "lakeshore-holdings",
    brokerKey: "lakeshore-holdings",
    displayName: getClientOption("lakeshore").name,
    industryCode: CLIENT_KEY_TO_INDUSTRY_CODE.lakeshore,
    aliases: ["lakeshore", "lakeshore-holdings", "lakeshore holdings"],
  },
] as const;

const normalizeTenantAlias = (value: string): string =>
  value.trim().toLowerCase().replace(/_/g, "-");

const PROFILE_BY_APP_KEY = new Map<ClientKey, TenantAliasProfile>(
  TENANT_ALIAS_PROFILES.map((profile) => [profile.appClientKey, profile]),
);

const PROFILE_BY_ALIAS = new Map<string, TenantAliasProfile>(
  TENANT_ALIAS_PROFILES.flatMap((profile) => {
    const aliases = new Set(
      [
        profile.appClientKey,
        profile.canonicalKey,
        profile.brokerKey,
        ...profile.aliases,
      ].map(normalizeTenantAlias),
    );
    return Array.from(aliases).map((alias) => [alias, profile] as const);
  }),
);

export const TENANT_KEY_ALIASES: Readonly<Record<string, string>> =
  Object.freeze(
    Object.fromEntries(
      TENANT_ALIAS_PROFILES.flatMap((profile) =>
        Array.from(
          new Set([
            profile.appClientKey,
            profile.brokerKey,
            ...profile.aliases,
          ]),
        )
          .filter(
            (alias) => normalizeTenantAlias(alias) !== profile.canonicalKey,
          )
          .map(
            (alias) =>
              [normalizeTenantAlias(alias), profile.canonicalKey] as const,
          ),
      ),
    ),
  );

export const CANONICAL_TENANT_KEYS: readonly string[] = Object.freeze(
  TENANT_ALIAS_PROFILES.map((profile) => profile.canonicalKey),
);

export const LEGACY_TENANT_ALIASES: readonly string[] = Object.freeze(
  Object.keys(TENANT_KEY_ALIASES),
);

export function resolveTenantAlias(
  value: string | null | undefined,
): TenantAliasProfile | null {
  if (!value) return null;
  return PROFILE_BY_ALIAS.get(normalizeTenantAlias(value)) ?? null;
}

export function tenantProfileForClientKey(
  clientKey: ClientKey,
): TenantAliasProfile {
  return (
    PROFILE_BY_APP_KEY.get(clientKey) ??
    PROFILE_BY_APP_KEY.get(DEFAULT_CLIENT_KEY)!
  );
}

export function appClientKeyForTenant(
  value: string | null | undefined,
): ClientKey | null {
  const profile = resolveTenantAlias(value);
  if (profile) return profile.appClientKey;
  return isClientKey(value) ? value : null;
}

export function canonicalTenantKey<T extends string | null | undefined>(
  tenantKey: T,
): T extends string ? string : T {
  if (tenantKey == null) return tenantKey as never;
  const profile = resolveTenantAlias(tenantKey);
  return (profile?.canonicalKey ?? tenantKey) as never;
}

export function brokerTenantKey(
  value: string | null | undefined,
): string | null {
  const profile = resolveTenantAlias(value);
  return profile?.brokerKey ?? value ?? null;
}

export function tenantAliasesFor(
  value: string | ClientKey | null | undefined,
): string[] {
  const profile = resolveTenantAlias(value);
  if (!profile) return value ? [value] : [];
  return Array.from(
    new Set([
      profile.appClientKey,
      profile.canonicalKey,
      profile.brokerKey,
      ...profile.aliases,
    ]),
  );
}

export function canonicalTenantDisplayName(
  value: string | null | undefined,
  fallbackName?: string | null,
): string {
  const profile = resolveTenantAlias(value);
  if (profile) {
    return (
      canonicalClientDisplayName({
        key: profile.appClientKey,
        name: fallbackName,
      }) ?? profile.displayName
    );
  }
  const option = getClientOption(value);
  return (
    canonicalClientDisplayName({ key: option.id, name: fallbackName }) ??
    option.name
  );
}

export function tenantIndustryCode(
  value: string | null | undefined,
): string | null {
  const profile = resolveTenantAlias(value);
  if (profile) return profile.industryCode;
  const option = ALL_CLIENTS.find((client) => client.id === value);
  return option ? CLIENT_KEY_TO_INDUSTRY_CODE[option.id] : null;
}

export function isLegacyTenantAlias(
  value: unknown,
): value is keyof typeof TENANT_KEY_ALIASES {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(
      TENANT_KEY_ALIASES,
      normalizeTenantAlias(value),
    )
  );
}
