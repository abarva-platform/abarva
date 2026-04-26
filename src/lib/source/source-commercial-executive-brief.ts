/**
 * Source Commercial Executive Brief
 * Deterministic executive-facing commercial intelligence summary.
 * No model calls, no network calls, no async operations.
 */

export type CommercialPosture = 'strong' | 'developing' | 'at-risk' | 'incomplete';

export interface ExecutiveBriefRisk {
  riskId: string;
  label: string;
  severity: 'critical' | 'high' | 'medium';
  mitigation: string;
}

export interface ExecutiveBriefLever {
  leverId: string;
  label: string;
  opportunityDescription: string;
  estimatedImpact: string; // descriptive only: "High", "Medium", "Low"
}

export interface SourceCommercialExecutiveBriefViewModel {
  rfpId: string;
  executiveSummary: string;
  commercialPosture: CommercialPosture;
  postureRationale: string;
  topRisks: ExecutiveBriefRisk[]; // exactly 3
  topBafoLevers: ExecutiveBriefLever[]; // exactly 3
  vendorComparabilityState: string; // human-readable
  missingInputs: string[]; // list of what's missing
  recommendedNextAction: string;
  atlasCaveat: string; // "Deterministic, not live Atlas runtime"
  generatedAt: string;
}

const TOP_RISKS: ExecutiveBriefRisk[] = [
  {
    riskId: 'risk-exec-001',
    label: 'Pricing coverage incomplete',
    severity: 'high',
    mitigation: 'Request outstanding rate cards before BAFO',
  },
  {
    riskId: 'risk-exec-002',
    label: 'Commercial assumptions unaligned',
    severity: 'medium',
    mitigation: 'Normalise offshore and FTE assumptions before comparison',
  },
  {
    riskId: 'risk-exec-003',
    label: 'SLA rebate structures absent for selected vendors',
    severity: 'medium',
    mitigation: 'Require rebate framework submission as part of BAFO',
  },
];

const TOP_BAFO_LEVERS: ExecutiveBriefLever[] = [
  {
    leverId: 'lever-exec-001',
    label: 'Volume commitment discount',
    opportunityDescription:
      'Negotiate step-down pricing at 12 and 24-month volume thresholds',
    estimatedImpact: 'High',
  },
  {
    leverId: 'lever-exec-002',
    label: 'Offshore ratio optimisation',
    opportunityDescription:
      'Adjust blended rate through offshore ratio increase for steady-state work',
    estimatedImpact: 'Medium',
  },
  {
    leverId: 'lever-exec-003',
    label: 'SLA protection rebate',
    opportunityDescription:
      'Establish SLA rebate floor as commercial risk protection mechanism',
    estimatedImpact: 'Medium',
  },
];

function derivePosture(
  vendorList: string[],
  includePartialData: boolean,
): CommercialPosture {
  if (vendorList.length === 0) return 'incomplete';
  if (vendorList.length >= 3) return 'developing';
  if (vendorList.length >= 2 && includePartialData) return 'developing';
  return 'at-risk';
}

function deriveVendorComparabilityState(vendorList: string[]): string {
  if (vendorList.length === 0) return 'No vendor data available';
  if (vendorList.length === 1) return `1 vendor submission on file. Insufficient for comparison.`;
  if (vendorList.length === 2)
    return `2 vendor submissions on file. Partial comparison available.`;
  return `${vendorList.length} vendor submissions on file. Multi-vendor comparison in progress.`;
}

function deriveMissingInputs(vendorList: string[]): string[] {
  if (vendorList.length === 0) {
    return [
      'All vendor pricing data',
      'Rate card submissions',
      'Commercial assumptions framework',
    ];
  }
  if (vendorList.length < 4) {
    return [
      'Complete rate cards from all vendors',
      'Normalised offshore ratio assumptions',
    ];
  }
  return [];
}

function derivePostureRationale(
  posture: CommercialPosture,
  vendorList: string[],
): string {
  switch (posture) {
    case 'incomplete':
      return 'No vendor data has been submitted. Commercial assessment cannot proceed without rate card submissions.';
    case 'at-risk':
      return `Only ${vendorList.length} vendor submission${vendorList.length === 1 ? '' : 's'} received. Insufficient for a multi-vendor comparison. Rate card coverage is a prerequisite.`;
    case 'developing':
      return `${vendorList.length} vendor submissions received. Pricing normalisation is in progress. Key commercial gaps remain before a BAFO recommendation can be made.`;
    case 'strong':
      return 'Full vendor coverage achieved. Commercial assumptions are aligned. Executive decision review can proceed.';
  }
}

export function buildCommercialExecutiveBrief(
  rfpId: string,
  vendorList: string[],
  options?: { includePartialData?: boolean },
): SourceCommercialExecutiveBriefViewModel {
  const includePartialData = options?.includePartialData ?? false;
  const commercialPosture = derivePosture(vendorList, includePartialData);
  const postureRationale = derivePostureRationale(commercialPosture, vendorList);
  const vendorComparabilityState = deriveVendorComparabilityState(vendorList);
  const missingInputs = deriveMissingInputs(vendorList);

  return {
    rfpId,
    executiveSummary:
      'Commercial assessment is in progress. Pricing normalisation is partially complete. Key BAFO opportunities have been identified. Recommend completing rate card submissions before proceeding to executive decision.',
    commercialPosture,
    postureRationale,
    topRisks: TOP_RISKS,
    topBafoLevers: TOP_BAFO_LEVERS,
    vendorComparabilityState,
    missingInputs,
    recommendedNextAction:
      'Complete rate card submissions from all vendors and normalise commercial assumptions before scheduling executive decision review.',
    atlasCaveat:
      'This brief is generated from deterministic seed data. It does not reflect live Atlas runtime analysis. All values are representative and require validation against actual vendor submissions.',
    generatedAt: '2026-04-26',
  };
}
