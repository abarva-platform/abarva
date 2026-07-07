import type { TowerAdoptionRealizationView } from "@/lib/tower/outcome-ledger/adoption-realization-view";

export type AtlasSignalType =
  | "value"
  | "risk"
  | "adoption"
  | "cost"
  | "productivity"
  | "readiness";

/**
 * Slice 3.4 — adoption & value-realization instrumentation, projected
 * onto the executive brief. Optional: the brief still renders without
 * it (the hardcoded deterministic-seed brief predates the outcome
 * ledger). When present, it carries the ledger-sourced answer to "is
 * this program actually earning?".
 */
export interface AtlasBriefValueRealization {
  /** "is this earning?" line composed from the outcome ledger. */
  readonly earningSummary: string;
  /** Realized verified-and-evidenced value as 0..1, or null. */
  readonly realizationRatio: number | null;
  /** Realization severity band — `on_track` … `critical`. */
  readonly realizationSeverity: TowerAdoptionRealizationView["valueRealization"]["severity"];
  /** Adoption posture; `unknown` until adoption telemetry is bound. */
  readonly adoptionState: TowerAdoptionRealizationView["adoption"]["state"];
  /** Adoption headline — surfaces the instrumentation gap honestly. */
  readonly adoptionHeadline: string;
  /** True when adoption telemetry is not yet wired. */
  readonly adoptionInstrumentationGap: boolean;
}

export interface AtlasSignalItem {
  signalType: AtlasSignalType;
  label: string;
  summary: string;
  evidenceBasis: string | null;
  businessImpact: string;
  deterministicSeed: true;
}

export interface AtlasAccountabilityDisclosure {
  decisionSupportLabel: "AI-assisted decision support";
  generatedBy: "Atlas";
  humanDecisionBoundary: string;
  citationSummary: string;
  citations: string[];
  assumptionDisclosure: string;
  limitationDisclosure: string;
  deterministicSeed: true;
}

export interface AtlasExecutiveBriefView {
  tenantSlug: string;
  tenantName: string;
  briefTitle: string;
  briefSummary: string;
  topValueSignal: AtlasSignalItem;
  topRiskSignal: AtlasSignalItem;
  adoptionSignal: AtlasSignalItem;
  portfolioReadiness: {
    label: string;
    readinessScore: string; // "partial" | "ready" | "not_ready" — never a fake %, use label
    readinessNote: string;
    deterministicSeed: true;
  };
  missingData: string[];
  recommendedExecutiveAction: string;
  commercialSignalNote: string | null;
  accountabilityDisclosure: AtlasAccountabilityDisclosure;
  /**
   * Slice 3.4 — adoption & value-realization instrumentation sourced
   * from the outcome ledger. `null` when no ledger view was supplied,
   * so the brief degrades to its deterministic-seed form.
   */
  valueRealization: AtlasBriefValueRealization | null;
  deterministicSeedCaveat: string;
  deterministicSeed: true;
}

/** Project a Slice 3.4 adoption-realization view onto the brief field. */
export function toAtlasBriefValueRealization(
  view: TowerAdoptionRealizationView,
): AtlasBriefValueRealization {
  return {
    earningSummary: view.earningSummary,
    realizationRatio: view.valueRealization.realizationRatio,
    realizationSeverity: view.valueRealization.severity,
    adoptionState: view.adoption.state,
    adoptionHeadline: view.adoption.headline,
    adoptionInstrumentationGap: view.adoption.instrumentationGap,
  };
}

function buildAccountabilityDisclosure(params: {
  citations: ReadonlyArray<string>;
  missingData: ReadonlyArray<string>;
  hasCommercialSignal: boolean;
}): AtlasAccountabilityDisclosure {
  const citations = params.citations.filter(
    (citation) => citation.trim().length > 0,
  );
  const citationSummary =
    citations.length === 0
      ? "No citation-backed signal basis is available for this tenant."
      : `${citations.length} deterministic signal basis${citations.length === 1 ? "" : "es"} cited.`;
  const assumptionDisclosure =
    params.missingData.length === 0
      ? "Assumes the seeded Tower substrate is complete for this brief."
      : `Assumes the brief remains incomplete until ${params.missingData.join("; ")} are supplied.`;

  return {
    decisionSupportLabel: "AI-assisted decision support",
    generatedBy: "Atlas",
    humanDecisionBoundary:
      "Atlas does not approve, reject, fund, or sequence programs. A human executive must review the cited basis before acting.",
    citationSummary,
    citations,
    assumptionDisclosure,
    limitationDisclosure: params.hasCommercialSignal
      ? "Commercial context is a Tower signal, not a procurement decision or binding financial forecast."
      : "No commercial signal is available; the brief should not be used as a vendor or funding recommendation.",
    deterministicSeed: true,
  };
}

/**
 * Build the Atlas executive brief view.
 *
 * @param tenantSlug canonical tenant slug.
 * @param adoptionRealization optional Slice 3.4 adoption + value-
 *   realization view; when supplied, the brief gains the ledger-sourced
 *   "is this earning?" instrumentation.
 */
