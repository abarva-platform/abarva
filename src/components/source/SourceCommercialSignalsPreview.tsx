'use client';

import React from 'react';
import {
  buildCommercialSignalsPreviewViewModel,
  SourceSignalPreviewItem,
  SourcePatternPreviewItem,
} from '../../lib/source/source-commercial-signals-preview';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface SourceCommercialSignalsPreviewProps {
  rfpId: string;
  vendorList: string[];
  eventId: string;
}

// ---------------------------------------------------------------------------
// Design tokens (AbarVa canon)
// ---------------------------------------------------------------------------

const COLORS = {
  bg: '#FAFAF9',
  border: '#E8E6E3',
  nearBlack: '#0F0E0D',
  body: '#3D3B38',
  muted: '#706D66',
  accent: '#1E3A5F',
  criticalBg: '#FEE2E2',
  criticalText: '#991B1B',
  warningBg: '#FEF9C3',
  warningText: '#92400E',
  infoBg: '#DBEAFE',
  infoText: '#1E40AF',
} as const;

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SeverityChip({ severity }: { severity: SourceSignalPreviewItem['severity'] }) {
  const label =
    severity === 'critical' ? 'Critical' : severity === 'warning' ? 'Warning' : 'Info';
  const bg =
    severity === 'critical'
      ? COLORS.criticalBg
      : severity === 'warning'
      ? COLORS.warningBg
      : COLORS.infoBg;
  const color =
    severity === 'critical'
      ? COLORS.criticalText
      : severity === 'warning'
      ? COLORS.warningText
      : COLORS.infoText;

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: '9999px',
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.02em',
        backgroundColor: bg,
        color,
        flexShrink: 0,
      }}
    >
      {label}
    </span>
  );
}

function ConfidenceBar({ confidence }: { confidence: number }) {
  const pct = Math.round(Math.max(0, Math.min(1, confidence)) * 100);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div
        style={{
          flex: 1,
          height: '4px',
          backgroundColor: COLORS.border,
          borderRadius: '2px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            backgroundColor: COLORS.accent,
            borderRadius: '2px',
            transition: 'width 0.3s ease',
          }}
        />
      </div>
      <span
        style={{
          fontSize: '11px',
          color: COLORS.muted,
          flexShrink: 0,
          minWidth: '32px',
          textAlign: 'right',
        }}
      >
        {pct}%
      </span>
    </div>
  );
}

function SignalCard({ signal }: { signal: SourceSignalPreviewItem }) {
  return (
    <div
      style={{
        padding: '12px',
        border: `1px solid ${COLORS.border}`,
        borderRadius: '6px',
        backgroundColor: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
        <SeverityChip severity={signal.severity} />
        <span
          style={{
            fontSize: '13px',
            fontWeight: 600,
            color: COLORS.nearBlack,
            lineHeight: '1.3',
          }}
        >
          {signal.label}
        </span>
      </div>
      <p
        style={{
          margin: 0,
          fontSize: '12px',
          color: COLORS.body,
          lineHeight: '1.5',
        }}
      >
        {signal.shortSummary}
      </p>
    </div>
  );
}

function PatternCard({ pattern }: { pattern: SourcePatternPreviewItem }) {
  return (
    <div
      style={{
        padding: '12px',
        border: `1px solid ${COLORS.border}`,
        borderRadius: '6px',
        backgroundColor: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <span
          style={{
            fontSize: '13px',
            fontWeight: 600,
            color: COLORS.nearBlack,
            lineHeight: '1.3',
          }}
        >
          {pattern.label}
        </span>
        <span
          style={{
            fontSize: '11px',
            color: COLORS.muted,
            flexShrink: 0,
            textTransform: 'capitalize',
          }}
        >
          {pattern.category.replace(/_/g, ' ')}
        </span>
      </div>
      <ConfidenceBar confidence={pattern.confidence} />
      <p
        style={{
          margin: 0,
          fontSize: '12px',
          color: COLORS.body,
          lineHeight: '1.5',
        }}
      >
        {pattern.shortSummary}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function SourceCommercialSignalsPreview({
  rfpId,
  vendorList,
  eventId,
}: SourceCommercialSignalsPreviewProps) {
  const vm = buildCommercialSignalsPreviewViewModel(rfpId, vendorList, eventId);

  return (
    <div
      style={{
        backgroundColor: COLORS.bg,
        border: `1px solid ${COLORS.border}`,
        borderRadius: '8px',
        padding: '20px',
        fontFamily: 'DM Sans, system-ui, sans-serif',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: '16px',
            fontWeight: 600,
            color: COLORS.nearBlack,
            letterSpacing: '-0.01em',
          }}
        >
          Signals &amp; Patterns
        </h2>
        {vm.criticalSignalCount > 0 && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '20px',
              height: '20px',
              padding: '0 6px',
              borderRadius: '9999px',
              fontSize: '11px',
              fontWeight: 700,
              backgroundColor: COLORS.criticalBg,
              color: COLORS.criticalText,
            }}
          >
            {vm.criticalSignalCount} critical
          </span>
        )}
      </div>

      {/* Two-column layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px',
        }}
      >
        {/* Signals column */}
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '10px',
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: '12px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: COLORS.muted,
              }}
            >
              Top Signals
            </h3>
            <span style={{ fontSize: '11px', color: COLORS.muted }}>
              {vm.totalSignalCount} total
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {vm.topSignals.length === 0 ? (
              <p style={{ margin: 0, fontSize: '12px', color: COLORS.muted }}>
                No signals detected.
              </p>
            ) : (
              vm.topSignals.map((signal) => (
                <SignalCard key={signal.signalId} signal={signal} />
              ))
            )}
          </div>
        </div>

        {/* Patterns column */}
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '10px',
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: '12px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: COLORS.muted,
              }}
            >
              Top Patterns
            </h3>
            <span style={{ fontSize: '11px', color: COLORS.muted }}>
              {vm.totalPatternCount} total
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {vm.topPatterns.length === 0 ? (
              <p style={{ margin: 0, fontSize: '12px', color: COLORS.muted }}>
                No patterns detected.
              </p>
            ) : (
              vm.topPatterns.map((pattern) => (
                <PatternCard key={pattern.patternId} pattern={pattern} />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Caveat footer */}
      <p
        style={{
          margin: '16px 0 0',
          paddingTop: '12px',
          borderTop: `1px solid ${COLORS.border}`,
          fontSize: '11px',
          color: COLORS.muted,
          lineHeight: '1.5',
        }}
      >
        {vm.caveat}
      </p>
    </div>
  );
}
