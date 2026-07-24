/**
 * Nexus Pricing Engine — PR2 typed read access to the reference/taxonomy
 * tables (towers, capabilities, roles, aliases, seniority levels, rate
 * bands, provider classes, delivery locations).
 *
 * Follows the direct-`azureRead`-import convention used by recent read
 * paths such as `src/lib/programs/board-artifacts/load-move-business-case-input.ts`
 * and `src/lib/tower/value-states/repository.ts` (see
 * `repository.azure-read.test.ts` for the matching test pattern of mocking
 * `@/lib/data-plane/azureRead` directly) — not the older
 * `read-adapters/*ReadAdapter.ts` + `postgresCompat.ts` family, which the
 * PR0 audit flags as legacy-adjacent.
 *
 * This module is read-only. Nothing here is wired into any API route or UI
 * yet (PR3 scope) — it exists as the typed access layer the reference-pack
 * loader (for its "is there already a current version" read) and any future
 * PR3+ consumer will call.
 */
import { azureRead } from "@/lib/data-plane/azureRead";
import type {
  PricingCapabilityRow,
  PricingDeliveryLocationRow,
  PricingProviderClassRow,
  PricingProviderRow,
  PricingProviderLevelAliasRow,
  PricingRateBandRow,
  PricingRoleAliasRow,
  PricingRoleFamilyRow,
  PricingRoleRow,
  PricingSeniorityLevelRow,
  PricingTaxonomyVersionRow,
  PricingTowerRow,
} from "./types";

/** The current (is_current = true) taxonomy version row, or null if none has been loaded yet. */
export async function getCurrentTaxonomyVersion(): Promise<PricingTaxonomyVersionRow | null> {
  return azureRead.maybeSingle<PricingTaxonomyVersionRow>({
    table: "pricing_taxonomy_versions",
    where: { is_current: true },
    missingTable: "empty",
  });
}

export async function listTowers(taxonomyVersion: number): Promise<PricingTowerRow[]> {
  return azureRead.select<PricingTowerRow>({
    table: "pricing_towers",
    where: { taxonomy_version: taxonomyVersion },
    orderBy: { column: "tower_code", direction: "asc" },
    missingTable: "empty",
  });
}

export async function listCapabilities(
  taxonomyVersion: number,
  towerCode?: string,
): Promise<PricingCapabilityRow[]> {
  return azureRead.select<PricingCapabilityRow>({
    table: "pricing_capabilities",
    where: towerCode
      ? { taxonomy_version: taxonomyVersion, tower_code: towerCode }
      : { taxonomy_version: taxonomyVersion },
    orderBy: { column: "capability_code", direction: "asc" },
    missingTable: "empty",
  });
}

export async function listRoleFamilies(
  taxonomyVersion: number,
): Promise<PricingRoleFamilyRow[]> {
  return azureRead.select<PricingRoleFamilyRow>({
    table: "pricing_role_families",
    where: { taxonomy_version: taxonomyVersion },
    orderBy: { column: "role_family_code", direction: "asc" },
    missingTable: "empty",
  });
}

export async function listSeniorityLevels(
  taxonomyVersion: number,
): Promise<PricingSeniorityLevelRow[]> {
  return azureRead.select<PricingSeniorityLevelRow>({
    table: "pricing_seniority_levels",
    where: { taxonomy_version: taxonomyVersion },
    orderBy: { column: "rank", direction: "asc" },
    missingTable: "empty",
  });
}

export async function listRoles(taxonomyVersion: number): Promise<PricingRoleRow[]> {
  return azureRead.select<PricingRoleRow>({
    table: "pricing_roles",
    where: { taxonomy_version: taxonomyVersion },
    orderBy: { column: "role_code", direction: "asc" },
    missingTable: "empty",
  });
}

export async function getRoleByCode(
  taxonomyVersion: number,
  roleCode: string,
): Promise<PricingRoleRow | null> {
  return azureRead.maybeSingle<PricingRoleRow>({
    table: "pricing_roles",
    where: { taxonomy_version: taxonomyVersion, role_code: roleCode },
    missingTable: "empty",
  });
}

