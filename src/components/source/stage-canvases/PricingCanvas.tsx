'use client';

import type { CSSProperties } from 'react';
import { SHELL } from '@/lib/shell/shell-tokens';
import { SOURCE_STAGE_LABELS } from '@/lib/source/constants';
import type { SourceStageKey, SourcingEventDetail } from '@/lib/source/types';
import type { GateEvaluation } from '@/lib/reasoning/types';
import { StageGateBlock } from './StageGateBlock';

interface PricingCanvasProps {
  stageKey: SourceStageKey;
  event: SourcingEventDetail;
  nextGateEvaluations?: GateEvaluation[];
}

// AMS pricing data — normalised to common structure for comparison
const AMS_PRICING = [
  {
    id: 'northstar',
    vendor: 'Northstar Managed Services',
    band: 'medium',
    status: 'bafo',
    annualRunCost: 3.8,
    transitionCost: 0.82,
    setupCost: 0.38,
    rateEscalation: 3.0,
    flags: ['Tier-2 support bundled in platform fee — no line-item breakdown', 'SLA scope in §4.2 broader than reference'],
    recommendation: null,
  },
  {
    id: 'arcvault',
    vendor: 'ArcVault Managed',
    band: 'medium',
    status: 'bafo',
    annualRunCost: 3.62,
    transitionCost: 0.74,
    setupCost: 0.32,
    rateEscalation: 2.5,
    flags: ['Governance framework absent from base scope — priced separately'],
    recommendation: 'Preferred — CDP Q3 alignment; application rationalization advisory included',
  },
  {
    id: 'bluemaster',
    vendor: 'BlueMaster Operations',
    band: 'low',
    status: 'declined',
    annualRunCost: 2.64,
    transitionCost: 0.58,
    setupCost: 0.22,
    rateEscalation: 2.0,
    flags: ['Below-market but transition plan quality gap disqualified this vendor'],
    recommendation: null,
  },
  {
    id: 'datapeak',
    vendor: 'DataPeak Services',
    band: 'high',
    status: 'declined',
    annualRunCost: 5.18,
    transitionCost: 1.24,
    setupCost: 0.52,
    rateEscalation: 4.0,
    flags: ['Analytics-first scope premium — 16-week onboarding conflicts CDP Q3'],
    recommendation: null,
  },
];

function tco3yr(row: typeof AMS_PRICING[0]): number {
  const year1 = row.annualRunCost + row.transitionCost + row.setupCost;
  const year2 = row.annualRunCost * (1 + row.rateEscalation / 100);
  const year3 = year2 * (1 + row.rateEscalation / 100);
  return year1 + year2 + year3;
}

function fmt(n: number): string {
  return `$${n.toFixed(2)}M`;
}

function bandColor(band: string): string {
  if (band === 'low') return SHELL.MINT_TEXT;
  if (band === 'medium') return SHELL.INK_SOFT;
  return SHELL.PEACH_TEXT;
}

