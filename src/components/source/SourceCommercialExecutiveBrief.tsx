'use client';

import type { CSSProperties } from 'react';
import {
  buildCommercialExecutiveBrief,
  type CommercialPosture,
  type ExecutiveBriefRisk,
  type ExecutiveBriefLever,
} from '@/lib/source/source-commercial-executive-brief';

export interface SourceCommercialExecutiveBriefProps {
  rfpId: string;
  vendorList: string[];
  onClose?: () => void;
}

// ─── Posture helpers ─────────────────────────────────────────────────────────

function postureLabel(posture: CommercialPosture): string {
  switch (posture) {
    case 'strong':
      return 'Strong';
    case 'developing':
      return 'Developing';
    case 'at-risk':
      return 'At Risk';
    case 'incomplete':
      return 'Incomplete';
    default:
      return posture;
  }
}

function postureBadgeStyle(posture: CommercialPosture): CSSProperties {
  const base: CSSProperties = {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: 4,
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: '0.02em',
    fontFamily: '"DM Sans", -apple-system, sans-serif',
  };
  switch (posture) {
    case 'strong':
      return { ...base, background: '#166534', color: '#DCFCE7' };
    case 'developing':
      return { ...base, background: '#92400E', color: '#FEF3C7' };
    case 'at-risk':
      return { ...base, background: '#991B1B', color: '#FEE2E2' };
    case 'incomplete':
    default:
      return { ...base, background: '#374151', color: '#F3F4F6' };
  }
}

// ─── Severity chip ────────────────────────────────────────────────────────────

function severityChipStyle(severity: ExecutiveBriefRisk['severity']): CSSProperties {
  const base: CSSProperties = {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 3,
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    fontFamily: '"DM Sans", -apple-system, sans-serif',
  };
  switch (severity) {
    case 'critical':
      return { ...base, background: '#FEE2E2', color: '#7F1D1D' };
    case 'high':
      return { ...base, background: '#FFEDD5', color: '#7C2D12' };
    case 'medium':
    default:
      return { ...base, background: '#FEF9C3', color: '#713F12' };
  }
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const OUTER: CSSProperties = {
  background: '#FFFFFF',
  border: '1px solid #E5E7EB',
  borderRadius: 8,
  overflow: 'hidden',
  fontFamily: '"DM Sans", -apple-system, sans-serif',
  color: '#171412',
  maxWidth: 900,
  width: '100%',
};

const HEADER: CSSProperties = {
  background: '#1E3A5F',
  padding: '24px 28px 20px',
  position: 'relative',
};

const HEADER_TOP: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  marginBottom: 12,
};

const HEADER_TITLE: CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: '#93C5FD',
  margin: '0 0 6px',
  fontFamily: '"DM Sans", -apple-system, sans-serif',
};

const HEADER_H2: CSSProperties = {
  fontSize: 20,
  fontWeight: 700,
  color: '#FFFFFF',
  margin: '0 0 4px',
  fontFamily: 'Georgia, serif',
};

const HEADER_SUMMARY: CSSProperties = {
  fontSize: 13,
  color: '#CBD5E1',
  margin: '10px 0 0',
  lineHeight: 1.6,
  maxWidth: 600,
};

const CLOSE_BTN: CSSProperties = {
  background: 'transparent',
  border: '1px solid rgba(255,255,255,0.25)',
  color: '#CBD5E1',
  borderRadius: 4,
  width: 28,
  height: 28,
  cursor: 'pointer',
  fontSize: 14,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

const BODY: CSSProperties = {
  padding: '24px 28px',
  background: '#FFFFFF',
};

const CARDS_ROW: CSSProperties = {
  display: 'flex',
  gap: 16,
  marginBottom: 20,
  flexWrap: 'wrap' as const,
};

const CARD: CSSProperties = {
  flex: '1 1 240px',
  background: '#FAFAF9',
  border: '1px solid #E5E7EB',
  borderRadius: 6,
  padding: '16px 18px',
};

const CARD_TITLE: CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: '#6B7280',
  margin: '0 0 12px',
};

const RISK_ROW: CSSProperties = {
  paddingBottom: 10,
  marginBottom: 10,
  borderBottom: '1px solid #F3F4F6',
};

const RISK_LABEL: CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: '#171412',
  marginBottom: 4,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

const RISK_MITIGATION: CSSProperties = {
  fontSize: 12,
  color: '#6B7280',
  lineHeight: 1.5,
};

const LEVER_ROW: CSSProperties = {
  paddingBottom: 10,
  marginBottom: 10,
  borderBottom: '1px solid #F3F4F6',
};

const LEVER_LABEL: CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: '#171412',
  marginBottom: 3,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 8,
};

const LEVER_IMPACT: CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: '#2E6FD8',
  whiteSpace: 'nowrap' as const,
};

const LEVER_DESC: CSSProperties = {
  fontSize: 12,
  color: '#6B7280',
  lineHeight: 1.5,
};

