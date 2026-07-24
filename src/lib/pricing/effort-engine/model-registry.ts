/**
 * Nexus Pricing Engine — PR4 model-registry: typed read access to the 8
 * effort-engine reference tables created by
 * `supabase/migrations/20260723235500_pricing_effort_engine_v1.sql`.
 *
 * Follows the same direct-`azureRead`-import convention as PR2's
 * `reference-repository.ts` (its header explains the precedent this copies)
 * — not the older `read-adapters`/`postgresCompat` family. `getCurrentModelVersion`
 * is NOT redefined here — it already exists in PR3's
 * `governed-load/reference-lookup.ts` (added there because PR2 created
 * `pricing_model_versions` but no reader yet existed); this module re-exports
 * it so callers only need to import from `effort-engine/`.
 */
import { azureRead } from "@/lib/data-plane/azureRead";
import { getCurrentModelVersion } from "../governed-load/reference-lookup";
import type {
  EffortEnginePack,
  PricingActivityPackRow,
  PricingActivityRoleMixRow,
  PricingAgentCostRow,
  PricingArchetypeActivityMapRow,
  PricingArchetypeRow,
  PricingEffortDriverRow,
  PricingEffortRuleRow,
  PricingRangePolicyRow,
} from "./types";

export { getCurrentModelVersion };

interface RawEffortRuleRow {
  model_version: number;
  activity_pack_code: string;
  rule_code: string;
  operation: string;
  driver_code: string | null;
  parameters: Record<string, unknown>;
  classification: PricingEffortRuleRow["classification"];
  sequence: number;
  status: string;
}

export async function listArchetypes(modelVersion: number): Promise<PricingArchetypeRow[]> {
  return azureRead.select<PricingArchetypeRow>({
    table: "pricing_archetypes",
    where: { model_version: modelVersion },
    orderBy: { column: "archetype_code", direction: "asc" },
    missingTable: "empty",
  });
}

export async function listActivityPacks(modelVersion: number): Promise<PricingActivityPackRow[]> {
  return azureRead.select<PricingActivityPackRow>({
    table: "pricing_activity_packs",
    where: { model_version: modelVersion },
    orderBy: { column: "activity_pack_code", direction: "asc" },
    missingTable: "empty",
  });
}

export async function listEffortDrivers(modelVersion: number): Promise<PricingEffortDriverRow[]> {
  return azureRead.select<PricingEffortDriverRow>({
    table: "pricing_effort_drivers",
    where: { model_version: modelVersion },
    orderBy: { column: "driver_code", direction: "asc" },
    missingTable: "empty",
  });
}

export async function listEffortRules(modelVersion: number): Promise<PricingEffortRuleRow[]> {
  const raw = await azureRead.select<RawEffortRuleRow>({
    table: "pricing_effort_rules",
    where: { model_version: modelVersion },
    orderBy: { column: "sequence", direction: "asc" },
    missingTable: "empty",
  });
  // operation is typed as EffortOperationKind at the type layer; the DB
  // column is a plain TEXT CHECK — cast here, not re-validated (rule-
  // interpreter.ts's parseEffortOperation is the real validation gate, run
  // when a rule is actually evaluated).
  return raw as unknown as PricingEffortRuleRow[];
}

export async function listActivityRoleMix(modelVersion: number): Promise<PricingActivityRoleMixRow[]> {
  return azureRead.select<PricingActivityRoleMixRow>({
    table: "pricing_activity_role_mix",
    where: { model_version: modelVersion },
    missingTable: "empty",
  });
}

export async function listArchetypeActivityMap(modelVersion: number): Promise<PricingArchetypeActivityMapRow[]> {
  return azureRead.select<PricingArchetypeActivityMapRow>({
    table: "pricing_archetype_activity_map",
    where: { model_version: modelVersion },
    missingTable: "empty",
  });
}

export async function listRangePolicies(modelVersion: number): Promise<PricingRangePolicyRow[]> {
  return azureRead.select<PricingRangePolicyRow>({
    table: "pricing_range_policies",
    where: { model_version: modelVersion },
    orderBy: { column: "min_score", direction: "asc" },
    missingTable: "empty",
  });
}

export async function listAgentCosts(modelVersion: number): Promise<PricingAgentCostRow[]> {
  return azureRead.select<PricingAgentCostRow>({
    table: "pricing_agent_costs",
    where: { model_version: modelVersion },
    missingTable: "empty",
  });
}

/**
 * Reads the full PR4 reference pack for one model_version in one call, for
 * engine consumption (`effort-engine.ts`). NOT to be confused with
 * `pack-loader.ts`'s `loadEffortEnginePack`, which IMPORTS the checked-in
 * CSVs into the database — this function only READS what is already there.
 */
export async function readEffortEnginePack(modelVersion: number): Promise<EffortEnginePack> {
  const [archetypes, activityPacks, effortDrivers, effortRules, roleMix, archetypeActivityMap, rangePolicies, agentCosts] =
    await Promise.all([
      listArchetypes(modelVersion),
      listActivityPacks(modelVersion),
      listEffortDrivers(modelVersion),
      listEffortRules(modelVersion),
      listActivityRoleMix(modelVersion),
      listArchetypeActivityMap(modelVersion),
      listRangePolicies(modelVersion),
      listAgentCosts(modelVersion),
    ]);
  return {
    modelVersion,
    archetypes,
    activityPacks,
    effortDrivers,
    effortRules,
    roleMix,
    archetypeActivityMap,
    rangePolicies,
    agentCosts,
  };
}
