/**
 * Shared test fixtures for the PR4 effort/cost engine test suite.
 *
 * Reads the REAL, committed CSVs directly off disk — both PR1's taxonomy
 * pack (`pricing_roles.csv` / `pricing_rate_bands.csv`, for grounded rate
 * resolution) and PR4's own effort-engine pack (the 8 new CSVs) — the same
 * "read the real checked-in data, no synthetic approximation" convention
 * PR3's `coverage-report.test.ts` established. No database is touched.
 */
import fs from "node:fs";
import path from "node:path";
import Papa from "papaparse";
import { readEffortPackDir, type EffortPackData } from "../pack-loader";
import type { EffortEnginePack, PricingEffortRuleRow } from "../types";
import type { RoleRateSnapshot } from "../rate-card-resolver";

const PACK_DIR = path.resolve(__dirname, "..", "..", "..", "..", "..", "datasets", "reference", "pricing-engine-v1");

function readCsv(fileName: string): Record<string, string>[] {
  const raw = fs.readFileSync(path.join(PACK_DIR, fileName), "utf8");
  return Papa.parse<Record<string, string>>(raw, { header: true, skipEmptyLines: true }).data;
}

const MODEL_VERSION = 1;

/** Converts the raw CSV rows (as `pack-loader.ts` reads them) into the typed `EffortEnginePack` the engine consumes — model_version tagged as 1, matching a fresh single-version load. */
export function loadRealEffortEnginePack(): EffortEnginePack {
  const data: EffortPackData = readEffortPackDir(PACK_DIR);

  return {
    modelVersion: MODEL_VERSION,
    archetypes: data.archetypes.map((r) => ({
      model_version: MODEL_VERSION,
      archetype_code: r.archetype_code,
      archetype_name: r.archetype_name,
      description: r.description || null,
      status: r.status || "active",
    })),
    activityPacks: data.activityPacks.map((r) => ({
      model_version: MODEL_VERSION,
      activity_pack_code: r.activity_pack_code,
      activity_pack_name: r.activity_pack_name,
      category: r.category as "technical" | "shared_nontechnical",
      tower_code: r.tower_code || null,
      capability_code: r.capability_code || null,
      description: r.description || null,
      status: r.status || "active",
    })),
    effortDrivers: data.effortDrivers.map((r) => ({
      model_version: MODEL_VERSION,
      driver_code: r.driver_code,
      driver_name: r.driver_name,
      unit_label: r.unit_label,
      description: r.description || null,
      status: r.status || "active",
    })),
    effortRules: data.effortRules.map(
      (r): PricingEffortRuleRow => ({
        model_version: MODEL_VERSION,
        activity_pack_code: r.activity_pack_code,
        rule_code: r.rule_code,
        operation: r.operation as PricingEffortRuleRow["operation"],
        driver_code: r.driver_code || null,
        parameters: JSON.parse(r.parameters),
        classification: r.classification as PricingEffortRuleRow["classification"],
        sequence: Number.parseInt(r.sequence, 10),
        status: r.status || "active",
      }),
    ),
    roleMix: data.roleMix.map((r) => ({
      model_version: MODEL_VERSION,
      activity_pack_code: r.activity_pack_code,
      role_code: r.role_code,
      allocation_pct: Number.parseFloat(r.allocation_pct),
      level_hint: r.level_hint || null,
      status: r.status || "active",
    })),
    archetypeActivityMap: data.archetypeActivityMap.map((r) => ({
      model_version: MODEL_VERSION,
      archetype_code: r.archetype_code,
      activity_pack_code: r.activity_pack_code,
      applicability: r.applicability as "required" | "conditional" | "excluded",
      notes: r.notes || null,
      status: r.status || "active",
    })),
    rangePolicies: data.rangePolicies.map((r) => ({
      model_version: MODEL_VERSION,
      policy_code: r.policy_code,
      policy_name: r.policy_name,
      min_score: Number.parseInt(r.min_score, 10),
      max_score: Number.parseInt(r.max_score, 10),
      low_multiplier: Number.parseFloat(r.low_multiplier),
      high_multiplier: Number.parseFloat(r.high_multiplier),
      description: r.description || null,
      status: r.status || "active",
    })),
    agentCosts: data.agentCosts.map((r) => ({
      model_version: MODEL_VERSION,
      agent_cost_code: r.agent_cost_code,
      cost_key: r.cost_key,
      applies_to_archetype_code: r.applies_to_archetype_code || null,
      cost_value: Number.parseFloat(r.cost_value),
      unit: r.unit,
      description: r.description || null,
      status: r.status || "active",
    })),
  };
}

/**
 * Builds a `RoleRateSnapshot` from PR1's REAL committed taxonomy CSVs
 * (`pricing_roles.csv`, `pricing_rate_bands.csv`) — no client or global rate
 * card exists in this offline test environment (none has ever been
 * uploaded/approved), so every role resolves via the `rate_band_default`
 * bucket using each role's own `default_rate_band_code`, exactly matching
 * PR3's `coverage-report.test.ts` finding ("0 direct / 326 inherited" with
 * no client card).
 */
export function loadRealRoleRateSnapshot(): RoleRateSnapshot {
  const roles = readCsv("pricing_roles.csv");
  const rateBands = readCsv("pricing_rate_bands.csv");
  return {
    roles: roles.map((r) => ({ role_code: r.role_code, default_rate_band_code: r.default_rate_band_code || null })),
    rateBands: rateBands.map((r) => ({
      rate_band_code: r.rate_band_code,
      role_code: r.role_code,
      level_code: r.level_code,
      indicative_bill_rate: r.indicative_bill_rate ? Number.parseFloat(r.indicative_bill_rate) : null,
      currency: r.currency || "USD",
    })),
    clientLines: [],
    globalLines: [],
  };
}
