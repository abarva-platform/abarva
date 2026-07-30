/**
 * The nine airline-specific business-problem lenses. This is assembler-layer
 * content built ON TOP of the real, generic KnowledgeLens re-ranking filter
 * (queries.ts's 6 cross-industry values: none/cost_efficiency/risk_resilience/
 * growth_innovation/data_ai_readiness/vendor_consolidation) — it does not
 * change which real queries run, only how the assembler labels/scopes them.
 *
 * PROVENANCE NOTE: PR A (see reports/airline-knowledge-provider-reconciliation-
 * 2026-07-30/) shipped 7 of these 9 from the task brief plus 2 placeholders
 * (`network_scheduling`, `safety_compliance`) because the approved HTML
 * prototype was not available in-repo at the time. PR B located the real
 * prototype script (`const LENSES = [...]` in the design source under
 * xdc-script.js) and reconciled ids/labels against it exactly. The real 9
 * lens ids are `understand, irops, crew, baggage, loyalty, revenue, mro,
 * airport, ai` — `network_scheduling` and `safety_compliance` were never
 * real lenses; the actual 8th/9th lenses are `airport` (turnaround) and `ai`
 * (AI opportunity readiness). Labels below are taken verbatim from the
 * prototype's LENSES array. `primaryDomainKeys`/`nearestRealLens` for
 * `airport` and `ai` are PR B's own judgment calls (documented per-lens
 * below), since the prototype does not encode a domain-key/real-lens
 * mapping — that mapping is purely an assembler-layer concept.
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
    lensId: "irops",
    label: "Recover faster from disruption",
    primaryDomainKeys: ["technology", "programs"],
    nearestRealLens: "risk_resilience",
  },
  {
    lensId: "crew",
    label: "Protect crew legality and cost",
    primaryDomainKeys: ["technology"],
    nearestRealLens: "risk_resilience",
  },
  {
    lensId: "baggage",
    label: "Reduce baggage mishandling",
    primaryDomainKeys: ["technology", "vendors"],
    nearestRealLens: "cost_efficiency",
  },
  {
    lensId: "loyalty",
    label: "Grow loyalty value",
    primaryDomainKeys: ["data", "technology"],
    nearestRealLens: "growth_innovation",
  },
  {
    lensId: "revenue",
    label: "Improve revenue management",
    primaryDomainKeys: ["enterprise", "data"],
    nearestRealLens: "growth_innovation",
  },
  {
    lensId: "mro",
    label: "Raise aircraft availability",
    primaryDomainKeys: ["technology", "vendors"],
    nearestRealLens: "cost_efficiency",
  },
  {
    // PR B judgment call: the prototype's "airport" lens (turnaround performance,
    // ground-handling handoffs held by vendors per the prototype's own "vendor"
    // view narrative) scopes most naturally to the technology/vendors domains,
    // same as mro/baggage which also concern ground operations vendors.
    lensId: "airport",
    label: "Improve airport turnaround",
    primaryDomainKeys: ["technology", "vendors"],
    nearestRealLens: "cost_efficiency",
  },
  {
    // PR B judgment call: the prototype's "ai" lens is explicitly about AI
    // opportunity readiness gated on data-feed ownership/certification — the
    // nearest real cross-industry lens is data_ai_readiness by name and intent.
    lensId: "ai",
    label: "Apply AI where evidence allows",
    primaryDomainKeys: ["technology", "data"],
    nearestRealLens: "data_ai_readiness",
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