export function PricingCanvas({ stageKey, event, nextGateEvaluations = [] }: PricingCanvasProps) {
  const stageLabel = SOURCE_STAGE_LABELS[stageKey] ?? stageKey;
  const isCurrentStage = event.currentStageKey === stageKey;
  const bafoVendors = AMS_PRICING.filter((v) => v.status === 'bafo');
  const declinedVendors = AMS_PRICING.filter((v) => v.status === 'declined');
  const lowestTco = Math.min(...AMS_PRICING.filter((v) => v.status === 'bafo').map(tco3yr));

  return (
    <section aria-label="Pricing stage canvas" style={STAGE_PANEL}>
      {/* Context strip */}
      <div style={CONTEXT_STRIP}>
        <span style={STRIP_TOKEN}>{event.name.length > 26 ? event.name.slice(0, 24) + '…' : event.name}</span>
        <span style={STRIP_DOT}>·</span>
        <span style={STRIP_TOKEN}>Step 6 of 11</span>
        <span style={STRIP_DOT}>·</span>
        <span style={STRIP_TOKEN}>{bafoVendors.length} finalists · {declinedVendors.length} declined</span>
        {isCurrentStage && <><span style={STRIP_DOT}>·</span><span style={{ ...STRIP_TOKEN, color: SHELL.MINT_TEXT }}>Active</span></>}
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div>
          <div style={EYEBROW}>Step 6 · Nexus</div>
          <h2 style={HEADING}>{stageLabel}</h2>
        </div>
        {isCurrentStage && <span style={ACTIVE_BADGE}>Active</span>}
      </div>

      {/* Summary KVs */}
      <div style={KV_GRID}>
        <div style={KV_CELL}>
          <div style={KV_LABEL}>Vendors compared</div>
          <div style={KV_VALUE}>{AMS_PRICING.length} total · {bafoVendors.length} finalist</div>
        </div>
        <div style={KV_CELL}>
          <div style={KV_LABEL}>Lowest finalist TCO</div>
          <div style={{ ...KV_VALUE, color: SHELL.MINT_TEXT }}>{fmt(lowestTco)}</div>
        </div>
        <div style={KV_CELL}>
          <div style={KV_LABEL}>Term modelled</div>
          <div style={KV_VALUE}>3 years</div>
        </div>
      </div>

      {/* Pricing table */}
      <div style={TABLE_WRAPPER} role="region" aria-label="Vendor pricing comparison table">
        <div style={{ marginBottom: 6, fontFamily: SHELL.MONO, fontSize: 8.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: SHELL.INK_MUTED, fontWeight: 700 }}>
          Normalized pricing comparison · all figures $M · 3-year term
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={TABLE} aria-label="Pricing comparison">
            <thead>
              <tr>
                <th style={{ ...TH, textAlign: 'left', width: 160 }}>Vendor</th>
                <th style={{ ...TH, textAlign: 'right' }}>Annual run</th>
                <th style={{ ...TH, textAlign: 'right' }}>Transition</th>
                <th style={{ ...TH, textAlign: 'right' }}>Setup</th>
                <th style={{ ...TH, textAlign: 'right' }}>Escalation</th>
                <th style={{ ...TH, textAlign: 'right', borderLeft: `1px solid ${SHELL.CARD_LINE}` }}>3yr TCO</th>
              </tr>
            </thead>
            <tbody>
              {AMS_PRICING.map((vendor, rowIndex) => {
                const isDeclined = vendor.status === 'declined';
                const tco = tco3yr(vendor);
                const isLowest = tco === lowestTco && !isDeclined;
                return (
                  <tr key={vendor.id} style={{ background: rowIndex % 2 === 0 ? 'transparent' : 'rgba(12,26,58,0.018)', opacity: isDeclined ? 0.5 : 1 }}>
                    <td style={TD_LABEL}>
                      <div style={{ fontWeight: 700, color: SHELL.INK }}>{vendor.vendor}</div>
                      <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
                        <span style={{ ...BAND_CHIP, color: bandColor(vendor.band), borderColor: bandColor(vendor.band) + '44' }}>
                          {vendor.band}
                        </span>
                        {vendor.status === 'bafo' && <span style={BAFO_CHIP}>BAFO</span>}
                        {isDeclined && <span style={DECLINED_CHIP}>declined</span>}
                      </div>
                    </td>
                    <td style={TD_RIGHT}>{fmt(vendor.annualRunCost)}</td>
                    <td style={TD_RIGHT}>{fmt(vendor.transitionCost)}</td>
                    <td style={TD_RIGHT}>{fmt(vendor.setupCost)}</td>
                    <td style={{ ...TD_RIGHT, color: vendor.rateEscalation >= 3.5 ? SHELL.PEACH_TEXT : SHELL.INK_SOFT }}>
                      {vendor.rateEscalation}%
                    </td>
                    <td style={{
                      ...TD_RIGHT,
                      borderLeft: `1px solid ${SHELL.CARD_LINE}`,
                      fontWeight: 900,
                      color: isLowest ? SHELL.MINT_TEXT : SHELL.INK,
                    }}>
                      {fmt(tco)}
                      {isLowest && <span style={{ display: 'block', fontFamily: SHELL.MONO, fontSize: 7.5, color: SHELL.MINT_TEXT, fontWeight: 700 }}>lowest</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 6, fontFamily: SHELL.MONO, fontSize: 8, letterSpacing: '0.06em', color: SHELL.INK_MUTED }}>
          3yr TCO = Year 1 (run + transition + setup) + Year 2 (run × escalation) + Year 3 (run × escalation²). Illustrative — pending vendor confirmation.
        </div>
      </div>

      {/* Commercial flags */}
      <div style={FLAGS_SECTION}>
        <div style={{ fontFamily: SHELL.MONO, fontSize: 8.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: SHELL.INK_MUTED, fontWeight: 700, marginBottom: 7 }}>
          Pricing anomalies &amp; commercial flags
        </div>
        <div style={{ display: 'grid', gap: 6 }}>
          {AMS_PRICING.filter((v) => v.flags.length > 0).map((vendor) => (
            vendor.flags.map((flag, i) => (
              <div key={`${vendor.id}-${i}`} style={FLAG_ROW}>
                <span style={{ ...FLAG_VENDOR, opacity: vendor.status === 'declined' ? 0.5 : 1 }}>{vendor.vendor.split(' ')[0]}</span>
                <span style={FLAG_TEXT}>{flag}</span>
              </div>
            ))
          ))}
        </div>
      </div>

      {/* Preferred vendor note */}
      {AMS_PRICING.filter((v) => v.recommendation).map((v) => (
        <div key={v.id} style={PREFERRED_CARD}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 5 }}>
            <span style={PREFERRED_BADGE}>Preferred</span>
            <span style={{ fontFamily: SHELL.SANS, fontSize: 12.5, color: SHELL.INK, fontWeight: 700 }}>{v.vendor}</span>
          </div>
          <p style={{ margin: 0, fontFamily: SHELL.SANS, fontSize: 11.5, lineHeight: 1.42, color: SHELL.INK_SOFT }}>
            {v.recommendation}
          </p>
        </div>
      ))}

      <div style={DIVIDER} />
      <StageGateBlock stageKey={stageKey} event={event} nextGateEvaluations={nextGateEvaluations} />
    </section>
  );
}

const STAGE_PANEL: CSSProperties = {
  border: `1px solid ${SHELL.BLUE_LINE}`,
  borderRadius: 16,
  background: `linear-gradient(145deg, ${SHELL.CARD_WHITE} 0%, ${SHELL.BLUE_BG} 100%)`,
  padding: '13px 14px',
  display: 'grid',
  gap: 12,
  boxShadow: '0 14px 32px rgba(12, 26, 58, 0.06)',
};

const CONTEXT_STRIP: CSSProperties = {
  display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 5,
  paddingBottom: 10, borderBottom: `1px solid ${SHELL.CARD_LINE}`,
};

const STRIP_TOKEN: CSSProperties = {
  fontFamily: SHELL.MONO, fontSize: 8.5, letterSpacing: '0.1em',
  textTransform: 'uppercase', color: SHELL.INK_SOFT, fontWeight: 600,
};

const STRIP_DOT: CSSProperties = {
  fontFamily: SHELL.MONO, fontSize: 10, color: SHELL.INK_MUTED, lineHeight: 1,
};

const EYEBROW: CSSProperties = {
  fontFamily: SHELL.MONO, fontSize: 8.5, letterSpacing: '0.14em',
  textTransform: 'uppercase', color: SHELL.INK_MUTED, fontWeight: 700,
};

const HEADING: CSSProperties = {
  margin: '2px 0 0', fontFamily: SHELL.SERIF, fontSize: 22,
  lineHeight: 1.1, color: SHELL.INK, letterSpacing: '-0.02em',
};

const ACTIVE_BADGE: CSSProperties = {
  display: 'inline-flex', alignItems: 'center',
  border: `1px solid ${SHELL.MINT_LINE}`, borderRadius: 999,
  background: SHELL.MINT_BG, padding: '3px 9px',
  fontFamily: SHELL.MONO, fontSize: 8, letterSpacing: '0.1em',
  textTransform: 'uppercase', color: SHELL.MINT_TEXT, fontWeight: 700, whiteSpace: 'nowrap',
};

const KV_GRID: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 120px), 1fr))',
  gap: 8,
};

