'use client';

import React from 'react';

export type CommercialSummaryRiskLevel = 'critical' | 'high' | 'medium' | 'low' | 'not_assessed';
export type CommercialSummaryReadiness = 'ready' | 'partially_ready' | 'not_ready' | 'blocked';

export interface CommercialSummaryVendorRow {
  vendorId: string;
  vendorName: string;
  normalizedCost: number;
  currency: string;
  riskLevel: CommercialSummaryRiskLevel;
  exceptionCount: number;
  negotiationReadiness: CommercialSummaryReadiness;
}

export interface SourceCommercialSummaryPanelProps {
  eventId: string;
  eventName: string;
  stage: string;
  overallRiskLevel: CommercialSummaryRiskLevel;
  vendors: CommercialSummaryVendorRow[];
  totalExceptions: number;
  criticalExceptions: number;
  topOpportunity: string | null;
  generatedAt: string;
  className?: string;
}

const RISK_BADGE_STYLES: Record<CommercialSummaryRiskLevel, string> = {
  critical: 'bg-red-100 text-red-800 border border-red-200',
  high: 'bg-orange-100 text-orange-800 border border-orange-200',
  medium: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  low: 'bg-green-100 text-green-800 border border-green-200',
  not_assessed: 'bg-gray-100 text-gray-600 border border-gray-200',
};

const READINESS_LABEL: Record<CommercialSummaryReadiness, string> = {
  ready: 'Ready',
  partially_ready: 'Partial',
  not_ready: 'Not Ready',
  blocked: 'Blocked',
};

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function SourceCommercialSummaryPanel({
  eventId,
  eventName,
  stage,
  overallRiskLevel,
  vendors,
  totalExceptions,
  criticalExceptions,
  topOpportunity,
  generatedAt,
  className = '',
}: SourceCommercialSummaryPanelProps): React.ReactElement {
  return (
    <div
      data-testid={`commercial-summary-panel-${eventId}`}
      className={`bg-white border border-gray-200 rounded-lg p-5 ${className}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
            Commercial Summary
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">{eventName}</p>
        </div>
        <span
          data-testid="overall-risk-badge"
          className={`text-xs font-medium px-2 py-0.5 rounded ${RISK_BADGE_STYLES[overallRiskLevel]}`}
        >
          {overallRiskLevel === 'not_assessed' ? 'Not Assessed' : overallRiskLevel.charAt(0).toUpperCase() + overallRiskLevel.slice(1)} Risk
        </span>
      </div>

      {/* Stage + exceptions row */}
      <div className="flex gap-4 mb-4 text-xs text-gray-600">
        <span>Stage: <strong className="text-gray-900">{stage}</strong></span>
        <span>Exceptions: <strong className="text-gray-900">{totalExceptions}</strong></span>
        {criticalExceptions > 0 && (
          <span className="text-red-700 font-medium">{criticalExceptions} critical</span>
        )}
      </div>

      {/* Top opportunity */}
      {topOpportunity && (
        <div
          data-testid="top-opportunity"
          className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded text-xs text-blue-900"
        >
          <span className="font-semibold">Top Opportunity: </span>
          {topOpportunity}
        </div>
      )}

      {/* Vendor table */}
      {vendors.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-1.5 text-gray-500 font-medium">Vendor</th>
                <th className="text-right py-1.5 text-gray-500 font-medium">Normalized Cost</th>
                <th className="text-center py-1.5 text-gray-500 font-medium">Risk</th>
                <th className="text-center py-1.5 text-gray-500 font-medium">Exceptions</th>
                <th className="text-center py-1.5 text-gray-500 font-medium">BAFO Ready</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map((vendor) => (
                <tr key={vendor.vendorId} className="border-b border-gray-100 last:border-0">
                  <td className="py-1.5 text-gray-900 font-medium">{vendor.vendorName}</td>
                  <td className="py-1.5 text-right text-gray-700">
                    {formatCurrency(vendor.normalizedCost, vendor.currency)}
                  </td>
                  <td className="py-1.5 text-center">
                    <span className={`px-1.5 py-0.5 rounded text-xs ${RISK_BADGE_STYLES[vendor.riskLevel]}`}>
                      {vendor.riskLevel === 'not_assessed' ? 'N/A' : vendor.riskLevel}
                    </span>
                  </td>
                  <td className="py-1.5 text-center text-gray-700">{vendor.exceptionCount}</td>
                  <td className="py-1.5 text-center text-gray-600">
                    {READINESS_LABEL[vendor.negotiationReadiness]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {vendors.length === 0 && (
        <p className="text-xs text-gray-400 text-center py-4">No vendor data available.</p>
      )}

      {/* Footer */}
      <p className="mt-3 text-xs text-gray-400">
        Generated {generatedAt} · Seeded data
      </p>
    </div>
  );
}

export default SourceCommercialSummaryPanel;