const MISSING_ITEM: CSSProperties = {
  fontSize: 12,
  color: '#6B7280',
  padding: '3px 0',
  paddingLeft: 12,
  position: 'relative' as const,
};

const NEXT_ACTION_BOX: CSSProperties = {
  background: '#DBEAFE',
  border: '1px solid #BFDBFE',
  borderRadius: 6,
  padding: '14px 18px',
  marginBottom: 16,
};

const NEXT_ACTION_LABEL: CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: '#1E40AF',
  marginBottom: 6,
};

const NEXT_ACTION_TEXT: CSSProperties = {
  fontSize: 13,
  color: '#1E3A5F',
  lineHeight: 1.6,
};

const CAVEAT: CSSProperties = {
  fontSize: 11,
  color: '#9CA3AF',
  lineHeight: 1.5,
  paddingTop: 8,
  borderTop: '1px solid #F3F4F6',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function RiskRow({ risk, isLast }: { risk: ExecutiveBriefRisk; isLast: boolean }) {
  return (
    <div style={isLast ? { ...RISK_ROW, borderBottom: 'none', marginBottom: 0, paddingBottom: 0 } : RISK_ROW}>
      <div style={RISK_LABEL}>
        <span>{risk.label}</span>
        <span style={severityChipStyle(risk.severity)}>{risk.severity}</span>
      </div>
      <div style={RISK_MITIGATION}>{risk.mitigation}</div>
    </div>
  );
}

function LeverRow({ lever, isLast }: { lever: ExecutiveBriefLever; isLast: boolean }) {
  return (
    <div style={isLast ? { ...LEVER_ROW, borderBottom: 'none', marginBottom: 0, paddingBottom: 0 } : LEVER_ROW}>
      <div style={LEVER_LABEL}>
        <span>{lever.label}</span>
        <span style={LEVER_IMPACT}>{lever.estimatedImpact}</span>
      </div>
      <div style={LEVER_DESC}>{lever.opportunityDescription}</div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SourceCommercialExecutiveBrief({
  rfpId,
  vendorList,
  onClose,
}: SourceCommercialExecutiveBriefProps) {
  const brief = buildCommercialExecutiveBrief(rfpId, vendorList);

  return (
    <div style={OUTER} role="region" aria-label="Commercial Executive Brief">
      {/* Dark-navy header */}
      <div style={HEADER}>
        <div style={HEADER_TOP}>
          <div>
            <p style={HEADER_TITLE}>Atlas · Executive Brief</p>
            <h2 style={HEADER_H2}>Commercial Executive Brief</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
              <span style={postureBadgeStyle(brief.commercialPosture)}>
                {postureLabel(brief.commercialPosture)}
              </span>
              <span style={{ fontSize: 12, color: '#94A3B8' }}>{brief.postureRationale}</span>
            </div>
          </div>
          {onClose != null && (
            <button style={CLOSE_BTN} onClick={onClose} aria-label="Close executive brief">
              ✕
            </button>
          )}
        </div>
        <p style={HEADER_SUMMARY}>{brief.executiveSummary}</p>
      </div>

      {/* White body */}
      <div style={BODY}>
        {/* Three-card row */}
        <div style={CARDS_ROW}>
          {/* Top Risks */}
          <div style={CARD}>
            <p style={CARD_TITLE}>Top Risks</p>
            {brief.topRisks.map((risk, i) => (
              <RiskRow key={risk.riskId} risk={risk} isLast={i === brief.topRisks.length - 1} />
            ))}
          </div>

          {/* BAFO Levers */}
          <div style={CARD}>
            <p style={CARD_TITLE}>BAFO Levers</p>
            {brief.topBafoLevers.map((lever, i) => (
              <LeverRow
                key={lever.leverId}
                lever={lever}
                isLast={i === brief.topBafoLevers.length - 1}
              />
            ))}
          </div>

          {/* Vendor Comparability */}
          <div style={CARD}>
            <p style={CARD_TITLE}>Vendor Comparability</p>
            <p style={{ fontSize: 13, color: '#171412', marginBottom: 12, lineHeight: 1.5 }}>
              {brief.vendorComparabilityState}
            </p>
            {brief.missingInputs.length > 0 && (
              <>
                <p style={{ ...CARD_TITLE, marginTop: 4 }}>Missing Inputs</p>
                {brief.missingInputs.map((item) => (
                  <div key={item} style={MISSING_ITEM}>
                    · {item}
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Recommended next action */}
        <div style={NEXT_ACTION_BOX}>
          <p style={NEXT_ACTION_LABEL}>Recommended Next Action</p>
          <p style={NEXT_ACTION_TEXT}>{brief.recommendedNextAction}</p>
        </div>

        {/* Atlas caveat */}
        <p style={CAVEAT}>{brief.atlasCaveat}</p>
      </div>
    </div>
  );
}
