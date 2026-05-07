'use client';

import type { CSSProperties } from 'react';
import { SHELL } from '@/lib/shell/shell-tokens';
import { SOURCE_STAGE_LABELS } from '@/lib/source/constants';
import type { SourceStageKey, SourcingEventDetail } from '@/lib/source/types';
import type { GateEvaluation } from '@/lib/reasoning/types';
import { StageGateBlock } from './StageGateBlock';

interface BAFOCanvasProps {
  stageKey: SourceStageKey;
  event: SourcingEventDetail;
  nextGateEvaluations?: GateEvaluation[];
}

const BAFO_VENDORS = [
  {
    id: 'northstar',
    name: 'Northstar Managed Services',
    band: 'medium',
    initialBidAnnual: 3.8,
    bafoTarget: 'Unbundle tier-2 support pricing. Commit to SLA scope freeze in §4.2. Reduce annual run by ≥8%.',
    bafoStatus: 'pending',
    deadline: 'May 15, 2026',
    responseReceived: false,
    riskFlags: [
      { severity: 'high' as const, label: 'Tier-2 support bundled — no itemised breakdown' },
      { severity: 'medium' as const, label: 'SLA scope indicators in §4.2 exceed reference scope' },
    ],
    differentiators: [
      'Strong retail AMS track record — 12 enterprise clients',
      'Named run-team staffing model',
      'Pre-negotiated SLA framework aligned to Apex Retail',
    ],
  },
  {
    id: 'arcvault',
    name: 'ArcVault Managed',
    band: 'medium',
    initialBidAnnual: 3.62,
    bafoTarget: 'Define governance framework and escalation paths. Confirm CDP Q3 nearshore capacity. Improve pricing on Year 2–3 escalation.',
    bafoStatus: 'pending',
    deadline: 'May 15, 2026',
    responseReceived: false,
    riskFlags: [
      { severity: 'high' as const, label: 'Governance framework incomplete — escalation paths undefined' },
    ],
    differentiators: [
      'Hybrid onshore/nearshore — CDP Q3 workstream capacity available',
      'Application rationalization advisory in base scope',
      '2 named CDP/SAP integration references',
    ],
  },
];

function severityColor(sev: 'high' | 'medium' | 'low' | 'critical'): string {
  if (sev === 'critical' || sev === 'high') return SHELL.PEACH_TEXT;
  if (sev === 'medium') return SHELL.AMBER_DOT;
  return SHELL.INK_MUTED;
}