const KV_CELL: CSSProperties = {
  border: `1px solid ${SHELL.CARD_LINE}`, borderRadius: 10,
  background: 'rgba(253,251,246,0.82)', padding: '7px 9px',
};

const KV_LABEL: CSSProperties = {
  fontFamily: SHELL.MONO, fontSize: 8, letterSpacing: '0.1em',
  textTransform: 'uppercase', color: SHELL.INK_MUTED, fontWeight: 700,
};

const KV_VALUE: CSSProperties = {
  marginTop: 3, fontFamily: SHELL.SANS, fontSize: 12.5,
  lineHeight: 1.25, color: SHELL.INK, fontWeight: 700,
};

const TABLE_WRAPPER: CSSProperties = {
  border: `1px solid ${SHELL.CARD_LINE}`, borderRadius: 12,
  background: SHELL.CARD_WHITE, padding: '10px 12px',
};

const TABLE: CSSProperties = {
  width: '100%', borderCollapse: 'collapse',
};

const TH: CSSProperties = {
  fontFamily: SHELL.MONO, fontSize: 8, letterSpacing: '0.1em',
  textTransform: 'uppercase', color: SHELL.INK_MUTED, fontWeight: 700,
  padding: '5px 8px', borderBottom: `1px solid ${SHELL.CARD_LINE}`,
};

