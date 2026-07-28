/**
 * Fixture registry. The ONLY entry point for fixture packs. Keyed by synthetic
 * namespace; there is deliberately no fallback to any legacy/real tenant pack.
 *
 * FIXTURE-ONLY. Do not import these packs into React components — they are
 * consumed exclusively by the ContractFixtureConsumptionProvider.
 */

import type { FixturePack, FixtureScenario } from "./types";
import { AIRLINE_DEMO_NEW } from "./airline-demo-new";
import { HEALTHCARE_DEMO_NEW } from "./healthcare-demo-new";

export * from "./types";
export * from "./scenarios";

/** Synthetic fixture tenant keys — never canonical tenant keys. */
export const FIXTURE_TENANT_KEYS = [
  AIRLINE_DEMO_NEW.meta.tenantKey,
  HEALTHCARE_DEMO_NEW.meta.tenantKey,
] as const;
export type FixtureTenantKey = (typeof FIXTURE_TENANT_KEYS)[number];

const PACKS: Record<string, FixturePack> = {
  [AIRLINE_DEMO_NEW.meta.tenantKey]: AIRLINE_DEMO_NEW,
  [HEALTHCARE_DEMO_NEW.meta.tenantKey]: HEALTHCARE_DEMO_NEW,
};

export function isFixtureTenantKey(key: string): key is FixtureTenantKey {
  return Object.prototype.hasOwnProperty.call(PACKS, key);
}

/** Returns the pack for a synthetic fixture tenant, or null. No legacy fallback. */
export function getFixturePack(tenantKey: string): FixturePack | null {
  return PACKS[tenantKey] ?? null;
}

export function listFixtureTenants(): Array<{
  tenantKey: FixtureTenantKey;
  displayName: string;
  industry: string;
}> {
  return FIXTURE_TENANT_KEYS.map((k) => ({
    tenantKey: k,
    displayName: PACKS[k].meta.displayName,
    industry: PACKS[k].meta.industry,
  }));
}

export const DEFAULT_FIXTURE_TENANT: FixtureTenantKey =
  AIRLINE_DEMO_NEW.meta.tenantKey;

export type { FixturePack };
export type FixtureScenarioName = FixtureScenario;