export function BAFOCanvas({ stageKey, event, nextGateEvaluations = [] }: BAFOCanvasProps) {
  const stageLabel = SOURCE_STAGE_LABELS[stageKey] ?? stageKey;
  const isCurrentStage = event.currentStageKey === stageKey;
  const responsesReceived = BAFO_VENDORS.filter((v) => v.responseReceived).length;

  return (
    <section aria-label="BAFO stage canvas" style={STAGE_PANEL}>
      {/* Context strip */}
      <div style={CONTEXT_STRIP}>
        <span style={STRIP_TOKEN}>{event.name.length > 26 ? event.name.slice(0, 24) + '…' : event.name}</span>
        <span style={STRIP_DOT}>·</span>
        <span style={STRIP_TOKEN}>Step 7 of 11</span>
        <span style={STRIP_DOT}>·</span>
        <span style={STRIP_TOKEN}>{BAFO_VENDORS.length} invited · {responsesReceived} responded</span>
        {isCurrentStage && <><span style={STRIP_DOT}>·</span><span style={{ ...STRIP_TOKEN, color: SHELL.MINT_TEXT }}>Active</span></>}
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div>
          <div style={EYEBROW}>Step 7 · Nexus</div>
          <h2 style={HEADING}>{stageLabel}</h2>
        </div>
        {isCurrentStage && <span style={ACTIVE_BADGE}>Active</span>}
      </div>

      {/* Status banner */}
      <div style={STATUS_BANNER}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <div style={BANNER_LABEL}>BAFO round</div>
            <div style={BANNER_VALUE}>Round 1 of 1</div>
          </div>
          <div>
            <div style={BANNER_LABEL}>Deadline</div>
            <div style={BANNER_VALUE}>May 15, 2026</div>
          </div>
          <div>
            <div style={BANNER_LABEL}>Responses</div>
            <div style={{ ...BANNER_VALUE, color: responsesReceived === BAFO_VENDORS.length ? SHELL.MINT_TEXT : SHELL.AMBER_DOT }}>
              {responsesReceived} / {BAFO_VENDORS.length} received
            </div>
          </div>
          <div>
            <div style={BANNER_LABEL}>Vendors invited</div>
            <div style={BANNER_VALUE}>{BAFO_VENDORS.length} finalists</div>
          </div>
        </div>
        {responsesReceived < BAFO_VENDORS.length && (
          <div style={{ marginTop: 8, fontFamily: SHELL.SANS, fontSize: 11.5, color: SHELL.INK_SOFT }}>
            Waiting on {BAFO_VENDORS.length - responsesReceived} BAFO response{BAFO_VENDORS.length - responsesReceived > 1 ? 's' : ''}. Deadline: May 15, 2026. Sentinel will flag overdue submissions.
          </div>
        )}
      </div>

      {/* Vendor BAFO cards */}
      <div style={{ display: 'grid', gap: 10 }}>
        <div style={{ fontFamily: SHELL.MONO, fontSize: 8.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: SHELL.INK_MUTED, fontWeight: 700 }}>
          Finalist vendor briefs
        </div>
        {BAFO_VENDORS.map((vendor) => (
          <div key={vendor.id} style={VENDOR_CARD}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
              <div>
                <div style={VENDOR_NAME}>{vendor.name}</div>
                <div style={{ display: 'flex', gap: 5, marginTop: 3 }}>
                  <span style={BAND_CHIP}>{vendor.band} band</span>
                  <span style={{ ...STATUS_CHIP, background: vendor.responseReceived ? SHELL.MINT_BG : SHELL.PEACH_BG, borderColor: vendor.responseReceived ? SHELL.MINT_LINE : SHELL.PEACH_LINE, color: vendor.responseReceived ? SHELL.MINT_TEXT : SHELL.PEACH_TEXT }}>
                    {vendor.responseReceived ? 'Response received' : 'Awaiting BAFO response'}
                  </span>
                </div>
              </div>
              <div style={INITIAL_BID_CELL}>
                <div style={{ fontFamily: SHELL.MONO, fontSize: 7.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: SHELL.INK_MUTED, fontWeight: 700 }}>Initial bid / yr</div>
                <div style={{ fontFamily: SHELL.SANS, fontSize: 14, fontWeight: 900, color: SHELL.INK }}>
                  ${vendor.initialBidAnnual.toFixed(2)}M
                </div>
              </div>
            </div>

            {/* BAFO ask */}
            <div style={BAFO_TARGET_BLOCK}>
              <div style={{ fontFamily: SHELL.MONO, fontSize: 8, letterSpacing: '0.09em', textTransform: 'uppercase', color: SHELL.INK_MUTED, fontWeight: 700, marginBottom: 4 }}>
                BAFO negotiation targets
              </div>
              <p style={{ margin: 0, fontFamily: SHELL.SANS, fontSize: 11.5, lineHeight: 1.42, color: SHELL.INK_SOFT }}>
                {vendor.bafoTarget}
              </p>
            </div>

            {/* Two-column: risk flags + differentiators */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <div style={{ fontFamily: SHELL.MONO, fontSize: 7.5, letterSpacing: '0.09em', textTransform: 'uppercase', color: SHELL.PEACH_TEXT, fontWeight: 700, marginBottom: 4 }}>
                  Risk flags
                </div>
                <div style={{ display: 'grid', gap: 4 }}>
                  {vendor.riskFlags.map((flag, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 5 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: severityColor(flag.severity), flexShrink: 0, marginTop: 3, display: 'inline-block' }} />
                      <span style={{ fontFamily: SHELL.SANS, fontSize: 10.5, lineHeight: 1.34, color: SHELL.INK_SOFT }}>{flag.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontFamily: SHELL.MONO, fontSize: 7.5, letterSpacing: '0.09em', textTransform: 'uppercase', color: SHELL.MINT_TEXT, fontWeight: 700, marginBottom: 4 }}>
                  Differentiators
                </div>
                <div style={{ display: 'grid', gap: 4 }}>
                  {vendor.differentiators.map((d, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 5 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: SHELL.MINT_TEXT, flexShrink: 0, marginTop: 3, display: 'inline-block' }} />
                      <span style={{ fontFamily: SHELL.SANS, fontSize: 10.5, lineHeight: 1.34, color: SHELL.INK_SOFT }}>{d}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

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

const STATUS_BANNER: CSSProperties = {
  border: `1px solid ${SHELL.CARD_LINE}`, borderRadius: 12,
  background: SHELL.CARD_WHITE, padding: '10px 12px',
};

const BANNER_LABEL: CSSProperties = {
  fontFamily: SHELL.MONO, fontSize: 8, letterSpacing: '0.1em',
  textTransform: 'uppercase', color: SHELL.INK_MUTED, fontWeight: 700,
};

const BANNER_VALUE: CSSProperties = {
  marginTop: 2, fontFamily: SHELL.SANS, fontSize: 12.5,
  fontWeight: 700, color: SHELL.INK,
};

const VENDOR_CARD: CSSProperties = {
  border: `1px solid ${SHELL.CARD_LINE}`, borderRadius: 12,
  background: SHELL.CARD_WHITE, padding: '11px 12px', display: 'grid', gap: 9,
};

const VENDOR_NAME: CSSProperties = {
  fontFamily: SHELL.SANS, fontSize: 13, fontWeight: 800, color: SHELL.INK,
};

const BAND_CHIP: CSSProperties = {
  display: 'inline-flex', alignItems: 'center',
  border: `1px solid ${SHELL.CARD_LINE}`, borderRadius: 4,
  background: SHELL.PAPER_SOFT, padding: '1px 5px',
  fontFamily: SHELL.MONO, fontSize: 7.5, letterSpacing: '0.08em',
  textTransform: 'uppercase', color: SHELL.INK_MUTED, fontWeight: 700,
};

const STATUS_CHIP: CSSProperties = {
  display: 'inline-flex', alignItems: 'center',
  border: '1px solid', borderRadius: 4, padding: '1px 6px',
  fontFamily: SHELL.MONO, fontSize: 7.5, letterSpacing: '0.08em',
  textTransform: 'uppercase', fontWeight: 700,
};

const INITIAL_BID_CELL: CSSProperties = {
  border: `1px solid ${SHELL.CARD_LINE}`, borderRadius: 10,
  background: SHELL.PAPER_SOFT, padding: '6px 9px',
  textAlign: 'right', flexShrink: 0,
};

const BAFO_TARGET_BLOCK: CSSProperties = {
  border: `1px solid ${SHELL.BLUE_LINE}`, borderRadius: 8,
  background: SHELL.BLUE_BG, padding: '7px 9px',
};

const DIVIDER: CSSProperties = {
  height: 1, background: SHELL.CARD_LINE,
};
