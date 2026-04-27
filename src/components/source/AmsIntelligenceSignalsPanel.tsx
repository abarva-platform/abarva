// SRC35 — AMS Intelligence Signals Panel
// Renders PAT-AMS-001, PAT-AMS-002, and the AMS→CDP cross-reference signal.
// Design canon: #F8F7F4 bg, Georgia headers, DM Sans body, navy accent.
// No teal, no sparkles, no fabricated dollar amounts.

import React from 'react';
import type {
  AmsIntelligenceSignalBundle,
  AmsIntelligenceSignal,
  AmsSignalConfidence,
  AmsSignalCategory,
} from '@/lib/source/ams-intelligence-signals-view';

interface AmsIntelligenceSignalsPanelProps {
  bundle: AmsIntelligenceSignalBundle;
}

const CONFIDENCE_STYLE: Record<AmsSignalConfidence, { bg: string; text: string; border: string }> = {
  high:   { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
  medium: { bg: '#FFF7ED', text: '#C2410C', border: '#FED7AA' },
  low:    { bg: '#F9FAFB', text: '#374151', border: '#E5E7EB' },
};

const CATEGORY_LABELS: Record<AmsSignalCategory, string> = {
  pricing_divergence:      'Pricing Divergence',
  scope_creep_risk:        'Scope Creep Risk',
  cross_program_correlation: 'Cross-Programme Correlation',
};

function SignalCard({ signal }: { signal: AmsIntelligenceSignal }) {
  const confidenceStyle = CONFIDENCE_STYLE[signal.confidence];

  return (
    <div
      data-pattern-id={signal.patternId}
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #E8E6E1',
        borderLeft: signal.category === 'cross_program_correlation'
          ? '3px solid #7C3AED'
          : '3px solid #1B2B5C',
        borderRadius: '6px',
        padding: '16px',
        display: 'grid',
        gap: '10px',
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', flexWrap: 'wrap' }}>
        <div>
          <div style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '10px',
            fontWeight: 700,
            color: '#525866',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '4px',
          }}>
            {signal.patternId} · {CATEGORY_LABELS[signal.category]}
          </div>
          <div style={{
            fontFamily: 'Georgia, serif',
            fontWeight: 400,
            fontSize: '14px',
            color: '#0A0C12',
            lineHeight: 1.4,
          }}>
            {signal.title}
          </div>
        </div>
        <div style={{
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '11px',
          fontWeight: 600,
          color: confidenceStyle.text,
          backgroundColor: confidenceStyle.bg,
          border: `1px solid ${confidenceStyle.border}`,
          borderRadius: '4px',
          padding: '2px 8px',
          whiteSpace: 'nowrap',
        }}>
          {signal.confidence.charAt(0).toUpperCase() + signal.confidence.slice(1)} confidence
        </div>
      </div>

      {/* Summary */}
      <div style={{
        fontFamily: 'DM Sans, sans-serif',
        fontSize: '13px',
        color: '#0A0C12',
        lineHeight: 1.6,
      }}>
        {signal.summary}
      </div>

      {/* CDP correlation (if present) */}
      {signal.cdpCorrelation && (
        <div style={{
          backgroundColor: '#EFF6FF',
          border: '1px solid #BFDBFE',
          borderRadius: '4px',
          padding: '8px 12px',
          display: 'grid',
          gap: '4px',
        }}>
          <div style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '10px',
            fontWeight: 700,
            color: '#1D4ED8',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}>
            CDP Programme Impact
          </div>
          <div style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '12px',
            color: '#1E40AF',
            lineHeight: 1.5,
          }}>
            {signal.cdpCorrelation}
          </div>
        </div>
      )}

      {/* Evidence and citation */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '8px',
        borderTop: '1px solid #E8E6E1',
        paddingTop: '8px',
      }}>
        <div style={{
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '11px',
          color: '#525866',
        }}>
          {signal.evidenceDocCount} evidence document{signal.evidenceDocCount !== 1 ? 's' : ''}
          {signal.affectedVendorIds.length > 0 && (
            <> · {signal.affectedVendorIds.length} vendor{signal.affectedVendorIds.length !== 1 ? 's' : ''} affected</>
          )}
        </div>
        <div style={{
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '10px',
          color: '#706D66',
          fontStyle: 'italic',
        }}>
          {signal.sourceCitation}
        </div>
      </div>
    </div>
  );
}

export function AmsIntelligenceSignalsPanel({ bundle }: AmsIntelligenceSignalsPanelProps) {
  return (
    <div
      data-component="AmsIntelligenceSignalsPanel"
      data-event-id={bundle.eventId}
      style={{ display: 'grid', gap: '16px' }}
    >
      {/* Header */}
      <div>
        <h3 style={{
          fontFamily: 'Georgia, serif',
          fontWeight: 400,
          fontSize: '15px',
          color: '#0A0C12',
          margin: '0 0 4px 0',
        }}>
          Intelligence Signals
        </h3>
        <p style={{
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '12px',
          color: '#525866',
          margin: 0,
          lineHeight: 1.5,
        }}>
          {bundle.crossProgramNote}
        </p>
      </div>

      {/* Signals */}
      <div style={{ display: 'grid', gap: '12px' }}>
        {bundle.signals.map((signal) => (
          <SignalCard key={signal.patternId} signal={signal} />
        ))}
      </div>

      {/* Caveat */}
      <div style={{
        fontFamily: 'DM Sans, sans-serif',
        fontSize: '11px',
        color: '#706D66',
        backgroundColor: '#FBF7F0',
        border: '1px solid #E5DCD2',
        borderRadius: '4px',
        padding: '8px 12px',
        lineHeight: 1.5,
      }}>
        {bundle.evidenceCaveat}
      </div>
    </div>
  );
}
