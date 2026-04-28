// Source commercial summary view model.
// Deterministic seed — no model calls, no network calls.

import type { SourceCommercialSummaryPanelProps } from '../../components/source/SourceCommercialSummaryPanel';

export interface SourceCommercialSummaryContext {
  eventId: string;
  eventName: string;
  stage: string;
  vendorCount: number;
}

export function buildCommercialSummaryProps(
  ctx: SourceCommercialSummaryContext,
): SourceCommercialSummaryPanelProps {
  return {
    eventId: ctx.eventId,
    eventName: ctx.eventName,
    stage: ctx.stage,
    overallRiskLevel: 'medium',
    vendors: Array.from({ length: ctx.vendorCount }, (_, i) => ({
      vendorId: `vendor-${String.fromCharCode(97 + i)}`,
      vendorName: `Vendor ${String.fromCharCode(65 + i)}`,
      normalizedCost: 900_000 + i * 100_000,
      currency: 'USD',
      riskLevel: i === 0 ? 'low' : 'high',
      exceptionCount: i === 0 ? 0 : 2,
      negotiationReadiness: i === 0 ? 'ready' : 'partially_ready',
    })),
    totalExceptions: ctx.vendorCount > 1 ? 2 : 0,
    criticalExceptions: 0,
    topOpportunity: ctx.vendorCount > 0
      ? 'Pricing benchmark delta of 5–8% vs. market median identified.'
      : null,
    generatedAt: '2026-04-26',
  };
}
