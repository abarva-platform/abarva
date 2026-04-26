// Source commercial risk view model.
// Deterministic — no model calls, no network calls.

import {
  detectCommercialRisks,
  CommercialRiskDetectionResult,
  CommercialRiskException,
  CommercialRiskSeverity,
} from './commercial-risk-detection';

export interface SourceCommercialRiskContext {
  eventId: string;
  eventName: string;
  vendorIds: string[];
  hasIncompleteEvidence: boolean;
  hasPricingAnomalies: boolean;
  hasScopeAmbiguity: boolean;
  hasGovernanceGap: boolean;
}

export interface SourceCommercialRiskViewModel {
  detectionResult: CommercialRiskDetectionResult;
  topExceptions: CommercialRiskException[];
  severityLabel: string;
  missingInputs: string[];
  caveat: string;
}

const SEVERITY_LABEL: Record<CommercialRiskSeverity, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

export function buildCommercialRiskViewModel(
  ctx: SourceCommercialRiskContext,
): SourceCommercialRiskViewModel {
  const result = detectCommercialRisks({
    eventId: ctx.eventId,
    eventName: ctx.eventName,
    vendorIds: ctx.vendorIds,
    hasIncompleteEvidence: ctx.hasIncompleteEvidence,
    hasPricingAnomalies: ctx.hasPricingAnomalies,
    hasScopeAmbiguity: ctx.hasScopeAmbiguity,
    hasGovernanceGap: ctx.hasGovernanceGap,
  });

  const missingInputs: string[] = [];
  if (ctx.vendorIds.length === 0) missingInputs.push('No vendors configured');

  return {
    detectionResult: result,
    topExceptions: result.exceptions.slice(0, 5),
    severityLabel: SEVERITY_LABEL[result.overallRiskLevel],
    missingInputs,
    caveat:
      'Risk assessment is deterministic and for internal review only. Not legal advice. Based on seeded detection patterns.',
  };
}
