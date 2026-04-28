'use client';

import React from 'react';
import { VendorPricingComparison } from './VendorPricingComparison';
import type { SourcePricingComparisonViewModel } from '../../lib/source/source-pricing-comparison-view';

const BG = '#FAFAF9';
const DARK = '#0F0E0D';
const MUTED = '#706D66';
const BORDER = '#E8E6E3';
const ACCENT = '#1E3A5F';
const AMBER = '#B45309';

export interface SourcePricingComparisonPanelProps {
  viewModel: SourcePricingComparisonViewModel;
  className?: string;
}

export function SourcePricingComparisonPanel({
  viewModel,
  className = '',
}: SourcePricingComparisonPanelProps): React.ReactElement {
  const { comparisonProps, completenessPercent, missingPricingSections, caveat } = viewModel;

  return (
    <div
      data-testid={`pricing-comparison-panel-${comparisonProps.eventId}`}
      style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '20px 24px' }}
      className={className}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: ACCENT }}>
          Pricing Comparison
        </span>
        <span style={{ fontSize: 11, color: completenessPercent >= 100 ? MUTED : AMBER }}>
          {completenessPercent}% complete
        </span>
      </div>

      {/* Missing sections */}
      {missingPricingSections.length > 0 && (
        <div style={{ marginBottom: 12, padding: '8px 12px', background: '#FFFBEB', border: `1px solid #FDE68A`, borderRadius: 4 }}>
          {missingPricingSections.map((s) => (
            <p key={s} style={{ fontSize: 11, color: AMBER, margin: 0 }}>&#9888; {s}</p>
          ))}
        </div>
      )}

      {/* Comparison table */}
      <VendorPricingComparison {...comparisonProps} />

      {/* Caveat */}
      <p style={{ fontSize: 11, color: MUTED, marginTop: 12, lineHeight: 1.5 }}>{caveat}</p>
    </div>
  );
}

export default SourcePricingComparisonPanel;
