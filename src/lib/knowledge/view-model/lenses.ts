/**
 * The nine airline-specific business-problem lenses. This is assembler-layer
 * content built ON TOP of the real, generic KnowledgeLens re-ranking filter
 * (queries.ts's 6 cross-industry values: none/cost_efficiency/risk_resilience/
 * growth_innovation/data_ai_readiness/vendor_consolidation) — it does not
 * change which real queries run, only how the assembler labels/scopes them.
 *
 * PROVENANCE NOTE: 7 of these 9 (understand, irops_disruption_recovery, crew,
 * baggage, loyalty, revenue, mro) come directly from the task brief. The
 * approved HTML prototype the brief refers to as the authoritative source for
 * the full 9 is not present anywhere in this repo's git history (see
 * reports/airline-knowledge-provider-reconciliation-2026-07-30/
 * RISK_ASSESSMENT.md). network_scheduling and safety_compliance are my own
 * placeholders to reach 9, chosen as the two next-most-obvious airline
 * operating lenses. PR B MUST confirm the full 9 against the real prototype
 * before shipping the lens picker UI.
 */

import type {
  AirlineLensDefinition,
  AirlineLensId,
  ResolvedAirlineLens,
} from "./types";
import { AIRLINE_LENSES } from "./types";

export { AIRLINE_LENSES };
export type { AirlineLensId };

export const AIRLINE_LENS_DEFINITIONS: readonly AirlineLensDefinition[] = [
  {
    lensId: "understand",
    label: "Understand the enterprise",
    primaryDomainKeys: ["enterprise", "technology"],
    nearestRealLens: "none",
  },
  {
    lensId: "irops_disruption_recovery",
    label: "IROPS / disruption recovery",
    primaryDomainKeys: ["technology", "programs"],
    nearestRealLens: "risk_resilience",
  },
  {
    lensId: "crew",
    label: "Crew",
    primaryDomainKeys: ["technology"],
    nearestRealLens: "risk_resilience",
  },
  {
    lensId: "baggage",
    label: "Baggage",
    primaryDomainKeys: ["technology", "vendors"],
    nearestRealLens: "cost_efficiency",
  },
  {
    lensId: "loyalty",
    label: "Loyalty",
    primaryDomainKeys: ["data", "technology"],
    nearestRealLens: "growth_innovation",
  },
  {
    lensId: "revenue",
    label: "Revenue",
    primaryDomainKeys: ["enterprise", "data"],
    nearestRealLens: "growth_innovation",
  },
  {
    lensId: "mro",
    label: "MRO (maintenance, repair, overhaul)",
    primaryDomainKeys: ["technology", "vendors"],
    nearestRealLens: "cost_efficiency",
  },
  {
    lensId: "network_scheduling",
    label: "Network & scheduling",
    primaryDomainKeys: ["technology", "programs"],
    nearestRealLens: "vendor_consolidation",
  },
  {
    lensId: "safety_compliance",
    label: "Safety & compliance",
    primaryDomainKeys: ["risks", "technology"],
    nearestRealLens: "risk_resilience",
  },
] as const;

/** Resolve every lens's `resolved` flag against a set of domain keys that returned real data. */
export function resolveAirlineLenses(
  availableDomainKeys: ReadonlySet<string>,
): readonly ResolvedAirlineLens[] {
  return AIRLINE_LENS_DEFINITIONS.map((lens) => ({
    ...lens,
    resolved: lens.primaryDomainKeys.some((k) => availableDomainKeys.has(k)),
  }));
}
