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
  lowest: 'text-green-700 font-semibold',
  mid: 'text-gray-700',
  highest: 'text-red-700',
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
        {lowestCostVendorId && (
          <span className="text-xs text-green-700 font-medium">
            Lowest: {vendors.find((v) => v.vendorId === lowestCostVendorId)?.vendorName ?? lowestCostVendorId}
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
                      <span className="ml-1 text-green-600">★</span>
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
                  {towers.map((tower) => (
                    <td key={tower} className="py-2 text-right text-gray-700">
                      {vendor.towerCosts[tower] !== undefined
                        ? formatCurrency(vendor.towerCosts[tower]!, vendor.currency)
                        : '—'}
                    </td>
                  ))}
                  <td className="py-2 text-center text-gray-500">{vendor.normalizationConfidence}</td>
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
