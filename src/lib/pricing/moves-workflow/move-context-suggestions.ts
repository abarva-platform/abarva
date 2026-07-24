/**
 * Nexus Pricing Engine — PR5 Move-context suggestion resolver (brief §9.6).
 *
 * Given a Move, resolves a proposed value + source chip for every input the
 * wizard could ask about, so step 2/3/4 can prepopulate rather than present
 * a blank form (brief §9.3). Every suggestion is a PROPOSAL, never an
 * auto-confirmation — `PricingEstimateInputRow.confirmed_by` stays null for
 * anything produced here; the user must explicitly confirm, modify, or
 * reject it before the validation gate will treat it as settled (see
 * `validation-gate.ts`).
 *
 * ## What the real Move/engagement schema actually exposes (honest finding)
 *
 * `ProgramCore` (`src/lib/programs/types.db.ts`) and the `StrategicMove`
 * view-model (`src/lib/programs/types.ui.ts`) were checked directly (grepped
 * for `integration`, `impacted_user`, `rollout_wave`, `stakeholder`, and
 * every other PR4 `pricing_effort_drivers.driver_code` name) — NONE of the
 * PR4 scope-driver quantities (`integration_count`, `impacted_user_count`,
 * `rollout_wave_count`, `stakeholder_group_count`, `data_domain_count`,
 * `application_count`, etc.) exist as structured fields on the real Move
 * schema today. `timelineHorizon` is a free-text field, not a structured
 * start-date/duration; there is no Move-level field this resolver could
 * honestly map to `target_start_date`/`target_duration_weeks` either. This
 * function does NOT fabricate a mapping for any of these — every scope
 * driver and every date field returns `value: null` with an explicit
 * `gapReason` unless a REAL source (a client pricing profile assumption, or
 * — for currency only — the Move's own recorded value-at-stake currency)
 * resolves it. If a future PR adds structured scope fields to the Move
 * schema, this is the single place to wire them in.
 */
import type { EffortEnginePack } from "../effort-engine/types";
import { resolveActivityPacksForArchetype } from "../effort-engine/activity-packs";
import type { PricingClientProfileValueRow } from "../types";
import type { EstimateInputSuggestion } from "./types";

export interface MoveContextForSuggestions {
  moveId: string;
  /** ISO currency code recorded on the Move's own value-at-stake, if any — the one real Move-context field this resolver can honestly use. */
  valueAtStakeCurrency: string | null;
}

/**
 * Every scope-driver code an archetype's in-scope activity packs actually
 * reference (excluding `percentage_of_selected_labor`/`manual_cost_line`,
 * which do not consume a driver quantity) — derived from PR4's REAL
 * archetype→activity-pack→rule mapping, never a hardcoded per-archetype
 * list (brief §9.2 step 2's explicit requirement).
 */
export function listRequiredDriverCodesForArchetype(
  pack: EffortEnginePack,
  archetypeCode: string,
  includeConditionalPackCodes: readonly string[] = [],
): string[] {
  const resolved = resolveActivityPacksForArchetype(pack, archetypeCode, { includeConditionalPackCodes });
  const codes = new Set<string>();
  for (const activityPack of resolved) {
    for (const rule of activityPack.rules) {
      if ("driverCode" in rule.operation && rule.operation.driverCode) {
        codes.add(rule.operation.driverCode);
      }
    }
  }
  return Array.from(codes).sort();
}

function driverLabel(pack: EffortEnginePack, driverCode: string): { label: string; unit: string | null } {
  const driver = pack.effortDrivers.find((d) => d.driver_code === driverCode);
  return { label: driver?.driver_name ?? driverCode, unit: driver?.unit_label ?? null };
}

/**
 * Resolve every suggestion the wizard's scope/quantities step (brief §9.2
 * step 2) should show for `archetypeCode`, prepopulated where a REAL source
 * exists. Scope-driver quantities always come back `value: null` today (see
 * file header) unless a matching `pricing_client_profile_values` row exists
 * for that exact driver code — which nothing in PR2/PR3's seed data
 * populates yet, so in practice every scope-driver suggestion is an honest
 * gap until a tenant's client profile (or a future Move-schema addition)
 * supplies one.
 */
