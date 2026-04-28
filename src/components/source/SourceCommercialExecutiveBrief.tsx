'use client';

import type { CSSProperties } from 'react';
import { SHELL } from '@/lib/shell/shell-tokens';
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
    fontFamily: SHELL.SANS,
  };
  switch (posture) {
    case 'strong':
      return { ...base, background: SHELL.MINT_TEXT, color: SHELL.MINT_BG };
    case 'developing':
      return { ...base, background: SHELL.PEACH_TEXT, color: SHELL.PEACH_BG };
    case 'at-risk':
      return { ...base, background: SHELL.RUST_TEXT, color: SHELL.RUST_BG };
    case 'incomplete':
    default:
      return { ...base, background: SHELL.INK_SOFT, color: SHELL.PAPER };
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
    fontFamily: SHELL.SANS,
  };
  switch (severity) {
    case 'critical':
      return { ...base, background: SHELL.RUST_BG, color: SHELL.RUST_TEXT };
    case 'high':
      return { ...base, background: SHELL.PEACH_BG, color: SHELL.PEACH_TEXT };
    case 'medium':
    default:
      return { ...base, background: SHELL.PEACH_BG, color: SHELL.PEACH_TEXT };
  }
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const OUTER: CSSProperties = {
  background: SHELL.CARD_WHITE,
  border: `1px solid ${SHELL.CARD_LINE}`,
  borderRadius: 8,
  overflow: 'hidden',
  fontFamily: SHELL.SANS,
  color: SHELL.INK,
  maxWidth: 900,
  width: '100%',
};

const HEADER: CSSProperties = {
  background: SHELL.INK_MID,
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
  color: SHELL.BLUE_LINE,
  margin: '0 0 6px',
  fontFamily: SHELL.SANS,
};

const HEADER_H2: CSSProperties = {
  fontSize: 20,
  fontWeight: 700,
  color: SHELL.CARD_WHITE,
  margin: '0 0 4px',
  fontFamily: SHELL.SERIF,
};

const HEADER_SUMMARY: CSSProperties = {
  fontSize: 13,
  color: SHELL.INK_SOFT,
  margin: '10px 0 0',
  lineHeight: 1.6,
  maxWidth: 600,
};

const CLOSE_BTN: CSSProperties = {
  background: 'transparent',
  border: '1px solid rgba(255,255,255,0.25)',
  color: SHELL.INK_SOFT,
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
  background: SHELL.CARD_WHITE,
};

const CARDS_ROW: CSSProperties = {
  display: 'flex',
  gap: 16,
  marginBottom: 20,
  flexWrap: 'wrap' as const,
};

const CARD: CSSProperties = {
  flex: '1 1 240px',
  background: SHELL.PAPER,
  border: `1px solid ${SHELL.CARD_LINE}`,
  borderRadius: 6,
  padding: '16px 18px',
};

const CARD_TITLE: CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: SHELL.INK_MUTED,
  margin: '0 0 12px',
};

const RISK_ROW: CSSProperties = {
  paddingBottom: 10,
  marginBottom: 10,
  borderBottom: `1px solid ${SHELL.CARD_LINE_SOFT}`,
};

const RISK_LABEL: CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: SHELL.INK,
  marginBottom: 4,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

const RISK_MITIGATION: CSSProperties = {
  fontSize: 12,
  color: SHELL.INK_MUTED,
  lineHeight: 1.5,
};

const LEVER_ROW: CSSProperties = {
  paddingBottom: 10,
  marginBottom: 10,
  borderBottom: `1px solid ${SHELL.CARD_LINE_SOFT}`,
};

const LEVER_LABEL: CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: SHELL.INK,
  marginBottom: 3,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 8,
};

const LEVER_IMPACT: CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: SHELL.BLUE_LINE,
  whiteSpace: 'nowrap' as const,
};

const LEVER_DESC: CSSProperties = {
  fontSize: 12,
  color: SHELL.INK_MUTED,
  lineHeight: 1.5,
};

const MISSING_ITEM: CSSProperties = {
  fontSize: 12,
  color: SHELL.INK_MUTED,
  padding: '3px 0',
  paddingLeft: 12,
  position: 'relative' as const,
};

const NEXT_ACTION_BOX: CSSProperties = {
  background: SHELL.BLUE_BG,
  border: `1px solid ${SHELL.BLUE_LINE}`,
  borderRadius: 6,
  padding: '14px 18px',
  marginBottom: 16,
};

const NEXT_ACTION_LABEL: CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: SHELL.INK_MID,
  marginBottom: 6,
};

const NEXT_ACTION_TEXT: CSSProperties = {
  fontSize: 13,
  color: SHELL.INK_MID,
  lineHeight: 1.6,
};

const CAVEAT: CSSProperties = {
  fontSize: 11,
  color: SHELL.INK_MUTED,
  lineHeight: 1.5,
  paddingTop: 8,
  borderTop: `1px solid ${SHELL.CARD_LINE_SOFT}`,
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
              <span style={{ fontSize: 12, color: SHELL.INK_MUTED }}>{brief.postureRationale}</span>
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
            <p style={{ fontSize: 13, color: SHELL.INK, marginBottom: 12, lineHeight: 1.5 }}>
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