/**
 * List role aliases visible to a tenant: global aliases (`tenant_key IS
 * NULL`) plus that tenant's own aliases, if any. Callers MUST pass the
 * canonical hyphenated tenant key (`canonicalTenantKey()` from
 * `@/lib/tenant/aliases`) — this function does not canonicalize for you, to
 * keep the canonicalization boundary explicit at the caller per
 * PRICING_ENGINE_CURRENT_STATE.md §10.
 */
export async function listRoleAliasesForTenant(
  taxonomyVersion: number,
  tenantKey: string | null,
): Promise<PricingRoleAliasRow[]> {
  const globalAliases = await azureRead.select<PricingRoleAliasRow>({
    table: "pricing_role_aliases",
    where: { taxonomy_version: taxonomyVersion, tenant_key: { op: "is", value: null } },
    missingTable: "empty",
  });
  if (!tenantKey) return globalAliases;
  const tenantAliases = await azureRead.select<PricingRoleAliasRow>({
    table: "pricing_role_aliases",
    where: { taxonomy_version: taxonomyVersion, tenant_key: tenantKey },
    missingTable: "empty",
  });
  return [...globalAliases, ...tenantAliases];
}

export async function listRateBands(taxonomyVersion: number): Promise<PricingRateBandRow[]> {
  return azureRead.select<PricingRateBandRow>({
    table: "pricing_rate_bands",
    where: { taxonomy_version: taxonomyVersion },
    orderBy: { column: "rate_band_code", direction: "asc" },
    missingTable: "empty",
  });
}

export async function getRateBandByCode(
  taxonomyVersion: number,
  rateBandCode: string,
): Promise<PricingRateBandRow | null> {
  return azureRead.maybeSingle<PricingRateBandRow>({
    table: "pricing_rate_bands",
    where: { taxonomy_version: taxonomyVersion, rate_band_code: rateBandCode },
    missingTable: "empty",
  });
}

export async function listProviderClasses(
  taxonomyVersion: number,
): Promise<PricingProviderClassRow[]> {
  return azureRead.select<PricingProviderClassRow>({
    table: "pricing_provider_classes",
    where: { taxonomy_version: taxonomyVersion },
    orderBy: { column: "provider_class_code", direction: "asc" },
    missingTable: "empty",
  });
}

export async function listDeliveryLocations(
  taxonomyVersion: number,
): Promise<PricingDeliveryLocationRow[]> {
  return azureRead.select<PricingDeliveryLocationRow>({
    table: "pricing_delivery_locations",
    where: { taxonomy_version: taxonomyVersion },
    orderBy: { column: "location_code", direction: "asc" },
    missingTable: "empty",
  });
}

/**
 * Named providers for a tenant (global + tenant-specific). Unseeded by PR2
 * (no onboarded providers exist yet) — returns an empty array against a
 * real database today, and `[]` (never throws) if the table itself is
 * somehow missing, matching every other reader in this module.
 */
export async function listProvidersForTenant(
  tenantKey: string | null,
): Promise<PricingProviderRow[]> {
  const globalProviders = await azureRead.select<PricingProviderRow>({
    table: "pricing_providers",
    where: { is_current: true, tenant_key: { op: "is", value: null } },
    missingTable: "empty",
  });
  if (!tenantKey) return globalProviders;
  const tenantProviders = await azureRead.select<PricingProviderRow>({
    table: "pricing_providers",
    where: { is_current: true, tenant_key: tenantKey },
    missingTable: "empty",
  });
  return [...globalProviders, ...tenantProviders];
}

/** Unseeded by PR2 (see migration comment) — present for completeness/future use. */
export async function listProviderLevelAliasesForTenant(
  tenantKey: string | null,
): Promise<PricingProviderLevelAliasRow[]> {
  const globalAliases = await azureRead.select<PricingProviderLevelAliasRow>({
    table: "pricing_provider_level_aliases",
    where: { is_current: true, tenant_key: { op: "is", value: null } },
    missingTable: "empty",
  });
  if (!tenantKey) return globalAliases;
  const tenantAliases = await azureRead.select<PricingProviderLevelAliasRow>({
    table: "pricing_provider_level_aliases",
    where: { is_current: true, tenant_key: tenantKey },
    missingTable: "empty",
  });
  return [...globalAliases, ...tenantAliases];
}
