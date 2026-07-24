/**
 * Nexus Pricing Engine — PR5 estimate config (brief §10 `GET .../pricing/config`):
 * the archetype list and, for each archetype, the required-input schema
 * derived from PR4's REAL archetype→activity-pack→driver mapping — never a
 * hardcoded per-archetype question list (brief §9.2 step 2).
 */
import { resolveActivityPacksForArchetype } from "../effort-engine/activity-packs";
import { listArchetypeCodes, getArchetype } from "../effort-engine/archetypes";
import type { EffortEnginePack } from "../effort-engine/types";
import { listRequiredDriverCodesForArchetype } from "./move-context-suggestions";
import type { EstimateConfig, EstimateConfigRequiredInput, EstimateWizardStepHint } from "./types";

/**
 * The estimate-setup step's own fixed fields (brief §9.2 step 1) — these
 * apply to every archetype identically, so they are prepended to every
 * archetype's driver-derived list rather than duplicated per-archetype.
 */
const SETUP_INPUT_KEYS: EstimateConfigRequiredInput[] = [
  { inputKey: "scenario_name", label: "Scenario name", unit: null, required: true, stepHint: "setup" },
  { inputKey: "currency", label: "Currency", unit: null, required: true, stepHint: "setup" },
  { inputKey: "target_start_date", label: "Target start date", unit: null, required: true, stepHint: "setup" },
  { inputKey: "target_duration_weeks", label: "Target duration", unit: "weeks", required: true, stepHint: "setup" },
  { inputKey: "selected_rate_card_id", label: "Rate card", unit: null, required: true, stepHint: "setup" },
];

/**
 * `'scope'` (step 2) when every activity pack referencing `driverCode` is
 * `technical`; `'people'` (step 3) when at least one `shared_nontechnical`
 * pack references it — see the `EstimateWizardStepHint` doc comment for why
 * this is a real category split, not an invented one.
 */
function stepHintForDriver(pack: EffortEnginePack, archetypeCode: string, driverCode: string): EstimateWizardStepHint {
  const resolved = resolveActivityPacksForArchetype(pack, archetypeCode);
  const owningCategories = resolved
    .filter((p) => p.rules.some((rule) => "driverCode" in rule.operation && rule.operation.driverCode === driverCode))
    .map((p) => p.pack.category);
  return owningCategories.includes("shared_nontechnical") ? "people" : "scope";
}

export function buildEstimateConfig(pack: EffortEnginePack): EstimateConfig {
  const archetypeCodes = listArchetypeCodes(pack);
  const archetypes = archetypeCodes.map((code) => {
    const a = getArchetype(pack, code);
    return { archetypeCode: a.archetype_code, archetypeName: a.archetype_name, description: a.description };
  });

  const requiredInputsByArchetype: Record<string, EstimateConfigRequiredInput[]> = {};
  for (const code of archetypeCodes) {
    const driverCodes = listRequiredDriverCodesForArchetype(pack, code);
    const driverInputs: EstimateConfigRequiredInput[] = driverCodes.map((driverCode) => {
      const driver = pack.effortDrivers.find((d) => d.driver_code === driverCode);
      return {
        inputKey: driverCode,
        label: driver?.driver_name ?? driverCode,
        unit: driver?.unit_label ?? null,
        required: true,
        stepHint: stepHintForDriver(pack, code, driverCode),
      };
    });
    requiredInputsByArchetype[code] = [...SETUP_INPUT_KEYS, ...driverInputs];
  }

  return { modelVersion: pack.modelVersion, archetypes, requiredInputsByArchetype };
}

export { SETUP_INPUT_KEYS };
