// Pricing normalization model — richer line-item decomposition.
// Complements SourcePricingNormalization in pricing-normalization-types.ts.
// No model calls, no network calls.

export type PricingTower =
  | 'infrastructure'
  | 'application_management'
  | 'service_desk'
  | 'security'
  | 'governance'
  | 'transition'
  | 'transformation'
  | 'other';

export type PricingRole =
  | 'delivery_manager'
  | 'architect'
  | 'senior_engineer'
  | 'engineer'
  | 'analyst'
  | 'sme'
  | 'executive_sponsor'
  | 'other';

export type NormalizedLineStatus =
  | 'comparable'
  | 'needs_clarification'
  | 'excluded'
  | 'split_required';

export interface NormalizedPricingLine {
  lineId: string;
  vendorId: string;
  tower: PricingTower;
  role: PricingRole;
  description: string;
  unitPrice: number;
  currency: string;
  quantity: number;
  totalPrice: number;
  status: NormalizedLineStatus;
  notes: string[];
}

export interface PricingTowerSummary {
  tower: PricingTower;
  vendorId: string;
  totalCost: number;
  currency: string;
  lineCount: number;
  percentOfTotal: number;
}

export interface PricingVendorSnapshot {
  vendorId: string;
  vendorName: string;
  totalNormalizedCost: number;
  currency: string;
  towerBreakdown: PricingTowerSummary[];
  comparableLineCount: number;
  needsClarificationCount: number;
  excludedLineCount: number;
  normalizationConfidence: 'high' | 'medium' | 'low';
}

export interface PricingComparisonMatrix {
  towers: PricingTower[];
  vendorIds: string[];
  // tower -> vendorId -> cost
  matrix: Record<string, Record<string, number>>;
  lowestCostByTower: Record<string, string>; // tower -> vendorId
  highestCostByTower: Record<string, string>; // tower -> vendorId
}

export interface PricingNormalizationModelInput {
  eventId: string;
  eventName: string;
  vendors: Array<{
    vendorId: string;
    vendorName: string;
    totalQuotedCost: number;
    currency: string;
  }>;
}

export interface PricingNormalizationModelResult {
  eventId: string;
  eventName: string;
  generatedAt: string;
  lines: NormalizedPricingLine[];
  vendorSnapshots: PricingVendorSnapshot[];
  comparisonMatrix: PricingComparisonMatrix;
  modelVersion: '1.0';
}

export function buildPricingNormalizationModel(
  input: PricingNormalizationModelInput,
): PricingNormalizationModelResult {
  // Deterministic seeded builder — no model calls, no network calls
  const allTowers: PricingTower[] = [
    'infrastructure', 'application_management', 'service_desk',
    'security', 'governance', 'transition',
  ];

  const lines: NormalizedPricingLine[] = input.vendors.flatMap((vendor, vi) =>
    allTowers.map((tower, ti) => ({
      lineId: `line-${vendor.vendorId}-${tower}`,
      vendorId: vendor.vendorId,
      tower,
      role: 'engineer' as PricingRole,
      description: `${tower} services — seeded line`,
      unitPrice: Math.round((vendor.totalQuotedCost / allTowers.length) * 100) / 100,
      currency: vendor.currency,
      quantity: 1,
      totalPrice: Math.round((vendor.totalQuotedCost / allTowers.length) * 100) / 100,
      status: 'comparable' as NormalizedLineStatus,
      notes: [],
    }))
  );

  const vendorSnapshots: PricingVendorSnapshot[] = input.vendors.map((vendor) => {
    const vendorLines = lines.filter((l) => l.vendorId === vendor.vendorId);
    const towerBreakdown: PricingTowerSummary[] = allTowers.map((tower) => {
      const towerLines = vendorLines.filter((l) => l.tower === tower);
      const totalCost = towerLines.reduce((sum, l) => sum + l.totalPrice, 0);
      return {
        tower,
        vendorId: vendor.vendorId,
        totalCost: Math.round(totalCost * 100) / 100,
        currency: vendor.currency,
        lineCount: towerLines.length,
        percentOfTotal: vendor.totalQuotedCost > 0
          ? Math.round((totalCost / vendor.totalQuotedCost) * 100)
          : 0,
      };
    });
    return {
      vendorId: vendor.vendorId,
      vendorName: vendor.vendorName,
      totalNormalizedCost: vendor.totalQuotedCost,
      currency: vendor.currency,
      towerBreakdown,
      comparableLineCount: vendorLines.filter((l) => l.status === 'comparable').length,
      needsClarificationCount: vendorLines.filter((l) => l.status === 'needs_clarification').length,
      excludedLineCount: vendorLines.filter((l) => l.status === 'excluded').length,
      normalizationConfidence: 'medium' as const,
    };
  });

  const matrix: Record<string, Record<string, number>> = {};
  const lowestCostByTower: Record<string, string> = {};
  const highestCostByTower: Record<string, string> = {};

  for (const tower of allTowers) {
    matrix[tower] = {};
    for (const vendor of input.vendors) {
      const snap = vendorSnapshots.find((s) => s.vendorId === vendor.vendorId);
      const towerCost = snap?.towerBreakdown.find((t) => t.tower === tower)?.totalCost ?? 0;
      matrix[tower][vendor.vendorId] = towerCost;
    }
    const towerEntries = Object.entries(matrix[tower]);
    if (towerEntries.length > 0) {
      lowestCostByTower[tower] = towerEntries.reduce((a, b) => (a[1] < b[1] ? a : b))[0];
      highestCostByTower[tower] = towerEntries.reduce((a, b) => (a[1] > b[1] ? a : b))[0];
    }
  }

  return {
    eventId: input.eventId,
    eventName: input.eventName,
    generatedAt: '2026-04-26',
    lines,
    vendorSnapshots,
    comparisonMatrix: {
      towers: allTowers,
      vendorIds: input.vendors.map((v) => v.vendorId),
      matrix,
      lowestCostByTower,
      highestCostByTower,
    },
    modelVersion: '1.0',
  };
}
