'use client';

import { buildCommercialReadinessViewModel, SourceCommercialReadinessCheck, ReadinessCheckStatus } from '../../lib/source/source-commercial-readiness';

interface SourceCommercialReadinessViewProps {
  rfpId: string;
  vendorList: string[];
  pricingData?: unknown;
  riskData?: unknown;
  bafoData?: unknown;
}

function StatusIcon({ status }: { status: ReadinessCheckStatus }) {
  if (status === 'complete') {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          backgroundColor: '#1E3A5F',
          color: '#FFFFFF',
          fontSize: '12px',
          fontWeight: 600,
          flexShrink: 0,
        }}
        aria-label="Complete"
      >
        ✓
      </span>
    );
  }
  if (status === 'partial') {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          backgroundColor: '#F0F0EC',
          color: '#706D66',
          fontSize: '13px',
          fontWeight: 600,
          border: '1.5px solid #706D66',
          flexShrink: 0,
        }}
        aria-label="Partial"
      >
        ~
      </span>
    );
  }
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        backgroundColor: '#F0F0EC',
        color: '#9CA3AF',
        fontSize: '13px',
        fontWeight: 600,
        border: '1.5px solid #E8E6E3',
        flexShrink: 0,
      }}
      aria-label="Missing"
    >
      ✗
    </span>
  );
}

function OverallBadge({ status }: { status: 'ready' | 'partial' | 'not-ready' }) {
  const config = {
    ready: { label: 'Ready', bg: '#DCFCE7', color: '#166534', border: '#86EFAC' },
    partial: { label: 'Partial', bg: '#FEF9C3', color: '#854D0E', border: '#FDE047' },
    'not-ready': { label: 'Not Ready', bg: '#FEE2E2', color: '#991B1B', border: '#FCA5A5' },
  }[status];

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: '9999px',
        backgroundColor: config.bg,
        color: config.color,
        border: `1px solid ${config.border}`,
        fontSize: '12px',
        fontWeight: 600,
        letterSpacing: '0.01em',
      }}
    >
      {config.label}
    </span>
  );
}

function CheckRow({ check }: { check: SourceCommercialReadinessCheck }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        padding: '12px 0',
        borderBottom: '1px solid #E8E6E3',
      }}
    >
      <StatusIcon status={check.status} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: '14px',
            fontWeight: 500,
            color: '#0F0E0D',
            fontFamily: 'DM Sans, sans-serif',
            marginBottom: '2px',
          }}
        >
          {check.label}
        </div>
        <div
          style={{
            fontSize: '13px',
            color: '#706D66',
            fontFamily: 'DM Sans, sans-serif',
            lineHeight: 1.5,
          }}
        >
          {check.detail}
        </div>
      </div>
      <span
        style={{
          fontSize: '11px',
          color: '#706D66',
          fontFamily: 'DM Sans, sans-serif',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          flexShrink: 0,
          marginTop: '2px',
        }}
      >
        {check.category}
      </span>
    </div>
  );
}

export function SourceCommercialReadinessView({
  rfpId,
  vendorList,
  pricingData,
  riskData,
  bafoData,
}: SourceCommercialReadinessViewProps) {
  const vm = buildCommercialReadinessViewModel(rfpId, vendorList, pricingData, riskData, bafoData);

  return (
    <div
      style={{
        backgroundColor: '#FAFAF9',
        border: '1px solid #E8E6E3',
        borderRadius: '8px',
        padding: '24px',
        fontFamily: 'DM Sans, sans-serif',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <h2
          style={{
            fontSize: '16px',
            fontWeight: 600,
            color: '#0F0E0D',
            fontFamily: 'Georgia, serif',
            margin: 0,
            letterSpacing: '-0.01em',
          }}
        >
          Commercial Readiness
        </h2>
        <OverallBadge status={vm.overallStatus} />
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: '20px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '6px',
          }}
        >
          <span style={{ fontSize: '12px', color: '#706D66' }}>
            {vm.readyCount} of {vm.totalCount} checks complete
          </span>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: '#1E3A5F',
            }}
          >
            {vm.readinessPercent}%
          </span>
        </div>
        <div
          style={{
            height: '6px',
            backgroundColor: '#E8E6E3',
            borderRadius: '3px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${vm.readinessPercent}%`,
              backgroundColor: '#1E3A5F',
              borderRadius: '3px',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      {/* Checklist */}
      <div style={{ marginBottom: '16px' }}>
        {vm.checks.map((check: SourceCommercialReadinessCheck) => (
          <CheckRow key={check.checkId} check={check} />
        ))}
      </div>

      {/* Caveat footer */}
      <div
        style={{
          fontSize: '12px',
          color: '#706D66',
          lineHeight: 1.5,
          borderTop: '1px solid #E8E6E3',
          paddingTop: '12px',
          fontStyle: 'italic',
        }}
      >
        {vm.caveat}
      </div>
    </div>
  );
}