export function buildAtlasExecutiveBriefView(
  tenantSlug: string,
  adoptionRealization?: TowerAdoptionRealizationView,
): AtlasExecutiveBriefView {
  const isRich = tenantSlug === "apex-retail";
  const missingData = isRich
    ? [
        "Confirmed value measurement framework",
        "Execution Roadmap gate evidence package",
        "Adoption readiness plan for P3→P4",
      ]
    : ["All programme data", "All commercial data", "All intelligence data"];
  const topValueEvidence = isRich
    ? "Programme APX-CDP-2026 seed (Wave 18). Value ledger: projected only, not realized."
    : null;
  const topRiskEvidence = isRich
    ? "AMS commercial scenario seed (Wave 19). Vendor completeness: Northstar complete, BluePeak partial, Horizon partial, Meridian Systems complete."
    : null;
  const adoptionEvidence = isRich
    ? "Design gate approval evidence (Apr 27). Architecture sprint seed."
    : null;
  const commercialSignalNote = isRich
    ? "AMS vendor consolidation (apex-retail-ams-outsourcing-2026) is the active commercial event linked to this programme. BAFO outcome is the critical commercial path item."
    : null;

  return {
    tenantSlug,
    tenantName: tenantSlug === "apex-retail" ? "Apex Retail" : tenantSlug,
    briefTitle: isRich
      ? "Apex Retail · AI Programme Value and Risk Summary"
      : "Executive Brief — Insufficient Data",
    briefSummary: isRich
      ? "CDP Activation programme cleared the Design gate on Apr 27 and is now in P3 Design. Architecture sprint is active — Vendor C confirmed as managed CDP layer. AMS vendor consolidation delivered the critical commercial decision."
      : "Atlas cannot generate a meaningful executive brief. No rich programme or commercial data is seeded for this tenant.",
    topValueSignal: {
      signalType: "value",
      label: isRich
        ? "CDP Activation — projected value at stake"
        : "No value signal available",
      summary: isRich
        ? "Programme value hypothesis under development. Approved value baseline not yet confirmed. AMS commercial outcome will inform delivery cost structure."
        : "Value signal not available for this tenant.",
      evidenceBasis: topValueEvidence,
      businessImpact: isRich
        ? "Value realization deferred until Design gate approved and value baseline confirmed."
        : "Not applicable.",
      deterministicSeed: true,
    },
    topRiskSignal: {
      signalType: "risk",
      label: isRich
        ? "AMS BAFO readiness — 2 vendors incomplete"
        : "No risk signal available",
      summary: isRich
        ? "BluePeak Digital Operations and Horizon Application Services have not submitted complete pricing responses. BAFO readiness is at risk. This may delay programme delivery planning."
        : "Risk signal not available for this tenant.",
      evidenceBasis: topRiskEvidence,
      businessImpact: isRich
        ? "Delivery cost structure and commercial commitments cannot be finalised without BAFO completion."
        : "Not applicable.",
      deterministicSeed: true,
    },
    adoptionSignal: {
      signalType: "adoption",
      label: isRich
        ? "Platform readiness — pre-activation stage"
        : "No adoption signal available",
      summary: isRich
        ? "CDP program cleared Design gate (Apr 27). Architecture sprint active — Vendor C confirmed as managed CDP layer. Adoption readiness planning should begin during P3 Design."
        : "Adoption signal not available for this tenant.",
      evidenceBasis: adoptionEvidence,
      businessImpact: isRich
        ? "Activation timeline depends on Execution Roadmap gate approval and adoption readiness plan completion during P3."
        : "Not applicable.",
      deterministicSeed: true,
    },
    portfolioReadiness: {
      label: isRich ? "CDP Activation — Design stage" : "No programme data",
      readinessScore: isRich ? "partial" : "not_ready",
      readinessNote: isRich
        ? "One active programme in P3 Design. Design gate cleared Apr 27. 6 programmes in portfolio, 5 active."
        : "No programme data seeded for this tenant.",
      deterministicSeed: true,
    },
    missingData,
    recommendedExecutiveAction: isRich
      ? "Review architecture blueprint and confirm value measurement framework for Execution Roadmap gate. Initiate adoption readiness plan during P3 Design sprint — do not defer to P4."
      : "Pilot Apex Retail for full Atlas executive experience.",
    commercialSignalNote,
    accountabilityDisclosure: buildAccountabilityDisclosure({
      citations: [
        topValueEvidence,
        topRiskEvidence,
        adoptionEvidence,
        commercialSignalNote,
      ].filter((citation): citation is string => Boolean(citation)),
      missingData,
      hasCommercialSignal: Boolean(commercialSignalNote),
    }),
    valueRealization: adoptionRealization
      ? toAtlasBriefValueRealization(adoptionRealization)
      : null,
    deterministicSeedCaveat:
      "All signals are deterministic seed data. No live AI programme monitoring. No live financial data. All values are illustrative.",
    deterministicSeed: true,
  };
}