const TD_LABEL: CSSProperties = {
  fontFamily: SHELL.SANS, fontSize: 11.5, color: SHELL.INK_SOFT,
  padding: '7px 8px', lineHeight: 1.3,
};

const TD_RIGHT: CSSProperties = {
  textAlign: 'right', padding: '7px 8px',
  fontFamily: SHELL.SANS, fontSize: 12, color: SHELL.INK, fontWeight: 600,
};

const BAND_CHIP: CSSProperties = {
  display: 'inline-flex', alignItems: 'center',
  border: '1px solid', borderRadius: 4, padding: '1px 5px',
  fontFamily: SHELL.MONO, fontSize: 7.5, letterSpacing: '0.08em',
  textTransform: 'uppercase', fontWeight: 700,
};

const BAFO_CHIP: CSSProperties = {
  display: 'inline-flex', alignItems: 'center',
  border: `1px solid ${SHELL.BLUE_LINE}`, borderRadius: 4,
  background: SHELL.BLUE_BG, padding: '1px 5px',
  fontFamily: SHELL.MONO, fontSize: 7.5, letterSpacing: '0.08em',
  textTransform: 'uppercase', color: SHELL.INK_SOFT, fontWeight: 700,
};

const DECLINED_CHIP: CSSProperties = {
  display: 'inline-flex', alignItems: 'center',
  border: `1px solid ${SHELL.GRAY_LINE}`, borderRadius: 4,
  background: SHELL.GRAY_BG, padding: '1px 5px',
  fontFamily: SHELL.MONO, fontSize: 7.5, letterSpacing: '0.08em',
  textTransform: 'uppercase', color: SHELL.GRAY_TEXT, fontWeight: 700,
};

const FLAGS_SECTION: CSSProperties = {
  border: `1px solid ${SHELL.PEACH_LINE}`, borderRadius: 10,
  background: SHELL.PEACH_BG, padding: '9px 11px',
};

const FLAG_ROW: CSSProperties = {
  display: 'flex', alignItems: 'flex-start', gap: 7,
};

const FLAG_VENDOR: CSSProperties = {
  flexShrink: 0, fontFamily: SHELL.MONO, fontSize: 8.5,
  letterSpacing: '0.08em', textTransform: 'uppercase',
  color: SHELL.PEACH_TEXT, fontWeight: 700, paddingTop: 1,
};

const FLAG_TEXT: CSSProperties = {
  fontFamily: SHELL.SANS, fontSize: 11.5, lineHeight: 1.38, color: SHELL.INK_SOFT,
};

const PREFERRED_CARD: CSSProperties = {
  border: `1px solid ${SHELL.MINT_LINE}`, borderRadius: 10,
  background: SHELL.MINT_BG, padding: '9px 11px',
};

const PREFERRED_BADGE: CSSProperties = {
  display: 'inline-flex', alignItems: 'center',
  border: `1px solid ${SHELL.MINT_LINE}`, borderRadius: 999,
  background: SHELL.CARD_WHITE, padding: '2px 8px',
  fontFamily: SHELL.MONO, fontSize: 8, letterSpacing: '0.1em',
  textTransform: 'uppercase', color: SHELL.MINT_TEXT, fontWeight: 700,
};

const DIVIDER: CSSProperties = {
  height: 1, background: SHELL.CARD_LINE,
};
