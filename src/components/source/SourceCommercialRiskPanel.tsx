'use client';

import React, { useState } from 'react';
import type { SourceCommercialRiskViewModel } from '@/lib/source/source-commercial-risk-view';
import type { CommercialRiskSeverity } from '@/lib/source/commercial-risk-detection';

const BG = '#FAFAF9';
const DARK = '#0F0E0D';
const TEXT = '#3D3B38';
const MUTED = '#706D66';
const BORDER = '#E8E6E3';
const ACCENT = '#1E3A5F';
const BG2 = '#F2F1F0';

const SEVERITY_CHIP: Record<CommercialRiskSeverity, { bg: string; color: string }> = {
  critical: { bg: '#FEE2E2', color: '#991B1B' },
  high: { bg: '#FFEDD5', color: '#9A3412' },
  medium: { bg: '#FEF9C3', color: '#854D0E' },
  low: { bg: '#DCFCE7', color: '#166534' },
};

export interface SourceCommercialRiskPanelProps {
  viewModel: SourceCommercialRiskViewModel;
  className?: string;
}

export function SourceCommercialRiskPanel({
  viewModel,
  className = '',
}: SourceCommercialRiskPanelProps): React.ReactElement {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { detectionResult, topExceptions, severityLabel, missingInputs, caveat } = viewModel;

  return (
    <div
      data-testid={`commercial-risk-panel-${detectionResult.eventId}`}
      style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '20px 24px' }}
      className={className}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: ACCENT }}>
          Commercial Risk
        </span>
        <span style={{
          fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4,
          ...(SEVERITY_CHIP[detectionResult.overallRiskLevel] ?? SEVERITY_CHIP.low),
        }}>
          {severityLabel}
        </span>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        {[
          { label: 'Total', value: detectionResult.totalCount },
          { label: 'Critical', value: detectionResult.criticalCount },
          { label: 'High', value: detectionResult.highCount },
        ].map(({ label, value }) => (
          <div key={label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: DARK }}>{value}</div>
            <div style={{ fontSize: 10, color: MUTED }}>{label}</div>
          </div>
        ))}
      </div>

      {missingInputs.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          {missingInputs.map((m) => (
            <p key={m} style={{ fontSize: 11, color: MUTED, margin: '0 0 2px' }}>⚠ {m}</p>
          ))}
        </div>
      )}

      {/* Exception list */}
      <div>
        {topExceptions.map((exc) => {
          const isExpanded = expandedId === exc.exceptionId;
          const chip = SEVERITY_CHIP[exc.severity] ?? SEVERITY_CHIP.low;
          return (
            <div key={exc.exceptionId} style={{ marginBottom: 8, border: `1px solid ${BG2}`, borderRadius: 6, overflow: 'hidden' }}>
              <button
                onClick={() => setExpandedId(isExpanded ? null : exc.exceptionId)}
                style={{
                  width: '100%', textAlign: 'left', background: BG2, border: 'none', cursor: 'pointer',
                  padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 600, color: DARK }}>{exc.title}</span>
                <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 3, ...chip }}>
                  {exc.severity}
                </span>
              </button>
              {isExpanded && (
                <div style={{ padding: '8px 12px', background: BG }}>
                  <p style={{ fontSize: 11, color: TEXT, margin: '0 0 6px' }}>{exc.description}</p>
                  <p style={{ fontSize: 11, color: ACCENT, margin: 0 }}>
                    <strong>Action:</strong> {exc.recommendedAction}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {topExceptions.length === 0 && (
        <p style={{ fontSize: 12, color: MUTED, textAlign: 'center', padding: '16px 0' }}>
          No risk exceptions detected.
        </p>
      )}

      <p style={{ fontSize: 11, color: MUTED, marginTop: 12, lineHeight: 1.5 }}>{caveat}</p>
    </div>
  );
}

export default SourceCommercialRiskPanel;
