export type AtlasSignalType = 'value' | 'risk' | 'adoption' | 'cost' | 'productivity' | 'readiness';

export interface AtlasSignalItem {
  signalType: AtlasSignalType;
  label: string;
  summary: string;
  evidenceBasis: string | null;
  businessImpact: string;
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
    readinessScore: string;   // "partial" | "ready" | "not_ready" — never a fake %, use label
    readinessNote: string;
    deterministicSeed: true;
  };
  missingData: string[];
  recommendedExecutiveAction: string;
  commercialSignalNote: string | null;
  deterministicSeedCaveat: string;
  deterministicSeed: true;
}

export function buildAtlasExecutiveBriefView(tenantSlug: string): AtlasExecutiveBriefView {
  const isRich = tenantSlug === 'apex-retail';
  return {
    tenantSlug,
    tenantName: tenantSlug === 'apex-retail' ? 'Apex Retail' : tenantSlug,
    briefTitle: isRich
      ? 'Apex Retail · AI Programme Value and Risk Summary'
      : 'Executive Brief — Insufficient Data',
    briefSummary: isRich
      ? 'CDP Activation programme cleared the Design gate on Apr 27 and is now in P3 Design. Architecture sprint is active — Vendor C confirmed as managed CDP layer. AMS vendor consolidation delivered the critical commercial decision.'
      : 'Atlas cannot generate a meaningful executive brief. No rich programme or commercial data is seeded for this tenant.',
    topValueSignal: {
      signalType: 'value',
      label: isRich ? 'CDP Activation — projected value at stake' : 'No value signal available',
      summary: isRich
        ? 'Programme value hypothesis under development. Approved value baseline not yet confirmed. AMS commercial outcome will inform delivery cost structure.'
        : 'Value signal not available for this tenant.',
      evidenceBasis: isRich ? 'Programme APX-CDP-2026 seed (Wave 18). Value ledger: projected only, not realized.' : null,
      businessImpact: isRich
        ? 'Value realization deferred until Design gate approved and value baseline confirmed.'
        : 'Not applicable.',
      deterministicSeed: true,
    },
    topRiskSignal: {
      signalType: 'risk',
      label: isRich ? 'AMS BAFO readiness — 2 vendors incomplete' : 'No risk signal available',
      summary: isRich
        ? 'BluePeak Digital Operations and Horizon Application Services have not submitted complete pricing responses. BAFO readiness is at risk. This may delay programme delivery planning.'
        : 'Risk signal not available for this tenant.',
      evidenceBasis: isRich ? 'AMS commercial scenario seed (Wave 19). Vendor completeness: Northstar complete, BluePeak partial, Horizon partial, Meridian Systems complete.' : null,
      businessImpact: isRich
        ? 'Delivery cost structure and commercial commitments cannot be finalised without BAFO completion.'
        : 'Not applicable.',
      deterministicSeed: true,
    },
    adoptionSignal: {
      signalType: 'adoption',
      label: isRich ? 'Platform readiness — pre-activation stage' : 'No adoption signal available',
      summary: isRich
        ? 'CDP program cleared Design gate (Apr 27). Architecture sprint active — Vendor C confirmed as managed CDP layer. Adoption readiness planning should begin during P3 Design.'
        : 'Adoption signal not available for this tenant.',
      evidenceBasis: isRich ? 'Design gate approval evidence (Apr 27). Architecture sprint seed.' : null,
      businessImpact: isRich
        ? 'Activation timeline depends on Execution Roadmap gate approval and adoption readiness plan completion during P3.'
        : 'Not applicable.',
      deterministicSeed: true,
    },
    portfolioReadiness: {
      label: isRich ? 'CDP Activation — Design stage' : 'No programme data',
      readinessScore: isRich ? 'partial' : 'not_ready',
      readinessNote: isRich
        ? 'One active programme in P3 Design. Design gate cleared Apr 27. 6 programmes in portfolio, 5 active.'
        : 'No programme data seeded for this tenant.',
      deterministicSeed: true,
    },
    missingData: isRich
      ? ['Confirmed value measurement framework', 'Execution Roadmap gate evidence package', 'Adoption readiness plan for P3→P4']
      : ['All programme data', 'All commercial data', 'All intelligence data'],
    recommendedExecutiveAction: isRich
      ? 'Review architecture blueprint and confirm value measurement framework for Execution Roadmap gate. Initiate adoption readiness plan during P3 Design sprint — do not defer to P4.'
      : 'Pilot Apex Retail for full Atlas executive experience.',
    commercialSignalNote: isRich
      ? 'AMS vendor consolidation (apex-retail-ams-outsourcing-2026) is the active commercial event linked to this programme. BAFO outcome is the critical commercial path item.'
      : null,
    deterministicSeedCaveat: 'All signals are deterministic seed data. No live AI programme monitoring. No live financial data. All values are illustrative.',
    deterministicSeed: true,
  };
}
