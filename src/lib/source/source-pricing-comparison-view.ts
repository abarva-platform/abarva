// Source pricing comparison view model.
// Deterministic — no model calls, no network calls.

import {
  buildPricingNormalizationModel,
  PricingNormalizationModelResult,
} from './pricing-normalization-model';
import type { VendorPricingRow, VendorPricingComparisonProps } from '../../components/source/VendorPricingComparison';

export interface SourcePricingComparisonContext {
  eventId: string;
  eventName: string;
  vendors: Array<{
    vendorId: string;
    vendorName: string;
    totalQuotedCost: number;
    currency: string;
  }>;
}

export interface SourcePricingComparisonViewModel {
  normalizationResult: PricingNormalizationModelResult;
  comparisonProps: VendorPricingComparisonProps;
  completenessPercent: number;
  missingPricingSections: string[];
  caveat: string;
}

export function buildPricingComparisonViewModel(
  ctx: SourcePricingComparisonContext,
): SourcePricingComparisonViewModel {
  const result = buildPricingNormalizationModel({
    eventId: ctx.eventId,
    eventName: ctx.eventName,
    vendors: ctx.vendors,
  });

  const lowestCost = result.vendorSnapshots.reduce(
    (min, s) => (s.totalNormalizedCost < min ? s.totalNormalizedCost : min),
    Infinity,
  );
  const lowestVendorId = result.vendorSnapshots.find(
    (s) => s.totalNormalizedCost === lowestCost,
  )?.vendorId ?? null;

  const vendorRows: VendorPricingRow[] = result.vendorSnapshots.map((snap) => {
    const delta = snap.totalNormalizedCost - lowestCost;
    const deltaPct = lowestCost > 0 ? Math.round((delta / lowestCost) * 1000) / 10 : 0;
    const rank = deltaPct === 0 ? 'lowest' : deltaPct > 10 ? 'highest' : 'mid';
    return {
      vendorId: snap.vendorId,
      vendorName: snap.vendorName,
      totalNormalizedCost: snap.totalNormalizedCost,
      currency: snap.currency,
      towerCosts: Object.fromEntries(
        snap.towerBreakdown.map((t) => [t.tower, t.totalCost]),
      ) as VendorPricingRow['towerCosts'],
      rank,
      deltaFromLowest: Math.round(delta * 100) / 100,
      deltaFromLowestPct: deltaPct,
      normalizationConfidence: snap.normalizationConfidence,
    };
  });

  const completenessPercent = ctx.vendors.length === 0 ? 0 :
    Math.round(
      (result.vendorSnapshots.reduce((sum, s) => sum + s.comparableLineCount, 0) /
        Math.max(result.lines.length, 1)) * 100,
    );

  const missingPricingSections: string[] = [];
  if (completenessPercent < 100) missingPricingSections.push('Some pricing lines need clarification');
  if (ctx.vendors.length < 2) missingPricingSections.push('At least 2 vendors required for comparison');

  return {
    normalizationResult: result,
    comparisonProps: {
      eventId: ctx.eventId,
      eventName: ctx.eventName,
      towers: result.comparisonMatrix.towers,
      vendors: vendorRows,
      lowestCostVendorId: lowestVendorId,
      generatedAt: '2026-04-26',
    },
    completenessPercent,
    missingPricingSections,
    caveat:
      'Pricing comparison is based on deterministic seeded data. No live FX rates, no live market benchmarks, no fake pricing claims.',
  };
}