export function resolveScopeDriverSuggestions(
  pack: EffortEnginePack,
  archetypeCode: string,
  clientProfileValues: readonly PricingClientProfileValueRow[] = [],
  includeConditionalPackCodes: readonly string[] = [],
): EstimateInputSuggestion[] {
  const driverCodes = listRequiredDriverCodesForArchetype(pack, archetypeCode, includeConditionalPackCodes);
  const profileByKey = new Map(clientProfileValues.map((v) => [v.assumption_key, v]));

  return driverCodes.map((driverCode) => {
    const { label, unit } = driverLabel(pack, driverCode);
    const profileMatch = profileByKey.get(driverCode);
    if (profileMatch) {
      return {
        inputKey: driverCode,
        label,
        unit,
        required: true,
        value: profileMatch.assumption_value,
        sourceType: "client_profile",
        sourceRef: profileMatch.id,
        confidence: "medium",
        gapReason: null,
      };
    }
    return {
      inputKey: driverCode,
      label,
      unit,
      required: true,
      value: null,
      sourceType: "client_input",
      sourceRef: null,
      confidence: null,
      gapReason:
        `No Move-context field or client pricing profile assumption resolves '${driverCode}' yet — ` +
        "the real Move/engagement schema does not carry this scope-driver quantity today. Enter it directly.",
    };
  });
}

/** Suggestions for the estimate-setup step (brief §9.2 step 1) fields that CAN be honestly derived from the Move itself. */
export function resolveSetupSuggestions(move: MoveContextForSuggestions): EstimateInputSuggestion[] {
  const suggestions: EstimateInputSuggestion[] = [];
  if (move.valueAtStakeCurrency) {
    suggestions.push({
      inputKey: "currency",
      label: "Currency",
      unit: null,
      required: true,
      value: move.valueAtStakeCurrency,
      sourceType: "move_context",
      sourceRef: `move:${move.moveId}:valueAtStake.currency`,
      confidence: "high",
      gapReason: null,
    });
  } else {
    suggestions.push({
      inputKey: "currency",
      label: "Currency",
      unit: null,
      required: true,
      value: "USD",
      sourceType: "global_default",
      sourceRef: "abarva-default-currency",
      confidence: "low",
      gapReason: null,
    });
  }

  for (const [inputKey, label] of [
    ["target_start_date", "Target start date"],
    ["target_duration_weeks", "Target duration (weeks)"],
  ] as const) {
    suggestions.push({
      inputKey,
      label,
      unit: inputKey === "target_duration_weeks" ? "weeks" : null,
      required: true,
      value: null,
      sourceType: "client_input",
      sourceRef: null,
      confidence: null,
      gapReason:
        "The Move/engagement schema has no structured target-start-date or duration field " +
        "(only a free-text `timelineHorizon`) — enter directly.",
    });
  }

  return suggestions;
}

/** Every non-driver client-profile assumption (e.g. offshore_ratio_default, discount_tier) not already surfaced as a scope-driver suggestion — recorded for reference; not yet consumed by the PR4 V1 effort-engine calculation (its `ModuleMultipliers` has no offshore/discount concept), disclosed honestly rather than silently wired in. */
export function resolveClientProfileReferenceSuggestions(
  clientProfileValues: readonly PricingClientProfileValueRow[],
  consumedKeys: ReadonlySet<string>,
): EstimateInputSuggestion[] {
  return clientProfileValues
    .filter((v) => !consumedKeys.has(v.assumption_key))
    .map((v) => ({
      inputKey: v.assumption_key,
      label: v.assumption_key,
      unit: null,
      required: false,
      value: v.assumption_value,
      sourceType: "client_profile" as const,
      sourceRef: v.id,
      confidence: "medium" as const,
      gapReason: null,
    }));
}
