import { azureRead } from "@/lib/data-plane/azureRead";
import type { ContractOptimizationMveProfile } from "./types";

const MISSING_TABLE_EMPTY = { missingTable: "empty" as const };

interface ProfilePayloadRow {
  profile_payload: ContractOptimizationMveProfile;
}

/**
 * Reads the persisted contract-optimization profile (findings, levers,
 * recommended path, evidence) for a specific Source event, if one exists.
 * `profile_payload` is the full `ContractOptimizationMveProfile` stored
 * verbatim by `toContractOptimizationPersistenceRows` — no reconstruction
 * needed. Returns null when no row exists for this exact event id: presence
 * of a persisted profile is the render gate, not a name/keyword heuristic.
 */
/** Known aliases for the SkyHarbor tenant key across load scripts and app-tier code. */
const SKYHARBOR_TENANT_ALIASES: readonly string[] = [
  "skyharbor",
  "skyharbor-air",
];

export async function getContractOptimizationProfile(
  tenantKey: string,
  sourceEventId: string,
): Promise<ContractOptimizationMveProfile | null> {
  const normalized = tenantKey.trim().toLowerCase();
  const aliases = Array.from(
    new Set([
      normalized,
      ...(SKYHARBOR_TENANT_ALIASES.includes(normalized)
        ? SKYHARBOR_TENANT_ALIASES
        : []),
    ]),
  );
  const rows = await azureRead.query<ProfilePayloadRow>(
    `select profile_payload
       from public.source_contract_optimization_profiles
      where tenant_key = any($1::text[]) and source_event_id = $2
      order by updated_at desc
      limit 1`,
    [aliases, sourceEventId],
    MISSING_TABLE_EMPTY,
  );
  return rows[0]?.profile_payload ?? null;
}
