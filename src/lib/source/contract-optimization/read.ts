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
  const payload = rows[0]?.profile_payload ?? null;
  if (!payload || !isRenderableContractOptimizationProfile(payload)) {
    return null;
  }
  return payload;
}

/**
 * `profile_payload` is a JSON snapshot written whenever the load script last
 * ran. If the `ContractOptimizationMveProfile` shape has grown fields since
 * that snapshot was taken (e.g. `visualInsights`, added after this event's
 * profile was persisted), `ContractOptimizationProfilePanel` dereferences
 * them without an optional-chain guard and will crash the whole event page.
 * Validate the exact fields the panel reads unconditionally before treating
 * a persisted row as renderable — a stale/incompatible snapshot degrades to
 * "no profile" (today's baseline, honest) rather than a runtime crash.
 */
function isRenderableContractOptimizationProfile(
  value: ContractOptimizationMveProfile,
): boolean {
  const p = value as unknown as Record<string, unknown>;
  if (!Array.isArray(p.findings) || !Array.isArray(p.levers)) return false;
  const visualInsights = p.visualInsights as
    | Record<string, unknown>
    | undefined;
  if (
    !visualInsights ||
    !Array.isArray(visualInsights.exposureByDriver) ||
    !Array.isArray(visualInsights.invoiceVarianceTrend) ||
    visualInsights.operationalPressure == null
  ) {
    return false;
  }
  const contractBaseline = p.contractBaseline as
    | Record<string, unknown>
    | undefined;
  if (
    !contractBaseline ||
    typeof contractBaseline.currentAnnualRunRateUsd !== "number" ||
    typeof contractBaseline.evidenceCount !== "number"
  ) {
    return false;
  }
  const recommendedPath = p.recommendedPath as
    | Record<string, unknown>
    | undefined;
  if (
    !recommendedPath ||
    typeof recommendedPath.immediateAction !== "string" ||
    typeof recommendedPath.primaryPath !== "string" ||
    typeof recommendedPath.fallbackPath !== "string" ||
    typeof recommendedPath.doNotDo !== "string"
  ) {
    return false;
  }
  if (!Array.isArray(p.clientToComplete)) return false;
  if (typeof p.readyForOptimization !== "string") return false;
  if (typeof p.syntheticDemo !== "boolean") return false;
  if (typeof p.sourceEventId !== "string") return false;
  return true;
}
