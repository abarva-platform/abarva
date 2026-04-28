// Source Commercial Readiness view-model builder.
// Derives a 6-check readiness checklist from available pricing, risk, and BAFO data.
// Deterministic — no model calls, no network calls.

export type ReadinessCheckStatus = 'complete' | 'partial' | 'missing';

export type ReadinessCheckCategory =
  | 'pricing'
  | 'risk'
  | 'negotiation'
  | 'evidence'
  | 'decision';

export interface SourceCommercialReadinessCheck {
  checkId: string;
  label: string;
  status: ReadinessCheckStatus;
  detail: string;
  category: ReadinessCheckCategory;
}

export type OverallReadinessStatus = 'ready' | 'partial' | 'not-ready';

export interface SourceCommercialReadinessViewModel {
  rfpId: string;
  checks: SourceCommercialReadinessCheck[];
  overallStatus: OverallReadinessStatus;
  readyCount: number;
  totalCount: number;
  readinessPercent: number;
  generatedAt: string;
  caveat: string;
}

export function buildCommercialReadinessViewModel(
  rfpId: string,
  vendorList: string[],
  pricingData?: unknown,
  riskData?: unknown,
  bafoData?: unknown,
): SourceCommercialReadinessViewModel {
  const hasVendors = vendorList.length > 0;
  const hasPricing = pricingData != null;
  const hasRisk = riskData != null;
  const hasBafo = bafoData != null;

  // Check 1: Pricing Normalized
  const pricingCheck: SourceCommercialReadinessCheck = {
    checkId: 'pricing-normalized',
    label: 'Pricing Normalized',
    status: hasPricing ? 'complete' : hasVendors ? 'partial' : 'missing',
    detail: hasPricing
      ? 'Vendor pricing has been normalized across towers for like-for-like comparison.'
      : hasVendors
      ? 'Vendors identified but pricing normalization model has not yet been applied.'
      : 'No vendors or pricing data available. Normalization cannot proceed.',
    category: 'pricing',
  };

  // Check 2: Commercial Risks Assessed
  const riskCheck: SourceCommercialReadinessCheck = {
    checkId: 'risks-assessed',
    label: 'Commercial Risks Assessed',
    status: hasRisk ? 'complete' : hasVendors ? 'partial' : 'missing',
    detail: hasRisk
      ? 'Commercial risk exceptions have been detected and categorised by severity.'
      : hasVendors
      ? 'Vendors present but commercial risk detection has not been run.'
      : 'No vendor data to assess commercial risk against.',
    category: 'risk',
  };

  // Check 3: BAFO Strategy Defined
  const bafoCheck: SourceCommercialReadinessCheck = {
    checkId: 'bafo-strategy',
    label: 'BAFO Strategy Defined',
    status: hasBafo ? 'complete' : hasPricing || hasRisk ? 'partial' : 'missing',
    detail: hasBafo
      ? 'BAFO negotiation summary with levers, scenarios, and asks is in place.'
      : hasPricing || hasRisk
      ? 'Pricing or risk data is available but BAFO strategy has not been built yet.'
      : 'Insufficient data to define a BAFO strategy. Pricing and risk assessment required first.',
    category: 'negotiation',
  };

  // Check 4: Vendor Comparison Complete
  const vendorCheck: SourceCommercialReadinessCheck = {
    checkId: 'vendor-comparison',
    label: 'Vendor Comparison Complete',
    status: hasPricing && hasVendors ? 'complete' : hasVendors ? 'partial' : 'missing',
    detail:
      hasPricing && hasVendors
        ? `Normalised comparison matrix built across ${vendorList.length} vendor(s).`
        : hasVendors
        ? `${vendorList.length} vendor(s) identified but pricing normalisation is pending.`
        : 'No vendors in scope. Vendor comparison cannot be completed.',
    category: 'pricing',
  };

  // Check 5: Evidence Basis Established
  const evidenceCheck: SourceCommercialReadinessCheck = {
    checkId: 'evidence-basis',
    label: 'Evidence Basis Established',
    status: hasRisk && hasPricing ? 'complete' : hasRisk || hasPricing ? 'partial' : 'missing',
    detail:
      hasRisk && hasPricing
        ? 'Risk exceptions and pricing data together provide a documented evidence basis for decisions.'
        : hasRisk || hasPricing
        ? 'Partial evidence basis exists. Both risk assessment and pricing data are needed for full coverage.'
        : 'No evidence basis established. Risk and pricing assessments are both missing.',
    category: 'evidence',
  };

  // Check 6: Executive Decision Ready
  const allCriticalComplete = hasPricing && hasRisk && hasBafo && hasVendors;
  const anyCriticalPresent = hasPricing || hasRisk || hasBafo || hasVendors;
  const executiveCheck: SourceCommercialReadinessCheck = {
    checkId: 'executive-ready',
    label: 'Executive Decision Ready',
    status: allCriticalComplete ? 'complete' : anyCriticalPresent ? 'partial' : 'missing',
    detail: allCriticalComplete
      ? 'All commercial intelligence dimensions are populated. Sourcing event is ready for executive review.'
      : anyCriticalPresent
      ? 'Some commercial dimensions are incomplete. Executive decision package requires pricing, risk, BAFO, and vendor comparison.'
      : 'No commercial data available. Executive decision readiness cannot be assessed.',
    category: 'decision',
  };

  const checks: SourceCommercialReadinessCheck[] = [
    pricingCheck,
    riskCheck,
    bafoCheck,
    vendorCheck,
    evidenceCheck,
    executiveCheck,
  ];

  const readyCount = checks.filter((c) => c.status === 'complete').length;
  const missingCount = checks.filter((c) => c.status === 'missing').length;
  const totalCount = checks.length;

  const overallStatus: OverallReadinessStatus =
    readyCount === totalCount
      ? 'ready'
      : missingCount >= 3
      ? 'not-ready'
      : 'partial';

  const readinessPercent = Math.round((readyCount / totalCount) * 100);

  return {
    rfpId,
    checks,
    overallStatus,
    readyCount,
    totalCount,
    readinessPercent,
    generatedAt: '2026-04-26',
    caveat:
      'Readiness assessment based on available data as of the event date. Independent legal and commercial review recommended before award decision.',
  };
}
