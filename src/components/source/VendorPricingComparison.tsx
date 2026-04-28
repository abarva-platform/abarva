'use client';

import React from 'react';

export type VendorPricingComparisonTower =
  | 'infrastructure'
  | 'application_management'
  | 'service_desk'
  | 'security'
  | 'governance'
  | 'transition'
  | 'transformation'
  | 'other';

export type VendorPricingRank = 'lowest' | 'mid' | 'highest';

export interface VendorPricingRow {
  vendorId: string;
  vendorName: string;
  totalNormalizedCost: number;
  currency: string;
  towerCosts: Partial<Record<VendorPricingComparisonTower, number>>;
  rank: VendorPricingRank;
  deltaFromLowest: number;     // absolute
  deltaFromLowestPct: number;  // percentage (0-100+)
  normalizationConfidence: 'high' | 'medium' | 'low';
}

export interface VendorPricingComparisonProps {
  eventId: string;
  eventName: string;
  towers: VendorPricingComparisonTower[];
  vendors: VendorPricingRow[];
  lowestCostVendorId: string | null;
  generatedAt: string;
  className?: string;
}

const RANK_STYLES: Record<VendorPricingRank, string> = {
  lowest: 'text-slate-900 font-semibold',
  mid: 'text-slate-800',
  highest: 'text-slate-800',
};

const RANK_LABELS: Record<VendorPricingRank, string> = {
  lowest: 'Lowest',
  mid: 'Middle',
  highest: 'Highest',
};

const TOWER_LABELS: Record<VendorPricingComparisonTower, string> = {
  infrastructure: 'Infra',
  application_management: 'App Mgmt',
  service_desk: 'Svc Desk',
  security: 'Security',
  governance: 'Gov',
  transition: 'Transition',
  transformation: 'Transform',
  other: 'Other',
};

function formatCurrency(amount: number, currency: string): string {
  if (amount === 0) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function VendorPricingComparison({
  eventId,
  eventName,
  towers,
  vendors,
  lowestCostVendorId,
  generatedAt,
  className = '',
}: VendorPricingComparisonProps): React.ReactElement {
  const lowestVendorName = lowestCostVendorId
    ? vendors.find((vendor) => vendor.vendorId === lowestCostVendorId)?.vendorName ?? lowestCostVendorId
    : null;

  return (
    <div
      data-testid={`vendor-pricing-comparison-${eventId}`}
      className={`bg-white border border-gray-200 rounded-lg p-5 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
            Vendor Pricing Comparison
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">{eventName}</p>
        </div>
        {lowestVendorName && (
          <span className="text-xs text-slate-700 font-medium">
            Baseline: {lowestVendorName}
          </span>
        )}
      </div>

      {vendors.length === 0 && (
        <p className="text-xs text-gray-400 text-center py-6">No vendor pricing data available.</p>
      )}

      {vendors.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 text-gray-500 font-medium">Vendor</th>
                <th className="text-right py-2 text-gray-500 font-medium">Total</th>
                <th className="text-right py-2 text-gray-500 font-medium">vs. Lowest</th>
                <th className="text-left py-2 text-gray-500 font-medium">Cost position</th>
                {towers.map((tower) => (
                  <th key={tower} className="text-right py-2 text-gray-500 font-medium">
                    {TOWER_LABELS[tower]}
                  </th>
                ))}
                <th className="text-center py-2 text-gray-500 font-medium">Confidence</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map((vendor) => (
                <tr key={vendor.vendorId} className="border-b border-gray-100 last:border-0">
                  <td className={`py-2 ${RANK_STYLES[vendor.rank]}`}>
                    {vendor.vendorName}
                    {vendor.vendorId === lowestCostVendorId && (
                      <span className="ml-2 inline-flex rounded-full border border-slate-300 bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-700">
                        Baseline
                      </span>
                    )}
                  </td>
                  <td className={`py-2 text-right ${RANK_STYLES[vendor.rank]}`}>
                    {formatCurrency(vendor.totalNormalizedCost, vendor.currency)}
                  </td>
                  <td className="py-2 text-right text-gray-600">
                    {vendor.deltaFromLowestPct === 0
                      ? '—'
                      : `+${vendor.deltaFromLowestPct.toFixed(1)}%`}
                  </td>
                  <td className="py-2 text-left">
                    <span className="inline-flex rounded-full border border-slate-300 bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-700">
                      {RANK_LABELS[vendor.rank]}
                    </span>
                  </td>
                  {towers.map((tower) => (
                    <td key={tower} className="py-2 text-right text-gray-700">
                      {vendor.towerCosts[tower] !== undefined
                        ? formatCurrency(vendor.towerCosts[tower]!, vendor.currency)
                        : '—'}
                    </td>
                  ))}
                  <td className="py-2 text-center">
                    <span className="inline-flex rounded-full border border-slate-300 bg-white px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-600">
                      {vendor.normalizationConfidence}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-3 text-xs text-gray-400">Generated {generatedAt} · Normalized seeded data</p>
    </div>
  );
}

export default VendorPricingComparison;
